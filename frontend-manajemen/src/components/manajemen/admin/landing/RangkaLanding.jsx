// Rangka (skeleton) loading khusus halaman Pengaturan Landing Page.

const BARIS = [0, 1, 2, 3];

// Satu balok abu-abu berdenyut.
const Balok = ({ className = "", isDark, tebal = false, delay = 0 }) => (
  <div
    className={`animate-pulse rounded-full ${
      tebal
        ? isDark
          ? "bg-white/15"
          : "bg-slate-300"
        : isDark
        ? "bg-white/10"
        : "bg-slate-200"
    } ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  />
);

const kartu = (isDark) =>
  `rounded-2xl sm:rounded-3xl border p-4 sm:p-6 ${
    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
  }`;

// ── Bagian isi saja (dipakai saat admin hanya berpindah TAB) ──
export const RangkaKontenLanding = ({ isDark }) => (
  <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px] animate-[fadeslide_0.25s_ease-out]">
    {/* Kolom kiri: kartu form */}
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className={`${kartu(isDark)} space-y-4 sm:space-y-5`}>
        {/* kepala kartu */}
        <div className="flex items-center gap-3">
          <Balok className="h-8.5 w-8.5 sm:h-10 sm:w-10 !rounded-xl sm:!rounded-2xl" isDark={isDark} tebal />
          <div className="flex-1 space-y-2">
            <Balok className="h-3 sm:h-3.5 w-36 sm:w-44" isDark={isDark} tebal />
            <Balok className="h-2 sm:h-2.5 w-48 sm:w-64 max-w-full" isDark={isDark} />
          </div>
        </div>

        {/* isian dua kolom */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {BARIS.map((n) => (
            <div key={n} className="space-y-1.5 sm:space-y-2">
              <Balok className="h-2 sm:h-2.5 w-20 sm:w-24" isDark={isDark} delay={n * 90} />
              <Balok className="h-9 sm:h-11 w-full !rounded-lg sm:!rounded-xl" isDark={isDark} delay={n * 90} />
            </div>
          ))}
        </div>

        {/* kotak sub-bagian */}
        <div
          className={`space-y-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 ${
            isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200/70 bg-slate-50"
          }`}
        >
          <Balok className="h-2.5 w-32" isDark={isDark} />
          <Balok className="h-20 sm:h-24 w-full !rounded-lg sm:!rounded-xl" isDark={isDark} delay={120} />
        </div>
      </div>
    </div>

    {/* Kolom kanan: kartu panduan */}
    <div className={`${kartu(isDark)} space-y-3.5 sm:space-y-4`}>
      <div className="flex items-center gap-2.5">
        <Balok className="h-7.5 w-7.5 sm:h-8 sm:w-8 !rounded-lg sm:!rounded-xl" isDark={isDark} tebal />
        <Balok className="h-2.5 sm:h-3 w-24 sm:w-28" isDark={isDark} tebal />
      </div>
      {BARIS.map((n) => (
        <div key={n} className="space-y-1.5 sm:space-y-2">
          <Balok className="h-2 sm:h-2.5 w-full" isDark={isDark} delay={n * 110} />
          <Balok className="h-2 sm:h-2.5 w-4/5" isDark={isDark} delay={n * 110} />
        </div>
      ))}
    </div>
  </div>
);

// ── Rangka satu halaman penuh (dipakai saat data pertama kali dimuat) ──
const RangkaHalamanLanding = ({ isDark }) => (
  <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.25s_ease-out]">
    {/* Judul halaman */}
    <div className="space-y-2 sm:space-y-2.5">
      <Balok className="h-2.5 w-32 sm:w-40" isDark={isDark} />
      <Balok className="h-5 sm:h-6 w-44 sm:w-56" isDark={isDark} tebal />
      <Balok className="h-2 sm:h-2.5 w-full max-w-sm" isDark={isDark} />
    </div>

    {/* Kartu statistik */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {BARIS.map((n) => (
        <div key={n} className={`${kartu(isDark)} !p-3 sm:!p-5 space-y-3 sm:space-y-4`}>
          <Balok className="h-7.5 w-7.5 sm:h-10 sm:w-10 !rounded-lg sm:!rounded-xl" isDark={isDark} tebal delay={n * 80} />
          <div className="space-y-1.5 sm:space-y-2">
            <Balok className="h-3 sm:h-3.5 w-16 sm:w-20" isDark={isDark} tebal delay={n * 80} />
            <Balok className="h-2 sm:h-2.5 w-full" isDark={isDark} delay={n * 80} />
          </div>
        </div>
      ))}
    </div>

    {/* Deretan tombol tab */}
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {[0, 1].map((n) => (
        <Balok key={n} className="h-8.5 sm:h-10 w-28 sm:w-32 !rounded-xl sm:!rounded-2xl" isDark={isDark} delay={n * 70} />
      ))}
    </div>

    <RangkaKontenLanding isDark={isDark} />
  </div>
);

export default RangkaHalamanLanding;