/**
 * Aturan penerjemahan geseran mouse di pratinjau menjadi angka tata letak.
 *
 * Batas nilai di bawah ini HARUS sama dengan fungsi normalisasi() pada
 * backend/services/tata_letak_surat.go. Kalau nilai keluar batas, backend
 * mengembalikannya ke nilai bawaan — pengguna akan melihat blok "melompat".
 */

export const BATAS = {
  margin_kiri: [5, 80],
  margin_kanan: [5, 80],
  margin_atas: [5, 80],
  margin_bawah: [5, 60],

  ukuran_font_isi: [6, 20],
  ukuran_font_judul: [6, 24],
  ukuran_font_kop: [6, 24],
  ukuran_font_alamat: [5, 16],
  tinggi_baris: [3, 12],
  jarak_paragraf: [0, 20],

  kop_x: [0, 150],
  kop_lebar: [60, 210],
  logo_x: [0, 190],
  logo_y: [0, 100],
  logo_lebar: [5, 60],
  garis_kop_tebal: [0.1, 3],
  jarak_setelah_kop: [0, 40],
  jarak_setelah_judul: [0, 40],

  indent_tujuan: [0, 60],
  jarak_setelah_isi: [0, 30],
  indent_data: [0, 60],
  lebar_label_data: [20, 90],

  ttd_x: [0, 190],
  ttd_lebar: [40, 190],
  ruang_ttd: [5, 70],
  ttd_gambar_lebar: [10, 90],
  ttd_gambar_geser_x: [-60, 60],
  ttd_gambar_geser_y: [-30, 30],
  stempel_lebar: [10, 90],
  stempel_geser_x: [-80, 80],
  stempel_geser_y: [-40, 40],
};

/** Nama ramah untuk ditampilkan pada tanda geser. */
export const LABEL_FIELD = {
  margin_kiri: "Margin kiri",
  margin_kanan: "Margin kanan",
  margin_atas: "Margin atas",
  margin_bawah: "Margin bawah",
  kop_x: "Kop X",
  kop_lebar: "Lebar kop",
  logo_x: "Logo X",
  logo_y: "Logo Y",
  logo_lebar: "Lebar logo",
  jarak_setelah_kop: "Jarak setelah kop",
  jarak_setelah_judul: "Jarak setelah judul",
  indent_tujuan: "Indentasi tujuan",
  indent_data: "Indentasi data",
  lebar_label_data: "Lebar kolom label",
  jarak_setelah_isi: "Jarak sebelum TTD",
  ttd_x: "Jarak TTD dari kiri",
  ttd_lebar: "Lebar blok TTD",
  ruang_ttd: "Tinggi ruang TTD",
  ttd_gambar_lebar: "Lebar gambar TTD",
  ttd_gambar_geser_x: "Geser TTD X",
  ttd_gambar_geser_y: "Geser TTD Y",
  stempel_lebar: "Lebar stempel",
  stempel_geser_x: "Geser stempel X",
  stempel_geser_y: "Geser stempel Y",
};

/** Bulatkan ke kelipatan tertentu supaya angkanya enak dibaca. */
export const bulatkan = (nilai, kelipatan = 0.5) =>
  Math.round(nilai / kelipatan) * kelipatan;

/** Jaga nilai tetap di dalam batas yang diterima backend. */
export const jepit = (field, nilai) => {
  const batas = BATAS[field];
  if (!batas) return nilai;
  const [min, max] = batas;
  if (Number.isNaN(nilai)) return min;
  return Math.min(max, Math.max(min, nilai));
};

/**
 * Aturan tambahan backend: blok TTD tidak boleh keluar kertas.
 * Diterapkan juga di sini supaya angka di panel kiri tidak berbeda dengan
 * hasil simpan.
 */
export const rapikan = (tl) => {
  const hasil = { ...tl };
  const marginKanan = Number(hasil.margin_kanan) || 0;
  const ttdX = Number(hasil.ttd_x) || 0;
  const ttdLebar = Number(hasil.ttd_lebar) || 0;
  if (ttdX + ttdLebar > 210 - marginKanan + 5) {
    hasil.ttd_lebar = jepit("ttd_lebar", bulatkan(210 - marginKanan - ttdX));
  }
  return hasil;
};

/**
 * Terapkan geseran satu blok.
 *
 * @param {object} tl     tata letak saat ini
 * @param {object} blok   blok dari peta backend (punya sumbu_x/sumbu_y/sumbu_w)
 * @param {number} dxMm   pergeseran horizontal dalam mm sejak drag dimulai
 * @param {number} dyMm   pergeseran vertikal dalam mm sejak drag dimulai
 * @param {object} awal   salinan tata letak saat drag dimulai
 * @param {object} opsi   { resize: true } untuk menarik gagang lebar
 */
export const terapkanGeser = (tl, blok, dxMm, dyMm, awal, { resize = false } = {}) => {
  const hasil = { ...tl };

  if (resize) {
    if (blok.sumbu_w) {
      const dasar = Number(awal[blok.sumbu_w]) || 0;
      hasil[blok.sumbu_w] = jepit(blok.sumbu_w, bulatkan(dasar + dxMm));
    }
    return rapikan(hasil);
  }

  if (blok.sumbu_x) {
    const dasar = Number(awal[blok.sumbu_x]) || 0;
    const arah = blok.arah_x || 1;
    hasil[blok.sumbu_x] = jepit(blok.sumbu_x, bulatkan(dasar + dxMm * arah));
  }
  if (blok.sumbu_y) {
    const dasar = Number(awal[blok.sumbu_y]) || 0;
    const arah = blok.arah_y || 1;
    hasil[blok.sumbu_y] = jepit(blok.sumbu_y, bulatkan(dasar + dyMm * arah));
  }
  return rapikan(hasil);
};

/** Geser satu field margin (dipakai gagang garis tepi kertas). */
export const geserMargin = (tl, field, deltaMm, awal) => {
  const dasar = Number(awal[field]) || 0;
  return rapikan({ ...tl, [field]: jepit(field, bulatkan(dasar + deltaMm)) });
};

/** Cari target snap terdekat; null bila tidak ada yang cukup dekat. */
export const snapTerdekat = (nilai, targets, toleransi = 1.2) => {
  let terbaik = null;
  let jarakTerbaik = toleransi;
  for (const t of targets) {
    if (typeof t !== "number" || Number.isNaN(t)) continue;
    const j = Math.abs(nilai - t);
    if (j <= jarakTerbaik) {
      terbaik = Math.round(t * 10) / 10;
      jarakTerbaik = j;
    }
  }
  return terbaik;
};

/**
 * Kumpulan garis bantu: tepi margin, tengah kertas, dan tepi blok lain.
 */
export const garisBantu = (peta, tl, idAktif) => {
  const x = [
    Number(tl.margin_kiri) || 0,
    210 - (Number(tl.margin_kanan) || 0),
    105,
  ];
  const y = [
    Number(tl.margin_atas) || 0,
    297 - (Number(tl.margin_bawah) || 0),
  ];
  for (const b of peta?.blok || []) {
    if (b.id === idAktif) continue;
    x.push(b.x, b.x + b.w);
    y.push(b.y, b.y + b.h);
  }
  return { x, y };
};