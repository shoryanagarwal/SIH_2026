function BatchSummary({ data }) {
  const items = [
    {
      title: "Total Batches",
      value: data.totalBatches,
      icon: "▦",
    },
    {
      title: "Components Screened",
      value: data.componentsScreened,
      icon: "◉",
    },
    {
      title: "Parameters Tracked",
      value: data.parametersTracked,
      icon: "⌁",
    },
    {
      title: "Time Points",
      value: data.timePoints,
      icon: "◷",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-slate-700/40
          bg-slate-900/50 p-5 backdrop-blur-md
          transition duration-200 hover:border-blue-400/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {item.title}
            </p>

            <span className="text-blue-400">
              {item.icon}
            </span>
          </div>

          <h3 className="mt-3 text-2xl font-semibold text-slate-100">
            {item.value}
          </h3>
        </div>
      ))}

    </div>
  );
}

export default BatchSummary;