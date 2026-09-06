// Kepala kartu pengaturan landing page.
const KepalaKartu = ({ icon: Icon, judul, sub, isDark, aksi = null }) => (
  <div
    className={`relative -mx-3 -mt-3 sm:-mx-6 sm:-mt-6 mb-3 sm:mb-5 flex items-start sm:items-center justify-between gap-2 sm:gap-3.5 overflow-hidden border-b px-3 py-2.5 sm:px-6 sm:py-5 ${
      isDark
        ? "border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent"
        : "border-slate-100 bg-gradient-to-r from-slate-50 via-white to-white"
    }`}
  >
    {/* garis aksen di tepi atas kartu */}
    <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC]" />

    {/* cahaya lembut di sudut kanan */}
    <span
      className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#00A5EC] to-[#004F9F] blur-3xl ${
        isDark ? "opacity-[0.12]" : "opacity-[0.08]"
      }`}
    />

    <div className="relative flex min-w-0 flex-1 items-start sm:items-center gap-2 sm:gap-3.5">
      <span className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md shadow-[#004F9F]/20">
        <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={`truncate text-[11px] sm:text-base font-black tracking-tight ${
            isDark ? "text-slate-100" : "text-[#0B1442]"
          }`}
        >
          {judul}
        </h3>
        <p
          className={`mt-0.5 text-[8.5px] sm:text-xs font-medium leading-snug break-words line-clamp-2 ${
            isDark ? "text-slate-400" : "text-slate-400"
          }`}
        >
          {sub}
        </p>
      </div>
    </div>

    {aksi && <div className="relative shrink-0 flex items-center">{aksi}</div>}
  </div>
);

export default KepalaKartu;