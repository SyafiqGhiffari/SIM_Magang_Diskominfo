const palette = ["#0B1442", "#10b981", "#f59e0b", "#8b5cf6", "#00A5EC", "#ef4444"];

const DivisionDistributionCard = ({ divisions }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {divisions.length === 0 ? (
      <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-xs text-slate-400">
        Belum ada data distribusi bidang.
      </div>
    ) : (
      divisions.map((d, i) => (
        <div key={d.name} className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center gap-3 shadow-sm">
          <span className="h-8 w-1.5 rounded-full shrink-0" style={{ backgroundColor: palette[i % palette.length] }} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{d.name}</p>
            <p className="text-lg font-black text-[#0B1442]">{d.count}</p>
          </div>
        </div>
      ))
    )}
  </div>
);

export default DivisionDistributionCard;