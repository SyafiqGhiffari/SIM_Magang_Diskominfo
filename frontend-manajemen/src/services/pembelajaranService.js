import api from "./api";

// ── Materi Pembelajaran ──────────────────────────────────
export const getMateriPeserta = (params) =>
  api.get("/manajemen/peserta/materi", { params });

// ── Tugas Magang ─────────────────────────────────────────
export const getTugasPeserta = (params) =>
  api.get("/manajemen/peserta/tugas", { params });

export const kumpulTugasPeserta = (tugasId, formData) =>
  api.post(`/manajemen/peserta/tugas/${tugasId}/kumpul`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
