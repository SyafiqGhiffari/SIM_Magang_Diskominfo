import { useRef, useState } from "react";
import {
  UploadCloud,
  ImagePlus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/**
 * Kotak unggah gambar dengan seret & lepas (drag and drop).
 *
 * - Bisa diklik untuk memilih berkas, atau berkas diseret langsung ke kotak.
 * - Bila sudah ada gambar, pratinjau ditampilkan besar dengan lapisan aksi
 *   (Ganti / Hapus) yang muncul saat kursor disorot ke gambar.
 *
 * Props:
 *  judul, ket        : teks penjelas
 *  url               : alamat gambar yang sudah tersimpan (boleh kosong)
 *  accept            : filter jenis berkas untuk input file
 *  maksMb            : batas ukuran berkas, hanya untuk pesan
 *  onPilih(file)     : dipanggil saat berkas dipilih / dilepas
 *  onHapus()         : dipanggil saat tombol hapus ditekan
 *  mengunggah        : true saat proses unggah berjalan
 *  rasio             : kelas tinggi pratinjau, mis. "h-44"
 *  muat              : "contain" untuk logo, "cover" untuk foto
 */
const DropZoneGambar = ({
  judul,
  ket,
  url,
  accept = ".jpg,.jpeg,.png,.webp,.svg",
  maksMb = 5,
  onPilih,
  onHapus,
  mengunggah = false,
  isDark,
  rasio = "h-44",
  muat = "cover",
}) => {
  const inputRef = useRef(null);
  const [seret, setSeret] = useState(false);
  const [namaBerkas, setNamaBerkas] = useState("");

  const pilihBerkas = (file) => {
    if (!file) return;
    setNamaBerkas(file.name);
    onPilih(file);
  };

  const saatLepas = (e) => {
    e.preventDefault();
    setSeret(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) pilihBerkas(file);
  };

  const bukaPemilih = () => inputRef.current?.click();

  return (
    <div
      className={`group/unggah relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-white/[0.03] hover:border-[#00A5EC]/40"
          : "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white hover:border-[#00A5EC]/50 hover:shadow-md"
      }`}
    >
      {/* Kepala kecil */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-2 text-[12.5px] font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white">
              <ImagePlus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            {judul}
          </p>
          {ket && (
            <p
              className={`mt-1 text-[11px] font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {ket}
            </p>
          )}
        </div>

        {url && !mengunggah && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
            Terpasang
          </span>
        )}
      </div>

      {/* Area seret & lepas + pratinjau */}
      <div
        role="button"
        tabIndex={0}
        onClick={bukaPemilih}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && bukaPemilih()}
        onDragOver={(e) => {
          e.preventDefault();
          setSeret(true);
        }}
        onDragLeave={() => setSeret(false)}
        onDrop={saatLepas}
        className={`relative flex ${rasio} w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ${
          seret
            ? "scale-[1.01] border-[#00A5EC] bg-[#00A5EC]/10"
            : url
            ? isDark
              ? "border-transparent bg-[#0B1220]"
              : "border-transparent bg-slate-100"
            : isDark
            ? "border-white/15 bg-white/[0.02] hover:border-[#00A5EC]/50 hover:bg-[#00A5EC]/5"
            : "border-slate-300 bg-white hover:border-[#00A5EC] hover:bg-[#00A5EC]/5"
        }`}
      >
        {/* Pratinjau gambar */}
        {url && !seret && (
          <img
            src={url}
            alt={judul}
            className={`h-full w-full ${
              muat === "contain" ? "object-contain p-4" : "object-cover"
            } transition-transform duration-500 group-hover/unggah:scale-105`}
          />
        )}

        {/* Kosong / sedang diseret */}
        {(!url || seret) && (
          <div className="pointer-events-none flex flex-col items-center gap-2 px-4 text-center">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                seret
                  ? "scale-110 bg-[#00A5EC] text-white"
                  : isDark
                  ? "bg-white/5 text-slate-400"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <UploadCloud className="h-6 w-6" strokeWidth={2} />
            </span>
            <p
              className={`text-[12.5px] font-bold ${
                seret
                  ? "text-[#00A5EC]"
                  : isDark
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {seret ? "Lepaskan berkas di sini" : "Seret & lepas gambar ke sini"}
            </p>
            <p
              className={`text-[11px] font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              atau <span className="font-black text-[#004F9F] underline decoration-dotted">klik untuk memilih berkas</span> · maks {maksMb} MB
            </p>
          </div>
        )}

        {/* Lapisan aksi saat sudah ada gambar */}
        {url && !seret && !mengunggah && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-[#0B1442]/85 via-[#0B1442]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover/unggah:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                bukaPemilih();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-[11.5px] font-black text-[#0B1442] shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.6} />
              Ganti
            </button>
            {onHapus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHapus();
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500/95 px-3.5 py-2 text-[11.5px] font-black text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.6} />
                Hapus
              </button>
            )}
          </div>
        )}

        {/* Lapisan saat mengunggah */}
        {mengunggah && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0B1442]/75 backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-white" strokeWidth={2.5} />
            <p className="text-[11.5px] font-bold text-white">Mengunggah berkas…</p>
            {namaBerkas && (
              <p className="max-w-[80%] truncate text-[10.5px] text-white/70">{namaBerkas}</p>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          pilihBerkas(e.target.files?.[0]);
          e.target.value = ""; // izinkan memilih berkas yang sama lagi
        }}
      />
    </div>
  );
};

export default DropZoneGambar;