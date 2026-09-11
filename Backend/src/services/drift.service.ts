import {
  ParsedComponent,
  ParamName,
  PARAM_ORDER,
  DriftResult,
  DriftTrend,
} from "../types/screening.types.js";

const PRIMARY_DRIFT_PARAM: ParamName = "Leakage";

// Stage spacing in hours, matching INPUT_STAGES = ["0h","24h","48h","96h"]
const STAGE_HOURS = [0, 24, 48, 96];

interface SingleParamDrift {
  deltas: { delta_0_24: number; delta_24_48: number; delta_48_96: number };
  slopes: { slope_0_24: number; slope_24_48: number; slope_48_96: number };
  percentage_change: number;
  drift_acceleration: number;
  trend: DriftTrend;
}


function computeSingleParamDrift(values: number[]): SingleParamDrift {
  const [v0, v24, v48, v96] = values;

  const delta_0_24 = v24 - v0;
  const delta_24_48 = v48 - v24;
  const delta_48_96 = v96 - v48;

  const slope_0_24 = delta_0_24 / (STAGE_HOURS[1] - STAGE_HOURS[0]);
  const slope_24_48 = delta_24_48 / (STAGE_HOURS[2] - STAGE_HOURS[1]);
  const slope_48_96 = delta_48_96 / (STAGE_HOURS[3] - STAGE_HOURS[2]);

  // Guard against
  const percentage_change =
    v0 !== 0 ? ((v96 - v0) / Math.abs(v0)) * 100 : v96 !== 0 ? 100 : 0;

  // Acceleration
  const drift_acceleration = slope_48_96 - slope_0_24;

  const trend = classifyTrend({
    delta_0_24,
    delta_24_48,
    delta_48_96,
    slope_0_24,
    slope_24_48,
    slope_48_96,
    drift_acceleration,
    startValue: v0,
  });

  return {
    deltas: { delta_0_24, delta_24_48, delta_48_96 },
    slopes: { slope_0_24, slope_24_48, slope_48_96 },
    percentage_change,
    drift_acceleration,
    trend,
  };
}


function classifyTrend(input: {
  delta_0_24: number;
  delta_24_48: number;
  delta_48_96: number;
  slope_0_24: number;
  slope_24_48: number;
  slope_48_96: number;
  drift_acceleration: number;
  startValue: number;
}): DriftTrend {
  const { delta_0_24, delta_24_48, delta_48_96, slope_0_24, slope_48_96, startValue } = input;

  const deltas = [delta_0_24, delta_24_48, delta_48_96];
  const scale = Math.max(Math.abs(startValue), 1e-9); // guards against divide-by-zero near 0


  const totalChange = Math.abs(delta_0_24 + delta_24_48 + delta_48_96);
  const totalChangeRatio = totalChange / scale;
  const noSignFlipInDeltas = deltas.every((d) => Math.sign(d) === Math.sign(deltas[0]) || d === 0);
  if (totalChangeRatio < 0.08 && noSignFlipInDeltas) {
    return "STABLE";
  }

  // --- 2. INTERMITTENT_INSTABILITY
  const signs = deltas.map((d) => (Math.abs(d) / scale < 0.02 ? 0 : Math.sign(d)));
  const nonZeroSigns = signs.filter((s) => s !== 0);
  const hasSignFlip = nonZeroSigns.some((s, i) => i > 0 && s !== nonZeroSigns[i - 1]);
  if (hasSignFlip) {
    return "INTERMITTENT_INSTABILITY";
  }

  // --- 3. ACCELERATING
  const sameDirection = Math.sign(slope_0_24) === Math.sign(slope_48_96) && slope_0_24 !== 0;
  const isAccelerating = sameDirection && Math.abs(slope_48_96) >= Math.abs(slope_0_24) * 1.8;
  if (isAccelerating) {
    return "ACCELERATING";
  }

  // --- 4. SLOW_DEGRADATION
  return "SLOW_DEGRADATION";
}


export function computeDrift(component: ParsedComponent): DriftResult {
  const perParam: Record<ParamName, SingleParamDrift> = {} as Record<
    ParamName,
    SingleParamDrift
  >;

  for (const param of PARAM_ORDER) {
    perParam[param] = computeSingleParamDrift(component[param]);
  }

  const primary = perParam[PRIMARY_DRIFT_PARAM];

  
  const v0 = component[PRIMARY_DRIFT_PARAM][0];
  const v96 = component[PRIMARY_DRIFT_PARAM][3];
  const safeV0 = Math.abs(v0) < 1e-9 ? 1e-9 : v0; // guard divide-by-zero/near-zero start values
  const logRatio = Math.log2(Math.abs(v96 / safeV0));

  
  const LOG_RATIO_SCALE = 100 / 6;
  const magnitudeComponent = Math.min(Math.abs(logRatio) * LOG_RATIO_SCALE, 100);

  const accelerationBonus =
    primary.trend === "ACCELERATING" ? 20 : primary.trend === "INTERMITTENT_INSTABILITY" ? 10 : 0;
  const score = Math.max(0, Math.min(100, magnitudeComponent + accelerationBonus));
  // --- END FIX ---

  return {
    score: Math.round(score * 100) / 100,
    trend: primary.trend,
    percentage_change: Math.round(primary.percentage_change * 100) / 100,
    deltas: primary.deltas,
    slopes: primary.slopes,
    drift_acceleration: primary.drift_acceleration,
    // Populated by lot.service.ts
    deviation_from_lot_trajectory: 0,
  };
}

export function secondaryDriftReasons(component: ParsedComponent): string[] {
  const reasons: string[] = [];

  for (const param of PARAM_ORDER) {
    if (param === PRIMARY_DRIFT_PARAM) continue;

    const drift = computeSingleParamDrift(component[param]);
    if (drift.trend === "ACCELERATING") {
      reasons.push(`${param} is also accelerating`);
    } else if (drift.trend === "INTERMITTENT_INSTABILITY") {
      reasons.push(`${param} shows intermittent instability`);
    } else if (drift.trend === "SLOW_DEGRADATION" && Math.abs(drift.percentage_change) > 15) {
      reasons.push(`${param} shows steady drift (${drift.percentage_change.toFixed(1)}% change)`);
    }
  }

  return reasons;
}