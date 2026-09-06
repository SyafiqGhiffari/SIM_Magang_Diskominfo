import { useEffect, useState } from "react";
import { RefreshCw, Globe2, X, Loader2, Info, CalendarDays, Check, Sparkles } from "lucide-react";

const SyncNasionalModal = ({ tahunOptions, defaultTahun, syncing, onClose, onSync, isDark = false }) => {
  const [selected, setSelected] = useState(defaultTahun || tahunOptions[0]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !syncing) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, syncing]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-[fadeslide_0.2s_ease-out]"
      onMouseDown={() => { if (!syncing) onClose(); }}
    >
      <div
        className={`relative w-full max-w-[340px] sm:max-w-lg overflow-hidden rounded-xl sm:rounded-3xl shadow-2xl animate-[modalPop_0.3s_cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <Globe2 className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3.5">
              <span className="relative flex h-6.5 w-6.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <Globe2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-0.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  Sinkronisasi
                </div>
                <h3 className="text-[11.5px] sm:text-base font-black text-white leading-tight">Sinkron Libur Nasional</h3>
                <p className="text-[8.5px] sm:text-[11px] text-white/60 mt-0.5">Tarik otomatis daftar libur resmi</p>
              </div>
            </div>
            <button
              onClick={() => { if (!syncing) onClose(); }}
              disabled={syncing}
              className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-6 space-y-2.5 sm:space-y-4">
          {/* Badge informasi */}
          <div className={`group flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border p-2 sm:p-3.5 transition-all duration-300 ${
            isDark ? "border-sky-500/20 bg-sky-950/30 text-sky-300" : "border-blue-100 bg-blue-50/60 text-slate-600"
          }`}>
            <span className={`flex h-5 w-5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
              isDark ? "bg-sky-900/60 text-sky-300 ring-1 ring-sky-500/30" : "bg-white text-[#004F9F] ring-1 ring-blue-100"
            }`}>
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
            <p className="text-[9.5px] sm:text-[11.5px] leading-relaxed">
              Pilih tahun untuk ditarik libur nasionalnya.{" "}
              <span className={`font-bold ${isDark ? "text-sky-300" : "text-[#004F9F]"}`}>Libur instansi tidak akan terpengaruh.</span>
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 sm:mb-2.5">
              <CalendarDays className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              Pilih Tahun
            </label>
            <div className="grid grid-cols-4 gap-1 sm:gap-2.5">
              {tahunOptions.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelected(y)}
                  disabled={syncing}
                  className={`group relative flex items-center justify-center rounded-md sm:rounded-xl border px-1 py-1 sm:px-2 sm:py-2.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 ${
                    selected === y
                      ? isDark
                        ? "border-[#00A5EC] bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg shadow-[#00A5EC]/25 scale-[1.03]"
                        : "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-lg shadow-[#004F9F]/25 scale-[1.03]"
                      : isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/50 hover:bg-blue-50"
                  }`}
                >
                  {y}
                  {selected === y && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white/30 animate-[modalPop_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                      <Check className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-1.5 sm:gap-2.5 border-t px-3 py-2 sm:px-6 sm:py-4 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            onClick={() => { if (!syncing) onClose(); }}
            disabled={syncing}
            className={`flex-1 rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Batal
          </button>
          <button
            onClick={() => onSync(selected)}
            disabled={syncing}
            className="group flex flex-[2] items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 sm:px-5 sm:py-2.5 text-[9.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-500 group-hover:rotate-180" />}
            {syncing ? "Menyinkron..." : "Sinkronkan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncNasionalModal;