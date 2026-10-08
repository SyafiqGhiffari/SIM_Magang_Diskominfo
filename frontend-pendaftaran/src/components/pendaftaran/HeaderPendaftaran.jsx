import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  X,
  Bell,
  CheckCheck,
  Home,
  FileText,
  AlertTriangle,
  Settings,
  KeyRound,
  Download,
  MessageSquare,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { getRelativeTime } from "../../utils/formatTime";

const QUICK_SEARCH_ITEMS = [
  { id: "dashboard", title: "Dashboard", desc: "Ringkasan status pendaftaran & timeline seleksi", tab: "dashboard", icon: Home, badge: "Menu", keywords: "status verifikasi jadwal pengumuman home beranda nomor registrasi diterima tolak" },
  { id: "form", title: "Formulir Magang", desc: "Isi data diri, bidang, dan unggah berkas", tab: "form", icon: FileText, badge: "Formulir", keywords: "daftar formulir pendaftaran apply submit data diri kampus sekolah cv proposal surat pengantar" },
  { id: "revisi", title: "Revisi Berkas", desc: "Perbaiki dokumen sesuai instruksi verifikator", tab: "revisi", icon: AlertTriangle, badge: "Perbaikan", keywords: "revisi perbaikan berkas koreksi unggah ulang catatan admin dokumen" },
  { id: "settings", title: "Kelola Akun", desc: "Perbarui foto profil, biodata diri, dan kontak", tab: "settings", icon: Settings, badge: "Akun", keywords: "profil foto biodata email telepon nomor hp institusi akun settings" },
  { id: "password", title: "Ubah Kata Sandi", desc: "Perbarui password login akun pendaftaran", tab: "settings", icon: KeyRound, badge: "Keamanan", keywords: "password sandi ganti kata sandi keamanan password baru" },
  { id: "surat", title: "Surat Penerimaan Resmi", desc: "Unduh surat penerimaan resmi bertanda tangan", tab: "dashboard", icon: Download, badge: "Unduhan", keywords: "surat penerimaan lolos seleksi diterima pdf download unduh berkas resmi" },
  { id: "chat", title: "Pusat Bantuan & FAQ", desc: "Tanya admin Diskominfo atau buka panduan FAQ", action: "chat", icon: MessageSquare, badge: "Bantuan", keywords: "chat bot faq tanya bantuan admin live pesan kendala pertanyaan kontak" },
];

const HeaderPendaftaran = ({
  currentTab,
  notifOpen,
  setNotifOpen,
  setAvatarOpen,
  notifRef,
  notifications = [],
  clock,
  fmtTime,
  fmtDate,
  isDark,
  setIsDark,
  hasReadNotif,
  onMarkAllRead,
  onMenuClick,
  searchValue = "",
  onSearchChange,
  onNavigateTab,
  onOpenChat,
}) => {
  const [internalSearch, setInternalSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const currentSearch = onSearchChange ? searchValue : internalSearch;

  const handleSearchChange = (val) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const searchResults = currentSearch.trim()
    ? QUICK_SEARCH_ITEMS.filter((item) => {
        const q = currentSearch.trim().toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q)
        );
      })
    : [];

  const handleSelectSearchResult = (item) => {
    handleSearchChange("");
    setMobileSearchOpen(false);
    setIsSearchFocused(false);
    if (item.action === "chat") {
      onOpenChat?.();
    } else if (item.tab) {
      onNavigateTab?.(item.tab);
    }
  };

  useEffect(() => {
    const fn = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false);
      }
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

  const unreadCount = !hasReadNotif ? notifications.length : 0;

  return (
    <header
      className={`sticky top-0 z-30 flex h-17 items-center justify-between gap-2 md:gap-4 border-b px-3 md:px-6 shadow-sm backdrop-blur-sm shrink-0 transition-colors duration-300 ${
        isDark ? "bg-[#161b22]/95 border-white/10" : "bg-white/95 border-slate-200/80"
      }`}
    >
      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        type="button"
        title="Buka Menu"
        className={`md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer active:scale-90 ${
          isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title & Subtitle */}
      <div className="leading-snug min-w-0 shrink-0 hidden sm:block">
        <h2 className={`text-sm font-black tracking-tight truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
          {currentTab?.title || "Portal Pendaftaran"}
        </h2>
        <p className={`text-[10px] font-sans truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {currentTab?.desc || "Sistem Informasi Magang Diskominfo Ponorogo"}
        </p>
      </div>

      {/* Desktop Search Bar */}
      <div className="flex-1 max-w-md hidden md:block relative" ref={desktopSearchRef}>
        <div className={`group relative rounded-xl transition-all duration-300 ${isSearchFocused ? "scale-[1.02]" : ""}`}>
          <span
            className={`absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${
              isSearchFocused
                ? "text-[#00A5EC] scale-110"
                : isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari fitur, formulir, revisi, akun, bantuan..."
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
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
          {currentSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className={`absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors cursor-pointer ${
                isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
              }`}
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

        {/* Desktop Search Results Dropdown */}
        {isSearchFocused && currentSearch.trim() && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${
              isDark ? "bg-[#1c2128] border-white/10 shadow-black/50" : "bg-white border-slate-200 shadow-slate-300/60"
            }`}
          >
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              <p className={`text-[9.5px] font-black uppercase tracking-wider px-3 py-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Hasil Pencarian ({searchResults.length})
              </p>
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                        isDark ? "hover:bg-white/5 text-slate-200" : "hover:bg-blue-50/60 text-slate-700"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isDark ? "bg-white/5 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate group-hover:text-[#00A5EC] transition-colors">{item.title}</p>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                            isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.desc}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#00A5EC] shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Tidak ada menu yang sesuai dengan "{currentSearch}".
                  </p>
                  <p className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Coba kata kunci lain seperti: "form", "revisi", "profil", "sandi", atau "bantuan".
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right Action Icons: Mobile Search, Notification, Live Clock, Theme Toggle */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Mobile Search Button */}
        <div className="relative md:hidden" ref={mobileSearchRef}>
          <button
            type="button"
            onClick={() => setMobileSearchOpen((p) => !p)}
            title="Cari"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              mobileSearchOpen
                ? isDark
                  ? "bg-white/10 text-[#00A5EC]"
                  : "bg-blue-50 text-[#004F9F]"
                : isDark
                ? "hover:bg-white/10 text-slate-300"
                : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {mobileSearchOpen && (
            <div
              className={`fixed left-3 right-3 top-[72px] z-50 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${
                isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"
              }`}
            >
              <div className="p-3">
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                    isDark ? "border-[#00A5EC]/40 bg-white/5" : "border-[#004F9F]/40 bg-blue-50/40"
                  }`}
                >
                  <Search className="w-4 h-4 shrink-0 text-slate-400" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Cari info pendaftaran..."
                    value={currentSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={`flex-1 min-w-0 bg-transparent text-xs font-medium outline-none ${
                      isDark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"
                    }`}
                  />
                  {currentSearch && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className={`shrink-0 transition-colors cursor-pointer ${
                        isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Search Results */}
                {currentSearch.trim() && (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSearchResult(item)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left cursor-pointer transition-all ${
                              isDark ? "hover:bg-white/5 text-slate-200" : "hover:bg-blue-50/60 text-slate-700"
                            }`}
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isDark ? "bg-white/5 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{item.title}</p>
                              <p className={`text-[9.5px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.desc}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#00A5EC] shrink-0" />
                          </button>
                        );
                      })
                    ) : (
                      <p className={`text-xs text-center py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Tidak ada menu yang cocok.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`md:hidden h-6 w-px mx-0.5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* Notifikasi Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((p) => !p);
              if (setAvatarOpen) setAvatarOpen(false);
            }}
            title="Notifikasi"
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              notifOpen
                ? isDark
                  ? "bg-[#00A5EC]/15 text-[#00A5EC]"
                  : "bg-blue-50 text-[#004F9F]"
                : isDark
                ? "text-slate-300 hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-4.5 h-4.5" />

            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-rose-500 px-[3px] text-[8.5px] font-bold leading-none tabular-nums text-white ring-[1.5px] ring-white shadow-sm dark:ring-[#161b22]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className={`fixed left-3 right-3 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[350px] md:w-[370px] z-50 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${
                isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"
              }`}
            >
              {/* Notif Header */}
              <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0B1442] via-[#123072] to-[#004F9F] px-4 py-3">
                <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/25 blur-2xl" />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                      <Bell className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-extrabold leading-tight text-white">Notifikasi Pendaftaran</span>
                      <span className="text-[9.5px] font-semibold leading-tight text-white/60">
                        {unreadCount > 0 ? `${unreadCount} pesan baru` : "Semua sudah dibaca"}
                      </span>
                    </span>
                  </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onMarkAllRead) onMarkAllRead();
                            setNotifOpen(false);
                          }}
                          title="Tandai semua dibaca"
                          className="group/baca flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-emerald-500 hover:text-white active:scale-90 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 transition-transform duration-200 group-hover/baca:scale-110" />
                        </button>
                      )}
                    </div>
                </div>
              </div>

              {/* Notif Content List */}
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                    <Bell className={`w-6 h-6 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  </div>
                  <p className={`text-xs font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>Tidak ada notifikasi aktif.</p>
                </div>
              ) : (
                <div className={`divide-y max-h-80 overflow-y-auto ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onMarkAllRead) onMarkAllRead();
                        if (n.targetTab && onNavigateTab) {
                          onNavigateTab(n.targetTab);
                        }
                        setNotifOpen(false);
                      }}
                      className={`group flex items-start gap-3 px-4 py-3.5 transition-all duration-200 cursor-pointer ${
                        isDark ? "hover:bg-white/5 active:bg-white/10" : "hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 shadow-sm ${
                          n.type === "success"
                            ? isDark
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-emerald-50 text-emerald-600"
                            : n.type === "error"
                            ? isDark
                              ? "bg-red-500/15 text-red-400"
                              : "bg-red-50 text-red-600"
                            : n.type === "warning"
                            ? isDark
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-amber-50 text-amber-600"
                            : n.type === "pending"
                            ? isDark
                              ? "bg-sky-500/15 text-sky-400"
                              : "bg-sky-50 text-sky-600"
                            : isDark
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {n.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!hasReadNotif && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${n.dot || "bg-blue-500"}`} />}
                          <p className={`text-[11.5px] font-extrabold break-words ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                            {n.title}
                          </p>
                        </div>
                        <p className={`text-[10.5px] leading-relaxed font-sans break-words ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {n.msg}
                        </p>
                        <p className={`text-[9px] mt-1 font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {getRelativeTime(n.timestamp)}
                        </p>
                      </div>
                      {n.targetTab && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-70 group-hover:translate-x-0 shrink-0 self-center text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Notif Footer */}
              <div
                className={`px-4 py-2.5 border-t flex items-center justify-center gap-1.5 ${
                  isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <p className={`text-[10px] text-center font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Sinkronisasi status otomatis realtime
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Realtime Live WIB Clock Pill */}
        <div className={`hidden sm:block h-6 w-px mx-0.5 md:mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        <div
          className={`hidden sm:flex flex-col items-end leading-tight px-2 md:px-3 py-1.5 rounded-xl ${
            isDark ? "bg-white/5" : "bg-slate-50"
          }`}
        >
          <span className={`text-[10px] md:text-[11px] font-black tabular-nums ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            {clock ? fmtTime(clock) : "--:--:--"}
          </span>
          <span className={`text-[9px] font-bold whitespace-nowrap ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {clock ? fmtDate(clock) : "WIB"}
          </span>
        </div>

        <div className={`h-6 w-px mx-0.5 md:mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* Toggle Dark / Light Theme */}
        <button
          type="button"
          onClick={() => setIsDark((p) => !p)}
          title={isDark ? "Mode Terang" : "Mode Gelap"}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
            isDark ? "bg-white/10 hover:bg-white/20 text-amber-400" : "hover:bg-slate-100 text-slate-500"
          }`}
        >
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

export default HeaderPendaftaran;