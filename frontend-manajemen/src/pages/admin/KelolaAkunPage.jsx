import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  getMe,
  gantiPasswordAdmin,
  uploadFotoAdmin,
  hapusFotoAdmin,
  updateProfilAdmin,
  requestGantiEmailManajemen,
  verifikasiGantiEmailManajemen,
  getRiwayatLoginPeserta,
} from "../../services/authService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { getFileUrl } from "../../utils/fileUrl";
import FotoProfilModal from "../../components/manajemen/shared/FotoProfilModal";
import GantiEmailModal from "../../components/manajemen/shared/akun/GantiEmailModal";
import TabProfilAdmin from "../../components/manajemen/admin/akun/tabs/TabProfilAdmin";
import TabKeamanan from "../../components/manajemen/shared/akun/TabKeamanan";
import TabNotifikasiAdmin from "../../components/manajemen/admin/akun/tabs/TabNotifikasiAdmin";
import {
  UserCheck,
  Camera,
  Trash2,
  Briefcase,
  Mail,
  Phone,
  BadgeCheck,
  RefreshCw,
  Lock,
  BellRing,
  Smartphone,
  Laptop,
  ShieldCheck,
  Server,
} from "lucide-react";

export const KelolaAkunPage = () => {
  const { isDark } = useManajemenTheme();
  const dk = isDark;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [loginHistories, setLoginHistories] = useState([]);

  // ── Profil Form State ──
  const [profilForm, setProfilForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    jabatan: "",
  });
  const [savingProfil, setSavingProfil] = useState(false);

  // ── Fetch Riwayat Login ──
  useEffect(() => {
    let isMounted = true;
    getRiwayatLoginPeserta()
      .then((res) => {
        if (isMounted && res.data?.data) {
          setLoginHistories(res.data.data);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // ── Fetch Profile ──
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await getMe();
        if (isMounted) {
          const data = res.data?.data || null;
          setProfile(data);
          setProfilForm({
            nama: data?.nama || "",
            email: data?.email || "",
            no_hp: data?.no_hp || "",
            jabatan: data?.jabatan || "",
          });
        }
      } catch {
        if (isMounted) {
          toastError("Gagal memuat profil akun administrator.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // ── Pengecekan Perubahan Data Profil Per Kolom (Dirty State) ──
  const isProfilFieldChanged = useCallback(
    (fieldKey) => {
      if (!profile) return false;
      const cur = (profilForm[fieldKey] || "").trim();
      const orig = (profile[fieldKey] || "").trim();
      return cur !== orig;
    },
    [profilForm, profile]
  );

  const handleBatalProfilField = (fieldKey) => {
    if (!profile) return;
    setProfilForm((prev) => ({ ...prev, [fieldKey]: profile[fieldKey] || "" }));
  };

  // ── Simpan Pembaruan Profil Admin ──
  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    if (!profile) return;

    if (!profilForm.nama.trim()) {
      toastError("Nama lengkap resmi wajib diisi.");
      return;
    }

    const result = await confirmDialog({
      title: "Simpan Perubahan Akun?",
      text: "Informasi profil administrator Anda akan diperbarui.",
      confirmText: "Ya, Simpan",
      cancelText: "Batal",
      icon: "question",
    });

    if (!result.isConfirmed) return;

    setSavingProfil(true);
    try {
      const res = await updateProfilAdmin({
        nama: profilForm.nama.trim(),
        email: profile?.email || profilForm.email || "",
        no_hp: (profilForm.no_hp || "").trim(),
        jabatan: (profilForm.jabatan || "").trim(),
      });
      const updated = res.data?.data || res.data;
      setProfile((prev) => ({ ...prev, ...updated }));
      toastSuccess("Informasi akun administrator berhasil diperbarui!");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui informasi akun.");
    } finally {
      setSavingProfil(false);
    }
  };

  // ── Tab State: "profil" | "keamanan" | "notifikasi" ──
  const [activeTab, setActiveTab] = useState("profil");

  // ── Password Form State ──
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordLastUpdated, setPasswordLastUpdated] = useState(null);

  // ── Realtime Password Strength & Requirement Verification ──
  const passwordStrength = useMemo(() => {
    const pwd = passwordForm.newPassword || "";
    const len = pwd.length;
    const hasMinLen = len >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasUpperLower = hasUpper && hasLower;
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    const criteriaMet = [hasMinLen, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (!pwd) {
      return {
        score: 0,
        percent: 0,
        label: "Belum Diisi",
        statusText: "Belum Diisi",
        colorText: "text-slate-400 dark:text-slate-500",
        barColor: "bg-slate-200 dark:bg-white/10",
        activeBars: 0,
        hasMinLen: false,
        hasUpperLower: false,
        hasNumber: false,
        hasSpecial: false,
        len: 0,
      };
    }

    if (criteriaMet <= 1) {
      return {
        score: 1,
        percent: 25,
        label: "Lemah (Perlu Ditingkatkan)",
        statusText: "Lemah",
        colorText: "text-rose-500",
        barColor: "bg-rose-500",
        activeBars: 1,
        hasMinLen,
        hasUpperLower,
        hasNumber,
        hasSpecial,
        len,
      };
    }

    if (criteriaMet === 2) {
      return {
        score: 2,
        percent: 50,
        label: "Cukup (Bisa Ditingkatkan)",
        statusText: "Cukup",
        colorText: "text-amber-500",
        barColor: "bg-amber-500",
        activeBars: 2,
        hasMinLen,
        hasUpperLower,
        hasNumber,
        hasSpecial,
        len,
      };
    }

    if (criteriaMet === 3) {
      return {
        score: 3,
        percent: 75,
        label: "Kuat (Aman)",
        statusText: "Kuat (Aman)",
        colorText: "text-[#004F9F] dark:text-sky-400",
        barColor: "bg-[#004F9F] dark:bg-sky-500",
        activeBars: 3,
        hasMinLen,
        hasUpperLower,
        hasNumber,
        hasSpecial,
        len,
      };
    }

    return {
      score: 4,
      percent: 100,
      label: "Sangat Kuat (Sangat Aman)",
      statusText: "Sangat Kuat (Sangat Aman)",
      colorText: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-500 dark:bg-emerald-400",
      activeBars: 4,
      hasMinLen,
      hasUpperLower,
      hasNumber,
      hasSpecial,
      len,
    };
  }, [passwordForm.newPassword]);

  // ── Informasi Sesi Login & Perangkat Pengguna ──
  const deviceInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return { device: "Perangkat Komputer", browser: "Browser Web", icon: Laptop };
    }
    const ua = navigator.userAgent || "";
    let device = "Laptop / Komputer Windows";
    let icon = Laptop;
    if (/android/i.test(ua)) {
      device = "Smartphone Android";
      icon = Smartphone;
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      device = "Perangkat iOS (Apple)";
      icon = Smartphone;
    } else if (/windows/i.test(ua)) {
      device = "Laptop / Komputer Windows";
      icon = Laptop;
    } else if (/macintosh|mac os x/i.test(ua)) {
      device = "MacBook / iMac (macOS)";
      icon = Laptop;
    } else if (/linux/i.test(ua)) {
      device = "Perangkat Linux OS";
      icon = Laptop;
    }

    let browser = "Google Chrome";
    if (/edg/i.test(ua)) browser = "Microsoft Edge";
    else if (/firefox/i.test(ua)) browser = "Mozilla Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";
    else if (/opera|opr/i.test(ua)) browser = "Opera Browser";

    return { device, browser, icon };
  }, []);

  const lastPasswordUpdateText = useMemo(() => {
    const rawTime = passwordLastUpdated || profile?.password_changed_at;
    if (rawTime) {
      try {
        const updateDate = new Date(rawTime);
        const now = new Date();
        const diffMs = now - updateDate;
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 1) return "Baru saja";
        if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} jam yang lalu`;
        const diffDays = Math.floor(diffMinutes / 1440);
        if (diffDays === 1) return "Kemarin";
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} bulan yang lalu`;
      } catch {
        return "Baru saja";
      }
    }
    return "Belum diubah";
  }, [profile?.password_changed_at, passwordLastUpdated]);

  const handleLupaPasswordClick = () => {
    confirmDialog({
      title: "Lupa Kata Sandi?",
      text: "Untuk mengatur ulang kata sandi administrator yang terlupa, Anda dapat menggunakan fitur 'Lupa Kata Sandi' pada halaman login atau menghubungi Super Admin Diskominfo Ponorogo.",
      confirmText: "Mengerti",
      showCancelButton: false,
      icon: "info",
    });
  };

  // ── Simpan Ganti Password ──
  const handleGantiPassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword) {
      toastError("Kata sandi lama wajib diisi.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toastError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      toastError("Kata sandi baru harus memadukan kombinasi huruf besar dan kecil.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toastError("Kata sandi baru harus mengandung minimal 1 angka (0-9).");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toastError("Kata sandi baru harus mengandung minimal 1 simbol khusus (!@#$%^&*).");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    const result = await confirmDialog({
      title: "Perbarui Kata Sandi Administrator?",
      text: "Apakah Anda yakin ingin memperbarui kata sandi akun administrator Anda?",
      confirmText: "Ya, Perbarui Sandi",
      cancelText: "Batal",
      icon: "question",
    });

    if (!result.isConfirmed) return;

    setSavingPassword(true);
    try {
      const res = await gantiPasswordAdmin({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      const newPwdTime = res?.data?.data?.password_changed_at || new Date().toISOString();
      setPasswordLastUpdated(newPwdTime);
      setProfile((prev) => (prev ? { ...prev, password_changed_at: newPwdTime } : prev));
      toastSuccess("Kata sandi berhasil diubah! Gunakan kata sandi baru untuk sesi login berikutnya.");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengubah kata sandi.");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Foto Profil & Crop Modal ──
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoDeleteLoading, setFotoDeleteLoading] = useState(false);
  const [fotoModalLoading, setFotoModalLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [showFotoModal, setShowFotoModal] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  // ── Drag handler untuk crop ──
  const handleDragStart = (e) => {
    setIsDragging(true);
    const point = e.touches ? e.touches[0] : e;
    dragStart.current = {
      x: point.clientX - cropPos.x,
      y: point.clientY - cropPos.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const point = e.touches ? e.touches[0] : e;
      setCropPos({
        x: point.clientX - dragStart.current.x,
        y: point.clientY - dragStart.current.y,
      });
    };
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

  const handleOpenCropModal = async () => {
    const existingLocal = fotoPreview;
    const existingServerPath = profile?.foto_profil
      ? getFileUrl(profile.foto_profil)
      : null;

    if (existingLocal) {
      setCropSrc(existingLocal);
      setCropZoom(100);
      setCropPos({ x: 0, y: 0 });
      setShowFotoModal(true);
      return;
    }

    if (existingServerPath) {
      try {
        setFotoModalLoading(true);
        const resp = await fetch(existingServerPath);
        const blob = await resp.blob();
        setCropSrc(URL.createObjectURL(blob));
        setCropZoom(100);
        setCropPos({ x: 0, y: 0 });
        setShowFotoModal(true);
      } catch {
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
    if (!allowed.includes(f.type)) {
      toastError("Format foto harus JPEG, JPG, atau PNG.");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      toastError("Ukuran foto maksimal 3MB.");
      return;
    }
    setCropSrc(URL.createObjectURL(f));
    setCropZoom(100);
    setCropPos({ x: 0, y: 0 });
    setShowFotoModal(true);
    e.target.value = "";
  };

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

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.drawImage(img, offsetX * ratio, offsetY * ratio, drawnW * ratio, drawnH * ratio);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toastError("Gagal memproses foto. Silakan coba unggah foto baru.");
            return;
          }
          const file = new File([blob], "foto-profil.jpg", { type: "image/jpeg" });
          setFotoPreview(URL.createObjectURL(blob));

          const formData = new FormData();
          formData.append("foto_profil", file);

          setFotoLoading(true);
          uploadFotoAdmin(formData)
            .then((res) => {
              const newPath = res.data?.data?.foto_profil;
              setProfile((prev) => (prev ? { ...prev, foto_profil: newPath } : prev));
              setShowFotoModal(false);
              toastSuccess("Foto profil administrator berhasil diperbarui!");
              setReloadKey((k) => k + 1);
            })
            .catch((err) => {
              toastError(err.response?.data?.message || "Gagal mengunggah foto profil.");
            })
            .finally(() => {
              setFotoLoading(false);
            });
        },
        "image/jpeg",
        0.92
      );
    } catch {
      toastError("Terjadi kesalahan saat memproses gambar.");
    }
  };

  const handleHapusFoto = async () => {
    const result = await confirmDialog({
      title: "Hapus foto profil?",
      text: "Foto profil Anda akan dihapus dan kembali ke inisial nama default.",
      confirmText: "Ya, Hapus",
      danger: true,
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    setFotoDeleteLoading(true);
    try {
      await hapusFotoAdmin();
      setFotoPreview(null);
      setProfile((prev) => (prev ? { ...prev, foto_profil: "" } : prev));
      if (showFotoModal) setShowFotoModal(false);
      toastSuccess("Foto profil berhasil dihapus.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus foto profil.");
    } finally {
      setFotoDeleteLoading(false);
    }
  };

  // ── Ganti Email Modal State & OTP Handlers ──
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState("input");
  const [emailBaru, setEmailBaru] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);

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

  const handleOpenEmailModal = () => {
    setEmailStep("input");
    setEmailBaru("");
    setOtpInput("");
    setEmailError("");
    setResendCooldown(0);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setShowEmailModal(true);
  };

  const handleBackToEmailInput = () => {
    setEmailStep("input");
    setEmailError("");
    setOtpInput("");
  };

  const handleRequestOtpEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    const currentEmail = profile?.email || "";
    if (emailBaru.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError("Email baru tidak boleh sama dengan email saat ini.");
      return;
    }
    setEmailLoading(true);
    try {
      await requestGantiEmailManajemen({ email_baru: emailBaru.trim() });
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
      await requestGantiEmailManajemen({ email_baru: emailBaru.trim() });
      startResendCooldown();
      toastSuccess("Kode OTP berhasil dikirim ulang ke email baru Anda.");
    } catch (err) {
      setEmailError(err.response?.data?.message || "Gagal mengirim ulang kode OTP.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifikasiOtpEmail = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      setEmailError("");
      setEmailLoading(true);
      try {
        const res = await verifikasiGantiEmailManajemen({ otp: otpInput });
        const newEmail = res.data?.data?.email || res.data?.email || emailBaru.trim();

        setProfile((prev) => {
          if (!prev) return prev;
          return { ...prev, email: newEmail };
        });

        try {
          const storedUser = sessionStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.email = newEmail;
            sessionStorage.setItem("user", JSON.stringify(parsed));
          }
        } catch (storageErr) {
          console.warn("Gagal memperbarui session storage:", storageErr);
        }

        setShowEmailModal(false);
        toastSuccess("Alamat email administrator berhasil diperbarui!");
      } catch (err) {
        setEmailError(err.response?.data?.message || "Kode OTP tidak valid atau sudah kedaluwarsa.");
      } finally {
        setEmailLoading(false);
      }
    },
    [emailBaru, otpInput]
  );

  // Otomatis verifikasi saat mengetik 6 digit OTP
  useEffect(() => {
    if (otpInput.length === 6 && emailStep === "otp" && !emailLoading) {
      const timeoutId = setTimeout(() => {
        handleVerifikasiOtpEmail({ preventDefault: () => {} });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [otpInput, emailStep, emailLoading, handleVerifikasiOtpEmail]);

  const fotoSrc = fotoPreview || (profile?.foto_profil ? getFileUrl(profile.foto_profil) : null);
  const inisial = profile?.nama
    ? profile.nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  const TABS = [
    { id: "profil", label: "Data Diri & Akun", icon: UserCheck },
    { id: "keamanan", label: "Keamanan & Kata Sandi", icon: Lock },
    { id: "notifikasi", label: "Pengaturan Notifikasi", icon: BellRing },
  ];

  return (
    <AdminLayout showSearch={false}>
      <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Title Bar */}
        <div className="min-w-0">
          <h2
            className={`text-lg sm:text-2xl font-black tracking-tight ${
              dk ? "text-slate-100" : "text-[#0B1442]"
            } dark:text-slate-100`}
          >
            Kelola Akun &amp; Profil Administrator
          </h2>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-normal sm:leading-relaxed text-slate-500 dark:text-slate-400">
            <span className="sm:hidden">Informasi profil dan pengaturan akun administrator sistem.</span>
            <span className="hidden sm:inline">
              Perbarui foto profil, lihat informasi data akun, dan kelola keamanan serta preferensi notifikasi Anda.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-[#004F9F] mb-3" />
            Memuat informasi akun administrator...
          </div>
        ) : (
          <div className="w-full max-w-full space-y-4 sm:space-y-6">
            {/* ══════════════════════════════════════════════════════════════════════
                HERO PROFILE CARD (ROLE: ADMINISTRATOR)
            ══════════════════════════════════════════════════════════════════════ */}
            <div
              className={`relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 ${
                dk
                  ? "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#122B70] border-white/10"
                  : "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#003882] border-blue-900/40 text-white"
              }`}
            >
              {/* Ambient Glows & Radial Dot Matrix */}
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
              <div className="absolute right-60 -bottom-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Watermark Icon - Pojok Kanan */}
              <ShieldCheck
                className="pointer-events-none absolute -right-6 sm:-right-4 -top-6 sm:-top-8 w-48 h-48 sm:w-64 sm:h-64 text-white opacity-[0.08] sm:opacity-[0.09] rotate-12"
                strokeWidth={1}
              />

              <div className="relative p-3.5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
                {/* ── SISI KIRI: Avatar + Identitas ── */}
                <div className="flex flex-row items-start sm:items-center gap-2.5 sm:gap-5 min-w-0 flex-1">
                  {/* Avatar Square with Camera Badge */}
                  <div
                    className="relative group shrink-0 self-start sm:self-auto cursor-pointer"
                    onClick={handleOpenCropModal}
                    title="Klik untuk ubah foto profil"
                  >
                    <div className="h-14 w-14 sm:h-24 sm:w-24 rounded-xl sm:rounded-2xl overflow-hidden ring-2 sm:ring-3 ring-white/30 shadow-xl bg-slate-800 flex items-center justify-center transition-all duration-300 group-hover:ring-sky-400">
                      {fotoSrc ? (
                        <img
                          src={fotoSrc}
                          alt={profile?.nama || "Foto Profil Admin"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xl sm:text-3xl font-black text-white bg-gradient-to-br from-[#0B1442] to-[#00A5EC] w-full h-full flex items-center justify-center">
                          {inisial}
                        </span>
                      )}
                    </div>

                    {/* Camera overlay on hover */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>

                    {/* Corner Badge */}
                    {fotoSrc ? (
                      <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5">
                        <div className="sm:hidden h-5 w-5 rounded-full bg-[#004F9F] dark:bg-sky-500 ring-2 ring-white dark:ring-[#0B1A4C] flex items-center justify-center shadow-md pointer-events-none">
                          <Camera className="w-2.5 h-2.5 text-white" />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHapusFoto();
                          }}
                          disabled={fotoDeleteLoading}
                          title="Hapus foto profil"
                          className="hidden sm:flex h-6 w-6 rounded-full bg-[#004F9F] dark:bg-sky-500 group-hover:bg-rose-600 hover:!bg-rose-700 text-white ring-2 ring-white dark:ring-[#0B1A4C] items-center justify-center shadow-md transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer z-10 disabled:opacity-50"
                        >
                          {fotoDeleteLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5 text-white group-hover:hidden transition-all" />
                              <Trash2 className="w-3.5 h-3.5 text-white hidden group-hover:block transition-all" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#004F9F] dark:bg-sky-500 ring-2 ring-white dark:ring-[#0B1A4C] flex items-center justify-center shadow-md">
                        <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info User */}
                  <div className="min-w-0 text-white flex-1 space-y-0.5 sm:space-y-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug break-words max-w-full">
                        {profile?.nama || "Administrator SIM Magang"}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-[8.5px] sm:text-[10px] font-bold text-white border border-white/20 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {profile?.status_akun === "aktif" ? "Akun Aktif" : profile?.status_akun || "Aktif"}
                      </span>
                    </div>

                    {/* Jabatan & Divisi */}
                    <p className="text-[10.5px] sm:text-sm font-medium text-blue-100/90 truncate flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
                      <span className="truncate">
                        {profile?.jabatan || "Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo"}
                      </span>
                    </p>

                    {/* Metadata Badges: Role, Email, Telepon */}
                    <div className="pt-1 sm:pt-0 sm:mt-3 flex flex-wrap items-center gap-1 sm:gap-2.5 text-[8.5px] sm:text-xs font-semibold text-white/90 min-w-0 max-w-full">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-black/25 sm:bg-black/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-white/10 backdrop-blur-xs shrink-0">
                        <BadgeCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
                        <span className="whitespace-nowrap uppercase">
                          Role: {profile?.role || "Administrator"}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-black/25 sm:bg-black/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-white/10 backdrop-blur-xs min-w-0 shrink">
                        <Mail className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
                        <span className="truncate font-mono" title={profile?.email}>
                          {profile?.email || "-"}
                        </span>
                      </span>

                      {profile?.no_hp && (
                        <span className="hidden md:inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-black/25 sm:bg-black/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-white/10 backdrop-blur-xs shrink-0">
                          <Phone className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-300 shrink-0" />
                          <span>{profile.no_hp}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SISI KANAN: Status Hak Akses & Keamanan Akun ── */}
                <div className="w-full lg:w-80 xl:w-84 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/15 to-white/5 dark:from-white/10 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/15 p-3 sm:p-5 shadow-xl shadow-black/10 shrink-0 text-white relative z-10 overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

                  {/* Header Box */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-400"></span>
                      </span>
                      <span className="text-[10.5px] sm:text-xs font-bold text-white tracking-wide">
                        Status Autentikasi
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] sm:text-[10px] font-bold">
                      Terverifikasi
                    </span>
                  </div>

                  {/* Role Authority Indicator */}
                  <div className="mt-2.5 sm:mt-3 rounded-lg sm:rounded-xl bg-black/25 dark:bg-black/35 border border-white/10 p-2 sm:p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-[8px] sm:text-[9px] font-medium text-blue-200/70 uppercase tracking-wider leading-none mb-0.5">
                        Otoritas Akun
                      </span>
                      <span className="text-[11px] sm:text-xs font-extrabold text-white truncate block">
                        {profile?.role === "super_admin" ? "Super Administrator" : "Hak Akses Penuh Sistem"}
                      </span>
                    </div>
                    <Server className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                HORIZONTAL TAB NAVIGATION BAR (3-TAB GRID)
            ══════════════════════════════════════════════════════════════════════ */}
            <div
              className={`relative w-full max-w-2xl overflow-hidden rounded-xl sm:rounded-2xl border p-1 sm:p-1.5 shadow-xs transition-colors duration-300 ${
                dk ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br from-[#00A5EC] to-[#004F9F] blur-3xl ${
                  dk ? "opacity-10" : "opacity-[0.07]"
                }`}
              />

              <div className="relative flex sm:grid sm:grid-cols-3 w-full snap-x gap-1 sm:gap-1.5 overflow-x-auto sm:overflow-x-visible py-0.5 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`group/tab relative inline-flex shrink-0 sm:shrink sm:w-full snap-start cursor-pointer items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl py-1.5 px-2.5 sm:py-2 sm:px-3 text-[11px] sm:text-xs font-bold transition-all duration-300 active:scale-[0.97] select-none overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white shadow-md shadow-[#004F9F]/25 dark:shadow-[#00A5EC]/20 ring-1 ring-sky-400/30 scale-[1.01] z-10"
                          : dk
                          ? "text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 hover:-translate-y-0.5"
                          : "text-slate-600 hover:bg-slate-100/90 hover:text-[#0B1442] hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Ambient active glow shimmer on background */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00A5EC]/20 via-sky-400/10 to-transparent pointer-events-none animate-pulse" />
                      )}

                      <span
                        className={`relative flex h-5.5 w-5.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white/20 text-white shadow-inner scale-105"
                            : dk
                            ? "bg-white/[0.06] text-slate-400 group-hover/tab:bg-[#00A5EC]/20 group-hover/tab:text-[#00A5EC] group-hover/tab:scale-105 group-hover/tab:-rotate-3"
                            : "bg-slate-100 text-slate-500 group-hover/tab:bg-[#00A5EC]/15 group-hover/tab:text-[#004F9F] group-hover/tab:scale-105 group-hover/tab:-rotate-3"
                        }`}
                      >
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.2} />
                      </span>

                      <span className="relative whitespace-nowrap transition-transform duration-300">
                        {tab.label}
                      </span>

                      {/* Active bottom indicator bar */}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-10 h-0.5 rounded-full bg-gradient-to-r from-[#00A5EC] to-sky-300 shadow-[0_0_8px_rgba(0,165,236,0.9)] animate-[popIn_0.25s_cubic-bezier(0.16,1,0.3,1)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                TAB CONTENTS
            ══════════════════════════════════════════════════════════════════════ */}
            <div
              key={activeTab}
              className="w-full animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
            >
              {/* TAB 1: DATA DIRI & INFORMASI AKUN */}
              {activeTab === "profil" && (
                <TabProfilAdmin
                  dk={dk}
                  profile={profile}
                  profilForm={profilForm}
                  setProfilForm={setProfilForm}
                  isFieldChanged={isProfilFieldChanged}
                  handleBatalField={handleBatalProfilField}
                  handleSave={handleSimpanProfil}
                  saving={savingProfil}
                  onNavigateToKeamanan={() => {
                    setActiveTab("keamanan");
                    setTimeout(() => {
                      const el = document.getElementById("card-email-keamanan");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }, 100);
                  }}
                />
              )}

              {/* TAB 2: KEAMANAN & KATA SANDI */}
              {activeTab === "keamanan" && (
                <TabKeamanan
                  dk={dk}
                  profile={profile}
                  pendaftaran={{}}
                  lastPasswordUpdateText={lastPasswordUpdateText}
                  passwordLastUpdated={passwordLastUpdated}
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  showOld={showOld}
                  setShowOld={setShowOld}
                  showNew={showNew}
                  setShowNew={setShowNew}
                  showConfirm={showConfirm}
                  setShowConfirm={setShowConfirm}
                  passwordStrength={passwordStrength}
                  savingPassword={savingPassword}
                  handleGantiPassword={handleGantiPassword}
                  handleLupaPasswordClick={handleLupaPasswordClick}
                  handleOpenGantiEmailModal={handleOpenEmailModal}
                  deviceInfo={deviceInfo}
                  loginHistories={loginHistories}
                />
              )}

              {/* TAB 3: PENGATURAN NOTIFIKASI */}
              {activeTab === "notifikasi" && (
                <TabNotifikasiAdmin
                  dk={dk}
                  profile={profile}
                />
              )}
            </div>
          </div>
        )}

        {/* Modal Crop Foto Profil */}
        <FotoProfilModal
          dk={dk}
          divider={dk ? "border-white/10" : "border-slate-200"}
          sub={dk ? "text-slate-400" : "text-slate-500"}
          showFotoModal={showFotoModal}
          setShowFotoModal={setShowFotoModal}
          cropSrc={cropSrc}
          cropImgRef={cropImgRef}
          cropPos={cropPos}
          cropZoom={cropZoom}
          setCropZoom={setCropZoom}
          isDragging={isDragging}
          handleDragStart={handleDragStart}
          cropFileInputRef={cropFileInputRef}
          handleSimpanPerubahanFoto={handleSimpanPerubahanFoto}
          fotoModalLoading={fotoModalLoading || fotoLoading}
          handleHapusFoto={handleHapusFoto}
          hasExistingFoto={Boolean(fotoSrc)}
          fotoDeleteLoading={fotoDeleteLoading}
        />

        {/* Modal Ganti Email & Verifikasi OTP */}
        <GantiEmailModal
          dk={dk}
          userEmail={profile?.email || ""}
          showEmailModal={showEmailModal}
          setShowEmailModal={setShowEmailModal}
          emailStep={emailStep}
          emailBaru={emailBaru}
          setEmailBaru={setEmailBaru}
          otpInput={otpInput}
          setOtpInput={setOtpInput}
          emailLoading={emailLoading}
          emailError={emailError}
          handleRequestOtpEmail={handleRequestOtpEmail}
          handleVerifikasiOtpEmail={handleVerifikasiOtpEmail}
          handleBackToEmailInput={handleBackToEmailInput}
          resendCooldown={resendCooldown}
          handleResendOtp={handleResendOtp}
        />

        {/* Hidden Input for Selecting Image File */}
        <input
          ref={cropFileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleCropFileSelected}
        />
      </div>
    </AdminLayout>
  );
};

export default KelolaAkunPage;