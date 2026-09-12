/**
 * TRACE-X AI — Response Assembly (Module D)
 * ============================================
 * Last step of the /analyze pipeline. Takes the per-component results
 * already computed by ml.service.ts + drift.service.ts + risk.service.ts,
 * plus the batch-wide lot baselines from lot.service.ts, and assembles
 * every piece screening.controller.ts needs to build the final
 * AnalyzeResponse — stat cards, chart data, distribution, table rows,
 * full detail, model performance, and batch summary. Field shapes match
 * screening.types.ts and the real FRONTEND/src/pages/dashboard.jsx
 * consumers exactly (Section 3 of the handoff doc) — do not deviate
 * without re-checking those sources.
 *
 * This file does no computation of anomaly/drift/risk itself — it only
 * combines already-computed values. If a number here looks wrong, the
 * bug is almost certainly upstream (ml_service, drift.service.ts,
 * risk.service.ts), not in this file.
 */

import {
  ParsedComponent,
  MlAnomalyResponse,
  MlPredict168Response,
  DriftResult,
  RiskResult,
  ProcessedComponent,
  StatCardData,
  ChartDataPoint,
  DistributionEntry,
  ScreeningTableRow,
  ModelPerformanceEntry,
  BatchSummaryData,
  PARAM_ORDER,
  INPUT_STAGES,
  ParamName,
} from "../types/screening.types.js";

/**
 * Everything computed for one component by the time it reaches this
 * file. screening.controller.ts builds one of these per row after
 * calling ml.service.ts, drift.service.ts and risk.service.ts, and
 * passes the full array in here. Not in screening.types.ts yet since
 * it's purely an internal handoff shape between the controller and
 * this file, not something that crosses an external boundary — move
 * it there if another file ends up needing it too.
 */
export interface ComponentAnalysisResult {
  component: ParsedComponent;
  anomaly: MlAnomalyResponse;
  prediction: MlPredict168Response;
  drift: DriftResult;
  risk: RiskResult;
}

/**
 * Everything response.service.ts produces, minus the fields only
 * screening.controller.ts can fill in (analysis_id, file url, history
 * timestamps). The controller spreads this into the final
 * AnalyzeResponse alongside those.
 */
export interface AssembledAnalysis {
  summary: {
    total_components: number;
    normal: number;
    suspicious: number;
    high_risk: number;
    anomaly_rate: number;
  };
  stat_cards: StatCardData[];
  chart_data: ChartDataPoint[];
  distribution: DistributionEntry[];
  components: ScreeningTableRow[];
  components_detail: ProcessedComponent[];
  model_performance: ModelPerformanceEntry[];
  batch: BatchSummaryData;
}

// ------------------------------------------------------------------
// small formatting helpers — StatCard/ModelPerformance want
// pre-formatted display strings, not raw numbers (Section 3)
// ------------------------------------------------------------------

function withCommas(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ------------------------------------------------------------------
// summary + stat cards
// ------------------------------------------------------------------

function buildSummary(results: ComponentAnalysisResult[]): AssembledAnalysis["summary"] {
  const total = results.length;
  const normal = results.filter((r) => r.risk.distribution_label === "Normal").length;
  const suspicious = results.filter((r) => r.risk.distribution_label === "Suspicious").length;
  const highRisk = results.filter((r) => r.risk.distribution_label === "High Risk").length;
  const anomalies = results.filter((r) => r.anomaly.anomaly_status === "HIGH ANOMALY").length;

  return {
    total_components: total,
    normal,
    suspicious,
    high_risk: highRisk,
    anomaly_rate: total > 0 ? Math.round((anomalies / total) * 10000) / 100 : 0,
  };
}

/**
 * The 5 StatCard instances on the dashboard, in the fixed order the
 * frontend renders them: Total, Normal, Suspicious, High Risk,
 * Anomaly Rate. StatCard.jsx always prepends "↑ " to `percentage`
 * itself, so the string here should read naturally after that prefix.
 *
 * Note: the exact wording of `percentage` wasn't nailed down against
 * a specific mock string this session (only the field's existence and
 * type were confirmed) — the text below is a reasonable placeholder.
 * Worth a quick diff against dashboard.jsx's current mock data before
 * final demo, same caution as everything else in Section 3.
 */
function buildStatCards(summary: AssembledAnalysis["summary"]): StatCardData[] {
  const { total_components, normal, suspicious, high_risk, anomaly_rate } = summary;

  const shareOf = (count: number) => (total_components > 0 ? (count / total_components) * 100 : 0);

  return [
    {
      title: "Total Components",
      value: withCommas(total_components),
      percentage: `${pct(100)} screened`,
      type: "blue",
    },
    {
      title: "Normal",
      value: withCommas(normal),
      percentage: `${pct(shareOf(normal))} of batch`,
      type: "green",
    },
    {
      title: "Suspicious",
      value: withCommas(suspicious),
      percentage: `${pct(shareOf(suspicious))} of batch`,
      type: "yellow",
    },
    {
      title: "High Risk",
      value: withCommas(high_risk),
      percentage: `${pct(shareOf(high_risk))} of batch`,
      type: "red",
    },
    {
      title: "Anomaly Rate",
      value: pct(anomaly_rate),
      percentage: "of screened batch",
      type: "purple",
    },
  ];
}

// ------------------------------------------------------------------
// chart data — 5 points (0h/24h/48h/96h/168h), aggregate across batch
// ------------------------------------------------------------------

/**
 * The anomaly detector and drift engine each produce one score per
 * component, not one per stage — there's no real "anomaly score at
 * 24h" in the underlying data. To still give the chart a real 5-point
 * trend line instead of a flat repeated value, this uses the batch's
 * average Leakage reading at each of the 4 measured stages (real,
 * varies stage to stage) as `predictedDrift`, plus the average
 * predicted 168h Leakage as the 5th point. `anomalyScore` is the
 * batch's average anomaly score, scaled at each stage by how far that
 * stage's average Leakage has moved toward the final (168h) average —
 * so it's flat at 0 for a batch with no drift and rises toward the
 * real average anomaly score as Leakage climbs.
 *
 * This is a documented MVP proxy, not a second model — flag it if the
 * frontend/spec team wants a different definition of "anomaly score
 * over time" before the demo.
 */
function buildChartData(results: ComponentAnalysisResult[]): ChartDataPoint[] {
  if (results.length === 0) {
    return [...INPUT_STAGES, "168h"].map((hour) => ({ hour, anomalyScore: 0, predictedDrift: 0 }));
  }

  const avgAnomalyScore = average(results.map((r) => r.anomaly.anomaly_score));

  const avgLeakageByStageIndex = INPUT_STAGES.map((_, stageIndex) =>
    average(results.map((r) => r.component.Leakage[stageIndex]))
  );
  const avgPredictedLeakage168h = average(results.map((r) => r.prediction.predicted_168h.Leakage));

  const finalAvgLeakage = avgPredictedLeakage168h;
  const startAvgLeakage = avgLeakageByStageIndex[0];
  const totalSpread = finalAvgLeakage - startAvgLeakage;

  const points: ChartDataPoint[] = INPUT_STAGES.map((hour, stageIndex) => {
    const stageLeakage = avgLeakageByStageIndex[stageIndex];
    const progress = totalSpread !== 0 ? (stageLeakage - startAvgLeakage) / totalSpread : 0;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    return {
      hour,
      anomalyScore: Math.round(avgAnomalyScore * clampedProgress * 100) / 100,
      predictedDrift: Math.round(stageLeakage * 100) / 100,
    };
  });

  points.push({
    hour: "168h",
    anomalyScore: Math.round(avgAnomalyScore * 100) / 100,
    predictedDrift: Math.round(avgPredictedLeakage168h * 100) / 100,
  });

  return points;
}

// ------------------------------------------------------------------
// distribution (pie chart) — 3-way, exactly matches risk's own labels
// ------------------------------------------------------------------

function buildDistribution(results: ComponentAnalysisResult[]): DistributionEntry[] {
  const counts: Record<"Normal" | "Suspicious" | "High Risk", number> = {
    Normal: 0,
    Suspicious: 0,
    "High Risk": 0,
  };

  for (const r of results) {
    counts[r.risk.distribution_label] += 1;
  }

  return [
    { name: "Normal", value: counts.Normal },
    { name: "Suspicious", value: counts.Suspicious },
    { name: "High Risk", value: counts["High Risk"] },
  ];
}

// ------------------------------------------------------------------
// table rows + full per-component detail
// ------------------------------------------------------------------

function buildTableRow(r: ComponentAnalysisResult): ScreeningTableRow {
  return {
    componentId: r.component.component_id,
    lotId: r.component.lot_id,
    anomalyScore: r.anomaly.anomaly_score,
    predictedDrift: r.drift.score,
    risk: r.risk.frontend_risk,
    status: r.risk.frontend_status,
  };
}

function measurementsAtStage(component: ParsedComponent, stageIndex: number): Record<ParamName, number> {
  const record = {} as Record<ParamName, number>;
  for (const param of PARAM_ORDER) {
    record[param] = component[param][stageIndex];
  }
  return record;
}

function buildProcessedComponent(r: ComponentAnalysisResult): ProcessedComponent {
  const { component, anomaly, prediction, drift, risk } = r;

  return {
    component_id: component.component_id,
    lot_id: component.lot_id,

    measurements: {
      "0h": measurementsAtStage(component, 0),
      "24h": measurementsAtStage(component, 1),
      "48h": measurementsAtStage(component, 2),
      "96h": measurementsAtStage(component, 3),
    },

    anomaly: {
      score: anomaly.anomaly_score,
      status: anomaly.anomaly_status,
      // The anomaly detector itself doesn't produce reasons text —
      // that only exists at the fused risk level (risk.reasons below).
      // Left empty rather than duplicating risk's reasons here.
      reasons: [],
    },

    drift,

    prediction: {
      predicted_168h: prediction.predicted_168h,
    },

    risk,

    reasons: risk.reasons,
  };
}

// ------------------------------------------------------------------
// model performance — MVP/demo numbers, explicitly not from a trained
// eval run (spec Section 30). NOTE: the CSV's optional True_Class
// column would let a real F1/false-negative-rate be computed against
// actual anomaly outcomes if that's wanted later — it's just not
// wired through ParsedComponent today (csv.service.ts currently keeps
// only actual_168h numeric ground truth, not the class label). Worth
// raising with the user before assuming these placeholders are final.
// ------------------------------------------------------------------

export function buildModelPerformance(): ModelPerformanceEntry[] {
  return [
    {
      title: "Anomaly Detection F1",
      value: "0.91",
      label: "Demo estimate",
      progress: 91,
    },
    {
      title: "Drift Prediction MAE",
      value: "0.0479 V",
      label: "Low Error",
      progress: 88,
    },
    {
      title: "False Negative Rate",
      value: "4.2%",
      label: "Demo estimate",
      progress: 96,
    },
    {
      title: "Explainability Score",
      value: "0.87",
      label: "High",
      progress: 87,
    },
  ];
}

// ------------------------------------------------------------------
// batch summary
// ------------------------------------------------------------------

function buildBatchSummary(results: ComponentAnalysisResult[]): BatchSummaryData {
  // const uniqueLots = new Set(results.map((r) => r.component.lot_id));

  return {
    totalBatches: 1, // one CSV upload == one batch, per this pipeline
    componentsScreened: results.length,
    parametersTracked: PARAM_ORDER.length,
    timePoints: [...INPUT_STAGES, "168h"].join(", "),
  };
}

// ------------------------------------------------------------------
// public entry point
// ------------------------------------------------------------------

export function assembleAnalysis(results: ComponentAnalysisResult[]): AssembledAnalysis {
  const summary = buildSummary(results);

  return {
    summary,
    stat_cards: buildStatCards(summary),
    chart_data: buildChartData(results),
    distribution: buildDistribution(results),
    components: results.map(buildTableRow),
    components_detail: results.map(buildProcessedComponent),
    model_performance: buildModelPerformance(),
    batch: buildBatchSummary(results),
  };
}