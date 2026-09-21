import { useEffect, useRef, useState, useMemo } from "react";
import {
  X,
  FileText,
  HeartPulse,
  HeartPlus,
  Send,
  Loader2,
  UploadCloud,
  Paperclip,
  Info,
  CalendarRange,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { buatPengajuanIzin } from "../../../../services/pesertaService";
import { formatTanggalHari } from "../../../../constants/presensiStatus";
import { toastError, toastSuccess } from "../../../../utils/swal";

const JENIS_OPTIONS = [
  {
    value: "izin",
    label: "Izin Resmi",
    icon: FileText,
    badgeText: "Keperluan Pribadi / Kuliah",
    desc: "Urusan akademik, kegiatan kampus, urusan keluarga, atau keperluan mendesak.",
    requiredProof: false,
  },
  {
    value: "sakit",
    label: "Surat Sakit",
    icon: HeartPulse,
    badgeText: "Wajib Surat Dokter",
    desc: "Kondisi kesehatan terganggu disertai foto/scan surat keterangan dokter resmi.",
    requiredProof: true,
  },
];

const FormPengajuanIzinModal = ({ onClose, onSaved, isDark, dk }) => {
  const darkMode = isDark ?? dk ?? false;
  const inputRef = useRef(null);

  const [jenis, setJenis] = useState("izin");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  // Toggle selection: click active to deactivate
  const handleToggleJenis = (value) => {
    setJenis((prev) => (prev === value ? "" : value));
  };

  // Calculate working days & duration
  const durasiInfo = useMemo(() => {
    if (!mulai || !selesai) return { totalHari: 0, hariKerja: 0 };
    const start = new Date(mulai);
    const end = new Date(selesai);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { totalHari: 0, hariKerja: 0 };
    }

    let cur = new Date(start);
    let totalHari = 0;
    let hariKerja = 0;

    while (cur <= end) {
      totalHari++;
      const day = cur.getDay();
      // 0 = Minggu, 6 = Sabtu
      if (day !== 0 && day !== 6) {
        hariKerja++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { totalHari, hariKerja };
  }, [mulai, selesai]);

  // Form validity check: all required fields must be filled
  const isFormValid = useMemo(() => {
    if (!jenis) return false;
    if (!mulai || !selesai) return false;
    if (selesai < mulai) return false;
    if (alasan.trim().length < 10) return false;
    if (jenis === "sakit" && !file) return false;
    return true;
  }, [jenis, mulai, selesai, alasan, file]);

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) {
      toastError("Format berkas bukti harus berupa JPG, PNG, atau PDF.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toastError("Ukuran berkas bukti maksimal 10 MB.");
      return;
    }
    setFile(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    validateAndSetFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    validateAndSetFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!jenis) return toastError("Pilih jenis permohonan terlebih dahulu.");
      if (!mulai || !selesai) return toastError("Tanggal mulai dan selesai wajib ditentukan.");
      if (selesai < mulai) return toastError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      if (alasan.trim().length < 10) return toastError("Alasan pengajuan izin minimal 10 karakter.");
      if (jenis === "sakit" && !file) return toastError("Pengajuan izin sakit wajib melampirkan surat dokter.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("jenis", jenis);
      form.append("tanggal_mulai", mulai);
      form.append("tanggal_selesai", selesai);
      form.append("alasan", alasan.trim());
      if (file) form.append("file_bukti", file);

      await buatPengajuanIzin(form);
      toastSuccess("Pengajuan izin berhasil dikirim dan menunggu peninjauan mentor.");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirimkan pengajuan izin.");
    } finally {
      setSaving(false);
    }
  };

  const currentOption = JENIS_OPTIONS.find((j) => j.value === jenis);
  const CurrentIcon = currentOption ? currentOption.icon : HeartPlus;

  // File type classification for preview icon
  const isPdf = file?.type === "application/pdf" || (file?.name && /\.pdf$/i.test(file.name));
  const isImage = file?.type?.startsWith("image/") || (file?.name && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name));

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      style={{ margin: 0 }}
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-col w-full max-w-xl sm:max-w-2xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] my-auto ${
          darkMode
            ? "bg-[#161b22] border border-white/10 text-slate-100"
            : "bg-white border-0 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal (Warna & Nuansa Samakan dengan Modal Filter) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0 text-white">
          {/* Ambient Glow */}
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />

          {/* Watermark Icon */}
          <HeartPlus
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 opacity-[0.07] sm:opacity-[0.09] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3.5 pr-8">
              <span className="flex h-7.5 w-7.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white shadow-xs">
                <CurrentIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  {jenis === "sakit"
                    ? "Ajukan Permohonan Sakit"
                    : jenis === "izin"
                    ? "Ajukan Permohonan Izin"
                    : "Ajukan Permohonan Izin / Sakit"}
                </h3>
                <p className="text-[8.5px] sm:text-[11px] text-white/60 mt-0.5 truncate">
                  Pengajuan akan diverifikasi oleh mentor pembimbing
                </p>
                <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-white backdrop-blur-md">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300" />
                    <span>Presensi Magang</span>
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] sm:text-[9.5px] font-bold border backdrop-blur-md ${
                      jenis === "sakit"
                        ? "bg-rose-500/20 text-rose-200 border-rose-400/30"
                        : jenis === "izin"
                        ? "bg-blue-400/20 text-sky-200 border-sky-400/30"
                        : "bg-white/10 text-white/70 border-white/15"
                    }`}
                  >
                    {jenis === "sakit"
                      ? "Lampiran Wajib"
                      : jenis === "izin"
                      ? "Lampiran Opsional"
                      : "Pilih Kategori"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Tutup (X) */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white hover:rotate-90 cursor-pointer disabled:opacity-40"
              title="Tutup Modal"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Body Modal Scrollable */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* 1. Jenis Permohonan */}
          <div>
            <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Jenis Permohonan</span> <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {JENIS_OPTIONS.map((j) => {
                const aktif = jenis === j.value;
                const Icon = j.icon;
                return (
                  <button
                    key={j.value}
                    type="button"
                    onClick={() => handleToggleJenis(j.value)}
                    className={`group relative flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      aktif
                        ? darkMode
                          ? "border-[#00A5EC]/60 bg-[#00A5EC]/10 shadow-xs ring-1 ring-[#00A5EC]/20"
                          : "border-[#004F9F]/60 bg-blue-50/50 shadow-xs ring-1 ring-[#004F9F]/20"
                        : darkMode
                        ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
                    }`}
                  >
                    {/* Icon box (Stabil tanpa layout jump) */}
                    <span
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 ${
                        aktif
                          ? darkMode
                            ? "bg-gradient-to-br from-[#00A5EC] to-[#004F9F] text-white shadow-2xs"
                            : "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-2xs"
                          : darkMode
                          ? "bg-white/5 text-slate-400 border border-white/10 group-hover:border-white/20 group-hover:text-slate-200"
                          : "bg-white text-slate-500 border border-slate-200 group-hover:border-[#004F9F]/40 group-hover:text-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </span>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs sm:text-[13px] font-black ${
                            aktif
                              ? darkMode
                                ? "text-sky-300"
                                : "text-[#0B1442]"
                              : darkMode
                              ? "text-slate-200"
                              : "text-slate-700"
                          }`}
                        >
                          {j.label}
                        </h4>
                        {/* Radio Check Indicator */}
                        <span
                          className={`flex h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                            aktif
                              ? darkMode
                                ? "border-[#00A5EC] bg-[#00A5EC] scale-105"
                                : "border-[#004F9F] bg-[#004F9F] scale-105"
                              : darkMode
                              ? "border-white/20 bg-white/5 group-hover:border-white/30"
                              : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
                          }`}
                        >
                          <Check
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 text-white transition-transform duration-200 ${
                              aktif ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            }`}
                            strokeWidth={3}
                          />
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                        {j.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Rentang Tanggal (Mulai - Selesai) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Rentang Tanggal Permohonan</span>
              </label>
              {mulai && selesai && selesai >= mulai && (
                <span className="text-[9px] sm:text-[10.5px] font-bold text-[#004F9F] dark:text-[#00A5EC] bg-blue-50 dark:bg-sky-950/60 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-sky-800/40">
                  {durasiInfo.totalHari} Hari Kalender
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={mulai}
                    onChange={(e) => setMulai(e.target.value)}
                    className={`w-full rounded-lg sm:rounded-xl border pl-9 pr-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold outline-none transition-all duration-200 ${
                      darkMode
                        ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/60 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                    }`}
                  />
                </div>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Tanggal Selesai <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={selesai}
                    min={mulai || undefined}
                    onChange={(e) => setSelesai(e.target.value)}
                    className={`w-full rounded-lg sm:rounded-xl border pl-9 pr-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold outline-none transition-all duration-200 ${
                      darkMode
                        ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/60 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Banner Durasi Terhitung Otomatis */}
            {mulai && selesai && selesai >= mulai ? (
              <div
                className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                  darkMode
                    ? "bg-gradient-to-r from-sky-950/30 to-blue-950/20 border-sky-800/40"
                    : "bg-gradient-to-r from-blue-50/80 to-sky-50/50 border-blue-200/80"
                }`}
              >
                <span className="flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-sky-900/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200 dark:border-sky-700/50 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h5 className={`text-[11px] sm:text-xs font-black ${darkMode ? "text-slate-100" : "text-[#0B1442]"}`}>
                    Durasi Terhitung Otomatis
                  </h5>
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#004F9F] dark:text-[#00A5EC] mt-0.5 leading-snug">
                    {durasiInfo.hariKerja} Hari Kerja Efektif{" "}
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      ({mulai === selesai ? formatTanggalHari(mulai) : `${formatTanggalHari(mulai)} – ${formatTanggalHari(selesai)}`})
                    </span>
                  </p>
                </div>
              </div>
            ) : mulai && selesai && selesai < mulai ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-[10.5px] sm:text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tanggal selesai tidak boleh lebih awal dari tanggal mulai.</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-dashed text-slate-400 ${
                  darkMode ? "bg-white/[0.01] border-white/10" : "bg-slate-50/50 border-slate-200"
                }`}
              >
                <Clock className="w-4 h-4 opacity-60 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-medium">
                  Tentukan tanggal mulai dan selesai untuk menghitung durasi kerja efektif secara otomatis.
                </span>
              </div>
            )}
          </div>

          {/* 3. Alasan / Keterangan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Alasan / Keterangan Pengajuan</span> <span className="text-rose-500">*</span>
              </label>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold">
                {alasan.trim().length === 0 ? (
                  <span className="text-slate-400">0 karakter (min. 10)</span>
                ) : alasan.trim().length < 10 ? (
                  <span className="text-amber-500 dark:text-amber-400 font-bold">
                    {alasan.trim().length} / min. 10 karakter (kurang {10 - alasan.trim().length})
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" strokeWidth={3} /> {alasan.trim().length} karakter
                  </span>
                )}
              </span>
            </div>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Jelaskan alasan pengajuan izin atau kondisi sakit secara jelas dan lengkap (minimal 10 karakter)..."
              className={`w-full rounded-lg sm:rounded-xl border p-2.5 sm:p-3 text-[11px] sm:text-xs font-medium outline-none transition-all duration-200 resize-none leading-relaxed ${
                darkMode
                  ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
                  : "border-slate-200 bg-slate-50/60 text-slate-700 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
              }`}
            />
          </div>

          {/* 4. Berkas Bukti Pendukung (Drag & Drop) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Dokumen Bukti Lampiran</span>
              </label>
              {jenis === "sakit" ? (
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  Wajib Surat Dokter
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                  Opsional
                </span>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-3 sm:p-5 border-2 border-dashed rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 ${
                isDragging
                  ? darkMode
                    ? "border-[#00A5EC] bg-[#00A5EC]/15 scale-[1.01]"
                    : "border-[#004F9F] bg-blue-50/70 scale-[1.01]"
                  : darkMode
                  ? "border-white/15 bg-white/[0.02] hover:border-[#00A5EC]/60 hover:bg-white/[0.04]"
                  : "border-slate-300 bg-slate-50/70 hover:border-[#004F9F]/60 hover:bg-slate-100/70"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={saving}
              />

              {file ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full bg-white dark:bg-white/5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Dynamic File Icon Tile (PDF vs Foto/Image) */}
                    <span
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${
                        isPdf
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                          : isImage
                          ? "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40"
                      }`}
                    >
                      {isPdf ? (
                        <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                      ) : isImage ? (
                        <ImageIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                      ) : (
                        <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] sm:text-[13px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {file.name}
                        </p>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider shrink-0 ${
                            isPdf
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                              : isImage
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {isPdf ? "PDF" : isImage ? "Foto" : "Dokumen"}
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB &bull;{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Berkas valid &amp; siap dikirim
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Ganti & Hapus */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className="group inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs font-bold text-[#004F9F] dark:text-[#00A5EC] hover:bg-blue-50 dark:hover:bg-sky-950/60 border border-blue-200/70 dark:border-sky-800/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs"
                      title="Ganti dengan berkas lain"
                    >
                      <RefreshCw className="w-3 h-3 transition-transform duration-500 ease-in-out group-hover:rotate-180" />
                      <span>Ganti</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="group inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200/70 dark:border-rose-900/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs"
                      title="Hapus berkas terpilih"
                    >
                      <Trash2 className="w-3 h-3 transition-transform duration-200 ease-out group-hover:scale-115 group-hover:-rotate-12" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-1 sm:space-y-1.5">
                  <span
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-transform duration-200 hover:scale-110 shadow-xs ${
                      darkMode
                        ? "bg-[#00A5EC]/15 text-[#00A5EC] border border-[#00A5EC]/30"
                        : "bg-[#004F9F]/10 text-[#004F9F] border border-[#004F9F]/20"
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-200">
                      Klik untuk memilih berkas atau seret ke sini
                    </p>
                    <p className="text-[9px] sm:text-[10.5px] text-slate-400 mt-0.5">
                      Format didukung: <span className="font-semibold text-slate-600 dark:text-slate-300">JPG, PNG, PDF</span> &bull; Maksimal <span className="font-semibold text-slate-600 dark:text-slate-300">10 MB</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Info Banner di Bawah Sendiri */}
          <div
            className={`flex items-start gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 ${
              darkMode
                ? "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-slate-200"
                : "bg-gradient-to-r from-blue-50/90 to-sky-50/60 border-blue-100 text-blue-900"
            }`}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[10px] sm:text-[11.5px] leading-relaxed">
              Setelah disetujui mentor, presensi Anda pada hari kerja dalam rentang tanggal tersebut otomatis tercatat sebagai{" "}
              <strong className="font-extrabold">{jenis === "sakit" ? "Sakit" : jenis === "izin" ? "Izin" : "Izin/Sakit"}</strong> pada kalender presensi harian. Hari libur akhir pekan akan otomatis dilewati.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-end gap-2 sm:gap-2.5 border-t p-2.5 sm:px-6 sm:py-4 shrink-0 ${
            darkMode ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={`rounded-lg sm:rounded-xl border px-3.5 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50 ${
              darkMode
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isFormValid || saving}
            className={`group inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-4 py-1.5 sm:px-6 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 ${
              isFormValid && !saving
                ? "bg-gradient-to-r from-[#0B1442] to-[#004F9F] hover:from-[#081035] hover:to-[#003d7c] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70 shadow-none"
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${
                  isFormValid ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : ""
                }`}
              />
            )}
            <span>{saving ? "Mengirim Permohonan..." : "Kirim Pengajuan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormPengajuanIzinModal;