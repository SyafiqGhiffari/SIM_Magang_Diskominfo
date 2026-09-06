import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, Download,
  CheckCircle2, XCircle, Circle, FileText, Loader2, GraduationCap, ChevronDown, ClipboardCheck, MessageSquareText, Info, Eye,
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

const ReviewModal = ({ pendaftaran, onClose, onUpdated, isDark }) => {
  const documents = docList(pendaftaran);
  const uploadedDocs = documents.filter((d) => d.uploaded);
  const [activeIdx, setActiveIdx] = useState(Math.max(0, documents.findIndex((d) => d.uploaded)));
  const [expandedKey, setExpandedKey] = useState(documents[Math.max(0, documents.findIndex((d) => d.uploaded))]?.key);
  const defaultZoom = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 100;
  const [zoom, setZoom] = useState(defaultZoom);
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
  const canvasRefMobile = useRef(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
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

    let cancelled = false;

    if (activeDoc.isImage) {
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setDocLoading(false);
      };
      img.onerror = () => {
        if (!cancelled) {
          setDocError(true);
          setDocLoading(false);
        }
      };
      img.src = activeDoc.url;
      return () => {
        cancelled = true;
        clearTimeout(initTimeoutId);
      };
    }

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
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport });
      }

      const canvasMobile = canvasRefMobile.current;
      if (canvasMobile) {
        canvasMobile.width = viewport.width;
        canvasMobile.height = viewport.height;
        const ctxMobile = canvasMobile.getContext("2d");
        page.render({ canvasContext: ctxMobile, viewport });
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageNum, zoom, showMobilePreview]);

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

  const renderHeader = (isMobile) => {
    const visibilityClass = isMobile ? "md:hidden" : "hidden md:block";
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 sm:px-7 py-3 sm:py-6 shrink-0 ${visibilityClass}`}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <button onClick={handleClose} className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90 hover:scale-110 active:scale-90 cursor-pointer">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        {/* Watermark ikon besar — persis pola hero dashboard */}
        <ClipboardCheck
          className="absolute right-6 sm:right-15 top-1/2 -translate-y-1/2 w-16 sm:w-28 h-16 sm:h-28 opacity-[0.12] text-white pointer-events-none transform rotate-6"
          strokeWidth={1}
        />

        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#00A5EC]/30 blur-xl animate-pulse" />
            {fotoProfilUrl ? (
              <img
                src={fotoProfilUrl}
                alt={pendaftaran.nama_lengkap}
                className="relative h-10 w-10 sm:h-16 sm:w-16 rounded-full object-cover shadow-lg border-2 sm:border-[3px] border-white/20 ring-2 sm:ring-4 ring-white/10"
              />
            ) : (
              <span className="relative flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/10 border-2 sm:border-[3px] border-white/20 text-white text-xs sm:text-lg font-black backdrop-blur-md">
                {getInitials(pendaftaran.nama_lengkap)}
              </span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-xs sm:text-lg font-black text-white truncate">{pendaftaran.nama_lengkap}</h3>
            <p className="text-[9px] sm:text-xs font-medium text-white/60 truncate">
              {isMahasiswa ? pendaftaran.asal_kampus : pendaftaran.asal_sekolah}
              {(isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah) && (
                <> &middot; {isMahasiswa ? pendaftaran.program_studi : pendaftaran.jurusan_sekolah}</>
              )}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-1.5 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold text-white">
                <GraduationCap className="w-2 h-2 sm:w-3 sm:h-3" />
                {pendaftaran.posisi_bidang || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfoWorkflow = (isMobile) => {
    const visibilityClass = isMobile ? "md:hidden" : "hidden md:flex";
    return (
      <div className={`flex items-start gap-1.5 rounded-xl border ${isMobile ? "p-1.5" : "p-2 sm:p-3"} ${isDark ? "bg-[#00A5EC]/10 border-[#00A5EC]/20" : "bg-blue-50 border-blue-100"} ${visibilityClass}`}>
        <Info className={`shrink-0 text-blue-500 mt-0.5 ${isMobile ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        <div className="flex-1 min-w-0">
          <p className={`leading-relaxed text-left ${isMobile ? "text-[9.5px]" : "text-[10px] md:text-[11px]"} ${isDark ? "text-slate-300" : "text-blue-700"}`}>
            {isMobile ? (
              <span>Tinjau & tentukan status berkas. Keputusan akhir dilakukan via tombol <b>Verifikasi</b> di tabel.</span>
            ) : (
              <span>Tinjau dan tentukan status (Setujui/Perlu Revisi) untuk setiap berkas di bawah ini. Keputusan akhir pendaftaran (Terima/Tolak) hanya bisa dilakukan lewat tombol <b>Verifikasi</b> pada tabel, setelah semua berkas disetujui.</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderInfoAkademik = () => {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
          <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {isMahasiswa ? "Semester" : "Kelas"}
          </p>
          <p className={`mt-0.5 sm:mt-1 text-xs sm:text-2xl font-black ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
            {isMahasiswa ? (pendaftaran.semester || "-") : (pendaftaran.kelas || "-")}
          </p>
        </div>
        <div className={`flex flex-col items-center justify-center text-center rounded-xl sm:rounded-2xl border p-2 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
          <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">Durasi Magang</p>
          <p className={`mt-0.5 sm:mt-1.5 text-[9px] sm:text-[16px] font-bold leading-snug whitespace-nowrap ${isDark ? "text-slate-300" : "text-[#0B1442]"}`}>
            {fmtShortDate(pendaftaran.tanggal_mulai)} &ndash; {fmtShortDate(pendaftaran.tanggal_selesai)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2 sm:p-4" onClick={handleClose}>
      <div
        className={`flex flex-col md:flex-row w-full max-w-7xl h-[96vh] md:h-[92vh] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >


        {/* ===== PANEL KIRI: Viewer Dokumen ===== */}
        <div className={`hidden md:flex flex-col w-full md:w-[58%] md:h-full border-b md:border-b-0 md:border-r ${isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"}`}>
          {/* Toolbar atas */}
          <div className={`flex items-center justify-between gap-1.5 sm:gap-2 px-4 md:px-6 py-2.5 md:py-4 border-b shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-left">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className={`text-xs sm:text-sm font-extrabold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                {activeDoc?.uploaded ? activeDoc.label : "Belum ada dokumen"}
              </span>
            </div>

            <div className={`flex items-center gap-0.5 sm:gap-1 rounded-full border shadow-sm px-1 md:px-1.5 py-0.5 md:py-1 shrink-0 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <button onClick={() => setZoom((z) => Math.max(50, z - 25))} className="rounded-full p-1 sm:p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] hover:scale-110 transition-all duration-200 cursor-pointer">
                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className={`text-[10px] md:text-xs font-bold w-9 md:w-11 text-center tabular-nums ${isDark ? "text-slate-300" : "text-[#0B1442]"}`}>{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="rounded-full p-1 sm:p-1.5 text-slate-500 hover:bg-white hover:text-[#004F9F] hover:scale-110 transition-all duration-200 cursor-pointer">
                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
                onClick={handlePrint}
                disabled={!activeDoc?.url || fileActionLoading !== null}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Print dokumen"
              >
                {fileActionLoading === "print" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!activeDoc?.url || fileActionLoading !== null}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed ${
                  isDark ? "text-slate-400 hover:bg-white/5 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
                title="Unduh dokumen"
              >
                {fileActionLoading === "download" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>

          {/* Navigasi antar dokumen + halaman PDF */}
          <div className={`flex items-stretch gap-1 sm:gap-1.5 px-4 md:px-6 py-2 md:py-3 border-b shrink-0 overflow-x-auto scroll-halus ${isDark ? "border-white/5 bg-[#1a202c]/20" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 md:flex-1">
              {documents.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setActiveIdx(i)}
                  disabled={!d.uploaded}
                  className={`flex-1 min-w-[70px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1.5 md:py-2 text-[10px] md:text-[11px] font-bold transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 ${
                    i === activeIdx
                      ? isDark
                        ? "bg-[#00A5EC] text-white shadow-md"
                        : "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                      : i === activeIdx
                        ? "bg-slate-200 text-slate-800 shadow-sm"
                        : isDark
                          ? "text-slate-400 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                          : "text-slate-500 bg-white border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">{d.label}</span>
                  {docStatus[d.key] === "approved" && <CheckCircle2 className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 ${i === activeIdx ? "text-emerald-300" : "text-emerald-500"}`} />}
                  {docStatus[d.key] === "revision" && <XCircle className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 ${i === activeIdx ? "text-red-300" : "text-red-500"}`} />}
                </button>
              ))}
            </div>

          </div>

          {/* Wrapper Konten viewer + Floating PDF Pagination */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Konten viewer */}
            <div
              className="flex-1 p-4 sm:p-8 overflow-auto flex"
              style={{
                backgroundColor: isDark ? "#0b0f19" : "#eef1f6",
                backgroundImage: isDark
                  ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
                  : "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              {!activeDoc?.uploaded ? (
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                  <span className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl shadow-sm ${isDark ? "bg-white/5" : "bg-white"}`}>
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold">Dokumen ini belum diunggah peserta</span>
                </div>
              ) : docLoading ? (
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                  <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-[3px] border-slate-300 animate-spin ${isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"}`} />
                  <span className="text-[11px] sm:text-xs font-bold">Memuat pratinjau...</span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
                  <span className="text-[11px] sm:text-xs font-bold">Gagal memuat dokumen</span>
                </div>
              ) : activeDoc.isImage ? (
                <img
                  key={activeIdx}
                  src={activeDoc.url}
                  alt={activeDoc.label}
                  style={{ width: `${zoom}%`, height: "auto" }}
                  className="m-auto max-w-none rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 transition-[width] duration-200 animate-[fadeslide_0.3s_ease-out]"
                />
              ) : (
                <canvas key={activeIdx} ref={canvasRef} className={`m-auto rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out] ${isDark ? "bg-[#161b22]" : "bg-white"}`} />
              )}
            </div>

            {/* Floating PDF Pagination (Desktop) */}
            {!activeDoc?.isImage && numPages > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full border bg-slate-900/80 border-white/10 px-3.5 py-1.5 shadow-xl backdrop-blur-md text-white transition-all duration-300 hover:scale-105 hover:bg-slate-900/90">
                <button
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="rounded-full p-1.5 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed hover:bg-white/10 hover:scale-115 active:scale-90 text-white/80 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black whitespace-nowrap px-2 select-none text-white">
                  Hal {pageNum} / {numPages}
                </span>
                <button
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum === numPages}
                  className="rounded-full p-1.5 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed hover:bg-white/10 hover:scale-115 active:scale-90 text-white/80 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== PANEL KANAN: Ringkasan, Checklist + Aksi, Footer ===== */}
        <div className={`flex flex-col w-full md:w-[42%] flex-1 min-h-0 md:h-full ${isDark ? "bg-[#1a202c]/20" : "bg-slate-50/40"}`}>
          {renderHeader(true)}
          {renderHeader(false)}

          <div className="flex-1 overflow-y-auto px-3 md:px-7 py-3.5 md:py-5 space-y-3 md:space-y-5">
            {renderInfoWorkflow(true)}
            {renderInfoWorkflow(false)}
            {renderInfoAkademik()}

            {/* Progress ring + checklist */}
            <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 shadow-sm ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg shadow-sm ${isDark ? "bg-white/10 text-[#00A5EC]" : "bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white"}`}>
                    <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">Checklist Verifikasi</p>
                </div>
                <div className="relative h-8.5 w-8.5 shrink-0">
                  <svg viewBox="0 0 32 32" className="h-8.5 w-8.5 -rotate-90">
                    <circle cx="16" cy="16" r="13" fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0"} strokeWidth="3" />
                    <circle
                      cx="16" cy="16" r="13" fill="none"
                      stroke={allApproved ? "#10b981" : (isDark ? "#00A5EC" : "#004F9F")}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(progressPct / 100) * 2 * Math.PI * 13} ${2 * Math.PI * 13}`}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[8px] sm:text-[8.5px] font-black ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>{approvedCount}/{uploadedDocs.length}</span>
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
                        isExpanded
                          ? isDark
                            ? "border-[#00A5EC]/40 bg-white/[0.02] shadow-sm"
                            : "border-[#004F9F]/30 shadow-sm"
                          : "border-transparent"
                      }`}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <button
                        onClick={() => d.uploaded && handleSelectDoc(i)}
                        disabled={!d.uploaded}
                        className={`group flex w-full items-center gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-left transition-all duration-200 ${
                          d.uploaded
                            ? isDark
                              ? "hover:bg-white/5 cursor-pointer"
                              : "hover:bg-slate-50 cursor-pointer"
                            : "cursor-default"
                        } ${isExpanded ? (isDark ? "bg-white/5" : "bg-blue-50/70") : ""}`}
                      >
                        {!d.uploaded ? (
                          <Circle className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-slate-300" />
                        ) : status === "approved" ? (
                          <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                        ) : status === "revision" ? (
                          <XCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-red-500 transition-transform duration-200 group-hover:scale-110" />
                        ) : (
                          <Circle className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-amber-400" />
                        )}
                        <span className={`flex-1 text-[10px] sm:text-xs font-bold ${d.uploaded ? (isDark ? "text-slate-200" : "text-slate-700") : "text-slate-400"}`}>{d.label}</span>
                        {!d.uploaded ? (
                          <span className="text-[7.5px] sm:text-[9px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded shrink-0">Tidak Diunggah</span>
                        ) : !status ? (
                          <span className="text-[7.5px] sm:text-[9px] font-bold uppercase text-amber-500 shrink-0">Belum Ditinjau</span>
                        ) : null}
                        {d.uploaded && (
                          <ChevronDown className={`w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#004F9F]" : ""}`} />
                        )}
                      </button>

                      <div
                        className="grid transition-[grid-template-rows] duration-250 ease-in-out"
                        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="px-2.5 sm:px-3.5 pb-2.5 sm:pb-3.5 pt-0.5 sm:pt-1 space-y-2">
                            <div className="flex flex-col gap-2">
                              {/* Mobile Only: Lihat Dokumen Button */}
                              <button
                                onClick={() => {
                                  setActiveIdx(i);
                                  setPageNum(1);
                                  setZoom(50);
                                  setShowMobilePreview(true);
                                }}
                                className="md:hidden flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#00A5EC]/20 dark:border-white/10 py-2 text-[10px] font-bold bg-[#00A5EC]/10 text-[#00A5EC] hover:bg-[#00A5EC]/20 active:scale-95 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Lihat Dokumen
                              </button>

                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => setStatusFor(d.key, "approved")}
                                  className={`flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border py-1.5 sm:py-2.5 text-[9px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                    status === "approved"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                                      : isDark
                                        ? "border-white/10 text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]"
                                        : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50"
                                  }`}
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => setStatusFor(d.key, "revision")}
                                  className={`flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border py-1.5 sm:py-2.5 text-[9px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                    status === "revision"
                                      ? "border-red-300 bg-red-50 text-red-700 shadow-sm"
                                      : isDark
                                        ? "border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-red-500/[0.05]"
                                        : "border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/50"
                                  }`}
                                >
                                  <XCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                  Revisi
                                </button>
                              </div>
                            </div>

                            {catatanPeserta[d.key] && (
                              <div className={`rounded-xl border p-2.5 sm:p-3 ${isDark ? "border-blue-500/20 bg-blue-500/5 text-[#38bdf8]" : "border-blue-100 bg-blue-50/60 text-blue-700"}`}>
                                <p className="flex items-center gap-1.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-blue-500 mb-1">
                                  <MessageSquareText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  Catatan dari Peserta
                                </p>
                                <p className={`text-[10px] sm:text-[11px] italic leading-relaxed ${isDark ? "text-slate-300" : "text-slate-655"}`}>"{catatanPeserta[d.key]}"</p>
                              </div>
                            )}

                            {status === "revision" && (
                              <div className="animate-[fadeslide_0.2s_ease-out]">
                                <label className="mb-1.5 flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-500">
                                  <span>Catatan {d.label}</span>
                                  <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={docNotes[d.key] || ""}
                                  onChange={(e) => setNoteFor(d.key, e.target.value)}
                                  onBlur={() => persistProgress(docStatus, docNotes)}
                                  placeholder={`Tuliskan catatan atau alasan revisi ${d.label}...`}
                                  rows={2}
                                  className={`w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 text-[10px] sm:text-[11.5px] font-medium outline-none transition-all duration-200 ${
                                    isDark
                                      ? "border-red-500/40 bg-red-500/[0.05] text-slate-300 placeholder-slate-500 hover:border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                                      : "border-red-200 bg-red-50/40 text-slate-700 placeholder-slate-300 hover:border-red-300 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                                  }`}
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
          <div className={`shrink-0 border-t p-3 sm:p-6 ${isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200 bg-white"}`}>
            {hasRevisionMarked ? (
              <button
                onClick={handleMintaRevisi}
                disabled={loadingAction !== null || !revisionNotesFilled}
                className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 to-red-700 py-2 sm:py-3.5 text-[11px] sm:text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer animate-[fadeslide_0.2s_ease-out]"
              >
                {loadingAction === "revisi" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Minta Revisi ({revisionDocs.length})
              </button>
            ) : allApproved ? (
              <div className={`flex items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border py-2 sm:py-3.5 px-2.5 sm:px-4 animate-[fadeslide_0.2s_ease-out] ${
                isDark ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-emerald-200 bg-emerald-50"
              }`}>
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <p className={`text-[10px] sm:text-xs font-semibold leading-relaxed text-left ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                  Semua berkas disetujui. Tutup modal ini, lalu buka tombol <b>Verifikasi</b> pada tabel.
                </p>
              </div>
            ) : (
              <div className={`rounded-xl sm:rounded-2xl border border-dashed py-2.5 sm:py-3.5 text-center ${isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400">
                  {approvedCount > 0 || revisionDocs.length > 0
                    ? `${uploadedDocs.length - approvedCount - revisionDocs.length} berkas lagi perlu ditinjau`
                    : "Tinjau setiap berkas (Setujui / Perlu Revisi)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE OVERLAY PREVIEW MODAL ===== */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-3" onClick={() => setShowMobilePreview(false)}>
          <div className={`relative flex flex-col w-full max-w-2xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-[#161b22] border border-white/10" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            {/* Header modal pratinjau dengan Zoom Controls & Aksi */}
            <div className={`flex items-center justify-between gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b shrink-0 ${isDark ? "border-white/5 bg-[#161b22]" : "border-slate-100 bg-white"}`}>
              <div className="flex items-center gap-2 min-w-0 text-left">
                <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span className={`text-xs sm:text-sm font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  {activeDoc?.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Zoom Controls di Header Modal */}
                <div className={`flex items-center gap-0.5 rounded-full border shadow-sm px-1 py-0.5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                  <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] cursor-pointer">
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className={`text-[9.5px] font-black min-w-[28px] text-center ${isDark ? "text-slate-200" : "text-slate-600"}`}>
                    {zoom}%
                  </span>
                  <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-[#004F9F] cursor-pointer">
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-white/20 mx-0.5" />

                {/* Close */}
                <button onClick={() => setShowMobilePreview(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
            
            {/* Konten pratinjau */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              {/* Area Canvas/Gambar */}
              <div className={`flex-1 overflow-auto p-4 flex ${isDark ? "bg-[#0d1117]" : "bg-slate-50/50"}`}>
                {!activeDoc?.uploaded ? (
                  <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="w-8 h-8" />
                    <span className="text-xs font-bold text-slate-500">Dokumen tidak diunggah</span>
                  </div>
                ) : docLoading ? (
                  <div className="m-auto flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A5EC]" />
                    <span className="text-xs font-bold text-slate-500">Memuat pratinjau...</span>
                  </div>
                ) : docError ? (
                  <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="w-8 h-8" />
                    <span className="text-xs font-bold">Gagal memuat dokumen</span>
                  </div>
                ) : activeDoc.isImage ? (
                  <div className="flex items-center justify-center min-h-full min-w-full overflow-auto p-2">
                    <img
                      src={activeDoc.url}
                      alt={activeDoc.label}
                      style={{
                        transform: `scale(${zoom / 50})`,
                        transformOrigin: "center center",
                        transition: "transform 0.15s ease-out",
                      }}
                      className="max-h-[68vh] max-w-[85vw] w-auto rounded-xl shadow-xl ring-1 ring-black/5 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-full min-w-full overflow-auto p-2">
                    <canvas ref={canvasRefMobile} className={`rounded-xl shadow-xl ring-1 ring-black/5 max-w-full ${isDark ? "bg-[#161b22]" : "bg-white"}`} />
                  </div>
                )}
              </div>

              {/* Floating Bottom Toolbar: Pindah Halaman + Tombol Print & Download */}
              {activeDoc?.uploaded && !docLoading && !docError && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 rounded-full border bg-slate-900/95 border-white/20 px-4 sm:px-5 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md text-white max-w-[92vw] w-max whitespace-nowrap select-none">
                  {!activeDoc?.isImage && numPages > 1 && (
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                        disabled={pageNum === 1}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <span className="text-[11px] sm:text-xs font-black whitespace-nowrap px-2 select-none font-mono text-white shrink-0">Hal {pageNum}/{numPages}</span>
                      <button
                        onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                        disabled={pageNum === numPages}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer text-white"
                        title="Halaman Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <div className="h-4 w-px bg-white/20 mx-1 sm:mx-1.5 shrink-0" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Tombol Print */}
                    <button
                      onClick={handlePrint}
                      disabled={!activeDoc?.url || fileActionLoading !== null}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Cetak Dokumen"
                    >
                      {fileActionLoading === "print" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>

                    {/* Tombol Download */}
                    <button
                      onClick={handleDownload}
                      disabled={!activeDoc?.url || fileActionLoading !== null}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-30 text-white"
                      title="Unduh Dokumen"
                    >
                      {fileActionLoading === "download" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewModal;