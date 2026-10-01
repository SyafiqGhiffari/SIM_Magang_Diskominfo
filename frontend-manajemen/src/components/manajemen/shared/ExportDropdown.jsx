import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";

// Ikon dokumen kustom bergaya "file explorer" dengan badge format — mendekati ikon asli tanpa memakai logo bermerek
const FileIcon = ({ badge, color, bgColor }) => (
  <svg viewBox="0 0 40 48" className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
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

const formats = [
  {
    key: "excel",
    label: "Excel (.xlsx)",
    desc: "Cocok untuk diolah kembali",
    icon: <FileIcon badge="XLS" color="#15803d" bgColor="#dcfce7" />,
  },
  {
    key: "csv",
    label: "CSV (.csv)",
    desc: "Ringan, kompatibel semua sistem",
    icon: <FileIcon badge="CSV" color="#1d4ed8" bgColor="#dbeafe" />,
  },
  {
    key: "pdf",
    label: "PDF (.pdf)",
    desc: "Cocok untuk laporan & cetak",
    icon: <FileIcon badge="PDF" color="#b91c1c" bgColor="#fee2e2" />,
  },
];

export const ExportDropdown = ({ onExport, isDark = false, size = "normal", buttonClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = () => {
    if (!open) {
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
      onExport(key);
    }, 150);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handleCloseAnimated();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className={`group inline-flex ${
          size === "sm"
            ? "h-7.5 sm:h-8 px-2.5 sm:px-3 text-[11px]"
            : "h-7.5 sm:h-[42px] px-2.5 sm:px-4 text-[10.5px] sm:text-xs"
        } shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border font-bold shadow-xs transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          open
            ? isDark
              ? "border-emerald-500/40 bg-emerald-500/[0.07] text-[#34d399]"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
            : isDark
              ? "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:text-[#34d399]"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        } ${buttonClassName}`}
      >
        <Download className={`w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-300 ${open ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`} />
        <span className="inline sm:hidden">Ekspor</span>
        <span className="hidden sm:inline">Ekspor Data</span>
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
                  <h4 className={`text-center text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pilihan Format Ekspor</h4>
                </div>

                <div className="space-y-1.5">
                  {formats.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleAction(f.key)}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                        isDark
                          ? "bg-[#1c2333] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <div className="shrink-0 transition-transform duration-200 group-hover/item:scale-110">
                        {f.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold transition-colors ${
                          isDark ? "text-slate-200 group-hover/item:text-[#34d399]" : "text-[#0B1442] group-hover/item:text-emerald-700"
                        }`}>{f.label}</p>
                        <p className="text-[9px] text-slate-400">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )
        ) : (
          <div
            className={`absolute right-0 ${size === "sm" ? "top-9 sm:top-9.5" : "top-9 sm:top-11"} z-30 w-64 sm:w-72 origin-top-right rounded-xl sm:rounded-2xl border transition-all duration-250 ${
              visible ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
            } ${isDark ? "border-white/10 bg-[#161b22] shadow-2xl" : "border-slate-200 bg-white shadow-xl"}`}
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="px-3 sm:px-4 pt-2.5 sm:pt-3.5 pb-1.5 sm:pb-2">
              <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Pilih Format</p>
            </div>
            {formats.map((f, i) => (
              <button
                key={f.key}
                onClick={() => handleAction(f.key)}
                className={`group/item flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left transition-all duration-200 cursor-pointer ${
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
                style={{
                  transitionDelay: visible ? `${i * 40}ms` : "0ms",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(8px)",
                }}
              >
                <div className="transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-3">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] sm:text-xs font-bold transition-colors duration-200 ${
                    isDark ? "text-slate-300 group-hover/item:text-slate-100" : "text-slate-700 group-hover/item:text-[#0B1442]"
                  }`}>{f.label}</p>
                  <p className={`text-[9px] sm:text-[10px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
    </div>
  );
};

export default ExportDropdown;
