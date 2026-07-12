import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
  </svg>
);
const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM7.5 10.5h6" />
  </svg>
);
const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const PreviewModal = ({ file, label, onClose, onGantiFile }) => {
  const isImage = file?.type?.startsWith("image/");
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;

    if (isImage) {
      const url = URL.createObjectURL(file);
      const timeoutId = setTimeout(() => {
        setImgUrl(url);
        setLoading(false);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(url);
      };
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => { setLoading(true); }, 0);
    file.arrayBuffer().then((buf) => {
      pdfjsLib.getDocument({ data: buf }).promise.then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [file, isImage]);

  useEffect(() => {
    if (!pdfDoc || isImage) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      page.render({ canvasContext: ctx, viewport });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, zoom, isImage]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1442]/70 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="relative shrink-0 bg-gradient-to-r from-[#0B1442] via-[#141F5C] to-[#1E3A8A] px-6 py-5 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <DocIcon />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white leading-tight">Pratinjau {label}</h3>
                <p className="text-[11px] text-white/60 mt-0.5 truncate max-w-[280px]">{file.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 hover:rotate-90 transition-all duration-300 cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 shadow-sm px-1.5 py-1">
            <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all cursor-pointer">
              <ZoomOutIcon />
            </button>
            <span className="text-xs font-bold text-[#0B1442] w-12 text-center tabular-nums">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all cursor-pointer">
              <ZoomInIcon />
            </button>
          </div>

          {!isImage && numPages > 1 && (
            <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 shadow-sm px-1.5 py-1">
              <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum === 1} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed">
                <ChevronLeft />
              </button>
              <span className="text-xs font-bold text-[#0B1442] whitespace-nowrap px-1">Hal {pageNum} / {numPages}</span>
              <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum === numPages} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed">
                <ChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 p-8 overflow-auto flex min-h-[320px]"
          style={{
            backgroundColor: "#eef1f6",
            backgroundImage: "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          {loading ? (
            <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
              <div className="h-8 w-8 rounded-full border-[3px] border-slate-300 border-t-[#004F9F] animate-spin" />
              <span className="text-xs font-bold">Memuat pratinjau...</span>
            </div>
          ) : isImage ? (
            <img
              src={imgUrl}
              alt={file.name}
              style={{ width: `${zoom}%`, height: "auto" }}
              className="m-auto rounded-xl shadow-2xl ring-1 ring-black/5 max-w-none transition-[width] duration-150"
            />
          ) : (
            <canvas ref={canvasRef} className="m-auto rounded-xl shadow-2xl ring-1 ring-black/5 bg-white" />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <div className="flex gap-3">
            <button
              onClick={onGantiFile}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Ganti File
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-xl hover:from-[#101F5C] hover:to-[#004F9F] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;