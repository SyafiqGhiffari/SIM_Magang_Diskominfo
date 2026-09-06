/**
 * Membuang penanda format markdown-ringan dari jawaban FAQ dan percakapan.
 * Dipakai saat mengekspor data ke Excel/CSV atau menampilkan preview baris ringkas.
 *
 * Sengaja dipisah dari `teksKaya.jsx` supaya berkas komponen hanya
 * mengekspor komponen (aturan react-refresh/only-export-components).
 */
export const bersihkanTeksKaya = (teks = "") =>
  String(teks)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/^\s*[-*\u2022]\s+/gm, "\u2022 ")
    .trim();