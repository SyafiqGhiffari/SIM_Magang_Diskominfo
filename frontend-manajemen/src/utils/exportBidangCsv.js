const escapeCsvValue = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportBidangToCsv = (data, occupancy, fileName = "data-bidang-magang") => {
  const headers = ["Nama Bidang", "Deskripsi", "Kuota", "Terisi", "Sisa Kuota", "Status"];

  const rows = data.map((b) => {
    const terisi = occupancy[b.nama] || 0;
    return [
      b.nama,
      b.deskripsi || "-",
      b.kuota > 0 ? b.kuota : "Tanpa batas",
      terisi,
      b.kuota > 0 ? Math.max(0, b.kuota - terisi) : "-",
      b.is_active ? "Aktif" : "Nonaktif",
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