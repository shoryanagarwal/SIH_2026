import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScreeningHistory } from "../api/screening.api.js";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getScreeningHistory();
        setHistory(response.analyses || []);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-slate-400">
        Loading history...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Screening History
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          View previous screening reports
        </p>
      </div>

      <div className="space-y-3">
        {history.map((report) => (
          <button
            key={report.analysis_id}
            onClick={() =>
              navigate(`/history/${report.analysis_id}`)
            }
            className="w-full rounded-xl border
            border-slate-700/50 bg-slate-900/60
            p-5 text-left transition
            hover:border-blue-400/30
            hover:bg-slate-800/70"
          >
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-sm font-medium text-white">
                  {report.file_name}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>

              <span className="text-slate-500">
                →
              </span>

            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default History;