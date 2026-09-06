const LandingStats = ({ cards, isDark }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
    {cards.map((c, i) => (
      <div
        key={i}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 p-3 sm:p-4.5 flex flex-col justify-between ${
          isDark
            ? "border-white/10 bg-[#161b22]"
            : `border-slate-200 bg-gradient-to-br ${c.lightGradient} shadow-sm`
        }`}
      >
        <div
          className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
            isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
          }`}
        />
        <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {c.label}
            </p>
            <h3 className={`mt-1 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              {c.value}
            </h3>
            <p className={`mt-1 sm:mt-1.5 text-[9px] sm:text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-400"}`}>
              <span className="inline sm:hidden truncate">{c.mobileCaption || c.caption}</span>
              <span className="hidden sm:inline break-words line-clamp-2 leading-snug">{c.caption}</span>
            </p>
          </div>
          <span
            className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${
              isDark ? (c.iconBgDark || "bg-slate-800 text-slate-300") : `${c.iconBg} ${c.iconColor}`
            }`}
          >
            <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
          </span>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
      </div>
    ))}
  </div>
);

export default LandingStats;