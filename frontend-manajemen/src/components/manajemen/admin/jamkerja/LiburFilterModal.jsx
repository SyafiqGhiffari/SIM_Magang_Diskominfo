import { useEffect } from "react";
import { Filter as FilterIcon, X, CalendarDays, RotateCcw, Check, ListFilter, Globe2, PenLine, ArrowUpDown } from "lucide-react";

const sortOptions = [
  { key: "tanggal_asc", label: "Tanggal Terdekat" },
  { key: "tanggal_desc", label: "Tanggal Terjauh" },
  { key: "nama_az", label: "Nama (A-Z)" },
  { key: "nama_za", label: "Nama (Z-A)" },
];

const tipeOptions = [
  { key: "nasional", label: "Libur Nasional", icon: Globe2 },
  { key: "manual", label: "Libur Instansi", icon: PenLine },
];

const CheckboxItem = ({ checked, label, icon: Icon, onToggle, isDark }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1 sm:px-3 sm:py-2.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? isDark
          ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 shadow-sm"
          : "border-[#004F9F]/50 bg-blue-50/50 shadow-sm"
        : isDark
          ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span
      className={`flex h-3 w-3 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
        checked
          ? isDark
            ? "border-[#00A5EC] bg-gradient-to-br from-[#00A5EC] to-[#004F9F] scale-110"
            : "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110"
          : isDark
            ? "border-white/20 bg-white/5 group-hover:border-white/30"
            : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
      }`}
    >
      <Check
        className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 text-white transition-transform duration-200 ${
          checked ? "scale-100" : "scale-0"
        }`}
        strokeWidth={3}
      />
    </span>
    {Icon && (
      <Icon
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${
          label.includes("Nasional")
            ? isDark ? "text-emerald-400" : "text-emerald-600"
            : isDark ? "text-amber-400" : "text-amber-600"
        }`}
      />
    )}
    <span className={`text-[9px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
      {label}
    </span>
  </button>
);

const RadioItem = ({ checked, label, onSelect, isDark }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1 sm:px-3 sm:py-2.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? isDark
          ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 shadow-sm"
          : "border-[#004F9F]/50 bg-blue-50/50 shadow-sm"
        : isDark
          ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span
      className={`flex h-3 w-3 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked
          ? isDark ? "border-[#00A5EC] scale-110" : "border-[#004F9F] scale-110"
          : isDark
            ? "border-white/20 group-hover:border-white/30"
            : "border-slate-300 group-hover:border-[#004F9F]/60"
      }`}
    >
      <span
        className={`h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-gradient-to-br transition-transform duration-200 ${
          checked ? "scale-100" : "scale-0"
        } ${isDark ? "from-[#00A5EC] to-[#004F9F]" : "from-[#0B1442] to-[#004F9F]"}`}
      />
    </span>
    <span className={`text-[9px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
      {label}
    </span>
  </button>
);

const LiburFilterModal = ({
  tahunOptions,
  selectedYear,
  setSelectedYear,
  selectedTipe,
  toggleTipe,
  onReset,
  onApply,
  onClose,
  isDark = false,
  sortBy,
  setSortBy,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-[340px] sm:max-w-xl max-h-[85vh] rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <FilterIcon className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-18 sm:h-18 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-6.5 w-6.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <FilterIcon className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </span>
              <div>
                <h3 className="text-[11.5px] sm:text-sm font-black text-white">Filter Hari Libur</h3>
                <p className="text-[8.5px] sm:text-[11px] text-white/60 mt-0.5">Saring data libur sesuai kebutuhan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white hover:rotate-90 cursor-pointer"
            >
              <X className="w-3 h-3 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
          {/* Tahun */}
          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <CalendarDays className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              Tahun Libur
            </label>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {tahunOptions.map((y) => {
                const active = selectedYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className={`group relative flex items-center justify-center rounded-md sm:rounded-xl border px-1 py-1 sm:px-2 sm:py-2.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      active
                        ? isDark
                          ? "border-[#00A5EC]/50 bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md"
                          : "border-[#004F9F]/50 bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-md"
                        : isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                          : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-[#004F9F]/40 hover:bg-white"
                    }`}
                  >
                    {y}
                    {active && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                        <Check className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipe Libur */}
          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <ListFilter className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              Tipe Libur
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
              {tipeOptions.map((t) => (
                <CheckboxItem
                  key={t.key}
                  label={t.label}
                  icon={t.icon}
                  checked={selectedTipe.includes(t.key)}
                  onToggle={() => toggleTipe(t.key)}
                  isDark={isDark}
                />
              ))}
            </div>
            <p className="mt-0.5 text-[7.5px] sm:text-[9.5px] text-slate-400">
              Kosongkan untuk menampilkan semua tipe libur.
            </p>
          </div>

          {/* Mobile Only: Sort Section (Khusus HP, Desktop memiliki dropdown sort di toolbar) */}
          {setSortBy && (
            <div className="block sm:hidden border-t border-dashed dark:border-white/5 pt-2">
              <label className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <ArrowUpDown className="w-2.5 h-2.5" />
                Urutkan Data
              </label>
              <div className="grid grid-cols-1 gap-1">
                {sortOptions.map((opt) => (
                  <RadioItem
                    key={opt.key}
                    label={opt.label}
                    checked={sortBy === opt.key}
                    onSelect={() => setSortBy(opt.key)}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-1.5 sm:gap-3 border-t px-2.5 py-2 sm:px-6 sm:py-3.5 shrink-0 ${
          isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            onClick={onReset}
            className={`group flex-1 inline-flex items-center justify-center gap-1 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-4 sm:py-2.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/5"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            <span>Reset</span>
          </button>
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="group flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-2 py-1.5 sm:px-4 sm:py-2.5 text-[9.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiburFilterModal;