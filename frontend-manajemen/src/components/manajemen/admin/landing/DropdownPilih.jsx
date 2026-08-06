import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

const TINGGI_OPSI = 48; // perkiraan tinggi satu opsi (px)
const PADDING_PANEL = 12;
const JARAK = 6;

/**
 * Dropdown kustom pengganti <select> bawaan browser.
 *
 * Panel dirender lewat portal ke <body> supaya TIDAK terpotong oleh
 * kartu induk yang memakai `overflow-hidden`.
 *
 * props:
 *  - nilai        : key opsi yang sedang terpilih
 *  - opsi         : [{ key, label, ket?, ikon? }]
 *  - onUbah(key)  : dipanggil saat opsi dipilih
 *  - isDark       : mode gelap
 *  - lebar        : kelas lebar tombol (default "w-56")
 *  - lebarPanel   : lebar minimum panel dalam px (default 224)
 *  - arah         : "otomatis" | "bawah" | "atas"
 */
const DropdownPilih = ({
  nilai,
  opsi = [],
  onUbah,
  isDark,
  placeholder = "Pilih…",
  lebar = "w-56",
  lebarPanel = 224,
  arah = "otomatis",
}) => {
  const [buka, setBuka] = useState(false);
  const [gaya, setGaya] = useState(null);
  const tombolRef = useRef(null);
  const panelRef = useRef(null);

  const terpilih = opsi.find((o) => o.key === nilai);
  const IkonTerpilih = terpilih?.ikon;

  const hitungPosisi = useCallback(() => {
    const el = tombolRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const tinggiPanel = opsi.length * TINGGI_OPSI + PADDING_PANEL;
    const ruangBawah = window.innerHeight - r.bottom;
    const ruangAtas = r.top;

    const keAtas =
      arah === "atas" ||
      (arah === "otomatis" && ruangBawah < tinggiPanel + JARAK && ruangAtas > ruangBawah);

    const lebarAkhir = Math.max(r.width, lebarPanel);
    // jaga agar panel tidak keluar dari tepi kanan layar
    const kiri = Math.min(r.left, window.innerWidth - lebarAkhir - 12);

    setGaya({
      position: "fixed",
      left: Math.max(12, kiri),
      width: lebarAkhir,
      maxHeight: Math.max(160, (keAtas ? ruangAtas : ruangBawah) - 16),
      ...(keAtas
        ? { bottom: window.innerHeight - r.top + JARAK }
        : { top: r.bottom + JARAK }),
      zIndex: 9999,
    });
  }, [arah, lebarPanel, opsi.length]);

  // hitung posisi sebelum panel tampil agar tidak "melompat"
  useLayoutEffect(() => {
    if (buka) hitungPosisi();
  }, [buka, hitungPosisi]);

  useEffect(() => {
    if (!buka) return undefined;

    const klikLuar = (e) => {
      if (
        !tombolRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setBuka(false);
      }
    };
    const tekanEsc = (e) => {
      if (e.key === "Escape") setBuka(false);
    };
    const perbarui = () => hitungPosisi();

    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    // capture:true agar ikut menangkap scroll pada kontainer bagian dalam
    window.addEventListener("scroll", perbarui, true);
    window.addEventListener("resize", perbarui);

    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
      window.removeEventListener("scroll", perbarui, true);
      window.removeEventListener("resize", perbarui);
    };
  }, [buka, hitungPosisi]);

  const panel =
    buka && gaya
      ? createPortal(
          <div
            ref={panelRef}
            style={gaya}
            className={`overflow-y-auto overflow-x-hidden rounded-2xl border p-1.5 shadow-2xl animate-[fadeslide_0.18s_ease-out] ${
              isDark
                ? "border-white/10 bg-[#111c33] shadow-black/50"
                : "border-slate-200/80 bg-white shadow-slate-900/15"
            }`}
          >
            {opsi.map((o) => {
              const ini = o.key === nilai;
              const IkonOpsi = o.ikon;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    onUbah(o.key);
                    setBuka(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    ini
                      ? isDark
                        ? "bg-[#00A5EC]/15 text-[#7DD3FC]"
                        : "bg-gradient-to-r from-[#00A5EC]/10 to-transparent text-[#004F9F]"
                      : isDark
                      ? "text-slate-300 hover:bg-white/[0.06]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {IkonOpsi && <IkonOpsi className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">{o.label}</span>
                    {o.ket && (
                      <span className="mt-0.5 block truncate text-[10.5px] font-medium text-slate-400">
                        {o.ket}
                      </span>
                    )}
                  </span>
                  {ini && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3.2} />}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${lebar}`}>
      <button
        ref={tombolRef}
        type="button"
        onClick={() => setBuka((b) => !b)}
        className={`group/dd flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold outline-none transition-all duration-200 ${
          buka
            ? isDark
              ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 ring-4 ring-[#00A5EC]/20"
              : "border-[#004F9F] bg-white text-[#0B1442] ring-4 ring-[#00A5EC]/15"
            : isDark
            ? "border-white/10 bg-white/5 text-slate-200 hover:border-white/25"
            : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white hover:shadow-sm"
        }`}
      >
        {IkonTerpilih && (
          <IkonTerpilih className="h-3.5 w-3.5 shrink-0 text-[#00A5EC]" strokeWidth={2.6} />
        )}
        <span className={`flex-1 truncate ${terpilih ? "" : "text-slate-400"}`}>
          {terpilih?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${
            buka ? "rotate-180 text-[#00A5EC]" : ""
          }`}
          strokeWidth={3}
        />
      </button>

      {panel}
    </div>
  );
};

export default DropdownPilih;