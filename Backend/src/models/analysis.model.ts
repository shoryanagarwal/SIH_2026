

import { Schema, model, Document } from "mongoose";
import {
  ProcessedComponent,
  StatCardData,
  ChartDataPoint,
  DistributionEntry,
  ScreeningTableRow,
  ModelPerformanceEntry,
  BatchSummaryData,
} from "../types/screening.types.js";

export interface AnalysisDocument extends Document {
  analysis_id: string;
  file_name: string;
  cloudinary_url: string;

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

  report_url?: string;
  report_generated_at?: Date;

  created_at: Date;
}

const AnalysisSchema = new Schema<AnalysisDocument>(
  {
    analysis_id: { type: String, required: true, unique: true, index: true },
    file_name: { type: String, required: true },
    cloudinary_url: { type: String, required: true },

    summary: {
      total_components: { type: Number, required: true },
      normal: { type: Number, required: true },
      suspicious: { type: Number, required: true },
      high_risk: { type: Number, required: true },
      anomaly_rate: { type: Number, required: true },
    },

    stat_cards: { type: Schema.Types.Mixed, required: true },
    chart_data: { type: Schema.Types.Mixed, required: true },
    distribution: { type: Schema.Types.Mixed, required: true },
    components: { type: Schema.Types.Mixed, required: true },
    components_detail: { type: Schema.Types.Mixed, required: true },
    model_performance: { type: Schema.Types.Mixed, required: true },
    batch: { type: Schema.Types.Mixed, required: true },

    report_url: { type: String },
    report_generated_at: { type: Date },

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const AnalysisModel = model<AnalysisDocument>("Analysis", AnalysisSchema);