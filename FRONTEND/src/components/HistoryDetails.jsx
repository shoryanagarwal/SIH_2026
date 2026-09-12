import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getScreeningById,
  generateReport,
} from "../api/screening.api.js";

import bgImage from "../assets/image.png";

function HistoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [reportUrl, setReportUrl] =
    useState(null);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD ANALYSIS
  // ==========================================

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getScreeningById(id);

        const data = response.analysis;

        setAnalysis(data);

        // If report was already generated earlier
        if (data?.report_url) {
          setReportUrl(data.report_url);
        }
      } catch (error) {
        console.error(
          "Failed to load analysis:",
          error
        );

        setError(
          error.message ||
            "Failed to load analysis"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id]);

  // ==========================================
  // GENERATE REPORT
  // ==========================================

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      setError("");

      const response =
        await generateReport(id);

      console.log(
        "Report generated:",
        response
      );

      setReportUrl(
        response.report_url
      );
    } catch (error) {
      console.error(
        "Failed to generate report:",
        error
      );

      setError(
        error.message ||
          "Failed to generate report"
      );
    } finally {
      setReportLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed p-8 text-slate-400"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        Loading report...
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!analysis) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed p-8 text-red-400"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        <button
          onClick={() =>
            navigate("/history")
          }
          className="mb-6 text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to History
        </button>

        <p>
          {error || "Report not found."}
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-8 text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Back */}
        <button
          onClick={() =>
            navigate("/history")
          }
          className="mb-6 text-sm text-blue-400 transition hover:text-blue-300"
        >
          ← Back to History
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">
            {analysis.file_name}
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Analysis ID:{" "}
            {analysis.analysis_id}
          </p>
        </div>

        {/* ======================================
            REPORT GENERATION
        ====================================== */}

        <div className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-900/70 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Screening Report
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Generate an AI-powered screening report
              </p>
            </div>

            <div>

              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
                >
                  View Report
                </a>
              ) : (
                <button
                  onClick={
                    handleGenerateReport
                  }
                  disabled={
                    reportLoading
                  }
                  className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reportLoading
                    ? "Generating..."
                    : "Generate Report"}
                </button>
              )}

            </div>
          </div>

          {/* Loading message */}

          {reportLoading && (
            <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              Generating report using AI...
              Please wait.
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

        </div>

        {/* ======================================
            SUMMARY CARDS
        ====================================== */}

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* Total */}

          <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-400">
              Total Components
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {analysis.summary
                ?.total_components || 0}
            </p>
          </div>

          {/* Normal */}

          <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-400">
              Normal
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-400">
              {analysis.summary
                ?.normal || 0}
            </p>
          </div>

          {/* Suspicious */}

          <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-400">
              Suspicious
            </p>

            <p className="mt-2 text-2xl font-semibold text-yellow-400">
              {analysis.summary
                ?.suspicious || 0}
            </p>
          </div>

          {/* High Risk */}

          <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-400">
              High Risk
            </p>

            <p className="mt-2 text-2xl font-semibold text-red-400">
              {analysis.summary
                ?.high_risk || 0}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default HistoryDetails;