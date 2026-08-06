const LandingStats = ({ cards, isDark }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((c, i) => (
      <div
        key={i}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
          isDark
            ? "border-white/10 bg-[#0f172a]"
            : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
        }`}
      >
        <div
          className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
            isDark ? "opacity-[0.18] group-hover:opacity-[0.28]" : "opacity-[0.3] group-hover:opacity-[0.4]"
          }`}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {c.label}
            </p>
            <h3 className={`mt-1.5 text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              {c.value}
            </h3>
            <p className={`mt-2 truncate text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {c.caption}
            </p>
          </div>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${
              isDark ? "bg-white/5 text-slate-300" : `${c.iconBg} ${c.iconColor}`
            }`}
          >
            <c.icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
        </div>
        <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
      </div>
    ))}
  </div>
);

export default LandingStats;