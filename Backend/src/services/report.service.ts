import PDFDocument from "pdfkit";
import cloudinary from "../config/cloudinary.js";
import {
  getAnalysisById,
  attachReportToAnalysis,
} from "./history.service.js";
import { AnalysisDocument } from "../models/analysis.model.js";
import { ProcessedComponent } from "../types/screening.types.js";

export class ReportGenerationError extends Error {
  code: "ANALYSIS_NOT_FOUND" | "REPORT_GENERATION_FAILED";
  statusCode: number;

  constructor(
    message: string,
    code: ReportGenerationError["code"],
    statusCode: number
  ) {
    super(message);
    this.name = "ReportGenerationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// =====================================================
// GROQ
// =====================================================

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "openai/gpt-oss-120b";

// =====================================================
// FLAGGED COMPONENTS
// =====================================================

function getFlaggedComponents(
  analysis: AnalysisDocument
): ProcessedComponent[] {
  return analysis.components_detail.filter(
    (c) => c.risk.decision !== "PASS"
  );
}

// =====================================================
// CONFIDENCE CONTEXT
// =====================================================

function confidenceContext(
  component: ProcessedComponent
): string {
  return component.risk.decision === "EARLY_REJECT"
    ? "flagged with high confidence (clearly bad)"
    : "flagged for manual review (uncertain / near a decision threshold)";
}

// =====================================================
// GROQ PROMPT
// =====================================================

function buildReportPrompt(
  analysis: AnalysisDocument,
  flagged: ProcessedComponent[]
): string {
  const { summary, batch } = analysis;

  const componentLines = flagged
    .map((c) => {
      return [
        `- Component ${c.component_id} (Lot ${c.lot_id}):`,
        `  risk_score=${c.risk.score}, decision=${c.risk.decision} (${confidenceContext(c)})`,
        `  anomaly_score=${c.anomaly.score} (${c.anomaly.status})`,
        `  drift_trend=${c.drift.trend} (${c.drift.percentage_change}% change)`,
        `  predicted_168h=${JSON.stringify(
          c.prediction.predicted_168h
        )}`,
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

Only the ${flagged.length} components below were flagged.

${componentLines || "No components were flagged in this batch."}

Write a concise QA report covering:

1. A short overall risk picture for this batch (1-2 paragraphs).
2. Any lot-level clustering worth flagging.
3. A per-component summary for each flagged component.
4. A brief recommended next action.

Keep it factual and grounded only in the data given above.

This is an MVP/demo risk model, not a certified trained classifier — do not claim otherwise.`;
}

// =====================================================
// CALL GROQ
// =====================================================

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

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

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

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string;
      };
    }[];
  };

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

// =====================================================
// TEXT CLEANER
// =====================================================

function cleanReportText(text: string): string {
  return text
    // Remove control characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")

    // Markdown bold
    .replace(/\*\*/g, "")

    // Markdown headings
    .replace(/^#{1,6}\s*/gm, "")

    // Markdown horizontal lines
    .replace(/^[-_*]{3,}$/gm, "")

    // Markdown table separators
    .replace(/^\|?[\s|:-]+\|?$/gm, "")

    // Markdown table pipes
    .replace(/\|/g, " ")

    // Backticks
    .replace(/`/g, "")

    // Multiple spaces
    .replace(/[ \t]{2,}/g, " ")

    // Multiple blank lines
    .replace(/\n{3,}/g, "\n\n")

    .trim();
}

// =====================================================
// PDF GENERATION
// =====================================================

function renderReportToPdf(
  analysis: AnalysisDocument,
  reportText: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    // =================================================
    // CONSTANTS
    // =================================================

    const LEFT = 50;
    const RIGHT = 545;
    const CONTENT_WIDTH = RIGHT - LEFT;

    const TEXT = "#1F2937";
    const MUTED = "#6B7280";
    const BORDER = "#D1D5DB";
    const LIGHT = "#F3F4F6";
    const DARK = "#111827";
    const BLUE = "#2563EB";

    // =================================================
    // HELPERS
    // =================================================

    // NOTE: PDFKit remembers the last x/y you passed to `.text()`
    // as the new cursor position for any *following* `.text()` call
    // that doesn't specify its own x. Several helpers below (table
    // cells, summary cards) draw with an explicit x far from the
    // left margin. Without resetting `doc.x` back to LEFT afterward,
    // every subsequent unpositioned `.text()` call inherits that
    // offset and drifts (or runs) off the right edge of the page.
    // Fix: always reset `doc.x = LEFT` before/after such draws.

    function resetCursorX() {
      doc.x = LEFT;
    }

    function ensureSpace(height: number) {
      if (doc.y + height > 735) {
        doc.addPage();
      }
      // A fresh page also resets doc.x correctly, but be defensive
      resetCursorX();
    }

    function sectionTitle(title: string) {
      ensureSpace(45);
      resetCursorX();

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(DARK)
        .text(title, LEFT, doc.y, { width: CONTENT_WIDTH });

      doc.moveDown(0.25);
      resetCursorX();

      doc
        .moveTo(LEFT, doc.y)
        .lineTo(RIGHT, doc.y)
        .strokeColor(BLUE)
        .lineWidth(1.5)
        .stroke();

      doc.moveDown(0.6);
      resetCursorX();

      doc.font("Helvetica");
    }

    function drawLabelValue(
      label: string,
      value: string
    ) {
      resetCursorX();

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(MUTED)
        .text(label.toUpperCase(), LEFT, doc.y, {
          width: CONTENT_WIDTH,
        });

      resetCursorX();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(value, LEFT, doc.y, { width: CONTENT_WIDTH });

      doc.moveDown(0.4);
      resetCursorX();
    }

    function drawSummaryCard(
      x: number,
      y: number,
      width: number,
      title: string,
      value: string
    ) {
      doc
        .roundedRect(x, y, width, 58, 6)
        .fillColor(LIGHT)
        .fill();

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(MUTED)
        .text(title.toUpperCase(), x + 5, y + 10, {
          width: width - 10,
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor(DARK)
        .text(value, x + 5, y + 28, {
          width: width - 10,
          align: "center",
        });
    }

    function drawTableHeader(
      columns: {
        title: string;
        width: number;
      }[]
    ) {
      ensureSpace(35);

      const y = doc.y;

      doc
        .rect(LEFT, y, CONTENT_WIDTH, 26)
        .fillColor(DARK)
        .fill();

      let x = LEFT;

      for (const column of columns) {
        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor("#FFFFFF")
          .text(
            column.title,
            x + 4,
            y + 9,
            {
              width: column.width - 8,
              align: "left",
            }
          );

        x += column.width;
      }

      doc.y = y + 26;
      resetCursorX(); // <-- was missing: cursor was left at the last column's x
    }

    function drawTableRow(
      values: string[],
      columns: {
        title: string;
        width: number;
      }[],
      alternate: boolean
    ) {
      const rowHeight = 30;

      ensureSpace(rowHeight + 5);

      const y = doc.y;

      if (alternate) {
        doc
          .rect(LEFT, y, CONTENT_WIDTH, rowHeight)
          .fillColor("#F9FAFB")
          .fill();
      }

      let x = LEFT;

      values.forEach((value, index) => {
        const width = columns[index].width;

        doc
          .font("Helvetica")
          .fontSize(7.2)
          .fillColor(TEXT)
          .text(cleanReportText(value), x + 4, y + 9, {
            width: width - 8,
            height: rowHeight - 8,
            ellipsis: true,
          });

        x += width;
      });

      doc
        .moveTo(LEFT, y + rowHeight)
        .lineTo(RIGHT, y + rowHeight)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();

      doc.y = y + rowHeight;
      resetCursorX(); // <-- was missing: cursor was left at the last cell's x
    }

    function extractSection(
      text: string,
      start: string,
      end?: string
    ): string {
      const clean = cleanReportText(text);

      const startIndex = clean.indexOf(start);

      if (startIndex === -1) {
        return "";
      }

      const contentStart =
        startIndex + start.length;

      const endIndex = end
        ? clean.indexOf(end, contentStart)
        : -1;

      return clean
        .slice(
          contentStart,
          endIndex === -1
            ? clean.length
            : endIndex
        )
        .trim();
    }

    // =================================================
    // HEADER
    // =================================================

    resetCursorX();

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor(DARK)
      .text("TRACE-X AI", LEFT, doc.y, {
        width: CONTENT_WIDTH,
        align: "center",
      });

    resetCursorX();

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(MUTED)
      .text(
        "Predictive Burn-In Reliability Screening",
        LEFT,
        doc.y,
        {
          width: CONTENT_WIDTH,
          align: "center",
        }
      );

    doc.moveDown(1);
    resetCursorX();

    doc
      .moveTo(LEFT, doc.y)
      .lineTo(RIGHT, doc.y)
      .strokeColor(BORDER)
      .lineWidth(0.7)
      .stroke();

    doc.moveDown(1);
    resetCursorX();

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(DARK)
      .text("BURN-IN SCREENING REPORT", LEFT, doc.y, {
        width: CONTENT_WIDTH,
      });

    doc.moveDown(0.8);
    resetCursorX();

    // =================================================
    // REPORT INFORMATION
    // =================================================

    sectionTitle("Report Information");

    drawLabelValue(
      "Analysis ID",
      analysis.analysis_id
    );

    drawLabelValue(
      "Source File",
      analysis.file_name
    );

    drawLabelValue(
      "Generated",
      new Date().toLocaleString()
    );

    drawLabelValue(
      "Time Points",
      String(analysis.batch.timePoints)
    );

    // =================================================
    // EXECUTIVE SUMMARY
    // =================================================

    sectionTitle("Executive Summary");

    const summary = analysis.summary;

    const cardGap = 8;

    const cardWidth =
      (CONTENT_WIDTH - cardGap * 4) / 5;

    const cardY = doc.y;

    drawSummaryCard(
      LEFT,
      cardY,
      cardWidth,
      "Components",
      String(summary.total_components)
    );

    drawSummaryCard(
      LEFT + cardWidth + cardGap,
      cardY,
      cardWidth,
      "Normal",
      String(summary.normal)
    );

    drawSummaryCard(
      LEFT + (cardWidth + cardGap) * 2,
      cardY,
      cardWidth,
      "Suspicious",
      String(summary.suspicious)
    );

    drawSummaryCard(
      LEFT + (cardWidth + cardGap) * 3,
      cardY,
      cardWidth,
      "High Risk",
      String(summary.high_risk)
    );

    drawSummaryCard(
      LEFT + (cardWidth + cardGap) * 4,
      cardY,
      cardWidth,
      "Anomaly Rate",
      `${summary.anomaly_rate}%`
    );

    doc.y = cardY + 75;
    resetCursorX(); // <-- was missing: cursor was left inside the last card

    // =================================================
    // BATCH RISK OVERVIEW
    // =================================================

    sectionTitle("1. Batch Risk Overview");

    const overview = extractSection(
      reportText,
      "1. Overall risk picture",
      "2. Lot"
    );

    if (overview) {
      resetCursorX();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(overview, LEFT, doc.y, {
          width: CONTENT_WIDTH,
          lineGap: 4,
        });

      doc.moveDown(0.8);
      resetCursorX();
    }

    // =================================================
    // LOT LEVEL RISK
    // =================================================

    sectionTitle("2. Lot-Level Risk");

    const lotMap = new Map<
      string,
      {
        total: number;
        flagged: number;
      }
    >();

    analysis.components_detail.forEach(
      (component) => {
        const existing =
          lotMap.get(component.lot_id) || {
            total: 0,
            flagged: 0,
          };

        existing.total++;

        if (
          component.risk.decision !== "PASS"
        ) {
          existing.flagged++;
        }

        lotMap.set(
          component.lot_id,
          existing
        );
      }
    );

    const lotColumns = [
      {
        title: "LOT",
        width: 70,
      },
      {
        title: "SCREENED",
        width: 85,
      },
      {
        title: "FLAGGED",
        width: 80,
      },
      {
        title: "FLAG RATE",
        width: 85,
      },
      {
        title: "OBSERVATION",
        width: 175,
      },
    ];

    drawTableHeader(lotColumns);

    let lotIndex = 0;

    lotMap.forEach((lot, lotId) => {
      const flagRate =
        lot.total === 0
          ? 0
          : (lot.flagged / lot.total) * 100;

      let observation =
        "No flagged components";

      if (
        lot.flagged === lot.total &&
        lot.total > 0
      ) {
        observation =
          "All components flagged";
      } else if (lot.flagged > 1) {
        observation =
          "Multiple components flagged";
      } else if (lot.flagged === 1) {
        observation =
          "Isolated flagged component";
      }

      drawTableRow(
        [
          lotId,
          String(lot.total),
          String(lot.flagged),
          `${flagRate.toFixed(1)}%`,
          observation,
        ],
        lotColumns,
        lotIndex % 2 === 1
      );

      lotIndex++;
    });

    doc.moveDown(0.8);
    resetCursorX();

    // =================================================
    // FLAGGED COMPONENTS
    // =================================================

    sectionTitle("3. Flagged Components");

    const flaggedComponents =
      getFlaggedComponents(analysis);

    if (flaggedComponents.length === 0) {
      resetCursorX();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(
          "No components were flagged in this screening.",
          LEFT,
          doc.y,
          { width: CONTENT_WIDTH }
        );
    } else {
      const componentColumns = [
        {
          title: "COMPONENT",
          width: 65,
        },
        {
          title: "LOT",
          width: 35,
        },
        {
          title: "RISK",
          width: 50,
        },
        {
          title: "ANOMALY",
          width: 65,
        },
        {
          title: "DRIFT",
          width: 70,
        },
        {
          title: "168H LEAK.",
          width: 100,
        },
        {
          title: "DECISION",
          width: 110,
        },
      ];

      drawTableHeader(
        componentColumns
      );

      flaggedComponents.forEach(
        (component, index) => {
          const leakage =
            component.prediction
              .predicted_168h?.Leakage;

          const decision =
            component.risk.decision ===
            "EARLY_REJECT"
              ? "EARLY REJECT"
              : "REVIEW";

          drawTableRow(
            [
              component.component_id,
              component.lot_id,
              component.risk.score.toFixed(1),
              component.anomaly.score.toFixed(2),
              `${component.drift.percentage_change.toFixed(
                1
              )}%`,
              leakage !== undefined
                ? `${Number(leakage).toFixed(
                    2
                  )} uA`
                : "N/A",
              decision,
            ],
            componentColumns,
            index % 2 === 1
          );
        }
      );
    }

    resetCursorX();

    // =================================================
    // AI RELIABILITY ASSESSMENT
    // =================================================

    sectionTitle(
      "4. AI Reliability Assessment"
    );

    const aiAssessment = extractSection(
      reportText,
      "1. Overall risk picture",
      "2. Lot"
    );

    const lotAssessment = extractSection(
      reportText,
      "2. Lot",
      "3. Per"
    );

    const assessmentText = [
      aiAssessment,
      lotAssessment,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (assessmentText) {
      resetCursorX();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(assessmentText, LEFT, doc.y, {
          width: CONTENT_WIDTH,
          lineGap: 4,
        });
    }

    resetCursorX();

    // =================================================
    // RECOMMENDED ACTIONS
    // =================================================

    sectionTitle(
      "5. Recommended Actions"
    );

    const recommendations =
      extractSection(
        reportText,
        "4. Recommended next actions"
      );

    if (recommendations) {
      const cleanedRecommendations =
        cleanReportText(
          recommendations
        );

      const lines =
        cleanedRecommendations
          .split(/\n(?=\d+\.)/)
          .map((line) => line.trim())
          .filter(Boolean);

      lines.forEach((line) => {
        ensureSpace(30);
        resetCursorX();

        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(TEXT)
          .text(line, LEFT, doc.y, {
            width: CONTENT_WIDTH,
            lineGap: 3,
          });

        doc.moveDown(0.4);
        resetCursorX();
      });
    }

    // =================================================
    // DISCLAIMER
    // =================================================

    ensureSpace(80);

    doc.moveDown(0.5);

    const disclaimerY = doc.y;

    doc
      .roundedRect(
        LEFT,
        disclaimerY,
        CONTENT_WIDTH,
        58,
        5
      )
      .fillColor("#F9FAFB")
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(DARK)
      .text(
        "IMPORTANT",
        LEFT + 10,
        disclaimerY + 10
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "This report reflects the data supplied to TRACE-X AI. " +
          "The screening system is an AI-assisted MVP/demo " +
          "and should not be treated as a certified reliability classifier.",
        LEFT + 10,
        disclaimerY + 25,
        {
          width: CONTENT_WIDTH - 20,
          lineGap: 2,
        }
      );

    // =================================================
    // SAFE FOOTERS
    // =================================================

    // We use buffered pages so adding a footer never
    // triggers another page and therefore avoids the
    // previous maximum call stack error.

    const range = doc.bufferedPageRange();

    for (
      let i = range.start;
      i < range.start + range.count;
      i++
    ) {
      doc.switchToPage(i);

      doc
        .moveTo(LEFT, 770)
        .lineTo(RIGHT, 770)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          "Generated by TRACE-X AI | Predictive Burn-In Reliability Screening System",
          LEFT,
          778,
          {
            width: CONTENT_WIDTH,
            align: "center",
          }
        );

      doc
        .fontSize(7)
        .text(
          `Page ${i + 1}`,
          RIGHT - 45,
          792,
          {
            width: 45,
            align: "right",
          }
        );
    }

    // =================================================
    // FINISH
    // =================================================

    doc.end();
  });
}

// =====================================================
// UPLOAD PDF TO CLOUDINARY
// =====================================================

function uploadReportPdf(
  buffer: Buffer,
  analysisId: string
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "tracex/reports",
          public_id: `${analysisId}-report-${Date.now()}`,
          format: "pdf",
        },

        (error, result) => {
          if (error || !result) {
            reject(
              new ReportGenerationError(
                `Failed to upload report PDF: ${
                  error?.message ??
                  "unknown error"
                }`,
                "REPORT_GENERATION_FAILED",
                502
              )
            );

            return;
          }

          resolve({
            secure_url: result.secure_url,
          });
        }
      );

    stream.end(buffer);
  });
}

// =====================================================
// PUBLIC ENTRY POINT
// =====================================================

export async function generateReport(
  analysisId: string
): Promise<{
  report_url: string;
  generated_at: string;
}> {
  const analysis =
    await getAnalysisById(analysisId);

  if (!analysis) {
    throw new ReportGenerationError(
      `No analysis found with id ${analysisId}`,
      "ANALYSIS_NOT_FOUND",
      404
    );
  }

  const flagged =
    getFlaggedComponents(analysis);

  const prompt =
    buildReportPrompt(
      analysis,
      flagged
    );

  const reportText =
    await callGroq(prompt);

  const pdfBuffer =
    await renderReportToPdf(
      analysis,
      reportText
    );

  const { secure_url } =
    await uploadReportPdf(
      pdfBuffer,
      analysisId
    );

  const generatedAt =
    new Date();

  await attachReportToAnalysis(
    analysisId,
    secure_url,
    generatedAt
  );

  return {
    report_url: secure_url,
    generated_at:
      generatedAt.toISOString(),
  };
}