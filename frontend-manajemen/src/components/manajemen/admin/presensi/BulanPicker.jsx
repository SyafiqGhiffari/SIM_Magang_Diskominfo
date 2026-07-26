import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Pemilih bulan berbahasa Indonesia.
 * value & onChange memakai format "YYYY-MM", max membatasi bulan terjauh.
 */
const BulanPicker = ({ value, onChange, max }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuWidth = 272;

  const [tahunNilai, bulanNilai] = (value || "").split("-").map(Number);
  const [tahunTampil, setTahunTampil] = useState(tahunNilai || new Date().getFullYear());

  const hitungPosisi = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 8,
      left: Math.max(12, Math.min(r.left + window.scrollX, window.innerWidth - menuWidth - 12)),
    });
  };

  const toggle = () => {
    if (open) return setOpen(false);
    setTahunTampil(tahunNilai || new Date().getFullYear());
    hitungPosisi();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    const reposisi = () => hitungPosisi();
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", reposisi, true);
    window.addEventListener("resize", reposisi);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", reposisi, true);
      window.removeEventListener("resize", reposisi);
    };
  }, [open]);

  const pilih = (idx) => {
    const nilaiBaru = `${tahunTampil}-${String(idx + 1).padStart(2, "0")}`;
    if (max && nilaiBaru > max) return;
    setOpen(false);
    onChange(nilaiBaru);
  };

  const labelAktif = bulanNilai
    ? `${BULAN_PANJANG[bulanNilai - 1]} ${tahunNilai}`
    : "Pilih bulan";

  const maxTahun = max ? Number(max.split("-")[0]) : 9999;

  return (
    <>
      {/* Seluruh area tombol bisa diklik, bukan hanya ikonnya */}
      <button
        ref={btnRef}
        onClick={toggle}
        title="Pilih bulan rekap"
        className={`group inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
          open ? "bg-slate-100 text-[#004F9F]" : "text-[#0B1442] hover:bg-slate-100 hover:text-[#004F9F]"
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-[#004F9F]" />
        <span className="whitespace-nowrap">{labelAktif}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: pos.top, left: pos.left, width: menuWidth, zIndex: 9999 }}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-[fadeslide_0.15s_ease-out]"
          >
            {/* Navigasi tahun */}
            <div className="mb-2.5 flex items-center justify-between">
              <button
                onClick={() => setTahunTampil((t) => t - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-black tracking-tight text-[#0B1442]">{tahunTampil}</span>
              <button
                onClick={() => setTahunTampil((t) => Math.min(t + 1, maxTahun))}
                disabled={tahunTampil >= maxTahun}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid 12 bulan */}
            <div className="grid grid-cols-3 gap-1.5">
              {BULAN_SINGKAT.map((nama, idx) => {
                const nilai = `${tahunTampil}-${String(idx + 1).padStart(2, "0")}`;
                const terpilih = nilai === value;
                const nonaktif = max ? nilai > max : false;
                return (
                  <button
                    key={nama}
                    onClick={() => pilih(idx)}
                    disabled={nonaktif}
                    title={`${BULAN_PANJANG[idx]} ${tahunTampil}`}
                    className={`rounded-xl py-2 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      terpilih
                        ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                        : nonaktif
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                  >
                    {nama}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default BulanPicker;