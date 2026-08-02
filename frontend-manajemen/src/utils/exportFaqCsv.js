import { bersihkanTeksKaya } from "./bersihkanTeksKaya";

const LABEL_AKSI = {
  jawaban: "Tampilkan jawaban",
  navigasi: "Buka halaman",
  unduh: "Unduh berkas",
  eskalasi: "Hubungi admin",
  status: "Cek status",
};

const escapeCsvValue = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportFaqToCsv = (data, fileName = "data-faq-chatbot") => {
  const headers = [
    "Pertanyaan", "Jawaban", "Kategori", "Kata Kunci", "Status",
    "FAQ Publik", "Quick Action", "Tipe Aksi", "Tayang",
    "Membantu", "Tidak Membantu", "Rasio Puas",
  ];

  const rows = data.map((f) => {
    const suka = f.helpful_count || 0;
    const tidak = f.unhelpful_count || 0;
    const total = suka + tidak;
    return [
      f.question,
      bersihkanTeksKaya(f.answer) || "-",
      f.category || "Umum",
      f.keywords || "-",
      f.is_active ? "Aktif" : "Nonaktif",
      f.show_on_landing ? "Ya" : "Tidak",
      f.is_quick_action ? "Ya" : "Tidak",
      LABEL_AKSI[f.action_type] || "-",
      f.view_count || 0,
      suka,
      tidak,
      total > 0 ? `${Math.round((suka / total) * 100)}%` : "-",
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${fileName}-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};