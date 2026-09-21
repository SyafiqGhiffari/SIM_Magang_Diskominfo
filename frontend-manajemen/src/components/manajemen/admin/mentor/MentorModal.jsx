import { useState, useEffect, useRef } from "react";
import {
  X, UserCog, Mail, Phone, Briefcase, Lock, Camera, Loader2, Save,
  Info, Check, Users2, Sparkles, Building2, Network, Workflow, Boxes,
  FolderKanban, GitBranch, LayoutGrid, MapPin, ShieldCheck, ShieldOff,
  Infinity as InfinityIcon, Eye, EyeOff, Fingerprint,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import FotoMentorModal from "./FotoMentorModal";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const bidangIconSet = [Network, Workflow, Boxes, FolderKanban, GitBranch, LayoutGrid];
const getBidangIcon = (nama) => {
  let hash = 0;
  const str = nama || "";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return bidangIconSet[Math.abs(hash) % bidangIconSet.length];
};

const BidangCardSelect = ({ value, onChange, options, isDark }) => {
  if (options.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed p-3 sm:p-4 text-center ${
        isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-slate-200 bg-slate-50/70 text-slate-500"
      }`}>
        <p className="text-[10px] sm:text-xs font-semibold">Belum ada bidang terdaftar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-44 sm:max-h-52 overflow-y-auto overflow-x-hidden p-0.5 sm:p-1 -m-0.5 sm:-m-1">
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="sm:col-span-2 flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border border-dashed border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-red-500 hover:border-red-400 hover:text-red-600 transition-all duration-200 cursor-pointer animate-[fadeslide_0.2s_ease-out]"
        >
          <X className="w-3 h-3" />
          Batalkan pilihan bidang
        </button>
      )}
      {options.map((b, i) => {
        const checked = value === b.nama;
        const BidangIcon = getBidangIcon(b.nama);
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(checked ? "" : b.nama)}
            className={`group relative flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl border p-2 sm:p-3 text-left transition-all duration-200 cursor-pointer hover:shadow-md animate-[fadeslide_0.25s_ease-out] ${
              checked
                ? isDark
                  ? "border-[#00A5EC]/50 bg-[#00A5EC]/15 shadow-sm"
                  : "border-[#004F9F]/50 bg-blue-50/60 shadow-sm"
                : isDark
                  ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
            }`}
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
          >
            <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110 ${
              checked
                ? "bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white"
                : isDark
                  ? "bg-white/10 text-slate-300 group-hover:bg-[#00A5EC]/20 group-hover:text-sky-300"
                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#004F9F]"
            }`}>
              <BidangIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <p className={`text-[10.5px] sm:text-xs font-bold truncate flex-1 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{b.nama}</p>
            {checked && (
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-[#004F9F] dark:bg-[#00A5EC] text-white animate-[fadeslide_0.15s_ease-out]">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const MentorModal = ({ initialData, bidangOptions, onClose, onSubmit }) => {
  const { isDark } = useManajemenTheme();
  const isEdit = Boolean(initialData);

  const [nama, setNama] = useState(initialData?.nama || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [noHp, setNoHp] = useState(initialData?.no_hp || "");
  const [nip, setNip] = useState(initialData?.nip || "");
  const [jabatan, setJabatan] = useState(initialData?.jabatan || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kapasitas, setKapasitas] = useState(initialData?.kapasitas_bimbingan ?? 0);
  const [selectedBidang, setSelectedBidang] = useState(initialData?.bidang_nama || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.status_akun === "aktif" : true);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(initialData?.foto_profil ? getFileUrl(initialData.foto_profil) : null);
  const [loading, setLoading] = useState(false);

  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoModalLoading, setFotoModalLoading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  const isUnlimitedKapasitas = Number(kapasitas) === 0;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleOpenCropModal = async () => {
    if (fotoPreview && fotoFile) {
      setCropSrc(fotoPreview);
      setCropZoom(100);
      setCropPos({ x: 0, y: 0 });
      setShowFotoModal(true);
      return;
    }

    if (initialData?.foto_profil) {
      const serverUrl = getFileUrl(initialData.foto_profil);
      setFotoModalLoading(true);
      setShowFotoModal(true);
      try {
        const res = await fetch(serverUrl);
        const blob = await res.blob();
        setCropSrc(URL.createObjectURL(blob));
        setCropZoom(100);
        setCropPos({ x: 0, y: 0 });
      } catch {
        setShowFotoModal(false);
        cropFileInputRef.current?.click();
      } finally {
        setFotoModalLoading(false);
      }
      return;
    }

    cropFileInputRef.current?.click();
  };

  const handleCropFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toastError("Format foto harus JPEG, JPG, atau PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("Ukuran foto maksimal 5MB.");
      e.target.value = "";
      return;
    }
    setCropSrc(URL.createObjectURL(file));
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

  const handleSimpanPerubahanFoto = () => {
    const img = cropImgRef.current;
    if (!img) return;

    const CROP_BOX_SIZE = 224;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    const scale = (cropZoom / 100) * (400 / CROP_BOX_SIZE);
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    const contAspect = 1;
    const imgAspect = natW / natH;
    let renderW, renderH;
    if (imgAspect > contAspect) {
      renderH = CROP_BOX_SIZE;
      renderW = CROP_BOX_SIZE * imgAspect;
    } else {
      renderW = CROP_BOX_SIZE;
      renderH = CROP_BOX_SIZE / imgAspect;
    }

    const drawW = renderW * scale;
    const drawH = renderH * scale;
    const drawX = (400 - drawW) / 2 + cropPos.x * (400 / CROP_BOX_SIZE);
    const drawY = (400 - drawH) / 2 + cropPos.y * (400 / CROP_BOX_SIZE);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toastError("Gagal memproses crop foto.");
          return;
        }
        const file = new File([blob], `mentor_foto_${Date.now()}.jpg`, { type: "image/jpeg" });
        setFotoFile(file);
        setFotoPreview(URL.createObjectURL(blob));
        setShowFotoModal(false);
      },
      "image/jpeg",
      0.92
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !password) {
      toastError("Password wajib diisi untuk mentor baru.");
      return;
    }
    if (password && password.length < 6) {
      toastError("Password minimal 6 karakter.");
      return;
    }
    if (password && password !== confirmPassword) {
      toastError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nama,
        email,
        no_hp: noHp,
        nip,
        jabatan,
        password: password || undefined,
        kapasitas_bimbingan: Number(kapasitas) || 0,
        bidang_nama: selectedBidang,
        status_akun: isActive ? "aktif" : "nonaktif",
        foto_file: fotoFile,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-4xl max-h-[90vh] sm:max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border animate-[modalFadeUp_0.3s_ease-out] my-auto ${
          isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <UserCog className="absolute right-7 sm:right-12 top-1/2 -translate-y-1/2 w-18 h-18 sm:w-20 sm:h-20 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight">{isEdit ? "Edit Mentor" : "Tambah Mentor Baru"}</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5">Kelola akun mentor beserta penugasan bidangnya</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">

            {/* ===== CARD 1: Informasi Utama Mentor ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 ${
                  isDark ? "bg-[#00A5EC]/15 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Informasi Utama Mentor</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Detail akun dan kontak mentor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
                <div className="lg:col-span-2 space-y-2.5 sm:space-y-4">
                  <div className="flex items-center gap-2.5 sm:gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                    <div className="relative shrink-0">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="h-11 w-11 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200 dark:ring-white/10" />
                      ) : (
                        <span className="flex h-11 w-11 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-sm sm:text-lg font-black shadow-md">
                          {getInitials(nama)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenCropModal}
                        className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#00A5EC] text-[#0B1442] shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <input ref={cropFileInputRef} type="file" accept="image/*" onChange={handleCropFileSelected} className="hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1 block">Nama Lengkap</label>
                      <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Aris Setiawan, S.Kom"
                        required
                        className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mentor@email.com"
                        required
                        className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        No. HP
                      </label>
                      <input
                        type="text"
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "140ms", animationFillMode: "backwards" }}>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Jabatan
                      </label>
                      <input
                        type="text"
                        value={jabatan}
                        onChange={(e) => setJabatan(e.target.value)}
                        placeholder="Contoh: Pranata Komputer Ahli Muda"
                        className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Fingerprint className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        NIP (Nomor Induk Pegawai)
                      </label>
                      <input
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="Contoh: 19840912 201101 1 008"
                        className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Password {isEdit && <span className="normal-case font-medium text-slate-400">(opsional)</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isEdit ? "••••••••" : "Minimal 6 karakter"}
                          required={!isEdit}
                          className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 pr-8 sm:pr-10 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                            isDark
                              ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                              : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Konfirmasi Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isEdit ? "••••••••" : "Ulangi password"}
                          required={!isEdit || password.length > 0}
                          className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 pr-8 sm:pr-10 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                            confirmPassword && password !== confirmPassword
                              ? "border-red-400 bg-red-500/10 focus:border-red-400"
                              : isDark
                                ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                                : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[9px] text-red-500 mt-0.5 sm:mt-1 font-semibold">Password tidak cocok.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div
                    className="group h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-3 sm:p-4 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                    <div className="relative flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-white/10 border border-white/15">
                        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00A5EC]" />
                      </span>
                      <h4 className="text-[11px] sm:text-xs font-black text-white">Panduan Penambahan</h4>
                    </div>
                    <ul className="relative space-y-1.5 sm:space-y-2">
                      {[
                        "Lengkapi informasi mentor sesuai dengan data yang benar.",
                        "Kapasitas bimbingan membatasi kuota peserta per periode.",
                        "Pastikan password memenuhi ketentuan keamanan.",
                        "Foto profil bersifat opsional dan dapat diganti kapan saja.",
                        "Periksa kembali seluruh informasi sebelum menyimpan.",
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[9.5px] sm:text-[10.5px] leading-relaxed text-white/75">
                          <span className="mt-1 h-1 w-1 rounded-full bg-[#00A5EC] shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== CARD 2: Penugasan & Status ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 ${
                  isDark ? "bg-[#00A5EC]/15 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Penugasan &amp; Status</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Bidang penempatan, kapasitas, dan visibilitas akun</p>
                </div>
              </div>

              {/* Baris 1: Bidang Penempatan */}
              <div className="mb-3 sm:mb-5">
                <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Bidang Penempatan
                </label>
                <BidangCardSelect value={selectedBidang} onChange={setSelectedBidang} options={bidangOptions} isDark={isDark} />
              </div>

              {/* Baris 2: Status Akun & Kapasitas Bimbingan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
                {/* Status Akun */}
                <div className="flex flex-col">
                  <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Status Akun
                  </label>
                  <div className={`flex-1 flex flex-col justify-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 transition-all duration-300 ${
                    isActive
                      ? isDark ? "border-emerald-500/30 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50/50"
                      : isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                  }`}>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`group flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl py-1.5 sm:py-2 text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                            : isDark
                              ? "bg-white/5 border border-white/10 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300"
                              : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Aktif
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`group flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl py-1.5 sm:py-2 text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                          !isActive
                            ? "bg-slate-500 text-white shadow-md shadow-slate-500/30"
                            : isDark
                              ? "bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <ShieldOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Nonaktif
                      </button>
                    </div>

                    <div className={`flex items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-[9px] sm:text-[10px] leading-relaxed ${
                      isActive
                        ? isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                        : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      {isActive
                        ? "Mentor dapat login dan membimbing peserta."
                        : "Akses login mentor diblokir sementara."}
                    </div>
                  </div>
                </div>

                {/* Kapasitas Bimbingan */}
                <div className="flex flex-col">
                  <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                    <Users2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Kapasitas Bimbingan
                  </label>
                  <div className={`flex-1 flex flex-col justify-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 ${
                    isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-gradient-to-br from-blue-50/40 to-white"
                  }`}>
                    <div className="relative mb-2 sm:mb-2.5">
                      <input
                        type="number"
                        min={0}
                        value={kapasitas}
                        onChange={(e) => setKapasitas(e.target.value)}
                        placeholder="0"
                        className={`w-full rounded-lg sm:rounded-xl border pl-3 pr-14 sm:pl-3.5 sm:pr-16 py-1.5 sm:py-2 text-xs sm:text-base font-black outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-[#161b22] text-slate-100 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-white text-[#0B1442] focus:border-[#004F9F] focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                      <span className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-bold text-slate-400">peserta</span>
                    </div>

                    <div>
                      {isUnlimitedKapasitas ? (
                        <div className={`flex items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg p-1.5 sm:p-2 ${
                          isDark ? "bg-[#00A5EC]/10 text-sky-300" : "bg-blue-50 text-blue-700"
                        }`}>
                          <span className={`flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded ${
                            isDark ? "bg-[#00A5EC]/20 text-[#00A5EC]" : "bg-blue-100 text-blue-600"
                          }`}>
                            <InfinityIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </span>
                          <p className="text-[9px] sm:text-[10px] leading-relaxed">
                            <span className="font-bold">Tanpa batas.</span> Bimbingan tak dibatasi kuota.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[9px] sm:text-[10px] leading-relaxed text-slate-400 px-0.5">
                          Maksimal <span className={`font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>{kapasitas} peserta</span> per periode.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FotoMentorModal
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
            isDark={isDark}
          />

          {/* Footer Bar */}
          <div className={`flex items-center gap-2 sm:gap-3 border-t px-3.5 sm:px-6 py-2.5 sm:py-4 sticky bottom-0 z-10 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/90 backdrop-blur-md"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg sm:rounded-xl border py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-[1.5] inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#00A5EC] py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-[#00A5EC]/20 transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:scale-110" />}
              {isEdit ? "Simpan Perbarui" : "Tambah Mentor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorModal;