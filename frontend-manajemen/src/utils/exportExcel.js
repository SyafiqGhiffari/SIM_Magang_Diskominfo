import * as XLSX from "xlsx";

const statusLabel = {
  menunggu: "Menunggu",
  revisi: "Revisi",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

export const exportPendaftaranToExcel = (data, fileName = "data-pendaftaran-magang") => {
  const rows = data.map((p) => ({
    "Nama Pendaftar": p.nama_lengkap,
    Email: p.email,
    "Nomor HP": p.nomor_hp,
    Kategori: p.kategori_pendaftar === "mahasiswa" ? "Mahasiswa" : "Siswa",
    Institusi: p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah,
    Bidang: p.posisi_bidang,
    "Tanggal Pengajuan": p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-",
    Status: statusLabel[p.status_pendaftaran] || p.status_pendaftaran,
    "Catatan Admin": p.catatan_admin || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 24 }, { wch: 26 }, { wch: 15 }, { wch: 12 },
    { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pendaftaran Magang");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};