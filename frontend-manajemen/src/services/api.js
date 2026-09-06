import axios from "axios";
import { getToken, clearAuthData, updateAuthUser } from "../utils/authStorage";
import { sessionExpiredDialog } from "../utils/swal";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isHandlingSessionExpired = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const alreadyOnLogin = window.location.pathname === "/login";

      if (!alreadyOnLogin && !isHandlingSessionExpired) {
        isHandlingSessionExpired = true;
        const msg = err.response?.data?.message;
        await sessionExpiredDialog(msg ? { text: msg } : undefined);
        clearAuthData();
        window.location.href = "/login";
      } else if (alreadyOnLogin) {
        clearAuthData();
      }
    }

    // Masa magang sudah berakhir: sinkronkan status lokal supaya UI langsung
    // beralih ke mode read-only tanpa perlu login ulang.
    if (err.response?.status === 403 && err.response?.data?.status_magang === "selesai") {
      updateAuthUser({ status_magang: "selesai" });
    }

    return Promise.reject(err);
  }
);

export default api;