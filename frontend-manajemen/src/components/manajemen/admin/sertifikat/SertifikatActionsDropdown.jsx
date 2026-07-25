import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Send, Eye, Trash2 } from "lucide-react";

const SertifikatActionsDropdown = ({ status, onTerbitkan, onView, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const sudahTerbit = status === "terbit";
  const masihMagang = status === "magang";
  const perluDibuat = status === "perlu";

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
    // Jangan tutup saat scroll — cukup posisikan ulang agar menu tetap menempel di tombolnya
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
            style={{ position: "absolute", top: position.top, left: position.left, zIndex: 9999, transformOrigin: "top right" }}
            className={`w-56 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200 ${
              visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"
            }`}
          >
            {/* 1. Terbitkan Sertifikat → dikirim ke peserta */}
            <button
              onClick={() => perluDibuat && handleAction(onTerbitkan)}
              disabled={!perluDibuat}
              className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                perluDibuat ? "bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer" : "bg-white cursor-not-allowed opacity-60"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                perluDibuat ? "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6" : "bg-slate-100 text-slate-400"
              }`}>
                <Send className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${perluDibuat ? "text-[#0B1442]" : "text-slate-400"}`}>Terbitkan Sertifikat</p>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                  {sudahTerbit ? "Sudah diterbitkan" : masihMagang ? "Peserta masih magang" : "Buat & kirim ke peserta"}
                </p>
              </div>
            </button>

            <div className="border-t border-slate-100" />

            {/* 2. Lihat & Edit Sertifikat */}
            <button
              onClick={() => sudahTerbit && handleAction(onView)}
              disabled={!sudahTerbit}
              className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                sudahTerbit ? "bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer" : "bg-white cursor-not-allowed opacity-60"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                sudahTerbit ? "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6" : "bg-slate-100 text-slate-400"
              }`}>
                <Eye className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${sudahTerbit ? "text-[#0B1442]" : "text-slate-400"}`}>Lihat & Edit Sertifikat</p>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                  {sudahTerbit ? "Tinjau detail & ubah nomor" : "Belum ada sertifikat"}
                </p>
              </div>
            </button>

            <div className="border-t border-slate-100" />

            {/* 3. Hapus Sertifikat */}
            <button
              onClick={() => sudahTerbit && handleAction(onDelete)}
              disabled={!sudahTerbit}
              className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                sudahTerbit ? "bg-red-50/40 hover:bg-red-50/70 cursor-pointer" : "bg-white cursor-not-allowed opacity-60"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                sudahTerbit ? "bg-red-100 text-red-600 group-hover/item:scale-110 group-hover/item:-rotate-6" : "bg-slate-100 text-slate-400"
              }`}>
                <Trash2 className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${sudahTerbit ? "text-red-700" : "text-slate-400"}`}>Hapus Sertifikat</p>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                  {sudahTerbit ? "Hapus permanen dari sistem" : "Belum ada sertifikat"}
                </p>
              </div>
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default SertifikatActionsDropdown;