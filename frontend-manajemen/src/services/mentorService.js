import api from "./api";

// ── Presensi peserta bimbingan ──
export const getPresensiMentor = (params) => api.get("/manajemen/mentor/presensi", { params });
export const getStatistikPresensiMentor = (params) => api.get("/manajemen/mentor/presensi/statistik", { params });
export const updatePresensiMentor = (id, data) => api.put(`/manajemen/mentor/presensi/${id}`, data);

// ── Pengajuan izin / sakit ──
export const getHitunganAntreanMentor = () => api.get("/manajemen/mentor/antrean/hitungan");
export const getPengajuanIzinMentor = (params) => api.get("/manajemen/mentor/pengajuan-izin", { params });
export const getStatistikPengajuanIzinMentor = () => api.get("/manajemen/mentor/pengajuan-izin/statistik");
export const prosesPengajuanIzinMentor = (id, data) => api.put(`/manajemen/mentor/pengajuan-izin/${id}`, data);

// ── Peserta bimbingan saya ──
export const getDaftarPesertaBimbingan = (params) => api.get("/manajemen/mentor/peserta", { params });

// ── Pengaturan Jam Kerja (Read-only untuk Mentor) ──
export const getJamKerjaMentor = () => api.get("/manajemen/jam-kerja");