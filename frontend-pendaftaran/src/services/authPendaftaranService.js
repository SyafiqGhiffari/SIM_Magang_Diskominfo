import api from "./api";

export const registerPendaftaran = async (data) => {
  const response = await api.post("/pendaftaran/register", data);
  return response.data;
};

export const loginPendaftaran = async (data) => {
  const response = await api.post("/pendaftaran/login", data);
  return response.data;
};

export const logoutPendaftaran = async () => {
  try {
    await api.post("/pendaftaran/logout");
  } catch {
    // tetap lanjutkan bersihkan sesi lokal walau request gagal (misal offline)
  } finally {
    sessionStorage.removeItem("token_pendaftaran");
    sessionStorage.removeItem("user_pendaftaran");
  }
};

export const forgotPasswordPendaftaran = async (email) => {
  const response = await api.post("/pendaftaran/forgot-password", { email });
  return response.data;
};

export const resetPasswordPendaftaran = async (data) => {
  // data: { token, new_password, confirm_password }
  const response = await api.post("/pendaftaran/reset-password", data);
  return response.data;
};