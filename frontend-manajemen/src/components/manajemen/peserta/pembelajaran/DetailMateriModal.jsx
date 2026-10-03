import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Video,
  Paperclip,
  Printer,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpenText,
  Copy,
  Check,
  Eye,
  FileDown,
  Info,
  FolderOpen,
  Image as ImageIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileX,
  Loader2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Helper ekstraksi ID YouTube
const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getInitials = (nama) =>
  (nama || "?")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const fetchAsBlobUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const DetailMateriModal = ({
  isOpen,
  onClose,
  materi,
  isSelesai = false,
  onToggleSelesai,
  isDark = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fotoError, setFotoError] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const canvasRef = useRef(null);
  const canvasRefMobile = useRef(null);
  const defaultZoom = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 100;
  const [zoom, setZoom] = useState(defaultZoom);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);

  const rawFilePath = materi?.file_materi || materi?.file_path;
  const fileUrl = rawFilePath ? getFileUrl(rawFilePath) : null;
  const fileName = rawFilePath
    ? rawFilePath.split("/").pop().split("\\").pop()
    : `${materi?.judul || "Modul"}.pdf`;
  const lowerFile = String(rawFilePath || "").toLowerCase();
  const isPdf = lowerFile.endsWith(".pdf") || (fileUrl && String(fileUrl).toLowerCase().includes(".pdf"));
  const isImage =
    lowerFile.endsWith(".jpg") ||
    lowerFile.endsWith(".jpeg") ||
    lowerFile.endsWith(".png") ||
    lowerFile.endsWith(".webp");

  const externalLink = materi?.tautan_eksternal || materi?.link_eksternal;
  const youTubeId = extractYouTubeId(externalLink);
  const hasFile = !!fileUrl;
  const hasExternalLink = !!externalLink;

  const fileExt = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  const getFileBadgeInfo = (ext) => {
    switch (ext) {
      case "pptx":
      case "ppt":
        return {
          label: "Presentasi PPTX",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
          iconColor: "text-amber-500",
          desc: "Modul presentasi slide tayang",
        };
      case "docx":
      case "doc":
        return {
          label: "Dokumen Word",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40",
          iconColor: "text-blue-500",
          desc: "Modul naskah dokumen kerja",
        };
      case "xlsx":
      case "xls":
      case "csv":
        return {
          label: "Lembar Kerja Excel",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
          iconColor: "text-emerald-500",
          desc: "Modul tabel dan data angka",
        };
      case "zip":
      case "rar":
      case "7z":
        return {
          label: "Arsip Berkas (ZIP)",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/40",
          iconColor: "text-purple-500",
          desc: "Paket arsip berkas lengkap",
        };
      default:
        return {
          label: ext ? `Berkas ${ext.toUpperCase()}` : "Berkas Dokumen",
          badgeColor: "bg-blue-50 text-[#004F9F] border-blue-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40",
          iconColor: "text-[#004F9F] dark:text-[#00A5EC]",
          desc: "Lampiran dokumen modul",
        };
    }
  };
  const fileBadge = getFileBadgeInfo(fileExt);

  const [selectedViewerTab, setSelectedViewerTab] = useState(null);
  const viewerMode = selectedViewerTab ?? (hasFile ? "file" : "link");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Muat dokumen PDF dengan pdfjs-dist saat modal terbuka dan file bertipe PDF
  useEffect(() => {
    if (!isOpen || !fileUrl || !isPdf) {
      const resetTimer = setTimeout(() => {
        setPdfDoc(null);
        setPageNum(1);
        setDocLoading(false);
        setDocError(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    let cancelled = false;
    const initTimer = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
      setPageNum(1);
    }, 0);

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
      .catch((err) => {
        if (cancelled) return;
        console.error("Gagal membaca dokumen PDF materi:", err);
        setDocError(true);
        setDocLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
    };
  }, [isOpen, fileUrl, isPdf]);

  // Render halaman PDF ke canvas saat pageNum, zoom, pdfDoc, atau mobile preview berubah
  useEffect(() => {
    if (!pdfDoc || !isPdf) return;
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
  }, [pdfDoc, pageNum, zoom, showMobilePreview, isPdf]);

  if (!isOpen || !materi) return null;

  const mentorNama = materi.mentor?.nama || "Instruktur Diskominfo";
  const mentorFoto = materi.mentor?.foto_profil ? getFileUrl(materi.mentor.foto_profil) : null;

  const handleCopyLink = () => {
    const link = externalLink || fileUrl;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = async () => {
    if (!fileUrl) return;
    setActionLoading("print");
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
      setActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    setActionLoading("download");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      window.open(fileUrl, "_blank");
    } finally {
      setActionLoading(null);
    }
  };

  // Header bernuansa biru tua Diskominfo
  const renderHeader = (isMobile) => {
    const visibilityClass = isMobile ? "md:hidden" : "hidden md:block";
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 sm:px-7 py-3.5 sm:py-6 shrink-0 ${visibilityClass}`}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Tombol Tutup Modal */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer"
          title="Tutup Modal (Esc)"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Watermark ikon besar khas dashboard SIM Magang */}
        <BookOpenText
          className="absolute right-6 sm:right-15 top-1/2 -translate-y-1/2 w-16 sm:w-28 h-16 sm:h-28 opacity-[0.12] text-white pointer-events-none transform rotate-6"
          strokeWidth={1}
        />

        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-[#00A5EC]/30 blur-xl animate-pulse" />
            {mentorFoto && !fotoError ? (
              <img
                src={mentorFoto}
                alt={mentorNama}
                onError={() => setFotoError(true)}
                className="relative h-11 w-11 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-lg border-2 sm:border-[3px] border-white/20 ring-2 sm:ring-4 ring-white/10"
              />
            ) : (
              <span className="relative flex h-11 w-11 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 border-2 sm:border-[3px] border-white/20 text-white text-xs sm:text-lg font-black backdrop-blur-md">
                {getInitials(mentorNama)}
              </span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-lg font-black text-white truncate">
                {mentorNama}
              </h3>
            </div>
            <p className="text-[9.5px] sm:text-xs font-medium text-white/70 truncate mt-0.5">
              Pengampu Modul Pembelajaran &bull; Diskominfo
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
              {/* Badge Kategori */}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[10px] font-bold text-white">
                <FolderOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00A5EC]" />
                {materi.kategori || "Umum"}
              </span>

              {/* Badge Status Belajar */}
              <span
                className={`inline-flex items-center gap-1 rounded-full backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[10px] font-bold border ${
                  isSelesai
                    ? "bg-emerald-500/25 border-emerald-300/30 text-emerald-200"
                    : "bg-amber-500/25 border-amber-300/30 text-amber-200"
                }`}
              >
                {isSelesai ? (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Selesai Dipelajari</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Belum Dipelajari</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showFileView = viewerMode === "file" && hasFile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`flex flex-col md:flex-row w-full max-w-7xl h-[96vh] md:h-[92vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== PANEL KIRI: Viewer Dokumen / Pratinjau Media ===== */}
        <div
          className={`hidden md:flex flex-col w-full md:w-[58%] md:h-full border-b md:border-b-0 md:border-r ${
            isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
          }`}
        >
          {/* Toolbar atas viewer */}
          <div
            className={`flex items-center justify-between gap-1.5 sm:gap-2 px-4 md:px-6 py-2.5 md:py-4 border-b shrink-0 ${
              isDark ? "border-white/5" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-left">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                {showFileView ? (
                  isPdf ? (
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                  ) : isImage ? (
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                  )
                ) : youTubeId ? (
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                ) : hasExternalLink ? (
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                ) : (
                  <BookOpenText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                )}
              </span>
              <div className="min-w-0">
                <span
                  className={`text-xs sm:text-sm font-extrabold truncate block ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {showFileView ? fileName : hasExternalLink ? externalLink : materi.judul}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {showFileView
                    ? isPdf
                      ? "Dokumen Portabel (PDF)"
                      : isImage
                      ? "Berkas Gambar / Foto"
                      : "Lampiran Dokumen Modul"
                    : youTubeId
                    ? "Video Pembelajaran Interaktif"
                    : hasExternalLink
                    ? "Tautan Daring Eksternal"
                    : "Panduan Modul Pembelajaran"}
                </span>
              </div>
            </div>

            {/* Kontrol Switching jika ada File DAN Tautan */}
            <div className="flex items-center gap-1.5 shrink-0">
              {hasFile && hasExternalLink && (
                <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSelectedViewerTab("file")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      viewerMode === "file"
                        ? "bg-white dark:bg-slate-800 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Dokumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedViewerTab("link")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      viewerMode === "link"
                        ? "bg-white dark:bg-slate-800 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Tautan</span>
                  </button>
                </div>
              )}

              {/* Kontrol Zoom PDF */}
              {showFileView && isPdf && !docLoading && !docError && (
                <div
                  className={`hidden sm:flex items-center gap-0.5 sm:gap-1 rounded-full border shadow-2xs px-1 sm:px-1.5 py-0.5 md:py-1 shrink-0 ${
                    isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
                    disabled={zoom <= 25}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] hover:scale-110 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:hover:scale-100"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(100)}
                    className={`text-[10px] md:text-xs font-bold w-9 md:w-11 text-center tabular-nums cursor-pointer hover:underline ${
                      isDark ? "text-slate-300" : "text-[#0B1442]"
                    }`}
                    title="Reset Ukuran (100%)"
                  >
                    {zoom}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(200, z + 25))}
                    disabled={zoom >= 200}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] hover:scale-110 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:hover:scale-100"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}

              {/* Action Buttons: Buka Tab Baru, Print & Download */}
              {(externalLink || fileUrl) && (
                <a
                  href={showFileView ? fileUrl : externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                  title="Buka di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              )}

              {showFileView && isPdf && (
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={actionLoading !== null}
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                  title="Cetak Berkas"
                >
                  {actionLoading === "print" ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              )}

              {showFileView && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={actionLoading !== null}
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                  title="Unduh Berkas"
                >
                  {actionLoading === "download" ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Wrapper Konten Viewer dengan Background Dot-Matrix Khas SIM Magang */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              className="flex-1 p-3 sm:p-5 overflow-auto flex"
              style={{
                backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
                backgroundImage: isDark
                  ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
                  : "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              {showFileView ? (
                isPdf ? (
                  /* 1. Canvas PDF Viewer berbasis pdfjs-dist */
                  docLoading ? (
                    <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                      <div
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-[3px] border-slate-300 animate-spin ${
                          isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                        }`}
                      />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-300">
                        Memuat modul PDF...
                      </span>
                    </div>
                  ) : docError ? (
                    <div className="m-auto flex flex-col items-center gap-2.5 text-center text-slate-400">
                      <FileX className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-300">
                        Gagal memuat pratinjau modul PDF
                      </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800 transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Berkas di Tab Baru</span>
                      </a>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      className={`m-auto rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out] ${
                        isDark ? "bg-[#161b22]" : "bg-white"
                      }`}
                    />
                  )
                ) : isImage ? (
                  /* 2. Embed Pratinjau Gambar */
                  <div className="m-auto max-w-full max-h-full flex items-center justify-center p-2">
                    <img
                      src={fileUrl}
                      alt={materi.judul}
                      className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10"
                    />
                  </div>
                ) : (
                  /* 3. Berkas Non-PDF (ZIP, PPTX, DOCX, dll.) */
                  <div
                    className={`relative m-auto w-full max-w-md p-6 sm:p-7 rounded-3xl border text-center transition-all duration-300 shadow-xl overflow-hidden ${
                      isDark
                        ? "bg-[#161b22]/95 border-white/10 shadow-black/40"
                        : "bg-white/95 border-slate-200/90 shadow-slate-200/60 backdrop-blur-md"
                    }`}
                  >
                    {/* Ambient Glow Efek Khas SIM Magang */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#00A5EC]/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Badge Kategori Header */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/80 dark:border-sky-800/50 mb-3 shadow-2xs">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Berkas Materi Pembelajaran</span>
                    </div>

                    {/* Wadah Ikon Berkas Menawan dengan Layering & Border */}
                    <div className="relative mx-auto mb-3.5 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/15 via-[#00A5EC]/20 to-blue-600/10 border border-blue-200/70 dark:border-sky-700/40 flex items-center justify-center shadow-xs">
                        <FileDown className="w-8 h-8 text-[#004F9F] dark:text-[#00A5EC]" />
                      </div>
                    </div>

                    {/* Judul & Penjelasan Modul */}
                    <div className="space-y-1.5 mb-3.5">
                      <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                        Berkas Materi Pembelajaran Tersedia
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Modul ini dilampirkan dalam format berkas dokumen. Klik tombol di bawah untuk mengunduh dan membaca materi secara lengkap.
                      </p>
                    </div>

                    {/* Kotak Rincian Berkas Terlampir */}
                    <div
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 mb-4 transition-colors ${
                        isDark
                          ? "bg-white/[0.03] border-white/10"
                          : "bg-slate-50/90 border-slate-200/80"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100/90 dark:bg-blue-900/50 text-[#004F9F] dark:text-[#00A5EC] flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-sky-700/30">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${fileBadge.badgeColor}`}
                          >
                            {fileBadge.label}
                          </span>
                        </div>
                        <p
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5"
                          title={fileName}
                        >
                          {fileName}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Berkas siap diunduh &amp; dipelajari</span>
                        </p>
                      </div>
                    </div>

                    {/* Tombol Unduh: Gaya Badge Biru Elegan */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-[#004F9F] dark:text-sky-300 hover:text-[#003870] dark:hover:text-sky-200 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Berkas Lengkap</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                      Tips: Buka berkas yang telah diunduh menggunakan aplikasi pembaca dokumen pendukung.
                    </p>
                  </div>
                )
              ) : youTubeId ? (
                /* 4. Embed Pemutar Video YouTube */
                <div className="m-auto w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${youTubeId}?rel=0&modestbranding=1`}
                    title={materi.judul}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : hasExternalLink ? (
                /* 5. Tautan Daring Eksternal */
                <div
                  className={`relative m-auto w-full max-w-md p-6 sm:p-7 rounded-3xl border text-center transition-all duration-300 shadow-xl overflow-hidden ${
                    isDark
                      ? "bg-[#161b22]/95 border-white/10 shadow-black/40"
                      : "bg-white/95 border-slate-200/90 shadow-slate-200/60 backdrop-blur-md"
                  }`}
                >
                  {/* Ambient Glow Efek Khas SIM Magang */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#00A5EC]/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Badge Kategori Header */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/80 dark:border-sky-800/50 mb-3 shadow-2xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tautan Modul Pembelajaran Daring</span>
                  </div>

                  {/* Wadah Ikon Globe Menawan dengan Layering & Border */}
                  <div className="relative mx-auto mb-3.5 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/15 via-[#00A5EC]/20 to-blue-600/10 border border-blue-200/70 dark:border-sky-700/40 flex items-center justify-center shadow-xs">
                      <Globe className="w-8 h-8 text-[#004F9F] dark:text-[#00A5EC]" />
                    </div>
                  </div>

                  {/* Judul & Penjelasan Modul */}
                  <div className="space-y-1.5 mb-3.5">
                    <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                      Akses Modul Eksternal
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Materi ini disediakan oleh pengampu melalui tautan eksternal. Klik tombol di bawah untuk membuka dan mempelajari modul di tab baru peramban Anda.
                    </p>
                  </div>

                  {/* Kotak URL Tautan & Tombol Salin */}
                  <div
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 max-w-md mx-auto text-left mb-4 transition-colors ${
                      isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-50/90 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                      <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span
                        className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 truncate"
                        title={externalLink}
                      >
                        {externalLink}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        copied
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                          : "bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/20"
                      }`}
                      title="Salin Tautan"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tombol Aksi Buka Tautan: Gaya Badge Biru Elegan */}
                  <div className="flex items-center justify-center gap-2">
                    <a
                      href={externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-[#004F9F] dark:text-sky-300 hover:text-[#003870] dark:hover:text-sky-200 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      <span>Buka Tautan di Tab Baru</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                    Tips: Pastikan peramban Anda tidak memblokir pop-up/tab baru agar halaman modul dapat langsung terbuka.
                  </p>
                </div>
              ) : (
                /* 6. Tidak Ada Berkas/Media (Teks Saja) */
                <div className="m-auto flex flex-col items-center justify-center gap-3 text-slate-400 text-center max-w-xs">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                      isDark ? "bg-white/5" : "bg-white"
                    }`}
                  >
                    <BookOpenText className="w-7 h-7 text-slate-400" />
                  </span>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-300">
                    Modul Berupa Instruksi &amp; Panduan
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pengampu menyediakan rincian instruksi pada kolom deskripsi di panel informasi.
                  </p>
                </div>
              )}
            </div>

            {/* Floating PDF Pagination (Desktop) */}
            {showFileView && isPdf && numPages > 1 && !docLoading && !docError && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full border bg-slate-900/85 border-white/10 px-3.5 py-1.5 shadow-xl backdrop-blur-md text-white transition-all duration-300 hover:scale-105 hover:bg-slate-900 select-none">
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="rounded-full p-1.5 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed hover:bg-white/10 hover:scale-115 active:scale-90 text-white/80 hover:text-white"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black whitespace-nowrap px-2 select-none text-white">
                  Hal {pageNum} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum === numPages}
                  className="rounded-full p-1.5 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed hover:bg-white/10 hover:scale-115 active:scale-90 text-white/80 hover:text-white"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== PANEL KANAN: Informasi & Tindakan Peserta ===== */}
        <div
          className={`flex flex-col w-full md:w-[42%] flex-1 min-h-0 md:h-full ${
            isDark ? "bg-[#1a202c]/20" : "bg-slate-50/40"
          }`}
        >
          {renderHeader(true)}
          {renderHeader(false)}

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-3.5 md:px-7 py-3.5 md:py-5 space-y-3.5 md:space-y-4.5">
            {/* Info Workflow Alert Banner */}
            <div
              className={`flex items-center gap-2 rounded-xl border p-2.5 sm:p-3.5 ${
                isDark
                  ? "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-slate-300"
                  : "bg-blue-50 border-blue-100 text-blue-700"
              }`}
            >
              <Info className="w-4 h-4 text-[#00A5EC] dark:text-[#00A5EC] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-[11px] md:text-[11.5px] leading-relaxed">
                  {isSelesai ? (
                    <span>
                      Modul pembelajaran ini telah Anda tandai <b>selesai dipelajari</b>. Anda dapat meninjau kembali materi kapan saja.
                    </span>
                  ) : (
                    <span>
                      Pelajari materi secara cermat. Klik tombol <b>Tandai Selesai</b> di bawah setelah Anda memahami seluruh modul.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Metric Info Cards (Grid 2 Kolom Khas ProsesIzinModal) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Card 1: Status Pembelajaran */}
              <div
                className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Status Pembelajaran
                </p>
                <p
                  className={`mt-0.5 sm:mt-1 text-xs sm:text-base font-black ${
                    isSelesai
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isSelesai ? "Selesai Dipelajari" : "Belum Selesai"}
                </p>
                <p className="mt-0.5 text-[8.5px] sm:text-[10.5px] font-bold text-slate-400 truncate max-w-full">
                  {isSelesai ? "Tercatat pada progres magang" : "Tersedia untuk dipelajari"}
                </p>
              </div>

              {/* Card 2: Sasaran & Format */}
              <div
                className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Sasaran &amp; Media
                </p>
                <p
                  className={`mt-0.5 sm:mt-1 text-xs sm:text-base font-black ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {(materi.tipe_media || "Dokumen").toUpperCase()}
                </p>
                <p className="mt-0.5 text-[8.5px] sm:text-[10.5px] font-bold text-slate-400 truncate max-w-full">
                  {materi.posisi_bidang === "semua" || !materi.posisi_bidang
                    ? "Semua Bidang Magang"
                    : materi.posisi_bidang}
                </p>
              </div>
            </div>

            {/* Judul & Deskripsi Pembelajaran */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-2 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Judul &amp; Panduan Belajar
                </span>
                {materi.created_at && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10.5px] font-semibold text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTanggalPresensi(materi.created_at)}
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                {materi.judul}
              </h4>

              <div
                className={`p-3 rounded-xl border text-xs sm:text-[12px] font-medium leading-relaxed italic ${
                  isDark
                    ? "bg-white/[0.03] border-white/5 text-slate-300"
                    : "bg-slate-50 border-slate-100 text-slate-700"
                }`}
              >
                &ldquo;{materi.deskripsi || "Tidak ada rincian deskripsi tambahan yang dilampirkan oleh pengampu."}&rdquo;
              </div>
            </div>

            {/* Akses Berkas & Tautan Modul */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-3 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Akses Berkas &amp; Tautan Modul
                </span>
                {hasFile && hasExternalLink ? (
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-blue-100 text-[#004F9F] dark:bg-sky-950 dark:text-sky-300">
                    Berkas &amp; Tautan Daring
                  </span>
                ) : hasExternalLink ? (
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Tautan Daring
                  </span>
                ) : hasFile ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                      isPdf
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : isImage
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isPdf ? "PDF Document" : isImage ? "Foto / Gambar" : "Berkas Lampiran"}
                  </span>
                ) : null}
              </div>

              {/* 1. JIKA ADA TAUTAN DARING EKSTERNAL */}
              {hasExternalLink && (
                <div
                  className={`p-3 sm:p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-slate-50 border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          Tautan Materi Daring
                        </p>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                          Materi eksternal disediakan oleh mentor
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Kotak URL Tautan & Tombol Salin */}
                  <div
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 font-mono ${
                      isDark
                        ? "bg-[#161b22] border-white/10 text-sky-300"
                        : "bg-white border-slate-200/80 text-[#004F9F]"
                    }`}
                  >
                    <span className="truncate flex-1 text-[11px]" title={externalLink}>
                      {externalLink}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-colors cursor-pointer"
                      title="Salin Alamat Tautan"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Tombol Aksi Buka Tautan Eksternal */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <a
                      href={externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 hover:bg-blue-100 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tautan Materi</span>
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    * Klik tombol di atas untuk membuka tautan materi pada tab peramban baru.
                  </p>
                </div>
              )}

              {/* 2. JIKA ADA BERKAS DOKUMEN FISIK */}
              {hasFile && (
                <div
                  className={`p-3 sm:p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-slate-50 border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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
                      <p
                        className={`text-xs font-bold truncate ${
                          isDark ? "text-slate-100" : "text-[#0B1442]"
                        }`}
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Berkas lampiran siap dipelajari</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 hover:bg-blue-100 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </button>

                    {/* Tombol Pratinjau Mobile (Khusus Layar Kecil) */}
                    <div className="block md:hidden flex-1">
                      <button
                        type="button"
                        onClick={() => setShowMobilePreview(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white py-1.5 text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau HP</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* JIKA TIDAK ADA BERKAS MAUPUN TAUTAN */}
              {!hasFile && !hasExternalLink && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs italic ${
                    isDark
                      ? "bg-white/[0.02] border-white/5 text-slate-400"
                      : "bg-slate-50 border-slate-200/60 text-slate-500"
                  }`}
                >
                  <BookOpenText className="w-4 h-4 shrink-0 opacity-60" />
                  <span>Modul ini disajikan secara tekstual tanpa berkas atau tautan fisik.</span>
                </div>
              )}
            </div>

            {/* Petunjuk Pembelajaran (Style Badge Biru Lembut) */}
            <div
              className="rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs space-y-2 border-blue-200/80 dark:border-sky-800/40 bg-blue-50/70 dark:bg-sky-950/30"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-blue-100/90 text-[#004F9F] dark:bg-sky-900/60 dark:text-sky-300 border border-blue-200/80 dark:border-sky-800/50 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#00A5EC]" />
                  <span>Petunjuk Pembelajaran</span>
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Gunakan modul ini sebagai acuan teknis magang. Apabila ada materi yang belum jelas, diskusikan langsung bersama mentor pembimbing saat sesi bimbingan.
              </p>
            </div>
          </div>

          {/* Footer Aksi */}
          <div
            className={`shrink-0 border-t p-3.5 sm:p-5 flex items-center justify-between gap-3 ${
              isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Tombol Utama: Tandai Selesai */}
            <button
              type="button"
              onClick={() => onToggleSelesai(materi.id)}
              className={`group/btn inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer ${
                isSelesai
                  ? "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10"
                  : "bg-emerald-600 text-white shadow-emerald-600/20"
              }`}
            >
              {isSelesai ? (
                <>
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Tandai Belum Selesai</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Tandai Selesai Belajar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE OVERLAY PREVIEW MODAL ===== */}
      {showMobilePreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-3"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className={`relative flex flex-col w-full max-w-2xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal pratinjau mobile */}
            <div
              className={`flex items-center justify-between gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b shrink-0 ${
                isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 text-left">
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                    isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {youTubeId ? (
                    <Video className="w-3.5 h-3.5 text-rose-500" />
                  ) : hasExternalLink ? (
                    <Globe className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  ) : isPdf ? (
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 text-sky-500" />
                  )}
                </span>
                <span
                  className={`text-xs sm:text-sm font-black truncate ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {hasFile ? fileName : externalLink}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Konten pratinjau mobile */}
            <div
              className="relative flex-1 min-h-0 flex flex-col p-3 overflow-auto flex"
              style={{
                backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
                backgroundImage: isDark
                  ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
                  : "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              {showFileView && isPdf ? (
                docLoading ? (
                  <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                    <div
                      className={`h-8 w-8 rounded-full border-[3px] border-slate-300 animate-spin ${
                        isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      Memuat modul PDF...
                    </span>
                  </div>
                ) : docError ? (
                  <div className="m-auto flex flex-col items-center gap-2 text-center text-slate-400 p-4">
                    <FileX className="w-8 h-8 text-rose-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      Gagal memuat pratinjau PDF
                    </span>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800 transition-all mt-2 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Berkas</span>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-full min-w-full overflow-auto p-2">
                    <canvas
                      ref={canvasRefMobile}
                      className={`rounded-xl shadow-xl ring-1 ring-black/5 max-w-full ${
                        isDark ? "bg-[#161b22]" : "bg-white"
                      }`}
                    />
                  </div>
                )
              ) : youTubeId ? (
                <div className="m-auto w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${youTubeId}?rel=0`}
                    title={materi.judul}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : hasExternalLink ? (
                <div className="m-auto text-center p-4 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Tautan daring eksternal dapat dibuka langsung di peramban Anda.
                  </p>
                  <a
                    href={externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 hover:bg-blue-100 text-xs font-bold shadow-2xs"
                  >
                    <span>Buka Tautan di Tab Baru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : isImage ? (
                <div className="m-auto max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={fileUrl}
                    alt={materi.judul}
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="m-auto text-center p-4">
                  <p className="text-xs text-slate-500">Pratinjau berkas pada tampilan layar penuh.</p>
                </div>
              )}

              {/* Floating Toolbar Mobile: Pagination + Print & Download */}
              {showFileView && isPdf && !docLoading && !docError && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border bg-slate-900/95 border-white/20 px-3.5 py-1.5 shadow-2xl backdrop-blur-md text-white max-w-[92vw] w-max whitespace-nowrap select-none">
                  {numPages > 1 && (
                    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                        disabled={pageNum === 1}
                        className="p-1 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-black whitespace-nowrap px-1 select-none font-mono text-white shrink-0">
                        Hal {pageNum}/{numPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                        disabled={pageNum === numPages}
                        className="p-1 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-white/20 mx-1 shrink-0" />
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={actionLoading !== null}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Cetak Dokumen"
                    >
                      {actionLoading === "print" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Printer className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={actionLoading !== null}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Unduh Dokumen"
                    >
                      {actionLoading === "download" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailMateriModal;
