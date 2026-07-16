// Membangun URL absolut untuk file yang diunggah peserta (disimpan sebagai path relatif di backend)
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const serverBase = apiBase.replace(/\/api\/?$/, "");
  return `${serverBase}/${path}`;
};