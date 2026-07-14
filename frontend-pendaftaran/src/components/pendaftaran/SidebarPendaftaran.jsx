import { Link } from "react-router-dom";

const SidebarPendaftaran = ({
  dk, sideBar, divider, muted, txt, navActive, navInactive, hov,
  activeTab, handleTabChange, hasRegistered, isRevisi,
  dotColor, dotLabel, dotTextColor,
  user, fotoPreview, avatarOpen, setAvatarOpen, setNotifOpen, avatarRef,
  handleLogout,
}) => {
  return (
    <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r transition-colors duration-300 ${sideBar}`}>
      {/* LOGO */}
      <Link
        to="/dashboard?tab=dashboard"
        onClick={() => handleTabChange("dashboard")}
        className={`flex items-center gap-2 px-5 h-17 border-b shrink-0 transition-colors cursor-pointer ${divider} ${hov}`}
      >
      <img src="/images/icon-diskominfo.png" alt="Diskominfo" className="h-11 w-11 object-contain shrink-0" />
      <div className="leading-snug min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-widest ${muted}`}>Portal Pendaftaran</p>
          <h1 className={`text-[13px] font-black tracking-tight leading-tight truncate ${txt}`}>SIM Magang Diskominfo</h1>
      </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-4 pt-6 space-y-1.5">
        <p className={`text-[10px] font-black uppercase tracking-widest px-3 mb-3 ${muted}`}>Menu Utama</p>

        <button onClick={() => handleTabChange("dashboard")}
          className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === "dashboard" ? navActive : navInactive}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </button>

        <button onClick={() => handleTabChange("form")} disabled={hasRegistered && !isRevisi}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === "form" ? navActive : hasRegistered && !isRevisi ? `opacity-40 cursor-not-allowed ${muted}` : navInactive}`}>
          <span className="flex items-center gap-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Formulir Magang
          </span>
          {hasRegistered && !isRevisi && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
        </button>

        <button onClick={() => handleTabChange("status")} disabled={!hasRegistered}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === "status" ? navActive : !hasRegistered ? `opacity-40 cursor-not-allowed ${muted}` : navInactive}`}>
          <span className="flex items-center gap-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Status Verifikasi
          </span>
          {!hasRegistered && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
        </button>

        {isRevisi && (
          <button onClick={() => handleTabChange("revisi")}
            className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === "revisi" ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md" : "text-amber-500 hover:bg-amber-500/10"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Revisi Berkas
            <span className="ml-auto flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">!</span>
          </button>
        )}
      </nav>

      <div className={`px-4 pb-5 pt-3 border-t space-y-3 ${divider}`}>
        <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${dk ? "bg-white/5" : "bg-slate-50"}`}>
          <span className="relative flex h-4 w-4 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${dotColor}`}></span>
            <span className={`dot-glow relative inline-flex h-4 w-4 rounded-full shadow-sm ${dotColor} ${dotColor === "bg-red-500" ? "text-red-500" : dotColor === "bg-amber-400" ? "text-amber-400" : "text-emerald-500"}`}></span>
          </span>
          <div className="min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-wider ${muted}`}>Status Pendaftaran</p>
            <p className={`text-[10px] font-extrabold mt-0.5 truncate ${dotTextColor}`}>{dotLabel}</p>
          </div>
        </div>

        <div className="relative" ref={avatarRef}>
          <button onClick={() => { setAvatarOpen(p => !p); setNotifOpen(false); }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all cursor-pointer ${hov}`}>
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center text-sm font-black shadow">
              {fotoPreview || user?.foto_profil ? (
                <img src={fotoPreview || (user?.foto_profil?.startsWith("http") ? user.foto_profil : `http://localhost:8000/${user.foto_profil}`)} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (user?.nama ? user.nama.charAt(0).toUpperCase() : "P")}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs font-extrabold truncate ${txt}`}>{user?.nama || "Peserta"}</p>
              <p className={`text-[9px] truncate ${muted}`}>{user?.email || "Pendaftar"}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 shrink-0 transition-transform ${muted} ${avatarOpen ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {avatarOpen && (
            <div className={`absolute bottom-0 left-full ml-3 z-50 w-60 rounded-2xl border shadow-2xl overflow-hidden ${dk ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"}`}>
              <div className="px-4 py-3.5 bg-gradient-to-r from-[#0B1442] to-[#1E3A8A]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-white/20 text-white flex items-center justify-center text-sm font-black">
                    {fotoPreview || user?.foto_profil ? (
                      <img src={fotoPreview || (user?.foto_profil?.startsWith("http") ? user.foto_profil : `http://localhost:8000/${user.foto_profil}`)} alt="Foto Profil" className="w-full h-full object-cover" />
                    ) : (user?.nama ? user.nama.charAt(0).toUpperCase() : "P")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">{user?.nama || "Peserta"}</p>
                    <p className="text-[9px] text-white/60 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button onClick={() => { handleTabChange("settings"); setAvatarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${navInactive}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Kelola Akun
                </button>
                <div className={`my-1 border-t ${divider}`}></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all text-left cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
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

export default SidebarPendaftaran;