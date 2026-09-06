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
 * Kotak unggah gambar dengan seret & lepas (drag and drop) di desktop,
 * dan tombol pilih gambar langsung yang praktis di perangkat mobile.
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
  rasio = "h-24 sm:h-40",
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
      className={`group/unggah relative overflow-hidden rounded-lg sm:rounded-2xl border p-2 sm:p-4 transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/40"
          : "border-slate-200/80 bg-white hover:border-[#00A5EC]/50 hover:shadow-md"
      }`}
    >
      {/* Kepala kecil */}
      <div className="mb-1.5 sm:mb-3 flex items-start justify-between gap-1.5 sm:gap-3">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[12.5px] font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            <span className="flex h-4.5 w-4.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-sm">
              <ImagePlus className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
            </span>
            {judul}
          </p>
          {ket && (
            <p
              className={`mt-0.5 text-[8.5px] sm:text-[11px] font-medium leading-snug break-words ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {ket}
            </p>
          )}
        </div>

        {url && !mengunggah && (
          <span
            className={`flex shrink-0 items-center gap-0.5 sm:gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide border ${
              isDark
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" strokeWidth={3} />
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
        className={`relative flex ${rasio} w-full cursor-pointer items-center justify-center overflow-hidden rounded-md sm:rounded-xl border-2 border-dashed transition-all duration-300 ${
          seret
            ? "scale-[1.01] border-[#00A5EC] bg-[#00A5EC]/10"
            : url
            ? isDark
              ? "border-transparent bg-[#0d1117]"
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
              muat === "contain" ? "object-contain p-2 sm:p-4" : "object-cover"
            } transition-transform duration-500 group-hover/unggah:scale-105`}
          />
        )}

        {/* Kosong / sedang diseret */}
        {(!url || seret) && (
          <div className="pointer-events-none flex flex-col items-center gap-1 sm:gap-2 px-2 text-center">
            <span
              className={`flex h-7 w-7 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-300 ${
                seret
                  ? "scale-110 bg-[#00A5EC] text-white"
                  : isDark
                  ? "bg-white/5 text-slate-400"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5 sm:h-6 sm:w-6" strokeWidth={2} />
            </span>
            <p
              className={`text-[9.5px] sm:text-[12.5px] font-bold ${
                seret
                  ? "text-[#00A5EC]"
                  : isDark
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {seret ? (
                "Lepaskan berkas di sini"
              ) : (
                <>
                  <span className="inline sm:hidden">Pilih berkas</span>
                  <span className="hidden sm:inline">Seret & lepas gambar ke sini</span>
                </>
              )}
            </p>
            <p
              className={`text-[8px] sm:text-[11px] font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              <span className="inline sm:hidden">JPG, PNG · maks {maksMb} MB</span>
              <span className="hidden sm:inline">
                atau <span className="font-black text-[#004F9F] underline decoration-dotted">klik untuk memilih berkas</span> · maks {maksMb} MB
              </span>
            </p>
          </div>
        )}

        {/* Lapisan aksi saat sudah ada gambar (khusus desktop saat di-hover) */}
        {url && !seret && !mengunggah && (
          <div className="hidden sm:flex absolute inset-0 items-center justify-center gap-2.5 bg-gradient-to-t from-[#0B1442]/85 via-[#0B1442]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover/unggah:opacity-100 backdrop-blur-[1px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                bukaPemilih();
              }}
              className="group/btn inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-[11.5px] font-black text-[#0B1442] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:bg-white active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#004F9F] transition-transform duration-500 group-hover/btn:rotate-180" strokeWidth={2.6} />
              Ganti
            </button>
            {onHapus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHapus();
                }}
                className="group/btn inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500/95 px-3.5 py-2 text-[11.5px] font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:bg-red-600 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110" strokeWidth={2.6} />
                Hapus
              </button>
            )}
          </div>
        )}

        {/* Lapisan saat mengunggah */}
        {mengunggah && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 bg-[#0B1442]/75 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-white" strokeWidth={2.5} />
            <p className="text-[10.5px] sm:text-[11.5px] font-bold text-white">Mengunggah berkas…</p>
            {namaBerkas && (
              <p className="max-w-[80%] truncate text-[9.5px] sm:text-[10.5px] text-white/70">{namaBerkas}</p>
            )}
          </div>
        )}
      </div>

      {/* Tombol aksi khusus mobile di bawah gambar (dengan animasi halus) */}
      {url && !seret && !mengunggah && (
        <div className="mt-2 flex items-center justify-end gap-1.5 sm:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              bukaPemilih();
            }}
            className={`group/mbtn inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9.5px] font-bold border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${
              isDark
                ? "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/25 active:bg-white/15"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300 hover:text-[#004F9F] active:bg-slate-100"
            }`}
          >
            <RefreshCw className="h-2.5 w-2.5 transition-transform duration-500 group-hover/mbtn:rotate-180" strokeWidth={2.6} />
            Ganti Gambar
          </button>
          {onHapus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHapus();
              }}
              className={`group/mbtn inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9.5px] font-bold border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${
                isDark
                  ? "border-red-900/40 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:border-red-800/60 active:bg-red-900/60"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 active:bg-red-100"
              }`}
            >
              <Trash2 className="h-2.5 w-2.5 transition-transform duration-300 group-hover/mbtn:rotate-12 group-hover/mbtn:scale-110" strokeWidth={2.6} />
              Hapus
            </button>
          )}
        </div>
      )}

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