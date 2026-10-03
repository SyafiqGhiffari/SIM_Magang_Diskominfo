import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Printer,
  ExternalLink,
  Award,
  Sparkles,
  Loader2,
  Calendar,
  Send,
  FileCheck2,
  FileCheckCorner,
  FileQuestionMark,
  ClosedCaption,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  FileX,
  MessageSquareMore,
  Info,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { verifikasiLaporanAkhirMentor } from "../../../../services/mentorService";
import { toastSuccess, toastError, confirmDialog } from "../../../../utils/swal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const fetchAsBlobUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// Komponen Avatar / Foto Profil Peserta
const PesertaAvatar = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-12 w-12 sm:h-15 sm:w-15 rounded-2xl object-cover border-2 sm:border-[3px] border-white/20 shadow-md ring-2 sm:ring-4 ring-white/10 shrink-0"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center rounded-2xl bg-white/15 border-2 sm:border-[3px] border-white/20 text-white text-base sm:text-lg font-black backdrop-blur-md shadow-md shrink-0">
      {initial}
    </div>
  );
};

export const ReviewLaporanModal = ({
  isOpen,
  onClose,
  peserta,
  onSuccess,
  isDark: propIsDark,
}) => {
  const themeContext = useManajemenTheme();
  const isDark = propIsDark ?? themeContext?.isDark ?? false;
  const navigate = useNavigate();

  const handleBukaPenilaian = () => {
    const targetId = peserta?.akun_peserta_id || peserta?.pendaftaran_id || peserta?.id;
    if (onClose) onClose();
    navigate(`/mentor/penilaian?peserta_id=${targetId}&search=${encodeURIComponent(peserta?.nama_lengkap || "")}`, {
      state: { selectedPesertaId: targetId, autoOpen: true },
    });
  };

  const [statusAksi, setStatusAksi] = useState("disetujui"); // "disetujui" | "revisi"
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileUrl = peserta?.file_laporan_akhir ? getFileUrl(peserta.file_laporan_akhir) : null;
  const fileName = peserta?.file_laporan_akhir
    ? String(peserta.file_laporan_akhir).split("/").pop().split("\\").pop()
    : "naskah-laporan.pdf";
  const linkProyekValid = peserta?.link_proyek
    ? peserta.link_proyek.startsWith("http")
      ? peserta.link_proyek
      : `https://${peserta.link_proyek}`
    : null;

  // State Viewer PDF
  const canvasRef = useRef(null);
  const canvasRefMobile = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(Boolean(fileUrl));
  const [docError, setDocError] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(null);

  // Sync Form Data when participant changes: catatan mentor mulai dari kosong
  useEffect(() => {
    if (peserta && isOpen) {
      const timer = setTimeout(() => {
        setStatusAksi(peserta.status_laporan === "revisi" ? "revisi" : "disetujui");
        setCatatan(""); // Catatan mentor dimulai dari kosong (bukan catatan kiriman peserta)
        setZoom(typeof window !== "undefined" && window.innerWidth < 640 ? 55 : 100);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [peserta, isOpen]);

  // Listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, submitting]);

  // Muat dokumen PDF
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      const t = setTimeout(() => {
        setDocLoading(false);
        setPdfDoc(null);
      }, 0);
      return () => clearTimeout(t);
    }

    const initId = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
    }, 0);

    let cancelled = false;

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
      clearTimeout(initId);
    };
  }, [fileUrl, isOpen]);

  // Render halaman PDF ke canvas
  useEffect(() => {
    if (!pdfDoc) return;
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
  }, [pdfDoc, pageNum, zoom, showMobilePreview]);

  // Cetak Dokumen
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
      toastError("Gagal membuka naskah untuk dicetak.");
    } finally {
      setFileActionLoading(null);
    }
  };

  // Unduh Dokumen
  const handleDownload = async () => {
    if (!fileUrl) return;
    setFileActionLoading("download");
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
      toastError("Gagal mengunduh naskah laporan.");
    } finally {
      setFileActionLoading(null);
    }
  };

  if (!isOpen || !peserta) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (statusAksi === "revisi" && !catatan.trim()) {
      toastError("Mohon berikan catatan revisi yang jelas agar peserta memahami bagian naskah yang perlu diperbaiki.");
      return;
    }

    const konfirmasiTeks =
      statusAksi === "disetujui"
        ? `Apakah Anda yakin ingin MENYETUJUI laporan akhir milik "${peserta.nama_lengkap}"? Komponen kelengkapan laporan pada lembar penilaian akan otomatis disinkronkan menjadi 100 poin.`
        : `Apakah Anda yakin ingin MEMINTA REVISI laporan akhir kepada "${peserta.nama_lengkap}"? Peserta akan menerima notifikasi dan catatan arahan perbaikan yang Anda berikan.`;

    const result = await confirmDialog({
      title:
        statusAksi === "disetujui"
          ? "Setujui Laporan Akhir?"
          : "Kirim Permintaan Revisi?",
      text: konfirmasiTeks,
      confirmText:
        statusAksi === "disetujui"
          ? "Ya, Setujui Laporan"
          : "Ya, Kirim Revisi",
      cancelText: "Batal",
      icon: statusAksi === "disetujui" ? "question" : "warning",
      danger: statusAksi === "revisi",
    });

    if (!result?.isConfirmed) return;

    setSubmitting(true);
    try {
      await verifikasiLaporanAkhirMentor(peserta.pendaftaran_id, {
        status: statusAksi,
        catatan: catatan.trim(),
      });

      toastSuccess(
        statusAksi === "disetujui"
          ? "Naskah laporan akhir berhasil disetujui dan tervalidasi!"
          : "Catatan revisi laporan akhir berhasil dikirimkan ke peserta."
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toastError(err?.response?.data?.message || "Gagal memproses verifikasi laporan akhir");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-[modalFadeUp_0.25s_ease-out]"
      onClick={() => !submitting && onClose()}
    >
      {/* Dialog Container (2 Kolom: Kiri Viewer Naskah, Kanan Detail & Evaluasi) */}
      <div
        className={`flex flex-col md:flex-row w-full max-w-7xl h-[96vh] md:h-[92vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* ===== PANEL KIRI: Viewer Dokumen / Naskah Laporan ===== */}
        {/* ========================================================= */}
        <div
          className={`hidden md:flex flex-col w-full md:w-[58%] md:h-full border-b md:border-b-0 md:border-r ${
            isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
          }`}
        >
          {/* Toolbar Atas Viewer */}
          <div
            className={`flex items-center justify-between gap-2 px-4 md:px-6 py-2.5 md:py-3.5 border-b shrink-0 ${
              isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
            }`}
          >
            {/* Kiri: Info Nama File */}
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/50 text-rose-600 dark:text-rose-400 shadow-2xs border border-rose-200/80 dark:border-rose-800/60">
                <FileText className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <span
                  className={`text-xs sm:text-sm font-black truncate block ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                  title={fileName}
                >
                  {fileUrl ? fileName : "Naskah Belum Diunggah"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {fileUrl ? "Dokumen Portabel (PDF) Resmi" : "Peserta belum melampirkan naskah laporan"}
                </span>
              </div>
            </div>

            {/* Tengah: Zoom Controls */}
            {fileUrl && !docLoading && !docError && (
              <div
                className={`flex items-center gap-0.5 sm:gap-1 rounded-full border shadow-2xs px-1 md:px-1.5 py-0.5 md:py-1 shrink-0 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                  className="rounded-full p-1 sm:p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] hover:scale-110 transition-all duration-200 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`text-[10px] md:text-xs font-bold w-9 md:w-11 text-center tabular-nums ${
                    isDark ? "text-slate-300" : "text-[#0B1442]"
                  }`}
                >
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="rounded-full p-1 sm:p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] hover:scale-110 transition-all duration-200 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Kanan: Aksi (Buka Naskah di Tab Baru, Cetak, Unduh) */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                  title="Buka Naskah Laporan di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={handlePrint}
                disabled={!fileUrl || fileActionLoading !== null}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Cetak Naskah Laporan"
              >
                {fileActionLoading === "print" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!fileUrl || fileActionLoading !== null}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Unduh Naskah Laporan"
              >
                {fileActionLoading === "download" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Wrapper Konten Viewer + Floating Pagination */}
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
              {!fileUrl ? (
                <div className="m-auto flex flex-col items-center justify-center gap-3 text-slate-400 text-center max-w-xs">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                      isDark ? "bg-white/5" : "bg-white"
                    }`}
                  >
                    <FileX className="w-7 h-7 text-slate-400" />
                  </span>
                  <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">
                    Tidak Ada Berkas Naskah Dilampirkan
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Peserta belum mengunggah berkas naskah laporan akhir (.PDF) ke dalam sistem.
                  </p>
                </div>
              ) : docLoading ? (
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                  <div
                    className={`h-9 w-9 rounded-full border-[3px] border-slate-300 animate-spin ${
                      isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Memuat pratinjau naskah laporan...
                  </span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center gap-3 text-center text-slate-400 max-w-sm">
                  <FileX className="w-10 h-10 text-rose-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Gagal memuat pratinjau naskah dokumen
                  </span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800 transition-all shadow-2xs"
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
              )}
            </div>

            {/* Floating PDF Pagination (Desktop) */}
            {fileUrl && numPages > 1 && !docLoading && !docError && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full border bg-slate-900/85 border-white/10 px-3.5 py-1.5 shadow-xl backdrop-blur-md text-white transition-all duration-300 hover:scale-105 hover:bg-slate-900 select-none">
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

        {/* ========================================================= */}
        {/* ===== PANEL KANAN: Evaluasi & Keputusan Verifikasi ===== */}
        {/* ========================================================= */}
        <div
          className={`flex flex-col w-full md:w-[42%] flex-1 min-h-0 md:h-full ${
            isDark ? "bg-[#1a202c]/20" : "bg-slate-50/40"
          }`}
        >
          {/* Header Banner Gradient khas SIM Magang */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 sm:px-6 py-4 sm:py-5 shrink-0">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 z-10 flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-xl text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-40"
              title="Tutup Modal (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Watermark Ikon Laporan Magang */}
            <FileCheck2
              className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 w-16 sm:w-24 h-16 sm:h-24 opacity-[0.12] text-white pointer-events-none transform rotate-6"
              strokeWidth={1.2}
            />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <PesertaAvatar nama={peserta.nama_lengkap} foto={peserta.foto_profil} />
              <div className="min-w-0 text-left">
                <h3 className="text-sm sm:text-base font-black text-white truncate leading-snug">
                  {peserta.nama_lengkap}
                </h3>
                <p className="text-[10px] sm:text-[11.5px] font-medium text-white/70 truncate mt-0.5">
                  {peserta.institusi || "Institusi Pendidikan"}
                  {peserta.jurusan && <> &bull; {peserta.jurusan}</>}
                </p>

                {/* Badge Row */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
                  {peserta.nim_nisn && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-white">
                      NIM: {peserta.nim_nisn}
                    </span>
                  )}
                  {peserta.posisi_bidang && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-white">
                      <Briefcase className="w-2.5 h-2.5" />
                      {peserta.posisi_bidang}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full backdrop-blur-md px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold border ${
                      peserta.status_laporan === "disetujui"
                        ? "bg-emerald-500/25 border-emerald-300/30 text-emerald-200"
                        : peserta.status_laporan === "revisi"
                        ? "bg-rose-500/25 border-rose-300/30 text-rose-200"
                        : "bg-amber-500/25 border-amber-300/30 text-amber-200"
                    }`}
                  >
                    {peserta.status_laporan === "disetujui" ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Disetujui</span>
                      </>
                    ) : peserta.status_laporan === "revisi" ? (
                      <>
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Perlu Revisi</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-2.5 h-2.5" />
                        <span>Menunggu Review</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Info Workflow Alert Banner */}
            <div
              className={`flex items-start gap-2.5 rounded-2xl border p-3 sm:p-3.5 ${
                isDark
                  ? "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-slate-300"
                  : "bg-blue-50/80 border-blue-100 text-blue-800"
              }`}
            >
              <Info className="w-4 h-4 text-[#00A5EC] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-[10.5px] sm:text-[11.5px] leading-relaxed">
                {peserta.status_laporan === "disetujui" ? (
                  <span>
                    Naskah laporan akhir ini telah <strong>disahkan</strong>. Komponen kelengkapan laporan pada lembar penilaian otomatis terpenuhi 100 poin.
                  </span>
                ) : peserta.status_laporan === "revisi" ? (
                  <span>
                    Laporan saat ini berstatus <strong>Perlu Revisi</strong>. Anda dapat memperbarui catatan koreksi atau menyetujui naskah jika peserta telah memperbaiki.
                  </span>
                ) : (
                  <span>
                    Tinjau naskah praktek kerja dan luaran proyek peserta. Penyetujuan akan otomatis menyinkronkan kelengkapan laporan pada nilai akhir menjadi 100 poin.
                  </span>
                )}
              </div>
            </div>

            {/* Tombol Pratinjau Naskah untuk Tampilan Mobile (md:hidden) */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setShowMobilePreview(true)}
                disabled={!fileUrl}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-rose-200/90 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Lihat Dokumen Naskah (.PDF)</span>
                </div>
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* ========================================================================= */}
            {/* KOTAK TUNGGAL TERPADU: JUDUL, LUARAN PROYEK, & CATATAN DARI PESERTA */}
            {/* ========================================================================= */}
            <div
              className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs space-y-3 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/90 bg-white"
              }`}
            >
              {/* Header Box: Judul Naskah & Tgl Unggah */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Informasi Naskah &amp; Berkas
                </span>
                {peserta.tanggal_upload_laporan && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Calendar className="w-3 h-3" />
                    <span>{formatTanggalPresensi(peserta.tanggal_upload_laporan)}</span>
                  </span>
                )}
              </div>

              {/* 1. Judul Laporan */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <ClosedCaption className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Judul Laporan Akhir
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                  <p className="text-xs sm:text-[12.5px] font-black text-slate-900 dark:text-white leading-snug">
                    {peserta.judul_laporan_akhir || "Belum ada judul laporan akhir yang diajukan"}
                  </p>
                </div>
              </div>

              {/* 2. Tautan Luaran Proyek (Jika Dilampirkan) */}
              {linkProyekValid && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    Luaran / Portofolio Proyek Magang
                  </span>
                  <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1 min-w-0">
                      {peserta.link_proyek}
                    </span>
                    <a
                      href={linkProyekValid}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-sky-950/50 text-[#004F9F] dark:text-sky-300 text-[11px] font-bold border border-blue-200/80 dark:border-sky-800/40 hover:bg-blue-100 dark:hover:bg-sky-900/50 transition-all shrink-0 cursor-pointer shadow-2xs"
                      title="Buka Tautan Luaran Eksternal"
                    >
                      <span>Buka Tautan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* 3. Catatan dari Peserta (Jika Ada) */}
              {peserta.catatan_laporan_akhir && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <MessageSquareMore className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    Catatan dari Peserta
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 italic text-[11px] sm:text-xs leading-relaxed bg-slate-50/80 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    &ldquo;{peserta.catatan_laporan_akhir}&rdquo;
                  </p>
                </div>
              )}

              {/* 4. Arahan Revisi / Catatan Evaluasi Mentor (Jika Ada) */}
              {peserta.catatan_mentor_laporan && (
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 ${
                      peserta.status_laporan === "disetujui"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500"
                    }`}
                  >
                    {peserta.status_laporan === "disetujui" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Catatan Evaluasi / Pengesahan Mentor
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        Arahan Revisi Sebelumnya
                      </>
                    )}
                  </span>
                  <p
                    className={`italic text-[11px] sm:text-xs leading-relaxed p-2.5 rounded-xl border ${
                      peserta.status_laporan === "disetujui"
                        ? "text-emerald-800 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30"
                        : "text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/30"
                    }`}
                  >
                    &ldquo;{peserta.catatan_mentor_laporan}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* FORM KEPUTUSAN VERIFIKASI MENTOR (DESAIN MENARIK & LOGIS) */}
            {/* ========================================================================= */}
            <form onSubmit={handleSubmit} id="form-verifikasi-laporan" className="space-y-3.5 pt-1">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    <FileQuestionMark className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    Keputusan Verifikasi Mentor
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Pilih salah satu status</span>
                </div>

                {/* 2 Opsi Card Keputusan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Setujui Laporan */}
                  <button
                    type="button"
                    onClick={() => setStatusAksi("disetujui")}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      statusAksi === "disetujui"
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/25 shadow-xs"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${
                              statusAksi === "disetujui"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs"
                                : "bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="font-black text-xs sm:text-[13px]">Setujui Laporan</span>
                        </div>
                        {/* Radio Dot Indicator */}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            statusAksi === "disetujui"
                              ? "border-emerald-500 bg-white dark:bg-emerald-950"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {statusAksi === "disetujui" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pl-9 leading-relaxed">
                        Laporan sah &amp; memenuhi kriteria. Nilai kelengkapan naskah otomatis 100 poin.
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Minta Perbaikan / Revisi */}
                  <button
                    type="button"
                    onClick={() => setStatusAksi("revisi")}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      statusAksi === "revisi"
                        ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/25 shadow-xs"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${
                              statusAksi === "revisi"
                                ? "bg-rose-100 text-rose-700 border border-rose-300/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs"
                                : "bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10"
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <span className="font-black text-xs sm:text-[13px]">Minta Perbaikan</span>
                        </div>
                        {/* Radio Dot Indicator */}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            statusAksi === "revisi"
                              ? "border-rose-500 bg-white dark:bg-rose-950"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {statusAksi === "revisi" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pl-9 leading-relaxed">
                        Kirim arahan koreksi. Formulir pengunggahan dibuka kembali untuk peserta.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Catatan / Catatan Revisi */}
              <div
                className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs space-y-2 ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {statusAksi === "revisi" ? (
                      <>
                        Catatan Perbaikan / Arahan Revisi <span className="text-rose-500">* (Wajib diisi)</span>
                      </>
                    ) : (
                      "Catatan Apresiasi / Evaluasi Mentor (Opsional)"
                    )}
                  </label>
                </div>

                <textarea
                  rows={3}
                  required={statusAksi === "revisi"}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  disabled={submitting}
                  placeholder={
                    statusAksi === "revisi"
                      ? "Contoh: Format lembar pengesahan belum ditandatangani dan bab hasil pengujian masih kurang lengkap..."
                      : "Contoh: Laporan akhir disusun dengan sangat baik dan implementasi proyek selesai sesuai target..."
                  }
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-hidden transition-all duration-200 resize-none ${
                    statusAksi === "revisi"
                      ? isDark
                        ? "border-rose-800/60 bg-rose-950/20 text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                        : "border-rose-300 bg-rose-50/30 text-slate-700 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:ring-3 focus:ring-rose-500/15"
                      : isDark
                        ? "border-white/10 bg-white/5 text-slate-200 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-3 focus:ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-3 focus:ring-[#00A5EC]/15"
                  }`}
                />
                <p className="text-[10px] text-slate-400">
                  Catatan ini akan dikirimkan langsung ke notifikasi dan halaman laporan akhir peserta.
                </p>
              </div>

              {/* Shortcut Penilaian Akhir jika status laporan disetujui */}
              {peserta.status_laporan === "disetujui" && (
                <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-3.5 sm:p-4 shadow-2xs space-y-3">
                  {/* Bagian Atas: Ikon + Teks (Lebar Penuh) */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Tag Status / Pill */}
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80 dark:bg-emerald-900/60 dark:text-emerald-300">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          {peserta.status_penilaian === "sudah_dinilai" ? "Nilai Terisi" : "Tahap Evaluasi"}
                        </span>
                      </div>

                      {/* Judul & Deskripsi */}
                      <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {peserta.status_penilaian === "sudah_dinilai"
                          ? "Laporan sudah sah. Ingin meninjau atau memperbarui lembar nilai peserta?"
                          : "Laporan sudah sah. Siap mengisi evaluasi nilai akhir peserta?"}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {peserta.status_penilaian === "sudah_dinilai"
                          ? "Formulir 4 pilar kompetensi telah dinilai. Klik tombol di bawah untuk meninjau atau memperbarui skor."
                          : "Lanjutkan pengisian evaluasi 4 pilar kompetensi magang untuk memproses nilai akhir."}
                      </p>
                    </div>
                  </div>

                  {/* Bagian Bawah: Tombol Aksi di Bawah Tulisan (Pojok Kanan) */}
                  <div className="pt-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={handleBukaPenilaian}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 shadow-2xs hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                      title={`Buka form penilaian 4 pilar untuk ${peserta.nama_lengkap}`}
                    >
                      <span>
                        {peserta.status_penilaian === "sudah_dinilai" ? "Edit Lembar Nilai" : "Buka Lembar Nilai"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer Aksi (Sticky Bottom) */}
          <div
            className={`shrink-0 border-t p-3.5 sm:p-5 flex items-center justify-between gap-3 ${
              isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              form="form-verifikasi-laporan"
              disabled={submitting || !fileUrl}
              className={`group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                statusAksi === "disetujui"
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-rose-600 hover:bg-rose-600"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : statusAksi === "disetujui" ? (
                <>
                  <FileCheckCorner className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-115 group-hover/btn:rotate-6" />
                  <span>Setujui Laporan Akhir</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-115 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                  <span>Kirim Permintaan Revisi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ===== MOBILE OVERLAY PREVIEW MODAL (md:hidden) ===== */}
      {/* ========================================================= */}
      {showMobilePreview && fileUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-3"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className={`relative flex flex-col w-full max-w-2xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Pratinjau Mobile */}
            <div
              className={`flex items-center justify-between gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b shrink-0 ${
                isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 text-left">
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs ${
                    isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                </span>
                <span
                  className={`text-xs sm:text-sm font-black truncate ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {fileName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Zoom Controls */}
                <div
                  className={`flex items-center gap-0.5 rounded-full border shadow-2xs px-1 py-0.5 ${
                    isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
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
                      isDark ? "text-slate-200" : "text-slate-600"
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body Canvas Viewer Mobile */}
            <div
              className="flex-1 p-3 overflow-auto flex"
              style={{
                backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
              }}
            >
              <canvas
                ref={canvasRefMobile}
                className={`m-auto rounded-xl shadow-xl ring-1 ring-black/5 ${
                  isDark ? "bg-[#161b22]" : "bg-white"
                }`}
              />
            </div>

            {/* Pagination Mobile */}
            {numPages > 1 && (
              <div
                className={`flex items-center justify-between px-4 py-2 border-t shrink-0 ${
                  isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                  {pageNum} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum === numPages}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewLaporanModal;
