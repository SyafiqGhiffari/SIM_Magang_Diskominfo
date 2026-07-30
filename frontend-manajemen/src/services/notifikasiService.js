import api from "./api";

export const getNotifikasi = (params = {}) =>
  api.get("/manajemen/notifikasi", { params });

export const getUnreadNotifikasiCount = () =>
  api.get("/manajemen/notifikasi/unread-count");

export const bacaNotifikasi = (id) =>
  api.put(`/manajemen/notifikasi/${id}/baca`);

export const bacaSemuaNotifikasi = () =>
  api.put("/manajemen/notifikasi/semua/baca");

export const hapusNotifikasi = (id) =>
  api.delete(`/manajemen/notifikasi/${id}`);

export const hapusSemuaNotifikasi = () =>
  api.delete("/manajemen/notifikasi/semua/hapus");