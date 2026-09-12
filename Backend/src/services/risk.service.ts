

import {
  ParsedComponent,
  MlAnomalyResponse,
  MlPredict168Response,
  DriftResult,
  RiskResult,
  RiskDecision,
  FrontendRiskLevel,
  FrontendStatus,
  FrontendDistributionLabel,
} from "../types/screening.types.js";
import { secondaryDriftReasons } from "./drift.service.js";

// Configurable per spec Section 13 ("keep the weights configurable")
export const RISK_WEIGHTS = {
  anomaly: 0.4,
  drift: 0.35,
  prediction: 0.25,
};

const DECISION_THRESHOLDS = { review: 40, earlyReject: 70 };
const UNCERTAINTY_MARGIN = 6; // points either side of a boundary treated as "not confident"

const REPRESENTATIVE_STAGE_INDEX = 3; // 96h —


function computePredictionRisk(
  component: ParsedComponent,
  prediction: MlPredict168Response
): number {
  const actual96h = component.Leakage[REPRESENTATIVE_STAGE_INDEX];
  const predicted168h = prediction.predicted_168h.Leakage;

  if (actual96h === 0) {
    return predicted168h > 0 ? 50 : 0; // can't compute a ratio from zero; mild default
  }

  const percentIncrease = ((predicted168h - actual96h) / Math.abs(actual96h)) * 100;

  return Math.max(0, Math.min(100, (percentIncrease / 300) * 100));
}

/**
 * Combines the 4 weighted signals into a single 0-100 risk score.
 */
export function computeRiskScore(
  anomalyScore: number,
  driftScore: number,
  predictionRisk: number,
  
): number {
  const score =
    anomalyScore * RISK_WEIGHTS.anomaly +
    driftScore * RISK_WEIGHTS.drift +
    predictionRisk * RISK_WEIGHTS.prediction ;
    

  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}


export function decisionFromScore(score: number): RiskDecision {
  const { review, earlyReject } = DECISION_THRESHOLDS;

  const nearReviewBoundary = Math.abs(score - review) <= UNCERTAINTY_MARGIN;
  const nearRejectBoundary = Math.abs(score - earlyReject) <= UNCERTAINTY_MARGIN;

  if (nearReviewBoundary || nearRejectBoundary) {
    return "REVIEW";
  }

  if (score >= earlyReject) return "EARLY_REJECT";
  if (score >= review) return "REVIEW";
  return "PASS";
}

/**
 * Maps the technically-correct decision onto every frontend-facing
 * label the dashboard actually renders (StatCard counts, pie chart,
 * table risk badge, table status badge). Field names/values match
 * ScreeningTable.jsx and the dashboard mock data exactly.
 */
function mapDecisionToFrontend(decision: RiskDecision): {
  frontend_risk: FrontendRiskLevel;
  frontend_status: FrontendStatus;
  distribution_label: FrontendDistributionLabel;
} {
  switch (decision) {
    case "PASS":
      return { frontend_risk: "LOW", frontend_status: "NORMAL", distribution_label: "Normal" };
    case "REVIEW":
      return {
        frontend_risk: "MEDIUM",
        frontend_status: "FLAGGED", // ScreeningTable.jsx only has 2 states — REVIEW collapses into FLAGGED
        distribution_label: "Suspicious",
      };
    case "EARLY_REJECT":
      return { frontend_risk: "HIGH", frontend_status: "FLAGGED", distribution_label: "High Risk" };
  }
}

/**
 * Builds the human-readable reasons[] array
 */
function buildReasons(params: {
  anomaly: MlAnomalyResponse;
  drift: DriftResult;
  predictionRisk: number;
  predicted168hLeakage: number;
  component: ParsedComponent;
  // lotBaselines: Map<string, LotBaseline>;
  decision: RiskDecision;
}): string[] {
  const { anomaly, drift, predictionRisk, predicted168hLeakage , component , decision } =
    params;

  const reasons: string[] = [];

  if (anomaly.anomaly_status === "HIGH ANOMALY") {
    reasons.push(
      `Anomaly score ${anomaly.anomaly_score.toFixed(1)} indicates behavior inconsistent with the normal population`
    );
  }

  // const lotReason = lotDeviationReason(component, lotBaselines);
  // if (lotReason) {
  //   reasons.push(lotReason);
  // }

  if (drift.trend === "ACCELERATING") {
    reasons.push(
      `Leakage drift is accelerating (${drift.percentage_change.toFixed(1)}% change across burn-in)`
    );
  } else if (drift.trend === "INTERMITTENT_INSTABILITY") {
    reasons.push("Leakage shows intermittent instability across burn-in stages");
  } else if (drift.trend === "SLOW_DEGRADATION" && Math.abs(drift.percentage_change) > 15) {
    reasons.push(`Steady Leakage drift observed (${drift.percentage_change.toFixed(1)}% change)`);
  }

  if (predictionRisk > 40) {
    reasons.push(
      `Predicted 168h Leakage (${predicted168hLeakage.toFixed(2)}uA) continues an upward trajectory from the 96h reading`
    );
  }

  reasons.push(...secondaryDriftReasons(component));

  if (decision === "REVIEW" && reasons.length === 0) {
    reasons.push("Risk score falls near a decision threshold — flagged for manual review rather than automatic pass");
  }

  // Dedupe, in case multiple signals produced overlapping text
  return [...new Set(reasons)];
}

/**
 * Public entry point: fuses every upstream signal for one component
 * into the final RiskResult. 
 */
export function computeRisk(params: {
  component: ParsedComponent;
  anomaly: MlAnomalyResponse;
  prediction: MlPredict168Response;
  drift: DriftResult;
  
}): RiskResult {
  const { component, anomaly, prediction, drift} = params;

  
  const predictionRisk = computePredictionRisk(component, prediction);

  const score = computeRiskScore(anomaly.anomaly_score, drift.score, predictionRisk );
  const decision = decisionFromScore(score);
  const { frontend_risk, frontend_status, distribution_label } = mapDecisionToFrontend(decision);

  const reasons = buildReasons({
    anomaly,
    drift,
    predictionRisk,
    predicted168hLeakage: prediction.predicted_168h.Leakage,
    component,
    decision,
  });

  return {
    score,
    decision,
    frontend_risk,
    frontend_status,
    distribution_label,
    reasons,
  };
}