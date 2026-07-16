import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, ShieldCheck, Lock } from "lucide-react";

const ActionsDropdown = ({ onReview, onVerifikasi, verifikasiDisabled }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 224;
    setPosition({
      top: rect.bottom + window.scrollY + 8,
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
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        handleCloseAnimated();
      }
    };
    const handleScroll = () => handleCloseAnimated();

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleAction = (fn) => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      fn();
    }, 150);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
          open ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F] rotate-90" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <MoreVertical className="w-4 h-4 transition-transform duration-300" />
      </button>

      {open &&
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
            className={`w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200 ${
              visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"
            }`}
          >
            <button
              onClick={() => handleAction(onReview)}
              className="group/item flex w-full items-center gap-3 px-4 py-3 text-left bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(10px)",
                transition: "opacity 200ms ease 0ms, transform 200ms ease 0ms, background-color 200ms ease",
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#004F9F] transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6">
                <Eye className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0B1442]">Tinjau</p>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">Lihat detail lengkap</p>
              </div>
            </button>

            <div className="border-t border-slate-100" />

            <button
              onClick={() => !verifikasiDisabled && handleAction(onVerifikasi)}
              disabled={verifikasiDisabled}
              title={verifikasiDisabled ? "Setujui semua berkas di menu Tinjau terlebih dahulu" : ""}
              className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                verifikasiDisabled
                  ? "bg-slate-50 cursor-not-allowed"
                  : "bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer"
              }`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(10px)",
                transition: "opacity 200ms ease 40ms, transform 200ms ease 40ms, background-color 200ms ease",
              }}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                verifikasiDisabled
                  ? "bg-slate-200 text-slate-400"
                  : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
              }`}>
                {verifikasiDisabled ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${verifikasiDisabled ? "text-slate-400" : "text-emerald-700"}`}>Verifikasi</p>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                  {verifikasiDisabled ? "Selesaikan tinjauan berkas dulu" : "Proses status pendaftaran"}
                </p>
              </div>
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default ActionsDropdown;