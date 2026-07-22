import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportBidangToPdf = (data, occupancy, fileName = "data-bidang-magang") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data Bidang Magang", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 40, 58);
  doc.text(`Total bidang: ${data.length}`, 40, 72);

  const headers = [["Nama Bidang", "Deskripsi", "Kuota", "Terisi", "Status"]];
  const rows = data.map((b) => {
    const terisi = occupancy[b.nama] || 0;
    return [b.nama, b.deskripsi || "-", b.kuota > 0 ? b.kuota : "Tanpa batas", terisi, b.is_active ? "Aktif" : "Nonaktif"];
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