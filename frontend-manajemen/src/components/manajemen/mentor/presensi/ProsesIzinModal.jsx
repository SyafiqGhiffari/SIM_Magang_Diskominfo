import { useEffect, useState } from "react";
import { X, MailCheck, Check, Ban, Loader2, FileText, HeartPulse, CalendarRange, Paperclip, Info } from "lucide-react";
import { prosesPengajuanIzinMentor } from "../../../../services/mentorService";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess } from "../../../../utils/swal";

const ProsesIzinModal = ({ data, onClose, onSaved, isDark = false }) => {
  const [catatan, setCatatan] = useState(data.catatan_mentor || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const proses = async (status) => {
    if (status === "ditolak" && !catatan.trim()) {
      toastError("Mohon isi catatan alasan penolakan agar peserta memahami keputusan Anda.");
      return;
    }

    setSaving(true);
    try {
      const res = await prosesPengajuanIzinMentor(data.id, { status, catatan });
      const hari = res.data.data?.jumlah_hari_tercatat ?? 0;
      toastSuccess(
        status === "disetujui"
          ? `Pengajuan disetujui. ${hari} hari kerja tercatat sebagai ${data.jenis}.`
          : "Pengajuan ditolak."
      );
      onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memproses pengajuan izin.");
    } finally {
      setSaving(false);
    }
  };

  const JenisIcon = data.jenis === "sakit" ? HeartPulse : FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={() => !saving && onClose()}>
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <MailCheck className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">Verifikasi Pengajuan — {data.nama}</h3>
              <p className="text-[11px] text-white/60 mt-0.5 capitalize">Pengajuan {data.jenis}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className={`group rounded-2xl border px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 ${
              isDark ? "border-white/10 bg-[#1c2333]" : "border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm"
            }`}>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <JenisIcon className="w-3.5 h-3.5" /> Jenis
              </p>
              <p className={`mt-1 text-[13px] font-bold capitalize ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                {data.jenis}
              </p>
            </div>
            <div className={`group rounded-2xl border px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 ${
              isDark ? "border-white/10 bg-[#1c2333]" : "border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm"
            }`}>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <CalendarRange className="w-3.5 h-3.5" /> Rentang Tanggal
              </p>
              <p className={`mt-1 text-[13px] font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                {formatTanggalPresensi(data.tanggal_mulai)} — {formatTanggalPresensi(data.tanggal_selesai)}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border px-3.5 py-3 ${
            isDark ? "border-white/10 bg-[#1c2333]" : "border-slate-200 bg-slate-50/60"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan Peserta</p>
            <p className={`mt-1 text-[12.5px] font-medium leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {data.alasan || "-"}
            </p>
          </div>

          {data.file_bukti && (
            <a
              href={getFileUrl(data.file_bukti)}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                isDark ? "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50" : "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Paperclip className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">Lampiran Dokumen Bukti</p>
                  <p className="text-[10.5px] text-emerald-600/80 dark:text-emerald-400/80">Klik untuk membuka file di tab baru</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:underline">Buka</span>
            </a>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Info className="w-3.5 h-3.5" /> Catatan Mentor
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Berikan catatan, arahan tugas mandiri, atau alasan bila ditolak..."
              className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium outline-none transition-all duration-200 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
                  : "border-slate-200 bg-slate-50/60 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2.5 border-t px-6 py-4 shrink-0 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            type="button"
            onClick={() => proses("ditolak")}
            disabled={saving}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-40 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
            Tolak
          </button>
          <button
            type="button"
            onClick={() => proses("disetujui")}
            disabled={saving}
            className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            Setujui
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsesIzinModal;