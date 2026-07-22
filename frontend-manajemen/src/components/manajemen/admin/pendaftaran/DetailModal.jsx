import { useState, useEffect, useRef } from "react";
import {
  X, CheckCircle2, XCircle, ShieldCheck, Loader2, Calendar, Briefcase,
  Info, BadgeCheck, ChevronDown, Landmark, Sparkles, Check,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { confirmDialog, toastSuccess, toastError } from "../../../../utils/swal";
import { updateStatusPendaftaran, getAllBidang } from "../../../../services/adminService";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const toDateInputValue = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rejectReasons = [
  { key: "kualifikasi", label: "Kualifikasi tidak sesuai" },
  { key: "kuota", label: "Kuota penuh" },
  { key: "dokumen", label: "Dokumen tidak valid" },
  { key: "lainnya", label: "Lainnya" },
];

const RadioCard = ({ checked, label, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
      checked ? "border-red-300 bg-red-50/70 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-red-300/50 hover:bg-white hover:shadow-sm"
    }`}
  >
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked ? "border-red-500 scale-110" : "border-slate-300 group-hover:border-red-300"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full bg-red-500 transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} />
    </span>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </button>
);

// Dropdown kustom beranimasi untuk pilihan bidang
const BidangSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const activeOption = options.find((o) => o.value === value);
  const activeLabel = activeOption?.label || "Pilih Bidang";
  const activeIsUsulan = activeOption?.isUsulan || false;
  const activeIsPilihanPeserta = activeOption?.isPilihanPeserta || false;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 cursor-pointer ${
          open
            ? "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15 shadow-sm"
            : activeIsUsulan
            ? "border-amber-300 bg-amber-50/50 text-slate-700 hover:border-amber-400"
            : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className={`truncate ${value ? "text-slate-700" : "text-slate-400"}`}>{activeLabel}</span>
          {activeIsUsulan && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 animate-pulse">
              Usulan Peserta
            </span>
          )}
          {!activeIsUsulan && activeIsPilihanPeserta && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
              Pilihan Peserta
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-[#004F9F]" : ""}`} />
      </button>

      <div
        className={`absolute left-0 right-0 top-full mt-2 z-30 origin-top rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-200 ${
          open ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="max-h-56 overflow-y-auto py-1">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-left transition-colors duration-150 cursor-pointer ${
                value === opt.value ? "bg-blue-50 text-[#004F9F]" : "text-slate-600 hover:bg-slate-50"
              }`}
              style={{ transitionDelay: open ? `${i * 25}ms` : "0ms" }}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate">{opt.label}</span>
                {opt.isUsulan && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 animate-pulse">
                    Usulan Peserta
                  </span>
                )}
                {!opt.isUsulan && opt.isPilihanPeserta && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
                    Pilihan Peserta
                  </span>
                )}
              </span>
              {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ pendaftaran, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState("terima");
  const [loading, setLoading] = useState(false);

  const [bidangOptions, setBidangOptions] = useState([]);
  const [selectedBidang, setSelectedBidang] = useState(pendaftaran.posisi_bidang || "");
  const [tanggalMulai, setTanggalMulai] = useState(toDateInputValue(pendaftaran.tanggal_mulai));
  const [catatanAdmin, setCatatanAdmin] = useState("");

  const [alasanKey, setAlasanKey] = useState("");
  const [alasanLainnyaText, setAlasanLainnyaText] = useState("");
  const [catatanTambahan, setCatatanTambahan] = useState("");

  const isMahasiswa = pendaftaran.kategori_pendaftar === "mahasiswa";
  const fotoUrl = getFileUrl(pendaftaran.file_pas_foto);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getAllBidang()
        .then((res) => {
          const options = res.data.data || [];
          setBidangOptions(options);

          // "Snap" ke nama resmi persis seperti tersimpan di database, kalau ada yang
          // cocok secara ternormalisasi. Ini mencegah dropdown tampak "kosong" saat
          // ada perbedaan spasi/kapitalisasi kecil antara data pendaftaran lama dan
          // nama resmi bidang saat ini (BidangSelect membandingkan secara ketat/exact).
          const normalize = (str) => (str || "").trim().toLowerCase();
          const match = options.find((b) => normalize(b.nama) === normalize(pendaftaran.posisi_bidang));
          if (match) {
            setSelectedBidang((prev) => (prev === pendaftaran.posisi_bidang ? match.nama : prev));
          }
        })
        .catch(() => setBidangOptions([]));
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalisasi teks (trim + lowercase) supaya perbedaan spasi/huruf besar-kecil
  // tidak dianggap sebagai bidang yang berbeda saat membandingkan dengan daftar resmi.
  const normalize = (str) => (str || "").trim().toLowerCase();

  const isPengajuanSudahResmi = bidangOptions.some(
    (b) => normalize(b.nama) === normalize(pendaftaran.posisi_bidang)
  );

  const bidangSelectOptions = [
    ...(!isPengajuanSudahResmi && pendaftaran.posisi_bidang
      ? [{ value: pendaftaran.posisi_bidang, label: pendaftaran.posisi_bidang, isUsulan: true, isPilihanPeserta: true }]
      : []),
    ...bidangOptions.map((b) => ({
      value: b.nama,
      label: b.nama,
      isUsulan: false,
      // Tandai opsi resmi yang sama dengan pilihan asli peserta saat mendaftar,
      // supaya admin tetap tahu pilihan aslinya meski nanti diubah ke bidang lain.
      isPilihanPeserta: normalize(b.nama) === normalize(pendaftaran.posisi_bidang),
    })),
  ];

  const handleTerima = async () => {
    if (!selectedBidang) {
      toastError("Pilih bidang penempatan terlebih dahulu.");
      return;
    }

    const result = await confirmDialog({
      title: "Terima pendaftaran ini?",
      text: `${pendaftaran.nama_lengkap} akan ditempatkan di bidang ${selectedBidang}. Notifikasi akan dikirim ke peserta.`,
      confirmText: "Ya, Terima",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await updateStatusPendaftaran(pendaftaran.id, {
        status_pendaftaran: "diterima",
        catatan_admin: catatanAdmin,
        posisi_bidang: selectedBidang,
        tanggal_mulai: tanggalMulai,
      });
      toastSuccess("Pendaftaran berhasil diterima");
      onUpdated();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status.");
    } finally {
      setLoading(false);
    }
  };

  const handleTolak = async () => {
    if (!alasanKey) {
      toastError("Pilih alasan penolakan terlebih dahulu.");
      return;
    }
    if (alasanKey === "lainnya" && !alasanLainnyaText.trim()) {
      toastError("Isi alasan penolakan secara manual terlebih dahulu.");
      return;
    }

    const alasanLabel = alasanKey === "lainnya" ? alasanLainnyaText.trim() : rejectReasons.find((r) => r.key === alasanKey)?.label || "";
    const composedNote = catatanTambahan.trim() ? `${alasanLabel}: ${catatanTambahan.trim()}` : alasanLabel;

    const result = await confirmDialog({
      title: "Tolak pendaftaran ini?",
      text: `Peserta akan menerima notifikasi alasan penolakan. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Tolak",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await updateStatusPendaftaran(pendaftaran.id, {
        status_pendaftaran: "ditolak",
        catatan_admin: composedNote,
      });
      toastSuccess("Pendaftaran berhasil ditolak");
      onUpdated();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-8 py-6 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <ShieldCheck className="absolute right-20 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.08] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Keputusan Verifikasi
                </div>
                <h3 className="text-lg font-black text-white leading-tight">Verifikasi Pendaftar</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {activeTab === "terima" ? "Lengkapi detail untuk menyetujui pendaftaran" : "Berikan alasan penolakan pendaftaran"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Applicant card */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
            <div className="relative shrink-0">
              {fotoUrl ? (
                <img src={fotoUrl} alt={pendaftaran.nama_lengkap} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-200" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-sm font-black shadow-md">
                  {getInitials(pendaftaran.nama_lengkap)}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#004F9F] text-white ring-2 ring-white">
                <BadgeCheck className="w-3 h-3" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-[#0B1442] truncate">{pendaftaran.nama_lengkap}</p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                <Landmark className="w-3 h-3 shrink-0 text-slate-400" />
                {isMahasiswa ? pendaftaran.asal_kampus : pendaftaran.asal_sekolah}
                {(isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah) && (
                  <> &middot; {isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah}</>
                )}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                <Briefcase className="w-3 h-3" />
                {pendaftaran.posisi_bidang || "Belum diisi"}
              </span>
              {pendaftaran.posisi_bidang && !isPengajuanSudahResmi && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 animate-pulse">
                  Usulan Peserta
                </span>
              )}
            </div>
          </div>

          {/* Tabs — pill mengambang dengan indikator geser */}
          <div className="relative inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 w-full">
            <span
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-md transition-all duration-300 ease-out ${
                activeTab === "terima" ? "left-1.5" : "left-[calc(50%+3px)]"
              }`}
            />
            <button
              onClick={() => setActiveTab("terima")}
              className={`group relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer ${
                activeTab === "terima" ? "text-[#0B1442]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 transition-all duration-300 ${activeTab === "terima" ? "text-blue-500 scale-110 rotate-0" : "text-slate-400 group-hover:scale-105 -rotate-12"}`} />
              Terima Pendaftaran
            </button>
            <button
              onClick={() => setActiveTab("tolak")}
              className={`group relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer ${
                activeTab === "tolak" ? "text-slate-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <XCircle className={`w-4 h-4 transition-all duration-300 ${activeTab === "tolak" ? "text-red-400 scale-110 rotate-0" : "text-slate-400 group-hover:scale-105 rotate-12"}`} />
              Tolak Pendaftaran
            </button>
          </div>

          {/* ===== TAB: TERIMA ===== */}
          {activeTab === "terima" && (
            <div key="terima" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "0ms", animationFillMode: "backwards" }}>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Briefcase className="w-3.5 h-3.5" />
                    Penempatan Bidang
                  </label>
                  <BidangSelect value={selectedBidang} onChange={setSelectedBidang} options={bidangSelectOptions} />
                </div>

                <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Tanggal Mulai Magang
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                  />
                </div>
              </div>

              <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Catatan Admin</label>
                <textarea
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Tambahkan catatan internal atau instruksi khusus..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                />
              </div>

              <div
                className="group relative overflow-hidden flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#12307a] to-[#004F9F] p-4 shadow-md transition-all duration-300 hover:shadow-lg animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#00A5EC]/20 blur-xl transition-all duration-300 group-hover:scale-125" />
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-[#00A5EC] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Info className="w-4.5 h-4.5" />
                </span>
                <p className="relative text-xs leading-relaxed text-white/85">
                  <span className="font-bold text-white">Otomatis diproses.</span> Status pendaftar akan diperbarui dan sistem akan mengirimkan notifikasi sesuai hasil verifikasi.
                </p>
              </div>
            </div>
          )}

          {/* ===== TAB: TOLAK ===== */}
          {activeTab === "tolak" && (
            <div key="tolak" className="space-y-5">
              <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "0ms", animationFillMode: "backwards" }}>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">Alasan Penolakan</label>
                <div className="grid grid-cols-2 gap-3">
                  {rejectReasons.map((r) => (
                    <RadioCard
                      key={r.key}
                      label={r.label}
                      checked={alasanKey === r.key}
                      onSelect={() => setAlasanKey((prev) => (prev === r.key ? "" : r.key))}
                    />
                  ))}
                </div>

                {/* Input manual — muncul hanya kalau "Lainnya" dipilih */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: alasanKey === "lainnya" ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3">
                      <input
                        type="text"
                        value={alasanLainnyaText}
                        onChange={(e) => setAlasanLainnyaText(e.target.value)}
                        placeholder="Tuliskan alasan penolakan secara manual..."
                        className="w-full rounded-xl border border-red-200 bg-red-50/40 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "80ms", animationFillMode: "backwards" }}>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Catatan Tambahan</label>
                <textarea
                  value={catatanTambahan}
                  onChange={(e) => setCatatanTambahan(e.target.value)}
                  placeholder="Berikan detail alasan penolakan atau feedback untuk peserta..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </div>

              <div
                className="group relative overflow-hidden flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 p-4 shadow-md transition-all duration-300 hover:shadow-lg animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl transition-all duration-300 group-hover:scale-125" />
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Info className="w-4.5 h-4.5" />
                </span>
                <p className="relative text-xs leading-relaxed text-white/90">
                  <span className="font-bold text-white">Tindakan permanen.</span> Status pendaftar akan diubah menjadi "Ditolak" dan sistem akan mengirimkan notifikasi alasan penolakan kepada peserta.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 px-8 py-5 shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            Batalkan
          </button>
          {activeTab === "terima" ? (
            <button
              onClick={handleTerima}
              disabled={loading}
              className="group flex-[1.6] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />}
              Konfirmasi &amp; Terima
            </button>
          ) : (
            <button
              onClick={handleTolak}
              disabled={loading}
              className="group flex-[1.6] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:from-red-700 hover:to-red-800 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />}
              Konfirmasi &amp; Tolak
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;