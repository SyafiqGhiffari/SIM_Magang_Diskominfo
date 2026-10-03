import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  UploadCloud,
  FileText,
  Download,
  ExternalLink,
  CalendarClock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Paperclip,
  Trash2,
  RefreshCw,
  Send,
  Globe,
  Link as LinkIcon,
  MessageSquareText,
  Sparkles,
  Info,
  Award,
  Image as ImageIcon,
  FilePenLine,
} from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import { kumpulTugasPeserta } from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

// Format tanggal dan jam tenggat waktu (Lengkap dengan jam WIB)
const formatDeadlineText = (dateStr) => {
  if (!dateStr) return "Tanpa Tenggat";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateFormatted}, ${hours}:${minutes} WIB`;
  } catch {
    return dateStr;
  }
};

// Helper metadata info berkas terpilih
const getFileMetadata = (fileObj) => {
  if (!fileObj) return null;
  const name = fileObj.name || "";
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const sizeMB = (fileObj.size / 1024 / 1024).toFixed(2);
  const sizeStr = `${sizeMB} MB`;

  let badgeColor = "bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border-blue-200/80 dark:border-blue-800/40";
  let icon = FileText;

  if (["pdf"].includes(ext)) {
    badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40";
    icon = FileText;
  } else if (["doc", "docx"].includes(ext)) {
    badgeColor = "bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border-blue-200/80 dark:border-blue-800/40";
    icon = FileText;
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40";
    icon = FileText;
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    badgeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/40";
    icon = Paperclip;
  } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
    badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40";
    icon = ImageIcon;
  }

  return {
    name,
    ext: ext.toUpperCase() || "FILE",
    size: sizeStr,
    badgeColor,
    icon,
  };
};

// Helper metadata berkas tersimpan sebelumnya di server
const getFilePathMetadata = (filePath) => {
  if (!filePath) return null;
  const name = filePath.split("/").pop().split("\\").pop();
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";

  let badgeColor = "bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border-blue-200/80 dark:border-blue-800/40";
  let icon = FileText;

  if (["pdf"].includes(ext)) {
    badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40";
    icon = FileText;
  } else if (["doc", "docx"].includes(ext)) {
    badgeColor = "bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border-blue-200/80 dark:border-blue-800/40";
    icon = FileText;
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40";
    icon = FileText;
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    badgeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/40";
    icon = Paperclip;
  } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
    badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40";
    icon = ImageIcon;
  }

  return {
    name,
    ext: ext.toUpperCase() || "FILE",
    badgeColor,
    icon,
  };
};

export const KumpulTugasModal = ({ tugas, onClose, onSaved, isDark: propIsDark }) => {
  const themeContext = useManajemenTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeContext?.isDark;
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const pengumpulan = tugas?.pengumpulan;
  const isSudahDinilai = pengumpulan?.status === "dinilai";
  const isRevisi = pengumpulan?.status === "revisi" || tugas?.status_tugas === "revisi";

  const [isEditing, setIsEditing] = useState(!pengumpulan);
  const [file, setFile] = useState(null);
  const [linkTugas, setLinkTugas] = useState(pengumpulan?.link_tugas || "");
  const [catatanPeserta, setCatatanPeserta] = useState(pengumpulan?.catatan_peserta || "");
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileLampiranMentor = tugas?.file_lampiran || tugas?.file_path;
  const tautanRefMentor = tugas?.tautan_eksternal || tugas?.link_eksternal;

  const fileMeta = useMemo(() => getFileMetadata(file), [file]);

  // Ekstraksi info berkas & tanggal pengumpulan sebelumnya
  const filePengumpulan = pengumpulan?.file_pengumpulan;
  const prevFileMeta = useMemo(() => {
    if (!filePengumpulan) return null;
    return getFilePathMetadata(filePengumpulan);
  }, [filePengumpulan]);

  const waktuKumpulFormatted = useMemo(() => {
    const rawDate = pengumpulan?.waktu_kumpul || pengumpulan?.updated_at || pengumpulan?.created_at;
    return rawDate ? formatDeadlineText(rawDate) : null;
  }, [pengumpulan]);

  // Deteksi apakah peserta telah melakukan perubahan pada berkas/tautan/catatan
  const hasChanges = useMemo(() => {
    if (!pengumpulan) return true;
    const fileChanged = Boolean(file);
    const prevLink = (pengumpulan?.link_tugas || "").trim();
    const currentLink = (linkTugas || "").trim();
    const linkChanged = currentLink !== prevLink;

    const prevCatatan = (pengumpulan?.catatan_peserta || "").trim();
    const currentCatatan = (catatanPeserta || "").trim();
    const catatanChanged = currentCatatan !== prevCatatan;

    return fileChanged || linkChanged || catatanChanged;
  }, [pengumpulan, file, linkTugas, catatanPeserta]);

  // Listener ESC untuk tutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pengumpulan && !hasChanges) {
      return;
    }
    if (!file && !pengumpulan?.file_pengumpulan && !linkTugas.trim() && !catatanPeserta.trim()) {
      toastError("Harap sertakan berkas tugas, tautan hasil karya, atau catatan penyelesaian.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) formData.append("file_tugas", file);
      // Selalu kirimkan link_tugas dan catatan_peserta (meski string kosong) agar penghapusan tersimpan ke server
      formData.append("link_tugas", linkTugas.trim());
      formData.append("catatan_peserta", catatanPeserta.trim());

      await kumpulTugasPeserta(tugas.id, formData);
      toastSuccess(pengumpulan ? "Pengumpulan tugas berhasil diperbarui." : "Tugas magang berhasil dikumpulkan.");
      if (onSaved) onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengumpulkan tugas.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  if (!tugas) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      {/* ── KOTAK MODAL UTAMA (KONSISTEN DENGAN MODAL TUGAS LAINNYA) ── */}
      <div
        className={`relative w-full max-w-2xl sm:max-w-3xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border-0 animate-[modalFadeUp_0.25s_ease-out] ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL SIGNATURE KOMINFO (STAY / FIXED DI ATAS) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4.5 sm:px-8 sm:py-5 shrink-0 border-0 text-white">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          
          {/* Watermark Icon */}
          <UploadCloud
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-1 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  <span>
                    {pengumpulan
                      ? isEditing
                        ? "Perbarui Pengumpulan Tugas"
                        : "Detail Pengumpulan Tugas"
                      : "Pengumpulan Tugas Proyek"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {tugas.judul}
                </h3>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/80 mt-1 font-medium">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10">
                    <CalendarClock className="w-3 h-3 text-sky-300" />
                    <span>Batas: {formatDeadlineText(tugas.tenggat_waktu)}</span>
                  </span>
                  {tugas.mentor?.nama && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 truncate max-w-[200px] sm:max-w-none">
                      <UserCheck className="w-3 h-3 text-sky-300 shrink-0" />
                      <span className="truncate">Mentor: {tugas.mentor.nama}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── FORM FORMULIR ── */}
        <form
          id="form-kumpul-tugas"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
            {/* ── KARTU STATUS PENGUMPULAN JAWABAN (INFORMATIF, MENARIK & MASUK AKAL) ── */}
            {pengumpulan && (
              <div
                className={`rounded-3xl border p-4.5 sm:p-5.5 space-y-4 shadow-sm transition-all ${
                  isSudahDinilai
                    ? "bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-white dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-transparent border-emerald-300/80 dark:border-emerald-700/50"
                    : isRevisi
                    ? "bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-white dark:from-rose-950/25 dark:via-slate-900/40 dark:to-transparent border-rose-300/80 dark:border-rose-700/50"
                    : "bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-white dark:from-amber-950/25 dark:via-slate-900/40 dark:to-transparent border-amber-300/80 dark:border-amber-700/50"
                }`}
              >
                {/* Header Status: Ikon Status + Keterangan Ringkas + Badge Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs border ${
                        isSudahDinilai
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-700/50"
                          : isRevisi
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300/60 dark:border-rose-700/50"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/50"
                      }`}
                    >
                      {isSudahDinilai ? (
                        <Award className="w-5 h-5" />
                      ) : isRevisi ? (
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                      ) : (
                        <Clock className="w-5 h-5 animate-pulse" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Status Pengumpulan Jawaban:
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {isSudahDinilai
                          ? "Tugas Telah Selesai Dinilai Mentor"
                          : isRevisi
                          ? "Tugas Memerlukan Revisi Jawaban"
                          : "Sedang Menunggu Review Mentor"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {waktuKumpulFormatted
                            ? `Terkirim pada: ${waktuKumpulFormatted}`
                            : "Jawaban telah tersimpan di sistem"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Pill Badge Status di Pojok Kanan */}
                  <div className="self-start sm:self-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs border ${
                        isSudahDinilai
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60"
                          : isRevisi
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/60"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60"
                      }`}
                    >
                      {isSudahDinilai ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Nilai: {pengumpulan.nilai}/100</span>
                        </>
                      ) : isRevisi ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          <span>Perlu Revisi</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Menunggu Review Mentor</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Banner Penjelasan Kontekstual */}
                <div
                  className={`p-3 rounded-2xl text-xs font-medium leading-relaxed border ${
                    isSudahDinilai
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/40"
                      : isRevisi
                      ? "bg-rose-500/10 text-rose-900 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/40"
                      : "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/40"
                  }`}
                >
                  {isSudahDinilai
                    ? "Tugas proyek Anda telah dinilai oleh mentor pembimbing. Anda masih dapat memperbarui berkas jawaban di bawah jika terdapat instruksi tambahan dari mentor."
                    : isRevisi
                    ? "Mentor telah memeriksa tugas ini dan meminta perbaikan jawaban. Silakan pelajari catatan evaluasi mentor di bawah, lalu unggah berkas perbaikan."
                    : "Jawaban Anda telah tersimpan di sistem. Anda dapat memperbarui berkas tugas atau tautan di bawah ini kapan saja sebelum mentor melakukan penilaian."}
                </div>

                {/* Catatan Evaluasi Mentor jika ada */}
                {pengumpulan.catatan_mentor && (
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs space-y-1.5 ${
                      isRevisi
                        ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60"
                        : "bg-white/95 dark:bg-slate-800/95 border-slate-200/90 dark:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100">
                        <MessageSquareText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                        <span>Catatan Evaluasi dari Mentor:</span>
                      </div>
                      {tugas.mentor?.nama && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          Mentor: {tugas.mentor.nama}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic pl-3.5 leading-relaxed font-medium border-l-2 border-[#004F9F] dark:border-[#00A5EC]">
                      &ldquo;{pengumpulan.catatan_mentor}&rdquo;
                    </p>
                  </div>
                )}

                {/* Berkas & Tautan Terkumpul Sebelumnya (Tersimpan di Sistem) */}
                {(pengumpulan.file_pengumpulan || pengumpulan.link_tugas || pengumpulan.catatan_peserta) && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Berkas &amp; Data Jawaban Terkumpul Saat Ini:</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        Tetap digunakan jika tidak diganti
                      </span>
                    </div>

                    <div
                      className={`grid gap-2.5 ${
                        pengumpulan.file_pengumpulan && pengumpulan.link_tugas
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {pengumpulan.file_pengumpulan && prevFileMeta && (
                        <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-[#004F9F]/40 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${prevFileMeta.badgeColor} shadow-2xs`}
                            >
                              <prevFileMeta.icon className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                  {prevFileMeta.ext}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">Berkas Terkumpul</span>
                              </div>
                              <p
                                className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5"
                                title={prevFileMeta.name}
                              >
                                {prevFileMeta.name}
                              </p>
                            </div>
                          </div>
                          <a
                            href={getFileUrl(pengumpulan.file_pengumpulan)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#004F9F] dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 border border-blue-200/80 dark:border-sky-800/50 shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                          </a>
                        </div>
                      )}

                      {pengumpulan.link_tugas && (
                        <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-sky-400/40 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-[#00A5EC] border border-sky-200/80 dark:border-sky-800/50 shadow-2xs">
                              <Globe className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Tautan Hasil Karya
                              </span>
                              <p
                                className="text-xs font-bold text-sky-700 dark:text-sky-300 truncate mt-0.5"
                                title={pengumpulan.link_tugas}
                              >
                                {pengumpulan.link_tugas}
                              </p>
                            </div>
                          </div>
                          <a
                            href={pengumpulan.link_tugas}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/50 shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {pengumpulan.catatan_peserta && (
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <MessageSquareText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Catatan Anda Sebelumnya: </span>
                          <span className="italic">&ldquo;{pengumpulan.catatan_peserta}&rdquo;</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── KARTU AKSI EDIT / PERBARUI JAWABAN (MUNCUL KETIKA SUDAH ADA PENGUMPULAN & BELUM MASUK MODE EDIT) ── */}
            {pengumpulan && !isEditing && (
              <div
                className={`rounded-2xl border px-4 py-2.5 sm:px-4.5 sm:py-3 flex items-center justify-between gap-3 transition-all duration-300 shadow-2xs animate-[fadeIn_0.2s_ease-out] ${
                  isDark
                    ? "bg-slate-800/70 border-white/10 hover:border-white/20"
                    : "bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                    Perlu Mengubah atau Memperbarui Jawaban?
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] hover:from-[#101F5C] hover:to-[#004F9F] text-white text-xs font-black shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-white/10"
                >
                  <FilePenLine className="w-3.5 h-3.5 text-white" />
                  <span>Edit Jawaban Tugas</span>
                </button>
              </div>
            )}

            {/* ── BANNER MODE EDIT AKTIF (HANYA KETIKA SUDAH PERNAH MENGUMPULKAN DAN SEDANG MENGEDIT) ── */}
            {pengumpulan && isEditing && (
              <div
                ref={formRef}
                className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-2xl bg-blue-50/80 dark:bg-sky-950/40 border border-blue-200/80 dark:border-sky-800/40 animate-[fadeIn_0.2s_ease-out]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/90 dark:border-sky-800/50 shadow-2xs">
                    <FilePenLine className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Formulir Pembaruan Jawaban Tugas
                    </h5>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFile(null);
                    setLinkTugas(pengumpulan?.link_tugas || "");
                    setCatatanPeserta(pengumpulan?.catatan_peserta || "");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/90 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tutup Form Edit</span>
                </button>
              </div>
            )}

            {/* ── 1. KOTAK INSTRUKSI & KETENTUAN PENUGASAN (HANYA DITAMPILKAN KETIKA BELUM PERNAH MENGUMPULKAN) ── */}
            {!pengumpulan && (
              <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-blue-50/30 to-white dark:from-white/[0.04] dark:to-transparent p-4.5 sm:p-5 shadow-2xs space-y-3.5 transition-all">
                {/* Header Box: Ikon + Judul + Subtitle + Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-sky-500/20 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs border border-blue-200/60 dark:border-sky-800/40">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100">
                        Instruksi &amp; Ketentuan Penugasan
                      </h4>
                      <p className="text-[10px] sm:text-[10.5px] text-slate-400">
                        Pedoman teknis pengerjaan langsung dari mentor pembimbing
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-sky-800/40 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    <span>Panduan Resmi</span>
                  </span>
                </div>

                {/* Teks Instruksi: Card Elegan Beraksen Garis Kiri */}
                <div className="relative rounded-2xl border-l-4 border-l-[#004F9F] dark:border-l-[#00A5EC] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-800/90 p-3.5 sm:p-4 shadow-2xs">
                  <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                    {tugas.deskripsi || "Silakan selesaikan tugas ini sesuai dengan arahan dan panduan teknis yang diberikan oleh mentor pembimbing."}
                  </p>
                </div>

                {/* Berkas & Link Panduan dari Mentor: Tampilan Kartu Interaktif Elegan */}
                {(fileLampiranMentor || tautanRefMentor) && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      Berkas Acuan &amp; Tautan Pendukung Mentor:
                    </span>
                    <div
                      className={`grid gap-2.5 ${
                        fileLampiranMentor && tautanRefMentor
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {fileLampiranMentor && (
                        <a
                          href={getFileUrl(fileLampiranMentor)}
                          target="_blank"
                          rel="noreferrer"
                          className="group/file flex items-center justify-between gap-3 p-3 rounded-2xl border border-blue-200/90 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white dark:from-blue-950/25 dark:to-slate-900/60 hover:border-[#004F9F] dark:hover:border-[#00A5EC] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50 group-hover/file:scale-105 transition-transform shadow-2xs">
                              <Download className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover/file:text-[#004F9F] dark:group-hover/file:text-[#00A5EC] truncate transition-colors">
                                Unduh Dokumen Panduan
                              </p>
                              <p className="text-[10px] text-slate-400 group-hover/file:text-[#004F9F]/80 dark:group-hover/file:text-sky-300/80 font-medium truncate">
                                Berkas lampiran instruksi
                              </p>
                            </div>
                          </div>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-[#004F9F] dark:bg-sky-950/70 dark:text-sky-300 group-hover/file:bg-[#004F9F] group-hover/file:text-white transition-all shadow-2xs">
                            <Download className="w-3.5 h-3.5" />
                          </span>
                        </a>
                      )}
                      {tautanRefMentor && (
                        <a
                          href={tautanRefMentor}
                          target="_blank"
                          rel="noreferrer"
                          className="group/link flex items-center justify-between gap-3 p-3 rounded-2xl border border-sky-200/90 dark:border-sky-900/50 bg-gradient-to-r from-sky-50/80 via-blue-50/30 to-white dark:from-sky-950/25 dark:to-slate-900/60 hover:border-sky-500 dark:hover:border-[#00A5EC] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-[#00A5EC] border border-sky-200/80 dark:border-sky-800/50 group-hover/link:scale-105 transition-transform shadow-2xs">
                              <Globe className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover/link:text-sky-700 dark:group-hover/link:text-[#00A5EC] truncate transition-colors">
                                Buka Tautan Acuan
                              </p>
                              <p className="text-[10px] text-slate-400 group-hover/link:text-sky-700/80 dark:group-hover/link:text-sky-300/80 font-medium truncate">
                                Rujukan daring eksternal
                              </p>
                            </div>
                          </div>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100/70 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 group-hover/link:bg-sky-600 group-hover/link:text-white transition-all shadow-2xs">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FORMULIR PENGEDITAN / UNGGAH BERKAS (DISEMBUNYIKAN SAAT AWAL BUKA JIKA SUDAH ADA PENGUMPULAN) ── */}
            {isEditing && (
              <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
                {/* ── 2. UNGGAH BERKAS TUGAS (Drag & Drop Zone Signature) ── */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>
                        {pengumpulan
                          ? "Unggah Berkas Baru / Pengganti (Opsional)"
                          : "Unggah Berkas Tugas (PDF / ZIP / Dokumen)"}
                      </span>
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-normal">
                      {fileMeta ? "Berkas aktif terpilih" : "Maksimal 25 MB"}
                    </span>
                  </label>

                  {/* Input file tersembunyi */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-tugas-input"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />

                  {fileMeta ? (
                    /* Card Berkas Terpilih Persis Seperti Modal Mentor */
                    <div
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      className={`relative group rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                        isDragging
                          ? isDark
                            ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                            : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                          : isDark
                          ? "border-sky-500/30 bg-gradient-to-r from-[#111927] via-[#162032] to-[#111927] hover:border-sky-400/50"
                          : "border-blue-200/90 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-slate-50/80 hover:border-[#004F9F]/50"
                      }`}
                    >
                      {/* Drag Over Overlay */}
                      {isDragging && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#004F9F]/90 text-white rounded-3xl backdrop-blur-xs animate-[fadeslide_0.15s_ease-out]">
                          <UploadCloud className="w-9 h-9 animate-bounce mb-1 text-white" />
                          <span className="text-xs font-black">Lepaskan berkas di sini untuk mengganti</span>
                          <span className="text-[10px] text-blue-100">Berkas baru akan otomatis terpilih</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Kolom Kiri: Ikon Tipe Berkas & Detail Berkas */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${fileMeta.badgeColor} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                          >
                            <fileMeta.icon className="w-6 h-6 stroke-[2.2]" />
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#0B1442] dark:bg-[#004F9F] text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                              {fileMeta.ext}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[220px] sm:max-w-md"
                                title={fileMeta.name}
                              >
                                {fileMeta.name}
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Siap Diunggah</span>
                              </span>
                            </div>

                            <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                              <span className="font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5 text-[11px] shadow-2xs">
                                {fileMeta.size}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Dokumen tugas berhasil dipilih</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Kolom Kanan: Aksi (Ganti Berkas & Hapus) */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group/btnGanti inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 hover:text-[#004F9F] dark:hover:text-[#00A5EC] hover:border-blue-300 dark:hover:border-sky-500/30 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 group-hover/btnGanti:rotate-180" />
                            <span>Ganti Berkas</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            title="Hapus berkas terpilih"
                            className="group/btnHapus inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 hover:border-rose-300 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 transition-transform duration-200 group-hover/btnHapus:scale-110" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Area Drag & Drop Zone Saat Belum Ada Berkas */
                    <div
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`group/upload relative p-6 sm:p-7 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                        isDragging
                          ? isDark
                            ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                            : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                          : isDark
                          ? "border-white/10 hover:border-sky-500/40 bg-slate-900/40 hover:bg-slate-900/60"
                          : "border-slate-200 hover:border-[#004F9F] bg-slate-50/60 hover:bg-blue-50/20"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] mb-2.5 transition-all duration-300 group-hover/upload:-translate-y-1.5 group-hover/upload:scale-110 group-hover/upload:bg-[#004F9F] group-hover/upload:text-white shadow-2xs">
                        <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      <span className="text-xs font-black text-[#004F9F] dark:text-[#00A5EC] group-hover/upload:underline cursor-pointer">
                        {isDragging
                          ? "Lepaskan berkas di sini untuk mengunggah"
                          : "Tarik & lepas berkas di sini atau pilih berkas"}
                      </span>

                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Mendukung PDF, DOCX, XLSX, ZIP, RAR, atau berkas arsip (Maksimal 25 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* ── 3. TAUTAN HASIL KARYA / REPOSITORI / DEMO (Opsional) ── */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>Tautan Hasil Karya / Repositori / Demo</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {pengumpulan?.link_tugas && !linkTugas.trim() && (
                        <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
                          Tautan akan dihapus
                        </span>
                      )}
                      <span className="text-[10.5px] text-slate-400 font-normal">(Opsional)</span>
                    </div>
                  </label>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    </span>
                    <input
                      type="url"
                      value={linkTugas}
                      onChange={(e) => setLinkTugas(e.target.value)}
                      placeholder="Contoh: https://github.com/... atau https://figma.com/... atau tautan Drive"
                      className={`w-full h-11 pl-10 ${linkTugas ? "pr-10" : "pr-4"} text-xs rounded-2xl border font-medium transition-all ${
                        isDark
                          ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white shadow-2xs"
                      } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
                    />
                    {linkTugas && (
                      <button
                        type="button"
                        onClick={() => setLinkTugas("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Kosongkan / hapus tautan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── 4. CATATAN / KETERANGAN TAMBAHAN UNTUK MENTOR (Opsional) ── */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MessageSquareText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>Catatan / Keterangan Tambahan untuk Mentor</span>
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-normal">(Opsional)</span>
                  </label>

                  <textarea
                    rows={3}
                    value={catatanPeserta}
                    onChange={(e) => setCatatanPeserta(e.target.value)}
                    placeholder="Tuliskan kendala teknis, catatan penjelasan tugas, atau pesan singkat kepada mentor pembimbing..."
                    className={`w-full p-4 text-xs rounded-2xl border font-medium leading-relaxed transition-all ${
                      isDark
                        ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                        : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white shadow-2xs"
                    } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER MODAL (STAY / FIXED DI BAWAH) ── */}
          <div
            className={`px-6 py-4 sm:px-8 sm:py-5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
            }`}
          >
            <div className="hidden sm:flex items-center gap-2.5 min-w-0 flex-1 pr-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <Info className="w-3 h-3 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
              </span>
              <span className="truncate font-medium text-[11.5px]">
                {pengumpulan
                  ? isEditing
                    ? hasChanges
                      ? "Perubahan siap disimpan dan dikirimkan ke mentor."
                      : "Belum ada perubahan data jawaban tugas."
                    : "Jawaban tugas telah tersimpan di sistem."
                  : "Pastikan berkas atau tautan sudah sesuai sebelum dikirim."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (pengumpulan && isEditing) {
                    setIsEditing(false);
                    setFile(null);
                    setLinkTugas(pengumpulan?.link_tugas || "");
                    setCatatanPeserta(pengumpulan?.catatan_peserta || "");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  } else {
                    onClose();
                  }
                }}
                disabled={submitting}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {pengumpulan && isEditing ? "Batal Edit" : "Tutup"}
              </button>

              <button
                type="submit"
                form="form-kumpul-tugas"
                disabled={submitting || (Boolean(pengumpulan) && !hasChanges)}
                className={`group/btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl transition-all duration-200 border shrink-0 ${
                  submitting || (Boolean(pengumpulan) && !hasChanges)
                    ? isDark
                      ? "bg-slate-800/80 text-slate-500 border-white/5 cursor-not-allowed shadow-none"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer border-white/10"
                }`}
                title={
                  pengumpulan && !hasChanges
                    ? "Belum ada perubahan data jawaban tugas"
                    : undefined
                }
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>Mengirim Jawaban...</span>
                  </>
                ) : (
                  <>
                    <Send
                      className={`w-3.5 h-3.5 ${
                        pengumpulan && !hasChanges
                          ? isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                          : "text-white"
                      } transition-transform duration-300 group-hover/btn:translate-x-0.5`}
                    />
                    <span>
                      {pengumpulan ? "Perbarui Pengumpulan" : "Kirim Jawaban Tugas"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KumpulTugasModal;
