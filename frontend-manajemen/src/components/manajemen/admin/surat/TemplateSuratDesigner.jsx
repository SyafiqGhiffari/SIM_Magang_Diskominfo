import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, Save, RefreshCw, Loader2, Ruler, Type, Image as ImageIcon,
  FileText, Info, Trash2, Upload, RotateCcw, Eye, Sparkles, Palette, Move,
  Bold, Italic, Underline, Eraser,
  ChevronDown, Check, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ExternalLink, Printer,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
import {
  createTemplateSurat, updateTemplateSurat, getTataLetakBawaan,
  pratinjauTemplateSurat, petaTemplateSurat,
  uploadFileTemplateSurat, deleteFileTemplateSurat,
} from "../../../../services/suratPenerimaanService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess, confirmDialog } from "../../../../utils/swal";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import PratinjauInteraktifSurat from "./PratinjauInteraktifSurat";

const TABS = [
  { id: "info", label: "Informasi", icon: <Info className="w-4 h-4" /> },
  { id: "kop", label: "Kop Surat", icon: <FileText className="w-4 h-4" /> },
  { id: "redaksi", label: "Redaksi", icon: <Type className="w-4 h-4" /> },
  { id: "tataletak", label: "Tata Letak", icon: <Ruler className="w-4 h-4" /> },
  { id: "gambar", label: "Gambar", icon: <ImageIcon className="w-4 h-4" /> },
];

const PLACEHOLDER = [
  "nama_peserta", "nomor_induk", "label_induk", "sebutan_peserta",
  "posisi_bidang", "tanggal_mulai", "tanggal_selesai",
  "jabatan_tujuan", "unit_tujuan", "institusi_tujuan", "kota_tujuan",
  "nomor_surat_pengantar", "tanggal_surat_pengantar",
  "jenis_magang", "nama_instansi", "nama_instansi_kapital",
];

const BARIS_DATA = [
  { key: "nama", label: "Nama peserta" },
  { key: "induk", label: "Nomor induk (NPM/NISN)" },
  { key: "bidang", label: "Bidang/unit kerja" },
  { key: "periode", label: "Waktu pelaksanaan" },
];

// Kerangka kolom (dipakai saat membaca template lama supaya semua kunci ada)
const kosong = {
  nama: "", keterangan: "", jenis_peserta: "semua", status: "publish", is_default: false,
  nama_pemerintah: "", nama_instansi: "", nama_instansi_teks: "", alamat_instansi: "",
  telepon: "", faksimile: "", laman: "", pos_el: "",
  judul_mahasiswa: "", judul_siswa: "", jenis_magang_mhs: "", jenis_magang_sis: "",
  paragraf_pembuka: "", paragraf_penutup: "", paragraf_salam: "", tempat_terbit: "",
  jabatan_penandatangan: "", nama_penandatangan: "", pangkat_penandatangan: "", nip_penandatangan: "",
};

/* Nilai awal untuk TEMPLATE BARU.
   Sengaja diisi mengikuti contoh surat keterangan magang Diskominfo Ponorogo
   supaya begitu modal dibuka, pratinjau langsung tersusun sama dengan
   contoh surat (kop tanpa garis, judul polos, nomor di bawah judul). */
const bawaanBaru = {
  ...kosong,
  nama: "",
  keterangan: "",
  jenis_peserta: "semua",
  status: "publish",
  is_default: false,

  nama_pemerintah: "PEMERINTAH KABUPATEN PONOROGO",
  nama_instansi: "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
  nama_instansi_teks: "Dinas Komunikasi Informatika dan Statistik",
  alamat_instansi: "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
  telepon: "Telepon 0352-3592999",
  faksimile: "Faksimile 0352-3592999",
  laman: "Laman kominfo.ponorogo.go.id",
  pos_el: "Pos-el kominfo@ponorogo.go.id",

  judul_mahasiswa: "SURAT KETERANGAN MAGANG MANDIRI",
  judul_siswa: "SURAT KETERANGAN PRAKTIK KERJA LAPANGAN",
  jenis_magang_mhs: "magang mandiri",
  jenis_magang_sis: "praktik kerja lapangan",

  paragraf_pembuka:
    "Berdasarkan surat dari {jabatan_tujuan} {unit_tujuan} {institusi_tujuan} tanggal {tanggal_surat_pengantar} Nomor {nomor_surat_pengantar} perihal {jenis_magang} di {nama_instansi} Kabupaten Ponorogo atas nama:",
  paragraf_penutup:
    "Dengan ini kami sampaikan bahwa {sebutan_peserta} tersebut diatas dapat kami terima untuk melaksanakan {jenis_magang} di {nama_instansi} Kabupaten Ponorogo pada tanggal {tanggal_mulai} sampai dengan {tanggal_selesai}.",
  paragraf_salam: "Demikian atas kerjasamanya kami sampaikan terima kasih.",
  tempat_terbit: "Ponorogo",

  jabatan_penandatangan: "Kepala Dinas Komunikasi Informatika dan Statistik",
  nama_penandatangan: "",
  pangkat_penandatangan: "Pembina Utama Muda",
  nip_penandatangan: "",
};

// ── Kelas gaya (fungsi, bukan komponen, supaya identitas komponen tetap stabil) ──
const clsInput = (isDark) =>
  `w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "bg-slate-900/60 border-slate-700 text-slate-100 hover:border-slate-600 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/15"
      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-[#004F9F] focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;
const clsLabel = (isDark) =>
  `block text-[10.5px] font-black uppercase tracking-wider mb-1.5 ${
    isDark ? "text-slate-400" : "text-slate-400"
  }`;
const clsKartu = (isDark) =>
  `rounded-2xl border p-4 transition-all duration-200 ${
    isDark
      ? "bg-slate-900/40 border-slate-700/60 hover:border-slate-600"
      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
  }`;

  /* Judul seksi — pola sama dengan SectionTitle pada modal kelola surat */
  const JudulKartu = ({ isDark, icon: Icon, children }) => (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
      {Icon && <Icon className="h-3.5 w-3.5 text-[#004F9F]" />}
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
        {children}
      </p>
      <span className={`h-px flex-1 bg-gradient-to-r to-transparent ${isDark ? "from-slate-700" : "from-slate-200"}`} />
    </div>
  );

/* ── Komponen kolom didefinisikan di tingkat modul.
      Kalau ditaruh di dalam TemplateSuratDesigner, React akan membongkar-pasang
      ulang setiap input pada tiap ketikan dan kursor akan lepas. ── */
const Teks = ({ isDark, label, value, onChange, ...rest }) => (
  <div>
    <label className={clsLabel(isDark)}>{label}</label>
    <input className={clsInput(isDark)} value={value ?? ""} onChange={onChange} {...rest} />
  </div>
);

/* Dropdown custom: tidak memakai <select> bawaan browser supaya tampilannya
   seragam di semua sistem operasi dan bisa dianimasikan.
   API-nya tetap kompatibel: onChange menerima objek { target: { value } }. */
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
          buka ? "ring-2 ring-[#00A5EC]/40" : ""
        }`}
      >
        <span className="truncate">{terpilih?.label ?? "Pilih..."}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${buka ? "rotate-180 text-[#00A5EC]" : "opacity-50"}`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 z-50 mt-1.5 origin-top overflow-hidden rounded-xl border p-1 shadow-xl transition-all duration-200 ${
          buka
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        } ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
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
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition-all duration-150 ${
                aktif
                  ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {aktif && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* Versi pil ringkas dari Pilihan, dipakai di toolbar pratinjau */
const PilihanMini = ({ isDark, value, onChange, opsi = [] }) => {
  const [buka, setBuka] = useState(false);
  const kotak = useRef(null);

  useEffect(() => {
    if (!buka) return undefined;
    const klikLuar = (e) => {
      if (kotak.current && !kotak.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, [buka]);

  const terpilih = opsi.find((o) => String(o.nilai) === String(value ?? ""));

  return (
    <div ref={kotak} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
          isDark
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600"
            : "border-slate-200 bg-slate-50 text-[#0B1442] hover:border-[#004F9F]/40"
        }`}
      >
        <span className="truncate">{terpilih?.label ?? "Pilih"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${buka ? "rotate-180 text-[#00A5EC]" : "opacity-50"}`} />
      </button>

      <div
        className={`absolute right-0 z-50 mt-1.5 w-44 origin-top-right overflow-hidden rounded-xl border p-1 shadow-xl transition-all duration-200 ${
          buka
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        } ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
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
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold transition-all duration-150 ${
                aktif
                  ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {aktif && <Check className="h-3 w-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Angka = ({ isDark, label, value, onChange, step = 1, satuan = "mm" }) => (
  <div>
    <label className={clsLabel(isDark)}>
      {label} <span className="normal-case opacity-60">({satuan})</span>
    </label>
    <input type="number" step={step} className={clsInput(isDark)} value={value ?? ""} onChange={onChange} />
  </div>
);

const Saklar = ({ isDark, label, checked, onChange }) => (
  <label
    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
      checked
        ? isDark
          ? "border-[#00A5EC]/50 bg-[#00A5EC]/10 text-slate-100"
          : "border-[#004F9F]/40 bg-blue-50/70 text-[#0B1442] shadow-sm"
        : isDark
          ? "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
    }`}
  >
    <input type="checkbox" className="w-3.5 h-3.5 accent-[#004F9F]" checked={Boolean(checked)} onChange={onChange} />
    {label}
  </label>
);

/* Bilah gaya mini (mirip Word) untuk kolom teks panjang.
   Tombolnya membungkus teks yang diseleksi dengan penanda yang dikenali
   pembuat PDF: **tebal**, *miring*, __garis bawah__. */
const TombolGaya = ({ isDark, judul, icon: Icon, onClick }) => (
  <button
    type="button"
    title={judul}
    aria-label={judul}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
      isDark
        ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-[#00A5EC] hover:text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F] hover:text-[#004F9F]"
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

const BilahGaya = ({ isDark, onGaya }) => (
  <div className="flex items-center gap-1">
    <TombolGaya isDark={isDark} judul="Tebal (**teks**)" icon={Bold} onClick={() => onGaya("tebal")} />
    <TombolGaya isDark={isDark} judul="Miring (*teks*)" icon={Italic} onClick={() => onGaya("miring")} />
    <TombolGaya isDark={isDark} judul="Garis bawah (__teks__)" icon={Underline} onClick={() => onGaya("garis_bawah")} />
    <TombolGaya isDark={isDark} judul="Hapus gaya pada teks terpilih" icon={Eraser} onClick={() => onGaya("bersih")} />
  </div>
);

const Area = ({ isDark, label, name, rows = 5, value, onChange, onFocus, onGaya }) => (
  <div>
    <div className="mb-1.5 flex items-end justify-between gap-2">
      <label className={`${clsLabel(isDark)} mb-0`}>{label}</label>
      {onGaya && <BilahGaya isDark={isDark} onGaya={(jenis) => onGaya(name, jenis)} />}
    </div>
    <textarea
      name={name}
      rows={rows}
      className={`${clsInput(isDark)} leading-relaxed`}
      value={value ?? ""}
      onChange={onChange}
      onFocus={onFocus}
    />
  </div>
);

/* Kotak unggah gambar: mendukung klik maupun seret-lepas berkas. */
const KotakGambar = ({ isDark, label, path, onPilih, onHapus }) => {
  const [seret, setSeret] = useState(false);

  const ambilBerkas = (berkas) => {
    if (!berkas) return;
    if (!/^image\/(png|jpe?g)$/i.test(berkas.type)) {
      toastError("Format harus PNG atau JPG.");
      return;
    }
    if (berkas.size > 5 * 1024 * 1024) {
      toastError("Ukuran gambar maksimal 5MB.");
      return;
    }
    onPilih(berkas);
  };

  return (
    <div className={clsKartu(isDark)}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
          <span className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</span>
          {path && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
              Terpasang
            </span>
          )}
        </div>
        {path && (
          <button
            type="button"
            onClick={onHapus}
            title="Hapus gambar"
            className="cursor-pointer rounded-lg p-1.5 text-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!seret) setSeret(true);
        }}
        onDragLeave={() => setSeret(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSeret(false);
          ambilBerkas(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200 ${
          seret
            ? "scale-[1.01] border-[#00A5EC] bg-[#00A5EC]/10"
            : isDark
              ? "border-slate-700 bg-slate-900/30 hover:border-[#00A5EC]/60 hover:bg-slate-900/50"
              : "border-slate-300 bg-slate-50/60 hover:border-[#004F9F]/50 hover:bg-blue-50/50"
        }`}
      >
        {path ? (
          <img
            src={getFileUrl(path)}
            alt={label}
            className="h-24 w-auto rounded-lg bg-white object-contain p-2 shadow-sm"
          />
        ) : (
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 ${
              seret ? "scale-110" : ""
            } ${isDark ? "bg-slate-800 text-slate-400" : "bg-white text-[#004F9F]"}`}
          >
            <Upload className="h-5 w-5" />
          </span>
        )}

        <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
          {seret ? "Lepaskan berkas di sini" : path ? "Pilih atau seret gambar untuk mengganti" : "Pilih atau seret gambar"}
        </span>
        <span className={`text-[10.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          PNG atau JPG, maksimal 5MB
        </span>

        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            ambilBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
};

const TemplateSuratDesigner = ({ template = null, onClose, onSaved }) => {
  const { isDark } = useManajemenTheme();

  const [idTpl, setIdTpl] = useState(template?.id ?? null);
  const [gambar, setGambar] = useState({
    file_logo: template?.file_logo || "",
    file_ttd: template?.file_ttd || "",
    file_stempel: template?.file_stempel || "",
  });
const [form, setForm] = useState(() => {
  // Template baru langsung memakai isian contoh surat resmi
  if (!template) return { ...bawaanBaru };
    const isi = { ...kosong };
    Object.keys(kosong).forEach((k) => {
      if (template[k] !== undefined && template[k] !== null) isi[k] = template[k];
    });
    return isi;
  });
  const [tataLetak, setTataLetak] = useState(() => {
    try {
      return JSON.parse(template?.konfigurasi_tata_letak || "{}");
    } catch {
      return {};
    }
  });
  const [bawaan, setBawaan] = useState(null);

  const [tab, setTab] = useState("info");
  const [kategori, setKategori] = useState("mahasiswa");
  const [menyimpan, setMenyimpan] = useState(false);
  const [memuatPratinjau, setMemuatPratinjau] = useState(false);
  const [pratinjauUrl, setPratinjauUrl] = useState("");
  const [otomatis, setOtomatis] = useState(true);

  // Peta blok (kotak-kotak yang bisa digeser) dari backend
  const [peta, setPeta] = useState(null);
  // "geser" = pratinjau interaktif, "pdf" = iframe PDF biasa
  const [mode, setMode] = useState("geser");

  // Viewer PDF (pola sama dengan SuratPenerimaanModal di halaman daftar surat)
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [docError, setDocError] = useState(false);

  const urlRef = useRef("");
  const areaAktif = useRef(null);
  const pertamaKali = useRef(true);
  const onSavedRef = useRef(onSaved);
  const simpanRef = useRef(null);
  const sidikTersimpan = useRef(null);
  const perluSegarkan = useRef(false);

  // Sidik data saat ini; dipakai sebagai penanda perubahan nyata pada autosave
  const sidik = JSON.stringify({ form, tataLetak });

  // Simpan prop terbaru di ref supaya identitasnya tidak memicu ulang effect
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const segarkanDaftar = () => {
    perluSegarkan.current = false;
    onSavedRef.current?.();
  };

  const tutup = () => {
    if (perluSegarkan.current) segarkanDaftar();
    onClose?.();
  };

  // Nilai bawaan tata letak, untuk tombol "Kembalikan bawaan" dan mengisi field kosong
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await getTataLetakBawaan();
        const def = res.data.data || {};
        setBawaan(def);
        setTataLetak((prev) => ({ ...def, ...prev }));
      } catch {
        // biarkan; backend tetap memakai default saat generate
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Bebaskan blob URL saat editor ditutup
  useEffect(() => {
    return () => {
      if (urlRef.current) window.URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const muatPratinjau = useCallback(async (id, kat) => {
    if (!id) return;
    setMemuatPratinjau(true);
    try {
      // PDF dan peta blok diambil bersamaan supaya kotak geser selalu sinkron
      const [url, hasilPeta] = await Promise.all([
        pratinjauTemplateSurat(id, kat),
        petaTemplateSurat(id, kat).catch(() => null),
      ]);
      if (urlRef.current) window.URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPratinjauUrl(url);
      if (hasilPeta) setPeta(hasilPeta);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membuat pratinjau surat.");
    } finally {
      setMemuatPratinjau(false);
    }
  }, []);

  // Pratinjau awal saat membuka template yang sudah ada
  useEffect(() => {
    if (!idTpl) return;
    const t = setTimeout(() => muatPratinjau(idTpl, kategori), 0);
    return () => clearTimeout(t);
  }, [idTpl, kategori, muatPratinjau]);

  const simpan = useCallback(
    async ({ diam = false } = {}) => {
      if (!form.nama.trim()) {
        setTab("info");
        toastError("Nama template wajib diisi.");
        return null;
      }
      setMenyimpan(true);
      try {
        const payload = { ...form, tata_letak: tataLetak };
        const res = idTpl
          ? await updateTemplateSurat(idTpl, payload)
          : await createTemplateSurat(payload);
        const data = res.data.data;
        setIdTpl(data.id);
        if (!diam) toastSuccess(idTpl ? "Template diperbarui" : "Template berhasil dibuat");
        perluSegarkan.current = true; // daftar disegarkan saat editor ditutup / simpan manual
        return data.id;
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal menyimpan template surat.");
        return null;
      } finally {
        setMenyimpan(false);
      }
    },
      [form, tataLetak, idTpl]
  );

  // Versi terbaru `simpan` disimpan di ref agar tidak masuk dependensi effect autosave
  useEffect(() => {
    simpanRef.current = simpan;
  }, [simpan]);

  // Simpan senyap + segarkan pratinjau, 1,2 detik setelah perubahan terakhir
  useEffect(() => {
    if (pertamaKali.current) {
      pertamaKali.current = false;
      sidikTersimpan.current = sidik; // kondisi awal dianggap sudah tersimpan
      return;
    }
    if (!otomatis || !idTpl) return;
    if (sidikTersimpan.current === sidik) return; // tidak ada perubahan nyata, jangan simpan

    const t = setTimeout(async () => {
      const id = await simpanRef.current?.({ diam: true });
      if (!id) return;
      sidikTersimpan.current = sidik;
      muatPratinjau(id, kategori);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidik, otomatis, idTpl, kategori, muatPratinjau]);

  // Muat dokumen PDF saat berada di mode PDF.
  // Semua setState dijalankan di luar badan efek (lewat tugas asinkron atau
  // fungsi cleanup) supaya React tidak memicu cascading render.
  useEffect(() => {
    const aktif = mode === "pdf" && Boolean(pratinjauUrl);
    let batal = false;

    const tugas = setTimeout(() => {
      if (batal) return;
      if (!aktif) {
        setPdfDoc(null);
        setDocError(false);
        return;
      }
      setDocError(false);
      fetch(pratinjauUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
        .then((doc) => {
          if (batal) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
        })
        .catch(() => {
          if (batal) return;
          setDocError(true);
        });
    }, 0);

    return () => {
      batal = true;
      clearTimeout(tugas);
    };
  }, [mode, pratinjauUrl]);

  // Gambar halaman aktif ke canvas sesuai tingkat perbesaran
  useEffect(() => {
    if (!pdfDoc) return undefined;
    let batal = false;
    let tugasRender = null;

    pdfDoc.getPage(pageNum).then((page) => {
      if (batal) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      tugasRender = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      tugasRender.promise.catch(() => {}); // abaikan pembatalan render
    });

    return () => {
      batal = true;
      if (tugasRender) tugasRender.cancel();
    };
  }, [pdfDoc, pageNum, zoom]);

  const simpanManual = async () => {
    const id = await simpan();
    if (!id) return;
    sidikTersimpan.current = sidik; // supaya autosave tidak langsung menyimpan lagi
    muatPratinjau(id, kategori);
    segarkanDaftar();
  };

  // ── Perubahan nilai ──
  const ubah = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const ubahAngka = (key) => (e) => {
    const v = e.target.value;
    setTataLetak((p) => ({ ...p, [key]: v === "" ? "" : Number(v) }));
  };
  const ubahSaklar = (key) => (e) => setTataLetak((p) => ({ ...p, [key]: e.target.checked }));

  // ── Pembungkus props supaya JSX tetap ringkas ──
  const pTeks = (k) => ({ isDark, value: form[k], onChange: ubah(k) });
  const pAngka = (k) => ({ isDark, value: tataLetak[k], onChange: ubahAngka(k) });
  const pSaklar = (k) => ({ isDark, checked: tataLetak[k], onChange: ubahSaklar(k) });
  const pArea = (k) => ({ isDark, name: k, value: form[k], onChange: ubah(k) });

  // Dicatat lewat useCallback dan dipasang langsung sebagai prop JSX supaya
  // React tahu ref hanya disentuh di dalam event handler, bukan saat render.
  const catatFokus = useCallback((e) => {
    areaAktif.current = e.target;
  }, []);

  const toggleBarisData = (key) =>
    setTataLetak((p) => {
      const aktif = Array.isArray(p.baris_data) ? p.baris_data : [];
      return {
        ...p,
        baris_data: aktif.includes(key) ? aktif.filter((k) => k !== key) : [...aktif, key],
      };
    });

  const resetTataLetak = async () => {
    if (!bawaan) return;
    const konfirmasi = await confirmDialog({
      title: "Kembalikan tata letak ke bawaan?",
      text: "Semua angka penataan dikembalikan ke nilai awal. Redaksi dan gambar tidak terpengaruh.",
      confirmText: "Ya, Kembalikan",
      icon: "warning",
    });
    if (!konfirmasi.isConfirmed) return;
    setTataLetak({ ...bawaan });
  };

  const sisipkanPlaceholder = (ph) => {
    const aktifSekarang = document.activeElement;
    const el =
      aktifSekarang && aktifSekarang.tagName === "TEXTAREA" ? aktifSekarang : areaAktif.current;
    if (!el || !el.name) {
      toastError("Klik dulu kolom redaksi yang ingin disisipi.");
      return;
    }
    const nama = el.name;
    const teks = form[nama] || "";
    const awal = el.selectionStart ?? teks.length;
    const akhir = el.selectionEnd ?? teks.length;
    setForm((p) => ({ ...p, [nama]: `${teks.slice(0, awal)}{${ph}}${teks.slice(akhir)}` }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = awal + ph.length + 2;
      el.setSelectionRange(pos, pos);
    });
  };

  /* ── Gaya teks seperti Word: tebal, miring, garis bawah ──
   Penanda ditulis langsung di dalam teks supaya tetap tersimpan sebagai
   satu kolom biasa, dan dibaca ulang oleh pembuat PDF di backend. */
  const PENANDA = { tebal: "**", miring: "*", garis_bawah: "__" };

  const terapkanGaya = (namaKolom, jenis) => {
    const aktifSekarang = document.activeElement;
    let el =
      aktifSekarang && aktifSekarang.tagName === "TEXTAREA" && aktifSekarang.name === namaKolom
        ? aktifSekarang
        : null;
    if (!el) {
      el = document.querySelector(`textarea[name="${namaKolom}"]`);
    }
    if (!el) return;

    const teks = form[namaKolom] || "";
    let awal = el.selectionStart ?? 0;
    let akhir = el.selectionEnd ?? 0;

    // Tanpa seleksi: ambil kata di posisi kursor supaya sekali klik langsung terasa
    if (awal === akhir) {
      let i = awal;
      let j = akhir;
      while (i > 0 && !/\s/.test(teks[i - 1])) i -= 1;
      while (j < teks.length && !/\s/.test(teks[j])) j += 1;
      awal = i;
      akhir = j;
    }
    if (awal === akhir) {
      toastError("Pilih dulu teks yang ingin diberi gaya.");
      return;
    }

    const pilihan = teks.slice(awal, akhir);
    const bersih = pilihan.replace(/\*\*|__|\*/g, "");
    let hasil;

    if (jenis === "bersih") {
      hasil = bersih;
    } else {
      const tanda = PENANDA[jenis];
      // Klik kedua pada teks yang sudah bergaya akan melepas gayanya
      const sudah = pilihan.startsWith(tanda) && pilihan.endsWith(tanda) && pilihan.length > tanda.length * 2;
      hasil = sudah ? pilihan.slice(tanda.length, pilihan.length - tanda.length) : `${tanda}${pilihan}${tanda}`;
    }

    setForm((p) => ({ ...p, [namaKolom]: teks.slice(0, awal) + hasil + teks.slice(akhir) }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(awal, awal + hasil.length);
    });
  };

  const unggah = async (jenis, file) => {
    if (!file) return;
    let id = idTpl;
    if (!id) {
      id = await simpan({ diam: true });
      if (!id) return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadFileTemplateSurat(id, jenis, fd);
      const data = res.data.data;
      setGambar({
        file_logo: data.file_logo || "",
        file_ttd: data.file_ttd || "",
        file_stempel: data.file_stempel || "",
      });
      toastSuccess("Gambar berhasil diunggah");
      sidikTersimpan.current = sidik;
      muatPratinjau(id, kategori);
      segarkanDaftar();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengunggah gambar.");
    }
  };

  // Cetak PDF pratinjau lewat iframe tersembunyi supaya tidak membuka tab baru.
  const cetakPratinjau = () => {
    if (!pratinjauUrl) return;
    const bingkai = document.createElement("iframe");
    bingkai.style.position = "fixed";
    bingkai.style.right = "0";
    bingkai.style.bottom = "0";
    bingkai.style.width = "0";
    bingkai.style.height = "0";
    bingkai.style.border = "0";
    bingkai.src = pratinjauUrl;
    bingkai.onload = () => {
      try {
        bingkai.contentWindow.focus();
        bingkai.contentWindow.print();
      } catch {
        window.open(pratinjauUrl, "_blank", "noopener");
      }
      setTimeout(() => bingkai.remove(), 60000);
    };
    document.body.appendChild(bingkai);
  };

  const hapusGambar = async (jenis) => {
    if (!idTpl) return;
    try {
      const res = await deleteFileTemplateSurat(idTpl, jenis);
      const data = res.data.data;
      setGambar({
        file_logo: data.file_logo || "",
        file_ttd: data.file_ttd || "",
        file_stempel: data.file_stempel || "",
      });
      toastSuccess("Gambar dihapus");
      sidikTersimpan.current = sidik;
      muatPratinjau(idTpl, kategori);
      segarkanDaftar();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus gambar.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md animate-[backdropFade_0.25s_ease-out]"
      onClick={tutup}
    >
      <div
        className={`flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/5 animate-[modalFadeUp_0.3s_ease-out] ${isDark ? "bg-[#0B1220]" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-3.5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl" />
          <FileText
            className="pointer-events-none absolute right-16 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.06]"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="relative shrink-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg">
                  <Palette className="h-5 w-5" />
                </span>
                <span className="pointer-events-none absolute -inset-1 animate-pulse rounded-2xl border-2 border-[#00A5EC]/30" />
              </span>
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC]">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  {idTpl ? "Perbarui Template Surat" : "Buat Template Surat"}
                </div>
                <h3 className="truncate text-base font-black leading-tight text-white">
                  {form.nama?.trim() || (idTpl ? "Template Tanpa Nama" : "Template Surat Baru")}
                </h3>
                {/* Keterangan + badge status sejajar, dipisah jarak lebar */}
                <div className="mt-1 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/60">
                    <Move className="h-3 w-3 shrink-0" />
                    <span className="truncate">Geser langsung blok pada pratinjau, atau atur angka presisi di panel kiri</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 backdrop-blur-sm ${
                        form.status === "publish"
                          ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                          : "bg-amber-400/20 text-amber-100 ring-amber-300/30"
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      {form.status === "publish" ? "Publish" : "Draft"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                      <Info className="h-3 w-3" />
                      {form.jenis_peserta === "mahasiswa" ? "Mahasiswa" : form.jenis_peserta === "siswa" ? "Siswa" : "Semua peserta"}
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm md:inline-flex">
                      <Ruler className="h-3 w-3" />
                      A4 · 210 × 297 mm
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 backdrop-blur-sm ${
                        otomatis ? "bg-sky-400/20 text-sky-100 ring-sky-300/30" : "bg-white/10 text-white/70 ring-white/15"
                      }`}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {otomatis ? "Simpan otomatis" : "Simpan manual"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={tutup}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white"
              aria-label="Tutup modal template surat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className={`grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] ${isDark ? "bg-slate-950/20" : "bg-slate-50/40"}`}>
          {/* ── Panel kiri ── */}
          <div className={`flex min-h-0 min-w-0 flex-col border-r ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div className={`flex shrink-0 gap-1 overflow-x-auto border-b px-5 py-3 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-white"}`}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    tab === t.id
                      ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-sm"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className={`min-h-0 flex-1 space-y-5 overflow-y-auto p-6 ${isDark ? "bg-slate-950/20" : "bg-slate-50/40"}`}>
              {tab === "info" && (
                <>
                  <Teks label="Nama Template" placeholder="Template Resmi Diskominfo" {...pTeks("nama")} />
                  <Teks label="Keterangan" placeholder="Dipakai untuk surat mahasiswa dan siswa" {...pTeks("keterangan")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Pilihan
                      label="Jenis Peserta"
                      isDark={isDark}
                      value={form.jenis_peserta}
                      onChange={ubah("jenis_peserta")}
                      opsi={[
                        { nilai: "semua", label: "Semua" },
                        { nilai: "mahasiswa", label: "Mahasiswa" },
                        { nilai: "siswa", label: "Siswa" },
                      ]}
                    />
                    <Pilihan
                      label="Status"
                      isDark={isDark}
                      value={form.status}
                      onChange={ubah("status")}
                      opsi={[
                        { nilai: "publish", label: "Publish" },
                        { nilai: "draft", label: "Draft" },
                      ]}
                    />
                  </div>
                  <Saklar
                    isDark={isDark}
                    label="Jadikan template utama (dipakai otomatis saat menerbitkan surat)"
                    checked={form.is_default}
                    onChange={ubah("is_default")}
                  />
                </>
              )}

              {tab === "kop" && (
                <>
                  <Teks label="Nama Pemerintah" {...pTeks("nama_pemerintah")} />
                  <Teks label="Nama Instansi (kapital, untuk kop)" {...pTeks("nama_instansi")} />
                  <Teks label="Nama Instansi (untuk di dalam kalimat)" {...pTeks("nama_instansi_teks")} />
                  <Teks label="Alamat" {...pTeks("alamat_instansi")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Teks label="Telepon" {...pTeks("telepon")} />
                    <Teks label="Faksimile" {...pTeks("faksimile")} />
                    <Teks label="Laman" {...pTeks("laman")} />
                    <Teks label="Pos-el" {...pTeks("pos_el")} />
                  </div>
                </>
              )}

              {tab === "redaksi" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Teks label="Judul Surat — Mahasiswa" {...pTeks("judul_mahasiswa")} />
                    <Teks label="Judul Surat — Siswa" {...pTeks("judul_siswa")} />
                    <Teks label="Jenis Magang — Mahasiswa" {...pTeks("jenis_magang_mhs")} />
                    <Teks label="Jenis Magang — Siswa" {...pTeks("jenis_magang_sis")} />
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Sisipkan data otomatis</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PLACEHOLDER.map((ph) => (
                        <button
                          key={ph}
                          onClick={() => sisipkanPlaceholder(ph)}
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${
                            isDark
                              ? "border-slate-700 bg-slate-900/50 text-[#00A5EC] hover:bg-slate-800"
                              : "border-slate-200 bg-slate-50 text-[#004F9F] hover:bg-blue-50 hover:border-[#004F9F]/40"
                          }`}
                        >
                          {`{${ph}}`}
                        </button>
                      ))}
                    </div>
                    <p className={`text-[11px] mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Klik kolom paragraf dulu, lalu klik penanda di atas untuk menyisipkannya di posisi kursor.
                    </p>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Gaya teks</p>
                    <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Pilih teks pada kolom paragraf, lalu klik <b>B</b> (tebal), <i>I</i> (miring), atau{" "}
                      <u>U</u> (garis bawah) di sisi kanan judul kolom. Gaya ini ikut tercetak di PDF surat.
                    </p>
                  </div>

                  <Area label="Paragraf Pembuka" rows={6} onFocus={catatFokus} onGaya={terapkanGaya} {...pArea("paragraf_pembuka")} />
                  <Area label="Paragraf Penutup" rows={4} onFocus={catatFokus} onGaya={terapkanGaya} {...pArea("paragraf_penutup")} />
                  <Area label="Paragraf Salam" rows={3} onFocus={catatFokus} onGaya={terapkanGaya} {...pArea("paragraf_salam")} />
                  <Teks label="Tempat Terbit" {...pTeks("tempat_terbit")} />

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Penandatangan</p>
                    <div className="space-y-3">
                      <Teks label="Jabatan" {...pTeks("jabatan_penandatangan")} />
                      <Teks label="Nama" {...pTeks("nama_penandatangan")} />
                      <div className="grid grid-cols-2 gap-3">
                        <Teks label="Pangkat" {...pTeks("pangkat_penandatangan")} />
                        <Teks label="NIP" {...pTeks("nip_penandatangan")} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "tataletak" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Satuan milimeter, kertas A4 (210 × 297 mm)
                    </p>
                    <button
                      onClick={resetTataLetak}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Kembalikan bawaan
                    </button>
                  </div>

                <div className={clsKartu(isDark)}>
                  <JudulKartu isDark={isDark} icon={Ruler}>Margin</JudulKartu>
                    <div className="grid grid-cols-2 gap-3">
                      <Angka label="Kiri" step={0.5} {...pAngka("margin_kiri")} />
                      <Angka label="Kanan" step={0.5} {...pAngka("margin_kanan")} />
                      <Angka label="Atas" step={0.5} {...pAngka("margin_atas")} />
                      <Angka label="Bawah" step={0.5} {...pAngka("margin_bawah")} />
                    </div>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Tipografi</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Pilihan
                          label="Font"
                          isDark={isDark}
                          value={tataLetak.font_isi ?? "Arial"}
                          onChange={(e) => setTataLetak((p) => ({ ...p, font_isi: e.target.value }))}
                          opsi={[
                            { nilai: "Arial", label: "Arial" },
                            { nilai: "Times", label: "Times New Roman" },
                            { nilai: "Helvetica", label: "Helvetica" },
                          ]}
                        />
                      </div>
                      <Angka label="Ukuran isi" step={0.5} satuan="pt" {...pAngka("ukuran_font_isi")} />
                      <Angka label="Ukuran judul" step={0.5} satuan="pt" {...pAngka("ukuran_font_judul")} />
                      <Angka label="Ukuran kop" step={0.5} satuan="pt" {...pAngka("ukuran_font_kop")} />
                      <Angka label="Ukuran alamat" step={0.5} satuan="pt" {...pAngka("ukuran_font_alamat")} />
                      <Angka label="Tinggi baris" step={0.1} {...pAngka("tinggi_baris")} />
                      <Angka label="Jarak paragraf" step={0.5} {...pAngka("jarak_paragraf")} />
                    </div>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Kop Surat &amp; Logo</p>
                    <div className="flex flex-wrap gap-4 mb-3">
                      <Saklar label="Tampilkan kop" {...pSaklar("tampilkan_kop")} />
                      <Saklar label="Tampilkan logo" {...pSaklar("tampilkan_logo")} />
                      <Saklar label="Garis bawah kop" {...pSaklar("tampilkan_garis_kop")} />
                      <Saklar label="Logo menempel ke tulisan kop" {...pSaklar("logo_ikut_kop")} />
                      <Saklar label="Tengahkan logo + tulisan kop" {...pSaklar("pusatkan_kop_dengan_logo")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Angka label="Kop posisi X" step={0.5} {...pAngka("kop_x")} />
                      <Angka label="Kop lebar" step={0.5} {...pAngka("kop_lebar")} />
                      <Angka label="Logo X" step={0.5} {...pAngka("logo_x")} />
                      <Angka label="Logo Y" step={0.5} {...pAngka("logo_y")} />
                      <Angka label="Logo lebar" step={0.5} {...pAngka("logo_lebar")} />
                      <Angka label="Jarak logo ke kop" step={0.5} {...pAngka("jarak_logo_ke_kop")} />
                      <Angka label="Ketebalan garis" step={0.1} {...pAngka("garis_kop_tebal")} />
                      <Angka label="Jarak setelah kop" step={0.5} {...pAngka("jarak_setelah_kop")} />
                      <Angka label="Jarak setelah judul" step={0.5} {...pAngka("jarak_setelah_judul")} />
                    </div>
                      <div className="mt-3 flex flex-wrap gap-4">
                      <Saklar label="Judul surat tebal" {...pSaklar("judul_tebal")} />
                      <Saklar label="Garis bawah pada judul surat" {...pSaklar("tampilkan_garis_judul")} />
                    </div>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Tempat &amp; Tanggal</p>
                    <p className={`mb-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Ditulis rata kanan tepat di bawah kop surat, sebelum baris “Kepada / Yth.”.
                    </p>
                    <div className="mb-3">
                      <Saklar label="Tampilkan tempat & tanggal" {...pSaklar("tampilkan_tanggal")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Angka label="Tanggal posisi X" step={0.5} {...pAngka("tanggal_x")} />
                      <Angka label="Tanggal lebar" step={0.5} {...pAngka("tanggal_lebar")} />
                      <Angka label="Jarak setelah tanggal" step={0.5} {...pAngka("jarak_setelah_tanggal")} />
                    </div>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Tujuan &amp; Data Peserta</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Angka label="Indentasi tujuan" step={0.5} {...pAngka("indent_tujuan")} />
                      <Angka label="Indentasi data" step={0.5} {...pAngka("indent_data")} />
                      <Angka label="Lebar kolom label" step={0.5} {...pAngka("lebar_label_data")} />
                      <Angka label="Jarak sebelum TTD" step={0.5} {...pAngka("jarak_setelah_isi")} />
                    </div>
                    <p className={`${clsLabel(isDark)} mt-3`}>Baris yang ditampilkan</p>
                    <div className="flex flex-wrap gap-3">
                      {BARIS_DATA.map((b) => (
                        <Saklar
                          key={b.key}
                          isDark={isDark}
                          label={b.label}
                          checked={(tataLetak.baris_data || []).includes(b.key)}
                          onChange={() => toggleBarisData(b.key)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className={clsKartu(isDark)}>
                    <p className={clsLabel(isDark)}>Blok Tanda Tangan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Angka label="Jarak dari kiri" step={0.5} {...pAngka("ttd_x")} />
                      <Angka label="Lebar blok" step={0.5} {...pAngka("ttd_lebar")} />
                      <Angka label="Tinggi ruang TTD" step={0.5} {...pAngka("ruang_ttd")} />
                      <Angka label="Lebar gambar TTD" step={0.5} {...pAngka("ttd_gambar_lebar")} />
                      <Angka label="Geser TTD X" step={0.5} {...pAngka("ttd_gambar_geser_x")} />
                      <Angka label="Geser TTD Y" step={0.5} {...pAngka("ttd_gambar_geser_y")} />
                      <Angka label="Lebar stempel" step={0.5} {...pAngka("stempel_lebar")} />
                      <Angka label="Geser stempel X" step={0.5} {...pAngka("stempel_geser_x")} />
                      <Angka label="Geser stempel Y" step={0.5} {...pAngka("stempel_geser_y")} />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <Saklar label="Tampilkan TTD" {...pSaklar("tampilkan_ttd")} />
                      <Saklar label="Tampilkan stempel" {...pSaklar("tampilkan_stempel")} />
                      <Saklar label="Garis bawah nama" {...pSaklar("garis_bawah_nama")} />
                    </div>
                  </div>
                </>
              )}

              {tab === "gambar" && (
                <>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Format PNG atau JPG, maksimal 5MB. Gunakan PNG berlatar transparan untuk tanda tangan dan stempel.
                  </p>
                  <KotakGambar
                    isDark={isDark} label="Logo Instansi" path={gambar.file_logo}
                    onPilih={(f) => unggah("logo", f)} onHapus={() => hapusGambar("logo")}
                  />
                  <KotakGambar
                    isDark={isDark} label="Tanda Tangan" path={gambar.file_ttd}
                    onPilih={(f) => unggah("ttd", f)} onHapus={() => hapusGambar("ttd")}
                  />
                  <KotakGambar
                    isDark={isDark} label="Stempel" path={gambar.file_stempel}
                    onPilih={(f) => unggah("stempel", f)} onHapus={() => hapusGambar("stempel")}
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Panel pratinjau ── */}
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isDark ? "bg-slate-950/40" : "bg-slate-100"}`}>
            <div className={`flex shrink-0 items-center justify-between gap-2 border-b px-5 py-3 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-white"}`}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-slate-800 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"}`}>
                  <Eye className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-black leading-tight ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>Pratinjau Surat</p>
                  <p className={`text-[10.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {mode === "geser"
                      ? "Tarik kotak untuk menata, Ctrl + scroll mouse untuk zoom"
                      : "Memakai data contoh, bukan data peserta asli"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Pemilih mode pratinjau */}
                <div className={`flex items-center gap-0.5 rounded-full border p-1 shadow-sm ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                  <button
                    type="button"
                    onClick={() => setMode("geser")}
                    title="Mode geser (tata langsung di pratinjau)"
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                      mode === "geser"
                        ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-sm"
                        : isDark
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-500 hover:text-[#004F9F]"
                    }`}
                  >
                    <Move className="h-3.5 w-3.5" /> Geser
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("pdf")}
                    title="Tampilkan PDF apa adanya"
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                      mode === "pdf"
                        ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-sm"
                        : isDark
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-500 hover:text-[#004F9F]"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>

                <PilihanMini
                  isDark={isDark}
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  opsi={[
                    { nilai: "mahasiswa", label: "Contoh mahasiswa" },
                    { nilai: "siswa", label: "Contoh siswa" },
                  ]}
                />
                <button
                  onClick={simpanManual}
                  disabled={memuatPratinjau || menyimpan}
                  title="Segarkan pratinjau"
                  className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark ? "text-slate-400 hover:bg-slate-800 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                >
                  {memuatPratinjau || menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div
              className="relative min-h-0 flex-1 overflow-hidden p-6"
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
              {mode === "geser" ? (
                <PratinjauInteraktifSurat
                  pratinjauUrl={pratinjauUrl}
                  peta={peta}
                  tataLetak={tataLetak}
                  setTataLetak={setTataLetak}
                  isDark={isDark}
                  memuat={memuatPratinjau || menyimpan}
                />
              ) : pratinjauUrl ? (
                <div className="relative flex h-full min-h-0 w-full flex-col">
                  {/* Bilah alat mengambang: zoom di KIRI, cetak & tab baru di KANAN */}
                  <div className="pointer-events-none absolute inset-x-4 top-3 z-20 flex items-start justify-between gap-2">
                    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/40 bg-white/80 px-1.5 py-1 shadow-lg backdrop-blur-md dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(50, z - 25))}
                        title="Perkecil"
                        className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-[11px] font-bold tabular-nums text-[#0B1442]">{zoom}%</span>
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(200, z + 25))}
                        title="Perbesar"
                        className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/40 bg-white/80 px-1.5 py-1 shadow-lg backdrop-blur-md dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={cetakPratinjau}
                        title="Cetak surat"
                        className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(pratinjauUrl, "_blank", "noopener")}
                        title="Buka di tab baru"
                        className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {numPages > 1 && (
                    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/40 bg-white/85 px-3 py-1 shadow-lg backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                        disabled={pageNum === 1}
                        className="cursor-pointer rounded-full p-1 text-slate-500 transition-all hover:text-[#004F9F] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className={`px-1 text-[10.5px] font-bold ${isDark ? "text-slate-300" : "text-[#0B1442]"}`}>
                        Hal {pageNum}/{numPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                        disabled={pageNum === numPages}
                        className="cursor-pointer rounded-full p-1 text-slate-500 transition-all hover:text-[#004F9F] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="min-h-0 flex-1 overflow-auto">
                    <div className="flex min-h-full w-fit min-w-full items-start justify-center">
                      {docError ? (
                        <span className="m-auto text-xs font-bold text-rose-500">Gagal memuat PDF pratinjau.</span>
                      ) : !pdfDoc ? (
                        <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 border-t-[#004F9F]" />
                          <span className="text-xs font-bold">Memuat pratinjau...</span>
                        </div>
                      ) : (
                        <canvas
                          ref={canvasRef}
                          className="rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {memuatPratinjau || menyimpan ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 border-t-[#004F9F]" />
                      <span className="text-xs font-bold">Memuat pratinjau...</span>
                    </div>
                  ) : (
                    <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                      <span className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${isDark ? "bg-slate-800 text-slate-500" : "bg-white text-slate-400"}`}>
                        <FileText className="h-8 w-8" />
                      </span>
                      <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>PDF belum tersedia</span>
                      <span className="text-[10.5px] leading-relaxed text-slate-400">
                        Isi nama template lalu tekan <span className="font-bold text-[#004F9F]">Simpan Template</span>, pratinjau langsung muncul di sini.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
                    </div>
        </div>

        {/* ================= Footer ================= */}
        <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-4 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-white"}`}>
          <div className="hidden min-w-0 max-w-xl items-start gap-2 sm:flex">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" />
            </span>
            <p className={`text-[10.5px] font-semibold leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="font-bold text-[#004F9F]">Simpan otomatis</span> menyimpan perubahan beberapa saat setelah Anda berhenti mengetik atau menggeser.{" "}
              <span className={`font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>Simpan Template</span> menyimpan sekarang juga sekaligus membuat ulang pratinjau PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-all duration-200 ${
                isDark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-600 hover:border-[#004F9F]/30 hover:text-[#004F9F]"
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-[#004F9F]"
                checked={otomatis}
                onChange={(e) => setOtomatis(e.target.checked)}
              />
              Simpan otomatis
            </label>
            <button
              type="button"
              onClick={simpanManual}
              disabled={menyimpan}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#004F9F]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSuratDesigner;