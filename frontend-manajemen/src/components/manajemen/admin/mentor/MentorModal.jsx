import { useState, useEffect, useRef } from "react";
import {
  X, UserCog, Mail, Phone, Briefcase, Lock, Camera, Loader2, Save,
  Info, Check, Users2, Sparkles, Building2, Network, Workflow, Boxes,
  FolderKanban, GitBranch, LayoutGrid, MapPin, ShieldCheck, ShieldOff,
  Infinity as InfinityIcon, Eye, EyeOff,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";
import FotoMentorModal from "./FotoMentorModal";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

// Ikon per-bidang (TIDAK termasuk Building2, karena Building2 dipakai sebagai
// "ikon umum bidang" di header card & badge tabel — supaya tidak pernah tabrakan).
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

const BidangCardSelect = ({ value, onChange, options }) => {
  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
        <p className="text-xs font-semibold text-slate-500">Belum ada bidang terdaftar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto overflow-x-hidden p-1 -m-1">
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="sm:col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-red-200 bg-red-50/50 py-2 text-[11px] font-bold text-red-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-[fadeslide_0.2s_ease-out]"
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
            className={`group relative flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer hover:shadow-md animate-[fadeslide_0.25s_ease-out] ${
              checked ? "border-[#004F9F]/50 bg-blue-50/60 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
            }`}
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110 ${
              checked ? "bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#004F9F]"
            }`}>
              <BidangIcon className="w-4 h-4" />
            </span>
            <p className="text-xs font-bold text-slate-700 truncate flex-1">{b.nama}</p>
            {checked && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#004F9F] text-white animate-[fadeslide_0.15s_ease-out]">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const MentorModal = ({ initialData, bidangOptions, onClose, onSubmit }) => {
  const isEdit = Boolean(initialData);

  const [nama, setNama] = useState(initialData?.nama || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [noHp, setNoHp] = useState(initialData?.no_hp || "");
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

  // ==== Crop foto — state & ref tambahan ====
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Klik ikon kamera: kalau sudah ada foto (baru dipilih atau dari server), buka
  // langsung ke mode crop. Kalau belum ada foto sama sekali, buka file picker native.
  const handleOpenCropModal = async () => {
    if (fotoPreview && fotoFile) {
      // Foto lokal yang baru dipilih sebelumnya — langsung crop ulang
      setCropSrc(fotoPreview);
      setCropZoom(100);
      setCropPos({ x: 0, y: 0 });
      setShowFotoModal(true);
      return;
    }

    if (initialData?.foto_profil) {
      // Foto lama dari server — unduh dulu sebagai blob supaya bisa di-crop ulang
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const handleSimpanPerubahanFoto = () => {
    const img = cropImgRef.current;
    if (!img) return;

    const containerSize = 224;
    const outputSize = 400;
    const ratio = outputSize / containerSize;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!naturalW || !naturalH) return;

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
      if (!blob) return;
      const file = new File([blob], "foto-mentor.png", { type: "image/png" });
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(blob));
      setShowFotoModal(false);
    }, "image/png");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) return;
    if (!isEdit && !password.trim()) return;
    if (password && password !== confirmPassword) return;

    setLoading(true);
    try {
      await onSubmit({
        nama: nama.trim(),
        email: email.trim(),
        no_hp: noHp.trim(),
        jabatan: jabatan.trim(),
        kapasitas_bimbingan: Number(kapasitas) || 0,
        password: password.trim() || undefined,
        bidang_nama: selectedBidang,
        status_akun: isActive ? "aktif" : "nonaktif",
        foto_file: fotoFile,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <UserCog className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <UserCog className="w-5 h-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-base font-black text-white leading-tight">{isEdit ? "Edit Mentor" : "Tambah Mentor Baru"}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Kelola akun mentor beserta penugasan bidangnya</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* ===== CARD 1: Informasi Utama Mentor ===== */}
            <div
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F] transition-transform duration-300 hover:scale-110 hover:-rotate-3">
                  <UserCog className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-[#0B1442]">Informasi Utama Mentor</h4>
                  <p className="text-[10.5px] text-slate-400">Detail akun dan kontak mentor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                    <div className="relative shrink-0">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-200" />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-lg font-black shadow-md">
                          {getInitials(nama)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenCropModal}
                        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#004F9F] text-white shadow-md transition-all duration-200 hover:bg-[#0B1442] hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                      <input ref={cropFileInputRef} type="file" accept="image/*" onChange={handleCropFileSelected} className="hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Nama Lengkap</label>
                      <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
                    <div>
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mentor@email.com"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        No. HP
                      </label>
                      <input
                        type="text"
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                      />
                    </div>
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "140ms", animationFillMode: "backwards" }}>
                    <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Contoh: IT Architect"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
                    <div>
                        <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Password {isEdit && <span className="normal-case font-medium text-slate-400">(opsional)</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEdit ? "••••••••" : "Minimal 6 karakter"}
                            required={!isEdit}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Konfirmasi Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isEdit ? "••••••••" : "Ulangi password"}
                          required={!isEdit || password.length > 0}
                          className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:bg-white focus:ring-4 hover:-translate-y-0.5 ${
                            confirmPassword && password !== confirmPassword
                              ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-100"
                              : "border-slate-200 bg-slate-50/70 focus:border-[#004F9F] focus:ring-[#00A5EC]/15 hover:border-slate-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[10.5px] text-red-500 mt-1.5 font-semibold">Tidak cocok.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div
                    className="group h-full rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-4 relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div className="relative flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/15 transition-transform duration-300 group-hover:rotate-12">
                        <Info className="w-3.5 h-3.5 text-[#00A5EC]" />
                      </span>
                      <h4 className="text-xs font-black text-white">Panduan Penambahan</h4>
                    </div>
                    <ul className="relative space-y-2.5">
                      {[
                        "Lengkapi informasi mentor sesuai dengan data yang benar dan terbaru.",
                        "Kapasitas bimbingan membatasi jumlah peserta yang bisa ditangani mentor.",
                        "Pastikan password memenuhi ketentuan keamanan dan mudah diingat oleh mentor.",
                        "Foto profil bersifat opsional dan dapat diganti kapan saja.",
                        "Periksa kembali seluruh informasi sebelum menyimpan data.",
                      ].map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[11px] leading-relaxed text-white/75 animate-[fadeslide_0.3s_ease-out]"
                          style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: "backwards" }}
                        >
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
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F] transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-[#0B1442]">Penugasan &amp; Status</h4>
                  <p className="text-[10.5px] text-slate-400">Bidang penempatan, kapasitas, dan visibilitas akun</p>
                </div>
              </div>

              {/* Baris 1: Bidang Penempatan — full width */}
              <div className="mb-5 animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "280ms", animationFillMode: "backwards" }}>
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Bidang Penempatan
                </label>
                <BidangCardSelect value={selectedBidang} onChange={setSelectedBidang} options={bidangOptions} />
              </div>

              {/* Baris 2: Status Akun & Kapasitas Bimbingan — sejajar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Status Akun — redesain segmented control */}
                <div className="flex flex-col animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Status Akun
                  </label>
                  <div className={`flex-1 flex flex-col justify-center rounded-2xl border p-4 transition-all duration-300 ${isActive ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white" : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"}`}>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`group flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                        Aktif
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`group flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          !isActive ? "bg-slate-500 text-white shadow-md shadow-slate-500/30" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <ShieldOff className={`w-3.5 h-3.5 transition-transform duration-200 ${!isActive ? "scale-110" : "group-hover:scale-110"}`} />
                        Nonaktif
                      </button>
                    </div>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: "1fr" }}>
                      <div className="overflow-hidden">
                        <div className={`flex items-center gap-2 rounded-lg p-2.5 text-[10.5px] leading-relaxed transition-colors duration-300 ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          {isActive
                            ? "Mentor dapat login dan menerima peserta bimbingan sesuai bidang penempatannya."
                            : "Akses login mentor diblokir sementara. Peserta yang sudah dibimbing tidak terpengaruh."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kapasitas Bimbingan — redesain lebih informatif */}
                <div className="flex flex-col animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "360ms", animationFillMode: "backwards" }}>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Users2 className="w-3.5 h-3.5" />
                    Kapasitas Bimbingan
                  </label>
                  <div className="flex-1 flex flex-col justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/40 to-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={0}
                          value={kapasitas}
                          onChange={(e) => setKapasitas(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-16 py-2.5 text-base font-black text-[#0B1442] outline-none transition-all duration-200 focus:border-[#004F9F] focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">peserta</span>
                      </div>
                    </div>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: "1fr" }}>
                      <div className="overflow-hidden">
                        {isUnlimitedKapasitas ? (
                          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 animate-pulse">
                              <InfinityIcon className="w-3.5 h-3.5" />
                            </span>
                            <p className="text-[10.5px] leading-relaxed text-blue-700">
                              <span className="font-bold">Tanpa batas.</span> Mentor dapat membimbing peserta sebanyak apa pun dalam satu periode.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10.5px] leading-relaxed text-slate-500 px-0.5">
                            Mentor ini dapat menangani maksimal <span className="font-bold text-[#0B1442]">{kapasitas} peserta bimbingan</span> di setiap periode magang berjalan.
                          </p>
                        )}
                      </div>
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
          />

          <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 sticky bottom-0">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-[1.5] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Mentor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorModal;