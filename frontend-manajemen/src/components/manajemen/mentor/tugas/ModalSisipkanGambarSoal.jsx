import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Image as ImageIcon,
  UploadCloud,
  Link2,
  Trash2,
  AlertCircle,
  Sparkles,
  Save,
  Eye,
  Maximize2,
  ExternalLink,
} from "lucide-react";

export const ModalSisipkanGambarSoal = ({
  isOpen = false,
  onClose,
  soalIndex = 0,
  initialImageUrl = "",
  onApply,
  isDark = false,
}) => {
  // State diinisialisasi langsung dari props (tanpa setState di dalam useEffect untuk kepatuhan ESLint)
  const [tempImageUrl, setTempImageUrl] = useState(initialImageUrl || "");
  const [imageTab, setImageTab] = useState(() =>
    initialImageUrl &&
    (initialImageUrl.startsWith("http://") || initialImageUrl.startsWith("https://"))
      ? "url"
      : "upload"
  );
  const [imageError, setImageError] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageMeta, setImageMeta] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Handle tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLightboxOpen]);

  if (!isOpen) return null;

  // Helper proses file gambar (Base64)
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Berkas yang dipilih harus berupa gambar (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setImageError("Ukuran gambar maksimal adalah 3 MB.");
      return;
    }

    setImageError("");
    setImageMeta(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file);
    e.target.value = "";
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer?.files?.[0];
    processImageFile(file);
  };

  // Render Studio Viewport Showcase yang estetis & profesional
  const renderStudioViewport = () => (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/10 bg-slate-100/90 dark:bg-[#0c121e] flex flex-col items-center justify-center min-h-[240px] max-h-[340px] p-4 sm:p-5 shadow-inner select-none group/studio transition-all duration-300">
      {/* Texture grid dot-matrix studio photography */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 1.25px, transparent 1.25px)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Ambient lighting vignette */}
      <div className="absolute inset-0 bg-radial from-white/70 via-transparent to-slate-200/40 dark:from-sky-500/5 dark:via-transparent dark:to-black/50 pointer-events-none" />

      {/* Kartu bingkai gambar melayang (Framed Photo Card) dengan interaksi klik perbesar */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        title="Klik untuk melihat tampilan layar penuh"
        className="relative z-10 max-h-[280px] max-w-full flex items-center justify-center rounded-xl p-1.5 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/60 ring-1 ring-slate-900/10 dark:ring-white/15 transition-transform duration-300 ease-out group-hover/studio:scale-[1.015] cursor-zoom-in"
      >
        <img
          src={tempImageUrl}
          alt="Pratinjau Butir Soal"
          onLoad={(e) => {
            setImageMeta({
              w: e.currentTarget.naturalWidth,
              h: e.currentTarget.naturalHeight,
            });
          }}
          onError={() => {
            setImageError(
              imageTab === "url"
                ? "Gambar dari URL tidak dapat dimuat. Pastikan URL dapat diakses secara publik dan mengarah langsung ke berkas gambar."
                : "Berkas gambar tidak dapat dimuat atau rusak."
            );
          }}
          className="max-h-[265px] w-auto max-w-full object-contain rounded-lg"
        />
      </div>

      {/* Floating Pill Kiri Bawah: Status visual & resolusi gambar */}
      <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 dark:bg-black/85 backdrop-blur-md text-white text-[10px] font-medium shadow-md border border-white/10 pointer-events-none">
        <Eye className="w-3 h-3 text-[#00A5EC]" />
        <span>Pratinjau Soal</span>
        {imageMeta && (
          <>
            <span className="text-white/40">•</span>
            <span className="text-slate-300 font-mono text-[9.5px]">
              {imageMeta.w} × {imageMeta.h} px
            </span>
          </>
        )}
      </div>

      {/* Floating Button Kanan Atas: Perbesar ke Layar Penuh Sebenarnya */}
      <button
        type="button"
        onClick={() => setIsLightboxOpen(true)}
        title="Perbesar Tampilan ke Layar Penuh"
        className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 dark:bg-black/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-[10px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <Maximize2 className="w-3 h-3 text-[#00A5EC]" />
        <span>Perbesar</span>
      </button>
    </div>
  );

  return (
    <>
      <div
        className={`relative w-full max-w-2xl my-auto rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#161b22] border border-white/10 text-slate-100 shadow-black/60"
            : "bg-white text-slate-800 ring-1 ring-slate-900/5 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL (SIGNATURE KOMINFO GRADIENT) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4 sm:px-6 sm:py-4.5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />

          {/* Watermark Icon */}
          <ImageIcon
            className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.08] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon box dengan ikon putih solid */}
              <span className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <ImageIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-0.5 rounded-xl sm:rounded-2xl border border-[#00A5EC]/40 animate-pulse pointer-events-none" />
              </span>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#00A5EC]" />
                  <span>Visualisasi Butir Soal</span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                  Sisipkan Gambar Soal #{soalIndex !== null ? soalIndex + 1 : 1}
                </h3>
                <p className="text-[9.5px] sm:text-[10.5px] text-white/75 mt-0.5 truncate">
                  Tambahkan visual bagan, diagram, ilustrasi, atau studi kasus
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY MODAL ── */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 custom-modal-scrollbar ${
            isDark ? "bg-[#161b22]" : "bg-slate-50/50"
          }`}
        >
          {/* Tab Switcher: Ukuran teks disesuaikan ringkas & proporsional */}
          <div
            className={`grid grid-cols-2 p-1 rounded-xl border ${
              isDark
                ? "bg-slate-900/60 border-white/10"
                : "bg-slate-100/90 border-slate-200/90"
            }`}
          >
            <button
              type="button"
              onClick={() => setImageTab("upload")}
              className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                imageTab === "upload"
                  ? isDark
                    ? "bg-[#1c2333] text-[#00A5EC] shadow-xs border border-white/10"
                    : "bg-white text-[#004F9F] shadow-xs border border-slate-200/80"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Berkas</span>
            </button>
            <button
              type="button"
              onClick={() => setImageTab("url")}
              className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                imageTab === "url"
                  ? isDark
                    ? "bg-[#1c2333] text-[#00A5EC] shadow-xs border border-white/10"
                    : "bg-white text-[#004F9F] shadow-xs border border-slate-200/80"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Tautan / URL Web</span>
            </button>
          </div>

          {/* ── TAB 1: UNGGAH BERKAS ── */}
          {imageTab === "upload" && (
            <div>
              {!tempImageUrl ? (
                /* State 1: Belum ada gambar -> Dropzone pemilihan gambar */
                <label
                  htmlFor="kuis-image-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={handleImageDrop}
                  className={`relative flex flex-col items-center justify-center p-6 sm:p-7 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer group ${
                    isDraggingImage
                      ? isDark
                        ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                        : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                      : isDark
                      ? "border-sky-500/30 bg-slate-900/40 hover:border-sky-400 hover:bg-[#00A5EC]/5"
                      : "border-blue-200 bg-white hover:border-[#004F9F] hover:bg-blue-50/40 shadow-2xs"
                  }`}
                >
                  <input
                    id="kuis-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#004F9F]/10 to-[#00A5EC]/20 dark:from-[#00A5EC]/20 dark:to-[#00A5EC]/10 text-[#004F9F] dark:text-[#00A5EC] mb-2.5 group-hover:scale-110 transition-transform duration-200 shadow-2xs">
                    <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                  </div>
                  <p className="text-[11.5px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 text-center">
                    {isDraggingImage
                      ? "Lepaskan berkas gambar di sini"
                      : "Klik untuk memilih gambar atau seret berkas ke sini"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center font-medium">
                    Format PNG, JPG, JPEG, WEBP &middot; Maksimal 3 MB
                  </p>
                </label>
              ) : (
                /* State 2: Sudah ada gambar -> Kolom Pratinjau Terpadu Bernuansa Studio */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={handleImageDrop}
                  className={`relative rounded-2xl border p-3 sm:p-3.5 transition-all duration-200 flex flex-col items-center group overflow-hidden ${
                    isDraggingImage
                      ? isDark
                        ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                        : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                      : isDark
                      ? "border-white/10 bg-slate-900/60"
                      : "border-slate-200 bg-white/80"
                  } shadow-sm`}
                >
                  {/* Drag overlay saat pengguna menyeret berkas pengganti */}
                  {isDraggingImage && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#004F9F]/90 text-white rounded-2xl backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
                      <UploadCloud className="w-8 h-8 animate-bounce mb-1 text-white" />
                      <span className="text-xs font-black">Lepaskan gambar di sini untuk mengganti</span>
                    </div>
                  )}

                  {/* Baris Status & Tombol Aksi Pratinjau */}
                  <div className="w-full flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-white/5">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        Gambar Terpilih & Siap
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Tombol Ganti Berkas */}
                      <label
                        htmlFor="kuis-image-replace"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-bold text-[#004F9F] dark:text-[#00A5EC] bg-white dark:bg-white/5 hover:bg-blue-50/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-sky-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <UploadCloud className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Ganti Berkas</span>
                      </label>
                      <input
                        id="kuis-image-replace"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />

                      {/* Tombol Hapus Gambar */}
                      <button
                        type="button"
                        onClick={() => {
                          setTempImageUrl("");
                          setImageError("");
                          setImageMeta(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Wadah Tampilan Studio Showcase */}
                  {renderStudioViewport()}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: TAUTAN / URL WEB ── */}
          {imageTab === "url" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10.5px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Tautan URL Gambar (Langsung):</span>
                  </span>
                  {tempImageUrl && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {tempImageUrl.length} karakter
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={tempImageUrl}
                    onChange={(e) => {
                      setTempImageUrl(e.target.value);
                      setImageError("");
                      setImageMeta(null);
                    }}
                    placeholder="https://contoh-domain.com/path/gambar.png"
                    className={`w-full h-9 sm:h-10 px-3 pl-9 pr-9 text-xs rounded-xl border font-medium transition-all ${
                      isDark
                        ? "bg-slate-900/70 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                        : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20`}
                  />
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  {tempImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempImageUrl("");
                        setImageError("");
                        setImageMeta(null);
                      }}
                      title="Kosongkan tautan"
                      className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                  Pastikan tautan dapat diakses secara publik dan berakhiran format gambar (.png, .jpg, .webp).
                </p>
              </div>

              {/* Pratinjau Tautan jika URL telah diisi */}
              {tempImageUrl && (
                <div
                  className={`rounded-2xl border p-3 sm:p-3.5 flex flex-col items-center transition-all ${
                    isDark
                      ? "border-white/10 bg-slate-900/60"
                      : "border-slate-200 bg-white/80"
                  } shadow-sm`}
                >
                  <div className="w-full flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-white/5">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/50 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                      <span className="text-[10.5px] font-bold text-sky-700 dark:text-sky-300">
                        Tautan Gambar Terpasang
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(tempImageUrl.startsWith("http://") || tempImageUrl.startsWith("https://")) && (
                        <a
                          href={tempImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-bold text-[#004F9F] dark:text-[#00A5EC] bg-white dark:bg-white/5 hover:bg-blue-50/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-300 transition-all shadow-2xs active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Sumber</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setTempImageUrl("");
                          setImageError("");
                          setImageMeta(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Tautan</span>
                      </button>
                    </div>
                  </div>

                  {/* Wadah Tampilan Studio Showcase */}
                  {renderStudioViewport()}
                </div>
              )}
            </div>
          )}

          {/* Pesan Error jika ada */}
          {imageError && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-[modalFadeUp_0.15s_ease-out]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[11px] sm:text-xs">{imageError}</span>
            </div>
          )}
        </div>

        {/* ── FOOTER MODAL GAMBAR (BIRU GELAP KOMINFO + ICON SAVE DENGAN ANIMASI HOVER) ── */}
        <div
          className={`flex items-center justify-end gap-2 p-3 sm:px-6 sm:py-3.5 border-t shrink-0 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] sm:text-xs font-bold rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <span>Batal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onApply?.(tempImageUrl);
            }}
            className="group/btnSimpan inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 text-[11px] sm:text-xs font-black rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border-0"
          >
            <Save className="w-3.5 h-3.5 text-white shrink-0 transition-transform duration-200 ease-out group-hover/btnSimpan:scale-115 group-hover/btnSimpan:-translate-y-0.5" />
            <span>Terapkan Gambar ke Soal</span>
          </button>
        </div>
      </div>

      {/* ── TRUE FULLSCREEN LIGHTBOX PORTAL (LAYAR PENUH SEBENARNYA KE BODY DOKUMEN) ── */}
      {isLightboxOpen &&
        tempImageUrl &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-[fadeIn_0.2s_ease-out] select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar Floating Header */}
            <div
              className="fixed top-0 inset-x-0 z-[10000] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-semibold shadow-xl">
                  <Eye className="w-3.5 h-3.5 text-[#00A5EC]" />
                  <span>Pratinjau Layar Penuh &middot; Butir Soal #{soalIndex !== null ? soalIndex + 1 : 1}</span>
                  {imageMeta && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-sky-300 font-mono text-[11px]">
                        {imageMeta.w} × {imageMeta.h} px
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:rotate-90 duration-200 border border-white/15 shadow-xl"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Large Image Viewport */}
            <div
              className="relative max-h-[85vh] max-w-[94vw] flex items-center justify-center p-2 rounded-2xl bg-white/5 ring-1 ring-white/15 shadow-2xl cursor-zoom-out"
              onClick={() => setIsLightboxOpen(false)}
            >
              <img
                src={tempImageUrl}
                alt="Tampilan Penuh Pratinjau"
                className="max-h-[82vh] max-w-[90vw] w-auto h-auto object-contain rounded-xl shadow-2xl transition-transform duration-200"
              />
            </div>

            {/* Bottom Caption Hint */}
            <div className="fixed bottom-4 inset-x-0 text-center pointer-events-none">
              <p className="inline-flex items-center gap-1.5 text-white/70 text-xs font-medium bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
                Klik di luar gambar atau tekan <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">Esc</kbd> untuk menutup tampilan penuh
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ModalSisipkanGambarSoal;
