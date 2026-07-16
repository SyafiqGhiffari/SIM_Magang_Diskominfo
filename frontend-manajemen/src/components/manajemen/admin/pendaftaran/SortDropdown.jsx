import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";

const sortOptions = [
  { key: "terbaru", label: "Terbaru Diajukan" },
  { key: "terlama", label: "Terlama Diajukan" },
  { key: "nama_az", label: "Nama (A-Z)" },
  { key: "nama_za", label: "Nama (Z-A)" },
];

const SortDropdown = ({ sortBy, setSortBy }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const activeLabel = sortOptions.find((o) => o.key === sortBy)?.label || "Urutkan";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
            open ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : "group-hover:-rotate-12"}`} />
        Urutkan: <span className="text-[#0B1442]">{activeLabel}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-20 w-52 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-[fadeslide_0.15s_ease-out]">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setSortBy(opt.key); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              {opt.label}
              {sortBy === opt.key && <Check className="w-3.5 h-3.5 text-[#004F9F]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;