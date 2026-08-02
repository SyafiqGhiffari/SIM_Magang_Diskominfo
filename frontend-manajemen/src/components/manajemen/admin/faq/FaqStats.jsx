import { HelpCircle, CheckCircle2, Zap, Eye, ThumbsUp, AlertTriangle } from "lucide-react";

/**
 * Kartu statistik halaman FAQ & Quick Action.
 * Gaya visual sengaja disamakan dengan PesertaStats / MentorStats supaya
 * seluruh halaman admin memakai bahasa desain yang sama.
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
}) => {
  const cards = [
    {
      icon: HelpCircle,
      label: "Total FAQ",
      value: total,
      caption: "Seluruh jawaban tersimpan",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "FAQ Aktif",
      value: aktif,
      caption: "Dipakai menjawab peserta",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: Zap,
      label: "Quick Action",
      value: `${quickAction}/${quickActionMaks}`,
      caption:
        quickAction >= quickActionMaks ? "Slot tombol penuh" : "Slot tombol terpakai",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: Eye,
      label: "Jawaban Ditampilkan",
      value: totalTayang,
      caption: "Akumulasi sejak dipasang",
      gradient: "from-violet-500 to-violet-700",
      lightGradient: "from-violet-300 to-white",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      icon: ThumbsUp,
      label: "Dinilai Membantu",
      value: totalPenilaian > 0 ? `${Math.round(rasioMembantu)}%` : "—",
      caption:
        totalPenilaian > 0
          ? `${totalPenilaian} penilaian masuk`
          : "Belum ada penilaian",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: AlertTriangle,
      label: "Perlu Ditulis Ulang",
      value: perluDiperbaiki,
      caption: "Rasio membantu rendah",
      gradient: "from-red-500 to-red-700",
      lightGradient: "from-red-300 to-white",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <p className="mt-2 text-xs font-medium text-slate-400 whitespace-nowrap">{c.caption}</p>
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

export default FaqStats;