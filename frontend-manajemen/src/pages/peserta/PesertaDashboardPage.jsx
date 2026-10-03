import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PesertaLayout from "../../layouts/PesertaLayout";
import AbsenKameraModal from "../../components/manajemen/peserta/presensi/AbsenKameraModal";
import FormPengajuanIzinModal from "../../components/manajemen/peserta/presensi/FormPengajuanIzinModal";
import DetailIzinModal from "../../components/manajemen/peserta/presensi/DetailIzinModal";
import { getDashboardPeserta, batalkanPengajuanIzin } from "../../services/pesertaService";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  CalendarDays, Clock, LogIn, LogOut, CheckCircle2, Percent,
  CalendarOff, AlarmClockOff, Sparkles, Building2, UserCheck, Mail, Phone,
  ArrowRight, HeartPulse, ChevronRight,
  GraduationCap, Award, RefreshCw, Inbox, Flame, BookOpen, FileText, Download
} from "lucide-react";

export const PesertaDashboardPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [absenModal, setAbsenModal] = useState(null); // "masuk" | "pulang" | null
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [selectedIzinDetail, setSelectedIzinDetail] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  // Realtime Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const res = await getDashboardPeserta();
        if (isMounted) {
          setData(res.data?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          toastError(err.response?.data?.message || "Gagal memuat data dashboard peserta.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  };

  // Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  const peserta = data?.peserta;
  const pendaftaran = data?.pendaftaran;
  const timeline = data?.timeline;
  const mentor = data?.mentor;
  const presensiHariIni = data?.presensi_hari_ini;
  const stats = data?.statistik_kehadiran;
  const izinTerkini = data?.pengajuan_izin_terkini || [];
  const penilaian = data?.penilaian;
  const laporanAkhir = data?.laporan_akhir;

  const hariKerja = presensiHariIni?.hari_kerja;
  const sudahMasuk = presensiHariIni?.sudah_masuk;
  const sudahPulang = presensiHariIni?.sudah_pulang;
  const izinAktifHariIni = presensiHariIni?.izin_hari_ini;

  // 4 Metric cards
  const metricCards = useMemo(() => {
    const s = stats || {};
    return [
      {
        icon: CheckCircle2,
        label: "Hadir Tepat Waktu",
        value: s.hadir ?? 0,
        caption: "Hari hadir tanpa terlambat",
        lightGradient: "from-emerald-300 to-white",
        gradient: "from-emerald-500 to-emerald-700",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      },
      {
        icon: Clock,
        label: "Terlambat",
        value: s.terlambat ?? 0,
        caption: "Presensi lewat jam toleransi",
        lightGradient: "from-amber-300 to-white",
        gradient: "from-amber-500 to-amber-700",
        iconBg: "bg-amber-50 dark:bg-amber-950/50",
        iconColor: "text-amber-600 dark:text-amber-400",
      },
      {
        icon: HeartPulse,
        label: "Izin & Sakit",
        value: (s.izin ?? 0) + (s.sakit ?? 0),
        caption: `Izin ${s.izin ?? 0} · Sakit ${s.sakit ?? 0}`,
        lightGradient: "from-blue-300 to-white",
        gradient: "from-blue-500 to-blue-700",
        iconBg: "bg-blue-50 dark:bg-blue-950/50",
        iconColor: "text-blue-600 dark:text-blue-400",
      },
      {
        icon: Percent,
        label: "Tingkat Kehadiran",
        value: `${Math.round(s.persentase_kehadiran ?? 100)}%`,
        caption: `Alfa ${s.alfa ?? 0} hari kerja`,
        lightGradient: "from-indigo-300 to-white",
        gradient: "from-[#004F9F] to-[#0B1442]",
        iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
        iconColor: "text-[#004F9F] dark:text-indigo-400",
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <PesertaLayout>
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
          <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
          <p className="font-semibold text-xs text-slate-500">Memuat dashboard peserta...</p>
        </div>
      </PesertaLayout>
    );
  }

  return (
    <PesertaLayout>
      <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        
        {/* TOP WELCOME HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-[#0B1442] via-[#0F236B] to-[#004F9F] p-5 sm:p-7 shadow-lg text-white">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-[#FF2D78]/15 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-white/15 text-white/90 ring-1 ring-white/20 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  SIM Magang Diskominfo
                </span>
                {readOnly ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Alumni Magang (Selesai)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/30">
                    <Flame className="w-3 h-3 text-amber-300" />
                    Peserta Aktif
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                {greeting}, {peserta?.nama || "Peserta Magang"}!
              </h2>

              <p className="text-xs sm:text-sm text-slate-200/90 font-medium leading-relaxed">
                {pendaftaran?.posisi_bidang ? (
                  <>
                    Divisi <strong className="text-white font-bold">{pendaftaran.posisi_bidang}</strong> · {pendaftaran.institusi || "Dinas Kominfo"}
                  </>
                ) : (
                  "Selamat datang di Portal Manajemen Peserta Magang Dinas Komunikasi dan Informatika."
                )}
              </p>
            </div>

            {/* Quick Refresh Button */}
            <div className="shrink-0 self-start lg:self-center">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/20 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-300" : ""}`} />
                <span>{refreshing ? "Memuat..." : "Segarkan"}</span>
              </button>
            </div>
          </div>

          {/* Magang Timeline & Progress Bar */}
          {timeline && timeline.total_hari > 0 && (
            <div className="mt-5 pt-4 border-t border-white/15 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="text-white/80">
                  {timeline.status === "selesai" ? (
                    "Masa Magang Telah Selesai"
                  ) : timeline.status === "belum_mulai" ? (
                    "Masa Magang Belum Dimulai"
                  ) : (
                    <>Hari ke-<strong className="text-white font-black">{timeline.hari_ke}</strong> dari {timeline.total_hari} hari</>
                  )}
                </span>
                <span className="text-white tabular-nums font-black">{timeline.progres_persen}%</span>
              </div>

              {/* Progress track */}
              <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden shadow-inner">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, timeline.progres_persen))}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-400 transition-all duration-500 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-white/70 font-medium">
                <span>Mulai: {formatTanggalPresensi(pendaftaran?.tanggal_mulai)}</span>
                {timeline.status === "berjalan" && (
                  <span className="text-amber-200 font-bold">Sisa {timeline.sisa_hari} hari lagi</span>
                )}
                <span>Selesai: {formatTanggalPresensi(pendaftaran?.tanggal_selesai)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Banner Pengingat Laporan Akhir (Muncul jika sisa waktu <= 14 hari atau ada revisi) */}
        {timeline &&
          timeline.status === "berjalan" &&
          typeof timeline.sisa_hari === "number" &&
          timeline.sisa_hari <= 14 &&
          laporanAkhir?.status !== "disetujui" && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-[fadeslide_0.3s_ease-out] ${
                laporanAkhir?.status === "perlu_revisi" || timeline.sisa_hari <= 3
                  ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-950 dark:text-rose-100"
                  : timeline.sisa_hari <= 7
                  ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-100"
                  : "bg-blue-50/90 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-100"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                    laporanAkhir?.status === "perlu_revisi" || timeline.sisa_hari <= 3
                      ? "bg-rose-600 animate-pulse"
                      : timeline.sisa_hari <= 7
                      ? "bg-amber-500"
                      : "bg-[#004F9F]"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </span>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black tracking-tight">
                      {laporanAkhir?.status === "perlu_revisi"
                        ? "Permintaan Revisi Laporan Akhir"
                        : timeline.sisa_hari <= 3
                        ? "Penting: Laporan Akhir Magang Belum Disetujui"
                        : timeline.sisa_hari <= 7
                        ? `Batas Pengumpulan Laporan: Sisa ${timeline.sisa_hari} Hari`
                        : `Pengingat Laporan Akhir: Sisa ${timeline.sisa_hari} Hari`}
                    </h4>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/70 dark:bg-white/10 shadow-2xs">
                      {laporanAkhir?.status === "perlu_revisi" ? "Revisi" : `${timeline.sisa_hari} Hari`}
                    </span>
                  </div>
                  <p className="text-[11.5px] opacity-85 leading-relaxed line-clamp-2">
                    {laporanAkhir?.status === "perlu_revisi"
                      ? "Mentor pembimbing meminta perbaikan pada naskah laporan Anda. Klik di sini untuk melihat catatan dan mengunggah perbaikan."
                      : "Unggah naskah Laporan Akhir (format bebas mengikuti kampus/sekolah Anda) agar mentor dapat memeriksa dan memberikan pengesahan."}
                  </p>
                </div>
              </div>

              <Link
                to="/peserta/penilaian/laporan"
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-xs shrink-0 self-start sm:self-center transition-all hover:scale-105 active:scale-95 ${
                  laporanAkhir?.status === "perlu_revisi" || timeline.sisa_hari <= 3
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : timeline.sisa_hari <= 7
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-[#004F9F] text-white hover:bg-[#003870]"
                }`}
              >
                <span>{laporanAkhir?.file_laporan_akhir ? "Lihat Status Laporan" : "Unggah Laporan"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

        {/* 2-COLUMN MAIN CONTENT: ATTENDANCE COCKPIT + MENTOR CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* PRESENSI HARI INI COCKPIT (2 cols on lg) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-xs">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                    Presensi Hari Ini
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatTanggalPresensi(presensiHariIni?.tanggal)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-[#004F9F] dark:text-sky-400 tabular-nums">
                  {currentTime}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block">WIB</span>
              </div>
            </div>

            {/* Info Jam Kerja & Status Presensi */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                {hariKerja ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-[#004F9F] shrink-0" />
                    <span>
                      Jam Kerja: {presensiHariIni?.jam_kerja?.jam_masuk || "07:30"} – {presensiHariIni?.jam_kerja?.jam_pulang || "16:00"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Toleransi {presensiHariIni?.jam_kerja?.toleransi_terlambat || 15} mnt)
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <CalendarOff className="w-4 h-4 shrink-0" />
                    <span>Hari Libur ({presensiHariIni?.alasan_libur || "Bukan Hari Kerja"})</span>
                  </div>
                )}

                {/* Log Jam Aktual */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${sudahMasuk ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500/20" : "bg-slate-200/70 text-slate-500 dark:bg-slate-800"}`}>
                    <LogIn className="w-3 h-3" />
                    Masuk: {presensiHariIni?.jam_masuk_aktual || "--:--"}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${sudahPulang ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500/20" : "bg-slate-200/70 text-slate-500 dark:bg-slate-800"}`}>
                    <LogOut className="w-3 h-3" />
                    Pulang: {presensiHariIni?.jam_pulang_aktual || "--:--"}
                  </span>
                  {izinAktifHariIni && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-500/20 capitalize">
                      <HeartPulse className="w-3 h-3" />
                      Tercatat {izinAktifHariIni.jenis} (Disetujui)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 self-start sm:self-center">
                {izinAktifHariIni ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 ring-1 ring-purple-400/30">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Izin Hari Ini
                  </span>
                ) : sudahPulang ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Presensi Lengkap
                  </span>
                ) : sudahMasuk ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-[#004F9F] dark:bg-sky-950 dark:text-sky-300 ring-1 ring-sky-400/30">
                    <Clock className="w-3.5 h-3.5" />
                    Sedang Magang
                  </span>
                ) : !hariKerja ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400/30">
                    <CalendarOff className="w-3.5 h-3.5" />
                    Libur Dinas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 ring-1 ring-rose-400/30 animate-pulse">
                    <AlarmClockOff className="w-3.5 h-3.5" />
                    Belum Absen Masuk
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            {readOnly ? (
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/40 p-3 text-center text-xs font-semibold text-slate-500">
                Masa magang telah selesai. Anda dapat meninjau riwayat presensi di menu Riwayat Aktivitas.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAbsenModal("masuk")}
                  disabled={!hariKerja || sudahMasuk || !!izinAktifHariIni || refreshing}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-4 py-3 text-xs sm:text-sm font-black text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <LogIn className="w-4 h-4" />
                  {sudahMasuk ? "Sudah Absen Masuk" : "Absen Masuk"}
                </button>

                <button
                  type="button"
                  onClick={() => setAbsenModal("pulang")}
                  disabled={!sudahMasuk || sudahPulang || refreshing}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs sm:text-sm font-black text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <LogOut className="w-4 h-4" />
                  {sudahPulang ? "Sudah Absen Pulang" : "Absen Pulang"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowIzinModal(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 shadow-xs transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Ajukan Izin</span>
                </button>
              </div>
            )}
          </div>

          {/* MENTOR PEMBIMBING CARD (1 col on lg) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mentor Pembimbing
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-blue-50 text-[#004F9F] dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/20">
                  <UserCheck className="w-2.5 h-2.5" />
                  Diskominfo
                </span>
              </div>

              {mentor ? (
                <div className="mt-4 flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    {mentor.foto_profil ? (
                      <img
                        src={getFileUrl(mentor.foto_profil)}
                        alt={mentor.nama}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-[#004F9F]/20"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white font-black text-base shadow-xs">
                        {mentor.nama?.charAt(0) || "M"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {mentor.nama}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {mentor.jabatan || "Pembimbing Lapangan Dinas"}
                    </p>

                    <div className="mt-3 space-y-1 text-[11px]">
                      {mentor.email && (
                        <a
                          href={`mailto:${mentor.email}`}
                          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#004F9F] dark:hover:text-sky-400 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{mentor.email}</span>
                        </a>
                      )}
                      {mentor.no_hp && (
                        <a
                          href={`https://wa.me/${mentor.no_hp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{mentor.no_hp}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  Mentor pembimbing sedang dipersiapkan oleh admin dinas.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">Penempatan: {pendaftaran?.posisi_bidang || "-"}</span>
              <Building2 className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </div>
          </div>

        </div>

        {/* 4 STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {metricCards.map((c, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br ${c.lightGradient} dark:from-slate-900/90 dark:to-slate-900/60 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.25] blur-xl transition-all duration-300 group-hover:opacity-[0.35] group-hover:scale-125`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 truncate">
                    {c.label}
                  </p>
                  <h3 className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {c.value}
                  </h3>
                  <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-snug">
                    {c.caption}
                  </p>
                </div>
                <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-110 ${c.iconBg} ${c.iconColor}`}>
                  <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
            </div>
          ))}
        </div>

        {/* BOTTOM 2-COLUMN: RECENT LEAVES + QUICK ACCESS SHORTCUTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* RECENT LEAVE REQUESTS */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Pengajuan Izin &amp; Sakit Terkini
                  </h3>
                </div>
                <Link
                  to="/peserta/presensi?tab=izin"
                  className="text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  Semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {izinTerkini.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                    <Inbox className="w-7 h-7 mx-auto opacity-40 mb-1.5" />
                    <p className="font-semibold">Belum ada pengajuan izin atau sakit</p>
                    <p className="text-[11px] text-slate-400">Pengajuan yang Anda buat akan muncul di sini.</p>
                  </div>
                ) : (
                  izinTerkini.map((iz) => {
                    const badgeClass =
                      iz.status === "disetujui"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : iz.status === "ditolak"
                        ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300";

                    return (
                      <div
                        key={iz.id}
                        onClick={() => setSelectedIzinDetail(iz)}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 text-xs hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-purple-50/20 cursor-pointer transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {iz.jenis}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 capitalize ${badgeClass}`}>
                              {iz.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {formatTanggalPresensi(iz.tanggal_mulai)} s/d {formatTanggalPresensi(iz.tanggal_selesai)}
                          </p>
                        </div>

                        <span className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#004F9F] hover:bg-white dark:hover:bg-slate-700 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowIzinModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 transition-all cursor-pointer"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                Buat Pengajuan Baru
              </button>
            )}
          </div>

          {/* QUICK SHORTCUTS & TRANSCRIPT SUMMARY */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#004F9F] dark:text-sky-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Pintasan Cepat &amp; Dokumen Resmi
                  </h3>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Shortcut 1: Presensi */}
                <Link
                  to="/peserta/presensi"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <CalendarDays className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600">
                        Presensi &amp; Izin
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Absen selfie harian
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Shortcut 2: Logbook & Jurnal */}
                <Link
                  to="/peserta/presensi?tab=logbook"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600">
                        Logbook Harian
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Catatan &amp; Cetak PDF
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Shortcut 3: Materi Pembelajaran */}
                <Link
                  to="/peserta/pembelajaran/materi"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-sky-300 dark:hover:border-sky-500/50 hover:bg-sky-50/40 dark:hover:bg-sky-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600">
                        Materi &amp; SOP
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Modul belajar dinas
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Shortcut 4: Tugas Magang */}
                <Link
                  to="/peserta/pembelajaran/tugas"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600">
                        Tugas Magang
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Penugasan mentor
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Shortcut 5: Laporan Akhir Magang */}
                <Link
                  to="/peserta/penilaian/laporan"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600">
                        Laporan Akhir
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Unggah naskah PDF
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* Shortcut 6: Transkrip Nilai & Rapor */}
                <Link
                  to="/peserta/penilaian/rapor"
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600">
                        Rapor &amp; Sertifikat
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Evaluasi 4 pilar kompetensi
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>

              {/* Surat Penerimaan Magang (LoA) Banner jika ada */}
              {pendaftaran?.surat_penerimaan?.file_surat && (
                <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        Surat Penerimaan Magang Resmi (LoA)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        No: {pendaftaran.surat_penerimaan.nomor_surat || "Diterbitkan"}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getFileUrl(pendaftaran.surat_penerimaan.file_surat)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </a>
                </div>
              )}

              {/* Status Transkrip Nilai Banner */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/60 dark:from-slate-800 dark:to-slate-800/60 border border-indigo-100 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Status Evaluasi Akhir:
                    </span>
                  </div>
                  {penilaian ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Skor {penilaian.nilai_akhir_angka} ({penilaian.indeks_nilai_akhir})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Sedang Berjalan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {penilaian
                    ? `Predikat kelulusan: ${penilaian.predikat_akhir || "Memuaskan"}. Transkrip nilai resmi dapat diunduh di menu Transkrip Nilai.`
                    : "Nilai akhir akan diterbitkan oleh mentor pembimbing dinas menjelang masa magang berakhir."}
                </p>
              </div>
            </div>

            <div className="text-[10.5px] text-slate-400 dark:text-slate-500 text-center">
              Dinas Komunikasi dan Informatika — SIM Magang
            </div>
          </div>

        </div>

      </div>

      {/* MODAL ABSENSI KAMERA */}
      {absenModal && (
        <AbsenKameraModal
          jenis={absenModal}
          isDark={isDark}
          onClose={() => setAbsenModal(null)}
          onSuccess={() => {
            setAbsenModal(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* MODAL PENGAJUAN IZIN */}
      {showIzinModal && (
        <FormPengajuanIzinModal
          onClose={() => setShowIzinModal(false)}
          onSaved={() => {
            setShowIzinModal(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* MODAL DETAIL PENGAJUAN IZIN */}
      {selectedIzinDetail && (
        <DetailIzinModal
          data={selectedIzinDetail}
          onClose={() => setSelectedIzinDetail(null)}
          onBatal={async (iz) => {
            const result = await confirmDialog({
              title: "Batalkan pengajuan ini?",
              text: `Pengajuan ${iz.jenis} tanggal ${formatTanggalPresensi(iz.tanggal_mulai)} s.d. ${formatTanggalPresensi(iz.tanggal_selesai)} akan dibatalkan.`,
              confirmText: "Ya, Batalkan",
              danger: true,
            });
            if (!result.isConfirmed) return;

            try {
              await batalkanPengajuanIzin(iz.id);
              toastSuccess("Pengajuan izin berhasil dibatalkan.");
              setSelectedIzinDetail(null);
              setReloadKey((k) => k + 1);
            } catch (err) {
              toastError(err.response?.data?.message || "Gagal membatalkan pengajuan.");
            }
          }}
          readOnly={readOnly}
          dk={isDark}
        />
      )}
    </PesertaLayout>
  );
};

export default PesertaDashboardPage;