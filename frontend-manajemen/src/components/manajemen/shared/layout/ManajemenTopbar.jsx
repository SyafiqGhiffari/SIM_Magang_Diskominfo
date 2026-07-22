import { useEffect, useRef, useState } from "react";
import { Search, X, Menu } from "lucide-react";

const ManajemenTopbar = ({ currentTab, searchValue, onSearchChange, isDark, setIsDark, onMenuClick }) => {
  const [clock, setClock] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState(searchValue ?? "");
  const notifRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const handleSearchChange = (val) => {
    setInternalSearch(val);
    onSearchChange?.(val);
  };

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setMobileSearchOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      const t = setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [mobileSearchOpen]);

  const fmtTime = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <header className={`relative sticky top-0 z-30 flex h-17 items-center justify-between gap-2 md:gap-4 border-b px-3 md:px-6 shadow-sm backdrop-blur-sm shrink-0 transition-colors duration-300 ${isDark ? "bg-[#161b22]/95 border-white/10" : "bg-white/95 border-slate-200/80"}`}>
      <button
        onClick={onMenuClick}
        className={`md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer active:scale-90 ${isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="leading-snug min-w-0 shrink-0 hidden sm:block">
        <h2 className={`text-sm font-black tracking-tight truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{currentTab?.title}</h2>
        <p className={`text-[10px] font-sans truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{currentTab?.desc}</p>
      </div>

      {/* Search desktop — tetap seperti semula, disembunyikan di mobile */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className={`group relative rounded-xl transition-all duration-300 ${isSearchFocused ? "scale-[1.02]" : ""}`}>
          <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${isSearchFocused ? "text-[#00A5EC] scale-110" : isDark ? "text-slate-500" : "text-slate-400"}`}>
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari sesuatu..."
            value={internalSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full rounded-xl border pl-10 pr-9 py-2.5 text-xs font-medium outline-none transition-all duration-300 ${
              isSearchFocused
                ? isDark
                  ? "border-[#00A5EC] bg-white/5 text-slate-100 shadow-lg shadow-[#00A5EC]/10 ring-2 ring-[#00A5EC]/20"
                  : "border-[#004F9F] bg-white text-slate-700 shadow-lg shadow-[#00A5EC]/10 ring-2 ring-[#00A5EC]/20"
                : isDark
                ? "border-white/10 bg-white/[0.03] text-slate-100 hover:border-white/20 hover:bg-white/5"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
            }`}
          />
          {internalSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className={`absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span
            className={`absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
              isSearchFocused ? "w-[calc(100%-8px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
            }`}
          />
        </div>
      </div>

      {/* Spacer supaya elemen kanan tetap terdorong ke ujung saat search desktop disembunyikan */}
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Tombol search — hanya ikon, mobile saja, dropdown mengambang di bawahnya */}
        <div className="relative md:hidden" ref={mobileSearchRef}>
          <button
            onClick={() => setMobileSearchOpen((p) => !p)}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              mobileSearchOpen ? (isDark ? "bg-white/10 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]") : isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {mobileSearchOpen && (
            <div
              className={`absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${
                isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"
              }`}
            >
              <div className="p-3">
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  isDark ? "border-[#00A5EC]/40 bg-white/5" : "border-[#004F9F]/40 bg-blue-50/40"
                }`}>
                  <Search className={`w-4 h-4 shrink-0 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Cari sesuatu..."
                    value={internalSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={`flex-1 min-w-0 bg-transparent text-xs font-medium outline-none ${isDark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                  {internalSearch && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className={`shrink-0 transition-colors cursor-pointer ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(p => !p)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"} ${notifOpen ? (isDark ? "bg-white/10" : "bg-slate-100") : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>

          {notifOpen && (
            <div className={`absolute right-0 top-12 z-50 w-72 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"}`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#0B1442] to-[#1E3A8A]">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span className="text-xs font-extrabold text-white">Notifikasi Terkini</span>
                </div>
              </div>
              <div className="py-10 text-center">
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                </div>
                <p className={`text-xs font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>Belum ada notifikasi.</p>
              </div>
            </div>
          )}
        </div>

        <div className={`h-6 w-px mx-0.5 md:mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* Jam & Tanggal — sekarang selalu tampil, versi ringkas di mobile */}
        <div className={`flex flex-col items-end leading-tight px-2 md:px-3 py-1.5 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
          <span className={`text-[10px] md:text-[11px] font-black tabular-nums ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{fmtTime(clock)}</span>
          <span className={`hidden sm:block text-[9px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{fmtDate(clock)}</span>
        </div>

        <div className={`h-6 w-px mx-0.5 md:mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* Toggle tema */}
        <button onClick={() => setIsDark(p => !p)} title={isDark ? "Mode Terang" : "Mode Gelap"}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${isDark ? "bg-white/10 hover:bg-white/20 text-amber-400" : "hover:bg-slate-100 text-slate-500"}`}>
          {isDark ? (
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

export default ManajemenTopbar;