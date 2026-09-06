import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Ekspor data analitik FAQ ke dokumen PDF resmi ber-kop Diskominfo.
 * @param {Object} analitikData - Data analitik dari API (ringkasan, terpopuler, celah, tren, kategori, jumlah_hari)
 * @param {string} fileName - Nama file PDF luaran
 */
export const exportAnalitikFaqToPdf = (analitikData, fileName = "laporan-analitik-faq") => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const r = analitikData?.ringkasan || {};
  const hari = analitikData?.jumlah_hari || 30;
  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Header / Kop Dokumen ──
  doc.setFillColor(11, 20, 66);
  doc.rect(0, 0, pageWidth, 55, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN ANALITIK FAQ & CHATBOT", 40, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text("Sistem Informasi Manajemen Magang - Diskominfo", 40, 45);

  let currentY = 75;

  // Metadata Cetak
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${tanggalCetak}   |   Periode Tren: ${hari} Hari Terakhir`, 40, currentY);
  currentY += 18;

  // ── 1. Ringkasan Statistik Utama ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 20, 66);
  doc.text("1. Ringkasan Statistik Kumulatif", 40, currentY);
  currentY += 8;

  const summaryData = [
    [
      "Total FAQ Terdaftar",
      `${r.total_faq ?? 0} FAQ (${r.faq_aktif ?? 0} aktif, ${r.faq_quick_action ?? 0} quick action)`,
      "Total Jawaban Ditampilkan",
      `${r.total_tayang ?? 0} kali`,
    ],
    [
      "Rasio Jawaban Membantu",
      r.rasio_membantu !== null && r.rasio_membantu !== undefined
        ? `${Math.round(r.rasio_membantu)}% (${r.total_membantu ?? 0} suka / ${r.total_penilaian ?? 0} ulasan)`
        : "Belum ada penilaian",
      "Pertanyaan Masuk (Bot)",
      `${r.total_pertanyaan ?? 0} (${r.pertanyaan_baru ?? 0} belum ditangani)`,
    ],
  ];

  autoTable(doc, {
    body: summaryData,
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 140, textColor: [100, 116, 139] },
      1: { cellWidth: 140, fontStyle: "bold" },
      2: { fontStyle: "bold", cellWidth: 130, textColor: [100, 116, 139] },
      3: { cellWidth: 105, fontStyle: "bold" },
    },
    margin: { left: 40, right: 40 },
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // ── 2. Top 10 FAQ Paling Sering Tampil ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 20, 66);
  doc.text("2. FAQ Paling Sering Tampil (Jawaban Andalan)", 40, currentY);
  currentY += 8;

  const terpopuler = analitikData?.terpopuler || [];
  const rowsTerpopuler = terpopuler.map((f, i) => {
    const total = (f.helpful_count || 0) + (f.unhelpful_count || 0);
    const rasio = total > 0 ? `${Math.round((f.helpful_count / total) * 100)}%` : "-";
    return [
      String(i + 1),
      f.question || "-",
      f.category || "Umum",
      `${f.view_count || 0} tayang`,
      rasio,
    ];
  });

  if (rowsTerpopuler.length === 0) {
    rowsTerpopuler.push(["-", "Belum ada data FAQ yang ditampilkan", "-", "-", "-"]);
  }

  autoTable(doc, {
    head: [["No", "Pertanyaan FAQ", "Kategori", "Tayang", "Kepuasan (👍)"]],
    body: rowsTerpopuler,
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [11, 20, 66], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      1: { cellWidth: 285 },
      2: { cellWidth: 85 },
      3: { cellWidth: 60, halign: "center" },
      4: { cellWidth: 60, halign: "center" },
    },
    margin: { left: 40, right: 40 },
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // ── 3. Celah Pengetahuan (Pertanyaan Belum Terjawab Bot) ──
  // Periksa apakah muat di halaman 1 atau buat halaman baru
  if (currentY > 640) {
    doc.addPage();
    currentY = 40;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 20, 66);
  doc.text("3. Celah Pengetahuan (Pertanyaan Menggantung / Belum Terjawab)", 40, currentY);
  currentY += 8;

  const celah = analitikData?.celah || [];
  const rowsCelah = celah.map((c, i) => [
    String(i + 1),
    c.pertanyaan || "-",
    `${c.jumlah_serupa || 1} kali diajukan`,
    c.status === "baru" ? "Belum Ditangani" : "Sedang Diproses",
  ]);

  if (rowsCelah.length === 0) {
    rowsCelah.push(["-", "Bagus — tidak ada pertanyaan peserta yang menggantung", "-", "-"]);
  }

  autoTable(doc, {
    head: [["No", "Pertanyaan Peserta", "Frekuensi", "Status"]],
    body: rowsCelah,
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      1: { cellWidth: 330 },
      2: { cellWidth: 80, halign: "center" },
      3: { cellWidth: 80, halign: "center" },
    },
    margin: { left: 40, right: 40 },
  });

  // Footer halaman & nomor halaman
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount} — Dokumen Resmi SIM Magang Diskominfo`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileName}-${dateStr}.pdf`);
};
