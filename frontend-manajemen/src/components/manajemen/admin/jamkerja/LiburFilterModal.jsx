import { useEffect, useState } from "react";
import { Filter as FilterIcon, X, CalendarDays, RotateCcw, Check, ListFilter, Globe2, PenLine } from "lucide-react";

const tipeOptions = [
  { key: "nasional", label: "Libur Nasional", icon: Globe2 },
  { key: "manual", label: "Libur Instansi", icon: PenLine },
];

const LiburFilterModal = ({ tahunOptions, currentTahun, defaultTahun, currentTipe, onApply, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(currentTahun);
  const [selectedTipe, setSelectedTipe] = useState(currentTipe || []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTipe = (key) =>
    setSelectedTipe((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <FilterIcon className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">Filter Hari Libur</h3>
              <p className="text-[11px] text-white/60 mt-0.5">Sesuaikan tampilan data sesuai kebutuhan Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tahun */}
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Tahun
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {tahunOptions.map((y) => {
                const active = selectedYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className={`group relative flex items-center justify-center rounded-xl border px-2 py-3 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      active
                        ? "border-[#004F9F]/50 bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-md"
                        : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-[#004F9F]/40 hover:bg-white"
                    }`}
                  >
                    {y}
                    {active && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipe Libur */}
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <ListFilter className="w-3.5 h-3.5" />
              Tipe Libur
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {tipeOptions.map((t) => {
                const checked = selectedTipe.includes(t.key);
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleTipe(t.key)}
                    className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      checked ? "border-[#004F9F]/50 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
                    }`}
                  >
                    <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                      checked ? "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110" : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
                    }`}>
                      <Check className={`w-3 h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
                    </span>
                    <Icon className={`w-4 h-4 ${t.key === "nasional" ? "text-emerald-600" : "text-amber-600"}`} />
                    <span className="text-xs font-bold text-slate-700">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10.5px] text-slate-400">Kosongkan untuk menampilkan semua tipe.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={() => { setSelectedYear(defaultTahun); setSelectedTipe([]); }}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            Reset Filter
          </button>
          <button
            onClick={() => { onApply({ tahun: selectedYear, tipe: selectedTipe }); onClose(); }}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiburFilterModal;