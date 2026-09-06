import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import { SORT_OPTIONS } from "./rekapNilaiConstants";

export const RekapNilaiSortDropdown = ({ sortBy, setSortBy, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const activeLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label || "Urutkan";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
          open
            ? isDark
              ? "border-[#00A5EC]/50 bg-white/10 text-[#00A5EC]"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]"
            : isDark
            ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            open ? "rotate-180" : "group-hover:-rotate-12"
          }`}
        />
        Urutkan: <span className={isDark ? "text-slate-100" : "text-[#0B1442]"}>{activeLabel}</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 top-11 z-20 w-52 rounded-xl border shadow-xl overflow-hidden animate-[fadeslide_0.15s_ease-out] ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
          }`}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setSortBy(opt.key);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                sortBy === opt.key
                  ? isDark
                    ? "bg-[#00A5EC]/15 text-[#00A5EC] font-bold"
                    : "bg-blue-50 text-[#004F9F] font-bold"
                  : isDark
                  ? "text-slate-300 hover:bg-white/5"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{opt.label}</span>
              {sortBy === opt.key && <Check className="w-3.5 h-3.5 shrink-0 text-[#00A5EC]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RekapNilaiSortDropdown;
