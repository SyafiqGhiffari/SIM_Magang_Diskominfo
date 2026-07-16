import { Building2 } from "lucide-react";

const palette = [
  { from: "#0B1442", to: "#1E3A8A" },
  { from: "#059669", to: "#10b981" },
  { from: "#d97706", to: "#f59e0b" },
  { from: "#7c3aed", to: "#a855f7" },
  { from: "#0369a1", to: "#00A5EC" },
  { from: "#dc2626", to: "#ef4444" },
];

const BidangDistributionCard = ({ divisions }) => {
  const total = divisions.reduce((sum, d) => sum + d.count, 0) || 1;
  const maxCount = Math.max(...divisions.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-[#0B1442]">Distribusi per Bidang</h3>
            <p className="text-[10px] text-slate-400">Sebaran peserta magang aktif</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">{total} Peserta</span>
      </div>

      {divisions.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-400">Belum ada data distribusi bidang.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {divisions.map((d, i) => {
            const color = palette[i % palette.length];
            const pct = Math.round((d.count / total) * 100);
            const barHeightPct = Math.round((d.count / maxCount) * 100);
            return (
              <div
                key={d.name}
                className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-300 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{d.name}</p>
                    <p className="mt-0.5 text-xl font-black text-[#0B1442]">{d.count}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${barHeightPct}%`, background: `linear-gradient(90deg, ${color.from}, ${color.to})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BidangDistributionCard;