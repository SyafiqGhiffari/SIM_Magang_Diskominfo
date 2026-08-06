import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import LandingStats from "../../components/manajemen/admin/landing/LandingStats";
import PanduanCard from "../../components/manajemen/admin/landing/PanduanCard";
import {
  CheckCircle2, CircleDashed, Gauge, LayoutPanelTop,
  Palette, Sparkles, Images, Building2, Info, Target,
  ListChecks, Menu as MenuIcon, Phone, ToggleLeft, Search, Eye,
  MousePointerClick, Megaphone, DoorOpen, Link2, MapPin, Share2,
} from "lucide-react";
import KepalaKartu from "../../components/manajemen/admin/landing/KepalaKartu";
import StatusSimpan from "../../components/manajemen/admin/landing/StatusSimpan";
import DropZoneGambar from "../../components/manajemen/admin/landing/DropZoneGambar";
import TabBar from "../../components/manajemen/admin/landing/TabBar";
import EditorTeksKaya from "../../components/manajemen/admin/landing/EditorTeksKaya";
import Sakelar from "../../components/manajemen/admin/landing/Sakelar";
import RangkaHalamanLanding, {
  RangkaKontenLanding,
} from "../../components/manajemen/admin/landing/RangkaLanding";
import KelolaHeroSlide from "../../components/manajemen/KelolaHeroSlide";
import KelolaTampilanBidang from "../../components/manajemen/KelolaTampilanBidang";
import KelolaKontenLanding from "../../components/manajemen/KelolaKontenLanding";
import KelolaMenuLanding from "../../components/manajemen/KelolaMenuLanding";
import useAutoSimpan from "../../utils/useAutoSimpan";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import {
  getPengaturanLanding,
  updatePengaturanLanding,
  uploadFileLanding,
  deleteFileLanding,
} from "../../services/adminService";

// Judul kecil untuk kotak pengelompokan di dalam kartu.
// Didefinisikan di level modul agar tidak dibuat ulang setiap render.
const JudulGrup = ({ icon: Ikon, teks, ket, isDark }) => (
  <div className="mb-4 flex items-center gap-2.5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-sm">
      <Ikon className="h-4 w-4" strokeWidth={2.3} />
    </span>
    <div className="min-w-0">
      <p
        className={`text-[12px] font-black uppercase tracking-wide ${
          isDark ? "text-slate-200" : "text-[#0B1442]"
        }`}
      >
        {teks}
      </p>
      {ket && (
        <p className={`text-[11px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {ket}
        </p>
      )}
    </div>
  </div>
);

const TABS = [
  { key: "identitas", label: "Identitas & Branding", icon: Palette },
  { key: "hero", label: "Hero Section", icon: Sparkles },
  { key: "slide", label: "Slide Gambar", icon: Images },
  { key: "bidang", label: "Bidang Magang", icon: Building2 },
  { key: "tentang", label: "Tentang & Profil", icon: Info },
  { key: "konten", label: "Konten Daftar", icon: ListChecks },
  { key: "menu", label: "Menu Navigasi", icon: MenuIcon },
  { key: "kontak", label: "Kontak & Media Sosial", icon: Phone },
  { key: "status", label: "Status Pendaftaran", icon: ToggleLeft },
  { key: "seo", label: "SEO & Berbagi", icon: Search },
];

const hitungStats = (form, grup) => {
  const nilai = Object.values(form || {});
  const total = nilai.length;
  const terisi = nilai.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  ).length;
  const kosong = total - terisi;
  const persen = total > 0 ? Math.round((terisi / total) * 100) : 0;

  return [
    {
      icon: CheckCircle2,
      label: "Kolom Terisi",
      value: terisi,
      caption: `dari ${total} kolom pengaturan`,
      gradient: "from-emerald-500 to-emerald-700",
      lightGradient: "from-emerald-300 to-white",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: CircleDashed,
      label: "Masih Kosong",
      value: kosong,
      caption: kosong > 0 ? "Perlu segera dilengkapi" : "Semua sudah lengkap",
      gradient: "from-amber-500 to-amber-700",
      lightGradient: "from-amber-300 to-white",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: Gauge,
      label: "Kelengkapan",
      value: `${persen}%`,
      caption: "Kesiapan tampil ke publik",
      gradient: "from-[#004F9F] to-[#0B1442]",
      lightGradient: "from-blue-300 to-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: LayoutPanelTop,
      label: "Bagian Aktif",
      value: grup?.tabs?.length || 0,
      caption: grup?.judul || "-",
      gradient: "from-slate-600 to-slate-800",
      lightGradient: "from-slate-300 to-white",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ];
};

// Pengelompokan tab menjadi sub-halaman.
// Kunci objek = potongan URL, contoh: /admin/landing/tampilan
const GRUP = {
  identitas: {
    judul: "Identitas & SEO",
    desc: "Atur nama situs, logo, favicon, serta judul dan deskripsi untuk mesin pencari.",
    tabs: ["identitas", "seo"],
  },
  tampilan: {
    judul: "Tampilan Beranda",
    desc: "Atur bagian sambutan (hero), slide gambar, dan tampilan kartu bidang magang.",
    tabs: ["hero", "slide", "bidang"],
  },
  profil: {
    judul: "Konten & Profil",
    desc: "Atur profil instansi, visi misi, persyaratan, alur pendaftaran, dan benefit.",
    tabs: ["tentang", "konten"],
  },
  navigasi: {
    judul: "Navigasi & Kontak",
    desc: "Atur menu navigasi, informasi kontak, dan tautan media sosial.",
    tabs: ["menu", "kontak"],
  },
  status: {
    judul: "Status Pendaftaran",
    desc: "Buka atau tutup pendaftaran magang dan atur banner pengumuman.",
    tabs: ["status"],
  },
};

const GRUP_BAWAAN = "identitas";

const kosongkanNull = (v) => (v === null || v === undefined ? "" : v);
const formatTanggal = (v) => (v ? String(v).slice(0, 10) : "");

const petakanForm = (p) => ({
  nama_situs: kosongkanNull(p.nama_situs),
  sub_judul_situs: kosongkanNull(p.sub_judul_situs),
  tagline_footer: kosongkanNull(p.tagline_footer),
  teks_copyright: kosongkanNull(p.teks_copyright),

  hero_badge: kosongkanNull(p.hero_badge),
  hero_judul: kosongkanNull(p.hero_judul),
  hero_judul_highlight: kosongkanNull(p.hero_judul_highlight),
  hero_subjudul: kosongkanNull(p.hero_subjudul),
  hero_cta_teks: kosongkanNull(p.hero_cta_teks),
  hero_cta_link: kosongkanNull(p.hero_cta_link),
  hero_cta_tutup_teks: kosongkanNull(p.hero_cta_tutup_teks),
  hero_cta2_teks: kosongkanNull(p.hero_cta2_teks),
  hero_cta2_link: kosongkanNull(p.hero_cta2_link),

  about_badge: kosongkanNull(p.about_badge),
  about_judul: kosongkanNull(p.about_judul),
  about_paragraf1: kosongkanNull(p.about_paragraf1),
  about_paragraf2: kosongkanNull(p.about_paragraf2),
  profil_judul: kosongkanNull(p.profil_judul),
  profil_deskripsi: kosongkanNull(p.profil_deskripsi),
  visi_judul: kosongkanNull(p.visi_judul),
  visi_teks: kosongkanNull(p.visi_teks),
  misi_judul: kosongkanNull(p.misi_judul),

  seo_title: kosongkanNull(p.seo_title),
  seo_description: kosongkanNull(p.seo_description),
  seo_keywords: kosongkanNull(p.seo_keywords),

  email_resmi: kosongkanNull(p.email_resmi),
  telepon: kosongkanNull(p.telepon),
  nama_gedung: kosongkanNull(p.nama_gedung),
  alamat_lengkap: kosongkanNull(p.alamat_lengkap),
  jam_layanan: kosongkanNull(p.jam_layanan),
  embed_maps: kosongkanNull(p.embed_maps),
  link_instagram: kosongkanNull(p.link_instagram),
  link_facebook: kosongkanNull(p.link_facebook),
  link_youtube: kosongkanNull(p.link_youtube),
  link_website: kosongkanNull(p.link_website),
  pendaftaran_dibuka: !!p.pendaftaran_dibuka,
  tanggal_buka: formatTanggal(p.tanggal_buka),
  tanggal_tutup: formatTanggal(p.tanggal_tutup),
  pesan_ditutup: kosongkanNull(p.pesan_ditutup),
  banner_aktif: !!p.banner_aktif,
  banner_teks: kosongkanNull(p.banner_teks),
  banner_tipe: p.banner_tipe || "info",
});

const PengaturanLandingPage = () => {
  const { isDark } = useManajemenTheme();
  const { bagian } = useParams();
  const grup = GRUP[bagian] || null;

  // Tab yang dipilih manual oleh admin di dalam satu sub-halaman.
  const [tabDipilih, setTabDipilih] = useState(null);

  // Rangka (skeleton) singkat saat berpindah tab, supaya perpindahan terasa
  // sama seperti halaman lain dan isi kartu tidak "meloncat" begitu saja.
  const [memuatTab, setMemuatTab] = useState(false);

  const gantiTab = (key) => {
    if (key === tabDipilih) return;
    setTabDipilih(key);
    setMemuatTab(true);
  };

  // Tab aktif DITURUNKAN, bukan disimpan. Jika tab yang dipilih tidak
  // termasuk grup saat ini (misal admin pindah sub-halaman), otomatis
  // kembali ke tab pertama tanpa perlu setState di dalam effect.
  const tab =
    grup && grup.tabs.includes(tabDipilih) ? tabDipilih : grup?.tabs[0];

  // Matikan rangka tab lewat timer (callback, bukan setState langsung di badan
  // effect) agar tidak melanggar aturan react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!memuatTab) return undefined;
    const t = setTimeout(() => setMemuatTab(false), 380);
    return () => clearTimeout(t);
  }, [memuatTab]);

  const [form, setForm] = useState(null);
  const [urlLogo, setUrlLogo] = useState("");
  const [urlFavicon, setUrlFavicon] = useState("");
  const [urlFotoKantor, setUrlFotoKantor] = useState("");
  const [urlOgImage, setUrlOgImage] = useState("");
  const [statusEfektif, setStatusEfektif] = useState(true);
  const [alasanDitutup, setAlasanDitutup] = useState("");
  const [loading, setLoading] = useState(true);
  const [mengunggah, setMengunggah] = useState(null); // jenis berkas yang sedang diunggah
  
  const tampilkanNotif = (tipe, pesan) => {
    if (tipe === "sukses") toastSuccess(pesan);
    else toastError(pesan);
  };

  // Penanda untuk memicu pemuatan ulang tanpa memanggil setState di badan effect
  const [versiData, setVersiData] = useState(0);
  const muatUlang = () => setVersiData((v) => v + 1);

  // ── SIMPAN OTOMATIS ──
  // Tidak ada lagi tombol "Simpan Perubahan". Setiap perubahan pada form
  // dikirim sendiri ke server setelah admin berhenti mengetik sejenak.
  const { status: statusSimpan, tandaiTersimpan } = useAutoSimpan(
    form,
    async (nilai) => {
      try {
        await updatePengaturanLanding(nilai);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal menyimpan perubahan");
        throw err;
      }
      toastSuccess("Perubahan tersimpan");
      // segarkan status efektif tanpa menimpa isian yang sedang diketik
      try {
        const res = await getPengaturanLanding();
        const d = res.data.data;
        setStatusEfektif(d.status_efektif);
        setAlasanDitutup(d.alasan_ditutup || "");
      } catch {
        /* status efektif bersifat tambahan, abaikan bila gagal */
      }
    }
  );

  useEffect(() => {
    let aktif = true;

    const ambilData = async () => {
      try {
        const res = await getPengaturanLanding();
        if (!aktif) return;
        const d = res.data.data;
        const terpetakan = petakanForm(d.pengaturan);
        tandaiTersimpan(terpetakan); // data dari server dianggap sudah tersimpan
        setForm(terpetakan);
        setUrlLogo(d.url_logo || "");
        setUrlFavicon(d.url_favicon || "");
        setUrlFotoKantor(d.url_foto_kantor || "");
        setUrlOgImage(d.url_og_image || "");
        setStatusEfektif(d.status_efektif);
        setAlasanDitutup(d.alasan_ditutup || "");
      } catch {
        if (aktif) toastError("Gagal memuat pengaturan landing page");
      } finally {
        if (aktif) setLoading(false);
      }
    };

    ambilData();
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versiData]);

  const ubah = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const unggah = async (jenis, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setMengunggah(jenis);
    try {
      await uploadFileLanding(jenis, fd);
      muatUlang();
      const namaJenis =
        {
          logo: "Logo",
          favicon: "Favicon",
          "foto-kantor": "Foto kantor",
          "og-image": "Gambar berbagi",
        }[jenis] || "File";
      tampilkanNotif("sukses", `${namaJenis} berhasil diperbarui`);
    } catch (err) {
      tampilkanNotif("error", err.response?.data?.message || "Gagal mengunggah file");
    } finally {
      setMengunggah(null);
    }
  };

  const hapusFile = async (jenis) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus berkas ini?",
      text: "Berkas akan dihapus dari server dan tidak lagi tampil di halaman publik.",
      confirmText: "Ya, hapus",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;
    try {
      await deleteFileLanding(jenis);
      muatUlang();
      tampilkanNotif("sukses", "File berhasil dihapus");
    } catch (err) {
      tampilkanNotif("error", err.response?.data?.message || "Gagal menghapus file");
    }
  };

  // URL tidak dikenal → arahkan ke sub-halaman pertama.
  // Diletakkan SETELAH semua hook agar urutan hook tetap konsisten.
  if (!grup) {
    return <Navigate to={`/admin/landing/${GRUP_BAWAAN}`} replace />;
  }

  if (loading || !form) {
    return (
      <AdminLayout>
        <RangkaHalamanLanding isDark={isDark} />
      </AdminLayout>
    );
  }

  // Kolom isian: sudut lebih membulat, latar lembut, cincin fokus bercahaya.
  const inputClass = `mt-1.5 w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20 focus:border-[#00A5EC] focus:bg-white/[0.07] focus:ring-4 focus:ring-[#00A5EC]/20"
      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-300 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  const labelClass = `flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider ${
    isDark ? "text-slate-400" : "text-slate-400"
  } before:h-1 before:w-1 before:rounded-full before:bg-[#00A5EC]/70 before:content-['']`;

  // Kartu isian utama.
  const cardClass = `relative space-y-5 overflow-hidden rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${
    isDark
      ? "border-white/10 bg-gradient-to-b from-[#111c33] to-[#0f172a] hover:border-[#00A5EC]/25"
      : "border-slate-200/80 bg-white hover:border-[#00A5EC]/35"
  }`;
  const cardClassPolos = cardClass.replace("space-y-5 ", "");

  // Kotak pengelompokan di dalam kartu (sub-bagian).
  const grupClass = `rounded-2xl border p-5 transition-all duration-300 ${
    isDark
      ? "border-white/10 bg-white/[0.03] hover:border-white/20"
      : "border-slate-200/70 bg-gradient-to-br from-slate-50 to-white hover:border-[#00A5EC]/30 hover:shadow-sm"
  }`;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <p className={`text-[10.5px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Pengaturan Landing Page
          </p>
          <h2 className={`mt-1 text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            {grup.judul}
          </h2>
          <p className={`mt-1.5 max-w-xl text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {grup.desc}
          </p>
        </div>

        <LandingStats cards={hitungStats(form, grup)} isDark={isDark} />

        {/* Tab hanya ditampilkan bila sub-halaman ini memang punya lebih dari satu bagian */}
        {grup.tabs.length > 1 && (
          <TabBar
            tabs={TABS.filter((t) => grup.tabs.includes(t.key))}
            aktif={tab}
            onPilih={gantiTab}
            isDark={isDark}
          />
        )}

      {memuatTab ? (
        <RangkaKontenLanding isDark={isDark} />
      ) : (
        <>
      {/* ── Pratinjau hasil pencarian: lebar penuh, di atas seluruh kartu ── */}
      {tab === "seo" && (
        <div className={`${cardClassPolos} mb-5`}>
          <KepalaKartu
            icon={Eye}
            judul="Pratinjau Hasil Akhir"
            sub="Perkiraan tampilan situs Anda di halaman pencarian Google"
            isDark={isDark}
          />
          <div
            className={`mt-5 rounded-2xl border p-5 ${
              isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"
            }`}
          >
            <p className="text-[11.5px] font-medium text-emerald-700">
              simmagang.ponorogo.go.id
            </p>
            <p className="mt-1 break-words text-lg font-medium leading-snug text-blue-700">
              {form.seo_title || "Judul halaman belum diisi"}
            </p>
            <p
              className={`mt-1.5 text-[13px] leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {form.seo_description || "Deskripsi singkat belum diisi."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Kolom kiri: seluruh form isian ── */}
        <div className="min-w-0 space-y-5">
        {/* ── TAB IDENTITAS ── */}
        {tab === "identitas" && (
          <div className={cardClass}>
            <KepalaKartu icon={Palette} judul="Identitas & Branding" sub="Nama, tagline, logo, dan favicon situs" isDark={isDark} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nama Situs</label>
                <input className={inputClass} value={form.nama_situs} onChange={(e) => ubah("nama_situs", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sub Judul</label>
                <input className={inputClass} value={form.sub_judul_situs} onChange={(e) => ubah("sub_judul_situs", e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tagline Footer</label>
              <EditorTeksKaya rows={3} isDark={isDark} nilai={form.tagline_footer} onUbah={(v) => ubah("tagline_footer", v)} />
            </div>

            <div>
              <label className={labelClass}>Teks Copyright</label>
              <input className={inputClass} value={form.teks_copyright} onChange={(e) => ubah("teks_copyright", e.target.value)} />
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={Images} teks="Berkas Gambar" ket="Seret berkas ke kotak atau klik untuk memilih" />

              {/* Penjelasan sederhana agar pengguna awam tidak bingung */}
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
                    isDark
                      ? "border-[#00A5EC]/25 bg-[#00A5EC]/[0.07]"
                      : "border-sky-200 bg-gradient-to-br from-sky-50 to-white"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-sm">
                    <Images className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[12px] font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Apa itu Logo Situs?
                    </p>
                    <p className={`mt-1 text-[11.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Gambar lambang instansi yang tampil di <b>pojok kiri atas halaman</b> (navbar)
                      dan di bagian bawah halaman (footer). Ini yang paling sering dilihat
                      pengunjung. Sebaiknya gunakan gambar dengan latar transparan (PNG/SVG)
                      agar menyatu dengan warna halaman.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
                    isDark
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#1E3A8A] text-white shadow-sm">
                    <Info className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[12px] font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Apa itu Favicon?
                    </p>
                    <p className={`mt-1 text-[11.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Ikon mungil yang muncul di <b>tab browser</b>, di daftar bookmark, dan saat
                      situs disimpan di layar utama ponsel. Ukurannya sangat kecil, jadi pakai
                      gambar sederhana &mdash; cukup lambang saja tanpa tulisan, berbentuk persegi
                      (misal 512 &times; 512 piksel).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DropZoneGambar
                  judul="Logo Situs"
                  ket="Tampil di navbar & footer. JPG, PNG, WEBP, atau SVG."
                  url={urlLogo}
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  maksMb={2}
                  muat="contain"
                  rasio="h-36"
                  mengunggah={mengunggah === "logo"}
                  onPilih={(file) => unggah("logo", file)}
                  onHapus={() => hapusFile("logo")}
                  isDark={isDark}
                />
                <DropZoneGambar
                  judul="Favicon"
                  ket="Ikon tab browser, bentuk persegi. PNG, ICO, atau SVG."
                  url={urlFavicon}
                  accept=".png,.ico,.svg"
                  maksMb={2}
                  muat="contain"
                  rasio="h-36"
                  mengunggah={mengunggah === "favicon"}
                  onPilih={(file) => unggah("favicon", file)}
                  onHapus={() => hapusFile("favicon")}
                  isDark={isDark}
                />
              </div>
            </div>

            <StatusSimpan status={statusSimpan} isDark={isDark} />
          </div>
        )}

        {/* ── TAB HERO SECTION ── */}
        {tab === "hero" && (
          <div className={cardClass}>
            <KepalaKartu icon={Sparkles} judul="Hero Section" sub="Judul utama dan foto sampul beranda" isDark={isDark} />
            <div>
              <label className={labelClass}>Badge Kecil di Atas Judul</label>
              <input className={inputClass} value={form.hero_badge} onChange={(e) => ubah("hero_badge", e.target.value)} placeholder="⚡ Pendaftaran Magang" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Judul Utama</label>
                <input className={inputClass} value={form.hero_judul} onChange={(e) => ubah("hero_judul", e.target.value)} placeholder="Bangun Karier Digitalmu di" />
              </div>
              <div>
                <label className={labelClass}>Bagian Judul yang Disorot</label>
                <input className={inputClass} value={form.hero_judul_highlight} onChange={(e) => ubah("hero_judul_highlight", e.target.value)} placeholder="Diskominfo Ponorogo" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Sub Judul / Paragraf</label>
              <EditorTeksKaya rows={3} isDark={isDark} nilai={form.hero_subjudul} onUbah={(v) => ubah("hero_subjudul", v)} />
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={MousePointerClick} teks="Tombol Utama" ket="Tombol ajakan utama di bagian hero" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Teks Tombol</label>
                  <input className={inputClass} value={form.hero_cta_teks} onChange={(e) => ubah("hero_cta_teks", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Tujuan Tombol</label>
                  <input className={inputClass} value={form.hero_cta_link} onChange={(e) => ubah("hero_cta_link", e.target.value)} placeholder="/pilih-pendaftaran" />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Teks Saat Pendaftaran Ditutup</label>
                <input className={inputClass} value={form.hero_cta_tutup_teks} onChange={(e) => ubah("hero_cta_tutup_teks", e.target.value)} />
              </div>
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={Link2} teks="Tombol Kedua" ket="Tombol pendamping, misal menuju halaman program" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Teks Tombol</label>
                  <input className={inputClass} value={form.hero_cta2_teks} onChange={(e) => ubah("hero_cta2_teks", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Tujuan Tombol</label>
                  <input className={inputClass} value={form.hero_cta2_link} onChange={(e) => ubah("hero_cta2_link", e.target.value)} placeholder="/program-magang" />
                </div>
              </div>
            </div>

            <StatusSimpan status={statusSimpan} isDark={isDark} />
          </div>
        )}

        {/* ── TAB SLIDE GAMBAR ── */}
        {tab === "slide" && <KelolaHeroSlide onNotif={tampilkanNotif} isDark={isDark} />}

        {/* ── TAB BIDANG MAGANG ── */}
        {tab === "bidang" && <KelolaTampilanBidang onNotif={tampilkanNotif} isDark={isDark} />}

        {/* ── TAB TENTANG & PROFIL ── */}
        {tab === "tentang" && (
          <div className="space-y-6">
            <div className={cardClass}>
              <KepalaKartu icon={Info} judul="Tentang Instansi" sub="Deskripsi singkat yang tampil di beranda" isDark={isDark} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Badge</label>
                  <input className={inputClass} value={form.about_badge} onChange={(e) => ubah("about_badge", e.target.value)} placeholder="Mengenal Kami" />
                </div>
                <div>
                  <label className={labelClass}>Judul</label>
                  <input className={inputClass} value={form.about_judul} onChange={(e) => ubah("about_judul", e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Paragraf 1</label>
                <EditorTeksKaya rows={3} isDark={isDark} nilai={form.about_paragraf1} onUbah={(v) => ubah("about_paragraf1", v)} />
              </div>
              <div>
                <label className={labelClass}>Paragraf 2</label>
                <EditorTeksKaya rows={3} isDark={isDark} nilai={form.about_paragraf2} onUbah={(v) => ubah("about_paragraf2", v)} />
              </div>

              <StatusSimpan status={statusSimpan} isDark={isDark} />
            </div>

            <div className={cardClass}>
              <KepalaKartu icon={Target} judul="Profil Instansi" sub="Isi halaman Tentang beserta foto kantor" isDark={isDark} />

              <div>
                <label className={labelClass}>Judul Profil</label>
                <input className={inputClass} value={form.profil_judul} onChange={(e) => ubah("profil_judul", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Deskripsi Profil</label>
                <EditorTeksKaya rows={5} isDark={isDark} nilai={form.profil_deskripsi} onUbah={(v) => ubah("profil_deskripsi", v)} />
              </div>

              <DropZoneGambar
                judul="Foto Kantor"
                ket="JPG, PNG, atau WEBP. Foto lama otomatis dihapus saat diganti."
                url={urlFotoKantor}
                accept=".jpg,.jpeg,.png,.webp"
                maksMb={5}
                rasio="h-52"
                mengunggah={mengunggah === "foto-kantor"}
                onPilih={(file) => unggah("foto-kantor", file)}
                onHapus={() => hapusFile("foto-kantor")}
                isDark={isDark}
              />

              <StatusSimpan status={statusSimpan} isDark={isDark} />
            </div>

            <div className={cardClass}>
              <KepalaKartu icon={ListChecks} judul="Visi & Misi" sub="Cita-cita dan langkah nyata instansi" isDark={isDark} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Judul Visi</label>
                  <input className={inputClass} value={form.visi_judul} onChange={(e) => ubah("visi_judul", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Judul Misi</label>
                  <input className={inputClass} value={form.misi_judul} onChange={(e) => ubah("misi_judul", e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Isi Visi</label>
                <EditorTeksKaya rows={3} isDark={isDark} nilai={form.visi_teks} onUbah={(v) => ubah("visi_teks", v)} />
              </div>

              <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Poin-poin Misi dikelola pada tab <b>Konten Daftar → Misi Instansi</b>.
              </p>

              <StatusSimpan status={statusSimpan} isDark={isDark} />
            </div>
          </div>
        )}

        {/* ── TAB KONTEN DAFTAR ── */}
        {tab === "konten" && <KelolaKontenLanding onNotif={tampilkanNotif} isDark={isDark} />}

        {/* ── TAB MENU NAVIGASI ── */}
        {tab === "menu" && <KelolaMenuLanding onNotif={tampilkanNotif} isDark={isDark} />}

        {/* ── TAB KONTAK ── */}
        {tab === "kontak" && (
          <div className={cardClass}>
            <KepalaKartu icon={Phone} judul="Kontak & Media Sosial" sub="Informasi yang tampil di bagian footer" isDark={isDark} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Email Resmi</label>
                <input className={inputClass} value={form.email_resmi} onChange={(e) => ubah("email_resmi", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Telepon</label>
                <input className={inputClass} value={form.telepon} onChange={(e) => ubah("telepon", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nama Gedung</label>
                <input className={inputClass} value={form.nama_gedung} onChange={(e) => ubah("nama_gedung", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Jam Layanan</label>
                <input className={inputClass} value={form.jam_layanan} onChange={(e) => ubah("jam_layanan", e.target.value)} />
              </div>
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={MapPin} teks="Alamat & Peta" ket="Lokasi kantor yang tampil di halaman kontak" />
              <div>
                <label className={labelClass}>Alamat Lengkap</label>
                <textarea rows={2} className={inputClass} value={form.alamat_lengkap} onChange={(e) => ubah("alamat_lengkap", e.target.value)} />
              </div>
              <div className="mt-4">
                <label className={labelClass}>URL Embed Google Maps</label>
                <textarea rows={3} className={inputClass} value={form.embed_maps} onChange={(e) => ubah("embed_maps", e.target.value)} />
                <p className={`mt-1 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Ambil dari Google Maps → Bagikan → Sematkan peta, lalu salin isi atribut <code>src</code> saja.
                </p>
              </div>
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={Share2} teks="Media Sosial" ket="Kosongkan untuk menyembunyikan ikonnya" />
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["link_instagram", "Instagram"],
                  ["link_facebook", "Facebook"],
                  ["link_youtube", "YouTube"],
                  ["link_website", "Website Resmi"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <input
                      className={inputClass}
                      placeholder="Kosongkan untuk menyembunyikan ikon"
                      value={form[key]}
                      onChange={(e) => ubah(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <StatusSimpan status={statusSimpan} isDark={isDark} />
          </div>
        )}

        {/* ── TAB STATUS PENDAFTARAN ── */}
        {tab === "status" && (
          <div className={cardClass}>
            <KepalaKartu icon={ToggleLeft} judul="Status Pendaftaran" sub="Buka atau tutup pendaftaran beserta kuotanya" isDark={isDark} />

            <div
              className={`relative overflow-hidden rounded-2xl border px-5 py-4 text-sm ${
                statusEfektif
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white text-emerald-700"
                  : "border-amber-200 bg-gradient-to-r from-amber-50 to-white text-amber-700"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  statusEfektif ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <strong className="font-black">
                Status saat ini: {statusEfektif ? "Pendaftaran DIBUKA" : "Pendaftaran DITUTUP"}
              </strong>
              {!statusEfektif && alasanDitutup && <p className="mt-1">{alasanDitutup}</p>}
            </div>

            <Sakelar
              nyala={form.pendaftaran_dibuka}
              onUbah={(v) => ubah("pendaftaran_dibuka", v)}
              judul="Buka pendaftaran magang"
              ket="Jika dimatikan, tombol daftar disembunyikan dan pengiriman formulir ditolak oleh server."
              ikon={DoorOpen}
              isDark={isDark}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Tanggal Buka (opsional)</label>
                <input type="date" className={inputClass} value={form.tanggal_buka} onChange={(e) => ubah("tanggal_buka", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tanggal Tutup (opsional)</label>
                <input type="date" className={inputClass} value={form.tanggal_tutup} onChange={(e) => ubah("tanggal_tutup", e.target.value)} />
              </div>
            </div>
            <p className={`-mt-2 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Kosongkan kedua tanggal jika ingin mengatur buka/tutup sepenuhnya secara manual.
            </p>

            <div>
              <label className={labelClass}>Pesan Saat Pendaftaran Ditutup</label>
              <textarea rows={3} className={inputClass} value={form.pesan_ditutup} onChange={(e) => ubah("pesan_ditutup", e.target.value)} />
            </div>

            <div className={grupClass}>
              <JudulGrup isDark={isDark} icon={Megaphone} teks="Banner Pengumuman" ket="Pita informasi di bagian atas landing page" />

              <Sakelar
                nyala={form.banner_aktif}
                onUbah={(v) => ubah("banner_aktif", v)}
                judul="Tampilkan banner pengumuman"
                ket="Banner muncul di bagian paling atas halaman publik."
                ikon={Megaphone}
                isDark={isDark}
              />

              {form.banner_aktif && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={labelClass}>Teks Banner</label>
                    <textarea rows={2} className={inputClass} value={form.banner_teks} onChange={(e) => ubah("banner_teks", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Tipe Banner</label>
                    <select className={inputClass} value={form.banner_tipe} onChange={(e) => ubah("banner_tipe", e.target.value)}>
                      <option value="info">Info (biru)</option>
                      <option value="sukses">Sukses (hijau)</option>
                      <option value="peringatan">Peringatan (kuning)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <StatusSimpan status={statusSimpan} isDark={isDark} />
          </div>
        )}

        {/* ── TAB SEO & BERBAGI ── */}
        {tab === "seo" && (
          <div className="space-y-6">
            <div className={cardClass}>
              <KepalaKartu icon={Search} judul="SEO Halaman" sub="Judul, deskripsi, dan kata kunci pencarian" isDark={isDark} />

              <div>
                <label className={labelClass}>Judul Halaman (Title Tag)</label>
                <input
                  className={inputClass}
                  maxLength={70}
                  value={form.seo_title}
                  onChange={(e) => ubah("seo_title", e.target.value)}
                  placeholder="Portal Pendaftaran | SIM Magang Diskominfo Ponorogo"
                />
                <p className={`mt-1 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Tampil di tab browser dan sebagai judul biru di hasil Google.
                  Idealnya 50-60 karakter. Terpakai: {form.seo_title.length}/70.
                </p>
              </div>

              <div>
                <label className={labelClass}>Deskripsi Singkat (Meta Description)</label>
                <textarea
                  rows={3}
                  maxLength={200}
                  className={inputClass}
                  value={form.seo_description}
                  onChange={(e) => ubah("seo_description", e.target.value)}
                />
                <p className={`mt-1 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Teks abu-abu di bawah judul pada hasil pencarian. Idealnya 120-155
                  karakter. Terpakai: {form.seo_description.length}/200.
                </p>
              </div>

              <div>
                <label className={labelClass}>Kata Kunci (dipisah koma)</label>
                <input
                  className={inputClass}
                  value={form.seo_keywords}
                  onChange={(e) => ubah("seo_keywords", e.target.value)}
                  placeholder="magang ponorogo, magang diskominfo, pkl ponorogo"
                />
              </div>

              <StatusSimpan status={statusSimpan} isDark={isDark} />
            </div>

            <div className={cardClass}>
              <KepalaKartu icon={Images} judul="Gambar Berbagi" sub="Tampil saat tautan dibagikan ke media sosial" isDark={isDark} />
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Gambar ini muncul ketika alamat web dibagikan di WhatsApp, Facebook, atau
                Twitter. Ukuran ideal 1200 × 630 piksel.
              </p>

              <DropZoneGambar
                judul="Gambar Saat Link Dibagikan (OG Image)"
                ket="JPG, PNG, atau WEBP. Gambar lama otomatis dihapus saat diganti."
                url={urlOgImage}
                accept=".jpg,.jpeg,.png,.webp"
                maksMb={5}
                rasio="h-52"
                mengunggah={mengunggah === "og-image"}
                onPilih={(file) => unggah("og-image", file)}
                onHapus={() => hapusFile("og-image")}
                isDark={isDark}
              />

              <StatusSimpan status={statusSimpan} isDark={isDark} />
            </div>
          </div>
        )}
          </div>

          {/* ── Kolom kanan: panduan penulisan ── */}
        <PanduanCard tab={tab} isDark={isDark} />
      </div>
      </>
    )}
  </div>
</AdminLayout>
  );
};

export default PengaturanLandingPage;