import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { statusInfo, formatTanggalLengkap } from "../constants/presensiStatus";

const HEADERS = [
  "Nama Peserta",
  "Institusi",
  "Bidang",
  "Tanggal",
  "Jam Masuk",
  "Jam Pulang",
  "Status",
  "Menit Terlambat",
  "Lupa Presensi",
  "Keterangan",
];

const barisData = (r) => [
  r.nama || "-",
  r.institusi || "-",
  r.bidang || "-",
  formatTanggalLengkap(r.tanggal),
  r.jam_masuk || "-",
  r.jam_pulang || "-",
  statusInfo(r.status).label,
  Number(r.menit_terlambat) || 0,
  r.lupa_presensi ? "Ya" : "Tidak",
  r.keterangan || "-",
];

const stamp = () => new Date().toISOString().slice(0, 10);

const escapeCsv = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportPresensiToCsv = (rows, fileName = "data-presensi") => {
  const isi = [HEADERS, ...rows.map(barisData)]
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

export const exportPresensiToExcel = (rows, fileName = "data-presensi") => {
  const data = rows.map((r) => {
    const b = barisData(r);
    return HEADERS.reduce((obj, h, i) => ({ ...obj, [h]: b[i] }), {});
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: HEADERS });
  worksheet["!cols"] = [
    { wch: 26 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 11 },
    { wch: 11 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 34 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Presensi");
  XLSX.writeFile(workbook, `${fileName}-${stamp()}.xlsx`);
};

export const exportPresensiToPdf = (rows, ringkasan = null, fileName = "data-presensi") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data Presensi Peserta Magang", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    40, 58,
  );
  doc.text(`Total baris: ${rows.length}`, 40, 72);
  if (ringkasan) {
    doc.text(
      `Hadir ${ringkasan.hadir ?? 0} · Terlambat ${ringkasan.terlambat ?? 0} · Izin ${ringkasan.izin ?? 0} · Sakit ${ringkasan.sakit ?? 0} · Alfa ${ringkasan.alfa ?? 0}`,
      40, 86,
    );
  }

  autoTable(doc, {
    head: [HEADERS],
    body: rows.map(barisData),
    startY: ringkasan ? 104 : 90,
    theme: "grid",
    headStyles: { fillColor: [11, 20, 66], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${fileName}-${stamp()}.pdf`);
};