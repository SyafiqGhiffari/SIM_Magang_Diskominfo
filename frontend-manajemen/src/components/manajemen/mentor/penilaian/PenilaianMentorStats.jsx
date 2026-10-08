import { Users, Clock, FileEdit, CheckCircle2 } from "lucide-react";

export const PenilaianMentorStats = ({ stats, isDark, loading = false }) => {
  const cards = [
    {
      key: "semua",
      label: "Total Peserta",
      desktopLabel: "Total Peserta",
      value: stats.total,
      caption: "Peserta bimbingan aktif",
      mobileCaption: "Bimbingan aktif",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-blue-500 to-blue-700",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
      icon: Users,
    },
    {
      key: "belum_dinilai",
      label: "Belum Dinilai",
      desktopLabel: "Belum Dinilai",
      value: stats.belumDinilai,
      caption: "Perlu evaluasi mentor",
      mobileCaption: "Perlu evaluasi",
      lightGradient: "from-rose-300 to-white",
      gradient: "from-rose-500 to-rose-700",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
      icon: Clock,
    },
    {
      key: "draf",
      label: "Status Draf",
      desktopLabel: "Status Draf",
      value: stats.draf,
      caption: "Tersimpan belum final",
      mobileCaption: "Belum final",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
      icon: FileEdit,
    },
    {
      key: "final",
      label: "Diterbitkan",
      desktopLabel: "Sudah Diterbitkan",
      value: stats.final,
      caption: "Rapor nilai resmi terbit",
      mobileCaption: "Rapor terbit",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;

        return (
          <div
            key={c.key}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
              isDark
                ? "border-white/10 bg-[#161b22]"
                : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
            }`}
          >
            <div
              className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
              }`}
            />
            <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0 flex-1">
                <p className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="inline sm:hidden">{c.label}</span>
                  <span className="hidden sm:inline">{c.desktopLabel}</span>
                </p>
                <h3 className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  {loading ? "..." : c.value}
                </h3>
                <p className={`mt-1 sm:mt-1.5 text-[8.5px] sm:text-xs font-medium leading-snug sm:whitespace-normal sm:line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  <span className="inline sm:hidden">{c.mobileCaption}</span>
                  <span className="hidden sm:inline">{c.caption}</span>
                </p>
              </div>
              <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </span>
            </div>
            <div
              className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
            />
          </div>
        );
      })}
    </div>
  );
};


