import { useEffect, useState, useRef } from "react";
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
  Paperclip,
  Info,
  Eye,
  Ban,
  MessageSquareText,
  BriefcaseMedical,
  Clock,
  FileX,
  Image as ImageIcon,
  ExternalLink,
  ClipboardCheck,
  Briefcase,
} from "lucide-react";
import { prosesPengajuanIzinMentor } from "../../../../services/mentorService";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { confirmDialog, toastError, toastSuccess } from "../../../../utils/swal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const namaBulanSingkat = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatHariRentang = (mulai, selesai) => {
  const d1 = parseLocalDate(mulai);
  if (!d1) return "";
  const h1 = namaHari[d1.getDay()];
  if (!selesai || mulai === selesai) return `(${h1})`;
  const d2 = parseLocalDate(selesai);
  if (!d2) return `(${h1})`;
  const h2 = namaHari[d2.getDay()];
  const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays === 2) {
    return `(${h1} & ${h2})`;
  }
  return `(${h1} s/d ${h2})`;
};

const hitungDurasiHari = (mulai, selesai) => {
  if (!mulai) return "1 Hari Kerja";
  if (!selesai || mulai === selesai) return "1 Hari Kerja";
  const d1 = parseLocalDate(mulai);
  const d2 = parseLocalDate(selesai);
  if (!d1 || !d2) return "1 Hari Kerja";
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} Hari Kerja`;
};

const formatWaktuPengajuanLengkap = (s) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const jam = `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return `Diajukan: Hari Ini, ${jam}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Diajukan: Kemarin, ${jam}`;

  return `Diajukan: ${d.getDate()} ${namaBulanSingkat[d.getMonth()]} ${d.getFullYear()}, ${jam}`;
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

const ProsesIzinModal = ({ data, onClose, onSaved, isDark = false }) => {
  const [catatan, setCatatan] = useState(
    data?.catatan_mentor ||
      (data?.defaultAction === "klarifikasi"
        ? "Mohon berikan klarifikasi atau informasi tambahan terkait permohonan ini."
        : "")
  );
  const [saving, setSaving] = useState(false);

  const fileUrl = data?.file_bukti ? getFileUrl(data.file_bukti) : null;
  const fileName = data?.file_bukti
    ? data.file_bukti.split("/").pop().split("\\").pop()
    : "Lampiran-Bukti";
  const lowerFile = String(data?.file_bukti || "").toLowerCase();
  const isPdf = lowerFile.endsWith(".pdf");
  const isImage =
    lowerFile.endsWith(".jpg") ||
    lowerFile.endsWith(".jpeg") ||
    lowerFile.endsWith(".png") ||
    lowerFile.endsWith(".webp");

  const canvasRef = useRef(null);
  const canvasRefMobile = useRef(null);
  const defaultZoom = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 100;
  const [zoom, setZoom] = useState(defaultZoom);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(Boolean(fileUrl));
  const [docError, setDocError] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(null);
  const [fotoError, setFotoError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  // Muat dokumen PDF atau gambar
  useEffect(() => {
    if (!fileUrl) {
      const t = setTimeout(() => setDocLoading(false), 0);
      return () => clearTimeout(t);
    }

    const initId = setTimeout(() => {
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
        clearTimeout(initId);
      };
    }

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
  }, [fileUrl, isImage]);

  // Render halaman PDF ke canvas
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
  }, [pdfDoc, pageNum, zoom, showMobilePreview, isImage]);

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
      toastError("Gagal membuka dokumen untuk dicetak.");
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    setFileActionLoading("download");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
      const ext = isImage ? (lowerFile.endsWith(".png") ? "png" : "jpg") : "pdf";
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${(data?.nama || "Dokumen").replace(/\s+/g, "_")}_Bukti_${data?.jenis || "izin"}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      toastError("Gagal mengunduh dokumen bukti.");
    } finally {
      setFileActionLoading(null);
    }
  };

  const proses = async (status) => {
    if (status === "ditolak" && !catatan.trim()) {
      toastError("Mohon isi catatan alasan penolakan agar peserta memahami keputusan Anda.");
      return;
    }

    const jenisLabel = data?.jenis === "sakit" ? "izin sakit" : "izin";
    const confirmMsg =
      status === "disetujui"
        ? {
            title: `Setujui permohonan ${jenisLabel}?`,
            text: `Presensi peserta akan otomatis tercatat sebagai ${data?.jenis} selama rentang tanggal yang diajukan.`,
            confirmText: "Ya, Setujui",
            icon: "question",
          }
        : {
            title: `Tolak permohonan ${jenisLabel}?`,
            text: `Peserta akan menerima notifikasi bahwa permohonan ditolak beserta catatan alasan dari Anda.`,
            confirmText: "Ya, Tolak",
            confirmButtonColor: "#e11d48",
            icon: "warning",
          };

    const resConfirm = await confirmDialog(confirmMsg);
    if (!resConfirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await prosesPengajuanIzinMentor(data.id, { status, catatan });
      const hari = res.data?.data?.jumlah_hari_tercatat ?? 0;
      toastSuccess(
        status === "disetujui"
          ? `Pengajuan disetujui. ${hari} hari kerja tercatat sebagai ${data?.jenis}.`
          : "Pengajuan izin berhasil ditolak."
      );
      onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memproses pengajuan izin.");
    } finally {
      setSaving(false);
    }
  };

  const isMenunggu = data?.status === "menunggu";
  const durasiStr = hitungDurasiHari(data?.tanggal_mulai, data?.tanggal_selesai);
  const fotoUrl = data?.foto_profil ? getFileUrl(data.foto_profil) : null;

  // Render Header (mengadopsi pola ReviewModal Admin)
  const renderHeader = (isMobile) => {
    const visibilityClass = isMobile ? "md:hidden" : "hidden md:block";
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 sm:px-7 py-3.5 sm:py-6 shrink-0 ${visibilityClass}`}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-40"
          title="Tutup Modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Watermark ikon besar khas dashboard SIM Magang */}
        <ClipboardCheck
          className="absolute right-6 sm:right-15 top-1/2 -translate-y-1/2 w-16 sm:w-28 h-16 sm:h-28 opacity-[0.12] text-white pointer-events-none transform rotate-6"
          strokeWidth={1}
        />

        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-[#00A5EC]/30 blur-xl animate-pulse" />
            {fotoUrl && !fotoError ? (
              <img
                src={fotoUrl}
                alt={data?.nama}
                onError={() => setFotoError(true)}
                className="relative h-11 w-11 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-lg border-2 sm:border-[3px] border-white/20 ring-2 sm:ring-4 ring-white/10"
              />
            ) : (
              <span className="relative flex h-11 w-11 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 border-2 sm:border-[3px] border-white/20 text-white text-xs sm:text-lg font-black backdrop-blur-md">
                {getInitials(data?.nama)}
              </span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-lg font-black text-white truncate">
                {data?.nama}
              </h3>
            </div>
            <p className="text-[9.5px] sm:text-xs font-medium text-white/70 truncate mt-0.5">
              {data?.institusi || "Institusi Pendidikan"}
              {data?.jurusan && <> &middot; {data.jurusan}</>}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
              {data?.nomor_induk ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold text-white">
                  NIM: {data.nomor_induk}
                </span>
              ) : null}
              {data?.bidang ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold text-white">
                  <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {data.bidang}
                </span>
              ) : null}
              <span
                className={`inline-flex items-center gap-1 rounded-full backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold border ${
                  data?.jenis === "sakit"
                    ? "bg-rose-500/25 border-rose-300/30 text-rose-200"
                    : "bg-amber-500/25 border-amber-300/30 text-amber-200"
                }`}
              >
                {data?.jenis === "sakit" ? (
                  <BriefcaseMedical className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span>{data?.jenis === "sakit" ? "Izin Sakit" : "Pengajuan Izin"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className={`flex flex-col md:flex-row w-full max-w-7xl h-[96vh] md:h-[92vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== PANEL KIRI: Viewer Dokumen / Lampiran Bukti ===== */}
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
                {isPdf ? (
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                ) : isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                ) : (
                  <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </span>
              <div className="min-w-0">
                <span
                  className={`text-xs sm:text-sm font-extrabold truncate block ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {fileUrl ? fileName : "Berkas Bukti Tidak Dilampirkan"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {fileUrl
                    ? isPdf
                      ? "Dokumen Portabel (PDF)"
                      : isImage
                      ? "Format Gambar / Foto"
                      : "Lampiran Dokumen"
                    : "Peserta mengajukan tanpa lampiran bukti"}
                </span>
              </div>
            </div>

            {/* Zoom Controls */}
            {fileUrl && !docLoading && !docError && (
              <div
                className={`flex items-center gap-0.5 sm:gap-1 rounded-full border shadow-sm px-1 md:px-1.5 py-0.5 md:py-1 shrink-0 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                  className="rounded-full p-1 sm:p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] dark:hover:bg-white/10 dark:hover:text-[#00A5EC] hover:scale-110 transition-all duration-200 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                  <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons: Print & Download */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!fileUrl || fileActionLoading !== null}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Cetak Berkas"
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
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Unduh Berkas"
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
                    className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl shadow-sm ${
                      isDark ? "bg-white/5" : "bg-white"
                    }`}
                  >
                    <FileX className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </span>
                  <p className="text-[11px] sm:text-xs font-black text-slate-500 dark:text-slate-300">
                    Tidak Ada Dokumen Lampiran
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Pengajuan izin ini diajukan oleh peserta tanpa menyertakan dokumen bukti fisik.
                  </p>
                </div>
              ) : docLoading ? (
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-[3px] border-slate-300 animate-spin ${
                      isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs font-bold">
                    Memuat pratinjau dokumen...
                  </span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center gap-2.5 text-center text-slate-400">
                  <FileX className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-300">
                    Gagal memuat pratinjau dokumen
                  </span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Berkas di Tab Baru</span>
                  </a>
                </div>
              ) : isImage ? (
                <div className="m-auto flex items-center justify-center min-h-full min-w-full overflow-auto p-2">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    style={{ width: `${zoom}%`, height: "auto" }}
                    className="m-auto max-w-none rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 transition-[width] duration-200 animate-[fadeslide_0.3s_ease-out]"
                  />
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
            {fileUrl && !isImage && numPages > 1 && !docLoading && !docError && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full border bg-slate-900/80 border-white/10 px-3.5 py-1.5 shadow-xl backdrop-blur-md text-white transition-all duration-300 hover:scale-105 hover:bg-slate-900/90 select-none">
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

        {/* ===== PANEL KANAN: Ringkasan, Detail Permohonan, Catatan Mentor & Aksi ===== */}
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
                  {isMenunggu ? (
                    <span>
                      Tinjau bukti dan alasan permohonan secara seksama. Persetujuan akan otomatis
                      memperbarui rekap presensi peserta.
                    </span>
                  ) : data?.status === "disetujui" ? (
                    <span>
                      Pengajuan telah <b>disetujui</b> dan presensi peserta telah otomatis tercatat
                      pada sistem.
                    </span>
                  ) : (
                    <span>
                      Pengajuan telah <b>ditolak</b>. Status keputusan verifikasi telah dikunci.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Metric Info Cards (Grid 2 Kolom) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Card 1: Jenis Pengajuan */}
              <div
                className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Jenis Pengajuan
                </p>
                <p
                  className={`mt-0.5 sm:mt-1 text-xs sm:text-xl font-black ${
                    data?.jenis === "sakit"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {data?.jenis === "sakit" ? "Izin Sakit" : "Pengajuan Izin"}
                </p>
                <p className="mt-0.5 text-[8.5px] sm:text-[10.5px] font-bold text-slate-400 truncate max-w-full">
                  {formatHariRentang(data?.tanggal_mulai, data?.tanggal_selesai)}
                </p>
              </div>

              {/* Card 2: Rentang Waktu Permohonan */}
              <div
                className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Rentang Waktu Permohonan
                </p>
                <p
                  className={`mt-0.5 sm:mt-1 text-xs sm:text-xl font-black ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  {durasiStr}
                </p>
                <p className="mt-0.5 text-[8.5px] sm:text-[10.5px] font-bold text-slate-400 truncate max-w-full">
                  {formatTanggalPresensi(data?.tanggal_mulai)}
                  {data?.tanggal_mulai !== data?.tanggal_selesai && (
                    <> &ndash; {formatTanggalPresensi(data?.tanggal_selesai)}</>
                  )}
                </p>
              </div>
            </div>

            {/* Alasan Peserta */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-2 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Alasan / Keterangan Peserta
                </span>
                {data?.created_at && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10.5px] font-semibold text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatWaktuPengajuanLengkap(data.created_at)}
                  </span>
                )}
              </div>
              <div
                className={`p-3 rounded-xl border text-xs sm:text-[12px] font-medium leading-relaxed italic ${
                  isDark
                    ? "bg-white/[0.03] border-white/5 text-slate-300"
                    : "bg-slate-50 border-slate-100 text-slate-700"
                }`}
              >
                &ldquo;{data?.alasan || "Tidak ada rincian alasan tambahan yang dilampirkan oleh peserta."}&rdquo;
              </div>
            </div>

            {/* Lampiran Dokumen Bukti (Mobile Action + Summary) */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-2.5 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Lampiran Dokumen Bukti
                </span>
                {fileUrl ? (
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

              {fileUrl ? (
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                      isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200/70"
                    }`}
                  >
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
                      >
                        {fileName}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Berkas tersedia &bull; Siap ditinjau</span>
                      </p>
                    </div>
                  </div>

                  {/* Tombol Pratinjau Mobile (Khusus Layar Kecil) */}
                  <div className="block md:hidden">
                    <button
                      type="button"
                      onClick={() => setShowMobilePreview(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white py-2 text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Pratinjau Dokumen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs italic ${
                    isDark
                      ? "bg-white/[0.02] border-white/5 text-slate-400"
                      : "bg-slate-50 border-slate-200/60 text-slate-500"
                  }`}
                >
                  <FileX className="w-4 h-4 shrink-0 opacity-60" />
                  <span>Peserta tidak melampirkan berkas bukti dokumen.</span>
                </div>
              )}
            </div>

            {/* Input Catatan Mentor */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-2 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <MessageSquareText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Catatan Mentor Pembimbing
                </span>
                {isMenunggu ? (
                  <span className="text-[9px] font-bold text-amber-500">
                    Wajib diisi bila menolak
                  </span>
                ) : null}
              </div>

              {isMenunggu ? (
                <div>
                  <textarea
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    disabled={saving}
                    placeholder="Berikan catatan, tugas mandiri, arahan pemulihan, atau alasan bila permohonan ditolak..."
                    className={`w-full rounded-xl border px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-medium outline-none transition-all duration-200 ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-200 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-4 focus:ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                    }`}
                  />
                </div>
              ) : (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed italic ${
                    data?.status === "disetujui"
                      ? isDark
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : isDark
                      ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                      : "bg-rose-50/70 border-rose-200 text-rose-900"
                  }`}
                >
                  &ldquo;
                  {data?.catatan_mentor ||
                    (data?.status === "disetujui"
                      ? "Pengajuan telah disetujui tanpa catatan khusus."
                      : "Pengajuan ditolak.")}
                  &rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Footer Aksi */}
          <div
            className={`shrink-0 border-t p-3.5 sm:p-5 flex items-center justify-between gap-3 ${
              isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200 bg-white"
            }`}
          >
            {isMenunggu ? (
              <>
                <button
                  type="button"
                  onClick={() => proses("ditolak")}
                  disabled={saving}
                  className="group/tolak inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 sm:px-5 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/20"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Ban className="w-3.5 h-3.5 transition-transform duration-300 group-hover/tolak:scale-125 group-hover/tolak:-rotate-12" />
                  )}
                  <span>Tolak</span>
                </button>

                <button
                  type="button"
                  onClick={() => proses("disetujui")}
                  disabled={saving}
                  className="group/setujui inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 sm:px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover/setujui:scale-125 group-hover/setujui:rotate-6" />
                  )}
                  <span>Setujui Pengajuan</span>
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {data?.status === "disetujui" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Status: Pengajuan Disetujui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <XCircle className="w-4 h-4" />
                      Status: Pengajuan Ditolak
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
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
                  {isPdf ? (
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  )}
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
                {/* Zoom Controls di Header Modal */}
                <div
                  className={`flex items-center gap-0.5 rounded-full border shadow-sm px-1 py-0.5 ${
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
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Konten pratinjau mobile */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                className={`flex-1 overflow-auto p-4 flex ${
                  isDark ? "bg-[#0d1117]" : "bg-slate-50/50"
                }`}
              >
                {docLoading ? (
                  <div className="m-auto flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A5EC]" />
                    <span className="text-xs font-bold text-slate-500">
                      Memuat pratinjau...
                    </span>
                  </div>
                ) : docError ? (
                  <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                    <FileX className="w-8 h-8 text-rose-400" />
                    <span className="text-xs font-bold">Gagal memuat dokumen</span>
                  </div>
                ) : isImage ? (
                  <div className="flex items-center justify-center min-h-full min-w-full overflow-auto p-2">
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
                  <div className="flex flex-col items-center justify-center min-h-full min-w-full overflow-auto p-2">
                    <canvas
                      ref={canvasRefMobile}
                      className={`rounded-xl shadow-xl ring-1 ring-black/5 max-w-full ${
                        isDark ? "bg-[#161b22]" : "bg-white"
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Floating Toolbar: Pagination + Print & Download */}
              {!docLoading && !docError && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 rounded-full border bg-slate-900/95 border-white/20 px-4 sm:px-5 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md text-white max-w-[92vw] w-max whitespace-nowrap select-none">
                  {!isImage && numPages > 1 && (
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                        disabled={pageNum === 1}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <span className="text-[11px] sm:text-xs font-black whitespace-nowrap px-2 select-none font-mono text-white shrink-0">
                        Hal {pageNum}/{numPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                        disabled={pageNum === numPages}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <div className="h-4 w-px bg-white/20 mx-1 sm:mx-1.5 shrink-0" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={fileActionLoading !== null}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Cetak Dokumen"
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
                      disabled={fileActionLoading !== null}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Unduh Dokumen"
                    >
                      {fileActionLoading === "download" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

export default ProsesIzinModal;