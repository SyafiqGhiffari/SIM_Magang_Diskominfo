import { useState, useEffect } from "react";
import { X, Award, Hash, Loader2, Info, Save, GraduationCap, Building2, CalendarRange, Sparkles } from "lucide-react";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatTanggal = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

const SertifikatFormModal = ({ peserta, initialData, onClose, onSubmit, isDark = false }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-[315px] sm:max-w-md max-h-[92vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-5 sm:py-4 shrink-0">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          <Award className="absolute right-5 sm:right-7 top-1/2 -translate-y-1/2 w-17 h-17 sm:w-21 sm:h-21 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="relative flex h-7.5 w-7.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <Award className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-0.5 rounded-lg sm:rounded-xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-1.5 sm:px-2 py-0.2">
                  <Sparkles className="w-2 h-2 animate-pulse" />
                  {isEdit ? "Perbarui Nomor" : "Terbitkan Sertifikat"}
                </div>
                <h3 className="text-[11.5px] sm:text-sm font-black text-white leading-tight">{isEdit ? "Edit Sertifikat" : "Buat Sertifikat"}</h3>
                <p className="text-[9px] sm:text-[10.5px] text-white/60 mt-0.2">Tetapkan nomor sertifikat peserta</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-4">
            {/* Info peserta (read-only) */}
            <div className={`rounded-lg sm:rounded-xl border p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2 ${
              isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/60"
            }`}>
              <div className={`flex items-center gap-1.5 sm:gap-2 ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                <GraduationCap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`} />
                <span className="text-[11px] sm:text-xs font-black truncate">{peserta?.nama || "-"}</span>
              </div>
              <div className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[10.5px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{peserta?.bidang || "-"}{peserta?.institusi ? ` · ${peserta.institusi}` : ""}</span>
              </div>
              <div className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[10.5px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{formatTanggal(peserta?.tanggal_mulai)} – {formatTanggal(peserta?.tanggal_selesai)}</span>
              </div>
            </div>

            {/* Input nomor */}
            <div>
              <label className="flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Hash className="w-3 h-3 text-slate-400" />
                Nomor Sertifikat
              </label>
              <input
                type="text"
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                placeholder="Contoh: 400.14.5.4/123/405.20/2026"
                required
                autoFocus
                className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-semibold outline-none transition-all duration-200 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-white/10 focus:ring-3 focus:ring-[#00A5EC]/20"
                    : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-3 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                }`}
              />
            </div>

            {/* Catatan otomatis */}
            <div className={`flex items-start gap-2 rounded-lg sm:rounded-xl p-2 sm:p-2.5 border ${
              isDark ? "border-sky-500/20 bg-sky-950/30 text-sky-300" : "border-blue-100 bg-blue-50 text-blue-700"
            }`}>
              <span className={`flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-md ${
                isDark ? "bg-sky-900/60 text-sky-300" : "bg-blue-100 text-blue-600"
              }`}>
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
              <p className="text-[9px] sm:text-[10px] leading-relaxed">
                <span className="font-bold">Tanggal terbit</span> terisi otomatis saat sertifikat dibuat, dan <span className="font-bold">predikat</span> akan mengikuti otomatis dari hasil tugas, logbook, serta absensi peserta.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-2 sm:gap-2.5 border-t px-3 py-2.5 sm:px-5 sm:py-3.5 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg sm:rounded-xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-[11.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !nomor.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11.5px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              {isEdit ? "Simpan Perubahan" : "Terbitkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SertifikatFormModal;