import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatTanggalLengkap, formatTanggalPresensi } from "../constants/presensiStatus";

const HEADERS = [
  "No",
  "Jenis",
  "Alasan / Keterangan",
  "Tanggal Mulai",
  "Tanggal Selesai",
  "Durasi",
  "Status",
  "Tanggal Pengajuan",
  "Lampiran Bukti",
];

const hitungDurasiHari = (tglAwal, tglAkhir) => {
  if (!tglAwal || !tglAkhir) return "-";
  try {
    const d1 = new Date(String(tglAwal).slice(0, 10));
    const d2 = new Date(String(tglAkhir).slice(0, 10));
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "-";
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Hari`;
  } catch {
    return "-";
  }
};

const barisData = (r, index) => [
  index + 1,
  r.jenis === "sakit" ? "Surat Sakit" : "Izin Resmi",
  r.alasan || "-",
  formatTanggalLengkap(r.tanggal_mulai) || "-",
  formatTanggalLengkap(r.tanggal_selesai) || "-",
  hitungDurasiHari(r.tanggal_mulai, r.tanggal_selesai),
  (r.status || "-").toUpperCase(),
  r.created_at ? formatTanggalPresensi(r.created_at) : "-",
  r.file_bukti ? "Ada" : "Tidak Ada",
];

const stamp = () => new Date().toISOString().slice(0, 10);

const escapeCsv = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportIzinToCsv = (rows, fileName = "data-pengajuan-izin") => {
  const isi = [HEADERS, ...rows.map((r, i) => barisData(r, i))]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}-${stamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportIzinToExcel = (rows, fileName = "data-pengajuan-izin") => {
  const data = rows.map((r, i) => {
    const b = barisData(r, i);
    return HEADERS.reduce((obj, h, idx) => ({ ...obj, [h]: b[idx] }), {});
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: HEADERS });
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pengajuan Izin");
  XLSX.writeFile(workbook, `${fileName}-${stamp()}.xlsx`);
};

export const exportIzinToPdf = (rows, stats = null, fileName = "data-pengajuan-izin") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data Pengajuan Izin & Sakit Peserta Magang", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    40,
    58
  );
  doc.text(`Total pengajuan: ${rows.length}`, 40, 72);
  if (stats) {
    doc.text(
      `Disetujui: ${stats.disetujui ?? 0} · Menunggu: ${stats.menunggu ?? 0} · Ditolak: ${stats.ditolak ?? 0}`,
      40,
      86
    );
  }

  autoTable(doc, {
    head: [HEADERS],
    body: rows.map((r, i) => barisData(r, i)),
    startY: stats ? 104 : 90,
    theme: "grid",
    headStyles: { fillColor: [11, 20, 66], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${fileName}-${stamp()}.pdf`);
};
