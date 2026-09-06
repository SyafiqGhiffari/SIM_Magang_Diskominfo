import { useState, useEffect, useRef } from "react";
import {
  X, Save, Loader2, Ruler,
  FileText, Building2, UserCheck, Trash2, Upload, RotateCcw, Eye, Palette,
  ChevronDown, Check, ZoomIn, ZoomOut, Sparkles, Move, Star, Printer, ExternalLink, GraduationCap,
  Minus, Table, MessageSquareQuote, SlidersHorizontal
} from "lucide-react";
import {
  createTemplateRapor,
  updateTemplateRapor,
  uploadFileTemplateRapor,
  deleteFileTemplateRapor,
} from "../../../../services/templateRaporService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess } from "../../../../utils/swal";
import { bukaPratinjauTranskripTab, cetakPratinjauTranskrip } from "../../../../utils/exportTranskripPdf";
import TemplateRaporPreview from "./TemplateRaporPreview";

const TABS = [
  { id: "kop", label: "1. Kop & Identitas", icon: Building2 },
  { id: "ttd", label: "2. Penandatangan", icon: UserCheck },
  { id: "layout", label: "3. Tata Letak", icon: Ruler },
];

const getInitialFormData = (tpl) => ({
  nama: tpl?.nama || "",
  keterangan: tpl?.keterangan || "",
  jenis_peserta: tpl?.jenis_peserta || "semua",
  status: tpl?.status || "publish",
  is_default: Boolean(tpl?.is_default),
  nama_pemerintah: tpl?.nama_pemerintah || "PEMERINTAH KABUPATEN PONOROGO",
  nama_instansi: tpl?.nama_instansi || "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
  alamat_instansi: tpl?.alamat_instansi || "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
  telepon: tpl?.telepon || "Telepon 0352–3592999",
  faksimile: tpl?.faksimile || "Faksimile 0352–3592999",
  laman: tpl?.laman || "Laman kominfo.ponorogo.go.id",
  pos_el: tpl?.pos_el || "Pos-el kominfo@ponorogo.go.id",
  file_logo: tpl?.file_logo || "",
  file_ttd: tpl?.file_ttd || "",
  file_stempel: tpl?.file_stempel || "",
  judul_dokumen: tpl?.judul_dokumen || "TRANSKRIP NILAI HASIL MAGANG",
  format_nomor: tpl?.format_nomor || "560/TRN-{nomor}/405.08/{tahun}",
  tempat_terbit: tpl?.tempat_terbit || "Ponorogo",
  catatan_kaki: tpl?.catatan_kaki || "",
  tipe_penandatangan: tpl?.tipe_penandatangan || "kepala_dinas",
  jabatan_penandatangan: tpl?.jabatan_penandatangan || "Kepala Dinas Komunikasi Informatika dan Statistik",
  nama_penandatangan: tpl?.nama_penandatangan || "Drs. BAMBANG SUHENDRO, M.Si",
  pangkat_penandatangan: tpl?.pangkat_penandatangan || "Pembina Utama Muda",
  nip_penandatangan: tpl?.nip_penandatangan || "19750812 200003 1 004",
  konfigurasi_tata_letak: tpl?.konfigurasi_tata_letak || JSON.stringify({
    tampilkan_bobot: true,
    tampilkan_qr: true,
    tampilkan_catatan_mentor: true,
    tampilkan_garis_kop: true,
  }),
});

// ── Kelas Gaya Modular ──
const clsInput = (isDark) =>
  `w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "bg-slate-900/60 border-slate-700 text-slate-100 hover:border-slate-600 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-[#004F9F] focus:ring-4 focus:ring-[#004F9F]/10"
  }`;

const clsLabel = (isDark) =>
  `block text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider mb-1 sm:mb-1.5 ${
    isDark ? "text-slate-400" : "text-slate-400"
  }`;

const clsKartu = (isDark) =>
  `rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all duration-200 ${
    isDark
      ? "bg-slate-900/40 border-slate-700/60 hover:border-slate-600"
      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
  }`;

const JudulKartu = ({ isDark, icon: Icon, children }) => (
  <div className="mb-2 sm:mb-2.5 flex items-center gap-2 sm:gap-2.5">
    <span className="h-3 sm:h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#004F9F]" />}
    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
      {children}
    </p>
    <span className={`h-px flex-1 bg-gradient-to-r to-transparent ${isDark ? "from-slate-700" : "from-slate-200"}`} />
  </div>
);

const Teks = ({ isDark, label, value, onChange, placeholder, ...rest }) => (
  <div>
    {label && <label className={clsLabel(isDark)}>{label}</label>}
    <input
      className={clsInput(isDark)}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
  </div>
);

const Area = ({ isDark, label, value, onChange, placeholder, rows = 3, ...rest }) => (
  <div>
    {label && <label className={clsLabel(isDark)}>{label}</label>}
    <textarea
      className={`${clsInput(isDark)} resize-y`}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      {...rest}
    />
  </div>
);

const Pilihan = ({ isDark, label, value, onChange, opsi = [] }) => {
  const [buka, setBuka] = useState(false);
  const kotak = useRef(null);

  useEffect(() => {
    if (!buka) return undefined;
    const klikLuar = (e) => {
      if (kotak.current && !kotak.current.contains(e.target)) setBuka(false);
    };
    const tekanEsc = (e) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
    };
  }, [buka]);

  const terpilih = opsi.find((o) => String(o.nilai) === String(value ?? ""));

  return (
    <div ref={kotak} className="relative">
      {label && <label className={clsLabel(isDark)}>{label}</label>}
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className={`${clsInput(isDark)} flex cursor-pointer items-center justify-between gap-2 text-left transition-all duration-200 ${
          buka
            ? isDark
              ? "border-[#00A5EC] ring-4 ring-[#00A5EC]/20"
              : "border-[#004F9F] ring-4 ring-[#004F9F]/10"
            : ""
        }`}
      >
        <span className="truncate">{terpilih?.label ?? "Pilih..."}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 ${
            buka ? "rotate-180 text-[#00A5EC]" : "opacity-50"
          }`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 z-50 mt-1.5 origin-top overflow-hidden rounded-xl border p-1 shadow-xl transition-all duration-200 ${
          buka
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        } ${isDark ? "border-slate-700 bg-slate-900 shadow-2xl" : "border-slate-200 bg-white shadow-xl"}`}
      >
        {opsi.map((o) => {
          const aktif = String(o.nilai) === String(value ?? "");
          return (
            <button
              key={o.nilai}
              type="button"
              onClick={() => {
                setBuka(false);
                onChange?.({ target: { value: o.nilai } });
              }}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-left text-[11px] sm:text-xs font-bold transition-all duration-150 ${
                aktif
                  ? "bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] text-white shadow-sm"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {aktif && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TombolTemplateUtama = ({ isDark, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange?.(!checked)}
    className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 sm:p-3.5 text-left transition-all duration-200 active:scale-[0.99] ${
      checked
        ? isDark
          ? "border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-slate-900/80 to-slate-900 shadow-sm ring-1 ring-amber-500/30"
          : "border-amber-400/50 bg-gradient-to-r from-amber-50/90 via-orange-50/30 to-white shadow-sm ring-1 ring-amber-400/30"
        : isDark
          ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
          : "border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
          checked
            ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25"
            : isDark
              ? "bg-slate-800 text-slate-400"
              : "bg-white text-slate-400 border border-slate-200 shadow-2xs"
        }`}
      >
        <Star className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${checked ? "fill-white text-white" : ""}`} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-xs sm:text-[13px] font-black tracking-tight truncate transition-colors ${
              checked
                ? isDark
                  ? "text-amber-300"
                  : "text-[#0B1442]"
                : isDark
                  ? "text-slate-200 group-hover:text-white"
                  : "text-slate-700 group-hover:text-slate-900"
            }`}
          >
            Jadikan Sebagai Template Utama (Baku)
          </p>
          {checked ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
              Format Aktif
            </span>
          ) : (
            <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20">
              Alternatif
            </span>
          )}
        </div>
        <p
          className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 truncate ${
            checked
              ? isDark
                ? "text-slate-300"
                : "text-slate-600"
              : isDark
                ? "text-slate-500"
                : "text-slate-400"
          }`}
        >
          {checked
            ? "Template ini otomatis digunakan sebagai format transkrip nilai bawaan dinas"
            : "Klik untuk menjadikan template ini sebagai format baku utama bawaan dinas"}
        </p>
      </div>
    </div>

    {/* Modern Toggle Switch Slider */}
    <div
      className={`relative h-5.5 w-10 shrink-0 rounded-full transition-all duration-200 p-0.5 flex items-center ${
        checked
          ? "bg-gradient-to-r from-amber-500 to-amber-600 shadow-xs shadow-amber-500/30"
          : isDark
            ? "bg-slate-700"
            : "bg-slate-300/90"
      }`}
    >
      <div
        className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 shadow-md flex items-center justify-center ${
          checked ? "translate-x-4.5" : "translate-x-0"
        }`}
      >
        {checked ? (
          <Check className="h-2.5 w-2.5 text-amber-600 stroke-[3]" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        )}
      </div>
    </div>
  </button>
);

const Saklar = ({ isDark, icon: Icon, label, deskripsi, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange?.(!checked)}
    className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all duration-200 active:scale-[0.99] ${
      checked
        ? isDark
          ? "border-[#00A5EC]/40 bg-gradient-to-r from-[#00A5EC]/15 via-slate-900/80 to-slate-900 shadow-sm ring-1 ring-[#00A5EC]/30"
          : "border-[#004F9F]/30 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-white shadow-sm ring-1 ring-[#004F9F]/20"
        : isDark
          ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
          : "border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
    }`}
  >
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      {Icon && (
        <span
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-105 ${
            checked
              ? isDark
                ? "bg-[#00A5EC]/20 text-[#00A5EC] shadow-sm ring-1 ring-[#00A5EC]/40"
                : "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-md shadow-blue-900/10"
              : isDark
                ? "bg-slate-800 text-slate-400"
                : "bg-white text-slate-400 border border-slate-200 shadow-2xs"
          }`}
        >
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </span>
      )}
      <div className="min-w-0">
        <p
          className={`text-[11.5px] sm:text-[12.5px] font-bold tracking-tight truncate transition-colors ${
            checked
              ? isDark
                ? "text-white"
                : "text-[#0B1442]"
              : isDark
                ? "text-slate-300 group-hover:text-slate-200"
                : "text-slate-700 group-hover:text-slate-900"
          }`}
        >
          {label}
        </p>
        {deskripsi && (
          <p
            className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 truncate ${
              checked
                ? isDark
                  ? "text-slate-300"
                  : "text-slate-600"
                : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}
          >
            {deskripsi}
          </p>
        )}
      </div>
    </div>

    {/* Modern Toggle Switch Slider */}
    <div
      className={`relative h-5.5 w-10 shrink-0 rounded-full transition-all duration-200 p-0.5 flex items-center ${
        checked
          ? "bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] shadow-xs shadow-blue-500/20"
          : isDark
            ? "bg-slate-700"
            : "bg-slate-300/90"
      }`}
    >
      <div
        className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 shadow-md flex items-center justify-center ${
          checked ? "translate-x-4.5" : "translate-x-0"
        }`}
      >
        {checked ? (
          <Check className="h-2.5 w-2.5 text-[#004F9F] stroke-[3]" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        )}
      </div>
    </div>
  </button>
);

const KotakGambar = ({ isDark, label, path, onPilih, onHapus, uploading }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileUrl = path ? getFileUrl(path) : null;

  return (
    <div className="space-y-1">
      {label && <label className={clsLabel(isDark)}>{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPilih(f);
        }}
        className={`group relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-xl border-2 border-dashed p-2.5 sm:p-3.5 text-center transition-all duration-300 ${
          dragOver
            ? isDark
              ? "border-[#00A5EC] bg-[#00A5EC]/15 scale-[1.01] shadow-md shadow-[#00A5EC]/10"
              : "border-[#004F9F] bg-blue-50/80 scale-[1.01] shadow-md shadow-blue-500/10"
            : isDark
              ? "border-slate-700/70 bg-slate-900/40 hover:border-[#00A5EC]/60 hover:bg-slate-900/70 hover:-translate-y-0.5"
              : "border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 hover:border-[#004F9F]/50 hover:bg-blue-50/30 hover:-translate-y-0.5 hover:shadow-sm"
        }`}
      >
        {fileUrl ? (
          <div className="flex flex-col items-center gap-2 w-full py-0.5">
            <div className={`relative flex h-16 w-24 sm:h-18 sm:w-28 items-center justify-center rounded-lg border p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
              isDark ? "border-slate-700 bg-slate-800/90" : "border-slate-200 bg-white"
            }`}>
              <img src={fileUrl} alt={label || "Gambar"} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">
                <Upload className="h-3 w-3" />
                <span>{uploading ? "Mengunggah..." : "Ganti Berkas"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPilih(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onHapus}
                disabled={uploading}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 px-2.5 py-1 text-[10.5px] font-bold text-red-600 dark:text-red-400 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95"
              >
                <Trash2 className="h-3 w-3" /> Hapus
              </button>
            </div>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 sm:gap-1.5 py-0.5">
            <div className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-300 ${
              isDark
                ? "bg-slate-800 text-[#00A5EC] shadow-sm ring-1 ring-white/10 group-hover:scale-110"
                : "bg-blue-50 text-[#004F9F] shadow-xs ring-1 ring-blue-200/50 group-hover:scale-110"
            }`}>
              <Upload className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </div>
            
            <div className="space-y-0.5 text-center">
              <p className={`text-[11.5px] sm:text-xs font-bold leading-tight ${
                isDark ? "text-slate-200" : "text-[#0B1442]"
              }`}>
                <span className="text-[#004F9F] dark:text-[#00A5EC]">
                  Pilih file
                </span>
              </p>
              <p className={`text-[9.5px] sm:text-[10px] font-medium leading-tight ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                atau seret file ke sini
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 dark:bg-slate-800/70 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-medium text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/80 dark:ring-slate-700/50 mt-0.5">
              PNG / JPG (Disarankan latar transparan)
            </span>

            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPilih(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export const TemplateRaporDesignerModal = ({
  show,
  onClose,
  template = null,
  onSaved,
  isDark = false,
}) => {
  const [prevTemplateId, setPrevTemplateId] = useState(template?.id ?? null);
  const [tab, setTab] = useState("kop");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [kategoriContoh, setKategoriContoh] = useState(() =>
    template?.jenis_peserta === "siswa" ? "siswa" : "mahasiswa"
  );
  const [mencetak, setMencetak] = useState(false);

  // Form State
  const [formData, setFormData] = useState(() => getInitialFormData(template));

  // Reset form when template prop changes
  const currentTemplateId = template?.id ?? null;
  if (prevTemplateId !== currentTemplateId) {
    setPrevTemplateId(currentTemplateId);
    setFormData(getInitialFormData(template));
    setTab("kop");
    setZoomScale(1);
    if (template?.jenis_peserta === "siswa") {
      setKategoriContoh("siswa");
    } else {
      setKategoriContoh("mahasiswa");
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", onResize);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  const ubah = (kunci) => (valOrEvt) => {
    const nilai =
      valOrEvt && typeof valOrEvt === "object" && "target" in valOrEvt
        ? valOrEvt.target.value
        : valOrEvt;
    setFormData((p) => ({ ...p, [kunci]: nilai }));
  };

  const pTeks = (kunci) => ({
    isDark,
    value: formData[kunci],
    onChange: ubah(kunci),
  });

  // Parse layout config
  const layoutConfig = (() => {
    try {
      return typeof formData.konfigurasi_tata_letak === "string"
        ? JSON.parse(formData.konfigurasi_tata_letak || "{}")
        : formData.konfigurasi_tata_letak || {};
    } catch {
      return {
        tampilkan_bobot: true,
        tampilkan_qr: true,
        tampilkan_catatan_mentor: true,
        tampilkan_garis_kop: true,
      };
    }
  })();

  const updateLayoutConfig = (key, value) => {
    const updated = { ...layoutConfig, [key]: value };
    setFormData((prev) => ({
      ...prev,
      konfigurasi_tata_letak: JSON.stringify(updated),
    }));
  };

  // Upload Aset
  const handleUploadAsset = async (jenis, file) => {
    if (!file) return;
    setUploadingAsset(jenis);
    try {
      let tplId = template?.id;
      if (!tplId) {
        const draftRes = await createTemplateRapor({
          ...formData,
          nama: formData.nama.trim() || "Template Rapor Baru (Draf)",
        });
        tplId = draftRes.data.data.id;
      }

      const uploadFd = new FormData();
      uploadFd.append("file", file);
      const res = await uploadFileTemplateRapor(tplId, jenis, uploadFd);

      const fieldKey = jenis === "logo" ? "file_logo" : jenis === "ttd" ? "file_ttd" : "file_stempel";
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: res.data.data[fieldKey],
      }));
      toastSuccess(`Aset ${jenis} berhasil diunggah`);
    } catch (err) {
      toastError(err.response?.data?.message || `Gagal mengunggah ${jenis}`);
    } finally {
      setUploadingAsset(null);
    }
  };

  // Hapus Aset
  const handleDeleteAsset = async (jenis) => {
    if (!template?.id) {
      const fieldKey = jenis === "logo" ? "file_logo" : jenis === "ttd" ? "file_ttd" : "file_stempel";
      setFormData((prev) => ({ ...prev, [fieldKey]: "" }));
      return;
    }
    try {
      await deleteFileTemplateRapor(template.id, jenis);
      const fieldKey = jenis === "logo" ? "file_logo" : jenis === "ttd" ? "file_ttd" : "file_stempel";
      setFormData((prev) => ({ ...prev, [fieldKey]: "" }));
      toastSuccess(`Aset ${jenis} berhasil dihapus`);
    } catch (err) {
      toastError(err.response?.data?.message || `Gagal menghapus ${jenis}`);
    }
  };

  // Simpan Template
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.nama.trim()) {
      toastError("Nama template wajib diisi");
      return;
    }

    setSaving(true);
    try {
      if (template?.id) {
        await updateTemplateRapor(template.id, formData);
        toastSuccess("Template rapor berhasil diperbarui");
      } else {
        await createTemplateRapor(formData);
        toastSuccess("Template rapor baru berhasil dibuat");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan template rapor");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    try {
      setMencetak(true);
      await cetakPratinjauTranskrip(formData, kategoriContoh);
    } catch (err) {
      toastError("Gagal mencetak dokumen: " + (err.message || err));
    } finally {
      setMencetak(false);
    }
  };

  const handleBukaTab = async () => {
    try {
      await bukaPratinjauTranskripTab(formData, kategoriContoh);
    } catch (err) {
      toastError("Gagal membuka tab baru: " + (err.message || err));
    }
  };

  // Render Panel Pratinjau Kertas A4
  const renderPanelPratinjau = () => (
    <div className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
      isDark ? "bg-[#0b0f19]" : "bg-slate-100"
    }`}>
      {/* Bilah alat mengambang (Floating Toolbar) */}
      <div className="pointer-events-none absolute inset-x-2 sm:inset-x-4 top-2 sm:top-3 z-20 flex items-start justify-between gap-2">
        {/* Kiri: Zoom Toolbar */}
        <div className={`pointer-events-auto flex items-center gap-0.5 rounded-full border px-1 py-0.5 sm:px-1.5 sm:py-1 shadow-lg backdrop-blur-md ${
          isDark ? "border-slate-700 bg-slate-900/95" : "border-slate-200 bg-white/95"
        }`}>
          <button
            type="button"
            onClick={() => setZoomScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
            title="Perkecil"
            className={`flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-115 active:scale-90 ${
              isDark ? "text-slate-300 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
            }`}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className={`px-1 text-[9px] sm:text-[10px] font-bold tabular-nums ${
            isDark ? "text-slate-200" : "text-[#0B1442]"
          }`}>
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomScale((s) => Math.min(1.4, Number((s + 0.1).toFixed(1))))}
            title="Perbesar"
            className={`flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-115 active:scale-90 ${
              isDark ? "text-slate-300 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
            }`}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(1)}
            title="Reset Skala"
            className={`flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-115 active:scale-90 ${
              isDark ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-400 hover:bg-slate-100 hover:text-[#004F9F]"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* Kanan: Pemilih Contoh + Print & Buka Tab Baru */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <select
            value={kategoriContoh}
            onChange={(e) => setKategoriContoh(e.target.value)}
            className={`h-6.5 sm:h-8 rounded-full border px-2 sm:px-3 text-[9.5px] sm:text-xs font-bold shadow-lg backdrop-blur-md outline-none transition-all cursor-pointer ${
              isDark
                ? "border-slate-700 bg-slate-900/95 text-slate-200 hover:border-slate-600"
                : "border-slate-200 bg-white/95 text-[#0B1442] hover:border-slate-300"
            }`}
          >
            <option value="mahasiswa">Contoh Mahasiswa</option>
            <option value="siswa">Contoh Siswa</option>
          </select>
          <button
            type="button"
            onClick={handlePrint}
            disabled={mencetak}
            title="Cetak transkrip nilai"
            className={`flex h-6.5 w-6.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50 ${
              isDark
                ? "border-slate-700 bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-[#00A5EC]"
                : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
            }`}
          >
            {mencetak ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
          <button
            type="button"
            onClick={handleBukaTab}
            title="Buka pratinjau di tab baru"
            className={`flex h-6.5 w-6.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
              isDark
                ? "border-slate-700 bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-[#00A5EC]"
                : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Kontainer Lembar Kertas A4 */}
      <div
        className="relative min-h-0 flex-1 overflow-auto p-4 sm:p-6 pt-12 sm:pt-14"
        style={
          isDark
            ? undefined
            : {
                backgroundColor: "#eef1f6",
                backgroundImage: "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }
        }
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-2 sm:p-4">
          <div
            className="group/sheet relative mx-auto w-full max-w-[340px] sm:max-w-md transition-transform duration-300 origin-top"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <div className="pointer-events-none absolute inset-4 rounded-2xl bg-gradient-to-r from-[#00A5EC]/0 via-[#004F9F]/20 to-[#00A5EC]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover/sheet:opacity-100" />

            <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-500 ease-out will-change-transform group-hover/sheet:-translate-y-1 group-hover/sheet:scale-[1.01]">
              <TemplateRaporPreview template={formData} base={6} kategori={kategoriContoh} />

              {/* Kilau menyapu saat hover */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 group-hover/sheet:opacity-100 group-hover/sheet:animate-[tplShine_1.1s_ease-out]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#050B24]/85 via-[#0B1442]/80 to-[#00284F]/85 p-2 sm:p-4 backdrop-blur-md animate-[tplFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <style>{`
        @keyframes tplFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tplPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
        @keyframes tplShine { from { transform: translateX(-120%) skewX(-18deg) } to { transform: translateX(320%) skewX(-18deg) } }
      `}</style>

      <div
        className={`flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl shadow-[0_35px_90px_-20px_rgba(0,0,0,0.65)] ring-1 animate-[tplPop_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
          isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-white/15"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header Modal ================= */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-2.5 sm:px-6 sm:py-3.5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl" />
          <FileText
            className="pointer-events-none absolute right-16 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.06] hidden sm:block"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex items-center gap-2 sm:gap-3.5 min-w-0">
              <span className="relative shrink-0">
                <span className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl border border-white/20 bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg">
                  <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="pointer-events-none absolute -inset-0.5 sm:-inset-1 animate-pulse rounded-lg sm:rounded-2xl border border-[#00A5EC]/30" />
              </span>
              <div className="min-w-0">
                <div className="mb-0.5 inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/10 bg-white/5 px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC]">
                  <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 animate-pulse" />
                  {template?.id ? "Perbarui Template" : "Buat Template"}
                </div>
                <h3 className="truncate text-xs sm:text-base font-black leading-tight text-white">
                  {formData.nama?.trim() || (template?.id ? "Template Tanpa Nama" : "Template Rapor Baru")}
                </h3>
                {/* Keterangan + badge status sejajar, dipisah jarak lebar */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 sm:gap-x-8 gap-y-1">
                  <p className="flex min-w-0 items-center gap-1 text-[8.5px] sm:text-[11px] text-white/60">
                    <Move className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                    <span className="truncate hidden sm:inline">Atur identitas kop, penandatangan, aset resmi, dan tata letak transkrip nilai</span>
                    <span className="truncate inline sm:hidden">Atur kop, penandatangan & tata letak</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-1 sm:gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10px] font-bold ring-1 backdrop-blur-sm ${
                        formData.status === "publish"
                          ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                          : "bg-amber-400/20 text-amber-100 ring-amber-300/30"
                      }`}
                    >
                      <FileText className="h-2 w-2 sm:h-3 sm:w-3" />
                      {formData.status === "publish" ? "Publish" : "Draft"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                      <GraduationCap className="h-2 w-2 sm:h-3 sm:w-3" />
                      {formData.jenis_peserta === "mahasiswa" ? "Mahasiswa" : formData.jenis_peserta === "siswa" ? "Siswa" : "Semua Peserta"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 sm:px-2 py-0.5 text-[7.5px] sm:text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                      <UserCheck className="h-2 w-2 sm:h-3 sm:w-3" />
                      {formData.tipe_penandatangan === "mentor" ? "Mentor" : formData.tipe_penandatangan === "keduanya" ? "Kadis & Mentor" : "Kepala Dinas"}
                    </span>
                    <span className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm md:inline-flex">
                      <Ruler className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      A4
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white"
              aria-label="Tutup modal template rapor"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* ================= Body Modal ================= */}
        <div className={`grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,50%)_minmax(0,50%)] ${
          isDark ? "bg-slate-950/20" : "bg-slate-50/40"
        }`}>
          {/* ── Panel Kiri: Form Editor ── */}
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col border-r ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>
            {/* Navigasi Tab */}
            <div className={`flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 sm:px-5 sm:py-3 ${
              isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-white"
            }`}>
              {TABS.map((t) => {
                const IconComponent = t.icon;
                const aktif = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9.5px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      aktif
                        ? "bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] text-white shadow-md shadow-[#0B1442]/20 ring-1 ring-white/10"
                        : isDark
                          ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                  >
                    <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Isi Tab Formulir */}
            <div className={`min-h-0 flex-1 space-y-3 sm:space-y-4 overflow-y-auto p-3 sm:p-5 ${
              isDark ? "bg-slate-950/20" : "bg-slate-50/40"
            }`}>
              {/* TAB 1: KOP & IDENTITAS */}
              {tab === "kop" && (
                <>
                  {/* 1. Identitas Template & Publikasi */}
                  <div className={clsKartu(isDark)}>
                    <JudulKartu isDark={isDark} icon={Building2}>Identitas Template &amp; Publikasi</JudulKartu>
                    <div className="space-y-3">
                      <Teks
                        label="Nama Template"
                        placeholder="Contoh: Template Standar Kedinasan Diskominfo"
                        {...pTeks("nama")}
                      />
                      <Area
                        label="Keterangan / Catatan Singkat"
                        placeholder="Deskripsi peruntukan template transkrip nilai ini..."
                        rows={2}
                        {...pTeks("keterangan")}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Pilihan
                          label="Jenis Peserta"
                          isDark={isDark}
                          value={formData.jenis_peserta || "semua"}
                          onChange={(v) => {
                            ubah("jenis_peserta")(v);
                            if (v === "siswa" || v === "mahasiswa") {
                              setKategoriContoh(v);
                            }
                          }}
                          opsi={[
                            { nilai: "semua", label: "Semua (Mahasiswa & Siswa)" },
                            { nilai: "mahasiswa", label: "Mahasiswa" },
                            { nilai: "siswa", label: "Siswa" },
                          ]}
                        />
                        <Pilihan
                          label="Status Publikasi"
                          isDark={isDark}
                          value={formData.status}
                          onChange={ubah("status")}
                          opsi={[
                            { nilai: "publish", label: "Publish" },
                            { nilai: "draft", label: "Draft" },
                          ]}
                        />
                      </div>
                      <div className="pt-0.5">
                        <TombolTemplateUtama
                          isDark={isDark}
                          checked={formData.is_default}
                          onChange={ubah("is_default")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Identitas Instansi Kedinasan (Kop Surat) + Logo Instansi */}
                  <div className={clsKartu(isDark)}>
                    <JudulKartu isDark={isDark} icon={Building2}>Identitas Instansi Kedinasan (Kop Surat)</JudulKartu>
                    <div className="space-y-3">
                      <Teks label="Nama Pemerintah" placeholder="PEMERINTAH KABUPATEN PONOROGO" {...pTeks("nama_pemerintah")} />
                      <Teks label="Nama Instansi" placeholder="DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK" {...pTeks("nama_instansi")} />
                      <Teks label="Alamat" placeholder="Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418" {...pTeks("alamat_instansi")} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Teks label="Telepon" placeholder="Telepon 0352–3592999" {...pTeks("telepon")} />
                        <Teks label="Faksimile" placeholder="Faksimile 0352–3592999" {...pTeks("faksimile")} />
                        <Teks label="Laman" placeholder="Laman kominfo.ponorogo.go.id" {...pTeks("laman")} />
                        <Teks label="Pos-el" placeholder="Pos-el kominfo@ponorogo.go.id" {...pTeks("pos_el")} />
                      </div>

                      {/* Kotak Unggah Logo Instansi disatukan di dalam kartu instansi */}
                      <KotakGambar
                        isDark={isDark}
                        label="Logo Instansi (Kop Surat)"
                        path={formData.file_logo}
                        uploading={uploadingAsset === "logo"}
                        onPilih={(f) => handleUploadAsset("logo", f)}
                        onHapus={() => handleDeleteAsset("logo")}
                      />
                    </div>
                  </div>

                  {/* 3. Redaksi & Penomoran Dokumen */}
                  <div className={clsKartu(isDark)}>
                    <JudulKartu isDark={isDark} icon={FileText}>Redaksi &amp; Penomoran Dokumen</JudulKartu>
                    <div className="space-y-3">
                      <Teks label="Judul Dokumen Resmi" placeholder="TRANSKRIP NILAI HASIL MAGANG" {...pTeks("judul_dokumen")} />
                      <Teks
                        label="Format Nomor Dokumen"
                        placeholder="560/TRN-{nomor}/405.08/{tahun}"
                        {...pTeks("format_nomor")}
                      />
                      <p className={`text-[10px] sm:text-[11px] font-medium leading-relaxed ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        Gunakan tag <code className="text-sky-500 font-mono font-bold">{"{nomor}"}</code> untuk urutan nomor dan <code className="text-sky-500 font-mono font-bold">{"{tahun}"}</code> untuk tahun berjalan.
                      </p>
                      <Teks label="Tempat Terbit" placeholder="Ponorogo" {...pTeks("tempat_terbit")} />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: PENANDATANGAN */}
              {tab === "ttd" && (
                <>
                  <div className={clsKartu(isDark)}>
                    <JudulKartu isDark={isDark} icon={UserCheck}>Data Pejabat Penandatangan</JudulKartu>
                    <div className="space-y-3">
                      <Teks label="Jabatan Penandatangan" {...pTeks("jabatan_penandatangan")} />
                      <Teks label="Nama Terang &amp; Gelar" {...pTeks("nama_penandatangan")} />
                      <div className="grid grid-cols-2 gap-3">
                        <Teks label="Pangkat / Golongan" {...pTeks("pangkat_penandatangan")} />
                        <Teks label="NIP Pejabat" {...pTeks("nip_penandatangan")} />
                      </div>
                    </div>
                  </div>

                  <KotakGambar
                    isDark={isDark}
                    label="Tanda Tangan Digital"
                    path={formData.file_ttd}
                    uploading={uploadingAsset === "ttd"}
                    onPilih={(f) => handleUploadAsset("ttd", f)}
                    onHapus={() => handleDeleteAsset("ttd")}
                  />

                  <KotakGambar
                    isDark={isDark}
                    label="Stempel Resmi Instansi"
                    path={formData.file_stempel}
                    uploading={uploadingAsset === "stempel"}
                    onPilih={(f) => handleUploadAsset("stempel", f)}
                    onHapus={() => handleDeleteAsset("stempel")}
                  />
                </>
              )}

              {/* TAB 3: TATA LETAK */}
              {tab === "layout" && (
                <>
                  <div className={clsKartu(isDark)}>
                    <JudulKartu isDark={isDark} icon={SlidersHorizontal}>Komponen &amp; Saklar Dokumen</JudulKartu>
                    <div className="space-y-2.5 sm:space-y-3">
                      <Saklar
                        isDark={isDark}
                        icon={Minus}
                        label="Garis Pembatas Kop Ganda"
                        deskripsi="Tampilkan garis sekat ganda pemisah di bawah kop dinas"
                        checked={layoutConfig.tampilkan_garis_kop !== false}
                        onChange={(v) => updateLayoutConfig("tampilkan_garis_kop", v)}
                      />
                      <Saklar
                        isDark={isDark}
                        icon={Table}
                        label="Tabel Bobot Penilaian (Kiri Bawah)"
                        deskripsi="Tampilkan rincian persentase bobot 4 pilar di samping tanda tangan"
                        checked={layoutConfig.tampilkan_bobot !== false}
                        onChange={(v) => updateLayoutConfig("tampilkan_bobot", v)}
                      />
                      <Saklar
                        isDark={isDark}
                        icon={MessageSquareQuote}
                        label="Catatan Evaluasi Mentor"
                        deskripsi="Tampilkan kutipan evaluasi mentor di kotak ringkasan nilai"
                        checked={layoutConfig.tampilkan_catatan_mentor !== false}
                        onChange={(v) => updateLayoutConfig("tampilkan_catatan_mentor", v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Panel Kanan: Live Interactive A4 Preview ── */}
          {!isMobile && renderPanelPratinjau()}
        </div>

        {/* ================= Footer Modal ================= */}
        <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-t px-3.5 sm:px-6 py-2.5 sm:py-4 ${
          isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-white"
        }`}>
          <div className="hidden min-w-0 max-w-xl items-center gap-2.5 sm:flex">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-sm ring-1 ring-white/20">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <p className={`text-[10.5px] font-semibold leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Perubahan formulir langsung tercermin di pratinjau lembar transkrip A4. Klik{" "}
              <span className={`font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>Simpan Template</span> untuk menerapkan perubahan.
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
            {isMobile && (
              <button
                type="button"
                onClick={() => setShowMobilePreview(true)}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-[#00A5EC] hover:bg-slate-700"
                    : "border-slate-200 bg-blue-50 text-[#004F9F] hover:bg-blue-100/50"
                }`}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Pratinjau
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg sm:rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer ${
                  isDark
                    ? "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-700/80 hover:text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="group/save inline-flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] bg-[length:200%_100%] bg-left px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-lg shadow-[#0B1442]/25 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover/save:scale-110 group-hover/save:-rotate-6" />
                )}
                <span>{saving ? "Menyimpan..." : "Simpan Template"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {showMobilePreview && isMobile && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-[backdropFade_0.25s_ease-out]"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className={`flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/5 animate-[modalFadeUp_0.3s_ease-out] ${
              isDark ? "bg-[#0B1220]" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4 text-white">
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                    <Eye className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-white">Pratinjau Transkrip Nilai</h3>
                    <p className="truncate text-[10px] text-white/60">Tekan Tutup untuk kembali ke Form</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobilePreview(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-hidden flex flex-col bg-slate-100">
              {renderPanelPratinjau()}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3.5 bg-white dark:bg-[#0B1220]">
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              >
                Kembali ke Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateRaporDesignerModal;
