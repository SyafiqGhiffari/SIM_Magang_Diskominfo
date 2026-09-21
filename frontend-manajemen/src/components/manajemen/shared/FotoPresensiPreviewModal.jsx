import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { formatTanggalHari } from "../../../constants/presensiStatus";

const FotoPresensiPreviewModal = ({
  isOpen,
  onClose,
  initialJenis = "masuk", // 'masuk' | 'pulang'
  fotoMasuk = null, // string URL
  fotoPulang = null, // string URL
  jamMasuk = null,
  jamPulang = null,
  tanggal = null,
  namaPeserta = "Peserta Magang",
  modeKehadiran = "WFO",
  lokasiMasuk = null,
  lokasiPulang = null,
}) => {
  // Tentukan jenis aktif secara terkomputasi (deriving state)
  const [userSelectedJenis, setUserSelectedJenis] = useState(null);
  const activeJenis =
    userSelectedJenis ||
    (initialJenis === "pulang" && fotoPulang
      ? "pulang"
      : fotoMasuk
      ? "masuk"
      : fotoPulang
      ? "pulang"
      : initialJenis);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Reset zoom & pos saat ganti jenis foto
  const switchJenis = useCallback((jenis) => {
    setUserSelectedJenis(jenis);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (fotoMasuk && activeJenis === "pulang") switchJenis("masuk");
      } else if (e.key === "ArrowRight") {
        if (fotoPulang && activeJenis === "masuk") switchJenis("pulang");
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "r" || e.key === "R") {
        handleRotate();
      } else if (e.key === "0") {
        handleReset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, activeJenis, fotoMasuk, fotoPulang, switchJenis, handleZoomIn, handleZoomOut, handleRotate, handleReset]);

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      handleReset();
    }
  };

  if (!isOpen) return null;

  const currentUrl = activeJenis === "masuk" ? fotoMasuk : fotoPulang;
  const currentJam = activeJenis === "masuk" ? jamMasuk : jamPulang;
  const currentLokasi = activeJenis === "masuk" ? lokasiMasuk : lokasiPulang;
  const hasBoth = Boolean(fotoMasuk && fotoPulang);

  const handleDownload = async () => {
    if (!currentUrl) return;
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanNama = (namaPeserta || "peserta").toLowerCase().replace(/[^a-z0-9]/g, "-");
      link.href = blobUrl;
      link.download = `bukti-presensi-${activeJenis}-${cleanNama}-${tanggal || Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-[backdropFade_0.2s_ease-out]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ─── TOP BAR HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-slate-900/80 border-b border-white/10 backdrop-blur-md shrink-0">
        {/* Left: Info Sesi & Peserta */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border ${
              activeJenis === "masuk"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 ring-1 ring-emerald-400/20"
                : "bg-amber-500/20 text-amber-300 border-amber-400/30 ring-1 ring-amber-400/20"
            }`}
          >
            {activeJenis === "masuk" ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                Bukti Presensi {activeJenis === "masuk" ? "Masuk" : "Pulang"}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                  activeJenis === "masuk"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {activeJenis === "masuk" ? "Sesi Kedatangan" : "Sesi Kepulangan"}
              </span>
              {modeKehadiran && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/15">
                  {modeKehadiran.toUpperCase()}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11.5px] text-slate-300 font-medium">
              <span className="text-white font-bold">{namaPeserta}</span>
              {tanggal && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-sky-400 shrink-0" />
                    {formatTanggalHari(tanggal)}
                  </span>
                </>
              )}
              {currentJam && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 font-bold text-sky-300">
                    <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                    {currentJam.slice(0, 5)} WIB
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Switcher Pill (jika ada kedua foto masuk & pulang) */}
        {hasBoth && (
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 p-1 border border-white/10 shadow-inner order-last sm:order-none mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => switchJenis("masuk")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeJenis === "masuk"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Foto Masuk</span>
              {jamMasuk && (
                <span className="text-[10px] opacity-80 font-mono">({jamMasuk.slice(0, 5)})</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchJenis("pulang")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeJenis === "pulang"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Foto Pulang</span>
              {jamPulang && (
                <span className="text-[10px] opacity-80 font-mono">({jamPulang.slice(0, 5)})</span>
              )}
            </button>
          </div>
        )}

        {/* Right: Close Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            title="Tutup Pratinjau (Esc)"
            className="group flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-white/10 transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* ─── MAIN STAGE (IMAGE VIEWER) ────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-8 ${
          zoom > 1
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-zoom-in"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Navigation Arrow Left */}
        {hasBoth && activeJenis === "pulang" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              switchJenis("masuk");
            }}
            title="Lihat Foto Masuk (Panah Kiri)"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {hasBoth && activeJenis === "masuk" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              switchJenis("pulang");
            }}
            title="Lihat Foto Pulang (Panah Kanan)"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* The Image */}
        {currentUrl ? (
          <div
            className="relative transition-transform duration-100 ease-out select-none flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={currentUrl}
              alt={`Bukti Presensi ${activeJenis}`}
              draggable={false}
              className="max-w-[92vw] max-h-[72vh] sm:max-h-[76vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-white/15 pointer-events-none bg-slate-950"
            />
          </div>
        ) : (
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 max-w-md">
            <p className="text-sm font-bold text-slate-300">Foto Presensi Tidak Tersedia</p>
            <p className="mt-1 text-xs text-slate-400">
              Sesi presensi {activeJenis} belum memiliki lampiran foto atau diajukan tanpa swafoto.
            </p>
          </div>
        )}

        {/* Petunjuk Interaksi Floating Ringan */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-slate-300 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-[#00A5EC]" />
          <span>Klik ganda / scroll untuk zoom • Drag untuk menggeser saat diperbesar</span>
        </div>
      </div>

      {/* ─── BOTTOM FLOATING TOOLBAR ──────────────────────────────────────────────── */}
      <div className="relative z-20 px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900/80 border-t border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Lokasi Singkat */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-sky-300">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <span className="truncate max-w-[280px]">
            {currentLokasi?.nama || "Lokasi Dinas Terekam"}
          </span>
        </div>

        {/* Center: Controls Zoom, Rotate, Reset */}
        <div className="flex items-center gap-1 sm:gap-1.5 mx-auto rounded-2xl bg-slate-800/90 p-1 border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Perkecil (-)"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span
            onClick={handleReset}
            title="Klik untuk reset zoom (100%)"
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-black text-sky-300 hover:bg-white/10 transition-colors cursor-pointer min-w-[50px] text-center"
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            title="Perbesar (+)"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={handleRotate}
            title="Putar 90° (R)"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Tampilan (0)"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Download & Tab Baru */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUrl && (
            <>
              <button
                type="button"
                onClick={handleDownload}
                title="Unduh Bukti Foto Presensi"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] hover:from-[#003d7a] hover:to-[#0090d0] text-white text-xs font-bold shadow-md shadow-sky-950/40 border border-sky-400/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh Bukti</span>
              </button>

              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka di Tab Baru"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FotoPresensiPreviewModal;
