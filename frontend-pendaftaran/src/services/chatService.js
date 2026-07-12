import api from "./api";

// Ambil atau buat sesi chat aktif
export const getOrCreateChatSession = () =>
  api.post("/pendaftaran/chat/session");

// Polling pesan dalam sesi aktif
export const getChatMessages = () =>
  api.get("/pendaftaran/chat/messages");

// Kirim pesan (backend akan auto-reply jika ada FAQ match)
export const sendChatMessage = (content) =>
  api.post("/pendaftaran/chat/message", { content });

// Ambil jumlah pesan belum dibaca
export const getChatUnreadCount = () =>
  api.get("/pendaftaran/chat/unread");

// Ambil daftar FAQ publik (untuk suggested questions)
export const getPublicFAQ = () =>
  api.get("/pendaftaran/chat/faq");

// Ambil daftar quick action aktif (tombol pintasan di chat widget)
export const getQuickActions = () =>
  api.get("/pendaftaran/chat/quick-actions");

// Gunakan quick action — catat pertanyaan + jawaban ke riwayat chat
export const useQuickAction = (id) =>
  api.post(`/pendaftaran/chat/quick-action/${id}`);

// Cek apakah admin sedang online di web manajemen (endpoint publik, tanpa auth)
export const getAdminStatus = () =>
  api.get("/chat/admin-status");
