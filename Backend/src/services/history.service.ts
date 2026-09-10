

import { AnalysisModel, AnalysisDocument } from "../models/analysis.model.js";
import { AnalyzeResponse } from "../types/screening.types.js";

export interface AnalysisListItem {
  analysis_id: string;
  file_name: string;
  created_at: Date;
  summary: AnalysisDocument["summary"];
  report_url?: string;
}


export async function saveAnalysis(result: AnalyzeResponse): Promise<AnalysisDocument> {
  const doc = new AnalysisModel({
    analysis_id: result.analysis_id,
    file_name: result.file.name,
    cloudinary_url: result.file.url,
    summary: result.summary,
    stat_cards: result.stat_cards,
    chart_data: result.chart_data,
    distribution: result.distribution,
    components: result.components,
    components_detail: result.components_detail,
    model_performance: result.model_performance,
    batch: result.batch,
    report_url: result.report_url,
    report_generated_at: result.report_generated_at ? new Date(result.report_generated_at) : undefined,
  });

  return doc.save();
}


export async function listAnalyses(limit = 50, skip = 0): Promise<AnalysisListItem[]> {
  const docs = await AnalysisModel.find({}, { components: 0, components_detail: 0, stat_cards: 0, chart_data: 0, distribution: 0, model_performance: 0, batch: 0 })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return docs.map((doc) => ({
    analysis_id: doc.analysis_id,
    file_name: doc.file_name,
    created_at: doc.created_at,
    summary: doc.summary,
    report_url: doc.report_url,
  }));
}

/**
 * Full record for a single analysis — detail view
 */
export async function getAnalysisById(analysisId: string): Promise<AnalysisDocument | null> {
  return AnalysisModel.findOne({ analysis_id: analysisId });
}


export async function attachReportToAnalysis(
  analysisId: string,
  reportUrl: string,
  generatedAt: Date = new Date()
): Promise<AnalysisDocument | null> {
  return AnalysisModel.findOneAndUpdate(
    { analysis_id: analysisId },
    { report_url: reportUrl, report_generated_at: generatedAt },
    { new: true }
  );
}