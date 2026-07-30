// Membangun URL absolut untuk file yang diunggah peserta (disimpan sebagai path relatif di backend)
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const serverBase = apiBase.replace(/\/api\/?$/, "");
  return `${serverBase}/${path}`;
};

// URL logo bawaan kop surat (dipakai backend juga saat template belum
// mengunggah logo sendiri, lihat services/surat_penerimaan_service.go).
export const getLogoSuratBawaan = () => getFileUrl("assets/logo-ponorogo.png");

// Logo yang dipakai pratinjau kop surat: logo template bila ada,
// selain itu jatuh ke logo bawaan instansi.
export const getLogoSuratUrl = (path) =>
  path ? getFileUrl(path) : getLogoSuratBawaan();