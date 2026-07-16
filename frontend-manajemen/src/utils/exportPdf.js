import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const statusLabel = {
  menunggu: "Menunggu",
  revisi: "Revisi",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

export const exportPendaftaranToPdf = (data, fileName = "data-pendaftaran-magang") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data Pendaftaran Magang", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 40, 58);
  doc.text(`Total data: ${data.length}`, 40, 72);

  const headers = [["Nama Pemohon", "Institusi", "Bidang", "Tanggal Pengajuan", "Status"]];
  const rows = data.map((p) => [
    p.nama_lengkap || "-",
    (p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah) || "-",
    p.posisi_bidang || "-",
    p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-",
    statusLabel[p.status_pendaftaran] || p.status_pendaftaran,
  ]);

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