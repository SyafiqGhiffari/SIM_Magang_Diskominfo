import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  RefreshCw,
  Eye,
  GraduationCap,
  Contact,
  Camera,
  Award,
  Briefcase,
  BookOpen,
  Info,
  ShieldCheck,
  FileBadge2,
} from "lucide-react";
import { uploadDokumenPeserta } from "../../../../services/pesertaService";
import { toastSuccess, toastError } from "../../../../utils/swal";
import { getFileUrl } from "../../../../utils/fileUrl";

const DOKUMEN_OPTIONS = [
  {
    key: "file_surat_pengantar",
    label: "Surat Pengantar Magang",
    icon: GraduationCap,
    themeColor: "indigo",
    badgeColor: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/25",
    accept: ".pdf",
    acceptDesc: "PDF",
    desc: "Surat permohonan resmi dari institusi kampus atau sekolah asal peserta.",
    maxMb: 10,
    isRequired: true,
  },
  {
    key: "file_cv",
    label: "Curriculum Vitae (CV)",
    icon: Contact,
    themeColor: "purple",
    badgeColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
    iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/25",
    accept: ".pdf,.doc,.docx",
    acceptDesc: "PDF, DOC, DOCX",
    desc: "Daftar riwayat hidup, rekam jejak akademik, keahlian, dan portofolio peserta.",
    maxMb: 10,
    isRequired: true,
  },
  {
    key: "file_pas_foto",
    label: "Pas Foto Resmi Peserta",
    icon: Camera,
    themeColor: "sky",
    badgeColor: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/40",
    iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/25",
    accept: ".jpg,.jpeg,.png",
    acceptDesc: "JPG, JPEG, PNG",
    desc: "Foto formal terbaru peserta berlatar belakang rapi untuk identitas magang.",
    maxMb: 3,
    isRequired: true,
  },
  {
    key: "file_transkrip",
    label: "Transkrip Nilai / Rapor",
    icon: Award,
    themeColor: "emerald",
    badgeColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/25",
    accept: ".pdf",
    acceptDesc: "PDF",
    desc: "Salinan transkrip nilai akademik semester berjalan atau buku rapor terakhir.",
    maxMb: 10,
    isRequired: false,
  },
  {
    key: "file_portofolio",
    label: "Portofolio Karya & Proyek",
    icon: Briefcase,
    themeColor: "rose",
    badgeColor: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
    iconBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/25",
    accept: ".pdf,.zip,.rar",
    acceptDesc: "PDF, ZIP, RAR",
    desc: "Dokumentasi proyek, desain, kode pemrograman, atau sertifikat keahlian.",
    maxMb: 10,
    isRequired: false,
  },
  {
    key: "file_proposal_magang",
    label: "Proposal Rencana Magang",
    icon: BookOpen,
    themeColor: "amber",
    badgeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/25",
    accept: ".pdf",
    acceptDesc: "PDF",
    desc: "Proposal rencana kegiatan, sasaran target kerja, atau topik magang peserta.",
    maxMb: 10,
    isRequired: false,
  },
];

export const UploadDokumenModal = ({
  dk,
  isDark,
  isOpen,
  onClose,
  initialJenis = "file_cv",
  mode = "baru", // "baru" | "ganti"
  pendaftaran = {},
  onPreviewOldFile,
  onSuccess,
}) => {
  const darkMode = isDark ?? dk ?? false;
  const isGantiMode = mode === "ganti";

  // Daftar berkas yang BELUM diunggah untuk mode "baru"
  const unuploadedDocs = useMemo(() => {
    return DOKUMEN_OPTIONS.filter((opt) => !pendaftaran?.[opt.key]);
  }, [pendaftaran]);

  const isAllComplete = !isGantiMode && unuploadedDocs.length === 0;

  // Inisialisasi jenis dokumen yang dipilih
  const [selectedJenis, setSelectedJenis] = useState(() => {
    if (isGantiMode && initialJenis) {
      return initialJenis;
    }
    if (!isGantiMode) {
      if (unuploadedDocs.length > 0) {
        const found = unuploadedDocs.find((o) => o.key === initialJenis);
        return found ? found.key : unuploadedDocs[0].key;
      }
      return initialJenis || "file_cv";
    }
    return initialJenis || "file_cv";
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Keyboard shortcut Escape untuk menutup modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentOption =
    DOKUMEN_OPTIONS.find((o) => o.key === selectedJenis) || DOKUMEN_OPTIONS[0];
  const CurrentIcon = isAllComplete ? CheckCircle2 : currentOption.icon || FileText;

  // File lama yang aktif di sistem
  const existingOldFilePath = pendaftaran?.[currentOption.key] || null;
  const hasOldFile = Boolean(existingOldFilePath);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = currentOption.maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      toastError(`Ukuran berkas melebihi batas maksimal ${currentOption.maxMb} MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const maxBytes = currentOption.maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      toastError(`Ukuran berkas melebihi batas maksimal ${currentOption.maxMb} MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toastError("Silakan pilih berkas dokumen terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("jenis_dokumen", selectedJenis);
      formData.append("file", selectedFile);

      await uploadDokumenPeserta(formData);
      toastSuccess(
        isGantiMode
          ? `${currentOption.label} berhasil diperbarui!`
          : `${currentOption.label} berhasil diunggah!`
      );
      setSelectedFile(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengunggah dokumen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      style={{ margin: 0 }}
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col w-full max-w-[340px] xs:max-w-sm sm:max-w-xl md:max-w-2xl max-h-[90vh] rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] my-auto ${
          darkMode
            ? "bg-[#161b22] border border-white/10 text-slate-100"
            : "bg-white border border-slate-200/90 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER: Mengikuti Format & Estetika ReviewModal Kelola Pendaftaran Admin ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 sm:px-7 py-2.5 sm:py-5.5 shrink-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 sm:-right-10 sm:-top-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-[#00A5EC]/20 blur-2xl sm:blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-12 sm:-bottom-16 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-xl sm:blur-2xl pointer-events-none" />

          {/* Tombol Tutup (X) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-2 top-2 sm:right-5 sm:top-5 z-30 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>

          {/* Watermark Ikon Besar */}
          <UploadCloud
            className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-28 sm:h-28 opacity-[0.10] text-white pointer-events-none transform rotate-6"
            strokeWidth={1}
          />

          {/* Identitas Header */}
          <div className="relative flex items-center gap-2 sm:gap-4 z-10 pr-8 sm:pr-14">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[#00A5EC]/30 blur-md sm:blur-xl animate-pulse" />
              <span className={`relative flex h-8 w-8 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-2xl ${
                isAllComplete
                  ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                  : "bg-white/10 border border-white/20 text-white"
              } shadow-sm sm:shadow-lg backdrop-blur-md`}>
                <CurrentIcon className="w-4 h-4 sm:w-7 sm:h-7" />
              </span>
            </div>
            <div className="min-w-0 text-left">
              <h3 className="text-xs sm:text-lg font-black text-white truncate leading-tight">
                {isGantiMode
                  ? `Ganti Berkas: ${currentOption.label}`
                  : isAllComplete
                  ? "Status Berkas Persyaratan"
                  : "Unggah Berkas Persyaratan"}
              </h3>
              <p className="text-[8.5px] sm:text-xs font-medium text-white/70 truncate mt-0.5 leading-tight">
                {isGantiMode ? (
                  <>
                    <span className="sm:hidden">Unggah dokumen pengganti</span>
                    <span className="hidden sm:inline">Perbarui dan unggah dokumen pengganti untuk verifikasi magang</span>
                  </>
                ) : isAllComplete ? (
                  <>
                    <span className="sm:hidden">Semua 6 berkas sudah lengkap</span>
                    <span className="hidden sm:inline">Seluruh 6 dokumen persyaratan magang Anda sudah ada di sistem</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Lengkapi berkas pendaftaran</span>
                    <span className="hidden sm:inline">Lengkapi berkas pendaftaran yang belum diunggah</span>
                  </>
                )}
              </p>
              <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full border backdrop-blur-md px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[10.5px] font-bold ${
                  isAllComplete
                    ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                    : "bg-white/10 border-white/15 text-white"
                }`}>
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300" />
                  <span>
                    {isGantiMode
                      ? "Mode Pembaruan Berkas"
                      : isAllComplete
                      ? "Semua 6 Dokumen Terunggah"
                      : `${unuploadedDocs.length} Dokumen Tersedia`}
                  </span>
                </span>
                {!isAllComplete && (
                  currentOption.isRequired ? (
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                      Wajib
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-semibold bg-slate-500/20 text-slate-200 border border-slate-400/30">
                      Opsional
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== KONDISI KHUSUS: Mode "baru" tetapi semua berkas sudah lengkap ===== */}
        {isAllComplete ? (
          <div className="p-4 sm:p-10 flex flex-col items-center justify-center text-center animate-[fadeIn_0.25s_ease-out]">
            <div className="relative h-10 w-10 sm:h-20 sm:w-20 mb-2.5 sm:mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md sm:blur-xl animate-pulse" />
              <span className="flex h-9 w-9 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs sm:shadow-sm">
                <CheckCircle2 className="w-5 h-5 sm:w-10 sm:h-10" />
              </span>
            </div>

            <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              Seluruh Berkas Telah Lengkap Terunggah!
            </h4>
            <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] sm:max-w-md leading-relaxed">
              Seluruh 6 dokumen persyaratan magang Anda sudah ada di sistem dan tidak ada berkas yang ganda. Jika Anda ingin mengganti atau memperbarui berkas yang sudah ada, silakan gunakan tombol <strong>"Ganti Berkas"</strong> pada masing-masing kartu dokumen di halaman profil Anda.
            </p>

            <div className="mt-3.5 sm:mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold text-white bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* ===== FORMULIR UPLOAD / GANTI BERKAS ===== */
          <form
            onSubmit={handleSubmit}
            className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-5 overflow-y-auto"
          >
            {/* Workflow Info Banner (Persis ReviewModal) */}
            <div
              className={`flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-2xl border p-2 sm:p-3.5 ${
                darkMode
                  ? "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-slate-200"
                  : "bg-blue-50/80 border-blue-100 text-blue-900"
              }`}
            >
              <Info className="shrink-0 text-blue-500 dark:text-sky-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-xs leading-normal sm:leading-relaxed">
                  {isGantiMode ? (
                    <span>
                      Pastikan berkas dokumen pengganti valid dengan format <strong>{currentOption.acceptDesc}</strong> (maksimal <strong>{currentOption.maxMb} MB</strong>). Dokumen baru akan langsung menggantikan berkas lama.
                    </span>
                  ) : (
                    <span>
                      Pilih dokumen persyaratan yang belum diunggah di bawah ini, pastikan data terbaca jelas, lalu unggah berkas resmi Anda sesuai batas ukuran yang ditentukan.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Mode Ganti Berkas: Card Dokumen Terkunci & Detail File Lama (Tanpa Dropdown) */}
            {isGantiMode ? (
              <div
                className={`rounded-lg sm:rounded-2xl border p-2.5 sm:p-4 space-y-1.5 sm:space-y-3 ${
                  darkMode
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <FileBadge2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Dokumen yang Sedang Diganti</span>
                  </span>
                  <span className="text-[7.5px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/30">
                    Aktif di Sistem
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <span
                      className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${currentOption.iconBg}`}
                    >
                      <CurrentIcon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {currentOption.label}
                      </p>
                      <p className="text-[8.5px] sm:text-[11px] text-slate-400 truncate">
                        Format: {currentOption.acceptDesc} &bull; Batas: {currentOption.maxMb} MB
                      </p>
                    </div>
                  </div>

                  {hasOldFile && onPreviewOldFile && (
                    <button
                      type="button"
                      onClick={() =>
                        onPreviewOldFile({
                          url: getFileUrl(existingOldFilePath),
                          label: `${currentOption.label} (File Lama)`,
                          Icon: currentOption.icon,
                          key: currentOption.key,
                          isImage:
                            currentOption.key === "file_pas_foto" ||
                            /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(
                              existingOldFilePath || ""
                            ),
                        })
                      }
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-sky-950/50 border border-blue-200 dark:border-sky-800/50 hover:bg-blue-100 dark:hover:bg-sky-900/60 transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Lihat File Lama</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Mode Unggah Berkas Baru: Dropdown HANYA untuk dokumen yang BELUM diunggah */
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Pilih Dokumen yang Belum Diunggah <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedJenis}
                  onChange={(e) => {
                    setSelectedJenis(e.target.value);
                    setSelectedFile(null);
                  }}
                  disabled={loading}
                  className={`w-full px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10.5px] sm:text-sm font-bold border transition-all outline-none cursor-pointer ${
                    darkMode
                      ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#004F9F] focus:bg-white"
                  }`}
                >
                  {unuploadedDocs.map((opt) => (
                    <option
                      key={opt.key}
                      value={opt.key}
                      className={
                        darkMode
                          ? "bg-[#161b22] text-slate-100"
                          : "bg-white text-slate-800"
                      }
                    >
                      {opt.label} ({opt.isRequired ? "Wajib" : "Opsional"})
                    </option>
                  ))}
                </select>
                <p className="text-[8.5px] sm:text-xs text-slate-400">
                  {currentOption.desc}
                </p>
              </div>
            )}

            {/* Dropzone Area Drag & Drop */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isGantiMode ? "Pilih Berkas Pengganti Baru" : "Pilih Berkas Dokumen"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-3 sm:p-7 border-2 border-dashed rounded-lg sm:rounded-2xl cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-[#00A5EC] bg-[#00A5EC]/10 scale-[1.01]"
                    : darkMode
                    ? "border-white/15 bg-white/[0.02] hover:border-[#00A5EC]/60 hover:bg-white/[0.04]"
                    : "border-slate-300 bg-slate-50/70 hover:border-[#004F9F]/60 hover:bg-slate-100/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={currentOption.accept}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2 w-full">
                    <span className="flex h-9 w-9 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs sm:shadow-sm">
                      <CheckCircle2 className="w-4.5 h-4.5 sm:w-7 sm:h-7" />
                    </span>
                    <div className="min-w-0 max-w-full px-2">
                      <p className="text-[10.5px] sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[8.5px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Berkas siap diunggah
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-[8.5px] sm:text-xs font-bold text-rose-500 hover:text-rose-600 underline pt-0.5 cursor-pointer"
                    >
                      Ganti / Pilih Berkas Lain
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                    <span
                      className={`flex h-8 w-8 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-2xl transition-transform duration-200 hover:scale-110 shadow-xs ${
                        darkMode
                          ? "bg-[#00A5EC]/10 text-[#00A5EC] border border-[#00A5EC]/20"
                          : "bg-[#004F9F]/10 text-[#004F9F] border border-[#004F9F]/20"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 sm:w-7 sm:h-7" />
                    </span>
                    <div>
                      <p className="text-[10px] sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk memilih berkas atau seret ke sini
                      </p>
                      <p className="text-[8px] sm:text-xs text-slate-400 mt-0.5">
                        Format didukung: <strong>{currentOption.acceptDesc}</strong> &bull; Maksimal {currentOption.maxMb} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== FOOTER ACTIONS ===== */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                disabled={loading}
                className="px-3 py-1 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10px] sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="inline-flex items-center gap-1 sm:gap-2 px-3.5 py-1 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10px] sm:text-sm font-bold text-white bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] shadow-xs sm:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span>
                  {loading
                    ? "Mengunggah..."
                    : isGantiMode
                    ? "Simpan & Ganti"
                    : "Unggah Berkas"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadDokumenModal;
