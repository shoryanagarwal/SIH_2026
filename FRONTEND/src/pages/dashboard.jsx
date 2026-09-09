import bgImage from "../assets/image.png";
import AnomalyDriftChart from "../components/anomalyDriftChart.jsx";
import ScreeningPieChart from "../components/screeningPieChart.jsx";
import ScreeningTable from "../components/screeningTable.jsx";
import QuickActions from "../components/quickActions.jsx";
import ModelPerformance from "../components/modelPerformance.jsx";
import BatchSummary from "../components/batchSummary.jsx";
import StatCard from "../components/StatCard.jsx"
import Header from "../components/Header.jsx";


function Dashboard() {
  const anomalyDriftData = [
  {
    hour: "0h",
    anomalyScore: 1.2,
    predictedDrift: 0.0008,
  },
  {
    hour: "24h",
    anomalyScore: 1.5,
    predictedDrift: 0.0011,
  },
  {
    hour: "48h",
    anomalyScore: 1.8,
    predictedDrift: 0.0015,
  },
  {
    hour: "96h",
    anomalyScore: 2.4,
    predictedDrift: 0.0022,
  },
  {
    hour: "168h",
    anomalyScore: 3.1,
    predictedDrift: 0.0030,
  },
  {
    hour: "220h",
    anomalyScore: 2.8,
    predictedDrift: 0.0027,
  },
  {
    hour: "250h",
    anomalyScore: 4.2,
    predictedDrift: 0.0038,
  },
  {
    hour: "320h",
    anomalyScore: 4.8,
    predictedDrift: 0.0046,
  },
  {
    hour: "380h",
    anomalyScore: 6.1,
    predictedDrift: 0.0058,
  },
  {
    hour: "440h",
    anomalyScore: 7.4,
    predictedDrift: 0.0069,
  },
  {
    hour: "520h",
    anomalyScore: 8.6,
    predictedDrift: 0.0078,
  },
  {
    hour: "600h",
    anomalyScore: 10.2,
    predictedDrift: 0.0091,
  },
];

const screeningStatusData = [
  {
    name: "Normal",
    value: 4120,
  },
  {
    name: "Suspicious",
    value: 326,
  },
  {
    name: "High Risk",
    value: 554,
  },
];

const screeningData = [
  {
    componentId: "CMP-0001",
    lotId: "LOT-01",
    anomalyScore: 1.82,
    predictedDrift: 0.0014,
    risk: "LOW",
    status: "NORMAL",
  },
  {
    componentId: "CMP-0042",
    lotId: "LOT-01",
    anomalyScore: 3.91,
    predictedDrift: 0.0038,
    risk: "MEDIUM",
    status: "FLAGGED",
  },
  {
    componentId: "CMP-0127",
    lotId: "LOT-02",
    anomalyScore: 5.24,
    predictedDrift: 0.0061,
    risk: "HIGH",
    status: "FLAGGED",
  },
  {
    componentId: "CMP-0214",
    lotId: "LOT-03",
    anomalyScore: 1.35,
    predictedDrift: 0.0011,
    risk: "LOW",
    status: "NORMAL",
  },
];
const modelPerformanceData = [
  {
    title: "Anomaly Detection F1",
    value: "0.96",
    label: "Excellent",
    progress: 96,
  },
  {
    title: "Drift Prediction MAE",
    value: "0.0479 V",
    label: "Low Error",
    progress: 92,
  },
  {
    title: "False Negative Rate",
    value: "0.42%",
    label: "Very Low",
    progress: 99,
  },
  {
    title: "Explainability Score",
    value: "0.92",
    label: "High",
    progress: 92,
  },
];
const batchSummaryData = {
  totalBatches: 50,
  componentsScreened: 5000,
  parametersTracked: 3,
  timePoints: "0h, 24h, 48h, 96h, 168h",
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

        </section>
        {/* KPI Cards */}
<section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

  <StatCard
    title="Total Components"
    value="5,000"
    percentage="8.2% screened"
    type="blue"
  />

  <StatCard
    title="Normal"
    value="4,120"
    percentage="82.4%"
    type="green"
  />

  <StatCard
    title="Suspicious"
    value="326"
    percentage="6.5%"
    type="yellow"
  />

  <StatCard
    title="High Risk"
    value="554"
    percentage="11.1%"
    type="red"
  />

  <StatCard
    title="Anomaly Rate"
    value="11.7%"
    percentage="↑ 2.4%"
    type="purple"
  />
</section> 
<section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">

  {/* Combined Anomaly + Drift Chart */}
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
      <div className="rounded-2xl border p-6 ">

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
  <div className="rounded-2xl border p-6 ">

    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-100">
        Quick Actions
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Manage screening, data and model operations
      </p>
    </div>

    <QuickActions />

  </div>
</section>
{/* Model Performance + Batch Summary */}
<section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">

  {/* Model Performance */}
<div className="flex min-h-[230px] flex-col rounded-2xl border p-6 ">
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-100">
        Model Performance
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Current performance of anomaly detection and drift prediction models
      </p>
    </div>

    <ModelPerformance data={modelPerformanceData} />

  </div>


  {/* Batch Summary */}
  <div className="rounded-2xl border p-6 ">

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