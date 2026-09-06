import { Users, CheckCircle2, XCircle, GraduationCap, UserCog, Award } from "lucide-react";

const PesertaStats = ({ total, aktif, nonaktif, sedangMagang, alumni, belumAdaMentor, isDark }) => {
  const cards = [
    {
      icon: Users,
      label: "Total Akun",
      desktopLabel: "Total Akun Peserta",
      value: total,
      caption: "Akun peserta terdaftar dalam sistem",
      mobileCaption: "Peserta terdaftar",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "Akun Aktif",
      desktopLabel: "Akun Aktif",
      value: aktif,
      caption: "Bisa login dan akses sistem",
      mobileCaption: "Bisa login sistem",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: XCircle,
      label: "Nonaktif",
      desktopLabel: "Akun Nonaktif",
      value: nonaktif,
      caption: "Akses login sementara diblokir",
      mobileCaption: "Akses diblokir",
      gradient: "from-red-500 to-red-700",
      lightGradient: "from-red-300 to-white",
      iconBg: isDark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600",
    },
    {
      icon: GraduationCap,
      label: "Aktif Magang",
      desktopLabel: "Aktif Magang",
      value: sedangMagang,
      caption: "Wajib mengisi presensi harian",
      mobileCaption: "Wajib presensi",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: Award,
      label: "Alumni",
      desktopLabel: "Alumni Magang",
      value: alumni,
      caption: "Read-only, akses sertifikat & nilai",
      mobileCaption: "Read-only & sertifikat",
      gradient: "from-slate-500 to-slate-700",
      lightGradient: "from-slate-200 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500",
    },
    {
      icon: UserCog,
      label: "Tanpa Mentor",
      desktopLabel: "Belum Ada Mentor",
      value: belumAdaMentor,
      caption: "Perlu segera ditugaskan mentor",
      mobileCaption: "Perlu mentor",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
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
              isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
            }`}
          />

          <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
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
            <p className={`text-[9px] sm:text-[10.5px] font-medium leading-tight whitespace-normal break-words ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span className="hidden sm:inline">{c.caption}</span>
              <span className="inline sm:hidden">{c.mobileCaption}</span>
            </p>
          </div>

          <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
        </div>
      ))}
    </div>
  );
};

export default PesertaStats;