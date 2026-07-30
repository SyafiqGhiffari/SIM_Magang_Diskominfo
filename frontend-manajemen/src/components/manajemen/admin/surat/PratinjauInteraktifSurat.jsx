import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { FileText, Maximize2, Move, ZoomIn, ZoomOut } from "lucide-react";
import {
  LABEL_FIELD,
  garisBantu,
  geserMargin,
  snapTerdekat,
  terapkanGeser,
} from "./pemetaanGeser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const LEBAR_MM = 210;
const TINGGI_MM = 297;
const SISA_TEPI = 24; // ruang kosong di sekitar kertas saat "sesuai layar" (px)
const ZOOM_MIN = 0.4;
const ZOOM_MAKS = 6;
const FAKTOR_ZOOM = 1.25;
const LEBAR_KANVAS_MAKS = 4200; // batas piksel kanvas agar tidak boros memori

const jepitZoom = (z) => Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, z));

const adalahBatalRender = (err) => {
  const n = err?.name || "";
  return n === "RenderingCancelledException" || n === "AbortException" || /cancel/i.test(err?.message || "");
};

/**
 * Pratinjau surat yang bisa ditata dengan cara digeser.
 *
 * Halaman PDF dari backend dirender ke <canvas> memakai pdf.js, lalu di
 * atasnya ditempel kotak transparan untuk setiap bagian surat. Menggeser
 * kotak tidak membuat koordinat baru — yang berubah adalah angka
 * tata letak yang memang sudah ada (ttd_x, logo_y, jarak_setelah_kop, dst).
 *
 * Zoom & gulir:
 * - Ctrl/Cmd + roda tetikus (titik zoom mengikuti posisi kursor)
 * - Tombol +/−/sesuai layar di kanan bawah, atau Ctrl + "+" / "-" / "0"
 * - Saat diperbesar: roda tetikus untuk gulir tegak, Shift + roda untuk
 *   mendatar, scrollbar, atau tarik area kosong untuk menggeser kanvas.
 *
 * Catatan penting: panel induk WAJIB memakai min-h-0 + overflow-hidden,
 * kalau tidak panel akan melar mengikuti kertas dan area ini tidak akan
 * pernah punya ruang untuk digulir.
 */
const PratinjauInteraktifSurat = ({
  pratinjauUrl,
  peta,
  tataLetak,
  setTataLetak,
  isDark = false,
  memuat = false,
}) => {
  const wadahRef = useRef(null); // area bergulir
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const targetGulirRef = useRef(null);

  const [fit, setFit] = useState(0); // px per mm saat zoom 100%
  const [zoom, setZoom] = useState(1);
  const [terpilih, setTerpilih] = useState(null);
  const [bayangan, setBayangan] = useState(null); // { id, dx, dy, dw } dalam px
  const [garis, setGaris] = useState({ x: null, y: null }); // dalam mm
  const [petunjuk, setPetunjuk] = useState("");
  const [galat, setGalat] = useState("");
  const [terender, setTerender] = useState(false);

  // Pada zoom 100% kertas pas di layar, jadi ruang gulir baru ada saat > 100%.
  const bisaGulir = zoom > 1.001;
  const skala = fit > 0 ? fit * zoom : 0; // px per mm
  const ukuran = useMemo(
    () => ({ w: LEBAR_MM * skala, h: TINGGI_MM * skala }),
    [skala],
  );
  const kePx = useCallback((mm) => mm * skala, [skala]);

  const blokList = useMemo(() => peta?.blok || [], [peta]);

  // ── Ukur area pratinjau untuk skala "sesuai layar" ──
  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    const ukur = () => {
      const w = el.clientWidth - SISA_TEPI;
      const h = el.clientHeight - SISA_TEPI;
      if (w <= 0 || h <= 0) return;
      const s = Math.min(w / LEBAR_MM, h / TINGGI_MM);
      setFit((lama) => (Math.abs(lama - s) < 0.001 ? lama : s));
    };
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Ubah zoom dengan titik jangkar (agar yang dilihat tidak melompat) ──
  const ubahZoom = useCallback(
    (nilaiBaru, jangkar) => {
      const zn = jepitZoom(typeof nilaiBaru === "function" ? nilaiBaru(zoom) : nilaiBaru);
      if (zn === zoom) return;
      const el = wadahRef.current;
      if (el) {
        const rasio = zn / zoom;
        const ax = jangkar ? jangkar.x : el.clientWidth / 2;
        const ay = jangkar ? jangkar.y : el.clientHeight / 2;
        targetGulirRef.current = {
          left: (el.scrollLeft + ax) * rasio - ax,
          top: (el.scrollTop + ay) * rasio - ay,
        };
      }
      setZoom(zn);
    },
    [zoom],
  );

  // Terapkan posisi gulir setelah ukuran kertas berubah
  useEffect(() => {
    const t = targetGulirRef.current;
    if (!t) return;
    targetGulirRef.current = null;
    const el = wadahRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, t.left);
    el.scrollTop = Math.max(0, t.top);
  }, [zoom, ukuran.w]);

  // ── Ctrl/Cmd + roda tetikus untuk zoom (listener non-pasif) ──
  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return; // roda biasa = gulir normal
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const jangkar = { x: e.clientX - r.left, y: e.clientY - r.top };
      const arah = e.deltaY < 0 ? FAKTOR_ZOOM : 1 / FAKTOR_ZOOM;
      ubahZoom((z) => z * arah, jangkar);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ubahZoom]);

  // ── Render halaman pertama PDF ke canvas ──
  useEffect(() => {
    if (!pratinjauUrl || ukuran.w <= 0) return;
    let batal = false;
    let tugasMuat = null;
    let tugasRender = null;

    (async () => {
      try {
        setGalat("");
        setTerender(false);

        // Tunggu <canvas> benar-benar ter-mount
        for (let i = 0; i < 40 && !canvasRef.current && !batal; i++) {
          await new Promise((r) => setTimeout(r, 25));
        }
        const canvas = canvasRef.current;
        if (!canvas || batal) return;

        // Baca byte PDF-nya lebih dulu. Kalau blob URL diberikan langsung ke
        // pdf.js, URL itu bisa sudah di-revoke (autosave/StrictMode membuat
        // pratinjau baru) saat worker mulai mengunduh, hasilnya kanvas kosong.
        const respons = await fetch(pratinjauUrl);
        if (!respons.ok) throw new Error(`Gagal mengambil PDF pratinjau (${respons.status})`);
        const bytes = await respons.arrayBuffer();
        if (batal) return;
        if (!bytes || bytes.byteLength === 0) throw new Error("PDF pratinjau kosong");

        tugasMuat = pdfjsLib.getDocument({ data: bytes });
        const dokumen = await tugasMuat.promise;
        if (batal) return;
        const halaman = await dokumen.getPage(1);
        if (batal) return;

        const dasar = halaman.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // Semakin besar zoom, semakin tinggi resolusi render agar teks tetap tajam,
        // tapi tetap dibatasi supaya kanvas tidak kehabisan memori.
        const lebarTarget = Math.min(ukuran.w * dpr, LEBAR_KANVAS_MAKS);
        const viewport = halaman.getViewport({ scale: lebarTarget / dasar.width });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = `${ukuran.w}px`;
        canvas.style.height = `${ukuran.h}px`;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        tugasRender = halaman.render({ canvas, canvasContext: ctx, viewport });
        await tugasRender.promise;
        if (!batal) setTerender(true);
      } catch (err) {
        if (batal || adalahBatalRender(err)) return;
        console.error("Gagal merender pratinjau surat:", err);
        setGalat(err?.message || "Gagal merender pratinjau surat");
      }
    })();

    return () => {
      batal = true;
      try { tugasRender?.cancel(); } catch { /* noop */ }
      try { tugasMuat?.destroy(); } catch { /* noop */ }
    };
  }, [pratinjauUrl, ukuran.w, ukuran.h]);

  // ── Geser kanvas (pan) saat area kosong ditarik ──
  const mulaiPan = (e) => {
    const el = wadahRef.current;
    if (!el) return;
    setTerpilih(null);
    const adaRuang = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    if (!adaRuang) return;
    panRef.current = {
      x0: e.clientX,
      y0: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
      pointerId: e.pointerId,
    };
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const saatPan = (e) => {
    const p = panRef.current;
    const el = wadahRef.current;
    if (!p || !el) return;
    el.scrollLeft = p.left - (e.clientX - p.x0);
    el.scrollTop = p.top - (e.clientY - p.y0);
  };

  const selesaiPan = (e) => {
    const p = panRef.current;
    const el = wadahRef.current;
    if (p && el) {
      try { el.releasePointerCapture(e.pointerId ?? p.pointerId); } catch { /* noop */ }
    }
    panRef.current = null;
  };

  // ── Geser blok ──
  const mulaiGeserBlok = (e, blok, resize = false) => {
    if (!skala) return;
    e.stopPropagation();
    e.preventDefault();
    if (!resize && !blok.sumbu_x && !blok.sumbu_y) {
      setTerpilih(blok.id);
      return;
    }
    if (resize && !blok.sumbu_w) return;

    setTerpilih(blok.id);
    const bantu = garisBantu(peta, tataLetak, blok.id);
    dragRef.current = {
      jenis: "blok",
      blok,
      resize,
      x0: e.clientX,
      y0: e.clientY,
      awal: { ...tataLetak },
      targetX: bantu.x,
      targetY: bantu.y,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  // ── Geser garis margin ──
  const mulaiGeserMargin = (e, field, tanda, sumbu) => {
    if (!skala) return;
    e.stopPropagation();
    e.preventDefault();
    setTerpilih(field);
    dragRef.current = {
      jenis: "margin",
      field,
      tanda,
      sumbu,
      x0: e.clientX,
      y0: e.clientY,
      awal: { ...tataLetak },
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const saatBergerak = (e) => {
    const d = dragRef.current;
    if (!d || !skala) return;

    const dxMm = (e.clientX - d.x0) / skala;
    const dyMm = (e.clientY - d.y0) / skala;

    if (d.jenis === "margin") {
      const delta = (d.sumbu === "x" ? dxMm : dyMm) * d.tanda;
      const baruMargin = geserMargin(d.awal, d.field, delta, d.awal);
      setTataLetak((p) => ({ ...p, ...baruMargin }));
      setPetunjuk(`${LABEL_FIELD[d.field] || d.field}: ${Number(baruMargin[d.field]).toFixed(1)} mm`);
      return;
    }

    let dx = dxMm;
    let dy = dyMm;
    let gx = null;
    let gy = null;

    if (!d.resize) {
      if (d.blok.sumbu_x) {
        const kena = snapTerdekat(d.blok.x + dx, d.targetX);
        if (kena !== null) { dx = kena - d.blok.x; gx = kena; }
      }
      if (d.blok.sumbu_y) {
        const kena = snapTerdekat(d.blok.y + dy, d.targetY);
        if (kena !== null) { dy = kena - d.blok.y; gy = kena; }
      }
    }

    setGaris((p) => (p.x === gx && p.y === gy ? p : { x: gx, y: gy }));
    setBayangan({
      id: d.blok.id,
      dx: d.resize ? 0 : kePx(d.blok.sumbu_x ? dx : 0),
      dy: d.resize ? 0 : kePx(d.blok.sumbu_y ? dy : 0),
      dw: d.resize ? kePx(dx) : 0,
    });

    // Dihitung dari salinan `awal` (bukan dari state saat ini) supaya tidak
    // ada efek samping di dalam fungsi pembaru state React.
    const baru = terapkanGeser(d.awal, d.blok, dx, dy, d.awal, { resize: d.resize });
    setTataLetak((p) => ({ ...p, ...baru }));

    const field = d.resize ? d.blok.sumbu_w : d.blok.sumbu_x || d.blok.sumbu_y;
    if (field) setPetunjuk(`${LABEL_FIELD[field] || field}: ${Number(baru[field]).toFixed(1)} mm`);
  };

  const selesaiGerak = (e) => {
    if (dragRef.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      dragRef.current = null;
    }
    setBayangan(null);
    setGaris({ x: null, y: null });
    setPetunjuk("");
  };

  // ── Papan tombol: geser halus blok + pintasan zoom ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          ubahZoom((z) => z * FAKTOR_ZOOM);
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          ubahZoom((z) => z / FAKTOR_ZOOM);
        } else if (e.key === "0") {
          e.preventDefault();
          ubahZoom(1);
        }
        return;
      }

      if (!terpilih) return;
      const blok = blokList.find((b) => b.id === terpilih);
      if (!blok) return;
      const langkah = e.shiftKey ? 5 : 0.5;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -langkah;
      else if (e.key === "ArrowRight") dx = langkah;
      else if (e.key === "ArrowUp") dy = -langkah;
      else if (e.key === "ArrowDown") dy = langkah;
      else return;
      if ((dx && !blok.sumbu_x) || (dy && !blok.sumbu_y)) return;
      e.preventDefault();
      setTataLetak((p) => terapkanGeser(p, blok, dx, dy, p));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terpilih, blokList, setTataLetak, ubahZoom]);

  const warnaKotak = (blok) => {
    const bisa = Boolean(blok.sumbu_x || blok.sumbu_y || blok.sumbu_w);
    if (!bisa) return "border-slate-400/40";
    return terpilih === blok.id
      ? "border-[#00A5EC] bg-[#00A5EC]/10"
      : "border-[#004F9F]/35 hover:border-[#004F9F] hover:bg-[#00A5EC]/[0.07]";
  };

  const clsTombolZoom = `flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 ${
    isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
  }`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Area bergulir. Dipasang absolute inset-0 supaya ukurannya selalu sama
          dengan panel pratinjau dan tidak ikut membesar mengikuti isi kertas
          (kalau ikut membesar, tidak akan pernah ada ruang untuk digulir). */}
      <div
        ref={wadahRef}
        className={`absolute inset-0 overflow-auto overscroll-contain ${bisaGulir ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={mulaiPan}
        onPointerMove={saatPan}
        onPointerUp={selesaiPan}
        onPointerCancel={selesaiPan}
      >
        {/* Pembungkus memakai lebar/tinggi "max-content" supaya area gulir benar-benar
            tumbuh saat kertas lebih besar dari layar. Dengan min-w/min-h 100% kertas
            tetap di tengah ketika masih lebih kecil dari layar. */}
        <div
          className="flex items-center justify-center"
          style={{
            width: "max-content",
            height: "max-content",
            minWidth: "100%",
            minHeight: "100%",
            padding: SISA_TEPI / 2,
          }}
        >
          {ukuran.w > 0 && (
            <div
              className="relative shrink-0 select-none rounded-sm bg-white shadow-2xl ring-1 ring-black/10"
              style={{ width: ukuran.w, height: ukuran.h, touchAction: "none" }}
              onPointerMove={saatBergerak}
              onPointerUp={selesaiGerak}
              onPointerCancel={selesaiGerak}
            >
              <canvas ref={canvasRef} className="block rounded-sm" />

              {/* ── Garis margin (bisa ditarik) ── */}
              {[
                { field: "margin_kiri", sumbu: "x", tanda: 1, pos: Number(tataLetak.margin_kiri) || 0 },
                { field: "margin_kanan", sumbu: "x", tanda: -1, pos: 210 - (Number(tataLetak.margin_kanan) || 0) },
                { field: "margin_atas", sumbu: "y", tanda: 1, pos: Number(tataLetak.margin_atas) || 0 },
                { field: "margin_bawah", sumbu: "y", tanda: -1, pos: 297 - (Number(tataLetak.margin_bawah) || 0) },
              ].map((m) => (
                <div
                  key={m.field}
                  title={`${LABEL_FIELD[m.field]} — tarik untuk mengubah`}
                  onPointerDown={(e) => mulaiGeserMargin(e, m.field, m.tanda, m.sumbu)}
                  className={`absolute transition-colors ${
                    terpilih === m.field ? "bg-[#00A5EC]/70" : "bg-[#004F9F]/20 hover:bg-[#004F9F]/50"
                  }`}
                  style={
                    m.sumbu === "x"
                      ? { left: kePx(m.pos) - 3, top: 0, width: 6, height: "100%", cursor: "ew-resize" }
                      : { top: kePx(m.pos) - 3, left: 0, height: 6, width: "100%", cursor: "ns-resize" }
                  }
                />
              ))}

              {/* ── Kotak tiap bagian surat ── */}
              {blokList.map((blok) => {
                const geser = bayangan?.id === blok.id ? bayangan : null;
                const bisaGeser = Boolean(blok.sumbu_x || blok.sumbu_y);
                return (
                  <div
                    key={blok.id}
                    onPointerDown={(e) => mulaiGeserBlok(e, blok, false)}
                    title={
                      bisaGeser
                        ? `${blok.label} — geser untuk menata`
                        : `${blok.label} — posisinya mengikuti alur teks`
                    }
                    className={`group absolute rounded-[3px] border border-dashed transition-colors ${warnaKotak(blok)}`}
                    style={{
                      left: kePx(blok.x) + (geser?.dx || 0),
                      top: kePx(blok.y) + (geser?.dy || 0),
                      width: Math.max(6, kePx(blok.w) + (geser?.dw || 0)),
                      height: Math.max(6, kePx(blok.h)),
                      cursor: bisaGeser ? "move" : blok.sumbu_x ? "ew-resize" : "default",
                    }}
                  >
                    <span
                      className={`pointer-events-none absolute -top-[15px] left-0 whitespace-nowrap rounded px-1 py-[1px] text-[8.5px] font-bold shadow-sm transition-opacity ${
                        terpilih === blok.id
                          ? "bg-[#004F9F] text-white opacity-100"
                          : "bg-white/90 text-[#004F9F] opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {blok.label}
                    </span>

                    {blok.sumbu_w && (
                      <span
                        onPointerDown={(e) => mulaiGeserBlok(e, blok, true)}
                        title={`${LABEL_FIELD[blok.sumbu_w] || blok.sumbu_w} — tarik untuk mengubah lebar`}
                        className="absolute -right-[5px] top-1/2 h-3.5 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white bg-[#004F9F] opacity-0 shadow transition-opacity group-hover:opacity-100"
                        style={{ opacity: terpilih === blok.id ? 1 : undefined }}
                      />
                    )}
                  </div>
                );
              })}

              {/* ── Garis bantu saat menggeser ── */}
              {garis.x !== null && (
                <div className="pointer-events-none absolute top-0 h-full w-px bg-[#F43F5E]" style={{ left: kePx(garis.x) }} />
              )}
              {garis.y !== null && (
                <div className="pointer-events-none absolute left-0 w-full border-t border-[#F43F5E]" style={{ top: kePx(garis.y) }} />
              )}

              {/* ── Lapisan status ── */}
              {(memuat || !pratinjauUrl || galat || !terender) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-white/70 backdrop-blur-[1px]">
                  {galat && !memuat ? (
                    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                        <FileText className="h-7 w-7" />
                      </span>
                      <span className="text-xs font-bold text-rose-600">Pratinjau gagal dirender</span>
                      <span className="text-[10.5px] leading-relaxed text-slate-500">{galat}</span>
                    </div>
                  ) : memuat || (pratinjauUrl && !terender) ? (
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 border-t-[#004F9F]" />
                      <span className="text-xs font-bold">Menyusun ulang pratinjau...</span>
                    </div>
                  ) : (
                    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FileText className="h-7 w-7" />
                      </span>
                      <span className="text-xs font-bold text-slate-600">PDF belum tersedia</span>
                      <span className="text-[10.5px] leading-relaxed text-slate-400">
                        Isi nama template lalu simpan, pratinjau langsung muncul di sini.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Petunjuk nilai saat menggeser (menempel di area, bukan di kertas) ── */}
      {petunjuk && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0B1442]/90 px-3 py-1 text-[10.5px] font-bold text-white shadow-lg">
          {petunjuk}
        </div>
      )}

      {/* ── Kendali zoom ── */}
      <div
        className={`absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-xl border p-1 shadow-lg backdrop-blur ${
          isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white/95"
        }`}
      >
        <button
          type="button"
          title="Perkecil (Ctrl + -)"
          onClick={() => ubahZoom((z) => z / FAKTOR_ZOOM)}
          disabled={zoom <= ZOOM_MIN + 0.001}
          className={clsTombolZoom}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Kembalikan ke sesuai layar (Ctrl + 0)"
          onClick={() => ubahZoom(1)}
          className={`min-w-[46px] cursor-pointer rounded-lg px-1 text-[10.5px] font-black tabular-nums transition-colors ${
            isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#0B1442] hover:bg-slate-100"
          }`}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          title="Perbesar (Ctrl + +)"
          onClick={() => ubahZoom((z) => z * FAKTOR_ZOOM)}
          disabled={zoom >= ZOOM_MAKS - 0.001}
          className={clsTombolZoom}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <span className={`mx-0.5 h-4 w-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
        <button
          type="button"
          title="Sesuai layar"
          onClick={() => ubahZoom(1)}
          className={clsTombolZoom}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {ukuran.w > 0 && pratinjauUrl && !memuat && blokList.length === 0 && (
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold shadow ${isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-500"}`}>
          <Move className="h-3 w-3" /> Peta blok belum termuat, coba segarkan pratinjau
        </div>
      )}
    </div>
  );
};

export default PratinjauInteraktifSurat;