import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileUrl } from "../../../../utils/fileUrl";
import { ImageOff, Loader2 } from "lucide-react";
import { fontCss } from "../../../../constants/certificateFonts";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Harus sama dengan TemplateDesignerModal.jsx & exportSertifikatPdf.js
const LINE_HEIGHT = 1.25;

// Data contoh (sama seperti pratinjau di modal desainer)
const SAMPLE = {
  nomor: "400.14.5.4/123/405.20/2025",
  nama: "Budi Santoso",
  tempat_tgl_lahir: "Ponorogo, 12 Januari 2003",
  fakultas_jurusan: "Teknik / Informatika",
  nim_nisn: "20210801001",
  institusi: "Universitas Contoh",
  periode: "12 Jul 2025 – 12 Sep 2025",
  predikat: "Baik",
  tempat_tgl_terbit: "Ponorogo, 25 Juli 2026",
};

const parseJson = (raw, fallback) => {
  try {
    const v = JSON.parse(raw || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const isCancelError = (err) => {
  const n = err?.name || "";
  return n === "RenderingCancelledException" || n === "AbortException" || /cancel/i.test(err?.message || "");
};

/**
 * Pratinjau utuh sebuah template sertifikat: background (gambar/PDF) LENGKAP
 * dengan seluruh field yang sudah ditata admin (teks, logo, stempel, tanda
 * tangan, teks custom multi-baris, italic, underline).
 */
const TemplatePreview = ({ template, showPlaceholder = true }) => {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const fileTemplate = template?.file_template || "";
  const isPdf = template?.tipe_template === "pdf";
  const bgKey = `${template?.id ?? ""}|${fileTemplate}`;

  // Status disimpan bersama key-nya → otomatis "loading" saat template berganti,
  // tanpa setState sinkron di dalam body effect.
  const [bg, setBg] = useState({ key: null, src: null, w: 0, h: 0, status: "loading" });
  const ready = bg.key === bgKey && bg.status === "ready";
  const failed = bg.key === bgKey && bg.status === "error";

  // ── Ukur area kartu ──
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Muat background (gambar langsung / PDF dirender jadi gambar) ──
  useEffect(() => {
    if (!fileTemplate) return;

    let cancelled = false;
    let loadingTask = null;
    let renderTask = null;

    const run = async () => {
      try {
        if (isPdf) {
          loadingTask = pdfjsLib.getDocument({ url: getFileUrl(fileTemplate) });
          const pdf = await loadingTask.promise;
          if (cancelled) return;
          const page = await pdf.getPage(1);
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(2, Math.max(0.6, 900 / base.width));
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");

          // "canvas" untuk pdf.js versi baru, "canvasContext" untuk versi lama
          renderTask = page.render({ canvas, canvasContext: ctx, viewport });
          await renderTask.promise;
          if (cancelled) return;

          setBg({ key: bgKey, src: canvas.toDataURL("image/jpeg", 0.9), w: viewport.width, h: viewport.height, status: "ready" });
        } else {
          const url = getFileUrl(fileTemplate);
          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Gambar template gagal dimuat"));
            i.src = url;
          });
          if (cancelled) return;
          setBg({ key: bgKey, src: url, w: img.naturalWidth, h: img.naturalHeight, status: "ready" });
        }
      } catch (err) {
        if (cancelled || isCancelError(err)) return;
        console.error("Gagal memuat pratinjau template:", err);
        setBg({ key: bgKey, src: null, w: 0, h: 0, status: "error" });
      }
    };

    run();

    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* noop */ }
      try { loadingTask?.destroy(); } catch { /* noop */ }
    };
  }, [bgKey, fileTemplate, isPdf]);

  // ── Konfigurasi field & penandatangan ──
  // Nilai diambil ke variabel lokal lebih dulu supaya dependency useMemo
  // persis sama dengan yang dibaca di dalamnya (syarat React Compiler).
  const konfigurasiField = template?.konfigurasi_field;
  const penandatanganRaw = template?.penandatangan;
  const namaPenandatangan = template?.nama_penandatangan;
  const jabatanPenandatangan = template?.jabatan_penandatangan;
  const fileTtd = template?.file_ttd;
  const fileStempel = template?.file_stempel;
  const fileLogo = template?.file_logo;

  const fields = useMemo(() => {
    const obj = parseJson(konfigurasiField, {});
    return Array.isArray(obj?.fields) ? obj.fields : [];
  }, [konfigurasiField]);

  const signatories = useMemo(() => {
    const arr = parseJson(penandatanganRaw, null);
    if (Array.isArray(arr) && arr.length) return arr;
    // Kompatibilitas template lama (1 penandatangan)
    if (namaPenandatangan || jabatanPenandatangan || fileTtd) {
      return [{ id: "p1", nama: namaPenandatangan, jabatan: jabatanPenandatangan, file_ttd: fileTtd }];
    }
    return [];
  }, [penandatanganRaw, namaPenandatangan, jabatanPenandatangan, fileTtd]);

  const sigById = (id) => signatories.find((s) => String(s.id) === String(id)) || null;

  // ── Hitung ukuran "kertas" sertifikat agar pas di dalam kartu (contain) ──
  const ratio = bg.w && bg.h ? bg.w / bg.h : 4 / 3;
  const boxRatio = box.h ? box.w / box.h : ratio;
  const sheetW = boxRatio > ratio ? box.h * ratio : box.w;
  const sheetH = boxRatio > ratio ? box.h : box.w / ratio;

  const renderField = (f, i) => {
    if (!f || f.enabled === false) return null;

    const tx = f.type === "image" ? "-50%" : f.align === "left" ? "0" : f.align === "right" ? "-100%" : "-50%";
    const common = {
      position: "absolute",
      left: `${f.xPct ?? 50}%`,
      top: `${f.yPct ?? 50}%`,
      transform: `translate(${tx}, -50%)`,
    };

    if (f.type === "image") {
      const width = `${f.widthPct || 16}%`;
      let src = null;
      if (f.key === "stempel") src = fileStempel ? getFileUrl(fileStempel) : null;
      else if (f.key === "logo") src = fileLogo ? getFileUrl(fileLogo) : null;
      else if (f.key === "ttd") src = fileTtd ? getFileUrl(fileTtd) : null;
      else if (String(f.key).startsWith("ttd:")) {
        const s = sigById(String(f.key).slice(4));
        src = s?.file_ttd ? getFileUrl(s.file_ttd) : null;
      }

      if (!src) {
        // pas foto peserta belum ada saat pratinjau → tampilkan kotak samar
        if (!showPlaceholder) return null;
        return (
          <div key={f.key || i} style={{ ...common, width }} className="rounded-[2px] bg-slate-400/15 ring-1 ring-inset ring-slate-400/25">
            <div style={{ aspectRatio: f.key === "pas_foto" ? "3 / 4" : "4 / 3" }} />
          </div>
        );
      }
      return <img key={f.key || i} src={src} alt="" draggable={false} style={{ ...common, width }} className="h-auto object-contain" />;
    }

    const fontPx = ((f.fontPct || 2.8) / 100) * sheetH;
    if (fontPx < 1) return null;

    let text;
    if (f.type === "text_static") text = f.value ?? "";
    else if (String(f.key).startsWith("nama_ttd:")) text = sigById(String(f.key).slice(9))?.nama || "";
    else if (String(f.key).startsWith("jabatan_ttd:")) text = sigById(String(f.key).slice(12))?.jabatan || "";
    else text = SAMPLE[f.key] || "";
    if (!String(text).trim()) return null;

    return (
      <div
        key={f.key || i}
        style={{
          ...common,
          fontSize: `${fontPx}px`,
          fontFamily: fontCss(f.fontFamily),
          fontWeight: f.bold ? 700 : 400,
          fontStyle: f.italic ? "italic" : "normal",
          textDecoration: f.underline ? "underline" : "none",
          textAlign: f.align === "left" ? "left" : f.align === "right" ? "right" : "center",
          color: f.color || "#111111",
          whiteSpace: "pre",
          lineHeight: LINE_HEIGHT,
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div ref={boxRef} className="flex h-full w-full items-center justify-center">
      {!fileTemplate || failed ? (
        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300">
          <ImageOff className="w-7 h-7" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Tanpa Pratinjau</span>
        </div>
      ) : !ready || !box.w ? (
        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
      ) : (
        <div
          className="relative overflow-hidden rounded-[3px] bg-white shadow-[0_6px_18px_-6px_rgba(11,20,66,0.35)] ring-1 ring-slate-900/5"
          style={{ width: `${sheetW}px`, height: `${sheetH}px` }}
        >
          <img src={bg.src} alt={template?.nama || "Template"} draggable={false} className="absolute inset-0 h-full w-full" />
          {fields.map(renderField)}
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;