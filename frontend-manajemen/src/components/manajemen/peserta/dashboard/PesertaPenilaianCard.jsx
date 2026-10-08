import { Link } from "react-router-dom";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from "lucide-react";

export const PesertaPenilaianCard = ({ penilaian, isDark = false }) => {
  const adaNilai = Boolean(penilaian?.nilai_akhir_angka != null);

  return (
    <div
      className={`rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden h-[310px] sm:h-[329px] transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-[#161b22] text-white"
          : "border-slate-200/80 bg-white text-slate-800"
      }`}
    >
      {/* ── 1. BODY CARD DENGAN SCROLL MANDIRI ── */}
      <div className="p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col">
        {/* Header Card: Singkat & Tidak Terpotong */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <GraduationCap className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Penilaian Kinerja &amp; Evaluasi
              </h3>
              <p
                className={`text-[9.5px] sm:text-[10px] font-medium leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Rapor capaian magang
              </p>
            </div>
          </div>

          {/* Badge Kanan Atas */}
          <div className="shrink-0">
            {adaNilai ? (
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black ${
                  isDark
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Nilai Terbit
              </span>
            ) : (
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black ${
                  isDark
                    ? "bg-blue-500/15 text-sky-400 border border-blue-500/25"
                    : "bg-blue-50 text-[#004F9F] border border-blue-200"
                }`}
              >
                <Clock className="h-3 w-3" />
                Sedang Berjalan
              </span>
            )}
          </div>
        </div>

        {/* ── KONTEN UTAMA: BANNER HIGHLIGHT NILAI / PROGRESS ── */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 p-1 mt-1">
          {adaNilai ? (
            <div className="space-y-2">
              {/* Box Skor Angka & Predikat */}
              <div className="p-3 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.03] to-transparent">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Skor Akhir Magang
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80">
                    Predikat: {penilaian.predikat_akhir || "Baik"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B1442] dark:text-white tracking-tight">
                    {penilaian.nilai_akhir_angka}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    / 100 (Indeks {penilaian.indeks_nilai_akhir || "B"})
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Hasil evaluasi kinerja magang telah disahkan resmi oleh mentor pembimbing dan transkrip nilai resmi telah tersedia.
                </p>
              </div>

              {/* Quick Metrics Info Mini Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-slate-400">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span>Kategori</span>
                  </div>
                  <div className="text-xs font-black text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                    {penilaian.predikat_akhir || "Baik"}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-slate-400">
                    <FileCheck className="w-3 h-3 text-[#004F9F] dark:text-sky-400" />
                    <span>Status Rapor</span>
                  </div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    Disahkan
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Box Sedang Berjalan */}
              <div className="p-3 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.03] to-transparent space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-[#004F9F] dark:bg-blue-900/40 dark:text-sky-400">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    Evaluasi Sedang Berjalan
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Evaluasi kinerja dan kompetensi magang sedang dipantau secara berkala oleh mentor pembimbing dan akan diterbitkan menjelang akhir masa magang.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-white/10 text-[10px] text-slate-400 flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Transkrip nilai akan terbit otomatis setelah disahkan</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. FOOTER STRIP BUTTON: PERSIS SEPERTI CARD PRESENSI HARI INI & IZIN ── */}
      <div className="p-2 sm:px-3.5 sm:py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <Link
          to="/peserta/penilaian/rapor"
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Lembar Rapor &amp; Transkrip</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default PesertaPenilaianCard;
