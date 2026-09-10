

import PDFDocument from "pdfkit";
import cloudinary from "../config/cloudinary.js";
import { getAnalysisById, attachReportToAnalysis } from "./history.service.js";
import { AnalysisDocument } from "../models/analysis.model.js";
import { ProcessedComponent } from "../types/screening.types.js";

export class ReportGenerationError extends Error {
  code: "ANALYSIS_NOT_FOUND" | "REPORT_GENERATION_FAILED";
  statusCode: number;

  constructor(message: string, code: ReportGenerationError["code"], statusCode: number) {
    super(message);
    this.name = "ReportGenerationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";


function getFlaggedComponents(analysis: AnalysisDocument): ProcessedComponent[] {
  return analysis.components_detail.filter((c) => c.risk.decision !== "PASS");
}

// 2. structured prompt

function confidenceContext(component: ProcessedComponent): string {
  // decision already encodes this distinction directly: EARLY_REJECT
  // means the score cleared the boundary with the uncertainty margin
  // applied (risk.service.ts), i.e. "clearly bad"; REVIEW means either
  // a genuinely mixed signal or a score too close to a boundary to be
  // confident either way.
  return component.risk.decision === "EARLY_REJECT"
    ? "flagged with high confidence (clearly bad)"
    : "flagged for manual review (uncertain / near a decision threshold)";
}

function buildReportPrompt(analysis: AnalysisDocument, flagged: ProcessedComponent[]): string {
  const { summary, batch } = analysis;

  const componentLines = flagged
    .map((c) => {
      return [
        `- Component ${c.component_id} (Lot ${c.lot_id}):`,
        `  risk_score=${c.risk.score}, decision=${c.risk.decision} (${confidenceContext(c)})`,
        `  anomaly_score=${c.anomaly.score} (${c.anomaly.status})`,
        `  drift_trend=${c.drift.trend} (${c.drift.percentage_change}% change)`,
        `  predicted_168h=${JSON.stringify(c.prediction.predicted_168h)}`,
        `  reasons: ${c.reasons.join("; ") || "none recorded"}`,
      ].join("\n");
    })
    .join("\n\n");

  return `You are writing a QA burn-in screening report for an electronics manufacturing team.

Batch overview:
- Total components screened: ${summary.total_components}
- Normal: ${summary.normal}, Suspicious: ${summary.suspicious}, High Risk: ${summary.high_risk}
- Anomaly rate: ${summary.anomaly_rate}%
- Time points tracked: ${batch.timePoints}

Only the ${flagged.length} components below were flagged (PASS components are excluded from this
report entirely — this is not a full batch dump):

${componentLines || "No components were flagged in this batch."}

Write a concise QA report covering:
1. A short overall risk picture for this batch (1-2 paragraphs).
2. Any lot-level clustering worth flagging (call it out if multiple flagged components share a lot).
3. A per-component summary for each flagged component above, in plain language, distinguishing
   components flagged with high confidence from those flagged for manual review due to uncertainty.
4. A brief recommended next action (e.g. hold specific lots, manually inspect specific components).

Keep it factual and grounded only in the data given above — do not invent metrics or components not
listed. This is an MVP/demo risk model, not a certified trained classifier — do not claim otherwise.`;
}


// 3. Groq call

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ReportGenerationError(
      "GROQ_API_KEY is not set — cannot generate a report.",
      "REPORT_GENERATION_FAILED",
      500
    );
  }

  let res: Response;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
  } catch (err) {
    throw new ReportGenerationError(
      `Failed to reach Groq API: ${(err as Error).message}`,
      "REPORT_GENERATION_FAILED",
      502
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ReportGenerationError(
      `Groq API returned ${res.status}: ${body}`,
      "REPORT_GENERATION_FAILED",
      502
    );
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new ReportGenerationError(
      "Groq API response did not contain report text.",
      "REPORT_GENERATION_FAILED",
      502
    );
  }

  return text;
}

// 4. render to PDF

function renderReportToPdf(analysis: AnalysisDocument, reportText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("TRACE-X AI — Burn-In Screening Report", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("gray").text(`Analysis ID: ${analysis.analysis_id}`);
    doc.text(`Source file: ${analysis.file_name}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.fillColor("black");
    doc.moveDown();

    doc.fontSize(11).text(reportText, { align: "left" });

    doc.end();
  });
}

// 5. upload to Cloudinary (raw, not image

function uploadReportPdf(buffer: Buffer, analysisId: string): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "tracex/reports", public_id: `${analysisId}-report` },
      (error, result) => {
        if (error || !result) {
          reject(
            new ReportGenerationError(
              `Failed to upload report PDF: ${error?.message ?? "unknown error"}`,
              "REPORT_GENERATION_FAILED",
              502
            )
          );
          return;
        }
        resolve({ secure_url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
}

// public entry point

export async function generateReport(
  analysisId: string
): Promise<{ report_url: string; generated_at: string }> {
  const analysis = await getAnalysisById(analysisId);
  if (!analysis) {
    throw new ReportGenerationError(
      `No analysis found with id ${analysisId}`,
      "ANALYSIS_NOT_FOUND",
      404
    );
  }

  const flagged = getFlaggedComponents(analysis);
  const prompt = buildReportPrompt(analysis, flagged);
  const reportText = await callGroq(prompt);
  const pdfBuffer = await renderReportToPdf(analysis, reportText);
  const { secure_url } = await uploadReportPdf(pdfBuffer, analysisId);

  const generatedAt = new Date();
  await attachReportToAnalysis(analysisId, secure_url, generatedAt);

  return { report_url: secure_url, generated_at: generatedAt.toISOString() };
}