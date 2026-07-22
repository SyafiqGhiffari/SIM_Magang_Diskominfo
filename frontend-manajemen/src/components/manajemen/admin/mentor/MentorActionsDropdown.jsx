import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const MentorActionsDropdown = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 208;
    setPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right + window.scrollX - menuWidth });
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
      if (buttonRef.current && !buttonRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseAnimated();
      }
    };
    const handleScroll = () => calculatePosition();
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
    setTimeout(() => { setOpen(false); fn(); }, 150);
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

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "absolute", top: position.top, left: position.left, zIndex: 9999, transformOrigin: "top right" }}
          className={`w-52 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200 ${
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"
          }`}
        >
          <button
            onClick={() => handleAction(onEdit)}
            className="group/item flex w-full items-center gap-3 px-4 py-3 text-left bg-blue-50/40 hover:bg-blue-50/70 transition-colors duration-200 cursor-pointer"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#004F9F] transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6">
              <Pencil className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0B1442]">Edit Mentor</p>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">Ubah data dan penugasan</p>
            </div>
          </button>

          <div className="border-t border-slate-100" />

          <div className="border-t border-slate-100" />
          <button onClick={() => handleAction(onDelete)} className="group/item flex w-full items-center gap-3 px-4 py-3 text-left bg-red-50/40 hover:bg-red-50/70 transition-colors duration-200 cursor-pointer">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6">
              <Trash2 className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-700">Hapus Mentor</p>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">Hapus permanen dari sistem</p>
            </div>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

export default MentorActionsDropdown;