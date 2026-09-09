import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function AnomalyDriftChart({ data }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
         
        >
          <CartesianGrid
            strokeDasharray="3 3"
           
          />

          <XAxis
            dataKey="hour"
            
           
          />

          {/* Anomaly Score */}
          <YAxis
            yAxisId="anomaly"
            
          />

          {/* Predicted Drift */}
          <YAxis
            yAxisId="drift"
           
          />

          <Tooltip
            
          />

          <Legend
           
          />

          <Line
            yAxisId="anomaly"
            type="monotone"
            dataKey="anomalyScore"
            name="Anomaly Score"
            stroke="#8884f8"
            
          />

          <Line
            yAxisId="drift"
            type="monotone"
            dataKey="predictedDrift"
            name="Predicted Drift"
            stroke="#82ca9d"
            
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnomalyDriftChart;
