import { Check, Loader2, RotateCw, TriangleAlert } from "lucide-react";

/**
 * Penanda simpan otomatis berukuran kecil untuk tiap baris/item.
 * Tidak menampilkan apa pun bila baris belum pernah diubah.
 */
const PETA = {
  menunggu: {
    ikon: RotateCw,
    teks: "Menunggu…",
    kelas: "bg-amber-50 text-amber-600",
    putar: true,
  },
  menyimpan: {
    ikon: Loader2,
    teks: "Menyimpan…",
    kelas: "bg-blue-50 text-[#004F9F]",
    putar: true,
  },
  tersimpan: {
    ikon: Check,
    teks: "Tersimpan",
    kelas: "bg-emerald-50 text-emerald-600",
  },
  gagal: {
    ikon: TriangleAlert,
    teks: "Gagal simpan",
    kelas: "bg-red-50 text-red-600",
  },
};

const BadgeSimpan = ({ status }) => {
  const s = PETA[status];
  if (!s) return null;
  const Ikon = s.ikon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${s.kelas}`}
    >
      <Ikon className={`h-3 w-3 ${s.putar ? "animate-spin" : ""}`} strokeWidth={3} />
      {s.teks}
    </span>
  );
};

export default BadgeSimpan;