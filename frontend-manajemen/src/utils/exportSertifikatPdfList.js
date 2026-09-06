import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatTanggal = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

const getStatusLabel = (r) => {
  if (r.sertifikat) return "Sudah Terbit";
  if (r.tanggal_selesai) {
    const end = new Date(r.tanggal_selesai);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end >= today) return "Sedang Magang";
  }
  return "Perlu Dibuat";
};

export const exportSertifikatToPdf = (data, fileName = "data-sertifikat-peserta") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Daftar Sertifikat Magang Peserta", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    40,
    58
  );
  doc.text(`Total peserta: ${data.length}`, 40, 72);

  const headers = [
    [
      "No",
      "Nama Peserta",
      "Asal Institusi",
      "Bidang",
      "Periode Magang",
      "Nomor Sertifikat",
      "Status",
    ],
  ];

  const rows = data.map((r, index) => [
    index + 1,
    r.nama || "-",
    r.institusi || "-",
    r.bidang || "-",
    `${formatTanggal(r.tanggal_mulai)} - ${formatTanggal(r.tanggal_selesai)}`,
    r.sertifikat?.nomor_sertifikat || "-",
    getStatusLabel(r),
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 88,
    theme: "grid",
    headStyles: {
      fillColor: [11, 20, 66],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileName}-${dateStr}.pdf`);
};
