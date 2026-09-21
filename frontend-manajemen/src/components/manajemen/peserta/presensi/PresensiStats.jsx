import { CalendarDays, CheckCircle2, Clock, Percent } from "lucide-react";
import { BULAN_ID } from "../../../../constants/presensiStatus";

const labelBulan = (bulan) => {
  if (!bulan) return "";
  const [y, m] = bulan.split("-").map(Number);
  return `${BULAN_ID[m - 1]} ${y}`;
};

const PresensiStats = ({
  ringkasan,
  periodeInfo,
  bulan,
  isDark = false,
}) => {
  const totalHariEfektif = (() => {
    if (periodeInfo?.hari_kerja_efektif) return periodeInfo.hari_kerja_efektif;
    if (!bulan) return 22;
    const [y, m] = bulan.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m - 1, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    }
    return count || 22;
  })();

  const hadir = ringkasan?.hadir || 0;
  const rasioHadir = totalHariEfektif > 0 ? ((hadir / totalHariEfektif) * 100).toFixed(1) : "0.0";
  const terlambat = ringkasan?.terlambat || 0;
  const izinSakit = (ringkasan?.izin || 0) + (ringkasan?.sakit || 0);
  const persentase = Math.round(ringkasan?.persentase_kehadiran || 0);
  const alfa = ringkasan?.alfa || 0;

  const cards = [
    {
      icon: CalendarDays,
      label: "Hari Efektif",
      desktopLabel: "Total Hari Efektif",
      value: (
        <div className="flex items-baseline gap-1.5">
          <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>{totalHariEfektif}</span>
          <span className={`text-xs sm:text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Hari Kerja
          </span>
        </div>
      ),
      caption: `Periode bulan ${labelBulan(bulan)}`,
      mobileCaption: labelBulan(bulan),
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    },
    {
      icon: CheckCircle2,
      label: "Tepat Waktu",
      desktopLabel: "Hadir Tepat Waktu",
      value: (
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>{hadir}</span>
          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            {rasioHadir}% Rasio
          </span>
        </div>
      ),
      caption: "Presensi masuk tepat waktu",
      mobileCaption: "Presensi tepat waktu",
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Clock,
      label: "Terlambat & Izin",
      desktopLabel: "Terlambat & Izin",
      value: (
        <div className="flex items-baseline">
          <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>{terlambat}</span>
          <span className={`text-[10px] sm:text-xs font-semibold ml-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Terlambat
          </span>
          <span className="text-slate-300 dark:text-slate-600 mx-1 sm:mx-1.5 font-light text-xs sm:text-sm">
            /
          </span>
          <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>{izinSakit}</span>
          <span className={`text-[10px] sm:text-xs font-semibold ml-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Izin
          </span>
        </div>
      ),
      caption: "Total hari terlambat dan izin",
      mobileCaption: "Total terlambat & izin",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: Percent,
      label: "Kehadiran",
      desktopLabel: "Persentase Kehadiran",
      value: (
        <div className="space-y-1 sm:space-y-1.5 w-full">
          <div className="flex items-baseline">
            <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>
              {persentase}%
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
              / 100% Target
            </span>
          </div>
          <div className="h-1 sm:h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#004F9F] dark:bg-sky-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, persentase))}%`,
              }}
            />
          </div>
        </div>
      ),
      customCaption: (
        <div className="flex items-center justify-between text-[9.5px] sm:text-xs font-medium w-full gap-1">
          <span className={`truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {totalHariEfektif} hari kerja efektif
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10.5px] font-extrabold shadow-2xs ${
              alfa > 0
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
            }`}
          >
            {alfa > 0 ? `${alfa} Hari Alfa` : "Tanpa Alfa (0)"}
          </span>
        </div>
      ),
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 px-3 py-3 sm:p-4.5 flex flex-col justify-between ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : `border-slate-200 bg-gradient-to-br ${c.lightGradient} shadow-sm`
          }`}
        >
          {/* Ambient Glow Blob */}
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
              <div
                className={`mt-1 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                {c.value}
              </div>
              <div className={`mt-1 sm:mt-1.5 text-[9.5px] sm:text-xs font-medium truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {c.customCaption || (
                  <>
                    <span className="inline sm:hidden">{c.mobileCaption}</span>
                    <span className="hidden sm:inline">{c.caption}</span>
                  </>
                )}
              </div>
            </div>
            <span
              className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
            >
              <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
            </span>
          </div>

          {/* Bottom Accent Hover Line */}
          <div
            className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
          />
        </div>
      ))}
    </div>
  );
};

export default PresensiStats;
