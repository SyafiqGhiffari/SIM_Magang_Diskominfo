import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  UserCheck,
  User,
  Users,
  ChevronDown,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MailCheck,
  Building2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Clock,
  XCircle,
  FileText,
  Camera,
  Trash2,
} from "lucide-react";
import FotoProfilModal from "./FotoProfilModal";
import GantiEmailModal from "./GantiEmailModal";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { updateProfil, gantiPassword } from "../../services/pendaftaranService";
import { getFileUrl } from "../../utils/fileUrl";

const TabKelolaAkun = ({
  dk,
  user,
  status,
  fotoPreview,
  fotoLoading,
  fotoDeleteLoading,
  fotoModalLoading,
  handleOpenCropModal,
  handleHapusFoto,
  cropFileInputRef,
  handleCropFileSelected,
  showFotoModal,
  setShowFotoModal,
  cropSrc,
  cropImgRef,
  cropPos,
  cropZoom,
  setCropZoom,
  isDragging,
  handleDragStart,
  handleSimpanPerubahanFoto,
  passwordError,
  passwordSuccess,
  passwordForm,
  setPasswordForm,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordLoading,
  setPasswordSuccess,
  setPasswordError,
  showEmailModal,
  setShowEmailModal,
  handleOpenEmailModal,
  emailStep,
  emailBaru,
  setEmailBaru,
  otpInput,
  setOtpInput,
  emailLoading,
  emailError,
  emailSuccessMsg,
  handleRequestOtpEmail,
  handleVerifikasiOtpEmail,
  handleBackToEmailInput,
  resendCooldown,
  handleResendOtp,
  passwordSuccessVisible,
  passwordErrorVisible,
  emailSuccessVisible,
  setUser,
  fetchStatus,
}) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const syncKey = `${user?.id}_${user?.nama}_${user?.no_hp}_${user?.institusi}_${status?.status_pendaftaran}_${status?.tempat_lahir}_${status?.tanggal_lahir}_${status?.jenis_kelamin}_${status?.alamat_lengkap}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  // ── Biodata Form State (Dapat diedit langsung per kolom dengan dirty state) ──
  const [biodataForm, setBiodataForm] = useState(() => ({
    nama: (user?.nama || status?.nama_lengkap || "").trim(),
    jenis_kelamin: status?.jenis_kelamin || user?.jenis_kelamin || "Laki-laki",
    tempat_lahir: status?.tempat_lahir || user?.tempat_lahir || "",
    tanggal_lahir: (status?.tanggal_lahir || user?.tanggal_lahir || "").split("T")[0] || "",
    no_hp: (user?.no_hp || status?.nomor_hp || status?.no_hp || "").trim(),
    institusi: (user?.institusi || status?.asal_kampus || status?.asal_sekolah || "").trim(),
    alamat_lengkap: (status?.alamat_lengkap || user?.alamat_lengkap || "").trim(),
  }));
  const [initialBiodataForm, setInitialBiodataForm] = useState(biodataForm);
  const [savingBiodata, setSavingBiodata] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const genderDropdownRef = useRef(null);

  // Sinkronisasi data saat user atau status diperbarui
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    const freshData = {
      nama: (user?.nama || status?.nama_lengkap || "").trim(),
      jenis_kelamin: status?.jenis_kelamin || user?.jenis_kelamin || "Laki-laki",
      tempat_lahir: status?.tempat_lahir || user?.tempat_lahir || "",
      tanggal_lahir: (status?.tanggal_lahir || user?.tanggal_lahir || "").split("T")[0] || "",
      no_hp: (user?.no_hp || status?.nomor_hp || status?.no_hp || "").trim(),
      institusi: (user?.institusi || status?.asal_kampus || status?.asal_sekolah || "").trim(),
      alamat_lengkap: (status?.alamat_lengkap || user?.alamat_lengkap || "").trim(),
    };
    setBiodataForm(freshData);
    setInitialBiodataForm(freshData);
  }

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

  const isBiodataFieldChanged = useCallback(
    (fieldKey) => {
      if (fieldKey === "nama") {
        return (biodataForm.nama || "").trim() !== (initialBiodataForm.nama || "").trim();
      }
      if (fieldKey === "jenis_kelamin") {
        return (biodataForm.jenis_kelamin || "").trim() !== (initialBiodataForm.jenis_kelamin || "").trim();
      }
      if (fieldKey === "tempat_lahir") {
        return (biodataForm.tempat_lahir || "").trim() !== (initialBiodataForm.tempat_lahir || "").trim();
      }
      if (fieldKey === "tanggal_lahir") {
        return (
          (biodataForm.tanggal_lahir || "").trim().split("T")[0] !==
          (initialBiodataForm.tanggal_lahir || "").trim().split("T")[0]
        );
      }
      if (fieldKey === "no_hp") {
        return (biodataForm.no_hp || "").trim() !== (initialBiodataForm.no_hp || "").trim();
      }
      if (fieldKey === "institusi") {
        return (biodataForm.institusi || "").trim() !== (initialBiodataForm.institusi || "").trim();
      }
      if (fieldKey === "alamat_lengkap") {
        return (biodataForm.alamat_lengkap || "").trim() !== (initialBiodataForm.alamat_lengkap || "").trim();
      }
      return false;
    },
    [biodataForm, initialBiodataForm]
  );

  const handleBatalBiodataField = (fieldKey) => {
    setBiodataForm((prev) => ({
      ...prev,
      [fieldKey]: initialBiodataForm[fieldKey] || "",
    }));
  };

  const handleSimpanBiodata = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

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
      const payload = {
        nama: biodataForm.nama.trim(),
        no_hp: biodataForm.no_hp.trim(),
        institusi: biodataForm.institusi.trim(),
        tempat_lahir: biodataForm.tempat_lahir.trim(),
        tanggal_lahir: biodataForm.tanggal_lahir ? biodataForm.tanggal_lahir.split("T")[0] : "",
        jenis_kelamin: biodataForm.jenis_kelamin,
        alamat_lengkap: biodataForm.alamat_lengkap.trim(),
      };
      await updateProfil(payload);
      toastSuccess("Informasi pribadi berhasil diperbarui!");

      const newInitData = {
        nama: payload.nama,
        jenis_kelamin: payload.jenis_kelamin,
        tempat_lahir: payload.tempat_lahir,
        tanggal_lahir: payload.tanggal_lahir,
        no_hp: payload.no_hp,
        institusi: payload.institusi,
        alamat_lengkap: payload.alamat_lengkap,
      };
      setInitialBiodataForm(newInitData);
      setBiodataForm(newInitData);

      const updatedUser = {
        ...(user || {}),
        nama: payload.nama,
        no_hp: payload.no_hp,
        institusi: payload.institusi,
        tempat_lahir: payload.tempat_lahir,
        tanggal_lahir: payload.tanggal_lahir,
        jenis_kelamin: payload.jenis_kelamin,
        alamat_lengkap: payload.alamat_lengkap,
      };
      if (setUser) setUser(updatedUser);
      sessionStorage.setItem("user_pendaftaran", JSON.stringify(updatedUser));
      if (fetchStatus) fetchStatus(true);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui informasi pribadi.");
    } finally {
      setSavingBiodata(false);
    }
  };

  const rawFoto =
    fotoPreview ||
    user?.foto_profil ||
    status?.file_pas_foto ||
    status?.pendaftaran?.file_pas_foto ||
    status?.peserta?.foto_profil;

  const fotoSrc = rawFoto ? getFileUrl(rawFoto) : null;

  const inisial = user?.nama
    ? user.nama
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

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
        label: "Kuat (Bagus)",
        statusText: "Kuat (Bagus)",
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

  const handleCopyEmail = (text, key) => {
    if (!text || text === "-") return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toastSuccess("Alamat email berhasil disalin!");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleLupaPasswordClick = () => {
    confirmDialog({
      title: "Lupa Kata Sandi?",
      text: "Untuk mengatur ulang kata sandi yang terlupa, Anda dapat menggunakan tautan 'Lupa Password' pada halaman login SIM Magang atau menghubungi administrator resmi Dinas Kominfo Kabupaten Ponorogo.",
      confirmText: "Mengerti",
      showCancelButton: false,
      icon: "info",
    });
  };

  const handleSimpanPassword = async (e) => {
    e.preventDefault();
    if (setPasswordError) setPasswordError("");
    if (setPasswordSuccess) setPasswordSuccess("");

    if (!passwordForm.oldPassword) {
      if (setPasswordError) setPasswordError("Kata sandi saat ini wajib diisi.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      if (setPasswordError) setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      if (setPasswordError) setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    const result = await confirmDialog({
      title: "Ubah Kata Sandi Akun?",
      text: "Pastikan Anda mengingat kata sandi baru Anda dengan baik.",
      icon: "question",
      confirmText: "Ya, Ubah Sandi",
    });
    if (!result.isConfirmed) return;

    setSavingPassword(true);
    try {
      await gantiPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      if (setPasswordSuccess) setPasswordSuccess("Kata sandi berhasil diperbarui.");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toastSuccess("Kata sandi berhasil diperbarui!");
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal memperbarui kata sandi.";
      if (setPasswordError) setPasswordError(msg);
      toastError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const rawBidang =
    status?.posisi_bidang ||
    user?.bidang_nama ||
    user?.posisi_bidang ||
    status?.peserta?.bidang?.nama_bidang ||
    "";

  const isMahasiswa =
    status?.kategori_pendaftar
      ? status.kategori_pendaftar === "mahasiswa"
      : Boolean(status?.program_studi || status?.npm_nim || status?.asal_kampus);

  const prodiOrJurusan = isMahasiswa
    ? `Program Studi ${status?.program_studi || "-"}`
    : `Jurusan ${status?.jurusan_sekolah || "-"}`;

  const bidangText = rawBidang
    ? (rawBidang.toLowerCase().startsWith("bidang") ? rawBidang : `Bidang ${rawBidang}`)
    : "Bidang -";

  const nimOrNisn = isMahasiswa
    ? (status?.npm_nim || "-")
    : (status?.nisn || "-");

  const asalInstitusi = isMahasiswa
    ? (status?.asal_kampus || user?.institusi || "Perguruan Tinggi")
    : (status?.asal_sekolah || user?.institusi || "Sekolah");

  const badgeRole = "Pendaftar Magang";

  const statusPendaftaranNormalized = (status?.status_pendaftaran || "").toLowerCase().trim();

  const isPasswordMatch =
    Boolean(passwordForm.confirmPassword) &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
      {/* ── Header Title Bar ── */}
      <div className="min-w-0">
        <h2
          className={`text-lg sm:text-2xl font-black tracking-tight ${
            dk ? "text-slate-100" : "text-[#0B1442]"
          }`}
        >
          Kelola Akun &amp; Profil Pendaftar
        </h2>
        <p
          className={`mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-normal sm:leading-relaxed ${
            dk ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <span className="sm:hidden">
            Perbarui foto profil, informasi diri, dan keamanan akun Anda.
          </span>
          <span className="hidden sm:inline">
            Perbarui foto profil, informasi kontak, dan kelola kata sandi akun pendaftaran Anda pada portal SIM Magang Dinas Kominfo.
          </span>
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO PROFILE CARD (GRADIENT NAVY DISKOMINFO)
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

        <div className="relative p-3.5 sm:p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 min-w-0">
          {/* ── SISI KIRI: Avatar + Identitas ── */}
          <div className="flex flex-row items-start sm:items-center gap-2.5 sm:gap-5 min-w-0 flex-1">
            {/* Avatar Square with Hover Camera Overlay */}
            <div
              className="relative group shrink-0 self-start sm:self-auto cursor-pointer"
              onClick={!fotoLoading ? handleOpenCropModal : undefined}
              title="Klik untuk ubah foto profil"
            >
              <div className="h-14 w-14 sm:h-22 sm:w-22 rounded-xl sm:rounded-2xl overflow-hidden ring-2 sm:ring-3 ring-white/30 shadow-xl bg-slate-800 flex items-center justify-center transition-all duration-300 group-hover:ring-sky-400">
                {fotoSrc ? (
                  <img
                    src={fotoSrc}
                    alt={user?.nama || "Foto Profil"}
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

              {/* Loading spinner overlay if fotoLoading */}
              {fotoLoading && (
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-black/60 flex items-center justify-center z-20">
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                </div>
              )}

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

              <input
                ref={cropFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleCropFileSelected}
              />
            </div>

            {/* Info User */}
            <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5 text-white">
              {/* Baris 1: Nama Lengkap + Badge Role */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <h3 className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug break-words">
                  {user?.nama || "Pendaftar Magang"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-white border border-white/20 shrink-0">
                  {badgeRole}
                </span>
              </div>

              {/* Baris 2: Prodi / Jurusan • Posisi Bidang */}
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium leading-tight">
                <span>{prodiOrJurusan}</span>
                <span className="mx-1.5 opacity-60">•</span>
                <span className="text-sky-300 font-semibold">{bidangText}</span>
              </p>

              {/* Baris 3: Badges Pill NIM/NPM & Asal Kampus/Sekolah */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-black/25 backdrop-blur-sm border border-white/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-200">
                  <User className="w-3 h-3 text-sky-300 shrink-0" />
                  <span>{isMahasiswa ? "NIM/NPM:" : "NISN:"} {nimOrNisn}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-black/25 backdrop-blur-sm border border-white/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-200">
                  <Building2 className="w-3 h-3 text-sky-300 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{asalInstitusi}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── SISI KANAN: Status Akun SIM Magang & Status Pengajuan ── */}
          <div className="w-full lg:w-72 shrink-0 rounded-2xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/15 p-2.5 sm:p-3 backdrop-blur-md space-y-1.5 self-stretch flex flex-col justify-center">
            {/* Status Akun SIM Magang */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/95 tracking-wide uppercase">
                  Status Akun SIM Magang
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Aktif
              </span>
            </div>

            {/* Status Pengajuan Berkas Container */}
            <div className="relative mt-2 rounded-xl bg-black/35 dark:bg-black/45 border border-white/10 p-2 sm:p-2.5 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] sm:text-[9.5px] font-bold text-blue-200/80 uppercase tracking-wider">
                  Status Pengajuan Berkas
                </span>
              </div>

              {/* Status Badge Box */}
              {statusPendaftaranNormalized === "diterima" ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-emerald-200 leading-tight">
                      Diterima Magang
                    </p>
                  </div>
                </div>
              ) : statusPendaftaranNormalized === "revisi" ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-amber-200 leading-tight">
                      Perlu Revisi Dokumen
                    </p>
                  </div>
                </div>
              ) : statusPendaftaranNormalized === "ditolak" ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-rose-200 leading-tight">
                      Berkas Ditolak
                    </p>
                  </div>
                </div>
              ) : statusPendaftaranNormalized === "menunggu" ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-500/20 text-sky-300">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-sky-200 leading-tight">
                      Menunggu Verifikasi
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/70">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-white/90 leading-tight">
                      {status?.status_pendaftaran || "Belum Mengisi Formulir"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CARD 1: INFORMASI PRIBADI CALON PESERTA (PER-FIELD WARNING & INLINE SAVE)
      ══════════════════════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSimpanBiodata}
        className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-3 sm:space-y-4 transition-all duration-300 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate">
                <span className="sm:hidden">Data Pribadi Pendaftar</span>
                <span className="hidden sm:inline">Informasi Pribadi Calon Peserta</span>
              </h4>
              <p className="text-[9.5px] sm:text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                <span className="sm:hidden">Identitas diri resmi pendaftar magang</span>
                <span className="hidden sm:inline">Data identitas diri resmi calon peserta magang</span>
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
            Biodata Diri
          </span>
        </div>

        {/* Row 1: Nama Lengkap & Jenis Kelamin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* Nama Lengkap */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nama Lengkap
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("nama")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak pada Sertifikat &amp; Seluruh Dokumen Resmi (Pastikan Sesuai KTP/KTM &amp; Tanpa Gelar)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={biodataForm.nama}
                onChange={(e) => setBiodataForm((p) => ({ ...p, nama: e.target.value }))}
                placeholder="Nama lengkap sesuai KTP/KTM"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("nama")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("nama")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("nama")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Jenis Kelamin
            </label>
            <div className="relative" ref={genderDropdownRef}>
              <Users className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none z-10" />
              <button
                type="button"
                onClick={() => setGenderDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none shadow-2xs cursor-pointer select-none text-left py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("jenis_kelamin")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              >
                <span className="truncate">{biodataForm.jenis_kelamin || "Pilih Jenis Kelamin"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 shrink-0 ${
                    isBiodataFieldChanged("jenis_kelamin")
                      ? "opacity-0 scale-75 pointer-events-none"
                      : "opacity-100 scale-100 text-slate-400"
                  } ${genderDropdownOpen ? "rotate-180 text-blue-500" : ""}`}
                />
              </button>

              {/* Inline Save & Batal when Gender is Changed */}
              <div
                className={`absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("jenis_kelamin")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBatalBiodataField("jenis_kelamin");
                  }}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  onClick={(e) => e.stopPropagation()}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>

              {/* Dropdown Menu Popover */}
              <div
                className={`absolute z-40 left-0 right-0 top-[calc(100%+4px)] sm:top-[calc(100%+6px)] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-white/15 shadow-xl shadow-slate-900/10 dark:shadow-black/50 backdrop-blur-md transition-all duration-200 origin-top space-y-1 ${
                  genderDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                {[
                  {
                    value: "Laki-laki",
                    label: "Laki-laki",
                    desc: "Pendaftar Pria",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10 dark:bg-blue-500/20",
                  },
                  {
                    value: "Perempuan",
                    label: "Perempuan",
                    desc: "Pendaftar Wanita",
                    color: "text-pink-500",
                    bg: "bg-pink-500/10 dark:bg-pink-500/20",
                  },
                ].map((option) => {
                  const isSelected = biodataForm.jenis_kelamin === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setBiodataForm((p) => ({ ...p, jenis_kelamin: option.value }));
                        setGenderDropdownOpen(false);
                      }}
                      className={`group/opt w-full flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-50 to-sky-50/50 dark:from-sky-950/40 dark:to-blue-950/20 text-[#004F9F] dark:text-sky-300 font-bold border border-blue-200/70 dark:border-sky-500/30 shadow-2xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span
                          className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${option.bg} ${option.color} transition-transform duration-200 group-hover/opt:scale-110`}
                        >
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-[11.5px] sm:text-sm truncate font-bold leading-tight">
                            {option.label}
                          </span>
                          <span className="block text-[9px] sm:text-[10.5px] text-slate-400 font-normal leading-tight mt-0.5">
                            {option.desc}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:bg-sky-400/20 dark:text-sky-300">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Tempat Lahir & Tanggal Lahir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Tempat Lahir
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("tempat_lahir")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Lembar Transkrip &amp; Biodata Sertifikat (Pastikan Ejaan Kota Benar)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <MapPin className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={biodataForm.tempat_lahir}
                onChange={(e) => setBiodataForm((p) => ({ ...p, tempat_lahir: e.target.value }))}
                placeholder="Kota/Kabupaten Tempat Lahir"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("tempat_lahir")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("tempat_lahir")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("tempat_lahir")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Tanggal Lahir
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("tanggal_lahir")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Lembar Transkrip &amp; Biodata Sertifikat (Pastikan Sesuai Dokumen Kependudukan)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <input
                type="date"
                value={biodataForm.tanggal_lahir}
                onChange={(e) => setBiodataForm((p) => ({ ...p, tanggal_lahir: e.target.value }))}
                onClick={(e) => e.target.showPicker?.()}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-2xs cursor-pointer py-1.5 sm:py-2.5 transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:absolute ${
                  isBiodataFieldChanged("tanggal_lahir")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("tanggal_lahir")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("tanggal_lahir")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Nomor WhatsApp/Telepon & Asal Institusi / Sekolah / Kampus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nomor WhatsApp / Telepon Aktif
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={biodataForm.no_hp}
                onChange={(e) => setBiodataForm((p) => ({ ...p, no_hp: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("no_hp")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("no_hp")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("no_hp")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Asal Institusi / Sekolah / Kampus */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Asal Universitas / Politeknik" : "Asal Sekolah / SMK"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("institusi")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak pada Sertifikat &amp; Dokumen Resmi (Pastikan Ejaan Benar &amp; Tidak Disingkat)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <Building2 className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={biodataForm.institusi}
                onChange={(e) => setBiodataForm((p) => ({ ...p, institusi: e.target.value }))}
                placeholder={isMahasiswa ? "Contoh: Universitas Gadjah Mada" : "Contoh: SMKN 1 Ponorogo"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("institusi")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("institusi")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("institusi")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Alamat Tempat Tinggal */}
        <div>
          <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
            Alamat Tempat Tinggal
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-2.5 sm:left-3.5 top-2 sm:top-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
            <textarea
              rows={2}
              value={biodataForm.alamat_lengkap}
              onChange={(e) => setBiodataForm((p) => ({ ...p, alamat_lengkap: e.target.value }))}
              placeholder="Alamat lengkap tempat tinggal/domisili saat ini"
              className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 resize-none transition-all duration-300 ${
                isBiodataFieldChanged("alamat_lengkap")
                  ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                  : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
              }`}
            />
            <div
              className={`absolute right-1 sm:right-1.5 bottom-1.5 sm:bottom-2 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("alamat_lengkap")
                  ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                  : "opacity-0 scale-90 pointer-events-none translate-x-2"
              }`}
            >
              <button
                type="button"
                onClick={() => handleBatalBiodataField("alamat_lengkap")}
                title="Batalkan perubahan"
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingBiodata}
                className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {savingBiodata ? (
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                )}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════════════
          BAGIAN 2: KEAMANAN & KATA SANDI (CARD HORIZONTAL SEJAJAR)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* CARD 1: Ubah Kata Sandi */}
        <div
          className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-4 transition-all duration-300 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/90"
          }`}
        >
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs sm:text-base font-extrabold leading-tight ${
                    dk ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  Ubah Kata Sandi
                </h4>
                <p
                  className={`text-[9.5px] sm:text-[11px] leading-snug mt-0.5 ${
                    dk ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Pastikan kata sandi kuat untuk melindungi portal pendaftaran SIM Magang
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-white/10 shrink-0">
              Proteksi Akun
            </span>
          </div>

          {/* Alert Password Status */}
          {passwordError && (
            <div
              className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all duration-300 ${
                passwordErrorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
              } ${
                dk
                  ? "bg-red-500/10 border-red-400/20 text-red-400"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div
              className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all duration-300 ${
                passwordSuccessVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
              } ${
                dk
                  ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {/* Form Ubah Password */}
          <form onSubmit={handleSimpanPassword} className="space-y-3 sm:space-y-4">
            {/* Kata Sandi Saat Ini */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className={`text-[10.5px] sm:text-xs font-bold ${
                    dk ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Kata Sandi Saat Ini
                </label>
                <button
                  type="button"
                  onClick={handleLupaPasswordClick}
                  className="text-[9.5px] sm:text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordForm.oldPassword}
                  onChange={(e) => {
                    if (setPasswordError) setPasswordError("");
                    setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }));
                  }}
                  placeholder="Masukkan kata sandi saat ini"
                  required
                  className={`w-full rounded-lg sm:rounded-xl pl-9.5 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                    dk
                      ? "bg-[#0d1117] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:ring-[#00A5EC]/30 focus:border-[#00A5EC]"
                      : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-[#004F9F]/20 focus:border-[#004F9F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div>
              <label
                className={`text-[10.5px] sm:text-xs font-bold block mb-1 ${
                  dk ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    if (setPasswordError) setPasswordError("");
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                  }}
                  placeholder="Minimal 6-8 karakter dengan kombinasi"
                  required
                  className={`w-full rounded-lg sm:rounded-xl pl-9.5 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                    dk
                      ? "bg-[#0d1117] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:ring-[#00A5EC]/30 focus:border-[#00A5EC]"
                      : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-[#004F9F]/20 focus:border-[#004F9F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Realtime Password Strength Meter */}
              {Boolean(passwordForm.newPassword && passwordForm.newPassword.length > 0) && (
                <div className="mt-2.5 space-y-2 animate-[fadeslide_0.25s_ease-out]">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className={`font-medium ${dk ? "text-slate-400" : "text-slate-600"}`}>
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
                  <div className="grid grid-cols-4 gap-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 1
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 2
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 3
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.activeBars >= 4
                          ? passwordStrength.barColor
                          : dk
                          ? "bg-white/10"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>

                  {/* Checklist Ketentuan 2x2 */}
                  <div
                    className={`p-2.5 sm:p-3 rounded-xl border ${
                      dk
                        ? "bg-white/[0.03] border-white/5 text-slate-300"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    } grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9.5px] sm:text-xs font-medium`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          passwordStrength.hasMinLen
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasMinLen ? (dk ? "text-slate-100 font-semibold" : "text-slate-900 font-semibold") : ""}>
                        Minimal 8 karakter (terisi {passwordStrength.len})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          passwordStrength.hasUpperLower
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasUpperLower ? (dk ? "text-slate-100 font-semibold" : "text-slate-900 font-semibold") : ""}>
                        Huruf besar &amp; kecil
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          passwordStrength.hasNumber
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasNumber ? (dk ? "text-slate-100 font-semibold" : "text-slate-900 font-semibold") : ""}>
                        Mengandung angka (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          passwordStrength.hasSpecial
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span className={passwordStrength.hasSpecial ? (dk ? "text-slate-100 font-semibold" : "text-slate-900 font-semibold") : ""}>
                        Simbol khusus (!@#$%^&amp;*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label
                className={`text-[10.5px] sm:text-xs font-bold block mb-1 ${
                  dk ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    if (setPasswordError) setPasswordError("");
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                  }}
                  placeholder="Ketik ulang kata sandi baru"
                  required
                  className={`w-full rounded-lg sm:rounded-xl pl-9.5 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                    dk
                      ? "bg-[#0d1117] border border-white/10 text-slate-100 placeholder:text-slate-500 focus:ring-[#00A5EC]/30 focus:border-[#00A5EC]"
                      : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-[#004F9F]/20 focus:border-[#004F9F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Feedback kecocokan password */}
              {Boolean(passwordForm.confirmPassword) && (
                <div className="mt-1.5 animate-[fadeslide_0.2s_ease-out]">
                  {isPasswordMatch ? (
                    <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Kata sandi cocok dan tervalidasi</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-rose-500">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Konfirmasi kata sandi belum sesuai</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Simpan Kata Sandi */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading || savingPassword}
                className="group/btn inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {passwordLoading || savingPassword ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:rotate-6" />
                )}
                <span>{passwordLoading || savingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: Kelola Alamat Email Akun */}
        <div
          className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-4 transition-all duration-300 ${
            dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/90"
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs sm:text-base font-extrabold leading-tight ${
                    dk ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  Alamat Email Akun
                </h4>
                <p
                  className={`text-[9.5px] sm:text-[11px] leading-snug mt-0.5 ${
                    dk ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Kredensial login portal dan penerimaan notifikasi status magang
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Terverifikasi</span>
            </span>
          </div>

          {/* Box Email Utama */}
          <div
            className={`rounded-xl sm:rounded-2xl border p-3 transition-all ${
              dk
                ? "bg-gradient-to-r from-sky-950/30 via-white/[0.03] to-transparent border-sky-900/50"
                : "bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-white border-blue-200/90 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                    dk
                      ? "bg-gradient-to-br from-sky-950 to-blue-900/60 border-sky-800/60 text-sky-400"
                      : "bg-gradient-to-br from-blue-50 to-sky-100/90 border-blue-200/90 text-[#004F9F]"
                  }`}
                >
                  <MailCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider ${
                      dk ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Email Terdaftar
                  </p>
                  <h4
                    className={`text-xs sm:text-sm font-bold truncate mt-0.5 font-mono ${
                      dk ? "text-slate-200" : "text-slate-900"
                    }`}
                  >
                    {user?.email || "-"}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyEmail(user?.email, "email")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                  dk
                    ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
                title="Salin alamat email akun"
              >
                {copiedKey === "email" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenEmailModal}
            className="w-full group/btn relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-xs font-bold shadow-xs hover:shadow-md hover:scale-[1.005] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white group-hover/btn:rotate-180 transition-transform duration-500 shrink-0" />
            <span>Ganti Alamat Email Akun (OTP)</span>
          </button>

          {emailSuccessMsg && (
            <p
              className={`flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 transition-all duration-500 ${
                emailSuccessVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{emailSuccessMsg}</span>
            </p>
          )}

          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2.5 text-[9.5px] sm:text-[11px] ${
              dk
                ? "bg-white/[0.02] border-white/5 text-slate-400"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
            <p className="leading-snug">
              Pergantian email memerlukan verifikasi <strong>kode OTP 6 digit</strong> yang dikirimkan langsung ke email baru Anda untuk proteksi akun.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS INTEGRATION
      ══════════════════════════════════════════════════════════════════════ */}
      <FotoProfilModal
        dk={dk}
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
        fotoModalLoading={fotoModalLoading}
        handleHapusFoto={handleHapusFoto}
        hasExistingFoto={Boolean(fotoPreview || user?.foto_profil)}
        fotoDeleteLoading={fotoDeleteLoading}
      />

      <GantiEmailModal
        dk={dk}
        userEmail={user?.email}
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
    </div>
  );
};

export default TabKelolaAkun;
