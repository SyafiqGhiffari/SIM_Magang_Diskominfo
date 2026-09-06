import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const MentorActionsDropdown = ({ onEdit, onDelete, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 216;
    const menuHeight = 120;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + window.scrollY + 8;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = rect.top + window.scrollY - menuHeight - 8;
    }

    setPosition({
      top: top,
      left: rect.right + window.scrollX - menuWidth,
    });
  };

  const handleToggle = (e) => {
    e?.stopPropagation();
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

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
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

  const handleAction = (fn) => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      fn?.();
    }, 150);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
          open
            ? isDark
              ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 text-[#00A5EC] rotate-90"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F] rotate-90"
            : isDark
              ? "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5"
              : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        }`}
        title="Aksi Mentor"
      >
        <MoreVertical className="w-4 h-4 transition-transform duration-300" />
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
              {/* Drawer Sheet Mobile */}
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
                    Pilihan Aksi
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleAction(onEdit)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#231c33] border-violet-500/10 hover:border-violet-500/30 hover:bg-violet-500/[0.05] hover:shadow-lg hover:shadow-violet-500/5"
                        : "bg-violet-50/20 border-violet-100 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isDark
                          ? "bg-violet-500/15 text-violet-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-violet-500/25"
                          : "bg-violet-100 text-violet-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold transition-colors ${isDark ? "text-violet-400" : "text-violet-700"}`}>
                        Edit Mentor
                      </p>
                      <p className="text-[9px] text-slate-400">Ubah data mentor dan penugasan bidang</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(onDelete)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#2d1c24] border-red-500/10 hover:border-red-500/30 hover:bg-red-500/[0.05] hover:shadow-lg hover:shadow-red-500/5"
                        : "bg-red-50/20 border-red-100 hover:border-red-300 hover:bg-red-50/50 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isDark
                          ? "bg-red-500/15 text-red-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-red-500/25"
                          : "bg-red-100 text-red-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold transition-colors ${isDark ? "text-red-400" : "text-red-600"}`}>
                        Hapus Mentor
                      </p>
                      <p className="text-[9px] text-slate-400">Hapus mentor permanen dari sistem</p>
                    </div>
                  </button>
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
                zIndex: 9999,
                transformOrigin: "top right",
              }}
              className={`w-52 rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 ${
                isDark
                  ? "border-white/10 bg-[#161b22] text-slate-200"
                  : "border-slate-200 bg-white text-slate-700"
              } ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"}`}
            >
              <button
                onClick={() => handleAction(onEdit)}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer ${
                  isDark ? "bg-violet-500/[0.04] hover:bg-violet-500/[0.12]" : "bg-violet-50/40 hover:bg-violet-50/70"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                    isDark ? "bg-violet-900/30 text-violet-400" : "bg-violet-100 text-violet-600"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Edit Mentor</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">Ubah data & bidang</p>
                </div>
              </button>

              <div className={`border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

              <button
                onClick={() => handleAction(onDelete)}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer ${
                  isDark ? "bg-red-500/[0.04] hover:bg-red-500/[0.12]" : "bg-red-50/40 hover:bg-red-50/70"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                    isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${isDark ? "text-red-400" : "text-red-700"}`}>Hapus Mentor</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">Hapus permanen dari sistem</p>
                </div>
              </button>
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default MentorActionsDropdown;