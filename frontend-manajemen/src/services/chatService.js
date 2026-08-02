import api from "./api";

// ── Chat Sessions ──
export const getChatSessions = () =>
  api.get("/manajemen/admin/chat/sessions");

export const getSessionMessages = (id) =>
  api.get(`/manajemen/admin/chat/session/${id}/messages`);

export const replySession = (id, content) =>
  api.post(`/manajemen/admin/chat/session/${id}/reply`, { content });

export const closeSession = (id) =>
  api.put(`/manajemen/admin/chat/session/${id}/close`);

// ── FAQ & Quick Action ──
export const getFaqList = () =>
  api.get("/manajemen/admin/faq");

export const createFaq = (data) =>
  api.post("/manajemen/admin/faq", data);

export const updateFaq = (id, data) =>
  api.put(`/manajemen/admin/faq/${id}`, data);

export const deleteFaq = (id) =>
  api.delete(`/manajemen/admin/faq/${id}`);

// Simpan ulang urutan tampil FAQ / quick action
// payload: [{ id: 3, order_index: 0 }, { id: 7, order_index: 1 }, ...]
export const reorderFaq = (urutan) =>
  api.put("/manajemen/admin/faq/urutan", { urutan });

// Pratinjau tombol quick action persis seperti yang dilihat peserta
// pada status pendaftaran tertentu.
export const getPratinjauQuickAction = (status) =>
  api.get("/manajemen/admin/faq/pratinjau", { params: { status } });

// ── Pertanyaan masuk (bahan FAQ baru) ──
export const getPertanyaanFaq = (params = {}) =>
  api.get("/manajemen/admin/pertanyaan-faq", { params });

export const updatePertanyaanFaq = (id, data) =>
  api.put(`/manajemen/admin/pertanyaan-faq/${id}`, data);

export const deletePertanyaanFaq = (id) =>
  api.delete(`/manajemen/admin/pertanyaan-faq/${id}`);

// ── TAHAP 5: analitik, aksi massal, impor & ekspor CSV ──

// hari: panjang jendela grafik tren. Backend hanya menerima nilai dari
// daftar putihnya sendiri dan mengabaikan nilai lain.
export const getAnalitikFaq = (hari) =>
  api.get("/manajemen/admin/faq/analitik", { params: hari ? { hari } : {} });

export const aksiMassalFaq = (ids, aksi, nilai = "") =>
  api.post("/manajemen/admin/faq/massal", { ids, aksi, nilai });

// responseType blob wajib, kalau tidak axios akan merusak berkas
// dengan mencoba menafsirkannya sebagai teks JSON.
export const eksporFaqCsv = () =>
  api.get("/manajemen/admin/faq/ekspor", { responseType: "blob" });

export const contohImporCsv = () =>
  api.get("/manajemen/admin/faq/contoh-impor", { responseType: "blob" });

export const imporFaqCsv = (berkas, mode = "pratinjau") => {
  const data = new FormData();
  data.append("file", berkas);
  data.append("mode", mode);
  return api.post("/manajemen/admin/faq/impor", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};