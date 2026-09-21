import api from "./api";

// ── Dashboard Peserta ──────────────────────────────────────
export const getDashboardPeserta = () =>
  api.get("/manajemen/peserta/dashboard");

// ── Presensi ──────────────────────────────────────────────
export const getStatusPresensiHariIni = () =>
  api.get("/manajemen/peserta/presensi/hari-ini");

export const presensiMasuk = (formData) =>
  api.post("/manajemen/peserta/presensi/masuk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const presensiPulang = (formData) =>
  api.post("/manajemen/peserta/presensi/pulang", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getRiwayatPresensiSaya = (params) =>
  api.get("/manajemen/peserta/presensi/riwayat", { params });

// ── Pengajuan izin ────────────────────────────────────────
export const getPengajuanIzinSaya = (params) =>
  api.get("/manajemen/peserta/pengajuan-izin", { params });

export const buatPengajuanIzin = (formData) =>
  api.post("/manajemen/peserta/pengajuan-izin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const batalkanPengajuanIzin = (id) =>
  api.delete(`/manajemen/peserta/pengajuan-izin/${id}`);

// ── Sertifikat Peserta ────────────────────────────────────
export const getSertifikatSaya = () =>
  api.get("/manajemen/peserta/sertifikat");

// ── Logbook & Laporan Akhir Peserta ──────────────────────
export const getLogbookPeserta = () =>
  api.get("/manajemen/peserta/logbook");

export const updateLogbookPeserta = (id, data) =>
  api.put(`/manajemen/peserta/logbook/${id}`, data);

export const uploadLaporanAkhirPeserta = (formData) =>
  api.post("/manajemen/peserta/laporan-akhir", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadDokumenPeserta = (formData) =>
  api.post("/manajemen/peserta/upload-dokumen", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Hari Libur ────────────────────────────────────────────
export const getHariLibur = (params) =>
  api.get("/manajemen/hari-libur", { params });