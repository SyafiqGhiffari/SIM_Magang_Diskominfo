import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getUser } from "../../utils/authStorage";
import { getMateriPeserta } from "../../services/pembelajaranService";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { toastSuccess } from "../../utils/swal";

// Sub-components
import MateriCard from "../../components/manajemen/peserta/pembelajaran/MateriCard";
import DetailMateriModal from "../../components/manajemen/peserta/pembelajaran/DetailMateriModal";
import { CustomSelectDropdown } from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";

// Icons
import {
  BookOpenText,
  FolderTree,
  GraduationCap,
  CheckCircle2,
  FileClock,
  FileCheckCorner,
  Video,
  Presentation,
  FileText,
  Link2,
  Search,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Tags,
  Eye,
  Clock,
  RotateCcw,
  Sparkles,
  Inbox,
  Layers,
  Code,
  Shield,
  Palette,
  BookOpen,
} from "lucide-react";

const KATEGORI_ICONS = {
  Onboarding: Sparkles,
  "Pemrograman & Web": Code,
  "Jaringan & Keamanan": Shield,
  "Tata Kelola & SOP": Layers,
  "Desain & Multimedia": Palette,
};

const MEDIA_OPTIONS = [
  { value: "semua", label: "Semua Format Media" },
  { value: "dokumen", label: "Dokumen PDF / Berkas" },
  { value: "video", label: "Video Pembelajaran" },
  { value: "slide", label: "Slide Presentasi" },
  { value: "tautan", label: "Tautan Daring" },
];

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua Status Belajar" },
  { value: "belum", label: "Belum Dipelajari" },
  { value: "selesai", label: "Sudah Selesai" },
];

export const PesertaMateriPage = () => {
  const { isDark } = useManajemenTheme();
  const user = getUser();

  // State data utama
  const [materiList, setMateriList] = useState([]);
  const [bidangPeserta, setBidangPeserta] = useState(user?.posisi_bidang || "");
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState("semua");
  const [filterMedia, setFilterMedia] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua"); // "semua" | "belum" | "selesai"

  // View mode: "grid" (kartu) vs "list" (silabus)
  const [viewMode, setViewMode] = useState("grid");

  // Modal Detail & In-App Reader
  const [selectedMateriDetail, setSelectedMateriDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Ref scroll toolbar
  const toolbarRef = useRef(null);

  // Horizontal scroll helper untuk Pills Kategori
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Progress belajar: localStorage persistence per user id
  const storageKey = `sim_magang_materi_selesai_${user?.id || "peserta"}`;
  const [selesaiIds, setSelesaiIds] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleToggleSelesai = useCallback(
    (materiId) => {
      setSelesaiIds((prev) => {
        let next;
        if (prev.includes(materiId)) {
          next = prev.filter((id) => id !== materiId);
          toastSuccess("Status modul diubah menjadi belum selesai");
        } else {
          next = [...prev, materiId];
          toastSuccess("Modul berhasil ditandai selesai dipelajari");
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          console.error("Gagal menyimpan riwayat belajar:", e);
        }
        return next;
      });
    },
    [storageKey]
  );

  // Fetch data dari endpoint peserta
  const fetchMateri = useCallback(async () => {
    try {
      const res = await getMateriPeserta();
      const rawData = res.data?.data;
      const list = Array.isArray(rawData) ? rawData : rawData?.materi || [];
      setMateriList(list);
      if (rawData?.bidang) {
        setBidangPeserta(rawData.bidang);
      }
    } catch (err) {
      console.error("Gagal memuat materi pembelajaran:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchMateri();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchMateri]);

  // Ringkasan Kategori beserta hitungan jumlah modul
  const kategoriListWithCounts = useMemo(() => {
    const map = {};
    materiList.forEach((m) => {
      if (m.kategori) {
        map[m.kategori] = (map[m.kategori] || 0) + 1;
      }
    });
    return Object.keys(map).map((nama) => ({
      nama,
      total: map[nama],
    }));
  }, [materiList]);

  // Scroll checker untuk category pills
  const checkCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isOverflowing =
      scrollWidth > clientWidth + 2 || (kategoriListWithCounts.length >= 4 && clientWidth > 0);
    setHasOverflow(isOverflowing);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(
      isOverflowing && (scrollWidth <= clientWidth || scrollLeft < scrollWidth - clientWidth - 4)
    );
  }, [kategoriListWithCounts.length]);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    checkCategoryScroll();

    const mo = new MutationObserver(() => checkCategoryScroll());
    mo.observe(el, { childList: true, subtree: true });

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => checkCategoryScroll());
      ro.observe(el);
      if (el.parentElement) ro.observe(el.parentElement);
    }

    el.addEventListener("scroll", checkCategoryScroll, { passive: true });
    window.addEventListener("resize", checkCategoryScroll);

    const t1 = setTimeout(checkCategoryScroll, 100);
    const t2 = setTimeout(checkCategoryScroll, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      mo.disconnect();
      if (ro) ro.disconnect();
      el.removeEventListener("scroll", checkCategoryScroll);
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [checkCategoryScroll, kategoriListWithCounts, loading]);

  const handleScrollCategory = (direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Filtered List
  const filteredMateri = useMemo(() => {
    return materiList.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.judul?.toLowerCase().includes(q) ||
        item.deskripsi?.toLowerCase().includes(q) ||
        item.kategori?.toLowerCase().includes(q) ||
        item.mentor?.nama?.toLowerCase().includes(q);

      const matchKategori =
        selectedKategori === "semua" || item.kategori === selectedKategori;

      const matchMedia =
        filterMedia === "semua" || (item.tipe_media || "dokumen") === filterMedia;

      const isItemSelesai = selesaiIds.includes(item.id);
      const matchStatus =
        filterStatus === "semua" ||
        (filterStatus === "selesai" && isItemSelesai) ||
        (filterStatus === "belum" && !isItemSelesai);

      return matchSearch && matchKategori && matchMedia && matchStatus;
    });
  }, [materiList, search, selectedKategori, filterMedia, filterStatus, selesaiIds]);

  // Statistik Modul untuk 4 Kartu KPI
  const stats = useMemo(() => {
    const total = materiList.length;

    const selesaiValid = selesaiIds.filter((id) =>
      materiList.some((m) => m.id === id)
    ).length;

    const belumValid = Math.max(0, total - selesaiValid);
    const persen = total > 0 ? Math.round((selesaiValid / total) * 100) : 0;

    return {
      total,
      belum: belumValid,
      selesai: selesaiValid,
      totalKategori: kategoriListWithCounts.length,
      persen,
    };
  }, [materiList, selesaiIds, kategoriListWithCounts.length]);

  // 4 Kartu Metrik KPI Stat
  const statCards = [
    {
      icon: BookOpenText,
      label: "Total Modul",
      desktopLabel: "Total Modul Materi",
      value: stats.total,
      caption: "Modul materi aktif",
      mobileCaption: "Modul aktif",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: FileClock,
      label: "Belum Selesai",
      desktopLabel: "Belum Dipelajari",
      value: stats.belum,
      caption: `${stats.belum} modul perlu dipelajari`,
      mobileCaption: `${stats.belum} perlu dipelajari`,
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: FileCheckCorner,
      label: "Selesai",
      desktopLabel: "Selesai Dipelajari",
      value: stats.selesai,
      caption: `${stats.selesai} dari ${stats.total} modul selesai`,
      mobileCaption: `${stats.selesai} selesai`,
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: FolderTree,
      label: "Kategori",
      desktopLabel: "Kategori Modul",
      value: stats.totalKategori,
      caption: "Topik materi pembelajaran",
      mobileCaption: "Topik materi",
      lightGradient: "from-purple-300 to-white",
      gradient: "from-purple-500 to-indigo-600",
      iconBg: isDark ? "bg-purple-950/60 text-purple-400" : "bg-purple-50 text-purple-600",
    },
  ];

  const handleOpenDetail = (materi) => {
    setSelectedMateriDetail(materi);
    setDetailModalOpen(true);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedKategori("semua");
    setFilterMedia("semua");
    setFilterStatus("semua");
  };

  return (
    <PesertaLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── HEADER HALAMAN ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Modul &amp; Materi Pembelajaran
          </h2>
          <p
            className={`mt-1 text-xs max-w-5xl leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Tingkatkan wawasan teknis, pemahaman standar dinas, dan kompetensi kerja selama magang dengan mempelajari modul resmi yang disediakan mentor dan instruktur dinas.
          </p>
        </div>

        {/* ── 4 KARTU STATISTIK KPI ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((c, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
                isDark
                  ? "border-white/10 bg-[#161b22]"
                  : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
              }`}
            >
              <div
                className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                  isDark
                    ? "opacity-[0.16] group-hover:opacity-[0.26]"
                    : "opacity-[0.3] group-hover:opacity-[0.4]"
                }`}
              />
              <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <span className="inline sm:hidden">{c.label}</span>
                    <span className="hidden sm:inline">{c.desktopLabel}</span>
                  </p>
                  <h3
                    className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl font-black tracking-tight ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    {c.value}
                  </h3>
                  <p
                    className={`mt-1 text-[8.5px] sm:text-xs font-medium leading-snug truncate ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    <span className="inline sm:hidden">{c.mobileCaption}</span>
                    <span className="hidden sm:inline">{c.caption}</span>
                  </p>
                </div>
                <span
                  className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
                >
                  <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                </span>
              </div>
              <div
                className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
              />
            </div>
          ))}
        </div>

        {/* ── TOOLBAR PENCARIAN, FILTER & KONTROL TAMPILAN (BOX TERPADU) ── */}
        <div
          ref={toolbarRef}
          className={`p-3.5 sm:p-4 rounded-2xl border space-y-3.5 shadow-xs transition-all duration-300 scroll-mt-20 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Baris 1: Search, Dropdowns, dan View Mode Toggle */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Input Pencarian dengan Focus Line Animation */}
            <div
              className={`group relative flex-1 shrink-0 transition-transform duration-200 ${
                isSearchFocused ? "scale-[1.005]" : ""
              }`}
            >
              <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 transition-all duration-200 pointer-events-none ${
                  isSearchFocused
                    ? isDark
                      ? "text-[#00A5EC] scale-110"
                      : "text-[#004F9F] scale-110"
                    : "text-slate-400"
                }`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Cari materi berdasarkan judul, deskripsi, topik, atau pengampu..."
                className={`w-full h-9 sm:h-[38px] rounded-xl border pl-9 sm:pl-10 pr-9 text-[11px] sm:text-xs font-medium outline-hidden transition-all duration-200 ${
                  isDark
                    ? isSearchFocused
                      ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-4 ring-[#00A5EC]/20"
                      : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                    : isSearchFocused
                    ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15 text-slate-700"
                    : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                    isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Hapus Pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span
                className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                  isSearchFocused ? "w-[calc(100%-12px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                }`}
              />
            </div>

            {/* Dropdowns Filter & View Mode */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Filter Format Media */}
              <CustomSelectDropdown
                value={filterMedia}
                onChange={setFilterMedia}
                options={MEDIA_OPTIONS}
                icon={Video}
                isDark={isDark}
                menuWidth={195}
              />

              {/* Filter Status Belajar */}
              <CustomSelectDropdown
                value={filterStatus}
                onChange={setFilterStatus}
                options={STATUS_OPTIONS}
                icon={CheckCircle2}
                isDark={isDark}
                menuWidth={195}
              />

              {/* View Mode Toggle: Grid vs Silabus List */}
              <div
                className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
                  isDark
                    ? "border-white/10 bg-white/5"
                    : "border-slate-200/80 bg-slate-100/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Kartu Grid"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    viewMode === "grid"
                      ? isDark
                        ? "bg-slate-800 text-[#00A5EC] shadow-xs"
                        : "bg-white text-[#004F9F] shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kartu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="Tampilan Silabus Kurikulum"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    viewMode === "list"
                      ? isDark
                        ? "bg-slate-800 text-[#00A5EC] shadow-xs"
                        : "bg-white text-[#004F9F] shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Silabus</span>
                </button>
              </div>
            </div>
          </div>

          {/* Baris 2: Category Pills dengan Horizontal Scroll (Persis Mentor) */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Fixed Label Chip */}
            <div className="flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 text-[11px] font-bold shrink-0 shadow-2xs">
              <Tags className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Kategori:</span>
            </div>

            {/* Scroll Button Left */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => handleScrollCategory("left")}
                disabled={!canScrollLeft}
                aria-label="Geser kategori ke kiri"
                title="Geser kategori ke kiri"
                className={`flex h-7.5 w-7 items-center justify-center rounded-xl border shrink-0 transition-all duration-200 select-none ${
                  canScrollLeft
                    ? isDark
                      ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/10 hover:text-[#00A5EC] hover:border-[#00A5EC]/40 shadow-xs cursor-pointer active:scale-90"
                      : "border-slate-200/90 bg-white text-slate-600 hover:bg-blue-50/70 hover:text-[#004F9F] hover:border-[#004F9F]/30 shadow-2xs cursor-pointer active:scale-90"
                    : isDark
                    ? "border-transparent bg-white/5 text-slate-600 cursor-not-allowed opacity-35"
                    : "border-transparent bg-slate-100/60 text-slate-300 cursor-not-allowed opacity-35"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={categoryScrollRef}
              onMouseEnter={checkCategoryScroll}
              className="flex-1 flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none scroll-smooth min-w-0 xl:overflow-x-visible"
            >
              {/* Pill 'Semua Modul' */}
              <button
                type="button"
                onClick={() => setSelectedKategori("semua")}
                className={`group inline-flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                  selectedKategori === "semua"
                    ? isDark
                      ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                      : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                    : isDark
                    ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                    : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                } hover:-translate-y-0.5 active:scale-95`}
              >
                <span>Semua Modul</span>
                <span
                  className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                    selectedKategori === "semua"
                      ? isDark
                        ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                        : "bg-[#004F9F] text-white shadow-2xs"
                      : isDark
                      ? "bg-white/10 text-sky-400 border border-white/10"
                      : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                  }`}
                >
                  {materiList.length}
                </span>
              </button>

              {/* Pills Daftar Kategori */}
              {kategoriListWithCounts.map((kat) => {
                const isAktif = selectedKategori === kat.nama;
                return (
                  <button
                    key={kat.nama}
                    type="button"
                    onClick={() => setSelectedKategori(kat.nama)}
                    className={`group inline-flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{kat.nama}</span>
                    <span
                      className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                            : "bg-[#004F9F] text-white shadow-2xs"
                          : isDark
                          ? "bg-white/10 text-sky-400 border border-white/10"
                          : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {kat.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Button Right */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => handleScrollCategory("right")}
                disabled={!canScrollRight}
                aria-label="Geser kategori ke kanan"
                title="Geser kategori ke kanan"
                className={`flex h-7.5 w-7 items-center justify-center rounded-xl border shrink-0 transition-all duration-200 select-none ${
                  canScrollRight
                    ? isDark
                      ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/10 hover:text-[#00A5EC] hover:border-[#00A5EC]/40 shadow-xs cursor-pointer active:scale-90"
                      : "border-slate-200/90 bg-white text-slate-600 hover:bg-blue-50/70 hover:text-[#004F9F] hover:border-[#004F9F]/30 shadow-2xs cursor-pointer active:scale-90"
                    : isDark
                    ? "border-transparent bg-white/5 text-slate-600 cursor-not-allowed opacity-35"
                    : "border-transparent bg-slate-100/60 text-slate-300 cursor-not-allowed opacity-35"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── KONTEN MATERI (GRID ATAU SILABUS LIST) ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-7 w-7 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat kurikulum materi pembelajaran...</p>
          </div>
        ) : filteredMateri.length === 0 ? (
          <div
            key={`empty-${selectedKategori}-${filterMedia}-${filterStatus}`}
            className={`flex flex-col items-center justify-center gap-3 py-20 text-center rounded-3xl border shadow-xs animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both] ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {materiList.length === 0
                  ? "Belum Ada Modul Materi Pembelajaran"
                  : "Tidak ada modul materi yang sesuai filter"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {materiList.length === 0
                  ? "Materi pembelajaran akan ditampilkan di sini setelah dibagikan oleh mentor pembimbing atau admin dinas Anda."
                  : "Kriteria pencarian atau filter yang Anda terapkan tidak menghasilkan modul apapun. Coba sesuaikan kata kunci atau reset filter."}
              </p>
            </div>
            {materiList.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50/80 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 hover:bg-blue-100/90 dark:hover:bg-sky-900/60 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-90" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* TAMPILAN 1: GRID KARTU */
          <div
            key="view-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            {filteredMateri.map((materi) => (
              <MateriCard
                key={materi.id}
                materi={materi}
                isSelesai={selesaiIds.includes(materi.id)}
                onSelect={handleOpenDetail}
                onToggleSelesai={handleToggleSelesai}
                isDark={isDark}
                userBidang={bidangPeserta}
              />
            ))}
          </div>
        ) : (
          /* TAMPILAN 2: SILABUS LIST VIEW (TABEL KURIKULUM) */
          <div
            key="view-list"
            className={`rounded-2xl sm:rounded-3xl border overflow-hidden shadow-xs animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both] ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? "border-white/10 bg-white/[0.03] text-slate-400"
                        : "border-slate-100 bg-slate-50/70 text-slate-500"
                    }`}
                  >
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] w-12 text-center">
                      #
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[260px]">
                      Modul Pembelajaran
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[130px]">
                      Kategori &amp; Format
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[130px]">
                      Sasaran Bidang
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[150px]">
                      Pengampu / Mentor
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[110px] text-center">
                      Status Belajar
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] text-right min-w-[80px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                  {filteredMateri.map((materi, idx) => {
                    const isSelesai = selesaiIds.includes(materi.id);
                    const CategoryIcon = KATEGORI_ICONS[materi.kategori] || BookOpen;

                    return (
                      <tr
                        key={materi.id}
                        className={`transition-colors group hover:bg-blue-50/40 dark:hover:bg-white/[0.02] ${
                          isSelesai ? (isDark ? "bg-emerald-950/10" : "bg-emerald-50/20") : ""
                        }`}
                      >
                        {/* Kolom 1: Nomor */}
                        <td className="py-3 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Kolom 2: Judul & Deskripsi */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(materi)}
                              className="font-black text-slate-900 dark:text-slate-100 text-[13px] hover:text-[#004F9F] dark:hover:text-[#00A5EC] text-left transition-colors cursor-pointer line-clamp-1"
                            >
                              {materi.judul}
                            </button>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-normal">
                              {materi.deskripsi || "Modul panduan dan materi teknis magang."}
                            </p>
                          </div>
                        </td>

                        {/* Kolom 3: Kategori & Format */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/40">
                              <CategoryIcon className="w-3 h-3 text-[#00A5EC]" />
                              {materi.kategori || "Umum"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                              {materi.tipe_media === "video" ? (
                                <Video className="w-3 h-3 text-rose-500" />
                              ) : materi.tipe_media === "slide" ? (
                                <Presentation className="w-3 h-3 text-amber-500" />
                              ) : materi.tipe_media === "tautan" ? (
                                <Link2 className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <FileText className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                              )}
                              <span>{materi.tipe_media || "dokumen"}</span>
                            </span>
                          </div>
                        </td>

                        {/* Kolom 4: Sasaran Bidang */}
                        <td className="py-3 px-4">
                          {materi.posisi_bidang && materi.posisi_bidang !== "semua" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                              <GraduationCap className="w-3 h-3" />
                              {materi.posisi_bidang}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Semua Bidang
                            </span>
                          )}
                        </td>

                        {/* Kolom 5: Pengampu / Mentor */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {materi.mentor?.nama ? (
                              <span className="font-bold truncate max-w-[140px]">
                                {materi.mentor.nama}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                                Instruktur Diskominfo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatTanggalPresensi(materi.created_at)}
                          </span>
                        </td>

                        {/* Kolom 6: Status Belajar */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelesai(materi.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer active:scale-95 ${
                              isSelesai
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40"
                                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200/60 dark:border-white/10"
                            }`}
                            title={isSelesai ? "Klik untuk ubah belum selesai" : "Klik untuk tandai selesai"}
                          >
                            {isSelesai ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Selesai</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Belum</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Kolom 7: Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(materi)}
                              className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 hover:bg-[#004F9F] hover:text-white dark:hover:bg-[#00A5EC] dark:hover:text-slate-950 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs"
                              title="Pelajari Modul"
                              aria-label="Pelajari Modul"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL DETAIL & IN-APP READER ── */}
        <DetailMateriModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          materi={selectedMateriDetail}
          isSelesai={selectedMateriDetail ? selesaiIds.includes(selectedMateriDetail.id) : false}
          onToggleSelesai={handleToggleSelesai}
          isDark={isDark}
        />
      </div>
    </PesertaLayout>
  );
};

export default PesertaMateriPage;
