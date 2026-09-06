import { useEffect, useRef, useState } from "react";
import {
  X, Zap, MessageSquare, ArrowRight, Download, UserRound, ClipboardCheck,
  FileText, CalendarClock, Award, HelpCircle, Building2, Sparkles, Info,
  Loader2, Save, Tags, Eye, MousePointerClick,
  ChevronDown, Check, Folder, Layers, Power, Globe,
} from "lucide-react";
import EditorJawaban from "./EditorJawaban";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

// Tiap kategori punya ikon & warna sendiri supaya pilihan mudah dibedakan
const KATEGORI = [
  { nama: "Umum", ikon: Layers, warna: "#64748b", ket: "Pertanyaan campuran di luar kategori lain" },
  { nama: "Pendaftaran", ikon: ClipboardCheck, warna: "#0ea5e9", ket: "Alur, syarat, dan status pendaftaran" },
  { nama: "Berkas & Dokumen", ikon: FileText, warna: "#8b5cf6", ket: "Unggah berkas, revisi, dan surat" },
  { nama: "Jadwal & Lokasi", ikon: CalendarClock, warna: "#f59e0b", ket: "Jam kerja, presensi, dan penempatan" },
  { nama: "Sertifikat", ikon: Award, warna: "#10b981", ket: "Penerbitan dan pengambilan sertifikat" },
  { nama: "Teknis Sistem", ikon: Building2, warna: "#ef4444", ket: "Kendala akun, login, dan aplikasi" },
];

// Harus sama persis dengan nilai enum action_type di backend
const TIPE_AKSI = [
  {
    nilai: "jawaban",
    label: "Tampilkan jawaban",
    ikon: MessageSquare,
    warna: "#64748b",
    ket: "Bot membalas dengan teks jawaban di atas.",
  },
  {
    nilai: "navigasi",
    label: "Buka halaman",
    ikon: ArrowRight,
    warna: "#0ea5e9",
    ket: "Peserta langsung diarahkan ke halaman tujuan.",
    butuhTarget: true,
    contoh: "/dashboard?tab=revisi",
    bantuan: "Isi dengan alamat halaman di web pendaftaran, diawali garis miring.",
  },
  {
    nilai: "unduh",
    label: "Unduh berkas",
    ikon: Download,
    warna: "#8b5cf6",
    ket: "Berkas terbuka di tab baru untuk diunduh.",
    butuhTarget: true,
    contoh: "/uploads/panduan-magang.pdf",
    bantuan: "Boleh alamat lengkap (https://...) atau path berkas di server.",
  },
  {
    nilai: "eskalasi",
    label: "Hubungi admin",
    ikon: UserRound,
    warna: "#ef4444",
    ket: "Admin menerima notifikasi prioritas tinggi.",
  },
  {
    nilai: "status",
    label: "Cek status saya",
    ikon: ClipboardCheck,
    warna: "#10b981",
    ket: "Bot menyusun jawaban dari data pendaftaran peserta.",
  },
];

// Kunci di sini WAJIB sama dengan IKON_TERSEDIA pada ChatWidget.jsx
const IKON_PILIHAN = [
  { nama: "", komponen: null, judul: "Otomatis" },
  { nama: "FileText", komponen: FileText, judul: "Dokumen" },
  { nama: "CalendarClock", komponen: CalendarClock, judul: "Jadwal" },
  { nama: "Award", komponen: Award, judul: "Sertifikat" },
  { nama: "HelpCircle", komponen: HelpCircle, judul: "Bantuan" },
  { nama: "Building2", komponen: Building2, judul: "Instansi" },
  { nama: "Download", komponen: Download, judul: "Unduh" },
  { nama: "UserRound", komponen: UserRound, judul: "Admin" },
  { nama: "ClipboardCheck", komponen: ClipboardCheck, judul: "Status" },
  { nama: "Zap", komponen: Zap, judul: "Kilat" },
];

const STATUS_PENDAFTARAN = [
  { nilai: "belum_daftar", label: "Belum mendaftar" },
  { nilai: "menunggu", label: "Menunggu verifikasi" },
  { nilai: "revisi", label: "Perlu revisi" },
  { nilai: "diterima", label: "Diterima" },
  { nilai: "ditolak", label: "Ditolak" },
];

const PANDUAN = [
  "Tulis pertanyaan persis seperti yang biasa ditanyakan peserta agar chatbot mudah mencocokkan.",
  "Jawaban sebaiknya singkat, jelas, dan langsung menjawab - hindari kalimat berputar.",
  "Isi kata kunci dengan istilah alternatif yang sering dipakai peserta.",
  "Aktifkan Quick Action hanya untuk pertanyaan paling sering, kuotanya terbatas 6 slot.",
  "Periksa kembali tujuan navigasi atau berkas unduhan sebelum menyimpan.",
  "Manfaatkan tombol format di atas kolom jawaban untuk menebalkan istilah penting atau menyusun langkah bernomor.",
];

const GAYA_SAKELAR = {
  emerald: {
    border: "border-emerald-200",
    darkBorder: "border-emerald-500/40",
    bg: "bg-emerald-50/70",
    darkBg: "bg-emerald-500/10",
    chip: "bg-emerald-100 text-emerald-600",
    darkChip: "bg-emerald-500/20 text-emerald-400",
    teks: "text-emerald-700",
    darkTeks: "text-emerald-400",
    track: "from-emerald-400 to-emerald-500",
    orb: "bg-emerald-300/30",
    lencana: "bg-emerald-100 text-emerald-600",
    darkLencana: "bg-emerald-500/20 text-emerald-400",
  },
  sky: {
    border: "border-sky-200",
    darkBorder: "border-sky-500/40",
    bg: "bg-sky-50/70",
    darkBg: "bg-sky-500/10",
    chip: "bg-sky-100 text-sky-600",
    darkChip: "bg-sky-500/20 text-sky-400",
    teks: "text-sky-700",
    darkTeks: "text-sky-400",
    track: "from-sky-400 to-sky-500",
    orb: "bg-sky-300/30",
    lencana: "bg-sky-100 text-sky-600",
    darkLencana: "bg-sky-500/20 text-sky-400",
  },
  amber: {
    border: "border-amber-200",
    darkBorder: "border-amber-500/40",
    bg: "bg-amber-50/70",
    darkBg: "bg-amber-500/10",
    chip: "bg-amber-100 text-amber-600",
    darkChip: "bg-amber-500/20 text-amber-400",
    teks: "text-amber-700",
    darkTeks: "text-amber-400",
    track: "from-amber-400 to-amber-500",
    orb: "bg-amber-300/30",
    lencana: "bg-amber-100 text-amber-600",
    darkLencana: "bg-amber-500/20 text-amber-400",
  },
};

const Sakelar = ({ nyala, nonaktif, track, isDark }) => (
  <span
    className={`relative inline-flex h-5 w-9 sm:h-7 sm:w-[52px] shrink-0 items-center rounded-full transition-all duration-300 ${
      nonaktif
        ? isDark ? "bg-white/10" : "bg-slate-200"
        : nyala
        ? `bg-gradient-to-r ${track} shadow-md`
        : isDark ? "bg-white/20" : "bg-slate-300"
    }`}
  >
    <Check
      strokeWidth={3.5}
      className={`absolute left-1 sm:left-2 h-2 w-2 sm:h-3 sm:w-3 text-white transition-all duration-200 ${
        nyala && !nonaktif ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
    />
    <X
      strokeWidth={3.5}
      className={`absolute right-1 sm:right-2 h-2 w-2 sm:h-3 sm:w-3 text-white/70 transition-all duration-200 ${
        !nyala || nonaktif ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
    />
    <span
      className={`relative inline-block h-3.5 w-3.5 sm:h-[22px] sm:w-[22px] rounded-full bg-white shadow-md transition-transform duration-300 ${
        nyala && !nonaktif ? "translate-x-[18px] sm:translate-x-[26px]" : "translate-x-[2px] sm:translate-x-[3px]"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    />
  </span>
);

const BarisSakelar = ({ ikon: Ikon, judul, ket, nyala, onKlik, nonaktif, gaya, lencana, tunda = 0, isDark }) => {
  const g = GAYA_SAKELAR[gaya] || GAYA_SAKELAR.emerald;

  return (
    <button
      type="button"
      onClick={onKlik}
      disabled={nonaktif}
      style={{ animationDelay: `${tunda}ms`, animationFillMode: "backwards" }}
      className={`group relative w-full overflow-hidden rounded-lg sm:rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3.5 text-left transition-all duration-300 animate-[fadeslide_0.3s_ease-out] ${
        nonaktif
          ? isDark ? "cursor-not-allowed border-white/5 bg-white/[0.02]" : "cursor-not-allowed border-slate-200 bg-slate-100/60"
          : isDark
          ? `cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
              nyala ? `${g.darkBorder} ${g.darkBg}` : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`
          : `cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
              nyala ? `${g.border} ${g.bg}` : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
            }`
      }`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      {nyala && !nonaktif && (
        <span className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${g.orb}`} />
      )}

      <span className="relative flex items-center gap-2 sm:gap-3">
        <span
          className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 ${
            nonaktif
              ? isDark ? "bg-white/5 text-slate-500" : "bg-slate-200 text-slate-400"
              : nyala
              ? isDark ? `${g.darkChip} scale-105 shadow-sm` : `${g.chip} scale-105 shadow-sm`
              : isDark ? "bg-white/5 text-slate-400 group-hover:scale-105" : "bg-white text-slate-400 shadow-sm group-hover:scale-105 group-hover:-rotate-3"
          }`}
        >
          <Ikon className="h-3 w-3 sm:h-4 sm:w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[11px] sm:text-xs font-bold transition-colors duration-200 ${
                nonaktif
                  ? "text-slate-500"
                  : nyala
                  ? isDark ? g.darkTeks : g.teks
                  : isDark ? "text-slate-200" : "text-slate-700"
              }`}
            >
              {judul}
            </span>
            {lencana && (
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  nonaktif
                    ? isDark ? "bg-white/5 text-slate-500" : "bg-slate-200 text-slate-400"
                    : nyala
                    ? isDark ? g.darkLencana : g.lencana
                    : isDark ? "bg-white/10 text-slate-400" : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {lencana}
              </span>
            )}
          </span>
          <span className={`mt-0.5 sm:mt-1 block text-[9px] sm:text-[10.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ket}</span>
        </span>

        <Sakelar nyala={nyala} nonaktif={nonaktif} track={g.track} isDark={isDark} />
      </span>
    </button>
  );
};

const DropdownKategori = ({ nilai, onPilih, isDark }) => {
  const [buka, setBuka] = useState(false);
  const ref = useRef(null);

  const terpilih = KATEGORI.find((k) => k.nama === nilai) || KATEGORI[0];
  const IkonTerpilih = terpilih.ikon;

  useEffect(() => {
    if (!buka) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buka]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && buka) {
      e.stopPropagation();
      setBuka(false);
    }
  };

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setBuka((p) => !p)}
        className={`flex w-full items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-left outline-none transition-all duration-200 cursor-pointer ${
          buka
            ? isDark
              ? "border-[#00A5EC] bg-[#161b22] shadow-md ring-4 ring-[#00A5EC]/15"
              : "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15"
            : isDark
            ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            : "border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
        }`}
      >
        <span
          className="flex h-5 w-5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md sm:rounded-lg transition-transform duration-300"
          style={{
            background: `${terpilih.warna}1a`,
            transform: buka ? "scale(1.1) rotate(-6deg)" : "none",
          }}
        >
          <IkonTerpilih className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: terpilih.warna }} />
        </span>
        <span className={`flex-1 truncate text-[11px] sm:text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{terpilih.nama}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-all duration-300 ${
            buka ? "rotate-180 text-[#00A5EC]" : "text-slate-400"
          }`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+6px)] sm:top-[calc(100%+8px)] z-40 origin-top overflow-hidden rounded-xl sm:rounded-2xl border shadow-xl transition-all duration-250 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        } ${
          buka
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <div className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:pt-3.5 sm:pb-2 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
          <Folder className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Pilih Kategori</p>
        </div>

        <div className="max-h-56 sm:max-h-64 overflow-y-auto pb-1">
          {KATEGORI.map((k, i) => {
            const Ikon = k.ikon;
            const aktif = k.nama === terpilih.nama;
            return (
              <button
                key={k.nama}
                type="button"
                onClick={() => { onPilih(k.nama); setBuka(false); }}
                className={`group/item flex w-full items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                  aktif
                    ? isDark ? "bg-white/10" : "bg-slate-50"
                    : isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
                style={{
                  transitionDelay: buka ? `${i * 35}ms` : "0ms",
                  opacity: buka ? 1 : 0,
                  transform: buka ? "translateX(0)" : "translateX(8px)",
                  transitionProperty: "opacity, transform, background-color",
                  transitionDuration: "250ms",
                }}
              >
                <span
                  className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-3"
                  style={{ background: `${k.warna}1a` }}
                >
                  <Ikon className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: k.warna }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[11px] sm:text-[12.5px] font-bold transition-colors duration-200 ${
                    isDark ? "text-slate-200 group-hover/item:text-white" : "text-slate-700 group-hover/item:text-[#0B1442]"
                  }`}>
                    {k.nama}
                  </span>
                  <span className="block truncate text-[9px] sm:text-[10px] text-slate-400">{k.ket}</span>
                </span>
                {aktif && (
                  <span className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-sm animate-[modalFadeUp_0.2s_ease-out]">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FaqModal = ({
  editMode, question, setQuestion, answer, setAnswer, keywords, setKeywords,
  category, setCategory, quickLabel, setQuickLabel,
  isActive, setIsActive, showOnLanding, setShowOnLanding,
  isQuickAction, setIsQuickAction,
  actionType, setActionType,
  actionTarget, setActionTarget,
  quickIcon, setQuickIcon,
  tampilSaatStatus, setTampilSaatStatus,
  sisaQuickAction, loading, onSubmit, onClose,
}) => {
  const { isDark } = useManajemenTheme();
  const aksiTerpilih = TIPE_AKSI.find((t) => t.nilai === actionType) || TIPE_AKSI[0];
  const perluTarget = Boolean(aksiTerpilih.butuhTarget);
  const slotPenuh = !isQuickAction && sisaQuickAction <= 0;

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const gantiTipeAksi = (nilai) => {
    setActionType(nilai);
    const tipeBaru = TIPE_AKSI.find((t) => t.nilai === nilai);
    if (!tipeBaru?.butuhTarget) setActionTarget("");
  };

  const toggleStatus = (nilai) => {
    if (tampilSaatStatus.includes(nilai)) {
      setTampilSaatStatus(tampilSaatStatus.filter((s) => s !== nilai));
    } else {
      setTampilSaatStatus([...tampilSaatStatus, nilai]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out] border ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <HelpCircle className="absolute -right-4 sm:right-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.05] sm:opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3.5">
              <span className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <HelpCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 text-[7.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/15 rounded-full px-1.5 sm:px-2.5 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  {editMode ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight">{editMode ? "Edit FAQ" : "Tambah FAQ Baru"}</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5">
                  <span className="inline sm:hidden">Jawaban otomatis untuk chatbot magang</span>
                  <span className="hidden sm:inline">Lengkapi jawaban otomatis yang dipakai chatbot magang</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">

            {/* ===== CARD 1: Isi Pertanyaan & Jawaban ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm hover:shadow-md animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 hover:scale-110 hover:-rotate-3 ${
                  isDark ? "bg-blue-500/20 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Pertanyaan &amp; Jawaban</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Isi utama yang dibalas oleh chatbot</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {/* Kolom form */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5 block">Pertanyaan</label>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Contoh: Bagaimana cara daftar magang?"
                      required
                      className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:text-[10.5px] sm:placeholder:text-sm ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-4 focus:ring-[#00A5EC]/15"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                      }`}
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5 block">Jawaban Chatbot</label>
                    <EditorJawaban
                      nilai={answer}
                      onUbah={setAnswer}
                      rows={5}
                      placeholder="Tuliskan balasan otomatis di sini..."
                      isDark={isDark}
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
                    <label className="flex items-center gap-1.5 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5">
                      <Tags className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Kata Kunci <span className="font-medium normal-case tracking-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Contoh: syarat, berkas, magang"
                      className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:text-[10.5px] sm:placeholder:text-sm ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-4 focus:ring-[#00A5EC]/15"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                      }`}
                    />
                    <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">
                      <span className="inline sm:hidden">Pencocokan prioritas kata kunci oleh chatbot.</span>
                      <span className="hidden sm:inline">Jika diisi, chatbot mencocokkan kata kunci ini secara prioritas.</span>
                    </p>
                  </div>
                </div>

                {/* Kolom panduan */}
                <div className="lg:col-span-1">
                  <div
                    className="group h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-3 sm:p-4 relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div className="relative flex items-center gap-2 mb-2.5 sm:mb-3">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white/10 border border-white/15 transition-transform duration-300 group-hover:rotate-12">
                        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00A5EC]" />
                      </span>
                      <h4 className="text-[11px] sm:text-xs font-black text-white">Panduan Penulisan</h4>
                    </div>
                    <ul className="relative space-y-2 sm:space-y-2.5">
                      {PANDUAN.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] leading-relaxed text-white/75 animate-[fadeslide_0.3s_ease-out]"
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

            {/* ===== CARD 2: Klasifikasi & Penayangan ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm hover:shadow-md animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 hover:scale-110 hover:rotate-3 ${
                  isDark ? "bg-blue-500/20 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Klasifikasi &amp; Penayangan</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Pengelompokan dan tempat FAQ ini muncul</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5 block">Kategori</label>
                  <DropdownKategori nilai={category} onPilih={setCategory} isDark={isDark} />
                  <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">
                    <span className="inline sm:hidden">Tab filter halaman FAQ publik.</span>
                    <span className="hidden sm:inline">Dipakai sebagai tab filter di halaman FAQ publik.</span>
                  </p>
                </div>

                <div>
                  <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5 block">
                    Label Tombol <span className="font-medium normal-case tracking-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    disabled={!isQuickAction}
                    value={quickLabel}
                    onChange={(e) => setQuickLabel(e.target.value)}
                    placeholder="Contoh: Cek syarat magang"
                    className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:text-[10.5px] sm:placeholder:text-sm ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 disabled:bg-white/[0.02] disabled:text-slate-500"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    }`}
                  />
                  <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">
                    {isQuickAction
                      ? `${quickLabel.length}/40 karakter. Kosongkan untuk pakai teks pertanyaan.`
                      : "Aktifkan Quick Action dahulu."}
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                <BarisSakelar
                  ikon={Power}
                  gaya="emerald"
                  tunda={0}
                  judul="FAQ Aktif"
                  lencana={isActive ? "Aktif" : "Nonaktif"}
                  nyala={isActive}
                  onKlik={() => setIsActive((p) => !p)}
                  isDark={isDark}
                  ket={
                    isActive
                      ? "FAQ dipakai chatbot untuk menjawab pertanyaan peserta."
                      : "FAQ disimpan tetapi tidak dipakai chatbot."
                  }
                />

                <BarisSakelar
                  ikon={Globe}
                  gaya="sky"
                  tunda={70}
                  judul="Tampilkan di halaman FAQ publik"
                  lencana={showOnLanding ? "Publik" : "Internal"}
                  nyala={showOnLanding}
                  onKlik={() => setShowOnLanding((p) => !p)}
                  isDark={isDark}
                  ket={
                    showOnLanding
                      ? "Dapat dilihat calon peserta sebelum login."
                      : "Hanya muncul di dalam percakapan chatbot."
                  }
                />

                <BarisSakelar
                  ikon={Zap}
                  gaya="amber"
                  tunda={140}
                  judul="Jadikan Quick Action"
                  lencana={slotPenuh ? "Slot penuh" : `Sisa ${sisaQuickAction} slot`}
                  nyala={isQuickAction}
                  nonaktif={slotPenuh}
                  onKlik={() => setIsQuickAction((p) => !p)}
                  isDark={isDark}
                  ket={
                    slotPenuh
                      ? "Slot penuh — nonaktifkan salah satu quick action lain terlebih dahulu."
                      : "Tampil sebagai tombol pintas di widget chat peserta."
                  }
                />
              </div>
            </div>

            {/* ===== CARD 3: Perilaku Tombol Cepat ===== */}
            {isQuickAction && (
              <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm hover:shadow-md animate-[modalFadeUp_0.25s_ease-out] ${
                isDark ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-amber-200 bg-white"
              }`}>
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <span className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 transition-transform duration-300 hover:scale-110 hover:-rotate-3">
                    <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Perilaku Tombol Cepat</h4>
                    <p className="text-[9px] sm:text-[10.5px] text-slate-400">Apa yang terjadi saat peserta menekan tombol</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Tipe aksi */}
                  <div>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2 block">Saat Tombol Ditekan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TIPE_AKSI.map((t, i) => {
                        const Ikon = t.ikon;
                        const aktif = actionType === t.nilai;
                        return (
                          <button
                            key={t.nilai}
                            type="button"
                            onClick={() => gantiTipeAksi(t.nilai)}
                            className={`flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border px-2.5 py-2 sm:px-3.5 sm:py-3 text-left transition-all duration-200 cursor-pointer animate-[fadeslide_0.25s_ease-out] ${
                              aktif
                                ? isDark
                                  ? "border-transparent bg-white/10 shadow-md -translate-y-0.5"
                                  : "border-transparent bg-white shadow-md -translate-y-0.5"
                                : isDark
                                ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                : "border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                            }`}
                            style={{
                              boxShadow: aktif ? `0 0 0 2px ${t.warna}` : undefined,
                              animationDelay: `${i * 40}ms`,
                              animationFillMode: "backwards",
                            }}
                          >
                            <span
                              className="mt-0.5 flex h-5.5 w-5.5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md sm:rounded-lg"
                              style={{ background: `${t.warna}1a` }}
                            >
                              <Ikon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: t.warna }} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className={`block text-[11px] sm:text-[12.5px] font-bold ${
                                isDark ? "text-slate-200" : "text-slate-800"
                              }`}>{t.label}</span>
                              <span className="block text-[9px] sm:text-[10.5px] leading-relaxed text-slate-400">{t.ket}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target — hanya untuk navigasi & unduh */}
                  {perluTarget && (
                    <div className="animate-[modalFadeUp_0.2s_ease-out]">
                      <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 sm:mb-1.5 block">
                        Tujuan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={actionTarget}
                        onChange={(e) => setActionTarget(e.target.value)}
                        placeholder={aksiTerpilih.contoh}
                        className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:text-[10.5px] sm:placeholder:text-sm ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#161b22]"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white"
                        }`}
                      />
                      <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">{aksiTerpilih.bantuan}</p>
                    </div>
                  )}

                  {/* Ikon tombol */}
                  <div>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2 block">Ikon Tombol</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {IKON_PILIHAN.map((ik) => {
                        const Ikon = ik.komponen;
                        const aktif = (quickIcon || "") === ik.nama;
                        return (
                          <button
                            key={ik.nama || "auto"}
                            type="button"
                            title={ik.judul}
                            onClick={() => setQuickIcon(ik.nama)}
                            className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                              aktif
                                ? "border-transparent bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md -translate-y-0.5"
                                : isDark
                                ? "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                : "border-slate-200 bg-slate-50/70 text-slate-500 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                            }`}
                          >
                            {Ikon ? <Ikon className="h-3 w-3 sm:h-4 sm:w-4" /> : <span className="text-[7.5px] sm:text-[9px] font-black">AUTO</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">
                      <span className="inline sm:hidden">AUTO: Ikon mengikuti tipe aksi.</span>
                      <span className="hidden sm:inline">Pilih AUTO agar ikon mengikuti tipe aksi yang dipilih di atas.</span>
                    </p>
                  </div>

                  {/* Filter status pendaftaran */}
                  <div>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2 block">Tampil Untuk Status</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {STATUS_PENDAFTARAN.map((s) => {
                        const aktif = tampilSaatStatus.includes(s.nilai);
                        return (
                          <button
                            key={s.nilai}
                            type="button"
                            onClick={() => toggleStatus(s.nilai)}
                            className={`rounded-md sm:rounded-xl px-2 py-1 sm:px-3.5 sm:py-2 text-[9.5px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                              aktif
                                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                                : isDark
                                ? "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                                : "border border-slate-200 bg-slate-50/70 text-slate-500 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[9px] sm:text-[10.5px] text-slate-400">
                      {tampilSaatStatus.length === 0
                        ? "Tidak ada yang dipilih — tombol tampil untuk semua peserta."
                        : `Tombol hanya tampil bagi peserta dengan ${tampilSaatStatus.length} status di atas.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== FOOTER ===== */}
          <div className={`flex items-center gap-2 sm:gap-3 border-t px-3 py-2 sm:px-6 sm:py-4 sticky bottom-0 ${
            isDark ? "border-white/10 bg-[#0d1117]" : "border-slate-100 bg-slate-50/50"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg sm:rounded-xl border py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-[1.5] inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:scale-110" />}
              {editMode ? "Simpan Perubahan" : "Tambah FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqModal;