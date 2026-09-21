import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";

const PengajuanIzinStats = ({ total, menunggu, disetujui, ditolak, isDark }) => {
  const cards = [
    {
      icon: FileText,
      label: "Total Pengajuan",
      desktopLabel: "Total Pengajuan",
      value: total,
      caption: "Semua pengajuan izin & sakit",
      mobileCaption: "Semua pengajuan",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    },
    {
      icon: Clock,
      label: "Menunggu",
      desktopLabel: "Menunggu Verifikasi",
      value: menunggu,
      caption: "Sedang ditinjau oleh mentor",
      mobileCaption: "Menunggu mentor",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: CheckCircle2,
      label: "Disetujui",
      desktopLabel: "Pengajuan Disetujui",
      value: disetujui,
      caption: "Terverifikasi oleh mentor",
      mobileCaption: "Terverifikasi",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: AlertCircle,
      label: "Ditolak",
      desktopLabel: "Pengajuan Ditolak",
      value: ditolak,
      caption: "Ditolak oleh pembimbing",
      mobileCaption: "Tidak disetujui",
      gradient: "from-rose-500 to-rose-700",
      lightGradient: "from-rose-300 to-white",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 px-3 py-3 sm:p-4.5 flex flex-col justify-between ${
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
                <span className="inline sm:hidden">{c.label}</span>
                <span className="hidden sm:inline">{c.desktopLabel}</span>
              </p>
              <h3
                className={`mt-1 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                {c.value}
              </h3>
              <p className={`mt-1 sm:mt-1.5 text-[9.5px] sm:text-xs font-medium truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <span className="inline sm:hidden">{c.mobileCaption}</span>
                <span className="hidden sm:inline">{c.caption}</span>
              </p>
            </div>
            <span
              className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
            >
              <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
            </span>
          </div>

          <div
            className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default PengajuanIzinStats;
