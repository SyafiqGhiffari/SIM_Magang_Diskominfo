import api from "./api";

// ── Presensi peserta bimbingan ──
export const getPresensiMentor = (params) => api.get("/manajemen/mentor/presensi", { params });
export const getStatistikPresensiMentor = (params) => api.get("/manajemen/mentor/presensi/statistik", { params });
export const updatePresensiMentor = (id, data) => api.put(`/manajemen/mentor/presensi/${id}`, data);

// ── Pengajuan izin / sakit ──
export const getPengajuanIzinMentor = (params) => api.get("/manajemen/mentor/pengajuan-izin", { params });
export const prosesPengajuanIzinMentor = (id, data) => api.put(`/manajemen/mentor/pengajuan-izin/${id}`, data);