import { useEffect, useState } from "react";
import {
  CheckCircle2, CircleSlash, Eye, EyeOff, Zap, Tag, Trash2, X, Loader2,
  MousePointerClick, CornerDownLeft,
} from "lucide-react";

/**
 * Bilah tindakan massal untuk tabel FAQ.
 * Props:
 *  - jumlah  : banyaknya baris terpilih
 *  - sibuk   : true saat permintaan massal sedang berjalan
*  - onAksi  : (kunci) => void  -> "aktifkan" | "nonaktifkan"
*                                  | "tampilkan_landing" | "sembunyikan_landing"
*                                  | "lepas_quick_action" | "ubah_kategori" | "hapus"
 *  - onTutup : () => void       -> membatalkan seluruh pilihan
 */

// Kelompok pertama: mengatur status tayang FAQ.
// "relevan" menentukan apakah tombol perlu ditampilkan, "hitung" memberi tahu
// berapa baris yang benar-benar akan berubah bila tombol ditekan.
const AKSI_STATUS = [
  {
    kunci: "aktifkan", label: "Aktifkan", ikon: CheckCircle2,
    relevan: (r) => r.nonaktif > 0,
    hitung: (r) => r.nonaktif,
    teks: "group-hover:text-emerald-300", chip: "group-hover:bg-emerald-400/20 group-hover:text-emerald-300",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(52,211,153,0.65)]",
  },
  {
    kunci: "nonaktifkan", label: "Nonaktifkan", ikon: CircleSlash,
    relevan: (r) => r.aktif > 0,       
    hitung: (r) => r.aktif,
    teks: "group-hover:text-slate-100", chip: "group-hover:bg-white/20 group-hover:text-white",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(226,232,240,0.5)]",
  },
];

// Kelompok kedua: mengatur keterlihatan pada halaman publik dan tombol cepat
const AKSI_TAMPILAN = [
  {
    kunci: "tampilkan_landing", label: "Tampil di Landing", ikon: Eye,
    relevan: (r) => r.belumTampil > 0, 
    hitung: (r) => r.belumTampil,
    teks: "group-hover:text-sky-300", chip: "group-hover:bg-sky-400/20 group-hover:text-sky-300",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(56,189,248,0.65)]",
  },
  {
    kunci: "sembunyikan_landing", label: "Sembunyikan dari Landing", ikon: EyeOff,
    relevan: (r) => r.tampil > 0,      
    hitung: (r) => r.tampil,
    teks: "group-hover:text-sky-300", chip: "group-hover:bg-sky-400/20 group-hover:text-sky-300",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(56,189,248,0.65)]",
  },
  {
    kunci: "lepas_quick_action", label: "Lepas Quick Action", ikon: Zap,
    relevan: (r) => r.quick > 0,       
    hitung: (r) => r.quick,
    teks: "group-hover:text-amber-300", chip: "group-hover:bg-amber-400/20 group-hover:text-amber-300",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(251,191,36,0.65)]",
  },
  {
    kunci: "ubah_kategori", label: "Ubah kategori", ikon: Tag,
    relevan: () => true,               
    hitung: (r) => r.total,
    teks: "group-hover:text-violet-300", chip: "group-hover:bg-violet-400/20 group-hover:text-violet-300",
    cahaya: "group-hover:shadow-[0_8px_20px_-8px_rgba(167,139,250,0.65)]",
  },
];

const Pemisah = () => (
  <span className="hidden h-7 w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent lg:block" aria-hidden="true" />
);

const RINGKASAN_KOSONG = { total: 0, aktif: 0, nonaktif: 0, tampil: 0, belumTampil: 0, quick: 0 };

function BilahAksiMassal({ jumlah = 0, ringkasan, sibuk = false, onAksi, onTutup }) {
  // Menyimpan kunci aksi yang sedang diproses agar tombolnya menampilkan pemuat
  const [aksiBerjalan, setAksiBerjalan] = useState(null);

  // Tombol Escape membatalkan seluruh pilihan
  useEffect(() => {
    const saatTekan = (e) => {
      if (e.key === "Escape" && !sibuk) onTutup?.();
    };
    window.addEventListener("keydown", saatTekan);
    return () => window.removeEventListener("keydown", saatTekan);
  }, [sibuk, onTutup]);

  if (jumlah === 0) return null;

  const r = { ...RINGKASAN_KOSONG, total: jumlah, ...(ringkasan || {}) };

  // Hanya tindakan yang benar-benar mengubah sesuatu yang ditampilkan
  const daftarStatus = AKSI_STATUS.filter((a) => a.relevan(r));
  const daftarTampilan = AKSI_TAMPILAN.filter((a) => a.relevan(r));

  const jalankan = (kunci) => {
    setAksiBerjalan(kunci);
    onAksi?.(kunci);
  };

  const render = (daftar, mulai) =>
    daftar.map(({ kunci, label, ikon: Ikon, teks, chip, cahaya, hitung }, i) => {
    const berjalan = sibuk && aksiBerjalan === kunci;
    const kena = hitung(r);
    const sebagian = kena > 0 && kena < r.total;
    return (
        <button
          key={kunci}
          type="button"
          onClick={() => jalankan(kunci)}
          disabled={sibuk}
          title={sebagian
            ? `${label} — ${kena} dari ${r.total} FAQ terpilih yang terpengaruh`
            : `${label} ${r.total} FAQ terpilih`}
          style={{ animationDelay: `${mulai + i * 45}ms`, animationFillMode: "backwards" }}
          className={`group relative inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer animate-[fadeslide_0.3s_ease-out] ${teks} ${cahaya}`}
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${chip}`}>
            {berjalan
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Ikon className="h-3.5 w-3.5" />}
          </span>
          <span className="whitespace-nowrap">{label}</span>
          {/* Penanda jumlah baris yang terpengaruh bila tidak seluruh pilihan berubah */}
          {sebagian && (
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9.5px] font-black text-white/60">{kena}</span>
          )}
          {/* Garis penegas yang tumbuh dari tengah saat kursor menyentuh tombol */}
          <span className="pointer-events-none absolute inset-x-2.5 bottom-1 h-px origin-center scale-x-0 bg-current opacity-40 transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
        </button>
      );
    });

  const hapusBerjalan = sibuk && aksiBerjalan === "hapus";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto relative w-full max-w-5xl animate-[modalFadeUp_0.35s_ease-out]">
        {/* Bingkai cahaya berwarna di balik bilah */}
        <span className="pointer-events-none absolute -inset-[1.5px] rounded-[23px] bg-gradient-to-r from-[#00A5EC]/50 via-[#004F9F]/40 to-[#7C3AED]/50 opacity-80 blur-[3px]" aria-hidden="true" />

        <div className="relative overflow-hidden rounded-[22px] bg-[#0B1442]/90 shadow-[0_24px_60px_-20px_rgba(11,20,66,0.9)] ring-1 ring-white/10 backdrop-blur-xl">
          {/* Lampu latar bersudut, mengikuti gaya kartu gelap di modal FAQ */}
          <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#00A5EC]/25 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -left-8 -bottom-16 h-36 w-36 rounded-full bg-[#7C3AED]/20 blur-3xl" aria-hidden="true" />

          {/* Pita pemuat tipis saat permintaan massal berjalan */}
          {sibuk && (
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] animate-pulse bg-gradient-to-r from-transparent via-[#00A5EC] to-transparent" aria-hidden="true" />
          )}

          <div className="relative flex flex-wrap items-center gap-x-1.5 gap-y-2 px-3.5 py-3 sm:px-4">
            {/* Penanda jumlah pilihan */}
            <span className="group relative mr-1 inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-gradient-to-br from-white to-slate-100 py-1.5 pl-2 pr-3.5 shadow-lg">
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-[11px] font-black text-white shadow-sm">
                {sibuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : jumlah}
                {!sibuk && (
                  <span className="absolute -inset-1 animate-ping rounded-xl border border-[#00A5EC]/40" aria-hidden="true" />
                )}
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[11px] font-black text-[#0B1442]">Terpilih</span>
                <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  {sibuk ? "Memproses" : "Siap diproses"}
                </span>
              </span>
            </span>

            {daftarStatus.length > 0 && (
              <>
                <Pemisah />
                {render(daftarStatus, 60)}
              </>
            )}

            {daftarTampilan.length > 0 && (
              <>
                <Pemisah />
                {render(daftarTampilan, 150)}
              </>
            )}

            <Pemisah />
            {/* Tindakan merusak dipisahkan dan diberi warna peringatan */}
            <button
              type="button"
              onClick={() => jalankan("hapus")}
              disabled={sibuk}
              title={`Hapus ${jumlah} FAQ terpilih`}
              style={{ animationDelay: "340ms", animationFillMode: "backwards" }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-red-400/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-200 hover:shadow-[0_8px_20px_-8px_rgba(248,113,113,0.7)] active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer animate-[fadeslide_0.3s_ease-out]"
            >
              {/* Kilau melintas khas kartu gelap pada modal FAQ */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/15 to-white/0 transition-transform duration-1000 group-hover:translate-x-full" aria-hidden="true" />
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/15 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-red-500/30">
                {hapusBerjalan
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
              </span>
              <span className="relative whitespace-nowrap">Hapus</span>
            </button>

            {/* Petunjuk pintasan dan tombol tutup didorong ke ujung kanan */}
            <span className="ml-auto hidden items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-white/40 xl:inline-flex">
              <MousePointerClick className="h-3 w-3 shrink-0" />
              Hanya tindakan yang mengubah data yang ditampilkan
              <kbd className="ml-1 inline-flex items-center gap-1 rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-white/60">
                <CornerDownLeft className="h-2.5 w-2.5" />
                Esc
              </kbd>
            </span>

            <button
              type="button"
              onClick={onTutup}
              disabled={sibuk}
              title="Batalkan pilihan (Esc)"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/45 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40 xl:ml-1.5 max-xl:ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BilahAksiMassal;