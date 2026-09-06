import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const stamp = () => new Date().toISOString().slice(0, 10);

const HEADERS = [
  "No",
  "Nama Peserta",
  "Email",
  "Institusi",
  "Bidang Magang",
  "Mentor Pembimbing",
  "Nilai Akhir",
  "Indeks",
  "Predikat",
  "Status Penilaian",
];

const prepareRows = (data) => {
  return data.map((item, idx) => ({
    No: idx + 1,
    "Nama Peserta": item.nama || "-",
    Email: item.email || "-",
    Institusi: item.institusi || "-",
    "Bidang Magang": item.bidang || "-",
    "Mentor Pembimbing": item.mentor_nama || "-",
    "Nilai Akhir": item.nilai_akhir_angka ? Number(item.nilai_akhir_angka).toFixed(2) : "-",
    Indeks: item.indeks_nilai_akhir || "-",
    Predikat: item.predikat_akhir || "-",
    "Status Penilaian":
      item.status_penilaian === "final"
        ? "Diterbitkan"
        : item.status_penilaian === "draf"
        ? "Draf"
        : "Belum Dinilai",
  }));
};

export const exportRekapNilaiToCsv = (data, fileName = "rekapitulasi-nilai-magang") => {
  const rows = prepareRows(data);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}-${stamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportRekapNilaiToExcel = (data, fileName = "rekapitulasi-nilai-magang") => {
  const rows = prepareRows(data);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
  XLSX.writeFile(workbook, `${fileName}-${stamp()}.xlsx`);
};

export const exportRekapNilaiToPdf = (data, fileName = "rekapitulasi-nilai-magang") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 20, 66);
  doc.rect(0, 0, pageWidth, 52, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("REKAPITULASI NILAI AKHIR PESERTA MAGANG", 36, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text("Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo", 36, 42);

  const tglCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${tglCetak} | Total Data: ${data.length} Peserta`, 36, 72);

  const tableBody = data.map((it, idx) => [
    idx + 1,
    it.nama || "-",
    it.institusi || "-",
    it.bidang || "-",
    it.mentor_nama || "-",
    it.nilai_akhir_angka ? Number(it.nilai_akhir_angka).toFixed(2) : "-",
    it.indeks_nilai_akhir || "-",
    it.predikat_akhir || "-",
    it.status_penilaian === "final" ? "Diterbitkan" : it.status_penilaian === "draf" ? "Draf" : "Belum Dinilai",
  ]);

  autoTable(doc, {
    startY: 84,
    margin: { left: 36, right: 36 },
    head: [["No", "Nama Peserta", "Institusi / Kampus", "Bidang", "Mentor", "Nilai", "Indeks", "Predikat", "Status"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [11, 20, 66],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 45, halign: "center", fontStyle: "bold" },
      6: { cellWidth: 45, halign: "center", fontStyle: "bold" },
      7: { cellWidth: 80 },
      8: { cellWidth: 70, halign: "center" },
    },
  });

  doc.save(`${fileName}-${stamp()}.pdf`);
};
