import { useEffect } from "react";
import { Filter as FilterIcon, X, RotateCcw, Check, Building2, GraduationCap, CalendarRange, ArrowUpDown } from "lucide-react";
import { STATUS_PRESENSI_OPTS, KATEGORI_PESERTA_OPTS, PRESENSI_SORT_OPTS, statusInfo } from "../../../../constants/presensiStatus";

const CheckboxItem = ({ checked, label, onToggle, dot, isDark }) => (
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
    <span
      className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
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
        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 text-white transition-transform duration-200 ${
          checked ? "scale-100" : "scale-0"
        }`}
        strokeWidth={3}
      />
    </span>
    {dot && <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 rounded-full ${dot}`} />}
    <span className={`text-[9px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
      {label}
    </span>
  </button>
);

const RadioItem = ({ checked, label, onSelect, isDark }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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
      <span
        className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-br transition-transform duration-200 ${
          checked ? "scale-100" : "scale-0"
        } ${isDark ? "from-[#00A5EC] to-[#004F9F]" : "from-[#0B1442] to-[#004F9F]"}`}
      />
    </span>
    <span className={`text-[9px] sm:text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
      {label}
    </span>
  </button>
);

const PresensiFilterModal = ({
  draft,
  setDraft,
  bidangOptions = [],
  onApply,
  onReset,
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
  }, [onClose]);

  const toggleArr = (field, value) =>
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const inputCls = `w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10.5px] sm:text-xs font-semibold outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
      : "border-slate-200 bg-slate-50/60 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Watermark */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <FilterIcon className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-18 sm:h-18 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-7.5 w-7.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <FilterIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Filter Data Presensi</h3>
                <p className="text-[8.5px] sm:text-[11px] text-white/60 mt-0.5">Saring data presensi sesuai kebutuhan</p>
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
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
          {/* Periode Tanggal */}
          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Periode Tanggal
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div>
                <span className="text-[8px] sm:text-[8.5px] font-medium text-slate-400 block mb-0.5">Dari:</span>
                <input
                  type="date"
                  value={draft.tanggal_dari}
                  onChange={(e) => setDraft((p) => ({ ...p, tanggal_dari: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <span className="text-[8px] sm:text-[8.5px] font-medium text-slate-400 block mb-0.5">Sampai:</span>
                <input
                  type="date"
                  value={draft.tanggal_sampai}
                  onChange={(e) => setDraft((p) => ({ ...p, tanggal_sampai: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Status Presensi (Mendukung array string atau object) */}
          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <FilterIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Status Presensi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {STATUS_PRESENSI_OPTS.map((key) => {
                const val = typeof key === "string" ? key : (key.value || key.nama);
                const info = statusInfo(val);
                const label = typeof key === "string" ? info.label : (key.label || info.label);
                const checked = draft.status.includes(val);
                return (
                  <CheckboxItem
                    key={val}
                    label={label}
                    checked={checked}
                    onToggle={() => toggleArr("status", val)}
                    dot={info.dot}
                    isDark={isDark}
                  />
                );
              })}
              {/* Opsi khusus: Lupa presensi */}
              <CheckboxItem
                label="Lupa presensi"
                checked={Boolean(draft.lupa_presensi)}
                onToggle={() => setDraft((p) => ({ ...p, lupa_presensi: !p.lupa_presensi }))}
                dot="bg-amber-500"
                isDark={isDark}
              />
            </div>
          </div>

          {/* Jenis Peserta */}
          <div>
            <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Jenis Peserta
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {KATEGORI_PESERTA_OPTS.map((k) => (
                <CheckboxItem
                  key={k.value}
                  label={k.label}
                  checked={draft.kategori.includes(k.value)}
                  onToggle={() => toggleArr("kategori", k.value)}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          {/* Bidang Penempatan (Dengan padding agar border atas tidak terpotong saat hover) */}
          {bidangOptions.length > 0 && (
            <div>
              <label className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Bidang Penempatan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-36 sm:max-h-44 overflow-y-auto overscroll-contain p-1 pr-1.5">
                {bidangOptions.map((b, idx) => {
                  const namaBidang = typeof b === "string" ? b : (b?.nama || b?.name || "");
                  return (
                    <CheckboxItem
                      key={b?.id || namaBidang || idx}
                      label={namaBidang}
                      checked={draft.bidang.includes(namaBidang)}
                      onToggle={() => toggleArr("bidang", namaBidang)}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Only: Sort Section (Khusus HP, Desktop memiliki dropdown sort di luar) */}
          {setSortBy && (
            <div className={`block sm:hidden border-t border-dashed pt-2 ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <label className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <ArrowUpDown className="w-3 h-3" />
                Urutkan Data
              </label>
              <div className="grid grid-cols-1 gap-1">
                {PRESENSI_SORT_OPTS.map((opt) => (
                  <RadioItem
                    key={opt.value}
                    label={opt.label}
                    checked={sortBy === opt.value}
                    onSelect={() => setSortBy(opt.value)}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between gap-2 border-t p-2.5 sm:px-6 sm:py-3.5 shrink-0 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"}`}>
          <button
            type="button"
            onClick={onReset}
            className={`group inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-500 group-hover:-rotate-180" />
            <span>Reset Filter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="group inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-4 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <FilterIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:scale-110" />
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresensiFilterModal;