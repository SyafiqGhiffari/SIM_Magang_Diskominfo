import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Table2, LayoutGrid } from "lucide-react";

// Ikon dokumen kustom — ukuran & gaya sama dengan ExportDropdown halaman Data Presensi
const FileIcon = ({ badge, color, bgColor }) => (
  <svg viewBox="0 0 40 48" className="h-9 w-9 shrink-0">
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
const RekapExportDropdown = ({ onSelect, disabled, view = "tabel" }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const menuWidth = 288; // setara w-72 seperti di halaman Data Presensi
  const isMatriks = view === "matriks";

  // Konteks data yang sedang ditampilkan — dipakai untuk label & key ekspor
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
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: Math.max(12, rect.right + window.scrollX - menuWidth),
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      calculatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleReposition = () => calculatePosition();
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled}
        className={`group inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
          open
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <Download className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`} />
        Ekspor Laporan
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: position.top, left: position.left, width: menuWidth, zIndex: 9999 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-[fadeslide_0.15s_ease-out]"
          >
            <div className="px-4 pt-3.5 pb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pilih Format</p>
            </div>

            {OPSI.map((o, i) => (
              <button
                key={o.key}
                onClick={() => {
                  setOpen(false);
                  onSelect(o.key);
                }}
                className="group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50 cursor-pointer"
                style={{ animation: `fadeslide 0.25s ease-out ${i * 45}ms both` }}
              >
                <div className="transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-3">
                  {o.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 transition-colors duration-200 group-hover/item:text-[#0B1442]">
                    {o.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{o.desc}</p>
                </div>
              </button>
            ))}

            <div className="h-1.5" />
          </div>,
          document.body
        )}
    </>
  );
};

export default RekapExportDropdown;