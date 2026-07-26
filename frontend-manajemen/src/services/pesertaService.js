import api from "./api";

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