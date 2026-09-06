import * as XLSX from "xlsx";

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

export const exportSertifikatToExcel = (data, fileName = "data-sertifikat-peserta") => {
  const rows = data.map((r, index) => ({
    No: index + 1,
    "Nama Peserta": r.nama || "-",
    "Asal Institusi / Sekolah": r.institusi || "-",
    Bidang: r.bidang || "-",
    "Tanggal Mulai": formatTanggal(r.tanggal_mulai),
    "Tanggal Selesai": formatTanggal(r.tanggal_selesai),
    "Nomor Sertifikat": r.sertifikat?.nomor_sertifikat || "-",
    "Status Sertifikat": getStatusLabel(r),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Sertifikat");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};
