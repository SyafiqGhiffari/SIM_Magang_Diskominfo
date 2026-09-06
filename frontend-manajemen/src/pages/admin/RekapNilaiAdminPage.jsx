import { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getBidangColor } from "../../utils/bidangColor";
import { getFileUrl } from "../../utils/fileUrl";
import {
  getAllRekapPenilaianAdmin,
  getDetailPenilaianAdmin,
} from "../../services/penilaianService";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
import {
  exportRekapNilaiToCsv,
  exportRekapNilaiToExcel,
  exportRekapNilaiToPdf,
} from "../../utils/exportRekapNilai";
import { toastSuccess, toastError } from "../../utils/swal";
import {
  Search, Eye,
  ChevronDown, ChevronUp, ChevronsUpDown, Filter as FilterIcon,
  CheckCircle2, Inbox, Clock, FileSpreadsheet,
  Building2, UserCog, GraduationCap, X
} from "lucide-react";

import {
  RekapNilaiStats,
  RekapNilaiBobotCard,
  RekapNilaiFilterModal,
  RekapNilaiDetailModal,
  RekapNilaiSortDropdown,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "../../components/manajemen/admin/rekapNilai";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const PesertaAvatar = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  return (
    <div className="h-10 w-10 sm:h-11 sm:w-11 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] aspect-square shrink-0 rounded-full overflow-hidden shadow-sm border-[2px] border-white ring-1 ring-slate-200 dark:ring-white/10 transition-all duration-300 group-hover:scale-105 flex items-center justify-center bg-slate-100 dark:bg-white/5">
      {url && !error ? (
        <img
          src={url}
          alt={nama}
          onError={() => setError(true)}
          className="w-full h-full object-cover object-center rounded-full aspect-square block"
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-xs sm:text-sm font-black">
          {getInitials(nama)}
        </span>
      )}
    </div>
  );
};

const columns = [
  { key: "nama", label: "Nama Peserta" },
  { key: "bidang", label: "Bidang & Mentor" },
  { key: "kompetensi", label: "Nilai 4 Kompetensi" },
  { key: "nilai", label: "Nilai Akhir" },
  { key: "indeks", label: "Indeks" },
  { key: "status", label: "Status" },
];

const SortableHeader = ({ column, columnSort, setColumnSort, isDark, className = "" }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;
  const isCentered = className.includes("text-center");

  const handleClick = () => {
    if (!isActive) setColumnSort({ key: column.key, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: column.key, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };

  return (
    <th className={`px-2.5 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer whitespace-nowrap ${
          isCentered ? "justify-center mx-auto" : ""
        } ${
          isActive
            ? isDark
              ? "text-slate-100"
              : "text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="whitespace-nowrap">{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          {isActive ? (
            direction === "asc" ? (
              <ChevronUp className="w-3 h-3 text-[#00A5EC]" strokeWidth={3} />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#00A5EC]" strokeWidth={3} />
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const RekapNilaiAdminPage = () => {
  const { isDark } = useManajemenTheme();

  const [rekapList, setRekapList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [appliedBidangList, setAppliedBidangList] = useState([]);
  const [predikatList, setPredikatList] = useState([]);
  const [appliedPredikatList, setAppliedPredikatList] = useState([]);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });

  // Pagination State
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // Detail / Transcript Modal State
  const [selectedPesertaId, setSelectedPesertaId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllRekapPenilaianAdmin();
      const list = res.data?.data || [];
      setRekapList(list);
    } catch {
      toastError("Gagal memuat rekapitulasi penilaian peserta aktif");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Bidang Options dari data aktual
  const bidangOptions = useMemo(() => {
    const setB = new Set();
    rekapList.forEach((r) => {
      if (r.bidang) setB.add(r.bidang);
    });
    return Array.from(setB).sort();
  }, [rekapList]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = rekapList.length;
    const diterbitkan = rekapList.filter((r) => r.status_penilaian === "final").length;
    const draf = rekapList.filter((r) => r.status_penilaian === "draf").length;
    const belum = rekapList.filter((r) => !r.status_penilaian || r.status_penilaian === "belum_dinilai").length;

    const nilaiFinal = rekapList
      .filter((r) => r.nilai_akhir_angka != null && r.status_penilaian === "final")
      .map((r) => Number(r.nilai_akhir_angka));

    const rataRata =
      nilaiFinal.length > 0
        ? (nilaiFinal.reduce((a, b) => a + b, 0) / nilaiFinal.length).toFixed(2)
        : "0.00";

    const predikatSangatBaik = rekapList.filter(
      (r) => r.status_penilaian === "final" && (r.indeks_nilai_akhir === "A" || r.indeks_nilai_akhir === "A-")
    ).length;

    return { total, diterbitkan, draf, belum, rataRata, predikatSangatBaik };
  }, [rekapList]);

  // Filter & Toggle Handlers
  const toggleStatus = (key) =>
    setStatusList((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const toggleBidang = (bid) =>
    setBidangList((prev) =>
      prev.includes(bid) ? prev.filter((b) => b !== bid) : [...prev, bid]
    );

  const togglePredikat = (pred) =>
    setPredikatList((prev) =>
      prev.includes(pred) ? prev.filter((p) => p !== pred) : [...prev, pred]
    );

  const openFilterModal = () => {
    setStatusList([...appliedStatusList]);
    setBidangList([...appliedBidangList]);
    setPredikatList([...appliedPredikatList]);
    setShowFilterModal(true);
  };

  const applyFilterModal = () => {
    setAppliedStatusList([...statusList]);
    setAppliedBidangList([...bidangList]);
    setAppliedPredikatList([...predikatList]);
    setPage(0);
    setShowFilterModal(false);
  };

  const resetFilterModal = () => {
    setStatusList([]);
    setBidangList([]);
    setPredikatList([]);
  };

  // Filtering & Sorting
  const filteredRows = useMemo(() => {
    let rows = rekapList.filter((item) => {
      const matchSearch = (q) => {
        const s = q.toLowerCase();
        return (
          (item.nama || "").toLowerCase().includes(s) ||
          (item.email || "").toLowerCase().includes(s) ||
          (item.institusi || "").toLowerCase().includes(s) ||
          (item.bidang || "").toLowerCase().includes(s) ||
          (item.mentor_nama || "").toLowerCase().includes(s)
        );
      };

      const matchStatus =
        appliedStatusList.length === 0
          ? true
          : appliedStatusList.includes(item.status_penilaian || "belum_dinilai");

      const matchBidang =
        appliedBidangList.length === 0 || appliedBidangList.includes(item.bidang);

      const matchPredikat =
        appliedPredikatList.length === 0 || appliedPredikatList.includes(item.indeks_nilai_akhir);

      return matchSearch(search) && matchSearch(tableSearch) && matchStatus && matchBidang && matchPredikat;
    });

    rows.sort((a, b) => {
      if (columnSort.key) {
        if (columnSort.key === "nama") {
          const valA = (a.nama || "").toLowerCase();
          const valB = (b.nama || "").toLowerCase();
          return columnSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (columnSort.key === "bidang") {
          const valA = (a.bidang || "").toLowerCase();
          const valB = (b.bidang || "").toLowerCase();
          return columnSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (columnSort.key === "nilai") {
          const valA = a.nilai_akhir_angka || 0;
          const valB = b.nilai_akhir_angka || 0;
          return columnSort.direction === "asc" ? valA - valB : valB - valA;
        }
        if (columnSort.key === "indeks") {
          const valA = a.indeks_nilai_akhir || "";
          const valB = b.indeks_nilai_akhir || "";
          return columnSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (columnSort.key === "status") {
          const valA = a.status_penilaian || "";
          const valB = b.status_penilaian || "";
          return columnSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
      }

      switch (sortBy) {
        case "nama_za":
          return (b.nama || "").localeCompare(a.nama || "", "id");
        case "nilai_desc":
          return (b.nilai_akhir_angka || 0) - (a.nilai_akhir_angka || 0);
        case "nilai_asc":
          return (a.nilai_akhir_angka || 0) - (b.nilai_akhir_angka || 0);
        case "bidang_az":
          return (a.bidang || "").localeCompare(b.bidang || "", "id");
        case "status":
          return (a.status_penilaian || "").localeCompare(b.status_penilaian || "");
        default:
          return (a.nama || "").localeCompare(b.nama || "", "id");
      }
    });

    return rows;
  }, [rekapList, search, tableSearch, appliedStatusList, appliedBidangList, appliedPredikatList, sortBy, columnSort]);

  // Paginated Rows
  const pageItems = useMemo(() => {
    const start = page * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page, perPage]);

  // Active filter count
  const activeFilterCount =
    appliedStatusList.length + appliedBidangList.length + appliedPredikatList.length;

  // Handle Export
  const handleExport = (format) => {
    setExporting(true);
    setTimeout(() => {
      try {
        if (filteredRows.length === 0) {
          toastError("Tidak ada data nilai untuk diekspor");
          return;
        }
        if (format === "excel") exportRekapNilaiToExcel(filteredRows);
        else if (format === "csv") exportRekapNilaiToCsv(filteredRows);
        else exportRekapNilaiToPdf(filteredRows);
        toastSuccess(`${filteredRows.length} data rekap nilai berhasil diekspor`);
      } catch (err) {
        toastError("Gagal mengekspor data: " + err.message);
      } finally {
        setExporting(false);
      }
    }, 0);
  };

  // Detail Modal Handler
  const handleOpenDetail = async (pesertaId) => {
    setSelectedPesertaId(pesertaId);
    setLoadingDetail(true);
    try {
      const res = await getDetailPenilaianAdmin(pesertaId);
      setDetailData(res.data?.data || null);
    } catch {
      toastError("Gagal memuat rincian transkrip nilai");
      setSelectedPesertaId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!detailData) return;
    setDownloadingPdf(true);
    try {
      await exportTranskripNilaiPdf(detailData);
      toastSuccess("Transkrip nilai PDF resmi berhasil diunduh");
    } catch (err) {
      toastError("Gagal mengekspor PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <AdminLayout
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(0);
      }}
      searchPlaceholder="Cari nama, email, kampus, bidang, mentor..."
    >
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header (Judul Halaman di Atas) */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Rekapitulasi Nilai Magang
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pantau evaluasi kinerja 4 pilar kompetensi peserta magang yang aktif, kelola status penilaian mentor, dan ekspor laporan nilai resmi.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data rekapitulasi penilaian...
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* STATS CARDS */}
            <RekapNilaiStats stats={stats} isDark={isDark} />

            {/* GRID LAYOUT: DAFTAR REKAPITULASI (KIRI) & CARD INFORMASI (KANAN) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
              {/* KOLOM KIRI (LEBIH LEBAR): CARD DAFTAR REKAPITULASI */}
              <div className="xl:col-span-8 2xl:col-span-9 space-y-4">
                <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}>
                  {/* Baris 1: Header Card (Judul di Kiri, Tombol Ekspor Sejajar di Kanan) */}
                  <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xs sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                          Daftar Rekapitulasi Nilai Peserta
                        </h3>
                        <p className={`mt-0.5 text-[10px] sm:text-xs leading-snug sm:leading-relaxed break-words max-w-md sm:max-w-lg ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                          <span className="inline sm:hidden">Saring &amp; kelola hasil penilaian peserta.</span>
                          <span className="hidden sm:inline">Gunakan tombol urutkan &amp; filter untuk menyaring peserta berdasarkan status penilaian.</span>
                        </p>
                      </div>
                    </div>
                    {/* Tombol Ekspor di pojok kanan atas sejajar judul */}
                    <div className="shrink-0">
                      <div className={exporting ? "pointer-events-none opacity-60" : ""}>
                        <ExportDropdown onExport={handleExport} isDark={isDark} />
                      </div>
                    </div>
                  </div>

                  {/* Baris 2: Controls (Sort + Filter di Kiri & Search di Kanan) */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-4 sm:pb-5 border-b ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    {/* Desktop: Sort & Filter Buttons */}
                    <div className="hidden sm:flex items-center gap-2.5">
                      <RekapNilaiSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                      <button
                        type="button"
                        onClick={openFilterModal}
                        className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                        Filter
                        {activeFilterCount > 0 && (
                          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[9.5px] font-black">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Mobile: Filter Button + Search Input berdampingan sejajar */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Mobile Only: Filter Button */}
                      <div className="block sm:hidden shrink-0">
                        <button
                          type="button"
                          onClick={openFilterModal}
                          className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                            isDark
                              ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                          Filter
                          {activeFilterCount > 0 && (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] font-black">
                              {activeFilterCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className={`group relative flex-1 sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "scale-[1.01]" : ""}`}>
                        <Search
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 transition-all duration-200 ${
                            isSearchFocused
                              ? isDark
                                ? "text-[#00A5EC] scale-110"
                                : "text-[#004F9F] scale-110"
                              : "text-slate-400"
                          }`}
                        />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setPage(0);
                          }}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setIsSearchFocused(false)}
                          placeholder="Cari peserta, email, bidang..."
                          className={`w-full rounded-lg sm:rounded-xl border pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium outline-none transition-all duration-200 ${
                            isDark
                              ? isSearchFocused
                                ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-4 ring-[#00A5EC]/20"
                                : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                              : isSearchFocused
                              ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15 text-slate-700"
                              : "border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                          }`}
                        />
                        {tableSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setTableSearch("");
                              setPage(0);
                            }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                              isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] sm:text-[13px]">
                      <thead>
                        <tr className={`border-b-2 bg-gradient-to-r ${
                          isDark
                            ? "border-white/10 from-white/5 via-white/[0.02] to-transparent"
                            : "border-slate-100 from-slate-50 via-slate-50/70 to-white"
                        }`}>
                          {/* Nama */}
                          <SortableHeader
                            column={columns[0]}
                            columnSort={columnSort}
                            setColumnSort={setColumnSort}
                            isDark={isDark}
                            className="w-[28%] sm:w-[24%]"
                          />
                          {/* Bidang */}
                          <SortableHeader
                            column={columns[1]}
                            columnSort={columnSort}
                            setColumnSort={setColumnSort}
                            isDark={isDark}
                            className="hidden sm:table-cell sm:w-[20%]"
                          />
                          {/* 4 Pilar */}
                          <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-center sm:w-[22%] whitespace-nowrap">
                            <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                              Nilai 4 Kompetensi
                            </span>
                          </th>
                          {/* Nilai Akhir */}
                          <SortableHeader
                            column={columns[3]}
                            columnSort={columnSort}
                            setColumnSort={setColumnSort}
                            isDark={isDark}
                            className="text-center sm:w-[12%]"
                          />
                          {/* Indeks */}
                          <SortableHeader
                            column={columns[4]}
                            columnSort={columnSort}
                            setColumnSort={setColumnSort}
                            isDark={isDark}
                            className="hidden sm:table-cell text-center sm:w-[8%]"
                          />
                          {/* Status */}
                          <SortableHeader
                            column={columns[5]}
                            columnSort={columnSort}
                            setColumnSort={setColumnSort}
                            isDark={isDark}
                            className="w-[22%] sm:w-[10%]"
                          />
                          {/* Aksi */}
                          <th className="px-2 sm:px-4 py-3 text-center w-[16%] sm:w-[6%] whitespace-nowrap">
                            <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                              Aksi
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.length === 0 ? (
                          <tr className="animate-[fadeslide_0.3s_ease-out]">
                            <td colSpan={7} className="px-6 py-16">
                              <div className="flex flex-col items-center justify-center gap-3 text-center">
                                <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
                                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                                }`}>
                                  <Inbox className="w-6 h-6" />
                                  <span className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
                                    isDark ? "border-white/10" : "border-slate-200"
                                  }`} />
                                </span>
                                <p className={`text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  Belum ada peserta yang sesuai
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          pageItems.map((r) => {
                            const isFinal = r.status_penilaian === "final";
                            const isDraf = r.status_penilaian === "draf";
                            const bidangColor = getBidangColor(r.bidang);

                            return (
                              <tr
                                key={r.peserta_id}
                                className={`group border-b transition-colors duration-150 ${
                                  isDark
                                    ? "border-white/5 hover:bg-white/[0.02]"
                                    : "border-slate-50 hover:bg-blue-50/30"
                                }`}
                              >
                                {/* 1. Peserta */}
                                <td className="px-3 sm:px-5 py-3.5">
                                  <div className="flex items-center gap-2.5 sm:gap-3">
                                    <PesertaAvatar nama={r.nama} foto={r.foto_profil || r.foto} />
                                    <div className="min-w-0 flex-1">
                                      <p className={`font-extrabold text-xs sm:text-sm leading-snug whitespace-nowrap transition-colors duration-200 ${
                                        isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                      }`}>
                                        {r.nama}
                                      </p>
                                      <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                                        <GraduationCap className="w-3 h-3 shrink-0" />
                                        <span>{r.institusi || r.email}</span>
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Bidang & Mentor */}
                                <td className="hidden sm:table-cell px-5 py-3.5">
                                  <div>
                                    {r.bidang ? (
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black whitespace-nowrap shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                                        style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                      >
                                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>{r.bidang}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400">-</span>
                                    )}
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold border transition-colors ${
                                        isDark
                                          ? "bg-white/5 border-white/10 text-slate-300"
                                          : "bg-slate-50 border-slate-200/80 text-slate-600"
                                      }`}>
                                        <UserCog className="w-3 h-3 text-[#00A5EC] shrink-0" />
                                        <span className="text-slate-400 font-medium">Mentor:</span>
                                        <span className="font-extrabold text-[#0B1442] dark:text-slate-100 truncate max-w-[120px]">
                                          {r.mentor_nama || "Belum Ditugaskan"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. 4 Pilar Mini (Desktop) */}
                                <td className="hidden lg:table-cell px-3 sm:px-4 py-3.5 text-center">
                                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-white/10">
                                    <span
                                      className="px-1.5 py-0.5 rounded-lg text-[9.5px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:bg-blue-500/20 hover:shadow-xs cursor-pointer"
                                      title={`1. Profesional: ${r.nilai_profesional != null ? Number(r.nilai_profesional).toFixed(1) : 'Belum dinilai'}`}
                                    >
                                      Prof: {r.nilai_profesional != null ? Math.round(r.nilai_profesional) : "-"}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.5 rounded-lg text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:shadow-xs cursor-pointer"
                                      title={`2. Personal: ${r.nilai_personal != null ? Number(r.nilai_personal).toFixed(1) : 'Belum dinilai'}`}
                                    >
                                      Pers: {r.nilai_personal != null ? Math.round(r.nilai_personal) : "-"}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.5 rounded-lg text-[9.5px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:bg-amber-500/20 hover:shadow-xs cursor-pointer"
                                      title={`3. Sosial: ${r.nilai_sosial != null ? Number(r.nilai_sosial).toFixed(1) : 'Belum dinilai'}`}
                                    >
                                      Sos: {r.nilai_sosial != null ? Math.round(r.nilai_sosial) : "-"}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.5 rounded-lg text-[9.5px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:bg-purple-500/20 hover:shadow-xs cursor-pointer"
                                      title={`4. Administratif: ${r.nilai_administratif != null ? Number(r.nilai_administratif).toFixed(1) : 'Otomatis'}`}
                                    >
                                      Adm: {r.nilai_administratif != null ? Math.round(r.nilai_administratif) : "-"}
                                    </span>
                                  </div>
                                </td>

                                {/* 4. Nilai Akhir */}
                                <td className="px-3 sm:px-5 py-3.5 text-center">
                                  {r.nilai_akhir_angka != null ? (
                                    <span className="text-xs sm:text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                      {Number(r.nilai_akhir_angka).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-normal">-</span>
                                  )}
                                </td>

                                {/* 5. Indeks */}
                                <td className="hidden sm:table-cell px-3 sm:px-5 py-3.5 text-center">
                                  {r.indeks_nilai_akhir ? (
                                    <span className="inline-flex items-center justify-center font-black px-2.5 py-0.5 rounded-md text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
                                      {r.indeks_nilai_akhir}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>

                                {/* 6. Status Penilaian */}
                                <td className="px-2 sm:px-4 py-3.5">
                                  {isFinal ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                      isDark
                                        ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-400"
                                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    }`}>
                                      <CheckCircle2 className="w-3 h-3" /> Diterbitkan
                                    </span>
                                  ) : isDraf ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                      isDark
                                        ? "bg-amber-950/50 border-amber-800/50 text-amber-400"
                                        : "bg-amber-50 border-amber-100 text-amber-600"
                                    }`}>
                                      <Clock className="w-3 h-3" /> Draf
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                      isDark
                                        ? "bg-white/5 border-white/10 text-slate-400"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                    }`}>
                                      Belum Dinilai
                                    </span>
                                  )}
                                </td>

                                {/* 7. Aksi */}
                                <td className="px-2 sm:px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetail(r.peserta_id)}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
                                      isDark
                                        ? "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-sky-400"
                                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-[#004F9F]"
                                    }`}
                                    title="Lihat Detail Transkrip Nilai"
                                  >
                                    <Eye className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <Pagination
                    totalItems={filteredRows.length}
                    page={page}
                    setPage={setPage}
                    perPage={perPage}
                    setPerPage={setPerPage}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* KOLOM KANAN: CARD INFORMASI PENILAIAN 4 PILAR KOMPETENSI */}
              <div className="xl:col-span-4 2xl:col-span-3">
                <RekapNilaiBobotCard isDark={isDark} />
              </div>
            </div>
          </div>
        )}

        {/* MODAL FILTER */}
        <RekapNilaiFilterModal
          show={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          statusOptions={STATUS_OPTIONS}
          statusList={statusList}
          toggleStatus={toggleStatus}
          bidangOptions={bidangOptions}
          bidangList={bidangList}
          toggleBidang={toggleBidang}
          predikatList={predikatList}
          togglePredikat={togglePredikat}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOptions={SORT_OPTIONS}
          onReset={resetFilterModal}
          onApply={applyFilterModal}
        />

        {/* MODAL PRATINJAU TRANSKRIP RESMI */}
        <RekapNilaiDetailModal
          show={Boolean(selectedPesertaId)}
          onClose={() => setSelectedPesertaId(null)}
          loading={loadingDetail}
          detailData={detailData}
          isDark={isDark}
          onDownloadPdf={handleDownloadPdf}
          downloadingPdf={downloadingPdf}
        />
      </div>
    </AdminLayout>
  );
};

export default RekapNilaiAdminPage;
