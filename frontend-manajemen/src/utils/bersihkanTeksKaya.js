/**
 * Membuang penanda format markdown-ringan dari jawaban FAQ.
 * Dipakai saat mengekspor data ke Excel/CSV agar berkas tidak berisi ** atau __.
 *
 * Sengaja dipisah dari `teksKaya.jsx` supaya berkas komponen hanya
 * mengekspor komponen (aturan react-refresh/only-export-components).
 */
export const bersihkanTeksKaya = (teks = "") =>
  String(teks)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^\s*[-*\u2022]\s+/gm, "\u2022 ")
    .trim();