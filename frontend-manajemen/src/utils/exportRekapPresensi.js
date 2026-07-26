import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { PRESENSI_STATUS } from "../constants/presensiStatus";

/* ============================ Helper umum ============================ */

const labelBulan = (bulan) => {
  if (!bulan) return "-";
  const [y, m] = bulan.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const tanggalCetak = () =>
  new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

const menitKeJam = (menit) => {
  const total = Number(menit) || 0;
  if (total <= 0) return "0 menit";
  const jam = Math.floor(total / 60);
  const sisa = total % 60;
  if (jam === 0) return `${sisa} menit`;
  if (sisa === 0) return `${jam} jam`;
  return `${jam} jam ${sisa} menit`;
};

const namaFile = (prefix, bulan, ext) => `${prefix}-${bulan || "periode"}.${ext}`;

/* ============================== CSV ============================== */

const SEP = ";";

const escapeCsv = (val) => {
  const s = val === null || val === undefined ? "" : String(val);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const unduhCsv = (baris, filename) => {
  const isi = baris.map((r) => r.map(escapeCsv).join(SEP)).join("\r\n");
  // BOM agar Excel membaca UTF-8 dengan benar
  const blob = new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ============================== EXCEL ============================== */

const unduhExcel = (baris, namaSheet, filename) => {
  const ws = XLSX.utils.aoa_to_sheet(baris);
  const jumlahKolom = baris.reduce((maks, r) => Math.max(maks, r.length), 0);
  ws["!cols"] = Array.from({ length: jumlahKolom }, (_, i) => ({
    wch: i === 1 ? 30 : i === 2 || i === 3 ? 24 : 14,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, namaSheet);
  XLSX.writeFile(wb, filename);
};

/**
 * Menyusun baris rekap per peserta. Dipakai bersama oleh ekspor CSV & Excel.
 */
const barisRekap = ({ bulan, periode, ringkasan, rows = [], bidangFilter }) => {
  const baris = [
    ["REKAP PRESENSI PESERTA MAGANG"],
    ["Dinas Komunikasi dan Informatika"],
    [],
    ["Periode", labelBulan(bulan)],
    ["Rentang tanggal", `${periode?.dari || "-"} s.d. ${periode?.sampai || "-"}`],
    ["Hari kerja efektif", periode?.hari_kerja_efektif ?? 0],
    ["Filter bidang", bidangFilter || "Semua bidang"],
    ["Total peserta", ringkasan?.total_peserta ?? rows.length],
    ["Rata-rata kehadiran", `${Math.round(ringkasan?.rata_kehadiran ?? 0)}%`],
    ["Peserta di bawah 75%", ringkasan?.peserta_bermasalah ?? 0],
    ["Dicetak pada", tanggalCetak()],
    [],
    ["No", "Nama Peserta", "Institusi", "Bidang", "Jenis Peserta", "Hadir", "Terlambat", "Izin", "Sakit", "Alfa", "Hari Kerja", "Total Keterlambatan", "Persentase Kehadiran (%)"],
  ];

  rows.forEach((r, i) => {
    baris.push([
      i + 1,
      r.nama,
      r.institusi || "-",
      r.bidang || "-",
      r.kategori_pendaftar || r.kategori || "-",
      r.hadir ?? 0,
      r.terlambat ?? 0,
      r.izin ?? 0,
      r.sakit ?? 0,
      r.alfa ?? 0,
      r.hari_kerja ?? 0,
      menitKeJam(r.total_menit_terlambat),
      Math.round(r.persentase_kehadiran || 0),
    ]);
  });

    return baris;
};

/** Ekspor rekap per peserta ke CSV (teks, pemisah titik koma). */
export const exportRekapCsv = (payload) =>
  unduhCsv(barisRekap(payload), namaFile("rekap-presensi", payload.bulan, "csv"));

/** Ekspor rekap per peserta ke Excel (.xlsx asli). */
export const exportRekapExcel = (payload) =>
  unduhExcel(barisRekap(payload), "Rekap Presensi", namaFile("rekap-presensi", payload.bulan, "xlsx"));

/**
 * Ekspor matriks peserta x tanggal ke CSV dan excel.
 * statusMap berformat { `${peserta_id}|${YYYY-MM-DD}`: "hadir" | ... }
 */
const barisMatriks = ({ bulan, periode, rows = [], statusMap = {} }) => {
  const tanggalList = periode?.tanggal_hari_kerja || [];

  const baris = [
    ["MATRIKS KEHADIRAN HARIAN PESERTA MAGANG"],
    ["Periode", labelBulan(bulan)],
    ["Keterangan kode", Object.keys(PRESENSI_STATUS).map((k) => `${PRESENSI_STATUS[k].kode}=${PRESENSI_STATUS[k].label}`).join(", ")],
    ["Dicetak pada", tanggalCetak()],
    [],
    ["No", "Nama Peserta", "Bidang", ...tanggalList.map((t) => t.slice(8, 10)), "Hadir", "Terlambat", "Izin", "Sakit", "Alfa", "Kehadiran (%)"],
  ];

  rows.forEach((r, i) => {
    const sel = tanggalList.map((t) => {
      const st = statusMap[`${r.peserta_id}|${t}`] || "belum";
      return (PRESENSI_STATUS[st] || PRESENSI_STATUS.belum).kode;
    });
    baris.push([
      i + 1,
      r.nama,
      r.bidang || "-",
      ...sel,
      r.hadir ?? 0,
      r.terlambat ?? 0,
      r.izin ?? 0,
      r.sakit ?? 0,
      r.alfa ?? 0,
      Math.round(r.persentase_kehadiran || 0),
    ]);
  });

    return baris;
};

/** Ekspor matriks peserta × tanggal ke CSV. */
export const exportMatriksCsv = (payload) =>
  unduhCsv(barisMatriks(payload), namaFile("matriks-presensi", payload.bulan, "csv"));

/** Ekspor matriks peserta × tanggal ke Excel (.xlsx asli). */
export const exportMatriksExcel = (payload) =>
  unduhExcel(barisMatriks(payload), "Matriks Kehadiran", namaFile("matriks-presensi", payload.bulan, "xlsx"));

/* ============================== PDF ============================== */

const NAVY = [11, 20, 66];
const BIRU = [0, 79, 159];
const ABU = [100, 116, 139];
const ABU_MUDA = [241, 245, 249];

const KOLOM = [
  { key: "no", label: "No", width: 26, align: "center" },
  { key: "nama", label: "Nama Peserta", width: 148 },
  { key: "institusi", label: "Institusi", width: 138 },
  { key: "bidang", label: "Bidang", width: 112 },
  { key: "hadir", label: "H", width: 26, align: "center" },
  { key: "terlambat", label: "T", width: 26, align: "center" },
  { key: "izin", label: "I", width: 24, align: "center" },
  { key: "sakit", label: "S", width: 24, align: "center" },
  { key: "alfa", label: "A", width: 24, align: "center" },
  { key: "hari_kerja", label: "H. Kerja", width: 46, align: "center" },
  { key: "terlambat_total", label: "Keterlambatan", width: 78, align: "center" },
  { key: "persen", label: "Hadir %", width: 44, align: "center" },
];

const potongTeks = (doc, teks, maxWidth) => {
  let s = String(teks ?? "-");
  if (doc.getTextWidth(s) <= maxWidth) return s;
  while (s.length > 1 && doc.getTextWidth(`${s}...`) > maxWidth) s = s.slice(0, -1);
  return `${s}...`;
};

/**
 * Ekspor rekap presensi ke PDF (A4 landscape) memakai jsPDF core font.
 */
export const exportRekapPdf = ({ bulan, periode, ringkasan, rows = [], bidangFilter }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const tableWidth = KOLOM.reduce((a, c) => a + c.width, 0);

  const gambarKop = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 62, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("REKAP PRESENSI PESERTA MAGANG", marginX, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Dinas Komunikasi dan Informatika", marginX, 44);
    doc.text(`Periode: ${labelBulan(bulan)}`, pageWidth - marginX, 28, { align: "right" });
    doc.text(`Dicetak: ${tanggalCetak()}`, pageWidth - marginX, 44, { align: "right" });
  };

  const gambarRingkasan = (y) => {
    const info = [
      ["Rentang Tanggal", `${periode?.dari || "-"} s.d. ${periode?.sampai || "-"}`],
      ["Hari Kerja Efektif", `${periode?.hari_kerja_efektif ?? 0} hari`],
      ["Total Peserta", `${ringkasan?.total_peserta ?? rows.length} peserta`],
      ["Rata-rata Kehadiran", `${Math.round(ringkasan?.rata_kehadiran ?? 0)}%`],
      ["Kehadiran < 75%", `${ringkasan?.peserta_bermasalah ?? 0} peserta`],
      ["Filter Bidang", bidangFilter || "Semua bidang"],
    ];

    const kotakW = tableWidth / 3;
    const kotakH = 34;
    info.forEach((it, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = marginX + col * kotakW;
      const yy = y + row * kotakH;
      doc.setFillColor(...ABU_MUDA);
      doc.rect(x, yy, kotakW - 6, kotakH - 6, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...ABU);
      doc.text(it[0].toUpperCase(), x + 8, yy + 13);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(potongTeks(doc, it[1], kotakW - 22), x + 8, yy + 25);
    });

    return y + Math.ceil(info.length / 3) * kotakH + 6;
  };

  const gambarHeaderTabel = (y) => {
    doc.setFillColor(...BIRU);
    doc.rect(marginX, y, tableWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let x = marginX;
    KOLOM.forEach((c) => {
      const tx = c.align === "center" ? x + c.width / 2 : x + 5;
      doc.text(c.label, tx, y + 15, { align: c.align === "center" ? "center" : "left" });
      x += c.width;
    });
    return y + 22;
  };

  let halaman = 1;
  const gambarFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...ABU);
    doc.text("Dokumen ini dihasilkan otomatis oleh Sistem Informasi Manajemen Magang.", marginX, pageHeight - 20);
    doc.text(`Halaman ${halaman}`, pageWidth - marginX, pageHeight - 20, { align: "right" });
  };

  gambarKop();
  let y = gambarRingkasan(80);
  y = gambarHeaderTabel(y + 6);

  const rowH = 19;
  const batasBawah = pageHeight - 40;

  rows.forEach((r, i) => {
    if (y + rowH > batasBawah) {
      gambarFooter();
      doc.addPage();
      halaman += 1;
      gambarKop();
      y = gambarHeaderTabel(80);
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, tableWidth, rowH, "F");
    }

    const persen = Math.round(r.persentase_kehadiran || 0);
    const nilai = {
      no: String(i + 1),
      nama: r.nama || "-",
      institusi: r.institusi || "-",
      bidang: r.bidang || "-",
      hadir: String(r.hadir ?? 0),
      terlambat: String(r.terlambat ?? 0),
      izin: String(r.izin ?? 0),
      sakit: String(r.sakit ?? 0),
      alfa: String(r.alfa ?? 0),
      hari_kerja: String(r.hari_kerja ?? 0),
      terlambat_total: menitKeJam(r.total_menit_terlambat),
      persen: `${persen}%`,
    };

    let x = marginX;
    KOLOM.forEach((c) => {
      const isPersen = c.key === "persen";
      doc.setFont("helvetica", isPersen || c.key === "nama" ? "bold" : "normal");
      doc.setFontSize(8);
      if (isPersen) {
        if (persen >= 90) doc.setTextColor(5, 150, 105);
        else if (persen >= 75) doc.setTextColor(217, 119, 6);
        else doc.setTextColor(225, 29, 72);
      } else {
        doc.setTextColor(...(c.key === "nama" ? NAVY : [51, 65, 85]));
      }
      const teks = potongTeks(doc, nilai[c.key], c.width - 10);
      const tx = c.align === "center" ? x + c.width / 2 : x + 5;
      doc.text(teks, tx, y + 13, { align: c.align === "center" ? "center" : "left" });
      x += c.width;
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);
    y += rowH;
  });

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...ABU);
    doc.text("Tidak ada data rekap pada periode ini.", marginX + 6, y + 16);
    y += 24;
  }

  // Keterangan kode kolom
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...ABU);
  doc.text("Keterangan: H = Hadir, T = Terlambat, I = Izin, S = Sakit, A = Alfa. Persentase kehadiran = (hadir + terlambat) / hari kerja peserta.", marginX, Math.min(y + 16, batasBawah + 14));

  gambarFooter();
  doc.save(namaFile("rekap-presensi", bulan, "pdf"));
};