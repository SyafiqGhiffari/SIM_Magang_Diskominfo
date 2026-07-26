import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Check } from "lucide-react";
import { PRESENSI_SORT_OPTS } from "../../../../constants/presensiStatus";

const PresensiSortDropdown = ({ sortBy, setSortBy, options = PRESENSI_SORT_OPTS }) => {
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
        onClick={handleToggle}
        className={`group inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
          open ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : "group-hover:-rotate-12"}`} />
        Urutkan: <span className="text-[#0B1442]">{activeLabel}</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: position.top, left: position.left, width: menuWidth, zIndex: 9999 }}
            className="rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-[fadeslide_0.15s_ease-out]"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setOpen(false); }}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                {opt.label}
                {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#004F9F]" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default PresensiSortDropdown;