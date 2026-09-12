import bgImage from "../assets/image.png";
import AnomalyDriftChart from "../components/anomalyDriftChart.jsx";
import ScreeningPieChart from "../components/screeningPieChart.jsx";
import ScreeningTable from "../components/screeningTable.jsx";
import QuickActions from "../components/quickActions.jsx";
import ModelPerformance from "../components/modelPerformance.jsx";
import BatchSummary from "../components/batchSummary.jsx";
import StatCard from "../components/StatCard.jsx";
import Header from "../components/Header.jsx";
import { useEffect, useState } from "react";

import {
  getScreeningHistory,
  getScreeningById,
} from "../api/screening.api.js";

function Dashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const historyResponse = await getScreeningHistory();

        const analyses = historyResponse.analyses || [];

        if (analyses.length === 0) {
          setAnalysis(null);
          return;
        }

        // History is already sorted latest first
        const latestAnalysisId = analyses[0].analysis_id;

        const detailResponse =
          await getScreeningById(latestAnalysisId);

        setAnalysis(detailResponse.analysis || null);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        setError(error.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const anomalyDriftData = analysis?.chart_data || [];

  const screeningStatusData = analysis?.distribution || [];

  const screeningData = analysis?.components || [];

  const modelPerformanceData =
    analysis?.model_performance || [];

  const batchSummaryData = analysis?.batch || {
    totalBatches: 0,
    componentsScreened: 0,
    parametersTracked: 0,
    timePoints: "",
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(2, 8, 23, 0.55),
            rgba(2, 8, 23, 0.72)
          ),
          url(${bgImage})
        `,
      }}
    >
      <div className="min-h-screen px-10 py-7">
        <Header />

        {/* Dashboard Heading */}
        <section className="mt-8">
          <h1 className="text-3xl font-semibold text-slate-100">
            Screening Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor component health, anomalies and predicted degradation.
          </p>

          {loading && (
            <div className="mt-8 rounded-xl border border-slate-700 p-6 text-center text-slate-400">
              Loading screening analysis...
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && !analysis && (
            <div className="mt-8 rounded-xl border border-slate-700 p-6 text-center text-slate-400">
              No screening analysis available yet.
            </div>
          )}
        </section>

        {/* KPI Cards */}
        <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {analysis?.stat_cards?.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              percentage={card.percentage}
              type={card.type}
            />
          ))}
        </section>

        {/* Charts */}
        <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Anomaly + Drift */}
          <div className="rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Anomaly & Predicted Drift
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Dynamic anomaly detection and future degradation trend
              </p>
            </div>

            <AnomalyDriftChart data={anomalyDriftData} />
          </div>

          {/* Screening Distribution */}
          <div className="rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Screening Distribution
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current component health and risk distribution
              </p>
            </div>

            <ScreeningPieChart data={screeningStatusData} />
          </div>
        </section>

        {/* Component Screening Overview */}
        <section className="mt-8">
          <div className="rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Component Screening Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                AI-based component health and risk assessment
              </p>
            </div>

            <ScreeningTable data={screeningData} />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <div className="rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Manage screening, data and model operations
              </p>
            </div>

            {/* IMPORTANT: pass latest analysis */}
            <QuickActions analysis={analysis} />
          </div>
        </section>

        {/* Model Performance + Batch Summary */}
        <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Model Performance */}
          <div className="flex min-h-[230px] flex-col rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Model Performance
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current performance of anomaly detection and drift
                prediction models
              </p>
            </div>

            <ModelPerformance data={modelPerformanceData} />
          </div>

          {/* Batch Summary */}
          <div className="rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-100">
                Batch Summary
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Overview of the current screening dataset
              </p>
            </div>

            <BatchSummary data={batchSummaryData} />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-700/30 py-8">
        <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
          <div>
            <p className="text-sm font-semibold text-slate-300">
              TRACE-X <span className="text-blue-400">AI</span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              AI-Driven Component Anomaly Detection
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Smart Automation • High-Reliability Screening
          </div>

          <p className="text-xs text-slate-500">
            © 2026 TRACE-X AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;