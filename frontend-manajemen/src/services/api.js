import axios from "axios";
import { getToken, clearAuthData, updateAuthUser } from "../utils/authStorage";

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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthData();
      window.location.href = "/login";
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