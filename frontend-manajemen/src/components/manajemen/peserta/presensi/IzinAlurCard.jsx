import { Route, FilePlus, UserCheck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "1. Isi Formulir Permohonan",
    badge: "Input Data",
    desc: "Klik tombol \"Ajukan Izin\", pilih kategori izin/sakit, tentukan tanggal, tulis alasan lengkap, dan unggah dokumen bukti.",
    icon: <FilePlus className="w-3.5 h-3.5 text-white" />,
  },
  {
    title: "2. Peninjauan oleh Mentor",
    badge: "Tinjau Mentor",
    desc: "Mentor pembimbing meneliti keabsahan alasan dan berkas lampiran untuk menyetujui atau menolak permohonan.",
    icon: <UserCheck className="w-3.5 h-3.5 text-white" />,
  },
  {
    title: "3. Sinkronisasi Presensi Otomatis",
    badge: "Sinkron Presensi",
    desc: "Jika disetujui, kehadiran otomatis terhitung Izin/Sakit pada kalender harian dan rekapitulasi kehadiran akhir.",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-white" />,
  },
];

const IzinAlurCard = ({ isDark }) => {
  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 shadow-xs flex flex-col justify-between ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      <div>
        {/* Header (Tanpa Garis Sekat) */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
              <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div className="min-w-0">
              <h4 className={`text-xs sm:text-[13px] font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                Alur Pengajuan Izin
              </h4>
              <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate">
                Tahapan pengajuan, proses review &amp; persetujuan
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
            3 Tahap Alur
          </span>
        </div>

        {/* Vertical Stepper List (Connected Line, Perfectly Centered with Each Row) */}
        <div className="space-y-2.5">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-center gap-3 group">
              {/* Upper connecting line from previous step (idx > 0) */}
              {idx > 0 && (
                <div className="absolute left-[15px] top-0 h-1/2 w-[2px] bg-[#004F9F] dark:bg-[#00A5EC] z-0" />
              )}

              {/* Lower connecting line to next step (idx < steps.length - 1) */}
              {idx < steps.length - 1 && (
                <div className="absolute left-[15px] top-1/2 h-[calc(50%+10px)] w-[2px] bg-[#004F9F] dark:bg-[#00A5EC] z-0" />
              )}

              {/* Node Lingkaran Biru - Terpasang Tepat di Tengah Vertikal Kolom Card */}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-xs border-2 border-white dark:border-[#161b22] text-xs font-black transition-transform duration-200 group-hover:scale-105">
                {step.icon}
              </div>

              {/* Card Konten di Kanan Bar */}
              <div
                className={`flex-1 p-2.5 sm:p-3 rounded-xl border transition-colors ${
                  isDark
                    ? "bg-white/[0.02] border-white/5 group-hover:border-white/10"
                    : "bg-slate-50/80 border-slate-100 group-hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                    {step.title}
                  </h5>
                  <span className="text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 shrink-0">
                    {step.badge}
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IzinAlurCard;
