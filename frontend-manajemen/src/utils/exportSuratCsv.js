const escapeCsvValue = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportSuratToCsv = (data, fileName = "data-surat-penerimaan") => {
  const headers = [
    "Nama Peserta", "Kategori", "Nomor Induk", "Asal Institusi", "Bidang", "Status",
    "Nomor Surat", "Tanggal Surat", "Jabatan Tujuan", "Unit Tujuan", "Institusi Tujuan",
    "Kota Tujuan", "Nomor Surat Pengantar",
  ];

  const rows = data.map((r) => {
    const p = r.pendaftaran || {};
    const s = r.surat || null;
    return [
      p.nama_lengkap || "-",
      p.kategori_pendaftar || "-",
      p.nomor_induk || "-",
      p.asal_kampus || p.asal_sekolah || "-",
      p.posisi_bidang || "-",
      s ? "Sudah Terbit" : "Belum Terbit",
      s?.nomor_surat || "-",
      s?.tanggal_terbit || "-",
      s?.jabatan_tujuan || "-",
      s?.unit_tujuan || "-",
      s?.institusi_tujuan || "-",
      s?.kota_tujuan || "-",
      s?.nomor_surat_pengantar || "-",
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