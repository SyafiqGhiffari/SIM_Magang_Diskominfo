// Membangun URL absolut untuk berkas yang disimpan backend sebagai path relatif
// (contoh: "uploads/chat/chat_3_17123.jpg").
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const serverBase = apiBase.replace(/\/api\/?$/, "");
  return `${serverBase}/${path.replace(/^\//, "")}`;
};