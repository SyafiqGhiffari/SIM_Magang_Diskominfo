import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const BidangAlertCard = ({ bidangList, occupancy, isDark }) => {
  const withQuota = bidangList
    .filter((b) => b.kuota > 0)
    .map((b) => {
      const terisi = occupancy[b.nama] || 0;
      const pct = Math.round((terisi / b.kuota) * 100);
      return { ...b, terisi, pct };
    })
    .filter((b) => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <div
      className={`h-full flex flex-col rounded-2xl border p-4 sm:p-5 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
        <span
          className={`relative flex h-8.5 w-8.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${
            isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {withQuota.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8.5px] font-black text-white ring-2 ${
                isDark ? "ring-[#161b22]" : "ring-white"
              } animate-[fadeslide_0.2s_ease-out]`}
            >
              {withQuota.length}
            </span>
          )}
        </span>
        <div>
          <h3 className={`text-xs font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Perlu Perhatian</h3>
          <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-400"}`}>Bidang mendekati/penuh kuota</p>
        </div>
      </div>

      {withQuota.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 sm:gap-2.5 py-4 sm:py-0">
          <span
            className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${
              isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-500"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span
              className={`absolute inset-0 rounded-xl border-2 animate-ping opacity-75 ${
                isDark ? "border-emerald-500/40" : "border-emerald-200"
              }`}
            />
          </span>
          <p className={`text-[10.5px] sm:text-[11px] font-semibold leading-relaxed max-w-[180px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Semua bidang masih memiliki kuota yang cukup lega.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {withQuota.map((b, i) => (
            <div
              key={b.id}
              className={`group relative overflow-hidden rounded-xl border p-2.5 sm:p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-[fadeslide_0.3s_ease-out] ${
                isDark
                  ? "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                  : "border-slate-100 hover:border-slate-200"
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              {b.pct >= 100 && (
                <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-red-500/10 blur-xl transition-all duration-300 group-hover:scale-125 pointer-events-none" />
              )}

              <div className="relative flex items-center justify-between gap-2 mb-1.5">
                <p className={`text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>{b.nama}</p>
                <span
                  className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-black transition-all duration-200 ${
                    b.pct >= 100
                      ? isDark
                        ? "bg-red-950/80 text-red-300"
                        : "bg-red-50 text-red-600"
                      : isDark
                        ? "bg-amber-950/80 text-amber-300"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {b.pct >= 100 && <TrendingUp className="w-2.5 h-2.5" />}
                  {b.pct}%
                </span>
              </div>
              <div className={`relative h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    b.pct >= 100 ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-amber-500 to-amber-300"
                  }`}
                  style={{ width: `${Math.min(100, b.pct)}%` }}
                />
              </div>
              <p className={`relative mt-1.5 text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {b.terisi}/{b.kuota} peserta terisi
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidangAlertCard;