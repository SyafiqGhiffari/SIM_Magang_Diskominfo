import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileUrl } from "./fileUrl";
import { pdfFontOf } from "../constants/certificateFonts";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Tinggi baris teks multi-baris (harus sama dengan TemplateDesignerModal.jsx)
const LINE_HEIGHT = 1.25;

const BULAN_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const fmtLong = (str) => {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtShort = (str) => {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const hexToRgb = (hex) => {
  const h = (hex || "#111111").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  if (isNaN(int)) return { r: 17, g: 17, b: 17 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

// Muat gambar sebagai elemen (butuh CORS diaktifkan di /uploads)
const loadImageEl = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

const imgToData = (img, mime = "image/png", quality) => {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d").drawImage(img, 0, 0);
  return { dataUrl: c.toDataURL(mime, quality), w: img.naturalWidth, h: img.naturalHeight };
};

/**
 * Membuat & mengunduh PDF sertifikat seorang peserta.
 * @param {object} row - baris dari getAllSertifikat (nama, bidang, institusi, tanggal_mulai/selesai, pendaftaran, sertifikat)
 * @param {object} pengaturan - dari getPengaturanSertifikat (file_template, tipe_template, tempat_terbit, file_ttd, file_stempel, konfigurasi_field)
 */
export const exportSertifikatPdf = async (row, pengaturan) => {
  const p = row?.pendaftaran || {};
  const s = row?.sertifikat || {};

  // Parse konfigurasi field
  let fields = [];
  try {
    const obj = JSON.parse(pengaturan?.konfigurasi_field || "{}");
    if (Array.isArray(obj.fields)) fields = obj.fields;
  } catch {
    // konfigurasi tidak valid → biarkan fields tetap []
  }

  const isMhs = p.kategori_pendaftar === "mahasiswa";
  const values = {
    nomor: s.nomor_sertifikat || "",
    nama: row.nama || p.nama_lengkap || "",
    tempat_tgl_lahir: [p.tempat_lahir, fmtLong(p.tanggal_lahir)].filter(Boolean).join(", "),
    fakultas_jurusan: isMhs ? [p.fakultas, p.program_studi].filter(Boolean).join(" / ") : (p.jurusan_sekolah || ""),
    nim_nisn: isMhs ? (p.npm_nim || "") : (p.nisn || ""),
    institusi: row.institusi || (isMhs ? p.asal_kampus : p.asal_sekolah) || "",
    periode: `${fmtShort(row.tanggal_mulai)} s.d. ${fmtShort(row.tanggal_selesai)}`,
    predikat: s.predikat || "",
    tempat_tgl_terbit: [pengaturan?.tempat_terbit, fmtLong(s.tanggal_terbit)].filter(Boolean).join(", "),
  };

  // Siapkan template sebagai gambar + dimensi natural (px)
  let templateDataUrl, templateFormat, imgW, imgH;
  if (pengaturan.tipe_template === "pdf") {
    const pdf = await pdfjsLib.getDocument(getFileUrl(pengaturan.file_template)).promise;
    const pageObj = await pdf.getPage(1);
    const viewport = pageObj.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pageObj.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    templateDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    templateFormat = "JPEG";
    imgW = viewport.width;
    imgH = viewport.height;
  } else {
    const timg = await loadImageEl(getFileUrl(pengaturan.file_template));
    if (!timg) throw new Error("Template gagal dimuat");
    imgW = timg.naturalWidth;
    imgH = timg.naturalHeight;
    templateDataUrl = imgToData(timg, "image/jpeg", 0.95).dataUrl;
    templateFormat = "JPEG";
  }

  // Halaman dalam pt (imgPx @ 96dpi → pt = px * 0.75)
  const pageW = imgW * 0.75;
  const pageH = imgH * 0.75;
  const orientation = pageW >= pageH ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: [pageW, pageH], compress: true });
  doc.addImage(templateDataUrl, templateFormat, 0, 0, pageW, pageH);

  // Penandatangan (dukungan >1). Kosong → fallback ke field lama.
  let penandatangan = [];
  try {
    const arr = JSON.parse(pengaturan?.penandatangan || "null");
    if (Array.isArray(arr)) penandatangan = arr;
  } catch { /* abaikan */ }
  const sigById = (id) => penandatangan.find((s) => String(s.id) === String(id)) || null;

  // Gambar tiap field
  for (const f of fields) {
    if (f.enabled === false) continue;
    const x = (f.xPct / 100) * pageW;
    const y = (f.yPct / 100) * pageH;

    if (f.type === "image") {
      let url = null;
      if (f.key === "pas_foto") url = getFileUrl(p.file_pas_foto);
      else if (f.key === "stempel") url = getFileUrl(pengaturan.file_stempel);
      else if (f.key === "logo") url = getFileUrl(pengaturan.file_logo);
      else if (f.key === "ttd") url = getFileUrl(pengaturan.file_ttd); // kompatibilitas lama
      else if (f.key.startsWith("ttd:")) { const s = sigById(f.key.slice(4)); url = s ? getFileUrl(s.file_ttd) : null; }
      if (!url) continue;
      const im = await loadImageEl(url);
      if (!im || !im.naturalWidth) continue;
      const w = (f.widthPct / 100) * pageW;
      const h = w * (im.naturalHeight / im.naturalWidth);
      const { dataUrl } = imgToData(im, "image/png");
      doc.addImage(dataUrl, "PNG", x - w / 2, y - h / 2, w, h);
    } else {
      let text;
      if (f.type === "text_static") text = f.value || "";
      else if (f.key.startsWith("nama_ttd:")) { const s = sigById(f.key.slice(9)); text = s?.nama || ""; }
      else if (f.key.startsWith("jabatan_ttd:")) { const s = sigById(f.key.slice(12)); text = s?.jabatan || ""; }
      else text = values[f.key] || "";
      if (!text) continue;
      // Gaya font: tebal / miring / keduanya
      let style = "normal";
      if (f.bold && f.italic) style = "bolditalic";
      else if (f.bold) style = "bold";
      else if (f.italic) style = "italic";
      doc.setFont(pdfFontOf(f.fontFamily), style);

      const size = (f.fontPct / 100) * pageH; // pt = % dari tinggi halaman (pt)
      doc.setFontSize(size);
      const { r, g, b } = hexToRgb(f.color);
      doc.setTextColor(r, g, b);

      // Dukungan teks multi-baris (Enter pada teks custom)
      const lines = String(text).split(/\r?\n/);
      const lineGap = size * LINE_HEIGHT;
      const align = f.align || "center";
      const startY = y - ((lines.length - 1) * lineGap) / 2;

      lines.forEach((line, i) => {
        const lineY = startY + i * lineGap;
        doc.text(line, x, lineY, { align, baseline: "middle" });
        if (f.underline && line.trim() !== "") {
          const w = doc.getTextWidth(line);
          const x0 = align === "left" ? x : align === "right" ? x - w : x - w / 2;
          const uy = lineY + size * 0.36;
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(Math.max(0.5, size * 0.05));
          doc.line(x0, uy, x0 + w, uy);
        }
      });
    }
  }

  const safeName = (row.nama || "peserta").replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`Sertifikat - ${safeName}.pdf`);
};