import api from "./api";

//kelola pendaftaran
export const getAllPendaftaran = () => api.get("/manajemen/admin/pendaftaran");
export const getDetailPendaftaran = (id) => api.get(`/manajemen/admin/pendaftaran/${id}`);
export const updateStatusPendaftaran = (id, data) => api.put(`/manajemen/admin/pendaftaran/${id}/status`, data);

export const getAllAkun = () => api.get("/manajemen/admin/akun");

//kelola bidang magang
export const getAllBidang = () => api.get("/manajemen/admin/bidang");
export const createBidang = (data) => api.post("/manajemen/admin/bidang", data);
export const updateBidang = (id, data) => api.put(`/manajemen/admin/bidang/${id}`, data);
export const deleteBidang = (id) => api.delete(`/manajemen/admin/bidang/${id}`);
export const toggleStatusBidang = (id) => api.patch(`/manajemen/admin/bidang/${id}/toggle-status`);