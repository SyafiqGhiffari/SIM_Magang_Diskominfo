import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

// Ikon dokumen kustom bergaya "file explorer" dengan badge format — mendekati ikon asli tanpa memakai logo bermerek
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

const ExportDropdown = ({ onExport }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          open ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <Download className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`} />
        Ekspor Data
      </button>

      <div
        className={`absolute right-0 top-11 z-30 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-250 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pilih Format</p>
        </div>
        {formats.map((f, i) => (
          <button
            key={f.key}
            onClick={() => { onExport(f.key); setOpen(false); }}
            className="group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50 cursor-pointer"
            style={{
              transitionDelay: open ? `${i * 40}ms` : "0ms",
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(8px)",
            }}
          >
            <div className="transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-3">
              {f.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 transition-colors duration-200 group-hover/item:text-[#0B1442]">{f.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExportDropdown;