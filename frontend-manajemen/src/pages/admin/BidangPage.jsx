import { useEffect, useState, Fragment } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import BidangStats from "../../components/manajemen/admin/bidang/BidangStats";
import BidangSortDropdown from "../../components/manajemen/admin/bidang/BidangSortDropdown";
import BidangFilterModal from "../../components/manajemen/admin/bidang/BidangFilterModal";
import BidangModal from "../../components/manajemen/admin/bidang/BidangModal";
import BidangAlertCard from "../../components/manajemen/admin/bidang/BidangAlertCard";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getAllBidang,
  createBidang,
  updateBidang,
  deleteBidang,
  toggleStatusBidang,
  getAllPendaftaran,
  cekBidangBisaDihapus,
} from "../../services/adminService";
import { exportBidangToExcel } from "../../utils/exportBidangExcel";
import { exportBidangToCsv } from "../../utils/exportBidangCsv";
import { exportBidangToPdf } from "../../utils/exportBidangPdf";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import { confirmDialog, toastSuccess, toastError, blockedActionDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  Building2,
  Plus,
  Users2,
  Filter as FilterIcon,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Inbox,
  Infinity as InfinityIcon,
  X,
  FileText,
} from "lucide-react";
import BidangActionsDropdown from "../../components/manajemen/admin/bidang/BidangActionsDropdown";
import BidangDescTooltip from "../../components/manajemen/admin/bidang/BidangDescTooltip";

const columns = [
  { key: "nama", label: "Nama Bidang" },
  { key: "kuota", label: "Kuota Terisi" },
  { key: "deskripsi", label: "Deskripsi" },
  { key: "is_active", label: "Status" },
];

const SortableHeader = ({ column, columnSort, setColumnSort, isDark, className = "" }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;

  const handleClick = () => {
    if (!isActive) setColumnSort({ key: column.key, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: column.key, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };

  return (
    <th className={`px-3 sm:px-6 py-3 sm:py-3.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "text-slate-100"
              : "text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span>{column.label}</span>
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

const TambahBidangCard = ({ onAdd }) => (
  <button
    type="button"
    onClick={onAdd}
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] shadow-sm p-3.5 sm:p-4 flex items-center gap-3 text-left w-full transition-all duration-300 hover:shadow-xl hover:shadow-[#0B1442]/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
  >
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

    {/* Kotak Ikon diperkecil agar proporsional */}
    <span className="relative flex h-8.5 w-8.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/15">
      <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white transition-transform duration-500 group-hover:rotate-[360deg]" />
    </span>

    <div className="relative flex-1 min-w-0">
      <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
        Bidang Baru?
        <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC] animate-pulse" />
      </h3>
      <p className="text-[10px] sm:text-[11px] text-white/70 leading-snug mt-0.5 line-clamp-2 break-words">
        Tambahkan bidang penempatan baru
      </p>
    </div>

    {/* Tombol Plus diperkecil */}
    <span className="relative flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#00A5EC] text-[#0B1442] shadow-md shadow-[#00A5EC]/30 transition-all duration-300 group-hover:bg-[#33bdf5] group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#00A5EC]/40">
      <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
    </span>
  </button>
);

const BidangPage = () => {
  const { isDark } = useManajemenTheme();
  const [bidangList, setBidangList] = useState([]);
  const [occupancy, setOccupancy] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});

  const [statusList, setStatusList] = useState([]);
  const [kuotaList, setKuotaList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedKuotaList, setAppliedKuotaList] = useState([]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatus = (key) => {
    setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };
  const toggleKuota = (key) => {
    setKuotaList((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      const [bRes, pRes] = await Promise.all([getAllBidang(), getAllPendaftaran().catch(() => null)]);
      setBidangList(bRes.data.data || []);

      if (pRes) {
        const counts = {};
        (pRes.data.data || [])
          .filter((p) => p.status_pendaftaran === "diterima")
          .forEach((p) => {
            counts[p.posisi_bidang] = (counts[p.posisi_bidang] || 0) + 1;
          });
        setOccupancy(counts);
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data bidang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setShowFormModal(true);
  };
  const handleEdit = (b) => {
    setEditData(b);
    setShowFormModal(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editData) {
        await updateBidang(editData.id, payload);
        toastSuccess("Bidang berhasil diperbarui");
      } else {
        await createBidang(payload);
        toastSuccess("Bidang baru berhasil ditambahkan");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan bidang.");
    }
  };

  const handleDelete = async (b) => {
    let cekResult;
    try {
      const res = await cekBidangBisaDihapus(b.id);
      cekResult = res.data.data;
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memeriksa status bidang.");
      return;
    }

    if (!cekResult.bisa_dihapus) {
      const alasan = [];
      if (cekResult.jumlah_peserta > 0) {
        alasan.push(`${cekResult.jumlah_peserta} peserta yang sudah diterima`);
      }
      if (cekResult.ada_mentor) {
        const daftarMentor = (cekResult.nama_mentor || []).join(", ");
        alasan.push(`${cekResult.jumlah_mentor} mentor yang masih ditugaskan (${daftarMentor})`);
      }

      await blockedActionDialog({
        title: "Bidang tidak dapat dihapus",
        text: `Bidang "${b.nama}" masih memiliki ${alasan.join(" dan ")}. Nonaktifkan bidang ini melalui toggle status jika tidak ingin menerima pendaftar baru, atau pindahkan mentor tersebut terlebih dahulu melalui menu Edit Mentor.`,
      });
      return;
    }

    const result = await confirmDialog({
      title: `Hapus bidang "${b.nama}"?`,
      text: "Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteBidang(b.id);
      toastSuccess("Bidang berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus bidang.");
    }
  };

  const handleToggle = async (b) => {
    try {
      await toggleStatusBidang(b.id);
      setBidangList((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x))
      );
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status bidang.");
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedKuotaList(kuotaList);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]);
    setKuotaList([]);
    setAppliedStatusList([]);
    setAppliedKuotaList([]);
    setSortBy("nama_az");
    setPage(0);
  };

  const filtered = bidangList
    .filter((b) => {
      if (appliedStatusList.length === 0) return true;
      return appliedStatusList.includes(b.is_active ? "aktif" : "nonaktif");
    })
    .filter((b) => {
      if (appliedKuotaList.length === 0) return true;
      const terisi = occupancy[b.nama] || 0;
      return appliedKuotaList.some((k) => {
        if (k === "tanpa_batas") return b.kuota === 0;
        if (k === "penuh") return b.kuota > 0 && terisi >= b.kuota;
        if (k === "tersedia") return b.kuota > 0 && terisi < b.kuota;
        return false;
      });
    })
    .filter((b) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return b.nama.toLowerCase().includes(s) || (b.deskripsi || "").toLowerCase().includes(s);
      };
      return match(search) && match(tableSearch);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (columnSort.key) {
      let valA, valB;
      if (columnSort.key === "kuota") {
        valA = occupancy[a.nama] || 0;
        valB = occupancy[b.nama] || 0;
      } else if (columnSort.key === "is_active") {
        valA = a.is_active ? 1 : 0;
        valB = b.is_active ? 1 : 0;
      } else if (columnSort.key === "deskripsi") {
        valA = (a.deskripsi || "").toLowerCase();
        valB = (b.deskripsi || "").toLowerCase();
      } else {
        valA = a.nama.toLowerCase();
        valB = b.nama.toLowerCase();
      }
      const result = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
      return columnSort.direction === "asc" ? result : -result;
    }
    if (sortBy === "nama_az") return a.nama.localeCompare(b.nama);
    if (sortBy === "nama_za") return b.nama.localeCompare(a.nama);
    if (sortBy === "kuota_tinggi") return b.kuota - a.kuota;
    if (sortBy === "kuota_rendah") return a.kuota - b.kuota;
    if (sortBy === "terbaru") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalAktif = bidangList.filter((b) => b.is_active).length;
  const totalNonaktif = bidangList.filter((b) => !b.is_active).length;
  const totalTerisi = Object.values(occupancy).reduce((sum, n) => sum + n, 0);

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    if (format === "excel") {
      exportBidangToExcel(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else if (format === "csv") {
      exportBidangToCsv(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      exportBidangToPdf(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke PDF");
    }
  };

  const activeFilterCount = appliedStatusList.length + appliedKuotaList.length;
  const mobileActiveFilterCount = activeFilterCount + (sortBy ? 1 : 0);

  return (
    <AdminLayout
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(0);
      }}
    >
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Kelola Bidang
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Atur daftar bidang magang &amp; kuotanya.</span>
            <span className="hidden sm:inline">Atur daftar bidang penempatan magang beserta kuota dan status ketersediaannya.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data bidang...
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <BidangStats
              total={bidangList.length}
              aktif={totalAktif}
              nonaktif={totalNonaktif}
              totalTerisi={totalTerisi}
              isDark={isDark}
            />

            {/* Mobile Only: Tambah Bidang Card diletakkan di ATAS card daftar bidang */}
            <div className="block lg:hidden">
              <TambahBidangCard onAdd={handleAdd} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
              {/* Kolom Utama: Card Daftar Bidang / Tabel */}
              <div
                className={`lg:col-span-3 rounded-2xl border shadow-sm overflow-hidden ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                {/* Baris 1: Header Card (Judul di Kiri, Tombol Ekspor Sejajar di Kanan) */}
                <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Daftar Bidang
                      </h3>
                      <p className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-md truncate ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                        <span className="inline sm:hidden">Saring &amp; kelola kuota bidang.</span>
                        <span className="hidden sm:inline">Gunakan tombol filter untuk menyaring bidang berdasarkan status.</span>
                      </p>
                    </div>
                  </div>
                  {/* Tombol Ekspor di pojok kanan atas sejajar judul */}
                  <div className="shrink-0">
                    <ExportDropdown onExport={handleExport} isDark={isDark} />
                  </div>
                </div>

                {/* Baris 2: Controls (Desktop: Sort + Filter di Kiri & Search di Kanan; Mobile: Filter + Search Sejajar) */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-4 sm:pb-5 border-b ${
                    isDark ? "border-white/10" : "border-slate-100"
                  }`}
                >
                  {/* Desktop Only: Sort & Filter Buttons */}
                  <div className="hidden sm:flex items-center gap-2.5">
                    <BidangSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(true)}
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

                  {/* Mobile Row: Filter Button + Search Input berdampingan sejajar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Mobile Only: Filter Button next to search */}
                    <div className="block sm:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowFilterModal(true)}
                        className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                        Filter
                        {mobileActiveFilterCount > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] font-black">
                            {mobileActiveFilterCount}
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
                        placeholder="Cari nama bidang..."
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

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] sm:text-[13px]">
                    <thead>
                      <tr
                        className={`border-b-2 bg-gradient-to-r ${
                          isDark
                            ? "border-white/10 from-white/5 via-white/[0.02] to-transparent"
                            : "border-slate-100 from-slate-50 via-slate-50/70 to-white"
                        }`}
                      >
                        {/* Nama Bidang */}
                        <SortableHeader
                          column={columns[0]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="w-[66%] sm:w-[34%]"
                        />
                        {/* Kuota Terisi (Desktop only) */}
                        <SortableHeader
                          column={columns[1]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="hidden sm:table-cell sm:w-[22%]"
                        />
                        {/* Deskripsi (Desktop only) */}
                        <SortableHeader
                          column={columns[2]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="hidden sm:table-cell sm:w-[20%]"
                        />
                        {/* Status */}
                        <SortableHeader
                          column={columns[3]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="w-[20%] sm:w-[14%]"
                        />
                        {/* Aksi */}
                        <th className="px-2 sm:px-6 py-3 text-right w-[14%] sm:w-[10%]">
                          <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                            Aksi
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr className="animate-[fadeslide_0.3s_ease-out]">
                          <td colSpan={5} className="px-6 py-16">
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                              <span
                                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
                                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                                }`}
                              >
                                <Inbox className="w-6 h-6" />
                                <span
                                  className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
                                    isDark ? "border-white/10" : "border-slate-200"
                                  }`}
                                />
                              </span>
                              <p className={`text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Belum ada bidang yang sesuai
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((b) => {
                          const terisi = occupancy[b.nama] || 0;
                          const pct = b.kuota > 0 ? Math.min(100, Math.round((terisi / b.kuota) * 100)) : 0;
                          const isExpanded = !!expandedRows[b.id];

                          return (
                            <Fragment key={b.id}>
                              <tr
                                className={`group border-b transition-colors duration-150 ${
                                  isDark
                                    ? "border-white/5 hover:bg-white/[0.02]"
                                    : "border-slate-50 hover:bg-blue-50/30"
                                }`}
                              >
                                {/* 1. Nama Bidang */}
                                <td
                                  className="px-3 sm:px-6 py-3.5 cursor-pointer sm:cursor-default"
                                  onClick={() => toggleRow(b.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <p
                                          className={`font-bold text-[11px] sm:text-[13px] leading-tight break-words line-clamp-2 sm:line-clamp-none transition-colors duration-200 ${
                                            isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                          }`}
                                        >
                                          {b.nama}
                                        </p>
                                        <ChevronDown
                                          className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${
                                            isExpanded ? "rotate-180 text-[#00A5EC]" : ""
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Kuota Terisi (Desktop) */}
                                <td className="hidden sm:table-cell px-6 py-4">
                                  {b.kuota > 0 ? (
                                    <div className="w-36">
                                      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400 mb-1">
                                        <span className="flex items-center gap-1">
                                          <Users2 className="w-3 h-3" />
                                          {terisi}/{b.kuota}
                                        </span>
                                        <span className={pct >= 100 ? "text-red-500 font-black" : ""}>{pct}%</span>
                                      </div>
                                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                                        <div
                                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                                            pct >= 100
                                              ? "bg-gradient-to-r from-red-600 to-red-400"
                                              : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-32">
                                      <span
                                        className={`group/inf inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                                          isDark
                                            ? "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-[#00A5EC]"
                                            : "bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 border-[#004F9F]/15 text-[#004F9F]"
                                        }`}
                                      >
                                        <InfinityIcon className="w-3 h-3 shrink-0 transition-transform duration-500 group-hover/inf:rotate-180" />
                                        <span>Tanpa batas</span>
                                        <span className="opacity-40">·</span>
                                        <span className="font-black">{terisi}</span>
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* 3. Deskripsi (Desktop) */}
                                <td className="hidden sm:table-cell px-6 py-4 max-w-xs">
                                  <BidangDescTooltip text={b.deskripsi} isDark={isDark} />
                                </td>

                                {/* 4. Status Toggle */}
                                <td className="px-2 sm:px-6 py-3.5">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggle(b)}
                                      className={`group relative inline-flex h-[24px] w-[56px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                                        b.is_active
                                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                                          : isDark ? "bg-slate-700" : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                                      } hover:shadow-md active:scale-95`}
                                      title={b.is_active ? "Nonaktifkan bidang" : "Aktifkan bidang"}
                                    >
                                      <span
                                        className={`absolute left-1.5 text-[8.5px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
                                          b.is_active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                        }`}
                                      >
                                        Aktif
                                      </span>
                                      <span
                                        className={`absolute right-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 transition-all duration-300 ${
                                          !b.is_active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
                                        }`}
                                      >
                                        Off
                                      </span>
                                      <span
                                        className="relative inline-flex h-4.5 w-4.5 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out group-active:scale-90"
                                        style={{
                                          transform: b.is_active ? "translateX(35px)" : "translateX(3px)",
                                        }}
                                      >
                                        <span
                                          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                                            b.is_active ? "bg-emerald-500" : "bg-slate-300"
                                          }`}
                                        />
                                      </span>
                                    </button>
                                  </div>
                                </td>

                                {/* 5. Aksi Dropdown */}
                                <td className="px-2 sm:px-6 py-3.5 text-right">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <BidangActionsDropdown
                                      onEdit={() => handleEdit(b)}
                                      onDelete={() => handleDelete(b)}
                                      isDark={isDark}
                                    />
                                  </div>
                                </td>
                              </tr>

                              {/* Mobile Collapsible Accordion Row */}
                              <tr className="table-row sm:hidden">
                                <td colSpan={3} className="p-0">
                                  <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      isExpanded
                                        ? "max-h-[300px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]"
                                        : "max-h-0 opacity-0 p-0 border-none"
                                    }`}
                                  >
                                    <div className="space-y-2 text-[10.5px]">
                                      {/* Kuota Info */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <Users2 className="w-3 h-3 text-slate-400" /> Kuota Terisi:
                                        </span>
                                        {b.kuota > 0 ? (
                                          <div className="flex items-center gap-1.5">
                                            <span className={`font-mono font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                                              {terisi}/{b.kuota}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                              pct >= 100 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                            }`}>
                                              {pct}%
                                            </span>
                                          </div>
                                        ) : (
                                          <span className={`inline-flex items-center gap-1 font-bold text-[9.5px] ${
                                            isDark ? "text-[#00A5EC]" : "text-[#004F9F]"
                                          }`}>
                                            <InfinityIcon className="w-3 h-3" /> Tanpa batas ({terisi})
                                          </span>
                                        )}
                                      </div>

                                      {/* Progress Bar Kuota jika ada kuota */}
                                      {b.kuota > 0 && (
                                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                                          <div
                                            className={`h-full rounded-full ${
                                              pct >= 100
                                                ? "bg-gradient-to-r from-red-600 to-red-400"
                                                : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      )}

                                      {/* Deskripsi */}
                                      <div className="pt-0.5">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold mb-0.5">
                                          <FileText className="w-3 h-3 text-slate-400" /> Deskripsi:
                                        </span>
                                        <p className={`text-[10px] leading-relaxed break-words ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                          {b.deskripsi || "Tidak ada deskripsi untuk bidang ini."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination
                  totalItems={sorted.length}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  setPerPage={setPerPage}
                  isDark={isDark}
                />
              </div>

              {/* Desktop Only Kolom Kanan: Tambah Bidang Card + Perlu Perhatian Card */}
              <div className="hidden lg:flex lg:col-span-1 flex-col gap-5 h-full">
                <TambahBidangCard onAdd={handleAdd} />
                <div className="flex-1 min-h-0">
                  <BidangAlertCard bidangList={bidangList} occupancy={occupancy} isDark={isDark} />
                </div>
              </div>

              {/* Mobile Only: Perlu Perhatian Card diletakkan di bawah tabel */}
              <div className="block lg:hidden">
                <BidangAlertCard bidangList={bidangList} occupancy={occupancy} isDark={isDark} />
              </div>
            </div>
          </>
        )}
      </div>

      {showFormModal && (
        <BidangModal
          initialData={editData}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSubmit}
          isDark={isDark}
        />
      )}

      {showFilterModal && (
        <BidangFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          kuotaList={kuotaList}
          toggleKuota={toggleKuota}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
    </AdminLayout>
  );
};

export default BidangPage;