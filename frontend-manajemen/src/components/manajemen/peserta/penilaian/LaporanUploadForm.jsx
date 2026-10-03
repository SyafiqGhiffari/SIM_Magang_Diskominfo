import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  FileUp,
  RefreshCw,
  Eye,
  Trash2,
  X,
  ExternalLink,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileX,
  Loader2,
  Calendar,
  Clock,
  MessageSquareQuote,
} from "lucide-react";
import { uploadLaporanAkhirPeserta } from "../../../../services/pesertaService";
import { toastSuccess, toastError, confirmDialog } from "../../../../utils/swal";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const LaporanUploadForm = ({ pendaftaran = {}, laporanStatus = {}, onUploaded }) => {
  const { isDark } = useManajemenTheme();
  const statusRaw = (laporanStatus?.status || laporanStatus?.status_laporan || "").toLowerCase();
  const isDisetujui = Boolean(laporanStatus?.disetujui || pendaftaran?.laporan_akhir_disetujui || statusRaw === "disetujui");
  const fileSudahAda = Boolean(pendaftaran?.file_laporan_akhir || laporanStatus?.file_laporan_akhir);
  const isRevisi = !isDisetujui && fileSudahAda && (statusRaw === "perlu_revisi" || statusRaw === "revisi");
  const isMenunggu = !isDisetujui && !isRevisi && fileSudahAda;

  const existingRawFile =
    pendaftaran?.file_laporan_akhir ||
    laporanStatus?.file_laporan_akhir ||
    laporanStatus?.file_path;
  const existingFileUrl = existingRawFile ? getFileUrl(existingRawFile) : null;
  const existingFileName = existingRawFile
    ? existingRawFile.split("/").pop().split("\\").pop()
    : "Naskah-Laporan-Akhir.pdf";
  const existingJudul =
    laporanStatus?.judul_laporan_akhir ||
    pendaftaran?.judul_laporan_akhir ||
    "Laporan Akhir Praktek Kerja Lapangan";
  const existingTglUpload =
    laporanStatus?.tanggal_upload_laporan ||
    pendaftaran?.tanggal_upload_laporan ||
    laporanStatus?.updated_at ||
    pendaftaran?.updated_at;
  const existingLinkProyek =
    laporanStatus?.link_proyek ||
    pendaftaran?.link_proyek ||
    "";
  const existingCatatan =
    laporanStatus?.catatan_laporan_akhir ||
    pendaftaran?.catatan_laporan_akhir ||
    "";
  const catatanMentor =
    laporanStatus?.catatan_mentor ||
    laporanStatus?.catatan_mentor_laporan ||
    pendaftaran?.catatan_mentor_laporan ||
    pendaftaran?.catatan_mentor ||
    "";

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [file, setFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDocName, setPreviewDocName] = useState("");

  // State untuk penampil PDF Canvas
  const [zoom, setZoom] = useState(100);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);

  const [judul, setJudul] = useState(
    () => laporanStatus?.judul_laporan_akhir || pendaftaran?.judul_laporan_akhir || ""
  );
  const [linkProyek, setLinkProyek] = useState(
    () => laporanStatus?.link_proyek || pendaftaran?.link_proyek || ""
  );
  const [catatan, setCatatan] = useState(
    () => laporanStatus?.catatan_laporan_akhir || pendaftaran?.catatan_laporan_akhir || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
    setPdfDoc(null);
    setDocLoading(false);
    setDocError(false);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleOpenPreviewLocal = () => {
    if (!file) return;
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewDocName(file.name);
    setPdfDoc(null);
    setDocLoading(true);
    setDocError(false);
    setPageNum(1);
    setZoom(100);
    setShowPreviewModal(true);
  };

  const handleOpenPreviewExisting = () => {
    if (!existingFileUrl) return;
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(existingFileUrl);
    setPreviewDocName(existingFileName);
    setPdfDoc(null);
    setDocLoading(true);
    setDocError(false);
    setPageNum(1);
    setZoom(100);
    setShowPreviewModal(true);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = previewDocName || file?.name || existingFileName || "Laporan-Akhir-Magang.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!previewUrl) return;
    const printWindow = window.open(previewUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  // Bersihkan object URL saat unmount atau saat url berganti
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle tombol escape dan lock scroll body saat modal aktif
  useEffect(() => {
    if (!showPreviewModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClosePreview();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPreviewModal, handleClosePreview]);

  // Muat dokumen PDF ke pdfjs-dist saat modal terbuka
  useEffect(() => {
    if (!showPreviewModal || !previewUrl) return;
    let cancelled = false;

    fetch(previewUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setDocLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Gagal membaca dokumen PDF:", err);
        setDocError(true);
        setDocLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showPreviewModal, previewUrl]);

  // Render halaman PDF ke canvas saat pageNum atau zoom berubah
  useEffect(() => {
    if (!pdfDoc || !showPreviewModal) return;
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
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum, zoom, showPreviewModal]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      toastError("Berkas laporan akhir wajib berformat PDF (.pdf)");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toastError("Ukuran berkas melebihi batas maksimal 20 MB");
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDisetujui) return;
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDisetujui) return;

    if (!judul.trim()) {
      toastError("Judul laporan akhir magang wajib diisi.");
      return;
    }

    if (!file && !fileSudahAda) {
      toastError("Harap pilih berkas naskah PDF Laporan Akhir.");
      return;
    }

    const konfirmasi = await confirmDialog({
      title: isRevisi ? "Kirim Naskah Revisi?" : fileSudahAda ? "Perbarui Laporan Akhir?" : "Kirim Laporan Akhir?",
      text: isRevisi
        ? "Naskah perbaikan laporan akhir akan dikirimkan ke mentor pembimbing lapangan untuk dievaluasi ulang."
        : "Pastikan naskah PDF dan data laporan Anda sudah sesuai pedoman kampus/sekolah Anda.",
      confirmText: isRevisi ? "Ya, Kirim Revisi" : "Ya, Kirim Laporan",
      icon: "question",
    });

    if (!konfirmasi?.isConfirmed) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) {
        formData.append("file_laporan", file);
        formData.append("file", file);
      }
      formData.append("judul_laporan_akhir", judul.trim());
      formData.append("judul", judul.trim());
      formData.append("link_proyek", linkProyek.trim());
      formData.append("catatan_laporan_akhir", catatan.trim());
      formData.append("catatan", catatan.trim());

      await uploadLaporanAkhirPeserta(formData);
      toastSuccess(
        isRevisi
          ? "Naskah revisi laporan berhasil dikirim ke mentor pembimbing."
          : "Laporan akhir magang berhasil disimpan dan dikirim ke mentor."
      );
      setFile(null);
      window.dispatchEvent(new Event("sim_notifikasi_updated"));
      if (onUploaded) onUploaded();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengunggah laporan akhir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
              isDisetujui
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20"
                : "bg-gradient-to-br from-[#0B1442] to-[#00A5EC]"
            }`}
          >
            {isDisetujui ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <FileUp className="w-5 h-5" />
            )}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{isDisetujui ? "Naskah Laporan Akhir Magang" : "Formulir Pengumpulan Laporan Akhir"}</span>
              {isDisetujui && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <Lock className="w-3 h-3" />
                  Terkunci (ACC)
                </span>
              )}
              {isRevisi && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-3 h-3" />
                  Mode Revisi
                </span>
              )}
              {isMenunggu && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <Clock className="w-3 h-3" />
                  Menunggu Review
                </span>
              )}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isDisetujui
                ? "Naskah laporan akhir telah disahkan oleh pembimbing lapangan dan data terkunci."
                : "Unggah naskah PDF lengkap (format bebas mengikuti pedoman dari kampus / sekolah Anda)"}
            </p>
          </div>
        </div>
      </div>

      {/* ── BANNER NASKAH LAPORAN TERKUMPUL (Bila berkas sudah pernah tersimpan di sistem) ── */}
      {fileSudahAda && (
        <div
          className={`relative mt-5 overflow-hidden rounded-2xl border transition-all duration-300 shadow-xs ${
            isDisetujui
              ? "border-emerald-200/90 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-[#161b22]"
              : isRevisi
              ? "border-rose-200/90 dark:border-rose-800/50 bg-gradient-to-br from-rose-50/70 via-orange-50/30 to-white dark:from-rose-950/40 dark:via-rose-950/20 dark:to-[#161b22]"
              : "border-amber-200/90 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/70 via-orange-50/20 to-white dark:from-amber-950/40 dark:via-slate-900/40 dark:to-[#161b22]"
          }`}
        >
          {/* Ambient Decorative Glow */}
          <div
            className={`absolute -right-10 -top-10 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
              isDisetujui
                ? "bg-emerald-400/15"
                : isRevisi
                ? "bg-rose-400/15"
                : "bg-amber-400/15"
            }`}
          />

          <div className="relative p-4 sm:p-5 space-y-3.5">
            {/* Header Status & Tanggal Pengunggahan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
                    isDisetujui
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60"
                      : isRevisi
                      ? "bg-rose-100 text-rose-800 border-rose-300/80 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/60"
                      : "bg-amber-100 text-amber-800 border-amber-300/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60"
                  }`}
                >
                  {isDisetujui ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Naskah Disahkan &amp; Terkunci</span>
                    </>
                  ) : isRevisi ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Naskah Perlu Revisi</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Naskah Sedang Ditinjau Mentor</span>
                    </>
                  )}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
                  &bull; Versi terkumpul saat ini
                </span>
              </div>

              {existingTglUpload && (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diunggah: {formatTanggalPresensi(existingTglUpload)}</span>
                </div>
              )}
            </div>

            {/* Rincian Dokumen Terkumpul & Tombol Aksi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Badge Tile PDF */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shadow-xs">
                    <FileText className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase shadow-2xs border border-rose-200 dark:border-rose-900/60 tracking-wider">
                    PDF
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Judul Naskah Laporan:
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                    {existingJudul}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    Berkas: <span className="font-semibold text-slate-700 dark:text-slate-300">{existingFileName}</span>
                  </p>
                </div>
              </div>

              {/* Tombol Aksi Cepat Dokumen Terkumpul */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 md:pt-0">
                {existingFileUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenPreviewExisting}
                      className="group/prev inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-[#004F9F] dark:text-sky-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all active:scale-95 cursor-pointer"
                      title="Lihat pratinjau dokumen PDF di modal"
                    >
                      <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/prev:scale-120" />
                      <span>Pratinjau Naskah</span>
                    </button>

                    <a
                      href={existingFileUrl}
                      download={existingFileName}
                      className="group/dl inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                      title="Unduh berkas PDF ke perangkat"
                    >
                      <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover/dl:scale-115 text-slate-500 dark:text-slate-400" />
                      <span>Unduh PDF</span>
                    </a>
                  </>
                )}

                {existingLinkProyek && (
                  <a
                    href={existingLinkProyek.startsWith("http") ? existingLinkProyek : `https://${existingLinkProyek}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group/ext inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                    title="Buka tautan luaran proyek magang di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 group-hover/ext:scale-115 text-slate-500 dark:text-slate-400" />
                    <span>Luaran Proyek</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pembatas / Keterangan Masuk Akal jika peserta ingin memperbarui laporan */}
      {fileSudahAda && !isDisetujui && (
        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Formulir Pembaruan Naskah Laporan
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Isi formulir di bawah jika ingin mengganti data di atas
          </span>
        </div>
      )}

      {isDisetujui && (
        <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-3">
          <div className="flex items-center gap-2 font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Laporan Telah Disetujui Secara Resmi</span>
          </div>
          <p className="leading-relaxed opacity-90 pl-6">
            Laporan akhir Anda sudah disahkan oleh pembimbing lapangan. Data formulir telah dikunci dan nilai administratif kelulusan magang telah diberikan. Jika terdapat perubahan khusus, silakan hubungi mentor pembimbing Anda secara langsung.
          </p>

          {/* Catatan / Feedback yang Diberikan Mentor saat Menyetujui Laporan */}
          {catatanMentor && (
            <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-emerald-300/90 dark:border-emerald-700/60 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <MessageSquareQuote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Catatan & Masukan dari Pembimbing Lapangan:</span>
              </div>
              <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium pl-6 whitespace-pre-wrap italic">
                "{catatanMentor}"
              </p>
            </div>
          )}

          {existingCatatan && (
            <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 pl-6 text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Ringkasan / Catatan yang Anda sampaikan:</span>
              <p className="mt-0.5 italic text-emerald-900 dark:text-emerald-200 leading-relaxed">
                "{existingCatatan}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tampilkan kolom formulir pengunggahan HANYA bila naskah BELUM disetujui (belum unggah / menunggu review / perlu revisi) */}
      {!isDisetujui && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4.5">
          {/* 1. Judul Laporan Akhir */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Judul Laporan Akhir Magang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isDisetujui}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Laporan Praktek Kerja Lapangan pada Dinas Komunikasi dan Informatika Bidang Aplikasi Informatika..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10.5px] text-slate-400 mt-1">
              Gunakan judul laporan resmi yang Anda ajukan ke kampus / sekolah Anda.
            </p>
          </div>

          {/* 2. Berkas Naskah PDF */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200">
                Berkas Naskah Laporan Akhir (.PDF) <span className="text-rose-500">*</span>
              </label>
              {file && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  1 Berkas Terpilih
                </span>
              )}
            </div>

            {file ? (
              /* TAMPILAN BERKAS TERPILIH (HIJAU, ELEGAN & BERSIH) */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isDisetujui) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`group/card relative overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-xs hover:shadow-md ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/40 scale-[1.005]"
                    : "border-emerald-300/90 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-[#161b22]"
                }`}
              >
                {/* Decorative Ambient Glow (Hijau Emerald) */}
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-400/20 blur-2xl pointer-events-none group-hover/card:scale-125 transition-transform duration-500" />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={isDisetujui}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="relative p-4 sm:p-5">
                  {/* File Information & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Badge Tile PDF + Metadata */}
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Badge Tile Icon PDF (Style Badge Merah) */}
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shadow-xs transition-transform duration-300 group-hover/card:scale-105 group-hover/card:-rotate-3">
                          <FileText className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-[8.5px] font-black uppercase shadow-2xs border border-rose-200 dark:border-rose-900/60 tracking-wider">
                          PDF
                        </span>
                      </div>

                      {/* Text Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md md:max-w-lg"
                            title={file.name}
                          >
                            {file.name}
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/60 shadow-2xs">
                            Siap Diunggah
                          </span>
                        </div>

                        {/* Meta chips */}
                        <div className="mt-1.5 flex items-center gap-2 text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/5">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Dokumen PDF Valid
                          </span>
                          <span className="text-slate-400 hidden sm:inline text-[11px]">
                            &bull; Berkas baru dipilih
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Buka / Pratinjau PDF */}
                      <button
                        type="button"
                        onClick={handleOpenPreviewLocal}
                        className="group/preview inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Lihat pratinjau berkas PDF"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 transition-transform duration-300 group-hover/preview:scale-125 group-hover/preview:-translate-y-0.5" />
                        <span>Pratinjau</span>
                      </button>

                      {/* Ganti Berkas */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group/refresh inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Ganti dengan berkas PDF lain"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 transition-transform duration-500 group-hover/refresh:rotate-180 group-hover/refresh:scale-115" />
                        <span>Ganti</span>
                      </button>

                      {/* Batalkan Pilihan Berkas */}
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="group/trash inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Batalkan pilihan berkas"
                      >
                        <Trash2 className="w-4 h-4 transition-transform duration-300 group-hover/trash:scale-125 group-hover/trash:-rotate-12" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAMPILAN DROPZONE SEBELUM MEMILIH BERKAS (KEMBALI KE SEMULA) */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isDisetujui) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`group/drop relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? "border-[#004F9F] bg-blue-50/50 dark:bg-sky-950/20"
                    : "border-slate-300 dark:border-white/10 hover:border-[#004F9F] dark:hover:border-sky-400 bg-slate-50/50 dark:bg-slate-900/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={isDisetujui}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400 shadow-2xs transition-all duration-300 group-hover/drop:scale-110 group-hover/drop:-translate-y-1 group-hover/drop:bg-[#004F9F] group-hover/drop:text-white group-hover/drop:shadow-md">
                    <UploadCloud className="w-6 h-6 transition-transform duration-300 group-hover/drop:scale-110 group-hover/drop:-rotate-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {fileSudahAda
                        ? "Klik atau seret untuk mengganti berkas PDF sebelumnya"
                        : "Pilih berkas PDF atau seret ke sini"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format PDF &bull; Maksimal ukuran file 20 MB
                    </p>
                  </div>

                  {fileSudahAda && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 mt-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Naskah sebelumnya sudah tersimpan di sistem
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Tautan Luaran Proyek / Repositori / Demo Portofolio */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Tautan Demo Proyek / Repositori Kode / Video Portofolio (Opsional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                disabled={isDisetujui}
                value={linkProyek}
                onChange={(e) => setLinkProyek(e.target.value)}
                placeholder="Contoh: https://github.com/... atau https://drive.google.com/... atau https://youtube.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1">
              Lampirkan tautan produk digital jika Anda membuat sistem, desain, atau video dokumentasi selama magang.
            </p>
          </div>

          {/* 4. Catatan Pengantar / Abstrak untuk Mentor */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Ringkasan Kegiatan &amp; Catatan Pengantar untuk Mentor
            </label>
            <textarea
              rows={4}
              disabled={isDisetujui}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan ringkasan singkat hasil pekerjaan atau capaian proyek magang Anda, atau beri catatan jika terdapat revisi naskah..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 5. Tombol Aksi */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="group/btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 border border-white/10 bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-125 group-hover/btn:rotate-6" />
              )}
              <span>
                {submitting
                  ? "Mengunggah..."
                  : isRevisi
                  ? "Kirim Berkas Revisi"
                  : fileSudahAda
                  ? "Perbarui Laporan Akhir"
                  : "Kirim Laporan Akhir"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL PRATINJAU BERKAS PDF */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop Click Listener */}
          <div
            className="absolute inset-0"
            onClick={handleClosePreview}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-5xl h-[88vh] rounded-3xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {previewDocName || file?.name || existingFileName || "Pratinjau Dokumen PDF"}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black uppercase tracking-wider shrink-0">
                      PDF
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Dokumen Tersimpan"} &bull; {numPages} Halaman
                  </p>
                </div>
              </div>

              {/* Kontrol Zoom (seperti pada modal verifikasi izin mentor) */}
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

                {/* Kotak Grup Aksi Dokumen: Print, Download, dan Tab Baru (Ukuran h-8 Sama Persis dengan Tombol X) */}
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

                  {/* Tombol Tab Baru (Ikon saja, warna senada dengan download & print) */}
                  <a
                    href={previewUrl}
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
                  onClick={handleClosePreview}
                  className="group/close inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800/50 shadow-2xs hover:shadow-xs transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer"
                  title="Tutup pratinjau (Esc)"
                >
                  <X className="w-4 h-4 transition-transform duration-300 group-hover/close:rotate-90 group-hover/close:scale-110" />
                </button>
              </div>
            </div>

            {/* Modal PDF Viewer Body (Canvas dengan Background Dot-Matrix) */}
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
                  <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                    <div
                      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-[3px] border-slate-300 animate-spin ${
                        isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
                      }`}
                    />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-300">
                      Memuat pratinjau dokumen PDF...
                    </span>
                  </div>
                ) : docError ? (
                  <div className="m-auto flex flex-col items-center gap-2.5 text-center text-slate-400">
                    <FileX className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-300">
                      Gagal memuat pratinjau dokumen PDF
                    </span>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-blue-800 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Berkas di Tab Baru</span>
                      </a>
                    )}
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

              {/* Floating PDF Pagination (seperti di modal izin mentor) */}
              {numPages > 1 && !docLoading && !docError && (
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#161b22] text-[11px] text-slate-400">
              <span className="hidden sm:inline">
                Pastikan susunan isi dokumen telah sesuai sebelum formulir dikirimkan.
              </span>
              <span className="sm:hidden">
                Tekan Esc atau Tutup untuk kembali.
              </span>
              <button
                type="button"
                onClick={handleClosePreview}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanUploadForm;
