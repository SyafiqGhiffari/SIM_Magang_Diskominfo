import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye } from "lucide-react";

const RekapActionsDropdown = ({ onDetail, isDark = false }) => {
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
    const menuWidth = 208;
    const menuHeight = 90;

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

  const handleToggle = () => {
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
      fn && fn();
    }, 150);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`inline-flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
          open
            ? isDark
              ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 text-[#00A5EC] rotate-90"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F] rotate-90"
            : isDark
              ? "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-slate-200"
              : "border-slate-200 text-slate-400 hover:border-[#004F9F]/30 hover:bg-slate-50 hover:text-[#004F9F]"
        }`}
        title="Menu Aksi"
      >
        <MoreVertical className="w-3.5 h-3.5" />
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
              {/* Drawer Sheet */}
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
                <div className={`mx-auto mb-2.5 h-1 w-10 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <div className="mb-2.5">
                  <h4 className={`text-center text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Aksi Rekap Presensi
                  </h4>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleAction(onDetail)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? "text-sky-300 hover:bg-[#00A5EC]/10"
                        : "text-[#004F9F] hover:bg-blue-50"
                    }`}
                  >
                    <Eye className="w-4 h-4 text-[#00A5EC] shrink-0" />
                    <span>Lihat Riwayat Presensi</span>
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
                width: 208,
                zIndex: 9999,
                transformOrigin: "top right",
              }}
              className={`rounded-xl border shadow-xl overflow-hidden transition-all duration-200 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              } ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"}`}
            >
              <div className="p-1">
                <button
                  onClick={() => handleAction(onDetail)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? "text-slate-200 hover:bg-white/5 hover:text-[#00A5EC]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#004F9F]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#00A5EC] shrink-0" />
                  <span>Lihat Riwayat Presensi</span>
                </button>
              </div>
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default RekapActionsDropdown;
