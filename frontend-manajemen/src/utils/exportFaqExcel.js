import * as XLSX from "xlsx";
import { bersihkanTeksKaya } from "./bersihkanTeksKaya";

const LABEL_AKSI = {
  jawaban: "Tampilkan jawaban",
  navigasi: "Buka halaman",
  unduh: "Unduh berkas",
  eskalasi: "Hubungi admin",
  status: "Cek status",
};

export const exportFaqToExcel = (data, fileName = "data-faq-chatbot") => {
  const rows = data.map((f) => {
    const suka = f.helpful_count || 0;
    const tidak = f.unhelpful_count || 0;
    const total = suka + tidak;
    return {
      Pertanyaan: f.question,
      Jawaban: bersihkanTeksKaya(f.answer) || "-",
      Kategori: f.category || "Umum",
      "Kata Kunci": f.keywords || "-",
      Status: f.is_active ? "Aktif" : "Nonaktif",
      "FAQ Publik": f.show_on_landing ? "Ya" : "Tidak",
      "Quick Action": f.is_quick_action ? "Ya" : "Tidak",
      "Tipe Aksi": LABEL_AKSI[f.action_type] || "-",
      Tayang: f.view_count || 0,
      Membantu: suka,
      "Tidak Membantu": tidak,
      "Rasio Puas": total > 0 ? `${Math.round((suka / total) * 100)}%` : "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 40 }, { wch: 50 }, { wch: 18 }, { wch: 26 }, { wch: 10 }, { wch: 12 },
    { wch: 13 }, { wch: 18 }, { wch: 9 }, { wch: 11 }, { wch: 15 }, { wch: 11 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "FAQ Chatbot");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};