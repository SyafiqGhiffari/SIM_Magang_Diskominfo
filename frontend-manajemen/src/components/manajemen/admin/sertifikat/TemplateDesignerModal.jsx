import { useState, useEffect, useRef, useMemo } from "react";
import { getFileUrl } from "../../../../utils/fileUrl";
import {
  createTemplateSertifikat,
  updateTemplateSertifikat,
  uploadFileTemplateSertifikat,
} from "../../../../services/adminService";
import { toastSuccess, toastError } from "../../../../utils/swal";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, Loader2, Plus, Trash2, Eye, EyeOff, Type, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Check, Info, Upload, PenLine, Palette, Sparkles,
} from "lucide-react";
import AnimatedSelect from "./AnimatedSelect";
import FontSelect from "./FontSelect";
import { fontCss } from "../../../../constants/certificateFonts";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Field yang nilainya otomatis dari data peserta
const FIELD_CATALOG = [
  { key: "nomor", label: "Nomor Sertifikat", type: "text" },
  { key: "nama", label: "Nama Peserta", type: "text" },
  { key: "tempat_tgl_lahir", label: "Tempat, Tgl Lahir", type: "text" },
  { key: "fakultas_jurusan", label: "Fakultas / Jurusan", type: "text" },
  { key: "nim_nisn", label: "NIM / NISN", type: "text" },
  { key: "institusi", label: "Institusi / Kampus", type: "text" },
  { key: "periode", label: "Periode Magang", type: "text" },
  { key: "predikat", label: "Predikat", type: "text" },
  { key: "tempat_tgl_terbit", label: "Tempat & Tgl Terbit", type: "text" },
  { key: "pas_foto", label: "Pas Foto", type: "image" },
  { key: "stempel", label: "Stempel", type: "image" },
  { key: "logo", label: "Logo Instansi", type: "image" },
];

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

const KATEGORI_OPTS = ["Magang", "PKL"];
const JENIS_PESERTA_OPTS = [
  { value: "mahasiswa", label: "Mahasiswa (Magang)" },
  { value: "siswa", label: "Siswa (PKL)" },
];

// Tinggi baris untuk teks multi-baris (harus sama dengan exportSertifikatPdf.js)
const LINE_HEIGHT = 1.25;

const labelOf = (key) => FIELD_CATALOG.find((c) => c.key === key)?.label || key;
const round = (n) => Math.round(n * 100) / 100;

// Toleransi garis bantu (snap) dalam persen dari ukuran stage
const SNAP_TOL = 0.8;
const nearestSnap = (val, targets) => {
  let best = null;
  let bestDist = SNAP_TOL;
  for (const t of targets) {
    if (typeof t !== "number") continue;
    const d = Math.abs(val - t);
    if (d <= bestDist) { best = round(t); bestDist = d; }
  }
  return best;
};
const extOf = (name) => (name || "").slice(((name || "").lastIndexOf(".") >>> 0) + 1).toLowerCase();

const defaultField = (key, type) => {
  const base = { key, type, xPct: 50, yPct: 50, enabled: true };
  if (type === "image") return { ...base, widthPct: 16 };
  return { ...base, fontPct: 2.8, fontFamily: "helvetica", bold: false, italic: false, underline: false, align: "center", color: "#111111", ...(type === "text_static" ? { value: "Teks baru" } : {}) };
};
const normalize = (f) => {
  if (f.type === "image") return { widthPct: 16, enabled: true, xPct: 50, yPct: 50, ...f };
  return { fontPct: 2.8, fontFamily: "helvetica", bold: false, italic: false, underline: false, align: "center", color: "#111111", enabled: true, xPct: 50, yPct: 50, ...f };
};

const TemplateDesignerModal = ({ template = null, onClose, onSaved }) => {
  const isEdit = Boolean(template?.id);

  // ── Informasi Dasar ──
  const [nama, setNama] = useState(template?.nama || "");
  const [kategori, setKategori] = useState(template?.kategori || "Magang");
  const [jenisPeserta, setJenisPeserta] = useState(template?.jenis_peserta || "mahasiswa");
  const [orientasi, setOrientasi] = useState(template?.orientasi || "landscape");

  // ── Konfigurasi Tanda Tangan (bisa lebih dari 1) ──
  const [penandatangan, setPenandatangan] = useState(() => {
    try {
      const arr = JSON.parse(template?.penandatangan || "null");
      if (Array.isArray(arr) && arr.length) {
        return arr.map((s, i) => ({ id: s.id || `p${i + 1}`, nama: s.nama || "", jabatan: s.jabatan || "", file_ttd: s.file_ttd || "" }));
      }
    } catch { /* abaikan */ }
    // Kompatibilitas: template lama dengan 1 penandatangan
    if (template?.nama_penandatangan || template?.jabatan_penandatangan || template?.file_ttd) {
      return [{ id: "p1", nama: template.nama_penandatangan || "", jabatan: template.jabatan_penandatangan || "", file_ttd: template.file_ttd || "" }];
    }
    return [{ id: "p1", nama: "", jabatan: "", file_ttd: "" }];
  });
  const [tempatTerbit] = useState(template?.tempat_terbit || "Ponorogo");

  // ── File ──
  const [bgFile, setBgFile] = useState(null);
  const [stempelFile, setStempelFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [ttdFiles, setTtdFiles] = useState({}); // { [signatoryId]: File } — file TTD baru per penandatangan

  // ObjectURL diturunkan dari file (bukan state) agar tidak memanggil setState di dalam effect
  const bgObjUrl = useMemo(() => (bgFile && extOf(bgFile.name) !== "pdf" ? URL.createObjectURL(bgFile) : null), [bgFile]);
  const stempelObjUrl = useMemo(() => (stempelFile ? URL.createObjectURL(stempelFile) : null), [stempelFile]);
  const logoObjUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  const ttdObjUrls = useMemo(() => {
    const m = {};
    for (const [id, f] of Object.entries(ttdFiles)) if (f) m[id] = URL.createObjectURL(f);
    return m;
  }, [ttdFiles]);

  // ── Tata letak ──
  const [fields, setFields] = useState(() => {
    try {
      const obj = JSON.parse(template?.konfigurasi_field || "{}");
      return Array.isArray(obj.fields) ? obj.fields.map(normalize) : [];
    } catch { return []; }
  });
  const [selectedKey, setSelectedKey] = useState(null);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null); // "bg" | "ttd" | "stempel"
  const [guides, setGuides] = useState({ x: null, y: null }); // garis bantu saat menggeser elemen

  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  // Sumber background aktif
  const bgKind = useMemo(() => {
    if (bgFile) return extOf(bgFile.name) === "pdf" ? "pdf" : "image";
    if (template?.file_template) return template.tipe_template === "pdf" ? "pdf" : "image";
    return null;
  }, [bgFile, template]);
  const bgImgSrc = bgFile ? bgObjUrl : template?.file_template ? getFileUrl(template.file_template) : null;
  const stempelSrc = stempelFile ? stempelObjUrl : template?.file_stempel ? getFileUrl(template.file_stempel) : null;
  const logoSrc = logoFile ? logoObjUrl : template?.file_logo ? getFileUrl(template.file_logo) : null;
  // Sumber gambar TTD untuk 1 penandatangan (file baru → objectURL, else file tersimpan)
  const ttdSrcOf = (s) => (ttdFiles[s.id] ? ttdObjUrls[s.id] : s.file_ttd ? getFileUrl(s.file_ttd) : null);

  // Katalog field dinamis: field dasar + field per penandatangan
  const dynamicCatalog = useMemo(() => {
    const sig = [];
    penandatangan.forEach((s, i) => {
      sig.push({ key: `ttd:${s.id}`, label: `TTD Penandatangan ${i + 1}`, type: "image" });
      sig.push({ key: `nama_ttd:${s.id}`, label: `Nama Penandatangan ${i + 1}`, type: "text" });
      sig.push({ key: `jabatan_ttd:${s.id}`, label: `Jabatan Penandatangan ${i + 1}`, type: "text" });
    });
    return [...FIELD_CATALOG, ...sig];
  }, [penandatangan]);
  const labelOfKey = (key) => dynamicCatalog.find((c) => c.key === key)?.label || labelOf(key);
  const hasBackground = Boolean(bgFile || template?.file_template);

  const measure = () => {
    if (stageRef.current) setStageSize({ w: stageRef.current.clientWidth, h: stageRef.current.clientHeight });
  };

  // Revoke ObjectURL saat file berganti / unmount (tanpa setState di dalam effect)
  useEffect(() => () => { if (bgObjUrl) URL.revokeObjectURL(bgObjUrl); }, [bgObjUrl]);
  useEffect(() => () => { Object.values(ttdObjUrls).forEach((u) => u && URL.revokeObjectURL(u)); }, [ttdObjUrls]);
  useEffect(() => () => { if (stempelObjUrl) URL.revokeObjectURL(stempelObjUrl); }, [stempelObjUrl]);
  useEffect(() => () => { if (logoObjUrl) URL.revokeObjectURL(logoObjUrl); }, [logoObjUrl]);

  // Esc untuk tutup
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ukur stage
  useEffect(() => {
    if (!stageRef.current) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [bgKind, bgImgSrc]);

  // Render background PDF (dari File baru atau dari URL template lama).
  // Catatan: React StrictMode menjalankan effect dua kali. Tanpa pembatalan render
  // sebelumnya, pdf.js melempar error "same canvas" sehingga muncul toast
  // "Gagal merender background PDF" walau file-nya sebenarnya valid.
  useEffect(() => {
    if (bgKind !== "pdf") return;
    let cancelled = false;
    let loadingTask = null;
    let renderTask = null;

    const isCancelError = (err) => {
      const n = err?.name || "";
      return n === "RenderingCancelledException" || n === "AbortException" || /cancel/i.test(err?.message || "");
    };

    (async () => {
      try {
        // Tunggu <canvas> benar-benar ter-mount
        for (let i = 0; i < 40 && !canvasRef.current && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 25));
        }
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const src = bgFile ? { data: await bgFile.arrayBuffer() } : { url: getFileUrl(template.file_template) };
        loadingTask = pdfjsLib.getDocument(src);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const pageObj = await pdf.getPage(1);
        if (cancelled) return;

        const viewport = pageObj.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // "canvas" untuk pdf.js versi baru, "canvasContext" untuk versi lama
        renderTask = pageObj.render({ canvas, canvasContext: ctx, viewport });
        await renderTask.promise;
        if (!cancelled) measure();
      } catch (err) {
        if (cancelled || isCancelError(err)) return;
        console.error("Render background PDF gagal:", err);
        toastError("Gagal merender background PDF.");
      }
    })();

    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* noop */ }
      try { loadingTask?.destroy(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgKind, bgFile, template]);

  // ── Field helpers ──
  const updateField = (key, patch) => setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  const addField = (key, type) => {
    setFields((prev) => (prev.some((f) => f.key === key) ? prev : [...prev, defaultField(key, type)]));
    setSelectedKey(key);
  };
  const addCustom = () => {
    const key = `custom_${Date.now()}`;
    setFields((prev) => [...prev, defaultField(key, "text_static")]);
    setSelectedKey(key);
  };
  const removeField = (key) => {
    setFields((prev) => prev.filter((f) => f.key !== key));
    setSelectedKey((k) => (k === key ? null : k));
  };

  // ── Penandatangan helpers ──
  const addPenandatangan = () => setPenandatangan((prev) => [...prev, { id: `p${Date.now()}`, nama: "", jabatan: "", file_ttd: "" }]);
  const updatePenandatangan = (id, patch) => setPenandatangan((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removePenandatangan = (id) => {
    setPenandatangan((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
    setTtdFiles((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setFields((prev) => prev.filter((f) => !(f.key === `ttd:${id}` || f.key === `nama_ttd:${id}` || f.key === `jabatan_ttd:${id}`)));
    setSelectedKey((k) => (k && k.endsWith(`:${id}`) ? null : k));
  };

  // ── Drag ──
  const onPointerDown = (e, key) => {
    e.stopPropagation();
    setSelectedKey(key);
    dragRef.current = { key };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onPointerMove = (e) => {
    if (!dragRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    let xPct = ((e.clientX - rect.left) / rect.width) * 100;
    let yPct = ((e.clientY - rect.top) / rect.height) * 100;
    xPct = Math.max(0, Math.min(100, xPct));
    yPct = Math.max(0, Math.min(100, yPct));

    // Garis bantu ala Canva: tengah, sepertiga/seperempat halaman, dan sejajar elemen lain
    const key = dragRef.current.key;
    const others = fields.filter((f) => f.key !== key && f.enabled !== false);
    const snapX = nearestSnap(xPct, [10, 25, 50, 75, 90, ...others.map((o) => o.xPct)]);
    const snapY = nearestSnap(yPct, [10, 25, 50, 75, 90, ...others.map((o) => o.yPct)]);
    if (snapX !== null) xPct = snapX;
    if (snapY !== null) yPct = snapY;
    setGuides((prev) => (prev.x === snapX && prev.y === snapY ? prev : { x: snapX, y: snapY }));

    updateField(key, { xPct: round(xPct), yPct: round(yPct) });
  };
  const onPointerUp = (e) => {
    if (dragRef.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      dragRef.current = null;
    }
    setGuides((prev) => (prev.x === null && prev.y === null ? prev : { x: null, y: null }));
  };

  // ── Simpan ──
  const handleSave = async () => {
    if (!nama.trim()) { toastError("Nama template wajib diisi."); return; }
    if (!hasBackground) { toastError("Background template wajib diunggah."); return; }

    setSaving(true);
    try {
      const konfigurasi_field = JSON.stringify({ fields });
// Payload penandatangan (file_ttd lama tetap dikirim; file baru diunggah setelah simpan)
const penandatanganPayload = JSON.stringify(
  penandatangan.map((s) => ({ id: s.id, nama: (s.nama || "").trim(), jabatan: (s.jabatan || "").trim(), file_ttd: s.file_ttd || "" }))
);
const utama = penandatangan[0] || { nama: "", jabatan: "" }; // untuk kolom lama (kompatibilitas)
let id = template?.id;

  if (!isEdit) {
    const fd = new FormData();
    fd.append("nama", nama.trim());
    fd.append("kategori", kategori);
    fd.append("jenis_peserta", jenisPeserta);
    fd.append("orientasi", orientasi);
    fd.append("nama_penandatangan", (utama.nama || "").trim());
    fd.append("jabatan_penandatangan", (utama.jabatan || "").trim());
    fd.append("penandatangan", penandatanganPayload);
    fd.append("tempat_terbit", tempatTerbit);
    fd.append("konfigurasi_field", konfigurasi_field);
    fd.append("file", bgFile);
    const res = await createTemplateSertifikat(fd);
    id = res.data?.data?.id;
  } else {
    await updateTemplateSertifikat(id, {
      nama: nama.trim(),
      kategori,
      jenis_peserta: jenisPeserta,
      orientasi,
      nama_penandatangan: (utama.nama || "").trim(),
      jabatan_penandatangan: (utama.jabatan || "").trim(),
      penandatangan: penandatanganPayload,
      konfigurasi_field,
    });
    if (bgFile) {
      const fd = new FormData(); fd.append("file", bgFile);
      await uploadFileTemplateSertifikat(id, "template", fd);
    }
  }

  // Unggah file TTD baru per penandatangan (backend menyimpan path ke entri JSON yang sesuai)
  if (id) {
    for (const s of penandatangan) {
      const f = ttdFiles[s.id];
      if (!f) continue;
      const fd = new FormData();
      fd.append("file", f);
      fd.append("penandatangan_id", s.id);
      await uploadFileTemplateSertifikat(id, "ttd", fd);
    }
  }
  if (id && stempelFile) {
    const fd = new FormData(); fd.append("file", stempelFile);
    await uploadFileTemplateSertifikat(id, "stempel", fd);
  }
  if (id && logoFile) {
    const fd = new FormData(); fd.append("file", logoFile);
    await uploadFileTemplateSertifikat(id, "logo", fd);
  }

      toastSuccess(isEdit ? "Template berhasil diperbarui" : "Template berhasil dipublikasikan");
      onSaved?.();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan template.");
    } finally {
      setSaving(false);
    }
  };

  const selected = fields.find((f) => f.key === selectedKey) || null;
  const customFields = fields.filter((f) => f.type === "text_static");

  const renderChip = (f) => {
    const tx = f.type === "image" ? "-50%" : f.align === "left" ? "0" : f.align === "right" ? "-100%" : "-50%";
    const isSel = selectedKey === f.key;
    const common = {
      position: "absolute", left: `${f.xPct}%`, top: `${f.yPct}%`,
      transform: `translate(${tx}, -50%)`, cursor: "move",
      opacity: f.enabled ? 1 : 0.35, touchAction: "none",
    };

    if (f.type === "image") {
      const widthPx = (f.widthPct / 100) * stageSize.w;
      let src = null;
      if (f.key === "stempel") src = stempelSrc;
      else if (f.key === "logo") src = logoSrc;
      else if (f.key.startsWith("ttd:")) { const s = penandatangan.find((x) => x.id === f.key.slice(4)); src = s ? ttdSrcOf(s) : null; }
      return (
        <div key={f.key} onPointerDown={(e) => onPointerDown(e, f.key)} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          style={{ ...common, width: widthPx }} className={`select-none rounded-sm ${isSel ? "ring-2 ring-[#00A5EC] ring-offset-1" : ""}`}>
          {src ? (
            <img src={src} alt={f.key} draggable={false} className="w-full h-auto pointer-events-none" />
          ) : (
            <div className="pointer-events-none flex items-center justify-center rounded bg-slate-300/70 text-[9px] font-bold text-slate-700 border border-slate-400/50"
              style={{ width: "100%", aspectRatio: f.key === "pas_foto" ? "3 / 4" : "4 / 3" }}>
              {labelOfKey(f.key)}
            </div>
          )}
        </div>
      );
    }

    const fontPx = Math.max(6, (f.fontPct / 100) * stageSize.h);
    let text;
    if (f.type === "text_static") text = f.value === "" || f.value == null ? "Teks" : f.value;
    else if (f.key.startsWith("nama_ttd:")) { const s = penandatangan.find((x) => x.id === f.key.slice(9)); text = s?.nama || "Nama Penandatangan"; }
    else if (f.key.startsWith("jabatan_ttd:")) { const s = penandatangan.find((x) => x.id === f.key.slice(12)); text = s?.jabatan || "Jabatan"; }
    else text = SAMPLE[f.key] || labelOfKey(f.key);
    return (
      <div key={f.key} onPointerDown={(e) => onPointerDown(e, f.key)} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        style={{ ...common, fontSize: `${fontPx}px`, fontFamily: fontCss(f.fontFamily), fontWeight: f.bold ? 700 : 400,
        fontStyle: f.italic ? "italic" : "normal", textDecoration: f.underline ? "underline" : "none",
        textAlign: f.align === "left" ? "left" : f.align === "right" ? "right" : "center",
        color: f.color || "#111111", whiteSpace: "pre", lineHeight: LINE_HEIGHT }}
        className={`select-none ${isSel ? "outline outline-2 outline-[#00A5EC] outline-offset-2 rounded-sm" : ""}`}>
        {text}
      </div>
    );
  };

  // ── Drag & drop upload ──
  const setImageFile = (key, f) => {
    if (key === "bg") setBgFile(f);
    else if (key === "stempel") setStempelFile(f);
    else if (key === "logo") setLogoFile(f);
    else if (key.startsWith("ttd:")) { const id = key.slice(4); setTtdFiles((prev) => ({ ...prev, [id]: f })); }
  };
  const handleDropFile = (e, key) => {
    e.preventDefault();
    setDragOver(null);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    const accept = key === "bg" ? [".png", ".jpg", ".jpeg", ".pdf"] : [".png", ".jpg", ".jpeg"];
    if (!accept.includes(ext)) { toastError("Format file tidak didukung."); return; }
    setImageFile(key, f);
  };
  const dragProps = (key) => ({
    onDragOver: (e) => { e.preventDefault(); setDragOver(key); },
    onDragLeave: (e) => { e.preventDefault(); if (dragOver === key) setDragOver(null); },
    onDrop: (e) => handleDropFile(e, key),
  });

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15";
  const labelCls = "text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="flex h-[94vh] w-full max-w-[84rem] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-[modalFadeUp_0.3s_ease-out]">
        {/* Header */}
          <div className="relative flex items-center justify-between gap-3 overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-3.5 shrink-0">
            {/* Dekorasi */}
            <div className="absolute -right-15 -top-12 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <Palette className="absolute right-70 top-1/2 hidden -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.07] pointer-events-none lg:block w-24 h-24" strokeWidth={1} />

            <div className="relative flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white">
                <Palette className="w-4 h-4" />
                <span className="absolute -inset-1 rounded-xl border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
              </span>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Template" : "Template Baru"}
                </div>
                <h3 className="text-sm font-black text-white leading-tight truncate">{isEdit ? "Edit Template Sertifikat" : "Tambah Template Sertifikat"}</h3>
                <p className="text-[10.5px] text-white/60">Atur informasi, unggah background, lalu seret field ke posisinya</p>
              </div>
            </div>
            <div className="relative flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#0B1442] shadow-sm ring-1 ring-white/60 transition-all duration-200 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Simpan & Publikasikan
            </button>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-x-auto">
          {/* KIRI: Form */}
          <div className="w-80 shrink-0 border-r border-slate-100 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {/* Informasi Dasar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0B1442] flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#004F9F]" /> Informasi Dasar</p>
              <div>
                <label className={labelCls}>Nama Template</label>
                <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Sertifikat PKL Resmi" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kategori</label>
                <AnimatedSelect value={kategori} onChange={setKategori} options={KATEGORI_OPTS} />
              </div>
              <div>
                <label className={labelCls}>Jenis Peserta</label>
                <AnimatedSelect value={jenisPeserta} onChange={setJenisPeserta} options={JENIS_PESERTA_OPTS} />
                <p className="mt-1 text-[10px] text-slate-400 leading-snug">Menentukan template ini untuk mahasiswa (magang) atau siswa (PKL).</p>
              </div>
            </div>

            {/* Desain Sertifikat */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0B1442] flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-[#004F9F]" /> Desain Sertifikat</p>
              <div>
                <label className={labelCls}>Unggah Background</label>
                <label {...dragProps("bg")}
                  className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center cursor-pointer transition-all duration-200 ${
                    dragOver === "bg" ? "border-[#00A5EC] bg-blue-50/70 scale-[1.02]" : "border-slate-200 bg-slate-50/70 hover:border-[#00A5EC] hover:bg-blue-50/40 hover:-translate-y-0.5"
                  }`}>
                  <Upload className={`w-5 h-5 text-[#004F9F] transition-transform duration-300 ${dragOver === "bg" ? "scale-125 -translate-y-0.5" : "group-hover:scale-110 group-hover:-translate-y-0.5"}`} />
                  <span className="text-[11px] font-bold text-slate-600">{bgFile ? bgFile.name : hasBackground ? "Ganti background" : (dragOver === "bg" ? "Lepaskan file di sini" : "Pilih atau seret file")}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, atau PDF · maks 10MB</span>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setBgFile(f); e.target.value = ""; }} />
                </label>
              </div>
                <div>
                  <label className={labelCls}>Orientasi</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[{ v: "landscape", l: "Landscape" }, { v: "portrait", l: "Portrait" }].map((o) => (
                      <button key={o.v} onClick={() => setOrientasi(o.v)}
                      className={`h-9 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${orientasi === o.v ? "border-[#004F9F] bg-blue-50 text-[#004F9F] shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Logo Instansi (opsional)</label>
                  <label {...dragProps("logo")}
                    className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center cursor-pointer transition-all duration-200 ${
                      dragOver === "logo" ? "border-[#00A5EC] bg-blue-50/70 scale-[1.02]" : "border-slate-200 bg-slate-50/70 hover:border-[#00A5EC] hover:bg-blue-50/40 hover:-translate-y-0.5"
                    }`}>
                    {logoSrc ? (
                      <img src={logoSrc} alt="logo" className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <Upload className={`w-5 h-5 text-[#004F9F] transition-transform duration-300 ${dragOver === "logo" ? "scale-125 -translate-y-0.5" : "group-hover:scale-110 group-hover:-translate-y-0.5"}`} />
                    )}
                    <span className="text-[11px] font-bold text-slate-600">{logoSrc ? "Ganti logo" : (dragOver === "logo" ? "Lepaskan file di sini" : "Pilih atau seret file")}</span>
                    <span className="text-[10px] text-slate-400">PNG/JPG · latar transparan disarankan</span>
                    <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogoFile(f); e.target.value = ""; }} />
                  </label>
                  <p className="mt-1 text-[10px] text-slate-400 leading-snug">Setelah diunggah, tambahkan field <b>Logo Instansi</b> di editor lalu seret ke posisinya.</p>
                </div>
              </div>

            {/* Konfigurasi Tanda Tangan (bisa lebih dari 1) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#0B1442] flex items-center gap-1.5"><PenLine className="w-3.5 h-3.5 text-[#004F9F]" /> Penandatangan</p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#004F9F]">{penandatangan.length}</span>
              </div>

              {penandatangan.map((s, i) => {
                const src = ttdSrcOf(s);
                const dkey = `ttd:${s.id}`;
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5 transition-all duration-200 hover:border-slate-300 hover:bg-white">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#0B1442]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#004F9F] text-[10px] font-black text-white">{i + 1}</span>
                        Penandatangan {i + 1}
                      </span>
                      {penandatangan.length > 1 && (
                        <button onClick={() => removePenandatangan(s.id)} title="Hapus penandatangan" className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-all hover:bg-red-100 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Nama Penandatangan</label>
                      <input type="text" value={s.nama} onChange={(e) => updatePenandatangan(s.id, { nama: e.target.value })} placeholder="mis. drh. H. Sapto ..." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Jabatan</label>
                      <input type="text" value={s.jabatan} onChange={(e) => updatePenandatangan(s.id, { jabatan: e.target.value })} placeholder="mis. Kepala Dinas" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Tanda Tangan</label>
                      <label {...dragProps(dkey)}
                        className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center cursor-pointer transition-all duration-200 ${
                          dragOver === dkey ? "border-[#00A5EC] bg-blue-50/70 scale-[1.02]" : "border-slate-200 bg-white hover:border-[#00A5EC] hover:bg-blue-50/40 hover:-translate-y-0.5"
                        }`}>
                        {src ? (
                          <img src={src} alt="ttd" className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <Upload className={`w-5 h-5 text-[#004F9F] transition-transform duration-300 ${dragOver === dkey ? "scale-125 -translate-y-0.5" : "group-hover:scale-110 group-hover:-translate-y-0.5"}`} />
                        )}
                        <span className="text-[11px] font-bold text-slate-600">{src ? "Ganti tanda tangan" : (dragOver === dkey ? "Lepaskan file di sini" : "Pilih atau seret file")}</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG · latar transparan disarankan</span>
                        <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setTtdFiles((prev) => ({ ...prev, [s.id]: f })); e.target.value = ""; }} />
                      </label>
                    </div>
                  </div>
                );
              })}

              <button onClick={addPenandatangan} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-[#004F9F] transition-all duration-200 hover:border-[#00A5EC] hover:bg-blue-50/40 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                <Plus className="w-4 h-4" /> Tambah Penandatangan
              </button>

              <div className="border-t border-slate-100 pt-3">
                <label className={labelCls}>Stempel (opsional)</label>
                <label {...dragProps("stempel")}
                  className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center cursor-pointer transition-all duration-200 ${
                    dragOver === "stempel" ? "border-[#00A5EC] bg-blue-50/70 scale-[1.02]" : "border-slate-200 bg-slate-50/70 hover:border-[#00A5EC] hover:bg-blue-50/40 hover:-translate-y-0.5"
                  }`}>
                  {stempelSrc ? (
                    <img src={stempelSrc} alt="stempel" className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <Upload className={`w-5 h-5 text-[#004F9F] transition-transform duration-300 ${dragOver === "stempel" ? "scale-125 -translate-y-0.5" : "group-hover:scale-110 group-hover:-translate-y-0.5"}`} />
                  )}
                  <span className="text-[11px] font-bold text-slate-600">{stempelSrc ? "Ganti stempel" : (dragOver === "stempel" ? "Lepaskan file di sini" : "Pilih atau seret file")}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG · latar transparan disarankan</span>
                  <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setStempelFile(f); e.target.value = ""; }} />
                </label>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">Tiap penandatangan menghasilkan field <b>TTD</b>, <b>Nama</b>, dan <b>Jabatan</b> tersendiri di editor. Tambahkan lalu seret ke posisinya.</p>
            </div>
          </div>

          {/* KANAN: Editor Tata Letak */}
          <div className="flex flex-1 min-w-[420px] flex-col">
            {/* Toolbar chip field */}
            <div className="shrink-0 border-b border-slate-100 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Type className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Field Dinamis — klik untuk menambah</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dynamicCatalog.map((c) => {
                  const added = fields.some((f) => f.key === c.key);
                  return (
                    <button key={c.key} onClick={() => (added ? setSelectedKey(c.key) : addField(c.key, c.type))}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${added ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"}`}>
                      {c.type === "image" ? <ImageIcon className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                      {c.label}
                      {added ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
                    </button>
                  );
                })}
                <button onClick={addCustom} className="inline-flex items-center gap-1 rounded-full bg-[#0B1442] px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:bg-[#1E3A8A] hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer">
                  <Plus className="w-3 h-3" /> Teks Custom
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Stage */}
              <div className="flex-1 min-w-[300px] overflow-auto bg-slate-100 p-6">
                {!hasBackground ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500"><ImageIcon className="w-6 h-6" /></span>
                    <p className="text-sm font-bold text-slate-600">Belum ada background</p>
                    <p className="text-xs text-slate-400 max-w-xs">Unggah background di panel kiri untuk mulai menata field.</p>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-[760px]">
                    <div ref={stageRef} onPointerDown={() => setSelectedKey(null)} className="relative w-full select-none bg-white shadow-lg" style={{ touchAction: "none" }}>
                      {bgKind === "pdf" ? (
                        <canvas ref={canvasRef} className="block w-full h-auto" />
                      ) : (
                        <img src={bgImgSrc} alt="Template" draggable={false} onLoad={measure} className="block w-full h-auto pointer-events-none" />
                      )}
                      {fields.map(renderChip)}
                      {/* Garis bantu (smart guide) saat menggeser elemen */}
                      {guides.x !== null && (
                        <div className="pointer-events-none absolute inset-y-0 z-30 w-0 border-l border-dashed border-[#FF2D78]" style={{ left: `${guides.x}%` }}>
                          <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FF2D78]" />
                          <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FF2D78]" />
                        </div>
                      )}
                      {guides.y !== null && (
                        <div className="pointer-events-none absolute inset-x-0 z-30 h-0 border-t border-dashed border-[#FF2D78]" style={{ top: `${guides.y}%` }}>
                          <span className="absolute -left-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FF2D78]" />
                          <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FF2D78]" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-center text-[11px] text-slate-400">Pratinjau memakai data contoh. Nilai asli terisi otomatis saat sertifikat diterbitkan.</p>
                  </div>
                )}
              </div>

              {/* Properti field terpilih */}
              <div className="w-72 shrink-0 border-l border-slate-100 overflow-y-auto p-4">
                {!selected ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-300"><Type className="w-5 h-5" /></span>
                    <p className="text-xs font-bold text-slate-500">Pilih sebuah elemen</p>
                    <p className="text-[11px] text-slate-400">Klik chip di atas atau elemen di preview untuk mengubah propertinya.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-[#0B1442] truncate">{selected.type === "text_static" ? "Teks Custom" : labelOfKey(selected.key)}</h4>
                      <button onClick={() => updateField(selected.key, { enabled: !selected.enabled })} title={selected.enabled ? "Sembunyikan" : "Tampilkan"} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">
                        {selected.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {selected.type === "text_static" && (
                      <div>
                        <label className={labelCls}>Isi Teks</label>
                        <textarea
                          rows={3}
                          value={selected.value || ""}
                          onChange={(e) => updateField(selected.key, { value: e.target.value })}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder={"Ketik teks...\nTekan Enter untuk baris baru"}
                          className={`${inputCls} resize-y leading-relaxed whitespace-pre-wrap`}
                        />
                        <p className="mt-1 text-[10px] text-slate-400 leading-snug">Tekan <b>Enter</b> untuk menambah baris baru di bawah teks sebelumnya.</p>
                      </div>
                    )}

                    {selected.type === "image" ? (
                      <div>
                        <label className={labelCls}>Lebar ({selected.widthPct}%)</label>
                        <input type="range" min={3} max={60} step={0.5} value={selected.widthPct} onChange={(e) => updateField(selected.key, { widthPct: Number(e.target.value) })} className="w-full accent-[#004F9F] cursor-pointer" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className={labelCls}>Font</label>
                          <FontSelect value={selected.fontFamily || "helvetica"} onChange={(v) => updateField(selected.key, { fontFamily: v })} />
                        </div>
                        <div>
                          <label className={labelCls}>Ukuran Teks ({selected.fontPct}%)</label>
                          <input type="range" min={1} max={10} step={0.1} value={selected.fontPct} onChange={(e) => updateField(selected.key, { fontPct: Number(e.target.value) })} className="w-full accent-[#004F9F] cursor-pointer" />
                        </div>
                        <div>
                          <label className={labelCls}>Gaya Teks</label>
                          <div className="flex items-center gap-1.5">
                            {[
                              { k: "bold", title: "Tebal", icon: <Bold className="w-3.5 h-3.5" /> },
                              { k: "italic", title: "Miring (italic)", icon: <Italic className="w-3.5 h-3.5" /> },
                              { k: "underline", title: "Garis bawah (underline)", icon: <Underline className="w-3.5 h-3.5" /> },
                            ].map((b) => (
                              <button key={b.k} title={b.title} onClick={() => updateField(selected.key, { [b.k]: !selected[b.k] })}
                                className={`flex h-9 flex-1 items-center justify-center rounded-lg border transition-all cursor-pointer ${selected[b.k] ? "border-[#004F9F] bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
                                {b.icon}
                              </button>
                            ))}
                            <input type="color" value={selected.color || "#111111"} onChange={(e) => updateField(selected.key, { color: e.target.value })} title="Warna teks" className="h-9 w-10 shrink-0 rounded-lg border border-slate-200 bg-white cursor-pointer" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Perataan</label>
                          <div className="flex items-center gap-1.5">
                            {[{ v: "left", icon: <AlignLeft className="w-3.5 h-3.5" /> }, { v: "center", icon: <AlignCenter className="w-3.5 h-3.5" /> }, { v: "right", icon: <AlignRight className="w-3.5 h-3.5" /> }].map((a) => (
                              <button key={a.v} onClick={() => updateField(selected.key, { align: a.v })} className={`flex h-9 flex-1 items-center justify-center rounded-lg border transition-all cursor-pointer ${selected.align === a.v ? "border-[#004F9F] bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
                                {a.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className={labelCls}>Posisi (X / Y %)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step={0.5} min={0} max={100} value={selected.xPct} onChange={(e) => updateField(selected.key, { xPct: round(Math.max(0, Math.min(100, Number(e.target.value)))) })} className={inputCls} />
                        <input type="number" step={0.5} min={0} max={100} value={selected.yPct} onChange={(e) => updateField(selected.key, { yPct: round(Math.max(0, Math.min(100, Number(e.target.value)))) })} className={inputCls} />
                      </div>
                    </div>

                    {customFields.some((f) => f.key === selected.key) || dynamicCatalog.some((c) => c.key === selected.key) ? (
                      <button onClick={() => removeField(selected.key)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus dari template
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDesignerModal;