import api from "./api";

// ── Template Rapor / Transkrip Nilai Magang ──
export const getAllTemplateRapor = () => api.get("/manajemen/admin/template-rapor");
export const getTemplateRapor = (id) => api.get(`/manajemen/admin/template-rapor/${id}`);
export const getTemplateRaporAktif = () => api.get("/manajemen/template-rapor/aktif");
export const createTemplateRapor = (data) => api.post("/manajemen/admin/template-rapor", data);
export const updateTemplateRapor = (id, data) => api.put(`/manajemen/admin/template-rapor/${id}`, data);
export const deleteTemplateRapor = (id) => api.delete(`/manajemen/admin/template-rapor/${id}`);
export const setDefaultTemplateRapor = (id) => api.put(`/manajemen/admin/template-rapor/${id}/default`);
export const duplikatTemplateRapor = (id) => api.post(`/manajemen/admin/template-rapor/${id}/duplikat`);

export const uploadFileTemplateRapor = (id, jenis, formData) =>
  api.post(`/manajemen/admin/template-rapor/${id}/upload/${jenis}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteFileTemplateRapor = (id, jenis) =>
  api.delete(`/manajemen/admin/template-rapor/${id}/upload/${jenis}`);
