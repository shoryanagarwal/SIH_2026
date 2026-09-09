import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function ScreeningPieChart({ data }) {
  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-[320px] w-full items-center">

      {/* Donut Chart */}
      <div className="h-full w-[52%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={105}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#020817",
                border: "1px solid rgba(96,165,250,0.25)",
                borderRadius: "10px",
                color: "#fff",
              }}
            />

            {/* Center Text */}
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f8fafc"
              fontSize="24"
              fontWeight="600"
            >
              {total.toLocaleString()}
            </text>

            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize="11"
            >
              Total
            </text>

          </PieChart>
        </ResponsiveContainer>
      </div>


      {/* Legend */}
      <div className="flex w-[48%] flex-col justify-center gap-5 pr-2">

        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);

          return (
            <div
              key={item.name}
              className="flex items-center justify-between"
            >

              <div className="flex items-center gap-3">

                <span
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor: COLORS[index],
                  }}
                />

                <span className="text-sm text-slate-300">
                  {item.name}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-sm font-medium text-slate-200">
                  {item.value.toLocaleString()}
                </span>

                <span
                  className="w-12 text-right text-xs font-medium"
                  style={{
                    color: COLORS[index],
                  }}
                >
                  {percentage}%
                </span>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default ScreeningPieChart;