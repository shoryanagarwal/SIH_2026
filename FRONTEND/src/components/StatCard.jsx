function StatCard({ title, value, percentage, type }) {
  const styles = {
    blue: {
      border: "border-blue-400/20",
      icon: "bg-blue-500/15 text-blue-400",
      percentage: "text-blue-400",
    },
    green: {
      border: "border-emerald-400/20",
      icon: "bg-emerald-500/15 text-emerald-400",
      percentage: "text-emerald-400",
    },
    yellow: {
      border: "border-yellow-400/20",
      icon: "bg-yellow-500/15 text-yellow-400",
      percentage: "text-yellow-400",
    },
    red: {
      border: "border-red-400/20",
      icon: "bg-red-500/15 text-red-400",
      percentage: "text-red-400",
    },
    purple: {
      border: "border-purple-400/20",
      icon: "bg-purple-500/15 text-purple-400",
      percentage: "text-purple-400",
    },
  };

  const style = styles[type] || styles.blue;

  return (
    <div
      className={`min-h-[145px] rounded-2xl border ${style.border}
      bg-slate-900/70 p-5 backdrop-blur-xl
      transition duration-200 hover:-translate-y-1`}
    >
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center
          rounded-full text-lg ${style.icon}`}
        >
          ●
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-xs text-slate-400">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-slate-100">
            {value}
          </h2>

          <span className={`mt-2 inline-block text-xs ${style.percentage}`}>
            ↑ {percentage}
          </span>
        </div>

      </div>
    </div>
  );
}

export default StatCard;