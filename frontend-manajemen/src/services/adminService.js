import api from "./api";

//kelola pendaftaran
export const getAllPendaftaran = () => api.get("/manajemen/admin/pendaftaran");
export const getDetailPendaftaran = (id) => api.get(`/manajemen/admin/pendaftaran/${id}`);
export const updateStatusPendaftaran = (id, data) => api.put(`/manajemen/admin/pendaftaran/${id}/status`, data);

export const getAllAkun = () => api.get("/manajemen/admin/akun");
export const createAkun = (data) => api.post("/manajemen/admin/akun", data);
export const updateAkun = (id, data) => api.put(`/manajemen/admin/akun/${id}`, data);
export const updateStatusAkun = (id, data) => api.put(`/manajemen/admin/akun/${id}/status`, data);
export const assignBidangMentor = (id, data) => api.put(`/manajemen/admin/akun/${id}/bidang`, data);
export const getPesertaBimbinganMentor = (id) => api.get(`/manajemen/admin/mentor/${id}/peserta`);
export const uploadFotoAkun = (id, formData) => api.post(`/manajemen/admin/akun/${id}/foto`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const cekAkunBisaDihapus = (id) => api.get(`/manajemen/admin/akun/${id}/cek-hapus`);
export const deleteAkun = (id) => api.delete(`/manajemen/admin/akun/${id}`);

//kelola bidang magang
export const getAllBidang = () => api.get("/manajemen/admin/bidang");
export const createBidang = (data) => api.post("/manajemen/admin/bidang", data);
export const updateBidang = (id, data) => api.put(`/manajemen/admin/bidang/${id}`, data);
export const deleteBidang = (id) => api.delete(`/manajemen/admin/bidang/${id}`);
export const cekBidangBisaDihapus = (id) => api.get(`/manajemen/admin/bidang/${id}/cek-hapus`);
export const toggleStatusBidang = (id) => api.patch(`/manajemen/admin/bidang/${id}/toggle-status`);

//kelola peserta
export const createAkunPeserta = (pendaftaranId) => api.post(`/manajemen/admin/pendaftaran/${pendaftaranId}/buat-akun-peserta`);
export const getAllAkunPeserta = () => api.get("/manajemen/admin/akun-peserta");
export const getDetailAkunPeserta = (id) => api.get(`/manajemen/admin/akun-peserta/${id}`);
export const assignMentorPeserta = (id, data) => api.put(`/manajemen/admin/akun-peserta/${id}/mentor`, data);
export const resetPasswordPeserta = (id) => api.post(`/manajemen/admin/akun-peserta/${id}/reset-password`);

//pengaturan jam kerja & hari libur (untuk presensi peserta)
export const getAllJamKerja = () => api.get("/manajemen/admin/jam-kerja");
export const updateJamKerja = (id, data) => api.put(`/manajemen/admin/jam-kerja/${id}`, data);

export const getAllHariLibur = (tahun) => api.get("/manajemen/admin/hari-libur", { params: tahun ? { tahun } : {} });
export const createHariLibur = (data) => api.post("/manajemen/admin/hari-libur", data);
export const updateHariLibur = (id, data) => api.put(`/manajemen/admin/hari-libur/${id}`, data);
export const deleteHariLibur = (id) => api.delete(`/manajemen/admin/hari-libur/${id}`);
export const syncHariLiburNasional = (tahun) => api.post("/manajemen/admin/hari-libur/sync-nasional", null, { params: tahun ? { tahun } : {} });

//kelola sertifikat
export const getAllSertifikat = () => api.get("/manajemen/admin/sertifikat");
export const createSertifikat = (data) => api.post("/manajemen/admin/sertifikat", data);
export const updateSertifikat = (id, data) => api.put(`/manajemen/admin/sertifikat/${id}`, data);
export const deleteSertifikat = (id) => api.delete(`/manajemen/admin/sertifikat/${id}`);

//pengaturan (template) sertifikat
export const getPengaturanSertifikat = () => api.get("/manajemen/admin/pengaturan-sertifikat");
export const updatePengaturanSertifikat = (data) => api.put("/manajemen/admin/pengaturan-sertifikat", data);
export const uploadFileSertifikat = (jenis, formData) => api.post(`/manajemen/admin/pengaturan-sertifikat/upload/${jenis}`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const deleteFileSertifikat = (jenis) => api.delete(`/manajemen/admin/pengaturan-sertifikat/upload/${jenis}`);

//template sertifikat (banyak template)
export const getAllTemplateSertifikat = () => api.get("/manajemen/admin/template-sertifikat");
export const getTemplateSertifikat = (id) => api.get(`/manajemen/admin/template-sertifikat/${id}`);
export const createTemplateSertifikat = (formData) => api.post("/manajemen/admin/template-sertifikat", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const updateTemplateSertifikat = (id, data) => api.put(`/manajemen/admin/template-sertifikat/${id}`, data);
export const deleteTemplateSertifikat = (id) => api.delete(`/manajemen/admin/template-sertifikat/${id}`);
export const uploadFileTemplateSertifikat = (id, jenis, formData) => api.post(`/manajemen/admin/template-sertifikat/${id}/upload/${jenis}`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const deleteFileTemplateSertifikat = (id, jenis) => api.delete(`/manajemen/admin/template-sertifikat/${id}/upload/${jenis}`);

// ==================== PRESENSI (admin: read-only) ====================
export const getAllPresensi = (params) => api.get("/manajemen/admin/presensi", { params });
export const getPresensi = (id) => api.get(`/manajemen/admin/presensi/${id}`);
export const getStatistikPresensi = (params) => api.get("/manajemen/admin/presensi/statistik", { params });
export const getOpsiFilterPresensi = () => api.get("/manajemen/admin/presensi/opsi-filter");
export const getRekapPresensi = (params) => api.get("/manajemen/admin/presensi/rekap", { params });
export const getMatriksPresensi = (params) => api.get("/manajemen/admin/presensi/rekap/matriks", { params });
export const getRekapPeserta = (pesertaId, params) => api.get(`/manajemen/admin/presensi/rekap/${pesertaId}`, { params });