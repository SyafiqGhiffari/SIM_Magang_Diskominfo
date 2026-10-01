import {
  Search,
  FilterX,
  Users,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

export const PesertaBimbinganEmptyState = ({
  isFiltered = false,
  search = "",
  filterStatus = "semua",
  filterKategori = "semua",
  onResetAll,
  onClearSearch,
  onResetStatus,
  onResetKategori,
  isDark = false,
}) => {
  const getStatusLabel = (val) => {
    if (val === "aktif") return "Aktif Magang";
    if (val === "selesai") return "Selesai Magang (Alumni)";
    return val;
  };

  const getKategoriLabel = (val) => {
    if (val === "mahasiswa") return "Mahasiswa (Perguruan Tinggi)";
    if (val === "siswa") return "Siswa (SMK/SMA)";
    return val;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-8 sm:p-12 text-center shadow-xs transition-all duration-300 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both] ${
        isDark
          ? "border-white/10 bg-gradient-to-b from-[#161b22] to-[#0f1218]"
          : "border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/30"
      }`}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-gradient-to-b from-[#00A5EC]/15 via-[#004F9F]/5 to-transparent blur-2xl" />

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center space-y-5">
        {/* Layered Floating Animated Icon Canvas */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow Ring */}
          <div className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-blue-500/10 dark:bg-[#00A5EC]/10 animate-ping opacity-60 pointer-events-none" />

          {/* Middle Frosted Ring */}
          <div
            className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border shadow-xl backdrop-blur-md transition-transform duration-500 hover:scale-105 ${
              isDark
                ? "border-white/10 bg-white/[0.04] shadow-black/40"
                : "border-slate-200/80 bg-white/80 shadow-slate-300/30"
            }`}
          >
            {/* Inner Gradient Icon Core - Warna Serasi Halaman Kelola Akun Mentor */}
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white shadow-md">
              {isFiltered ? (
                <FilterX className="w-7 h-7 sm:w-8 sm:h-8 animate-[wiggle_1.5s_ease-in-out_infinite]" />
              ) : (
                <Users className="w-7 h-7 sm:w-8 sm:h-8 animate-[popIn_0.5s_ease-out]" />
              )}
            </div>
          </div>

          {/* Mini Corner Floating Badge - Serasi Corner Badge Akun Mentor */}
          <span
            className="absolute -bottom-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#004F9F] dark:bg-sky-500 text-white ring-2 ring-white dark:ring-[#0B1A4C] shadow-md"
          >
            {isFiltered ? (
              <Search className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
            )}
          </span>
        </div>

        {/* Status Pill Badge */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              isFiltered
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFiltered ? "bg-amber-500 animate-pulse" : "bg-sky-500"
              }`}
            />
            {isFiltered ? "Filter Tidak Menemukan Hasil" : "Belum Ada Alokasi Peserta"}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 text-center">
          <h3
            className={`text-lg sm:text-xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            {isFiltered ? "Tidak Ada Peserta yang Cocok" : "Belum Ada Peserta Bimbingan"}
          </h3>
          <p
            className={`text-xs sm:text-[13px] leading-relaxed max-w-md ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {isFiltered
              ? "Tidak ditemukan peserta magang yang memenuhi kriteria pencarian atau kombinasi filter saat ini."
              : "Saat ini Anda belum memiliki peserta magang yang dialokasikan di bawah bimbingan Anda. Peserta yang telah diterima oleh admin akan otomatis muncul di sini."}
          </p>
        </div>

        {/* Active Filter Chips (if filtered) */}
        {isFiltered && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {search && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 shadow-2xs"
                }`}
              >
                <span className="text-slate-400">Kata kunci:</span>
                <span className="font-bold">"{search}"</span>
                {onClearSearch && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="p-0.5 rounded-md hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Hapus pencarian ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}

            {filterStatus !== "semua" && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 shadow-2xs"
                }`}
              >
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {getStatusLabel(filterStatus)}
                </span>
                {onResetStatus && (
                  <button
                    type="button"
                    onClick={onResetStatus}
                    className="p-0.5 rounded-md hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Reset filter status ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}

            {filterKategori !== "semua" && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 shadow-2xs"
                }`}
              >
                <span className="text-slate-400">Jenjang:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {getKategoriLabel(filterKategori)}
                </span>
                {onResetKategori && (
                  <button
                    type="button"
                    onClick={onResetKategori}
                    className="p-0.5 rounded-md hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Reset filter jenjang ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}
          </div>
        )}

        {/* Action Button CTA (Tanpa animasi berganti warna ketika hover) */}
        {isFiltered && onResetAll && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetAll}
              className="group inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:-rotate-90" />
              <span>Reset Semua Filter &amp; Pencarian</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PesertaBimbinganEmptyState;
