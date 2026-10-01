import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, Award, MessageSquareText } from "lucide-react";

export const PesertaBimbinganActionsDropdown = ({
  onDetail,
  onPenilaian,
  waLink,
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
    const menuWidth = 230;
    const menuHeight = 180;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + window.scrollY + 8;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = rect.top + window.scrollY - menuHeight - 8;
    }

    setPosition({
      top: top,
      left: Math.max(10, rect.right + window.scrollX - menuWidth),
    });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
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
    <div className="relative inline-flex items-center justify-center">
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
        title="Pilihan Aksi"
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
                <div
                  className={`mx-auto mb-2.5 h-1 w-10 rounded-full ${
                    isDark ? "bg-white/10" : "bg-slate-200"
                  }`}
                />

                <div className="mb-2.5">
                  <h4
                    className={`text-center text-[9px] font-black uppercase tracking-widest ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Pilihan Aksi Peserta
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {/* 1. Detail Peserta */}
                  <button
                    type="button"
                    onClick={() => handleAction(onDetail)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#1c2333] border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/[0.05]"
                        : "bg-blue-50/20 border-blue-100 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isDark
                          ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-bold transition-colors ${
                          isDark
                            ? "text-slate-200 group-hover/item:text-[#00A5EC]"
                            : "text-[#0B1442] group-hover/item:text-[#004F9F]"
                        }`}
                      >
                        Lihat Detail Profil
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Data administratif, presensi &amp; laporan
                      </p>
                    </div>
                  </button>

                  {/* 2. Evaluasi Nilai */}
                  <button
                    type="button"
                    onClick={() => handleAction(onPenilaian)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#252019] border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/[0.05]"
                        : "bg-amber-50/30 border-amber-100 hover:border-amber-300 hover:bg-amber-50/60"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isDark
                          ? "bg-amber-500/15 text-amber-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : "bg-amber-100 text-amber-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-bold transition-colors ${
                          isDark
                            ? "text-amber-400 group-hover/item:text-amber-300"
                            : "text-amber-700 group-hover/item:text-amber-800"
                        }`}
                      >
                        Beri Penilaian Akhir
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Lembar penilaian 4 pilar kompetensi
                      </p>
                    </div>
                  </button>

                  {/* 3. Hubungi WhatsApp */}
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCloseAnimated}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                        isDark
                          ? "bg-[#162923] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <span
                        className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          isDark
                            ? "bg-emerald-500/15 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                            : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                        }`}
                      >
                        <MessageSquareText className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[11px] font-bold transition-colors ${
                            isDark
                              ? "text-emerald-400 group-hover/item:text-emerald-300"
                              : "text-[#0B1442] group-hover/item:text-emerald-700"
                          }`}
                        >
                          Hubungi via WhatsApp
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Kirim pesan langsung ke nomor peserta
                        </p>
                      </div>
                    </a>
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
              } ${
                visible
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
              }`}
            >
              {/* 1. Detail Peserta */}
              <button
                type="button"
                onClick={() => handleAction(onDetail)}
                className={`group/item flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                  isDark
                    ? "bg-blue-500/[0.04] hover:bg-blue-500/[0.12]"
                    : "bg-blue-50/40 hover:bg-blue-50/70"
                }`}
              >
                <span
                  className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                    isDark
                      ? "bg-blue-500/20 text-[#00A5EC]"
                      : "bg-blue-100 text-[#004F9F]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    Detail Peserta
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                    Data &amp; presensi lengkap
                  </p>
                </div>
              </button>

              <div
                className={`border-t ${
                  isDark ? "border-white/10" : "border-slate-100"
                }`}
              />

              {/* 2. Evaluasi Nilai */}
              <button
                type="button"
                onClick={() => handleAction(onPenilaian)}
                className={`group/item flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                  isDark
                    ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.12]"
                    : "bg-amber-50/40 hover:bg-amber-50/70"
                }`}
              >
                <span
                  className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                    isDark
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isDark ? "text-amber-400" : "text-amber-700"
                    }`}
                  >
                    Beri Penilaian
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                    Formulir nilai akhir magang
                  </p>
                </div>
              </button>

              {/* 3. Hubungi WhatsApp */}
              {waLink && (
                <>
                  <div
                    className={`border-t ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  />
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCloseAnimated}
                    className={`group/item flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                      isDark
                        ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.12]"
                        : "bg-emerald-50/40 hover:bg-emerald-50/70"
                    }`}
                  >
                    <span
                      className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${
                        isDark
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isDark ? "text-emerald-400" : "text-emerald-700"
                        }`}
                      >
                        Hubungi WhatsApp
                      </p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                        Kirim pesan WA langsung
                      </p>
                    </div>
                  </a>
                </>
              )}
            </div>,
            document.body
          )
        ))}
    </div>
  );
};

export default PesertaBimbinganActionsDropdown;
