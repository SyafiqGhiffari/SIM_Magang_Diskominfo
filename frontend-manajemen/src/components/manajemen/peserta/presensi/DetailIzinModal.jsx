import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  CalendarRange,
  MessageSquare,
  Eye,
  Trash2,
  ShieldCheck,
  HeartPulse,
  Paperclip,
  Image as ImageIcon,
  FileX,
  ExternalLink,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import {
  formatTanggalLengkap,
  formatTanggalPresensi,
} from "../../../../constants/presensiStatus";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const fetchAsBlobUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const DetailIzinModal = ({
  data,
  item,
  onClose,
  onBatal,
  readOnly,
  isDark,
  dk,
}) => {
  const itemData = data || item;
  const darkMode = isDark ?? dk ?? false;

  const isSakit = itemData?.jenis === "sakit";
  const JenisIcon = isSakit ? HeartPulse : FileText;
  const fileUrl = itemData?.file_bukti ? getFileUrl(itemData.file_bukti) : null;

  // Deteksi ekstensi file
  const lowerFile = String(itemData?.file_bukti || "").toLowerCase();
  const isPdf = lowerFile.endsWith(".pdf");
  const isImage =
    lowerFile.endsWith(".jpg") ||
    lowerFile.endsWith(".jpeg") ||
    lowerFile.endsWith(".png") ||
    lowerFile.endsWith(".webp");
  const fileName = itemData?.file_bukti
    ? itemData.file_bukti.split("/").pop().split("\\").pop()
    : "Lampiran-Berkas";

  // Hitung jumlah hari kalender dan hari kerja
  const startStr = itemData?.tanggal_mulai;
  const endStr = itemData?.tanggal_selesai || itemData?.tanggal_mulai;
  const s = new Date(startStr ? startStr.slice(0, 10) : "");
  const e = new Date(endStr ? endStr.slice(0, 10) : "");

  let totalHari = 1;
  let hariKerja = 1;
  if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
    totalHari = 0;
    hariKerja = 0;
    const cur = new Date(s);
    while (cur <= e) {
      totalHari++;
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        hariKerja++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    totalHari = Math.max(1, totalHari);
    hariKerja = Math.max(1, hariKerja);
  }

  const canvasRef = useRef(null);
  const canvasRefMobile = useRef(null);
  const defaultZoom = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 100;
  const [zoom, setZoom] = useState(defaultZoom);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load PDF atau Image
  useEffect(() => {
    if (!fileUrl) {
      const emptyTimeoutId = setTimeout(() => setDocLoading(false), 0);
      return () => clearTimeout(emptyTimeoutId);
    }

    const initTimeoutId = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
    }, 0);

    let cancelled = false;

    if (isImage) {
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setDocLoading(false);
      };
      img.onerror = () => {
        if (!cancelled) {
          setDocError(true);
          setDocLoading(false);
        }
      };
      img.src = fileUrl;
      return () => {
        cancelled = true;
        clearTimeout(initTimeoutId);
      };
    }

    if (isPdf) {
      fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
        .then((doc) => {
          if (cancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setDocLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setDocError(true);
            setDocLoading(false);
          }
        });

      return () => {
        cancelled = true;
        clearTimeout(initTimeoutId);
      };
    }

    const fallbackTimeoutId = setTimeout(() => setDocLoading(false), 0);
    return () => {
      clearTimeout(initTimeoutId);
      clearTimeout(fallbackTimeoutId);
    };
  }, [fileUrl, isImage, isPdf]);

  // Render PDF Canvas
  useEffect(() => {
    if (!pdfDoc || isImage) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport });
      }

      const canvasMobile = canvasRefMobile.current;
      if (canvasMobile) {
        canvasMobile.width = viewport.width;
        canvasMobile.height = viewport.height;
        const ctxMobile = canvasMobile.getContext("2d");
        page.render({ canvasContext: ctxMobile, viewport });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum, zoom, isImage, showMobilePreview]);

  if (!itemData) return null;

  const handlePrint = async () => {
    if (!fileUrl) return;
    setFileActionLoading("print");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
      const w = window.open(blobUrl, "_blank");
      if (w) {
        w.addEventListener("load", () => {
          w.print();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
      }
    } catch {
      window.open(fileUrl, "_blank");
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    setFileActionLoading("download");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
      const ext = isImage ? "jpg" : "pdf";
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${fileName.replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      window.open(fileUrl, "_blank");
    } finally {
      setFileActionLoading(null);
    }
  };

  const renderHeader = (isMobile) => {
    const visibilityClass = isMobile ? "md:hidden" : "hidden md:block";
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 sm:px-7 py-3.5 sm:py-5 shrink-0 ${visibilityClass}`}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Watermark ikon besar */}
        <JenisIcon
          className="absolute right-6 sm:right-14 top-1/2 -translate-y-1/2 w-16 sm:w-24 h-16 sm:h-24 opacity-[0.10] text-white pointer-events-none transform rotate-6"
          strokeWidth={1}
        />

        <div className="relative flex items-center gap-3 sm:gap-4 pr-8">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-[#00A5EC]/30 blur-xl animate-pulse" />
            <span className="relative flex h-10 w-10 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-white/10 border-2 border-white/20 text-white shadow-lg backdrop-blur-md">
              <JenisIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </span>
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-sm sm:text-lg font-black text-white truncate">
              Detail Pengajuan {isSakit ? "Izin Sakit" : "Izin Kegiatan"}
            </h3>
            <p className="text-[9.5px] sm:text-xs font-medium text-white/70 truncate mt-0.5">
              Diajukan pada{" "}
              {itemData.created_at
                ? formatTanggalLengkap(itemData.created_at)
                : formatTanggalLengkap(itemData.tanggal_mulai)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[8.5px] sm:text-[10px] font-bold text-white">
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300" />
                <span>Presensi Magang</span>
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-bold border backdrop-blur-md ${
                  isSakit
                    ? "bg-rose-500/20 text-rose-200 border-rose-400/30"
                    : "bg-sky-400/20 text-sky-200 border-sky-400/30"
                }`}
              >
                Kategori {isSakit ? "Sakit" : "Izin"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricCards = () => {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Metric 1: Status Verifikasi */}
        <div
          className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
            darkMode ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white"
          }`}
        >
          <p className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
            Status Verifikasi
          </p>
          {itemData.status === "disetujui" ? (
            <>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Disetujui</span>
              </p>
              <p className="text-[8.5px] text-slate-400 font-semibold">
                Diverifikasi pembimbing
              </p>
            </>
          ) : itemData.status === "ditolak" ? (
            <>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Ditolak</span>
              </p>
              <p className="text-[8.5px] text-slate-400 font-semibold">
                Pengajuan ditolak
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-black text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-amber-500" />
                </span>
                <span>Menunggu</span>
              </p>
              <p className="text-[8.5px] text-slate-400 font-semibold">
                Menunggu tinjauan mentor
              </p>
            </>
          )}
        </div>

        {/* Metric 2: Durasi Hari Kerja */}
        <div
          className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
            darkMode ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white"
          }`}
        >
          <p className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
            Durasi Terhitung
          </p>
          <p
            className={`mt-0.5 sm:mt-1 text-sm sm:text-xl font-black ${
              darkMode ? "text-[#00A5EC]" : "text-[#004F9F]"
            }`}
          >
            {hariKerja} Hari Kerja
          </p>
          {totalHari !== hariKerja && (
            <p className="text-[8.5px] text-slate-400 font-semibold">
              ({totalHari} hari kalender)
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`flex flex-col md:flex-row w-full max-w-6xl h-[96vh] md:h-[90vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] ${
          darkMode ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== PANEL KIRI: Viewer Dokumen Lampiran (Seperti di ReviewModal Kelola Pendaftaran) ===== */}
        <div
          className={`hidden md:flex flex-col w-full md:w-[58%] md:h-full border-b md:border-b-0 md:border-r ${
            darkMode ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
          }`}
        >
          {/* Toolbar atas Viewer */}
          <div
            className={`flex items-center justify-between gap-1.5 sm:gap-2 px-4 md:px-6 py-2.5 md:py-3.5 border-b shrink-0 ${
              darkMode ? "border-white/5" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-left">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 dark:from-white/10 dark:to-white/5 dark:text-slate-300 shadow-xs">
                {isPdf ? (
                  <FileText className="w-4 h-4 text-rose-500" />
                ) : isImage ? (
                  <ImageIcon className="w-4 h-4 text-sky-500" />
                ) : (
                  <Paperclip className="w-4 h-4 text-indigo-500" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-black truncate ${
                    darkMode ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {fileUrl ? fileName : "Tidak Ada Berkas Bukti"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {fileUrl
                    ? isPdf
                      ? "Dokumen PDF • Pratinjau Interaktif"
                      : isImage
                      ? "Foto / Gambar Bukti"
                      : "Lampiran Berkas"
                    : "Permohonan diajukan tanpa berkas lampiran"}
                </p>
              </div>
            </div>

            {/* Zoom Controls & Print/Download */}
            {fileUrl && !docLoading && !docError && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`flex items-center gap-0.5 rounded-full border shadow-xs px-1.5 py-0.5 ${
                    darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
                    className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] cursor-pointer"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`text-[10px] font-black min-w-[32px] text-center ${
                      darkMode ? "text-slate-200" : "text-slate-600"
                    }`}
                  >
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(200, z + 25))}
                    className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] cursor-pointer"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={fileActionLoading !== null}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-all hover:bg-slate-50 hover:text-[#004F9F] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-[#00A5EC] cursor-pointer"
                  title="Cetak Dokumen"
                >
                  {fileActionLoading === "print" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={fileActionLoading !== null}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-all hover:bg-slate-50 hover:text-[#004F9F] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-[#00A5EC] cursor-pointer"
                  title="Unduh Dokumen"
                >
                  {fileActionLoading === "download" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Area Canvas Dokumen / Gambar */}
          <div
            className={`relative flex-1 min-h-0 overflow-hidden flex flex-col ${
              darkMode ? "bg-[#0d1117]" : "bg-slate-50/70"
            }`}
          >
            {/* Scrollable Canvas / Image Viewport */}
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex">
              {!fileUrl ? (
                <div className="m-auto flex flex-col items-center justify-center gap-3 text-center p-6 max-w-sm">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400">
                    <FileX className="w-8 h-8" />
                  </span>
                  <p
                    className={`text-sm font-black ${
                      darkMode ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    Tidak Ada Dokumen Lampiran
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Permohonan izin ini diajukan tanpa melampirkan berkas bukti.
                  </p>
                </div>
              ) : docLoading ? (
                <div className="m-auto flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00A5EC]" />
                  <span className="text-xs font-bold text-slate-400">
                    Memuat pratinjau berkas...
                  </span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center justify-center gap-3 text-center">
                  <FileX className="w-10 h-10 text-rose-400" />
                  <span className="text-xs font-bold text-slate-500">
                    Gagal memuat pratinjau berkas
                  </span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Tab Baru</span>
                  </a>
                </div>
              ) : isImage ? (
                <div className="m-auto flex items-center justify-center min-h-full min-w-full overflow-auto p-2">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                    }}
                    className="max-h-[68vh] max-w-[90%] w-auto rounded-xl shadow-xl ring-1 ring-black/5 object-contain"
                  />
                </div>
              ) : (
                <div className="m-auto flex flex-col items-center justify-center min-h-full min-w-full overflow-auto p-2">
                  <canvas
                    ref={canvasRef}
                    className={`rounded-xl shadow-xl ring-1 ring-black/5 max-w-full ${
                      darkMode ? "bg-[#161b22]" : "bg-white"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Floating Pagination Toolbar jika PDF > 1 halaman (Fixed di bawah panel viewer) */}
            {fileUrl && !docLoading && !docError && isPdf && numPages > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border bg-slate-900/90 border-white/20 px-3.5 py-1.5 shadow-2xl backdrop-blur-md text-white select-none">
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="p-1 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black px-1 select-none font-mono text-white">
                  Hal {pageNum}/{numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum === numPages}
                  className="p-1 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== PANEL KANAN: Detail Informasi Pengajuan & Review ===== */}
        <div className="flex flex-col w-full md:w-[42%] md:h-full overflow-hidden">
          {/* Header Mobile & Desktop */}
          {renderHeader(true)}
          {renderHeader(false)}

          {/* Body Informasi & Detail */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4">
            {/* 1. Metric Cards */}
            {renderMetricCards()}

            {/* 2. Rentang Tanggal Card */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${
                darkMode
                  ? "bg-white/[0.02] border-white/10"
                  : "bg-slate-50/80 border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#004F9F]/10 text-[#004F9F] dark:bg-[#00A5EC]/15 dark:text-[#00A5EC] border border-[#004F9F]/15 dark:border-[#00A5EC]/20">
                  <CalendarRange className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Rentang Tanggal
                  </p>
                  <p
                    className={`text-xs sm:text-[13px] font-extrabold mt-0.5 truncate ${
                      darkMode ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    {formatTanggalLengkap(itemData.tanggal_mulai)}
                    {itemData.tanggal_mulai !== itemData.tanggal_selesai && (
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {" "}s.d. {formatTanggalLengkap(itemData.tanggal_selesai)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Alasan / Keterangan Card */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border space-y-2 ${
                darkMode
                  ? "bg-white/[0.02] border-white/10"
                  : "bg-slate-50/80 border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-black text-slate-600 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                <span>Alasan / Keterangan Pengajuan</span>
              </div>
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${
                  darkMode
                    ? "bg-white/[0.03] border-white/5 text-slate-200"
                    : "bg-white border-slate-200/60 text-slate-700"
                }`}
              >
                {itemData.alasan || "Tidak ada rincian alasan tambahan."}
              </div>
            </div>

            {/* 4. Berkas Lampiran Card (dengan tombol pratinjau mobile) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border space-y-2.5 ${
                darkMode
                  ? "bg-white/[0.02] border-white/10"
                  : "bg-slate-50/80 border-slate-200/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-black text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Dokumen Lampiran Bukti</span>
                </span>
                {fileUrl && (
                  <span
                    className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                      isPdf
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : isImage
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isPdf ? "PDF Document" : isImage ? "Foto / Gambar" : "Berkas"}
                  </span>
                )}
              </div>

              {fileUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isPdf
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                          : isImage
                          ? "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40"
                      }`}
                    >
                      {isPdf ? (
                        <FileText className="w-4 h-4" />
                      ) : isImage ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {fileName}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Berkas valid • Ditinjau pada viewer
                      </p>
                    </div>
                  </div>

                  {/* Tombol Pratinjau Mobile (Khusus layar kecil) */}
                  <div className="block md:hidden">
                    <button
                      type="button"
                      onClick={() => setShowMobilePreview(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004F9F] dark:bg-[#00A5EC] text-white py-2 text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Pratinjau Dokumen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs italic ${
                    darkMode
                      ? "bg-white/[0.02] border-white/5 text-slate-400"
                      : "bg-white border-slate-200/60 text-slate-500"
                  }`}
                >
                  <FileX className="w-4 h-4 shrink-0 opacity-60" />
                  <span>Tidak ada berkas bukti yang disertakan.</span>
                </div>
              )}
            </div>

            {/* 5. Catatan Tanggapan Mentor Pembimbing */}
            {itemData.status !== "menunggu" && (
              <div
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border space-y-2 ${
                  itemData.status === "disetujui"
                    ? darkMode
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-emerald-50/70 border-emerald-200"
                    : darkMode
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "bg-rose-50/70 border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span
                    className={`flex items-center gap-2 ${
                      itemData.status === "disetujui"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tanggapan Mentor Pembimbing</span>
                  </span>
                  {itemData.diproses_pada && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatTanggalPresensi(itemData.diproses_pada)}
                    </span>
                  )}
                </div>
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed italic ${
                    itemData.status === "disetujui"
                      ? darkMode
                        ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-200"
                        : "bg-white border-emerald-200 text-emerald-900"
                      : darkMode
                      ? "bg-rose-950/40 border-rose-500/20 text-rose-200"
                      : "bg-white border-rose-200 text-rose-900"
                  }`}
                >
                  &ldquo;
                  {itemData.catatan_mentor ||
                    (itemData.status === "disetujui"
                      ? "Permohonan izin telah diverifikasi dan disetujui oleh mentor pembimbing."
                      : "Permohonan izin ditolak.")}
                  &rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Footer Aksi */}
          <div
            className={`px-4 py-3 sm:px-6 sm:py-4 border-t flex items-center justify-between gap-3 shrink-0 ${
              darkMode ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/80"
            }`}
          >
            {!readOnly && itemData.status === "menunggu" && onBatal ? (
              <button
                type="button"
                onClick={() => onBatal(itemData)}
                className="group inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800/60 bg-rose-50/90 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:hover:bg-rose-600 dark:hover:text-white dark:hover:border-rose-600 hover:shadow-md hover:shadow-rose-600/20 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
                title="Batalkan permohonan ini"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-115 group-hover:-rotate-12" />
                <span>Batalkan Pengajuan</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-200/90 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE OVERLAY PREVIEW MODAL ===== */}
      {showMobilePreview && fileUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-3"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className={`relative flex flex-col w-full max-w-2xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#161b22] border border-white/10" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal pratinjau mobile */}
            <div
              className={`flex items-center justify-between gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b shrink-0 ${
                darkMode ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 text-left">
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg shadow-xs ${
                    darkMode ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span
                  className={`text-xs sm:text-sm font-black truncate ${
                    darkMode ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {fileName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Zoom Controls */}
                <div
                  className={`flex items-center gap-0.5 rounded-full border shadow-xs px-1 py-0.5 ${
                    darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
                    className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] cursor-pointer"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span
                    className={`text-[9.5px] font-black min-w-[28px] text-center ${
                      darkMode ? "text-slate-200" : "text-slate-600"
                    }`}
                  >
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(200, z + 25))}
                    className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-white/20 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setShowMobilePreview(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Area Pratinjau Canvas/Gambar */}
            <div
              className={`relative flex-1 min-h-0 overflow-auto p-4 flex ${
                darkMode ? "bg-[#0d1117]" : "bg-slate-50/50"
              }`}
            >
              {docLoading ? (
                <div className="m-auto flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00A5EC]" />
                  <span className="text-xs font-bold text-slate-400">
                    Memuat pratinjau...
                  </span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                  <FileX className="w-8 h-8" />
                  <span className="text-xs font-bold">Gagal memuat dokumen</span>
                </div>
              ) : isImage ? (
                <div className="m-auto flex items-center justify-center min-h-full min-w-full overflow-auto p-2">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    style={{
                      transform: `scale(${zoom / 50})`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                    }}
                    className="max-h-[68vh] max-w-[85vw] w-auto rounded-xl shadow-xl ring-1 ring-black/5 object-contain"
                  />
                </div>
              ) : (
                <div className="m-auto flex flex-col items-center justify-center min-h-full min-w-full overflow-auto p-2">
                  <canvas
                    ref={canvasRefMobile}
                    className={`rounded-xl shadow-xl ring-1 ring-black/5 max-w-full ${
                      darkMode ? "bg-[#161b22]" : "bg-white"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Floating Toolbar Bawah Mobile (Print & Download & Page Navigation) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border bg-slate-900/95 border-white/20 px-4 py-2 shadow-2xl backdrop-blur-md text-white select-none">
              {!isImage && numPages > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                    disabled={pageNum === 1}
                    className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-black px-1.5 font-mono text-white">
                    Hal {pageNum}/{numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                    disabled={pageNum === numPages}
                    className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-4 w-px bg-white/20 mx-1" />
                </div>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
                title="Cetak"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
                title="Unduh"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailIzinModal;
