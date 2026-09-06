import { Check, Loader2, RotateCw, TriangleAlert } from "lucide-react";

/**
 * Penanda simpan otomatis berukuran kecil untuk tiap baris/item.
 * Tidak menampilkan apa pun bila baris belum pernah diubah.
 */
const PETA = {
  menunggu: {
    ikon: RotateCw,
    teks: "Menunggu…",
    kelasLight: "bg-amber-50 text-amber-700 border-amber-200",
    kelasDark: "bg-amber-950/60 text-amber-400 border-amber-800/40",
    putar: true,
  },
  menyimpan: {
    ikon: Loader2,
    teks: "Menyimpan…",
    kelasLight: "bg-blue-50 text-[#004F9F] border-blue-200",
    kelasDark: "bg-blue-950/60 text-sky-400 border-blue-800/40",
    putar: true,
  },
  tersimpan: {
    ikon: Check,
    teks: "Tersimpan",
    kelasLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    kelasDark: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40",
  },
  gagal: {
    ikon: TriangleAlert,
    teks: "Gagal simpan",
    kelasLight: "bg-red-50 text-red-600 border-red-200",
    kelasDark: "bg-red-950/60 text-red-400 border-red-800/40",
  },
};

const BadgeSimpan = ({ status, isDark }) => {
  const s = PETA[status];
  if (!s) return null;
  const Ikon = s.ikon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 sm:gap-1 rounded-full border px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide ${
        isDark ? s.kelasDark : s.kelasLight
      }`}
    >
      <Ikon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${s.putar ? "animate-spin" : ""}`} strokeWidth={3} />
      {s.teks}
    </span>
  );
};

export default BadgeSimpan;