function ScreeningTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 text-xs text-slate-400">
            <th className="px-4 py-3">Component ID</th>
            <th className="px-4 py-3">Lot ID</th>
            <th className="px-4 py-3">Anomaly Score</th>
            <th className="px-4 py-3">Predicted Drift</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.componentId}
              className="border-b border-slate-800/50 transition hover:bg-slate-800/30"
            >
              <td className="px-4 py-4 font-medium text-slate-200">
                {item.componentId}
              </td>

              <td className="px-4 py-4 text-slate-400">
                {item.lotId}
              </td>

              <td className="px-4 py-4 text-blue-400">
                {item.anomalyScore}
              </td>

              <td className="px-4 py-4 text-purple-400">
                {item.predictedDrift}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    item.risk === "HIGH"
                      ? "bg-red-500/10 text-red-400"
                      : item.risk === "MEDIUM"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {item.risk}
                </span>
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    item.status === "FLAGGED"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScreeningTable;