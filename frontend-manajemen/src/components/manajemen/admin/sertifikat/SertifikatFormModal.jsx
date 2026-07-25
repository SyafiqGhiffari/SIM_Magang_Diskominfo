import { useState, useEffect } from "react";
import { X, Award, Hash, Loader2, Info, Save, GraduationCap, Building2, CalendarRange, Sparkles } from "lucide-react";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatTanggal = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

const SertifikatFormModal = ({ peserta, initialData, onClose, onSubmit }) => {
  const isEdit = Boolean(initialData);
  const [nomor, setNomor] = useState(initialData?.nomor_sertifikat || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomor.trim()) return;
    setLoading(true);
    try {
      await onSubmit(nomor.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <Award className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <Award className="w-5 h-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Nomor" : "Terbitkan Sertifikat"}
                </div>
                <h3 className="text-base font-black text-white leading-tight">{isEdit ? "Edit Sertifikat" : "Buat Sertifikat"}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Tetapkan nomor sertifikat peserta</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Info peserta (read-only) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#0B1442]">
                <GraduationCap className="w-4 h-4 text-[#004F9F]" />
                <span className="text-sm font-black">{peserta?.nama || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {peserta?.bidang || "-"}{peserta?.institusi ? ` · ${peserta.institusi}` : ""}
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
                <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                {formatTanggal(peserta?.tanggal_mulai)} – {formatTanggal(peserta?.tanggal_selesai)}
              </div>
            </div>

            {/* Input nomor */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Hash className="w-3.5 h-3.5" />
                Nomor Sertifikat
              </label>
              <input
                type="text"
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                placeholder="Contoh: 400.14.5.4/123/405.20/2025"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
              />
            </div>

            {/* Catatan otomatis */}
            <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Info className="w-3.5 h-3.5" />
              </span>
              <p className="text-[11px] leading-relaxed text-blue-700">
                <span className="font-bold">Tanggal terbit</span> terisi otomatis saat sertifikat dibuat, dan <span className="font-bold">predikat</span> akan mengikuti otomatis dari hasil tugas, logbook, serta absensi peserta.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !nomor.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Simpan Perubahan" : "Terbitkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SertifikatFormModal;