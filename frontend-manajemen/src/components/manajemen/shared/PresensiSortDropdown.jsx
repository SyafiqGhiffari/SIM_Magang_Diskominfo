import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Check } from "lucide-react";
import { PRESENSI_SORT_OPTS } from "../../../constants/presensiStatus";

const PresensiSortDropdown = ({ sortBy, setSortBy, options = PRESENSI_SORT_OPTS, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const menuWidth = 228;

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
  };

  const handleToggle = () => {
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
    const handleReposition = () => calculatePosition();
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  const activeLabel = options.find((o) => o.value === sortBy)?.label || "Urutkan";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`group inline-flex h-[38px] sm:h-[42px] shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 text-[11px] sm:text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          open
            ? isDark
              ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 text-[#00A5EC]"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]"
            : isDark
              ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown className={`w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-300 ${open ? "rotate-180" : "group-hover:-rotate-12"}`} />
        <span>Urutkan:</span>
        <span className={`font-bold sm:font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{activeLabel}</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: position.top, left: position.left, width: menuWidth, zIndex: 9999 }}
            className={`rounded-xl border shadow-2xl overflow-hidden animate-[fadeslide_0.15s_ease-out] ${
              isDark ? "border-white/10 bg-[#161b22] text-slate-200" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {options.map((opt) => {
              const isSelected = sortBy === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-[#00A5EC]/15 text-[#00A5EC] font-bold"
                        : "bg-blue-50/90 text-[#004F9F] font-bold"
                      : isDark
                        ? "text-slate-300 hover:bg-white/5 hover:text-slate-100 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <span className={isSelected ? (isDark ? "text-[#00A5EC]" : "text-[#004F9F]") : ""}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`}
                      strokeWidth={2.8}
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

export default PresensiSortDropdown;
