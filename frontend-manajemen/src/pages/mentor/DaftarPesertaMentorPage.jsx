import { useState, useEffect, useMemo } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getUser } from "../../utils/authStorage";
import { getDaftarPesertaBimbingan } from "../../services/mentorService";
import { toastError } from "../../utils/swal";
import PesertaBimbinganStats from "../../components/manajemen/mentor/peserta/PesertaBimbinganStats";
import PesertaBimbinganCard from "../../components/manajemen/mentor/peserta/PesertaBimbinganCard";
import PesertaBimbinganTable from "../../components/manajemen/mentor/peserta/PesertaBimbinganTable";
import DetailPesertaBimbinganModal from "../../components/manajemen/mentor/peserta/DetailPesertaBimbinganModal";
import CustomSelectDropdown from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";
import PesertaBimbinganEmptyState from "../../components/manajemen/mentor/peserta/PesertaBimbinganEmptyState";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  X,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua Status" },
  { value: "aktif", label: "Aktif Magang" },
  { value: "selesai", label: "Selesai Magang (Alumni)" },
];

const KATEGORI_OPTIONS = [
  { value: "semua", label: "Semua Jenjang" },
  { value: "mahasiswa", label: "Mahasiswa (Perguruan Tinggi)" },
  { value: "siswa", label: "Siswa (SMK/SMA)" },
];

const DaftarPesertaMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const currentUser = getUser();
  const mentorNama = currentUser?.nama_lengkap || currentUser?.name || "Pembimbing Lapangan";

  // Data & Loading States
  const [pesertaList, setPesertaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua"); // 'semua' | 'aktif' | 'selesai'
  const [filterKategori, setFilterKategori] = useState("semua"); // 'semua' | 'mahasiswa' | 'siswa'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modal States
  const [selectedPeserta, setSelectedPeserta] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    let isMounted = true;
    getDaftarPesertaBimbingan()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setPesertaList(res.data.data);
        } else if (Array.isArray(res.data)) {
          setPesertaList(res.data);
        } else {
          setPesertaList([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gagal memuat peserta bimbingan:", err);
        toastError(err.response?.data?.message || "Gagal memuat data peserta bimbingan.");
        setPesertaList([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Select Detail
  const handleOpenDetail = (peserta) => {
    setSelectedPeserta(peserta);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedPeserta(null);
  };

  // Filtered & Searched List
  const filteredList = useMemo(() => {
    return pesertaList.filter((item) => {
      // 1. Filter Status
      if (filterStatus !== "semua") {
        if (filterStatus === "aktif" && item.status_magang !== "aktif") return false;
        if (filterStatus === "selesai" && item.status_magang !== "selesai") return false;
      }

      // 2. Filter Kategori
      if (filterKategori !== "semua") {
        if (filterKategori === "mahasiswa" && item.kategori_pendaftar !== "mahasiswa") return false;
        if (filterKategori === "siswa" && item.kategori_pendaftar !== "siswa") return false;
      }

      // 3. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const nama = (item.nama_lengkap || "").toLowerCase();
        const nim = (item.nim_nisn || "").toLowerCase();
        const inst = (item.institusi || "").toLowerCase();
        const jur = (item.jurusan || "").toLowerCase();
        const bidang = (item.posisi_bidang || "").toLowerCase();

        const match =
          nama.includes(query) ||
          nim.includes(query) ||
          inst.includes(query) ||
          jur.includes(query) ||
          bidang.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [pesertaList, filterStatus, filterKategori, search]);

  // Statistics KPI Calculations
  const stats = useMemo(() => {
    const total = pesertaList.length;
    const aktif = pesertaList.filter((p) => p.status_magang === "aktif").length;
    const selesai = pesertaList.filter((p) => p.status_magang === "selesai").length;

    // Rata-rata persentase kehadiran
    const totalPersentase = pesertaList.reduce(
      (acc, curr) => acc + (parseFloat(curr.persentase_kehadiran) || 0),
      0
    );
    const avgKehadiran = total > 0 ? Math.round(totalPersentase / total) : 0;

    return { total, aktif, selesai, avgKehadiran };
  }, [pesertaList]);

  // Check if any filter active
  const isFiltered = search.trim() !== "" || filterStatus !== "semua" || filterKategori !== "semua";

  const handleResetFilters = () => {
    setSearch("");
    setFilterStatus("semua");
    setFilterKategori("semua");
  };

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala Halaman: Judul & Subjudul (Sesuai Standar Admin) */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Daftar Peserta Bimbingan
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Daftar &amp; pantau seluruh peserta magang bimbingan Anda.</span>
            <span className="hidden sm:inline">Pantau profil, kontak, presensi kehadiran, laporan akhir, serta evaluasi nilai peserta bimbingan Anda.</span>
          </p>
        </div>

        {/* ── 4 STATS CARDS (IDENTIK DENGAN ADMIN) ── */}
        <PesertaBimbinganStats
          total={loading ? 0 : stats.total}
          aktif={loading ? 0 : stats.aktif}
          selesai={loading ? 0 : stats.selesai}
          avgKehadiran={loading ? 0 : stats.avgKehadiran}
          isDark={isDark}
        />

        {/* ── TOOLBAR PENCARIAN & FILTER ── */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-all duration-300 ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Input Pencarian dengan Animasi Admin Identik */}
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
                placeholder="Cari nama, NIM/NISN, asal institusi, jurusan, atau bidang..."
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

            {/* Filter Status, Jenjang & View Mode Switcher (Tinggi Seragam h-9 sm:h-[38px] + Ikon Kiri) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Custom Dropdown Filter Status Magang */}
              <CustomSelectDropdown
                value={filterStatus}
                onChange={setFilterStatus}
                options={STATUS_OPTIONS}
                icon={Filter}
                isDark={isDark}
                menuWidth={210}
              />

              {/* Custom Dropdown Filter Jenjang Pendidikan */}
              <CustomSelectDropdown
                value={filterKategori}
                onChange={setFilterKategori}
                options={KATEGORI_OPTIONS}
                icon={GraduationCap}
                isDark={isDark}
                menuWidth={230}
              />

              {/* View Mode Segmented Control (Grid / Table) */}
              <div
                className={`flex h-9 sm:h-[38px] items-center rounded-xl p-0.5 border shadow-2xs transition-all duration-200 ${
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`h-full px-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    viewMode === "grid"
                      ? isDark
                        ? "bg-[#161b22] text-[#00A5EC] shadow-xs ring-1 ring-white/10"
                        : "bg-white text-[#004F9F] shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-105"
                  }`}
                  title="Tampilan Kartu (Grid)"
                >
                  <LayoutGrid
                    className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform duration-200 ${
                      viewMode === "grid" ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`h-full px-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    viewMode === "table"
                      ? isDark
                        ? "bg-[#161b22] text-[#00A5EC] shadow-xs ring-1 ring-white/10"
                        : "bg-white text-[#004F9F] shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-105"
                  }`}
                  title="Tampilan Tabel (List)"
                >
                  <List
                    className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform duration-200 ${
                      viewMode === "table" ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                </button>
              </div>

              {/* Tombol Reset Filter */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="group inline-flex h-9 sm:h-[38px] items-center gap-1.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/40 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0"
                  title="Reset Semua Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-90" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Info Jumlah Hasil Filter (Tanpa Garis Sekat) */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 transition-all">
            <span className="flex items-center gap-1.5">
              Menampilkan{" "}
              <b className="text-slate-800 dark:text-slate-100 font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10">
                {filteredList.length}
              </b>{" "}
              dari total <b>{pesertaList.length}</b> peserta bimbingan
            </span>

            {isFiltered && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-600 dark:text-amber-400 font-bold animate-[fadeIn_0.2s_ease-out]">
                <Filter className="w-3 h-3 animate-pulse" />
                Filter aktif diterapkan
              </span>
            )}
          </div>
        </div>

        {/* ── KONTEN UTAMA: LOADING / EMPTY / GRID / TABLE ── */}
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-[fadeIn_0.25s_ease-out]">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border animate-pulse space-y-4 ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/10 rounded-md" />
                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-white/10 rounded-md" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl" />
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-slate-100 dark:bg-white/5 rounded-lg" />
                  <div className="h-8 bg-slate-100 dark:bg-white/5 rounded-lg" />
                  <div className="h-8 bg-slate-100 dark:bg-white/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          /* Empty State yang Lebih Menarik & Interaktif */
          <PesertaBimbinganEmptyState
            isFiltered={isFiltered}
            search={search}
            filterStatus={filterStatus}
            filterKategori={filterKategori}
            onResetAll={handleResetFilters}
            onClearSearch={() => setSearch("")}
            onResetStatus={() => setFilterStatus("semua")}
            onResetKategori={() => setFilterKategori("semua")}
            isDark={isDark}
          />
        ) : (
          <div key={viewMode} className="transition-all duration-300 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
            {viewMode === "grid" ? (
              /* Grid View dengan Animasi Masuk Halus & Staggered Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredList.map((peserta, idx) => (
                  <div
                    key={peserta.id}
                    className="animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
                  >
                    <PesertaBimbinganCard
                      peserta={peserta}
                      onSelect={handleOpenDetail}
                      dk={isDark}
                      mentorNama={mentorNama}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Table View dengan Animasi Masuk Halus */
              <div>
                <PesertaBimbinganTable
                  list={filteredList}
                  onSelect={handleOpenDetail}
                  dk={isDark}
                  mentorNama={mentorNama}
                />
              </div>
            )}
          </div>
        )}

        {/* ── MODAL DETAIL PESERTA BIMBINGAN ── */}
        <DetailPesertaBimbinganModal
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          peserta={selectedPeserta}
          dk={isDark}
          mentorNama={mentorNama}
        />
      </div>
    </MentorLayout>
  );
};

export default DaftarPesertaMentorPage;
