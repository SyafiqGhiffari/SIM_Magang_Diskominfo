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

// Request ganti email akun sendiri (kirim OTP)
export const requestGantiEmailManajemen = (data) =>
  api.post("/manajemen/request-ganti-email", data);

// Verifikasi OTP ganti email akun sendiri
export const verifikasiGantiEmailManajemen = (data) =>
  api.post("/manajemen/verifikasi-ganti-email", data);

// Riwayat login akun peserta / manajemen
export const getRiwayatLoginPeserta = () =>
  api.get("/manajemen/riwayat-login");

// Request reset password (kirim link token ke email)
export const requestForgotPassword = (email) =>
  api.post("/manajemen/forgot-password", { email });

// Reset password menggunakan token dari link email
export const resetPassword = (data) =>
  api.post("/manajemen/reset-password", data);