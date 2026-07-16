import { Filter as FilterIcon, X, ListFilter, RotateCcw } from "lucide-react";

const statusOptions = [
  { key: "semua", label: "Semua Status" },
  { key: "aktif", label: "Aktif" },
  { key: "nonaktif", label: "Nonaktif" },
];

const BidangFilterModal = ({ status, setStatus, onApply, onReset, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <FilterIcon className="w-5 h-5 text-white" />
            </span>
            <h3 className="text-sm font-black text-white">Filter Bidang</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          <ListFilter className="w-3.5 h-3.5" />
          Status Bidang
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 cursor-pointer hover:border-slate-300"
        >
          {statusOptions.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <button onClick={onReset} className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
          Reset
        </button>
        <button onClick={() => { onApply(); onClose(); }} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer">
          Terapkan Filter
        </button>
      </div>
    </div>
  </div>
);

export default BidangFilterModal;