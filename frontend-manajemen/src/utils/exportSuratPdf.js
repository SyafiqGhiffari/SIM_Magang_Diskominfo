import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const tgl = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

export const exportSuratToPdf = (data, fileName = "data-surat-penerimaan") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data Surat Penerimaan Magang", 40, 40);

  const terbit = data.filter((r) => !!r.surat).length;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 40, 58);
  doc.text(`Total peserta: ${data.length}  |  Surat terbit: ${terbit}  |  Belum terbit: ${data.length - terbit}`, 40, 72);

  const headers = [["Nama Peserta", "Bidang", "Status", "Nomor Surat", "Tanggal Surat", "Institusi Tujuan"]];
  const rows = data.map((r) => {
    const p = r.pendaftaran || {};
    const s = r.surat || null;
    return [
      p.nama_lengkap || "-",
      p.posisi_bidang || "-",
      s ? "Sudah Terbit" : "Belum Terbit",
      s?.nomor_surat || "-",
      s ? tgl(s.tanggal_terbit) : "-",
      s?.institusi_tujuan || "-",
    ];
  });

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 90,
    theme: "grid",
    headStyles: { fillColor: [11, 20, 66], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileName}-${dateStr}.pdf`);
};