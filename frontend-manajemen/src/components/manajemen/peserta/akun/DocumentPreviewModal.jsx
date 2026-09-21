import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X,
  FileText,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Printer,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const DocumentPreviewModal = ({ doc, onClose, isDark }) => {
  const isImg = Boolean(
    doc?.isImage ||
    doc?.key === "file_pas_foto" ||
    doc?.label === "Pas Foto" ||
    doc?.label === "Pas Foto Resmi Peserta" ||
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(doc?.url || "")
  );

  const defaultZoom = 100;
  const [zoom, setZoom] = useState(defaultZoom);
  const [fileActionLoading, setFileActionLoading] = useState(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (!doc?.url) {
      const t0 = setTimeout(() => {
        setDocLoading(false);
        setDocError(false);
      }, 0);
      return () => clearTimeout(t0);
    }

    let cancelled = false;
    const t = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);

      if (isImg) {
        setDocLoading(false);
        return;
      }

      pdfjsLib
        .getDocument({ url: doc.url, withCredentials: false })
        .promise.then((pdf) => {
          if (cancelled) return;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNum(1);
          setDocLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setDocError(true);
          setDocLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [doc?.url, isImg]);

  useEffect(() => {
    if (!pdfDoc || isImg) return;
    let cancelled = false;

    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth =
        canvas.parentElement?.clientWidth ||
        (typeof window !== "undefined" && window.innerWidth < 640 ? 320 : 640);
      const fitScale = (containerWidth - 32) / baseViewport.width;
      const activeScale = fitScale * (zoom / 100);

      const viewport = page.getViewport({ scale: activeScale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({ canvasContext: ctx, viewport }).promise.catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum, zoom, isImg]);

  const handlePrint = async () => {
    if (!doc?.url || fileActionLoading) return;
    try {
      setFileActionLoading("print");
      const resp = await fetch(doc.url);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      if (isImg) {
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(`
            <html>
              <head>
                <title>${doc.label || "Dokumen"}</title>
                <style>
                  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
                  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  @media print { body { margin: 0; } img { width: 100%; } }
                </style>
              </head>
              <body>
                <img src="${blobUrl}" onload="window.print(); window.close();" />
              </body>
            </html>
          `);
          printWin.document.close();
        }
      } else {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
              window.URL.revokeObjectURL(blobUrl);
            }, 1000);
          }, 300);
        };
      }
    } catch {
      window.open(doc.url, "_blank");
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!doc?.url || fileActionLoading) return;
    try {
      setFileActionLoading("download");
      const resp = await fetch(doc.url);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const ext = isImg ? "jpg" : "pdf";
      const filename = `${(doc.label || "dokumen")
        .toLowerCase()
        .replace(/\s+/g, "_")}.${ext}`;

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(doc.url, "_blank");
    } finally {
      setFileActionLoading(null);
    }
  };

  const DocIcon = doc?.Icon || FileText;

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      style={{ margin: 0 }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[95vw] sm:max-w-4xl h-[86vh] sm:h-[92vh] rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.25s_ease-out] ${
          isDark
            ? "border border-white/10 bg-[#161b22]"
            : "border border-slate-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal: Judul di Kiri, Tombol Zoom (Desktop) + Tutup di Kanan */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 sm:px-6 py-2 sm:py-3.5 shrink-0 flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="flex h-6.5 w-6.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-white/10 border border-white/15">
              <DocIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div className="min-w-0">
              <h4 className="text-[11.5px] sm:text-sm font-bold truncate text-white">
                {doc.label}
              </h4>
              <p className="text-[8px] sm:text-[10px] text-white/60 truncate">
                Pratinjau Berkas &amp; Dokumen Magang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls di Header Modal (HANYA DESKTOP, di mobile mengambang di bawah) */}
            <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 rounded-full border border-white/20 bg-white/10 px-1 sm:px-1.5 py-0.5 shadow-sm">
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer text-white"
                title="Perkecil (Zoom Out)"
              >
                <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(defaultZoom)}
                title={`Reset zoom ke ${defaultZoom}%`}
                className="min-w-[30px] sm:min-w-[36px] text-center font-mono text-[9.5px] sm:text-[11px] font-bold text-white hover:text-sky-300 transition-colors"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer text-white"
                title="Perbesar (Zoom In)"
              >
                <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-white/20 mx-0.5 hidden sm:block" />

            {/* Close */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex h-6.5 w-6.5 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Content Area Wrapper: Terpisah dengan overflow-hidden agar floating toolbar selalu menempel di bawah */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Scrollable Viewport Dokumen */}
          <div
            className="flex-1 min-h-0 overflow-auto p-2 sm:p-6"
            style={{
              backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
              backgroundImage: isDark
                ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
                : "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            <div className="flex min-h-full w-fit min-w-full items-center justify-center">
              {docLoading ? (
                <div className="m-auto flex flex-col items-center gap-2.5 text-slate-400 py-12 sm:py-16">
                  <div
                    className={`h-7 w-7 sm:h-9 sm:w-9 animate-spin rounded-full border-[3px] border-slate-300 ${
                      isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs font-bold">Memuat pratinjau...</span>
                </div>
              ) : docError ? (
                <div className="m-auto flex max-w-xs flex-col items-center gap-2 text-center text-slate-400 py-12 sm:py-16 px-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-rose-400" />
                  <p className="text-[11px] sm:text-xs font-bold text-rose-500">
                    Gagal memuat pratinjau dokumen.
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                    Anda tetap dapat mengunduh berkas secara langsung.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#00A5EC] px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-sm hover:bg-[#0090d0] transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Unduh Berkas
                  </button>
                </div>
              ) : isImg ? (
                <div className="m-auto flex items-center justify-center p-1 sm:p-2">
                  <img
                    src={doc.url}
                    alt={doc.label}
                    style={{
                      width: `${zoom}%`,
                      height: "auto",
                      minWidth: "120px",
                      maxWidth: "100%",
                    }}
                    className="m-auto rounded-lg sm:rounded-2xl shadow-xl sm:shadow-2xl ring-1 ring-black/5 transition-[width] duration-200 animate-[fadeslide_0.3s_ease-out] object-contain"
                  />
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="m-auto rounded-lg sm:rounded-xl bg-white shadow-xl sm:shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out]"
                />
              )}
            </div>
          </div>

          {/* Floating Bottom Toolbar - Melayang di bawah (Pada mobile: Zoom Controls + Pagination + Print + Download) */}
          {!docLoading && !docError && (
            <div
              className={`pointer-events-auto absolute bottom-2.5 sm:bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 sm:gap-2.5 rounded-full border shadow-2xl backdrop-blur-md px-2.5 sm:px-5 py-1.5 sm:py-2.5 max-w-[95vw] w-max whitespace-nowrap select-none ${
                isDark
                  ? "border-slate-700 bg-slate-900/95 text-white"
                  : "border-slate-200 bg-white/95 text-slate-700"
              }`}
            >
              {/* Zoom Controls KHUSUS MOBILE (Mengambang bersama tombol lain di floating toolbar) */}
              <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className={`cursor-pointer rounded-full p-1 transition-all ${
                    isDark
                      ? "text-slate-300 hover:bg-slate-800 hover:text-sky-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                  }`}
                  title="Perkecil"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(defaultZoom)}
                  title={`Reset zoom (${defaultZoom}%)`}
                  className={`px-1 text-[9px] font-mono font-bold ${
                    isDark ? "text-slate-200" : "text-[#0B1442]"
                  }`}
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className={`cursor-pointer rounded-full p-1 transition-all ${
                    isDark
                      ? "text-slate-300 hover:bg-slate-800 hover:text-sky-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                  }`}
                  title="Perbesar"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
                <div
                  className={`h-3 w-px ${
                    isDark ? "bg-slate-700" : "bg-slate-200"
                  } mx-0.5 shrink-0`}
                />
              </div>

              {/* Pagination jika multi-page PDF */}
              {!isImg && numPages > 1 && (
                <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                    disabled={pageNum === 1}
                    className={`cursor-pointer rounded-full p-0.5 sm:p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark
                        ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]"
                        : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <span
                    className={`px-1 sm:px-2 text-[9px] sm:text-xs font-black font-mono whitespace-nowrap shrink-0 select-none ${
                      isDark ? "text-slate-200" : "text-[#0B1442]"
                    }`}
                  >
                    Hal {pageNum}/{numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                    disabled={pageNum === numPages}
                    className={`cursor-pointer rounded-full p-0.5 sm:p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark
                        ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]"
                        : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <div
                    className={`h-3 sm:h-4 w-px ${
                      isDark ? "bg-slate-700" : "bg-slate-200"
                    } mx-0.5 sm:mx-1.5 shrink-0`}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Tombol Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={fileActionLoading === "print"}
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? "hover:bg-slate-800 text-slate-300 hover:text-[#00A5EC]"
                      : "hover:bg-slate-100 text-slate-600 hover:text-[#004F9F]"
                  }`}
                  title="Cetak Berkas"
                >
                  {fileActionLoading === "print" ? (
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>

                {/* Tombol Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={fileActionLoading === "download"}
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? "hover:bg-slate-800 text-slate-300 hover:text-[#00A5EC]"
                      : "hover:bg-slate-100 text-slate-600 hover:text-[#004F9F]"
                  }`}
                  title="Unduh Berkas"
                >
                  {fileActionLoading === "download" ? (
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
