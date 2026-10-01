import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatTanggalPresensi } from "../constants/presensiStatus";

export const HEADERS_IZIN = [
  "No",
  "Nama Peserta",
  "NIM / NISN",
  "Institusi",
  "Program Studi / Jurusan",
  "Bidang",
  "Jenis",
  "Tanggal Mulai",
  "Tanggal Selesai",
  "Durasi",
  "Alasan",
  "Status",
  "Catatan Mentor",
  "Tanggal Pengajuan",
];

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const hitungHari = (mulai, selesai) => {
  if (!mulai) return "-";
  if (!selesai || mulai === selesai) return "1 hari";
  const d1 = new Date(mulai);
  const d2 = new Date(selesai);
  const diff = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return `${diff} hari`;
};

const formatTgl = (s) => {
  if (!s) return "-";
  return formatTanggalPresensi(s);
};

export const barisDataIzin = (r, idx = 0) => {
  return [
    idx + 1,
    r.nama || "-",
    r.nomor_induk || "-",
    r.institusi || "-",
    r.jurusan || "-",
    r.bidang || "-",
    (r.jenis || "-").toUpperCase(),
    formatTgl(r.tanggal_mulai),
    formatTgl(r.tanggal_selesai),
    hitungHari(r.tanggal_mulai, r.tanggal_selesai),
    r.alasan || "-",
    (r.status || "-").toUpperCase(),
    r.catatan_mentor || "-",
    formatTgl(r.created_at),
  ];
};

export const exportIzinToCsv = (rows, fileName = "pengajuan-izin") => {
  const csvContent = [
    HEADERS_IZIN.join(","),
    ...rows.map((r, i) =>
      barisDataIzin(r, i)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}-${stamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportIzinToExcel = (rows, fileName = "pengajuan-izin") => {
  const data = rows.map((r, idx) => {
    const b = barisDataIzin(r, idx);
    return HEADERS_IZIN.reduce((obj, h, i) => ({ ...obj, [h]: b[i] }), {});
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: HEADERS_IZIN });
  worksheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 28 }, // Nama
    { wch: 18 }, // NIM / NISN
    { wch: 28 }, // Institusi
    { wch: 24 }, // Jurusan
    { wch: 22 }, // Bidang
    { wch: 12 }, // Jenis
    { wch: 16 }, // Mulai
    { wch: 16 }, // Selesai
    { wch: 12 }, // Durasi
    { wch: 45 }, // Alasan
    { wch: 14 }, // Status
    { wch: 30 }, // Catatan Mentor
    { wch: 18 }, // Tanggal Pengajuan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pengajuan Izin & Sakit");
  XLSX.writeFile(workbook, `${fileName}-${stamp()}.xlsx`);
};

export const exportIzinToPdf = (rows, stat = null, fileName = "pengajuan-izin") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Laporan Rekap Pengajuan Izin & Sakit Peserta Bimbingan", 40, 38);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}  ·  Total: ${rows.length} permohonan`,
    40,
    54
  );

  let startYTable = 72;
  if (stat && typeof stat === "object") {
    const sMenunggu = stat.menunggu ?? 0;
    const sDisetujui = stat.disetujui ?? 0;
    const sDitolak = stat.ditolak ?? 0;
    const sTotal = stat.total ?? 0;

    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Statistik: Menunggu ${sMenunggu}  |  Disetujui ${sDisetujui}  |  Ditolak ${sDitolak}  |  Total ${sTotal}`,
      40,
      68
    );
    startYTable = 84;
  }

  autoTable(doc, {
    head: [HEADERS_IZIN],
    body: rows.map((r, i) => barisDataIzin(r, i)),
    startY: startYTable,
    theme: "grid",
    headStyles: {
      fillColor: [11, 20, 66],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
      overflow: "linebreak",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22, halign: "center" },  // No
      1: { cellWidth: 75 },                    // Nama
      2: { cellWidth: 55 },                    // NIM/NISN
      3: { cellWidth: 65 },                    // Institusi
      4: { cellWidth: 60 },                    // Jurusan
      5: { cellWidth: 55 },                    // Bidang
      6: { cellWidth: 38, halign: "center" },  // Jenis
      7: { cellWidth: 50, halign: "center" },  // Mulai
      8: { cellWidth: 50, halign: "center" },  // Selesai
      9: { cellWidth: 36, halign: "center" },  // Durasi
      10: { cellWidth: "auto" },               // Alasan
      11: { cellWidth: 42, halign: "center" }, // Status
      12: { cellWidth: 65 },                   // Catatan
      13: { cellWidth: 48, halign: "center" }, // Tanggal
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${fileName}-${stamp()}.pdf`);
};
