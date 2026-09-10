

import { ParsedComponent } from "../types/screening.types.js";

export interface LotBaseline {
  lot_id: string;
  count: number;
  median: number;
  mean: number;
  mad: number; // median absolute deviation
}

export type LotRiskLevel = "LOW" | "MEDIUM" | "HIGH";

const REPRESENTATIVE_STAGE_INDEX = 3; // index into [0h,24h,48h,96h] -> 96h, latest known reading

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mad(values: number[], med: number): number {
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations);
}

function representativeValue(component: ParsedComponent): number {
  return component.Leakage[REPRESENTATIVE_STAGE_INDEX];
}


export function computeLotBaselines(
  components: ParsedComponent[]
): Map<string, LotBaseline> {
  const byLot = new Map<string, number[]>();

  for (const component of components) {
    const value = representativeValue(component);
    const existing = byLot.get(component.lot_id) ?? [];
    existing.push(value);
    byLot.set(component.lot_id, existing);
  }

  const baselines = new Map<string, LotBaseline>();
  for (const [lot_id, values] of byLot.entries()) {
    const med = median(values);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    baselines.set(lot_id, {
      lot_id,
      count: values.length,
      median: med,
      mean,
      mad: mad(values, med),
    });
  }

  return baselines;
}


export function computeGlobalBaseline(components: ParsedComponent[]): LotBaseline {
  const values = components.map(representativeValue);
  const med = median(values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    lot_id: "__global__",
    count: values.length,
    median: med,
    mean,
    mad: mad(values, med),
  };
}


export function robustZScore(value: number, baseline: LotBaseline): number {
  if (baseline.mad === 0) {
    return baseline.median === 0 ? 0 : ((value - baseline.median) / Math.abs(baseline.median)) * 10;
  }
  return (0.6745 * (value - baseline.median)) / baseline.mad;
}


export function computeLotDeviationScore(
  component: ParsedComponent,
  lotBaselines: Map<string, LotBaseline>
): number {
  const baseline = lotBaselines.get(component.lot_id);
  if (!baseline) return 0;

  const value = representativeValue(component);
  const z = Math.abs(robustZScore(value, baseline));

  // |z| of ~3.5 is the conventional.
  return Math.max(0, Math.min(100, (z / 3.5) * 100));
}


export function getLotRiskLevel(
  lotBaseline: LotBaseline,
  globalBaseline: LotBaseline
): LotRiskLevel {
  const z = Math.abs(robustZScore(lotBaseline.median, globalBaseline));
  if (z >= 3.5) return "HIGH";
  if (z >= 1.5) return "MEDIUM";
  return "LOW";
}


export function lotDeviationReason(
  component: ParsedComponent,
  lotBaselines: Map<string, LotBaseline>
): string | null {
  const baseline = lotBaselines.get(component.lot_id);
  if (!baseline) return null;

  const value = representativeValue(component);
  const z = robustZScore(value, baseline);

  if (Math.abs(z) < 2) return null;

  return z > 0
    ? `Leakage abnormally high relative to lot ${component.lot_id} (median ${baseline.median.toFixed(2)}uA)`
    : `Leakage abnormally low relative to lot ${component.lot_id} (median ${baseline.median.toFixed(2)}uA)`;
}