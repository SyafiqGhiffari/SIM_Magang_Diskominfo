import { useState, useMemo, useEffect } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Monitor,
  RefreshCw,
  Mail,
  History,
  Smartphone,
  LogIn,
  MailCheck,
  ShieldCheck,
  Fingerprint,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { toastSuccess } from "../../../../utils/swal";
import LogAuditModal from "./LogAuditModal";

const formatRelativeLoginTime = (dateStr, nowMs) => {
  if (!dateStr) return "Baru saja";
  try {
    const prevDate = new Date(dateStr);
    const prevMs = prevDate.getTime();
    if (isNaN(prevMs)) return "Baru saja";
    const currentMs = typeof nowMs === "number" ? nowMs : prevMs;
    const diffMs = currentMs - prevMs;
    if (diffMs < 0) return "Baru saja";

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} jam yang lalu`;
    const diffDays = Math.floor(diffMinutes / 1440);
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return prevDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Baru saja";
  }
};

const formatDateTimeIndo = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const PanduanKeamananCard = ({ dk }) => {
  return (
    <div
      id="card-panduan-keamanan"
      className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-3.5 sm:space-y-4.5 transition-all duration-300 ${
        dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
      }`}
    >
      {/* Header Card */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <span className="flex h-8.5 w-8.5 sm:h-10.5 sm:w-10.5 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              <span className="sm:hidden">Panduan Keamanan</span>
              <span className="hidden sm:inline">Panduan Keamanan</span>
            </h4>
            <p className="text-[9px] sm:text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
              <span className="sm:hidden">SOP perlindungan akun &amp; kredensial</span>
              <span className="hidden sm:inline">Standar operasional perlindungan data &amp; kredensial akun SIM Magang</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0 shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-[#004F9F] dark:text-sky-400" />
          <span>Pedoman Akun</span>
        </span>
      </div>

      {/* Grid 3 Kartu Panduan Interaktif */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* ITEM 1: Rahasia Kredensial & OTP */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between ${
            dk
              ? "bg-white/[0.02] border-white/5 hover:border-amber-500/30 hover:bg-amber-950/10"
              : "bg-slate-50/80 border-slate-200/70 hover:border-amber-300 hover:bg-amber-50/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Kerahasiaan
              </span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
              Rahasia Kredensial &amp; OTP
            </h5>
            <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Jangan pernah membagikan kata sandi atau kode OTP 6 digit kepada siapa pun, termasuk pihak dinas.
            </p>
          </div>
        </div>

        {/* ITEM 2: Sesi di Komputer Publik */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between ${
            dk
              ? "bg-white/[0.02] border-white/5 hover:border-sky-500/30 hover:bg-sky-950/10"
              : "bg-slate-50/80 border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0">
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                Perangkat
              </span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
              Akses Komputer Publik
            </h5>
            <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Selalu klik Logout dan hindari simpan sandi otomatis saat login di komputer kampus atau umum.
            </p>
          </div>
        </div>

        {/* ITEM 3: Rotasi Sandi & Verifikasi */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between ${
            dk
              ? "bg-white/[0.02] border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/10"
              : "bg-slate-50/80 border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Berkala
              </span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
              Rotasi Kata Sandi
            </h5>
            <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Perbarui kata sandi secara berkala dengan kombinasi yang kuat demi menjaga keamanan akun.
            </p>
          </div>
        </div>
      </div>

      {/* Banner Bantuan Keamanan */}
      <div
        className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-2xl border flex items-center gap-2.5 sm:gap-3 text-[9px] sm:text-[11px] ${
          dk
            ? "bg-gradient-to-r from-[#00A5EC]/10 via-white/[0.02] to-transparent border-[#00A5EC]/20 text-slate-300"
            : "bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white border-blue-200/80 text-slate-700"
        }`}
      >
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#004F9F] dark:text-sky-400 shrink-0" />
        <p className="leading-snug">
          Mencurigai adanya aktivitas asing pada akun Anda? Segera ubah kata sandi di atas atau hubungi Administrator Dinas Kominfo Kabupaten Ponorogo.
        </p>
      </div>
    </div>
  );
};

export const TabKeamanan = ({
  dk,
  profile,
  pendaftaran,
  lastPasswordUpdateText,
  passwordLastUpdated,
  passwordForm,
  setPasswordForm,
  showOld,
  setShowOld,
  showNew,
  setShowNew,
  showConfirm,
  setShowConfirm,
  passwordStrength,
  savingPassword,
  handleGantiPassword,
  handleLupaPasswordClick,
  handleOpenGantiEmailModal,
  deviceInfo,
  loginHistories = [],
}) => {
  const userEmail = profile?.email || pendaftaran?.email || profile?.pendaftaran?.email || "-";
  const [copiedKey, setCopiedKey] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // ── Auto-update realtime interval untuk batch waktu relatif tanpa reload browser ──
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [sessionStartTime] = useState(() => new Date().toISOString());

  useEffect(() => {
    // Jalankan timer setiap 10 detik agar transisi menit/jam berlangsung realtime dan presisi
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ── Hitung Waktu Pembaruan Password Dinamis & Realtime ──
  const passwordChangedAt =
    passwordLastUpdated ||
    profile?.password_changed_at ||
    null;

  const displayPasswordUpdateText = useMemo(() => {
    if (passwordChangedAt) {
      return formatRelativeLoginTime(passwordChangedAt, nowTick);
    }
    if (lastPasswordUpdateText && lastPasswordUpdateText !== "Terproteksi") {
      return lastPasswordUpdateText;
    }
    return "Belum diubah";
  }, [passwordChangedAt, nowTick, lastPasswordUpdateText]);

  const handleCopyEmail = (text, key) => {
    if (!text || text === "-") return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toastSuccess("Alamat email berhasil disalin!");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // ── Derived State: Sesi Aktif Saat Ini & Riwayat Sesi Sebelumnya dari Database Riil ──
  const sessionData = useMemo(() => {
    const isMobileClient =
      typeof window !== "undefined"
        ? /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "")
        : false;
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    // Ambil data riwayat login dari database
    const currentLog = loginHistories && loginHistories.length > 0 ? loginHistories[0] : null;
    const previousLog = loginHistories && loginHistories.length > 1 ? loginHistories[1] : null;

    // Sesi 1: Sesi aktif saat ini
    const currentTitle =
      currentLog?.browser && currentLog?.device
        ? `${currentLog.browser} di ${currentLog.device}`
        : `${deviceInfo?.browser || "Google Chrome"} di ${
            deviceInfo?.device || (isMobileClient ? "Smartphone Mobile" : "Komputer Windows")
          }`;

    const currentIsMobile = currentLog ? Boolean(currentLog.is_mobile) : isMobileClient;

    // Sesi 2: Sesi login riwayat sebelumnya (100% dari database riil)
    const hasPreviousLog = Boolean(previousLog);
    const previousTitle =
      hasPreviousLog && previousLog?.browser && previousLog?.device
        ? `${previousLog.browser} di ${previousLog.device}`
        : "Belum Ada Sesi Sebelumnya";

    const previousTimeText = hasPreviousLog
      ? `Terakhir aktif: ${formatRelativeLoginTime(previousLog.created_at, nowTick)}`
      : "Belum ada catatan login sebelum sesi ini";

    const previousIsMobile = hasPreviousLog ? Boolean(previousLog.is_mobile) : !currentIsMobile;

    return {
      current: {
        id: "current_session",
        title: currentTitle,
        location: "Indonesia • Browser Web",
        network: isOffline ? "Terputus (Mode Offline)" : "Aktif Sekarang",
        statusBadge: "Terverifikasi",
        isMobile: currentIsMobile,
      },
      previous: {
        id: "previous_session",
        title: previousTitle,
        location: hasPreviousLog ? "Indonesia • Sesi Telah Ditutup" : "Akun Baru / Login Perdana",
        network: previousTimeText,
        statusBadge: hasPreviousLog ? "Selesai" : "Info",
        isMobile: previousIsMobile,
        hasRecord: hasPreviousLog,
      },
    };
  }, [deviceInfo, loginHistories, nowTick]);

  // ── Derived State: Riwayat Aktivitas Keamanan dari Database Riil & Akun ──
  const securityActivities = useMemo(() => {
    const list = [];

    // 1. Logins dari database riil (ambil maksimal 2 login terbaru agar card tetap pas 4 baris)
    if (Array.isArray(loginHistories) && loginHistories.length > 0) {
      loginHistories.slice(0, 2).forEach((log, index) => {
        // Jangan gunakan IP lokal / loopback seperti 127.0.0.1
        const rawIp = log.ip_address || "";
        const isLocalIp = rawIp === "127.0.0.1" || rawIp === "::1" || rawIp.toLowerCase().includes("localhost");
        const displayIp = (!isLocalIp && rawIp) ? rawIp : null;

        list.push({
          id: `login-${log.id || index}`,
          title: index === 0 ? "Sesi Login Aktif" : "Riwayat Sesi Login",
          time: formatRelativeLoginTime(log.created_at, nowTick),
          fullTime: formatDateTimeIndo(log.created_at),
          ip: displayIp,
          browser: log.browser || "Browser Web",
          device: log.device || (log.is_mobile ? "Smartphone Mobile" : "Komputer Windows"),
          isMobile: Boolean(log.is_mobile),
          statusBadge: index === 0 ? "Aktif" : "Selesai",
          type: "login",
          isCurrent: index === 0,
        });
      });
    } else {
      // Fallback jika belum ada login history di database
      list.push({
        id: "login-current",
        title: "Sesi Login Aktif",
        time: formatRelativeLoginTime(sessionStartTime, nowTick),
        fullTime: "Sesi saat ini",
        ip: null,
        browser: deviceInfo?.browser || "Google Chrome",
        device: deviceInfo?.device || "Komputer Windows",
        isMobile: false,
        statusBadge: "Aktif",
        type: "login",
        isCurrent: true,
      });
    }

    // 2. Log Perubahan / Status Kata Sandi (Tanpa info enkripsi mentah)
    list.push({
      id: "pwd-update",
      title: "Pembaruan Kata Sandi",
      time: displayPasswordUpdateText,
      fullTime: passwordChangedAt ? formatDateTimeIndo(passwordChangedAt) : "Sandi aktif",
      ip: null,
      browser: "Autentikasi Akun",
      device: "Portal SIM Magang",
      statusBadge: passwordChangedAt ? "Tervalidasi" : "Standar",
      isMobile: false,
      type: "password",
      isCurrent: false,
    });

    // 3. Log Verifikasi Email Akun
    if (userEmail && userEmail !== "-") {
      const regDate = profile?.created_at || pendaftaran?.created_at;
      list.push({
        id: "email-verified",
        title: "Verifikasi Email Akun",
        time: regDate ? formatRelativeLoginTime(regDate, nowTick) : "Terverifikasi",
        fullTime: regDate ? formatDateTimeIndo(regDate) : "Terverifikasi",
        ip: null,
        browser: "Verifikasi OTP",
        device: "Email Terdaftar",
        statusBadge: "Terverifikasi",
        isMobile: false,
        type: "email",
        isCurrent: false,
      });
    }

    return list;
  }, [loginHistories, displayPasswordUpdateText, passwordChangedAt, userEmail, pendaftaran, profile, deviceInfo, nowTick, sessionStartTime]);

  // ── Buka Modal Khusus Semua Log Audit ──
  const handleViewAllLogs = () => {
    setShowLogModal(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 items-start animate-[fadeslide_0.3s_ease-out]">
        {/* ══════════════════════════════════════════════════════════════════════
            KOLOM KIRI (60% Desktop): Ubah Kata Sandi & Kelola Alamat Email
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
        {/* CARD 1: Ubah Kata Sandi */}
        <div
          className={`rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
          }`}
        >
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  Ubah Kata Sandi
                </h4>
                <p className="text-[9px] sm:text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
                  <span className="sm:hidden">Proteksi keamanan sandi akun</span>
                  <span className="hidden sm:inline">Pastikan kata sandi Anda kuat untuk melindungi portal akun SIM Magang</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs transition-all duration-300">
              Update: {displayPasswordUpdateText}
            </span>
          </div>

          {/* Form Ubah Password */}
          <form onSubmit={handleGantiPassword} className="space-y-2.5 sm:space-y-4">
            {/* Field 1: Kata Sandi Saat Ini */}
            <div>
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kata Sandi Saat Ini
                </label>
                <button
                  type="button"
                  onClick={handleLupaPasswordClick}
                  className="text-[9.5px] sm:text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline cursor-pointer transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showOld ? "text" : "password"}
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                  }
                  placeholder="Masukkan kata sandi saat ini"
                  className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-9 sm:pr-11 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC] shadow-2xs transition-all`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 sm:p-1 transition-colors"
                >
                  {showOld ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>

            {/* Field 2: Kata Sandi Baru */}
            <div>
              <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showNew ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Masukkan kata sandi baru Anda"
                  className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-9 sm:pr-11 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC] shadow-2xs transition-all`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 sm:p-1 transition-colors"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              {/* Status & Bar Kekuatan Kata Sandi (Hanya muncul saat mulai mengetik) */}
              {Boolean(passwordForm.newPassword && passwordForm.newPassword.length > 0) && (
                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2.5 animate-[fadeslide_0.25s_ease-out]">
                  <div className="flex items-center justify-between text-[9.5px] sm:text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Kekuatan Sandi:{" "}
                      <span className={`font-bold ${passwordStrength.colorText}`}>
                        {passwordStrength.statusText}
                      </span>
                    </span>
                    <span className={`font-bold ${passwordStrength.colorText}`}>
                      {passwordStrength.percent}%
                    </span>
                  </div>

                  {/* 4-Segmented Progress Bar */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 1
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 2
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 3
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 4
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>

                  {/* Container Checklist Ketentuan 2x2 */}
                  <div
                    className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-2xl border ${
                      dk
                        ? "bg-white/[0.03] border-white/5 text-slate-300"
                        : "bg-slate-50/90 border-slate-100 text-slate-600"
                    } grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 text-[9px] sm:text-xs font-medium`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2
                        className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                          passwordStrength.hasMinLen
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasMinLen ? "text-slate-800 dark:text-slate-100 font-semibold" : ""}>
                        Minimal 8 karakter (terisi {passwordStrength.len})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2
                        className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                          passwordStrength.hasUpperLower
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasUpperLower ? "text-slate-800 dark:text-slate-100 font-semibold" : ""}>
                        Kombinasi Huruf Besar &amp; Kecil
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2
                        className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                          passwordStrength.hasNumber
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasNumber ? "text-slate-800 dark:text-slate-100 font-semibold" : ""}>
                        Mengandung angka (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2
                        className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                          passwordStrength.hasSpecial
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasSpecial ? "text-slate-800 dark:text-slate-100 font-semibold" : ""}>
                        Simbol khusus (!@#$%^&amp;*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Ketik ulang kata sandi baru Anda"
                  className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-9 sm:pr-11 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC] shadow-2xs transition-all`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 sm:p-1 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              {/* Feedback kecocokan kata sandi */}
              {passwordForm.confirmPassword && (
                <div className="mt-1.5 sm:mt-2 animate-[fadeslide_0.2s_ease-out]">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <p className="flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Kata sandi cocok dan tervalidasi</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-semibold text-rose-500">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                      <span>Konfirmasi kata sandi belum sesuai</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Simpan - Posisi Kanan Bawah */}
            <div className="flex justify-end pt-0.5 sm:pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="group/btn inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[10.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? (
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 animate-spin" />
                ) : (
                  <Save className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover/btn:rotate-6" />
                )}
                <span>{savingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: Kelola Alamat Email & Verifikasi OTP (Dibawah Card Ubah Kata Sandi) */}
        <div
          id="card-email-keamanan"
          className={`rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 transition-all duration-500 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  Alamat Email Akun
                </h4>
                <p className="text-[9px] sm:text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
                  <span className="sm:hidden">Email login portal &amp; notifikasi resmi</span>
                  <span className="hidden sm:inline">Kredensial login portal manajemen &amp; penerimaan notifikasi resmi</span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-400/40 shadow-2xs shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Terverifikasi</span>
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* KOTAK EMAIL UTAMA AKUN TERDAFTAR (UNTUK LOGIN & NOTIFIKASI) */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 transition-all ${
                dk
                  ? "bg-gradient-to-r from-sky-950/30 via-white/[0.03] to-transparent border-sky-900/50 ring-1 ring-sky-500/10 shadow-xs"
                  : "bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-white border-blue-200/80 ring-1 ring-blue-500/10 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                      dk
                        ? "bg-gradient-to-br from-sky-950 to-blue-900/60 border-sky-800/60 text-sky-400"
                        : "bg-gradient-to-br from-blue-50 to-sky-100/90 border-blue-200/90 text-[#004F9F]"
                    }`}
                  >
                    <MailCheck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[8.5px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Email Utama Akun
                      </p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-[7.5px] sm:text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Login &amp; Notifikasi
                      </span>
                    </div>
                    <h4 className="text-[11px] sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-snug break-all mt-0.5 select-all font-mono">
                      {userEmail}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyEmail(userEmail, "email")}
                  className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-[#004F9F]/40 text-slate-700 dark:text-slate-300 text-[9.5px] sm:text-[11px] font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Salin alamat email akun"
                >
                  {copiedKey === "email" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-bold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="hidden sm:inline">Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenGantiEmailModal}
            className="w-full group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-xs sm:text-[13px] font-bold shadow-xs hover:shadow-md hover:scale-[1.005] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300 group-hover/btn:rotate-180 transition-transform duration-500 shrink-0" />
            <span className="sm:hidden">Ganti Alamat Email</span>
            <span className="hidden sm:inline">Ganti Alamat Email Akun</span>
          </button>

          <div
            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-center gap-2 sm:gap-2.5 text-[9px] sm:text-[11px] ${
              dk
                ? "bg-white/[0.02] border-white/5 text-slate-400"
                : "bg-slate-50/90 border-slate-200/80 text-slate-600"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
            <p className="leading-snug">
              Pergantian email memerlukan verifikasi <strong>kode OTP 6 digit</strong> yang dikirimkan langsung ke email baru Anda untuk proteksi akun.
            </p>
          </div>
        </div>

        {/* CARD 3: Panduan Keamanan Siber Diskominfo (Desktop: Di Bawah Card Alamat Email) */}
        <div className="hidden lg:block">
          <PanduanKeamananCard dk={dk} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          KOLOM KANAN (40% Desktop): Sesi Login & Riwayat Aktivitas Keamanan
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {/* CARD 4: Sesi & Riwayat Login */}
        <div
          className={`rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
          }`}
        >
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  <span className="sm:hidden">Sesi &amp; Riwayat Login</span>
                  <span className="hidden sm:inline">Sesi &amp; Riwayat Login</span>
                </h4>
                <p className="text-[9px] sm:text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
                  <span className="sm:hidden">Sesi aktif saat ini &amp; riwayat autentikasi akun</span>
                  <span className="hidden sm:inline">Sesi aktif saat ini &amp; riwayat autentikasi akun</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10.5px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs">
              1 Sesi Aktif
            </span>
          </div>

          {/* List Sesi: Aktif Saat Ini & Riwayat Sebelumnya */}
          <div className="space-y-2 sm:space-y-2.5">
            {/* ITEM 1: Sesi Aktif Saat Ini */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 transition-all ${
                dk
                  ? "bg-gradient-to-r from-sky-950/20 via-white/[0.03] to-transparent border-sky-900/50 ring-1 ring-sky-500/10 shadow-xs"
                  : "bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white border-blue-200/80 ring-1 ring-blue-500/10 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      dk
                        ? "bg-blue-950/40 border-blue-900/50 text-sky-400 shadow-2xs"
                        : "bg-blue-50/90 border-blue-200/90 text-[#004F9F] shadow-2xs"
                    }`}
                  >
                    {sessionData.current.isMobile ? (
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                      {sessionData.current.title}
                    </h4>
                    <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug break-words">
                      {sessionData.current.location}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-400/40 text-emerald-700 dark:text-emerald-300 text-[8.5px] sm:text-[10px] font-bold shadow-2xs shrink-0 tracking-wide">
                  Sesi Ini
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1.5 text-[9px] sm:text-[10.5px] border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
                  <span className="text-slate-500 dark:text-slate-400 leading-snug truncate">
                    {sessionData.current.network}
                  </span>
                </div>

                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10.5px] font-bold text-[#004F9F] dark:text-sky-400 shrink-0 ml-1">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#004F9F] dark:text-sky-400 shrink-0" />
                  <span>{sessionData.current.statusBadge}</span>
                </span>
              </div>
            </div>

            {/* ITEM 2: Sesi Login Sebelumnya */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 transition-all ${
                dk
                  ? "bg-white/[0.02] border-white/5"
                  : "bg-slate-50/80 border-slate-200/70"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      dk
                        ? "bg-white/5 border-white/10 text-slate-400"
                        : "bg-slate-100 border-slate-200/90 text-slate-500 shadow-2xs"
                    }`}
                  >
                    {sessionData.previous.isMobile ? (
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                      {sessionData.previous.title}
                    </h4>
                    <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug break-words">
                      {sessionData.previous.location}
                    </p>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-bold bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-white/10 shrink-0 shadow-2xs">
                  {sessionData.previous.statusBadge}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1.5 text-[9px] sm:text-[10.5px] border-t border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400 leading-snug flex-1 min-w-0 truncate">
                  {sessionData.previous.network}
                </span>
                <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                  Nonaktif
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Keamanan Sesi Tunggal */}
          <div
            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-center gap-2 sm:gap-2.5 text-[9px] sm:text-[11px] ${
              dk
                ? "bg-white/[0.02] border-white/5 text-slate-400"
                : "bg-slate-50/90 border-slate-200/80 text-slate-600"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
            <p className="leading-snug">
              <span className="sm:hidden">
                Sistem menerapkan proteksi sesi tunggal (<em>single session</em>) demi menjaga keamanan akun Anda.
              </span>
              <span className="hidden sm:inline">
                Sistem menerapkan proteksi sesi tunggal (<em>single session</em>) demi menjaga keamanan akun Anda dari akses ganda.
              </span>
            </p>
          </div>
        </div>

        {/* CARD 5: Aktivitas Keamanan */}
        <div
          className={`rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
          }`}
        >
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  <span className="sm:hidden">Aktivitas Keamanan</span>
                  <span className="hidden sm:inline">Riwayat Aktivitas Keamanan</span>
                </h4>
                <p className="text-[9px] sm:text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
                  <span className="sm:hidden">Log audit autentikasi</span>
                  <span className="hidden sm:inline">Catatan log audit dan riwayat autentikasi keamanan akun</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0 shadow-2xs">
              Audit Log
            </span>
          </div>

          {/* List Riwayat Log Audit Real */}
          <div className="space-y-2 sm:space-y-2.5">
            {securityActivities.map((act) => {
              let IconComp = KeyRound;
              let iconBg = dk
                ? "bg-amber-950/40 border-amber-900/50 text-amber-400 shadow-2xs"
                : "bg-amber-50/90 border-amber-200/90 text-amber-600 shadow-2xs";

              if (act.type === "login") {
                IconComp = LogIn;
                iconBg = act.isCurrent
                  ? dk
                    ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400 shadow-2xs"
                    : "bg-emerald-50/90 border-emerald-200/90 text-emerald-600 shadow-2xs"
                  : dk
                  ? "bg-indigo-950/40 border-indigo-900/50 text-indigo-400 shadow-2xs"
                  : "bg-indigo-50/90 border-indigo-200/90 text-indigo-600 shadow-2xs";
              } else if (act.type === "email") {
                IconComp = MailCheck;
                iconBg = dk
                  ? "bg-sky-950/40 border-sky-900/50 text-sky-400 shadow-2xs"
                  : "bg-sky-50/90 border-sky-200/90 text-sky-600 shadow-2xs";
              } else if (act.type === "password") {
                IconComp = KeyRound;
                iconBg = dk
                  ? "bg-amber-950/40 border-amber-900/50 text-amber-400 shadow-2xs"
                  : "bg-amber-50/90 border-amber-200/90 text-amber-600 shadow-2xs";
              }

              return (
                <div
                  key={act.id}
                  className={`group/act relative overflow-hidden rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 transition-colors duration-150 ${
                    act.isCurrent
                      ? dk
                        ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-white/[0.02] to-transparent ring-1 ring-emerald-500/20"
                        : "border-emerald-300/90 bg-gradient-to-r from-emerald-50/60 via-slate-50/40 to-white ring-1 ring-emerald-400/30"
                      : dk
                      ? "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                      : "bg-slate-50/70 border-slate-200/70 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Left Icon */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover/act:scale-105 ${iconBg}`}
                    >
                      <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>

                    {/* Content Body */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {act.title}
                          </h4>
                          {act.isCurrent && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Sesi Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[8.5px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 shrink-0 font-bold px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/5">
                          {act.time}
                        </span>
                      </div>

                      {/* Metadata row with clean tags */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                        {act.ip && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/5 font-mono text-[8px] sm:text-[9px] font-bold text-slate-600 dark:text-slate-300">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            {act.ip}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-medium">
                          {act.type === "login" ? (
                            act.isMobile ? (
                              <Smartphone className="w-2.5 h-2.5 text-slate-400" />
                            ) : (
                              <Monitor className="w-2.5 h-2.5 text-slate-400" />
                            )
                          ) : act.type === "email" ? (
                            <Mail className="w-2.5 h-2.5 text-slate-400" />
                          ) : (
                            <KeyRound className="w-2.5 h-2.5 text-slate-400" />
                          )}
                          <span>{act.browser}</span>
                        </span>
                        {act.device && (
                          <span className="truncate max-w-[120px] sm:max-w-[160px] opacity-80">
                            • {act.device}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tombol Lihat Semua Log di Bagian Bawah Sendiri Card */}
          <button
            type="button"
            onClick={handleViewAllLogs}
            className={`w-full group/btn relative overflow-hidden flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-2.5 rounded-xl border text-[10.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer shadow-2xs ${
              dk
                ? "bg-white/5 border-white/10 text-sky-400 hover:bg-[#00A5EC]/15 hover:border-[#00A5EC]/40 hover:text-sky-300"
                : "bg-blue-50/80 border-blue-200/80 text-[#004F9F] hover:bg-blue-100 hover:border-[#004F9F]/40 hover:text-[#003B77]"
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#004F9F] dark:text-sky-400 transition-transform duration-300 group-hover/btn:rotate-45 shrink-0" />
            <span>Lihat Semua Log Audit Keamanan</span>
            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-hover/btn:translate-x-1 shrink-0" />
          </button>
        </div>
      </div>
      </div>

      {/* CARD 3: Panduan Keamanan Siber Diskominfo (Tampilan Mobile: Di Paling Bawah Sendiri) */}
      <div className="block lg:hidden mt-4 sm:mt-6">
        <PanduanKeamananCard dk={dk} />
      </div>

      {/* ── MODAL KHUSUS LOG AUDIT AKTIVITAS KEAMANAN ── */}
      <LogAuditModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        dk={dk}
        loginHistories={loginHistories}
        passwordLastUpdated={passwordLastUpdated}
        userEmail={userEmail}
        pendaftaran={pendaftaran}
        profile={profile}
        deviceInfo={deviceInfo}
      />
    </>
  );
};

export default TabKeamanan;
