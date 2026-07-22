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