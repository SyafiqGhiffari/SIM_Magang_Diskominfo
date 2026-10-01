import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  History,
  LogIn,
  KeyRound,
  MailCheck,
  Smartphone,
  Monitor,
  CheckCircle2,
  Lock,
  Search,
  Inbox,
  Mail,
} from "lucide-react";

// Pure Format Helpers
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

const formatRelativeTime = (dateStr, nowMs) => {
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

export const LogAuditModal = ({
  isOpen,
  onClose,
  dk,
  loginHistories = [],
  passwordLastUpdated,
  userEmail,
  pendaftaran,
  profile,
  deviceInfo,
}) => {
  const [filterType, setFilterType] = useState("all"); // "all" | "login" | "security"
  const [searchFilter, setSearchFilter] = useState("");

  const isDark = dk;
  const emailLoginManajemen =
    profile?.email || userEmail || profile?.pendaftaran?.email || pendaftaran?.email || "-";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  const [sessionStartTime] = useState(() => new Date().toISOString());

  useEffect(() => {
    // Auto-update waktu relatif setiap 10 detik secara realtime tanpa reload
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Build complete list of real audit logs
  const allLogs = useMemo(() => {
    const list = [];

    // 1. Seluruh Riwayat Login dari Database Riil
    if (Array.isArray(loginHistories) && loginHistories.length > 0) {
      loginHistories.forEach((log, index) => {
        const rawIp = log.ip_address || "";
        const isLocalIp = rawIp === "127.0.0.1" || rawIp === "::1" || rawIp.toLowerCase().includes("localhost");
        const displayIp = (!isLocalIp && rawIp) ? rawIp : null;

        list.push({
          id: `login-${log.id || index}`,
          type: "login",
          titleMobile: index === 0 ? "Sesi Login Aktif" : "Riwayat Login",
          titleDesktop: index === 0 ? "Sesi Login Aktif Saat Ini" : "Riwayat Autentikasi Sesi Login",
          timestamp: log.created_at,
          timeStr: formatDateTimeIndo(log.created_at),
          relativeTime: formatRelativeTime(log.created_at, nowTick),
          ip: displayIp,
          browserMobile: log.browser || "Browser Web",
          browserDesktop: log.browser || "Browser Web",
          device: log.device || (log.is_mobile ? "Smartphone Mobile" : "Komputer Windows"),
          isMobile: Boolean(log.is_mobile),
          isCurrent: index === 0,
          status: index === 0 ? "Sesi Aktif" : "Selesai",
          category: "Autentikasi Login",
          description:
            index === 0
              ? "Sesi autentikasi aktif saat ini sedang tersambung ke portal SIM Magang"
              : "Autentikasi berhasil dan sesi telah ditutup dengan aman",
        });
      });
    } else {
      list.push({
        id: "login-current-fallback",
        type: "login",
        titleMobile: "Sesi Login Aktif",
        titleDesktop: "Sesi Login Aktif Saat Ini",
        timestamp: sessionStartTime,
        timeStr: "Sesi Saat Ini",
        relativeTime: formatRelativeTime(sessionStartTime, nowTick),
        ip: null,
        browserMobile: deviceInfo?.browser || "Google Chrome",
        browserDesktop: deviceInfo?.browser || "Google Chrome",
        device: deviceInfo?.device || "Komputer Windows",
        isMobile: false,
        isCurrent: true,
        status: "Sesi Aktif",
        category: "Autentikasi Login",
        description: "Sesi login aktif saat ini terverifikasi aman melalui portal SIM Magang",
      });
    }

    // 2. Log Pembaruan Kredensial Kata Sandi
    const passwordChangedAt =
      passwordLastUpdated ||
      profile?.password_changed_at ||
      null;

    if (passwordChangedAt) {
      list.push({
        id: "pwd-log-latest",
        type: "security",
        titleMobile: "Pembaruan Sandi",
        titleDesktop: "Pembaruan Kredensial Kata Sandi",
        timestamp: passwordChangedAt,
        timeStr: formatDateTimeIndo(passwordChangedAt),
        relativeTime: formatRelativeTime(passwordChangedAt, nowTick),
        ip: null,
        browserMobile: "Autentikasi Akun",
        browserDesktop: "Autentikasi Kredensial Akun",
        device: "Portal SIM Magang Diskominfo",
        isMobile: false,
        isCurrent: false,
        status: "Tervalidasi",
        category: "Kredensial Sandi",
        description: "Kredensial kata sandi akun berhasil diperbarui dan tervalidasi dengan aman",
      });
    }

    // 2b. Log Pembuatan Kata Sandi Awal / Akun Magang
    const initialPwdDate = profile?.created_at || pendaftaran?.created_at;
    if (initialPwdDate) {
      list.push({
        id: "pwd-log-initial",
        type: "security",
        titleMobile: "Kata Sandi Awal",
        titleDesktop: "Pembuatan Kata Sandi Awal Akun",
        timestamp: initialPwdDate,
        timeStr: formatDateTimeIndo(initialPwdDate),
        relativeTime: formatRelativeTime(initialPwdDate, nowTick),
        ip: null,
        browserMobile: "Aktivasi Akun",
        browserDesktop: "Sistem Registrasi SIM Magang",
        device: "Portal SIM Magang",
        isMobile: false,
        isCurrent: false,
        status: "Tervalidasi",
        category: "Kredensial Sandi",
        description: "Kata sandi akun pertama kali dibuat dan diamankan saat aktivasi akun magang",
      });
    }

    // 3. Log Verifikasi Email Akun
    if (emailLoginManajemen && emailLoginManajemen !== "-") {
      const regDate = profile?.created_at || pendaftaran?.created_at;
      list.push({
        id: "email-log-active",
        type: "security",
        titleMobile: "Verifikasi Email",
        titleDesktop: "Verifikasi Alamat Email Akun",
        timestamp: regDate,
        timeStr: regDate ? formatDateTimeIndo(regDate) : "Terverifikasi",
        relativeTime: regDate ? formatRelativeTime(regDate, nowTick) : "Terdaftar",
        ip: null,
        browserMobile: "OTP 6 Digit",
        browserDesktop: "Verifikasi OTP 6 Digit",
        device: emailLoginManajemen,
        isMobile: false,
        isCurrent: false,
        status: "Terverifikasi",
        category: "Email & Pemulihan",
        description: `Alamat email ${emailLoginManajemen} terdaftar aktif untuk autentikasi dan pemulihan akun`,
      });

      // 3b. Log Pendaftaran Awal jika berbeda tanggal
      if (pendaftaran?.created_at && profile?.created_at && pendaftaran.created_at !== profile.created_at) {
        list.push({
          id: "email-log-initial",
          type: "security",
          titleMobile: "Pendaftaran Email",
          titleDesktop: "Pendaftaran Berkas Akun Magang",
          timestamp: pendaftaran.created_at,
          timeStr: formatDateTimeIndo(pendaftaran.created_at),
          relativeTime: formatRelativeTime(pendaftaran.created_at, nowTick),
          ip: null,
          browserMobile: "Form Pendaftaran",
          browserDesktop: "Portal Pendaftaran Seleksi Magang",
          device: pendaftaran?.email || emailLoginManajemen,
          isMobile: false,
          isCurrent: false,
          status: "Terverifikasi",
          category: "Email & Pemulihan",
          description: "Pengajuan berkas pendaftaran magang dengan email resmi terdaftar",
        });
      }
    }

    return list;
  }, [loginHistories, passwordLastUpdated, emailLoginManajemen, pendaftaran, profile, deviceInfo, nowTick, sessionStartTime]);

  // Hitung jumlah kategori log untuk badge tab
  const loginCount = useMemo(() => allLogs.filter((l) => l.type === "login").length, [allLogs]);
  const secCount = useMemo(() => allLogs.filter((l) => l.type === "security").length, [allLogs]);

  // Filter & Search
  const filteredLogs = useMemo(() => {
    let result = allLogs;
    if (filterType === "login") result = result.filter((l) => l.type === "login");
    if (filterType === "security") result = result.filter((l) => l.type === "security");

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (l) =>
          l.titleDesktop.toLowerCase().includes(q) ||
          l.titleMobile.toLowerCase().includes(q) ||
          l.browserDesktop.toLowerCase().includes(q) ||
          (l.device && l.device.toLowerCase().includes(q)) ||
          (l.ip && l.ip.toLowerCase().includes(q)) ||
          l.timeStr.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allLogs, filterType, searchFilter]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm p-2.5 sm:p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
      style={{ margin: 0 }}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm sm:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.25s_ease-out] max-h-[90vh] flex flex-col my-auto ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL KHUSUS LOG AUDIT KEAMANAN ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-6 sm:py-5 shrink-0 text-white">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          <History
            className="absolute right-7 sm:right-12 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 opacity-[0.06] text-white pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Icon Box Header Log Keamanan (Warna Putih Bersih Desktop & Mobile) */}
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/15 border border-white/25 shadow-md backdrop-blur-xs text-white">
                <History className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-[11.5px] sm:text-base font-black text-white truncate">
                    <span className="sm:hidden">Log Keamanan Akun</span>
                    <span className="hidden sm:inline">Riwayat Log Aktivitas Keamanan</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold text-emerald-300 shrink-0">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Audit Log
                  </span>
                </div>

                {emailLoginManajemen && emailLoginManajemen !== "-" && (
                  <p className="flex items-center gap-1 mt-0.5 text-[8.5px] sm:text-[11px] text-white/80 truncate max-w-[200px] sm:max-w-[360px]">
                    <Mail className="w-2 h-2 sm:w-3 sm:h-3 text-white/90 shrink-0" />
                    <span className="truncate">{emailLoginManajemen}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-6.5 w-6.5 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* ── SUB-HEADER TOOLBAR: FILTER & CARI (LURUS & SEJAJAR PRESISI DI MOBILE MAUPUN DESKTOP) ── */}
        <div
          className={`flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-6 py-1.5 sm:py-2.5 border-b shrink-0 ${
            isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
          }`}
        >
          {/* Tabs Kategori Filter (Sisi Kiri: Lurus Presisi & Tidak Terpotong di Mobile) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto min-w-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`h-7 sm:h-8 px-2 sm:px-3.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl text-[8.5px] sm:text-xs font-bold leading-none transition-all duration-200 cursor-pointer shrink-0 ${
                filterType === "all"
                  ? "bg-[#004F9F] text-white shadow-xs scale-100"
                  : isDark
                  ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
              }`}
            >
              Semua ({allLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("login")}
              className={`h-7 sm:h-8 px-2 sm:px-3.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl text-[8.5px] sm:text-xs font-bold leading-none transition-all duration-200 cursor-pointer shrink-0 ${
                filterType === "login"
                  ? "bg-[#004F9F] text-white shadow-xs scale-100"
                  : isDark
                  ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Login ({loginCount})</span>
              <span className="hidden sm:inline">Riwayat Login ({loginCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("security")}
              className={`h-7 sm:h-8 px-2 sm:px-3.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl text-[8.5px] sm:text-xs font-bold leading-none transition-all duration-200 cursor-pointer shrink-0 ${
                filterType === "security"
                  ? "bg-[#004F9F] text-white shadow-xs scale-100"
                  : isDark
                  ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
              }`}
            >
              <span className="sm:hidden">Sandi ({secCount})</span>
              <span className="hidden sm:inline">Sandi &amp; Email ({secCount})</span>
            </button>
          </div>

          {/* Search Box (Pojok Kanan Sejajar: Tinggi & Bentuk Lurus Rata dengan Tab) */}
          <div className="w-28 xs:w-32 sm:w-56 shrink-0 flex items-center">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari..."
                className={`h-7 sm:h-8 w-full rounded-lg sm:rounded-xl border pl-6 sm:pl-8 pr-2 sm:pr-3 text-[8.5px] sm:text-xs font-medium leading-none outline-none transition-all duration-200 box-border ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333]"
                    : "border-slate-200 bg-white text-slate-700 focus:border-[#004F9F]"
                }`}
              />
            </div>
          </div>
        </div>

        {/* ── BODY MODAL: DAFTAR KARTU RIWAYAT AUDIT ── */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-1.5 sm:space-y-2">
          {filteredLogs.length === 0 ? (
            <div
              key={`empty-${filterType}`}
              className="flex flex-col items-center justify-center gap-2 py-8 sm:py-14 text-center animate-[fadeslide_0.2s_ease-out]"
            >
              <span
                className={`relative flex h-8 w-8 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                }`}
              >
                <Inbox className="w-4 h-4 sm:w-6 sm:h-6" />
              </span>
              <div>
                <p className={`text-[10.5px] sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {searchFilter ? "Tidak ada log audit yang cocok" : "Belum ada catatan aktivitas keamanan"}
                </p>
                <p className="text-[8.5px] sm:text-xs text-slate-400 mt-0.5">
                  {searchFilter
                    ? "Coba gunakan kata kunci pencarian yang lain."
                    : "Aktivitas login dan perubahan sandi akan tercatat di sini."}
                </p>
              </div>
            </div>
          ) : (
            <div
              key={`list-${filterType}`}
              className="space-y-1.5 sm:space-y-2 animate-[fadeslide_0.22s_ease-out]"
            >
              {filteredLogs.map((log) => {
                let IconComponent = LogIn;
                let iconWrapperClass = "";
                let itemBorderClass = "";
                let channelBadgeClass = "";
                let statusBadgeClass = "";
                let ChannelIcon = Monitor;

                if (log.type === "login") {
                  IconComponent = LogIn;
                  ChannelIcon = log.isMobile ? Smartphone : Monitor;
                  if (log.isCurrent) {
                    iconWrapperClass = isDark
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200";
                    itemBorderClass = isDark
                      ? "border-emerald-500/30 bg-emerald-950/15 hover:border-emerald-500/50 hover:bg-emerald-950/25 ring-1 ring-emerald-500/20"
                      : "border-emerald-300/80 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50/70 ring-1 ring-emerald-400/30";
                    channelBadgeClass = isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600";
                    statusBadgeClass = isDark
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200/80";
                  } else {
                    iconWrapperClass = isDark
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-200";
                    itemBorderClass = isDark
                      ? "border-white/10 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-950/10"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20";
                    channelBadgeClass = isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600";
                    statusBadgeClass = isDark
                      ? "bg-slate-700/40 text-slate-300 border border-white/10"
                      : "bg-slate-100 text-slate-600 border border-slate-200/80";
                  }
                } else if (log.category === "Kredensial Sandi" || log.id.startsWith("pwd-")) {
                  IconComponent = KeyRound;
                  ChannelIcon = KeyRound;
                  iconWrapperClass = isDark
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-amber-100 text-amber-700 border border-amber-200";
                  itemBorderClass = isDark
                    ? "border-white/10 bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-950/10"
                    : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/20";
                  channelBadgeClass = isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-700";
                  statusBadgeClass = isDark
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border border-amber-200/80";
                } else if (log.category === "Email & Pemulihan" || log.id.startsWith("email-")) {
                  IconComponent = MailCheck;
                  ChannelIcon = Mail;
                  iconWrapperClass = isDark
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "bg-sky-100 text-sky-700 border border-sky-200";
                  itemBorderClass = isDark
                    ? "border-white/10 bg-white/[0.02] hover:border-sky-500/30 hover:bg-sky-950/10"
                    : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/20";
                  channelBadgeClass = isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600";
                  statusBadgeClass = isDark
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    : "bg-sky-50 text-sky-600 border border-sky-200/80";
                }

                return (
                  <div
                    key={log.id}
                    className={`relative overflow-hidden rounded-lg sm:rounded-2xl border p-2.5 sm:p-4 transition-colors duration-150 ${itemBorderClass}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
                      {/* Left Info: Icon + Title + Timestamp / Deskripsi */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span
                          className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-xl transition-colors duration-150 ${iconWrapperClass}`}
                        >
                          <IconComponent className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <p
                              className={`text-[10px] sm:text-[13px] font-bold leading-tight ${
                                isDark ? "text-slate-100" : "text-[#0B1442]"
                              }`}
                            >
                              <span className="sm:hidden">{log.titleMobile}</span>
                              <span className="hidden sm:inline">{log.titleDesktop}</span>
                            </p>
                            {log.isCurrent && (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.2 rounded-full text-[7px] sm:text-[9.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Sesi Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] sm:text-[10.5px] text-slate-400 flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
                            <span>{log.relativeTime}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{log.timeStr}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right Info: Badges IP, Browser, Status */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 shrink-0">
                        {log.ip && (
                          <span
                            className={`inline-flex items-center gap-0.5 sm:gap-1 rounded px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10px] font-mono font-bold ${
                              isDark
                                ? "bg-white/5 text-slate-300 border border-white/10"
                                : "bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-400" />
                            <span>{log.ip}</span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-0.5 sm:gap-1 rounded px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10.5px] font-bold ${channelBadgeClass}`}
                        >
                          <ChannelIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          <span className="sm:hidden">{log.browserMobile}</span>
                          <span className="hidden sm:inline">{log.browserDesktop}</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-0.5 sm:gap-1 rounded px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10.5px] font-bold ${statusBadgeClass}`}
                        >
                          <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          <span>{log.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER MODAL (Persis Presensi Modal) ── */}
        <div
          className={`flex items-center justify-between border-t px-2.5 sm:px-6 py-2 sm:py-3 shrink-0 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          <p className={`text-[8.5px] sm:text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"} truncate mr-2`}>
            <span className="sm:hidden">Log autentikasi &amp; keamanan akun.</span>
            <span className="hidden sm:inline">Menampilkan riwayat aktivitas &amp; log autentikasi keamanan akun.</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md sm:rounded-xl border px-2.5 py-1 sm:px-4 sm:py-2 text-[9.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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

export default LogAuditModal;
