// Panduan penulisan untuk tiap tab pengaturan landing page.
// judul  : judul kartu panduan
// poin   : daftar aturan penulisan singkat
// contoh : contoh isian yang benar (opsional)
// catatan: peringatan penting (opsional)

export const PANDUAN = {
  identitas: {
    judul: "Panduan Identitas & Branding",
    poin: [
      "Nama Situs maksimal 60 karakter, tanpa singkatan yang membingungkan.",
      "Sub Judul berupa satu kalimat penjelas, bukan slogan panjang.",
      "Tagline Footer maksimal 2 baris agar tidak merusak tata letak footer.",
      "Logo: format PNG latar transparan, rasio mendatar, maksimal 2 MB.",
      "Favicon: format PNG/ICO persegi 512×512 piksel, maksimal 2 MB.",
    ],
    contoh: "Portal Pendaftaran Magang Diskominfo Ponorogo",
    catatan: "Mengunggah logo baru otomatis menghapus logo lama dari server.",
  },
  hero: {
    judul: "Panduan Bagian Hero",
    poin: [
      "Judul Hero maksimal 8 kata agar tetap terbaca di layar ponsel.",
      "Gunakan kalimat ajakan, bukan nama instansi yang sudah ada di navbar.",
      "Deskripsi maksimal 2 kalimat (± 160 karakter).",
      "Teks tombol berupa kata kerja singkat: “Daftar Sekarang”, “Lihat Syarat”.",
      "Foto kantor: rasio 16:9, minimal 1280×720 piksel, maksimal 5 MB.",
    ],
    contoh: "Mulai Karier Digitalmu Bersama Diskominfo Ponorogo",
  },
  slide: {
    judul: "Panduan Slide Hero",
    poin: [
      "Idealnya 3–5 slide. Lebih dari itu pengunjung tidak sempat membaca.",
      "Satu slide = satu pesan. Jangan menumpuk banyak informasi.",
      "Gunakan urutan angka kecil untuk slide yang tampil lebih dulu.",
      "Nonaktifkan slide yang sedang tidak dipakai, jangan dihapus.",
      "Gambar: rasio 16:9, maksimal 5 MB, hindari gambar bertulisan kecil.",
    ],
    catatan: "Perubahan pada tab ini tersimpan otomatis per baris.",
  },
  bidang: {
    judul: "Panduan Tampilan Bidang",
    poin: [
      "Nama bidang ditulis lengkap sesuai nomenklatur resmi.",
      "Deskripsi 1–2 kalimat berisi jenis pekerjaan yang akan dikerjakan peserta.",
      "Sembunyikan bidang yang kuotanya sudah penuh agar pendaftar tidak salah pilih.",
      "Ikon dipilih yang paling mewakili, jangan dua bidang memakai ikon sama.",
    ],
    catatan: "Perubahan pada tab ini tersimpan otomatis per baris.",
  },
  tentang: {
    judul: "Panduan Tentang & Profil",
    poin: [
      "Deskripsi Tentang 2–4 kalimat, sudut pandang instansi (“Kami…”).",
      "Visi ditulis satu kalimat utuh tanpa penomoran.",
      "Misi ditulis satu poin per baris — pisahkan dengan menekan Enter.",
      "Hindari menyalin-tempel dari dokumen Word (bawa format tersembunyi).",
    ],
    contoh: "Misi:\nMeningkatkan kualitas layanan informasi publik\nMengembangkan SDM bidang teknologi informasi",
  },
  konten: {
    judul: "Panduan Konten Daftar",
    poin: [
      "Persyaratan: tulis satu syarat per item, diawali kata benda.",
      "Alur Pendaftaran: urutkan kronologis, maksimal 6 langkah.",
      "Benefit: fokus pada manfaat nyata bagi peserta, bukan promosi instansi.",
      "Panjang ideal tiap item 5–15 kata.",
      "Nonaktifkan item yang tidak berlaku, jangan dihapus, agar riwayat tetap ada.",
    ],
    catatan: "Perubahan pada tab ini tersimpan otomatis per baris.",
  },
  menu: {
    judul: "Panduan Menu Navigasi",
    poin: [
      "Label navbar maksimal 2 kata agar tidak turun ke baris kedua.",
      "Label footer boleh sedikit lebih panjang dan deskriptif.",
      "Urutan angka kecil tampil lebih dulu, dari kiri ke kanan.",
      "Menu “Beranda” sebaiknya selalu aktif dan berada di urutan pertama.",
      "Label tidak boleh dikosongkan — sistem akan menolak penyimpanan.",
    ],
    catatan: "Perubahan pada tab ini tersimpan otomatis per baris.",
  },
  kontak: {
    judul: "Panduan Kontak & Media Sosial",
    poin: [
      "Telepon memakai format +62, contoh: +62 352 481 234.",
      "Email gunakan alamat resmi instansi, bukan email pribadi.",
      "Alamat ditulis lengkap sampai kode pos.",
      "Tautan media sosial harus lengkap diawali https://",
      "Kosongkan kolom media sosial yang tidak dimiliki agar ikonnya tersembunyi.",
    ],
    contoh: "https://www.instagram.com/diskominfoponorogo",
  },
  status: {
    judul: "Panduan Status Pendaftaran",
    poin: [
      "Tanggal Tutup wajib lebih besar dari Tanggal Buka.",
      "Isi Kuota sesuai kemampuan pembimbingan, bukan angka optimis.",
      "Tulis pesan penutupan yang informatif, sertakan perkiraan gelombang berikutnya.",
      "Periksa kembali sebelum menyimpan — perubahan langsung tampil ke publik.",
    ],
    catatan: "Menutup pendaftaran akan menyembunyikan tombol daftar di landing page.",
  },
  seo: {
    judul: "Panduan SEO & Berbagi",
    poin: [
      "SEO Title 50–60 karakter, letakkan kata kunci utama di depan.",
      "SEO Description 120–160 karakter, berupa kalimat utuh yang mengajak.",
      "Keywords dipisah koma, cukup 5–8 kata kunci yang relevan.",
      "Gambar Berbagi (OG Image): rasio 1200×630 piksel, maksimal 5 MB.",
      "Hindari mengulang kata kunci berlebihan — justru menurunkan peringkat.",
    ],
    contoh: "Pendaftaran Magang Diskominfo Ponorogo 2026",
  },
};