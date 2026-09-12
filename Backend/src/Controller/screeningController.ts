
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary.js";

import { parseCsvBuffer, CsvValidationError } from "../services/csv.service.js";
import { analyzeComponentMl, pingMlService, MlServiceError } from "../services/ml.service.js";
import { computeDrift } from "../services/drift.service.js";
// import { computeLotBaselines, computeGlobalBaseline, getLotRiskLevel } from "../services/lot.service.js";
import { computeRisk } from "../services/risk.service.js";
import { assembleAnalysis, buildModelPerformance, ComponentAnalysisResult } from "../services/response.service.js";
import { saveAnalysis, listAnalyses, getAnalysisById } from "../services/history.service.js";
import { generateReport, ReportGenerationError } from "../services/report.service.js";
import { AnalyzeResponse, ParsedComponent } from "../types/screening.types.js";


// local error type 

export class ScreeningControllerError extends Error {
  code: "NO_FILE" | "CLOUDINARY_UPLOAD_FAILED" | "INTERNAL_ERROR";
  statusCode: number;

  constructor(message: string, code: ScreeningControllerError["code"], statusCode: number) {
    super(message);
    this.name = "ScreeningControllerError";
    this.code = code;
    this.statusCode = statusCode;
  }
}


// Cloudinary upload 

function uploadCsvToCloudinary(file: Express.Multer.File): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "tracex/screening-uploads" },
      (error, result) => {
        if (error || !result) {
          reject(
            new ScreeningControllerError(
              `Cloudinary upload failed: ${error?.message ?? "unknown error"}`,
              "CLOUDINARY_UPLOAD_FAILED",
              502
            )
          );
          return;
        }
        resolve({ secure_url: result.secure_url });
      }
    );
    stream.end(file.buffer);
  });
}


// per-component pipeline: ml -> drift -> risk


async function analyzeComponent(
  component: ParsedComponent,
  // lotBaselines: ReturnType<typeof computeLotBaselines>
): Promise<ComponentAnalysisResult> {
  const { anomaly, prediction } = await analyzeComponentMl(component);
  const drift = computeDrift(component);
  const risk = computeRisk({ component, anomaly, prediction, drift });

  return { component, anomaly, prediction, drift, risk };
}


// POST /api/v1/screening/analyze

export async function analyzeScreening(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new ScreeningControllerError("No CSV file was uploaded.", "NO_FILE", 400);
    }

    
    const [uploadResult, components] = await Promise.all([
      uploadCsvToCloudinary(file),
      Promise.resolve().then(() => parseCsvBuffer(file.buffer)),
    ]);

   
    // const lotBaselines = computeLotBaselines(components);
    
    // const globalBaseline = computeGlobalBaseline(components);
    // void getLotRiskLevel; // referenced to avoid an unused-import lint error until it's wired in
    // void globalBaseline;

    const results = await Promise.all(
      components.map((component) => analyzeComponent(component))
    );

    const assembled = assembleAnalysis(results);

    const response: AnalyzeResponse = {
      success: true,
      analysis_id: randomUUID(),
      file: {
        name: file.originalname,
        url: uploadResult.secure_url,
      },
      ...assembled,
      processing: { status: "completed" },
    };

    // History 
    try {
      await saveAnalysis(response);
    } catch (saveErr) {
      console.error(`[history] failed to save analysis ${response.analysis_id}:`, saveErr);
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}



export async function health(_req: Request, res: Response): Promise<void> {
  const mlServiceUp = await pingMlService();

  res.status(mlServiceUp ? 200 : 503).json({
    success: mlServiceUp,
    ml_service: mlServiceUp ? "up" : "unreachable",
  });
}


// GET /api/v1/models/performance

export function getModelPerformance(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    model_performance: buildModelPerformance(),
  });
}

// ------------------------------------------------------------------
// GET /api/v1/screening/:id
// ------------------------------------------------------------------

export async function getScreeningById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
   
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const analysis = await getAnalysisById(id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: { code: "ANALYSIS_NOT_FOUND", message: `No analysis found with id ${id}` },
      });
      return;
    }

    res.status(200).json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------------
// GET /api/v1/screening/history
// Lightweight list view — summary fields only, see history.service.ts.
// ------------------------------------------------------------------

export async function getScreeningHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : undefined;

    const analyses = await listAnalyses(limit, skip);
    res.status(200).json({ success: true, analyses });
  } catch (err) {
    next(err);
  }
}


// POST /api/v1/screening/:id/report
// "Generate Report" 

export async function generateScreeningReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await generateReport(id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ReportGenerationError) {
      res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}