import api from "./api";

// ── Chat Sessions ──
export const getChatSessions = () =>
  api.get("/manajemen/admin/chat/sessions");

export const getSessionMessages = (id) =>
  api.get(`/manajemen/admin/chat/session/${id}/messages`);

export const replySession = (id, content) =>
  api.post(`/manajemen/admin/chat/session/${id}/reply`, { content });

export const closeSession = (id) =>
  api.put(`/manajemen/admin/chat/session/${id}/close`);

// ── FAQ & Quick Action ──
export const getFaqList = () =>
  api.get("/manajemen/admin/faq");

export const createFaq = (data) =>
  api.post("/manajemen/admin/faq", data);

export const updateFaq = (id, data) =>
  api.put(`/manajemen/admin/faq/${id}`, data);

export const deleteFaq = (id) =>
  api.delete(`/manajemen/admin/faq/${id}`);
