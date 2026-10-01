import { useEffect, useState, Fragment } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import SertifikatFormModal from "../../components/manajemen/admin/sertifikat/SertifikatFormModal";
import SertifikatActionsDropdown from "../../components/manajemen/admin/sertifikat/SertifikatActionsDropdown";
import SertifikatSortDropdown from "../../components/manajemen/admin/sertifikat/SertifikatSortDropdown";
import SertifikatFilterModal from "../../components/manajemen/admin/sertifikat/SertifikatFilterModal";
import { getAllSertifikat, createSertifikat, updateSertifikat, deleteSertifikat } from "../../services/adminService";
import { exportSertifikatToExcel } from "../../utils/exportSertifikatExcel";
import { exportSertifikatToCsv } from "../../utils/exportSertifikatCsv";
import { exportSertifikatToPdf } from "../../utils/exportSertifikatPdfList";
import { getFileUrl } from "../../utils/fileUrl";
import { getBidangColor } from "../../utils/bidangColor";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  ScrollText, Search, Inbox, GraduationCap, CheckCircle2, Clock, CalendarRange,
  FileWarning, Filter as FilterIcon, Building2, Hash, Hourglass, Timer,
  ChevronDown, ChevronUp, ChevronsUpDown, X,
} from "lucide-react";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatTanggal = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

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
  { key: "bidang", label: "Bidang" },
  { key: "periode", label: "Periode Magang" },
  { key: "nomor", label: "Nomor Sertifikat" },
  { key: "status", label: "Status" },
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

const KelolaSertifikatPage = () => {
  const { isDark } = useManajemenTheme();
  const [rows, setRows] = useState([]);
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
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatus = (key) =>
    setStatusList((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const openFilter = () => { setStatusList(appliedStatusList); setShowFilterModal(true); };
  const applyFilter = () => { setAppliedStatusList(statusList); setPage(0); };
  const resetFilter = () => { setStatusList([]); setAppliedStatusList([]); setSortBy("nama_az"); setPage(0); };

  const fetchData = async () => {
    try {
      const res = await getAllSertifikat();
      setRows(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data sertifikat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const openCreate = (row) => { setActiveRow(row); setShowModal(true); };
  const openEdit = (row) => { setActiveRow(row); setShowModal(true); };

  const handleSubmit = async (nomor) => {
    try {
      if (activeRow?.sertifikat) {
        await updateSertifikat(activeRow.sertifikat.id, { nomor_sertifikat: nomor });
        toastSuccess("Nomor sertifikat berhasil diperbarui");
      } else {
        await createSertifikat({ akun_peserta_id: activeRow.akun_peserta_id, nomor_sertifikat: nomor });
        toastSuccess("Sertifikat berhasil diterbitkan & dikirim ke peserta");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan sertifikat.");
    }
  };

  const handleDelete = async (row) => {
    const result = await confirmDialog({
      title: `Hapus sertifikat "${row.nama}"?`,
      text: "Nomor dan data sertifikat peserta ini akan dihapus. Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSertifikat(row.sertifikat.id);
      toastSuccess("Sertifikat berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus sertifikat.");
    }
  };

  const isMasihMagang = (r) => {
    if (!r.tanggal_selesai) return false;
    const end = new Date(r.tanggal_selesai);
    if (isNaN(end)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end >= today;
  };

  const statusOf = (r) => {
    if (r.sertifikat) return "terbit";
    if (isMasihMagang(r)) return "magang";
    return "perlu";
  };

  const hitungDurasi = (r) => {
    if (!r.tanggal_mulai || !r.tanggal_selesai) return null;
    const s = new Date(r.tanggal_mulai), e = new Date(r.tanggal_selesai);
    if (isNaN(s) || isNaN(e)) return null;
    const hari = Math.round((e - s) / 86400000) + 1;
    if (hari < 30) return `${hari} hari`;
    return `± ${Math.round(hari / 30)} bulan`;
  };

  const hitungSisa = (r) => {
    if (!r.tanggal_selesai) return null;
    const e = new Date(r.tanggal_selesai);
    if (isNaN(e)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.ceil((e - today) / 86400000);
  };

  const filtered = rows
    .filter((r) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(statusOf(r))))
    .filter((r) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return (r.nama || "").toLowerCase().includes(s)
          || (r.bidang || "").toLowerCase().includes(s)
          || (r.institusi || "").toLowerCase().includes(s)
          || (r.sertifikat?.nomor_sertifikat || "").toLowerCase().includes(s);
      };
      return match(search) && match(tableSearch);
    });

  const sorted = [...filtered].sort((a, b) => {
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
      if (columnSort.key === "periode") {
        const valA = new Date(a.tanggal_mulai || 0);
        const valB = new Date(b.tanggal_mulai || 0);
        return columnSort.direction === "asc" ? valA - valB : valB - valA;
      }
      if (columnSort.key === "nomor") {
        const valA = (a.sertifikat?.nomor_sertifikat || "").toLowerCase();
        const valB = (b.sertifikat?.nomor_sertifikat || "").toLowerCase();
        return columnSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (columnSort.key === "status") {
        const ord = { terbit: 0, magang: 1, perlu: 2 };
        const diff = ord[statusOf(a)] - ord[statusOf(b)];
        return columnSort.direction === "asc" ? diff : -diff;
      }
    }

    switch (sortBy) {
      case "nama_za": return (b.nama || "").localeCompare(a.nama || "", "id");
      case "bidang_az": return (a.bidang || "").localeCompare(b.bidang || "", "id");
      case "periode_baru": return new Date(b.tanggal_mulai || 0) - new Date(a.tanggal_mulai || 0);
      case "periode_lama": return new Date(a.tanggal_mulai || 0) - new Date(b.tanggal_mulai || 0);
      case "status": {
        const ord = { terbit: 0, magang: 1, perlu: 2 };
        return ord[statusOf(a)] - ord[statusOf(b)];
      }
      default: return (a.nama || "").localeCompare(b.nama || "", "id");
    }
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalPeserta = rows.length;
  const totalTerbit = rows.filter((r) => statusOf(r) === "terbit").length;
  const totalMagang = rows.filter((r) => statusOf(r) === "magang").length;
  const totalPerlu = rows.filter((r) => statusOf(r) === "perlu").length;

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    if (format === "excel") {
      exportSertifikatToExcel(sorted);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else if (format === "csv") {
      exportSertifikatToCsv(sorted);
      toastSuccess("Data berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      exportSertifikatToPdf(sorted);
      toastSuccess("Data berhasil diekspor ke PDF");
    }
  };

  const activeFilterCount = appliedStatusList.length;
  const mobileActiveFilterCount = activeFilterCount + (sortBy ? 1 : 0);

  const statCards = [
    {
      icon: GraduationCap,
      label: "Total Peserta",
      value: totalPeserta,
      captionMobile: "Peserta terdaftar",
      captionDesktop: "Peserta magang terdaftar",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      chipDark: "bg-blue-950/60 text-sky-400",
      chipLight: "bg-blue-50 text-blue-600",
    },
    {
      icon: CheckCircle2,
      label: "Sudah Terbit",
      value: totalTerbit,
      captionMobile: "Sertifikat terbit",
      captionDesktop: "Sertifikat sudah diterbitkan",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      chipDark: "bg-emerald-950/60 text-emerald-400",
      chipLight: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Clock,
      label: "Sedang Magang",
      value: totalMagang,
      captionMobile: "Masih masa magang",
      captionDesktop: "Masih dalam masa magang",
      lightGradient: "from-sky-300 to-white",
      gradient: "from-sky-500 to-sky-700",
      chipDark: "bg-sky-950/60 text-sky-400",
      chipLight: "bg-sky-50 text-sky-600",
    },
    {
      icon: FileWarning,
      label: "Perlu Dibuat",
      value: totalPerlu,
      captionMobile: "Selesai magang",
      captionDesktop: "Selesai magang, belum dibuat",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      chipDark: "bg-amber-950/60 text-amber-400",
      chipLight: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Kelola Sertifikat
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Terbitkan &amp; kelola sertifikat magang peserta.</span>
            <span className="hidden sm:inline">Terbitkan sertifikat magang peserta dengan menetapkan nomor. Tanggal terbit terisi otomatis, dan predikat akan mengikuti otomatis dari hasil tugas, logbook, serta absensi.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data sertifikat...
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik ringkas (4 Card Stats) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {statCards.map((c, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    isDark
                      ? "border-white/10 bg-white/5"
                      : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
                  }`}
                >
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.25] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] sm:text-sm font-bold tracking-wide truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {c.label}
                      </p>
                      <h3 className={`mt-0.5 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        {c.value}
                      </h3>
                      <p className={`mt-1 sm:mt-2 text-[9px] sm:text-xs font-medium leading-snug break-words ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                        <span className="inline sm:hidden">{c.captionMobile}</span>
                        <span className="hidden sm:inline">{c.captionDesktop}</span>
                      </p>
                    </div>
                    <span className={`flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                      isDark ? c.chipDark : c.chipLight
                    }`}>
                      <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {/* Card Daftar Sertifikat Peserta */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              {/* Baris 1: Header Card (Judul di Kiri, Tombol Ekspor Sejajar di Kanan) */}
              <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Daftar Sertifikat Peserta
                    </h3>
                    <p className={`mt-0.5 text-[10px] sm:text-xs leading-snug sm:leading-relaxed break-words max-w-md sm:max-w-lg ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                      <span className="inline sm:hidden">Saring &amp; kelola status sertifikat.</span>
                      <span className="hidden sm:inline">Gunakan tombol urutkan &amp; filter untuk menyaring peserta berdasarkan status sertifikatnya.</span>
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
                  <SertifikatSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                  <button
                    type="button"
                    onClick={openFilter}
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
                      onClick={openFilter}
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
                      placeholder={isMobile ? "Cari peserta..." : "Cari nama, bidang, nomor..."}
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

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] sm:text-[13px]">
                  <thead>
                    <tr className={`border-b-2 bg-gradient-to-r ${
                      isDark
                        ? "border-white/10 from-white/5 via-white/[0.02] to-transparent"
                        : "border-slate-100 from-slate-50 via-slate-50/70 to-white"
                    }`}>
                      {/* Peserta */}
                      <SortableHeader
                        column={columns[0]}
                        columnSort={columnSort}
                        setColumnSort={setColumnSort}
                        isDark={isDark}
                        className="w-[40%] sm:w-[25%]"
                      />
                      {/* Bidang (Desktop only) */}
                      <SortableHeader
                        column={columns[1]}
                        columnSort={columnSort}
                        setColumnSort={setColumnSort}
                        isDark={isDark}
                        className="hidden sm:table-cell sm:w-[15%]"
                      />
                      {/* Periode (Desktop only) */}
                      <SortableHeader
                        column={columns[2]}
                        columnSort={columnSort}
                        setColumnSort={setColumnSort}
                        isDark={isDark}
                        className="hidden sm:table-cell sm:w-[18%]"
                      />
                      {/* Nomor (Desktop only) */}
                      <SortableHeader
                        column={columns[3]}
                        columnSort={columnSort}
                        setColumnSort={setColumnSort}
                        isDark={isDark}
                        className="hidden sm:table-cell sm:w-[24%]"
                      />
                      {/* Status */}
                      <SortableHeader
                        column={columns[4]}
                        columnSort={columnSort}
                        setColumnSort={setColumnSort}
                        isDark={isDark}
                        className="w-[30%] sm:w-[10%]"
                      />
                      {/* Aksi */}
                      <th className="px-2 sm:px-6 py-3 text-right w-[30%] sm:w-[8%]">
                        <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                          Aksi
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={6} className="px-6 py-16">
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
                        const st = statusOf(r);
                        const sisa = hitungSisa(r);
                        const isExpanded = !!expandedRows[r.akun_peserta_id];
                        const bidangColor = getBidangColor(r.bidang);

                        return (
                          <Fragment key={r.akun_peserta_id}>
                            <tr
                              className={`group border-b transition-colors duration-150 ${
                                isDark
                                  ? "border-white/5 hover:bg-white/[0.02]"
                                  : "border-slate-50 hover:bg-blue-50/30"
                              }`}
                            >
                              {/* 1. Peserta */}
                              <td
                                className="px-2.5 sm:px-6 py-3 sm:py-3.5 cursor-pointer sm:cursor-default"
                                onClick={() => toggleRow(r.akun_peserta_id)}
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                  <PesertaAvatar nama={r.nama} foto={r.foto_profil || r.pendaftaran?.file_pas_foto} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start sm:items-center gap-1">
                                      <p className={`font-extrabold text-xs sm:text-sm leading-snug break-words line-clamp-2 sm:line-clamp-none transition-colors duration-200 ${
                                        isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                      }`}>
                                        {r.nama}
                                      </p>
                                      <ChevronDown
                                        className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 mt-0.5 sm:mt-0 ${
                                          isExpanded ? "rotate-180 text-[#00A5EC]" : ""
                                        }`}
                                      />
                                    </div>
                                    {r.institusi && (
                                      <p className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                                        <GraduationCap className="w-3 h-3 shrink-0" /> {r.institusi}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. Bidang (Desktop only) */}
                              <td className="hidden sm:table-cell px-6 py-4">
                                {r.bidang ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black whitespace-nowrap shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                                    style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                  >
                                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>{r.bidang}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">-</span>
                                )}
                              </td>

                              {/* 3. Periode Magang (Desktop only) */}
                              <td className="hidden sm:table-cell px-6 py-4">
                                <div className="group/periode">
                                  <p className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold shadow-sm whitespace-nowrap transition-all duration-200 group-hover/periode:-translate-y-0.5 ${
                                    isDark
                                      ? "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20"
                                      : "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-slate-300 group-hover:bg-white group-hover:shadow-md"
                                  }`}>
                                    <CalendarRange className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/periode:scale-110 group-hover/periode:text-[#00A5EC]" />
                                    {formatTanggal(r.tanggal_mulai)} – {formatTanggal(r.tanggal_selesai)}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {hitungDurasi(r) && (
                                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                        isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"
                                      }`}>
                                        <Hourglass className="w-2.5 h-2.5" /> {hitungDurasi(r)}
                                      </span>
                                    )}
                                    {st === "magang" && sisa != null && sisa >= 0 ? (
                                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                                        isDark
                                          ? "bg-sky-950/40 text-sky-400 border-sky-800/40"
                                          : "bg-sky-50 text-sky-600 border-sky-100"
                                      }`}>
                                        <Timer className="w-2.5 h-2.5" /> Sisa {sisa} hari
                                      </span>
                                    ) : (
                                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                                        isDark
                                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      }`}>
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Selesai
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 4. Nomor Sertifikat (Desktop only) */}
                              <td className="hidden sm:table-cell px-6 py-4">
                                {r.sertifikat?.nomor_sertifikat ? (
                                  <span className={`group/nomor inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                    isDark
                                      ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                  }`}>
                                    <Hash className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/nomor:scale-110 group-hover/nomor:text-[#00A5EC]" />
                                    {r.sertifikat.nomor_sertifikat}
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 text-xs ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                                    <Hash className="w-3.5 h-3.5" /> —
                                  </span>
                                )}
                              </td>

                              {/* 5. Status */}
                              <td className="px-2 sm:px-6 py-3.5">
                                {st === "terbit" ? (
                                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                    isDark
                                      ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-400"
                                      : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  }`}>
                                    <CheckCircle2 className="w-3 h-3" /> Sudah Terbit
                                  </span>
                                ) : st === "magang" ? (
                                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                    isDark
                                      ? "bg-sky-950/50 border-sky-800/50 text-sky-400"
                                      : "bg-sky-50 border-sky-100 text-sky-600"
                                  }`}>
                                    <Clock className="w-3 h-3" /> Sedang Magang
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap ${
                                    isDark
                                      ? "bg-amber-950/50 border-amber-800/50 text-amber-400"
                                      : "bg-amber-50 border-amber-100 text-amber-600"
                                  }`}>
                                    <FileWarning className="w-3 h-3" /> Perlu Dibuat
                                  </span>
                                )}
                              </td>

                              {/* 6. Aksi Dropdown */}
                              <td className="px-2 sm:px-6 py-3.5 text-right">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <SertifikatActionsDropdown
                                    status={st}
                                    onTerbitkan={() => openCreate(r)}
                                    onView={() => openEdit(r)}
                                    onDelete={() => handleDelete(r)}
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
                                      ? `max-h-[350px] opacity-100 py-3 px-3.5 border-b border-dashed ${
                                          isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50/70"
                                        }`
                                      : "max-h-0 opacity-0 p-0 border-none"
                                  }`}
                                >
                                  <div className="space-y-2 text-[10.5px]">
                                    {/* Asal Institusi */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold shrink-0">
                                        <GraduationCap className="w-3 h-3 text-slate-400" /> Institusi:
                                      </span>
                                      <span className={`font-bold text-right truncate max-w-[190px] ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                        {r.institusi || "-"}
                                      </span>
                                    </div>

                                    {/* Bidang */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold shrink-0">
                                        <Building2 className="w-3 h-3 text-slate-400" /> Bidang:
                                      </span>
                                      {r.bidang ? (
                                        <span
                                          className={`font-black rounded-lg px-2 py-0.5 text-[9.5px] shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                                          style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                        >
                                          {r.bidang}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </div>

                                    {/* Periode Magang */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                        <CalendarRange className="w-3 h-3 text-slate-400" /> Periode:
                                      </span>
                                      <div className="text-right">
                                        <p className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                          {formatTanggal(r.tanggal_mulai)} – {formatTanggal(r.tanggal_selesai)}
                                        </p>
                                        <div className="mt-0.5 flex items-center justify-end gap-1">
                                          {hitungDurasi(r) && (
                                            <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold ${
                                              isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"
                                            }`}>
                                              <Hourglass className="w-2.5 h-2.5" /> {hitungDurasi(r)}
                                            </span>
                                          )}
                                          {st === "magang" && sisa != null && sisa >= 0 ? (
                                            <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold border ${
                                              isDark
                                                ? "bg-sky-950/40 text-sky-400 border-sky-800/40"
                                                : "bg-sky-50 text-sky-600 border-sky-100"
                                            }`}>
                                              <Timer className="w-2.5 h-2.5" /> Sisa {sisa} hari
                                            </span>
                                          ) : (
                                            <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold border ${
                                              isDark
                                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            }`}>
                                              <CheckCircle2 className="w-2.5 h-2.5" /> Selesai
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Nomor Sertifikat */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                        <Hash className="w-3 h-3 text-slate-400" /> Nomor Sertifikat:
                                      </span>
                                      {r.sertifikat?.nomor_sertifikat ? (
                                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                                          isDark ? "bg-white/5 text-slate-200" : "bg-slate-100 text-slate-700"
                                        }`}>
                                          {r.sertifikat.nomor_sertifikat}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Belum dibuat</span>
                                      )}
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

              <Pagination totalItems={sorted.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} isDark={isDark} />
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <SertifikatFormModal
          peserta={activeRow}
          initialData={activeRow?.sertifikat || null}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          isDark={isDark}
        />
      )}

      {showFilterModal && (
        <SertifikatFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
    </AdminLayout>
  );
};

export default KelolaSertifikatPage;