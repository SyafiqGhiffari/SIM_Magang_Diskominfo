const StatsGrid = ({ cards, isDark = false }) => (
  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {cards.map((c, i) => (
      <div
        key={i}
        className={`rounded-2xl border shadow-sm p-6 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        }`}
      >
        <div>
          <p className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.title}</p>
          <h3 className={`mt-2 text-2xl font-black ${isDark ? "text-slate-100" : "text-slate-900"}`}>{c.value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isDark ? (c.darkBg || "bg-white/10 text-slate-200") : `${c.bg} ${c.text}`}`}>
          <c.icon className="w-[22px] h-[22px]" />
        </div>
      </div>
    ))}
  </div>
);

export default StatsGrid;