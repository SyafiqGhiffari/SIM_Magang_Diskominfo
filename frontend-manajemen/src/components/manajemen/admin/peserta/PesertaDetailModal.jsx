import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, User, Mail, Phone, MapPin, Cake, Building2, GraduationCap,
  Calendar, FileText, Download, Loader2, Info, Sparkles, ImageIcon,
  FileCheck2, FileBadge2, Award, FileSignature, Eye,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer,
} from "lucide-react";
import { getDetailAkunPeserta } from "../../../../services/adminService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");

const isImageFile = (url) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url || "");

const InfoRow = ({ icon: Icon, label, value, delay = 0, isDark }) => (
  <div
    className={`group flex items-start gap-2 sm:gap-3 rounded-xl border p-2 sm:p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out] ${
      isDark
        ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        : "border-slate-200 bg-white hover:border-[#004F9F]/40 hover:shadow-md"
    }`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <span className={`flex h-6.5 w-6.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${
      isDark ? "bg-white/10 text-sky-300" : "bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F]"
    }`}>
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-[10px] sm:text-xs font-semibold mt-0.5 break-words ${isDark ? "text-slate-200" : "text-slate-700"}`}>{value || "-"}</p>
    </div>
  </div>
);

const SectionCard = ({ icon: Icon, title, children, delay = 0, isDark }) => (
  <div
    className={`rounded-2xl border shadow-sm p-3 sm:p-5 transition-all duration-300 animate-[fadeslide_0.3s_ease-out] ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white hover:shadow-md"
    }`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <div className="flex items-center gap-1.5 sm:gap-2.5 mb-1">
      <span className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-sm">
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      </span>
      <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{title}</h4>
    </div>
    {children}
  </div>
);

const docIcons = {
  file_pas_foto: ImageIcon,
  file_surat_pengantar: FileSignature,
  file_cv: FileBadge2,
  file_transkrip: Award,
  file_portofolio: FileCheck2,
  file_proposal_magang: FileText,
};

const docFields = [
  { key: "file_pas_foto", label: "Pas Foto" },
  { key: "file_surat_pengantar", label: "Surat Pengantar" },
  { key: "file_cv", label: "CV" },
  { key: "file_transkrip", label: "Transkrip/Rapor" },
  { key: "file_portofolio", label: "Portofolio" },
  { key: "file_proposal_magang", label: "Proposal Magang" },
];

const DocumentPreviewModal = ({ doc, onClose, isDark }) => {
  const isImg = Boolean(
    doc?.isImage ||
    doc?.key === "file_pas_foto" ||
    doc?.label === "Pas Foto" ||
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(doc?.url || "")
  );

  const defaultZoom = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 100;
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
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        img.src = doc.url;
        return;
      }

      fetch(doc.url)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil file");
          return res.arrayBuffer();
        })
        .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
        .then((pdf) => {
          if (cancelled) return;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNum(1);
          setDocLoading(false);
        })
        .catch((err) => {
          console.error("PDF Preview load error:", err);
          if (!cancelled) {
            setDocError(true);
            setDocLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [doc?.url, isImg]);

  // Gambar halaman aktif ke canvas sesuai tingkat perbesaran (sama persis dengan TemplateSuratDesigner)
  useEffect(() => {
    if (!pdfDoc || isImg) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: canvas.getContext("2d"), viewport });
    }).catch((err) => {
      if (err?.name !== "RenderingCancelledException") {
        console.error("PDF render error:", err);
      }
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, zoom, isImg]);

  const handlePrint = async () => {
    if (!doc?.url) return;
    setFileActionLoading("print");
    try {
      if (!isImg) {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.src = doc.url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        };
      } else {
        const win = window.open("", "_blank");
        win.document.write(`<html><head><title>Print ${doc.label}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${doc.url}" style="max-width:100%;height:auto;" onload="window.print();window.close();"/></body></html>`);
        win.document.close();
      }
    } catch {
      window.open(doc.url, "_blank");
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!doc?.url) return;
    setFileActionLoading("download");
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = isImg ? (doc.url.split(".").pop() || "jpg") : "pdf";
      a.download = `${doc.label.toLowerCase().replace(/\s+/g, "_")}.${ext}`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-2 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-4xl h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.25s_ease-out] ${
          isDark ? "border border-white/10 bg-[#161b22]" : "border border-slate-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal: Judul di Kiri, Tombol Zoom + Tutup di Kanan */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 sm:px-6 py-2.5 sm:py-3.5 shrink-0 flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/15">
              <doc.Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold truncate text-white">{doc.label}</h4>
              <p className="text-[8.5px] sm:text-[10px] text-white/60 truncate">Pratinjau Berkas Pendaftaran</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls di Header Modal */}
            <div className="flex items-center gap-0.5 sm:gap-1 rounded-full border border-white/20 bg-white/10 px-1 sm:px-1.5 py-0.5 shadow-sm">
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

            <div className="h-4 w-px bg-white/20 mx-0.5 hidden xs:block" />

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area Wrapper: Terpisah dengan overflow-hidden agar floating toolbar selalu menempel di bawah */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Scrollable Viewport Dokumen */}
          <div
            className="flex-1 min-h-0 overflow-auto p-4 sm:p-6"
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
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400 py-16">
                  <div className={`h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 ${isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"}`} />
                  <span className="text-xs font-bold">Memuat pratinjau...</span>
                </div>
              ) : docError ? (
                <div className="m-auto flex max-w-xs flex-col items-center gap-2 text-center text-slate-400 py-16 px-4">
                  <FileText className="h-10 w-10 text-rose-400" />
                  <p className="text-xs font-bold text-rose-500">Gagal memuat pratinjau dokumen.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Anda tetap dapat mengunduh berkas secara langsung.</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#00A5EC] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0090d0] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Berkas
                  </button>
                </div>
              ) : isImg ? (
                <div className="m-auto flex items-center justify-center p-2">
                  <img
                    src={doc.url}
                    alt={doc.label}
                    style={{ width: `${zoom}%`, height: "auto", minWidth: "160px", maxWidth: "100%" }}
                    className="m-auto rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 transition-[width] duration-200 animate-[fadeslide_0.3s_ease-out] object-contain"
                  />
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="m-auto rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out]"
                />
              )}
            </div>
          </div>

          {/* Floating Bottom Toolbar - Selalu melayang di bawah layar modal (tidak ikut ter-scroll) */}
          {!docLoading && !docError && (
            <div className={`pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:gap-2.5 rounded-full border shadow-2xl backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 max-w-[92vw] w-max whitespace-nowrap select-none ${
              isDark ? "border-slate-700 bg-slate-900/95 text-white" : "border-slate-200 bg-white/95 text-slate-700"
            }`}>
              {/* Pagination jika multi-page PDF */}
              {!isImg && numPages > 1 && (
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                    disabled={pageNum === 1}
                    className={`cursor-pointer rounded-full p-1 sm:p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <span className={`px-2 text-[11px] sm:text-xs font-black font-mono whitespace-nowrap shrink-0 select-none ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                    Hal {pageNum}/{numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                    disabled={pageNum === numPages}
                    className={`cursor-pointer rounded-full p-1 sm:p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <div className={`h-4 w-px ${isDark ? "bg-slate-700" : "bg-slate-200"} mx-1 sm:mx-1.5 shrink-0`} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Tombol Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={fileActionLoading === "print"}
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-[#00A5EC]" : "hover:bg-slate-100 text-slate-600 hover:text-[#004F9F]"
                  }`}
                  title="Cetak Berkas"
                >
                  {fileActionLoading === "print" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                {/* Tombol Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={fileActionLoading === "download"}
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-[#00A5EC]" : "hover:bg-slate-100 text-slate-600 hover:text-[#004F9F]"
                  }`}
                  title="Unduh Berkas"
                >
                  {fileActionLoading === "download" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PesertaDetailModal = ({ pesertaId, onClose, isDark }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      getDetailAkunPeserta(pesertaId)
        .then((res) => setData(res.data.data))
        .catch(() => toastError("Gagal memuat detail akun peserta."))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [pesertaId]);

  const p = data?.pendaftaran;
  const isMahasiswa = p?.kategori_pendaftar === "mahasiswa";
  const fotoUrl = getFileUrl(data?.foto_profil || p?.file_pas_foto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-3xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 sm:px-6 py-3 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <User className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 w-17 h-17 sm:w-24 sm:h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="relative flex h-7.5 w-7.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <User className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  Profil Peserta
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight">Detail Peserta</h3>
                <p className="text-[9px] sm:text-[11px] text-white/60 mt-0.5">Data administratif dan dokumen pendaftaran</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-24 text-slate-400 text-xs sm:text-sm gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#00A5EC]" />
              Memuat detail peserta...
            </div>
          ) : !p ? (
            <div className="flex items-center justify-center py-16 sm:py-24 text-slate-400 text-xs sm:text-sm">Data tidak ditemukan.</div>
          ) : (
            <div className="space-y-3 sm:space-y-5">
              <div className={`relative overflow-hidden flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-sm animate-[fadeslide_0.25s_ease-out] ${
                isDark
                  ? "border-white/10 bg-white/5"
                  : "border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/30"
              }`}>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                {fotoUrl ? (
                  <img src={fotoUrl} alt={p.nama_lengkap} className="relative h-10 w-10 sm:h-16 sm:w-16 rounded-full object-cover border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-300 dark:ring-white/20 shrink-0" />
                ) : (
                  <span className="relative flex h-10 w-10 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-xs sm:text-lg font-black border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-300 dark:ring-white/20">
                    {getInitials(p.nama_lengkap)}
                  </span>
                )}
                <div className="relative min-w-0 flex-1">
                  <p className={`text-xs sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{p.nama_lengkap}</p>
                  <p className="text-[9px] sm:text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5 mb-1.5">
                    <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                    {data.email_login || p.email}
                  </p>
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[10.5px] font-bold shadow-xs ${
                      isDark
                        ? "border-[#00A5EC]/30 bg-[#00A5EC]/10 text-sky-300"
                        : "border-[#004F9F]/20 bg-blue-50 text-[#004F9F]"
                    }`}>
                      <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span>{p.posisi_bidang || "-"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <SectionCard icon={User} title="Kontak & Data Diri" delay={40} isDark={isDark}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 mt-2 sm:mt-3">
                  <InfoRow icon={Mail} label="Alamat Email" value={p.email || data.email_login} delay={60} isDark={isDark} />
                  <InfoRow icon={Phone} label="Nomor HP" value={p.nomor_hp} delay={80} isDark={isDark} />
                  <InfoRow icon={Cake} label="Tempat, Tanggal Lahir" value={`${p.tempat_lahir || "-"}, ${fmtDate(p.tanggal_lahir)}`} delay={100} isDark={isDark} />
                  <InfoRow icon={User} label="Jenis Kelamin" value={p.jenis_kelamin} delay={120} isDark={isDark} />
                  <InfoRow icon={MapPin} label="Alamat Lengkap" value={p.alamat_lengkap} delay={140} isDark={isDark} />
                </div>
              </SectionCard>

              <SectionCard icon={GraduationCap} title="Institusi & Periode Magang" delay={80} isDark={isDark}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 mt-2 sm:mt-3">
                  {isMahasiswa ? (
                    <>
                      <InfoRow icon={Building2} label="Asal Kampus" value={p.asal_kampus} delay={100} isDark={isDark} />
                      <InfoRow icon={GraduationCap} label="Fakultas" value={p.fakultas} delay={120} isDark={isDark} />
                      <InfoRow icon={GraduationCap} label="Program Studi" value={p.program_studi} delay={140} isDark={isDark} />
                      <InfoRow icon={FileText} label="NPM/NIM" value={p.npm_nim} delay={160} isDark={isDark} />
                      <InfoRow icon={Info} label="Semester" value={p.semester} delay={180} isDark={isDark} />
                    </>
                  ) : (
                    <>
                      <InfoRow icon={Building2} label="Asal Sekolah" value={p.asal_sekolah} delay={100} isDark={isDark} />
                      <InfoRow icon={GraduationCap} label="Jurusan" value={p.jurusan_sekolah} delay={120} isDark={isDark} />
                      <InfoRow icon={GraduationCap} label="Kelas" value={p.kelas} delay={140} isDark={isDark} />
                      <InfoRow icon={FileText} label="NISN" value={p.nisn} delay={160} isDark={isDark} />
                    </>
                  )}
                  <InfoRow icon={Calendar} label="Periode Magang" value={`${fmtDate(p.tanggal_mulai)} — ${fmtDate(p.tanggal_selesai)}`} delay={200} isDark={isDark} />
                </div>
              </SectionCard>

              <div
                className={`rounded-2xl border shadow-sm p-3 sm:p-5 transition-all duration-300 animate-[fadeslide_0.3s_ease-out] ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white hover:shadow-md"
                }`}
                style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-center justify-between gap-2.5 mb-2.5 sm:mb-4">
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <span className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    </span>
                    <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Dokumen Pendaftaran</h4>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
                  {docFields.map((doc, i) => {
                    const url = getFileUrl(p[doc.key]);
                    const DocIcon = docIcons[doc.key] || FileText;
                    return (
                      <div
                        key={doc.key}
                        onClick={() => url && setPreviewDoc({ url, label: doc.label, Icon: DocIcon, key: doc.key, isImage: doc.key === "file_pas_foto" || isImageFile(url) })}
                        className={`group flex items-center justify-between gap-2 rounded-xl border p-2 sm:p-3 shadow-sm transition-all duration-200 animate-[fadeslide_0.25s_ease-out] ${
                          url
                            ? isDark
                              ? "border-white/10 bg-white/5 hover:border-[#00A5EC]/40 hover:bg-white/10 cursor-pointer hover:-translate-y-0.5"
                              : "border-slate-200 bg-white hover:border-[#004F9F]/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            : isDark
                              ? "border-dashed border-white/5 bg-white/[0.02]"
                              : "border-dashed border-slate-200 bg-slate-50/30"
                        }`}
                        style={{ animationDelay: `${160 + i * 40}ms`, animationFillMode: "backwards" }}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <span className={`flex h-6.5 w-6.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
                            url
                              ? isDark ? "bg-[#00A5EC]/15 text-sky-300 group-hover:scale-110" : "bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F] group-hover:scale-110"
                              : isDark ? "bg-white/5 text-slate-600" : "bg-slate-100 text-slate-300"
                          }`}>
                            <DocIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </span>
                          <span className={`text-[10px] sm:text-xs font-semibold truncate ${url ? (isDark ? "text-slate-200" : "text-slate-700") : "text-slate-400"}`}>{doc.label}</span>
                        </div>
                        {url ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border transition-all duration-200 ${
                                isDark
                                  ? "bg-white/5 border-white/10 text-slate-400 group-hover:border-[#00A5EC]/40 group-hover:text-sky-300"
                                  : "bg-white border-slate-200 text-slate-500 group-hover:border-[#004F9F]/40 group-hover:text-[#004F9F]"
                              }`}
                              title="Lihat pratinjau"
                            >
                              <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            </span>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${
                                isDark
                                  ? "bg-white/5 border-white/10 text-slate-400 hover:border-[#00A5EC]/40 hover:text-sky-300"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F]"
                              }`}
                              title="Download"
                            >
                              <Download className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[8.5px] sm:text-[10px] text-slate-400 italic shrink-0">Tidak ada</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} isDark={isDark} />}
    </div>
  );
};

export default PesertaDetailModal;