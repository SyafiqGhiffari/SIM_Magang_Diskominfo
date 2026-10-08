import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileUrl } from "./fileUrl";
import { pdfFontOf } from "../constants/certificateFonts";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Tinggi baris teks multi-baris
const LINE_HEIGHT = 1.25;

const BULAN_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const BULAN_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const fmtLong = (str) => {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return `${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtShort = (str) => {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const hexToRgb = (hex) => {
  const h = (hex || "#111111").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  if (isNaN(int)) return { r: 17, g: 17, b: 17 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

// Muat gambar sebagai elemen HTMLImageElement
const loadImageEl = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

const imgToData = (img, mime = "image/png", quality = 0.95) => {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || 800;
  c.height = img.naturalHeight || 600;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }
  return { dataUrl: c.toDataURL(mime, quality), w: c.width, h: c.height };
};

/**
 * Membuat background sertifikat resmi Diskominfo ke Canvas beresolusi tinggi (A4 Landscape 1754x1240 px)
 * jika file template belum diunggah admin atau gagal dimuat dari server.
 */
const createOfficialFallbackCanvas = () => {
  const c = document.createElement("canvas");
  c.width = 1754;
  c.height = 1240;
  const ctx = c.getContext("2d");
  if (!ctx) return { dataUrl: "", w: 1754, h: 1240 };

  const W = c.width;
  const H = c.height;

  // Latar belakang gradasi halus
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#FAF8F5");
  grad.addColorStop(0.5, "#FFFDFB");
  grad.addColorStop(1, "#FAF8F5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Border luar emas tebal
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 16;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Border dalam navy halus
  ctx.strokeStyle = "#004F9F";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Border aksen tipis emas
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(58, 58, W - 116, H - 116);

  // Sudut Ornamen Guilloche (4 pojok)
  const drawCorner = (x, y, dx, dy) => {
    ctx.save();
    ctx.strokeStyle = "#C5A028";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 45);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 45, y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(197, 160, 40, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx * 10, y + dy * 35);
    ctx.lineTo(x + dx * 10, y + dy * 10);
    ctx.lineTo(x + dx * 35, y + dy * 10);
    ctx.stroke();
    ctx.restore();
  };

  drawCorner(70, 70, 1, 1);
  drawCorner(W - 70, 70, -1, 1);
  drawCorner(70, H - 70, 1, -1);
  drawCorner(W - 70, H - 70, -1, -1);

  // Watermark tengah lambang keemasan
  ctx.save();
  ctx.strokeStyle = "rgba(212, 175, 55, 0.08)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 190, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Kop Resmi Dinas
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 22px 'Times New Roman', serif";
  ctx.fillStyle = "#004F9F";
  ctx.letterSpacing = "4px";
  ctx.fillText("PEMERINTAH KABUPATEN PONOROGO", W / 2, 120);

  ctx.font = "bold 28px 'Times New Roman', serif";
  ctx.fillStyle = "#0B1442";
  ctx.letterSpacing = "2px";
  ctx.fillText("DINAS KOMUNIKASI, INFORMATIKA DAN STATISTIK", W / 2, 160);

  ctx.font = "italic 16px 'Times New Roman', serif";
  ctx.fillStyle = "#64748b";
  ctx.letterSpacing = "1px";
  ctx.fillText("Jl. Ir. H. Juanda No. 19, Tonatan, Kec. Ponorogo, Kabupaten Ponorogo, Jawa Timur 63418", W / 2, 195);

  // Garis pemisah kop
  ctx.strokeStyle = "#004F9F";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 400, 220);
  ctx.lineTo(W / 2 + 400, 220);
  ctx.stroke();

  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 320, 225);
  ctx.lineTo(W / 2 + 320, 225);
  ctx.stroke();

  // Judul Sertifikat
  ctx.font = "bold 46px 'Times New Roman', serif";
  ctx.fillStyle = "#0B1442";
  ctx.letterSpacing = "5px";
  ctx.fillText("SERTIFIKAT KELULUSAN", W / 2, 290);

  ctx.font = "bold 18px 'Times New Roman', serif";
  ctx.fillStyle = "#B45309";
  ctx.letterSpacing = "3px";
  ctx.fillText("PRAKTIK KERJA LAPANGAN / MAGANG MANDIRI", W / 2, 335);

  // Garis aksen bawah judul
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, 355);
  ctx.lineTo(W / 2 + 180, 355);
  ctx.stroke();

  ctx.restore();

  return {
    dataUrl: c.toDataURL("image/jpeg", 0.95),
    w: W,
    h: H,
  };
};

/**
 * Membuat & mengunduh PDF sertifikat seorang peserta.
 * @param {object} row - baris dari getAllSertifikat / getSertifikatSaya (nama, bidang, institusi, tanggal_mulai/selesai, pendaftaran, sertifikat)
 * @param {object} pengaturan - dari getPengaturanSertifikat / template aktif (file_template, tipe_template, tempat_terbit, file_ttd, file_stempel, konfigurasi_field)
 */
export const exportSertifikatPdf = async (row, pengaturan = {}) => {
  const p = row?.pendaftaran || {};
  const s = row?.sertifikat || {};

  // Parse konfigurasi field
  let fields = [];
  try {
    const rawCfg = pengaturan?.konfigurasi_field;
    if (rawCfg) {
      const obj = JSON.parse(rawCfg);
      if (Array.isArray(obj.fields)) fields = obj.fields;
    }
  } catch {
    // konfigurasi tidak valid → fields tetap []
  }

  const isMhs = p.kategori_pendaftar === "mahasiswa";
  const values = {
    nomor: s.nomor_sertifikat || "",
    nama: row.nama || p.nama_lengkap || "",
    tempat_tgl_lahir: [p.tempat_lahir, fmtLong(p.tanggal_lahir)].filter(Boolean).join(", "),
    fakultas_jurusan: isMhs ? [p.fakultas, p.program_studi].filter(Boolean).join(" / ") : (p.jurusan_sekolah || ""),
    nim_nisn: isMhs ? (p.npm_nim || "") : (p.nisn || ""),
    institusi: row.institusi || (isMhs ? p.asal_kampus : p.asal_sekolah) || "",
    periode: `${fmtShort(row.tanggal_mulai)} – ${fmtShort(row.tanggal_selesai)}`,
    predikat: s.predikat || "Sangat Memuaskan",
    tempat_tgl_terbit: [pengaturan?.tempat_terbit || "Ponorogo", fmtLong(s.tanggal_terbit || new Date().toISOString())].filter(Boolean).join(", "),
  };

  // Siapkan template sebagai gambar + dimensi natural (px)
  let templateDataUrl = null;
  let templateFormat = "JPEG";
  let imgW = 1754;
  let imgH = 1240;

  const rawTemplatePath = pengaturan?.file_template || "";
  const fullTemplateUrl = rawTemplatePath ? getFileUrl(rawTemplatePath) : null;
  const tipeTemplate = (pengaturan?.tipe_template || "pdf").toLowerCase();

  // 1. Coba muat file template asli jika ada
  if (fullTemplateUrl) {
    if (tipeTemplate === "pdf") {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fullTemplateUrl,
          withCredentials: false,
        });
        const pdf = await loadingTask.promise;
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
      } catch (err) {
        console.warn("Gagal memuat file PDF template asli, beralih ke official canvas generator:", err);
      }
    } else {
      try {
        const timg = await loadImageEl(fullTemplateUrl);
        if (timg && timg.naturalWidth) {
          imgW = timg.naturalWidth;
          imgH = timg.naturalHeight;
          const { dataUrl } = imgToData(timg, "image/jpeg", 0.95);
          templateDataUrl = dataUrl;
          templateFormat = "JPEG";
        }
      } catch (err) {
        console.warn("Gagal memuat file gambar template asli, beralih ke official canvas generator:", err);
      }
    }
  }

  // 2. Jika template asli belum diunggah atau gagal dimuat, gunakan Fallback Desain Resmi Diskominfo
  if (!templateDataUrl) {
    const fallback = createOfficialFallbackCanvas();
    templateDataUrl = fallback.dataUrl;
    imgW = fallback.w;
    imgH = fallback.h;
    templateFormat = "JPEG";

    // Jika fields juga kosong, berikan tata letak resmi bawaan yang rapi dan elegan
    if (fields.length === 0) {
      fields = [
        {
          key: "nomor",
          xPct: 50,
          yPct: 32,
          fontPct: 2.1,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#64748B",
          align: "center",
        },
        {
          type: "text_static",
          value: "Diberikan kepada:",
          xPct: 50,
          yPct: 39,
          fontPct: 2.1,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#475569",
          align: "center",
        },
        {
          key: "nama",
          xPct: 50,
          yPct: 46,
          fontPct: 4.6,
          fontFamily: "Times New Roman",
          bold: true,
          underline: true,
          color: "#0B1442",
          align: "center",
        },
        {
          key: "institusi",
          xPct: 50,
          yPct: 53.5,
          fontPct: 2.5,
          fontFamily: "Times New Roman",
          bold: true,
          color: "#1E293B",
          align: "center",
        },
        {
          type: "text_static",
          value: "Telah menyelesaikan Program Magang / Praktik Kerja Lapangan dengan hasil capaian:",
          xPct: 50,
          yPct: 59.5,
          fontPct: 1.9,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#475569",
          align: "center",
        },
        {
          key: "predikat",
          xPct: 50,
          yPct: 65,
          fontPct: 3.0,
          fontFamily: "Times New Roman",
          bold: true,
          color: "#B45309",
          align: "center",
        },
        {
          key: "periode",
          xPct: 50,
          yPct: 70.5,
          fontPct: 1.9,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#64748B",
          align: "center",
        },
        {
          key: "tempat_tgl_terbit",
          xPct: 75,
          yPct: 77,
          fontPct: 1.8,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#334155",
          align: "center",
        },
        {
          type: "text_static",
          value: "Kepala Dinas Komunikasi, Informatika dan Statistik",
          xPct: 75,
          yPct: 80.5,
          fontPct: 1.8,
          fontFamily: "Times New Roman",
          bold: false,
          color: "#334155",
          align: "center",
        },
        {
          type: "image",
          key: "stempel",
          xPct: 68,
          yPct: 87,
          widthPct: 12,
        },
        {
          type: "image",
          key: "ttd",
          xPct: 75,
          yPct: 87,
          widthPct: 14,
        },
        {
          key: "nama_ttd",
          xPct: 75,
          yPct: 93.5,
          fontPct: 2.1,
          fontFamily: "Times New Roman",
          bold: true,
          underline: true,
          color: "#0B1442",
          align: "center",
        },
      ];
    }
  }

  // Halaman dalam pt (imgPx @ 96dpi → pt = px * 0.75)
  const pageW = imgW * 0.75;
  const pageH = imgH * 0.75;
  const orientation = pageW >= pageH ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: [pageW, pageH], compress: true });
  doc.addImage(templateDataUrl, templateFormat, 0, 0, pageW, pageH);

  // Penandatangan (dukungan multi-penandatangan)
  let penandatangan = [];
  try {
    const rawSig = pengaturan?.penandatangan;
    if (rawSig) {
      const arr = JSON.parse(rawSig);
      if (Array.isArray(arr)) penandatangan = arr;
    }
  } catch {
    /* abaikan */
  }

  const sigById = (id) => penandatangan.find((item) => String(item.id) === String(id)) || null;

  // Nama & Jabatan penandatangan default bawaan jika ada
  const defaultNamaTtd = pengaturan?.nama_penandatangan || "Drs. BAMBANG SUPRIYADI, M.Si";
  const defaultJabatanTtd = pengaturan?.jabatan_penandatangan || "Kepala Dinas Komunikasi, Informatika dan Statistik";

  // Gambar tiap field overlay
  for (const f of fields) {
    if (f.enabled === false) continue;
    const x = ((f.xPct ?? 50) / 100) * pageW;
    const y = ((f.yPct ?? 50) / 100) * pageH;

    if (f.type === "image") {
      let url = null;
      if (f.key === "pas_foto") url = p.file_pas_foto ? getFileUrl(p.file_pas_foto) : null;
      else if (f.key === "stempel") url = pengaturan.file_stempel ? getFileUrl(pengaturan.file_stempel) : null;
      else if (f.key === "logo") url = pengaturan.file_logo ? getFileUrl(pengaturan.file_logo) : null;
      else if (f.key === "ttd") url = pengaturan.file_ttd ? getFileUrl(pengaturan.file_ttd) : null;
      else if (String(f.key).startsWith("ttd:")) {
        const sObj = sigById(String(f.key).slice(4));
        url = sObj?.file_ttd ? getFileUrl(sObj.file_ttd) : null;
      }

      if (!url) continue;

      try {
        const im = await loadImageEl(url);
        if (!im || !im.naturalWidth) continue;
        const w = ((f.widthPct || 14) / 100) * pageW;
        const h = w * (im.naturalHeight / im.naturalWidth);
        const { dataUrl } = imgToData(im, "image/png");
        doc.addImage(dataUrl, "PNG", x - w / 2, y - h / 2, w, h);
      } catch (err) {
        console.warn("Gagal render gambar field:", f.key, err);
      }
    } else {
      let text;
      if (f.type === "text_static") text = f.value ?? "";
      else if (String(f.key).startsWith("nama_ttd:")) {
        const sObj = sigById(String(f.key).slice(9));
        text = sObj?.nama || defaultNamaTtd;
      } else if (String(f.key).startsWith("jabatan_ttd:")) {
        const sObj = sigById(String(f.key).slice(12));
        text = sObj?.jabatan || defaultJabatanTtd;
      } else if (f.key === "nama_ttd") {
        text = defaultNamaTtd;
      } else if (f.key === "jabatan_ttd") {
        text = defaultJabatanTtd;
      } else {
        text = values[f.key] ?? "";
      }

      if (!text || !String(text).trim()) continue;

      // Gaya font: normal / bold / italic / bolditalic
      let style = "normal";
      if (f.bold && f.italic) style = "bolditalic";
      else if (f.bold) style = "bold";
      else if (f.italic) style = "italic";

      try {
        doc.setFont(pdfFontOf(f.fontFamily), style);
      } catch {
        doc.setFont("times", style);
      }

      const size = Math.max(8, ((f.fontPct || 2.5) / 100) * pageH); // pt = % dari tinggi halaman
      doc.setFontSize(size);
      const { r, g, b } = hexToRgb(f.color);
      doc.setTextColor(r, g, b);

      // Dukungan teks multi-baris
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

  const safeName = (row.nama || p.nama_lengkap || "peserta")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();
  doc.save(`Sertifikat - ${safeName}.pdf`);
};