import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Inbox,
  RefreshCw,
  Layers,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  ClipboardCheck,
  FileText,
  CalendarClock,
  Loader2,
  Award,
  Building2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { getAnalitikFaq } from "../../services/chatService";
import { toastError, toastSuccess } from "../../utils/swal";
import AdminLayout from "../../layouts/AdminLayout";
import AnalitikStats from "../../components/manajemen/admin/faq/AnalitikStats";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { exportAnalitikFaqToPdf } from "../../utils/exportAnalitikFaqPdf";
import { exportAnalitikFaqToExcel } from "../../utils/exportAnalitikFaqExcel";

const KOSONG = {
  jumlah_hari: 14,
  ringkasan: {
    total_faq: 0,
    faq_aktif: 0,
    faq_quick_action: 0,
    total_tayang: 0,
    total_penilaian: 0,
    total_membantu: 0,
    rasio_membantu: 0,
    total_pertanyaan: 0,
    pertanyaan_baru: 0,
  },
  terpopuler: [],
  bermasalah: [],
  tidak_terpakai: [],
  celah: [],
  kategori: [],
  tren_pertanyaan: [],
  tren_negatif: [],
};

// Go mengirim slice kosong sebagai null, bukan []. Penyebaran objek biasa
// akan menimpa nilai bawaan dengan null itu, jadi setiap daftar diperiksa
// satu per satu sebelum masuk ke state.
const daftar = (nilai) => (Array.isArray(nilai) ? nilai : []);

const rapikan = (mentah) => ({
  // Panjang jendela grafik ditentukan backend (const jumlahHari).
  jumlah_hari: Number(mentah?.jumlah_hari) > 0 ? Number(mentah.jumlah_hari) : KOSONG.jumlah_hari,
  ringkasan: { ...KOSONG.ringkasan, ...(mentah?.ringkasan || {}) },
  terpopuler: daftar(mentah?.terpopuler),
  bermasalah: daftar(mentah?.bermasalah),
  tidak_terpakai: daftar(mentah?.tidak_terpakai),
  celah: daftar(mentah?.celah),
  kategori: daftar(mentah?.kategori),
  tren_pertanyaan: daftar(mentah?.tren_pertanyaan),
  tren_negatif: daftar(mentah?.tren_negatif),
});

// Ikon dan warna kategori disamakan dengan halaman FAQ & Quick Action
// supaya kategori yang sama selalu tampil dengan rupa yang sama.
const KATEGORI_META = {
  Umum: { ikon: Layers, warna: "#64748b" },
  Pendaftaran: { ikon: ClipboardCheck, warna: "#0ea5e9" },
  "Berkas & Dokumen": { ikon: FileText, warna: "#8b5cf6" },
  "Jadwal & Lokasi": { ikon: CalendarClock, warna: "#f59e0b" },
  Sertifikat: { ikon: Award, warna: "#10b981" },
  "Teknis Sistem": { ikon: Building2, warna: "#ef4444" },
};

const metaKategori = (nama) => KATEGORI_META[nama] || { ikon: Layers, warna: "#94a3b8" };

// Pilihan rentang grafik. Nilainya harus sama dengan daftar putih di
// backend (AdminAnalitikFaq); nilai di luar daftar akan diabaikan server.
const PILIHAN_HARI = [7, 14, 30, 90];
const KUNCI_HARI = "analitik_faq_hari";

// Pilihan terakhir diingat lewat localStorage supaya admin tidak perlu
// memilih ulang setiap kali membuka halaman.
const hariAwal = () => {
  const tersimpan = Number(localStorage.getItem(KUNCI_HARI));
  return PILIHAN_HARI.includes(tersimpan) ? tersimpan : 30;
};

const GAYA_PERINGKAT = [
  "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm",
  "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-sm",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm",
];

// ── Wadah kartu, meniru kepala kartu halaman FAQ ─────────────────────────────
const Panel = ({
  ikon: Ikon,
  judul,
  keterangan,
  gradien = "from-[#0B1442] to-[#00A5EC]",
  kanan,
  isDark,
  children,
}) => (
  <div className={`group/panel flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg ${
    isDark
      ? "border-white/10 bg-[#161b22] hover:border-white/20"
      : "border-slate-200/80 bg-white hover:border-slate-300"
  }`}>
    <div className="flex items-start justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 pt-3.5 sm:pt-5 pb-2.5 sm:pb-4">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        <span
          className={`flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradien} text-white shadow-md transition-transform duration-300 group-hover/panel:scale-105 group-hover/panel:-rotate-3`}
        >
          <Ikon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0">
          <h3 className={`text-xs sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{judul}</h3>
          {keterangan && (
            <p className={`mt-0.5 text-[9.5px] sm:text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-400"}`}>{keterangan}</p>
          )}
        </div>
      </div>
      {kanan}
    </div>
    {children}
  </div>
);

// ── Keadaan kosong ───────────────────────────────────────────────────────────
const Kosong = ({ ikon: Ikon = Sparkles, pesan, isDark }) => (
  <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 py-8 sm:py-10 text-center animate-[fadeslide_0.3s_ease-out]">
    <span className={`relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl border border-dashed ${
      isDark ? "border-white/10 bg-white/5 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-300"
    }`}>
      <span className={`absolute inset-0 animate-ping rounded-xl sm:rounded-2xl opacity-40 ${
        isDark ? "bg-white/5" : "bg-slate-100"
      }`} />
      <Ikon className="relative h-4 w-4 sm:h-5 sm:w-5" />
    </span>
    <p className={`text-center text-[10.5px] sm:text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-400"}`}>{pesan}</p>
  </div>
);

// ── Grafik batang harian ─────────────────────────────────────────────────────
const GrafikTren = ({ judul, keterangan, data, warna, gradien, ikon, isDark }) => {
  const titik = Array.isArray(data) ? data : [];
  const puncak = Math.max(1, ...titik.map((d) => d.jumlah));
  const total = titik.reduce((n, d) => n + d.jumlah, 0);

  // Separuh terakhir dibandingkan separuh sebelumnya. Panjangnya diturunkan
  // dari jumlah titik yang dikirim backend, bukan angka tujuh yang dipatok,
  // supaya tetap benar bila rentang di backend diubah. Pada kedua grafik ini
  // kenaikan adalah kabar buruk, jadi panah naik diberi warna merah.
  const separuh = Math.max(1, Math.ceil(titik.length / 2));
  const akhir = titik.slice(-separuh).reduce((n, d) => n + d.jumlah, 0);
  const awal = titik
    .slice(0, Math.max(0, titik.length - separuh))
    .reduce((n, d) => n + d.jumlah, 0);
  const selisih = akhir - awal;
  const IkonTren = selisih > 0 ? TrendingUp : selisih < 0 ? TrendingDown : Minus;
  const warnaTren =
    selisih > 0
      ? isDark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"
      : selisih < 0
        ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
        : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500";

  return (
    <Panel
      ikon={ikon}
      judul={judul}
      keterangan={keterangan}
      gradien={gradien}
      isDark={isDark}
      kanan={
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold transition-transform duration-300 group-hover/panel:scale-105 ${warnaTren}`}
          title={`Selisih ${separuh} hari terakhir terhadap ${separuh} hari sebelumnya`}
        >
          <IkonTren className="h-3 w-3" />
          {selisih > 0 ? `+${selisih}` : selisih}
        </span>
      }
    >
      <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
        <div className="mb-2 sm:mb-3 flex items-baseline gap-1.5 sm:gap-2">
          <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{total}</span>
          <span className={`text-[10px] sm:text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            dalam {titik.length} hari terakhir
          </span>
        </div>

        {total === 0 ? (
          <Kosong pesan="Belum ada aktivitas pada rentang ini" isDark={isDark} />
        ) : (
          <>
            {/* Jarak antarbatang menyempit sendiri saat rentangnya panjang. */}
            <div
              className="flex h-24 sm:h-32 items-end"
              style={{ gap: titik.length > 45 ? 2 : titik.length > 20 ? 3 : 5 }}
            >
              {titik.map((d, i) => (
                <div key={d.tanggal} className="group/bar relative flex h-full flex-1 items-end">
                  <div
                    className="w-full origin-bottom animate-[barGrow_0.6s_ease-out] rounded-t-md transition-all duration-300 group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110"
                    style={{
                      height: `${Math.max(4, (d.jumlah / puncak) * 100)}%`,
                      background:
                        d.jumlah > 0 ? `linear-gradient(to top, ${warna}, ${warna}99)` : (isDark ? "#2a313c" : "#e2e8f0"),
                      animationDelay: `${i * 35}ms`,
                      animationFillMode: "backwards",
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0B1442] dark:bg-slate-800 dark:border dark:border-white/10 px-2 py-1 text-[9.5px] sm:text-[10px] font-bold text-white shadow-lg group-hover/bar:block">
                    {d.tanggal}
                    <span className="mx-1 text-white/40">·</span>
                    {d.jumlah}
                    <span className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-[#0B1442] dark:border-t-slate-800" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[9px] sm:text-[10px] font-semibold text-slate-400">
              <span>{titik[0]?.tanggal?.slice(5) || ""}</span>
              {titik.length > 14 && (
                <span className="hidden sm:block">
                  {titik[Math.floor(titik.length / 2)]?.tanggal?.slice(5) || ""}
                </span>
              )}
              <span>{titik[titik.length - 1]?.tanggal?.slice(5) || ""}</span>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};

// ── Tabel peringkat ──────────────────────────────────────────────────────────
const TabelPeringkat = ({
  judul,
  keterangan,
  ikon,
  gradien,
  baris,
  kosong,
  ikonKosong,
  tampilkanRasio,
  isDark,
}) => {
  const isi = Array.isArray(baris) ? baris : [];
  const puncakTayang = Math.max(1, ...isi.map((b) => b.view_count || 0));

  return (
    <Panel
      ikon={ikon}
      judul={judul}
      keterangan={keterangan}
      gradien={gradien}
      isDark={isDark}
      kanan={
        isi.length > 0 && (
          <span className={`shrink-0 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold ${
            isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-500"
          }`}>
            {isi.length} FAQ
          </span>
        )
      }
    >
      {isi.length === 0 ? (
        <Kosong ikon={ikonKosong} pesan={kosong} isDark={isDark} />
      ) : (
        <ul className={`divide-y border-t ${
          isDark ? "divide-white/5 border-white/5" : "divide-slate-50 border-slate-100"
        }`}>
          {isi.map((b, i) => {
            const totalNilai = (b.helpful_count || 0) + (b.unhelpful_count || 0);
            const rasio = totalNilai > 0 ? Math.round((b.helpful_count / totalNilai) * 100) : null;
            const meta = metaKategori(b.category);
            const IkonKat = meta.ikon;

            return (
              <li
                key={b.id}
                className={`group/row flex items-start gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3.5 transition-colors duration-200 ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-blue-50/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg text-[9.5px] sm:text-[10px] font-black transition-transform duration-300 group-hover/row:scale-110 ${
                    GAYA_PERINGKAT[i] || (isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500")
                  }`}
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`line-clamp-2 text-[11px] sm:text-[12px] font-bold leading-snug transition-colors duration-200 ${
                    isDark ? "text-slate-200 group-hover/row:text-[#00A5EC]" : "text-[#0B1442] group-hover/row:text-[#004F9F]"
                  }`}>
                    {b.question}
                  </p>

                  <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold transition-transform duration-300 group-hover/row:-translate-y-0.5"
                      style={{ backgroundColor: `${meta.warna}1a`, color: meta.warna }}
                    >
                      <IkonKat className="h-2.5 w-2.5" />
                      {b.category || "Umum"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold transition-transform duration-300 group-hover/row:-translate-y-0.5 ${
                      isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Eye className="h-2.5 w-2.5" />
                      {b.view_count || 0} tayang
                    </span>
                  </div>

                  <div className={`mt-1.5 sm:mt-2 h-1 w-full overflow-hidden rounded-full ${
                    isDark ? "bg-white/10" : "bg-slate-100"
                  }`}>
                    <div
                      className="h-full origin-left animate-[barSlide_0.7s_ease-out] rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                      style={{
                        width: `${Math.max(3, ((b.view_count || 0) / puncakTayang) * 100)}%`,
                        animationDelay: `${i * 60}ms`,
                        animationFillMode: "backwards",
                      }}
                    />
                  </div>
                </div>

                {tampilkanRasio && rasio !== null && (
                  <span
                    className={`shrink-0 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-black transition-transform duration-300 group-hover/row:scale-105 ${
                      rasio < 50
                        ? isDark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"
                        : rasio < 80
                          ? isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600"
                          : isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {rasio}%
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

// ── Kerangka saat memuat ─────────────────────────────────────────────────────
const Rangka = ({ isDark }) => (
  <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
    <div className="space-y-2">
      <div className={`h-7 w-56 animate-pulse rounded-lg ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
      <div className={`h-3.5 w-full max-w-md animate-pulse rounded-md ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
    </div>
    <div className={`h-14 animate-pulse rounded-2xl border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100/70"}`} />
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-32 sm:h-36 animate-pulse rounded-2xl border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100/70"}`}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`h-56 sm:h-64 animate-pulse rounded-2xl border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100/70"}`}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
    <div className={`h-64 sm:h-72 animate-pulse rounded-2xl border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100/70"}`} />
  </div>
);

// ── Halaman ──────────────────────────────────────────────────────────────────
export default function AnalitikFaqPage() {
  const { isDark } = useManajemenTheme();
  const [data, setData] = useState(KOSONG);
  const [memuat, setMemuat] = useState(true);
  const [versi, setVersi] = useState(0);
  const [waktuMuat, setWaktuMuat] = useState(null);
  const [hari, setHari] = useState(hariAwal);
  // Dipakai saat rentang diganti: data lama tetap tampil, hanya diredupkan,
  // sehingga halaman tidak berkedip kembali ke kerangka pemuatan.
  const [sibuk, setSibuk] = useState(false);
  const [bukaEkspor, setBukaEkspor] = useState(false);

  // State hanya disetel SETELAH await di dalam callback async, sehingga
  // React Compiler tidak menganggapnya setState sinkron di dalam effect.
  useEffect(() => {
    let batal = false;

    (async () => {
      try {
        const res = await getAnalitikFaq(hari);
        if (batal) return;
        setData(rapikan(res.data));
        setWaktuMuat(new Date());
      } catch {
        if (!batal) toastError("Gagal memuat data analitik");
      } finally {
        if (!batal) {
          setMemuat(false);
          setSibuk(false);
        }
      }
    })();

    return () => {
      batal = true;
    };
  }, [versi, hari]);

  useEffect(() => {
    if (!bukaEkspor) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest("#dropdown-ekspor-analitik")) {
        setBukaEkspor(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [bukaEkspor]);

  const handleEkspor = (format) => {
    setBukaEkspor(false);
    try {
      if (format === "pdf") {
        exportAnalitikFaqToPdf(data, "laporan-analitik-faq");
      } else if (format === "excel") {
        exportAnalitikFaqToExcel(data, "laporan-analitik-faq");
      }
      toastSuccess(`Laporan analitik berhasil diekspor ke ${format.toUpperCase()}`);
    } catch {
      toastError("Gagal mengekspor laporan analitik");
    }
  };

  // Penjaga ini wajib berada sebelum perhitungan turunan di bawahnya.
  // Sebelumnya puncakKategori dihitung lebih dulu, sehingga satu nilai null
  // dari API langsung merobohkan halaman sebelum layar "memuat" sempat tampil.
  if (memuat) {
    return (
      <AdminLayout>
        <Rangka isDark={isDark} />
      </AdminLayout>
    );
  }

  const r = data.ringkasan;
  const puncakKategori = Math.max(1, ...data.kategori.map((k) => k.jumlah));
  const jumlahHari = data.jumlah_hari;
  const ubahRentang = (nilai) => {
    if (nilai === hari) return;
    localStorage.setItem(KUNCI_HARI, String(nilai));
    setSibuk(true);
    setHari(nilai);
  };

  const jamMuat = waktuMuat
    ? waktuMuat.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "-";

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala halaman: judul saja, seperti halaman FAQ & Quick Action */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Analitik FAQ</h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Ringkasan data kumulatif &amp; tren {jumlahHari} hari terakhir.</span>
            <span className="hidden sm:inline">
              Angka ringkasan, sebaran kategori, dan peringkat bersifat kumulatif sejak awal. Hanya kedua grafik tren yang dibatasi {jumlahHari} hari terakhir.
            </span>
          </p>
        </div>

        {/* Bilah rentang waktu dan tindakan */}
        <div className={`flex items-center justify-between gap-1 sm:gap-3 rounded-2xl border p-2 sm:px-4 sm:py-3 shadow-sm ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
        }`}>
          {/* Pemilih rentang grafik tren (Kiri) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold ${
              isDark ? "text-slate-300" : "text-slate-500"
            }`}>
              <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#00A5EC]" />
              <span className="hidden md:inline">Grafik tren</span>
            </span>

            <div className={`flex items-center gap-0.5 sm:gap-1 rounded-xl p-0.5 sm:p-1 ${
              isDark ? "bg-white/5" : "bg-slate-100"
            }`}>
              {PILIHAN_HARI.map((n) => {
                const aktif = n === hari;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => ubahRentang(n)}
                    disabled={sibuk}
                    title={`Tampilkan ${n} hari terakhir`}
                    className={`relative rounded-lg px-1.5 sm:px-3 py-1 sm:py-1.5 text-[9.5px] sm:text-[11px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                      n === 90 ? "hidden sm:inline-block" : ""
                    } ${
                      aktif
                        ? "bg-gradient-to-r from-[#0B1442] to-[#00A5EC] text-white shadow-sm"
                        : isDark
                          ? "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                          : "text-slate-500 hover:bg-white hover:text-[#004F9F] hover:shadow-sm"
                    }`}
                  >
                    {n} <span className="hidden sm:inline">hari</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diperbarui & Muat Ulang (Kanan - selalu sejajar) */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[9.5px] sm:text-[11px] font-bold ${
              isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
            }`}>
              {sibuk ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-[#00A5EC]" />
                  <span>Memuat {hari}h</span>
                </>
              ) : (
                <>
                  <CalendarClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#00A5EC]" />
                  <span>
                    <span className="hidden sm:inline">Diperbarui pukul </span>
                    <span className="inline sm:hidden">Diperbarui </span>
                    {jamMuat}
                  </span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => {
                setSibuk(true);
                setVersi((v) => v + 1);
              }}
              disabled={sibuk}
              title="Muat ulang data analitik"
              className={`group inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl border p-1 sm:px-4 sm:py-2 text-[10.5px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F] hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md"
              }`}
            >
              <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-500 group-hover:rotate-180 ${sibuk ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Muat ulang</span>
            </button>

            {/* Tombol Ekspor Laporan */}
            <div className="relative" id="dropdown-ekspor-analitik">
              <button
                type="button"
                onClick={() => setBukaEkspor((v) => !v)}
                disabled={sibuk}
                title="Ekspor Laporan Analitik"
                className={`group inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border p-1 sm:px-3.5 sm:py-2 text-[10.5px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>

              {bukaEkspor && (
                <div
                  className={`absolute right-0 top-full mt-1.5 z-50 w-44 sm:w-48 overflow-hidden rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                    isDark ? "border-white/10 bg-[#1f242c]" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className={`px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                    Format Laporan
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEkspor("pdf")}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                      isDark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    <span>Dokumen PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEkspor("excel")}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                      isDark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    <span>Lembar Kerja Excel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kartu ringkasan — gaya kartu statistik yang sama dengan halaman lain */}
        <AnalitikStats ringkasan={r} isDark={isDark} />

        {/* Dua grafik */}
        <div
          className={`grid grid-cols-1 gap-4 sm:gap-5 transition-opacity duration-300 lg:grid-cols-2 lg:items-start ${
            sibuk ? "pointer-events-none opacity-50" : "opacity-100"
          }`}
        >
          <GrafikTren
            judul="Tidak terjawab bot"
            keterangan={
              <>
                <span className="hidden sm:inline">Pertanyaan yang gagal dijawab otomatis per hari.</span>
                <span className="inline sm:hidden">Pertanyaan belum terjawab.</span>
              </>
            }
            data={data.tren_pertanyaan}
            warna="#f59e0b"
            gradien="from-amber-500 to-amber-700"
            ikon={TrendingUp}
            isDark={isDark}
          />
          <GrafikTren
            judul="Penilaian negatif"
            keterangan={
              <>
                <span className="hidden sm:inline">Jawaban yang ditandai tidak membantu per hari.</span>
                <span className="inline sm:hidden">Jawaban tidak membantu.</span>
              </>
            }
            data={data.tren_negatif}
            warna="#ef4444"
            gradien="from-red-500 to-red-700"
            ikon={AlertTriangle}
            isDark={isDark}
          />
        </div>

        {/* Sebaran kategori */}
        {data.kategori.length > 0 && (
          <Panel
            ikon={Layers}
            judul="Sebaran Kategori"
            keterangan={
              <>
                <span className="hidden sm:inline">Jumlah FAQ pada setiap kategori beserta total tayangnya.</span>
                <span className="inline sm:hidden">Sebaran FAQ &amp; total tayang.</span>
              </>
            }
            isDark={isDark}
            kanan={
              <span className={`shrink-0 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold ${
                isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-500"
              }`}>
                {data.kategori.length} kategori
              </span>
            }
          >
            <div className={`space-y-1 border-t px-2.5 sm:px-3 py-2 sm:py-3 ${
              isDark ? "border-white/5" : "border-slate-100"
            }`}>
              {data.kategori.map((k, i) => {
                const meta = metaKategori(k.category);
                const IkonKat = meta.ikon;
                const persen = Math.round((k.jumlah / puncakKategori) * 100);

                return (
                  <div
                    key={k.category || "tanpa"}
                    className={`group/row flex items-center gap-2 sm:gap-3 rounded-xl px-2 py-1.5 sm:py-2 transition-colors duration-200 ${
                      isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover/row:scale-110 group-hover/row:-rotate-6"
                      style={{ backgroundColor: `${meta.warna}1a`, color: meta.warna }}
                    >
                      <IkonKat className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                    <span className={`w-28 sm:w-40 shrink-0 truncate text-[11px] sm:text-xs font-bold ${
                      isDark ? "text-slate-200" : "text-slate-600"
                    }`}>
                      {k.category || "Tanpa kategori"}
                    </span>
                    <div className={`h-2 sm:h-2.5 flex-1 overflow-hidden rounded-full ${
                      isDark ? "bg-white/10" : "bg-slate-100"
                    }`}>
                      <div
                        className="h-full origin-left animate-[barSlide_0.7s_ease-out] rounded-full transition-all duration-300 group-hover/row:brightness-110"
                        style={{
                          width: `${persen}%`,
                          background: `linear-gradient(to right, ${meta.warna}, ${meta.warna}b3)`,
                          animationDelay: `${i * 60}ms`,
                          animationFillMode: "backwards",
                        }}
                      />
                    </div>
                    <span className={`w-8 shrink-0 text-right text-[11px] sm:text-xs font-black ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}>
                      {k.jumlah}
                    </span>
                    <span className="hidden w-20 shrink-0 text-right text-[10px] font-semibold text-slate-400 sm:block">
                      {k.total_view} tayang
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Peringkat */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-start">
          <TabelPeringkat
            judul="Paling Sering Tampil"
            keterangan={
              <>
                <span className="hidden sm:inline">Jawaban andalan yang paling banyak dibaca peserta.</span>
                <span className="inline sm:hidden">Paling banyak dibaca.</span>
              </>
            }
            ikon={Flame}
            gradien="from-violet-500 to-violet-700"
            baris={data.terpopuler}
            tampilkanRasio
            ikonKosong={Eye}
            kosong="Belum ada jawaban yang pernah tampil"
            isDark={isDark}
          />
          <TabelPeringkat
            judul="Perlu Ditulis Ulang"
            keterangan={
              <>
                <span className="hidden sm:inline">Jawaban dengan penilaian membantu paling rendah.</span>
                <span className="inline sm:hidden">Penilaian terendah.</span>
              </>
            }
            ikon={AlertTriangle}
            gradien="from-red-500 to-red-700"
            baris={data.bermasalah}
            tampilkanRasio
            ikonKosong={Sparkles}
            kosong="Bagus — tidak ada jawaban yang dinilai buruk"
            isDark={isDark}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-start">
          <TabelPeringkat
            judul="Tidak Pernah Dipakai"
            keterangan={
              <>
                <span className="hidden sm:inline">Kandidat untuk digabung, ditulis ulang, atau dinonaktifkan.</span>
                <span className="inline sm:hidden">Belum pernah tampil.</span>
              </>
            }
            ikon={EyeOff}
            gradien="from-slate-400 to-slate-600"
            baris={data.tidak_terpakai}
            ikonKosong={Sparkles}
            kosong="Semua FAQ aktif pernah ditampilkan"
            isDark={isDark}
          />

          {/* Celah pengetahuan */}
          <Panel
            ikon={Inbox}
            judul="Celah Pengetahuan"
            keterangan={
              <>
                <span className="hidden sm:inline">Pertanyaan yang belum punya jawaban serupa di FAQ.</span>
                <span className="inline sm:hidden">Belum ada di FAQ.</span>
              </>
            }
            gradien="from-amber-500 to-amber-700"
            isDark={isDark}
            kanan={
              data.celah.length > 0 && (
                <span className={`shrink-0 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold ${
                  isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600"
                }`}>
                  {data.celah.length} pertanyaan
                </span>
              )
            }
          >
            {data.celah.length === 0 ? (
              <Kosong pesan="Tidak ada pertanyaan yang menggantung" isDark={isDark} />
            ) : (
              <ul className={`divide-y border-t ${
                isDark ? "divide-white/5 border-white/5" : "divide-slate-50 border-slate-100"
              }`}>
                {data.celah.map((p, i) => {
                  const skor = Math.round((p.skor_tertinggi || 0) * 100);

                  return (
                    <li
                      key={p.id}
                      className={`group/row px-3.5 sm:px-5 py-2.5 sm:py-3.5 transition-colors duration-200 ${
                        isDark ? "hover:bg-white/[0.02]" : "hover:bg-amber-50/40"
                      }`}
                    >
                      <p className={`line-clamp-2 text-[11px] sm:text-[12px] font-bold leading-snug ${
                        isDark ? "text-slate-200" : "text-[#0B1442]"
                      }`}>
                        {p.pertanyaan}
                      </p>

                      <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
                        {p.jumlah_serupa > 1 && (
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold ${
                            isDark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"
                          }`}>
                            Ditanya {p.jumlah_serupa}×
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold capitalize ${
                          isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                        <div className={`h-1 flex-1 overflow-hidden rounded-full ${
                          isDark ? "bg-white/10" : "bg-slate-100"
                        }`}>
                          <div
                            className={`h-full origin-left animate-[barSlide_0.7s_ease-out] rounded-full ${
                              skor < 40
                                ? "bg-gradient-to-r from-red-600 to-red-400"
                                : "bg-gradient-to-r from-amber-500 to-amber-300"
                            }`}
                            style={{
                              width: `${Math.max(3, skor)}%`,
                              animationDelay: `${i * 60}ms`,
                              animationFillMode: "backwards",
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-[9.5px] sm:text-[10px] font-bold text-slate-400">
                          kecocokan {skor}%
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}