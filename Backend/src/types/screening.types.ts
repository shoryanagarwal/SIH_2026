

export const INPUT_STAGES = ["0h", "24h", "48h", "96h"] as const;
export type InputStage = (typeof INPUT_STAGES)[number];

export const PARAM_ORDER = ["Temperature", "VCE", "Leakage", "Breakdown"] as const;
export type ParamName = (typeof PARAM_ORDER)[number];



export interface RawCsvRow {
  Component_ID: string;
  Lot_ID: string;
  True_Class?: string; // evaluation-only label, never fed to the model

  Temperature_C_0h: string;
  Temperature_C_24h: string;
  Temperature_C_48h: string;
  Temperature_C_96h: string;
  Temperature_C_168h?: string; // ground truth, optional — used for later comparison only

  VCE_0h: string;
  VCE_24h: string;
  VCE_48h: string;
  VCE_96h: string;
  VCE_168h?: string;

  Leakage_uA_0h: string;
  Leakage_uA_24h: string;
  Leakage_uA_48h: string;
  Leakage_uA_96h: string;
  Leakage_uA_168h?: string;

  Breakdown_V_0h: string;
  Breakdown_V_24h: string;
  Breakdown_V_48h: string;
  Breakdown_V_96h: string;
  Breakdown_V_168h?: string;
}


// 2. Parsed component — csv.service.ts 

export interface ParsedComponent {
  component_id: string;
  lot_id: string;
  Temperature: number[]; // length 4, stage order matches INPUT_STAGES
  VCE: number[];
  Leakage: number[];
  Breakdown: number[];
  // ground truth 168h values, if present in the CSV — not sent to the model,
  
  actual_168h?: Partial<Record<ParamName, number>>;
}


export interface MlAnomalyResponse {
  component_id: string;
  lot_id: string;
  anomaly_score_raw: number; // unscaled decision_function output
  anomaly_score: number; // naive 0-100 scaling, reference only
  anomaly_status: "NORMAL" | "HIGH ANOMALY";
}

export interface MlPredict168Response {
  component_id: string;
  lot_id: string;
  predicted_168h: Record<ParamName, number>;
}


export type DriftTrend =
  | "STABLE"
  | "SLOW_DEGRADATION"
  | "ACCELERATING"
  | "INTERMITTENT_INSTABILITY";

export interface DriftResult {
  score: number; // 0-100
  trend: DriftTrend;
  percentage_change: number;
  deltas: {
    delta_0_24: number;
    delta_24_48: number;
    delta_48_96: number;
  };
  slopes: {
    slope_0_24: number;
    slope_24_48: number;
    slope_48_96: number;
  };
  drift_acceleration: number;
  deviation_from_lot_trajectory: number;
}


// 5. Risk fusion output (risk.service.ts)

export type RiskDecision = "PASS" | "REVIEW" | "EARLY_REJECT";

// Frontend-facing labels
export type FrontendRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type FrontendStatus = "NORMAL" | "FLAGGED"; // ScreeningTable only has 2 states
export type FrontendDistributionLabel = "Normal" | "Suspicious" | "High Risk"; // pie chart / KPI cards use 3

export interface RiskResult {
  score: number; // 0-100
  decision: RiskDecision;
  frontend_risk: FrontendRiskLevel;
  frontend_status: FrontendStatus;
  distribution_label: FrontendDistributionLabel;
  reasons: string[];
}


// 6. Fully processed component — everything merged, one per CSV row


export interface ProcessedComponent {
  component_id: string;
  lot_id: string;
  component_type?: string;

  measurements: {
    "0h": Record<ParamName, number>;
    "24h": Record<ParamName, number>;
    "48h": Record<ParamName, number>;
    "96h": Record<ParamName, number>;
  };

  anomaly: {
    score: number;
    status: "NORMAL" | "HIGH ANOMALY";
    reasons: string[];
  };

  drift: DriftResult;

  prediction: {
    predicted_168h: Record<ParamName, number>;
  };

  risk: RiskResult;

  reasons: string[]; // combined, deduped, human-readable
}


// StatCard.jsx — value/percentage are pre-formatted display strings
export interface StatCardData {
  title: string;
  value: string; // e.g. "5,000"
  percentage: string; // e.g. "8.2% screened" — component prepends "↑ " itself
  type: "blue" | "green" | "yellow" | "red" | "purple";
}

// AnomalyDriftChart.jsx
export interface ChartDataPoint {
  hour: string; // "0h" | "24h" | "48h" | "96h" | "168h"
  anomalyScore: number;
  predictedDrift: number;
}

// ScreeningPieChart.jsx
export interface DistributionEntry {
  name: FrontendDistributionLabel;
  value: number;
}

// ScreeningTable.jsx
export interface ScreeningTableRow {
  componentId: string;
  lotId: string;
  anomalyScore: number;
  predictedDrift: number;
  risk: FrontendRiskLevel;
  status: FrontendStatus;
}

// ModelPerformance.jsx 
export interface ModelPerformanceEntry {
  title: string;
  value: string; // e.g. "0.0479 V"
  label: string; // e.g. "Low Error"
  progress: number; // 0-100
}

// BatchSummary.jsx — timePoints is a 
export interface BatchSummaryData {
  totalBatches: number;
  componentsScreened: number;
  parametersTracked: number;
  timePoints: string; 
}


// 8. The unified POST /api/v1/screening/analyze response


export interface AnalyzeResponse {
  success: true;
  analysis_id: string;

  file: {
    name: string;
    url: string; 
  };

  summary: {
    // raw numbers, used internally / for history list views
    total_components: number;
    normal: number;
    suspicious: number;
    high_risk: number;
    anomaly_rate: number;
  };

  // pre-formatted, one-to-one with the 5 StatCard instances 
  stat_cards: StatCardData[];

  chart_data: ChartDataPoint[];

  distribution: DistributionEntry[];

  components: ScreeningTableRow[];

  // full per-component 
  components_detail: ProcessedComponent[];

  model_performance: ModelPerformanceEntry[];

  batch: BatchSummaryData;

  processing: {
    status: "completed";
  };

  report_url?: string; // populated once
  report_generated_at?: string;
}


// 9. Consistent error shape (error.middleware.ts)

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ErrorCode =
  | "NO_FILE"
  | "INVALID_CSV"
  | "MISSING_COLUMN"
  | "MALFORMED_VALUE"
  | "CLOUDINARY_UPLOAD_FAILED"
  | "ML_SERVICE_ERROR"
  | "ML_SERVICE_UNAVAILABLE"
  | "ANALYSIS_NOT_FOUND"
  | "REPORT_GENERATION_FAILED"
  | "INTERNAL_ERROR";