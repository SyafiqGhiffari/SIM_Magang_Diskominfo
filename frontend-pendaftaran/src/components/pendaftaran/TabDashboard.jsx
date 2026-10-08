import { useState } from "react";
import {
  Landmark,
  Building2,
  CheckCircle2,
  Hourglass,
  AlertTriangle,
  XCircle,
  PartyPopper,
  Lock,
  Pencil,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  ClipboardCheck,
  ClipboardPenLine,
  Copy,
  Check,
  Download,
  MonitorCheck,
  FileCheck,
} from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl";
import { formatTanggalIndonesia } from "../../utils/formatTime";

const getSalam = () => {
  const hr = new Date().getHours();
  if (hr < 11) return "Selamat Pagi";
  if (hr < 15) return "Selamat Siang";
  if (hr < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const getInisial = (nama) => {
  if (!nama) return "P";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const TabDashboard = ({
  dk,
  user,
  hasRegistered,
  status,
  loading,
  isPending,
  isRevisi,
  isAccepted,
  isRejected,
  handleTabChange,
}) => {
  const salam = getSalam();
  const namaPeserta = user?.nama || "Calon Peserta";
  const rawFoto = user?.foto_profil;
  const fotoUrl = rawFoto ? getFileUrl(rawFoto) : null;

  const institusi = user?.institusi || status?.institusi || "";

  const tanggalMulaiFmt = formatTanggalIndonesia(status?.tanggal_mulai, true);
  const tanggalSelesaiFmt = formatTanggalIndonesia(status?.tanggal_selesai, true);
  const adaJadwal = status?.tanggal_mulai && status?.tanggal_selesai;

  const kodeKategori = status?.kategori_pendaftar === "mahasiswa" ? "M" : status?.kategori_pendaftar === "siswa" ? "S" : "";
  const nomorRegistrasi = status
    ? `PM-${status.created_at ? new Date(status.created_at).getFullYear() : new Date().getFullYear()}${kodeKategori ? `-${kodeKategori}` : ""}-${String(status.id || 0).padStart(4, "0")}`
    : "-";

  const [copiedReg, setCopiedReg] = useState(false);
  const handleCopyNomor = () => {
    if (!nomorRegistrasi || nomorRegistrasi === "-") return;
    navigator.clipboard.writeText(nomorRegistrasi);
    setCopiedReg(true);
    setTimeout(() => setCopiedReg(false), 2000);
  };

  const getStepProgressHeight = () => {
    if (isAccepted || isRejected || isRevisi) return "100%";
    if (isPending) return "66%";
    if (hasRegistered) return "33%";
    return "0%";
  };

  return (
    <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
      {/* ── 1. HERO WELCOME BANNER (PERSIS GAYA DASHBOARD WEB MANAJEMEN) ── */}
      <div
        className={`relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 p-5 sm:p-7 ${
          dk
            ? "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#122B70] border-white/10 text-white"
            : "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#004F9F] border-blue-900/40 text-white"
        }`}
      >
        {/* Ambient Glows & Radial Dot Matrix */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#00A5EC]/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-[#FF2D78]/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] animate-[pulse_5s_ease-in-out_infinite]" />

        {/* Watermark Icon - Icon Rumah (Dashboard) seperti di Sidebar */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 sm:-right-2 top-1/2 h-36 w-36 sm:h-52 sm:w-52 -translate-y-1/2 rotate-12 text-sky-400 opacity-[0.05]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Kolom Kiri: Avatar + Identitas + Badges */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0 max-w-3xl">
            <div className="relative shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={namaPeserta}
                  className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 sm:ring-3 ring-white/25 shadow-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-lg sm:text-2xl font-black text-white ring-2 sm:ring-3 ring-white/25 shadow-xl">
                  {getInisial(namaPeserta)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Tulisan Salam (Gaya Dashboard Peserta) */}
              <p className="text-sm sm:text-base md:text-lg font-black text-white/90 tracking-tight leading-tight">
                {salam}
              </p>

              {/* Nama Peserta */}
              <h1 className="mt-0.5 text-lg sm:text-2xl md:text-[28px] font-black tracking-tight leading-tight truncate text-white">
                {namaPeserta}
              </h1>

              {/* Asal Institusi (Tulisan biasa dengan icon di kiri) */}
              {institusi && (
                <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-white/90 font-medium truncate">
                  <Building2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">{institusi}</span>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Card Aksi Prioritas (Gaya Card Prioritas Mentor/Peserta) */}
          <div className="shrink-0 self-start lg:self-center">
            {isAccepted ? (
              <a
                href={import.meta.env.VITE_PORTAL_URL || "http://localhost:5173/login"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 py-2.5 pl-3.5 pr-3 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/30 hover:shadow-xl active:scale-95"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <PartyPopper className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-200">
                    Lolos Seleksi Magang
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white">
                    Masuk Portal Manajemen
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-200 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </a>
            ) : isRevisi ? (
              <button
                type="button"
                onClick={() => handleTabChange("revisi")}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/20 py-2.5 pl-3.5 pr-3 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-500/30 hover:shadow-xl active:scale-95"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/30 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-amber-200">
                    Perhatian Khusus
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white">
                    Perbaiki Dokumen Sekarang
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-200 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
              </button>
            ) : isPending ? (
              <div className="flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/15 py-2.5 px-3.5 text-left backdrop-blur-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/20 text-sky-200 border border-sky-400/30 shadow-sm">
                  <Hourglass className="h-4.5 w-4.5 animate-spin" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-sky-200">
                    Tahap Pemeriksaan
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-bold text-white">
                    Estimasi 2-3 Hari Kerja
                  </span>
                </span>
              </div>
            ) : isRejected ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/15 py-2.5 px-3.5 text-left backdrop-blur-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-400/20 text-rose-200 border border-rose-400/30 shadow-sm">
                  <XCircle className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-rose-200">
                    Hasil Seleksi
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-bold text-white">
                    Permohonan Ditolak
                  </span>
                </span>
              </div>
            ) : !hasRegistered ? (
              <button
                type="button"
                onClick={() => handleTabChange("form")}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/20 bg-white/10 py-2.5 pl-3.5 pr-3 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-xl active:scale-95"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/20 text-sky-200 border border-sky-400/30 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <FileText className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-sky-200">
                    Langkah Awal
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white">
                    Mulai Isi Formulir
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
              </button>
            ) : null}
          </div>
        </div>
      </div>



      {/* ── 3. DUA KOLOM UTAMA (KIRI: PENGUMUMAN & AKSI; KANAN: ALUR PROSES) ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Kolom Kiri: Card Status Komprehensif & Aksi Cepat */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-6">
          {/* Status Announcement Detailed Card */}
          {loading && !status && !user ? (
            <div
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 sm:p-7 flex items-center gap-4 ${
                dk ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
              }`}
            >
              <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="h-4 w-48 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-3/4 max-w-md rounded-full bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
          ) : (
            <div>
              {/* JIKA BELUM MENDAFTAR */}
              {!hasRegistered && (
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${
                    dk
                      ? "border-[#00A5EC]/20 bg-[#00A5EC]/5 hover:bg-[#00A5EC]/10"
                      : "border-[#00A5EC]/30 bg-gradient-to-r from-[#00A5EC]/5 to-[#004F9F]/5 hover:shadow-lg hover:shadow-blue-500/5"
                  }`}
                >
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4 relative z-10">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md shadow-blue-900/20">
                      <FileText className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className={`text-base font-black tracking-tight ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Mulai Pengajuan Magang Anda
                      </h3>
                      <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${dk ? "text-slate-400" : "text-slate-500"}`}>
                        Belum ada permohonan magang aktif. Segera lengkapi formulir pendaftaran diri Anda, pilih bidang magang yang diminati, serta unggah berkas surat pengantar resmi.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("form")}
                    className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-950/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer group"
                  >
                    Lengkapi Berkas Sekarang
                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {/* JIKA BERKAS SEDANG DIVERIFIKASI */}
              {isPending && (
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${
                    dk
                      ? "border-[#00A5EC]/20 bg-[#00A5EC]/5 hover:bg-[#00A5EC]/10"
                      : "border-[#00A5EC]/30 bg-gradient-to-r from-[#00A5EC]/5 to-[#004F9F]/5 hover:shadow-lg hover:shadow-blue-500/5"
                  }`}
                >
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4 relative z-10">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md shadow-blue-900/20">
                      <Hourglass className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-black tracking-tight ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                          Berkas Sedang Diverifikasi
                        </h3>
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${dk ? "text-slate-400" : "text-slate-500"}`}>
                        Dokumen dan berkas permohonan magang Anda sedang ditinjau dan diperiksa secara teliti oleh tim administrator Diskominfo Ponorogo. Proses ini umumnya memakan waktu 2-3 hari kerja.
                      </p>
                    </div>
                  </div>
                  <span className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/20 border border-white/10">
                    <span className="relative flex h-2 w-2">
                      <span className="inline-flex rounded-full h-2 w-2 bg-[#00A5EC]" />
                    </span>
                    Tahap: Menunggu
                  </span>
                </div>
              )}

              {/* JIKA PERLU REVISI */}
              {isRevisi && (
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${
                    dk
                      ? "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10"
                      : "border-amber-300 bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:shadow-lg hover:shadow-amber-500/5"
                  }`}
                >
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                      <AlertTriangle className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div className="space-y-2.5 w-full">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-black tracking-tight ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                            Permintaan Revisi Dokumen
                          </h3>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${dk ? "text-slate-400" : "text-slate-500"}`}>
                          Terdapat dokumen yang memerlukan perbaikan segera agar proses seleksi administrasi Anda dapat dilanjutkan.
                        </p>
                      </div>
                      {status?.catatan_admin && (
                        <div
                          className={`relative text-xs rounded-xl p-3.5 font-sans italic border-l-4 ${
                            dk
                              ? "bg-amber-400/5 border-amber-500 text-amber-300/90"
                              : "text-amber-900 bg-amber-50/80 border-amber-500 shadow-sm"
                          }`}
                        >
                          <p className="font-bold not-italic text-[10px] uppercase tracking-wider text-amber-600 mb-1">
                            Catatan Administrator:
                          </p>
                          "{status.catatan_admin}"
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("revisi")}
                    className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-orange-600 hover:to-amber-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-amber-600/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer group"
                  >
                    Perbaiki Berkas Sekarang
                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {/* JIKA DITERIMA */}
              {isAccepted && (
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all duration-300 space-y-4 ${
                    dk
                      ? "bg-[#161b22] border-white/10"
                      : "bg-white border-slate-200/80 shadow-sm"
                  }`}
                >
                  {/* Header: Icon + Judul + Subjudul + Badge */}
                  <div className="flex items-start gap-3.5 sm:gap-4 relative z-10 w-full">
                    <span className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25">
                      <PartyPopper className="w-6 h-6 sm:w-6.5 sm:h-6.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                          Selamat! Anda Diterima Magang
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                          Lolos Seleksi
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed font-sans ${dk ? "text-slate-400" : "text-slate-500"}`}>
                        Permohonan magang Anda di Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo telah disetujui secara resmi.
                      </p>
                    </div>
                  </div>

                  {/* Body Konten: Start dari pojok kiri (Full width card) */}
                  {/* 1. Detail 3 Kolom: Nomor Registrasi, Penempatan Bidang, Periode Pelaksanaan */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1.25fr_1.5fr] gap-3 sm:gap-3.5 w-full">
                    {/* Kolom 1: Nomor Registrasi */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors ${dk ? "bg-white/5 border-white/5" : "bg-slate-50/70 border-slate-200/70 shadow-sm"}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${dk ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[9px] font-black uppercase tracking-wider ${dk ? "text-slate-500" : "text-slate-400"}`}>
                          Nomor Registrasi
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`font-extrabold text-xs truncate ${dk ? "text-slate-200" : "text-[#0B1442]"}`}>
                            {nomorRegistrasi}
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyNomor}
                            title={copiedReg ? "Nomor Registrasi Tersalin!" : "Salin Nomor Registrasi"}
                            className="group/copy inline-flex items-center justify-center p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 hover:scale-115 active:scale-90 transition-all duration-200 cursor-pointer shrink-0"
                          >
                            {copiedReg ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 transition-transform duration-200 group-hover/copy:-rotate-12 group-hover/copy:scale-110" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Kolom 2: Penempatan Bidang */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors ${dk ? "bg-white/5 border-white/5" : "bg-slate-50/70 border-slate-200/70 shadow-sm"}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${dk ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[9px] font-black uppercase tracking-wider ${dk ? "text-slate-500" : "text-slate-400"}`}>
                          Penempatan Bidang
                        </p>
                        <p className={`font-bold text-xs mt-0.5 truncate ${dk ? "text-slate-200" : "text-[#0B1442]"}`}>
                          {status?.posisi_bidang || "Bidang Aplikasi & Informatika"}
                        </p>
                      </div>
                    </div>

                    {/* Kolom 3: Periode Pelaksanaan */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors ${dk ? "bg-white/5 border-white/5" : "bg-slate-50/70 border-slate-200/70 shadow-sm"}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${dk ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[9px] font-black uppercase tracking-wider ${dk ? "text-slate-500" : "text-slate-400"}`}>
                          Periode Pelaksanaan
                        </p>
                        <p className={`font-bold text-xs mt-0.5 truncate whitespace-nowrap ${dk ? "text-slate-200" : "text-[#0B1442]"}`}>
                          {adaJadwal ? (
                            <>
                              {tanggalMulaiFmt} <span className="text-emerald-500 text-[10px] font-medium mx-1">s/d</span> {tanggalSelesaiFmt}
                            </>
                          ) : (
                            "Sesuai Jadwal Surat Penerimaan"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Catatan Reviewer (jika ada) */}
                  {status?.catatan_admin && (
                    <div
                      className={`p-3 sm:p-3.5 rounded-xl border-l-4 text-xs font-sans transition-all ${
                        dk
                          ? "bg-emerald-500/[0.05] border-emerald-500 text-emerald-200"
                          : "bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <ClipboardPenLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Catatan Reviewer / Administrator:
                        </p>
                      </div>
                      <p className="italic leading-relaxed pl-5 text-[11px] sm:text-xs">
                        "{status.catatan_admin}"
                      </p>
                    </div>
                  )}

                  {/* 3. Sejajar (2 Kolom): Banner Surat Penerimaan & Banner Akses Portal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full">
                    {/* Banner Kiri: Surat Penerimaan Resmi (Gaya Biru Kominfo seperti Card Ajukan Pendaftaran) */}
                    {status?.surat_penerimaan?.file_surat ? (
                      <div
                        className={`group/surat p-3.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between gap-3 w-full transition-all duration-300 ${
                          dk
                            ? "bg-white/[0.02] border-white/10 hover:border-sky-500/40 shadow-sm"
                            : "bg-white border-slate-200/80 hover:border-[#004F9F]/40 hover:shadow-md shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-blue-500/10 dark:text-sky-400 border border-blue-100 dark:border-blue-500/20 shadow-xs group-hover/surat:scale-105 transition-transform duration-300">
                            <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#004F9F] dark:text-sky-400" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className={`text-xs sm:text-[13px] font-black tracking-tight transition-colors ${dk ? "text-slate-100 group-hover/surat:text-sky-400" : "text-[#0B1442] group-hover/surat:text-[#004F9F]"}`}>
                                Surat Penerimaan Magang
                              </h4>
                              <span className="inline-flex items-center rounded-full bg-blue-500/10 text-[#004F9F] dark:text-sky-400 border border-blue-200/60 dark:border-blue-500/20 px-1.5 py-0.2 text-[8.5px] font-black uppercase tracking-wider">
                                Dokumen Resmi
                              </span>
                            </div>
                            <p className={`text-[10.5px] sm:text-[11px] mt-0.5 font-medium truncate ${dk ? "text-slate-400" : "text-slate-500"}`}>
                              No: <span className="font-bold text-[#004F9F] dark:text-sky-300">{status.surat_penerimaan.nomor_surat}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <span className={`text-[10px] truncate ${dk ? "text-slate-500" : "text-slate-400"}`}>
                            {status.surat_penerimaan.tanggal_terbit ? `Terbit: ${formatTanggalIndonesia(status.surat_penerimaan.tanggal_terbit)}` : "Dokumen Resmi"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={getFileUrl(status.surat_penerimaan.file_surat)}
                              download={`Surat_Penerimaan_${user?.nama || "Magang"}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/btn inline-flex items-center gap-1.5 rounded-lg bg-[#004F9F] hover:bg-[#003d7c] dark:bg-[#004F9F] dark:hover:bg-[#00A5EC] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:shadow hover:-translate-y-0.5 transition-all duration-300 active:scale-95 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
                              <span>Unduh PDF</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between gap-3 text-xs w-full transition-all ${
                          dk ? "bg-white/[0.02] border-white/5 text-slate-400" : "bg-white border-slate-200/80 text-slate-600 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-blue-500/10 dark:text-sky-400 border border-blue-100 dark:border-blue-500/20 shadow-xs">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#004F9F] dark:text-sky-400" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className={`text-xs sm:text-[13px] font-black tracking-tight ${dk ? "text-slate-100" : "text-[#0B1442]"}`}>
                                Surat Penerimaan Magang
                              </h4>
                              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Proses Penerbitan
                              </span>
                            </div>
                            <p className="text-[10.5px] sm:text-[11px] mt-0.5 text-slate-500 dark:text-slate-400 leading-tight">
                              Dalam proses penerbitan tata usaha / admin Diskominfo.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                          <span className="text-[10px] text-slate-400">Status Dokumen</span>
                          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Menunggu Penerbitan
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Banner Kanan: Akses Portal Siswa / Mahasiswa (Ikon MonitorCheck) */}
                    <div
                      className={`group/portal-card p-3.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between gap-3 w-full transition-all duration-300 ${
                        dk ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-xs group-hover/portal-card:scale-105 transition-transform duration-300">
                          <MonitorCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-[13px] font-black tracking-tight text-emerald-800 dark:text-emerald-300">
                              Akses Portal Magang Aktif
                            </h4>
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              Akun Aktif
                            </span>
                          </div>
                          <p className="text-[10.5px] sm:text-[11px] mt-0.5 text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed font-sans">
                            Masuk menggunakan <strong>email &amp; password</strong> akun ini untuk mengakses portal harian.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-500/20">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                          Siswa &amp; Mahasiswa
                        </span>
                        <a
                          href={import.meta.env.VITE_PORTAL_URL || "http://localhost:5173/login"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/portal inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:shadow hover:-translate-y-1 transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                          <span>Masuk Portal</span>
                          <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/portal:translate-x-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* JIKA DITOLAK */}
              {isRejected && (
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${
                    dk
                      ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                      : "border-rose-300 bg-gradient-to-r from-rose-500/5 to-red-500/5 hover:shadow-lg hover:shadow-rose-500/5"
                  }`}
                >
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-rose-400/10 blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20">
                      <XCircle className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div className="space-y-2.5 relative z-10 w-full">
                      <div>
                        <h3 className="text-base font-black tracking-tight text-rose-500">
                          Permohonan Magang Ditolak
                        </h3>
                        <p className={`text-xs mt-1 leading-relaxed font-sans ${dk ? "text-slate-400" : "text-slate-500"}`}>
                          Mohon maaf, permohonan magang Anda belum dapat diterima pada periode kali ini dikarenakan kuota atau pertimbangan teknis.
                        </p>
                      </div>
                      {status?.catatan_admin && (
                        <div
                          className={`relative text-xs rounded-xl p-3.5 font-sans italic border-l-4 ${
                            dk
                              ? "bg-rose-400/5 border-rose-500 text-rose-300/90"
                              : "text-rose-900 bg-rose-50/80 border-rose-500 shadow-sm"
                          }`}
                        >
                          <p className="font-bold not-italic text-[10px] uppercase tracking-wider text-rose-600 mb-1">
                            Alasan / Catatan Administrator:
                          </p>
                          "{status.catatan_admin}"
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-red-700 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-950/20 border border-white/10">
                    Status: Ditolak
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Interactive Cards (Berwarna Putih dengan Icon Berwarna Sesuai Kondisi) */}
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
            {/* Card 1: Ajukan Pendaftaran */}
            {hasRegistered && !isRevisi ? (
              <div
                className={`relative overflow-hidden flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 sm:p-6 select-none transition-all ${
                  dk ? "border-white/5 bg-[#161b22]/40" : "border-slate-200/80 bg-slate-50/70"
                }`}
              >
                <div>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 ${
                      dk ? "bg-white/5 text-slate-500" : "bg-slate-200/70 text-slate-400"
                    }`}
                  >
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className={`text-sm sm:text-base font-bold ${dk ? "text-slate-400" : "text-slate-500"}`}>
                    Ajukan Pendaftaran
                  </h4>
                  <p className={`mt-2 text-xs leading-relaxed font-sans ${dk ? "text-slate-500" : "text-slate-400"}`}>
                    Formulir dinonaktifkan karena berkas pendaftaran Anda telah berhasil terkirim.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-dashed border-slate-200 dark:border-white/5">
                  <span className={`text-[9.5px] font-black uppercase tracking-wider ${dk ? "text-slate-500" : "text-slate-400"}`}>
                    Terkunci
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dk ? "bg-white/5 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                    Sudah Terkirim
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleTabChange("form")}
                className="group relative overflow-hidden flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-[#004F9F]/40 dark:bg-[#161b22] dark:border-white/10 dark:hover:border-blue-500/40 transition-all duration-300 text-left cursor-pointer"
              >
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-blue-500/10 dark:text-sky-400 border border-blue-100 dark:border-blue-500/20 mb-4 group-hover:scale-105 duration-300 shadow-sm">
                    <FileText className="w-5 h-5 text-[#004F9F] dark:text-sky-400" strokeWidth={2} />
                  </span>
                  <h4 className="text-sm sm:text-base font-black tracking-tight text-[#0B1442] dark:text-slate-100 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-colors">
                    Ajukan Pendaftaran
                  </h4>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Isi data diri lengkap, pilih bidang penempatan, dan unggah berkas surat pengantar.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#004F9F] dark:text-sky-400">
                    Mulai Form
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#004F9F] dark:text-sky-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            )}

            {/* Card 2: Revisi Dokumen */}
            {isRevisi ? (
              <button
                type="button"
                onClick={() => handleTabChange("revisi")}
                className="group relative overflow-hidden flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-amber-300 dark:bg-[#161b22] dark:border-white/10 dark:hover:border-amber-500/40 transition-all duration-300 text-left cursor-pointer"
              >
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 mb-4 group-hover:scale-105 duration-300 shadow-sm">
                    <Pencil className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  </span>
                  <h4 className="text-sm sm:text-base font-black tracking-tight text-[#0B1442] dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Revisi Dokumen
                  </h4>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Unggah kembali dokumen perbaikan sesuai catatan resmi dari tim administrator.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Perbaiki Dokumen
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            ) : (
              <div
                className={`relative overflow-hidden flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 sm:p-6 select-none transition-all ${
                  dk ? "border-white/5 bg-[#161b22]/40" : "border-slate-200/80 bg-slate-50/70"
                }`}
              >
                <div>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 ${
                      dk ? "bg-white/5 text-slate-500" : "bg-slate-200/70 text-slate-400"
                    }`}
                  >
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className={`text-sm sm:text-base font-bold ${dk ? "text-slate-400" : "text-slate-500"}`}>
                    Revisi Dokumen
                  </h4>
                  <p className={`mt-2 text-xs leading-relaxed font-sans ${dk ? "text-slate-500" : "text-slate-400"}`}>
                    Menu revisi hanya aktif jika berkas Anda memerlukan perbaikan dari admin.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-dashed border-slate-200 dark:border-white/5">
                  <span className={`text-[9.5px] font-black uppercase tracking-wider ${dk ? "text-slate-500" : "text-slate-400"}`}>
                    Tidak Perlu
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dk ? "bg-white/5 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                    Kondisi Normal
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Stepper Timeline Alur Pendaftaran (Tinggi Sejajar dengan Garis Bawah Card Kiri) */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col">
          {/* Stepper Timeline Alur Pendaftaran */}
          <div
            className={`flex-1 flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 sm:p-6 shadow-sm transition-all duration-300 ${
              dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
            }`}
          >
            {/* Header: Persis seperti card Perlu Tindakan Anda di Dashboard Peserta Web Manajemen */}
            <div className="flex items-center gap-2.5 sm:gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <ClipboardCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-xs sm:text-sm font-black tracking-tight line-clamp-2 leading-tight ${
                    dk ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  Alur Proses Seleksi
                </h3>
                <p
                  className={`mt-0.5 text-[9px] sm:text-[11px] font-medium line-clamp-2 leading-tight ${
                    dk ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Tahapan Seleksi Magang
                </p>
              </div>
            </div>

            {/* Stepper Content (Terdistribusi Rapi Vertikal Presisi di Tengah) */}
            <div className="relative py-3 flex-1 flex flex-col justify-between space-y-4 my-2">
              {/* Connected Vertical Progress Line */}
              <div
                className={`absolute top-5 bottom-5 left-5 -translate-x-1/2 w-0.5 rounded-full ${
                  dk ? "bg-white/10" : "bg-slate-200"
                }`}
              >
                <div
                  className="w-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ height: getStepProgressHeight() }}
                />
              </div>

              {[
                {
                  step: 1,
                  label: "Registrasi Akun",
                  sub: "Akun login aktif & terverifikasi",
                  badge: "Selesai",
                  done: true,
                  active: false,
                },
                {
                  step: 2,
                  label: "Kirim Formulir Berkas",
                  sub: hasRegistered ? "Dokumen lengkap terkirim" : "Belum mengisi formulir",
                  badge: hasRegistered ? "Lengkap" : "Pending",
                  done: hasRegistered,
                  active: !hasRegistered,
                },
                {
                  step: 3,
                  label: "Verifikasi Administrasi",
                  sub: isPending ? "Sedang ditinjau admin" : (isAccepted || isRejected || isRevisi) ? "Selesai diperiksa" : "Menunggu berkas",
                  badge: (isAccepted || isRejected || isRevisi) ? "Selesai" : isPending ? "Ditinjau" : "Menunggu",
                  done: isAccepted || isRejected || isRevisi,
                  active: hasRegistered && isPending,
                },
                {
                  step: 4,
                  label: "Pengumuman Hasil",
                  sub: isAccepted ? "Selamat! Lolos seleksi" : isRejected ? "Belum dapat diterima" : isRevisi ? "Perlu perbaikan berkas" : "Menunggu verifikasi",
                  badge: isAccepted ? "Lolos" : isRejected ? "Ditolak" : isRevisi ? "Revisi" : "Menunggu",
                  done: isAccepted,
                  warn: isRevisi,
                  bad: isRejected,
                  active: false,
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-3.5 z-10 relative group/step"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    {s.active && (
                      <span className="absolute inset-0 rounded-full bg-[#00A5EC]/30 animate-ping" />
                    )}
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-black shadow-md transition-all duration-300 transform group-hover/step:scale-105 ${
                        s.done
                          ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/10"
                          : s.bad
                          ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-red-500/25 ring-4 ring-rose-500/10"
                          : s.warn
                          ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/25 ring-4 ring-amber-500/10"
                          : s.active
                          ? "bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg shadow-[#004F9F]/30 ring-4 ring-[#00A5EC]/20"
                          : dk
                          ? "bg-[#161b22] border-2 border-white/15 text-slate-500"
                          : "bg-white border-2 border-slate-200 text-slate-400"
                      }`}
                    >
                      {s.done ? (
                        <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.4} />
                      ) : s.bad ? (
                        <XCircle className="w-5 h-5 text-white" strokeWidth={2.4} />
                      ) : s.warn ? (
                        <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.4} />
                      ) : (
                        <span className="font-extrabold text-xs">{s.step}</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <p
                        className={`text-xs sm:text-[13px] font-black tracking-tight transition-colors ${
                          s.active
                            ? "text-[#00A5EC]"
                            : dk
                            ? "text-slate-100 group-hover/step:text-[#00A5EC]"
                            : "text-[#0B1442] group-hover/step:text-[#004F9F]"
                        }`}
                      >
                        {s.label}
                      </p>
                      <span
                        className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          s.done
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : s.bad
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                            : s.warn
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : s.active
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                        }`}
                      >
                        {s.badge}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[11px] leading-snug font-sans ${dk ? "text-slate-400" : "text-slate-500"}`}>
                      {s.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini Status Footer */}
            <div className={`pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  isAccepted ? "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" :
                  isRejected ? "bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900" :
                  isRevisi ? "bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900" :
                  isPending ? "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" :
                  hasRegistered ? "bg-sky-500 ring-2 ring-sky-200 dark:ring-sky-900" : "bg-slate-300"
                }`} />
                <span className={`text-[11px] font-bold ${dk ? "text-slate-300" : "text-slate-600"}`}>
                  Tahap Akhir:
                </span>
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider ${
                isAccepted ? "text-emerald-600 dark:text-emerald-400" :
                isRejected ? "text-rose-600 dark:text-rose-400" :
                isRevisi ? "text-amber-600 dark:text-amber-400" :
                isPending ? "text-sky-600 dark:text-sky-400" :
                hasRegistered ? "text-blue-600 dark:text-sky-400" :
                "text-slate-500"
              }`}>
                {isAccepted ? "Lolos Seleksi (100%)" :
                 isRejected ? "Tidak Lolos" :
                 isRevisi ? "Menunggu Revisi" :
                 isPending ? "Tahap Verifikasi" :
                 hasRegistered ? "Berkas Terkirim" : "Belum Mendaftar"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabDashboard;