import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScreeningHistory } from "../api/screening.api.js";

import bgImage from "../assets/image.png";

// Key used to remember which reports the user has "deleted"
// from their own view. Backend data is never touched — we
// just filter these ids out on the frontend.
const HIDDEN_KEY = "tracex_hidden_history_ids";

function getHiddenIds() {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addHiddenId(id) {
  const current = getHiddenIds();
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(current));
  }
}

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getScreeningHistory();
        const hiddenIds = getHiddenIds();

        const visible = (response.analyses || []).filter(
          (report) => !hiddenIds.includes(report.analysis_id)
        );

        setHistory(visible);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDelete = (e, analysisId) => {
    // Stop the click from bubbling up to the card's onClick (navigate)
    e.stopPropagation();

    const confirmed = window.confirm(
      "Remove this report from your history? It will stay saved on the server, just hidden here."
    );

    if (!confirmed) return;

    // Only hide it on the frontend — backend data stays untouched
    addHiddenId(analysisId);

    setHistory((prev) =>
      prev.filter((report) => report.analysis_id !== analysisId)
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed p-8 text-slate-400"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        Loading history...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-8 text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Screening History
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          View previous screening reports
        </p>
      </div>

      <div className="space-y-3">
        {history.length === 0 && (
          <p className="text-sm text-slate-500">
            No screening history yet.
          </p>
        )}

        {history.map((report) => (
          <div
            key={report.analysis_id}
            onClick={() =>
              navigate(`/history/${report.analysis_id}`)
            }
            className="group w-full cursor-pointer rounded-xl border
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

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) =>
                    handleDelete(e, report.analysis_id)
                  }
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 opacity-0 transition
                  hover:bg-red-500/20
                  group-hover:opacity-100"
                >
                  Delete
                </button>

                <span className="text-slate-500">
                  →
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;