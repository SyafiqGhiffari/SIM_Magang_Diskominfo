import { useState, useEffect } from "react";
import { X, CalendarPlus, CalendarDays, Type, Loader2, Save, Sparkles, Info } from "lucide-react";

const HariLiburModal = ({ initialData, onClose, onSubmit, isDark = false }) => {
  const isEdit = Boolean(initialData);
  const [tanggal, setTanggal] = useState(initialData?.tanggal || "");
  const [nama, setNama] = useState(initialData?.nama || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tanggal || !nama.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ tanggal, nama: nama.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-[340px] sm:max-w-lg max-h-[90vh] rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <CalendarDays className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3.5">
              <span className="relative flex h-6.5 w-6.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <CalendarPlus className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-0.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-[11.5px] sm:text-base font-black text-white leading-tight">{isEdit ? "Edit Hari Libur" : "Tambah Hari Libur"}</h3>
                <p className="text-[8.5px] sm:text-[11px] text-white/60 mt-0.5">Libur di luar Sabtu &amp; Minggu</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6 space-y-2.5 sm:space-y-5">
            <div className={`rounded-lg sm:rounded-2xl border p-2.5 sm:p-5 space-y-2 sm:space-y-4 shadow-sm ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
            }`}>
              <div>
                <label className="flex items-center gap-1 text-[8px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                  <CalendarDays className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  Tanggal Libur
                </label>
                <div className="relative group/date flex items-center">
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    style={{ colorScheme: isDark ? "dark" : "light" }}
                    className={`w-full rounded-lg sm:rounded-xl border pl-2.5 pr-8 sm:pl-4 sm:pr-10 py-1.5 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:z-10 ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-100 focus:border-[#00A5EC] focus:bg-white/10 focus:ring-4 focus:ring-[#00A5EC]/20"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                    }`}
                  />
                  <CalendarDays className={`pointer-events-none absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    isDark ? "text-slate-200 group-hover/date:text-[#00A5EC]" : "text-slate-400 group-hover/date:text-[#004F9F]"
                  }`} />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[8px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                  <Type className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  Nama / Keterangan Libur
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Libur Awal Puasa"
                  required
                  className={`w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-4 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-white/10 focus:ring-4 focus:ring-[#00A5EC]/20"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                  }`}
                />
              </div>

              <div className={`flex items-start gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border p-2 sm:p-3 ${
                isDark ? "border-sky-500/20 bg-sky-950/30 text-sky-300" : "border-blue-100 bg-blue-50 text-blue-700"
              }`}>
                <span className={`flex h-4.5 w-4.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${
                  isDark ? "bg-sky-900/60 text-sky-300" : "bg-blue-100 text-blue-600"
                }`}>
                  <Info className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </span>
                <p className="text-[9px] sm:text-[11px] leading-relaxed">
                  Gunakan menu ini untuk libur yang <span className="font-bold">tidak</span> ada di daftar libur nasional.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center gap-1.5 sm:gap-3 border-t px-3 py-2 sm:px-6 sm:py-4 sticky bottom-0 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg sm:rounded-xl border py-1.5 sm:py-2.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-[1.5] inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-1.5 sm:py-2.5 text-[9.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:scale-110" />}
              {isEdit ? "Simpan" : "Tambah Libur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HariLiburModal;