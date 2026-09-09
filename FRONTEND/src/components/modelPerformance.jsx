function ModelPerformance({ data }) {
  const changes = ["↑ 0.02", "↓ 0.18", "↓ 0.12%", "↑ 0.03"];

  return (
    <div className="grid flex-1 grid-cols-4 items-center">

      {data.map((item, index) => (
        <div
          key={item.title}
          className={`min-w-0 px-4 ${
            index !== 0 ? "border-l border-blue-400/15" : ""
          }`}
        >
          {/* Metric Name */}
          <p className="whitespace-nowrap text-[11px] text-slate-400">
            {item.title}
          </p>

          {/* Value + Change */}
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`text-2xl font-semibold ${
                index === 0
                  ? "text-emerald-400"
                  : "text-slate-100"
              }`}
            >
              {item.value}
            </span>

            <span className="whitespace-nowrap text-xs font-medium text-emerald-400">
              {changes[index]}
            </span>
          </div>

        </div>
      ))}

    </div>
  );
}

export default ModelPerformance;