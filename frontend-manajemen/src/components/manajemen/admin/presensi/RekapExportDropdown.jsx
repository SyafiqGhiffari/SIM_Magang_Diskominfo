import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Table2, LayoutGrid } from "lucide-react";

// Ikon dokumen kustom — ukuran & gaya sama dengan ExportDropdown halaman Data Presensi
const FileIcon = ({ badge, color, bgColor }) => (
  <svg viewBox="0 0 40 48" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
    <path
      d="M4 4C4 1.79086 5.79086 0 8 0H24L36 12V44C36 46.2091 34.2091 48 32 48H8C5.79086 48 4 46.2091 4 44V4Z"
      fill={bgColor}
    />
    <path d="M24 0L36 12H26C24.8954 12 24 11.1046 24 10V0Z" fill="white" fillOpacity="0.35" />
    <rect x="4" y="30" width="28" height="14" rx="2" fill={color} />
    <text x="18" y="40.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">
      {badge}
    </text>
  </svg>
);

/**
 * Dropdown ekspor rekap presensi.
 * Format Excel & CSV otomatis mengikuti tampilan aktif:
 *  - view "tabel"   -> rekap per peserta
 *  - view "matriks" -> matriks peserta x tanggal
 */
const RekapExportDropdown = ({ onSelect, disabled, view = "tabel", isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const menuWidth = 288;
  const isMatriks = view === "matriks";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const konteks = isMatriks
    ? { nama: "Matriks harian", ket: "peserta × tanggal", Icon: LayoutGrid, prefix: "matriks" }
    : { nama: "Rekap per peserta", ket: "hadir, izin, alfa & persentase", Icon: Table2, prefix: "rekap" };

  const OPSI = [
    {
      key: "pdf",
      label: "PDF (.pdf)",
      desc: "Siap cetak & tanda tangan",
      icon: <FileIcon badge="PDF" color="#b91c1c" bgColor="#fee2e2" />,
    },
    {
      key: `${konteks.prefix}_excel`,
      label: "Excel (.xlsx)",
      desc: `Cocok untuk diolah kembali`,
      icon: <FileIcon badge="XLS" color="#15803d" bgColor="#dcfce7" />,
    },
    {
      key: `${konteks.prefix}_csv`,
      label: "CSV (.csv)",
      desc: "Ringan, kompatibel semua sistem",
      icon: <FileIcon badge="CSV" color="#1d4ed8" bgColor="#dbeafe" />,
    },
  ];

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + window.scrollY + 8;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = rect.top + window.scrollY - menuHeight - 8;
    }

    setPosition({
      top: top,
      left: Math.max(12, rect.right + window.scrollX - menuWidth),
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      calculatePosition();
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

  const handleAction = (key) => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      onSelect(key);
    }, 150);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
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

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled}
        className={`group inline-flex h-7.5 sm:h-[42px] shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-2.5 sm:px-4 text-[10.5px] sm:text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
          open
            ? isDark
              ? "border-emerald-500/40 bg-emerald-500/[0.07] text-[#34d399]"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
            : isDark
              ? "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:text-[#34d399]"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <Download className={`w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-300 ${open ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`} />
        <span className="inline sm:hidden">Ekspor</span>
        <span className="hidden sm:inline">Ekspor Laporan</span>
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
              {/* Drawer */}
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

                <div className="mb-2.5">
                  <h4 className={`text-center text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Pilihan Format Ekspor
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {OPSI.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => handleAction(o.key)}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                        isDark
                          ? "bg-[#1c2333] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <div className="shrink-0 transition-transform duration-200 group-hover/item:scale-110">
                        {o.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold transition-colors ${
                          isDark ? "text-slate-200 group-hover/item:text-[#34d399]" : "text-[#0B1442] group-hover/item:text-emerald-700"
                        }`}>
                          {o.label}
                        </p>
                        <p className="text-[9px] text-slate-400">{o.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )
        ) : (
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                width: menuWidth,
                zIndex: 9999,
                transformOrigin: "top right",
              }}
              className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-200 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              } ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"}`}
            >
              <div className="px-4 pt-3.5 pb-2">
                <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                  Pilih Format
                </p>
              </div>

              {OPSI.map((o) => (
                <button
                  key={o.key}
                  onClick={() => handleAction(o.key)}
                  className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
                    isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-3">
                    {o.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold transition-colors duration-200 ${
                      isDark ? "text-slate-200 group-hover/item:text-[#34d399]" : "text-slate-700 group-hover/item:text-[#0B1442]"
                    }`}>
                      {o.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{o.desc}</p>
                  </div>
                </button>
              ))}

              <div className="h-1.5" />
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default RekapExportDropdown;