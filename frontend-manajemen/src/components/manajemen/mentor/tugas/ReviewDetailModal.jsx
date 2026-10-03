import { useState, useMemo, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileCheck2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Check,
  X,
  Send,
  FileText,
  HelpCircle,
  Clock,
  Target,
  FilePenLine,
  NotebookPen,
  Award,
  MessageSquareText,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  ShieldCheck,
  Loader2,
  FileX,
  BookOpen,
  MessageSquareQuote,
} from "lucide-react";
import { reviewPengumpulanTugasMentor } from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const fetchAsBlobUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// Komponen Avatar Peserta di Panel Modal
const ModalPesertaAvatar = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
      />
    );
  }

  return (
    <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-white text-sm sm:text-base font-black shadow-md shrink-0">
      {initial}
    </span>
  );
};

// Komponen Pratinjau Dokumen Terunggah (PDF Langsung / Gambar / Dokumen Arsip)
const BerkasDokumenViewer = ({ filePath, namaPeserta, isDark }) => {
  const fileUrl = filePath ? getFileUrl(filePath) : null;
  const fileName = filePath
    ? filePath.split("/").pop().split("\\").pop()
    : "Lampiran-Dokumen";
  const lowerFile = String(filePath || "").toLowerCase();
  const isPdf = lowerFile.endsWith(".pdf");
  const isImage =
    lowerFile.endsWith(".jpg") ||
    lowerFile.endsWith(".jpeg") ||
    lowerFile.endsWith(".png") ||
    lowerFile.endsWith(".webp");

  const [zoom, setZoom] = useState(65);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [docLoading, setDocLoading] = useState(() => Boolean(fileUrl && (isPdf || isImage)));
  const [docError, setDocError] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(null);

  const canvasRef = useRef(null);

  // Muat dokumen PDF atau Gambar
  useEffect(() => {
    if (!fileUrl || (!isPdf && !isImage)) {
      return;
    }

    let cancelled = false;

    if (isImage) {
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
      img.src = fileUrl;
      return () => {
        cancelled = true;
      };
    }

    if (isPdf) {
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengunduh berkas");
          return res.arrayBuffer();
        })
        .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
        .then((doc) => {
          if (cancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setDocLoading(false);
        })
        .catch((err) => {
          console.error("Gagal muat PDF:", err);
          if (!cancelled) {
            setDocError(true);
            setDocLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }
  }, [fileUrl, isPdf, isImage]);

  // Render halaman PDF ke canvas
  useEffect(() => {
    if (!pdfDoc || !isPdf) return;
    let cancelled = false;
    let renderTask = null;

    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        renderTask = page.render({ canvasContext: ctx, viewport });
        renderTask.promise.catch((err) => {
          if (err?.name !== "RenderingCancelledException") {
            console.error("Gagal render halaman PDF:", err);
          }
        });
      }
    });

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNum, zoom, isPdf]);

  const handlePrint = async () => {
    if (!fileUrl) return;
    setFileActionLoading("print");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
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
    if (!fileUrl) return;
    setFileActionLoading("download");
    try {
      const blobUrl = await fetchAsBlobUrl(fileUrl);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${(namaPeserta || "Tugas").replace(/\s+/g, "_")}_${fileName}`;
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

  if (!filePath) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/40 shadow-xs overflow-hidden">
      {/* Toolbar / Header Pratinjau Dokumen */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
              isPdf
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                : "bg-sky-100 text-[#004F9F] dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50"
            }`}
          >
            <FileText className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Berkas Dokumen
              </span>
              <span
                className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                  isPdf
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                    : isImage
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {isPdf ? "Dokumen PDF" : isImage ? "Gambar" : "Berkas File"}
              </span>
            </div>
            <p
              className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px] sm:max-w-xs md:max-w-sm"
              title={fileName}
            >
              {fileName}
            </p>
          </div>
        </div>

        {/* Tombol Kontrol: Zoom, Pagination, Cetak, Unduh, Buka Tab Baru */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Kontrol Zoom Dokumen */}
          {(isPdf || isImage) && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl px-1.5 py-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(40, z - 15))}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Perkecil (-15%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(65)}
                className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 w-11 text-center select-none hover:text-[#004F9F] dark:hover:text-[#00A5EC] cursor-pointer"
                title="Reset ke Ukuran Standar (65%)"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(160, z + 15))}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Perbesar (+15%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Kontrol Halaman untuk Dokumen PDF Multi-Halaman */}
          {isPdf && numPages > 1 && !docLoading && !docError && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl px-1.5 py-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum === 1}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 px-1 select-none whitespace-nowrap">
                Hal {pageNum} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                disabled={pageNum === numPages}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isPdf && (
            <button
              type="button"
              onClick={handlePrint}
              disabled={fileActionLoading !== null}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Cetak Dokumen"
            >
              {fileActionLoading === "print" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={fileActionLoading !== null}
            className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Unduh Berkas Asli"
          >
            {fileActionLoading === "download" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-2xs"
            title="Buka Berkas di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Area Viewer Pratinjau */}
      <div
        className="relative h-[310px] sm:h-[330px] overflow-auto flex custom-modal-scrollbar"
        style={{
          backgroundColor: isDark ? "#090d16" : "#f1f5f9",
          backgroundImage: isDark
            ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
            : "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {docLoading ? (
          <div className="m-auto flex flex-col items-center gap-2.5 text-slate-400 p-8">
            <div
              className={`h-8 w-8 rounded-full border-[3px] border-slate-300 animate-spin ${
                isDark ? "border-t-[#00A5EC]" : "border-t-[#004F9F]"
              }`}
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Memuat pratinjau dokumen...
            </span>
          </div>
        ) : docError ? (
          <div className="m-auto flex flex-col items-center gap-2.5 text-center text-slate-400 p-6">
            <FileX className="w-9 h-9 text-rose-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Pratinjau langsung tidak dapat dimuat di peramban
            </span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#004F9F] text-white hover:bg-[#003870] transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Dokumen di Tab Baru</span>
            </a>
          </div>
        ) : isPdf ? (
          <div className="m-auto p-3.5 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className={`rounded-lg shadow-lg ring-1 ring-black/10 transition-all ${
                isDark ? "bg-[#161b22]" : "bg-white"
              }`}
            />
          </div>
        ) : isImage ? (
          <div className="m-auto p-3.5 flex items-center justify-center min-w-full">
            <img
              src={fileUrl}
              alt={fileName}
              style={{ width: `${zoom}%` }}
              className="rounded-lg shadow-lg ring-1 ring-black/10 max-w-none transition-[width] duration-200"
            />
          </div>
        ) : (
          <div className="m-auto p-8 text-center max-w-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-white/10 mx-auto mb-3">
              <FileText className="w-7 h-7 text-[#004F9F] dark:text-[#00A5EC]" />
            </div>
            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
              Dokumen Terlampir: {fileName}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
              Berkas ini berupa arsip/dokumen terkompresi yang dapat diunduh langsung untuk ditinjau.
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#004F9F] text-white hover:bg-[#003870] transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas ({fileName.split(".").pop().toUpperCase()})</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer Info Viewer Dokumen */}
      <div className="px-4 py-2 border-t border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>
            Pratinjau Dokumen • {isPdf ? `${numPages} Halaman` : isImage ? "Format Gambar" : "File Arsip"}
          </span>
        </span>
        <span className="hidden sm:inline text-slate-400 dark:text-slate-500 text-[10.5px]">
          Skala: {zoom}% (klik persentase untuk reset ke 65%)
        </span>
      </div>
    </div>
  );
};

const ReviewDetailModalContent = ({
  onClose,
  tugas,
  submission,
  onSuccess,
  isDark = false,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [catatanMentor, setCatatanMentor] = useState(
    submission?.pengumpulan?.catatan_mentor || ""
  );
  // State Lightbox untuk Zoom Gambar Soal
  const [previewImage, setPreviewImage] = useState(null);
  // State Filter Jenis Soal di Kolom Kiri ("semua" | "esai" | "pilihan_ganda")
  const [filterSoalTipe, setFilterSoalTipe] = useState("semua");

  const isKuis = tugas?.tipe_tugas === "kuis";
  const pengumpulan = submission?.pengumpulan;
  const kuisData = tugas?.kuis_data;
  const jawabanKuisRaw = pengumpulan?.jawaban_kuis;

  // Tutup modal dengan tombol Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, previewImage, onClose]);

  // Parsing data konfigurasi kuis dari tugas
  const kuisConfig = useMemo(() => {
    if (!isKuis || !kuisData) return null;
    try {
      return typeof kuisData === "string" ? JSON.parse(kuisData) : kuisData;
    } catch {
      return null;
    }
  }, [isKuis, kuisData]);

  // Parsing data jawaban kuis peserta
  const jawabanKuisParsed = useMemo(() => {
    if (!isKuis || !jawabanKuisRaw) return null;
    try {
      return typeof jawabanKuisRaw === "string"
        ? JSON.parse(jawabanKuisRaw)
        : jawabanKuisRaw;
    } catch {
      return null;
    }
  }, [isKuis, jawabanKuisRaw]);

  // Cek apakah pengumpulan tugas terlambat dari tenggat waktu tugas
  const isTerlambat = useMemo(() => {
    const wk = pengumpulan?.waktu_kumpul || pengumpulan?.created_at;
    if (!wk || !tugas?.tenggat_waktu) return false;
    return new Date(wk) > new Date(tugas.tenggat_waktu);
  }, [pengumpulan, tugas]);

  // Nilai otomatis tugas proyek sesuai konfigurasi sistem backend:
  // - Mengumpulkan tepat waktu: 100 Poin
  // - Mengumpulkan terlambat: 80 Poin (penalti otomatis keterlambatan)
  // - Jika sudah pernah dinilai di database: gunakan nilai yang tersimpan
  const nilaiOtomatisProyek = useMemo(() => {
    if (pengumpulan?.nilai !== null && pengumpulan?.nilai !== undefined) {
      return Number(pengumpulan.nilai);
    }
    return isTerlambat ? 80 : 100;
  }, [pengumpulan, isTerlambat]);

  // Inisialisasi skor per butir esai langsung pada state initializer
  const [skorEsaiMap, setSkorEsaiMap] = useState(() => {
    const map = {};
    if (kuisConfig?.daftar_soal && jawabanKuisParsed?.detail_per_soal) {
      kuisConfig.daftar_soal.forEach((s) => {
        if (s.tipe === "esai") {
          const det = jawabanKuisParsed.detail_per_soal[s.id];
          map[s.id] = det?.poin_diperoleh ?? 0;
        }
      });
    }
    return map;
  });

  // Hitung total skor kuis secara real-time (Pilihan Ganda + Esai)
  const kalkulasiSkorKuis = useMemo(() => {
    if (!isKuis || !kuisConfig?.daftar_soal) return 0;
    const skorMC = jawabanKuisParsed?.skor_pilihan_ganda ?? 0;
    const skorEsai = Object.values(skorEsaiMap).reduce(
      (sum, val) => sum + (parseInt(val, 10) || 0),
      0
    );
    const totalPoinMaksimal = kuisConfig.daftar_soal.reduce(
      (sum, s) => sum + (parseInt(s.poin, 10) || 0),
      0
    );

    const totalRaw = skorMC + skorEsai;
    if (totalPoinMaksimal > 0 && totalPoinMaksimal !== 100) {
      return Math.round((totalRaw / totalPoinMaksimal) * 100);
    }
    return totalRaw;
  }, [isKuis, kuisConfig, jawabanKuisParsed, skorEsaiMap]);

  // Statistik Jawaban Kuis Peserta
  const statistikKuis = useMemo(() => {
    if (!isKuis || !kuisConfig?.daftar_soal) {
      return { totalSoal: 0, benar: 0, salah: 0, esaiCount: 0, pgCount: 0 };
    }
    const daftarSoal = kuisConfig.daftar_soal;
    let benar = 0;
    let salah = 0;
    let esaiCount = 0;
    let pgCount = 0;

    daftarSoal.forEach((s) => {
      if (s.tipe === "esai") {
        esaiCount++;
      } else {
        pgCount++;
        const detail = jawabanKuisParsed?.detail_per_soal?.[s.id];
        if (detail?.benar) {
          benar++;
        } else {
          salah++;
        }
      }
    });

    return {
      totalSoal: daftarSoal.length,
      benar,
      salah,
      esaiCount,
      pgCount,
    };
  }, [isKuis, kuisConfig, jawabanKuisParsed]);

  // Total Poin Maksimal per Kategori (PG vs Esai)
  const maxSkorBreakdown = useMemo(() => {
    if (!isKuis || !kuisConfig?.daftar_soal) return { maxPG: 0, maxEsai: 0 };
    let maxPG = 0;
    let maxEsai = 0;
    kuisConfig.daftar_soal.forEach((s) => {
      const p = parseInt(s.poin, 10) || 0;
      if (s.tipe === "esai") {
        maxEsai += p;
      } else {
        maxPG += p;
      }
    });
    return { maxPG, maxEsai };
  }, [isKuis, kuisConfig]);

  const kkm = kuisConfig?.kkm || 75;
  const isTuntas = isKuis
    ? kalkulasiSkorKuis >= kkm
    : pengumpulan?.status === "revisi"
      ? false
      : nilaiOtomatisProyek >= 75;

  // Tanggal pengumpulan terformat
  const waktuKumpulFormatted = useMemo(() => {
    const wk = pengumpulan?.waktu_kumpul || pengumpulan?.created_at;
    return wk
      ? new Date(wk).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  }, [pengumpulan]);

  // Preset feedback cepat untuk mentor
  const presetFeedbackKuis = [
    "Jawaban kuis sangat baik, pemahaman materi memuaskan!",
    "Pemaparan esai sudah tepat dan memenuhi bobot penilaian.",
    "Perlu penguatan kembali pada butir soal esai dan konsep terkait.",
    "Pelajari kembali materi untuk persiapan sesi evaluasi berikutnya.",
  ];

  const presetFeedbackProyek = [
    "Hasil pengerjaan tugas proyek sudah sangat baik dan sesuai kriteria.",
    "Tugas disetujui (ACC). Terus tingkatkan kualitas implementasi.",
    "Harap perbaiki dan lengkapi berkas tugas sesuai catatan yang diberikan.",
    "Format laporan atau tautan proyek perlu diperiksa kembali sebelum dikumpulkan.",
  ];

  // Submit Penilaian Kuis
  const handleSimpanPenilaianKuis = async () => {
    setSubmitting(true);
    try {
      const updatedDetailPerSoal = {
        ...(jawabanKuisParsed?.detail_per_soal || {}),
      };
      let totalSkorEsai = 0;

      kuisConfig?.daftar_soal?.forEach((s) => {
        if (s.tipe === "esai") {
          const poinDiberikan = Math.min(
            s.poin,
            Math.max(0, parseInt(skorEsaiMap[s.id], 10) || 0)
          );
          totalSkorEsai += poinDiberikan;
          updatedDetailPerSoal[s.id] = {
            ...(updatedDetailPerSoal[s.id] || {}),
            tipe: "esai",
            poin_maksimal: s.poin,
            poin_diperoleh: poinDiberikan,
            benar: poinDiberikan > 0,
            jawaban_peserta:
              jawabanKuisParsed?.jawaban_peserta?.[s.id] ||
              updatedDetailPerSoal[s.id]?.jawaban_peserta ||
              "",
          };
        }
      });

      const updatedPayload = {
        ...(jawabanKuisParsed || {}),
        skor_esai: totalSkorEsai,
        total_skor: kalkulasiSkorKuis,
        kkm: kkm,
        detail_per_soal: updatedDetailPerSoal,
      };

      const statusRemidi = isTuntas ? "tuntas" : "perlu_remidi";

      await reviewPengumpulanTugasMentor(pengumpulan.id, {
        action: "nilai_kuis",
        nilai: kalkulasiSkorKuis,
        catatan_mentor: catatanMentor.trim(),
        status_remidi: statusRemidi,
        jawaban_kuis: JSON.stringify(updatedPayload),
      });

      toastSuccess(
        `Penilaian kuis peserta ${submission.nama} berhasil disimpan (${kalkulasiSkorKuis} Poin)`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal simpan nilai kuis:", err);
      toastError(err.response?.data?.message || "Gagal menyimpan penilaian kuis");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Penilaian Tugas Berkas / Proyek
  const handleReviewBerkas = async (action) => {
    setSubmitting(true);
    try {
      const isRevisi = action === "revisi";
      const nilaiFinal = isRevisi ? null : nilaiOtomatisProyek;

      await reviewPengumpulanTugasMentor(pengumpulan.id, {
        action: isRevisi ? "revisi" : "acc",
        nilai: nilaiFinal,
        catatan_mentor: catatanMentor.trim(),
        status_remidi: isRevisi ? "perlu_remidi" : "tuntas",
      });

      toastSuccess(
        isRevisi
          ? `Permintaan revisi berhasil dikirim ke ${submission.nama}`
          : `Tugas proyek ${submission.nama} berhasil disetujui (ACC: ${nilaiFinal} Poin)`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal review tugas berkas:", err);
      toastError(err.response?.data?.message || "Gagal memproses penilaian tugas");
    } finally {
      setSubmitting(false);
    }
  };

  // Daftar butir soal terfilter (semua / esai saja / pg saja)
  const daftarSoalTerfilter = useMemo(() => {
    if (!isKuis || !kuisConfig?.daftar_soal) return [];
    if (filterSoalTipe === "esai") {
      return kuisConfig.daftar_soal
        .map((s, idx) => ({ ...s, originalIndex: idx }))
        .filter((s) => s.tipe === "esai");
    }
    if (filterSoalTipe === "pilihan_ganda") {
      return kuisConfig.daftar_soal
        .map((s, idx) => ({ ...s, originalIndex: idx }))
        .filter((s) => s.tipe !== "esai");
    }
    return kuisConfig.daftar_soal.map((s, idx) => ({
      ...s,
      originalIndex: idx,
    }));
  }, [isKuis, kuisConfig, filterSoalTipe]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
        onClick={() => {
          if (!submitting) onClose();
        }}
      >
        <div
          className={`relative w-full max-w-6xl xl:max-w-7xl my-auto rounded-3xl shadow-2xl flex flex-col h-[94vh] max-h-[94vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
            isDark
              ? "bg-[#141a24] text-slate-100 shadow-black/70"
              : "bg-white text-slate-900 shadow-slate-900/25"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER MODAL SIGNATURE KOMINFO (ICON PUTIH, INFO TUGAS LENGKAP) ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4 sm:px-7 sm:py-5 shrink-0 border-0">
            {/* Ambient Glow */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Watermark Icon Besar Berputar Halus */}
            {isKuis ? (
              <NotebookPen
                className="absolute right-14 sm:right-20 top-1/2 -translate-y-1/2 w-24 sm:w-28 h-24 sm:h-28 opacity-[0.08] text-white pointer-events-none rotate-6"
                strokeWidth={1}
              />
            ) : (
              <FilePenLine
                className="absolute right-14 sm:right-20 top-1/2 -translate-y-1/2 w-24 sm:w-28 h-24 sm:h-28 opacity-[0.08] text-white pointer-events-none rotate-6"
                strokeWidth={1}
              />
            )}

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Icon Putih sesuai permintaan user */}
                <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white shadow-lg">
                  {isKuis ? (
                    <NotebookPen className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
                  ) : (
                    <FilePenLine className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
                  )}
                </span>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#00A5EC] bg-white/10 border border-white/15 backdrop-blur-md rounded-full px-2.5 py-0.5 mb-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>
                      {isKuis ? "Review & Koreksi Kuis Peserta" : "Evaluasi & Penilaian Tugas Proyek"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-lg font-black text-white leading-tight truncate">
                    {tugas?.judul || (isKuis ? "Evaluasi Kuis Peserta" : "Evaluasi Tugas Proyek")}
                  </h3>

                  {/* Info Pengganti */}
                  {isKuis ? (
                    <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-white/85 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 text-white font-bold">
                        <FilePenLine className="w-3.5 h-3.5 text-orange-400" />
                        <span>
                          {statistikKuis.esaiCount > 0
                            ? `${statistikKuis.esaiCount} Butir Soal Esai (Perlu Koreksi Mentor)`
                            : `${kuisConfig?.daftar_soal?.length || 0} Butir Soal`}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-white/85 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 text-white font-bold">
                        <FileText className="w-3.5 h-3.5 text-sky-300" />
                        <span>Tugas Berkas / Proyek</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── BODY UTAMA 2 KOLOM (KIRI: KONTEN TUGAS/SOAL, KANAN: PANEL EVALUASI MENTOR) ── */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            
            {/* ══════════════════════════════════════════════════════════════════
                KOLOM KIRI: Lembar Jawaban Kuis / Berkas Tugas (Scrollable)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 lg:w-[60%] xl:w-[62%] h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141a24]">
              
              {/* Sub-Header Kolom Kiri: Navigasi Cepat, Tab Filter Koreksi Esai */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 shrink-0 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-sky-200/90 dark:border-sky-800/60 shadow-2xs shrink-0">
                      {isKuis ? (
                        <HelpCircle className="w-4 h-4" />
                      ) : (
                        <FileCheck2 className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {isKuis
                          ? "Lembar Evaluasi Butir Soal"
                          : "Dokumen & Hasil Penyerahan Peserta"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isKuis
                          ? "Periksa dan berikan skor pada butir soal esai kuis peserta"
                          : "Tinjau instruksi acuan, dokumen pengerjaan, dan catatan peserta"}
                      </p>
                    </div>
                  </div>

                  {/* Format Tag */}
                  {!isKuis && (
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                        Tugas Berkas / Proyek
                      </span>
                    </div>
                  )}

                  {/* Filter Tab Khusus Kuis: Fokus Koreksi Soal Esai */}
                  {isKuis && kuisConfig?.daftar_soal && statistikKuis.esaiCount > 0 && (
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/10 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setFilterSoalTipe("semua")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          filterSoalTipe === "semua"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Semua ({statistikKuis.totalSoal})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterSoalTipe("esai")}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          filterSoalTipe === "esai"
                            ? "bg-orange-500 text-white shadow-2xs font-black"
                            : "text-orange-700 dark:text-orange-300 hover:bg-orange-100/50"
                        }`}
                      >
                        <FilePenLine className="w-3 h-3" />
                        <span>Soal Esai ({statistikKuis.esaiCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterSoalTipe("pilihan_ganda")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          filterSoalTipe === "pilihan_ganda"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Pilihan Ganda ({statistikKuis.pgCount})
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Soal Navigator */}
                {isKuis && kuisConfig?.daftar_soal && kuisConfig.daftar_soal.length > 1 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scroll-halus py-0.5">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-0.5">
                      Lompat ke:
                    </span>
                    {kuisConfig.daftar_soal.map((soal, sIdx) => {
                      const detail = jawabanKuisParsed?.detail_per_soal?.[soal.id];
                      const isChoice = soal.tipe !== "esai";
                      const isBenar = detail?.benar;

                      return (
                        <button
                          key={soal.id || sIdx}
                          type="button"
                          onClick={() => {
                            if (filterSoalTipe !== "semua") {
                              setFilterSoalTipe("semua");
                            }
                            setTimeout(() => {
                              const el = document.getElementById(`soal-card-${sIdx}`);
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }, 50);
                          }}
                          className={`group flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer shrink-0 border hover:scale-105 active:scale-95 ${
                            isChoice
                              ? isBenar
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100"
                              : "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 ring-1 ring-orange-400/30"
                          }`}
                          title={`Lompat ke Soal #${sIdx + 1} (${soal.tipe === "esai" ? `Esai: ${skorEsaiMap[soal.id] ?? 0} Poin` : isBenar ? "Benar" : "Salah"})`}
                        >
                          <span>#{sIdx + 1}</span>
                          {isChoice ? (
                            isBenar ? (
                              <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                            ) : (
                              <X className="w-3 h-3 stroke-[3] text-rose-600" />
                            )
                          ) : (
                            <span className="inline-flex items-center text-[9px] font-bold px-1 rounded bg-orange-200/80 dark:bg-orange-900/60 text-orange-900 dark:text-orange-100">
                              {skorEsaiMap[soal.id] ?? 0}p
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Area Scrollable Konten Kolom Kiri */}
              <div className="flex-1 lg:overflow-y-auto p-4 sm:p-6 space-y-4 custom-modal-scrollbar">
                
                {/* ── KONTEN A: TUGAS KUIS ── */}
                {isKuis && kuisConfig?.daftar_soal && (
                  <div className="space-y-4">
                    {/* Banner Pemberitahuan Fokus Koreksi Esai */}
                    {statistikKuis.esaiCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/90 dark:border-orange-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-2xs">
                            <FilePenLine className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs font-black text-orange-950 dark:text-orange-200 leading-tight">
                              Tugas Mentor: Koreksi {statistikKuis.esaiCount} Butir Soal Esai
                            </h5>
                            <p className="text-[11px] text-orange-700/90 dark:text-orange-300/80 mt-0.5">
                              Pilihan ganda telah diperiksa otomatis oleh sistem ({jawabanKuisParsed?.skor_pilihan_ganda ?? 0} Poin). Nilai butir esai peserta untuk menggenapi nilai akhir.
                            </p>
                          </div>
                        </div>

                        {filterSoalTipe !== "esai" && (
                          <button
                            type="button"
                            onClick={() => setFilterSoalTipe("esai")}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-2xs transition-all cursor-pointer shrink-0"
                          >
                            <span>Tampilkan Esai Saja</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {daftarSoalTerfilter.map((soal) => {
                      const sIdx = soal.originalIndex;
                      const detail = jawabanKuisParsed?.detail_per_soal?.[soal.id];
                      const ansPeserta =
                        jawabanKuisParsed?.jawaban_peserta?.[soal.id] ||
                        detail?.jawaban_peserta ||
                        "";
                      const isPG = soal.tipe === "pilihan_ganda";
                      const isPGKompleks = soal.tipe === "pilihan_ganda_kompleks";
                      const isChoice = isPG || isPGKompleks;
                      const isBenar = detail?.benar;

                      return (
                        <div
                          key={soal.id || sIdx}
                          id={`soal-card-${sIdx}`}
                          className={`rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                            isChoice
                              ? isBenar
                                ? "bg-white dark:bg-slate-900/40 border-emerald-200/90 dark:border-emerald-800/40 ring-1 ring-emerald-500/10"
                                : "bg-white dark:bg-slate-900/40 border-rose-200/90 dark:border-rose-800/40 ring-1 ring-rose-500/10"
                              : "bg-white dark:bg-slate-900/40 border-orange-300 dark:border-orange-700/70 ring-2 ring-orange-500/15"
                          }`}
                        >
                          {/* Baris Atas Kartu Soal */}
                          <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                                #{sIdx + 1}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                                {isPG
                                  ? "Pilihan Ganda"
                                  : isPGKompleks
                                  ? "PG Kompleks"
                                  : "Soal Isian / Esai"}
                              </span>
                              {!isChoice && (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wide bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                                  Koreksi Manual Mentor
                                </span>
                              )}
                            </div>

                            {/* Badge Poin Butir */}
                            <div className="shrink-0">
                              {isChoice ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${
                                    isBenar
                                      ? "bg-emerald-600 text-white"
                                      : "bg-rose-600 text-white"
                                  }`}
                                >
                                  {isBenar ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>+{soal.poin} Poin</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>0 Poin</span>
                                    </>
                                  )}
                                </span>
                              ) : (
                                /* Input Skor Manual untuk Soal Esai */
                                <div className="flex items-center gap-2 bg-orange-50/90 dark:bg-orange-950/60 px-3 py-1 rounded-xl border border-orange-200 dark:border-orange-800 shadow-2xs">
                                  <span className="text-[11px] font-black text-orange-700 dark:text-orange-300">
                                    Skor Esai:
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={soal.poin || 20}
                                    value={skorEsaiMap[soal.id] ?? 0}
                                    onChange={(e) =>
                                      setSkorEsaiMap((prev) => ({
                                        ...prev,
                                        [soal.id]: Math.min(
                                          soal.poin || 20,
                                          Math.max(0, parseInt(e.target.value, 10) || 0)
                                        ),
                                      }))
                                    }
                                    className={`w-14 h-7 text-center text-xs font-black rounded-lg border ${
                                      isDark
                                        ? "bg-slate-900 border-white/10 text-white"
                                        : "bg-white border-orange-200 text-orange-800 font-bold"
                                    } focus:outline-none focus:ring-2 focus:ring-orange-400`}
                                  />
                                  <span className="text-[11px] font-bold text-slate-400">
                                    / {soal.poin}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Teks Pertanyaan */}
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
                            {soal.pertanyaan}
                          </p>

                          {/* Gambar Soal (Jika Tersedia) */}
                          {soal.gambar && (
                            <div className="mb-3.5">
                              <div className="relative inline-flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/50 group/img shadow-2xs max-w-full">
                                <img
                                  src={getFileUrl(soal.gambar)}
                                  alt={`Ilustrasi Soal #${sIdx + 1}`}
                                  className="max-h-40 sm:max-h-44 w-auto object-contain rounded-xl cursor-pointer transition-transform duration-200 group-hover/img:scale-[1.01]"
                                  onClick={() => setPreviewImage(getFileUrl(soal.gambar))}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(getFileUrl(soal.gambar))}
                                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-[10.5px] font-bold backdrop-blur-md shadow-md cursor-pointer transition-all duration-200 hover:scale-105"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span>Perbesar</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Pilihan Jawaban (Untuk Pilihan Ganda & PG Kompleks) */}
                          {isChoice && (
                            <div className="space-y-2 mt-2.5">
                              {soal.opsi?.map((o) => {
                                const ansKeys = String(ansPeserta || "")
                                  .split(",")
                                  .map((k) => k.trim())
                                  .filter(Boolean);
                                const correctKeys = String(soal.kunci_jawaban || "")
                                  .split(",")
                                  .map((k) => k.trim())
                                  .filter(Boolean);

                                const isChosen = ansKeys.includes(o.key);
                                const isCorrectAnswer = correctKeys.includes(o.key);

                                let cardStyle =
                                  "border-slate-200/80 bg-slate-50/60 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300";
                                let keyBadgeStyle =
                                  "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10";

                                if (isCorrectAnswer && isChosen) {
                                  // Peserta Benar Memilih Opsi Ini
                                  cardStyle =
                                    "border-emerald-400 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500/20";
                                  keyBadgeStyle =
                                    "bg-emerald-600 text-white border-emerald-600 shadow-2xs";
                                } else if (!isCorrectAnswer && isChosen) {
                                  // Peserta Salah Memilih Opsi Ini
                                  cardStyle =
                                    "border-rose-300 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-bold ring-1 ring-rose-500/20";
                                  keyBadgeStyle =
                                    "bg-rose-600 text-white border-rose-600 shadow-2xs";
                                } else if (isCorrectAnswer && !isChosen) {
                                  // Kunci Jawaban yang Tidak Dipilih Peserta
                                  cardStyle =
                                    "border-emerald-300/80 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-semibold";
                                  keyBadgeStyle =
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300/80";
                                }

                                return (
                                  <div
                                    key={o.key}
                                    className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border text-xs transition-all ${cardStyle}`}
                                  >
                                    <span
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black border shadow-2xs mt-0.5 ${keyBadgeStyle}`}
                                    >
                                      {o.key}
                                    </span>

                                    <div className="flex-1 min-w-0 pt-0.5 leading-relaxed font-medium">
                                      {o.teks}
                                    </div>

                                    {/* Badges Indikator Pilihan & Kunci */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                                      {isChosen && isCorrectAnswer && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                          <span>Jawaban Peserta (Benar)</span>
                                        </span>
                                      )}

                                      {isChosen && !isCorrectAnswer && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                                          <X className="w-3 h-3 stroke-[3]" />
                                          <span>Jawaban Peserta (Salah)</span>
                                        </span>
                                      )}

                                      {isCorrectAnswer && !isChosen && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-700/60">
                                          <Target className="w-3 h-3 text-emerald-600" />
                                          <span>Kunci Jawaban</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Tampilan Jawaban Soal Esai & Kotak Penilaian Mentor */}
                          {!isChoice && (
                            <div className="mt-3 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 space-y-3">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Jawaban Tertulis dari Peserta:</span>
                                </span>
                                <span className="text-slate-400 font-medium">
                                  {String(ansPeserta || "").length} Karakter
                                </span>
                              </div>

                              <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-white/5 bg-white dark:bg-slate-900/70 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-2xs">
                                {ansPeserta || (
                                  <span className="italic text-slate-400 font-sans">
                                    (Peserta tidak mengisi jawaban pada butir soal ini)
                                  </span>
                                )}
                              </div>

                              {/* Kontrol Penilaian Esai Langsung di Butir Soal */}
                              <div className="pt-2 border-t border-orange-200/70 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-orange-950 dark:text-orange-200">
                                    Tetapkan Skor Butir Ini:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={soal.poin || 20}
                                      value={skorEsaiMap[soal.id] ?? 0}
                                      onChange={(e) =>
                                        setSkorEsaiMap((prev) => ({
                                          ...prev,
                                          [soal.id]: Math.min(
                                            soal.poin || 20,
                                            Math.max(0, parseInt(e.target.value, 10) || 0)
                                          ),
                                        }))
                                      }
                                      className="w-16 h-8 text-center text-xs font-black rounded-lg border border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-900 text-orange-900 dark:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-2xs"
                                    />
                                    <span className="text-xs font-bold text-slate-400">
                                      / {soal.poin} Poin
                                    </span>
                                  </div>
                                </div>

                                {/* Preset Cepat */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    Preset:
                                  </span>
                                  {[
                                    { label: "0 Poin", val: 0 },
                                    {
                                      label: `50% (${Math.round((soal.poin || 20) / 2)})`,
                                      val: Math.round((soal.poin || 20) / 2),
                                    },
                                    {
                                      label: `Maks (${soal.poin || 20})`,
                                      val: soal.poin || 20,
                                    },
                                  ].map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() =>
                                        setSkorEsaiMap((prev) => ({
                                          ...prev,
                                          [soal.id]: preset.val,
                                        }))
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                        skorEsaiMap[soal.id] === preset.val
                                          ? "bg-orange-500 text-white border-orange-500 shadow-2xs"
                                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-300"
                                      }`}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── KONTEN B: TUGAS PROYEK / BERKAS ── */}
                {!isKuis && (
                  <div className="space-y-4">
                    {/* 1. Instruksi Asli Tugas Mentor */}
                    <div className="rounded-2xl border border-sky-200/80 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/70 via-blue-50/20 to-white dark:from-sky-950/20 dark:via-slate-900/50 dark:to-slate-900/70 p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-400/20 text-[#004F9F] dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800/40">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            Instruksi &amp; Panduan Tugas dari Mentor
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60">
                          Acuan Pengerjaan
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-sky-100 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-2xs backdrop-blur-xs">
                        {tugas?.deskripsi || "Tidak ada rincian petunjuk khusus pada penugasan ini."}
                      </div>
                    </div>

                    {/* 2. Berkas Tugas Yang Diunggah (Pratinjau PDF Langsung / Gambar) */}
                    {pengumpulan?.file_pengumpulan && (
                      <BerkasDokumenViewer
                        key={pengumpulan.file_pengumpulan}
                        filePath={pengumpulan.file_pengumpulan}
                        namaPeserta={submission?.nama}
                        isDark={isDark}
                      />
                    )}

                    {/* 3. Tautan Demo / Repository */}
                    {pengumpulan?.link_tugas && (
                      <div className="p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/60 via-blue-50/20 to-white dark:from-sky-950/20 dark:via-slate-900/50 dark:to-slate-900/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Icon dengan Style Batch */}
                          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-sky-200/90 dark:border-sky-800/60 shadow-2xs">
                            <ExternalLink className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-[#004F9F] dark:text-[#00A5EC] uppercase tracking-wider">
                                Tautan Demo / Repository Proyek
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60">
                                Eksternal
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                              {pengumpulan.link_tugas}
                            </p>
                          </div>
                        </div>

                        <a
                          href={pengumpulan.link_tugas}
                          target="_blank"
                          rel="noreferrer"
                          className="group/link inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-[#004F9F] hover:bg-[#003870] dark:bg-[#0070BA] dark:hover:bg-[#005a96] text-white shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
                        >
                          <span>Kunjungi Tautan</span>
                          <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:scale-110 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* 4. Catatan / Pesan Pengantar dari Peserta */}
                    {pengumpulan?.catatan_peserta && (
                      <div className="p-4 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-slate-900/60 dark:to-amber-950/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold">
                              <MessageSquareQuote className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              Catatan / Pesan Pengantar Peserta
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                            Komentar Penyerahan
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-100/80 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap border-l-4 border-l-amber-500 shadow-2xs">
                          &ldquo;{pengumpulan.catatan_peserta}&rdquo;
                        </div>
                      </div>
                    )}

                    {!pengumpulan?.file_pengumpulan && !pengumpulan?.link_tugas && (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-3 shadow-2xs">
                          <Paperclip className="w-6 h-6" />
                        </div>
                        <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                          Belum Ada Lampiran Berkas
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                          Peserta belum mengunggah file dokumen atau tautan demo pengerjaan pada tugas ini.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                KOLOM KANAN: Panel Penilaian, Capaian & Keputusan Mentor
                (Gunakan natural block layout di dalam overflow-y-auto agar tidak tertekan flexbox)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[40%] xl:w-[38%] h-full overflow-y-auto custom-modal-scrollbar p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-900/30">
              
              {/* 1. KARTU PROFIL PESERTA & WAKTU PENGUMPULAN */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141a24] shadow-xs">
                <div className="flex items-center gap-3">
                  <ModalPesertaAvatar
                    nama={submission.nama}
                    foto={submission.foto_profil || submission.foto}
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                      {submission.nama}
                    </h4>
                    {/* Info institusi & bidang inline tanpa batch, sesuai permintaan user */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{submission.institusi || "Peserta Magang"}</span>
                      {submission.posisi_bidang && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            {submission.posisi_bidang}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Waktu Pengumpulan */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Waktu Penyerahan:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {waktuKumpulFormatted ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-black ${
                          isTerlambat
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {isTerlambat ? "Terlambat" : "Tepat Waktu"} ({waktuKumpulFormatted})
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Belum ada waktu rekam
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. KARTU HERO CAPAIAN NILAI & STATUS KKM */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all relative overflow-hidden ${
                  isTuntas
                    ? "bg-gradient-to-br from-emerald-500/[0.09] via-emerald-500/[0.02] to-white dark:from-emerald-950/35 dark:via-slate-900/60 dark:to-slate-900/40 border-emerald-300 dark:border-emerald-700/60"
                    : "bg-gradient-to-br from-amber-500/[0.09] via-amber-500/[0.02] to-white dark:from-amber-950/35 dark:via-slate-900/60 dark:to-slate-900/40 border-amber-300 dark:border-amber-700/60"
                }`}
              >
                {/* Header Status & Badge Kelulusan */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-2xs ${
                        isTuntas ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status Capaian Peserta
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${
                      isTuntas
                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                        : "bg-amber-500 text-white shadow-amber-500/20"
                    }`}
                  >
                    {isTuntas ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isTuntas
                        ? "LULUS / TUNTAS"
                        : isKuis
                        ? "PERLU REMIDI (< KKM)"
                        : pengumpulan?.status === "revisi"
                        ? "MENUNGGU REVISI"
                        : "PERLU REVISI"}
                    </span>
                  </span>
                </div>

                {/* Display Angka Nilai Besar */}
                <div className="flex items-end justify-between gap-2 py-1">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                      {isKuis
                        ? "Total Perolehan Nilai:"
                        : pengumpulan?.status === "dinilai"
                        ? "Total Perolehan Nilai:"
                        : pengumpulan?.status === "revisi"
                        ? "Nilai Otomatis Saat Revisi Disetujui:"
                        : "Nilai Otomatis Saat ACC:"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-4xl sm:text-5xl font-black tracking-tight ${
                          isTuntas
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isKuis ? kalkulasiSkorKuis : nilaiOtomatisProyek}
                      </span>
                      <span className="text-base font-bold text-slate-400">
                        / 100 Poin
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/90 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                      <Target className="w-3.5 h-3.5 text-rose-500" />
                      <span>Standar KKM: {kkm} Poin</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar Visual Pencapaian Nilai dengan Marker KKM */}
                <div className="mt-3.5 pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>0 Poin</span>
                    <span className="text-rose-500 font-black">Batas KKM ({kkm})</span>
                    <span>100 Poin</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTuntas
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-orange-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, isKuis ? kalkulasiSkorKuis : nilaiOtomatisProyek)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Rincian Poin Khusus Kuis: Pilihan Ganda (Auto) vs Esai (Koreksi Mentor) */}
                {isKuis && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Pilihan Ganda
                        </span>
                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                          Auto
                        </span>
                      </div>
                      <span className="font-black text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                        {jawabanKuisParsed?.skor_pilihan_ganda ?? 0}{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          / {maxSkorBreakdown.maxPG} Poin
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {statistikKuis.benar} Benar • {statistikKuis.salah} Salah
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block">
                          Soal Esai
                        </span>
                        <span className="text-[9px] font-black uppercase text-orange-800 dark:text-orange-200 bg-orange-200/80 dark:bg-orange-900/60 px-1.5 py-0.5 rounded font-black">
                          Mentor
                        </span>
                      </div>
                      <span className="font-black text-orange-950 dark:text-orange-200 text-sm mt-0.5 block">
                        {Object.values(skorEsaiMap).reduce(
                          (s, v) => s + (parseInt(v, 10) || 0),
                          0
                        )}{" "}
                        <span className="text-[11px] font-normal text-orange-500/80 dark:text-orange-400/80">
                          / {maxSkorBreakdown.maxEsai} Poin
                        </span>
                      </span>
                      <span className="text-[10px] text-orange-700 dark:text-orange-400 block mt-0.5 font-medium">
                        {statistikKuis.esaiCount} Butir Esai
                      </span>
                    </div>
                  </div>
                )}

                {/* Ketentuan Penilaian Otomatis Khusus Tugas Proyek / Berkas */}
                {!isKuis && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200/70 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Ketentuan Nilai Sistem Otomatis:</span>
                      </span>
                      <span
                        className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-md border ${
                          isTerlambat
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {isTerlambat ? "Terkena Penalti (80 Poin)" : "Bebas Penalti (100 Poin)"}
                      </span>
                    </div>

                    {/* 3 Skema Konfigurasi Nilai Backend */}
                    <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                      {/* 1. Tepat Waktu */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all ${
                          !isTerlambat
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/25 shadow-xs"
                            : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Tepat Waktu
                          </span>
                          {!isTerlambat && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          100 Poin
                        </span>
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-medium">
                          Lulus Penuh
                        </span>
                      </div>

                      {/* 2. Terlambat */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all ${
                          isTerlambat
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/25 shadow-xs"
                            : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Terlambat
                          </span>
                          {isTerlambat && (
                            <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-base font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                          80 Poin
                        </span>
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-medium">
                          Penalti Waktu
                        </span>
                      </div>

                      {/* 3. Tidak Kumpul */}
                      <div className="p-2.5 rounded-xl border bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-60">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Tidak Kumpul
                          </span>
                        </div>
                        <span className="text-base font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                          0 Poin
                        </span>
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-medium">
                          Gagal / Ditolak
                        </span>
                      </div>
                    </div>

                    {pengumpulan?.status === "revisi" ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        <span className="font-bold">Status Saat Ini:</span> Tugas ini sedang dalam status{" "}
                        <strong>Permintaan Revisi</strong>. Mentor sedang menunggu peserta mengunggah berkas/tautan perbaikan. Anda tetap dapat memperbarui catatan atau langsung meng-ACC jika peserta sudah mengonfirmasi perbaikan.
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Peran Mentor:
                        </span>{" "}
                        Tinjau berkas pengerjaan di kolom kiri. Jika layak, klik{" "}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          &ldquo;Setujui (ACC Penilaian)&rdquo;
                        </strong>{" "}
                        untuk mengesahkan nilai{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                          {nilaiOtomatisProyek} Poin
                        </strong>
                        . Jika belum memenuhi syarat, klik{" "}
                        <strong className="text-rose-600 dark:text-rose-400 font-bold">
                          &ldquo;Minta Revisi&rdquo;
                        </strong>{" "}
                        disertai catatan perbaikan.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. CATATAN & FEEDBACK MENTOR */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141a24] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Catatan Ulasan &amp; Umpan Balik</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tampil di akun peserta
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={catatanMentor}
                  onChange={(e) => setCatatanMentor(e.target.value)}
                  placeholder="Berikan apresiasi, ulasan korektif, atau arahan tindak lanjut bagi peserta magang..."
                  className={`w-full p-3 text-xs rounded-xl border font-medium leading-relaxed transition-all ${
                    isDark
                      ? "bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                      : "bg-slate-50/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                  } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20`}
                />

                {/* Preset Feedback Cepat */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    Saran Ulasan Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(isKuis ? presetFeedbackKuis : presetFeedbackProyek).map(
                      (preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCatatanMentor((prev) =>
                              prev ? `${prev}\n${preset}` : preset
                            );
                          }}
                          className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/5 px-2 py-0.5 rounded-lg transition-colors cursor-pointer text-left"
                        >
                          + {preset}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER MODAL AKSI (BATAL DI KIRI SIMPAN, FONT UKURAN SAMA, WARNA SIGNATURE KOMINFO) ── */}
          <div
            className={`px-5 py-3.5 sm:px-7 sm:py-4 border-t shrink-0 flex items-center justify-end gap-3 shadow-md ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-200/90 bg-white"
            }`}
          >
            {/* Tombol Batal dipindahkan ke sebelah kiri tombol aksi utama dengan ukuran font sama */}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-6 py-2.5 text-xs font-black rounded-xl border cursor-pointer disabled:opacity-50 transition-all ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              Batal
            </button>

            {isKuis ? (
              <button
                type="button"
                onClick={handleSimpanPenilaianKuis}
                disabled={submitting}
                className="group/btn relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-2.5 text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Send className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 shrink-0" />
                )}
                <span>Simpan Penilaian Kuis</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleReviewBerkas("revisi")}
                  disabled={submitting}
                  className="group/revisi inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black hover:bg-rose-100 hover:border-rose-400 dark:hover:bg-rose-950/60 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover/revisi:-rotate-90 group-hover/revisi:scale-110 shrink-0" />
                  <span>Minta Revisi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewBerkas("acc")}
                  disabled={submitting}
                  className="group/btn relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-2.5 text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-115 shrink-0" />
                  )}
                  <span>Setujui (ACC Penilaian)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ZOOM GAMBAR SOAL ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Tutup Gambar</span>
            </button>
            <img
              src={previewImage}
              alt="Preview Gambar Soal"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </>
  );
};

export const ReviewDetailModal = ({ isOpen, onClose, ...props }) => {
  if (!isOpen || !props.submission) return null;

  return (
    <ReviewDetailModalContent
      key={`${props.submission.peserta_id}-${props.submission?.pengumpulan?.id || "baru"}`}
      onClose={onClose}
      {...props}
    />
  );
};
