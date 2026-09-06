import * as XLSX from "xlsx";

/**
 * Ekspor data analitik FAQ ke workbook Excel multi-sheet.
 * @param {Object} analitikData - Data analitik dari API
 * @param {string} fileName - Nama file Excel luaran
 */
export const exportAnalitikFaqToExcel = (analitikData, fileName = "laporan-analitik-faq") => {
  const r = analitikData?.ringkasan || {};
  const workbook = XLSX.utils.book_new();

  // ── Sheet 1: Ringkasan & Kategori ──
  const ringkasanRows = [
    { Indikator: "Total FAQ", Nilai: r.total_faq ?? 0, Keterangan: `${r.faq_aktif ?? 0} aktif, ${r.faq_quick_action ?? 0} quick action` },
    { Indikator: "Total Jawaban Ditampilkan", Nilai: r.total_tayang ?? 0, Keterangan: "Sejak penghitung dipasang" },
    { Indikator: "Rasio Jawaban Membantu", Nilai: `${Math.round(r.rasio_membantu ?? 0)}%`, Keterangan: `${r.total_membantu ?? 0} suka / ${r.total_penilaian ?? 0} total penilaian` },
    { Indikator: "Total Pertanyaan Masuk", Nilai: r.total_pertanyaan ?? 0, Keterangan: `${r.pertanyaan_baru ?? 0} belum ditangani` },
  ];

  const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanRows);
  wsRingkasan["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, wsRingkasan, "Ringkasan Statistik");

  // ── Sheet 2: Paling Sering Tampil ──
  const terpopuler = analitikData?.terpopuler || [];
  const terpopulerRows = terpopuler.map((f, i) => {
    const total = (f.helpful_count || 0) + (f.unhelpful_count || 0);
    return {
      Peringkat: i + 1,
      Pertanyaan: f.question,
      Kategori: f.category || "Umum",
      "Total Tayang": f.view_count || 0,
      "Dinilai Membantu": f.helpful_count || 0,
      "Dinilai Tidak Membantu": f.unhelpful_count || 0,
      "Rasio Kepuasan": total > 0 ? `${Math.round((f.helpful_count / total) * 100)}%` : "Belum dinilai",
    };
  });

  const wsTerpopuler = XLSX.utils.json_to_sheet(terpopulerRows.length > 0 ? terpopulerRows : [{ Keterangan: "Belum ada data FAQ yang pernah tampil" }]);
  wsTerpopuler["!cols"] = [{ wch: 10 }, { wch: 45 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, wsTerpopuler, "Paling Sering Tampil");

  // ── Sheet 3: Celah Pengetahuan ──
  const celah = analitikData?.celah || [];
  const celahRows = celah.map((c, i) => ({
    No: i + 1,
    "Pertanyaan Peserta": c.pertanyaan,
    "Frekuensi Ditanyakan": c.jumlah_serupa || 1,
    "Skor Kemiripan Tertinggi": c.skor_tertinggi ? `${Math.round(c.skor_tertinggi * 100)}%` : "-",
    Status: c.status === "baru" ? "Belum Ditangani" : "Sedang Diproses",
    "Tanggal Masuk": c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID") : "-",
  }));

  const wsCelah = XLSX.utils.json_to_sheet(celahRows.length > 0 ? celahRows : [{ Keterangan: "Tidak ada celah pertanyaan yang menggantung" }]);
  wsCelah["!cols"] = [{ wch: 6 }, { wch: 50 }, { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, wsCelah, "Celah Pengetahuan");

  // ── Sheet 4: Tren Harian ──
  const trenPertanyaan = analitikData?.tren_pertanyaan || [];
  const trenNegatif = analitikData?.tren_negatif || [];
  const mapNegatif = {};
  trenNegatif.forEach((tn) => { mapNegatif[tn.tanggal] = tn.jumlah; });

  const trenRows = trenPertanyaan.map((tp) => ({
    Tanggal: tp.tanggal,
    "Pertanyaan Gagal Dijawab Bot": tp.jumlah || 0,
    "Jawaban Dinilai Tidak Membantu": mapNegatif[tp.tanggal] || 0,
  }));

  const wsTren = XLSX.utils.json_to_sheet(trenRows.length > 0 ? trenRows : [{ Keterangan: "Tidak ada data tren pada periode ini" }]);
  wsTren["!cols"] = [{ wch: 16 }, { wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, wsTren, "Tren Harian");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};
