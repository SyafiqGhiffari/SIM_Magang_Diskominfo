import { getRelativeTime } from "../../utils/formatTime";

const HeaderPendaftaran = ({
  hdr, dk, divider, muted, txt, sub, currentTab,
  notifOpen, setNotifOpen, setAvatarOpen, notifRef, notifications, hov,
  clock, fmtTime, fmtDate, setIsDark, hasReadNotif,
}) => {
  return (
    <header className={`sticky top-0 z-30 flex h-17 items-center justify-between border-b px-5 shadow-sm backdrop-blur-sm shrink-0 ${hdr}`}>
      <div className="leading-snug min-w-0">
        <h2 className={`text-sm font-black tracking-tight truncate ${txt}`}>{currentTab.title}</h2>
        <p className={`text-[10px] font-sans truncate ${muted}`}>{currentTab.desc}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(p => !p); setAvatarOpen(false); }}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${dk ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"} ${notifOpen ? (dk ? "bg-white/10" : "bg-slate-100") : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${(!hasReadNotif && notifications.length > 0) ? "animate-[bell-shake_4s_ease-in-out_infinite]" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {!hasReadNotif && notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={`absolute right-0 top-12 z-50 w-80 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] ${dk ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"}`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#0B1442] to-[#1E3A8A]">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span className="text-xs font-extrabold text-white">Notifikasi Terkini</span>
                </div>
                <span className="text-[10px] text-white/60 font-bold bg-white/10 px-2 py-0.5 rounded-full">{notifications.length} pesan</span>
              </div>
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${dk ? "bg-white/5" : "bg-slate-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${muted}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                  </div>
                  <p className={`text-xs font-sans ${muted}`}>Tidak ada notifikasi.</p>
                </div>
              ) : (
                <div className={`divide-y max-h-72 overflow-y-auto ${divider}`}>
                  {notifications.map(n => (
                    <div key={n.id} className={`group flex items-start gap-3 px-4 py-3.5 transition-all duration-200 cursor-default ${hov}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${
                          n.type === "success" ? (dk ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600") :
                          n.type === "error" ? (dk ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600") :
                          n.type === "warning" ? (dk ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600") :
                          n.type === "pending" ? (dk ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600") :
                          (dk ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600")
                        }`}>{n.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!hasReadNotif && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${n.dot}`}></span>}
                          <p className={`text-[11px] font-extrabold truncate ${txt}`}>{n.title}</p>
                        </div>
                        <p className={`text-[10px] leading-relaxed font-sans line-clamp-2 ${sub}`}>{n.msg}</p>
                        <p className={`text-[9px] mt-1 font-bold ${muted}`}>{getRelativeTime(n.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={`px-4 py-2.5 border-t flex items-center justify-center gap-1.5 ${divider} ${dk ? "" : "bg-slate-50/50"}`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <p className={`text-[10px] text-center font-sans ${muted}`}>Diperbarui otomatis sesuai status</p>
              </div>
            </div>
          )}
        </div>

        <div className={`h-6 w-px mx-1 ${dk ? "bg-white/10" : "bg-slate-200"}`} />

        <div className={`hidden md:flex flex-col items-end leading-tight px-3 py-1.5 rounded-xl ${dk ? "bg-white/5" : "bg-slate-50"}`}>
          <span className={`text-[11px] font-black tabular-nums ${txt}`}>{fmtTime(clock)}</span>
          <span className={`text-[9px] font-bold ${muted}`}>{fmtDate(clock)}</span>
        </div>

        <div className={`h-6 w-px mx-1 ${dk ? "bg-white/10" : "bg-slate-200"}`} />

        <button onClick={() => setIsDark(p => !p)} title={dk ? "Mode Terang" : "Mode Gelap"}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${dk ? "bg-white/10 hover:bg-white/20 text-amber-400" : "hover:bg-slate-100 text-slate-500"}`}>
          {dk ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default HeaderPendaftaran;