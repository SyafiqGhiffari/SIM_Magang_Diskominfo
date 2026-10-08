import {
  Users,
  CalendarCheck,
  Layers,
} from "lucide-react";

export const MentorMetricCards = ({
  totalBimbingan,
  totalMahasiswa,
  totalSiswa,
  presensiStats,
  totalTugas,
  totalMateri,
  isDark,
}) => {
  const cards = [
    {
      id: "peserta",
      label: "Peserta Aktif",
      nilai: Number(totalBimbingan || 0).toLocaleString("id-ID"),
      caption: (
        <>
          <span className="hidden sm:inline">
            {totalMahasiswa || 0} Mahasiswa • {totalSiswa || 0} Siswa
          </span>
          <span className="sm:hidden">{totalBimbingan || 0} bimbingan</span>
        </>
      ),
      icon: Users,
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      id: "presensi",
      label: "Kehadiran Hari Ini",
      nilai: `${presensiStats?.persentase != null ? presensiStats.persentase : 100}%`,
      caption: (
        <>
          <span className="hidden sm:inline">
            {presensiStats?.hadir || 0} Hadir • {presensiStats?.izin || 0} Izin
          </span>
          <span className="sm:hidden">{presensiStats?.hadir || 0} hadir</span>
        </>
      ),
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      id: "tugas_materi",
      label: "Tugas & Modul",
      nilai: Number(totalTugas || 0).toLocaleString("id-ID"),
      caption: (
        <>
          <span className="hidden sm:inline">
            {totalTugas || 0} Tugas • {totalMateri || 0} Modul
          </span>
          <span className="sm:hidden">{totalMateri || 0} modul</span>
        </>
      ),
      icon: Layers,
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-2.5 sm:p-5 ${
              isDark
                ? "border-white/10 bg-[#161b22]"
                : `border-slate-200 bg-gradient-to-br ${c.lightGradient} shadow-sm`
            }`}
          >
            <div
              className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                isDark
                  ? "opacity-[0.18] group-hover:opacity-[0.28]"
                  : "opacity-[0.3] group-hover:opacity-[0.4]"
              }`}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={`line-clamp-2 min-h-[20px] sm:min-h-0 leading-tight text-[8.5px] sm:text-xs font-bold tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {c.label}
                  </p>
                  <h3
                    className={`mt-0.5 sm:mt-1.5 text-base sm:text-[30px] font-black leading-none tracking-tight tabular-nums ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    {c.nilai}
                  </h3>
                </div>

                <span
                  className={`flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
                >
                  <Icon className="h-3 w-3 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
                </span>
              </div>

              <p
                className={`mt-1.5 sm:mt-2 truncate sm:whitespace-normal text-[8px] sm:text-[10.5px] font-medium leading-tight sm:leading-snug ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {c.caption}
              </p>
            </div>

            <div
              className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MentorMetricCards;
