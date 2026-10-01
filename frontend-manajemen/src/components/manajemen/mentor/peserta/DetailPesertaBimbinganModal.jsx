import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  School,
  ClipboardList,
  Briefcase,
  ListTodo,
  CalendarCheck,
  Cake,
  Clock,
  AlertTriangle,
  ChartNoAxesCombined,
  Info,
  FolderPlus,
  FileCheck2,
  FileQuestion,
  Target,
  Star,
  MessageSquareQuote,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInitials = (nama) =>
  (nama || "?")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

const InfoRow = ({ icon: Icon, label, value, isDark, isMultiline }) => (
  <div
    className={`group flex ${
      isMultiline ? "items-start" : "items-center"
    } gap-2.5 rounded-xl border px-3 py-1.5 sm:py-2 min-h-[44px] sm:min-h-[46px] shadow-2xs transition-all duration-200 ${
      isDark
        ? "border-white/10 bg-white/5 hover:border-white/20"
        : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-[#004F9F]/30 hover:shadow-xs"
    }`}
  >
    <span
      className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${
        isDark
          ? "bg-white/10 text-sky-300"
          : "bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F]"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
        {label}
      </p>
      <p
        className={`text-[10.5px] sm:text-xs font-semibold mt-0.5 leading-tight ${
          isMultiline ? "break-words" : "truncate"
        } ${isDark ? "text-slate-200" : "text-slate-700"}`}
        title={value || "-"}
      >
        {value || "-"}
      </p>
    </div>
  </div>
);

const SectionCard = ({ icon: Icon, title, children, isDark }) => (
  <div
    className={`rounded-2xl border shadow-2xs p-3.5 sm:p-4 transition-all duration-300 ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white hover:shadow-xs"
    }`}
  >
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <h4 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
        {title}
      </h4>
    </div>
    {children}
  </div>
);

const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return { totalDays: 0, daysPassed: 0, progressPercent: 0, statusText: "-" };
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const diffTimeTotal = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(diffTimeTotal / (1000 * 60 * 60 * 24)));

    let daysPassed = 0;
    if (now > start) {
      const diffTimePassed = now.getTime() - start.getTime();
      daysPassed = Math.min(totalDays, Math.round(diffTimePassed / (1000 * 60 * 60 * 24)));
    }

    const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

    let statusText = "Sedang Berjalan";
    if (now < start) statusText = "Belum Dimulai";
    else if (now > end || progressPercent >= 100) statusText = "Masa Magang Selesai";

    return { totalDays, daysPassed, progressPercent, statusText };
  } catch {
    return { totalDays: 0, daysPassed: 0, progressPercent: 0, statusText: "-" };
  }
};

export const DetailPesertaBimbinganModal = ({ isOpen, onClose, peserta, dk }) => {
  const [activeTab, setActiveTab] = useState("biodata");
  const navigate = useNavigate();

  // Escape key listener untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !peserta) return null;

  const isMahasiswa = peserta.kategori_pendaftar === "mahasiswa";
  const fotoUrl = peserta.foto_profil ? getFileUrl(peserta.foto_profil) : null;
  const duration = calculateDurationDays(peserta.tanggal_mulai, peserta.tanggal_selesai);

  // Format Tempat & Tanggal Lahir
  const tempatTglLahir = [
    peserta.tempat_lahir,
    peserta.tanggal_lahir ? fmtDate(peserta.tanggal_lahir) : null,
  ]
    .filter(Boolean)
    .join(", ");

  // Statistik Kehadiran
  const hadirCount = peserta.presensi_stats?.total_hadir || 0;
  const terlambatCount = peserta.presensi_stats?.total_terlambat || 0;
  const izinCount = peserta.presensi_stats?.total_izin || 0;
  const sakitCount = peserta.presensi_stats?.total_sakit || 0;
  const alfaCount = peserta.presensi_stats?.total_alfa || 0;
  const totalRecordedDays = peserta.presensi_stats?.total_hari || 0;
  const totalMasuk = hadirCount + terlambatCount;
  const attendancePercent = Math.round(peserta.persentase_kehadiran || 0);

  const handleGoToPenilaian = () => {
    onClose();
    navigate("/mentor/penilaian", {
      state: {
        pesertaId: peserta.akun_peserta_id || peserta.id,
        nama: peserta.nama_lengkap,
      },
    });
  };

  const handleGoToPresensi = () => {
    onClose();
    navigate("/mentor/presensi");
  };

  const handleGoToTugas = () => {
    onClose();
    navigate("/mentor/tugas");
  };

  const handleGoToReviewTugas = () => {
    onClose();
    navigate("/mentor/tugas/review");
  };

  const handleGoToLaporanAkhir = () => {
    onClose();
    navigate("/mentor/laporan-akhir");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-3xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] border ${
          dk ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL (IDENTIK DENGAN ROLE ADMIN) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 sm:px-6 py-3.5 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <User
            className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 w-17 h-17 sm:w-24 sm:h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  Peserta Bimbingan
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
                  Detail Peserta Bimbingan
                </h3>
                <p className="text-[9px] sm:text-[11px] text-white/60 mt-0.5">
                  Data administratif, kontak, presensi, dan penilaian magang
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ── BODY MODAL SCROLLABLE ── */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4">
          {/* 1. Hero Avatar Banner Card (Dengan Badge Magang Aktif di Pojok Kanan) */}
          <div
            className={`relative overflow-hidden flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 shadow-2xs ${
              dk
                ? "border-white/10 bg-white/5"
                : "border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/30"
            }`}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />

            {/* Badge Status Magang di Pojok Kanan Atas */}
            <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold ${
                  peserta.status_magang === "selesai"
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    peserta.status_magang === "selesai" ? "bg-purple-500" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                {peserta.status_magang === "selesai" ? "Selesai Magang" : "Magang Aktif"}
              </span>
            </div>

            {/* Avatar Profile */}
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={peserta.nama_lengkap}
                className="relative h-11 w-11 sm:h-13 sm:w-13 rounded-full object-cover border-[2px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-300 dark:ring-white/20 shrink-0"
              />
            ) : (
              <span className="relative flex h-11 w-11 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-xs sm:text-base font-black border-[2px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-300 dark:ring-white/20">
                {getInitials(peserta.nama_lengkap)}
              </span>
            )}

            {/* Identitas Nama & Badge Jenjang + Bidang (Sejajar) */}
            <div className="relative min-w-0 flex-1 pr-24 sm:pr-28">
              <p className={`text-xs sm:text-sm font-black truncate ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                {peserta.nama_lengkap}
              </p>

              {/* Badge Mahasiswa & Badge Bidang Sejajar di Bawah Nama */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                  {isMahasiswa ? (
                    <GraduationCap className="w-2.5 h-2.5 text-[#004F9F] dark:text-sky-400" />
                  ) : (
                    <School className="w-2.5 h-2.5 text-[#004F9F] dark:text-sky-400" />
                  )}
                  {isMahasiswa ? "Mahasiswa" : "Siswa SMK"}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] sm:text-[8.5px] font-bold shadow-2xs ${
                    dk
                      ? "border-[#00A5EC]/30 bg-[#00A5EC]/10 text-sky-300"
                      : "border-[#004F9F]/20 bg-blue-50 text-[#004F9F]"
                  }`}
                >
                  <Briefcase className="w-2.5 h-2.5 shrink-0" />
                  <span>{peserta.posisi_bidang || "Bidang Magang"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Navigasi Tab Bar (Full Width Grid - Memenuhi Kolom) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("biodata")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-full text-center truncate ${
                activeTab === "biodata"
                  ? "bg-white dark:bg-[#161b22] text-[#004F9F] dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Biodata &amp; Institusi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presensi")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-full text-center truncate ${
                activeTab === "presensi"
                  ? "bg-white dark:bg-[#161b22] text-[#004F9F] dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Presensi Kehadiran</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("penugasan")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-full text-center truncate ${
                activeTab === "penugasan"
                  ? "bg-white dark:bg-[#161b22] text-[#004F9F] dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Penugasan &amp; Laporan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("nilai")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-full text-center truncate ${
                activeTab === "nilai"
                  ? "bg-white dark:bg-[#161b22] text-[#004F9F] dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Evaluasi Nilai</span>
            </button>
          </div>

          {/* ══════════════ TAB 1: BIODATA & INSTITUSI ══════════════ */}
          {activeTab === "biodata" && (
            <div className="space-y-3 sm:space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
              <SectionCard icon={User} title="Kontak & Data Diri" isDark={dk}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoRow icon={Mail} label="Alamat Email" value={peserta.email} isDark={dk} />
                  <InfoRow icon={Phone} label="Nomor Telepon / WA" value={peserta.nomor_hp} isDark={dk} />
                  <InfoRow icon={User} label="Jenis Kelamin" value={peserta.jenis_kelamin} isDark={dk} />
                  <InfoRow
                    icon={Cake}
                    label="Tempat, Tanggal Lahir"
                    value={tempatTglLahir || "-"}
                    isDark={dk}
                  />
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={MapPin}
                      label="Alamat Domisili Lengkap"
                      value={peserta.alamat_lengkap}
                      isDark={dk}
                      isMultiline
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={GraduationCap} title="Institusi & Penugasan Magang" isDark={dk}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoRow
                    icon={Building2}
                    label={isMahasiswa ? "Asal Kampus" : "Asal Sekolah"}
                    value={peserta.institusi}
                    isDark={dk}
                  />
                  <InfoRow
                    icon={GraduationCap}
                    label={isMahasiswa ? "Program Studi" : "Jurusan"}
                    value={peserta.jurusan}
                    isDark={dk}
                  />
                  <InfoRow
                    icon={FileText}
                    label={isMahasiswa ? "NIM / NPM" : "NISN"}
                    value={peserta.nim_nisn}
                    isDark={dk}
                  />
                  <InfoRow
                    icon={FileText}
                    label={isMahasiswa ? "Semester" : "Kelas"}
                    value={peserta.kelas_semester}
                    isDark={dk}
                  />
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={Briefcase}
                      label="Bidang Penugasan Magang"
                      value={`${peserta.posisi_bidang || "-"} (Dinas Kominfo Kab. Ponorogo)`}
                      isDark={dk}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={Calendar}
                      label="Periode Pelaksanaan Magang"
                      value={`${fmtDate(peserta.tanggal_mulai)} — ${fmtDate(peserta.tanggal_selesai)} (${duration.progressPercent}% berjalan)`}
                      isDark={dk}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ══════════════ TAB 2: PRESENSI KEHADIRAN ══════════════ */}
          {activeTab === "presensi" && (
            <div className="space-y-3 sm:space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
              {/* 1. Four Rich Category Stats Cards (DI ATAS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {/* 1. Hadir Tepat */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 group hover:shadow-xs relative overflow-hidden ${
                    dk
                      ? "border-emerald-500/20 bg-gradient-to-b from-emerald-950/25 to-[#161b22] hover:border-emerald-500/40"
                      : "border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-white hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Tepat Waktu
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {hadirCount}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Hari Sesuai Jam
                  </p>
                </div>

                {/* 2. Terlambat */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 group hover:shadow-xs relative overflow-hidden ${
                    dk
                      ? "border-amber-500/20 bg-gradient-to-b from-amber-950/25 to-[#161b22] hover:border-amber-500/40"
                      : "border-amber-200/80 bg-gradient-to-b from-amber-50/80 to-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Terlambat
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {terlambatCount}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Hari Lewat Jam
                  </p>
                </div>

                {/* 3. Izin / Sakit */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 group hover:shadow-xs relative overflow-hidden ${
                    dk
                      ? "border-sky-500/20 bg-gradient-to-b from-sky-950/25 to-[#161b22] hover:border-sky-500/40"
                      : "border-sky-200/80 bg-gradient-to-b from-sky-50/80 to-white hover:border-sky-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-sky-500/15 text-[#004F9F] dark:text-sky-400">
                      <FileText className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-[#004F9F] dark:text-sky-400 uppercase tracking-wider">
                      Izin / Sakit
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {izinCount + sakitCount}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {izinCount} Izin, {sakitCount} Sakit
                  </p>
                </div>

                {/* 4. Tanpa Keterangan (Alfa) */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 group hover:shadow-xs relative overflow-hidden ${
                    dk
                      ? "border-rose-500/20 bg-gradient-to-b from-rose-950/25 to-[#161b22] hover:border-rose-500/40"
                      : "border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-white hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Tanpa Ket.
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {alfaCount}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Hari Alfa / Tidak Absen
                  </p>
                </div>
              </div>

              {/* 2. Card: Aktivitas & Presensi Kehadiran (DI BAWAH 4 STATS) */}
              <div
                className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all ${
                  dk ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-black ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Aktivitas &amp; Presensi Kehadiran
                      </h4>
                      <p className="text-[9.5px] sm:text-[10.5px] text-slate-400">
                        Rekapitulasi log absensi harian dan kedisiplinan magang
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[9.5px] font-bold ${
                      attendancePercent >= 85
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : attendancePercent >= 70
                        ? "bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        attendancePercent >= 85
                          ? "bg-emerald-500"
                          : attendancePercent >= 70
                          ? "bg-blue-500"
                          : "bg-rose-500 animate-pulse"
                      }`}
                    />
                    {attendancePercent >= 85
                      ? "Disiplin Sangat Baik"
                      : attendancePercent >= 70
                      ? "Kehadiran Cukup"
                      : "Perlu Evaluasi"}
                  </span>
                </div>

                {/* Grid 2 Columns: Overall Rate Gauge & Timeline Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Left: Overall Attendance Score Box with ChartNoAxesCombined */}
                  <div
                    className={`sm:col-span-4 p-3 rounded-xl border flex flex-col justify-between relative overflow-hidden ${
                      dk
                        ? "border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-[#161b22] to-emerald-950/10"
                        : "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30"
                    }`}
                  >
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Tingkat Kehadiran
                      </span>
                      <ChartNoAxesCombined className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="my-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                          {attendancePercent}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          / 100%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Total Masuk: <strong className="text-slate-700 dark:text-slate-200">{totalMasuk}</strong> dari{" "}
                        <strong className="text-slate-700 dark:text-slate-200">{totalRecordedDays}</strong> hari aktif
                      </p>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, attendancePercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Progress Masa Magang & Periode (Kominfo Solid Dark Blue Bar) */}
                  <div
                    className={`sm:col-span-8 p-3 rounded-xl border flex flex-col justify-between ${
                      dk ? "border-white/10 bg-white/[0.02]" : "border-slate-200/80 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          Progres Masa Magang
                        </span>
                      </div>
                      <span className="font-black text-[#004F9F] dark:text-sky-400 text-xs">
                        {duration.progressPercent}% ({duration.daysPassed}/{duration.totalDays} Hari)
                      </span>
                    </div>

                    {/* Kominfo Solid Blue Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden my-1">
                      <div
                        className="h-full bg-[#004F9F] dark:bg-[#0072CE] rounded-full transition-all duration-500"
                        style={{ width: `${duration.progressPercent}%` }}
                      />
                    </div>

                    {/* Date Chips */}
                    <div className="flex items-center justify-between pt-1 text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-400">Mulai:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{fmtDate(peserta.tanggal_mulai)}</span>
                      </div>
                      <span className="text-slate-300 dark:text-white/20">➔</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-400">Selesai:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{fmtDate(peserta.tanggal_selesai)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Status Insight & Quick Action Bar */}
              <div
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  dk ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      alfaCount > 5
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-blue-500/15 text-[#004F9F] dark:text-sky-400"
                    }`}
                  >
                    {alfaCount > 5 ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {alfaCount > 5
                        ? "Tingkat ketidakhadiran perlu diperhatikan"
                        : "Kedisiplinan presensi terpantau baik"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {alfaCount > 5
                        ? `Terdapat ${alfaCount} hari tanpa log absensi. Mentor dapat memberi evaluasi atau arahan.`
                        : `Peserta tercatat memiliki ${hadirCount} hari hadir tepat waktu dan ${terlambatCount} hari terlambat.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToPresensi}
                  className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs font-bold hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Buka Log Presensi Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 3: PENUGASAN & LAPORAN (REVAMPED MODERN & RICH UI) ══════════════ */}
          {activeTab === "penugasan" && (
            <div className="space-y-3 sm:space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
              {/* 1. Header Card Tab Penugasan */}
              <div
                className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all ${
                  dk ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
                      <ClipboardList className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-black ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Penugasan &amp; Laporan Akhir
                      </h4>
                      <p className="text-[9.5px] sm:text-[10.5px] text-slate-400">
                        Monitoring pengerjaan tugas proyek dan kelengkapan naskah laporan
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[9.5px] font-bold ${
                      peserta.file_laporan_akhir
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        peserta.file_laporan_akhir ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      }`}
                    />
                    {peserta.file_laporan_akhir ? "Laporan Siap" : "Menunggu Laporan"}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Card 1: Penugasan Kerja Terakhir */}
                  <div
                    className={`rounded-xl border p-3.5 transition-all ${
                      dk
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#004F9F]/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-sky-400">
                          <ListTodo className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Penugasan Kerja Terakhir
                        </span>
                      </div>

                      {peserta.tugas_terakhir && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold ${
                            peserta.tugas_terakhir.status_tugas === "dinilai"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : peserta.tugas_terakhir.status_tugas === "menunggu"
                              ? "bg-blue-500/15 text-blue-600 dark:text-sky-400 border border-blue-500/20"
                              : peserta.tugas_terakhir.status_tugas === "revisi"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              peserta.tugas_terakhir.status_tugas === "dinilai"
                                ? "bg-emerald-500"
                                : peserta.tugas_terakhir.status_tugas === "menunggu"
                                ? "bg-blue-500"
                                : peserta.tugas_terakhir.status_tugas === "revisi"
                                ? "bg-rose-500"
                                : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          {peserta.tugas_terakhir.status_tugas === "dinilai"
                            ? `Dinilai (Skor: ${peserta.tugas_terakhir.nilai_tugas ?? 100})`
                            : peserta.tugas_terakhir.status_tugas === "menunggu"
                            ? "Menunggu Review"
                            : peserta.tugas_terakhir.status_tugas === "revisi"
                            ? "Perlu Revisi"
                            : "Sedang Dikerjakan"}
                        </span>
                      )}
                    </div>

                    {peserta.tugas_terakhir ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {peserta.tugas_terakhir.judul_tugas}
                          </h5>
                          {peserta.tugas_terakhir.deskripsi_tugas && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {peserta.tugas_terakhir.deskripsi_tugas}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleGoToReviewTugas}
                          className="group inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-400 border border-blue-200/80 dark:border-blue-900/40 text-xs font-bold hover:bg-[#004F9F] hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          <span>Review Tugas</span>
                          <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-slate-100/70 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-500">
                            <FolderPlus className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Belum ada penugasan aktif
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Peserta belum diberikan tugas proyek baru
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoToTugas}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#161b22] text-[#004F9F] dark:text-sky-400 border border-slate-200 dark:border-white/10 text-xs font-bold shadow-2xs hover:border-[#004F9F]/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer shrink-0"
                        >
                          <FolderPlus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 group-hover:text-blue-600 dark:group-hover:text-sky-300" />
                          <span>Buat Tugas</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Naskah Laporan Akhir Magang */}
                  <div
                    className={`rounded-xl border p-3.5 transition-all ${
                      dk
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#004F9F]/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-sky-400">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Naskah Laporan Akhir Magang
                        </span>
                      </div>

                      {peserta.file_laporan_akhir ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <FileCheck2 className="w-3 h-3" />
                          Sudah Diunggah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <FileQuestion className="w-3 h-3" />
                          Belum Diunggah
                        </span>
                      )}
                    </div>

                    {peserta.file_laporan_akhir ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {peserta.judul_laporan_akhir || "Naskah Laporan Akhir Magang.pdf"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Format dokumen PDF telah tersedia untuk dievaluasi
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={getFileUrl(peserta.file_laporan_akhir)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Berkas</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleGoToLaporanAkhir}
                            className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                          >
                            <span>Kelola</span>
                            <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <FileQuestion className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                              Laporan Belum Diunggah
                            </p>
                            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                              Peserta belum mengunggah berkas naskah laporan akhir
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoToLaporanAkhir}
                          className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161b22] text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 text-xs font-bold shadow-2xs hover:border-amber-400 transition-all cursor-pointer shrink-0"
                        >
                          <span>Cek Menu Laporan</span>
                          <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Action Banner Footer Tab 3 */}
              <div
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  dk ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-[#004F9F] dark:text-sky-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pusat Manajemen Tugas &amp; Laporan
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Kelola daftar penugasan seluruh peserta bimbingan dan validasi laporan akhir
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToTugas}
                  className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs font-bold hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Buka Kelola Penugasan</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 4: EVALUASI NILAI ══════════════ */}
          {activeTab === "nilai" && (
            <div className="space-y-3 sm:space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
              {peserta.nilai_akhir_angka != null ? (
                /* SUDAH DINILAI (FINAL / DRAF) */
                <div className="space-y-3">
                  {/* HERO SCORE SUMMARY CARD */}
                  <div
                    className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                      dk
                        ? "bg-gradient-to-br from-emerald-950/40 via-[#0B1A4C]/50 to-[#060D2A] border-emerald-500/30"
                        : "bg-gradient-to-br from-emerald-50/80 via-blue-50/40 to-white border-emerald-200/80 shadow-emerald-500/5"
                    }`}
                  >
                    {/* Subtle decorative glow */}
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-500/15">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>Hasil Evaluasi Akhir Magang</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          </h4>
                          <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400">
                            {peserta.tanggal_penilaian
                              ? `Dinilai pada ${peserta.tanggal_penilaian}`
                              : "Akumulasi dari 4 pilar kompetensi magang"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-2xs border ${
                          peserta.status_penilaian === "final"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            peserta.status_penilaian === "final"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-500"
                          }`}
                        />
                        {peserta.status_penilaian === "final" ? "Penilaian Final" : "Draf Tersimpan"}
                      </span>
                    </div>

                    {/* MAIN SCORE BADGE & PREDIKAT */}
                    <div className="relative grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3.5 items-center">
                      <div className="sm:col-span-7 flex items-center gap-3.5">
                        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl bg-white dark:bg-white/10 border border-emerald-200/80 dark:border-white/10 shadow-xs">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                            Nilai Akhir
                          </span>
                          <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none my-0.5">
                            {peserta.nilai_akhir_angka}
                          </span>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">
                            Skala 100
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                              Grade {peserta.indeks_nilai_akhir || "-"}
                            </span>
                            {peserta.predikat_akhir && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                {peserta.predikat_akhir}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Peserta berhak mendapatkan lembar nilai & sertifikat magang Diskominfo Ponorogo.
                          </p>
                        </div>
                      </div>

                      <div className="sm:col-span-5 flex sm:justify-end">
                        <button
                          type="button"
                          onClick={handleGoToPenilaian}
                          className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs font-bold hover:shadow-md hover:shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-300" />
                          <span>Kelola & Edit Nilai</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 PILAR BREAKDOWN */}
                  <SectionCard icon={Target} title="Rincian Skor 4 Pilar Kompetensi" isDark={dk}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Profesional */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          dk ? "bg-white/[0.03] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Kompetensi Profesional
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                            Bobot 35%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, peserta.nilai_profesional || 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0 min-w-[32px] text-right">
                            {peserta.nilai_profesional != null ? peserta.nilai_profesional : "-"}
                          </span>
                        </div>
                      </div>

                      {/* 2. Personal */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          dk ? "bg-white/[0.03] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Kompetensi Personal
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                            Bobot 25%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, peserta.nilai_personal || 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0 min-w-[32px] text-right">
                            {peserta.nilai_personal != null ? peserta.nilai_personal : "-"}
                          </span>
                        </div>
                      </div>

                      {/* 3. Sosial */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          dk ? "bg-white/[0.03] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Kompetensi Sosial
                          </span>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-900/40">
                            Bobot 20%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, peserta.nilai_sosial || 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0 min-w-[32px] text-right">
                            {peserta.nilai_sosial != null ? peserta.nilai_sosial : "-"}
                          </span>
                        </div>
                      </div>

                      {/* 4. Administratif */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          dk ? "bg-white/[0.03] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Kompetensi Administratif
                          </span>
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                            Bobot 20%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, peserta.nilai_administratif || 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0 min-w-[32px] text-right">
                            {peserta.nilai_administratif != null ? peserta.nilai_administratif : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* CATATAN MENTOR JIKA ADA */}
                  {peserta.catatan_mentor && (
                    <SectionCard icon={MessageSquareQuote} title="Catatan & Masukan Mentor" isDark={dk}>
                      <div
                        className={`p-3.5 rounded-xl border italic text-xs leading-relaxed ${
                          dk
                            ? "bg-white/[0.02] border-white/10 text-slate-300"
                            : "bg-slate-50/80 border-slate-200/80 text-slate-700"
                        }`}
                      >
                        "{peserta.catatan_mentor}"
                      </div>
                    </SectionCard>
                  )}
                </div>
              ) : (
                /* BELUM DINILAI */
                <div className="space-y-3 sm:space-y-3.5">
                  {/* HEADER NOTICE CARD */}
                  <div
                    className={`p-4 sm:p-4.5 rounded-2xl border transition-all ${
                      dk
                        ? "bg-white/[0.02] border-white/10"
                        : "bg-slate-50/70 border-slate-200/80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#004F9F] dark:text-sky-400 shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                            Evaluasi Nilai Akhir Magang
                          </h4>
                          <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400">
                            Standar penilaian resmi Dinas Komunikasi dan Informatika Kab. Ponorogo
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Belum Dinilai
                      </span>
                    </div>

                    <p className="pt-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Peserta ini belum memiliki nilai akhir magang. Penilaian mentor meliputi 4 pilar kompetensi utama yang dikalkulasikan secara otomatis untuk penentuan grade dan penerbitan sertifikat.
                    </p>
                  </div>

                  {/* 4 PILAR PREVIEW CARDS */}
                  <SectionCard icon={Target} title="Panduan 4 Pilar Kompetensi Penilaian" isDark={dk}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Profesional */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-white/20 ${
                          dk ? "bg-white/[0.02] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              1. Profesional
                            </span>
                            <span className="text-[9.5px] font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                              Bobot 35%
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Pemahaman tugas, mutu pengerjaan, inisiatif teknis, dan ketepatan waktu penyelesaian.
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[9.5px] text-slate-400">
                          <span>4 Butir Indikator</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Input Manual</span>
                        </div>
                      </div>

                      {/* 2. Personal */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-white/20 ${
                          dk ? "bg-white/[0.02] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              2. Personal
                            </span>
                            <span className="text-[9.5px] font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                              Bobot 25%
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Kedisiplinan, kejujuran & integritas, kemandirian kerja, etika dan sikap sopan santun.
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[9.5px] text-slate-400">
                          <span>5 Butir Indikator</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Input Manual</span>
                        </div>
                      </div>

                      {/* 3. Sosial */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-white/20 ${
                          dk ? "bg-white/[0.02] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              3. Sosial
                            </span>
                            <span className="text-[9.5px] font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                              Bobot 20%
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Komunikasi interpersonal, kerja sama tim, interaksi dengan mentor dan pegawai.
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[9.5px] text-slate-400">
                          <span>4 Butir Indikator</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Input Manual</span>
                        </div>
                      </div>

                      {/* 4. Administratif */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-white/20 ${
                          dk ? "bg-white/[0.02] border-white/10" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              4. Administratif
                            </span>
                            <span className="text-[9.5px] font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                              Bobot 20%
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Ketertiban absensi, kelengkapan logbook, ketepatan tugas, dan naskah laporan akhir.
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[9.5px] text-slate-400">
                          <span>Presensi & Logbook</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Auto + Konfirmasi</span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* BOTTOM ACTION CARD */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                      dk ? "bg-white/[0.03] border-white/10" : "bg-slate-50/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Mulai Formulir Penilaian
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Buka lembar penilaian komprehensif untuk {peserta.nama_lengkap}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToPenilaian}
                      className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs font-bold hover:shadow-md hover:shadow-blue-900/25 transition-all active:scale-95 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-white" />
                      <span>Beri Penilaian Sekarang</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER MODAL ── */}
        <div
          className={`px-4 py-3 sm:px-6 sm:py-3.5 border-t flex items-center justify-between shrink-0 ${
            dk ? "border-white/10 bg-white/[0.02]" : "border-slate-200/80 bg-slate-50/50"
          }`}
        >
          {/* Petunjuk Pintasan Keyboard Esc di Pojok Kiri Sejajar Tombol Tutup */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-slate-400 dark:text-slate-500 select-none">
            <span>Tekan</span>
            <kbd className="px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 rounded shadow-2xs font-mono">
              Esc
            </kbd>
            <span>untuk menutup</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              dk
                ? "border-white/10 text-slate-300 hover:bg-white/5"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DetailPesertaBimbinganModal;
