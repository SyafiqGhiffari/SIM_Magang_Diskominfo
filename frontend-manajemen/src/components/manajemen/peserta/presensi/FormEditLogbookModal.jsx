import { useState } from "react";
import { X, BookOpen, Save, Calendar, Clock, AlertCircle } from "lucide-react";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { updateLogbookPeserta } from "../../../../services/pesertaService";
import { toastSuccess, toastError } from "../../../../utils/swal";

export const FormEditLogbookModal = ({ logbookItem, onClose, onSaved }) => {
  const [keterangan, setKeterangan] = useState(logbookItem?.keterangan || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keterangan.trim()) {
      toastError("Uraian kegiatan tidak boleh kosong.");
      return;
    }

    try {
      setSubmitting(true);
      await updateLogbookPeserta(logbookItem.id, { keterangan: keterangan.trim() });
      toastSuccess("Logbook harian berhasil diperbarui.");
      if (onSaved) onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui logbook.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!logbookItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161b22] shadow-2xl overflow-hidden animate-[modalPop_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Isi Logbook &amp; Jurnal Kegiatan
              </h3>
              <p className="text-xs text-slate-400">
                Catat ringkasan tugas dan capaian harian Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Tanggal & Waktu */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Tanggal</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatTanggalPresensi(logbookItem.tanggal)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Jam Presensi</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {logbookItem.jam_masuk?.slice(0, 5) || "--:--"} - {logbookItem.jam_pulang?.slice(0, 5) || "--:--"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Uraian Aktivitas &amp; Capaian Harian <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Mengembangkan modul dashboard analitik menggunakan React.js, merapikan layout responsif, dan berkoordinasi dengan mentor terkait data presensi..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Jurnal ini dapat diverifikasi oleh mentor &amp; dicetak
              </span>
              <span>{keterangan.length} karakter</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !keterangan.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? "Menyimpan..." : "Simpan Logbook"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormEditLogbookModal;
