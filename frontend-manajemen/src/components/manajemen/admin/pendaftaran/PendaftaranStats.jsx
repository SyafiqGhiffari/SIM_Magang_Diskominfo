import { ClipboardList, CheckCircle2, XCircle, Clock3, TrendingUp, TrendingDown } from "lucide-react";

const PendaftaranStats = ({ total, diterima, ditolak, avgDays, totalTrend, diterimaTrend, ditolakTrend }) => {
  const cards = [
    {
      icon: ClipboardList,
      label: "Total Antrean",
      value: total,
      trend: totalTrend,
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "Pendaftaran Diterima",
      value: diterima,
      trend: diterimaTrend,
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: XCircle,
      label: "Pendaftaran Ditolak",
      value: ditolak,
      trend: ditolakTrend,
      gradient: "from-red-500 to-red-700",
      lightGradient: "from-red-300 to-white",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      icon: Clock3,
      label: "Lama Verifikasi",
      value: avgDays,
      valueSuffix: "Hari",
      trend: null,
      caption: "Rata-rata waktu verifikasi pendaftaran",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
        >
          <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-slate-500">{c.label}</p>
              <h3 className="mt-1.5 text-4xl font-black tracking-tight text-[#0B1442]">
                {c.value}
                {c.valueSuffix && <span className="ml-1.5 text-lg font-bold text-[#0B1442]">{c.valueSuffix}</span>}
              </h3>

              {c.trend !== null && c.trend !== undefined ? (
                <p className={`mt-2 flex items-center gap-1 text-xs font-bold whitespace-nowrap ${c.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {c.trend >= 0 ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
                  {c.trend >= 0 ? "+" : ""}{c.trend}%
                  <span className="font-medium text-slate-400">dari bulan lalu</span>
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-400 whitespace-nowrap">
                  {c.caption || "Belum ada data pembanding bulan lalu"}
                </p>
              )}
            </div>

            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg} ${c.iconColor}`}>
              <c.icon className="w-4.5 h-4.5" strokeWidth={2} />
            </span>
          </div>

          <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
        </div>
      ))}
    </div>
  );
};

export default PendaftaranStats;