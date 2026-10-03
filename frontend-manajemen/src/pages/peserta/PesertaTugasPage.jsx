import { useState, useEffect, useCallback, useMemo } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import TugasStatCards from "../../components/manajemen/peserta/pembelajaran/TugasStatCards";
import TugasCard from "../../components/manajemen/peserta/pembelajaran/TugasCard";
import KumpulTugasModal from "../../components/manajemen/peserta/pembelajaran/KumpulTugasModal";
import KerjakanKuisModal from "../../components/manajemen/peserta/pembelajaran/KerjakanKuisModal";
import { getTugasPeserta } from "../../services/pembelajaranService";
import { getFileUrl } from "../../utils/fileUrl";
import { CustomSelectDropdown } from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";
import {
  Inbox,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Upload,
  Eye,
  CirclePlay,
  BookType,
  Search,
  X,
  FilePenLine,
  NotebookPen,
} from "lucide-react";

// Format tanggal dan jam tenggat waktu (Lengkap dengan jam WIB)
const formatDeadlineText = (dateStr) => {
  if (!dateStr) return "Tanpa Batas";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateFormatted}, ${hours}:${minutes} WIB`;
  } catch {
    return dateStr;
  }
};

const TIPE_OPTIONS = [
  { value: "semua", label: "Semua Tipe Tugas" },
  { value: "berkas", label: "Tugas Proyek" },
  { value: "kuis", label: "Tugas Kuis" },
];

export const PesertaTugasPage = () => {
  const { isDark } = useManajemenTheme();

  const [tugasList, setTugasList] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua"); // "semua" | "belum_kumpul" | "menunggu" | "revisi" | "dinilai"
  const [filterTipe, setFilterTipe] = useState("semua"); // "semua" | "berkas" | "kuis"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Selected for Modals
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [selectedKuis, setSelectedKuis] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchTugas = useCallback(async () => {
    try {
      const res = await getTugasPeserta();
      const rawData = res.data?.data;
      if (Array.isArray(rawData)) {
        setTugasList(rawData);
      } else if (rawData?.tugas && Array.isArray(rawData.tugas)) {
        setTugasList(rawData.tugas);
        if (rawData.statistik) {
          setStatsData(rawData.statistik);
        }
      } else {
        setTugasList([]);
      }
    } catch (err) {
      console.error("Gagal memuat daftar tugas peserta:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchTugas();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchTugas, reloadKey]);

  // Filtered & Searched List
  const filteredTugas = useMemo(() => {
    return tugasList.filter((item) => {
      // 1. Pencarian
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.judul?.toLowerCase().includes(q) ||
        item.deskripsi?.toLowerCase().includes(q) ||
        item.mentor?.nama?.toLowerCase().includes(q);

      // 2. Filter Status
      const statusP = item.pengumpulan?.status;
      const matchStatus =
        filterStatus === "semua" ||
        (filterStatus === "belum_kumpul" && !item.pengumpulan) ||
        (filterStatus === "menunggu" && statusP === "menunggu") ||
        (filterStatus === "revisi" && (statusP === "revisi" || item.status_tugas === "revisi")) ||
        (filterStatus === "dinilai" && statusP === "dinilai");

      // 3. Filter Tipe Penugasan
      const tipe = item.tipe_tugas || "berkas";
      const matchTipe =
        filterTipe === "semua" ||
        (filterTipe === "kuis" && tipe === "kuis") ||
        (filterTipe === "berkas" && (tipe === "berkas" || tipe === "proyek"));

      return matchSearch && matchStatus && matchTipe;
    });
  }, [tugasList, searchQuery, filterStatus, filterTipe]);

  // Statistik Dinamis
  const stats = useMemo(() => {
    const total = tugasList.length;
    let selesai = 0;
    let menunggu = 0;
    let revisi = 0;
    let totalNilai = 0;
    let dinilaiCount = 0;

    tugasList.forEach((t) => {
      const p = t.pengumpulan;
      if (p?.status === "dinilai") {
        selesai++;
        if (p.nilai !== null && p.nilai !== undefined) {
          totalNilai += Number(p.nilai);
          dinilaiCount++;
        }
      } else if (p?.status === "menunggu") {
        menunggu++;
      } else if (p?.status === "revisi" || t.status_tugas === "revisi") {
        revisi++;
      }
    });

    const belum = total - selesai - menunggu - revisi;
    const rataNilai =
      statsData?.rata_rata_nilai !== undefined
        ? statsData.rata_rata_nilai
        : dinilaiCount > 0
        ? totalNilai / dinilaiCount
        : null;

    return { total, belum: Math.max(0, belum), menunggu, revisi, selesai, rataNilai };
  }, [tugasList, statsData]);

  // Tugas Urgent / Mendekati Tenggat Waktu (< 48 Jam & Belum Kumpul)
  const urgentTask = useMemo(() => {
    const now = new Date();
    return tugasList.find((t) => {
      if (t.pengumpulan) return false;
      if (!t.tenggat_waktu) return false;
      const dl = new Date(t.tenggat_waktu);
      const diffHours = (dl.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 48;
    });
  }, [tugasList]);

  // Reset Filters
  const isFilterActive = searchQuery !== "" || filterStatus !== "semua" || filterTipe !== "semua";
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("semua");
    setFilterTipe("semua");
  };

  const handleOpenAction = (item) => {
    if (item.tipe_tugas === "kuis") {
      setSelectedKuis(item);
    } else {
      setSelectedTugas(item);
    }
  };

  return (
    <PesertaLayout searchValue={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── HEADER HALAMAN ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Tugas &amp; Penugasan Magang
          </h2>
          <p
            className={`mt-1 text-xs max-w-5xl leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Kerjakan instruksi proyek dan kuis interaktif dari mentor pembimbing secara terstruktur untuk mengukur capaian kompetensi magang Diskominfo.
          </p>
        </div>

        {/* ===== 2. SMART DEADLINE ALERT BANNER ===== */}
        {urgentTask && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-[tabEnter_0.35s_ease-out]">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="w-4.5 h-4.5 animate-pulse" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                    Mendekati Tenggat Waktu
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Batas: {formatDeadlineText(urgentTask.tenggat_waktu)}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate mt-1">
                  {urgentTask.judul}
                </h4>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
                  Segera selesaikan dan kirimkan jawaban sebelum batas pengumpulan berakhir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAction(urgentTask)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
            >
              <span>Kerjakan Sekarang</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ===== 3. METRIC STAT CARDS ===== */}
        <TugasStatCards
          stats={stats}
          onFilterClick={(id) => setFilterStatus(id)}
        />

        {/* ===== 4. FILTER BAR & CONTROLS (STYLE REVIEW TUGAS MENTOR + DROPDOWN MATERI) ===== */}
        <div
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border shadow-xs transition-all duration-300 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
            {/* Status Tabs (Style & Animasi Persis Halaman Review Tugas Mentor) */}
            <div className="flex items-center gap-1.5 overflow-x-auto lg:overflow-x-visible py-1 custom-scrollbar scrollbar-none">
              {[
                { key: "semua", label: "Semua", count: stats.total },
                { key: "belum_kumpul", label: "Belum Kumpul", count: stats.belum },
                { key: "menunggu", label: "Menunggu Review", count: stats.menunggu },
                { key: "revisi", label: "Perlu Revisi", count: stats.revisi, hideIfZero: true },
                { key: "dinilai", label: "Sudah Dinilai", count: stats.selesai },
              ]
                .filter((tab) => !tab.hideIfZero || tab.count > 0)
                .map((tab) => {
                  const isAktif = filterStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilterStatus(tab.key)}
                      className={`group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                            : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                          : isDark
                          ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                          : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                      } hover:-translate-y-0.5 active:scale-95`}
                    >
                      <span>{tab.label}</span>
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
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* Sisi Kanan: Search Input + Dropdown Tipe (Materi Page Style) + Toggle View + Reset */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Kolom Pencarian (Style & Focus Line Animasi Persis Halaman Materi) */}
              <div
                className={`group relative w-full sm:w-48 md:w-56 lg:w-60 transition-transform duration-200 ${
                  isSearchFocused ? "scale-[1.005]" : ""
                }`}
              >
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 pointer-events-none ${
                    isSearchFocused
                      ? isDark
                        ? "text-[#00A5EC] scale-110"
                        : "text-[#004F9F] scale-110"
                      : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari tugas / kuis..."
                  className={`w-full h-7.5 sm:h-8 rounded-xl border pl-8.5 pr-7 text-[11px] font-medium outline-hidden transition-all duration-200 ${
                    isDark
                      ? isSearchFocused
                        ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-3 ring-[#00A5EC]/20"
                        : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                      : isSearchFocused
                      ? "border-[#004F9F] bg-white shadow-md ring-3 ring-[#00A5EC]/15 text-slate-700"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                      isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Hapus Pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                    isSearchFocused ? "w-[calc(100%-10px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                  }`}
                />
              </div>

              {/* Dropdown Pilihan Tipe Penugasan (Icon BookType Tunggal) */}
              <CustomSelectDropdown
                value={filterTipe}
                onChange={setFilterTipe}
                options={TIPE_OPTIONS}
                icon={BookType}
                isDark={isDark}
                menuWidth={185}
                className="!h-7.5 sm:!h-8 !text-[11px]"
              />

              {/* View Mode Toggle (Kartu vs Tabel) */}
              <div
                className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-100/70 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Grid Kartu"
                  aria-label="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Tabel Penugasan"
                  aria-label="Tampilan Tabel Penugasan"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Reset Filter Button (Blue Badge Style) */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50/80 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 hover:bg-blue-100/90 text-[11px] font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
                  title="Reset Semua Filter"
                >
                  <RotateCcw className="w-3 h-3 transition-transform duration-500 group-hover:-rotate-180" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== 5. CONTENT SECTION ===== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-7 w-7 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-bold text-xs text-slate-500">Memuat penugasan magang Anda...</p>
          </div>
        ) : filteredTugas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-6 shadow-xs">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 shadow-2xs">
              <Inbox className="w-7 h-7" />
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">
                Tidak ada tugas yang sesuai
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isFilterActive
                  ? "Coba ubah kata kunci pencarian atau sesuaikan opsi filter status penugasan."
                  : "Semua tugas magang dan kuis dari mentor pembimbing Anda akan muncul di halaman ini."}
              </p>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="group mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50/80 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 hover:bg-blue-100/90 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-180" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>
        ) : (
          /* CONTAINER DENGAN ANIMASI TRANSISI HALUS KETIKA BERGANTI VIEW MODE */
          <div
            key={viewMode}
            className="transition-all duration-300 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            {viewMode === "grid" ? (
              /* TAMPILAN 1: GRID KARTU */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {filteredTugas.map((tugas) => (
                  <TugasCard
                    key={tugas.id}
                    tugas={tugas}
                    onKumpul={(item) => setSelectedTugas(item)}
                    onKerjakanKuis={(item) => setSelectedKuis(item)}
                  />
                ))}
              </div>
            ) : (
              /* TAMPILAN 2: TABEL PENUGASAN */
              <div
                className={`rounded-2xl sm:rounded-3xl border overflow-hidden shadow-xs ${
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
                      Tugas Magang &amp; Deskripsi
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[130px]">
                      Tipe Penugasan
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[150px]">
                      Pengampu / Mentor
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[160px]">
                      Tenggat Waktu
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] min-w-[170px] text-center">
                      Status &amp; Nilai
                    </th>
                    <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[10.5px] text-right min-w-[140px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTugas.map((tugas, idx) => {
                    const pengumpulan = tugas.pengumpulan;
                    const isKuis = tugas.tipe_tugas === "kuis";
                    const isDinilai = pengumpulan?.status === "dinilai";
                    const isMenunggu = pengumpulan?.status === "menunggu";
                    const isRevisi = pengumpulan?.status === "revisi" || tugas.status_tugas === "revisi";

                    // Parse kuis_data jika tugas bertipe kuis
                    let kuisConfig = null;
                    if (isKuis && tugas.kuis_data) {
                      try {
                        kuisConfig =
                          typeof tugas.kuis_data === "string"
                            ? JSON.parse(tugas.kuis_data)
                            : tugas.kuis_data;
                      } catch {
                        kuisConfig = null;
                      }
                    }

                    const kkm = kuisConfig?.kkm || 75;
                    const isTuntas =
                      pengumpulan?.status_remidi === "tuntas" ||
                      (isDinilai && (pengumpulan?.nilai || 0) >= kkm);
                    const isRemidi =
                      pengumpulan?.status_remidi === "perlu_remidi" ||
                      (isDinilai && (pengumpulan?.nilai || 0) < kkm);

                    const maksPercobaan = kuisConfig?.maks_percobaan ?? 2;
                    const percobaanKe = pengumpulan?.percobaan_ke || 1;
                    const bisaRemidi =
                      kuisConfig?.izinkan_remidi &&
                      (maksPercobaan === 0 || percobaanKe < maksPercobaan);

                    const dl = tugas.tenggat_waktu ? new Date(tugas.tenggat_waktu) : null;
                    const now = new Date();
                    const diffH = dl ? (dl.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
                    const isOverdue = diffH !== null && diffH < 0 && !pengumpulan;
                    const isUrgent = diffH !== null && diffH >= 0 && diffH <= 48 && !pengumpulan;

                    return (
                      <tr
                        key={tugas.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-400 text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <p
                            onClick={() => handleOpenAction(tugas)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#004F9F] dark:hover:text-[#00A5EC] cursor-pointer"
                          >
                            {tugas.judul}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {tugas.deskripsi || "Instruksi penugasan magang."}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {isKuis ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-blue-950/60 dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                              <NotebookPen className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                              <span>Tugas Kuis</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-blue-950/60 dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                              <FilePenLine className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                              <span>Tugas Proyek</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {tugas.mentor?.foto_profil ? (
                              <img
                                src={getFileUrl(tugas.mentor.foto_profil)}
                                alt={tugas.mentor.nama}
                                className="h-5 w-5 rounded-full object-cover shrink-0 border border-slate-200/80"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[#004F9F] text-[9px] font-black">
                                {(tugas.mentor?.nama || "M").charAt(0)}
                              </span>
                            )}
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                              {tugas.mentor?.nama || "Mentor"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 min-w-[160px]">
                          <span
                            className={`font-semibold text-[11px] block whitespace-nowrap ${
                              isOverdue
                                ? "text-rose-600 font-bold"
                                : isUrgent
                                ? "text-amber-600 font-bold"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {formatDeadlineText(tugas.tenggat_waktu)}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Terlewat</span>
                          )}
                          {isUrgent && (
                            <span className="text-[10px] text-amber-500 font-bold block mt-0.5">&lt; 48 Jam</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isKuis ? (
                            isDinilai ? (
                              isTuntas ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Nilai: {pengumpulan.nilai} • Tuntas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs whitespace-nowrap">
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Nilai: {pengumpulan.nilai} • Perlu Remidi</span>
                                </span>
                              )
                            ) : isMenunggu ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Menunggu Koreksi</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs whitespace-nowrap">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Terlewat</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs whitespace-nowrap">
                                <span>Belum Dikerjakan</span>
                              </span>
                            )
                          ) : isDinilai ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Nilai: {pengumpulan.nilai}/100</span>
                            </span>
                          ) : isRevisi ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs whitespace-nowrap">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Perlu Revisi</span>
                            </span>
                          ) : isMenunggu ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Menunggu Review</span>
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs whitespace-nowrap">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Terlewat</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs whitespace-nowrap">
                              <span>Belum Kumpul</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isKuis ? (
                            pengumpulan ? (
                              isRemidi && bisaRemidi ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction(tugas)}
                                  className="group/tbl inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover/tbl:-rotate-90 group-hover/tbl:scale-110 shrink-0" />
                                  <span>Remidi #{percobaanKe + 1}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction(tugas)}
                                  className="group/tbl inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover/tbl:scale-110 shrink-0" />
                                  <span>Lihat Kuis</span>
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(tugas)}
                                className="group/tbl inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                              >
                                <CirclePlay className="w-3.5 h-3.5 transition-transform duration-200 group-hover/tbl:scale-110 shrink-0" />
                                <span>Mulai Kuis</span>
                              </button>
                            )
                          ) : pengumpulan ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(tugas)}
                              className="group/tbl inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover/tbl:-translate-y-0.5 group-hover/tbl:scale-110 shrink-0" />
                              <span>Kelola Jawaban</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(tugas)}
                              className={`group/tbl inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                                isOverdue
                                  ? "border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:text-rose-300"
                                  : "border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300"
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover/tbl:-translate-y-0.5 group-hover/tbl:scale-110 shrink-0" />
                              <span>Kumpulkan</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}
  </div>

      {/* ===== 6. MODAL KUMPUL TUGAS PROYEK ===== */}
      {selectedTugas && (
        <KumpulTugasModal
          tugas={selectedTugas}
          onClose={() => setSelectedTugas(null)}
          onSaved={() => {
            setSelectedTugas(null);
            setReloadKey((k) => k + 1);
          }}
          isDark={isDark}
        />
      )}

      {/* ===== 7. MODAL PENGERJAAN & REVIEW KUIS ===== */}
      {selectedKuis && (
        <KerjakanKuisModal
          tugas={selectedKuis}
          isOpen={!!selectedKuis}
          onClose={() => setSelectedKuis(null)}
          onSuccess={() => {
            setSelectedKuis(null);
            setReloadKey((k) => k + 1);
          }}
          isDark={isDark}
        />
      )}
    </PesertaLayout>
  );
};

export default PesertaTugasPage;
