import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { getRingkasanDashboard } from "../../services/adminService";
import { getMe } from "../../services/authService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError } from "../../utils/swal";
import {
  ClipboardCheck, FilePen, FileSignature, UserPlus, UserCog, Award,
  MessagesSquare, Inbox, CheckCircle2, ChevronRight, CalendarCheck,
  Users, GraduationCap, TrendingUp, AlertTriangle,
  CalendarClock, Layers, ArrowUpRight, Zap,
} from "lucide-react";

const salam = () => {
  const j = new Date().getHours();
  if (j < 11) return "Selamat Pagi";
  if (j < 15) return "Selamat Siang";
  if (j < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const n = (v) => Number(v || 0).toLocaleString("id-ID");

const tanggalPendek = (t) => {
  if (!t) return "—";
  const d = new Date(t);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

/* ══════════ Kartu antrean pekerjaan ══════════ */
const KartuTindakan = ({ icon: Icon, judul, jumlah, catatan, warna, tunda, onClick }) => {
  const ada = jumlah > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${tunda}ms` }}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
        ada
          ? `border-slate-200/80 bg-gradient-to-br ${warna.light} to-white`
          : "border-slate-200/80 bg-white"
      }`}
    >
      {ada && (
        <div
          className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${warna.grad} opacity-[0.28] blur-xl transition-all duration-300 group-hover:opacity-[0.42] group-hover:scale-125`}
        />
      )}

      <div className="relative flex items-center gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
            ada ? `${warna.bg} ${warna.text}` : "bg-slate-100 text-slate-300"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold leading-snug text-slate-700">{judul}</p>
          {catatan ? (
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-bold text-rose-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              {catatan}
            </p>
          ) : (
            <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">
              {ada ? "Menunggu diproses" : "Tidak ada antrean"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <span
            className={`text-2xl font-black tabular-nums tracking-tight ${
              ada ? "text-[#0B1442]" : "text-slate-200"
            }`}
          >
            {n(jumlah)}
          </span>
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${
              ada ? "text-slate-400" : "text-slate-200"
            }`}
          />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r ${warna.grad} transition-transform duration-500 group-hover:scale-x-100`}
      />
    </button>
  );
};

/* ══════════ Kartu angka ringkas ══════════ */
const KartuAngka = ({ icon: Icon, label, nilai, caption, warna, tunda }) => (
  <div
    style={{ animationDelay: `${tunda}ms` }}
    className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${warna.light} to-white p-5 shadow-sm transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-1 hover:shadow-lg`}
  >
    <div
      className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${warna.grad} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.42] group-hover:scale-125`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold tracking-wide text-slate-600">{label}</p>
        <h3 className="mt-1.5 text-[32px] font-black leading-none tracking-tight text-[#0B1442]">
          {n(nilai)}
        </h3>
        <p className="mt-2 text-[10.5px] font-medium leading-snug text-slate-500">{caption}</p>
      </div>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${warna.bg} ${warna.text}`}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
      </span>
    </div>
    <div
      className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${warna.grad} transition-transform duration-500 group-hover:scale-x-100`}
    />
  </div>
);

/* ══════════ Judul seksi ══════════ */
const JudulSeksi = ({ icon: Icon, judul, sub, aksi }) => (
  <div className="mb-5 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-black tracking-tight text-[#0B1442]">{judul}</h3>
        {sub && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{sub}</p>}
      </div>
    </div>
    {aksi}
  </div>
);

const KartuKosong = ({ pesan }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center">
    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
      <Inbox className="h-5 w-5" />
      <span className="absolute inset-0 animate-ping rounded-2xl border-2 border-slate-200 opacity-40" />
    </span>
    <p className="text-[11.5px] font-medium text-slate-400">{pesan}</p>
  </div>
);

/* ══════════ Palet kartu antrean ══════════ */
const W = {
  amber:   { grad: "from-amber-500 to-amber-700",     light: "from-amber-100/70",   bg: "bg-amber-50",   text: "text-amber-600" },
  sky:     { grad: "from-sky-500 to-sky-700",         light: "from-sky-100/70",     bg: "bg-sky-50",     text: "text-sky-600" },
  violet:  { grad: "from-violet-500 to-violet-700",   light: "from-violet-100/70",  bg: "bg-violet-50",  text: "text-violet-600" },
  biru:    { grad: "from-[#004F9F] to-[#0B1442]",     light: "from-blue-100/70",    bg: "bg-blue-50",    text: "text-blue-600" },
  rose:    { grad: "from-rose-500 to-rose-700",       light: "from-rose-100/70",    bg: "bg-rose-50",    text: "text-rose-600" },
  teal:    { grad: "from-teal-500 to-teal-700",       light: "from-teal-100/70",    bg: "bg-teal-50",    text: "text-teal-600" },
  indigo:  { grad: "from-indigo-500 to-indigo-700",   light: "from-indigo-100/70",  bg: "bg-indigo-50",  text: "text-indigo-600" },
  slate:   { grad: "from-slate-500 to-slate-700",     light: "from-slate-100/70",   bg: "bg-slate-100",  text: "text-slate-500" },
};

/* ══════════ Palet kartu statistik — samakan dengan PesertaStats.jsx ══════════ */
const WS = {
  biru:    { grad: "from-[#004F9F] to-[#0B1442]",     light: "from-blue-300",    bg: "bg-blue-50",    text: "text-blue-600" },
  slate:   { grad: "from-slate-500 to-slate-700",     light: "from-slate-200",   bg: "bg-slate-100",  text: "text-slate-500" },
  emerald: { grad: "from-emerald-500 to-emerald-700", light: "from-emerald-300", bg: "bg-emerald-50", text: "text-emerald-600" },
};

/* ══════════ Avatar profil admin ══════════ */
const AvatarProfil = ({ nama, foto }) => {
  const [gagal, setGagal] = useState(false);
  const url = foto ? getFileUrl(foto) : null;
  const inisial = (nama || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span className="group relative shrink-0">
      <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#00A5EC]/40 to-transparent opacity-0 blur transition-opacity duration-500 group-hover:opacity-100" />
      {url && !gagal ? (
        <img
          src={url}
          alt={nama}
          onError={() => setGagal(true)}
          className="relative h-14 w-14 rounded-2xl border border-white/20 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-base font-black text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
          {inisial}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#0B1442] bg-emerald-400">
        <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      </span>
    </span>
  );
};

/* ══════════ Avatar kecil untuk daftar mentor ══════════ */
const AvatarMentor = ({ nama, foto }) => {
  const [gagal, setGagal] = useState(false);
  const url = foto ? getFileUrl(foto) : null;
  const inisial = (nama || "?").trim().charAt(0).toUpperCase();

  if (url && !gagal) {
    return (
      <img
        src={url}
        alt={nama}
        onError={() => setGagal(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white transition-transform duration-300 group-hover:scale-110"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[11px] font-black text-white shadow-sm ring-2 ring-white transition-transform duration-300 group-hover:scale-110">
      {inisial}
    </span>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profil, setProfil] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [periode, setPeriode] = useState(6);
  const [memuatTren, setMemuatTren] = useState(false);
  const [deretAktif, setDeretAktif] = useState(["jumlah"]);
  const [kolomAktif, setKolomAktif] = useState(null);
  const [grafikSiap, setGrafikSiap] = useState(false);

  // Batang mulai dari nol lalu naik ke tingginya. requestAnimationFrame dipakai
  // agar peramban sempat menggambar keadaan awal, sehingga transisinya terlihat.
  useEffect(() => {
    if (!data) return;
    const id = requestAnimationFrame(() => setGrafikSiap(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  // Minimal satu deret harus menyala agar grafik tidak jadi kosong
  const toggleDeret = (kunci) => {
    setDeretAktif((lama) =>
      lama.includes(kunci)
        ? lama.length > 1
          ? lama.filter((k) => k !== kunci)
          : lama
        : [...lama, kunci]
    );
  };

  // Ganti rentang grafik tanpa memuat ulang seluruh dashboard
  const gantiPeriode = async (bulan) => {
    if (bulan === periode || memuatTren) return;
    setPeriode(bulan);
    setMemuatTren(true);
    try {
      const r = await getRingkasanDashboard({ bulan });
      // Jeda singkat agar peredupan sempat terlihat — tanpa ini, respons yang
      // sangat cepat membuat grafik seolah berkedip.
      await new Promise((res) => setTimeout(res, 180));
      setData((lama) => (lama ? { ...lama, tren: r.data.data?.tren || lama.tren } : lama));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat grafik pendaftaran.");
    } finally {
      setMemuatTren(false);
    }
  };

  useEffect(() => {
    const ambil = async () => {
      try {
        const [r, p] = await Promise.all([getRingkasanDashboard(), getMe()]);
        setData(r.data.data || null);
        setProfil(p.data.data || null);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal memuat data dashboard.");
      } finally {
        setMemuat(false);
      }
    };
    ambil();
  }, []);

  const antrean = data?.antrean || {};
  const presensi = data?.presensi || {};
  const program = data?.program || {};
  const tren = data?.tren || {};

  const daftarTindakan = [
    { icon: ClipboardCheck, judul: "Menunggu verifikasi", jumlah: antrean.menunggu_verifikasi,
      catatan: antrean.menunggu_lebih_3_hari > 0 ? `${antrean.menunggu_lebih_3_hari} lewat 3 hari` : "",
      warna: W.amber, tujuan: "/admin/pendaftaran" },
    { icon: FilePen, judul: "Menunggu revisi pendaftar", jumlah: antrean.perlu_revisi, warna: W.sky, tujuan: "/admin/pendaftaran" },
    { icon: FileSignature, judul: "Surat belum diterbitkan", jumlah: antrean.surat_belum_terbit, warna: W.violet, tujuan: "/admin/surat-penerimaan" },
    { icon: UserPlus, judul: "Akun peserta belum dibuat", jumlah: antrean.akun_belum_dibuat, warna: W.biru, tujuan: "/admin/peserta" },
    { icon: UserCog, judul: "Peserta belum punya mentor", jumlah: antrean.belum_punya_mentor, warna: W.rose, tujuan: "/admin/peserta" },
    { icon: Award, judul: "Sertifikat belum terbit", jumlah: antrean.sertifikat_tertunda, warna: W.teal, tujuan: "/admin/sertifikat" },
    { icon: MessagesSquare, judul: "Pesan belum dibalas", jumlah: antrean.chat_belum_dibalas, warna: W.indigo, tujuan: "/admin/pendaftaran" },
    { icon: Inbox, judul: "Pertanyaan baru masuk", jumlah: antrean.pertanyaan_baru, warna: W.slate, tujuan: "/admin/pertanyaan" },
  ];

  // Antrean paling mendesak — urutan array sudah mencerminkan prioritas kerja
  const tugasPrioritas = daftarTindakan.find((t) => (t.jumlah || 0) > 0) || null;

  const segmen = [
    { label: "Hadir", nilai: presensi.hadir || 0, bar: "bg-gradient-to-b from-emerald-400 to-emerald-600", dot: "bg-emerald-500", teks: "text-emerald-600" },
    { label: "Terlambat", nilai: presensi.terlambat || 0, bar: "bg-gradient-to-b from-amber-400 to-amber-600", dot: "bg-amber-500", teks: "text-amber-600" },
    { label: "Izin", nilai: presensi.izin || 0, bar: "bg-gradient-to-b from-sky-400 to-sky-600", dot: "bg-sky-500", teks: "text-sky-600" },
    { label: "Sakit", nilai: presensi.sakit || 0, bar: "bg-gradient-to-b from-violet-400 to-violet-600", dot: "bg-violet-500", teks: "text-violet-600" },
    { label: "Alfa", nilai: presensi.alfa || 0, bar: "bg-gradient-to-b from-rose-400 to-rose-600", dot: "bg-rose-500", teks: "text-rose-600" },
    { label: "Belum absen", nilai: presensi.belum_presensi || 0, bar: "bg-slate-300", dot: "bg-slate-300", teks: "text-slate-500" },
  ];
  const totalSegmen = segmen.reduce((a, b) => a + b.nilai, 0);

  const daftarTren = tren.pendaftaran || [];

  // Statistik ringkas di bawah grafik
  const trenTotal = daftarTren.reduce((a, b) => a + (b.jumlah || 0), 0);
  const trenKini = daftarTren.at(-1)?.jumlah || 0;
  const trenLalu = daftarTren.at(-2)?.jumlah || 0;
  const trenSelisih = trenKini - trenLalu;

  // Deret yang bisa dinyalakan/dimatikan lewat filter
  const deretTren = [
    { kunci: "jumlah", label: "Pendaftar", bar: "bg-[#004F9F]", dot: "bg-[#004F9F]", teks: "text-[#004F9F]", aktifBg: "bg-[#004F9F]" },
    { kunci: "diterima", label: "Diterima", bar: "bg-emerald-500", dot: "bg-emerald-500", teks: "text-emerald-600", aktifBg: "bg-emerald-500" },
    { kunci: "ditolak", label: "Ditolak", bar: "bg-rose-500", dot: "bg-rose-500", teks: "text-rose-600", aktifBg: "bg-rose-500" },
  ];

  // Label bulan dijarangkan bila periodenya panjang agar tidak bertumpuk.
  // Dihitung mundur dari bulan terakhir supaya bulan berjalan selalu berlabel.
  const langkahLabel = daftarTren.length > 6 ? 2 : 1;

  // Nilai tertinggi dari deret yang sedang ditampilkan
  const trenTertinggi = Math.max(
    1,
    ...daftarTren.flatMap((b) => deretAktif.map((k) => b[k] || 0))
  );

  // Skala dibulatkan ke atas ke angka "bulat" supaya label sumbu tidak kembar.
  // Jumlah garis menyesuaikan: nilai kecil cukup dibagi sedikit saja.
  const jumlahGaris = trenTertinggi <= 2 ? trenTertinggi : trenTertinggi <= 5 ? trenTertinggi : 4;
  const langkahSkala = Math.max(1, Math.ceil(trenTertinggi / jumlahGaris));
  const trenMax = langkahSkala * jumlahGaris;

  // Bidang paling penuh naik ke atas agar terlihat tanpa perlu menggulir
  const kuotaBidang = [...(program.kuota_bidang || [])].sort((a, b) => {
    const pa = (a.kuota || 0) > 0 ? (a.terisi || 0) / a.kuota : -1;
    const pb = (b.kuota || 0) > 0 ? (b.terisi || 0) / b.kuota : -1;
    return pb - pa;
  });

  // Mentor dengan beban terberat naik ke atas
  const bebanMentor = [...(program.beban_mentor || [])].sort((a, b) => {
    const pa = (a.kapasitas || 0) > 0 ? (a.bimbingan || 0) / a.kapasitas : -1;
    const pb = (b.kapasitas || 0) > 0 ? (b.bimbingan || 0) / b.kapasitas : -1;
    return pb - pa;
  });

  return (
    <AdminLayout showSearch={false}>
      <div className="space-y-5 pb-4">
        {/* ══════════ Banner sapaan ══════════ */}
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/5 bg-[#0B1442] text-white shadow-xl shadow-[#0B1442]/25 animate-[welcomeIn_0.45s_ease-out]">
          {/* Gradasi dipisah ke lapisan sendiri. Bila digabung dengan wadah
              ber-overflow-hidden yang berisi blob animasi, sebagian peramban
              gagal menggambar ulang latarnya saat lebar kartu berubah. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0B1442] to-[#1E3A8A]" />

          {/* Lapisan dekoratif — cahaya lembut */}
          <div className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 transform-gpu rounded-full bg-cyan-500/15 blur-3xl [backface-visibility:hidden] [will-change:transform] animate-[floatBlob_8s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -top-20 left-[28%] h-52 w-52 transform-gpu rounded-full bg-indigo-500/20 blur-3xl [backface-visibility:hidden] [will-change:transform] animate-[floatBlob_11s_ease-in-out_infinite_reverse]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 top-1/2 h-44 w-44 -translate-y-1/2 rotate-12 text-sky-400 opacity-[0.045]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>

          {/* ── Baris atas: identitas + tombol prioritas ── */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-5">
            <div className="flex items-center gap-4">
              <AvatarProfil nama={profil?.nama} foto={profil?.foto_profil} />
              <div className="min-w-0">
                <h2 className="text-[22px] font-black leading-tight tracking-tight">
                  <span className="font-medium text-white/55">{salam()}, </span>
                  {profil?.nama || "Admin"}
                </h2>
                <p className="mt-1.5">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[#7DD3FC]">
                    {profil?.jabatan || "Administrator"}
                  </span>
                </p>
              </div>
            </div>

            {!memuat && data && (
              tugasPrioritas ? (
                <button
                  type="button"
                  onClick={() => navigate(tugasPrioritas.tujuan)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/5 py-2.5 pl-3.5 pr-3 text-left backdrop-blur-md transition-all duration-300 animate-[popIn_0.4s_ease-out_both] hover:-translate-y-0.5 hover:border-[#00A5EC]/50 hover:bg-white/10 hover:shadow-lg active:scale-95"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[#0B1442] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Zap className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase tracking-widest text-white/40">
                      Prioritas hari ini
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white">
                      {tugasPrioritas.judul}
                      <span className="ml-1.5 text-amber-300">({n(tugasPrioritas.jumlah)})</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#00A5EC]" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 backdrop-blur-md animate-[popIn_0.4s_ease-out_both]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" strokeWidth={2.4} />
                  <span className="text-[12.5px] font-bold text-emerald-200">
                    Seluruh pekerjaan telah tertangani
                  </span>
                </div>
              )
            )}
          </div>

          {/* ── Baris bawah: ringkasan cepat ── */}
          {!memuat && data && (
            <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
              {[
                {
                  label: "Antrean pekerjaan",
                  nilai: n(antrean.total),
                  aksen: antrean.total > 0 ? "text-amber-300" : "text-emerald-300",
                  ket: antrean.total > 0 ? "menunggu diproses" : "semua tertangani",
                },
                {
                  label: "Peserta aktif",
                  nilai: n(program.peserta_aktif),
                  aksen: "text-white",
                  ket: `${n(program.jumlah_mentor)} mentor membimbing`,
                },
                {
                  label: "Presensi hari ini",
                  nilai: presensi.hari_kerja
                    ? `${n(presensi.sudah_presensi)}/${n(presensi.wajib_presensi)}`
                    : "—",
                  aksen: "text-white",
                  ket: presensi.hari_kerja ? "sudah melakukan absen" : presensi.alasan || "hari libur",
                },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="group px-6 py-4 transition-colors duration-300 animate-[fadeslide_0.5s_ease-out_both] hover:bg-white/5"
                >
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-white/40">
                    {s.label}
                  </p>
                  <p
                    className={`mt-1 origin-left text-[26px] font-black leading-none tabular-nums tracking-tight transition-transform duration-300 group-hover:scale-105 ${s.aksen}`}
                  >
                    {s.nilai}
                  </p>
                  <p className="mt-1.5 text-[10.5px] font-medium text-white/45">{s.ket}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2.5 py-24 text-[12.5px] font-medium text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#004F9F] border-t-transparent" />
            Memuat data dashboard...
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-[12.5px] font-medium text-slate-400 shadow-sm">
            Data dashboard belum dapat ditampilkan. Silakan muat ulang halaman.
          </div>
        ) : (
          <>
            {/* ══════════ Dua kolom: antrean + statistik (kiri) | presensi (kanan) ══════════ */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              {/* ── Kolom kiri ── */}
              <div className="space-y-5 lg:col-span-3">
                {/* Antrean pekerjaan */}
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <JudulSeksi
                    icon={ClipboardCheck}
                    judul="Perlu Tindakan Anda"
                    sub="Klik salah satu untuk langsung menuju halamannya"
                    aksi={
                      antrean.total > 0 ? (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[10.5px] font-black text-rose-600 animate-[popIn_0.35s_ease-out_both]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                          </span>
                          {n(antrean.total)} menunggu
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10.5px] font-black text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tidak ada tunggakan
                        </span>
                      )
                    }
                  />

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {daftarTindakan.map((t, i) => (
                      <KartuTindakan
                        key={t.judul}
                        icon={t.icon}
                        judul={t.judul}
                        jumlah={t.jumlah || 0}
                        catatan={t.catatan}
                        warna={t.warna}
                        tunda={i * 45}
                        onClick={() => navigate(t.tujuan)}
                      />
                    ))}
                  </div>
                </section>

                {/* Ringkasan program */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <KartuAngka icon={Users} label="Peserta Aktif" nilai={program.peserta_aktif}
                    caption="Sedang menjalani magang" warna={WS.biru} tunda={0} />
                  <KartuAngka icon={GraduationCap} label="Alumni Magang" nilai={program.peserta_alumni}
                    caption="Sudah menyelesaikan magang" warna={WS.slate} tunda={70} />
                  <KartuAngka icon={UserCog} label="Mentor Aktif" nilai={program.jumlah_mentor}
                    caption="Siap membimbing peserta" warna={WS.emerald} tunda={140} />
                </div>
              </div>

              {/* ── Kolom kanan: presensi hari ini ── */}
              <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
                <JudulSeksi
                  icon={CalendarCheck}
                  judul="Presensi Hari Ini"
                  sub={presensi.hari_kerja ? "Kehadiran peserta aktif" : "Di luar hari kerja"}
                  aksi={
                    presensi.hari_kerja ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[10.5px] font-black text-emerald-600">
                        Hari Kerja
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10.5px] font-black capitalize text-slate-500">
                        {presensi.alasan || "Libur"}
                      </span>
                    )
                  }
                />

                {presensi.hari_kerja ? (
                  <div className="flex flex-1 flex-col">
                    {/* Angka utama + cincin kemajuan */}
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-slate-50 to-white px-4 py-4">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[34px] font-black leading-none tracking-tight text-[#0B1442] tabular-nums">
                            {n(presensi.sudah_presensi)}
                          </span>
                          <span className="text-base font-black text-slate-300">
                            / {n(presensi.wajib_presensi)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10.5px] font-medium leading-snug text-slate-400">
                          Peserta sudah melakukan presensi
                        </p>
                      </div>

                      {(() => {
                        const wajib = presensi.wajib_presensi || 0;
                        const sudah = presensi.sudah_presensi || 0;
                        const pct = wajib > 0 ? Math.min(100, Math.round((sudah / wajib) * 100)) : 0;
                        const r = 30;
                        const keliling = 2 * Math.PI * r;
                        const warna = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f43f5e";
                        return (
                          <div className="relative h-[76px] w-[76px] shrink-0">
                            <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
                              <circle
                                cx="38"
                                cy="38"
                                r={r}
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="7"
                              />
                              <circle
                                cx="38"
                                cy="38"
                                r={r}
                                fill="none"
                                stroke={warna}
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={keliling}
                                strokeDashoffset={keliling - (keliling * pct) / 100}
                                style={{ transition: "stroke-dashoffset 1s ease-out" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span
                                className="text-lg font-black leading-none tabular-nums"
                                style={{ color: warna }}
                              >
                                {pct}
                                <span className="text-[10px]">%</span>
                              </span>
                              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                Hadir
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Batang vertikal tunggal + label di sisinya */}
                    <div className="mt-4 flex flex-1 gap-4">
                      <div className="flex w-3 shrink-0 flex-col overflow-hidden rounded-full bg-slate-100">
                        {totalSegmen > 0 &&
                          segmen.map(
                            (s) =>
                              s.nilai > 0 && (
                                <div
                                  key={s.label}
                                  title={`${s.label}: ${s.nilai}`}
                                  className={`${s.bar} w-full origin-top animate-[barGrow_0.8s_ease-out_both] transition-opacity duration-300 hover:opacity-80`}
                                  style={{ height: `${(s.nilai / totalSegmen) * 100}%` }}
                                />
                              )
                          )}
                      </div>

                      <ul className="flex flex-1 flex-col justify-around">
                        {segmen.map((s, i) => {
                          const ada = s.nilai > 0;
                          const persen =
                            totalSegmen > 0 ? Math.round((s.nilai / totalSegmen) * 100) : 0;
                          return (
                            <li
                              key={s.label}
                              style={{ animationDelay: `${i * 55}ms` }}
                              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 animate-[fadeslide_0.4s_ease-out_both] hover:bg-slate-50"
                            >
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-125 ${
                                  ada ? s.dot : "bg-slate-200"
                                }`}
                              />
                              <span
                                className={`flex-1 truncate text-[11.5px] font-bold ${
                                  ada ? "text-slate-600" : "text-slate-400"
                                }`}
                              >
                                {s.label}
                              </span>
                              {ada && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-500 tabular-nums">
                                  {persen}%
                                </span>
                              )}
                              <span
                                className={`w-6 text-right text-lg font-black tabular-nums ${
                                  ada ? s.teks : "text-slate-200"
                                }`}
                              >
                                {n(s.nilai)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/admin/presensi")}
                      className="group mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
                    >
                      Lihat data presensi lengkap
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <KartuKosong pesan="Tidak ada kewajiban presensi hari ini." />
                  </div>
                )}
              </section>
            </div>

            {/* ══════════ Kuota bidang, beban mentor & kehadiran rendah ══════════ */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-8">
              {/* ── Kuota tiap bidang ── */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-3">
                <JudulSeksi
                  icon={Layers}
                  judul="Kuota Tiap Bidang"
                  sub="Terisi peserta yang masih aktif"
                  aksi={(() => {
                    const totalKuota = kuotaBidang.reduce((a, b) => a + (b.kuota || 0), 0);
                    const totalIsi = kuotaBidang.reduce((a, b) => a + (b.terisi || 0), 0);
                    return totalKuota > 0 ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10.5px] font-black text-slate-600 tabular-nums">
                        {n(totalIsi)} / {n(totalKuota)} kursi
                      </span>
                    ) : null;
                  })()}
                />

                {kuotaBidang.length === 0 ? (
                  <KartuKosong pesan="Belum ada bidang yang aktif." />
                ) : (
                  <div className="scroll-halus max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                    {kuotaBidang.map((b, i) => {
                      const kuota = b.kuota || 0;
                      const terisi = b.terisi || 0;
                      const persen = kuota > 0 ? Math.min(100, Math.round((terisi / kuota) * 100)) : 0;
                      const sisa = Math.max(0, kuota - terisi);
                      const penuh = kuota > 0 && terisi >= kuota;
                      const hampir = !penuh && persen >= 80;

                      const gaya = penuh
                        ? { bar: "from-rose-500 to-rose-600", pill: "bg-rose-50 text-rose-600", tepi: "hover:border-rose-200" }
                        : hampir
                        ? { bar: "from-amber-500 to-amber-600", pill: "bg-amber-50 text-amber-600", tepi: "hover:border-amber-200" }
                        : { bar: "from-[#004F9F] to-[#00A5EC]", pill: "bg-blue-50 text-blue-600", tepi: "hover:border-blue-200" };

                      return (
                        <div
                          key={b.nama}
                          style={{ animationDelay: `${i * 55}ms` }}
                          className={`group rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/60 to-white p-3.5 transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-0.5 hover:shadow-sm ${gaya.tepi}`}
                        >
                          <div className="mb-2.5 flex items-center gap-2.5">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12.5px] font-bold text-slate-700 transition-colors duration-200 group-hover:text-[#0B1442]">
                                {b.nama}
                              </span>
                              <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                                {kuota === 0
                                  ? "Kuota belum ditentukan"
                                  : penuh
                                  ? "Kuota sudah penuh"
                                  : `Tersisa ${n(sisa)} kursi`}
                              </span>
                            </span>

                            <span
                              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black tabular-nums transition-transform duration-300 group-hover:scale-105 ${gaya.pill}`}
                            >
                              {kuota > 0 ? `${persen}%` : "∞"}
                            </span>

                            <span className="w-14 shrink-0 text-right text-[15px] font-black tabular-nums text-[#0B1442]">
                              {n(terisi)}
                              <span className="text-[11px] text-slate-300"> / {kuota > 0 ? n(kuota) : "∞"}</span>
                            </span>
                          </div>

                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full origin-left rounded-full bg-gradient-to-r ${gaya.bar} animate-[barSlide_0.8s_ease-out_both]`}
                              style={{ width: `${kuota > 0 ? persen : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── Beban bimbingan mentor ── */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-3">
                <JudulSeksi
                  icon={UserCog}
                  judul="Beban Bimbingan Mentor"
                  sub="Jumlah peserta aktif per mentor"
                  aksi={(() => {
                    const berlebih = bebanMentor.filter(
                      (m) => m.kapasitas > 0 && m.bimbingan > m.kapasitas
                    ).length;

                    if (berlebih > 0) {
                      return (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[10.5px] font-black text-rose-600 animate-[popIn_0.35s_ease-out_both]">
                          <AlertTriangle className="h-3 w-3" />
                          {n(berlebih)} mentor kelebihan
                        </span>
                      );
                    }

                    const totalKapasitas = bebanMentor.reduce((a, m) => a + (m.kapasitas || 0), 0);
                    const totalBimbingan = bebanMentor.reduce((a, m) => a + (m.bimbingan || 0), 0);
                    const sisa = Math.max(0, totalKapasitas - totalBimbingan);

                    if (totalKapasitas === 0) return null;

                    return (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[10.5px] font-black text-emerald-600 tabular-nums">
                        {n(sisa)} slot tersedia
                      </span>
                    );
                  })()}
                />

                {bebanMentor.length === 0 ? (
                  <KartuKosong pesan="Belum ada mentor yang aktif." />
                ) : (
                  <div className="scroll-halus max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                    {bebanMentor.map((m, i) => {
                      const kap = m.kapasitas || 0;
                      const isi = m.bimbingan || 0;
                      const persen = kap > 0 ? Math.min(100, Math.round((isi / kap) * 100)) : 0;
                      const berlebih = kap > 0 && isi > kap;
                      const padat = !berlebih && persen >= 80;

                      const gaya = berlebih
                        ? { bar: "from-rose-500 to-rose-600", pill: "bg-rose-50 text-rose-600", ket: `Kelebihan ${n(isi - kap)} peserta` }
                        : padat
                        ? { bar: "from-amber-500 to-amber-600", pill: "bg-amber-50 text-amber-600", ket: "Beban hampir penuh" }
                        : { bar: "from-emerald-500 to-emerald-600", pill: "bg-emerald-50 text-emerald-600", ket: kap > 0 ? `Bisa menerima ${n(kap - isi)} lagi` : "Kapasitas belum diatur" };

                      return (
                        <div
                          key={m.id}
                          style={{ animationDelay: `${i * 55}ms` }}
                          className="group rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/60 to-white p-3.5 transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                        >
                          <div className="mb-2.5 flex items-center gap-3">
                            <AvatarMentor key={m.foto_profil || m.id} nama={m.nama} foto={m.foto_profil} />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12.5px] font-bold text-slate-700 transition-colors duration-200 group-hover:text-[#0B1442]">
                                {m.nama}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400">
                                {m.bidang || "Bidang belum ditentukan"}
                              </span>
                            </span>

                            <span
                              className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black tabular-nums transition-transform duration-300 group-hover:scale-105 ${gaya.pill}`}
                            >
                              {berlebih && <AlertTriangle className="h-3 w-3" />}
                              {n(isi)}
                              <span className="opacity-50">/ {kap > 0 ? n(kap) : "—"}</span>
                            </span>
                          </div>

                          <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full origin-left rounded-full bg-gradient-to-r ${gaya.bar} animate-[barSlide_0.8s_ease-out_both]`}
                              style={{ width: `${kap > 0 ? persen : 0}%` }}
                            />
                          </div>

                          <p className="text-[10px] font-medium text-slate-400">{gaya.ket}</p>
                        </div>
                      );
                  })}
                </div>
              )}

              {(program.akan_selesai || []).length >= 8 && (
                <p className="mt-3 text-center text-[10.5px] font-medium text-slate-400">
                  Menampilkan 8 peserta terdekat. Lihat seluruhnya di halaman Kelola Peserta.
                </p>
              )}
            </section>
            {/* ── Kehadiran rendah ── */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-2">
                <div className="mb-5 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black tracking-tight text-[#0B1442]">
                        Kehadiran Rendah
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                        Di bawah 75% dalam 30 hari
                      </p>
                    </div>
                  </div>

                  {(program.peserta_bermasalah || []).length > 0 && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1.5 text-[10.5px] font-black text-rose-600 animate-[popIn_0.35s_ease-out_both]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                      </span>
                      {n((program.peserta_bermasalah || []).length)}
                    </span>
                  )}
                </div>

                {(program.peserta_bermasalah || []).length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-bold text-slate-700">
                        Kehadiran terjaga
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        Semua peserta di atas 75%
                      </span>
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="scroll-halus max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {(program.peserta_bermasalah || []).map((p, i) => {
                        const pct = p.persen || 0;
                        const parah = pct < 50;
                        const gaya = parah
                          ? { bar: "from-rose-500 to-rose-600", pill: "bg-rose-50 text-rose-600", tepi: "hover:border-rose-200" }
                          : { bar: "from-amber-500 to-amber-600", pill: "bg-amber-50 text-amber-600", tepi: "hover:border-amber-200" };

                        return (
                          <div
                            key={p.peserta_id}
                            style={{ animationDelay: `${i * 55}ms` }}
                            className={`group rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/60 to-white p-3 transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-0.5 hover:shadow-sm ${gaya.tepi}`}
                          >
                            <div className="mb-2 flex items-center gap-2.5">
                              <AvatarMentor
                                key={p.foto_profil || p.peserta_id}
                                nama={p.nama}
                                foto={p.foto_profil}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-bold text-slate-700 transition-colors duration-200 group-hover:text-[#0B1442]">
                                  {p.nama}
                                </span>
                                <span className="mt-0.5 block text-[9.5px] font-medium text-slate-400">
                                  Hadir {n(p.hadir)} dari {n(p.total)} hari
                                </span>
                              </span>
                              <span
                                className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-black tabular-nums transition-transform duration-300 group-hover:scale-105 ${gaya.pill}`}
                              >
                                {pct}%
                              </span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full origin-left rounded-full bg-gradient-to-r ${gaya.bar} animate-[barSlide_0.8s_ease-out_both]`}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/admin/presensi/rekap")}
                      className="group mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
                    >
                      Buka rekap kehadiran
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </>
                )}
              </section>
            </div>

            {/* ══════════ Peserta akan selesai ══════════ */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <JudulSeksi
                icon={CalendarClock}
                judul="Selesai Dalam 30 Hari"
                sub="Siapkan penerbitan sertifikat lebih awal"
                aksi={(() => {
                  const daftar = program.akan_selesai || [];

                  if (daftar.length === 0) {
                    return (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10.5px] font-black text-slate-500">
                        Tidak ada jadwal
                      </span>
                    );
                  }

                  const mendesak = daftar.filter((p) => (p.sisa_hari ?? 0) <= 7).length;

                  return (
                    <span className="flex shrink-0 items-center gap-2">
                      {mendesak > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10.5px] font-black text-amber-600 animate-[popIn_0.35s_ease-out_both]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                          </span>
                          {n(mendesak)} minggu ini
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10.5px] font-black text-slate-600 tabular-nums">
                        {n(daftar.length)} peserta
                      </span>
                    </span>
                  );
                })()}
              />

              {(program.akan_selesai || []).length === 0 ? (
                <div className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold text-slate-700">
                      Tidak ada peserta yang selesai bulan ini
                    </span>
                    <span className="mt-0.5 block text-[10.5px] font-medium text-slate-400">
                      Belum ada sertifikat yang perlu disiapkan dalam 30 hari ke depan
                    </span>
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {(program.akan_selesai || []).map((p, i) => {
                    const sisa = p.sisa_hari ?? 0;
                    const mendesak = sisa <= 3;
                    const dekat = !mendesak && sisa <= 7;
                    const gaya = mendesak
                      ? { blob: "from-rose-500 to-rose-700", pill: "bg-rose-50 text-rose-600", tepi: "hover:border-rose-200", bar: "from-rose-500 to-rose-600" }
                      : dekat
                      ? { blob: "from-amber-500 to-amber-700", pill: "bg-amber-50 text-amber-600", tepi: "hover:border-amber-200", bar: "from-amber-500 to-amber-600" }
                      : { blob: "from-[#004F9F] to-[#0B1442]", pill: "bg-blue-50 text-blue-600", tepi: "hover:border-blue-200", bar: "from-[#004F9F] to-[#00A5EC]" };

                    // Semakin dekat tanggal selesai, batang makin penuh
                    const kemajuan = Math.min(100, Math.max(4, Math.round(((30 - sisa) / 30) * 100)));

                    return (
                      <div
                        key={`${p.peserta_id}-${p.tanggal_selesai}`}
                        style={{ animationDelay: `${i * 55}ms` }}
                        className={`group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/60 to-white p-3.5 transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-1 hover:shadow-md ${gaya.tepi}`}
                      >
                        <div
                          className={`absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${gaya.blob} opacity-[0.12] blur-xl transition-all duration-300 group-hover:opacity-[0.25] group-hover:scale-125`}
                        />

                        <div className="relative mb-2.5 flex items-start gap-2.5">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-bold text-slate-700 transition-colors duration-200 group-hover:text-[#0B1442]">
                              {p.nama}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400">
                              {p.bidang || "Bidang belum ditentukan"}
                            </span>
                          </span>

                          <span
                            className={`shrink-0 rounded-lg px-2 py-1 text-center text-[10px] font-black leading-tight transition-transform duration-300 group-hover:scale-105 ${gaya.pill}`}
                          >
                            {sisa <= 0 ? (
                              "Hari ini"
                            ) : (
                              <>
                                <span className="block text-sm tabular-nums">{n(sisa)}</span>
                                <span className="block opacity-70">hari</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="relative mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full origin-left rounded-full bg-gradient-to-r ${gaya.bar} animate-[barSlide_0.8s_ease-out_both]`}
                            style={{ width: `${kemajuan}%` }}
                          />
                        </div>

                        <p className="relative flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <CalendarCheck className="h-3 w-3" />
                          Berakhir {tanggalPendek(p.tanggal_selesai)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ══════════ Tren ══════════ */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* ── Tren pendaftaran ── */}
              <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
                <JudulSeksi
                  icon={TrendingUp}
                  judul="Tren Pendaftaran"
                  sub="Formulir masuk beserta hasil seleksinya"
                  aksi={
                    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1">
                      {[3, 6, 12].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => gantiPeriode(b)}
                          className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[10.5px] font-black transition-all duration-200 ${
                            periode === b
                              ? "bg-white text-[#0B1442] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {b} bln
                        </button>
                      ))}
                    </div>
                  }
                />

                {/* Filter deret */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {deretTren.map((d) => {
                    const nyala = deretAktif.includes(d.kunci);
                    return (
                      <button
                        key={d.kunci}
                        type="button"
                        onClick={() => toggleDeret(d.kunci)}
                        className={`group flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                          nyala
                            ? "border-slate-200 bg-white text-slate-700 shadow-sm"
                            : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                            nyala ? d.dot : "bg-slate-300"
                          } group-hover:scale-125`}
                        />
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* Grafik */}
                <div
                  className={`relative min-h-[190px] flex-1 transition-all duration-300 ease-out ${
                    memuatTren ? "scale-[0.98] opacity-40" : "scale-100 opacity-100"
                  }`}
                  onMouseLeave={() => setKolomAktif(null)}
                >
                  {/* Garis bantu */}
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                    {Array.from({ length: jumlahGaris + 1 }, (_, k) => jumlahGaris - k).map((g) => (
                      <div key={g} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-right text-[9.5px] font-bold text-slate-400 tabular-nums">
                          {g * langkahSkala}
                        </span>
                        <span className={`h-px flex-1 ${g === 0 ? "bg-slate-200" : "bg-slate-100"}`} />
                      </div>
                    ))}
                  </div>

                  {/* Kolom */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-stretch gap-1.5 pl-8">
                    {daftarTren.map((b, i) => {
                      const kini = i === daftarTren.length - 1;
                      const tampilLabel = (daftarTren.length - 1 - i) % langkahLabel === 0;
                      const terpilih = kolomAktif === i;

                      const judulTip = [
                        `${b.bulan} — ${b.jumlah || 0} pendaftar`,
                        `Diterima: ${b.diterima || 0}`,
                        `Ditolak: ${b.ditolak || 0}`,
                        `Masih diproses: ${b.diproses || 0}`,
                      ].join("\n");

                      return (
                        // key memakai indeks, BUKAN nama bulan. Dengan begitu elemen
                        // tetap sama saat periode berganti, sehingga tingginya
                        // bertransisi mulus alih-alih dibuat ulang dari nol.
                        <div
                          key={i}
                          title={judulTip}
                          onMouseEnter={() => setKolomAktif(i)}
                          className="group relative flex flex-1 flex-col"
                        >
                          <div
                            className={`relative flex flex-1 items-end justify-center rounded-lg px-1 pb-px transition-colors duration-200 ${
                              terpilih ? "bg-slate-50" : ""
                            }`}
                          >
                            {deretTren.map((d) => {
                              const aktif = deretAktif.includes(d.kunci);
                              const v = b[d.kunci] || 0;
                              const persen = trenMax > 0 ? (v / trenMax) * 100 : 0;

                              return (
                                <div
                                  key={d.kunci}
                                  className={`flex h-full items-end justify-center transition-all duration-300 ease-out ${
                                    aktif ? "mx-[2px] w-3 opacity-100" : "mx-0 w-0 opacity-0"
                                  }`}
                                >
                                  <div
                                    style={{
                                      height: !grafikSiap
                                        ? "0%"
                                        : v > 0
                                        ? `${Math.max(persen, 3)}%`
                                        : "4px",
                                      transitionDelay: grafikSiap ? `${i * 40}ms` : "0ms",
                                    }}
                                    className={`w-full rounded-full transition-[height,background-color] duration-500 ease-out ${
                                      v > 0 ? d.bar : "bg-slate-200"
                                    } ${terpilih ? "opacity-100" : "opacity-90"}`}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <span
                            className={`mt-1.5 h-4 truncate text-center text-[9.5px] font-bold transition-colors duration-200 ${
                              terpilih || kini ? "text-[#0B1442]" : "text-slate-400"
                            }`}
                          >
                            {tampilLabel ? b.bulan : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Statistik ringkas */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 sm:grid-cols-4">
                  {[
                    {
                      label: "Total pendaftar",
                      nilai: n(trenTotal),
                      ket: `dalam ${periode} bulan`,
                      warna: "text-[#0B1442]",
                    },
                    {
                      label: "Tingkat penerimaan",
                      nilai: `${tren.persen_diterima ?? 0}%`,
                      ket:
                        (tren.total_diterima || 0) + (tren.total_ditolak || 0) > 0
                          ? `${n(tren.total_diterima)} dari ${n((tren.total_diterima || 0) + (tren.total_ditolak || 0))} diputuskan`
                          : "belum ada keputusan",
                      warna: "text-emerald-600",
                    },
                    {
                      label: "Ditolak",
                      nilai: n(tren.total_ditolak),
                      ket: `${n(tren.total_diproses)} masih diproses`,
                      warna: "text-rose-600",
                    },
                    {
                      label: "Bulan berjalan",
                      nilai: n(trenKini),
                      ket:
                        trenLalu === 0 && trenKini === 0
                          ? "belum ada"
                          : trenSelisih === 0
                          ? "sama seperti lalu"
                          : `${trenSelisih > 0 ? "naik" : "turun"} ${n(Math.abs(trenSelisih))}`,
                      warna:
                        trenSelisih > 0
                          ? "text-emerald-600"
                          : trenSelisih < 0
                          ? "text-rose-600"
                          : "text-slate-500",
                    },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      style={{ animationDelay: `${i * 55}ms` }}
                      className="group rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/60 to-white px-3 py-2.5 transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                    >
                      <p className="truncate text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                        {s.label}
                      </p>
                      <p className={`mt-1 text-xl font-black leading-none tabular-nums ${s.warna}`}>
                        {s.nilai}
                      </p>
                      <p className="mt-1 truncate text-[9.5px] font-medium text-slate-400">{s.ket}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Kehadiran 30 hari ── */}
              <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                {(() => {
                  const pct = tren.persen_kehadiran || 0;
                  const total = tren.total_presensi || 0;
                  const rekap = tren.rekap_30_hari || {};
                  const baik = pct >= 80;
                  const sedang = pct >= 50 && pct < 80;
                  const gaya = baik
                    ? { teks: "text-emerald-600", kotak: "from-emerald-50", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-600", ket: "Kehadiran terjaga baik" }
                    : sedang
                    ? { teks: "text-amber-600", kotak: "from-amber-50", bar: "bg-amber-500", pill: "bg-amber-50 text-amber-600", ket: "Kehadiran perlu diperhatikan" }
                    : { teks: "text-rose-600", kotak: "from-rose-50", bar: "bg-rose-500", pill: "bg-rose-50 text-rose-600", ket: "Kehadiran jauh di bawah normal" };

                  const rincian = [
                    ["Hadir tepat waktu", rekap.hadir, "bg-emerald-500", "text-emerald-600"],
                    ["Terlambat", rekap.terlambat, "bg-amber-500", "text-amber-600"],
                    ["Izin", rekap.izin, "bg-sky-500", "text-sky-600"],
                    ["Sakit", rekap.sakit, "bg-violet-500", "text-violet-600"],
                    ["Alfa", rekap.alfa, "bg-rose-500", "text-rose-600"],
                  ];

                  return (
                    <>
                      <JudulSeksi
                        icon={CheckCircle2}
                        judul="Kehadiran 30 Hari"
                        aksi={
                          total > 0 ? (
                            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10.5px] font-black text-slate-600 tabular-nums">
                              {n(total)} catatan
                            </span>
                          ) : null
                        }
                      />

                      {total > 0 ? (
                        <div className="flex flex-1 flex-col">
                          {/* Angka utama */}
                          <div className={`rounded-xl bg-gradient-to-br ${gaya.kotak} to-white px-4 py-5 text-center`}>
                            <p className={`text-[52px] font-black leading-none tracking-tight tabular-nums animate-[popIn_0.5s_ease-out_both] ${gaya.teks}`}>
                              {pct}
                              <span className="text-2xl">%</span>
                            </p>
                            <div className="mx-auto mt-3 h-2 w-3/4 overflow-hidden rounded-full bg-white/70">
                              <div
                                className={`h-full origin-left rounded-full ${gaya.bar} animate-[barSlide_0.9s_ease-out_both]`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-2.5 text-[10.5px] font-bold text-slate-500">{gaya.ket}</p>
                          </div>

                          {/* Rincian dengan batang proporsi */}
                          <div className="mt-4 flex flex-1 flex-col justify-around gap-1">
                            {rincian.map(([label, nilai, bar, teks], i) => {
                              const v = nilai || 0;
                              const p = total > 0 ? (v / total) * 100 : 0;
                              return (
                                <div
                                  key={label}
                                  style={{ animationDelay: `${i * 55}ms` }}
                                  className="group rounded-lg px-2 py-1.5 transition-colors duration-200 animate-[fadeslide_0.4s_ease-out_both] hover:bg-slate-50"
                                >
                                  <div className="mb-1.5 flex items-center gap-2">
                                    <span
                                      className={`h-2 w-2 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150 ${
                                        v > 0 ? bar : "bg-slate-200"
                                      }`}
                                    />
                                    <span
                                      className={`flex-1 truncate text-[11px] font-bold ${
                                        v > 0 ? "text-slate-600" : "text-slate-400"
                                      }`}
                                    >
                                      {label}
                                    </span>
                                    {v > 0 && (
                                      <span className="text-[9.5px] font-bold text-slate-400 tabular-nums">
                                        {Math.round(p)}%
                                      </span>
                                    )}
                                    <span
                                      className={`w-7 text-right text-[13px] font-black tabular-nums ${
                                        v > 0 ? teks : "text-slate-200"
                                      }`}
                                    >
                                      {n(v)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full origin-left rounded-full ${bar} animate-[barSlide_0.8s_ease-out_both]`}
                                      style={{ width: `${p}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-center">
                          <KartuKosong pesan="Belum ada catatan presensi 30 hari terakhir." />
                        </div>
                      )}
                    </>
                  );
                })()}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;