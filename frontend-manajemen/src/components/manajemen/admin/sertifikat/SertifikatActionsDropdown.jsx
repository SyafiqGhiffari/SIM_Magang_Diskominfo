import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Send, Eye, Trash2 } from "lucide-react";

const SertifikatActionsDropdown = ({ status, onTerbitkan, onView, onDelete, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const sudahTerbit = status === "terbit";
  const masihMagang = status === "magang";
  const perluDibuat = status === "perlu";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 175;

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
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
          open
            ? isDark
              ? "border-[#00A5EC]/45 bg-[#00A5EC]/10 text-[#00A5EC] rotate-90"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F] rotate-90"
            : isDark
              ? "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5"
              : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        }`}
        title="Aksi Sertifikat"
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
                {/* Drag Handle */}
                <div className={`mx-auto mb-2.5 h-1 w-10 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                <div className="mb-2.5">
                  <h4 className={`text-center text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Pilihan Aksi
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {/* 1. Terbitkan Sertifikat */}
                  <button
                    onClick={() => perluDibuat && handleAction(onTerbitkan)}
                    disabled={!perluDibuat}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border ${
                      perluDibuat
                        ? isDark
                          ? "bg-[#162923] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:scale-[1.015] active:scale-95 cursor-pointer"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.015] active:scale-95 cursor-pointer"
                        : isDark
                          ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        perluDibuat
                          ? isDark
                            ? "bg-emerald-500/15 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-emerald-500/25"
                            : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : isDark
                            ? "bg-white/5 text-slate-500"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold transition-colors ${
                        perluDibuat
                          ? isDark
                            ? "text-emerald-400 group-hover/item:text-emerald-300"
                            : "text-[#0B1442] group-hover/item:text-emerald-700"
                          : "text-slate-400"
                      }`}>
                        Terbitkan Sertifikat
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {sudahTerbit ? "Sudah diterbitkan" : masihMagang ? "Peserta masih aktif magang" : "Buat nomor & kirim ke peserta"}
                      </p>
                    </div>
                  </button>

                  {/* 2. Lihat & Edit Sertifikat */}
                  <button
                    onClick={() => sudahTerbit && handleAction(onView)}
                    disabled={!sudahTerbit}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border ${
                      sudahTerbit
                        ? isDark
                          ? "bg-[#1c2333] border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/[0.05] hover:scale-[1.015] active:scale-95 cursor-pointer"
                          : "bg-blue-50/20 border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.015] active:scale-95 cursor-pointer"
                        : isDark
                          ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        sudahTerbit
                          ? isDark
                            ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-blue-500/25"
                            : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : isDark
                            ? "bg-white/5 text-slate-500"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold transition-colors ${
                        sudahTerbit
                          ? isDark
                            ? "text-slate-200 group-hover/item:text-[#00A5EC]"
                            : "text-[#0B1442] group-hover/item:text-[#004F9F]"
                          : "text-slate-400"
                      }`}>
                        Lihat & Edit Sertifikat
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {sudahTerbit ? "Tinjau detail & ubah nomor sertifikat" : "Sertifikat belum diterbitkan"}
                      </p>
                    </div>
                  </button>

                  {/* 3. Hapus Sertifikat */}
                  <button
                    onClick={() => sudahTerbit && handleAction(onDelete)}
                    disabled={!sudahTerbit}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border ${
                      sudahTerbit
                        ? isDark
                          ? "bg-[#2d1c24] border-red-500/10 hover:border-red-500/30 hover:bg-red-500/[0.05] hover:scale-[1.015] active:scale-95 cursor-pointer"
                          : "bg-red-50/20 border-red-100 hover:border-red-300 hover:bg-red-50/50 hover:scale-[1.015] active:scale-95 cursor-pointer"
                        : isDark
                          ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        sudahTerbit
                          ? isDark
                            ? "bg-red-500/15 text-red-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-red-500/25"
                            : "bg-red-100 text-red-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : isDark
                            ? "bg-white/5 text-slate-500"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold transition-colors ${
                        sudahTerbit
                          ? isDark
                            ? "text-red-400"
                            : "text-red-600"
                          : "text-slate-400"
                      }`}>
                        Hapus Sertifikat
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {sudahTerbit ? "Hapus nomor & batalkan terbit sertifikat" : "Belum ada data untuk dihapus"}
                      </p>
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
              className={`w-56 rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 ${
                isDark
                  ? "border-white/10 bg-[#161b22] text-slate-200"
                  : "border-slate-200 bg-white text-slate-700"
              } ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"}`}
            >
              {/* 1. Terbitkan Sertifikat */}
              <button
                onClick={() => perluDibuat && handleAction(onTerbitkan)}
                disabled={!perluDibuat}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  perluDibuat
                    ? isDark
                      ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.12] cursor-pointer"
                      : "bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    perluDibuat
                      ? isDark
                        ? "bg-emerald-500/20 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                        : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      : isDark
                        ? "bg-white/5 text-slate-500"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${
                    perluDibuat
                      ? isDark ? "text-emerald-400" : "text-[#0B1442]"
                      : "text-slate-400"
                  }`}>
                    Terbitkan Sertifikat
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {sudahTerbit ? "Sudah diterbitkan" : masihMagang ? "Peserta masih magang" : "Buat & kirim ke peserta"}
                  </p>
                </div>
              </button>

              <div className={`border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

              {/* 2. Lihat & Edit Sertifikat */}
              <button
                onClick={() => sudahTerbit && handleAction(onView)}
                disabled={!sudahTerbit}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  sudahTerbit
                    ? isDark
                      ? "bg-blue-500/[0.04] hover:bg-blue-500/[0.12] cursor-pointer"
                      : "bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    sudahTerbit
                      ? isDark
                        ? "bg-blue-500/20 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6"
                        : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                      : isDark
                        ? "bg-white/5 text-slate-500"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${
                    sudahTerbit
                      ? isDark ? "text-slate-100" : "text-[#0B1442]"
                      : "text-slate-400"
                  }`}>
                    Lihat & Edit Sertifikat
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {sudahTerbit ? "Tinjau detail & ubah nomor" : "Belum ada sertifikat"}
                  </p>
                </div>
              </button>

              <div className={`border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

              {/* 3. Hapus Sertifikat */}
              <button
                onClick={() => sudahTerbit && handleAction(onDelete)}
                disabled={!sudahTerbit}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  sudahTerbit
                    ? isDark
                      ? "bg-red-500/[0.04] hover:bg-red-500/[0.12] cursor-pointer"
                      : "bg-red-50/40 hover:bg-red-50/70 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    sudahTerbit
                      ? isDark
                        ? "bg-red-500/20 text-red-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                        : "bg-red-100 text-red-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      : isDark
                        ? "bg-white/5 text-slate-500"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${
                    sudahTerbit
                      ? isDark ? "text-red-400" : "text-red-700"
                      : "text-slate-400"
                  }`}>
                    Hapus Sertifikat
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {sudahTerbit ? "Hapus permanen dari sistem" : "Belum ada sertifikat"}
                  </p>
                </div>
              </button>
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default SertifikatActionsDropdown;