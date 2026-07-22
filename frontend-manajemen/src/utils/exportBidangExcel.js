import * as XLSX from "xlsx";

export const exportBidangToExcel = (data, occupancy, fileName = "data-bidang-magang") => {
  const rows = data.map((b) => {
    const terisi = occupancy[b.nama] || 0;
    return {
      "Nama Bidang": b.nama,
      Deskripsi: b.deskripsi || "-",
      Kuota: b.kuota > 0 ? b.kuota : "Tanpa batas",
      Terisi: terisi,
      "Sisa Kuota": b.kuota > 0 ? Math.max(0, b.kuota - terisi) : "-",
      Status: b.is_active ? "Aktif" : "Nonaktif",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 26 }, { wch: 34 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bidang Magang");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};