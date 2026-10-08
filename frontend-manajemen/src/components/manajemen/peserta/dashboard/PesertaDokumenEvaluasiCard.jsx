import { Link } from "react-router-dom";
import {
  Award,
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

export const PesertaDokumenEvaluasiCard = ({
  pendaftaran,
  sertifikat,
  isDark = false,
}) => {
  const suratPenerimaan = pendaftaran?.surat_penerimaan;
  const adaSertifikat = Boolean(sertifikat?.no_sertifikat);

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
        {/* Header: Singkat & Tidak Terpotong */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <Award className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Evaluasi Kompetensi
              </h3>
              <p
                className={`text-[9.5px] sm:text-[10px] font-medium leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Surat &amp; sertifikat resmi
              </p>
            </div>
          </div>

          {/* Badge Status Kanan Atas: Redaksi Umum */}
          <div className="shrink-0">
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black ${
                isDark
                  ? "bg-blue-500/15 text-sky-400 border border-blue-500/25"
                  : "bg-blue-50 text-[#004F9F] border border-blue-200"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              Dokumen Resmi
            </span>
          </div>
        </div>

        {/* ── KONTEN AREA LIST DOKUMEN: PADDING LELUASA AGAR BORDER TIDAK TERPOTONG ── */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 p-1 mt-1">
          {/* 1. Surat Penerimaan Magang (LoA) */}
          {suratPenerimaan?.file_surat ? (
            <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-emerald-300/80 dark:hover:border-emerald-500/40">
              {/* Baris Atas: Icon + Judul + Nomor Dokumen Lengkap Tanpa Terpotong */}
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[12.5px] font-black text-slate-800 dark:text-slate-100">
                    Surat Penerimaan Magang (LoA)
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-medium leading-normal break-all">
                    No: {suratPenerimaan.nomor_surat || "Diterbitkan Resmi"}
                  </p>
                </div>
              </div>

              {/* Baris Bawah: Status Verifikasi & Tombol Unduh dengan Animasi Hover Icon */}
              <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Diterbitkan Resmi</span>
                </span>

                <a
                  href={getFileUrl(suratPenerimaan.file_surat)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="group/btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10.5px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95 hover:shadow-xs"
                  title="Unduh Berkas LoA"
                >
                  <Download className="w-3 h-3 transition-transform duration-200 group-hover/btn:translate-y-0.5 group-hover/btn:scale-110" />
                  <span>Unduh PDF</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200/70 dark:border-white/10 flex items-center gap-2.5 text-slate-400">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-medium">Surat Penerimaan Magang sedang diproses instansi</span>
            </div>
          )}

          {/* 2. Sertifikat Magang Kelulusan */}
          {adaSertifikat ? (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/25 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-amber-400/80 dark:hover:border-amber-500/40">
              {/* Baris Atas: Icon + Judul + Nomor Sertifikat Lengkap Tanpa Terpotong */}
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-2xs mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[12.5px] font-black text-slate-800 dark:text-slate-100">
                    Sertifikat Kelulusan Magang
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-normal break-all">
                    No: {sertifikat.no_sertifikat}
                  </p>
                </div>
              </div>

              {/* Baris Bawah: Status Kelulusan & Tombol Unduh dengan Animasi Hover Icon */}
              <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sah &amp; Terverifikasi</span>
                </span>

                <Link
                  to="/peserta/penilaian/sertifikat"
                  className="group/btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10.5px] font-black bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95 hover:shadow-xs"
                  title="Lihat & Unduh Sertifikat"
                >
                  <Download className="w-3 h-3 transition-transform duration-200 group-hover/btn:translate-y-0.5 group-hover/btn:scale-110" />
                  <span>Unduh Sertifikat</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-2 text-slate-400">
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                    Sertifikat Kelulusan
                  </h5>
                  <p className="text-[10px] text-slate-400 truncate">
                    Diterbitkan saat evaluasi selesai
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 shrink-0">
                <Clock className="w-2.5 h-2.5" />
                Belum Terbit
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. FOOTER STRIP BUTTON: PERSIS SEPERTI CARD PRESENSI HARI INI & IZIN ── */}
      <div className="p-2 sm:px-3.5 sm:py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <Link
          to="/peserta/penilaian/sertifikat"
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Pusat Sertifikat &amp; Dokumen</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default PesertaDokumenEvaluasiCard;
