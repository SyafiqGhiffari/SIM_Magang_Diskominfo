import { ShieldCheck, Clock, FileText, UserCheck } from "lucide-react";

const IzinKetentuanCard = ({ isDark }) => {
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
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div className="min-w-0">
              <h4 className={`text-xs sm:text-[13px] font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                Ketentuan Izin &amp; Sakit
              </h4>
              <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate">
                Tata tertib, pedoman &amp; regulasi kehadiran
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
            SOP Berlaku
          </span>
        </div>

        {/* Item List */}
        <div className="space-y-2.5">
          {/* 1. Sebelum Jam Dinas */}
          <div
            className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
              isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Batas Waktu Pengajuan Izin
                </h5>
                <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Permohonan izin atau sakit wajib diajukan sebelum jam operasional dinas dimulai (maksimal pukul 07:00 WIB) pada hari kegiatan agar status kehadiran tidak otomatis tercatat alpa.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Surat Keterangan Dokter */}
          <div
            className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
              isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Lampiran Surat Keterangan Sakit
                </h5>
                <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Untuk pengajuan izin sakit lebih dari 1 (satu) hari kerja, peserta wajib melampirkan foto/scan surat dokter resmi format PDF, JPG, atau PNG dengan tulisan yang terbaca jelas.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Verifikasi Mentor */}
          <div
            className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
              isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Verifikasi oleh Mentor Pembimbing
                </h5>
                <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Seluruh permohonan yang diajukan akan ditinjau dan divalidasi langsung oleh mentor pembimbing bidang masing-masing untuk disetujui atau ditolak secara resmi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IzinKetentuanCard;
