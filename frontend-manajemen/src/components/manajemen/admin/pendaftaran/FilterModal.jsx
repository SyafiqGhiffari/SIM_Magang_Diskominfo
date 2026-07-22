import { useEffect, useRef, useState } from "react";
import { X, Filter as FilterIcon, Briefcase, CalendarRange, ListFilter, RotateCcw, GraduationCap, Check, ChevronDown } from "lucide-react";

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

const CheckboxItem = ({ checked, label, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked ? "border-[#004F9F]/50 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span
      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
        checked ? "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110" : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
      }`}
    >
      <Check className={`w-3 h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
    </span>
    <span className="text-xs font-bold text-slate-700">{label}</span>
  </button>
);

const RadioItem = ({ checked, label, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked ? "border-[#004F9F]/50 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span
      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked ? "border-[#004F9F] scale-110" : "border-slate-300 group-hover:border-[#004F9F]/60"
      }`}
    >
      <span className={`h-2 w-2 rounded-full bg-gradient-to-br from-[#0B1442] to-[#004F9F] transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} />
    </span>
    <span className="text-xs font-bold text-slate-700">{label}</span>
  </button>
);

// Dropdown kustom (menggantikan <select> native) supaya bisa dianimasikan penuh
const CustomSelect = ({ value, onChange, options, placeholder }) => {
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
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 cursor-pointer ${
          open
            ? "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15"
            : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className={value ? "text-slate-700" : "text-slate-400"}>{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-[#004F9F]" : ""}`} />
      </button>

      <div
        className={`absolute left-0 right-0 top-full mt-2 z-30 origin-top rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-200 ${
          open ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="max-h-52 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-left transition-colors duration-150 cursor-pointer ${
                value === opt.value ? "bg-blue-50 text-[#004F9F]" : "text-slate-600 hover:bg-slate-50"
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

const DateInput = ({ label, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{label}</span>
      <div className={`relative rounded-xl transition-transform duration-200 ${isFocused ? "scale-[1.03]" : ""}`}>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full rounded-xl border px-3.5 py-3 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 ${
            isFocused
              ? "border-[#004F9F] bg-white shadow-lg shadow-[#00A5EC]/15 ring-4 ring-[#00A5EC]/15"
              : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:-translate-y-0.5"
          }`}
        />
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
}) => {
  const bidangSelectOptions = [
    { value: "", label: "Semua Bidang" },
    ...bidangList.map((b) => ({ value: b, label: b })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <FilterIcon className="w-5 h-5 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">Filter Data Pendaftaran</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Sesuaikan tampilan data sesuai kebutuhan Anda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white hover:rotate-90 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <ListFilter className="w-3.5 h-3.5" />
              Status Pendaftaran
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {statusOptions.map((s) => (
                <CheckboxItem
                  key={s.key}
                  label={s.label}
                  checked={statusList.includes(s.key)}
                  onToggle={() => toggleStatus(s.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              Bidang Penempatan
            </label>
            <CustomSelect
              value={bidang}
              onChange={setBidang}
              options={bidangSelectOptions}
              placeholder="Semua Bidang"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {kategoriOptions.map((k) => (
                <RadioItem
                  key={k.key}
                  label={k.label}
                  checked={kategori === k.key}
                  onSelect={() => setKategori(kategori === k.key ? "" : k.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              <CalendarRange className="w-3.5 h-3.5" />
              Rentang Tanggal Pendaftaran
            </label>
            <div className="flex items-center gap-2.5">
              <DateInput label="Dari" value={dateFrom} onChange={setDateFrom} />
              <DateInput label="Sampai" value={dateTo} onChange={setDateTo} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={onReset}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            Reset Filter
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;