import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Pencil, Trash2, Plus, MailCheck } from "lucide-react";

const SuratActionsDropdown = ({
  sudahTerbit,
  sudahDikirim,
  onEdit,
  onDelete,
  onTerbitkan,
  onKirimEmail,
  isDark = false,
}) => {
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
    const menuWidth = 224;
    const menuHeight = sudahTerbit ? 180 : 68;

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
      fn?.();
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
        title="Aksi Surat"
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
                  {sudahTerbit ? (
                    <>
                      {/* 1. Kelola Surat */}
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
                          <p className={`text-[11px] font-bold transition-colors ${
                            isDark ? "text-violet-400" : "text-violet-700"
                          }`}>
                            Kelola Surat
                          </p>
                          <p className="text-[9px] text-slate-400">Ubah data, lihat & unduh PDF surat</p>
                        </div>
                      </button>

                      {/* 2. Kirim Email */}
                      <button
                        onClick={() => handleAction(onKirimEmail)}
                        className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                          isDark
                            ? "bg-[#1c2333] border-sky-500/10 hover:border-sky-500/30 hover:bg-sky-500/[0.05] hover:shadow-lg hover:shadow-sky-500/5"
                            : "bg-sky-50/20 border-sky-100 hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md"
                        }`}
                      >
                        <span
                          className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                            isDark
                              ? "bg-sky-500/15 text-sky-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-sky-500/25"
                              : "bg-sky-100 text-sky-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                          }`}
                        >
                          <MailCheck className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] font-bold transition-colors ${
                            isDark ? "text-slate-200 group-hover/item:text-[#00A5EC]" : "text-[#0B1442] group-hover/item:text-[#004F9F]"
                          }`}>
                            {sudahDikirim ? "Kirim Ulang Email" : "Kirim ke Email Peserta"}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {sudahDikirim ? "Kirim lagi PDF surat terbaru" : "Lampirkan PDF ke email pendaftaran"}
                          </p>
                        </div>
                      </button>

                      {/* 3. Hapus Surat */}
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
                          <p className={`text-[11px] font-bold transition-colors ${
                            isDark ? "text-red-400" : "text-red-600"
                          }`}>
                            Hapus Surat
                          </p>
                          <p className="text-[9px] text-slate-400">Hapus surat beserta PDF-nya</p>
                        </div>
                      </button>
                    </>
                  ) : (
                    /* Terbitkan Surat */
                    <button
                      onClick={() => handleAction(onTerbitkan)}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                        isDark
                          ? "bg-[#162923] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:shadow-lg hover:shadow-emerald-500/5"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
                      }`}
                    >
                      <span
                        className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          isDark
                            ? "bg-emerald-500/15 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-emerald-500/25"
                            : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold transition-colors ${
                          isDark ? "text-emerald-400 group-hover/item:text-emerald-300" : "text-[#0B1442] group-hover/item:text-emerald-700"
                        }`}>
                          Terbitkan Surat
                        </p>
                        <p className="text-[9px] text-slate-400">Isi nomor surat & data tujuan peserta</p>
                      </div>
                    </button>
                  )}
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
              {sudahTerbit ? (
                <>
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
                      <p className={`text-xs font-bold ${isDark ? "text-violet-400" : "text-violet-700"}`}>Kelola Surat</p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">Ubah data, lihat & unduh PDF</p>
                    </div>
                  </button>

                  <div className={`border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

                  <button
                    onClick={() => handleAction(onKirimEmail)}
                    className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer ${
                      isDark ? "bg-sky-500/[0.04] hover:bg-sky-500/[0.12]" : "bg-sky-50/40 hover:bg-sky-50/70"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                        isDark ? "bg-sky-900/30 text-sky-400" : "bg-sky-100 text-sky-600"
                      }`}
                    >
                      <MailCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        {sudahDikirim ? "Kirim Ulang Email" : "Kirim ke Email Peserta"}
                      </p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">
                        {sudahDikirim ? "Kirim lagi PDF surat terbaru" : "Lampirkan PDF ke email pendaftaran"}
                      </p>
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
                      <p className={`text-xs font-bold ${isDark ? "text-red-400" : "text-red-700"}`}>Hapus Surat</p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">Hapus surat beserta PDF-nya</p>
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAction(onTerbitkan)}
                  className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer ${
                    isDark ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.12]" : "bg-emerald-50/40 hover:bg-emerald-50/70"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                      isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-[#0B1442]"}`}>Terbitkan Surat</p>
                    <p className="text-[10px] text-slate-400 whitespace-nowrap">Isi nomor surat & data tujuan</p>
                  </div>
                </button>
              )}
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default SuratActionsDropdown;