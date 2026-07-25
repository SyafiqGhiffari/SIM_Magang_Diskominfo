import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createPortal } from "react-dom";

const ManajemenSidebar = ({ navItems, activeKey, handleLogout, roleLabel, profile, homePath, kelolaAkunPath, isDark, isOpen, onClose, collapsed, onToggleCollapse }) => {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const [flyoutKey, setFlyoutKey] = useState(null);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const flyoutRef = useRef(null);
  const flyoutBtnRefs = useRef({});

  const toggleAvatar = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ bottom: window.innerHeight - r.bottom, left: r.right + 12 });
    setAvatarOpen((p) => !p);
  };
  const [dropdownOverride, setDropdownOverride] = useState({});
  const dropdownRefs = useRef({});

  useEffect(() => {
    const fn = (e) => {
      const insideTrigger = avatarRef.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideTrigger && !insideMenu) setAvatarOpen(false);

      Object.entries(dropdownRefs.current).forEach(([key, el]) => {
        if (el && !el.contains(e.target)) {
          setDropdownOverride((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
        }
      });
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!flyoutKey) return;
    const onDocClick = (e) => {
      if (flyoutRef.current?.contains(e.target)) return;
      if (flyoutBtnRefs.current[flyoutKey]?.contains(e.target)) return;
      setFlyoutKey(null);
    };
    const onScrollOrResize = () => setFlyoutKey(null);
    const nav = document.querySelector("aside nav");
    document.addEventListener("mousedown", onDocClick);
    nav?.addEventListener("scroll", onScrollOrResize);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      nav?.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [flyoutKey]);

  // Reset override dropdown saat collapsed berubah — dihitung saat render (bukan di efek),
  // memakai state (bukan ref) untuk melacak nilai sebelumnya, sesuai pola resmi React
  // "Adjusting state when a prop changes".
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    setFlyoutKey(null);
    if (Object.keys(dropdownOverride).length > 0) {
      setDropdownOverride({});
    }
  }

  // Dropdown otomatis terbuka kalau child-nya sedang aktif, kecuali user sudah
  // menutupnya secara manual (tercatat di dropdownOverride).
  const isDropdownOpen = (item) => {
    if (dropdownOverride[item.key] !== undefined) return dropdownOverride[item.key];
    return item.children.some((c) => c.key === activeKey);
  };

  const toggleDropdown = (item) => {
    setDropdownOverride((prev) => ({ ...prev, [item.key]: !isDropdownOpen(item) }));
  };

  const initial = profile?.email ? profile.email.charAt(0).toUpperCase() : "A";

  return (
    <>
      {/* Backdrop — hanya muncul di mobile saat drawer terbuka */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-[fadeslide_0.2s_ease-out]"
          onClick={onClose}
        />
      )}

       <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-72 shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out md:translate-x-0 ${
          collapsed ? "md:w-20" : "md:w-60"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"}`}
      >
        {/* Tombol toggle collapse — selalu mengambang di tepi sidebar, dekat bagian bawah */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          className="hidden md:flex absolute -right-4 bottom-[93px] z-10 h-10 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-lg transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-xl active:scale-95"
        >
          {collapsed ? <PanelLeftOpen className="w-4.5 h-4.5" /> : <PanelLeftClose className="w-4.5 h-4.5" />}
        </button>
        {/* LOGO */}
        <div className={`flex items-center justify-between gap-2 px-5 h-17 border-b shrink-0 transition-colors ${isDark ? "border-white/10" : "border-slate-100"} ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <Link
            to={homePath}
            onClick={onClose}
            className={`flex items-center gap-2 min-w-0 flex-1 rounded-lg transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"} ${collapsed ? "md:flex-none md:justify-center" : ""}`}
          >
            <img src="/images/icon-diskominfo.png" alt="Diskominfo" className="h-11 w-11 object-contain shrink-0" />
            <div className={`leading-snug min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Portal manajemen</p>
              <h1 className={`text-[13px] font-black tracking-tight leading-tight truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>SIM Magang Diskominfo</h1>
            </div>
          </Link>
          <button
            onClick={onClose}
            className={`md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer ${isDark ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto px-4 pt-3 space-y-1.5 ${collapsed ? "md:px-3" : ""}`}>
          {navItems.map((item, idx) => {
            if (item.type === "section") {
              return (
                <p
                  key={`section-${idx}`}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 mb-3 ${idx !== 0 ? "mt-3" : ""} ${isDark ? "text-slate-500" : "text-slate-400"} ${collapsed ? "md:hidden" : ""}`}
                >
                  {item.label}
                </p>
              );
            }

            if (item.type === "dropdown") {
              const isOpen = isDropdownOpen(item);
              const isChildActive = item.children.some((c) => c.key === activeKey);

              return (
                <div key={item.key} className="relative" ref={(el) => { dropdownRefs.current[item.key] = el; }}>
                  <button
                    ref={(el) => { flyoutBtnRefs.current[item.key] = el; }}
                    onClick={(e) => {
                      if (collapsed) {
                        const r = e.currentTarget.getBoundingClientRect();
                        setFlyoutPos({ top: r.top, left: r.right + 12 });
                        setFlyoutKey((prev) => (prev === item.key ? null : item.key));
                      } else {
                        toggleDropdown(item);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                      collapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isChildActive
                        ? isDark ? "bg-white/5 text-slate-100" : "bg-slate-50 text-[#0B1442]"
                        : isDark
                        ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]"
                    }`}
                  >
                    {item.icon}
                    <span className={`flex-1 min-w-0 ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`} />
                  </button>

                  {/* Submenu accordion — muncul saat parent "Kelola Pengguna" diklik pada sidebar mode normal (tidak diciutkan) */}
                  {!collapsed && (
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-4 space-y-1 border-l-2 border-slate-100 pl-3 py-0.5">
                          {item.children.map((child, ci) => (
                            <Link
                              key={child.key}
                              to={child.to}
                              onClick={onClose}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                                activeKey === child.key
                                  ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                                  : isDark
                                  ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]"
                              }`}
                              style={{
                                transitionDelay: isOpen ? `${ci * 40}ms` : "0ms",
                                opacity: isOpen ? 1 : 0,
                                transform: isOpen ? "translateX(0)" : "translateX(-8px)",
                              }}
                            >
                              {child.icon}
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sidebar menciut (collapsed): submenu tampil sebagai flyout di sebelah kanan */}
                  {collapsed && flyoutKey === item.key && createPortal(
                        <div
                          ref={flyoutRef}
                          style={{ position: "fixed", top: `${flyoutPos.top}px`, left: `${flyoutPos.left}px`, zIndex: 2147483647, transformOrigin: "left top" }}
                          className={`hidden md:block w-56 rounded-2xl border overflow-hidden animate-[fadeslide_0.18s_ease-out] ${isDark ? "bg-[#1c2128] border-white/10 shadow-2xl shadow-black/50" : "bg-white border-slate-200 shadow-2xl shadow-slate-300/60"}`}
                        >
                          <p className={`px-4 pt-3 pb-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            {item.label}
                          </p>
                          <div className="p-1.5 pt-0">
                            {item.children.map((child) => (
                              <Link
                                key={child.key}
                                to={child.to}
                                onClick={() => { setFlyoutKey(null); onClose?.(); }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  activeKey === child.key
                                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                                    : isDark
                                    ? "text-slate-300 hover:bg-white/5"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {child.icon}
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>,
                        document.body
                      )}
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 min-w-0 flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                  collapsed ? "md:justify-center md:px-0" : ""
                } ${
                  activeKey === item.key
                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                    : isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]"
                }`}
              >
                {item.icon}
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Avatar & Profile */}
        <div className={`px-4 pb-5 pt-3 border-t ${isDark ? "border-white/10" : "border-slate-100"} ${collapsed ? "md:px-3" : ""}`}>
          <div className="relative" ref={avatarRef}>
            <button
              ref={triggerRef}
              onClick={toggleAvatar}
              title={collapsed ? profile?.email : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"} ${collapsed ? "md:justify-center md:px-0" : ""}`}
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center text-sm font-black shadow">
                {initial}
              </div>
              <div className={`flex-1 text-left min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                <p className={`text-xs font-extrabold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{profile?.email || "Memuat..."}</p>
                <p className={`text-[9px] truncate capitalize ${isDark ? "text-slate-500" : "text-slate-400"}`}>{roleLabel}</p>
              </div>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isDark ? "text-slate-500" : "text-slate-400"} ${avatarOpen ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`} />
            </button>

            {avatarOpen && createPortal(
              <div
                ref={menuRef}
                style={{ position: "fixed", bottom: `${menuPos.bottom}px`, left: `${menuPos.left}px`, zIndex: 2147483647, transformOrigin: "left bottom" }}
                className={`w-56 rounded-2xl border overflow-hidden animate-[avatarMenuPop_0.22s_cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? "bg-[#1c2128] border-white/10 shadow-2xl shadow-black/50" : "bg-white border-slate-200 shadow-2xl shadow-slate-300/60"}`}
              >
                <style>{`@keyframes avatarMenuPop{0%{opacity:0;transform:translateY(10px) scale(0.94)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>

                {/* Header */}
                <div className="relative px-3.5 py-3 bg-gradient-to-br from-[#0B1442] via-[#1E3A8A] to-[#00A5EC] overflow-hidden">
                  <div className="pointer-events-none absolute -top-5 -right-5 h-16 w-16 rounded-full bg-white/10 blur-xl" />
                  <div className="pointer-events-none absolute -bottom-6 -left-3 h-14 w-14 rounded-full bg-[#00A5EC]/40 blur-xl" />
                  <div className="relative flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-black ring-2 ring-white/30">
                        {initial}
                      </div>
                      {/* Titik online berkedip */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{profile?.nama || profile?.email}</p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm capitalize">
                        {roleLabel || profile?.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    to={kelolaAkunPath}
                    onClick={() => { setAvatarOpen(false); onClose?.(); }}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isDark ? "bg-white/5 text-slate-300 group-hover:bg-[#00A5EC]/20 group-hover:text-[#00A5EC]" : "bg-slate-100 text-slate-500 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F]"}`}>
                      <Settings className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    <span className="flex-1">Kelola Akun</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>

                  <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />

                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-red-500 transition-all cursor-pointer hover:bg-red-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-all group-hover:bg-red-500 group-hover:text-white">
                      <LogOut className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                    <span className="flex-1 text-left">Keluar / Logout</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
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

export default ManajemenSidebar;