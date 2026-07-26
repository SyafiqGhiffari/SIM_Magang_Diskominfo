import { useEffect } from "react";
import { Filter as FilterIcon, X, ListFilter, RotateCcw, Check, Building2, GraduationCap, CalendarRange, AlarmClockOff } from "lucide-react";
import { STATUS_PRESENSI_OPTS, KATEGORI_PESERTA_OPTS, statusInfo } from "../../../../constants/presensiStatus";

const CheckboxItem = ({ checked, label, onToggle, dot }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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
    {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />}
    <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
  </button>
);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15";

const PresensiFilterModal = ({
  draft,
  setDraft,
  bidangOptions = [],
  onApply,
  onReset,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleArr = (field, value) =>
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[90vh] flex flex-col"
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
              <h3 className="text-sm font-black text-white">Filter Data Presensi</h3>
              <p className="text-[11px] text-white/60 mt-0.5">Saring presensi berdasarkan status, periode, bidang, dan jenis peserta</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Periode */}
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <CalendarRange className="w-3.5 h-3.5" />
              Periode Tanggal
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                value={draft.tanggal_dari}
                onChange={(e) => setDraft((p) => ({ ...p, tanggal_dari: e.target.value }))}
                className={inputCls}
              />
              <input
                type="date"
                value={draft.tanggal_sampai}
                onChange={(e) => setDraft((p) => ({ ...p, tanggal_sampai: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <ListFilter className="w-3.5 h-3.5" />
              Status Presensi
            </label>
            <div className="grid grid-cols-2 gap-2.5">
            {STATUS_PRESENSI_OPTS.map((s) => (
                <CheckboxItem
                key={s}
                label={statusInfo(s).label}
                dot={statusInfo(s).dot}
                checked={draft.status.includes(s)}
                onToggle={() => toggleArr("status", s)}
                />
            ))}
            <CheckboxItem
                label="Terlambat karena lupa presensi"
                dot="bg-orange-500"
                checked={draft.lupa_presensi}
                onToggle={() => setDraft((p) => ({ ...p, lupa_presensi: !p.lupa_presensi }))}
            />
            </div>
          </div>

          {/* Jenis peserta */}
          <div>
            <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Jenis Peserta
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {KATEGORI_PESERTA_OPTS.map((k) => (
                <CheckboxItem
                  key={k.value}
                  label={k.label}
                  checked={draft.kategori.includes(k.value)}
                  onToggle={() => toggleArr("kategori", k.value)}
                />
              ))}
            </div>
          </div>

          {/* Bidang */}
          {bidangOptions.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                Bidang Penempatan
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-44 overflow-y-auto overscroll-contain px-1 py-1">
                {bidangOptions.map((b) => (
                  <CheckboxItem
                    key={b}
                    label={b}
                    checked={draft.bidang.includes(b)}
                    onToggle={() => toggleArr("bidang", b)}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[11px] font-medium text-amber-700">
            <AlarmClockOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            “Terlambat karena lupa presensi” menyaring peserta yang baru mengisi presensi setelah jam pulang, sehingga status presensinya otomatis tercatat terlambat.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button onClick={onReset} className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
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

export default PresensiFilterModal;