import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getScreeningById } from "../api/screening.api.js";

function HistoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const response = await getScreeningById(id);
        setAnalysis(response.analysis);
      } catch (error) {
        console.error("Failed to load analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        Loading report...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-red-400">
        Report not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">

      <button
        onClick={() => navigate("/history")}
        className="mb-6 text-sm text-blue-400 hover:text-blue-300"
      >
        ← Back to History
      </button>

      <h1 className="text-2xl font-semibold">
        {analysis.file_name}
      </h1>

      <p className="mt-1 text-sm text-slate-400">
        Analysis ID: {analysis.analysis_id}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

        <div className="rounded-xl bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">
            Total Components
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {analysis.summary?.total_components || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">
            Normal
          </p>

          <p className="mt-2 text-2xl font-semibold text-green-400">
            {analysis.summary?.normal || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">
            Suspicious
          </p>

          <p className="mt-2 text-2xl font-semibold text-yellow-400">
            {analysis.summary?.suspicious || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">
            High Risk
          </p>

          <p className="mt-2 text-2xl font-semibold text-red-400">
            {analysis.summary?.high_risk || 0}
          </p>
        </div>

      </div>

    </div>
  );
}

export default HistoryDetails;