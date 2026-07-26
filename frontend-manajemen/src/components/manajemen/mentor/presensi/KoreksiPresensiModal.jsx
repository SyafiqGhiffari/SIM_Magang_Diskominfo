import { useEffect, useState } from "react";
import { X, PencilLine, Save, Loader2, AlertTriangle } from "lucide-react";
import { STATUS_PRESENSI_OPTS, statusInfo, formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { updatePresensiMentor } from "../../../../services/mentorService";
import { toastError, toastSuccess } from "../../../../utils/swal";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15";

const KoreksiPresensiModal = ({ data, onClose, onSaved }) => {
  const [status, setStatus] = useState(data.status || "hadir");
  const [jamMasuk, setJamMasuk] = useState(data.jam_masuk || "");
  const [jamPulang, setJamPulang] = useState(data.jam_pulang || "");
  const [keterangan, setKeterangan] = useState(data.keterangan || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const butuhJam = status === "hadir" || status === "terlambat";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (butuhJam && !jamMasuk) {
      toastError("Jam masuk wajib diisi untuk status hadir/terlambat.");
      return;
    }

    setSaving(true);
    try {
      await updatePresensiMentor(data.id, {
        status,
        jam_masuk: butuhJam ? jamMasuk : "",
        jam_pulang: butuhJam ? jamPulang : "",
        keterangan,
      });
      toastSuccess("Presensi berhasil dikoreksi.");
      onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan koreksi presensi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={() => !saving && onClose()}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <PencilLine className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">Koreksi Presensi — {data.nama}</h3>
              <p className="text-[11px] text-white/60 mt-0.5">{formatTanggalPresensi(data.tanggal)}</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Status Presensi</label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {STATUS_PRESENSI_OPTS.map((s) => {
                const info = statusInfo(s);
                const aktif = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      aktif ? "border-[#004F9F]/50 bg-blue-50/60 text-[#004F9F] shadow-sm" : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${info.dot}`} />
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {butuhJam && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Jam Masuk</label>
                <input type="time" value={jamMasuk} onChange={(e) => setJamMasuk(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Jam Pulang</label>
                <input type="time" value={jamPulang} onChange={(e) => setJamPulang(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Keterangan / Alasan Koreksi</label>
            <textarea
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Peserta hadir tepat waktu namun lupa melakukan presensi."
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[11px] font-medium text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Menit keterlambatan dihitung ulang otomatis dari jam masuk. Koreksi ini tercatat atas nama Anda sebagai mentor.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />}
            {saving ? "Menyimpan..." : "Simpan Koreksi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KoreksiPresensiModal;