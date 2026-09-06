import { Users, GraduationCap, Sparkles, Layers } from "lucide-react";

export const BobotStatsCards = ({ stats = {}, bobot = {}, isDark = false }) => {
  // Count total indicators across all pillars
  let totalIndikator = 15;
  try {
    const raw = bobot.daftar_indikator;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      totalIndikator = parsed.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
    }
  } catch {
    totalIndikator = 15;
  }

  const statCards = [
    {
      icon: Users,
      label: "Total Peserta Dinilai",
      desktopLabel: "Total Peserta Dinilai",
      value: stats.totalPeserta ?? 0,
      caption: "Peserta magang aktif dalam sistem",
      mobileCaption: "Peserta aktif",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      chipDark: "bg-blue-950/60 text-sky-400",
      chipLight: "bg-blue-50 text-blue-600",
    },
    {
      icon: GraduationCap,
      label: "Transkrip Diterbitkan",
      desktopLabel: "Transkrip Diterbitkan",
      value: stats.transkripTerbit ?? 0,
      caption: "Nilai final & transkrip resmi terbit",
      mobileCaption: "Transkrip final",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      chipDark: "bg-emerald-950/60 text-emerald-400",
      chipLight: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Sparkles,
      label: "Rata-Rata Nilai Akhir",
      desktopLabel: "Rata-Rata Nilai Akhir",
      value: stats.rataRataNilai ?? "0.00",
      caption: "Kumulatif nilai yang diterbitkan",
      mobileCaption: "Nilai rata-rata",
      lightGradient: "from-purple-300 to-white",
      gradient: "from-purple-500 to-purple-700",
      chipDark: "bg-purple-950/60 text-purple-400",
      chipLight: "bg-purple-50 text-purple-600",
    },
    {
      icon: Layers,
      label: "Indikator Penilaian",
      desktopLabel: "Total Indikator Penilaian",
      value: `${totalIndikator} Butir`,
      caption: "Tersebar di 4 pilar kompetensi",
      mobileCaption: "4 pilar aktif",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      chipDark: "bg-amber-950/60 text-amber-400",
      chipLight: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {statCards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
            isDark
              ? "border-white/10 bg-white/5"
              : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
          }`}
        >
          <div
            className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.25] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`}
          />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={`text-[10px] sm:text-sm font-bold tracking-wide truncate ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {c.label}
              </p>
              <h3
                className={`mt-0.5 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                {c.value}
              </h3>
              <p
                className={`mt-1 sm:mt-2 text-[9px] sm:text-xs font-medium leading-snug break-words ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="inline sm:hidden">{c.mobileCaption}</span>
                <span className="hidden sm:inline">{c.caption}</span>
              </p>
            </div>
            <span
              className={`flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                isDark ? c.chipDark : c.chipLight
              }`}
            >
              <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BobotStatsCards;
