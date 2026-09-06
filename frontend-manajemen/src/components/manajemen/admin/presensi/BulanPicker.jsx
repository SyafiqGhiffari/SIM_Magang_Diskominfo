import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Pemilih bulan dengan tampilan bottom-sheet drawer di mobile
 * dan floating dropdown di desktop (identik dengan Dropdown Ekspor & Aksi).
 */
const BulanPicker = ({ value, onChange, max, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuWidth = 272;

  const [tahunNilai, bulanNilai] = (value || "").split("-").map(Number);
  const [tahunTampil, setTahunTampil] = useState(tahunNilai || new Date().getFullYear());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hitungPosisi = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;

    let top = r.bottom + window.scrollY + 8;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = r.top + window.scrollY - menuHeight - 8;
    }

    setPos({
      top: top,
      left: Math.max(12, Math.min(r.left + window.scrollX, window.innerWidth - menuWidth - 12)),
    });
  };

  const handleToggle = () => {
    if (!open) {
      setTahunTampil(tahunNilai || new Date().getFullYear());
      hitungPosisi();
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      handleCloseAnimated();
    }
  };

  const handleCloseAnimated = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        handleCloseAnimated();
      }
    };
    const handleScroll = () => {
      if (!isMobile) handleCloseAnimated();
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, isMobile]);

  const pilih = (idx) => {
    const nilaiBaru = `${tahunTampil}-${String(idx + 1).padStart(2, "0")}`;
    if (max && nilaiBaru > max) return;
    handleCloseAnimated();
    onChange(nilaiBaru);
  };

  const labelAktif = bulanNilai
    ? `${BULAN_PANJANG[bulanNilai - 1]} ${tahunNilai}`
    : "Pilih bulan";

  const maxTahun = max ? Number(max.split("-")[0]) : 9999;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Pilih bulan rekap"
        className={`group inline-flex h-7 sm:h-8 items-center gap-1 sm:gap-1.5 rounded-lg px-1.5 sm:px-2.5 text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
          open
            ? isDark
              ? "bg-white/10 text-[#00A5EC]"
              : "bg-slate-100 text-[#004F9F]"
            : isDark
              ? "text-slate-200 hover:bg-white/10 hover:text-[#00A5EC]"
              : "text-[#0B1442] hover:bg-slate-100 hover:text-[#004F9F]"
        }`}
      >
        <CalendarDays className={`w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 transition-colors duration-200 ${isDark ? "text-slate-400 group-hover:text-[#00A5EC]" : "text-slate-400 group-hover:text-[#004F9F]"}`} />
        <span className="whitespace-nowrap">{labelAktif}</span>
      </button>

      {open &&
        (isMobile ? (
          createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[9998] bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
                onClick={handleCloseAnimated}
              />
              {/* Drawer Sheet */}
              <div
                className={`fixed bottom-0 left-0 right-0 z-[9999] rounded-t-3xl border-t px-4 pb-6 pt-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out ${
                  isDark
                    ? "border-white/10 bg-[#161b22] text-slate-200"
                    : "border-slate-100 bg-white text-slate-700"
                }`}
                style={{
                  transform: visible ? "translateY(0)" : "translateY(100%)",
                }}
              >
                {/* Drag Handle Indicator */}
                <div className={`mx-auto mb-2.5 h-1 w-10 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <div className="mb-3 text-center">
                  <h4 className={`text-[9.5px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Pilih Bulan Rekap Presensi
                  </h4>
                </div>

                {/* Navigasi tahun */}
                <div className="mb-3 flex items-center justify-between px-2">
                  <button
                    onClick={() => setTahunTampil((t) => t - 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
                      isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`text-base font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                    {tahunTampil}
                  </span>
                  <button
                    onClick={() => setTahunTampil((t) => Math.min(t + 1, maxTahun))}
                    disabled={tahunTampil >= maxTahun}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid 12 bulan */}
                <div className="grid grid-cols-3 gap-2">
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
                        className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                          terpilih
                            ? "bg-gradient-to-r from-[#0B1442] to-[#00A5EC] text-white shadow-md font-black"
                            : nonaktif
                              ? "text-slate-500/30 cursor-not-allowed"
                              : isDark
                                ? "text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white"
                                : "text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-[#004F9F]"
                        }`}
                      >
                        {BULAN_PANJANG[idx]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>,
            document.body
          )
        ) : (
          createPortal(
            <div
              ref={menuRef}
              style={{ position: "absolute", top: pos.top, left: pos.left, width: menuWidth, zIndex: 9999 }}
              className={`rounded-2xl border p-3 shadow-2xl transition-all duration-200 ${
                isDark ? "border-white/10 bg-[#161b22] text-slate-200" : "border-slate-200 bg-white text-slate-700"
              } ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"}`}
            >
              {/* Navigasi tahun */}
              <div className="mb-2.5 flex items-center justify-between">
                <button
                  onClick={() => setTahunTampil((t) => t - 1)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer ${
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className={`text-sm font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{tahunTampil}</span>
                <button
                  onClick={() => setTahunTampil((t) => Math.min(t + 1, maxTahun))}
                  disabled={tahunTampil >= maxTahun}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
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
                          ? "bg-gradient-to-r from-[#0B1442] to-[#00A5EC] text-white shadow-md font-black"
                          : nonaktif
                            ? "text-slate-500/40 cursor-not-allowed"
                            : isDark
                              ? "text-slate-300 hover:bg-white/10 hover:text-white"
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
          )
        ))}
    </>
  );
};

export default BulanPicker;