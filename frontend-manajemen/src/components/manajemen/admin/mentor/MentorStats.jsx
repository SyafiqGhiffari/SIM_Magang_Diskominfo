import { UserCog, CheckCircle2, XCircle, Layers } from "lucide-react";

const MentorStats = ({ total, aktif, nonaktif, bidangTerisi, isDark }) => {
  const cards = [
    {
      icon: UserCog,
      label: "Total Mentor",
      value: total,
      caption: "Akun mentor terdaftar",
      mobileCaption: "Mentor terdaftar",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "Mentor Aktif",
      value: aktif,
      caption: "Akun bisa login & membina",
      mobileCaption: "Bisa login",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: XCircle,
      label: "Mentor Nonaktif",
      value: nonaktif,
      caption: "Akun dinonaktifkan sementara",
      mobileCaption: "Dinonaktifkan",
      gradient: "from-red-500 to-red-700",
      lightGradient: "from-red-300 to-white",
      iconBg: isDark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600",
    },
    {
      icon: Layers,
      label: "Bidang Terisi",
      value: bidangTerisi,
      caption: "Bidang dengan mentor bertugas",
      mobileCaption: "Bidang bertugas",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 px-2.5 py-3 sm:p-5 ${
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

          <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className={`text-[9px] sm:text-sm font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {c.label}
              </p>
              <h3 className={`mt-1 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                {c.value}
              </h3>
              <p className={`mt-1.5 sm:mt-2 text-[8.5px] sm:text-xs font-medium leading-tight sm:leading-snug whitespace-normal break-words ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <span className="hidden sm:inline">{c.caption}</span>
                <span className="inline sm:hidden">{c.mobileCaption}</span>
              </p>
            </div>

            <span
              className={`flex h-5 w-5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
            >
              <c.icon className="w-3 h-3 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
            </span>
          </div>

          <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
        </div>
      ))}
    </div>
  );
};

export default MentorStats;