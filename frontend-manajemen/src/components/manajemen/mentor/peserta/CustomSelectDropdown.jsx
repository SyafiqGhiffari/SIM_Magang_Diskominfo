import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export const CustomSelectDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Pilih opsi...",
  labelPrefix = "",
  icon: IconComponent,
  isDark = false,
  menuWidth = 185,
  fullWidth = false,
  className = "",
  maxMenuHeight = 260,
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const targetWidth = fullWidth ? rect.width : Math.max(rect.width, menuWidth);
    const dropdownLeft = Math.min(
      rect.left + window.scrollX,
      window.innerWidth + window.scrollX - targetWidth - 16
    );
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(16, dropdownLeft),
      minWidth: targetWidth,
    });
  }, [menuWidth, fullWidth]);

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
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => {
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const activeOption = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`group relative ${fullWidth ? "w-full flex" : "inline-flex"} h-9 sm:h-[38px] items-center justify-between gap-2 rounded-xl border px-3 text-xs font-bold transition-colors duration-150 cursor-pointer select-none ${
          open
            ? isDark
              ? "border-[#00A5EC] bg-[#00A5EC]/15 text-sky-300 shadow-md ring-4 ring-[#00A5EC]/20"
              : "border-[#004F9F] bg-blue-50/80 text-[#004F9F] shadow-md ring-4 ring-[#00A5EC]/15"
            : isDark
            ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs"
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeOption?.icon ? (
            <activeOption.icon
              className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 transition-transform duration-300 ${
                open ? "text-[#00A5EC] scale-110" : "text-slate-400 group-hover:text-slate-500"
              }`}
            />
          ) : IconComponent ? (
            <IconComponent
              className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 transition-transform duration-300 ${
                open ? "text-[#00A5EC] scale-110" : "text-slate-400 group-hover:text-slate-500"
              }`}
            />
          ) : null}

          <div className="flex items-center gap-1 truncate text-left">
            {labelPrefix && (
              <span className="text-slate-400 font-normal hidden sm:inline">{labelPrefix}:</span>
            )}
            <span className={`truncate ${!activeOption ? "text-slate-400 font-normal" : ""}`}>
              {activeOption ? activeOption.label : placeholder}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? "rotate-180 text-[#00A5EC]" : "group-hover:translate-y-0.5"
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: fullWidth ? position.minWidth : undefined,
              minWidth: position.minWidth || menuWidth,
              maxHeight: maxMenuHeight,
              zIndex: 99999,
            }}
            className={`w-max max-w-[calc(100vw-32px)] rounded-2xl border p-1.5 shadow-2xl overflow-y-auto backdrop-blur-md transition-all animate-[fadeslide_0.15s_ease-out] ${
              isDark
                ? "border-white/10 bg-[#161b22]/95 text-slate-200 shadow-black/60"
                : "border-slate-200/90 bg-white/95 text-slate-700 shadow-slate-300/50"
            }`}
          >
            <div className="space-y-0.5">
              {options.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Belum ada pilihan tersedia
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected = value === opt.value;
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left ${
                        isSelected
                          ? isDark
                            ? "bg-[#00A5EC]/20 text-[#00A5EC] font-bold shadow-2xs"
                            : "bg-blue-50 text-[#004F9F] font-bold shadow-2xs"
                          : isDark
                          ? "text-slate-300 hover:bg-white/5 hover:text-white font-medium"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {OptIcon && (
                          <OptIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected
                                ? isDark
                                  ? "text-[#00A5EC]"
                                  : "text-[#004F9F]"
                                : "text-slate-400"
                            }`}
                          />
                        )}
                        <span className="truncate">{opt.label}</span>
                      </div>

                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`}
                          strokeWidth={2.8}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CustomSelectDropdown;
