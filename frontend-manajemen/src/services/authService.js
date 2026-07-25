import api from "./api";

export const loginAdmin = (email, password) =>
  api.post("/manajemen/login", { email, password });

export const logoutAdmin = () =>
  api.post("/manajemen/logout");

export const getProfile = () =>
  api.get("/manajemen/profile");

export const gantiPasswordAdmin = (data) =>
  api.put("/manajemen/ganti-password", data);

// Profil lengkap akun manajemen yang sedang login (nama, foto_profil, dll.)
export const getMe = () =>
  api.get("/manajemen/me");

// Ganti foto profil akun sendiri
export const uploadFotoAdmin = (formData) =>
  api.post("/manajemen/upload-foto", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Hapus foto profil akun sendiri
export const hapusFotoAdmin = () =>
  api.delete("/manajemen/hapus-foto");

// Perbarui informasi akun sendiri (nama, email, no_hp, jabatan)
export const updateProfilAdmin = (data) =>
  api.put("/manajemen/me", data);