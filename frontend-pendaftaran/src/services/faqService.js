import axios from "axios";

// Instance terpisah TANPA interceptor auth, karena endpoint FAQ publik
// tidak memerlukan token dan tidak boleh memicu dialog "sesi berakhir".
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
});

// Ambil FAQ publik untuk landing page & halaman FAQ
// params opsional: { kategori, cari }
export const getFaqPublik = (params = {}) =>
  publicApi.get("/faq", { params });

// Saran jawaban otomatis saat pengguna mengetik pertanyaan
export const getSaranFaq = (pertanyaan) =>
  publicApi.post("/faq/saran", { pertanyaan });

// Kirim pertanyaan yang belum terjawab ke admin
// payload: { nama, email, pertanyaan, website }  (website = honeypot, biarkan kosong)
export const kirimPertanyaanPublik = (payload) =>
  publicApi.post("/faq/ask", payload);