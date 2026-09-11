import { useState } from "react";
import DataUpload from "./dataUpload.jsx";
import { useNavigate } from "react-router-dom";



function QuickActions() {
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();
  const actions = [
  {
    title: "Upload Data",
    description: "Upload CSV file",
    icon: "↑",
    type: "upload",
  },
  {
    title: "Generate Report",
    description: "AI-powered report",
    icon: "▣",
    type: "report",
  },
  {
    title: "Model Insights",
    description: "View model performance",
    icon: "✦",
    type: "insights",
  },
  {
    title: "History",
    description: "View previous screenings",
    icon: "◷",
    type: "history",
  },
];



 const handleAction = (type) => {
  if (type === "history") {
    navigate("/history");
    return;
  }

  console.log(`Quick Action: ${type}`);
};

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {actions.map((action) => {
          if (action.type === "upload") {
            return (
              <button
                key={action.type}
                onClick={() => setShowUpload(true)}
                className="group rounded-xl border border-blue-400/15
                bg-slate-900/60 p-5 text-left backdrop-blur-xl
                transition duration-200
                hover:-translate-y-1 hover:border-blue-400/30
                hover:bg-slate-800/70"
              >
                <div className="flex items-start justify-between">

                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-lg text-blue-400">
                      {action.icon}
                    </div>

                    <h3 className="text-sm font-medium text-slate-100">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {action.description}
                    </p>
                  </div>

                  <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400">
                    →
                  </span>

                </div>
              </button>
            );
          }

          return (
            <button
              key={action.type}
              onClick={() => handleAction(action.type)}
              className="group rounded-xl border border-blue-400/15
              bg-slate-900/60 p-5 text-left backdrop-blur-xl
              transition duration-200
              hover:-translate-y-1 hover:border-blue-400/30
              hover:bg-slate-800/70"
            >
              <div className="flex items-start justify-between">

                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-lg text-blue-400">
                    {action.icon}
                  </div>

                  <h3 className="text-sm font-medium text-slate-100">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {action.description}
                  </p>
                </div>

                <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400">
                  →
                </span>

              </div>
            </button>
          );
        })}

      </div>

      {/* Upload Modal */}
      {showUpload && (
        <DataUpload
          onClose={() => setShowUpload(false)}
        />
      )}
     
    </>
  );
}

export default QuickActions;