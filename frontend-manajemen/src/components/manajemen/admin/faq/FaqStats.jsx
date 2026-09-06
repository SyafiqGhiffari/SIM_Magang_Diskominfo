import { HelpCircle, CheckCircle2, Zap, Eye, ThumbsUp, AlertTriangle } from "lucide-react";

/**
 * Kartu statistik halaman FAQ & Quick Action.
 * Mendukung tata letak responsif 2 kolom di HP dan mode gelap (Dark Mode).
 */
const FaqStats = ({
  total = 0,
  aktif = 0,
  quickAction = 0,
  quickActionMaks = 6,
  totalTayang = 0,
  rasioMembantu = null,
  totalPenilaian = 0,
  perluDiperbaiki = 0,
  isDark = false,
}) => {
  const cards = [
    {
      icon: HelpCircle,
      label: "Total FAQ",
      desktopLabel: "Total FAQ",
      value: total,
      caption: "Semua jawaban tersimpan",
      mobileCaption: "Jawaban tersimpan",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "FAQ Aktif",
      desktopLabel: "FAQ Aktif",
      value: aktif,
      caption: "Dipakai menjawab peserta",
      mobileCaption: "Menjawab peserta",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Zap,
      label: "Quick Action",
      desktopLabel: "Quick Action",
      value: `${quickAction}/${quickActionMaks}`,
      caption:
        quickAction >= quickActionMaks ? "Slot tombol penuh" : "Slot tombol terpakai",
      mobileCaption: "Slot terpakai",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: Eye,
      label: "Tayang",
      desktopLabel: "Jawaban Tayang",
      value: totalTayang,
      caption: "Total tayang di chat",
      mobileCaption: "Total tayang",
      gradient: "from-violet-500 to-violet-700",
      lightGradient: "from-violet-300 to-white",
      iconBg: isDark ? "bg-purple-950/60 text-purple-400" : "bg-violet-50 text-violet-600",
    },
    {
      icon: ThumbsUp,
      label: "Membantu",
      desktopLabel: "Dinilai Membantu",
      value: totalPenilaian > 0 ? `${Math.round(rasioMembantu)}%` : "—",
      caption:
        totalPenilaian > 0
          ? `${totalPenilaian} ulasan masuk`
          : "Belum ada penilaian",
      mobileCaption: totalPenilaian > 0 ? `${totalPenilaian} ulasan` : "Belum dinilai",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: AlertTriangle,
      label: "Perlu Revisi",
      desktopLabel: "Perlu Revisi",
      value: perluDiperbaiki,
      caption: "Ulasan membantu rendah",
      mobileCaption: "Perlu perbaikan",
      gradient: "from-red-500 to-red-700",
      lightGradient: "from-red-300 to-white",
      iconBg: isDark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 px-3 py-3 sm:p-4.5 flex flex-col justify-between ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : `border-slate-200 bg-gradient-to-br ${c.lightGradient} shadow-sm`
          }`}
        >
          <div
            className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
              isDark ? "opacity-[0.18] group-hover:opacity-[0.28]" : "opacity-[0.3] group-hover:opacity-[0.4]"
            }`}
          />

          <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] sm:text-xs font-bold tracking-wide leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <span className="inline sm:hidden">{c.label}</span>
                <span className="hidden sm:inline">{c.desktopLabel}</span>
              </p>
              <h3 className={`mt-1 sm:mt-1.5 text-xl sm:text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                {c.value}
              </h3>
            </div>

            <span
              className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
            >
              <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
            </span>
          </div>

          <div className="relative mt-2 sm:mt-2.5">
            <p className={`text-[9px] sm:text-[10.5px] font-medium leading-tight whitespace-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span className="hidden sm:inline">{c.caption}</span>
              <span className="inline sm:hidden">{c.mobileCaption}</span>
            </p>
          </div>

          <div
            className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default FaqStats;