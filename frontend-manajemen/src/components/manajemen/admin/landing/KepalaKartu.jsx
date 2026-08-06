// Kepala kartu pengaturan landing page.
// Diberi garis gradasi tipis di tepi atas + latar lembut agar kartu tidak
// terlihat polos, namun tetap tenang dan tidak ramai.
const KepalaKartu = ({ icon: Icon, judul, sub, isDark, aksi = null }) => (
  <div
    className={`relative -mx-6 -mt-6 mb-1 flex flex-col gap-3 overflow-hidden border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
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

    <div className="relative flex min-w-0 items-center gap-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg shadow-[#004F9F]/25">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h3
          className={`truncate text-base font-black tracking-tight ${
            isDark ? "text-slate-100" : "text-[#0B1442]"
          }`}
        >
          {judul}
        </h3>
        <p
          className={`mt-0.5 text-xs font-medium ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {sub}
        </p>
      </div>
    </div>

    {aksi && <div className="relative shrink-0">{aksi}</div>}
  </div>
);

export default KepalaKartu;