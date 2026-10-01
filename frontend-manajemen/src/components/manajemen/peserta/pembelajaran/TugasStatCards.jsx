import {
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

export const TugasStatCards = ({
  stats = {
    total: 0,
    belum: 0,
    menunggu: 0,
    selesai: 0,
    rataNilai: null,
  },
  onFilterClick,
}) => {
  const { isDark } = useManajemenTheme();

  const persen = stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;
  const rata = stats.rataNilai !== undefined && stats.rataNilai !== null ? Number(stats.rataNilai).toFixed(1) : "-";

  const cards = [
    {
      id: "semua",
      icon: ClipboardList,
      label: "Total Tugas",
      desktopLabel: "Total Tugas Magang",
      value: stats.total,
      caption: stats.total > 0 ? `${persen}% penugasan tuntas` : "Penugasan aktif",
      mobileCaption: `${persen}% tuntas`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      id: "belum_kumpul",
      icon: Clock,
      label: "Belum Kumpul",
      desktopLabel: "Belum Dikumpulkan",
      value: stats.belum,
      caption: stats.belum > 0 ? `${stats.belum} tugas perlu dikerjakan` : "Semua tugas telah dikirim",
      mobileCaption: `${stats.belum} perlu dikerjakan`,
      lightGradient: "from-rose-300 to-white",
      gradient: "from-rose-500 to-rose-700",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
    },
    {
      id: "menunggu",
      icon: AlertCircle,
      label: "Menunggu Review",
      desktopLabel: "Menunggu Penilaian",
      value: stats.menunggu,
      caption: `${stats.menunggu} tugas sedang diperiksa mentor`,
      mobileCaption: `${stats.menunggu} diperiksa mentor`,
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      id: "dinilai",
      icon: CheckCircle2,
      label: "Sudah Dinilai",
      desktopLabel: "Telah Dinilai & Selesai",
      value: stats.selesai,
      caption: rata !== "-" ? `Rata-rata nilai: ${rata}` : "Telah memperoleh skor",
      mobileCaption: rata !== "-" ? `Rata-rata: ${rata}` : "Telah dinilai",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.id}
          onClick={() => onFilterClick?.(c.id)}
          className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
          }`}
        >
          {/* Ambient Background Glow */}
          <div
            className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
              isDark
                ? "opacity-[0.16] group-hover:opacity-[0.26]"
                : "opacity-[0.3] group-hover:opacity-[0.4]"
            }`}
          />

          <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="inline sm:hidden">{c.label}</span>
                <span className="hidden sm:inline">{c.desktopLabel}</span>
              </p>
              <h3
                className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl font-black tracking-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                {c.value}
              </h3>
              <p
                className={`mt-1 text-[8.5px] sm:text-xs font-medium leading-snug truncate ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
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

          {/* Bottom active/hover accent bar */}
          <div
            className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default TugasStatCards;
