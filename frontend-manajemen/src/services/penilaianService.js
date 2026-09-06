import api from "./api";

// ── Admin: Pengaturan Bobot & Indikator Penilaian ──
export const getPengaturanPenilaian = () => api.get("/manajemen/admin/pengaturan-penilaian");
export const updatePengaturanPenilaian = (data) => api.put("/manajemen/admin/pengaturan-penilaian", data);
export const getAllRekapPenilaianAdmin = () => api.get("/manajemen/admin/penilaian");
export const getDetailPenilaianAdmin = (pesertaId) => api.get(`/manajemen/admin/penilaian/${pesertaId}`);

// ── Mentor: Penilaian Peserta Bimbingan ──
export const getPesertaBimbinganPenilaian = () => api.get("/manajemen/mentor/penilaian");
export const getDetailPenilaianPeserta = (pesertaId) => api.get(`/manajemen/mentor/penilaian/${pesertaId}`);
export const simpanPenilaianPeserta = (pesertaId, data) => api.post(`/manajemen/mentor/penilaian/${pesertaId}`, data);

// ── Peserta & Alumni: Transkrip Nilai ──
export const getNilaiSaya = () => api.get("/manajemen/peserta/penilaian");
