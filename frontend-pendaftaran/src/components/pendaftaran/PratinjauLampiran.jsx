import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Printer,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl";

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
        const lebarTersedia = Math.min(window.innerWidth - 120, 900);
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
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-90";

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646] flex flex-col bg-slate-950/95 backdrop-blur-sm"
      onClick={onTutup}
    >
      {/* ── Bilah atas ── */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">
              {pesan.file_nama || "Lampiran"}
            </p>
            <p className="truncate text-[10.5px] font-medium text-white/50">
              {ukuranBerkas(pesan.file_size)}
              {pesan.content && ` · ${pesan.content}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Navigasi halaman PDF */}
          {isPdf && totalHalaman > 1 && (
            <>
              <button
                onClick={() => setHalaman((h) => Math.max(h - 1, 1))}
                disabled={halaman <= 1}
                title="Halaman sebelumnya"
                className={`${tombolBilah} disabled:cursor-default disabled:opacity-25`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[64px] text-center text-[11px] font-bold tabular-nums text-white/70">
                {halaman} / {totalHalaman}
              </span>
              <button
                onClick={() => setHalaman((h) => Math.min(h + 1, totalHalaman))}
                disabled={halaman >= totalHalaman}
                title="Halaman berikutnya"
                className={`${tombolBilah} disabled:cursor-default disabled:opacity-25`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/15" />
            </>
          )}

          {(isGambar || isPdf) && (
            <>
              <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} title="Perkecil" className={tombolBilah}>
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-[11px] font-bold tabular-nums text-white/60">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} title="Perbesar" className={tombolBilah}>
                <ZoomIn className="h-4 w-4" />
              </button>
              <button onClick={() => setPutar((p) => (p + 90) % 360)} title="Putar" className={tombolBilah}>
                <RotateCw className="h-4 w-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/15" />
            </>
          )}

          <a href={url} download={pesan.file_nama} title="Unduh" className={tombolBilah}>
            <Download className="h-4 w-4" />
          </a>
          <button onClick={cetak} title="Cetak" className={tombolBilah}>
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={onTutup}
            title="Tutup (Esc)"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/60 transition-all hover:rotate-90 hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Isi ── */}
      {/* items-start dipakai, bukan items-center, karena dokumen yang lebih
          tinggi dari layar akan terpotong bagian atasnya bila dipusatkan.
          Pemusatan dikembalikan lewat margin otomatis pada isinya. */}
      <div className="flex flex-1 justify-center overflow-auto p-6">
        {isGambar ? (
          <img
            src={url}
            alt={pesan.file_nama}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${zoom}) rotate(${putar}deg)` }}
            className="m-auto max-h-full max-w-full cursor-default rounded-lg shadow-2xl transition-transform duration-200"
          />
        ) : isVideo ? (
          <video
            src={url}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            className="m-auto max-h-full max-w-full rounded-lg bg-black shadow-2xl"
          />
        ) : isPdf ? (
          gagal ? (
            <KartuGagal pesan={gagal} url={url} nama={pesan.file_nama} />
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="relative my-auto">
              {memuat && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 px-8 py-10 text-[12px] font-medium text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat dokumen...
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`rounded-lg bg-white shadow-2xl ${memuat ? "hidden" : "block"}`}
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
      </div>

      <p className="shrink-0 pb-3 text-center text-[10px] font-medium text-white/30">
        {isPdf && totalHalaman > 1
          ? "Panah kiri/kanan untuk ganti halaman · Esc untuk menutup"
          : "Klik di luar atau tekan Esc untuk menutup"}
      </p>
    </div>,
    document.body
  );
};

const KartuGagal = ({ pesan, url, nama }) => (
  <div
    onClick={(e) => e.stopPropagation()}
    className="m-auto flex flex-col items-center gap-4 rounded-2xl bg-white/5 px-12 py-14 text-center"
  >
    <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-white/60">
      <FileText className="h-9 w-9" />
    </span>
    <div>
      <p className="text-[14px] font-bold text-white">Pratinjau tidak tersedia</p>
      <p className="mt-1 max-w-xs text-[11.5px] font-medium leading-relaxed text-white/50">{pesan}</p>
    </div>
    <a
      href={url}
      download={nama}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-5 py-2.5 text-[12px] font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
    >
      <Download className="h-4 w-4" />
      Unduh Berkas
    </a>
  </div>
);

export default PratinjauLampiran;