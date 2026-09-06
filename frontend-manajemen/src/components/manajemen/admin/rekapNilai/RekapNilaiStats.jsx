import { Users, Sparkles, GraduationCap, Clock } from "lucide-react";

export const RekapNilaiStats = ({ stats, isDark }) => {
  const statCards = [
    {
      icon: Users,
      mobileLabel: "Peserta Aktif",
      label: "Total Peserta Aktif",
      desktopLabel: "Total Peserta Aktif",
      value: stats.total,
      caption: `${stats.diterbitkan} telah diterbitkan`,
      mobileCaption: `${stats.diterbitkan} terbit`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      chipDark: "bg-blue-950/60 text-sky-400",
      chipLight: "bg-blue-50 text-blue-600",
    },
    {
      icon: Sparkles,
      mobileLabel: "Rata-Rata",
      label: "Rata-Rata Nilai",
      desktopLabel: "Rata-Rata Nilai Akhir",
      value: stats.rataRata,
      caption: "Kumulatif nilai yang diterbitkan",
      mobileCaption: "Nilai rata-rata",
      lightGradient: "from-purple-300 to-white",
      gradient: "from-purple-500 to-purple-700",
      chipDark: "bg-purple-950/60 text-purple-400",
      chipLight: "bg-purple-50 text-purple-600",
    },
    {
      icon: GraduationCap,
      mobileLabel: "Predikat A",
      label: "Predikat Sangat Baik",
      desktopLabel: "Predikat Sangat Baik",
      value: stats.predikatSangatBaik,
      caption: "Meraih Indeks Mutu A / A-",
      mobileCaption: "Indeks A / A-",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      chipDark: "bg-emerald-950/60 text-emerald-400",
      chipLight: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Clock,
      mobileLabel: "Menunggu",
      label: "Menunggu Evaluasi",
      desktopLabel: "Menunggu Evaluasi",
      value: stats.belum + stats.draf,
      caption: `${stats.draf} draf mentor tersimpan`,
      mobileCaption: `${stats.draf} draf`,
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
                className={`text-[10px] sm:text-sm font-bold tracking-wide leading-tight sm:leading-snug break-words ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="inline sm:hidden">{c.mobileLabel || c.label}</span>
                <span className="hidden sm:inline">{c.label}</span>
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
                  isDark ? "text-slate-400" : "text-slate-400"
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
          <div
            className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default RekapNilaiStats;
