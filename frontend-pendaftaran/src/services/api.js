import axios from "axios";
import { sessionExpiredDialog } from "../utils/swal";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token_pendaftaran");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isHandlingSessionExpired = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const alreadyOnLogin = window.location.pathname === "/login";

      sessionStorage.removeItem("token_pendaftaran");
      sessionStorage.removeItem("user_pendaftaran");

      if (!alreadyOnLogin && !isHandlingSessionExpired) {
        isHandlingSessionExpired = true;
        const msg = error.response?.data?.message;
        await sessionExpiredDialog(msg ? { text: msg } : undefined);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;