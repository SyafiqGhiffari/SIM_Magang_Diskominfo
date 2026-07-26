import { useEffect, useState } from "react";
import { X, MailCheck, Check, Ban, Loader2, FileText, HeartPulse, CalendarRange, Paperclip, Info } from "lucide-react";
import { prosesPengajuanIzinMentor } from "../../../../services/mentorService";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess } from "../../../../utils/swal";

const ProsesIzinModal = ({ data, onClose, onSaved }) => {
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
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
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
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <JenisIcon className="w-3.5 h-3.5" /> Jenis
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#0B1442] capitalize">{data.jenis}</p>
            </div>
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <CalendarRange className="w-3.5 h-3.5" /> Rentang Tanggal
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#0B1442]">
                {formatTanggalPresensi(data.tanggal_mulai)} — {formatTanggalPresensi(data.tanggal_selesai)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan Peserta</p>
            <p className="mt-1 text-[12.5px] font-medium text-slate-700 leading-relaxed whitespace-pre-line">{data.alasan || "-"}</p>
          </div>

          {data.file_bukti && (
            <a
              href={getFileUrl(data.file_bukti)}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:shadow-md"
            >
              <Paperclip className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" />
              Lihat file bukti
            </a>
          )}

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Catatan Mentor</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Surat keterangan dokter valid, izin disetujui."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
            />
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3.5 py-2.5 text-[11px] font-medium text-sky-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Jika disetujui, sistem otomatis mencatat presensi <span className="font-bold">{data.jenis}</span> pada setiap hari kerja dalam rentang tanggal di atas (hari libur dilewati).
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={() => proses("ditolak")}
            disabled={saving}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-bold text-rose-600 transition-all duration-200 hover:bg-rose-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />}
            Tolak
          </button>
          <button
            onClick={() => proses("disetujui")}
            disabled={saving}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />}
            Setujui
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProsesIzinModal;