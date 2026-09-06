import { useEffect, useRef, useState } from "react";
import { X, Filter as FilterIcon, Briefcase, CalendarRange, ListFilter, RotateCcw, GraduationCap, Check, ChevronDown, ArrowUpDown, Calendar } from "lucide-react";

const sortOptions = [
  { key: "terbaru", label: "Terbaru" },
  { key: "terlama", label: "Terlama" },
  { key: "nama_az", label: "Nama A-Z" },
  { key: "nama_za", label: "Nama Z-A" },
];

const statusOptions = [
  { key: "menunggu", label: "Menunggu" },
  { key: "diterima", label: "Diterima" },
  { key: "ditolak", label: "Ditolak" },
  { key: "revisi", label: "Revisi" },
];

const kategoriOptions = [
  { key: "mahasiswa", label: "Mahasiswa" },
  { key: "siswa", label: "Siswa" },
];

const CheckboxItem = ({ checked, label, onToggle, isDark }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3.5 sm:py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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
      className={`flex h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
        checked
          ? isDark
            ? "border-[#00A5EC] bg-gradient-to-br from-[#00A5EC] to-[#004F9F] scale-110"
            : "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110"
          : isDark
            ? "border-white/20 bg-white/5 group-hover:border-white/30"
            : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
      }`}
    >
      <Check className={`w-2 h-2 sm:w-3 sm:h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
    </span>
    <span className={`text-[10px] sm:text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
  </button>
);

const RadioItem = ({ checked, label, onSelect, isDark }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3.5 sm:py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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
      className={`flex h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked
          ? "border-[#004F9F] scale-110"
          : isDark
            ? "border-white/20 group-hover:border-white/30"
            : "border-slate-300 group-hover:border-[#004F9F]/60"
      }`}
    >
      <span className={`h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 rounded-full bg-gradient-to-br transition-transform duration-200 ${checked ? "scale-100" : "scale-0"} ${isDark ? "from-[#00A5EC] to-[#004F9F]" : "from-[#0B1442] to-[#004F9F]"}`} />
    </span>
    <span className={`text-[10px] sm:text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
  </button>
);

// Dropdown kustom (menggantikan <select> native) supaya bisa dianimasikan penuh
const CustomSelect = ({ value, onChange, options, placeholder, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 cursor-pointer ${
          open
            ? isDark
              ? "border-[#00A5EC] bg-white/[0.07] ring-4 ring-[#00A5EC]/20 text-slate-200"
              : "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15"
            : isDark
              ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className={value ? (isDark ? "text-slate-200" : "text-slate-700") : "text-slate-400"}>{activeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-[#004F9F]" : ""}`} />
      </button>

      <div
        className={`absolute left-0 right-0 top-full mt-2 z-30 origin-top rounded-xl border overflow-hidden transition-all duration-200 ${
          open ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
        } ${isDark ? "border-white/10 bg-[#161b22] shadow-2xl" : "border-slate-200 bg-white shadow-xl"}`}
      >
        <div className="max-h-52 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-left transition-colors duration-150 cursor-pointer ${
                value === opt.value
                  ? isDark
                    ? "bg-white/[0.07] text-[#00A5EC]"
                    : "bg-blue-50 text-[#004F9F]"
                  : isDark
                    ? "text-slate-400 hover:bg-white/5"
                    : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
              {value === opt.value && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DateInput = ({ label, value, onChange, isDark }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      <span className="block text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wide text-slate-400 mb-0.5 sm:mb-1.5">{label}</span>
      <div className={`relative group/date rounded-lg sm:rounded-xl transition-transform duration-200 ${isFocused ? "scale-[1.03]" : ""}`}>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ colorScheme: isDark ? "dark" : "light" }}
          className={`w-full rounded-lg sm:rounded-xl border pl-2 pr-7 sm:pl-3.5 sm:pr-9 py-1.5 sm:py-3 text-[10px] sm:text-xs font-semibold outline-none transition-all duration-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:z-10 ${
            isDark
              ? isFocused
                ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 ring-4 ring-[#00A5EC]/20"
                : "border-white/10 bg-white/5 text-slate-300 placeholder-slate-500 hover:border-white/20"
              : isFocused
                ? "border-[#004F9F] bg-white shadow-lg shadow-[#00A5EC]/15 ring-4 ring-[#00A5EC]/15 text-slate-700"
                : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:-translate-y-0.5"
          }`}
        />
        <Calendar className={`pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
          isDark ? "text-slate-200 group-hover/date:text-[#00A5EC]" : "text-slate-400 group-hover/date:text-[#004F9F]"
        }`} />
        <span
          className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
            isFocused ? "w-[calc(100%-12px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
          }`}
        />
      </div>
    </div>
  );
};

const FilterModal = ({
  statusList, toggleStatus,
  bidangList, bidang, setBidang,
  kategori, setKategori,
  dateFrom, setDateFrom, dateTo, setDateTo,
  onApply, onReset, onClose,
  isDark,
  sortBy, setSortBy,
}) => {
  const bidangSelectOptions = [
    { value: "", label: "Semua Bidang" },
    ...bidangList.map((b) => ({ value: b, label: b })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-lg max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
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
              <span className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <FilterIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Filter Data Pendaftaran</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5">Saring data sesuai kebutuhan Anda</p>
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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-5">
          <div>
            <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-2">
              <ListFilter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Status Pendaftaran
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
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

          <div>
            <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-2">
              <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Bidang Penempatan
            </label>
            <CustomSelect
              value={bidang}
              onChange={setBidang}
              options={bidangSelectOptions}
              placeholder="Semua Bidang"
              isDark={isDark}
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-2">
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
              {kategoriOptions.map((k) => (
                <RadioItem
                  key={k.key}
                  label={k.label}
                  checked={kategori === k.key}
                  onSelect={() => setKategori(kategori === k.key ? "" : k.key)}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-2">
              <CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Rentang Tanggal Pendaftaran
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <DateInput label="Dari" value={dateFrom} onChange={setDateFrom} isDark={isDark} />
              <DateInput label="Sampai" value={dateTo} onChange={setDateTo} isDark={isDark} />
            </div>
          </div>

          {/* Mobile Only Sort Section */}
          <div className="block sm:hidden border-t border-dashed dark:border-white/5 pt-3">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <ArrowUpDown className="w-3 h-3" />
              Urutkan Data
            </label>
            <div className="grid grid-cols-2 gap-1.5">
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
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 sm:gap-3 border-t px-3.5 py-2.5 sm:px-6 sm:py-4 shrink-0 ${
          isDark ? "border-white/5 bg-[#1a202c]/30" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            onClick={onReset}
            className={`group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            Reset Filter
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;