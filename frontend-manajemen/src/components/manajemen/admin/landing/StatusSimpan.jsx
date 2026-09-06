import { Check, CloudUpload, Loader2, RotateCw, TriangleAlert } from "lucide-react";

/**
 * Penanda simpan otomatis. Menggantikan tombol "Simpan Perubahan".
 * Dipasang di kaki kartu, menempel ke tepi kartu (-mx-6 -mb-6).
 */
const PETA = {
  idle: {
    ikon: CloudUpload,
    teks: "Simpan otomatis aktif",
    ket: "Setiap perubahan langsung tersimpan sendiri.",
    warna: "text-slate-400",
    bg: "bg-slate-100",
    bgGelap: "bg-white/5",
  },
  menunggu: {
    ikon: RotateCw,
    teks: "Menunggu ketikan selesai",
    ket: "Perubahan akan disimpan sebentar lagi.",
    warna: "text-amber-500",
    bg: "bg-amber-50",
    bgGelap: "bg-amber-500/10",
    putar: true,
  },
  menyimpan: {
    ikon: Loader2,
    teks: "Menyimpan…",
    ket: "Sedang mengirim perubahan ke server.",
    warna: "text-[#004F9F]",
    bg: "bg-blue-50",
    bgGelap: "bg-[#00A5EC]/10",
    putar: true,
  },
  tersimpan: {
    ikon: Check,
    teks: "Tersimpan otomatis",
    ket: "Semua perubahan sudah tampil di halaman pendaftaran.",
    warna: "text-emerald-600",
    bg: "bg-emerald-50",
    bgGelap: "bg-emerald-500/10",
  },
  gagal: {
    ikon: TriangleAlert,
    teks: "Gagal menyimpan",
    ket: "Periksa koneksi, lalu ubah kolom mana pun untuk mencoba lagi.",
    warna: "text-red-600",
    bg: "bg-red-50",
    bgGelap: "bg-red-500/10",
  },
};

const StatusSimpan = ({ status = "idle", isDark, menempel = true }) => {
  const s = PETA[status] || PETA.idle;
  const Ikon = s.ikon;

  return (
    <div
      className={`${
        menempel ? "-mx-3 -mb-3 mt-1.5 sm:-mx-6 sm:-mb-6 sm:mt-2" : ""
      } flex items-center gap-2 sm:gap-3 border-t px-3 py-2 sm:px-6 sm:py-4 transition-colors duration-300 ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <span
        className={`flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-xl transition-all duration-300 ${
          isDark ? s.bgGelap : s.bg
        } ${s.warna}`}
      >
        <Ikon
          className={`h-3 w-3 sm:h-4 sm:w-4 ${s.putar ? "animate-spin" : ""}`}
          strokeWidth={2.6}
        />
      </span>

      <div className="min-w-0">
        <p className={`text-[10px] sm:text-[12.5px] font-bold leading-tight ${s.warna}`}>{s.teks}</p>
        <p
          className={`mt-0.5 truncate text-[8.5px] sm:text-[11px] font-medium ${
            isDark ? "text-slate-400" : "text-slate-400"
          }`}
        >
          {s.ket}
        </p>
      </div>

      {/* denyut kecil sebagai tanda sistem hidup */}
      <span className="ml-auto hidden items-center gap-1.5 sm:flex">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "gagal"
              ? "bg-red-500"
              : status === "tersimpan"
              ? "bg-emerald-500"
              : "bg-[#00A5EC] animate-pulse"
          }`}
        />
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${
            isDark ? "text-slate-500" : "text-slate-300"
          }`}
        >
          Auto save
        </span>
      </span>
    </div>
  );
};

export default StatusSimpan;