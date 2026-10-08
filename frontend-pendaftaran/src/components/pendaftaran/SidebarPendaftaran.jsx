import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl";

// Ikon Dashboard (Rumah) persis seperti di web manajemen (PesertaLayout / AdminLayout)
const HomeIcon = ({ className = "w-[18px] h-[18px] shrink-0" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const AvatarProfil = ({ fotoUrl, inisial, nama, size = "h-9 w-9", ring }) => {
  const [gagalUrl, setGagalUrl] = useState(null);
  const gagal = Boolean(fotoUrl && gagalUrl === fotoUrl);

  return (
    <div
      className={`${size} shrink-0 aspect-square rounded-full overflow-hidden flex items-center justify-center shadow ${ring || ""}`}
    >
      {fotoUrl && !gagal ? (
        <img
          src={fotoUrl}
          alt={nama || "Foto profil"}
          onError={() => setGagalUrl(fotoUrl)}
          className="w-full h-full object-cover object-center rounded-full aspect-square block"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center font-black rounded-full">
          {inisial}
        </div>
      )}
    </div>
  );
};

const SidebarPendaftaran = ({
  isDark: isDarkProp,
  dk,
  activeTab,
  handleTabChange,
  hasRegistered,
  isRevisi,
  dotColor,
  dotLabel,
  dotTextColor,
  user,
  status,
  fotoPreview,
  avatarOpen: avatarOpenProp,
  setAvatarOpen: setAvatarOpenProp,
  setNotifOpen,
  avatarRef,
  handleLogout,
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const isDark = isDarkProp ?? dk ?? false;
  const isFormLocked = (hasRegistered || !!status) && !isRevisi;
  const [internalAvatarOpen, setInternalAvatarOpen] = useState(false);
  const avatarOpen = avatarOpenProp !== undefined ? avatarOpenProp : internalAvatarOpen;
  const setAvatarOpen = setAvatarOpenProp || setInternalAvatarOpen;

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0, width: null });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isSidebarCollapsed = collapsed && !isMobile;

  const toggleAvatar = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      if (isMobile) {
        const lebarDropdown = 210;
        const targetLeft = Math.min(120, window.innerWidth - lebarDropdown - 12);
        const leftPos = Math.max(16, targetLeft);

        setMenuPos({
          bottom: window.innerHeight - r.top + 8,
          left: leftPos,
          width: lebarDropdown,
        });
      } else {
        setMenuPos({
          bottom: Math.max(12, window.innerHeight - r.bottom),
          left: r.right + 12,
          width: null,
        });
      }
    }
    setAvatarOpen((p) => !p);
    if (setNotifOpen) setNotifOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideTrigger = triggerRef.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideTrigger && !insideMenu) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setAvatarOpen]);

  useEffect(() => {
    const handleResize = () => setAvatarOpen(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setAvatarOpen]);

  const inisial = (() => {
    const sumber = user?.nama || user?.email || "P";
    return sumber
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  })();

  const rawFoto =
    fotoPreview ||
    user?.foto_profil ||
    status?.file_pas_foto ||
    status?.pendaftaran?.file_pas_foto ||
    status?.peserta?.foto_profil;
  const fotoUrl = rawFoto ? getFileUrl(rawFoto) : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-[fadeslide_0.2s_ease-out]"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-30 w-60 shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out md:translate-x-0 ${
          collapsed ? "md:w-20" : "md:w-60"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} ${
          isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >

        {/* Brand Logo Header */}
        <div
          className={`flex items-center justify-between gap-2 px-3 md:px-5 h-17 border-b shrink-0 transition-colors ${
            isDark ? "border-white/10" : "border-slate-100"
          } ${collapsed ? "md:justify-center md:px-0" : ""}`}
        >
          <Link
            to="/dashboard?tab=dashboard"
            onClick={() => {
              handleTabChange("dashboard");
              if (onClose) onClose();
            }}
            className={`flex items-center gap-2 min-w-0 flex-1 rounded-lg transition-colors ${
              isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
            } ${collapsed ? "md:flex-none md:justify-center" : ""}`}
          >
            <img
              src="/images/icon-diskominfo.png"
              alt="Diskominfo"
              className="h-9 w-9 md:h-11 md:w-11 object-contain shrink-0"
            />
            <div className={`leading-snug min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p
                className={`text-[8.5px] md:text-[11px] font-bold uppercase tracking-widest ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Portal Pendaftaran
              </p>
              <h1
                className={`text-[10.5px] md:text-[13px] font-black tracking-tight leading-tight truncate ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                SIM Magang Diskominfo
              </h1>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            type="button"
            title="Tutup menu"
            className={`md:hidden group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer active:scale-90 ${
              isDark
                ? "text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            }`}
          >
            <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className={`flex-1 overflow-y-auto px-2 md:px-4 pt-3 md:pt-4 space-y-1 md:space-y-1.5 ${collapsed ? "md:px-3" : ""}`}>
          <p
            className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2.5 md:px-3 mb-1.5 md:mb-3 ${
              isDark ? "text-slate-500" : "text-slate-400"
            } ${collapsed ? "md:hidden" : ""}`}
          >
            Menu Utama
          </p>

          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => {
              handleTabChange("dashboard");
              if (onClose) onClose();
            }}
            title={isSidebarCollapsed ? "Dashboard" : undefined}
            className={`flex items-center gap-2.5 md:gap-3 w-full px-2.5 py-2.5 rounded-lg md:rounded-xl text-[12px] md:text-[13px] font-bold transition-colors duration-150 text-left cursor-pointer ${
              isSidebarCollapsed ? "md:justify-center md:px-0" : "md:px-3.5 md:py-3"
            } ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                : isDark
                ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]"
            }`}
          >
            <HomeIcon className="w-[18px] h-[18px] shrink-0" />
            <span className={`min-w-0 truncate whitespace-nowrap ${isSidebarCollapsed ? "md:hidden" : ""}`}>
              Dashboard
            </span>
          </button>

          {/* 2. Formulir Magang */}
          <button
            type="button"
            disabled={isFormLocked}
            onClick={() => {
              if (isFormLocked) return;
              handleTabChange("form");
              if (onClose) onClose();
            }}
            title={
              isSidebarCollapsed
                ? isFormLocked
                  ? "Formulir Magang (Terkunci)"
                  : "Formulir Magang"
                : isFormLocked
                ? "Formulir telah diajukan (Terkunci)"
                : undefined
            }
            className={`flex items-center justify-between gap-2.5 md:gap-3 w-full px-2.5 py-2.5 rounded-lg md:rounded-xl text-[12px] md:text-[13px] font-bold transition-colors duration-150 text-left ${
              isSidebarCollapsed ? "md:justify-center md:px-0" : "md:px-3.5 md:py-3"
            } ${
              isFormLocked
                ? isDark
                  ? "opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent select-none"
                  : "opacity-40 text-slate-400 cursor-not-allowed hover:bg-transparent select-none"
                : activeTab === "form"
                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md cursor-pointer"
                : isDark
                ? "text-slate-400 hover:bg-white/5 hover:text-slate-100 cursor-pointer"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442] cursor-pointer"
            }`}
          >
            <span className="flex items-center gap-2.5 md:gap-3 min-w-0">
              <FileText className="w-[18px] h-[18px] shrink-0" />
              <span className={`min-w-0 truncate whitespace-nowrap ${isSidebarCollapsed ? "md:hidden" : ""}`}>
                Formulir Magang
              </span>
            </span>
            {isFormLocked && (
              <Lock className={`w-3.5 h-3.5 shrink-0 ml-auto ${isSidebarCollapsed ? "md:hidden" : ""}`} />
            )}
          </button>


          {/* 3. Revisi Berkas (Khusus jika berstatus revisi) */}
          {isRevisi && (
            <button
              type="button"
              onClick={() => {
                handleTabChange("revisi");
                if (onClose) onClose();
              }}
              title={isSidebarCollapsed ? "Revisi Berkas" : undefined}
              className={`flex items-center justify-between gap-2.5 md:gap-3 w-full px-2.5 py-2.5 rounded-lg md:rounded-xl text-[12px] md:text-[13px] font-bold transition-colors duration-150 text-left cursor-pointer ${
                isSidebarCollapsed ? "md:justify-center md:px-0" : "md:px-3.5 md:py-3"
              } ${
                activeTab === "revisi"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30"
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
              }`}
            >
              <span className="flex items-center gap-2.5 md:gap-3 min-w-0">
                <AlertTriangle className="w-[18px] h-[18px] shrink-0 text-amber-500" />
                <span className={`min-w-0 truncate whitespace-nowrap ${isSidebarCollapsed ? "md:hidden" : ""}`}>
                  Revisi Berkas
                </span>
              </span>
              <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shrink-0 ${isSidebarCollapsed ? "md:hidden" : ""}`}>
                !
              </span>
            </button>
          )}
        </nav>

        {/* Bottom Section: Status Pill & Profile */}
        <div className={`relative p-2.5 md:p-3 border-t space-y-2 shrink-0 transition-colors ${
          isDark ? "border-white/10" : "border-slate-100"
        } ${collapsed ? "md:px-2" : ""}`}>
          {/* Toggle Collapse Button for Desktop — dinaikkan tepat di atas garis sekat */}
          <button
            onClick={onToggleCollapse}
            type="button"
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="hidden md:flex absolute -right-4 bottom-full mb-2 z-50 h-10 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-xl active:scale-95 select-none"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4.5 h-4.5 pointer-events-none" />
            ) : (
              <PanelLeftClose className="w-4.5 h-4.5 pointer-events-none" />
            )}
          </button>
          {/* Status Pendaftaran Widget */}
          <div
            title={`Status Pendaftaran: ${dotLabel}`}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 md:px-3 md:py-2.5 transition-all ${
              isDark ? "bg-white/5 border border-white/5" : "bg-slate-50 border border-slate-100"
            } ${collapsed ? "md:justify-center md:px-0 md:py-2" : ""}`}
          >
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColor}`} />
              <span className={`relative inline-flex h-3.5 w-3.5 rounded-full shadow-sm ${dotColor}`} />
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <p className={`text-[8.5px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Status Berkas
              </p>
              <p className={`text-[10px] font-extrabold truncate leading-tight mt-0.5 ${dotTextColor}`}>
                {dotLabel}
              </p>
            </div>
          </div>

          {/* User Profile Card Button */}
          <div className="relative w-full" ref={avatarRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleAvatar}
              title={collapsed ? user?.nama || user?.email : undefined}
              className={`w-full flex items-center gap-2 md:gap-2.5 rounded-lg md:rounded-xl px-1.5 py-1.5 md:px-2 md:py-2 transition-all cursor-pointer ${
                isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
              } ${collapsed ? "md:justify-center md:px-0" : ""}`}
            >
              <AvatarProfil
                fotoUrl={fotoUrl}
                inisial={inisial}
                nama={user?.nama}
                size="h-8 w-8 md:h-9 md:w-9 text-[10px] md:text-[11px]"
                ring={isDark ? "ring-2 ring-white/10" : "ring-2 ring-slate-200"}
              />
              <div className={`flex-1 text-left min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                <p className={`text-[11px] md:text-xs font-extrabold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  {user?.nama || "Pendaftar"}
                </p>
                <p className={`text-[8.5px] md:text-[9.5px] truncate capitalize ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Pendaftar Magang
                </p>
              </div>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform ${
                  isDark ? "text-slate-500" : "text-slate-400"
                } ${avatarOpen ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`}
              />
            </button>

            {/* Avatar Popover Menu */}
            {avatarOpen &&
              createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: "fixed",
                    bottom: `${menuPos.bottom}px`,
                    left: `${menuPos.left}px`,
                    width: menuPos.width ? `${menuPos.width}px` : undefined,
                    zIndex: 2147483647,
                    transformOrigin: "left bottom",
                  }}
                  className={`${
                    menuPos.width ? "" : "w-56"
                  } max-w-[calc(100vw-1.5rem)] rounded-xl md:rounded-2xl border overflow-hidden animate-[avatarMenuPop_0.22s_cubic-bezier(0.34,1.56,0.64,1)] ${
                    isDark
                      ? "bg-[#1c2128] border-white/10 shadow-2xl shadow-black/50"
                      : "bg-white border-slate-200 shadow-2xl shadow-slate-300/60"
                  }`}
                >
                  <style>{`@keyframes avatarMenuPop{0%{opacity:0;transform:translateY(10px) scale(0.94)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>

                  {/* Header */}
                  <div className="relative px-3 md:px-3.5 py-2.5 md:py-3 bg-gradient-to-br from-[#0B1442] via-[#1E3A8A] to-[#00A5EC] overflow-hidden">
                    <div className="pointer-events-none absolute -top-5 -right-5 h-16 w-16 rounded-full bg-white/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-6 -left-3 h-14 w-14 rounded-full bg-[#00A5EC]/40 blur-xl" />
                    <div className="relative flex items-center gap-2 md:gap-2.5">
                      <div className="relative shrink-0">
                        <AvatarProfil
                          fotoUrl={fotoUrl}
                          inisial={inisial}
                          nama={user?.nama}
                          size="h-8 w-8 md:h-10 md:w-10 text-[10px] md:text-[12px]"
                          ring="ring-2 ring-white/30"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] md:text-[12px] font-bold text-white truncate">
                          {user?.nama || "Pendaftar"}
                        </p>
                        <span className="mt-0.5 inline-flex items-center rounded-full bg-white/15 px-1 md:px-1.5 py-0.5 text-[7px] md:text-[8px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                          Pendaftar Magang
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1 md:p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("settings");
                        setAvatarOpen(false);
                        if (onClose) onClose();
                      }}
                      className={`group flex items-center gap-2 md:gap-2.5 w-full px-2 md:px-2.5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
                        isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-6.5 w-6.5 md:h-7 md:w-7 items-center justify-center rounded-lg transition-all ${
                          isDark
                            ? "bg-white/5 text-slate-300 group-hover:bg-[#00A5EC]/20 group-hover:text-[#00A5EC]"
                            : "bg-slate-100 text-slate-500 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F]"
                        }`}
                      >
                        <Settings className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-300 group-hover:scale-110" />
                      </span>
                      <span className="flex-1 text-left">Kelola Akun</span>
                      <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                    </button>

                    <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

                    <button
                      type="button"
                      onClick={() => {
                        setAvatarOpen(false);
                        handleLogout();
                      }}
                      className="group flex w-full items-center gap-2 md:gap-2.5 px-2 md:px-2.5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold text-red-500 transition-all cursor-pointer hover:bg-red-500/10"
                    >
                      <span className="flex h-6.5 w-6.5 md:h-7 md:w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-all group-hover:bg-red-500 group-hover:text-white">
                        <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                      <span className="flex-1 text-left">Keluar / Logout</span>
                      <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                    </button>
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarPendaftaran;