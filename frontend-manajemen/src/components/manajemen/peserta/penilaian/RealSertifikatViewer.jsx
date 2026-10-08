import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileUrl } from "../../../../utils/fileUrl";
import { fontCss } from "../../../../constants/certificateFonts";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  ShieldCheck,
  Award,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const LINE_HEIGHT = 1.25;

const BULAN_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

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
 * RealSertifikatViewer
 * Menampilkan sertifikat yang SEBENARNYA yang diterbitkan oleh admin:
 * - Menggunakan template latar belakang resmi (PDF atau Gambar)
 * - Meletakkan seluruh field sesuai konfigurasi tata letak admin
 * - Mengisi seluruh data nyata peserta, predikat, tanda tangan & stempel dinas
 * - Dilengkapi toolbar interaktif: Zoom in/out, Fullscreen lightbox, Unduh PDF, dan Cetak.
 */
export const RealSertifikatViewer = ({
  pengaturan = {},
  sertifikat = {},
  peserta = {},
  nilaiData = null,
  onDownload,
  isDownloading = false,
}) => {
  const containerRef = useRef(null);
  const [containerBox, setContainerBox] = useState({ w: 0, h: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileTemplate = pengaturan?.file_template || "";
  const isPdf = pengaturan?.tipe_template === "pdf";
  const bgKey = `${pengaturan?.id ?? ""}|${fileTemplate}`;

  const [bg, setBg] = useState({
    key: null,
    src: null,
    w: 0,
    h: 0,
    status: fileTemplate ? "loading" : "none",
  });

  const ready = bg.key === bgKey && bg.status === "ready";
  const hasTemplate = Boolean(fileTemplate) && bg.status !== "none";

  const p = useMemo(() => peserta?.pendaftaran || {}, [peserta]);
  const isMhs = p?.kategori_pendaftar === "mahasiswa";

  // Nilai Dinamis Riil Peserta
  const dynamicValues = useMemo(() => {
    const predikatFinal =
      sertifikat?.predikat ||
      nilaiData?.penilaian?.predikat_akhir ||
      "Sangat Memuaskan";

    const tempatTglTerbit = [
      pengaturan?.tempat_terbit || "Ponorogo",
      fmtLong(sertifikat?.tanggal_terbit || new Date()),
    ]
      .filter(Boolean)
      .join(", ");

    const tempatTglLahir = [
      p?.tempat_lahir,
      p?.tanggal_lahir ? fmtLong(p.tanggal_lahir) : null,
    ]
      .filter(Boolean)
      .join(", ");

    const fakJurusan = isMhs
      ? [p?.fakultas, p?.program_studi].filter(Boolean).join(" / ")
      : p?.jurusan_sekolah || "";

    const nimNisn = isMhs ? p?.npm_nim || "" : p?.nisn || "";
    const namaInstansi =
      peserta?.institusi ||
      (isMhs ? p?.asal_kampus : p?.asal_sekolah) ||
      "";

    const tglMulai = peserta?.tanggal_mulai || p?.tanggal_mulai || "";
    const tglSelesai = peserta?.tanggal_selesai || p?.tanggal_selesai || "";
    const periodeStr =
      tglMulai && tglSelesai
        ? `${fmtShort(tglMulai)} – ${fmtShort(tglSelesai)}`
        : "-";

    return {
      nomor: sertifikat?.nomor_sertifikat || "-",
      nama: peserta?.nama || p?.nama_lengkap || "-",
      tempat_tgl_lahir: tempatTglLahir || "-",
      fakultas_jurusan: fakJurusan || "-",
      nim_nisn: nimNisn || "-",
      institusi: namaInstansi || "-",
      periode: periodeStr,
      predikat: predikatFinal,
      tempat_tgl_terbit: tempatTglTerbit,
    };
  }, [sertifikat, peserta, p, isMhs, pengaturan, nilaiData]);

  // Observer Ukuran Kontainer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setContainerBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen]);

  // Muat Latar Belakang Template Asli (PDF atau Gambar)
  useEffect(() => {
    if (!fileTemplate) return;

    let cancelled = false;
    let loadingTask = null;
    let renderTask = null;

    const loadBg = async () => {
      try {
        if (isPdf) {
          loadingTask = pdfjsLib.getDocument({ url: getFileUrl(fileTemplate) });
          const pdf = await loadingTask.promise;
          if (cancelled) return;
          const page = await pdf.getPage(1);
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(2.5, Math.max(1, 1400 / base.width));
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");

          renderTask = page.render({ canvas, canvasContext: ctx, viewport });
          await renderTask.promise;
          if (cancelled) return;

          setBg({
            key: bgKey,
            src: canvas.toDataURL("image/jpeg", 0.95),
            w: viewport.width,
            h: viewport.height,
            status: "ready",
          });
        } else {
          const url = getFileUrl(fileTemplate);
          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Latar belakang template gagal dimuat"));
            i.src = url;
          });
          if (cancelled) return;
          setBg({
            key: bgKey,
            src: url,
            w: img.naturalWidth,
            h: img.naturalHeight,
            status: "ready",
          });
        }
      } catch (err) {
        if (cancelled || isCancelError(err)) return;
        console.error("Gagal merender latar belakang sertifikat:", err);
        setBg({ key: bgKey, src: null, w: 0, h: 0, status: "error" });
      }
    };

    loadBg();

    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* noop */ }
      try { loadingTask?.destroy(); } catch { /* noop */ }
    };
  }, [bgKey, fileTemplate, isPdf]);

  // Parse Konfigurasi Field & Penandatangan
  const konfigurasiField = pengaturan?.konfigurasi_field;
  const penandatanganRaw = pengaturan?.penandatangan;
  const namaPenandatangan = pengaturan?.nama_penandatangan;
  const jabatanPenandatangan = pengaturan?.jabatan_penandatangan;
  const fileTtd = pengaturan?.file_ttd;
  const fileStempel = pengaturan?.file_stempel;
  const fileLogo = pengaturan?.file_logo;

  const fields = useMemo(() => {
    const obj = parseJson(konfigurasiField, {});
    return Array.isArray(obj?.fields) ? obj.fields : [];
  }, [konfigurasiField]);

  const signatories = useMemo(() => {
    const arr = parseJson(penandatanganRaw, null);
    if (Array.isArray(arr) && arr.length) return arr;
    if (namaPenandatangan || jabatanPenandatangan || fileTtd) {
      return [{ id: "p1", nama: namaPenandatangan, jabatan: jabatanPenandatangan, file_ttd: fileTtd }];
    }
    return [];
  }, [penandatanganRaw, namaPenandatangan, jabatanPenandatangan, fileTtd]);

  const sigById = useCallback(
    (id) => signatories.find((s) => String(s.id) === String(id)) || null,
    [signatories]
  );

  // Perhitungan Ukuran Responsif Lembar Sertifikat
  // Mengikuti rasio background asli dan batas ideal 760px seperti desainer admin (TemplateDesignerModal)
  const aspectRatio = bg.w && bg.h ? bg.w / bg.h : 1.414358;
  const availableW = containerBox.w ? Math.max(300, containerBox.w - 16) : 740;
  const baseSheetW = Math.min(availableW, 760);
  const baseSheetH = baseSheetW / aspectRatio;

  const currentSheetW = baseSheetW * zoomScale;
  const currentSheetH = baseSheetH * zoomScale;

  // Zoom Handler
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoomScale(1);

  // Cetak Dokumen Langsung
  const handlePrint = () => {
    window.print();
  };

  // Keyboard shortcut ESC untuk keluar fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // Render Satu Field Dinamis (targetH dipakai agar ukuran font akurat terhadap tinggi kertas aktif)
  const renderField = (f, i, targetH = currentSheetH) => {
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
      if (f.key === "pas_foto") src = p?.file_pas_foto ? getFileUrl(p.file_pas_foto) : null;
      else if (f.key === "stempel") src = fileStempel ? getFileUrl(fileStempel) : null;
      else if (f.key === "logo") src = fileLogo ? getFileUrl(fileLogo) : null;
      else if (f.key === "ttd") src = fileTtd ? getFileUrl(fileTtd) : null;
      else if (String(f.key).startsWith("ttd:")) {
        const s = sigById(String(f.key).slice(4));
        src = s?.file_ttd ? getFileUrl(s.file_ttd) : null;
      }

      if (!src) return null;

      return (
        <img
          key={f.key || i}
          src={src}
          alt=""
          draggable={false}
          style={{ ...common, width }}
          className="h-auto object-contain select-none pointer-events-none"
        />
      );
    }

    const fontPx = ((f.fontPct || 2.8) / 100) * targetH;
    if (fontPx < 1) return null;

    let text;
    if (f.type === "text_static") text = f.value ?? "";
    else if (String(f.key).startsWith("nama_ttd:")) text = sigById(String(f.key).slice(9))?.nama || "";
    else if (String(f.key).startsWith("jabatan_ttd:")) text = sigById(String(f.key).slice(12))?.jabatan || "";
    else text = dynamicValues[f.key] || "";
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
        className="select-none pointer-events-none tracking-normal"
      >
        {text}
      </div>
    );
  };

  // Tampilan Sertifikat Desain Resmi Bawaan (Bila Template Kosong / Belum Diunggah)
  const renderFallbackOfficialDesign = () => (
    <div className="relative w-full h-full bg-gradient-to-b from-[#FAF8F5] via-[#FFFDFB] to-[#FAF8F5] text-slate-800 p-8 sm:p-14 flex flex-col justify-between overflow-hidden shadow-2xl border-[10px] border-[#D4AF37]/35 select-none">
      {/* Sudut Ornamen Guilloche */}
      <div className="absolute top-3 left-3 w-16 h-16 border-t-4 border-l-4 border-[#C5A028] rounded-tl-sm pointer-events-none" />
      <div className="absolute top-3 right-3 w-16 h-16 border-t-4 border-r-4 border-[#C5A028] rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-16 h-16 border-b-4 border-l-4 border-[#C5A028] rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-16 h-16 border-b-4 border-r-4 border-[#C5A028] rounded-br-sm pointer-events-none" />
      <div className="absolute inset-5 border border-[#C5A028]/30 pointer-events-none" />

      {/* Watermark Logo Lambang */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <Award className="w-96 h-96 text-amber-900" />
      </div>

      {/* Header Kop Resmi */}
      <div className="text-center space-y-1.5 relative z-10 pt-2">
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#004F9F]">
          Pemerintah Kabupaten Ponorogo
        </p>
        <p className="text-[12px] sm:text-sm font-extrabold uppercase tracking-[0.18em] text-[#0B1442]">
          Dinas Komunikasi, Informatika dan Statistik
        </p>
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#C5A028] to-transparent mx-auto my-2" />
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black tracking-wider text-[#0B1442] uppercase pt-1">
          Sertifikat Magang
        </h1>
        <p className="font-mono text-[11px] sm:text-xs font-bold text-slate-500 pt-0.5">
          Nomor: {dynamicValues.nomor}
        </p>
      </div>

      {/* Isi Sertifikat */}
      <div className="text-center space-y-4 my-auto relative z-10 max-w-2xl mx-auto py-4">
        <p className="text-xs sm:text-sm italic font-serif text-slate-600">
          Diberikan kepada:
        </p>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-3xl font-black text-[#0B1442] tracking-wide underline decoration-[#D4AF37]/50 underline-offset-8">
            {dynamicValues.nama}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 pt-1">
            {dynamicValues.nim_nisn !== "-" && <span className="font-mono">NIM/NISN: {dynamicValues.nim_nisn} • </span>}
            {dynamicValues.institusi}
          </p>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-slate-700 max-w-xl mx-auto pt-2">
          Atas dedikasi dan keberhasilannya dalam menyelesaikan program Praktik Kerja Lapangan / Magang pada Bidang{" "}
          <strong className="text-[#004F9F] font-bold">{peserta?.bidang || p?.posisi_bidang || "Teknologi Informasi & Komunikasi"}</strong> periode{" "}
          <strong>{dynamicValues.periode}</strong> dengan predikat kelulusan:
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border border-[#C5A028]/40 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
            {dynamicValues.predikat}
          </span>
        </div>
      </div>

      {/* Footer Tanda Tangan & Stempel */}
      <div className="relative z-10 pt-4 flex items-end justify-between text-xs sm:text-sm px-4">
        {/* Pas Foto atau QR Cap */}
        <div className="flex flex-col items-center">
          {p?.file_pas_foto ? (
            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-sm border-2 border-slate-300 overflow-hidden shadow-xs">
              <img src={getFileUrl(p.file_pas_foto)} alt="Pas Foto" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-amber-700">
              <ShieldCheck className="w-8 h-8" />
              <span className="text-[9px] font-bold uppercase mt-1">Diskominfo</span>
            </div>
          )}
        </div>

        {/* Pejabat Penandatangan */}
        <div className="text-right space-y-1 relative">
          <p className="text-[11px] sm:text-xs text-slate-600">{dynamicValues.tempat_tgl_terbit}</p>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">
            {jabatanPenandatangan || "Kepala Dinas Komunikasi dan Informatika"}
          </p>

          <div className="h-16 flex items-center justify-end relative my-1">
            {fileStempel && (
              <img
                src={getFileUrl(fileStempel)}
                alt="Stempel"
                className="absolute right-12 w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-85 pointer-events-none"
              />
            )}
            {fileTtd ? (
              <img src={getFileUrl(fileTtd)} alt="TTD" className="h-14 sm:h-16 object-contain z-10 pointer-events-none" />
            ) : (
              <span className="italic font-serif text-slate-400 text-xs z-10">[Tanda Tangan Digital Resmi]</span>
            )}
          </div>

          <p className="font-black text-slate-900 text-xs sm:text-sm underline decoration-slate-400">
            {namaPenandatangan || "Drs. BAMBANG SUPRIYADI, M.Si"}
          </p>
          <p className="font-mono text-[10px] text-slate-500">NIP. 19720815 199803 1 004</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 sm:p-7 shadow-xs">
      {/* ── Header Kartu Terpadu: Sesuai style Naskah Laporan Akhir Magang ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br from-[#0B1442] to-[#00A5EC]">
            <Award className="w-5 h-5 text-white" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Pratinjau Sertifikat Resmi</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Telah Terbit
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Dokumen asli sesuai tata letak resmi Diskominfo Ponorogo
            </p>
          </div>
        </div>

        {/* Tombol Kontrol: Zoom, Fullscreen, Print */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Controls */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 0.6}
              title="Perkecil (-15%)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[42px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 2.0}
              title="Perbesar (+15%)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom (100%)"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            title="Layar Penuh"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400" />
            <span className="hidden sm:inline">Layar Penuh</span>
          </button>

          {/* Cetak Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak Sertifikat"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* ── Wadah Canvas Sertifikat Utama (Terpadu dalam satu kartu) ── */}
      <div
        ref={containerRef}
        className="relative mt-5 w-full overflow-x-auto overflow-y-hidden rounded-2xl bg-slate-900/5 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 p-3 sm:p-6 flex items-center justify-center min-h-[380px] sm:min-h-[500px]"
      >
        {bg.status === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#004F9F] dark:text-sky-400" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Menyiapkan dokumen sertifikat resmi...
            </p>
          </div>
        ) : (
          <div
            style={{
              width: `${currentSheetW}px`,
              height: `${currentSheetH}px`,
              transition: "width 0.15s ease-out, height 0.15s ease-out",
            }}
            className="relative shrink-0 rounded-lg shadow-2xl overflow-hidden bg-white ring-1 ring-black/10 select-none"
          >
            {hasTemplate && ready ? (
              <>
                <img
                  src={bg.src}
                  alt="Template Sertifikat"
                  draggable={false}
                  className="absolute inset-0 w-full h-full select-none pointer-events-none"
                />
                {fields.map((f, i) => renderField(f, i, currentSheetH))}
              </>
            ) : (
              renderFallbackOfficialDesign()
            )}
          </div>
        )}
      </div>

      {/* ── Modal Layar Penuh (Fullscreen Lightbox) ── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-[fadein_0.2s_ease-out]">
          {/* Header Lightbox */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-white/10 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-sky-400">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">
                  Pratinjau Layar Penuh Sertifikat
                </h3>
                <p className="text-[11px] text-slate-400">
                  {dynamicValues.nama} • {dynamicValues.nomor}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center bg-slate-800 rounded-lg p-1 border border-white/10">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 0.6}
                  className="p-1 rounded text-slate-300 hover:bg-slate-700 cursor-pointer disabled:opacity-40"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-mono font-bold text-slate-200">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 2.0}
                  className="p-1 rounded text-slate-300 hover:bg-slate-700 cursor-pointer disabled:opacity-40"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 rounded text-slate-400 hover:bg-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004F9F] hover:bg-[#003B7A] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer ml-2"
                title="Keluar (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Viewer Lightbox */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
            {(() => {
              const maxFsW = typeof window !== "undefined" ? Math.min(window.innerWidth * 0.9, 1200) : 960;
              const maxFsH = typeof window !== "undefined" ? (window.innerHeight - 120) : 680;
              let fsW = maxFsW;
              let fsH = fsW / aspectRatio;
              if (fsH > maxFsH) {
                fsH = maxFsH;
                fsW = fsH * aspectRatio;
              }
              const finalFsW = fsW * zoomScale;
              const finalFsH = fsH * zoomScale;

              return (
                <div
                  style={{
                    width: `${finalFsW}px`,
                    height: `${finalFsH}px`,
                  }}
                  className="relative shrink-0 rounded-lg shadow-2xl overflow-hidden bg-white ring-1 ring-white/10 select-none my-auto"
                >
                  {hasTemplate && ready ? (
                    <>
                      <img
                        src={bg.src}
                        alt="Template Sertifikat"
                        draggable={false}
                        className="absolute inset-0 w-full h-full select-none pointer-events-none"
                      />
                      {fields.map((f, i) => renderField(f, i, finalFsH))}
                    </>
                  ) : (
                    renderFallbackOfficialDesign()
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealSertifikatViewer;
