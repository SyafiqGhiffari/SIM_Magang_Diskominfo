import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import KelolaHeroSlide from "../../components/manajemen/KelolaHeroSlide";
import KelolaTampilanBidang from "../../components/manajemen/KelolaTampilanBidang";
import KelolaKontenLanding from "../../components/manajemen/KelolaKontenLanding";
import KelolaMenuLanding from "../../components/manajemen/KelolaMenuLanding";
import {
  getPengaturanLanding,
  updatePengaturanLanding,
  uploadFileLanding,
  deleteFileLanding,
} from "../../services/adminService";

const TABS = [
  { key: "identitas", label: "Identitas & Branding" },
  { key: "hero", label: "Hero Section" },
  { key: "slide", label: "Slide Gambar" },
  { key: "bidang", label: "Bidang Magang" },
  { key: "tentang", label: "Tentang & Profil" },
  { key: "konten", label: "Konten Daftar" },
  { key: "menu", label: "Menu Navigasi" },
  { key: "kontak", label: "Kontak & Media Sosial" },
  { key: "status", label: "Status Pendaftaran" },
  { key: "seo", label: "SEO & Berbagi" },
];

const TAB_MANDIRI = ["slide", "bidang", "konten", "menu"];

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
  const [tab, setTab] = useState("identitas");
  const [form, setForm] = useState(null);
  const [urlLogo, setUrlLogo] = useState("");
  const [urlFavicon, setUrlFavicon] = useState("");
  const [urlFotoKantor, setUrlFotoKantor] = useState("");
  const [urlOgImage, setUrlOgImage] = useState("");
  const [statusEfektif, setStatusEfektif] = useState(true);
  const [alasanDitutup, setAlasanDitutup] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState(null);

  const tampilkanNotif = (tipe, pesan) => {
    setNotif({ tipe, pesan });
    setTimeout(() => setNotif(null), 4000);
  };

  // Penanda untuk memicu pemuatan ulang tanpa memanggil setState di badan effect
  const [versiData, setVersiData] = useState(0);
  const muatUlang = () => setVersiData((v) => v + 1);

  useEffect(() => {
    let aktif = true;

    const ambilData = async () => {
      try {
        const res = await getPengaturanLanding();
        if (!aktif) return;
        const d = res.data.data;
        setForm(petakanForm(d.pengaturan));
        setUrlLogo(d.url_logo || "");
        setUrlFavicon(d.url_favicon || "");
        setUrlFotoKantor(d.url_foto_kantor || "");
        setUrlOgImage(d.url_og_image || "");
        setStatusEfektif(d.status_efektif);
        setAlasanDitutup(d.alasan_ditutup || "");
      } catch {
        if (aktif) setNotif({ tipe: "error", pesan: "Gagal memuat pengaturan landing page" });
      } finally {
        if (aktif) setLoading(false);
      }
    };

    ambilData();
    return () => {
      aktif = false;
    };
  }, [versiData]);

  const ubah = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const simpan = async () => {
    setSaving(true);
    try {
      await updatePengaturanLanding(form);
      muatUlang();
      tampilkanNotif("sukses", "Pengaturan berhasil disimpan");
    } catch (err) {
      tampilkanNotif("error", err.response?.data?.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const unggah = async (jenis, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
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
    }
  };

  const hapusFile = async (jenis) => {
    if (!window.confirm("Hapus file ini?")) return;
    try {
      await deleteFileLanding(jenis);
      muatUlang();
      tampilkanNotif("sukses", "File berhasil dihapus");
    } catch (err) {
      tampilkanNotif("error", err.response?.data?.message || "Gagal menghapus file");
    }
  };

  if (loading || !form) {
    return (
      <AdminLayout>
        <div className="p-6 text-sm text-slate-500">Memuat pengaturan…</div>
      </AdminLayout>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Pengaturan Landing Page</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola identitas situs, informasi kontak, dan status pendaftaran yang tampil di web pendaftaran.
          </p>
        </div>

        {notif && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              notif.tipe === "sukses"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {notif.pesan}
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB IDENTITAS ── */}
        {tab === "identitas" && (
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
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
              <textarea rows={3} className={inputClass} value={form.tagline_footer} onChange={(e) => ubah("tagline_footer", e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Teks Copyright</label>
              <input className={inputClass} value={form.teks_copyright} onChange={(e) => ubah("teks_copyright", e.target.value)} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                { jenis: "logo", judul: "Logo Situs", url: urlLogo, ket: "JPG, PNG, WEBP, atau SVG. Maks 2 MB." },
                { jenis: "favicon", judul: "Favicon", url: urlFavicon, ket: "PNG, ICO, atau SVG. Maks 2 MB." },
              ].map((f) => (
                <div key={f.jenis} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">{f.judul}</p>
                  <div className="mt-3 flex h-20 w-full items-center justify-center rounded bg-slate-50">
                    {f.url ? (
                      <img src={f.url} alt={f.judul} className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada file</span>
                    )}
                  </div>
                  <input
                    type="file"
                    className="mt-3 w-full text-xs"
                    onChange={(e) => unggah(f.jenis, e.target.files?.[0])}
                  />
                  <p className="mt-2 text-[11px] text-slate-400">{f.ket}</p>
                  {f.url && (
                    <button onClick={() => hapusFile(f.jenis)} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
                      Hapus file
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB HERO SECTION ── */}
        {tab === "hero" && (
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
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
              <textarea rows={3} className={inputClass} value={form.hero_subjudul} onChange={(e) => ubah("hero_subjudul", e.target.value)} />
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Tombol Utama</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
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

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Tombol Kedua</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
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
          </div>
        )}

        {/* ── TAB SLIDE GAMBAR ── */}
        {tab === "slide" && <KelolaHeroSlide onNotif={tampilkanNotif} />}

        {/* ── TAB BIDANG MAGANG ── */}
        {tab === "bidang" && <KelolaTampilanBidang onNotif={tampilkanNotif} />}

        {/* ── TAB TENTANG & PROFIL ── */}
        {tab === "tentang" && (
          <div className="space-y-6">
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-700">Section "Tentang" di Landing Page</h3>

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
                <textarea rows={3} className={inputClass} value={form.about_paragraf1} onChange={(e) => ubah("about_paragraf1", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Paragraf 2</label>
                <textarea rows={3} className={inputClass} value={form.about_paragraf2} onChange={(e) => ubah("about_paragraf2", e.target.value)} />
              </div>
            </div>

            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-700">Profil Instansi (halaman Tentang)</h3>

              <div>
                <label className={labelClass}>Judul Profil</label>
                <input className={inputClass} value={form.profil_judul} onChange={(e) => ubah("profil_judul", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Deskripsi Profil</label>
                <textarea rows={5} className={inputClass} value={form.profil_deskripsi} onChange={(e) => ubah("profil_deskripsi", e.target.value)} />
              </div>

              <div>
                <label className={labelClass}>Foto Kantor (maks. 5 MB)</label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {urlFotoKantor && (
                    <img src={urlFotoKantor} alt="Foto kantor" className="h-24 w-40 rounded-lg border border-slate-200 object-cover" />
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="text-sm"
                    onChange={(e) => unggah("foto-kantor", e.target.files?.[0])}
                  />
                  {urlFotoKantor && (
                    <button
                      onClick={() => hapusFile("foto-kantor")}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Mengunggah foto baru akan otomatis menghapus foto lama dari server.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-700">Visi & Misi</h3>

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
                <textarea rows={3} className={inputClass} value={form.visi_teks} onChange={(e) => ubah("visi_teks", e.target.value)} />
              </div>

              <p className="text-[11px] text-slate-400">
                Poin-poin Misi dikelola pada tab <b>Konten Daftar → Misi Instansi</b>.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB KONTEN DAFTAR ── */}
        {tab === "konten" && <KelolaKontenLanding onNotif={tampilkanNotif} />}

        {/* ── TAB MENU NAVIGASI ── */}
        {tab === "menu" && <KelolaMenuLanding onNotif={tampilkanNotif} />}

        {/* ── TAB KONTAK ── */}
        {tab === "kontak" && (
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
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

            <div>
              <label className={labelClass}>Alamat Lengkap</label>
              <textarea rows={2} className={inputClass} value={form.alamat_lengkap} onChange={(e) => ubah("alamat_lengkap", e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>URL Embed Google Maps</label>
              <textarea rows={3} className={inputClass} value={form.embed_maps} onChange={(e) => ubah("embed_maps", e.target.value)} />
              <p className="mt-1 text-[11px] text-slate-400">
                Ambil dari Google Maps → Bagikan → Sematkan peta, lalu salin isi atribut <code>src</code> saja.
              </p>
            </div>

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
        )}

        {/* ── TAB STATUS PENDAFTARAN ── */}
        {tab === "status" && (
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                statusEfektif
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <strong>Status saat ini: {statusEfektif ? "Pendaftaran DIBUKA" : "Pendaftaran DITUTUP"}</strong>
              {!statusEfektif && alasanDitutup && <p className="mt-1">{alasanDitutup}</p>}
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.pendaftaran_dibuka}
                onChange={(e) => ubah("pendaftaran_dibuka", e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-700">Buka pendaftaran magang</span>
                <span className="block text-xs text-slate-500">
                  Jika dimatikan, tombol daftar disembunyikan dan pengiriman formulir ditolak oleh server.
                </span>
              </span>
            </label>

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
            <p className="-mt-2 text-[11px] text-slate-400">
              Kosongkan kedua tanggal jika ingin mengatur buka/tutup sepenuhnya secara manual.
            </p>

            <div>
              <label className={labelClass}>Pesan Saat Pendaftaran Ditutup</label>
              <textarea rows={3} className={inputClass} value={form.pesan_ditutup} onChange={(e) => ubah("pesan_ditutup", e.target.value)} />
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.banner_aktif} onChange={(e) => ubah("banner_aktif", e.target.checked)} />
                <span className="text-sm font-semibold text-slate-700">Tampilkan banner pengumuman di landing page</span>
              </label>

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
          </div>
        )}

        {/* ── TAB SEO & BERBAGI ── */}
        {tab === "seo" && (
          <div className="space-y-6">
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-700">Optimasi Mesin Pencari</h3>

              <div>
                <label className={labelClass}>Judul Halaman (Title Tag)</label>
                <input
                  className={inputClass}
                  maxLength={70}
                  value={form.seo_title}
                  onChange={(e) => ubah("seo_title", e.target.value)}
                  placeholder="Portal Pendaftaran | SIM Magang Diskominfo Ponorogo"
                />
                <p className="mt-1 text-[11px] text-slate-400">
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
                <p className="mt-1 text-[11px] text-slate-400">
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
            </div>

            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-700">
                Gambar Saat Link Dibagikan (OG Image)
              </h3>
              <p className="text-xs text-slate-500">
                Gambar ini muncul ketika alamat web dibagikan di WhatsApp, Facebook, atau
                Twitter. Ukuran ideal 1200 × 630 piksel, maksimal 5 MB.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {urlOgImage ? (
                  <img
                    src={urlOgImage}
                    alt="Pratinjau OG"
                    className="h-28 w-52 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-52 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
                    Belum ada gambar
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="text-sm"
                    onChange={(e) => unggah("og-image", e.target.files?.[0])}
                  />
                  {urlOgImage && (
                    <button
                      onClick={() => hapusFile("og-image")}
                      className="block rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Mengunggah gambar baru otomatis menghapus gambar lama dari server.
              </p>
            </div>

            {/* Pratinjau hasil pencarian */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-bold text-slate-700">
                Pratinjau di Hasil Google
              </h3>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] text-emerald-700">
                  simmagang.ponorogo.go.id
                </p>
                <p className="mt-0.5 truncate text-base text-blue-700">
                  {form.seo_title || "Judul halaman belum diisi"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {form.seo_description || "Deskripsi singkat belum diisi."}
                </p>
              </div>
            </div>
          </div>
        )}

        {!TAB_MANDIRI.includes(tab) && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={simpan}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PengaturanLandingPage;