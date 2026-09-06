const escapeCsvValue = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

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

export const exportSertifikatToCsv = (data, fileName = "data-sertifikat-peserta") => {
  const headers = [
    "No",
    "Nama Peserta",
    "Asal Institusi",
    "Bidang",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Nomor Sertifikat",
    "Status Sertifikat",
  ];

  const rows = data.map((r, index) => [
    index + 1,
    r.nama || "-",
    r.institusi || "-",
    r.bidang || "-",
    formatTanggal(r.tanggal_mulai),
    formatTanggal(r.tanggal_selesai),
    r.sertifikat?.nomor_sertifikat || "-",
    getStatusLabel(r),
  ]);

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
