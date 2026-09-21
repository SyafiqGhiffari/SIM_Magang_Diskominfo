import { CheckCircle2, Clock, Upload, FileText } from "lucide-react";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";

export const LaporanStatusBar = ({ pendaftaran = {}, laporanStatus = {} }) => {
  const status = laporanStatus.status || "belum_unggah";
  const isDisetujui = status === "disetujui";
  const isMenunggu = status === "menunggu";

  return (
    <div
      className={`p-5 rounded-3xl border shadow-xs flex items-start gap-4 ${
        isDisetujui
          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
          : isMenunggu
          ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200"
          : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs shrink-0 ${
          isDisetujui
            ? "bg-emerald-600 text-white"
            : isMenunggu
            ? "bg-amber-500 text-white"
            : "bg-[#004F9F] text-white"
        }`}
      >
        {isDisetujui ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : isMenunggu ? (
          <Clock className="w-6 h-6" />
        ) : (
          <Upload className="w-6 h-6" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black">
            {isDisetujui
              ? "Laporan Akhir Disetujui Mentor"
              : isMenunggu
              ? "Laporan Sedang Direview Mentor"
              : "Laporan Akhir Belum Diunggah"}
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isDisetujui
                ? "bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200"
                : isMenunggu
                ? "bg-amber-200/60 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200"
                : "bg-blue-200/60 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200"
            }`}
          >
            {status}
          </span>
        </div>

        <p className="mt-1 text-xs opacity-90 leading-relaxed">
          {isDisetujui
            ? "Laporan akhir Anda telah disetujui secara resmi. Nilai dan sertifikat magang dapat diterbitkan oleh mentor."
            : isMenunggu
            ? "Naskah laporan akhir Anda telah terkirim dan sedang menunggu verifikasi serta evaluasi nilai dari mentor pembimbing."
            : "Silakan susun naskah laporan magang lengkap dan unggah berkas PDF sebelum masa magang berakhir."}
        </p>

        {pendaftaran.file_laporan_akhir && (
          <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold">
              Diunggah pada: {formatTanggalPresensi(pendaftaran.tanggal_upload_laporan)}
            </span>
            <a
              href={getFileUrl(pendaftaran.file_laporan_akhir)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black underline hover:opacity-80"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Berkas Laporan Terkumpul</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanStatusBar;
