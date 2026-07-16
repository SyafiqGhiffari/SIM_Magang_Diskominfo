const statusLabel = {
  menunggu: "Menunggu",
  revisi: "Revisi",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

const escapeCsvValue = (value) => {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportPendaftaranToCsv = (data, fileName = "data-pendaftaran-magang") => {
  const headers = [
    "Nama Pendaftar", "Email", "Nomor HP", "Kategori", "Institusi",
    "Bidang", "Tanggal Pengajuan", "Status", "Catatan Admin",
  ];

  const rows = data.map((p) => [
    p.nama_lengkap,
    p.email,
    p.nomor_hp,
    p.kategori_pendaftar === "mahasiswa" ? "Mahasiswa" : "Siswa",
    p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah,
    p.posisi_bidang,
    p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-",
    statusLabel[p.status_pendaftaran] || p.status_pendaftaran,
    p.catatan_admin || "-",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  // Tambahkan BOM supaya karakter khusus (misal huruf ber-aksen) tampil benar di Excel
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