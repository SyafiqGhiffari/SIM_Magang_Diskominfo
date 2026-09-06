import { useEffect } from "react";
import { Filter as FilterIcon, X, ListFilter, RotateCcw, Check, Building2, CalendarClock, ArrowUpDown } from "lucide-react";

const sortOptions = [
  { key: "nama_az", label: "Nama (A-Z)" },
  { key: "nama_za", label: "Nama (Z-A)" },
  { key: "terbaru", label: "Terbaru Dibuat" },
];

const statusOptions = [
  { key: "aktif", label: "Aktif" },
  { key: "nonaktif", label: "Nonaktif" },
];

const periodeOptions = [
  { key: "belum_mulai", label: "Belum Mulai" },
  { key: "berjalan", label: "Sedang Berjalan" },
  { key: "selesai", label: "Selesai" },
];

const CheckboxItem = ({ checked, label, onToggle, isDark }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? isDark
          ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 shadow-sm"
          : "border-[#004F9F]/50 bg-blue-50/50 shadow-sm"
        : isDark
          ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
      checked
        ? isDark
          ? "border-[#00A5EC] bg-gradient-to-br from-[#00A5EC] to-[#004F9F] scale-110"
          : "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110"
        : isDark
          ? "border-white/20 bg-white/5 group-hover:border-white/30"
          : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
    }`}>
      <Check className={`w-2 h-2 sm:w-2.5 sm:h-2.5 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
    </span>
    <span className={`text-[9.5px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</span>
  </button>
);

const RadioItem = ({ checked, label, onSelect, isDark }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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
      className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked
          ? isDark ? "border-[#00A5EC] scale-110" : "border-[#004F9F] scale-110"
          : isDark
            ? "border-white/20 group-hover:border-white/30"
            : "border-slate-300 group-hover:border-[#004F9F]/60"
      }`}
    >
      <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-br transition-transform duration-200 ${checked ? "scale-100" : "scale-0"} ${isDark ? "from-[#00A5EC] to-[#004F9F]" : "from-[#0B1442] to-[#004F9F]"}`} />
    </span>
    <span className={`text-[9.5px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</span>
  </button>
);

const PesertaFilterModal = ({
  statusList, toggleStatus,
  periodeList, togglePeriode,
  bidangList = [], bidang, setBidang,
  onApply, onReset, onClose,
  isDark,
  sortBy, setSortBy,
}) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <FilterIcon className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-18 sm:h-18 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-7.5 w-7.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <FilterIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Filter Data Peserta</h3>
                <p className="text-[9px] sm:text-[11px] text-white/60 mt-0.5">Saring data sesuai kebutuhan Anda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white hover:rotate-90 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">
          {/* Status Akun */}
          <div>
            <label className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <ListFilter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Status Akun
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {statusOptions.map((s) => (
                <CheckboxItem
                  key={s.key}
                  label={s.label}
                  checked={statusList.includes(s.key)}
                  onToggle={() => toggleStatus(s.key)}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          {/* Periode Magang */}
          <div>
            <label className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <CalendarClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Periode Magang
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {periodeOptions.map((p) => (
                <CheckboxItem
                  key={p.key}
                  label={p.label}
                  checked={periodeList.includes(p.key)}
                  onToggle={() => togglePeriode(p.key)}
                  isDark={isDark}
                />
              ))}
            </div>
            <p className="mt-1 text-[8.5px] sm:text-[10px] text-slate-400">
              Gunakan filter <b>"Selesai"</b> untuk melihat peserta yang masa magangnya sudah berakhir.
            </p>
          </div>

          {/* Bidang Penempatan (Box Poin) */}
          <div>
            <label className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Bidang Penempatan
            </label>
            {bidangList.length === 0 ? (
              <p className={`rounded-lg sm:rounded-xl border border-dashed px-3 py-2 text-[9.5px] sm:text-[10.5px] font-semibold ${
                isDark ? "border-white/10 bg-white/5 text-slate-500" : "border-slate-200 bg-slate-50/60 text-slate-400"
              }`}>
                Belum ada data bidang.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-40 overflow-y-auto pr-1">
                {bidangList.map((b) => {
                  const name = b.nama || b;
                  const isChecked = bidang === name;
                  return (
                    <CheckboxItem
                      key={b.id || name}
                      label={name}
                      checked={isChecked}
                      onToggle={() => {
                        if (typeof setBidang === "function") {
                          setBidang(bidang === name ? "" : name);
                        }
                      }}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Only: Sort Section */}
          {setSortBy && (
            <div className="block sm:hidden border-t border-dashed dark:border-white/5 pt-2.5">
              <label className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <ArrowUpDown className="w-3 h-3" />
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
        <div className={`flex items-center gap-2 sm:gap-3 border-t px-3.5 py-2 sm:px-6 sm:py-3.5 shrink-0 ${
          isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            onClick={onReset}
            className={`group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/5"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            <span className="hidden sm:inline">Reset Filter</span>
            <span className="inline sm:hidden">Reset</span>
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            <span className="hidden sm:inline">Terapkan Filter</span>
            <span className="inline sm:hidden">Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PesertaFilterModal;