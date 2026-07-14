const StatCard = ({ icon: Icon, label, value, sub, badge, badgeColor, progress, progressLabel }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="w-4 h-4" />
      </span>
      {badge && (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${badgeColor || "bg-emerald-50 text-emerald-600"}`}>
          {badge}
        </span>
      )}
    </div>
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <h3 className="mt-1 text-2xl font-black text-[#0B1442]">{value}</h3>
    {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    {progress !== undefined && (
      <div className="mt-3">
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] font-semibold text-slate-400">{progressLabel}</p>
      </div>
    )}
  </div>
);

export default StatCard;