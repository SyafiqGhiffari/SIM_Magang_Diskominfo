// Membangun URL absolut untuk berkas yang disimpan backend sebagai path relatif
// (contoh: "uploads/chat/chat_3_17123.jpg") atau mengembalikan data / blob / URL absolut as-is.
export const getFileUrl = (path) => {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const serverBase =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
  return `${serverBase}/${cleanPath}`;
};