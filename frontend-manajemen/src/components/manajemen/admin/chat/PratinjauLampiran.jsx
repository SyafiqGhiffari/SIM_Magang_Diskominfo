import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Printer,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ukuranBerkas = (b) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const PratinjauLampiran = ({ pesan, onTutup }) => {
  const [zoom, setZoom] = useState(1);
  const [putar, setPutar] = useState(0);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(0);
  const [memuat, setMemuat] = useState(false);
  const [gagal, setGagal] = useState("");

  const canvasRef = useRef(null);
  const dokumenRef = useRef(null);

  const url = getFileUrl(pesan.file_path);
  const isGambar = pesan.tipe === "gambar";
  const isPdf = (pesan.file_nama || "").toLowerCase().endsWith(".pdf");
  const isVideo = pesan.tipe === "video";

  // Cetak lewat iframe tersembunyi agar dialog cetak peramban terbuka tanpa
  // memindahkan admin keluar dari halaman.
  const cetak = () => {
    const bingkai = document.createElement("iframe");
    bingkai.style.position = "fixed";
    bingkai.style.right = "0";
    bingkai.style.bottom = "0";
    bingkai.style.width = "0";
    bingkai.style.height = "0";
    bingkai.style.border = "0";
    bingkai.src = url;

    bingkai.onload = () => {
      try {
        bingkai.contentWindow.focus();
        bingkai.contentWindow.print();
      } catch {
        window.open(url, "_blank");
      }
      // Beri jeda agar dialog cetak sempat terbuka sebelum bingkai dibuang
      setTimeout(() => document.body.removeChild(bingkai), 60000);
    };

    document.body.appendChild(bingkai);
  };

  /* ── Muat dokumen PDF sekali ── */
  useEffect(() => {
    if (!isPdf) return;
    let batal = false;
    let tugas = null;

    const muat = async () => {
      setMemuat(true);
      setGagal("");
      try {
        tugas = pdfjsLib.getDocument({ url });
        const dok = await tugas.promise;
        if (batal) return;
        dokumenRef.current = dok;
        setTotalHalaman(dok.numPages);
        setHalaman(1);
      } catch {
        if (!batal) setGagal("Dokumen gagal dimuat. Berkas mungkin rusak atau sudah dihapus.");
      } finally {
        if (!batal) setMemuat(false);
      }
    };

    muat();
    return () => {
      batal = true;
      tugas?.destroy?.();
      dokumenRef.current?.destroy?.();
      dokumenRef.current = null;
    };
  }, [url, isPdf]);

  /* ── Gambar ulang halaman saat berpindah atau di-zoom ── */
  useEffect(() => {
    if (!isPdf || !dokumenRef.current || !canvasRef.current) return;
    let batal = false;

    const gambar = async () => {
      try {
        const hal = await dokumenRef.current.getPage(halaman);
        if (batal) return;

        // Skala dasar disesuaikan lebar wadah agar dokumen terbaca tanpa
        // pengguna harus memperbesar manual dulu.
        const dasar = hal.getViewport({ scale: 1 });
        const lebarTersedia =
          typeof window !== "undefined" && window.innerWidth < 640
            ? Math.min(window.innerWidth - 24, 600)
            : Math.min(window.innerWidth - 120, 900);
        const skala = (lebarTersedia / dasar.width) * zoom;
        const viewport = hal.getViewport({ scale: skala, rotation: putar });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await hal.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        if (!batal) setGagal("Halaman gagal ditampilkan.");
      }
    };

    gambar();
    return () => { batal = true; };
  }, [halaman, zoom, putar, isPdf, totalHalaman]);

  /* ── Pintasan papan ketik ── */
  useEffect(() => {
    const tombol = (e) => {
      if (e.key === "Escape") onTutup();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
      if (isPdf && e.key === "ArrowRight") setHalaman((h) => Math.min(h + 1, totalHalaman));
      if (isPdf && e.key === "ArrowLeft") setHalaman((h) => Math.max(h - 1, 1));
    };
    document.addEventListener("keydown", tombol);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tombol);
      document.body.style.overflow = "";
    };
  }, [onTutup, isPdf, totalHalaman]);

  const tombolBilah =
    "flex h-7 w-7 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-90";

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646] flex flex-col bg-slate-950/95 backdrop-blur-sm animate-[fadeslide_0.2s_ease-out]"
      onClick={onTutup}
    >
      {/* ── Bilah atas ── */}
      <div
        className="flex shrink-0 items-center justify-between gap-1.5 sm:gap-4 border-b border-white/10 px-2.5 sm:px-5 py-2 sm:py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 text-white">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10.5px] sm:text-[13px] font-bold text-white">
              {pesan.file_nama || "Lampiran"}
            </p>
            <p className="truncate text-[8.5px] sm:text-[10.5px] font-medium text-white/50">
              {ukuranBerkas(pesan.file_size)}
              {pesan.content && ` · ${pesan.content}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* Navigasi halaman PDF */}
          {isPdf && totalHalaman > 1 && (
            <>
              <button
                onClick={() => setHalaman((h) => Math.max(h - 1, 1))}
                disabled={halaman <= 1}
                title="Halaman sebelumnya"
                className={`${tombolBilah} disabled:cursor-default disabled:opacity-25`}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="min-w-[40px] sm:min-w-[64px] text-center text-[8.5px] sm:text-[11px] font-bold tabular-nums text-white/70">
                {halaman} / {totalHalaman}
              </span>
              <button
                onClick={() => setHalaman((h) => Math.min(h + 1, totalHalaman))}
                disabled={halaman >= totalHalaman}
                title="Halaman berikutnya"
                className={`${tombolBilah} disabled:cursor-default disabled:opacity-25`}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="mx-0.5 sm:mx-1 h-3.5 sm:h-5 w-px bg-white/15" />
            </>
          )}

          <a href={url} download={pesan.file_nama} title="Unduh" className={tombolBilah}>
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </a>
          <button onClick={cetak} title="Cetak" className={tombolBilah}>
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={onTutup}
            title="Tutup (Esc)"
            className="flex h-7 w-7 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl text-white/60 transition-all hover:rotate-90 hover:bg-white/15 hover:text-white"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* ── Isi ── */}
      {/* items-start dipakai, bukan items-center, karena dokumen yang lebih
          tinggi dari layar akan terpotong bagian atasnya bila dipusatkan.
          Pemusatan dikembalikan lewat margin otomatis pada isinya. */}
      <div className="scroll-halus relative flex flex-1 justify-center overflow-auto p-2 sm:p-6">
        {isGambar ? (
          <img
            src={url}
            alt={pesan.file_nama}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${zoom}) rotate(${putar}deg)` }}
            className="m-auto max-h-full max-w-full cursor-default rounded-md sm:rounded-lg shadow-2xl transition-transform duration-200"
          />
        ) : isVideo ? (
          <video
            src={url}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            className="m-auto max-h-full max-w-full rounded-md sm:rounded-lg bg-black shadow-2xl"
          />
        ) : isPdf ? (
          gagal ? (
            <KartuGagal pesan={gagal} url={url} nama={pesan.file_nama} />
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="relative my-auto">
              {memuat && (
                <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-white/5 px-4 py-5 sm:px-8 sm:py-10 text-[9.5px] sm:text-[12px] font-medium text-white/60">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-sky-400" />
                  Memuat dokumen...
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`rounded-md sm:rounded-lg bg-white shadow-2xl ${memuat ? "hidden" : "block"}`}
              />
            </div>
          )
        ) : (
          <KartuGagal
            pesan="Format berkas ini tidak dapat ditampilkan langsung."
            url={url}
            nama={pesan.file_nama}
          />
        )}

        {/* ── Bilah kontrol mengambang (Zoom & Putar) untuk Mobile & Desktop ── */}
        {(isGambar || isPdf) && !gagal && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-10 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/20 bg-slate-900/90 px-3 py-1.5 sm:px-4 sm:py-2 shadow-2xl backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          >
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              title="Perkecil (-)"
              className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-90"
            >
              <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="min-w-[36px] sm:min-w-[44px] text-center text-[10px] sm:text-[11.5px] font-bold tabular-nums text-white">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
              title="Perbesar (+)"
              className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-90"
            >
              <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="mx-0.5 sm:mx-1 h-3.5 sm:h-4 w-px bg-white/20" />
            <button
              onClick={() => setPutar((p) => (p + 90) % 360)}
              title="Putar"
              className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-90"
            >
              <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </div>

      <p className="shrink-0 pb-2 sm:pb-3 text-center text-[8.5px] sm:text-[10px] font-medium text-white/30">
        <span className="inline sm:hidden">Ketuk di luar untuk menutup</span>
        <span className="hidden sm:inline">
          {isPdf && totalHalaman > 1
            ? "Panah kiri/kanan untuk ganti halaman · Esc untuk menutup"
            : "Klik di luar atau tekan Esc untuk menutup"}
        </span>
      </p>
    </div>,
    document.body
  );
};

const KartuGagal = ({ pesan, url, nama }) => (
  <div
    onClick={(e) => e.stopPropagation()}
    className="m-auto flex flex-col items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/5 px-6 py-8 sm:px-12 sm:py-14 text-center"
  >
    <span className="flex h-12 w-12 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 text-white/60">
      <FileText className="h-6 w-6 sm:h-9 sm:w-9" />
    </span>
    <div>
      <p className="text-[12px] sm:text-[14px] font-bold text-white">Pratinjau tidak tersedia</p>
      <p className="mt-0.5 sm:mt-1 max-w-xs text-[9.5px] sm:text-[11.5px] font-medium leading-relaxed text-white/50">{pesan}</p>
    </div>
    <a
      href={url}
      download={nama}
      className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-[12px] font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
    >
      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
      Unduh Berkas
    </a>
  </div>
);

export default PratinjauLampiran;