import api from "./api";

export const getAllPendaftaran = () => api.get("/manajemen/admin/pendaftaran");
export const getAllAkun = () => api.get("/manajemen/admin/akun");