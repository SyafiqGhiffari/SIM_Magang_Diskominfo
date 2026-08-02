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
} from "lucide-react";
import { getAnalitikFaq } from "../../services/chatService";
import { toastError } from "../../utils/swal";
import AdminLayout from "../../layouts/AdminLayout";
import AnalitikStats from "../../components/manajemen/admin/faq/AnalitikStats";

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
  children,
}) => (
  <div className="group/panel flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradien} text-white shadow-md transition-transform duration-300 group-hover/panel:scale-105 group-hover/panel:-rotate-3`}
        >
          <Ikon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#0B1442]">{judul}</h3>
          {keterangan && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{keterangan}</p>
          )}
        </div>
      </div>
      {kanan}
    </div>
    {children}
  </div>
);

// ── Keadaan kosong ───────────────────────────────────────────────────────────
const Kosong = ({ ikon: Ikon = Sparkles, pesan }) => (
  <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-300">
      <span className="absolute inset-0 animate-ping rounded-2xl bg-slate-100 opacity-60" />
      <Ikon className="relative h-5 w-5" />
    </span>
    <p className="text-center text-xs font-semibold text-slate-400">{pesan}</p>
  </div>
);

// ── Grafik batang harian ─────────────────────────────────────────────────────
const GrafikTren = ({ judul, keterangan, data, warna, gradien, ikon }) => {
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
      ? "bg-red-50 text-red-600"
      : selisih < 0
        ? "bg-emerald-50 text-emerald-600"
        : "bg-slate-100 text-slate-500";

  return (
    <Panel
      ikon={ikon}
      judul={judul}
      keterangan={keterangan}
      gradien={gradien}
      kanan={
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-transform duration-300 group-hover/panel:scale-105 ${warnaTren}`}
          title={`Selisih ${separuh} hari terakhir terhadap ${separuh} hari sebelumnya`}
        >
          <IkonTren className="h-3 w-3" />
          {selisih > 0 ? `+${selisih}` : selisih}
        </span>
      }
    >
      <div className="px-5 pb-5">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-[#0B1442]">{total}</span>
          <span className="text-[11px] font-semibold text-slate-400">
            dalam {titik.length} hari terakhir
          </span>
        </div>

        {total === 0 ? (
          <Kosong pesan="Belum ada aktivitas pada rentang ini" />
        ) : (
          <>
            {/* Jarak antarbatang menyempit sendiri saat rentangnya panjang. */}
            <div
              className="flex h-32 items-end"
              style={{ gap: titik.length > 45 ? 2 : titik.length > 20 ? 4 : 6 }}
            >
              {titik.map((d, i) => (
                <div key={d.tanggal} className="group/bar relative flex h-full flex-1 items-end">
                  <div
                    className="w-full origin-bottom animate-[barGrow_0.6s_ease-out] rounded-t-md transition-all duration-300 group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110"
                    style={{
                      height: `${Math.max(4, (d.jumlah / puncak) * 100)}%`,
                      background:
                        d.jumlah > 0 ? `linear-gradient(to top, ${warna}, ${warna}99)` : "#e2e8f0",
                      animationDelay: `${i * 35}ms`,
                      animationFillMode: "backwards",
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0B1442] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg group-hover/bar:block">
                    {d.tanggal}
                    <span className="mx-1 text-white/40">·</span>
                    {d.jumlah}
                    <span className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-[#0B1442]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex justify-between text-[10px] font-semibold text-slate-400">
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
}) => {
  const isi = Array.isArray(baris) ? baris : [];
  const puncakTayang = Math.max(1, ...isi.map((b) => b.view_count || 0));

  return (
    <Panel
      ikon={ikon}
      judul={judul}
      keterangan={keterangan}
      gradien={gradien}
      kanan={
        isi.length > 0 && (
          <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            {isi.length} FAQ
          </span>
        )
      }
    >
      {isi.length === 0 ? (
        <Kosong ikon={ikonKosong} pesan={kosong} />
      ) : (
        <ul className="divide-y divide-slate-50 border-t border-slate-100">
          {isi.map((b, i) => {
            const totalNilai = (b.helpful_count || 0) + (b.unhelpful_count || 0);
            const rasio = totalNilai > 0 ? Math.round((b.helpful_count / totalNilai) * 100) : null;
            const meta = metaKategori(b.category);
            const IkonKat = meta.ikon;

            return (
              <li
                key={b.id}
                className="group/row flex items-start gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-blue-50/40"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-transform duration-300 group-hover/row:scale-110 ${
                    GAYA_PERINGKAT[i] || "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12px] font-bold leading-snug text-[#0B1442] transition-colors duration-200 group-hover/row:text-[#004F9F]">
                    {b.question}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-transform duration-300 group-hover/row:-translate-y-0.5"
                      style={{ backgroundColor: `${meta.warna}1a`, color: meta.warna }}
                    >
                      <IkonKat className="h-2.5 w-2.5" />
                      {b.category || "Umum"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 transition-transform duration-300 group-hover/row:-translate-y-0.5">
                      <Eye className="h-2.5 w-2.5" />
                      {b.view_count || 0} tayang
                    </span>
                  </div>

                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
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
                    className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-black transition-transform duration-300 group-hover/row:scale-105 ${
                      rasio < 50
                        ? "bg-red-50 text-red-600"
                        : rasio < 80
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
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
const Rangka = () => (
  <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
    <div className="space-y-2">
      <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-3.5 w-full max-w-md animate-pulse rounded-md bg-slate-100" />
    </div>
    <div className="h-14 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
    <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70" />
  </div>
);

// ── Halaman ──────────────────────────────────────────────────────────────────
export default function AnalitikFaqPage() {
  const [data, setData] = useState(KOSONG);
  const [memuat, setMemuat] = useState(true);
  const [versi, setVersi] = useState(0);
  const [waktuMuat, setWaktuMuat] = useState(null);
  const [hari, setHari] = useState(hariAwal);
  // Dipakai saat rentang diganti: data lama tetap tampil, hanya diredupkan,
  // sehingga halaman tidak berkedip kembali ke kerangka pemuatan.
  const [sibuk, setSibuk] = useState(false);

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

  // Penjaga ini wajib berada sebelum perhitungan turunan di bawahnya.
  // Sebelumnya puncakKategori dihitung lebih dulu, sehingga satu nilai null
  // dari API langsung merobohkan halaman sebelum layar "memuat" sempat tampil.
  if (memuat) {
    return (
      <AdminLayout>
        <Rangka />
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
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala halaman: judul saja, seperti halaman FAQ & Quick Action */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#0B1442]">Analitik FAQ</h2>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-500">
            Angka ringkasan, sebaran kategori, dan peringkat bersifat kumulatif sejak awal.
            Hanya kedua grafik tren yang dibatasi {jumlahHari} hari terakhir.
          </p>
        </div>

        {/* Bilah rentang waktu dan tindakan */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pemilih rentang grafik tren */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <BarChart3 className="h-3.5 w-3.5 text-[#004F9F]" />
                Grafik tren
              </span>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {PILIHAN_HARI.map((n) => {
                  const aktif = n === hari;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => ubahRentang(n)}
                      disabled={sibuk}
                      title={`Tampilkan ${n} hari terakhir`}
                      className={`relative rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        aktif
                          ? "bg-gradient-to-r from-[#0B1442] to-[#004F9F] text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-[#004F9F] hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      {n} hari
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
              {sibuk ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memuat {hari} hari
                </>
              ) : (
                <>
                  <CalendarClock className="h-3.5 w-3.5" />
                  Diperbarui pukul {jamMuat}
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSibuk(true);
              setVersi((v) => v + 1);
            }}
            disabled={sibuk}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F] hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <RefreshCw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
            Muat ulang
          </button>
        </div>

        {/* Kartu ringkasan — gaya kartu statistik yang sama dengan halaman lain */}
        <AnalitikStats ringkasan={r} />

        {/* Dua grafik */}
        <div
          className={`grid grid-cols-1 gap-5 transition-opacity duration-300 lg:grid-cols-2 lg:items-start ${
            sibuk ? "pointer-events-none opacity-50" : "opacity-100"
          }`}
        >
          <GrafikTren
            judul="Tidak terjawab bot"
            keterangan="Pertanyaan yang gagal dijawab otomatis per hari."
            data={data.tren_pertanyaan}
            warna="#f59e0b"
            gradien="from-amber-500 to-amber-700"
            ikon={TrendingUp}
          />
          <GrafikTren
            judul="Penilaian negatif"
            keterangan="Jawaban yang ditandai tidak membantu per hari."
            data={data.tren_negatif}
            warna="#ef4444"
            gradien="from-red-500 to-red-700"
            ikon={AlertTriangle}
          />
        </div>

        {/* Sebaran kategori */}
        {data.kategori.length > 0 && (
          <Panel
            ikon={Layers}
            judul="Sebaran Kategori"
            keterangan="Jumlah FAQ pada setiap kategori beserta total tayangnya."
            kanan={
              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {data.kategori.length} kategori
              </span>
            }
          >
            <div className="space-y-1 border-t border-slate-100 px-3 py-3">
              {data.kategori.map((k, i) => {
                const meta = metaKategori(k.category);
                const IkonKat = meta.ikon;
                const persen = Math.round((k.jumlah / puncakKategori) * 100);

                return (
                  <div
                    key={k.category || "tanpa"}
                    className="group/row flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-slate-50"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover/row:scale-110 group-hover/row:-rotate-6"
                      style={{ backgroundColor: `${meta.warna}1a`, color: meta.warna }}
                    >
                      <IkonKat className="h-3.5 w-3.5" />
                    </span>
                    <span className="w-32 shrink-0 truncate text-xs font-bold text-slate-600 sm:w-40">
                      {k.category || "Tanpa kategori"}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
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
                    <span className="w-8 shrink-0 text-right text-xs font-black text-[#0B1442]">
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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <TabelPeringkat
            judul="Paling Sering Tampil"
            keterangan="Jawaban andalan yang paling banyak dibaca peserta."
            ikon={Flame}
            gradien="from-violet-500 to-violet-700"
            baris={data.terpopuler}
            tampilkanRasio
            ikonKosong={Eye}
            kosong="Belum ada jawaban yang pernah tampil"
          />
          <TabelPeringkat
            judul="Perlu Ditulis Ulang"
            keterangan="Jawaban dengan penilaian membantu paling rendah."
            ikon={AlertTriangle}
            gradien="from-red-500 to-red-700"
            baris={data.bermasalah}
            tampilkanRasio
            ikonKosong={Sparkles}
            kosong="Bagus — tidak ada jawaban yang dinilai buruk"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <TabelPeringkat
            judul="Tidak Pernah Dipakai"
            keterangan="Kandidat untuk digabung, ditulis ulang, atau dinonaktifkan."
            ikon={EyeOff}
            gradien="from-slate-400 to-slate-600"
            baris={data.tidak_terpakai}
            ikonKosong={Sparkles}
            kosong="Semua FAQ aktif pernah ditampilkan"
          />

          {/* Celah pengetahuan */}
          <Panel
            ikon={Inbox}
            judul="Celah Pengetahuan"
            keterangan="Pertanyaan yang belum punya jawaban serupa di FAQ."
            gradien="from-amber-500 to-amber-700"
            kanan={
              data.celah.length > 0 && (
                <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                  {data.celah.length} pertanyaan
                </span>
              )
            }
          >
            {data.celah.length === 0 ? (
              <Kosong pesan="Tidak ada pertanyaan yang menggantung" />
            ) : (
              <ul className="divide-y divide-slate-50 border-t border-slate-100">
                {data.celah.map((p, i) => {
                  const skor = Math.round((p.skor_tertinggi || 0) * 100);

                  return (
                    <li
                      key={p.id}
                      className="group/row px-5 py-3.5 transition-colors duration-200 hover:bg-amber-50/40"
                    >
                      <p className="line-clamp-2 text-[12px] font-bold leading-snug text-[#0B1442]">
                        {p.pertanyaan}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {p.jumlah_serupa > 1 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 transition-transform duration-300 group-hover/row:-translate-y-0.5">
                            Ditanya {p.jumlah_serupa}×
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold capitalize text-slate-500 transition-transform duration-300 group-hover/row:-translate-y-0.5">
                          {p.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
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
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">
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