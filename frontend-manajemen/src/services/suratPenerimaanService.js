import api from "./api";
import { getFileUrl } from "../utils/fileUrl";

// ── Surat penerimaan ──
export const getAllSuratPenerimaan = () => api.get("/manajemen/admin/surat-penerimaan");
export const getSuratPenerimaan = (id) => api.get(`/manajemen/admin/surat-penerimaan/${id}`);
export const createSuratPenerimaan = (data) => api.post("/manajemen/admin/surat-penerimaan", data);
// Kirim ulang PDF surat ke email peserta (email saat pendaftaran)
export const kirimEmailSuratPenerimaan = (id) =>
  api.post(`/manajemen/admin/surat-penerimaan/${id}/kirim-email`);
export const updateSuratPenerimaan = (id, data) => api.put(`/manajemen/admin/surat-penerimaan/${id}`, data);
export const deleteSuratPenerimaan = (id) => api.delete(`/manajemen/admin/surat-penerimaan/${id}`);

/**
 * Pratinjau draf: kirim isian form, terima PDF sementara sebagai blob URL.
 * Tidak menyimpan apa pun di database maupun folder uploads.
 */
export const pratinjauSuratPenerimaan = async (data) => {
  const res = await api.post("/manajemen/admin/surat-penerimaan/pratinjau", data, {
    responseType: "blob",
  });
  return URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
};

// ── Pengaturan kop, redaksi, dan penandatangan ──
export const getPengaturanSurat = () => api.get("/manajemen/admin/pengaturan-surat");
export const updatePengaturanSurat = (data) => api.put("/manajemen/admin/pengaturan-surat", data);
export const uploadFilePengaturanSurat = (jenis, formData) =>
  api.post(`/manajemen/admin/pengaturan-surat/upload/${jenis}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteFilePengaturanSurat = (jenis) =>
  api.delete(`/manajemen/admin/pengaturan-surat/upload/${jenis}`);

/**
 * Buka PDF surat di tab baru untuk diperiksa langsung.
 * File disajikan backend lewat /uploads sebagai file statis, jadi cukup URL biasa.
 */
export const bukaPdfSurat = (filePath) => {
  const url = getFileUrl(filePath);
  if (!url) return false;
  // Tambahkan penanda waktu supaya browser tidak menampilkan PDF versi cache
  // setelah surat digenerate ulang.
  window.open(`${url}?t=${Date.now()}`, "_blank", "noopener,noreferrer");
  return true;
};

/** Unduh sebagai file (memakai endpoint ber-token, nama file rapi dari backend). */
export const unduhSuratPenerimaan = async (id, namaFile = "surat-penerimaan.pdf") => {
  const res = await api.get(`/manajemen/admin/surat-penerimaan/${id}/unduh`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ── Template surat (banyak template + tata letak) ──
export const getAllTemplateSurat = () => api.get("/manajemen/admin/template-surat");
export const getTemplateSurat = (id) => api.get(`/manajemen/admin/template-surat/${id}`);
export const getTataLetakBawaan = () => api.get("/manajemen/admin/template-surat/bawaan");
export const createTemplateSurat = (data) => api.post("/manajemen/admin/template-surat", data);
export const updateTemplateSurat = (id, data) => api.put(`/manajemen/admin/template-surat/${id}`, data);
export const deleteTemplateSurat = (id) => api.delete(`/manajemen/admin/template-surat/${id}`);
export const duplikatTemplateSurat = (id) =>
  api.post(`/manajemen/admin/template-surat/${id}/duplikat`);

export const uploadFileTemplateSurat = (id, jenis, formData) =>
  api.post(`/manajemen/admin/template-surat/${id}/upload/${jenis}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteFileTemplateSurat = (id, jenis) =>
  api.delete(`/manajemen/admin/template-surat/${id}/upload/${jenis}`);

/**
 * Ambil PDF pratinjau sebagai blob URL agar bisa ditampilkan di <iframe>.
 * Endpoint pratinjau butuh token, jadi tidak bisa dipasang langsung ke src iframe.
 * Pemanggil WAJIB memanggil URL.revokeObjectURL() saat URL lama tidak dipakai.
 */
export const pratinjauTemplateSurat = async (id, kategori = "mahasiswa") => {
  const res = await api.get(`/manajemen/admin/template-surat/${id}/pratinjau`, {
    params: { kategori },
    responseType: "blob",
  });
  return window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
};

/**
 * Ambil posisi (mm) tiap bagian surat pada pratinjau.
 * Dipakai lapisan geser di atas kanvas PDF: { lebar, tinggi, blok: [...] }.
 */
export const petaTemplateSurat = async (id, kategori = "mahasiswa") => {
  const res = await api.get(`/manajemen/admin/template-surat/${id}/peta`, {
    params: { kategori },
  });
  return res.data?.data ?? null;
};