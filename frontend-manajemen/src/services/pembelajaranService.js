import api from "./api";

// ── Materi Pembelajaran (Peserta) ────────────────────────
export const getMateriPeserta = (params) =>
  api.get("/manajemen/peserta/materi", { params });

// ── Materi Pembelajaran (Mentor) ─────────────────────────
export const getMateriMentor = (params) =>
  api.get("/manajemen/mentor/materi", { params });

export const getKategoriMateriMentor = () =>
  api.get("/manajemen/mentor/materi/kategori");

export const createKategoriMateriMentor = (data) =>
  api.post("/manajemen/mentor/materi/kategori", data);

export const getPesertaBimbinganMateri = () =>
  api.get("/manajemen/mentor/materi/peserta-bimbingan");

export const createMateriMentor = (formData) =>
  api.post("/manajemen/mentor/materi", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateMateriMentor = (id, formData) =>
  api.put(`/manajemen/mentor/materi/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteMateriMentor = (id) =>
  api.delete(`/manajemen/mentor/materi/${id}`);

// ── Tugas Magang (Peserta) ───────────────────────────────
export const getTugasPeserta = (params) =>
  api.get("/manajemen/peserta/tugas", { params });

export const kumpulTugasPeserta = (tugasId, formData) =>
  api.post(`/manajemen/peserta/tugas/${tugasId}/kumpul`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Penugasan Magang (Mentor) ────────────────────────────
export const getTugasMentor = (params) =>
  api.get("/manajemen/mentor/tugas", { params });

export const getPesertaBimbinganTugas = () =>
  api.get("/manajemen/mentor/tugas/peserta-bimbingan");

export const createTugasMentor = (formData) =>
  api.post("/manajemen/mentor/tugas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateTugasMentor = (id, formData) =>
  api.put(`/manajemen/mentor/tugas/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteTugasMentor = (id) =>
  api.delete(`/manajemen/mentor/tugas/${id}`);

export const getPengumpulanTugasMentor = (id) =>
  api.get(`/manajemen/mentor/tugas/${id}/pengumpulan`);

export const reviewPengumpulanTugasMentor = (pengumpulanId, data) =>
  api.post(`/manajemen/mentor/tugas/pengumpulan/${pengumpulanId}/review`, data);

export const setNilaiNolTugasMentor = (data) =>
  api.post("/manajemen/mentor/tugas/nilai-nol", data);

export const kumpulKuisPeserta = (tugasId, data) =>
  api.post(`/manajemen/peserta/tugas/${tugasId}/kumpul-kuis`, data);

