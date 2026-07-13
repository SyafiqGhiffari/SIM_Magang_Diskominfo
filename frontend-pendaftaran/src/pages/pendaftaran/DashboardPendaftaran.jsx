import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { logoutPendaftaran } from "../../services/authPendaftaranService";
import { confirmDialog, toastSuccess, toastError, sessionExpiredDialog } from "../../utils/swal";
import { Info, Search, AlertTriangle, PartyPopper, XCircle } from "lucide-react";
import {
  getStatusPendaftaran,
  kirimPendaftaranMagang,
  kirimRevisiDokumen,
  getProfilSaya,
  updateProfil,
  uploadFotoProfil,
  hapusFotoProfil,
  gantiPassword,
  requestGantiEmail,
  verifikasiGantiEmail
} from "../../services/pendaftaranService";

import SidebarPendaftaran from "../../components/pendaftaran/SidebarPendaftaran";
import HeaderPendaftaran from "../../components/pendaftaran/HeaderPendaftaran";
import TabDashboard from "../../components/pendaftaran/TabDashboard";
import TabFormMagang from "../../components/pendaftaran/TabFormMagang";
import TabStatusVerifikasi from "../../components/pendaftaran/TabStatusVerifikasi";
import TabRevisiBerkas from "../../components/pendaftaran/TabRevisiBerkas";
import TabKelolaAkun from "../../components/pendaftaran/TabKelolaAkun";
import ChatWidget from "../../components/pendaftaran/ChatWidget";

const bidangOptions = [
  {
    name: "Sekretariat",
    desc: "Berperan dalam mendukung kegiatan administrasi, pengelolaan dokumen, koordinasi internal, serta berbagai aktivitas operasional untuk menunjang kelancaran pelaksanaan tugas di lingkungan dinas."
  },
  {
    name: "Pengelolaan Informasi & Komunikasi Publik",
    desc: "Berperan dalam pengelolaan informasi dan komunikasi publik melalui berbagai media, serta mendukung penyampaian informasi yang akurat, informatif, dan mudah diakses oleh masyarakat."
  },
  {
    name: "Aplikasi & Informatika",
    desc: "Berperan dalam mendukung pengelolaan teknologi informasi, pengembangan dan pemeliharaan sistem digital, serta optimalisasi layanan berbasis teknologi di lingkungan dinas."
  },
  {
    name: "Statistik & Persandian",
    desc: "Berperan dalam mendukung pengelolaan data, penyusunan informasi statistik, serta penerapan keamanan informasi untuk mendukung pengambilan keputusan dan layanan pemerintahan."
  }
];

const REVISI_DOC_FIELD_MAP = [
  { key: "pas_foto", field: "file_pas_foto", pattern: /pas\s*foto/i, isImage: true, label: "Pas Foto" },
  { key: "surat_pengantar", field: "file_surat_pengantar", pattern: /surat\s*pengantar/i, isImage: false, label: "Surat Pengantar" },
  { key: "transkrip", field: "file_transkrip", pattern: /transkrip|rapor/i, isImage: false, label: "Transkrip/Rapor" },
  { key: "portofolio", field: "file_portofolio", pattern: /portofolio/i, isImage: false, label: "Portofolio" },
  { key: "proposal_magang", field: "file_proposal_magang", pattern: /proposal/i, isImage: false, label: "Proposal Magang" },
  { key: "cv", field: "file_cv", pattern: /\bcv\b|curriculum vitae/i, isImage: false, label: "CV" },
];

const TabLoadingSkeleton = ({ dk, surface }) => (
  <div className="space-y-6 animate-[fadeslide_0.2s_ease-out]">
    {/* Header skeleton */}
    <div className={`relative rounded-2xl overflow-hidden p-6 ${dk ? "bg-[#161b22] border border-white/10" : "bg-white border border-slate-200/80"}`}>
      <div className="space-y-3">
        <div className={`h-3 w-24 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
        <div className={`h-6 w-48 rounded-full animate-pulse ${dk ? "bg-white/15" : "bg-slate-300"}`} />
        <div className={`h-3 w-full max-w-sm rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
        <div className={`h-3 w-2/3 rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
      </div>
    </div>

    {/* Card skeleton */}
    <div className={`rounded-2xl border p-6 ${surface}`}>
      <div className={`h-3 w-32 rounded-full mb-6 animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex md:flex-col items-center gap-3">
            <div className={`h-11 w-11 shrink-0 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
            <div className="space-y-1.5">
              <div className={`h-2.5 w-16 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
              <div className={`h-2 w-12 rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Status card skeleton */}
    <div className={`rounded-2xl border p-6 flex items-start gap-4 ${surface}`}>
      <div className={`h-12 w-12 shrink-0 rounded-2xl animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
      <div className="flex-1 space-y-2.5">
        <div className={`h-4 w-44 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
        <div className={`h-3 w-full max-w-md rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
        <div className={`h-3 w-2/3 rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
      </div>
      <div className={`shrink-0 h-8 w-28 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
    </div>

    {/* Grid card skeleton */}
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`rounded-2xl border p-5 space-y-4 ${surface}`}>
          <div className={`h-10 w-10 rounded-xl animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
          <div className="space-y-2">
            <div className={`h-3.5 w-28 rounded-full animate-pulse ${dk ? "bg-white/10" : "bg-slate-200"}`} />
            <div className={`h-2.5 w-full rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
            <div className={`h-2.5 w-3/4 rounded-full animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-center gap-2.5 py-3">
      <div className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${dk ? "border-[#00A5EC]" : "border-[#004F9F]"}`} style={{ borderTopColor: "transparent" }} />
      <span className={`text-xs font-semibold ${dk ? "text-slate-400" : "text-slate-500"}`}>Memuat halaman...</span>
    </div>
  </div>
);

const DashboardPendaftaran = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const [isDark, setIsDark] = useState(() => localStorage.getItem("dash_theme") === "dark");
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dash_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dash_theme", "light");
    }
  }, [isDark]);

  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const [, forceNotifUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceNotifUpdate(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const fmtTime = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const dk = isDark;
  const bg = dk ? "bg-[#0d1117]" : "bg-slate-50";
  const surface = dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80";
  const hdr = dk ? "bg-[#161b22]/95 border-white/10" : "bg-white/95 border-slate-200/80";
  const sideBar = dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80";
  const txt = dk ? "text-slate-100" : "text-[#0B1442]";
  const sub = dk ? "text-slate-400" : "text-slate-500";
  const muted = dk ? "text-slate-500" : "text-slate-400";
  const divider = dk ? "border-white/10" : "border-slate-100";
  const hov = dk ? "hover:bg-white/5" : "hover:bg-slate-50";
  const navActive = "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md";
  const navInactive = dk ? "text-slate-400 hover:bg-white/5 hover:text-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]";
  const inputCls = `w-full mt-1.5 rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`;

  const getUserSafely = () => {
    try {
      const raw = sessionStorage.getItem("user_pendaftaran");
      if (raw && raw !== "undefined") return JSON.parse(raw);
    } catch (e) { console.error(e); }
    return null;
  };

  const [user, setUser] = useState(getUserSafely());
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusFetchedAt, setStatusFetchedAt] = useState(null);
  const [mountedAt] = useState(() => new Date());

  const userId = user?.id;

  const belumDaftarTimestamp = useMemo(() => {
    try {
      const key = `belum_daftar_seen_${userId || "anon"}`;
      const stored = localStorage.getItem(key);
      if (stored) return new Date(stored);
      const now = new Date();
      localStorage.setItem(key, now.toISOString());
      return now;
    } catch {
      return mountedAt;
    }
  }, [userId, mountedAt]);

  const [notifOpen, _setNotifOpen] = useState(false);
  const [readBump, setReadBump] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef(null);
  const avatarRef = useRef(null);
  const mainRef = useRef(null);

  const getNotifKey = useCallback(() => {
    if (!user) return "";
    const statusStr = status ? `${status.status_pendaftaran}_${status.updated_at || status.created_at || ""}` : "none";
    const hasReg = !!status;
    return `read_notif_${user.id}_${hasReg}_${statusStr}`;
  }, [user, status]);

  const notifKey = getNotifKey();
  const hasReadNotif = useMemo(() => {
    if (!notifKey) return false;
    return localStorage.getItem(notifKey) === "true";
  }, [notifKey, readBump]);

  const setNotifOpen = useCallback((val) => {
    _setNotifOpen(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      if (next) {
        const key = getNotifKey();
        if (key) {
          localStorage.setItem(key, "true");
          setReadBump((b) => b + 1);
        }
      }
      return next;
    });
  }, [getNotifKey]);

  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) _setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const [profileForm, setProfileForm] = useState({ nama: user?.nama || "", no_hp: user?.no_hp || user?.nomor_hp || "", institusi: user?.institusi || "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [noChangesMsg, setNoChangesMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoDeleteLoading, setFotoDeleteLoading] = useState(false);
  const [fotoModalLoading, setFotoModalLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  // Chat
  const [chatOpenTrigger] = useState(0);
  const [, setChatUnread] = useState(0);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropFileInputRef = useRef(null);
  const cropImgRef = useRef(null);
  const [tabLoadingPendaftaran, setTabLoadingPendaftaran] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState("input");
  const [emailBaru, setEmailBaru] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);
  const [profileSuccessVisible, setProfileSuccessVisible] = useState(true);
  const [profileErrorVisible, setProfileErrorVisible] = useState(true);
  const [passwordSuccessVisible, setPasswordSuccessVisible] = useState(true);
  const [passwordErrorVisible, setPasswordErrorVisible] = useState(true);
  const [noChangesVisible, setNoChangesVisible] = useState(true);
  const [emailSuccessVisible, setEmailSuccessVisible] = useState(true);
  const [errorRevisi, setErrorRevisi] = useState("");
  const [loadingRevisi, setLoadingRevisi] = useState(false);

  const handleTabChange = (tabName) => {
    setTabLoadingPendaftaran(true);
    setSearchParams({ tab: tabName });
    setProfileSuccess(""); setPasswordSuccess(""); setPasswordError(""); setNoChangesMsg("");
    setNotifOpen(false); setAvatarOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    setTimeout(() => setTabLoadingPendaftaran(false), 450);
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getStatusPendaftaran();
      setStatus(res.data);
      setStatusFetchedAt(new Date());
    } catch (err) {
      if (err.response?.status === 401) { logoutPendaftaran(); navigate("/login"); return; }
      if (err.response?.status === 404) { setStatus(null); return; }
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("tidak ditemukan") || msg.toLowerCase().includes("belum ada")) setStatus(null);
      else console.error(msg || "Gagal memuat status.");
    } finally { setLoading(false); }
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchStatus(); }, 0);
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  // ==== PERUBAHAN: cek ulang sesi saat tab kembali aktif setelah idle lama ====
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  // ==== AKHIR PERUBAHAN ====

  // ==== PERUBAHAN: auto-logout setelah idle (tidak ada interaksi) selama 1 jam ====
  useEffect(() => {
    const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 jam
    let idleTimer = null;

    const handleIdleTimeout = async () => {
      await logoutPendaftaran();
      const result = await sessionExpiredDialog();
      if (result.isConfirmed) {
        navigate("/login");
      }
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdleTimeout, IDLE_LIMIT_MS);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer));

    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [navigate]);
  // ==== AKHIR PERUBAHAN ====

  const handleLogout = async () => {
    const result = await confirmDialog({
      title: "Keluar dari akun?",
      text: "Anda perlu masuk kembali untuk mengakses dashboard.",
      confirmText: "Ya, Keluar",
      icon: "warning",
      danger: true,
    });
    if (result.isConfirmed) {
      await logoutPendaftaran();
      navigate("/login");
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setProfileSuccess(""); setProfileError(""); setPasswordSuccess(""); setPasswordError(""); setNoChangesMsg("");

    const wantsPasswordChange = passwordForm.oldPassword || passwordForm.newPassword || passwordForm.confirmPassword;
    const wantsProfileChange = profileForm.nama !== (user?.nama || "") || profileForm.no_hp !== (user?.no_hp || "") || profileForm.institusi !== (user?.institusi || "");

    if (!wantsPasswordChange && !wantsProfileChange) {
      setNoChangesMsg("Tidak ada perubahan untuk disimpan.");
      setNoChangesVisible(true);
      return;
    }

    if (wantsPasswordChange) {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("");
        setTimeout(() => {
          setPasswordError("Konfirmasi password tidak cocok.");
          setPasswordErrorVisible(true);
        }, 0);
        return;
      }
      if (passwordForm.newPassword.length < 6) {
        setPasswordError("");
        setTimeout(() => {
          setPasswordError("Password baru minimal 6 karakter.");
          setPasswordErrorVisible(true);
        }, 0);
        return;
      }
    }

    const result = await confirmDialog({
      title: wantsPasswordChange ? "Simpan perubahan & password baru?" : "Simpan perubahan profil?",
      text: "Pastikan data yang Anda masukkan sudah benar.",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    if (wantsProfileChange) setProfileLoading(true);
    if (wantsPasswordChange) setPasswordLoading(true);

    try {
      if (wantsProfileChange) {
        const res = await updateProfil({ nama: profileForm.nama, no_hp: profileForm.no_hp, institusi: profileForm.institusi });
        const updated = { ...user, nama: res.data?.nama || profileForm.nama, no_hp: res.data?.no_hp || profileForm.no_hp, institusi: res.data?.institusi || profileForm.institusi };
        sessionStorage.setItem("user_pendaftaran", JSON.stringify(updated));
        setUser(updated);
        setProfileSuccess("Profil berhasil diperbarui.");
        setProfileSuccessVisible(true);
      }

      if (wantsPasswordChange) {
        await gantiPassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword, confirmPassword: passwordForm.confirmPassword });
        setPasswordSuccess("Password berhasil diubah.");
        setPasswordSuccessVisible(true);
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
      toastSuccess("Perubahan berhasil disimpan");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal menyimpan perubahan.";
      if (wantsPasswordChange) {
        setPasswordError(errorMsg);
        setPasswordErrorVisible(true);
      }
      if (wantsProfileChange) {
        setProfileSuccess("");
        setProfileError(errorMsg);
        setProfileErrorVisible(true);
      }
      toastError(errorMsg);
      console.error(err);
    } finally {
      setProfileLoading(false);
      setPasswordLoading(false);
    }
  };

  const handleOpenEmailModal = () => {
    setEmailStep("input");
    setEmailBaru("");
    setOtpInput("");
    setEmailError("");
    setEmailSuccessMsg("");
    setResendCooldown(0);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setShowEmailModal(true);
  };

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(60);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOtpEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (emailBaru === user?.email) {
      setEmailError("Email baru tidak boleh sama dengan email saat ini.");
      return;
    }
    setEmailLoading(true);
    try {
      await requestGantiEmail({ email_baru: emailBaru });
      setEmailStep("otp");
      startResendCooldown();
    } catch (err) {
      setEmailError(err.response?.data?.message || "Gagal mengirim kode OTP.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setEmailError("");
    setEmailLoading(true);
    try {
      await requestGantiEmail({ email_baru: emailBaru });
      startResendCooldown();
    } catch (err) {
      setEmailError(err.response?.data?.message || "Gagal mengirim ulang kode OTP.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifikasiOtpEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await verifikasiGantiEmail({ otp: otpInput });
      const updated = { ...user, email: res.data?.email || emailBaru };
      sessionStorage.setItem("user_pendaftaran", JSON.stringify(updated));
      setUser(updated);
      setEmailSuccessMsg("Email berhasil diperbarui.");
      setEmailSuccessVisible(true);
      setShowEmailModal(false);
      toastSuccess("Email berhasil diperbarui");
    } catch (err) {
      setEmailError(err.response?.data?.message || "Kode OTP tidak valid atau sudah kedaluwarsa.");
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    if (otpInput.length === 6 && emailStep === "otp" && !emailLoading) {
      const timeoutId = setTimeout(() => {
        handleVerifikasiOtpEmail({ preventDefault: () => { } });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [otpInput]);

  useEffect(() => {
    if (!profileSuccess) return;
    const fadeTimer = setTimeout(() => setProfileSuccessVisible(false), 3600);
    const clearTimer = setTimeout(() => setProfileSuccess(""), 4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [profileSuccess]);

  useEffect(() => {
    if (!passwordSuccess) return;
    const fadeTimer = setTimeout(() => setPasswordSuccessVisible(false), 3600);
    const clearTimer = setTimeout(() => setPasswordSuccess(""), 4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [passwordSuccess]);

  useEffect(() => {
    if (!passwordError) return;
    const fadeTimer = setTimeout(() => setPasswordErrorVisible(false), 4600);
    const clearTimer = setTimeout(() => setPasswordError(""), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [passwordError]);

  useEffect(() => {
    if (!profileError) return;
    const fadeTimer = setTimeout(() => setProfileErrorVisible(false), 4600);
    const clearTimer = setTimeout(() => setProfileError(""), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [profileError]);

  useEffect(() => {
    if (!noChangesMsg) return;
    const fadeTimer = setTimeout(() => setNoChangesVisible(false), 3100);
    const clearTimer = setTimeout(() => setNoChangesMsg(""), 3500);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [noChangesMsg]);

  useEffect(() => {
    if (!emailSuccessMsg) return;
    const fadeTimer = setTimeout(() => setEmailSuccessVisible(false), 3600);
    const clearTimer = setTimeout(() => setEmailSuccessMsg(""), 4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [emailSuccessMsg]);

  const handleBackToEmailInput = () => {
    setEmailStep("input");
    setOtpInput("");
    setEmailError("");
  };

  const handleOpenCropModal = async () => {
    const existingLocal = fotoPreview;
    const existingServerPath = user?.foto_profil
      ? (user.foto_profil.startsWith("http") ? user.foto_profil : `http://localhost:8000/${user.foto_profil}`)
      : null;

    if (existingLocal) {
      setCropSrc(existingLocal);
      setCropZoom(100);
      setCropPos({ x: 0, y: 0 });
      setShowFotoModal(true);
      return;
    }

    if (existingServerPath) {
      setFotoModalLoading(true);
      setShowFotoModal(true);
      try {
        const res = await fetch(existingServerPath);
        const blob = await res.blob();
        const localUrl = URL.createObjectURL(blob);
        setCropSrc(localUrl);
        setCropZoom(100);
        setCropPos({ x: 0, y: 0 });
      } catch (err) {
        console.error("Gagal memuat foto untuk diedit:", err);
        setShowFotoModal(false);
        alert("Gagal memuat foto profil saat ini. Silakan unggah foto baru.");
        cropFileInputRef.current?.click();
      } finally {
        setFotoModalLoading(false);
      }
      return;
    }

    cropFileInputRef.current?.click();
  };

  const handleCropFileSelected = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) { alert("Format foto harus JPEG, JPG, atau PNG."); return; }
    if (f.size > 3 * 1024 * 1024) { alert("Ukuran foto maksimal 3MB."); return; }
    setCropSrc(URL.createObjectURL(f));
    setCropZoom(100);
    setCropPos({ x: 0, y: 0 });
    setShowFotoModal(true);
    e.target.value = "";
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    const point = e.touches ? e.touches[0] : e;
    dragStart.current = { x: point.clientX - cropPos.x, y: point.clientY - cropPos.y };
  };
  const handleDragMove = (e) => {
    const point = e.touches ? e.touches[0] : e;
    setCropPos({ x: point.clientX - dragStart.current.x, y: point.clientY - dragStart.current.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => handleDragMove(e);
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [isDragging]);

  const handleSimpanPerubahanFoto = async () => {
    const img = cropImgRef.current;
    if (!img) return;
    try {
      const containerSize = 224;
      const outputSize = 400;
      const ratio = outputSize / containerSize;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      if (!naturalW || !naturalH) {
        toastError("Gambar belum selesai dimuat, coba lagi sebentar.");
        return;
      }

      const baseScale = Math.max(containerSize / naturalW, containerSize / naturalH);
      const totalScale = baseScale * (cropZoom / 100);
      const drawnW = naturalW * totalScale;
      const drawnH = naturalH * totalScale;
      const offsetX = (containerSize - drawnW) / 2 + cropPos.x;
      const offsetY = (containerSize - drawnH) / 2 + cropPos.y;

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, offsetX * ratio, offsetY * ratio, drawnW * ratio, drawnH * ratio);

      canvas.toBlob((blob) => {
        if (!blob) {
          toastError("Gagal memproses foto. Silakan coba unggah foto baru.");
          return;
        }
        const file = new File([blob], "foto-profil.png", { type: "image/png" });
        setFotoPreview(URL.createObjectURL(blob));
        handleUploadFoto(file);
        setShowFotoModal(false);
      }, "image/png");
    } catch (err) {
      console.error("Gagal menyimpan perubahan foto:", err);
      toastError("Terjadi kesalahan saat menyimpan foto. Silakan coba lagi.");
    }
  };

  const handleUploadFoto = async (file) => {
    setFotoLoading(true);
    try {
      const fd = new FormData(); fd.append("foto_profil", file);
      const res = await uploadFotoProfil(fd);
      const fotoUrl = res.data?.foto_url || "";
      const updated = { ...user, foto_profil: fotoUrl };
      sessionStorage.setItem("user_pendaftaran", JSON.stringify(updated));
      setUser(updated);
      toastSuccess("Foto profil berhasil diperbarui");
    } catch (err) {
      console.error("Upload foto gagal:", err);
      toastError("Gagal mengunggah foto profil");
    } finally { setFotoLoading(false); }
  };

  const handleHapusFoto = async () => {
    const result = await confirmDialog({
      title: "Hapus foto profil?",
      text: "Foto profil Anda akan dihapus secara permanen.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    setFotoDeleteLoading(true);
    try {
      await hapusFotoProfil();
      const updated = { ...user, foto_profil: "" };
      sessionStorage.setItem("user_pendaftaran", JSON.stringify(updated));
      setUser(updated);
      setFotoPreview(null);
      toastSuccess("Foto profil berhasil dihapus");
    } catch (err) {
      console.error("Gagal menghapus foto:", err);
      toastError("Gagal menghapus foto profil. Silakan coba lagi.");
    } finally {
      setFotoDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") {
      getProfilSaya().then(res => {
        if (res?.data) {
          const fresh = { ...user, ...res.data };
          sessionStorage.setItem("user_pendaftaran", JSON.stringify(fresh));
          setUser(fresh);
          setProfileForm({ nama: res.data.nama || "", no_hp: res.data.no_hp || "", institusi: res.data.institusi || "" });
        }
      }).catch(() => { });
    }
  }, [activeTab]);

  const handleSubmitRevisi = async (filesByField, catatanText) => {
    setErrorRevisi("");
    const hasAnyFile = Object.values(filesByField).some(Boolean);
    if (!hasAnyFile) {
      setErrorRevisi("Unggah minimal satu dokumen revisi sebelum mengirim.");
      return;
    }

    const result = await confirmDialog({
      title: "Kirim Perbaikan Dokumen?",
      text: "Pastikan seluruh dokumen yang Anda unggah sudah sesuai dengan catatan admin sebelum mengirim. Berkas akan diverifikasi ulang oleh admin.",
      confirmText: "Ya, Kirim Sekarang",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const fd = new FormData();
    Object.entries(filesByField).forEach(([field, file]) => {
      if (file) fd.append(field, file);
    });
    fd.append("catatan", catatanText || "");

    setLoadingRevisi(true);
    try {
      await kirimRevisiDokumen(fd);
      await fetchStatus();
      toastSuccess("Revisi berhasil dikirim");
      handleTabChange("status");
    } catch (err) {
      setErrorRevisi(err.response?.data?.message || "Gagal mengirim revisi.");
      toastError(err.response?.data?.message || "Gagal mengirim revisi");
    } finally {
      setLoadingRevisi(false);
    }
  };

  const isAccepted = status?.status_pendaftaran?.toLowerCase().includes("terima");
  const isRejected = status?.status_pendaftaran?.toLowerCase().includes("tolak");
  const isRevisi = status?.status_pendaftaran?.toLowerCase().includes("revisi");
  const isPending = status && !isAccepted && !isRejected && !isRevisi;
  const hasRegistered = !!status;

  const dotColor = !hasRegistered || isRejected
    ? "bg-red-500"
    : isPending || isRevisi
      ? "bg-amber-400"
      : "bg-emerald-500";
  const dotLabel = !hasRegistered ? "Belum Mendaftar"
    : isPending ? "Menunggu Verifikasi"
      : isRevisi ? "Perlu Revisi"
        : isAccepted ? "Diterima Magang"
          : "Ditolak";
  const dotTextColor = dotColor === "bg-red-500" ? "text-red-500"
    : dotColor === "bg-amber-400" ? "text-amber-500"
      : "text-emerald-500";

  const notifications = [];
  if (!loading) {
    const timestamp = status?.updated_at || status?.created_at || statusFetchedAt || mountedAt;
    if (!hasRegistered) notifications.push({ id: 1, type: "info", icon: <Info className="w-4 h-4" strokeWidth={2} />, dot: "bg-blue-500", title: "Belum Ada Pendaftaran", msg: "Segera lengkapi formulir permohonan.", timestamp: belumDaftarTimestamp });
    else if (isPending) notifications.push({ id: 2, type: "pending", icon: <Search className="w-4 h-4" strokeWidth={2} />, dot: "bg-amber-500 animate-pulse", title: "Berkas Sedang Diverifikasi", msg: "Dokumen Anda sedang diperiksa admin.", timestamp });
    else if (isRevisi) notifications.push({ id: 3, type: "warning", icon: <AlertTriangle className="w-4 h-4" strokeWidth={2} />, dot: "bg-orange-500 animate-bounce", title: "Dokumen Perlu Direvisi", msg: status?.catatan_admin || "Admin meminta perbaikan berkas.", timestamp });
    else if (isAccepted) notifications.push({ id: 4, type: "success", icon: <PartyPopper className="w-4 h-4" strokeWidth={2} />, dot: "bg-emerald-500", title: "Selamat! Anda Diterima Magang", msg: `Penempatan: ${status?.posisi_bidang || "-"}`, timestamp });
    else if (isRejected) notifications.push({ id: 5, type: "error", icon: <XCircle className="w-4 h-4" strokeWidth={2} />, dot: "bg-red-500", title: "Permohonan Ditolak", msg: status?.catatan_admin || "Permohonan tidak dapat diteruskan.", timestamp });
  }

  // Alur digabung jadi 3 tahap: Terkirim (1) → Verifikasi & Seleksi Berkas (2) → Pengumuman (3).
  const getStep = (s) => {
    if (!s) return 0;
    const l = s.toLowerCase();
    if (l === "menunggu" || l === "revisi") return 2;
    if (l === "diterima" || l === "ditolak") return 3;
    return 2;
  };

  const tabTitles = {
    dashboard: { title: "Dashboard", desc: "Ringkasan status pendaftaran magang Anda" },
    form: { title: "Formulir Magang", desc: "Ajukan permohonan magang baru" },
    status: { title: "Status Verifikasi", desc: "Pantau progres verifikasi berkas" },
    revisi: { title: "Revisi Berkas", desc: "Perbaiki dokumen sesuai catatan admin" },
    settings: { title: "Kelola Akun", desc: "Atur profil dan keamanan akun Anda" },
  };
  const currentTab = tabTitles[activeTab] || tabTitles.dashboard;
  const currentStep = status ? getStep(status.status_pendaftaran) : 0;

  return (
    <div className={`h-screen overflow-hidden flex transition-colors duration-300 ${bg}`}>
      <SidebarPendaftaran
        dk={dk} sideBar={sideBar} divider={divider} muted={muted} txt={txt}
        navActive={navActive} navInactive={navInactive} hov={hov}
        activeTab={activeTab} handleTabChange={handleTabChange}
        hasRegistered={hasRegistered} isRevisi={isRevisi}
        dotColor={dotColor} dotLabel={dotLabel} dotTextColor={dotTextColor}
        user={user} fotoPreview={fotoPreview}
        avatarOpen={avatarOpen} setAvatarOpen={setAvatarOpen} setNotifOpen={setNotifOpen}
        avatarRef={avatarRef} handleLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <HeaderPendaftaran
          hdr={hdr} dk={dk} divider={divider} muted={muted} txt={txt} sub={sub}
          currentTab={currentTab}
          notifOpen={notifOpen} setNotifOpen={setNotifOpen} setAvatarOpen={setAvatarOpen}
          notifRef={notifRef} notifications={notifications} hov={hov}
          clock={clock} fmtTime={fmtTime} fmtDate={fmtDate}
          isDark={isDark} setIsDark={setIsDark}
          hasReadNotif={hasReadNotif}
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 relative">
          {tabLoadingPendaftaran && (
            <div className="absolute top-0 left-0 right-0 h-[3px] z-40 overflow-hidden bg-transparent">
              <div className="h-full w-1/3 bg-gradient-to-r from-[#00A5EC] to-[#004F9F] animate-[tab-loading-pendaftaran_0.8s_ease-in-out_infinite]"></div>
            </div>
          )}
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#00A5EC]/5 blur-3xl -z-10 pointer-events-none" />
          <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-[#004F9F]/5 blur-3xl -z-10 pointer-events-none" />

          {tabLoadingPendaftaran ? (
            <TabLoadingSkeleton dk={dk} surface={surface} />
          ) : (
            <div key={activeTab} className="animate-[fadeslide_0.35s_ease-out]">
              {activeTab === "dashboard" && (
                <TabDashboard
                  dk={dk} surface={surface} txt={txt} sub={sub} muted={muted}
                  user={user} hasRegistered={hasRegistered} status={status} loading={loading}
                  isPending={isPending} isRevisi={isRevisi} isAccepted={isAccepted} isRejected={isRejected}
                  handleTabChange={handleTabChange}
                />
              )}

              {activeTab === "form" && (
                <TabFormMagang
                  dk={dk} surface={surface} txt={txt} sub={sub} inputCls={inputCls}
                  bidangOptions={bidangOptions}
                  hasRegistered={hasRegistered} isRevisi={isRevisi}
                  handleTabChange={handleTabChange}
                  kirimPendaftaranMagang={kirimPendaftaranMagang}
                  fetchStatus={fetchStatus}
                />
              )}

              {activeTab === "status" && (
                <TabStatusVerifikasi
                  dk={dk} surface={surface} txt={txt} sub={sub} muted={muted}
                  status={status} hasRegistered={hasRegistered} currentStep={currentStep}
                  isRejected={isRejected} isAccepted={isAccepted} isRevisi={isRevisi}
                  handleTabChange={handleTabChange}
                />
              )}

              {activeTab === "revisi" && (
                <TabRevisiBerkas
                  dk={dk} surface={surface} txt={txt} sub={sub} isRevisi={isRevisi} status={status}
                  docOptions={REVISI_DOC_FIELD_MAP}
                  handleSubmitRevisi={handleSubmitRevisi}
                  errorRevisi={errorRevisi} loadingRevisi={loadingRevisi} handleTabChange={handleTabChange}
                />
              )}

              {activeTab === "settings" && (
                <TabKelolaAkun
                  dk={dk} surface={surface} txt={txt} sub={sub} muted={muted} divider={divider} inputCls={inputCls}
                  user={user} fotoPreview={fotoPreview} fotoLoading={fotoLoading} fotoDeleteLoading={fotoDeleteLoading} fotoModalLoading={fotoModalLoading}
                  handleOpenCropModal={handleOpenCropModal} handleHapusFoto={handleHapusFoto}
                  cropFileInputRef={cropFileInputRef} handleCropFileSelected={handleCropFileSelected}
                  showFotoModal={showFotoModal} setShowFotoModal={setShowFotoModal}
                  cropSrc={cropSrc} cropImgRef={cropImgRef} cropPos={cropPos} cropZoom={cropZoom} setCropZoom={setCropZoom}
                  isDragging={isDragging} handleDragStart={handleDragStart} handleSimpanPerubahanFoto={handleSimpanPerubahanFoto}
                  profileSuccess={profileSuccess} noChangesMsg={noChangesMsg}
                  profileForm={profileForm} setProfileForm={setProfileForm} handleSaveAll={handleSaveAll}
                  passwordError={passwordError} passwordSuccess={passwordSuccess}
                  passwordForm={passwordForm} setPasswordForm={setPasswordForm}
                  showOldPassword={showOldPassword} setShowOldPassword={setShowOldPassword}
                  showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                  profileLoading={profileLoading} passwordLoading={passwordLoading}
                  setProfileSuccess={setProfileSuccess} setPasswordSuccess={setPasswordSuccess} setPasswordError={setPasswordError}
                  showEmailModal={showEmailModal} handleOpenEmailModal={handleOpenEmailModal}
                  emailStep={emailStep} emailBaru={emailBaru} setEmailBaru={setEmailBaru}
                  otpInput={otpInput} setOtpInput={setOtpInput}
                  emailLoading={emailLoading} emailError={emailError} emailSuccessMsg={emailSuccessMsg}
                  handleRequestOtpEmail={handleRequestOtpEmail} handleVerifikasiOtpEmail={handleVerifikasiOtpEmail}
                  handleBackToEmailInput={handleBackToEmailInput} setShowEmailModal={setShowEmailModal}
                  resendCooldown={resendCooldown} handleResendOtp={handleResendOtp}
                  profileSuccessVisible={profileSuccessVisible}
                  passwordSuccessVisible={passwordSuccessVisible}
                  passwordErrorVisible={passwordErrorVisible}
                  noChangesVisible={noChangesVisible}
                  emailSuccessVisible={emailSuccessVisible}
                  profileError={profileError}
                  setProfileError={setProfileError}
                  profileErrorVisible={profileErrorVisible}
                />
              )}
            </div>
          )}

          <style>{`
            @keyframes fadeslide {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes tab-loading-pendaftaran {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </main>
      </div>

      {/* ChatWidget — via React Portal ke document.body, selalu fixed kanan bawah */}
      <ChatWidget
        dk={dk}
        surface={surface}
        txt={txt}
        sub={sub}
        muted={muted}
        user={user}
        onUnreadChange={setChatUnread}
        openTrigger={chatOpenTrigger}
      />
    </div>
  );
};

export default DashboardPendaftaran;