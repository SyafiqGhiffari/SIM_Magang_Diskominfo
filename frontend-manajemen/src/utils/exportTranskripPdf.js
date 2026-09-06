import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getFileUrl } from "./fileUrl";
import { getTemplateRaporAktif } from "../services/templateRaporService";

const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Helper untuk memuat gambar ke format Data URL secara aman
 */
const loadImageToDataUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || 100;
        c.height = img.naturalHeight || 100;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/**
 * Membangun dokumen jsPDF Transkrip Nilai Magang Resmi Diskominfo Ponorogo
 * Mengintegrasikan konfigurasi template rapor aktif (kop, tanda tangan, stempel, dan tata letak).
 * @param {Object} data - Objek data peserta, penilaian, mentor, instansi, dan template_rapor
 * @returns {Promise<jsPDF>}
 */
export const buildTranskripNilaiPdfDoc = async (data) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const p = data?.peserta || {};
  const pn = data?.penilaian || {};
  const m = data?.mentor || {};
  const instansi = data?.instansi || {};

  // Ambil konfigurasi template rapor aktif
  let tpl = data?.template_rapor || null;
  if (!tpl) {
    try {
      const resTpl = await getTemplateRaporAktif();
      tpl = resTpl.data?.data || null;
    } catch {
      tpl = null;
    }
  }

  // Parse layout konfigurasi template
  let layoutConfig = {
    tampilkan_bobot: true,
    tampilkan_qr: true,
    tampilkan_catatan_mentor: true,
    tampilkan_garis_kop: true,
  };
  try {
    if (tpl?.konfigurasi_tata_letak) {
      const parsed = typeof tpl.konfigurasi_tata_letak === "string"
        ? JSON.parse(tpl.konfigurasi_tata_letak)
        : tpl.konfigurasi_tata_letak;
      layoutConfig = { ...layoutConfig, ...parsed };
    }
  } catch {
    // default
  }

  // Identitas Kop
  const namaPemda = (tpl?.nama_pemerintah || instansi.nama_pemerintah || "PEMERINTAH KABUPATEN PONOROGO").toUpperCase();
  const namaDinas = (tpl?.nama_instansi || instansi.nama_instansi || "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK").toUpperCase();
  const barisKop = [
    tpl?.alamat_instansi || "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
    [tpl?.telepon || "Telepon 0352–3592999", tpl?.faksimile || "Faksimile 0352–3592999"].filter(Boolean).join(", "),
    [tpl?.laman || "Laman kominfo.ponorogo.go.id", tpl?.pos_el || "Pos-el kominfo@ponorogo.go.id"].filter(Boolean).join(", "),
  ].filter(Boolean);

  // Parse detail nilai jika ada
  let detailItems = [];
  try {
    if (typeof pn.detail_nilai === "string") {
      detailItems = JSON.parse(pn.detail_nilai || "[]");
    } else if (Array.isArray(pn.detail_nilai)) {
      detailItems = pn.detail_nilai;
    }
  } catch {
    detailItems = [];
  }

  // ─────────────────────────────────────────────────────────────
  // 1. KOP SURAT RESMI
  // ─────────────────────────────────────────────────────────────
  const logoUrl = tpl?.file_logo ? getFileUrl(tpl.file_logo) : (getFileUrl(instansi.logo) || "/images/icon-diskominfo.png");
  const logoDataUrl = await loadImageToDataUrl(logoUrl);
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin + 12, 23, 42, 46);
    } catch {
      // ignore
    }
  }

  const textCenterX = (pageWidth / 2) + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 20, 66);
  doc.text(namaPemda, textCenterX, 33, { align: "center" });

  doc.setFontSize(12.5);
  doc.text(namaDinas, textCenterX, 46, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let kopY = 56;
  barisKop.forEach((b) => {
    doc.text(b, textCenterX, kopY, { align: "center" });
    kopY += 8.5;
  });

  // Garis ganda pembatas kop dengan jarak proporsional
  const garisY = kopY + 3;
  if (layoutConfig.tampilkan_garis_kop !== false) {
    doc.setLineWidth(1.8);
    doc.setDrawColor(11, 20, 66);
    doc.line(margin, garisY, pageWidth - margin, garisY);
    doc.setLineWidth(0.6);
    doc.line(margin, garisY + 2.5, pageWidth - margin, garisY + 2.5);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. JUDUL DOKUMEN & NOMOR (Jarak proposional di bawah garis)
  // ─────────────────────────────────────────────────────────────
  let currentY = garisY + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(11, 20, 66);
  doc.text(tpl?.judul_dokumen || "TRANSKRIP NILAI HASIL MAGANG", pageWidth / 2, currentY, { align: "center" });

  currentY += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  const formatNomorRaw = tpl?.format_nomor || "560/TRN-{nomor}/405.08/{tahun}";
  const nomorSurat = formatNomorRaw
    .replace("{nomor}", String(pn.id || 1).padStart(4, "0"))
    .replace("{tahun}", String(new Date().getFullYear()));

  doc.text(`Nomor: ${nomorSurat}`, pageWidth / 2, currentY, { align: "center" });

  currentY += 15;

  // ─────────────────────────────────────────────────────────────
  // 3. BIODATA PESERTA MAGANG
  // ─────────────────────────────────────────────────────────────
  const biodataRows = [
    ["Nama Peserta", ": " + (p.nama || "-"), "Bidang Magang", ": " + (p.bidang || "-")],
    ["NIM / NISN", ": " + (p.nim || p.nomor_induk || "-"), "Mentor Pembimbing", ": " + (m.nama || "Mentor Diskominfo")],
    ["Instansi / Kampus", ": " + (p.institusi || p.asal_institusi || "-"), "Periode Magang", ": " + `${fmtDate(p.tanggal_mulai)} s.d. ${fmtDate(p.tanggal_selesai)}`],
    ["Program Studi / Jurusan", ": " + (p.jurusan || "-"), "Status Kelulusan", ": Selesai Magang"],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: biodataRows,
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      textColor: [30, 41, 59],
      font: "helvetica",
    },
    columnStyles: {
      0: { cellWidth: 105, fontStyle: "bold" },
      1: { cellWidth: 160 },
      2: { cellWidth: 105, fontStyle: "bold" },
      3: { cellWidth: 155 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // ─────────────────────────────────────────────────────────────
  // 4. TABEL NILAI 4 PILAR KOMPETENSI
  // ─────────────────────────────────────────────────────────────
  const tableBody = [];

  // Group I: Profesional
  tableBody.push([
    { content: "", styles: { fillColor: [241, 245, 249] } },
    {
      content: "I. KOMPETENSI PROFESIONAL",
      colSpan: 3,
      styles: { fontStyle: "bold", halign: "left", fillColor: [241, 245, 249], textColor: [11, 20, 66] },
    },
  ]);
  const profItems = detailItems.filter((x) => x.kategori === "profesional" || x.id?.startsWith("prof_"));
  const defaultProf = [
    { teks: "Kemampuan memahami tugas yang diberikan", nilai: pn.nilai_profesional || 0 },
    { teks: "Kemampuan melaksanakan tugas", nilai: pn.nilai_profesional || 0 },
    { teks: "Kemampuan menyelesaikan tugas tepat waktu", nilai: pn.nilai_profesional || 0 },
    { teks: "Kualitas hasil pekerjaan", nilai: pn.nilai_profesional || 0 },
  ];
  const listProf = profItems.length > 0 ? profItems : defaultProf;
  listProf.forEach((item, idx) => {
    tableBody.push([
      idx + 1,
      item.teks,
      Number(item.nilai || 0).toFixed(2),
      item.indeks || (item.nilai >= 85 ? "A" : item.nilai >= 75 ? "B" : "C"),
    ]);
  });
  tableBody.push([
    { content: `Rata-rata Kompetensi Profesional`, colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [248, 250, 252] } },
    { content: Number(pn.nilai_profesional || 0).toFixed(2), styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
    { content: pn.nilai_profesional >= 85 ? "A" : pn.nilai_profesional >= 75 ? "B" : "C", styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
  ]);

  // Group II: Personal
  tableBody.push([
    { content: "", styles: { fillColor: [241, 245, 249] } },
    {
      content: "II. KOMPETENSI PERSONAL",
      colSpan: 3,
      styles: { fontStyle: "bold", halign: "left", fillColor: [241, 245, 249], textColor: [11, 20, 66] },
    },
  ]);
  const persItems = detailItems.filter((x) => x.kategori === "personal" || x.id?.startsWith("pers_"));
  const defaultPers = [
    { teks: "Disiplin dan kepatuhan jam kerja magang", nilai: pn.nilai_personal || 0 },
    { teks: "Inisiatif dan kemandirian dalam bekerja", nilai: pn.nilai_personal || 0 },
    { teks: "Tanggung jawab atas tugas yang diberikan", nilai: pn.nilai_personal || 0 },
    { teks: "Sikap, etika, dan integritas kerja", nilai: pn.nilai_personal || 0 },
  ];
  const listPers = persItems.length > 0 ? persItems : defaultPers;
  listPers.forEach((item, idx) => {
    tableBody.push([
      idx + 1,
      item.teks,
      Number(item.nilai || 0).toFixed(2),
      item.indeks || (item.nilai >= 85 ? "A" : item.nilai >= 75 ? "B" : "C"),
    ]);
  });
  tableBody.push([
    { content: `Rata-rata Kompetensi Personal`, colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [248, 250, 252] } },
    { content: Number(pn.nilai_personal || 0).toFixed(2), styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
    { content: pn.nilai_personal >= 85 ? "A" : pn.nilai_personal >= 75 ? "B" : "C", styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
  ]);

  // Group III: Sosial
  tableBody.push([
    { content: "", styles: { fillColor: [241, 245, 249] } },
    {
      content: "III. KOMPETENSI SOSIAL",
      colSpan: 3,
      styles: { fontStyle: "bold", halign: "left", fillColor: [241, 245, 249], textColor: [11, 20, 66] },
    },
  ]);
  const sosItems = detailItems.filter((x) => x.kategori === "sosial" || x.id?.startsWith("sos_"));
  const defaultSos = [
    { teks: "Kemampuan komunikasi dan adaptasi lingkungan", nilai: pn.nilai_sosial || 0 },
    { teks: "Kemampuan kerja sama tim (teamwork)", nilai: pn.nilai_sosial || 0 },
    { teks: "Menghargai rekan kerja dan staf dinas", nilai: pn.nilai_sosial || 0 },
  ];
  const listSos = sosItems.length > 0 ? sosItems : defaultSos;
  listSos.forEach((item, idx) => {
    tableBody.push([
      idx + 1,
      item.teks,
      Number(item.nilai || 0).toFixed(2),
      item.indeks || (item.nilai >= 85 ? "A" : item.nilai >= 75 ? "B" : "C"),
    ]);
  });
  tableBody.push([
    { content: `Rata-rata Kompetensi Sosial`, colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [248, 250, 252] } },
    { content: Number(pn.nilai_sosial || 0).toFixed(2), styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
    { content: pn.nilai_sosial >= 85 ? "A" : pn.nilai_sosial >= 75 ? "B" : "C", styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
  ]);

  // Group IV: Administratif
  tableBody.push([
    { content: "", styles: { fillColor: [241, 245, 249] } },
    {
      content: "IV. KOMPETENSI ADMINISTRATIF & LAPORAN",
      colSpan: 3,
      styles: { fontStyle: "bold", halign: "left", fillColor: [241, 245, 249], textColor: [11, 20, 66] },
    },
  ]);
  const defaultAdm = [
    { teks: "Kedisiplinan Presensi Kehadiran", nilai: pn.skor_presensi || pn.nilai_administratif || 0 },
    { teks: "Ketertiban Pengisian Logbook Jurnal Harian", nilai: pn.skor_logbook || pn.nilai_administratif || 0 },
    { teks: "Penyelesaian Penugasan Mandiri", nilai: pn.skor_tugas || pn.nilai_administratif || 0 },
    { teks: "Kualitas & Persetujuan Laporan Akhir Magang", nilai: pn.skor_laporan || pn.nilai_administratif || 0 },
  ];
  defaultAdm.forEach((item, idx) => {
    tableBody.push([
      idx + 1,
      item.teks,
      Number(item.nilai || 0).toFixed(2),
      item.nilai >= 85 ? "A" : item.nilai >= 75 ? "B" : "C",
    ]);
  });
  tableBody.push([
    { content: `Rata-rata Kompetensi Administratif`, colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [248, 250, 252] } },
    { content: Number(pn.nilai_administratif || 0).toFixed(2), styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
    { content: pn.nilai_administratif >= 85 ? "A" : pn.nilai_administratif >= 75 ? "B" : "C", styles: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] } },
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["No", "Komponen & Butir Penilaian Magang", "Nilai (0-100)", "Mutu"]],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3.5, right: 3.5 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [11, 20, 66],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      1: { cellWidth: 350 },
      2: { cellWidth: 80, halign: "center" },
      3: { cellWidth: 68, halign: "center" },
    },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // ─────────────────────────────────────────────────────────────
  // 5. RINGKASAN NILAI AKHIR (KOTAK RESMI)
  // ─────────────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 54, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(11, 20, 66);
  doc.text("RINGKASAN NILAI AKHIR MAGANG", margin + 10, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const nilaiAkhirStr = Number(pn.nilai_akhir_angka || 0).toFixed(2);
  const indeksStr = pn.indeks_nilai_akhir || "A";
  const predikatStr = pn.predikat_akhir || "Sangat Baik";

  doc.text(`• Nilai Akhir Kumulatif : `, margin + 10, currentY + 28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 20, 66);
  doc.text(`${nilaiAkhirStr} (Skala 100)`, margin + 110, currentY + 28);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`• Indeks Huruf Mutu   : `, margin + 10, currentY + 42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 20, 66);
  doc.text(`${indeksStr}`, margin + 110, currentY + 42);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`• Predikat Kelulusan  : `, margin + 220, currentY + 28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(`${predikatStr}`, margin + 310, currentY + 28);

  if (layoutConfig.tampilkan_catatan_mentor !== false && pn.catatan_mentor) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`"Catatan: ${pn.catatan_mentor}"`, margin + 220, currentY + 42, { maxWidth: 280 });
  }

  // Jarak renggang yang rapi menuju tabel bobot & tanda tangan
  currentY += 76;

  // ─────────────────────────────────────────────────────────────
  // 6. TABEL BOBOT PENILAIAN (KIRI) & TANDA TANGAN KEPALA DINAS (KANAN)
  // ─────────────────────────────────────────────────────────────
  if (layoutConfig.tampilkan_bobot !== false) {
    const bobotTableBody = [
      ["1", "Kompetensi Profesional", `${pn.bobot_profesional || 35}%`],
      ["2", "Kompetensi Personal", `${pn.bobot_personal || 25}%`],
      ["3", "Kompetensi Sosial", `${pn.bobot_sosial || 20}%`],
      ["4", "Kompetensi Administratif & Laporan", `${pn.bobot_administratif || 20}%`],
      [
        { content: "Total Bobot", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [241, 245, 249] } },
        { content: "100%", styles: { fontStyle: "bold", halign: "center", fillColor: [241, 245, 249] } },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      tableWidth: 220,
      head: [["No", "Aspek / Kompetensi Penilaian", "Bobot"]],
      body: bobotTableBody,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
        font: "helvetica",
      },
      headStyles: {
        fillColor: [11, 20, 66],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 154 },
        2: { cellWidth: 48, halign: "center" },
      },
    });
  }

  // Tanda Tangan Kepala Dinas (Kanan)
  const tempatTerbit = tpl?.tempat_terbit || instansi.tempat_terbit || "Ponorogo";
  const tempatTgl = `${tempatTerbit}, ${fmtDate(pn.tanggal_penilaian || new Date())}`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const rightWidth = 205;
  const rightX = pageWidth - margin - rightWidth;
  const fullJabatan = tpl?.jabatan_penandatangan || instansi.pejabat_jabatan || "Kepala Dinas Komunikasi, Informatika dan Statistik";

  doc.text(tempatTgl, rightX, currentY);
  doc.text(fullJabatan, rightX, currentY + 11, { maxWidth: rightWidth });

  const ttdY = currentY + 54;

  // Render Tanda Tangan Gambar jika ada
  if (tpl?.file_ttd) {
    const ttdDataUrl = await loadImageToDataUrl(getFileUrl(tpl.file_ttd));
    if (ttdDataUrl) {
      try {
        doc.addImage(ttdDataUrl, "PNG", rightX + 15, currentY + 14, 50, 36);
      } catch {
        // ignore
      }
    }
  }

  // Render Stempel Dinas Gambar jika ada
  if (tpl?.file_stempel) {
    const stempelDataUrl = await loadImageToDataUrl(getFileUrl(tpl.file_stempel));
    if (stempelDataUrl) {
      try {
        doc.addImage(stempelDataUrl, "PNG", rightX - 15, currentY + 10, 44, 44);
      } catch {
        // ignore
      }
    }
  }

  // Pejabat Signature Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(tpl?.nama_penandatangan || instansi.pejabat_nama || "Drs. BAMBANG SUHENDRO, M.Si", rightX, ttdY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const pangkat = tpl?.pangkat_penandatangan || instansi.pejabat_pangkat;
  const nip = tpl?.nip_penandatangan || instansi.pejabat_nip || "19750812 200003 1 004";
  if (pangkat) {
    doc.text(pangkat, rightX, ttdY + 10, { maxWidth: rightWidth });
    doc.text(`NIP. ${nip}`, rightX, ttdY + 20, { maxWidth: rightWidth });
  } else {
    doc.text(`NIP. ${nip}`, rightX, ttdY + 10, { maxWidth: rightWidth });
  }

  return doc;
};

/**
 * Ekspor Transkrip Nilai Magang Resmi Diskominfo Ponorogo ke file PDF
 */
export const exportTranskripNilaiPdf = async (data) => {
  const doc = await buildTranskripNilaiPdfDoc(data);
  const p = data?.peserta || {};
  const namaFileClean = (p.nama || "Peserta").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Transkrip_Nilai_${namaFileClean}.pdf`);
};

/**
 * Helper membuat data contoh transkrip nilai berdasarkan jenis peserta
 */
export const buatContohDataTranskrip = (tpl, jenis = "mahasiswa") => {
  const isSiswa = jenis === "siswa" || tpl?.jenis_peserta === "siswa";
  return {
    template_rapor: tpl,
    peserta: {
      nama: isSiswa ? "Ahmad Rizky Pratama" : "Ahmad Fauzi",
      nim: isSiswa ? "0068192841" : "22081010045",
      nomor_induk: isSiswa ? "0068192841" : "22081010045",
      jenis_kelamin: "L",
      institusi: isSiswa ? "SMK Negeri 1 Ponorogo" : "Universitas Pembangunan Nasional",
      asal_institusi: isSiswa ? "SMK Negeri 1 Ponorogo" : "Universitas Pembangunan Nasional",
      jurusan: isSiswa ? "Teknik Komputer dan Jaringan" : "Teknik Informatika",
      posisi: "Fullstack Web Developer",
      bidang: "Aplikasi dan Tata Kelola Informatika",
      tanggal_mulai: "2026-02-01",
      tanggal_selesai: "2026-07-31",
      durasi: "6 Bulan",
    },
    penilaian: {
      id: 1,
      nilai_profesional: 92.0,
      nilai_personal: 88.5,
      nilai_sosial: 90.0,
      nilai_administratif: 91.0,
      bobot_profesional: 35,
      bobot_personal: 25,
      bobot_sosial: 20,
      bobot_administratif: 20,
      nilai_akhir_angka: 90.55,
      indeks_nilai_akhir: "A",
      predikat_akhir: "Sangat Baik",
      rata_rata: 90.55,
      predikat: "Sangat Baik (A)",
      catatan_mentor:
        "Peserta menunjukkan kedisiplinan yang tinggi, inisiatif yang kuat, serta mampu bekerja sama secara produktif dalam tim pengembangan sistem kedinasan.",
    },
    mentor: {
      nama: "Drs. Eko Wahyudi, M.Kom",
      nip: "19800315 200501 1 008",
      jabatan: "Pranata Komputer Ahli Muda",
    },
    instansi: {
      nama_pemerintah: tpl?.nama_pemerintah || "PEMERINTAH KABUPATEN PONOROGO",
      nama_instansi: tpl?.nama_instansi || "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
      alamat_instansi: tpl?.alamat_instansi || "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
      pejabat_nama: tpl?.nama_penandatangan || "Drs. BAMBANG SUHENDRO, M.Si",
      pejabat_pangkat: tpl?.pangkat_penandatangan || "Pembina Utama Muda",
      pejabat_nip: tpl?.nip_penandatangan || "19750812 200003 1 004",
      pejabat_jabatan: tpl?.jabatan_penandatangan || "Kepala Dinas Komunikasi Informatika dan Statistik",
    },
  };
};

/**
 * Membuka pratinjau transkrip nilai di tab baru browser
 */
export const bukaPratinjauTranskripTab = async (tpl, jenis = "mahasiswa") => {
  const data = buatContohDataTranskrip(tpl, jenis);
  const doc = await buildTranskripNilaiPdfDoc(data);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
};

/**
 * Mencetak pratinjau transkrip nilai langsung
 */
export const cetakPratinjauTranskrip = async (tpl, jenis = "mahasiswa") => {
  const data = buatContohDataTranskrip(tpl, jenis);
  const doc = await buildTranskripNilaiPdfDoc(data);
  doc.autoPrint();
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  
  // Gunakan iframe tersembunyi untuk mencetak langsung
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };
};
