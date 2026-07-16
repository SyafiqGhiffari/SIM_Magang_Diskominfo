import { SlidersHorizontal, Download, Layers, CalendarRange } from "lucide-react";

const FilterBar = ({ bidangList, bidang, setBidang, dateFrom, setDateFrom, dateTo, setDateTo, onApply, onExport }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          <Layers className="w-3 h-3" />
          Bidang Penempatan
        </label>
        <select
          value={bidang}
          onChange={(e) => setBidang(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#004F9F] focus:bg-white focus:ring-2 focus:ring-[#00A5EC]/20 cursor-pointer"
        >
          <option value="">Semua Bidang</option>
          {bidangList.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[240px]">
        <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          <CalendarRange className="w-3 h-3" />
          Rentang Tanggal Pengajuan
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all focus:border-[#004F9F] focus:bg-white focus:ring-2 focus:ring-[#00A5EC]/20"
          />
          <span className="text-slate-300 shrink-0">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all focus:border-[#004F9F] focus:bg-white focus:ring-2 focus:ring-[#00A5EC]/20"
          />
        </div>
      </div>

      <button
        onClick={onExport}
        className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        Ekspor ke Excel
      </button>
    </div>

    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
      <button
        onClick={onApply}
        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90" />
        Terapkan Filter
      </button>
    </div>
  </div>
);

export default FilterBar;