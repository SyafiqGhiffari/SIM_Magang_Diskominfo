import { Layers, Eye, ThumbsUp, Inbox } from "lucide-react";

/**
 * Kartu ringkasan halaman Analitik FAQ.
 * Memakai gaya kartu yang sama dengan halaman Kelola Pengguna.
 */
const AnalitikStats = ({ ringkasan }) => {
  const r = ringkasan || {};

  const cards = [
    {
      icon: Layers,
      label: "Total FAQ",
      value: r.total_faq ?? 0,
      caption: `${r.faq_aktif ?? 0} aktif · ${r.faq_quick_action ?? 0} quick action`,
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Eye,
      label: "Jawaban Ditampilkan",
      value: r.total_tayang ?? 0,
      caption: "Sejak penghitung dipasang",
      gradient: "from-violet-500 to-violet-700",
      lightGradient: "from-violet-300 to-white",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      icon: ThumbsUp,
      label: "Dinilai Membantu",
      value: (r.total_penilaian ?? 0) > 0 ? `${Math.round(r.rasio_membantu ?? 0)}%` : "—",
      caption:
        (r.total_penilaian ?? 0) > 0
          ? `${r.total_membantu ?? 0} dari ${r.total_penilaian} penilaian`
          : "Belum ada penilaian masuk",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: Inbox,
      label: "Pertanyaan Masuk",
      value: r.total_pertanyaan ?? 0,
      caption: `${r.pertanyaan_baru ?? 0} belum ditangani`,
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
        >
          <div
            className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-slate-500">{c.label}</p>
              <h3 className="mt-1.5 text-4xl font-black tracking-tight text-[#0B1442]">{c.value}</h3>
              <p className="mt-2 text-xs font-medium text-slate-400">{c.caption}</p>
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg} ${c.iconColor}`}
            >
              <c.icon className="w-4.5 h-4.5" strokeWidth={2} />
            </span>
          </div>
          <div
            className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default AnalitikStats;