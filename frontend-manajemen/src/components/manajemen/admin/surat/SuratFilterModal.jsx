import { useEffect } from "react";
import { Filter as FilterIcon, X, ListFilter, RotateCcw, Check, Building2, GraduationCap, CalendarRange, ArrowUpDown, Calendar } from "lucide-react";

const sortOptions = [
  { key: "nama_az", label: "Nama (A-Z)" },
  { key: "nama_za", label: "Nama (Z-A)" },
  { key: "bidang_az", label: "Bidang (A-Z)" },
  { key: "tanggal_baru", label: "Tanggal Terbaru" },
  { key: "tanggal_lama", label: "Tanggal Terlama" },
  { key: "status", label: "Status Surat" },
];

const statusOptions = [
  { key: "terbit", label: "Sudah Terbit" },
  { key: "belum", label: "Belum Terbit" },
];

const kategoriOptions = [
  { key: "mahasiswa", label: "Mahasiswa" },
  { key: "siswa", label: "Siswa" },
];

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

const CheckboxItem = ({ checked, label, onToggle, isDark }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3.5 sm:py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? isDark
          ? "border-[#00A5EC]/50 bg-[#00A5EC]/10 shadow-sm"
          : "border-[#004F9F]/50 bg-blue-50/50 shadow-sm"
        : isDark
          ? "border-white/10 bg-[#1f2630] hover:border-white/20 hover:bg-[#242c38]"
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
            ? "border-white/20 bg-[#161b22] group-hover:border-[#00A5EC]"
            : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
      }`}
    >
      <Check className={`w-2 h-2 sm:w-3 sm:h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
    </span>
    <span className={`text-[10px] sm:text-xs font-bold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
  </button>
);

const SectionLabel = ({ icon, children }) => (
  <label className="mb-1 sm:mb-2 flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
    {icon}
    {children}
  </label>
);

const getInputTglClass = (isDark) =>
  `w-full rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2.5 text-[10px] sm:text-xs font-semibold outline-none transition-all duration-200 cursor-pointer ${
    isDark
      ? "border-white/10 bg-[#1f2630] text-slate-200 focus:border-[#00A5EC] focus:bg-[#242c38] focus:ring-4 focus:ring-[#00A5EC]/10"
      : "border-slate-200 bg-slate-50/70 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

const SuratFilterModal = ({
  statusList,
  toggleStatus,
  kategoriList,
  toggleKategori,
  opsiBidang = [],
  bidangList,
  toggleBidang,
  tglDari,
  tglSampai,
  setTglDari,
  setTglSampai,
  onApply,
  onReset,
  onClose,
  isDark,
  sortBy,
  setSortBy,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[90vh] flex flex-col ${
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
                <h3 className="text-xs sm:text-sm font-black text-white">Filter Surat Penerimaan</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5">
                  <span className="hidden sm:inline">Saring berdasarkan status, kategori, bidang, dan tanggal surat</span>
                  <span className="inline sm:hidden">Saring surat penerimaan</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-5">
          {/* Status surat */}
          <div>
            <SectionLabel icon={<ListFilter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}>Status Surat</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
              {statusOptions.map((s) => (
                <CheckboxItem key={s.key} label={s.label} checked={statusList.includes(s.key)} onToggle={() => toggleStatus(s.key)} isDark={isDark} />
              ))}
            </div>
          </div>

          {/* Kategori peserta */}
          <div>
            <SectionLabel icon={<GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}>Kategori Peserta</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
              {kategoriOptions.map((k) => (
                <CheckboxItem key={k.key} label={k.label} checked={kategoriList.includes(k.key)} onToggle={() => toggleKategori(k.key)} isDark={isDark} />
              ))}
            </div>
          </div>

          {/* Bidang */}
          <div>
            <SectionLabel icon={<Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}>Bidang Penempatan</SectionLabel>
            {opsiBidang.length === 0 ? (
              <p className={`rounded-lg sm:rounded-xl border border-dashed px-3 py-2 sm:px-3.5 sm:py-3 text-[10px] sm:text-[11px] font-semibold ${
                isDark ? "border-white/10 bg-white/5 text-slate-500" : "border-slate-200 bg-slate-50/60 text-slate-400"
              }`}>
                Belum ada data bidang.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 max-h-44 overflow-y-auto pr-1">
                {opsiBidang.map((b) => (
                  <CheckboxItem key={b} label={b} checked={bidangList.includes(b)} onToggle={() => toggleBidang(b)} isDark={isDark} />
                ))}
              </div>
            )}
          </div>

          {/* Rentang tanggal surat */}
          <div>
            <SectionLabel icon={<CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}>Rentang Tanggal Surat</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
              <div>
                <p className="mb-0.5 sm:mb-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">Dari</p>
                <div className="relative group/date flex items-center">
                  <input
                    type="date"
                    value={tglDari}
                    onChange={(e) => setTglDari(e.target.value)}
                    className={`${getInputTglClass(isDark)} pr-7 sm:pr-8 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:z-10`}
                    style={{ colorScheme: isDark ? "dark" : "light" }}
                  />
                  <Calendar className={`pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${
                    isDark ? "text-slate-200 group-hover/date:text-[#00A5EC]" : "text-slate-400 group-hover/date:text-[#004F9F]"
                  }`} />
                </div>
              </div>
              <div>
                <p className="mb-0.5 sm:mb-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">Sampai</p>
                <div className="relative group/date flex items-center">
                  <input
                    type="date"
                    value={tglSampai}
                    onChange={(e) => setTglSampai(e.target.value)}
                    className={`${getInputTglClass(isDark)} pr-7 sm:pr-8 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:z-10`}
                    style={{ colorScheme: isDark ? "dark" : "light" }}
                  />
                  <Calendar className={`pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${
                    isDark ? "text-slate-200 group-hover/date:text-[#00A5EC]" : "text-slate-400 group-hover/date:text-[#004F9F]"
                  }`} />
                </div>
              </div>
            </div>
            <p className="mt-1 text-[9px] sm:text-[10.5px] leading-relaxed text-slate-400">
              Rentang tanggal hanya berlaku untuk peserta yang suratnya sudah terbit.
            </p>
          </div>

          <p className={`rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-[9.5px] sm:text-[10.5px] font-semibold leading-relaxed ${
            isDark
              ? "bg-[#00A5EC]/10 border border-[#00A5EC]/20 text-[#00A5EC]"
              : "bg-blue-50/60 border border-blue-100 text-[#004F9F]"
          }`}>
            Biarkan kosong untuk menampilkan semua peserta yang sudah diterima.
          </p>

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
          isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button onClick={onReset} className={`group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border px-3 py-1.5 sm:px-4 sm:py-3 text-[10.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
            isDark
              ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/5"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}>
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
            <span className="hidden sm:inline">Reset Filter</span>
            <span className="inline sm:hidden">Reset</span>
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-1.5 sm:px-4 sm:py-3 text-[10.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
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

export default SuratFilterModal;