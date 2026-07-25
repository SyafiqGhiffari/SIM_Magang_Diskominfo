import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getMe, gantiPasswordAdmin, uploadFotoAdmin, hapusFotoAdmin,
  updateProfilAdmin,
} from "../../services/authService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { getFileUrl } from "../../utils/fileUrl";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import FotoProfilModal from "../../components/manajemen/admin/akun/FotoProfilModal";
import {
  Eye, EyeOff, ShieldCheck, Mail, BadgeCheck, Camera, Trash2,
  User, Phone, Briefcase, Pencil, X, Save,
} from "lucide-react";

const InfoRow = ({ icon, label, value, dk, txt, muted }) => (
  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${dk ? "bg-white/5 border-white/10" : "bg-slate-50/70 border-slate-150"}`}>
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${dk ? "bg-white/10 text-[#00A5EC]" : "bg-[#004F9F]/10 text-[#004F9F]"}`}>
      {icon}
    </span>
    <div className="min-w-0">
      <p className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>{label}</p>
      <p className={`text-sm font-bold truncate ${txt}`}>{value || "-"}</p>
    </div>
  </div>
);

const KelolaAkunPage = () => {
  const { isDark } = useManajemenTheme();
  const dk = isDark;

  const [profile, setProfile] = useState(null);

  // ── Password ──
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Edit informasi akun ──
  const [editInfo, setEditInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ nama: "", email: "", no_hp: "", jabatan: "" });

  // ── Foto profil ──
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoDeleteLoading, setFotoDeleteLoading] = useState(false);
  const [fotoModalLoading, setFotoModalLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);

  // ── Modal crop ──
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  useEffect(() => {
    getMe()
      .then((res) => setProfile(res.data.data))
      .catch(() => toastError("Gagal memuat data akun."));
  }, []);

  // ── Drag handlers untuk crop ──
  const handleDragStart = (e) => {
    setIsDragging(true);
    const point = e.touches ? e.touches[0] : e;
    dragStart.current = { x: point.clientX - cropPos.x, y: point.clientY - cropPos.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const point = e.touches ? e.touches[0] : e;
      setCropPos({ x: point.clientX - dragStart.current.x, y: point.clientY - dragStart.current.y });
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
    const existingServerPath = profile?.foto_profil ? getFileUrl(profile.foto_profil) : null;

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
        toastError("Gagal memuat foto profil saat ini. Silakan unggah foto baru.");
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

      const baseScale = Math.min(containerSize / naturalW, containerSize / naturalH);
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
      const fd = new FormData();
      fd.append("foto_profil", file);
      const res = await uploadFotoAdmin(fd);
      const fotoPath = res.data?.data?.foto_profil || "";
      setProfile((p) => ({ ...p, foto_profil: fotoPath }));
      toastSuccess("Foto profil berhasil diperbarui");
    } catch (err) {
      console.error("Upload foto gagal:", err);
      toastError(err.response?.data?.message || "Gagal mengunggah foto profil");
    } finally {
      setFotoLoading(false);
    }
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
      await hapusFotoAdmin();
      setProfile((p) => ({ ...p, foto_profil: "" }));
      setFotoPreview(null);
      toastSuccess("Foto profil berhasil dihapus");
    } catch (err) {
      console.error("Gagal menghapus foto:", err);
      toastError("Gagal menghapus foto profil. Silakan coba lagi.");
    } finally {
      setFotoDeleteLoading(false);
    }
  };

  const handleOpenEditInfo = () => {
    setInfoForm({
      nama: profile?.nama || "",
      email: profile?.email || "",
      no_hp: profile?.no_hp || "",
      jabatan: profile?.jabatan || "",
    });
    setEditInfo(true);
  };

  const handleClearField = (field) => {
    setInfoForm((p) => ({ ...p, [field]: "" }));
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();

    if (!infoForm.nama.trim()) { toastError("Nama lengkap wajib diisi."); return; }
    if (!infoForm.email.trim()) { toastError("Email wajib diisi."); return; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email.trim());
    if (!emailOk) { toastError("Format email tidak valid."); return; }

    const result = await confirmDialog({
      title: "Simpan perubahan?",
      text: "Informasi akun Anda akan diperbarui.",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    setSavingInfo(true);
    try {
      const res = await updateProfilAdmin({
        nama: infoForm.nama.trim(),
        email: infoForm.email.trim(),
        no_hp: infoForm.no_hp.trim(),
        jabatan: infoForm.jabatan.trim(),
      });
      setProfile(res.data.data);
      setEditInfo(false);
      toastSuccess("Informasi akun berhasil diperbarui");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui informasi akun.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toastError("Konfirmasi password tidak cocok.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toastError("Password baru minimal 6 karakter.");
      return;
    }

    const result = await confirmDialog({
      title: "Simpan password baru?",
      text: "Anda perlu login ulang setelah password diubah pada beberapa kasus.",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await gantiPasswordAdmin({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toastSuccess("Password berhasil diperbarui");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui password.");
    } finally {
      setLoading(false);
    }
  };

  const initial = profile?.nama
    ? profile.nama.charAt(0).toUpperCase()
    : profile?.email
    ? profile.email.charAt(0).toUpperCase()
    : "A";

  const fotoSrc = fotoPreview || (profile?.foto_profil ? getFileUrl(profile.foto_profil) : null);

  // ── Theme tokens ──
  const surface = dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80";
  const txt = dk ? "text-slate-100" : "text-[#0B1442]";
  const sub = dk ? "text-slate-400" : "text-slate-500";
  const muted = dk ? "text-slate-500" : "text-slate-400";
  const divider = dk ? "border-white/10" : "border-slate-100";
  const inputCls = `w-full mt-1.5 rounded-xl border pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`;
  const infoEditCls = `w-full mt-1.5 rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`;
  const fieldInputCls = `w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`;

  return (
    <AdminLayout showSearch={false}>
      <div className="max-w-4xl mx-auto space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* HEADER */}
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${txt}`}>Kelola Akun</h2>
          <p className={`mt-1.5 text-xs ${sub}`}>
            Perbarui foto profil, lihat informasi akun, dan ubah kata sandi Anda.
          </p>
        </div>

        {/* CARD 1: HERO PROFIL + FOTO */}
        <div className={`relative overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
          {/* Banner gradient + konten identitas */}
          <div className="relative bg-gradient-to-br from-[#0B1442] via-[#152778] to-[#1E3A8A] overflow-hidden">
            {/* pola grid halus */}
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            {/* glow dekoratif */}
            <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#00A5EC]/25 blur-3xl" />
            <div className="absolute right-40 -bottom-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

            {/* Konten di dalam banner */}
            <div className="relative px-6 py-6 flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Kiri: avatar + identitas */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                {/* Avatar clickable */}
                <div className="relative group cursor-pointer shrink-0 mx-auto sm:mx-0" onClick={handleOpenCropModal}>
                  <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/70 shadow-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center">
                    {fotoSrc ? (
                      <img src={fotoSrc} alt="Foto Profil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-white">{initial}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 h-7 w-7 rounded-full bg-[#00A5EC] border-2 border-white flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-[8deg] group-hover:shadow-lg group-hover:shadow-[#00A5EC]/50">
                    <Pencil className="w-3.5 h-3.5 text-white" />
                  </div>
                  <input
                    ref={cropFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleCropFileSelected}
                  />
                </div>

                {/* Nama lengkap + jabatan + badges */}
                <div className="min-w-0 text-center sm:text-left">
                  <h3 className="mt-0.5 text-2xl font-black leading-tight text-white truncate">
                    {profile?.nama || "Memuat..."}
                  </h3>
                  <p className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-blue-100/80">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile?.jabatan || "Jabatan belum diatur"}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white capitalize ring-1 ring-white/20">
                      <BadgeCheck className="w-3 h-3" />
                      {profile?.role || "-"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
                      <span className={`h-1.5 w-1.5 rounded-full ${profile?.status_akun === "aktif" ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
                      {profile?.status_akun || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kanan: tombol aksi (gaya untuk latar gelap) */}
              <div className="flex items-center justify-center lg:justify-end gap-2.5 shrink-0 lg:ml-auto">
                <button
                  type="button"
                  onClick={handleOpenCropModal}
                  disabled={fotoLoading}
                  className="group inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-[#0B1442] shadow-lg hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                >
                  {fotoLoading
                    ? <div className="h-3.5 w-3.5 border-2 border-[#0B1442] border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />}
                  {fotoLoading ? "Mengunggah..." : "Ganti Foto"}
                </button>
                <button
                  type="button"
                  onClick={handleHapusFoto}
                  disabled={fotoDeleteLoading || (!fotoPreview && !profile?.foto_profil)}
                  className="group inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
                >
                  {fotoDeleteLoading
                    ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />}
                  {fotoDeleteLoading ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer strip: email + catatan format */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-3.5 ${dk ? "bg-[#161b22]" : "bg-white"}`}>
            <p className={`flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium ${sub}`}>
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{profile?.email || "-"}</span>
            </p>
            <p className={`flex items-center justify-center sm:justify-end gap-1.5 text-[11px] ${muted}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 13.5V6.75A2.25 2.25 0 0 0 15.75 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5A2.25 2.25 0 0 0 6.75 19.5h10.5A2.25 2.25 0 0 0 19.5 17.25v-3.75Z" />
              </svg>
              JPEG, JPG, atau PNG · Maksimal 3MB
            </p>
          </div>
        </div>

        {/* MODAL CROP FOTO */}
        <FotoProfilModal
          dk={dk}
          divider={divider}
          sub={sub}
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
        />

        {/* CARD 2: INFORMASI AKUN */}
        <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${txt}`} />
              <h3 className={`text-sm font-extrabold ${txt}`}>Informasi Akun</h3>
            </div>
            {!editInfo && (
              <button
                type="button"
                onClick={handleOpenEditInfo}
                className={`group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer ${dk ? "bg-white/10 text-slate-200 hover:bg-white/15" : "bg-[#004F9F]/10 text-[#004F9F] hover:bg-[#004F9F]/15"}`}
              >
                <Pencil className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" />
                Edit
              </button>
            )}
          </div>
          <div className={`border-t mt-3 mb-5 ${divider}`} />

          {!editInfo ? (
            <>
              {/* MODE TAMPIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow dk={dk} txt={txt} muted={muted} icon={<User className="w-4 h-4" />} label="Nama Lengkap" value={profile?.nama} />
                <InfoRow dk={dk} txt={txt} muted={muted} icon={<Mail className="w-4 h-4" />} label="Alamat Email" value={profile?.email} />
                <InfoRow dk={dk} txt={txt} muted={muted} icon={<Phone className="w-4 h-4" />} label="Nomor HP" value={profile?.no_hp} />
                <InfoRow dk={dk} txt={txt} muted={muted} icon={<Briefcase className="w-4 h-4" />} label="Jabatan" value={profile?.jabatan} />
              </div>
              <div className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-[11px] leading-relaxed ${dk ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>Klik <b>Edit</b> untuk memperbarui, menambah, atau menghapus data akun. Nomor HP dan jabatan boleh dikosongkan.</span>
              </div>
            </>
          ) : (
            <>
              {/* MODE EDIT */}
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Nama */}
                  <div>
                    <label className={`text-xs font-bold ${sub}`}>Nama Lengkap <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={infoForm.nama}
                      onChange={(e) => setInfoForm((p) => ({ ...p, nama: e.target.value }))}
                      required
                      className={infoEditCls}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className={`text-xs font-bold ${sub}`}>Alamat Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={infoForm.email}
                      onChange={(e) => setInfoForm((p) => ({ ...p, email: e.target.value }))}
                      required
                      className={infoEditCls}
                      placeholder="nama@email.com"
                    />
                  </div>
                  {/* Nomor HP (opsional, bisa dihapus) */}
                  <div>
                    <label className={`text-xs font-bold ${sub}`}>Nomor HP <span className={`font-medium ${muted}`}>(opsional)</span></label>
                    <div className="relative mt-1.5">
                      <input
                        type="tel"
                        value={infoForm.no_hp}
                        onChange={(e) => setInfoForm((p) => ({ ...p, no_hp: e.target.value }))}
                        className={`${fieldInputCls} ${infoForm.no_hp ? "pr-24" : ""}`}
                        placeholder="Contoh: 08123456789"
                      />
                      {infoForm.no_hp && (
                        <button
                          type="button"
                          onClick={() => handleClearField("no_hp")}
                          className={`group absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${dk ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                        >
                          <Trash2 className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jabatan (opsional, bisa dihapus) */}
                  <div>
                    <label className={`text-xs font-bold ${sub}`}>Jabatan <span className={`font-medium ${muted}`}>(opsional)</span></label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        value={infoForm.jabatan}
                        onChange={(e) => setInfoForm((p) => ({ ...p, jabatan: e.target.value }))}
                        className={`${fieldInputCls} ${infoForm.jabatan ? "pr-24" : ""}`}
                        placeholder="Contoh: Staff IT"
                      />
                      {infoForm.jabatan && (
                        <button
                          type="button"
                          onClick={() => handleClearField("jabatan")}
                          className={`group absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${dk ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                        >
                          <Trash2 className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditInfo(false)}
                    disabled={savingInfo}
                    className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer ${dk ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    <X className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                  >
                    {savingInfo
                      ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Save className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* CARD 3: GANTI PASSWORD */}
        <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className={`w-4 h-4 ${txt}`} />
            <h3 className={`text-sm font-extrabold ${txt}`}>Ganti Password</h3>
          </div>
          <div className={`border-t mt-3 mb-5 ${divider}`} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-xs font-bold ${sub}`}>Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  required
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowOld((p) => !p)}
                  className={`absolute inset-y-0 right-0 top-1.5 flex items-center pr-4 ${muted} hover:text-slate-600`}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className={`text-xs font-bold ${sub}`}>Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className={`absolute inset-y-0 right-0 top-1.5 flex items-center pr-4 ${muted} hover:text-slate-600`}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`text-xs font-bold ${sub}`}>Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className={`absolute inset-y-0 right-0 top-1.5 flex items-center pr-4 ${muted} hover:text-slate-600`}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex items-start gap-2.5 rounded-xl p-3.5 text-[11px] leading-relaxed ${dk ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>Password minimal 6 karakter. Gunakan kombinasi huruf dan angka.</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />}
                Simpan Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default KelolaAkunPage;