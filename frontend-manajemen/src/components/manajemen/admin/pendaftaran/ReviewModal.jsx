import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, Download,
  CheckCircle2, XCircle, Circle, FileText, Loader2, GraduationCap, ChevronDown, ClipboardCheck, MessageSquareText, Info,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { confirmDialog, toastSuccess, toastError } from "../../../../utils/swal";
import { updateStatusPendaftaran, getDetailPendaftaran } from "../../../../services/adminService";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const docList = (p) => [
  { key: "file_pas_foto", label: "Pas Foto", isImage: true },
  { key: "file_surat_pengantar", label: "Surat Pengantar", isImage: false },
  { key: "file_cv", label: "CV", isImage: false },
  { key: "file_transkrip", label: "Transkrip/Rapor", isImage: false },
  { key: "file_portofolio", label: "Portofolio", isImage: false },
  { key: "file_proposal_magang", label: "Proposal Magang", isImage: false },
].map((d) => ({ ...d, url: getFileUrl(p[d.key]), uploaded: Boolean(p[d.key]) }));

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const fmtShortDate = (isoStr) => {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const fetchAsBlobUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const ReviewModal = ({ pendaftaran, onClose, onUpdated }) => {
  const documents = docList(pendaftaran);
  const uploadedDocs = documents.filter((d) => d.uploaded);
  const [activeIdx, setActiveIdx] = useState(Math.max(0, documents.findIndex((d) => d.uploaded)));
  const [expandedKey, setExpandedKey] = useState(documents[Math.max(0, documents.findIndex((d) => d.uploaded))]?.key);
  const [zoom, setZoom] = useState(100);
  const [loadingAction, setLoadingAction] = useState(null);
  const [fileActionLoading, setFileActionLoading] = useState(null);

  // ==== PERUBAHAN: refresh data tabel setiap kali modal ditutup ====
  // Karena persistProgress() hanya menyimpan ke backend tanpa memperbarui state
  // di komponen induk (PendaftaranPage), tabel bisa menampilkan data usang
  // (misalnya status "Verifikasi" tetap terkunci padahal semua berkas sudah disetujui)
  // sampai halaman di-reload manual. Memanggil onUpdated() saat modal ditutup
  // memastikan tabel selalu sinkron dengan progres terakhir tanpa perlu reload.
  const handleClose = () => {
    onUpdated();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ==== AKHIR PERUBAHAN ====

  const activeDoc = documents[activeIdx];
  const isMahasiswa = pendaftaran.kategori_pendaftar === "mahasiswa";

  const [docStatus, setDocStatus] = useState({});
  const [docNotes, setDocNotes] = useState({});
  const [catatanPeserta, setCatatanPeserta] = useState({});

  // ==== PERUBAHAN: selalu ambil data terbaru dari server saat modal dibuka ====
  // Prop `pendaftaran` dari parent bisa saja usang (stale) kalau parent belum sempat
  // fetch ulang sejak modal terakhir ditutup. Supaya checklist selalu akurat tanpa
  // perlu reload halaman, kita ambil ulang detail terbaru langsung dari API setiap
  // kali modal ini dipasang (mount).
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const res = await getDetailPendaftaran(pendaftaran.id);
        const fresh = res.data.data;

        if (fresh.detail_verifikasi) {
          try {
            const parsed = JSON.parse(fresh.detail_verifikasi);
            const status = {};
            const notes = {};
            Object.entries(parsed).forEach(([key, val]) => {
              if (val?.status) status[key] = val.status;
              if (val?.note) notes[key] = val.note;
            });
            setDocStatus(status);
            setDocNotes(notes);
          } catch {
            // biarkan kosong kalau data tidak valid/rusak
          }
        }

        if (fresh.catatan_peserta) {
          try {
            setCatatanPeserta(JSON.parse(fresh.catatan_peserta) || {});
          } catch {
            // biarkan kosong kalau data tidak valid/format lama
          }
        }
      } catch {
        // kalau gagal fetch, biarkan checklist kosong — admin bisa mulai meninjau dari awal
      }
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ==== AKHIR PERUBAHAN ====

  const persistProgress = async (nextStatus, nextNotes) => {
    try {
      const detail = {};
      uploadedDocs.forEach((d) => {
        detail[d.key] = { status: nextStatus[d.key] || null, note: nextNotes[d.key] || "" };
      });
      // Status pendaftaran & catatan_admin TIDAK diubah di sini — hanya menyimpan progres
      // checklist (detail_verifikasi) supaya tidak hilang saat modal ditutup sebelum selesai.
      await updateStatusPendaftaran(pendaftaran.id, {
        status_pendaftaran: pendaftaran.status_pendaftaran,
        catatan_admin: pendaftaran.catatan_admin || "",
        detail_verifikasi: JSON.stringify(detail),
        silent: true,
      });
    } catch {
      // gagal simpan progres tidak perlu mengganggu alur kerja admin — biarkan senyap,
      // toh progres tetap tersimpan sementara di state lokal selama modal masih terbuka
    }
  };

  const setStatusFor = (key, status) => {
    setDocStatus((prev) => {
      const next = { ...prev, [key]: prev[key] === status ? null : status };
      persistProgress(next, docNotes);
      return next;
    });
  };
  const setNoteFor = (key, text) => {
    setDocNotes((prev) => {
      const next = { ...prev, [key]: text };
      return next;
    });
  };

  const handleSelectDoc = (i) => {
    const key = documents[i].key;
    setActiveIdx(i);
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const approvedCount = uploadedDocs.filter((d) => docStatus[d.key] === "approved").length;
  const revisionDocs = uploadedDocs.filter((d) => docStatus[d.key] === "revision");
  const allApproved = uploadedDocs.length > 0 && approvedCount === uploadedDocs.length;
  const hasRevisionMarked = revisionDocs.length > 0;
  const revisionNotesFilled = revisionDocs.every((d) => (docNotes[d.key] || "").trim().length > 0);
  const progressPct = uploadedDocs.length > 0 ? Math.round((approvedCount / uploadedDocs.length) * 100) : 0;

  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);

  useEffect(() => {
    if (!activeDoc?.uploaded) {
      const emptyTimeoutId = setTimeout(() => setDocLoading(false), 0);
      return () => clearTimeout(emptyTimeoutId);
    }

    const initTimeoutId = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
    }, 0);

    if (activeDoc.isImage) {
      const showTimeoutId = setTimeout(() => setDocLoading(false), 0);
      return () => {
        clearTimeout(initTimeoutId);
        clearTimeout(showTimeoutId);
      };
    }

    let cancelled = false;
    fetch(activeDoc.url)
      .then((res) => res.arrayBuffer())
      .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setDocLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setDocError(true);
          setDocLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(initTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  useEffect(() => {
    if (!pdfDoc || activeDoc?.isImage) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      page.render({ canvasContext: ctx, viewport });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageNum, zoom]);

  const handlePrint = async () => {
    if (!activeDoc?.url) return;
    setFileActionLoading("print");
    try {
      const blobUrl = await fetchAsBlobUrl(activeDoc.url);
      const w = window.open(blobUrl, "_blank");
      if (w) {
        w.addEventListener("load", () => {
          w.print();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
      }
    } catch {
      toastError("Gagal membuka dokumen untuk dicetak.");
    } finally {
      setFileActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!activeDoc?.url) return;
    setFileActionLoading("download");
    try {
      const blobUrl = await fetchAsBlobUrl(activeDoc.url);
      const ext = activeDoc.isImage ? "jpg" : "pdf";
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${activeDoc.label.replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      toastError("Gagal mengunduh dokumen.");
    } finally {
      setFileActionLoading(null);
    }
  };

  const buildDetailVerifikasi = () => {
  const detail = {};
  uploadedDocs.forEach((d) => {
    detail[d.key] = { status: docStatus[d.key] || null, note: docNotes[d.key] || "" };
  });
  return JSON.stringify(detail);
};

  const handleMintaRevisi = async () => {
    if (!revisionNotesFilled) {
      toastError("Isi catatan untuk setiap berkas yang perlu direvisi.");
      return;
    }

    const result = await confirmDialog({
      title: "Kirim permintaan revisi?",
      text: `Peserta akan diminta memperbaiki ${revisionDocs.length} berkas sesuai catatan yang Anda tulis.`,
      confirmText: "Ya, Kirim",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    const compiledNotes = revisionDocs
      .map((d) => `${d.label}: ${docNotes[d.key].trim()}`)
      .join("\n");

    setLoadingAction("revisi");
    try {
      const payload = {
        status_pendaftaran: "revisi",
        catatan_admin: compiledNotes,
        detail_verifikasi: buildDetailVerifikasi(),
      };
      console.log("PAYLOAD YANG DIKIRIM:", payload); // ==== HAPUS SETELAH SELESAI DEBUG ====
      await updateStatusPendaftaran(pendaftaran.id, payload);
      toastSuccess("Permintaan revisi berhasil dikirim");
      onUpdated();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim permintaan revisi.");
    } finally {
      setLoadingAction(null);
    }
  };

  const fotoProfilUrl = getFileUrl(pendaftaran.user_pendaftaran?.foto_profil);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={handleClose}>
      <div
        className="flex w-full max-w-7xl h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== PANEL KIRI: Viewer Dokumen ===== */}
        <div className="flex flex-col w-[58%] border-r border-slate-100">
          {/* Toolbar atas */}
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-sm font-extrabold text-[#0B1442] truncate">
                {activeDoc?.uploaded ? activeDoc.label : "Belum ada dokumen"}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 shadow-sm px-1.5 py-1 shrink-0">
              <button onClick={() => setZoom((z) => Math.max(50, z - 25))} className="rounded-full p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] hover:scale-110 transition-all duration-200 cursor-pointer">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#0B1442] w-11 text-center tabular-nums">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="rounded-full p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] hover:scale-110 transition-all duration-200 cursor-pointer">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrint}
                disabled={!activeDoc?.url || fileActionLoading !== null}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
                title="Print dokumen"
              >
                {fileActionLoading === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!activeDoc?.url || fileActionLoading !== null}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
                title="Unduh dokumen"
              >
                {fileActionLoading === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigasi antar dokumen + halaman PDF */}
          <div className="flex items-stretch gap-1.5 px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex flex-1 items-center gap-1.5 min-w-0">
              {documents.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setActiveIdx(i)}
                  disabled={!d.uploaded}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 ${
                    i === activeIdx ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md" : "text-slate-500 bg-white border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">{d.label}</span>
                  {docStatus[d.key] === "approved" && <CheckCircle2 className={`w-3 h-3 shrink-0 ${i === activeIdx ? "text-emerald-300" : "text-emerald-500"}`} />}
                  {docStatus[d.key] === "revision" && <XCircle className={`w-3 h-3 shrink-0 ${i === activeIdx ? "text-red-300" : "text-red-500"}`} />}
                </button>
              ))}
            </div>

            {!activeDoc?.isImage && numPages > 1 && (
              <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 shadow-sm px-1.5 py-1 shrink-0">
                <button onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum === 1} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10.5px] font-bold text-[#0B1442] whitespace-nowrap px-1">Hal {pageNum}/{numPages}</span>
                <button onClick={() => setPageNum((p) => Math.min(numPages, p + 1))} disabled={pageNum === numPages} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-[#004F9F] transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Konten viewer */}
          <div
            className="flex-1 p-8 overflow-auto flex"
            style={{
              backgroundColor: "#eef1f6",
              backgroundImage: "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            {!activeDoc?.uploaded ? (
              <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <FileText className="w-8 h-8" />
                </span>
                <span className="text-xs font-bold">Dokumen ini belum diunggah peserta</span>
              </div>
            ) : docLoading ? (
              <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                <div className="h-9 w-9 rounded-full border-[3px] border-slate-300 border-t-[#004F9F] animate-spin" />
                <span className="text-xs font-bold">Memuat pratinjau...</span>
              </div>
            ) : docError ? (
              <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                <FileText className="w-10 h-10" />
                <span className="text-xs font-bold">Gagal memuat dokumen</span>
              </div>
            ) : activeDoc.isImage ? (
              <img
                key={activeIdx}
                src={activeDoc.url}
                alt={activeDoc.label}
                style={{ width: `${zoom}%`, height: "auto" }}
                className="m-auto max-w-none rounded-2xl shadow-2xl ring-1 ring-black/5 transition-[width] duration-200 animate-[fadeslide_0.3s_ease-out]"
              />
            ) : (
              <canvas key={activeIdx} ref={canvasRef} className="m-auto rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white animate-[fadeslide_0.3s_ease-out]" />
            )}
          </div>
        </div>

        {/* ===== PANEL KANAN: Ringkasan, Checklist + Aksi, Footer ===== */}
        <div className="flex flex-col w-[42%] bg-slate-50/40">
          {/* Header dengan gradient & glow */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-7 pt-6 pb-6 shrink-0">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <button onClick={handleClose} className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            {/* Watermark ikon besar — persis pola hero dashboard */}
            <ClipboardCheck
              className="absolute right-15 top-1/2 -translate-y-1/2 hidden sm:block w-28 h-28 opacity-[0.12] text-white pointer-events-none transform rotate-6"
              strokeWidth={1}
            />

            <div className="relative flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-[#00A5EC]/30 blur-xl animate-pulse" />
                {fotoProfilUrl ? (
                  <img
                    src={fotoProfilUrl}
                    alt={pendaftaran.nama_lengkap}
                    className="relative h-16 w-16 rounded-full object-cover shadow-lg border-[3px] border-white/20 ring-4 ring-white/10"
                  />
                ) : (
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border-[3px] border-white/20 text-white text-lg font-black backdrop-blur-md">
                    {getInitials(pendaftaran.nama_lengkap)}
                  </span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-lg font-black text-white truncate">{pendaftaran.nama_lengkap}</h3>
                <p className="text-xs font-medium text-white/60 truncate">
                  {isMahasiswa ? pendaftaran.asal_kampus : pendaftaran.asal_sekolah}
                  {(isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah) && (
                    <> &middot; {isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah}</>
                  )}
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white">
                  <GraduationCap className="w-3 h-3" />
                  {pendaftaran.posisi_bidang || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
            {/* Info alur kerja */}
            <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 p-3">
              <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-blue-700">
                Tinjau dan tentukan status (Setujui/Perlu Revisi) untuk setiap berkas di bawah ini. Keputusan akhir pendaftaran (Terima/Tolak) hanya bisa dilakukan lewat tombol <b>Verifikasi</b> pada tabel, setelah semua berkas disetujui.
              </p>
            </div>
            {/* Info akademik */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center text-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {isMahasiswa ? "Semester" : "Kelas"}
                </p>
                <p className="mt-1 text-2xl font-black text-[#0B1442]">
                  {isMahasiswa ? (pendaftaran.semester || "-") : (pendaftaran.kelas || "-")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Durasi Magang</p>
                <p className="mt-1.5 text-[16px] font-bold text-[#0B1442] leading-snug whitespace-nowrap">
                  {fmtShortDate(pendaftaran.tanggal_mulai)} &ndash; {fmtShortDate(pendaftaran.tanggal_selesai)}
                </p>
              </div>
            </div>

            {/* Progress ring + checklist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-sm">
                    <ClipboardCheck className="w-4 h-4" />
                  </span>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Checklist Verifikasi</p>
                </div>
                <div className="relative h-9 w-9 shrink-0">
                  <svg viewBox="0 0 32 32" className="h-9 w-9 -rotate-90">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="16" cy="16" r="13" fill="none"
                      stroke={allApproved ? "#10b981" : "#004F9F"}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(progressPct / 100) * 2 * Math.PI * 13} ${2 * Math.PI * 13}`}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-[#0B1442]">{approvedCount}/{uploadedDocs.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                {documents.map((d, i) => {
                  const status = docStatus[d.key];
                  const isExpanded = expandedKey === d.key && d.uploaded;
                  return (
                    <div
                      key={d.key}
                      className={`rounded-xl overflow-hidden border transition-all duration-200 animate-[fadeslide_0.3s_ease-out] ${
                        isExpanded ? "border-[#004F9F]/30 shadow-sm" : "border-transparent"
                      }`}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <button
                        onClick={() => d.uploaded && handleSelectDoc(i)}
                        disabled={!d.uploaded}
                        className={`group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-200 ${
                          d.uploaded ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
                        } ${isExpanded ? "bg-blue-50/70" : ""}`}
                      >
                        {!d.uploaded ? (
                          <Circle className="w-4 h-4 shrink-0 text-slate-300" />
                        ) : status === "approved" ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                        ) : status === "revision" ? (
                          <XCircle className="w-4 h-4 shrink-0 text-red-500 transition-transform duration-200 group-hover:scale-110" />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0 text-amber-400" />
                        )}
                        <span className={`flex-1 text-xs font-bold ${d.uploaded ? "text-slate-700" : "text-slate-400"}`}>{d.label}</span>
                        {d.uploaded && !status && (
                          <span className="text-[9px] font-bold uppercase text-amber-500 shrink-0">Belum Ditinjau</span>
                        )}
                        {d.uploaded && (
                          <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#004F9F]" : ""}`} />
                        )}
                      </button>

                      <div
                        className="grid transition-[grid-template-rows] duration-250 ease-in-out"
                        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="px-3.5 pb-3.5 pt-1 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setStatusFor(d.key, "approved")}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                  status === "approved"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                                    : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Setujui
                              </button>
                              <button
                                onClick={() => setStatusFor(d.key, "revision")}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                  status === "revision"
                                    ? "border-red-300 bg-red-50 text-red-700 shadow-sm"
                                    : "border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/50"
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Perlu Revisi
                              </button>
                            </div>

                            {catatanPeserta[d.key] && (
                              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                                <p className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-blue-500 mb-1.5">
                                  <MessageSquareText className="w-3 h-3" />
                                  Catatan dari Peserta
                                </p>
                                <p className="text-[11px] italic leading-relaxed text-slate-600">"{catatanPeserta[d.key]}"</p>
                              </div>
                            )}

                            {status === "revision" && (
                              <div className="animate-[fadeslide_0.2s_ease-out]">
                                <label className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500">
                                  <span>Catatan {d.label}</span>
                                  <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={docNotes[d.key] || ""}
                                  onChange={(e) => setNoteFor(d.key, e.target.value)}
                                  onBlur={() => persistProgress(docStatus, docNotes)}
                                  placeholder={`Tuliskan catatan atau alasan revisi ${d.label}...`}
                                  rows={2}
                                  className="w-full rounded-xl border border-red-200 bg-red-50/40 px-3.5 py-2.5 text-[11.5px] font-medium text-slate-700 outline-none transition-all duration-200 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer aksi */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-6">
            {hasRevisionMarked ? (
              <button
                onClick={handleMintaRevisi}
                disabled={loadingAction !== null || !revisionNotesFilled}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer animate-[fadeslide_0.2s_ease-out]"
              >
                {loadingAction === "revisi" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Minta Revisi Berkas ({revisionDocs.length})
              </button>
            ) : allApproved ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-3.5 px-4 animate-[fadeslide_0.2s_ease-out]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <p className="text-xs font-semibold text-emerald-700 leading-relaxed">
                  Semua berkas telah disetujui. Tutup modal ini, lalu buka tombol <b>Verifikasi</b> pada tabel untuk memutuskan status akhir pendaftaran.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-3.5 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  {approvedCount > 0 || revisionDocs.length > 0
                    ? `${uploadedDocs.length - approvedCount - revisionDocs.length} berkas lagi perlu ditinjau`
                    : "Tinjau setiap berkas (Setujui / Perlu Revisi) untuk melanjutkan"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;