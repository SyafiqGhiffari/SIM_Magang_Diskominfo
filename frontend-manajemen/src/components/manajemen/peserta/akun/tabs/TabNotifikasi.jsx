import { useState, useMemo } from "react";
import {
  LogIn,
  LogOut,
  CheckCircle2,
  Clock,
  CalendarClock,
  MessageSquare,
  FileSignature,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  BellRing,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { toastSuccess } from "../../../../../utils/swal";

// ── Komponen Toggle Switch Interaktif & Modern ──
const ToggleSwitch = ({ checked, onChange, label, dk }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`group relative inline-flex h-7 w-[68px] shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-out focus:outline-none active:scale-95 select-none ${
      checked
        ? "bg-emerald-600 shadow-sm"
        : dk
        ? "bg-slate-800 border border-white/10 hover:border-white/20"
        : "bg-slate-300 border border-slate-300/80 hover:border-slate-400"
    }`}
  >
    {/* Text Label AKTIF di dalam track */}
    <span
      className={`absolute left-2.5 text-[8px] sm:text-[8.5px] font-extrabold tracking-wider uppercase transition-all duration-200 select-none ${
        checked ? "opacity-100 translate-x-0 text-white" : "opacity-0 -translate-x-1"
      }`}
    >
      Aktif
    </span>

    {/* Text Label OFF di dalam track */}
    <span
      className={`absolute right-2.5 text-[8px] sm:text-[8.5px] font-extrabold tracking-wider uppercase transition-all duration-200 select-none ${
        !checked ? "opacity-100 translate-x-0 text-slate-500 dark:text-slate-400" : "opacity-0 translate-x-1"
      }`}
    >
      Off
    </span>

    {/* Moving Knob Putih dengan Micro-Icon */}
    <span
      className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        checked ? "translate-x-[40px] text-emerald-600" : "translate-x-0 text-slate-400"
      }`}
    >
      {checked ? (
        <Check className="w-3 h-3 stroke-[2.5] text-emerald-600" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
      )}
    </span>
  </button>
);

const TabNotifikasi = ({ dk, profile }) => {
  // ── Default State Preferensi Notifikasi Valid SIM Magang (Role: Peserta) ──
  const defaultSettings = useMemo(
    () => ({
      // 1. Presensi & Kehadiran Magang
      checkinReminder: true,
      checkoutReminder: true,
      izinStatus: true,

      // 2. Logbook & Komunikasi Bimbingan
      logbookReminder: true,
      logbookVerification: true,
      chatMentor: true,

      // 3. Pembelajaran & Penugasan Magang
      tugasBaru: true,
      tugasFeedback: true,
      tugasDeadline: true,

      // 4. Evaluasi Akhir, Rapor & Sertifikat
      laporanAkhirStatus: true,
      raporNilai: true,
      sertifikatTerbit: true,

      // 5. Keamanan & Akun Peserta
      loginSecurityAlert: true,
      passwordEmailChangeAlert: true,
    }),
    []
  );

  const storageKey = `sim_peserta_notif_settings_${profile?.id || "default"}`;

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }
    return defaultSettings;
  });

  // State untuk animasi button reset default
  const [isResetting, setIsResetting] = useState(false);

  // State untuk collapsible accordion: kolom presensi terbuka secara default
  const [openSections, setOpenSections] = useState({
    presensi: true,
    logbook: false,
    tugas: false,
    evaluasi: false,
    keamanan: false,
  });

  // Toggle buka/tutup satu kategori
  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Toggle switch dengan penyimpanan otomatis (Auto-Save) & sinkronisasi realtime ke Topbar
  const handleToggle = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.setItem("sim_peserta_notif_settings", JSON.stringify(updated));
        window.dispatchEvent(new Event("sim_notif_settings_changed"));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Reset ke pengaturan default rekomendasi dinas dengan animasi interaktif
  const handleResetDefault = () => {
    if (isResetting) return;
    setIsResetting(true);
    setSettings(defaultSettings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
      localStorage.setItem("sim_peserta_notif_settings", JSON.stringify(defaultSettings));
      window.dispatchEvent(new Event("sim_notif_settings_changed"));
      toastSuccess("Pengaturan notifikasi dikembalikan ke default rekomendasi.");
    } catch {
      // ignore
    }
    setTimeout(() => {
      setIsResetting(false);
    }, 600);
  };

  // Hitung metrik aktif
  const totalItems = Object.keys(defaultSettings).length;
  const activeItemsCount = Object.values(settings).filter(Boolean).length;

  // Hitung aktif per kategori
  const presensiActiveCount = [settings.checkinReminder, settings.checkoutReminder, settings.izinStatus].filter(Boolean).length;
  const logbookActiveCount = [settings.logbookReminder, settings.logbookVerification, settings.chatMentor].filter(Boolean).length;
  const tugasActiveCount = [settings.tugasBaru, settings.tugasFeedback, settings.tugasDeadline].filter(Boolean).length;
  const evaluasiActiveCount = [settings.laporanAkhirStatus, settings.raporNilai, settings.sertifikatTerbit].filter(Boolean).length;
  const keamananActiveCount = [settings.loginSecurityAlert, settings.passwordEmailChangeAlert].filter(Boolean).length;

  return (
    <div className="animate-[fadeslide_0.3s_ease-out]">
      {/* ══════════════════════════════════════════════════════════════════════
          SINGLE MAIN CARD ARCHITECTURE (MODERN, BERSIH, & INTERAKTIF)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`rounded-xl sm:rounded-3xl border p-2.5 sm:p-6 shadow-xs space-y-3 sm:space-y-5 transition-colors duration-300 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* ──────────────────────────────────────────────────────────────────
            1. HEADER UTAMA: JUDUL, RESET & BADGE AKTIF (TANPA GARIS PEMISAH)
        ────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md shadow-[#00A5EC]/20">
              <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Pengaturan Notifikasi Lonceng Web
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                <span className="sm:hidden">Kelola preferensi notifikasi lonceng web Anda</span>
                <span className="hidden sm:inline">Kelola kemunculan pemberitahuan aktivitas magang pada ikon lonceng web manajemen</span>
              </p>
            </div>
          </div>

          {/* Header Right Actions: Reset Default dengan Animasi & Badge Aktif (Pojok Kanan Horizontal) */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isResetting}
              title="Kembalikan semua pengaturan ke rekomendasi awal"
              className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-75 select-none"
            >
              <RotateCcw
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-700 ease-in-out ${
                  isResetting
                    ? "-rotate-[360deg] text-blue-600 dark:text-sky-400"
                    : "group-hover:-rotate-45 text-slate-500 dark:text-slate-400"
                }`}
              />
              <span className="transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                {isResetting ? "Mereset..." : "Reset Default"}
              </span>
            </button>

            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeItemsCount} dari {totalItems} Aktif</span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            2. ACCORDION KATEGORI AKTIVITAS DENGAN ANIMASI DROPDOWN HALUS
        ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-2.5 sm:space-y-4">
          {/* ══════════════ ACCORDION 1: PRESENSI & KEHADIRAN ══════════════ */}
          <div
            className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              openSections.presensi
                ? dk
                  ? "bg-white/[0.03] border-white/15 shadow-xs"
                  : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                : dk
                ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggleSection("presensi")}
              className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    Presensi &amp; Kehadiran Harian
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Kehadiran
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  <span className="sm:hidden">Pengingat absensi masuk, pulang &amp; izin</span>
                  <span className="hidden sm:inline">Peringatan absensi masuk, jam pulang, dan status verifikasi izin</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {presensiActiveCount}/3 Aktif
                </span>
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                    openSections.presensi ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </button>

            {/* Content Accordion dengan Animasi Dropdown Halus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                openSections.presensi
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                  {/* 1. Check-in Pagi */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Pengingat Presensi Masuk Pagi
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            07:30 - 08:00 WIB
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pukul 07:30 - 08:00 WIB untuk presensi masuk dinas.</span>
                          <span className="hidden sm:inline">Peringatan otomatis pukul 07:30 - 08:00 WIB untuk presensi selfie &amp; geotagging di Gedung Diskominfo.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        07:30 - 08:00 WIB
                      </span>
                      <ToggleSwitch
                        checked={settings.checkinReminder}
                        onChange={() => handleToggle("checkinReminder")}
                        label="Toggle Presensi Masuk"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 2. Check-out Sore */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Pengingat Presensi Pulang Sore
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            16:00 WIB
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pukul 16:00 WIB untuk presensi kepulangan dinas.</span>
                          <span className="hidden sm:inline">Peringatan tepat pukul 16:00 WIB untuk melakukan presensi kepulangan sebelum meninggalkan kantor dinas.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        16:00 WIB
                      </span>
                      <ToggleSwitch
                        checked={settings.checkoutReminder}
                        onChange={() => handleToggle("checkoutReminder")}
                        label="Toggle Presensi Pulang"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 3. Status Verifikasi Izin / Sakit */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Status Verifikasi Pengajuan Izin / Sakit
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Realtime Alert
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Notifikasi persetujuan / penolakan izin &amp; surat sakit.</span>
                          <span className="hidden sm:inline">Pemberitahuan seketika saat surat izin atau keterangan dokter disetujui atau ditolak admin/mentor.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Realtime Alert
                      </span>
                      <ToggleSwitch
                        checked={settings.izinStatus}
                        onChange={() => handleToggle("izinStatus")}
                        label="Toggle Status Izin"
                        dk={dk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ ACCORDION 2: LOGBOOK & BIMBINGAN ══════════════ */}
          <div
            className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              openSections.logbook
                ? dk
                  ? "bg-white/[0.03] border-white/15 shadow-xs"
                  : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                : dk
                ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggleSection("logbook")}
              className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    Logbook &amp; Bimbingan Mentor
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Bimbingan
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  <span className="sm:hidden">Jurnal harian, validasi &amp; pesan mentor</span>
                  <span className="hidden sm:inline">Peringatan pengisian jurnal harian, validasi pembimbing, dan koordinasi pesan</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {logbookActiveCount}/3 Aktif
                </span>
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                    openSections.logbook ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </button>

            {/* Content Accordion dengan Animasi Dropdown Halus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                openSections.logbook
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                  {/* 1. Pengingat Logbook */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Pengingat Pengisian Logbook Harian
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            16:30 WIB
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pukul 16:30 WIB jika uraian aktivitas harian belum diisi.</span>
                          <span className="hidden sm:inline">Kirim pengingat sore hari pukul 16:30 WIB jika uraian aktivitas &amp; dokumentasi belum diisi.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        16:30 WIB
                      </span>
                      <ToggleSwitch
                        checked={settings.logbookReminder}
                        onChange={() => handleToggle("logbookReminder")}
                        label="Toggle Pengingat Logbook"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 2. Verifikasi & Catatan Revisi */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <FileSignature className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Verifikasi &amp; Catatan Revisi Logbook
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Review Mentor
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pemberitahuan saat mentor memvalidasi logbook.</span>
                          <span className="hidden sm:inline">Pemberitahuan instan saat mentor memvalidasi logbook atau menyematkan catatan arahan bimbingan.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Review Mentor
                      </span>
                      <ToggleSwitch
                        checked={settings.logbookVerification}
                        onChange={() => handleToggle("logbookVerification")}
                        label="Toggle Verifikasi Logbook"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 3. Chat Mentor */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Pesan Masuk dari Mentor (Modul Chat)
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Pesan Langsung
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Notifikasi pesan koordinasi langsung dari pembimbing.</span>
                          <span className="hidden sm:inline">Notifikasi saat mentor mengirim pesan koordinasi atau instruksi teknis langsung di modul percakapan.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Pesan Langsung
                      </span>
                      <ToggleSwitch
                        checked={settings.chatMentor}
                        onChange={() => handleToggle("chatMentor")}
                        label="Toggle Chat Mentor"
                        dk={dk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ ACCORDION 3: PEMBELAJARAN & TUGAS ══════════════ */}
          <div
            className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              openSections.tugas
                ? dk
                  ? "bg-white/[0.03] border-white/15 shadow-xs"
                  : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                : dk
                ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggleSection("tugas")}
              className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    Pembelajaran &amp; Penugasan Magang
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Penugasan
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  <span className="sm:hidden">Penugasan materi, evaluasi &amp; deadline</span>
                  <span className="hidden sm:inline">Instruksi tugas materi, evaluasi review nilai, dan peringatan batas waktu</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {tugasActiveCount}/3 Aktif
                </span>
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                    openSections.tugas ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </button>

            {/* Content Accordion dengan Animasi Dropdown Halus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                openSections.tugas
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                  {/* 1. Tugas Baru */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Penugasan Tugas Baru dari Mentor
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Materi &amp; Praktik
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pemberitahuan materi dan tugas praktik baru.</span>
                          <span className="hidden sm:inline">Pemberitahuan saat mentor mempublikasikan materi atau instruksi tugas praktik baru.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Materi &amp; Praktik
                      </span>
                      <ToggleSwitch
                        checked={settings.tugasBaru}
                        onChange={() => handleToggle("tugasBaru")}
                        label="Toggle Tugas Baru"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 2. Review Nilai & Feedback */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Review &amp; Feedback Nilai Tugas
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Evaluasi Nilai
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pemberitahuan nilai evaluasi dan review dari mentor.</span>
                          <span className="hidden sm:inline">Pemberitahuan saat hasil pengerjaan tugas Anda telah diperiksa dan diberi nilai evaluasi oleh mentor.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Evaluasi Nilai
                      </span>
                      <ToggleSwitch
                        checked={settings.tugasFeedback}
                        onChange={() => handleToggle("tugasFeedback")}
                        label="Toggle Feedback Tugas"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 3. Deadline Tugas */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Peringatan Batas Waktu Tugas (Deadline)
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            H-24 Jam &amp; H-3 Jam
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Peringatan H-24 jam &amp; H-3 jam batas waktu pengumpulan tugas.</span>
                          <span className="hidden sm:inline">Peringatan 24 jam dan 3 jam sebelum batas akhir pengumpulan dokumen / proyek tugas berakhir.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        H-24 Jam &amp; H-3 Jam
                      </span>
                      <ToggleSwitch
                        checked={settings.tugasDeadline}
                        onChange={() => handleToggle("tugasDeadline")}
                        label="Toggle Deadline Tugas"
                        dk={dk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ ACCORDION 4: EVALUASI, RAPOR & SERTIFIKAT ══════════════ */}
          <div
            className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              openSections.evaluasi
                ? dk
                  ? "bg-white/[0.03] border-white/15 shadow-xs"
                  : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                : dk
                ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggleSection("evaluasi")}
              className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    Evaluasi Akhir, Rapor &amp; Sertifikat
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Kelulusan
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  <span className="sm:hidden">Laporan akhir, nilai rapor &amp; e-sertifikat</span>
                  <span className="hidden sm:inline">Status naskah laporan akhir, transkrip nilai 4 pilar, dan penerbitan e-sertifikat TTE</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {evaluasiActiveCount}/3 Aktif
                </span>
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                    openSections.evaluasi ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </button>

            {/* Content Accordion dengan Animasi Dropdown Halus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                openSections.evaluasi
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                  {/* 1. Status Laporan Akhir */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Status Verifikasi Laporan Akhir Magang
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Naskah Akhir
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Status persetujuan naskah atau catatan revisi laporan akhir.</span>
                          <span className="hidden sm:inline">Pemberitahuan persetujuan naskah atau catatan perbaikan laporan akhir dari pembimbing lapangan.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Naskah Akhir
                      </span>
                      <ToggleSwitch
                        checked={settings.laporanAkhirStatus}
                        onChange={() => handleToggle("laporanAkhirStatus")}
                        label="Toggle Laporan Akhir"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 2. Rapor Nilai */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Transkrip Rapor Magang Diterbitkan
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            4 Pilar Kompetensi
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pemberitahuan saat transkrip nilai 4 pilar kompetensi terbit.</span>
                          <span className="hidden sm:inline">Pemberitahuan saat pembimbing merampungkan penilaian 4 pilar kompetensi dan predikat kelulusan.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        4 Pilar Kompetensi
                      </span>
                      <ToggleSwitch
                        checked={settings.raporNilai}
                        onChange={() => handleToggle("raporNilai")}
                        label="Toggle Rapor Nilai"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 3. E-Sertifikat TTE */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Penerbitan E-Sertifikat Resmi (TTE)
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            TTE Kepala Dinas
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Pemberitahuan saat e-sertifikat TTE Kepala Dinas siap diunduh.</span>
                          <span className="hidden sm:inline">Pemberitahuan saat sertifikat magang resmi ber-TTE Kepala Dinas Kominfo telah terbit dan siap diunduh.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        TTE Kepala Dinas
                      </span>
                      <ToggleSwitch
                        checked={settings.sertifikatTerbit}
                        onChange={() => handleToggle("sertifikatTerbit")}
                        label="Toggle Sertifikat Terbit"
                        dk={dk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ ACCORDION 5: KEAMANAN & AKUN ══════════════ */}
          <div
            className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
              openSections.keamanan
                ? dk
                  ? "bg-white/[0.03] border-white/15 shadow-xs"
                  : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                : dk
                ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggleSection("keamanan")}
              className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    Keamanan &amp; Akun Peserta
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Keamanan
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  <span className="sm:hidden">Alert login perangkat baru &amp; kode OTP</span>
                  <span className="hidden sm:inline">Peringatan sesi masuk perangkat baru dan konfirmasi kode OTP kredensial</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {keamananActiveCount}/2 Aktif
                </span>
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                    openSections.keamanan ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </button>

            {/* Content Accordion dengan Animasi Dropdown Halus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                openSections.keamanan
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                  {/* 1. Login Perangkat Baru */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Peringatan Sesi &amp; Login Perangkat Baru
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            IP &amp; Browser
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Peringatan saat akun diakses di perangkat baru.</span>
                          <span className="hidden sm:inline">Pemberitahuan keamanan via email ketika akun Anda diakses dari alamat IP atau peramban yang tidak dikenali.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        IP &amp; Browser
                      </span>
                      <ToggleSwitch
                        checked={settings.loginSecurityAlert}
                        onChange={() => handleToggle("loginSecurityAlert")}
                        label="Toggle Login Baru"
                        dk={dk}
                      />
                    </div>
                  </div>

                  {/* 2. Ganti Sandi & OTP */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      dk
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                        <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            Konfirmasi Perubahan Sandi &amp; Email (OTP)
                          </span>
                          {/* Badge Desktop */}
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Kode OTP Instan
                          </span>
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                          <span className="sm:hidden">Kode OTP instan saat pembaharuan sandi / email.</span>
                          <span className="hidden sm:inline">Pengiriman kode OTP instan serta bukti audit saat terjadi pembaharuan kata sandi atau email login.</span>
                        </p>
                      </div>
                    </div>

                    {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                      <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        Kode OTP Instan
                      </span>
                      <ToggleSwitch
                        checked={settings.passwordEmailChangeAlert}
                        onChange={() => handleToggle("passwordEmailChangeAlert")}
                        label="Toggle OTP Sandi"
                        dk={dk}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            3. FOOTER AKSI: STATUS AUTO-SAVE REALTIME
        ────────────────────────────────────────────────────────────────── */}
        <div className="pt-1 flex items-center justify-between text-[9.5px] sm:text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <span className="sm:hidden">Perubahan otomatis tersimpan realtime.</span>
              <span className="hidden sm:inline">Perubahan otomatis tersimpan dan disinkronkan langsung ke lonceng web.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNotifikasi;
