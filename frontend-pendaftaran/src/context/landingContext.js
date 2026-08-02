import { createContext, useContext } from "react";

// Nilai cadangan: dipakai bila API belum siap, supaya tampilan tidak pernah kosong.
export const FALLBACK = {
  identitas: {
    nama_situs: "SIM MAGANG",
    sub_judul_situs: "DISKOMINFO PONOROGO",
    logo: "",
    favicon: "",
    tagline_footer:
      "Mencetak talenta digital masa depan pemerintahan yang kompeten melalui program magang berkualitas di Kabupaten Ponorogo.",
    teks_copyright: "",
  },
  kontak: {
    email: "diskominfo@ponorogo.go.id",
    telepon: "(0352) 481845",
    gedung: "Gedung Graha Krida Praja Lt. 4",
    alamat: "Jl. Aloon-Aloon Utara No. 4, Ponorogo, Jawa Timur",
    jam_layanan: "Senin - Jumat | 07:30 - 16:00 WIB",
    embed_maps: "",
  },
  sosial_media: { instagram: "", facebook: "", youtube: "", website: "" },
  pendaftaran: { dibuka: true, pesan_ditutup: "" },
  banner: { aktif: false, teks: "", tipe: "info" },
  hero: {
    badge: "⚡ Pendaftaran Magang",
    judul: "Bangun Karier Digitalmu di",
    judul_highlight: "Diskominfo Ponorogo",
    subjudul:
      "Bergabunglah dalam transformasi digital menuju Sistem Pemerintahan Berbasis Elektronik (SPBE). Dapatkan pengalaman nyata melayani publik melalui teknologi informasi.",
    cta_teks: "Daftar Magang Sekarang",
    cta_link: "/pilih-pendaftaran",
    cta_tutup_teks: "Pendaftaran Sedang Ditutup",
    cta2_teks: "Lihat Program",
    cta2_link: "/program-magang",
  },
  hero_slides: [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80",
  ],
  bidang: [],
  konten: {
    persyaratan: [],
    dokumen: [],
    alur: [],
    benefit: [],
    misi: [],
    tujuan: [],
    keunggulan: [],
  },
  tentang: {
    about_badge: "Mengenal Kami",
    about_judul: "Tentang Program Magang",
    about_paragraf1: "",
    about_paragraf2: "",
    profil_judul: "Dinas Komunikasi, Informatika dan Statistik Ponorogo",
    profil_deskripsi: "",
    foto_kantor: "",
    visi_judul: "Visi Diskominfotik",
    visi_teks: "",
    misi_judul: "Misi Diskominfotik",
  },
  seo: {
    title: "Portal Pendaftaran | SIM Magang Diskominfo Ponorogo",
    description: "",
    keywords: "",
    og_image: "",
  },
  menu: {
    navbar: [
      { kode: "beranda", label: "Beranda", path: "/" },
      { kode: "tentang", label: "Tentang", path: "/tentang" },
      { kode: "program-magang", label: "Program Magang", path: "/program-magang" },
      { kode: "persyaratan", label: "Persyaratan", path: "/persyaratan" },
      { kode: "faq", label: "FAQ", path: "/faq" },
      { kode: "kontak", label: "Kontak", path: "/kontak" },
    ],
    footer: [
      { kode: "beranda", label: "Beranda Portal", path: "/" },
      { kode: "tentang", label: "Tentang Program", path: "/tentang" },
      { kode: "program-magang", label: "Pilihan Bidang Magang", path: "/program-magang" },
      { kode: "persyaratan", label: "Ketentuan & Syarat", path: "/persyaratan" },
      { kode: "faq", label: "Pertanyaan Populer (FAQ)", path: "/faq" },
    ],
  },
};

export const LandingContext = createContext({ config: FALLBACK, loading: true });

export const useLanding = () => useContext(LandingContext);