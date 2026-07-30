import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Menu, UserPlus, FileEdit, MessageSquare,
  UserCog, Award, Clock, CheckCheck, Bell, FileSignature, Trash2, BellOff,
} from "lucide-react";
import {
  getNotifikasi, bacaNotifikasi, bacaSemuaNotifikasi,
  hapusNotifikasi, hapusSemuaNotifikasi,
} from "../../../../services/notifikasiService";

const NOTIF_META = {
  pendaftaran_baru:        { icon: UserPlus,        color: "text-emerald-500", bg: "bg-emerald-500/10" },
  revisi_dokumen:          { icon: FileEdit,        color: "text-amber-500",   bg: "bg-amber-500/10" },
  chat_baru:               { icon: MessageSquare,   color: "text-sky-500",     bg: "bg-sky-500/10" },
  akun_belum_dibuat:       { icon: UserCog,         color: "text-violet-500",  bg: "bg-violet-500/10" },
  mentor_belum_ditugaskan: { icon: UserCog,         color: "text-rose-500",    bg: "bg-rose-500/10" },
  sertifikat_pending:      { icon: Award,           color: "text-yellow-500",  bg: "bg-yellow-500/10" },
  pendaftaran_tertunda:    { icon: Clock,           color: "text-orange-500",  bg: "bg-orange-500/10" },
  surat_belum_terbit:      { icon: FileSignature,   color: "text-amber-600",   bg: "bg-amber-500/10" },
  sistem:                  { icon: Bell,            color: "text-slate-400",   bg: "bg-slate-500/10" },
};

const waktuRelatif = (iso) => {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  if (detik < 604800) return `${Math.floor(detik / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const ManajemenTopbar = ({ currentTab, searchValue, onSearchChange, isDark, setIsDark, onMenuClick }) => {
  const [clock, setClock] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState(searchValue ?? "");
  const notifRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [notifList, setNotifList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearchChange = (val) => {
    setInternalSearch(val);
    onSearchChange?.(val);
  };

  // Loader murni: TIDAK memanggil setState secara sinkron — semua setState
  // terjadi setelah await, sehingga aman dipakai di dalam callback timer.
  const muatNotifikasi = useCallback(async () => {
    try {
      const res = await getNotifikasi({ limit: 15 });
      const data = res.data?.data ?? {};
      setNotifList(data.items ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // diamkan: notifikasi tidak boleh mengganggu alur utama
    }
  }, []);

  // Polling tiap 45 detik.
  // Muatan pertama dijadwalkan lewat setTimeout(0) supaya tidak ada setState
  // sinkron di badan efek (mencegah cascading render).
  useEffect(() => {
    const timerAwal = setTimeout(() => {
      muatNotifikasi();
    }, 0);

    const interval = setInterval(() => {
      muatNotifikasi();
    }, 45000);

    return () => {
      clearTimeout(timerAwal);
      clearInterval(interval);
    };
  }, [muatNotifikasi]);

  // Buka/tutup dropdown + segarkan data saat dibuka.
  // Ini event handler, bukan efek, jadi setState di sini memang tempatnya.
  const bukaTutupNotif = async () => {
    const akanDibuka = !notifOpen;
    setNotifOpen(akanDibuka);
    if (!akanDibuka) return;

    setNotifLoading(true);
    await muatNotifikasi();
    setNotifLoading(false);
  };

  const handleKlikNotif = async (n) => {
    setNotifOpen(false);
    if (!n.dibaca_pada) {
      setNotifList((p) => p.map((x) => (x.id === n.id ? { ...x, dibaca_pada: new Date().toISOString() } : x)));
      setUnreadCount((p) => Math.max(0, p - 1));
      try { await bacaNotifikasi(n.id); } catch { /* abaikan */ }
    }
    if (n.url_tujuan) navigate(n.url_tujuan);
  };

  const handleBacaSemua = async () => {
    const now = new Date().toISOString();
    setNotifList((p) => p.map((x) => (x.dibaca_pada ? x : { ...x, dibaca_pada: now })));
    setUnreadCount(0);
    try { await bacaSemuaNotifikasi(); } catch { muatNotifikasi(); }
  };

  // Hapus satu notifikasi. stopPropagation supaya tidak ikut membuka url tujuan.
  const handleHapusNotif = async (e, n) => {
    e.stopPropagation();
    setNotifList((p) => p.filter((x) => x.id !== n.id));
    if (!n.dibaca_pada) setUnreadCount((p) => Math.max(0, p - 1));
    try { await hapusNotifikasi(n.id); } catch { muatNotifikasi(); }
  };

  const handleHapusSemua = async () => {
    setNotifList([]);
    setUnreadCount(0);
    try { await hapusSemuaNotifikasi(); } catch { muatNotifikasi(); }
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
          <button onClick={bukaTutupNotif}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"} ${notifOpen ? (isDark ? "bg-white/10" : "bg-slate-100") : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-rose-500 px-[3px] text-[8.5px] font-bold leading-none tabular-nums text-white ring-[1.5px] ring-white shadow-sm dark:ring-[#161b22]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={`absolute right-0 top-12 z-50 w-72 rounded-2xl border shadow-2xl overflow-hidden animate-[fadeslide_0.2s_ease-out] ${isDark ? "bg-[#1c2128] border-white/10 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/70"}`}>
              <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0B1442] via-[#123072] to-[#004F9F] px-4 py-3">
                <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/25 blur-2xl" />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                      <Bell className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-extrabold leading-tight text-white">Notifikasi</span>
                      <span className="text-[9.5px] font-semibold leading-tight text-white/60">
                        {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleBacaSemua}
                        title="Tandai semua sudah dibaca"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notifList.length > 0 && (
                      <button
                        onClick={handleHapusSemua}
                        title="Hapus semua notifikasi"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-rose-500/80 hover:text-white cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {notifLoading && notifList.length === 0 ? (
                <div className="py-10 text-center">
                  <p className={`text-xs font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>Memuat notifikasi…</p>
                </div>
              ) : notifList.length === 0 ? (
                <div className="py-10 text-center">
                  <div className={`mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? "bg-white/5 ring-1 ring-white/10" : "bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200"}`}>
                    <BellOff className={`w-6 h-6 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  </div>
                  <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Tidak ada notifikasi</p>
                  <p className={`mt-0.5 text-[10.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Semua pekerjaan Anda sudah tertangani.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifList.map((n) => {
                    const meta = NOTIF_META[n.tipe] ?? NOTIF_META.sistem;
                    const Icon = meta.icon;
                    const belumDibaca = !n.dibaca_pada;
                    return (
                      <div
                        key={n.id}
                        className={`group/notif relative flex items-start border-b transition-colors ${
                          isDark
                            ? `border-white/5 hover:bg-white/5 ${belumDibaca ? "bg-white/[0.03]" : ""}`
                            : `border-slate-100 hover:bg-slate-50/80 ${belumDibaca ? "bg-sky-50/40" : ""}`
                        }`}
                      >
                        {belumDibaca && (
                          <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
                        )}

                        <button
                          onClick={() => handleKlikNotif(n)}
                          className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3 pr-1 text-left cursor-pointer"
                        >
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/notif:scale-105 ${meta.bg}`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`truncate text-[11px] font-extrabold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                                {n.judul}
                              </span>
                              {belumDibaca && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />}
                            </span>
                            <span className={`mt-0.5 block text-[10.5px] leading-snug ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {n.pesan}
                            </span>
                            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                            }`}>
                              <Clock className="w-2.5 h-2.5" />
                              {waktuRelatif(n.created_at)}
                            </span>
                          </span>
                        </button>

                        <button
                          onClick={(e) => handleHapusNotif(e, n)}
                          title="Hapus notifikasi"
                          className={`mr-2.5 mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all duration-200 group-hover/notif:opacity-100 focus:opacity-100 cursor-pointer ${
                            isDark
                              ? "text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                              : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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