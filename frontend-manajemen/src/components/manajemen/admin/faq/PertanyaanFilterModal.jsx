import { useEffect } from "react";
import { Filter as FilterIcon, X, ListFilter, RotateCcw, Check, Radio, Repeat2 } from "lucide-react";

const sumberOptions = [
  { key: "chat_bot", label: "Chat Bot" },
  { key: "form_publik", label: "Form Publik" },
];

const ulangOptions = [
  { key: "sekali", label: "Ditanya 1x" },
  { key: "berulang", label: "Ditanya Berulang" },
];

const CheckboxItem = ({ checked, label, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? "border-[#004F9F]/50 bg-blue-50/50 shadow-sm"
        : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
    }`}
  >
    <span
      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
        checked
          ? "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110"
          : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
      }`}
    >
      <Check
        className={`w-3 h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`}
        strokeWidth={3}
      />
    </span>
    <span className="text-xs font-bold text-slate-700">{label}</span>
  </button>
);

/**
 * Filter lanjutan Pertanyaan Masuk.
 * Bentuk dan animasinya menyalin PesertaFilterModal supaya seragam.
 */
const PertanyaanFilterModal = ({
  sumberList,
  toggleSumber,
  ulangList,
  toggleUlang,
  onApply,
  onReset,
  onClose,
}) => {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <FilterIcon className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">Filter Pertanyaan</h3>
              <p className="text-[11px] text-white/60 mt-0.5">
                Persempit daftar sesuai sumber dan pola pertanyaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Radio className="w-3.5 h-3.5" />
              Sumber Pertanyaan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {sumberOptions.map((s) => (
                <CheckboxItem
                  key={s.key}
                  label={s.label}
                  checked={sumberList.includes(s.key)}
                  onToggle={() => toggleSumber(s.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Repeat2 className="w-3.5 h-3.5" />
              Frekuensi Ditanyakan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {ulangOptions.map((s) => (
                <CheckboxItem
                  key={s.key}
                  label={s.label}
                  checked={ulangList.includes(s.key)}
                  onToggle={() => toggleUlang(s.key)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 shrink-0">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={onApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" /> Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PertanyaanFilterModal;