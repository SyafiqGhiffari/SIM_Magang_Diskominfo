const StatCard = ({ icon: Icon, label, value, sub, badge, badgeColor, progress, progressLabel, accentFrom, accentTo, isDark = false }) => (
  <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
  }`}>
    <div
      className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-all duration-300 group-hover:scale-125 ${
        isDark ? "opacity-[0.16] group-hover:opacity-[0.25]" : "opacity-[0.08] group-hover:opacity-[0.15]"
      }`}
      style={{ background: `linear-gradient(135deg, ${accentFrom || "#0B1442"}, ${accentTo || "#00A5EC"})` }}
    />

    <div className="relative flex items-start justify-between mb-3">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `linear-gradient(135deg, ${accentFrom || "#0B1442"}, ${accentTo || "#00A5EC"})` }}
      >
        <Icon className="w-5 h-5" />
      </span>
      {badge && (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
          badgeColor || (isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600")
        }`}>
          {badge}
        </span>
      )}
    </div>

    <p className="relative text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <h3 className={`relative mt-1 text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{value}</h3>
    {sub && <p className={`relative mt-1 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>}

    {progress !== undefined && (
      <div className="relative mt-4">
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentFrom || "#0B1442"}, ${accentTo || "#00A5EC"})` }}
          />
        </div>
        <p className={`mt-1.5 text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{progressLabel}</p>
      </div>
    )}
  </div>
);

export default StatCard;