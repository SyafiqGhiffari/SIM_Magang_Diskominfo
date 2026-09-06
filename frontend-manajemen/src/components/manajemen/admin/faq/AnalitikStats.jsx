import { Layers, Eye, ThumbsUp, Inbox } from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

/**
 * Kartu ringkasan halaman Analitik FAQ.
 * Mendukung tata letak responsif 2 kolom di HP dan mode gelap (Dark Mode).
 */
const AnalitikStats = ({ ringkasan, isDark: propIsDark }) => {
  const { isDark: contextIsDark } = useManajemenTheme();
  const isDark = propIsDark ?? contextIsDark;
  const r = ringkasan || {};

  const cards = [
    {
      icon: Layers,
      label: "Total FAQ",
      desktopLabel: "Total FAQ",
      value: r.total_faq ?? 0,
      caption: `${r.faq_aktif ?? 0} aktif · ${r.faq_quick_action ?? 0} quick action`,
      mobileCaption: `${r.faq_aktif ?? 0} aktif · ${r.faq_quick_action ?? 0} qa`,
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: Eye,
      label: "Tayang",
      desktopLabel: "Jawaban Tayang",
      value: r.total_tayang ?? 0,
      caption: "Sejak penghitung dipasang",
      mobileCaption: "Sejak dipasang",
      gradient: "from-violet-500 to-violet-700",
      lightGradient: "from-violet-300 to-white",
      iconBg: isDark ? "bg-purple-950/60 text-purple-400" : "bg-violet-50 text-violet-600",
    },
    {
      icon: ThumbsUp,
      label: "Membantu",
      desktopLabel: "Dinilai Membantu",
      value: (r.total_penilaian ?? 0) > 0 ? `${Math.round(r.rasio_membantu ?? 0)}%` : "—",
      caption:
        (r.total_penilaian ?? 0) > 0
          ? `${r.total_membantu ?? 0} dari ${r.total_penilaian} penilaian`
          : "Belum ada penilaian masuk",
      mobileCaption:
        (r.total_penilaian ?? 0) > 0
          ? `${r.total_membantu ?? 0}/${r.total_penilaian} ulasan`
          : "Belum dinilai",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Inbox,
      label: "Pertanyaan Masuk",
      desktopLabel: "Pertanyaan Masuk",
      value: r.total_pertanyaan ?? 0,
      caption: `${r.pertanyaan_baru ?? 0} belum ditangani`,
      mobileCaption: `${r.pertanyaan_baru ?? 0} belum ditangani`,
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
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

export default AnalitikStats;