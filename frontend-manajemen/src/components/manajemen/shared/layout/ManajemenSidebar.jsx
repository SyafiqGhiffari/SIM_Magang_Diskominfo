import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings, ChevronDown } from "lucide-react";

const ManajemenSidebar = ({ navItems, activeKey, handleLogout, roleLabel, profile, homePath, kelolaAkunPath, isDark }) => {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const initial = profile?.email ? profile.email.charAt(0).toUpperCase() : "A";

  return (
    <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r transition-colors duration-300 ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"}`}>
      {/* LOGO */}
      <Link
        to={homePath}
        className={`flex items-center gap-2 px-5 h-17 border-b shrink-0 transition-colors ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}
      >
        <img src="/images/icon-diskominfo.png" alt="Diskominfo" className="h-11 w-11 object-contain shrink-0" />
        <div className="leading-snug min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Portal manajemen</p>
          <h1 className={`text-[13px] font-black tracking-tight leading-tight truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>SIM Magang Diskominfo</h1>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-4 pt-6 space-y-1.5">
        {navItems.map((item, idx) => {
          if (item.type === "section") {
            return (
              <p
                key={`section-${idx}`}
                className={`text-[10px] font-black uppercase tracking-widest px-3 mb-3 ${idx !== 0 ? "mt-6" : ""} ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {item.label}
              </p>
            );
          }
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeKey === item.key
                  ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                  : isDark
                  ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1442]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Avatar & Profile */}
      <div className={`px-4 pb-5 pt-3 border-t ${isDark ? "border-white/10" : "border-slate-100"}`}>
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen((p) => !p)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center text-sm font-black shadow">
              {initial}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs font-extrabold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{profile?.email || "Memuat..."}</p>
              <p className={`text-[9px] truncate capitalize ${isDark ? "text-slate-500" : "text-slate-400"}`}>{roleLabel}</p>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isDark ? "text-slate-500" : "text-slate-400"} ${avatarOpen ? "rotate-180" : ""}`} />
          </button>

          {avatarOpen && (
            <div className={`absolute bottom-0 left-full ml-3 z-50 w-56 rounded-2xl border shadow-2xl overflow-hidden ${isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"}`}>
              <div className="px-4 py-3.5 bg-gradient-to-r from-[#0B1442] to-[#1E3A8A]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-black shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">{profile?.email}</p>
                    <p className="text-[9px] text-white/60 truncate capitalize">{profile?.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  to={kelolaAkunPath}
                  onClick={() => setAvatarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Settings className="w-4 h-4" />
                  Kelola Akun
                </Link>
                <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ManajemenSidebar;