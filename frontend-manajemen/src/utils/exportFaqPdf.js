import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LABEL_AKSI = {
  jawaban: "Jawaban",
  navigasi: "Navigasi",
  unduh: "Unduh",
  eskalasi: "Admin",
  status: "Status",
};

export const exportFaqToPdf = (data, fileName = "data-faq-chatbot") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(11, 20, 66);
  doc.text("Data FAQ & Quick Action Chatbot", 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    40, 58,
  );
  doc.text(`Total FAQ: ${data.length}`, 40, 72);

  const headers = [["Pertanyaan", "Kategori", "Quick Action", "Status", "Tayang", "Kepuasan"]];
  const rows = data.map((f) => {
    const suka = f.helpful_count || 0;
    const tidak = f.unhelpful_count || 0;
    const total = suka + tidak;
    return [
      f.question,
      f.category || "Umum",
      f.is_quick_action ? LABEL_AKSI[f.action_type] || "Ya" : "-",
      f.is_active ? "Aktif" : "Nonaktif",
      f.view_count || 0,
      total > 0 ? `${Math.round((suka / total) * 100)}% (${total} nilai)` : "Belum dinilai",
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
    columnStyles: { 0: { cellWidth: 300 } },
    margin: { left: 40, right: 40 },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileName}-${dateStr}.pdf`);
};