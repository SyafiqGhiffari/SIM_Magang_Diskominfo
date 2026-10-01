import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
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
import UploadDokumenModal from "../../components/manajemen/peserta/akun/UploadDokumenModal";
import GantiEmailModal from "../../components/manajemen/shared/akun/GantiEmailModal";
import DocumentPreviewModal from "../../components/manajemen/peserta/akun/DocumentPreviewModal";
import TabBiodataDokumen from "../../components/manajemen/peserta/akun/tabs/TabBiodataDokumen";
import TabKeamanan from "../../components/manajemen/shared/akun/TabKeamanan";
import TabNotifikasi from "../../components/manajemen/peserta/akun/tabs/TabNotifikasi";
import {
  UserCheck,
  Camera,
  Trash2,
  Building2,
  Calendar,
  Award,
  RefreshCw,
  Clock,
  Lock,
  BellRing,
  Smartphone,
  Laptop,
} from "lucide-react";

export const PesertaAkunPage = () => {
  const { isDark } = useManajemenTheme();
  const dk = isDark;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [loginHistories, setLoginHistories] = useState([]);

  // ── Fetch Riwayat Login Peserta ──
  useEffect(() => {
    let isMounted = true;
    getRiwayatLoginPeserta()
      .then((res) => {
        if (isMounted && res.data?.data) {
          setLoginHistories(res.data.data);
        }
      })
      .catch(() => {
        // Abaikan jika token pendaftar belum siap
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // ── Tab State: "biodata" | "keamanan" | "kontak" | "notifikasi" ──
  const [activeTab, setActiveTab] = useState("biodata");

  // ── Password Form ──
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

    // All 4 criteria met -> 100% Sangat Aman (Emerald Green)
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

  // ── Estimasi Riwayat Pembaruan Kata Sandi ──
  const [passwordLastUpdated, setPasswordLastUpdated] = useState(null);

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
      text: "Untuk mengatur ulang kata sandi yang terlupa, Anda dapat menghubungi Admin SIM Magang Diskominfo Ponorogo atau mengajukan permohonan pemulihan melalui email resmi terdaftar.",
      confirmText: "Mengerti",
      showCancelButton: false,
      icon: "info",
    });
  };

  // ── Biodata Form State (Dapat diedit langsung oleh Peserta) ──
  const [biodataForm, setBiodataForm] = useState({
    nama: "",
    npm_nim: "",
    nisn: "",
    jenis_kelamin: "Laki-laki",
    tempat_lahir: "",
    tanggal_lahir: "",
    no_hp: "",
    alamat_lengkap: "",
  });
  const [savingBiodata, setSavingBiodata] = useState(false);

  // ── Akademik Form State (Dapat diedit langsung oleh Peserta - Opsi B) ──
  const [akademikForm, setAkademikForm] = useState({
    asal_kampus: "",
    asal_sekolah: "",
    npm_nim: "",
    nisn: "",
    fakultas: "",
    kelas: "",
    program_studi: "",
    jurusan_sekolah: "",
    semester: "",
  });
  const [savingAkademik, setSavingAkademik] = useState(false);

  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const genderDropdownRef = useRef(null);

  // Click outside listener for Gender dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target)
      ) {
        setGenderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ── Foto Profil State & Crop Modal ──
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoDeleteLoading, setFotoDeleteLoading] = useState(false);
  const [fotoModalLoading, setFotoModalLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);

  // ── Dokumen Modal State ──
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadDocJenis, setUploadDocJenis] = useState("file_cv");
  const [uploadDocMode, setUploadDocMode] = useState("baru"); // "baru" | "ganti"

  // ── Dokumen Preview State ──
  const [previewDoc, setPreviewDoc] = useState(null);

  const handlePreviewDoc = (docData) => {
    setPreviewDoc(docData);
  };

  const handleOpenUploadDoc = (jenis = null, mode = null) => {
    const determinedMode = mode || (jenis ? "ganti" : "baru");
    setUploadDocMode(determinedMode);
    setUploadDocJenis(jenis || "file_cv");
    setShowUploadDocModal(true);
  };

  const [showFotoModal, setShowFotoModal] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  // ── Ganti Email Modal State & OTP Handlers ──
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState("input"); // "input" | "otp"
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

  const handleNavigateToEmailCard = () => {
    setActiveTab("keamanan");
    setTimeout(() => {
      const el = document.getElementById("card-email-keamanan");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        el.classList.add(
          "ring-2",
          "ring-inset",
          "ring-[#004F9F]",
          "dark:ring-sky-400",
          "shadow-lg"
        );
        setTimeout(() => {
          el.classList.remove(
            "ring-2",
            "ring-inset",
            "ring-[#004F9F]",
            "dark:ring-sky-400",
            "shadow-lg"
          );
        }, 2500);
      }
    }, 150);
  };

  const handleBackToEmailInput = () => {
    setEmailStep("input");
    setEmailError("");
    setOtpInput("");
  };

  const handleRequestOtpEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    const currentEmail = profile?.email || profile?.pendaftaran?.email || "";
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

        // Update local profile state
        setProfile((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            email: newEmail,
            pendaftaran: prev.pendaftaran
              ? { ...prev.pendaftaran, email: newEmail }
              : prev.pendaftaran,
          };
          return updated;
        });

        // Update sessionStorage jika tersimpan
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
        toastSuccess("Alamat email berhasil diperbarui!");
      } catch (err) {
        setEmailError(err.response?.data?.message || "Kode OTP tidak valid atau sudah kedaluwarsa.");
      } finally {
        setEmailLoading(false);
      }
    },
    [emailBaru, otpInput, setEmailError, setEmailLoading, setShowEmailModal, setProfile]
  );

  // Otomatis verifikasi jika user sudah mengetik 6 digit OTP
  useEffect(() => {
    if (otpInput.length === 6 && emailStep === "otp" && !emailLoading) {
      const timeoutId = setTimeout(() => {
        handleVerifikasiOtpEmail({ preventDefault: () => {} });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [otpInput, emailStep, emailLoading, handleVerifikasiOtpEmail]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const res = await getMe();
        if (isMounted) {
          const data = res.data?.data || null;
          setProfile(data);
          const pd = data?.pendaftaran || {};
          const cleanTgl = pd.tanggal_lahir ? pd.tanggal_lahir.split("T")[0] : "";
          setBiodataForm({
            nama: data?.nama || pd.nama_lengkap || "",
            npm_nim: pd.npm_nim || data?.npm_nim || "",
            nisn: pd.nisn || data?.nisn || "",
            jenis_kelamin: pd.jenis_kelamin || "Laki-laki",
            tempat_lahir: pd.tempat_lahir || "",
            tanggal_lahir: cleanTgl,
            no_hp: data?.no_hp || pd.nomor_hp || "",
            alamat_lengkap: pd.alamat_lengkap || "",
          });
          setAkademikForm({
            asal_kampus: pd.asal_kampus || "",
            asal_sekolah: pd.asal_sekolah || "",
            npm_nim: pd.npm_nim || data?.npm_nim || "",
            nisn: pd.nisn || data?.nisn || "",
            fakultas: pd.fakultas || "",
            kelas: pd.kelas || "",
            program_studi: pd.program_studi || "",
            jurusan_sekolah: pd.jurusan_sekolah || "",
            semester: pd.semester || "",
          });
        }
      } catch {
        if (isMounted) {
          toastError("Gagal memuat profil akun.");
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

  // ── Drag handler untuk modal crop foto ──
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
              toastSuccess("Foto profil berhasil diperbarui!");
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

  // ── Simpan Pembaruan Biodata & Informasi Pribadi ──
  const handleSimpanBiodata = async (e) => {
    e.preventDefault();
    if (!profile) return;

    if (!biodataForm.nama.trim()) {
      toastError("Nama lengkap resmi wajib diisi.");
      return;
    }
    if (!biodataForm.no_hp.trim()) {
      toastError("Nomor WhatsApp / telepon wajib diisi.");
      return;
    }

    setSavingBiodata(true);
    try {
      await updateProfilAdmin({
        nama: biodataForm.nama.trim(),
        email: profile.email,
        no_hp: biodataForm.no_hp.trim(),
        jabatan: profile.jabatan || "",
        tempat_lahir: biodataForm.tempat_lahir.trim(),
        tanggal_lahir: biodataForm.tanggal_lahir ? biodataForm.tanggal_lahir.split("T")[0] : "",
        jenis_kelamin: biodataForm.jenis_kelamin,
        alamat_lengkap: biodataForm.alamat_lengkap.trim(),
        npm_nim: akademikForm.npm_nim.trim() || biodataForm.npm_nim.trim(),
        nisn: akademikForm.nisn.trim() || biodataForm.nisn.trim(),
        asal_kampus: akademikForm.asal_kampus.trim(),
        asal_sekolah: akademikForm.asal_sekolah.trim(),
        fakultas: akademikForm.fakultas.trim(),
        kelas: akademikForm.kelas.trim(),
        program_studi: akademikForm.program_studi.trim(),
        jurusan_sekolah: akademikForm.jurusan_sekolah.trim(),
        semester: akademikForm.semester.trim(),
      });
      toastSuccess("Informasi pribadi berhasil diperbarui!");
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nama: biodataForm.nama.trim(),
          no_hp: biodataForm.no_hp.trim(),
          pendaftaran: {
            ...prev.pendaftaran,
            nama_lengkap: biodataForm.nama.trim(),
            nomor_hp: biodataForm.no_hp.trim(),
            tempat_lahir: biodataForm.tempat_lahir.trim(),
            tanggal_lahir: biodataForm.tanggal_lahir ? biodataForm.tanggal_lahir.split("T")[0] : "",
            jenis_kelamin: biodataForm.jenis_kelamin,
            alamat_lengkap: biodataForm.alamat_lengkap.trim(),
            npm_nim: akademikForm.npm_nim.trim() || biodataForm.npm_nim.trim(),
            nisn: akademikForm.nisn.trim() || biodataForm.nisn.trim(),
          },
        };
      });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui informasi pribadi.");
    } finally {
      setSavingBiodata(false);
    }
  };

  // ── Simpan Pembaruan Data Akademik (Opsi B) ──
  const handleSimpanAkademik = async (e) => {
    e.preventDefault();
    if (!profile) return;

    if (isMahasiswa) {
      if (!akademikForm.asal_kampus.trim()) {
        toastError("Asal universitas / politeknik wajib diisi.");
        return;
      }
      if (!akademikForm.npm_nim.trim()) {
        toastError("Nomor Induk Mahasiswa (NIM) wajib diisi.");
        return;
      }
    } else {
      if (!akademikForm.asal_sekolah.trim()) {
        toastError("Asal sekolah / SMK wajib diisi.");
        return;
      }
      if (!akademikForm.nisn.trim()) {
        toastError("Nomor Induk Siswa Nasional (NISN) wajib diisi.");
        return;
      }
    }

    setSavingAkademik(true);
    try {
      await updateProfilAdmin({
        nama: profile.nama || biodataForm.nama.trim(),
        email: profile.email,
        no_hp: profile.no_hp || biodataForm.no_hp.trim(),
        jabatan: profile.jabatan || "",
        tempat_lahir: biodataForm.tempat_lahir ? biodataForm.tempat_lahir.trim() : "",
        tanggal_lahir: biodataForm.tanggal_lahir ? biodataForm.tanggal_lahir.split("T")[0] : "",
        jenis_kelamin: biodataForm.jenis_kelamin,
        alamat_lengkap: biodataForm.alamat_lengkap ? biodataForm.alamat_lengkap.trim() : "",
        npm_nim: akademikForm.npm_nim.trim(),
        nisn: akademikForm.nisn.trim(),
        asal_kampus: akademikForm.asal_kampus.trim(),
        asal_sekolah: akademikForm.asal_sekolah.trim(),
        fakultas: akademikForm.fakultas.trim(),
        kelas: akademikForm.kelas.trim(),
        program_studi: akademikForm.program_studi.trim(),
        jurusan_sekolah: akademikForm.jurusan_sekolah.trim(),
        semester: akademikForm.semester.trim(),
      });
      toastSuccess("Informasi akademik berhasil diperbarui!");
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendaftaran: {
            ...prev.pendaftaran,
            npm_nim: akademikForm.npm_nim.trim(),
            nisn: akademikForm.nisn.trim(),
            asal_kampus: akademikForm.asal_kampus.trim(),
            asal_sekolah: akademikForm.asal_sekolah.trim(),
            fakultas: akademikForm.fakultas.trim(),
            kelas: akademikForm.kelas.trim(),
            program_studi: akademikForm.program_studi.trim(),
            jurusan_sekolah: akademikForm.jurusan_sekolah.trim(),
            semester: akademikForm.semester.trim(),
          },
        };
      });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui informasi akademik.");
    } finally {
      setSavingAkademik(false);
    }
  };

  // ── Simpan Perubahan Password ──
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
      title: "Perbarui Kata Sandi?",
      text: "Apakah Anda yakin ingin memperbarui kata sandi akun Anda?",
      confirmText: "Ya, Perbarui Sandi",
      cancelText: "Batal",
      icon: "question",
    });

    if (!result.isConfirmed) return;

    setSavingPassword(true);
    try {
      const res = await gantiPasswordAdmin({
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });
      const newPwdTime = res?.data?.data?.password_changed_at || new Date().toISOString();
      setPasswordLastUpdated(newPwdTime);
      setProfile((prev) => (prev ? { ...prev, password_changed_at: newPwdTime } : prev));
      toastSuccess("Kata sandi berhasil diubah! Gunakan kata sandi baru untuk login berikutnya.");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengubah kata sandi.");
    } finally {
      setSavingPassword(false);
    }
  };

  const pendaftaran = useMemo(() => profile?.pendaftaran || {}, [profile?.pendaftaran]);
  const mentor = pendaftaran?.mentor || null;
  const isMahasiswa = pendaftaran?.kategori_pendaftar === "mahasiswa";
  const statusMagang = profile?.status_magang || "aktif";

  // ── Nomor Registrasi Resmi Magang / Siswa ──
  const nomorRegistrasi = useMemo(() => {
    const rawDate = pendaftaran.tanggal_mulai || pendaftaran.created_at;
    const tahun = rawDate ? new Date(rawDate).getFullYear() : 2026;
    const urut = String(pendaftaran.id || profile?.id || 1).padStart(4, "0");
    return isMahasiswa
      ? `#MHS-MG-${tahun}-${urut}`
      : `#SISWA-PKL-${tahun}-${urut}`;
  }, [isMahasiswa, pendaftaran.tanggal_mulai, pendaftaran.created_at, pendaftaran.id, profile?.id]);

  // ── Format Tanggal Bahasa Indonesia (contoh: 22 Februari 2026) ──
  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "";
    const clean = dateStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const monthName = months[monthIdx] || parts[1];
    return `${day} ${monthName} ${year}`;
  };

  // ── Pengecekan Perubahan Data Akademik Per Kolom (Dirty State) ──
  const isFieldChanged = useCallback(
    (fieldKey) => {
      const currentVal = (akademikForm[fieldKey] || "").trim();
      const originalVal =
        fieldKey === "npm_nim"
          ? (pendaftaran.npm_nim || profile?.npm_nim || "").trim()
          : fieldKey === "nisn"
          ? (pendaftaran.nisn || profile?.nisn || "").trim()
          : (pendaftaran[fieldKey] || "").trim();
      return currentVal !== originalVal;
    },
    [akademikForm, pendaftaran, profile]
  );

  // ── Pengecekan Perubahan Data Pribadi Per Kolom (Dirty State) ──
  const isBiodataFieldChanged = useCallback(
    (fieldKey) => {
      if (!profile) return false;
      const pd = profile.pendaftaran || {};
      if (fieldKey === "nama") {
        const cur = (biodataForm.nama || "").trim();
        const orig = (profile.nama || pd.nama_lengkap || "").trim();
        return cur !== orig;
      }
      if (fieldKey === "jenis_kelamin") {
        const cur = (biodataForm.jenis_kelamin || "").trim();
        const orig = (profile.jenis_kelamin || pd.jenis_kelamin || "").trim();
        return cur !== orig;
      }
      if (fieldKey === "tempat_lahir") {
        const cur = (biodataForm.tempat_lahir || "").trim();
        const orig = (profile.tempat_lahir || pd.tempat_lahir || "").trim();
        return cur !== orig;
      }
      if (fieldKey === "tanggal_lahir") {
        const cur = (biodataForm.tanggal_lahir || "").trim().split("T")[0];
        const orig = (profile.tanggal_lahir || pd.tanggal_lahir || "").trim().split("T")[0];
        return cur !== orig;
      }
      if (fieldKey === "no_hp") {
        const cur = (biodataForm.no_hp || "").trim();
        const orig = (profile.no_hp || pd.nomor_hp || "").trim();
        return cur !== orig;
      }
      if (fieldKey === "alamat_lengkap") {
        const cur = (biodataForm.alamat_lengkap || "").trim();
        const orig = (profile.alamat_lengkap || pd.alamat_lengkap || "").trim();
        return cur !== orig;
      }
      return false;
    },
    [biodataForm, profile]
  );

  const handleBatalBiodataField = (fieldKey) => {
    if (!profile) return;
    const pd = profile.pendaftaran || {};
    let orig = "";
    if (fieldKey === "nama") orig = profile.nama || pd.nama_lengkap || "";
    else if (fieldKey === "jenis_kelamin") orig = profile.jenis_kelamin || pd.jenis_kelamin || "";
    else if (fieldKey === "tempat_lahir") orig = profile.tempat_lahir || pd.tempat_lahir || "";
    else if (fieldKey === "tanggal_lahir") orig = (profile.tanggal_lahir || pd.tanggal_lahir || "").split("T")[0];
    else if (fieldKey === "no_hp") orig = profile.no_hp || pd.nomor_hp || "";
    else if (fieldKey === "alamat_lengkap") orig = profile.alamat_lengkap || pd.alamat_lengkap || "";
    setBiodataForm((prev) => ({ ...prev, [fieldKey]: orig }));
  };

  const handleBatalField = (fieldKey) => {
    const pd = profile?.pendaftaran || {};
    let orig = "";
    if (fieldKey === "npm_nim") orig = pd.npm_nim || profile?.npm_nim || "";
    else if (fieldKey === "nisn") orig = pd.nisn || profile?.nisn || "";
    else orig = pd[fieldKey] || "";
    setAkademikForm((prev) => ({ ...prev, [fieldKey]: orig }));
  };

  const fotoSrc = fotoPreview || (profile?.foto_profil ? getFileUrl(profile.foto_profil) : null);
  const inisial = profile?.nama
    ? profile.nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

  const mentorFotoSrc = mentor?.foto_profil ? getFileUrl(mentor.foto_profil) : null;
  const mentorInisial = mentor?.nama
    ? mentor.nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "M";

  // ── Perhitungan Progres Magang ──
  const { progresPersen, mingguKe, totalMinggu, sisaHariKerja } = useMemo(() => {
    const tglMulaiStr = pendaftaran.tanggal_mulai;
    const tglSelesaiStr = pendaftaran.tanggal_selesai;
    const tglMulai = tglMulaiStr ? new Date(tglMulaiStr) : null;
    const tglSelesai = tglSelesaiStr ? new Date(tglSelesaiStr) : null;
    const now = new Date();

    const hitungHariKerja = (start, end) => {
      let count = 0;
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const target = new Date(end);
      target.setHours(0, 0, 0, 0);
      while (cur <= target) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    };

    if (tglMulai && tglSelesai && !isNaN(tglMulai.getTime()) && !isNaN(tglSelesai.getTime())) {
      const diffTotal = Math.max(1, Math.round((tglSelesai - tglMulai) / (1000 * 60 * 60 * 24)));
      const totalMg = Math.max(1, Math.ceil(diffTotal / 7));
      const totalWorkDays = hitungHariKerja(tglMulai, tglSelesai);

      if (now < tglMulai) {
        return { progresPersen: 0, mingguKe: 0, totalMinggu: totalMg, sisaHariKerja: totalWorkDays };
      }
      if (now > tglSelesai || statusMagang === "selesai") {
        return { progresPersen: 100, mingguKe: totalMg, totalMinggu: totalMg, sisaHariKerja: 0 };
      }

      const diffJalan = Math.round((now - tglMulai) / (1000 * 60 * 60 * 24));
      const persen = Math.min(100, Math.max(0, Math.round((diffJalan / diffTotal) * 100)));
      const mgKe = Math.min(totalMg, Math.max(1, Math.ceil(diffJalan / 7)));
      const sisaKerja = hitungHariKerja(now, tglSelesai);
      return { progresPersen: persen, mingguKe: mgKe, totalMinggu: totalMg, sisaHariKerja: sisaKerja };
    }

    // Default estimasi
    return { progresPersen: 75, mingguKe: 9, totalMinggu: 12, sisaHariKerja: 18 };
  }, [pendaftaran.tanggal_mulai, pendaftaran.tanggal_selesai, statusMagang]);

  const TABS = [
    { id: "biodata", label: "Data Diri & Akademik", icon: UserCheck },
    { id: "keamanan", label: "Keamanan & Kata Sandi", icon: Lock },
    { id: "notifikasi", label: "Pengaturan Notifikasi", icon: BellRing },
  ];

  return (
    <PesertaLayout>
      <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Title Bar */}
        <div className="min-w-0">
          <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${dk ? "text-slate-100" : "text-[#0B1442]"} dark:text-slate-100`}>
            Kelola Akun &amp; Biodata Peserta
          </h2>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-normal sm:leading-relaxed text-slate-500 dark:text-slate-400">
            <span className="sm:hidden">Informasi profil dan pengaturan akun magang Anda.</span>
            <span className="hidden sm:inline">Informasi profil, status penempatan magang, dan pengaturan keamanan serta notifikasi akun Anda.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-[#004F9F] mb-3" />
            Memuat informasi profil akun...
          </div>
        ) : (
          <div className="w-full max-w-full space-y-4 sm:space-y-6">
            {/* ══════════════════════════════════════════════════════════════════════
                HERO PROFILE CARD
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
              <UserCheck
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
                          alt={profile?.nama || "Foto Profil"}
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
                        {/* Mobile: Ikon Kamera statis */}
                        <div className="sm:hidden h-5 w-5 rounded-full bg-[#004F9F] dark:bg-sky-500 ring-2 ring-white dark:ring-[#0B1A4C] flex items-center justify-center shadow-md pointer-events-none">
                          <Camera className="w-2.5 h-2.5 text-white" />
                        </div>

                        {/* Desktop: Tombol Hapus saat hover */}
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
                        {profile?.nama || "Peserta Magang"}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-[8.5px] sm:text-[10px] font-bold text-white border border-white/20 shrink-0">
                        {statusMagang === "selesai" ? "Alumni Magang" : "Peserta Aktif"}
                      </span>
                    </div>

                    {/* Mobile: Prodi & Bidang 2 baris terpisah */}
                    <div className="sm:hidden">
                      <p className="text-[10.5px] font-medium text-blue-100/90 leading-tight break-words max-w-full">
                        {isMahasiswa
                          ? `Program Studi ${pendaftaran.program_studi || "Sistem Informasi"}`
                          : `Jurusan ${pendaftaran.jurusan_sekolah || "Rekayasa Perangkat Lunak"}`}
                      </p>
                      <p className="text-[10px] font-medium text-sky-200/80 leading-tight break-words max-w-full mt-0.5">
                        {pendaftaran.posisi_bidang?.toLowerCase().startsWith("bidang")
                          ? pendaftaran.posisi_bidang
                          : `Bidang ${pendaftaran.posisi_bidang || "Aplikasi dan Informatika"}`}
                      </p>
                    </div>

                    {/* Desktop: Prodi & Bidang 1 baris */}
                    <p className="hidden sm:block mt-1 text-xs sm:text-sm font-medium text-blue-100/90 truncate">
                      {isMahasiswa
                        ? `Program Studi ${pendaftaran.program_studi || "Sistem Informasi"}`
                        : `Jurusan ${pendaftaran.jurusan_sekolah || "Rekayasa Perangkat Lunak"}`}{" "}
                      •{" "}
                      {pendaftaran.posisi_bidang?.toLowerCase().startsWith("bidang")
                        ? pendaftaran.posisi_bidang
                        : `Bidang ${pendaftaran.posisi_bidang || "Aplikasi dan Informatika"}`}
                    </p>

                    {/* Metadata: NIM/NPM & Asal Kampus/Sekolah */}
                    <div className="pt-1 sm:pt-0 sm:mt-3 flex flex-row flex-nowrap items-center gap-1 sm:gap-4 text-[8.5px] sm:text-xs font-semibold text-white/90 min-w-0 max-w-full">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-black/25 sm:bg-black/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-white/10 backdrop-blur-xs shrink-0">
                        <Award className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                        <span className="whitespace-nowrap">
                          <span className="hidden sm:inline">{isMahasiswa ? "NIM/NPM: " : "NISN: "}</span>
                          {isMahasiswa ? pendaftaran.npm_nim || "-" : pendaftaran.nisn || "-"}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-black/25 sm:bg-black/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-white/10 backdrop-blur-xs min-w-0 shrink">
                        <Building2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                        <span
                          className="truncate"
                          title={isMahasiswa ? pendaftaran.asal_kampus : pendaftaran.asal_sekolah}
                        >
                          {isMahasiswa
                            ? pendaftaran.asal_kampus || "Perguruan Tinggi"
                            : pendaftaran.asal_sekolah || "Sekolah"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── SISI KANAN: Banner Progres Magang ── */}
                <div className="w-full lg:w-80 xl:w-84 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/15 to-white/5 dark:from-white/10 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/15 p-3 sm:p-5 shadow-xl shadow-black/10 shrink-0 text-white relative z-10 overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

                  {/* Header Box: Status Pulse + Percentage */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-400"></span>
                      </span>
                      <span className="text-[10.5px] sm:text-xs font-bold text-white tracking-wide">
                        Progres Magang
                      </span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                        {progresPersen}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-sky-300">%</span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="mt-2 sm:mt-3 h-2 sm:h-2.5 w-full rounded-full bg-black/35 dark:bg-black/45 overflow-hidden border border-white/15 p-0.5 shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400 shadow-sm transition-all duration-700 ease-out relative"
                      style={{ width: `${progresPersen}%` }}
                    >
                      <div className="absolute inset-0 bg-white/25 rounded-full animate-[pulse_2s_infinite]" />
                    </div>
                  </div>

                  {/* Dual Metric Badges */}
                  <div className="mt-2.5 sm:mt-3.5 grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/20 dark:bg-black/30 border border-white/10 backdrop-blur-xs text-[10px] sm:text-[11px] font-semibold text-white/90">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[8px] sm:text-[9px] font-medium text-blue-200/70 uppercase tracking-wider leading-none mb-0.5">Durasi</span>
                        <span className="font-bold text-white truncate text-[10px] sm:text-[11px]">
                          Minggu {mingguKe} <span className="text-blue-200/60 font-normal text-[9px] sm:text-[10px]">/{totalMinggu}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/20 dark:bg-black/30 border border-white/10 backdrop-blur-xs text-[10px] sm:text-[11px] font-semibold text-white/90">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[8px] sm:text-[9px] font-medium text-emerald-300/70 uppercase tracking-wider leading-none mb-0.5">Sisa Waktu</span>
                        <span className="font-bold text-white truncate text-[10px] sm:text-[11px]">
                          {sisaHariKerja} <span className="text-blue-200/60 font-normal text-[9px] sm:text-[10px]">Hari</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                HORIZONTAL TAB NAVIGATION BAR (COMPACT & SLEEK 3-TAB GRID)
            ══════════════════════════════════════════════════════════════════════ */}
            <div
              className={`relative w-full max-w-2xl overflow-hidden rounded-xl sm:rounded-2xl border p-1 sm:p-1.5 shadow-xs transition-colors duration-300 ${
                dk
                  ? "border-white/10 bg-[#161b22]"
                  : "border-slate-200/80 bg-white"
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
                TAB CONTENTS (DENGAN ANIMASI KEMUNCULAN HALUS PER TAB)
            ══════════════════════════════════════════════════════════════════════ */}
            <div
              key={activeTab}
              className="w-full animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
            >
              {/* TAB CONTENT 1: DATA DIRI & AKADEMIK */}
              {activeTab === "biodata" && (
                <TabBiodataDokumen
                  dk={dk}
                  profile={profile}
                  pendaftaran={pendaftaran}
                  isMahasiswa={isMahasiswa}
                  nomorRegistrasi={nomorRegistrasi}
                  mentor={mentor}
                  mentorFotoSrc={mentorFotoSrc}
                  mentorInisial={mentorInisial}
                  formatTanggalIndo={formatTanggalIndo}
                  totalMinggu={totalMinggu}
                  biodataForm={biodataForm}
                  setBiodataForm={setBiodataForm}
                  isBiodataFieldChanged={isBiodataFieldChanged}
                  handleBatalBiodataField={handleBatalBiodataField}
                  handleSimpanBiodata={handleSimpanBiodata}
                  savingBiodata={savingBiodata}
                  genderDropdownOpen={genderDropdownOpen}
                  setGenderDropdownOpen={setGenderDropdownOpen}
                  genderDropdownRef={genderDropdownRef}
                  akademikForm={akademikForm}
                  setAkademikForm={setAkademikForm}
                  isFieldChanged={isFieldChanged}
                  handleBatalField={handleBatalField}
                  handleSimpanAkademik={handleSimpanAkademik}
                  savingAkademik={savingAkademik}
                  handleOpenUploadDoc={handleOpenUploadDoc}
                  handlePreviewDoc={handlePreviewDoc}
                  handleOpenEmailModal={handleOpenEmailModal}
                  onNavigateToEmailCard={handleNavigateToEmailCard}
                />
              )}

              {/* TAB CONTENT 2: KEAMANAN & KATA SANDI */}
              {activeTab === "keamanan" && (
                <TabKeamanan
                  dk={dk}
                  profile={profile}
                  pendaftaran={pendaftaran}
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

              {/* TAB CONTENT 3: PENGATURAN NOTIFIKASI */}
              {activeTab === "notifikasi" && (
                <TabNotifikasi
                  dk={dk}
                  profile={profile}
                  pendaftaran={pendaftaran}
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
          userEmail={pendaftaran?.email || profile?.pendaftaran?.email || profile?.email || ""}
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

        {/* Modal Unggah / Ganti Berkas Dokumen */}
        <UploadDokumenModal
          dk={dk}
          isOpen={showUploadDocModal}
          onClose={() => setShowUploadDocModal(false)}
          initialJenis={uploadDocJenis}
          mode={uploadDocMode}
          pendaftaran={pendaftaran}
          onPreviewOldFile={handlePreviewDoc}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />

        {/* Modal Pratinjau Dokumen / Berkas */}
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
            isDark={dk}
          />
        )}

        {/* Hidden Input for Selecting Image File */}
        <input
          ref={cropFileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleCropFileSelected}
        />
      </div>
    </PesertaLayout>
  );
};

export default PesertaAkunPage;
