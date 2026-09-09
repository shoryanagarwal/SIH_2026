import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function DriftChart({ data }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.12)"
          />

          <XAxis
            dataKey="hour"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />

          <Line
            type="monotone"
            dataKey="actual"
            strokeWidth={2}
            dot={false}
            name="Actual"
          />

          <Line
            type="monotone"
            dataKey="predicted"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="Predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DriftChart;