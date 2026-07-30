import * as XLSX from "xlsx";

const isiBaris = (r) => {
  const p = r.pendaftaran || {};
  const s = r.surat || null;
  return {
    "Nama Peserta": p.nama_lengkap || "-",
    Kategori: p.kategori_pendaftar || "-",
    "Nomor Induk": p.nomor_induk || "-",
    "Asal Institusi": p.asal_kampus || p.asal_sekolah || "-",
    Bidang: p.posisi_bidang || "-",
    Status: s ? "Sudah Terbit" : "Belum Terbit",
    "Nomor Surat": s?.nomor_surat || "-",
    "Tanggal Surat": s?.tanggal_terbit || "-",
    "Jabatan Tujuan": s?.jabatan_tujuan || "-",
    "Unit Tujuan": s?.unit_tujuan || "-",
    "Institusi Tujuan": s?.institusi_tujuan || "-",
    "Kota Tujuan": s?.kota_tujuan || "-",
    "Nomor Surat Pengantar": s?.nomor_surat_pengantar || "-",
  };
};

export const exportSuratToExcel = (data, fileName = "data-surat-penerimaan") => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(isiBaris));
  worksheet["!cols"] = [
    { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 30 }, { wch: 22 }, { wch: 14 },
    { wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 26 }, { wch: 32 }, { wch: 16 }, { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Penerimaan");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${dateStr}.xlsx`);
};