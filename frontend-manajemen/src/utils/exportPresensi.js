import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { statusInfo, formatTanggalLengkap } from "../constants/presensiStatus";
import { getUser } from "./authStorage";

export const HEADERS = [
  "No",
  "Nama Peserta",
  "Institusi",
  "Bidang",
  "Tanggal",
  "Jam Masuk",
  "Jam Pulang",
  "Durasi Kerja",
  "Status",
  "Keterlambatan",
  "Lupa Presensi",
  "Mode Kehadiran",
  "Logbook",
];

const hitungDurasiKerja = (jamMasuk, jamPulang) => {
  if (!jamMasuk || !jamPulang || jamMasuk === "--:--" || jamPulang === "--:--") return "-";
  const p1 = String(jamMasuk).split(":");
  const p2 = String(jamPulang).split(":");
  if (p1.length < 2 || p2.length < 2) return "-";
  const h1 = Number(p1[0]);
  const m1 = Number(p1[1]);
  const h2 = Number(p2[0]);
  const m2 = Number(p2[1]);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "-";
  const totalMenit = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (totalMenit <= 0) return "-";
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (menit === 0) return `${jam} jam`;
  return `${jam} jam ${menit} mnt`;
};

const formatModeKehadiran = (mode) => {
  if (!mode) return "WFO";
  const m = String(mode).toLowerCase();
  if (m === "wfh") return "WFH (Remote)";
  if (m === "dinas_luar") return "Dinas Luar";
  return "WFO (Kantor)";
};

const formatKeterlambatan = (r) => {
  const m = Number(r.menit_terlambat) || 0;
  if (m > 0) return `${m} Menit`;
  if (r.status === "terlambat") return "Terlambat";
  if (r.status === "hadir") return "Tepat Waktu";
  return "-";
};

const getLogbookText = (r) => {
  const raw = (r.keterangan || r.logbook || "").trim();
  if (r.status === "alfa" || r.status === "alpa") return "-";
  if (raw === "Belum melakukan presensi hari ini") return "-";
  if (r.status === "izin" || r.status === "sakit") {
    return raw || (r.status === "sakit" ? "Dispensasi Sakit" : "Dispensasi Izin");
  }
  return raw || "-";
};

export const barisData = (r, idx = 0) => {
  const authUser = getUser() || {};
  const isPeserta = authUser.role === "peserta";

  const nama =
    r.nama ||
    r.peserta?.nama ||
    (isPeserta ? authUser.nama : "") ||
    "-";

  const institusi =
    r.institusi ||
    r.peserta?.institusi ||
    (isPeserta
      ? authUser.asal_kampus || authUser.asal_sekolah || authUser.institusi
      : "") ||
    "-";

  const bidang =
    r.bidang ||
    r.peserta?.bidang ||
    (isPeserta ? authUser.posisi_bidang || authUser.bidang : "") ||
    "-";

  return [
    idx + 1,
    nama,
    institusi,
    bidang,
    formatTanggalLengkap(r.tanggal),
    r.jam_masuk || "--:--",
    r.jam_pulang || "--:--",
    hitungDurasiKerja(r.jam_masuk, r.jam_pulang),
    statusInfo(r.status).label,
    formatKeterlambatan(r),
    r.lupa_presensi ? "Ya" : "Tidak",
    formatModeKehadiran(r.mode_kehadiran),
    getLogbookText(r),
  ];
};

const stamp = () => new Date().toISOString().slice(0, 10);

const escapeCsv = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportPresensiToCsv = (rows, fileName = "data-presensi") => {
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

export const exportPresensiToExcel = (rows, fileName = "data-presensi") => {
  const data = rows.map((r, idx) => {
    const b = barisData(r, idx);
    return HEADERS.reduce((obj, h, i) => ({ ...obj, [h]: b[i] }), {});
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: HEADERS });
  worksheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 28 }, // Nama Peserta
    { wch: 28 }, // Institusi
    { wch: 22 }, // Bidang
    { wch: 20 }, // Tanggal
    { wch: 12 }, // Jam Masuk
    { wch: 12 }, // Jam Pulang
    { wch: 16 }, // Durasi Kerja
    { wch: 14 }, // Status
    { wch: 16 }, // Keterlambatan
    { wch: 14 }, // Lupa Presensi
    { wch: 16 }, // Mode Kehadiran
    { wch: 50 }, // Logbook
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Presensi");
  XLSX.writeFile(workbook, `${fileName}-${stamp()}.xlsx`);
};

export const exportPresensiToPdf = (rows, ringkasan = null, fileName = "data-presensi") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const authUser = getUser() || {};
  const isPeserta = authUser.role === "peserta";

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text(
    isPeserta
      ? "Laporan Presensi & Logbook Aktivitas Peserta Magang"
      : "Data Presensi & Logbook Peserta Magang",
    40,
    38,
  );

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}  ·  Total data: ${rows.length} baris`,
    40,
    54,
  );

  let startYTable = 72;

  // Cek apakah ringkasan berupa string (periode/bulan) atau object statistik
  if (typeof ringkasan === "string" && ringkasan.trim() !== "") {
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Periode: ${ringkasan}`, 40, 68);
    startYTable = 84;
  } else if (ringkasan && typeof ringkasan === "object") {
    const rHadir = ringkasan.hadir ?? 0;
    const rTerlambat = ringkasan.terlambat ?? 0;
    const rIzin = ringkasan.izin ?? 0;
    const rSakit = ringkasan.sakit ?? 0;
    const rAlfa = ringkasan.alfa ?? 0;

    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Statistik: Hadir ${rHadir}  |  Terlambat ${rTerlambat}  |  Izin ${rIzin}  |  Sakit ${rSakit}  |  Alfa ${rAlfa}`,
      40,
      68,
    );
    startYTable = 84;
  }

  autoTable(doc, {
    head: [HEADERS],
    body: rows.map((r, i) => barisData(r, i)),
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
      1: { cellWidth: 80 },                    // Nama Peserta
      2: { cellWidth: 70 },                    // Institusi
      3: { cellWidth: 62 },                    // Bidang
      4: { cellWidth: 65 },                    // Tanggal
      5: { cellWidth: 38, halign: "center" },  // Jam Masuk
      6: { cellWidth: 38, halign: "center" },  // Jam Pulang
      7: { cellWidth: 46, halign: "center" },  // Durasi Kerja
      8: { cellWidth: 42, halign: "center" },  // Status
      9: { cellWidth: 48, halign: "center" },  // Keterlambatan
      10: { cellWidth: 36, halign: "center" }, // Lupa Presensi
      11: { cellWidth: 48, halign: "center" }, // Mode
      12: { cellWidth: "auto" },               // Logbook (otomatis sisa lebar kertas)
    },
    margin: { left: 40, right: 40 },
  });

  const finalName = typeof ringkasan === "string" && !fileName.includes("Riwayat")
    ? fileName
    : fileName;

  doc.save(`${finalName}-${stamp()}.pdf`);
};