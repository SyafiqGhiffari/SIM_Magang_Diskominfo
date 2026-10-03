import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Printer,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileX,
  Loader2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PratinjauLaporanModal = ({ isOpen, onClose, fileUrl, fileName, docTitle }) => {
  const { isDark } = useManajemenTheme();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);
  const canvasRef = useRef(null);

  // Muat Dokumen PDF
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      const timer = setTimeout(() => {
        setPdfDoc(null);
        setPageNum(1);
        setNumPages(0);
        setDocLoading(false);
        setDocError(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isCancelled = false;
    const initTimer = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
      setPageNum(1);
    }, 0);

    const loadTask = pdfjsLib.getDocument({
      url: fileUrl,
      cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
      cMapPacked: true,
    });

    loadTask.promise
      .then((loadedPdf) => {
        if (!isCancelled) {
          setPdfDoc(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setDocLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Gagal membaca dokumen PDF via URL:", err);
          // Fallback coba via fetch arrayBuffer
          fetch(fileUrl)
            .then((res) => {
              if (!res.ok) throw new Error("Gagal mengambil berkas");
              return res.arrayBuffer();
            })
            .then((buf) => {
              if (isCancelled) return;
              return pdfjsLib.getDocument({
                data: buf,
                cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
                cMapPacked: true,
              }).promise;
            })
            .then((loadedPdf) => {
              if (!isCancelled && loadedPdf) {
                setPdfDoc(loadedPdf);
                setNumPages(loadedPdf.numPages);
                setDocLoading(false);
              }
            })
            .catch(() => {
              if (!isCancelled) {
                setDocError(true);
                setDocLoading(false);
              }
            });
        }
      });

    return () => {
      isCancelled = true;
      clearTimeout(initTimer);
      try {
        loadTask.destroy();
      } catch {
        // ignore
      }
    };
  }, [isOpen, fileUrl]);

  // Render Halaman PDF ke Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask = null;

    pdfDoc
      .getPage(pageNum)
      .then((page) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const scale = (zoom / 100) * 1.5;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({ canvasContext: ctx, viewport });
        return renderTask.promise;
      })
      .catch((err) => {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Gagal merender halaman PDF:", err);
        }
      });

    return () => {
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNum, zoom]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && pageNum < numPages) setPageNum((p) => p + 1);
      if (e.key === "ArrowLeft" && pageNum > 1) setPageNum((p) => p - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pageNum, numPages, onClose]);

  const handlePrint = () => {
    if (!fileUrl) return;
    const printWindow = window.open(fileUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "Laporan-Akhir-Magang.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop Listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl h-[90vh] rounded-3xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {docTitle || fileName || "Pratinjau Dokumen Naskah Laporan"}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black uppercase tracking-wider shrink-0">
                  PDF
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5 truncate max-w-sm sm:max-w-lg">
                Berkas: {fileName || "naskah-laporan.pdf"} &bull; {numPages} Halaman
              </p>
            </div>
          </div>

          {/* Action Group & Zoom Control */}
          <div className="flex items-center gap-2 shrink-0">
            {pdfDoc && !docLoading && !docError && (
              <div
                className={`hidden sm:flex items-center gap-0.5 sm:gap-1 rounded-full border shadow-2xs px-1.5 py-0.5 md:py-1 ${
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
                  className={`text-[10px] md:text-xs font-bold w-10 text-center tabular-nums cursor-pointer hover:underline ${
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

            {/* Kotak Grup Aksi Dokumen: Print, Download, dan Tab Baru */}
            <div
              className={`inline-flex items-center h-8 rounded-xl border shadow-2xs p-0.5 ${
                isDark ? "border-white/10 bg-slate-800" : "border-slate-200 bg-white"
              }`}
            >
              {/* Tombol Cetak Dokumen */}
              <button
                type="button"
                onClick={handlePrint}
                className="group/print inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#004F9F] dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90 cursor-pointer"
                title="Cetak Dokumen"
              >
                <Printer className="w-3.5 h-3.5 transition-transform duration-300 group-hover/print:scale-115" />
              </button>

              {/* Garis Sekat Tipis */}
              <div className="h-3.5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

              {/* Tombol Unduh Dokumen */}
              <button
                type="button"
                onClick={handleDownload}
                className="group/download inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#004F9F] dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90 cursor-pointer"
                title="Unduh Dokumen"
              >
                <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover/download:scale-115" />
              </button>

              {/* Garis Sekat Tipis */}
              <div className="h-3.5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

              {/* Tombol Tab Baru */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/full inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#004F9F] dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90 cursor-pointer"
                title="Buka dokumen di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 group-hover/full:scale-115" />
              </a>
            </div>

            {/* Tombol Tutup (X) dengan Animasi Hover */}
            <button
              type="button"
              onClick={onClose}
              className="group/close inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800/50 shadow-2xs hover:shadow-xs transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4 transition-transform duration-300 group-hover/close:rotate-90 group-hover/close:scale-110" />
            </button>
          </div>
        </div>

        {/* Modal PDF Viewer Body */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            className="flex-1 p-4 sm:p-8 overflow-auto flex"
            style={{
              backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
              backgroundImage: isDark
                ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
                : "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            {docLoading ? (
              <div className="m-auto flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-9 h-9 text-[#004F9F] dark:text-[#00A5EC] animate-spin" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Memuat naskah laporan PDF...
                </p>
              </div>
            ) : docError ? (
              <div className="m-auto text-center p-8 max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto">
                  <FileX className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Gagal Membuka Pratinjau Dokumen
                </h4>
                <p className="text-xs text-slate-400">
                  Berkas PDF tidak dapat dirender langsung di kanvas. Anda dapat membukanya langsung di tab baru browser.
                </p>
                <div className="pt-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004F9F] text-white text-xs font-bold hover:bg-[#003875] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka di Tab Baru
                  </a>
                </div>
              </div>
            ) : (
              <div className="m-auto flex justify-center shadow-2xl rounded-sm overflow-hidden bg-white">
                <canvas ref={canvasRef} className="block max-w-full h-auto" />
              </div>
            )}
          </div>

          {/* Modal Footer Controls (Navigasi Halaman & Tutup) - Persis Seperti di Gambar */}
          <div className="flex items-center justify-between px-5 py-2.5 sm:py-3 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#161b22] shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.min(Math.max(1, numPages), p + 1))}
                disabled={pageNum >= numPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
              Halaman <span className="text-[#004F9F] dark:text-sky-400 font-black">{pageNum}</span> dari {numPages || 1}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PratinjauLaporanModal;
