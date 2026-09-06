import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, ShieldCheck, Lock, KeyRound, FileSignature } from "lucide-react";

const ActionsDropdown = ({ onReview, onVerifikasi, verifikasiDisabled, isFinalStatus, onBuatAkun, showBuatAkun, sudahPunyaAkun, onSurat, showSurat, suratSudahAda, isDark }) => {
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
    
    // Estimate menu height based on conditions if not yet rendered
    let menuHeight = 115; // default height for Tinjau + Verifikasi
    if (showBuatAkun) menuHeight += 56;
    if (showSurat) menuHeight += 56;
    
    if (menuRef.current) {
      menuHeight = menuRef.current.offsetHeight;
    }
    
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
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
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
      fn();
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
              {/* Drawer */}
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
                  <h4 className={`text-center text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pilihan Aksi</h4>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleAction(onReview)}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border hover:scale-[1.015] active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#1c2333] border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/[0.05] hover:shadow-lg hover:shadow-blue-500/5"
                        : "bg-blue-50/20 border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"
                    }`}
                  >
                    <span className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      isDark 
                        ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-blue-500/25" 
                        : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                    }`}>
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold transition-colors ${isDark ? "text-slate-200 group-hover/item:text-[#00A5EC]" : "text-[#0B1442] group-hover/item:text-[#004F9F]"}`}>Tinjau</p>
                      <p className="text-[9px] text-slate-400">Lihat detail lengkap berkas pendaftar</p>
                    </div>
                  </button>

                  <button
                    onClick={() => !verifikasiDisabled && handleAction(onVerifikasi)}
                    disabled={verifikasiDisabled}
                    className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border ${
                      verifikasiDisabled
                        ? isDark
                          ? "bg-[#141822] border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                        : isDark
                          ? "bg-[#1c2e28] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:scale-[1.015] active:scale-95 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
                          : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.015] active:scale-95 hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <span className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      verifikasiDisabled
                        ? "bg-slate-200 text-slate-400"
                        : isDark
                          ? "bg-emerald-500/15 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-emerald-500/25"
                          : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                    }`}>
                      {verifikasiDisabled ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold transition-colors ${
                        verifikasiDisabled
                          ? "text-slate-500"
                          : isDark
                            ? "text-emerald-400 group-hover/item:text-emerald-300"
                            : "text-[#0B1442] group-hover/item:text-[#004F9F]"
                      }`}>Verifikasi</p>
                      <p className="text-[9px] text-slate-400">
                        {isFinalStatus ? "Keputusan sudah final" : verifikasiDisabled ? "Selesaikan tinjauan berkas dulu" : "Proses status pendaftaran"}
                      </p>
                    </div>
                  </button>

                  {showBuatAkun && (
                    <button
                      onClick={() => !sudahPunyaAkun && handleAction(onBuatAkun)}
                      disabled={sudahPunyaAkun}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border ${
                        sudahPunyaAkun
                          ? isDark
                            ? "bg-[#141822] border-white/5 opacity-40 cursor-not-allowed"
                            : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                          : isDark
                            ? "bg-[#1c2333] border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/[0.05] hover:scale-[1.015] active:scale-95 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer"
                            : "bg-blue-50/20 border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.015] active:scale-95 hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <span className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        sudahPunyaAkun
                          ? "bg-slate-200 text-slate-400"
                          : isDark
                            ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-blue-500/25"
                            : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}>
                        <KeyRound className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold transition-colors ${
                          sudahPunyaAkun
                            ? "text-slate-500"
                            : isDark
                              ? "text-slate-200 group-hover/item:text-[#00A5EC]"
                              : "text-[#0B1442] group-hover/item:text-[#004F9F]"
                        }`}>Buat Akun Peserta</p>
                        <p className="text-[9px] text-slate-400">
                          {sudahPunyaAkun ? "Sudah memiliki akun" : "Kirim kredensial via email"}
                        </p>
                      </div>
                    </button>
                  )}

                  {showSurat && (
                    <button
                      onClick={() => handleAction(onSurat)}
                      className={`group/item flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-300 border cursor-pointer hover:scale-[1.015] active:scale-95 ${
                        isDark
                          ? "bg-[#231c33] border-violet-500/10 hover:border-violet-500/30 hover:bg-violet-500/[0.05] hover:shadow-lg hover:shadow-violet-500/5"
                          : "bg-violet-50/20 border-violet-100 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md"
                      }`}
                    >
                      <span className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isDark
                          ? "bg-violet-500/15 text-violet-400 group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:bg-violet-500/25"
                          : "bg-violet-100 text-violet-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      }`}>
                        <FileSignature className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold transition-colors ${
                          isDark ? "text-violet-400 group-hover/item:text-violet-300" : "text-violet-700 group-hover/item:text-violet-600"
                        }`}>
                          {suratSudahAda ? "Lihat / Ubah Surat" : "Terbitkan Surat"}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {suratSudahAda ? "Surat sudah diterbitkan" : "Surat penerimaan magang"}
                        </p>
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
              className={`w-52 rounded-2xl border overflow-hidden shadow-2xl transition-all duration-200 ${
                visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"
              } ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
              }`}
            >
              <button
                onClick={() => handleAction(onReview)}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors duration-200 ${
                  isDark
                    ? "bg-blue-500/[0.03] hover:bg-blue-500/10"
                    : "bg-blue-50/40 hover:bg-blue-50/70"
                }`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(10px)",
                  transition: "opacity 200ms ease 0ms, transform 200ms ease 0ms, background-color 200ms ease",
                }}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                  isDark
                    ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6"
                    : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                }`}>
                  <Eye className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>Tinjau</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">Lihat detail lengkap</p>
                </div>
              </button>

              <div className={`border-t ${isDark ? "border-white/5" : "border-slate-100"}`} />

              <button
                onClick={() => !verifikasiDisabled && handleAction(onVerifikasi)}
                disabled={verifikasiDisabled}
                title={isFinalStatus ? "Keputusan pendaftaran ini sudah final" : verifikasiDisabled ? "Setujui semua berkas di menu Tinjau terlebih dahulu" : ""}
                className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  verifikasiDisabled
                    ? isDark
                      ? "bg-white/[0.02] cursor-not-allowed"
                      : "bg-slate-50 cursor-not-allowed"
                    : isDark
                      ? "bg-emerald-500/[0.03] hover:bg-emerald-500/10 cursor-pointer"
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
                    ? isDark
                      ? "bg-white/10 text-slate-500"
                      : "bg-slate-200 text-slate-400"
                    : isDark
                      ? "bg-emerald-500/15 text-emerald-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                      : "bg-emerald-100 text-emerald-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                }`}>
                  {verifikasiDisabled ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${
                    verifikasiDisabled
                      ? "text-slate-500"
                      : isDark
                        ? "text-emerald-400"
                        : "text-emerald-700"
                  }`}>Verifikasi</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {isFinalStatus ? "Keputusan sudah final" : verifikasiDisabled ? "Selesaikan tinjauan berkas dulu" : "Proses status pendaftaran"}
                  </p>
                </div>
              </button>

              {showBuatAkun && (
                <>
                  <div className={`border-t ${isDark ? "border-white/5" : "border-slate-100"}`} />
                  <button
                    onClick={() => !sudahPunyaAkun && handleAction(onBuatAkun)}
                    disabled={sudahPunyaAkun}
                    title={sudahPunyaAkun ? "Peserta ini sudah memiliki akun" : ""}
                    className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      sudahPunyaAkun
                        ? isDark
                          ? "bg-white/[0.02] cursor-not-allowed"
                          : "bg-slate-50 cursor-not-allowed"
                        : isDark
                          ? "bg-blue-500/[0.03] hover:bg-blue-500/10 cursor-pointer"
                          : "bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer"
                    }`}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateX(0)" : "translateX(10px)",
                      transition: "opacity 200ms ease 80ms, transform 200ms ease 80ms, background-color 200ms ease",
                    }}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      sudahPunyaAkun
                        ? isDark
                          ? "bg-white/10 text-slate-500"
                          : "bg-slate-200 text-slate-400"
                        : isDark
                          ? "bg-blue-500/15 text-[#00A5EC] group-hover/item:scale-110 group-hover/item:-rotate-6"
                          : "bg-blue-100 text-[#004F9F] group-hover/item:scale-110 group-hover/item:-rotate-6"
                    }`}>
                      <KeyRound className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${
                        sudahPunyaAkun
                          ? "text-slate-500"
                          : isDark
                            ? "text-slate-200"
                            : "text-[#0B1442]"
                      }`}>Buat Akun Peserta</p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">
                        {sudahPunyaAkun ? "Sudah memiliki akun" : "Kirim kredensial via email"}
                      </p>
                    </div>
                  </button>
                </>
              )}

              {showSurat && (
                <>
                  <div className={`border-t ${isDark ? "border-white/5" : "border-slate-100"}`} />
                  <button
                    onClick={() => handleAction(onSurat)}
                    className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors duration-200 ${
                      isDark
                        ? "bg-violet-500/[0.03] hover:bg-violet-500/10"
                        : "bg-violet-50/40 hover:bg-violet-50/70"
                    }`}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateX(0)" : "translateX(10px)",
                      transition: "opacity 200ms ease 120ms, transform 200ms ease 120ms, background-color 200ms ease",
                    }}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      isDark
                        ? "bg-violet-500/15 text-violet-400 group-hover/item:scale-110 group-hover/item:-rotate-6"
                        : "bg-violet-100 text-violet-600 group-hover/item:scale-110 group-hover/item:-rotate-6"
                    }`}>
                      <FileSignature className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${
                        isDark ? "text-violet-400" : "text-violet-700"
                      }`}>
                        {suratSudahAda ? "Lihat / Ubah Surat" : "Terbitkan Surat"}
                      </p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">
                        {suratSudahAda ? "Surat sudah diterbitkan" : "Surat penerimaan magang"}
                      </p>
                    </div>
                  </button>
                </>
              )}
            </div>,
            document.body
          )
        ))}
    </>
  );
};

export default ActionsDropdown;