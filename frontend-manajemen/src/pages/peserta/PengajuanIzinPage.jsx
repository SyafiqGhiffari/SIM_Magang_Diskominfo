import { useCallback, useEffect, useState, useMemo, Fragment } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import FormPengajuanIzinModal from "../../components/manajemen/peserta/presensi/FormPengajuanIzinModal";
import DetailIzinModal from "../../components/manajemen/peserta/presensi/DetailIzinModal";
import PengajuanIzinStats from "../../components/manajemen/peserta/presensi/PengajuanIzinStats";
import IzinKetentuanCard from "../../components/manajemen/peserta/presensi/IzinKetentuanCard";
import IzinAlurCard from "../../components/manajemen/peserta/presensi/IzinAlurCard";
import PesertaIzinSortDropdown from "../../components/manajemen/peserta/presensi/PesertaIzinSortDropdown";
import PesertaIzinFilterModal from "../../components/manajemen/peserta/presensi/PesertaIzinFilterModal";
import PesertaIzinActionsDropdown from "../../components/manajemen/peserta/presensi/PesertaIzinActionsDropdown";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import Pagination from "../../components/manajemen/shared/Pagination";
import { getPengajuanIzinSaya, batalkanPengajuanIzin } from "../../services/pesertaService";
import { formatTanggalPresensi, formatTanggalLengkap, PESERTA_IZIN_SORT_OPTS } from "../../constants/presensiStatus";
import { exportIzinToPdf, exportIzinToExcel, exportIzinToCsv } from "../../utils/exportIzin";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmDialog, toastError, toastSuccess } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  FileText,
  HeartPulse,
  HeartPlus,
  CalendarRange,
  Paperclip,
  Inbox,
  MessageSquare,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  FileSpreadsheet,
  ExternalLink,
  Filter as FilterIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileX,
} from "lucide-react";

const emptyFilters = {
  status: [],
  jenis: [],
  tanggal_dari: "",
  tanggal_sampai: "",
  ada_lampiran: null,
};

const hitungDurasiHari = (tglMulai, tglSelesai) => {
  if (!tglMulai) return "1 Hari";
  const start = new Date(tglMulai.slice(0, 10));
  const end = new Date((tglSelesai || tglMulai).slice(0, 10));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "1 Hari";
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} Hari`;
};

const getFileInfo = (filePath) => {
  if (!filePath) return { isPdf: false, isImage: false, label: "Tanpa Berkas" };
  const lower = String(filePath).toLowerCase();
  const isPdf = lower.endsWith(".pdf");
  const isImage =
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp");
  return {
    isPdf,
    isImage,
    label: isPdf ? "Lihat PDF" : isImage ? "Lihat Foto" : "Buka Berkas",
  };
};

const renderStatusBadge = (status) => {
  if (status === "disetujui") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/40 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Disetujui</span>
      </span>
    );
  }
  if (status === "ditolak") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-50 text-rose-700 ring-1 ring-rose-300/70 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-500/40 shadow-2xs">
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Ditolak</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-amber-50 text-amber-800 ring-1 ring-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-500/40 shadow-2xs">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <span>Menunggu</span>
    </span>
  );
};

const SortableHeader = ({ label, columnKey, sortBy, onSort, isDark, className = "" }) => {
  let isActive = false;
  let direction = null; // 'asc' | 'desc'
  if (columnKey === "jenis") {
    if (sortBy === "jenis_izin") { isActive = true; direction = "asc"; }
    else if (sortBy === "jenis_sakit") { isActive = true; direction = "desc"; }
  } else if (columnKey === "tanggal_mulai") {
    if (sortBy === "tgl_mulai_asc" || sortBy === "terlama") { isActive = true; direction = "asc"; }
    else if (sortBy === "tgl_mulai_desc" || sortBy === "terbaru") { isActive = true; direction = "desc"; }
  } else if (columnKey === "file_bukti") {
    if (sortBy === "bukti_ada") { isActive = true; direction = "asc"; }
    else if (sortBy === "bukti_tanpa") { isActive = true; direction = "desc"; }
  } else if (columnKey === "status") {
    if (sortBy === "status_menunggu" || sortBy === "status_disetujui") { isActive = true; direction = "asc"; }
    else if (sortBy === "status_ditolak" || sortBy === "status_desc") { isActive = true; direction = "desc"; }
  }

  const handleClick = () => {
    if (columnKey === "jenis") {
      onSort(sortBy === "jenis_izin" ? "jenis_sakit" : "jenis_izin");
    } else if (columnKey === "tanggal_mulai") {
      onSort(sortBy === "terbaru" || sortBy === "tgl_mulai_desc" ? "tgl_mulai_asc" : "tgl_mulai_desc");
    } else if (columnKey === "file_bukti") {
      onSort(sortBy === "bukti_ada" ? "bukti_tanpa" : "bukti_ada");
    } else if (columnKey === "status") {
      onSort(sortBy === "status_menunggu" ? "status_ditolak" : "status_menunggu");
    } else {
      onSort("terbaru");
    }
  };

  return (
    <th className={`px-3.5 sm:px-4 py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center justify-between gap-1.5 w-full text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark ? "text-[#00A5EC]" : "text-[#004F9F]"
            : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="truncate uppercase">{label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-200 ${
              isActive && direction === "asc"
                ? isDark ? "text-[#00A5EC]" : "text-[#004F9F]"
                : isDark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
          <ChevronDown
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 -mt-1 sm:-mt-1.5 transition-all duration-200 ${
              isActive && direction === "desc"
                ? isDark ? "text-[#00A5EC]" : "text-[#004F9F]"
                : isDark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
        </span>
      </button>
    </th>
  );
};

export const PengajuanIzinPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("terbaru");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  // Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);

  const openFilter = () => {
    setDraftFilters(appliedFilters);
    setShowFilterModal(true);
  };

  const activeFilterCountDesktop =
    (appliedFilters.status?.length || 0) +
    (appliedFilters.jenis?.length || 0) +
    (appliedFilters.tanggal_dari ? 1 : 0) +
    (appliedFilters.tanggal_sampai ? 1 : 0) +
    (appliedFilters.ada_lampiran !== null ? 1 : 0);

  const activeFilterCountMobile =
    activeFilterCountDesktop + (sortBy && sortBy !== "terbaru" ? 1 : 0);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await getPengajuanIzinSaya({});
      setRows(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat pengajuan izin Anda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const handleBatal = async (row, e) => {
    if (e) e.stopPropagation();
    const konfirmasi = await confirmDialog({
      title: "Batalkan pengajuan ini?",
      text: `Pengajuan ${row.jenis} tanggal ${formatTanggalPresensi(row.tanggal_mulai)} s.d. ${formatTanggalPresensi(row.tanggal_selesai)} akan dibatalkan.`,
      confirmText: "Ya, Batalkan",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;

    try {
      await batalkanPengajuanIzin(row.id);
      toastSuccess("Pengajuan berhasil dibatalkan.");
      if (selectedDetail?.id === row.id) {
        setSelectedDetail(null);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membatalkan pengajuan.");
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    const total = rows.length;
    const disetujui = rows.filter((r) => r.status === "disetujui").length;
    const menunggu = rows.filter((r) => r.status === "menunggu").length;
    const ditolak = rows.filter((r) => r.status === "ditolak").length;
    return { total, disetujui, menunggu, ditolak };
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => {
        // Filter status
        if (appliedFilters.status.length > 0 && !appliedFilters.status.includes(r.status)) {
          return false;
        }
        // Filter jenis
        if (appliedFilters.jenis.length > 0 && !appliedFilters.jenis.includes(r.jenis)) {
          return false;
        }
        // Filter tanggal dari
        if (appliedFilters.tanggal_dari && r.tanggal_mulai < appliedFilters.tanggal_dari) {
          return false;
        }
        // Filter tanggal sampai
        if (appliedFilters.tanggal_sampai && r.tanggal_selesai > appliedFilters.tanggal_sampai) {
          return false;
        }
        // Filter kelengkapan lampiran
        if (appliedFilters.ada_lampiran === true && !r.file_bukti) {
          return false;
        }
        if (appliedFilters.ada_lampiran === false && r.file_bukti) {
          return false;
        }
        return true;
      })
      .filter((r) => {
        const qGlobal = searchQuery.toLowerCase().trim();
        const qTable = tableSearch.toLowerCase().trim();
        const match = (q) => {
          if (!q) return true;
          const alasan = (r.alasan || "").toLowerCase();
          const jenis = (r.jenis || "").toLowerCase();
          const status = (r.status || "").toLowerCase();
          const tglMulai = r.tanggal_mulai ? formatTanggalPresensi(r.tanggal_mulai).toLowerCase() : "";
          const tglSelesai = r.tanggal_selesai ? formatTanggalPresensi(r.tanggal_selesai).toLowerCase() : "";
          return alasan.includes(q) || jenis.includes(q) || status.includes(q) || tglMulai.includes(q) || tglSelesai.includes(q);
        };
        return match(qGlobal) && match(qTable);
      });
  }, [rows, appliedFilters, searchQuery, tableSearch]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    let list = [...filteredRows];

    if (sortBy === "terbaru") {
      return list.sort((a, b) => new Date(b.created_at || b.tanggal_mulai) - new Date(a.created_at || a.tanggal_mulai));
    }
    if (sortBy === "terlama") {
      return list.sort((a, b) => new Date(a.created_at || a.tanggal_mulai) - new Date(b.created_at || b.tanggal_mulai));
    }
    if (sortBy === "tgl_mulai_asc") {
      return list.sort((a, b) => new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime());
    }
    if (sortBy === "tgl_mulai_desc") {
      return list.sort((a, b) => new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime());
    }
    if (sortBy === "jenis_izin") {
      return list.sort((a, b) => (a.jenis === b.jenis ? 0 : a.jenis === "izin" ? -1 : 1));
    }
    if (sortBy === "jenis_sakit") {
      return list.sort((a, b) => (a.jenis === b.jenis ? 0 : a.jenis === "sakit" ? -1 : 1));
    }
    if (sortBy === "status_menunggu") {
      return list.sort((a, b) => (a.status === b.status ? 0 : a.status === "menunggu" ? -1 : 1));
    }
    if (sortBy === "status_disetujui") {
      return list.sort((a, b) => (a.status === b.status ? 0 : a.status === "disetujui" ? -1 : 1));
    }
    if (sortBy === "status_ditolak") {
      return list.sort((a, b) => (a.status === b.status ? 0 : a.status === "ditolak" ? -1 : 1));
    }
    if (sortBy === "status_desc") {
      return list.sort((a, b) => (b.status || "").localeCompare(a.status || ""));
    }
    if (sortBy === "bukti_ada") {
      return list.sort((a, b) => (b.file_bukti ? 1 : 0) - (a.file_bukti ? 1 : 0));
    }
    if (sortBy === "bukti_tanpa") {
      return list.sort((a, b) => (a.file_bukti ? 1 : 0) - (b.file_bukti ? 1 : 0));
    }

    return list;
  }, [filteredRows, sortBy]);

  const pageItems = useMemo(() => {
    return sortedRows.slice(page * perPage, page * perPage + perPage);
  }, [sortedRows, page, perPage]);

  // Export handlers
  const handleExport = (type) => {
    if (filteredRows.length === 0) {
      toastError("Tidak ada data pengajuan izin yang sesuai untuk diekspor.");
      return;
    }
    const filename = `Data_Pengajuan_Izin`;
    if (type === "pdf") {
      exportIzinToPdf(filteredRows, stats, filename);
    } else if (type === "excel") {
      exportIzinToExcel(filteredRows, filename);
    } else if (type === "csv") {
      exportIzinToCsv(filteredRows, filename);
    }
    toastSuccess(`Data pengajuan izin berhasil diekspor ke ${type.toUpperCase()}.`);
  };

  return (
    <PesertaLayout
      searchValue={searchQuery}
      onSearchChange={(v) => {
        setSearchQuery(v);
        setPage(0);
      }}
    >
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Pengajuan Izin &amp; Sakit
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {readOnly
              ? "Masa magang Anda sudah berakhir sehingga pengajuan baru ditutup. Riwayat pengajuan izin Anda tetap dapat ditinjau di bawah ini."
              : "Ajukan permohonan izin atau sakit sebelum tanggal kegiatan berjalan agar presensi Anda tidak tercatat alfa. Setiap pengajuan akan diverifikasi mentor."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data pengajuan izin...
          </div>
        ) : (
          <>
            {/* 4 Stats Cards (seperti BidangStats) */}
            <PengajuanIzinStats
              total={stats.total}
              menunggu={stats.menunggu}
              disetujui={stats.disetujui}
              ditolak={stats.ditolak}
              isDark={isDark}
            />

            <div className="space-y-4 sm:space-y-5">
              {/* Kolom Utama: Card Daftar Pengajuan Tabel (Full Width) */}
              <div
                className={`w-full rounded-2xl border shadow-sm overflow-hidden ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                {/* Baris 1: Header Card (Judul di Kiri, Tombol Aksi di Kanan) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Daftar Pengajuan Izin
                      </h3>
                      <p className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-md truncate ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                        Pantau status verifikasi dan riwayat permohonan izin/sakit.
                      </p>
                    </div>
                  </div>
                  {/* Tombol Aksi: Ajukan Izin (Kiri) + Ekspor Data (Kanan) */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="group inline-flex h-7.5 sm:h-[42px] shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] text-white px-2.5 sm:px-4 text-[10.5px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer"
                      >
                        <HeartPlus className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                        <span>Ajukan Izin Baru</span>
                      </button>
                    )}
                    <ExportDropdown onExport={handleExport} isDark={isDark} />
                  </div>
                </div>

                {/* Baris 2: Controls Toolbar (Desktop: Sort + Filter di Kiri & Search di Kanan; Mobile: Filter + Search Sejajar) */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-4 sm:pb-5 border-b ${
                    isDark ? "border-white/10" : "border-slate-100"
                  }`}
                >
                  {/* Desktop Only: Sort & Filter Buttons */}
                  <div className="hidden sm:flex items-center gap-2.5">
                    <PesertaIzinSortDropdown
                      sortBy={sortBy}
                      setSortBy={(val) => {
                        setSortBy(val);
                        setPage(0);
                      }}
                      options={PESERTA_IZIN_SORT_OPTS}
                      isDark={isDark}
                    />

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
                      <span>Filter</span>
                      {activeFilterCountDesktop > 0 && (
                        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[9.5px] font-black">
                          {activeFilterCountDesktop}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Sisi Kanan: Mobile Filter & Search Box */}
                  <div className="flex items-center gap-2 w-full sm:w-64 sm:shrink-0">
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
                        <span>Filter</span>
                        {activeFilterCountMobile > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] font-black">
                            {activeFilterCountMobile}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className={`group relative flex-1 sm:w-64 transition-transform duration-200 ${isSearchFocused ? "scale-[1.01]" : ""}`}>
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
                        placeholder="Cari alasan, jenis, tanggal..."
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
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left text-[11px] sm:text-[13px]">
                    <thead>
                      <tr
                        className={`border-b-2 bg-gradient-to-r ${
                          isDark
                            ? "border-white/10 from-white/5 via-white/[0.02] to-transparent"
                            : "border-slate-100 from-slate-50 via-slate-50/70 to-white"
                        }`}
                      >
                        {/* 1. Jenis & Alasan */}
                        <SortableHeader
                          label="Jenis & Alasan"
                          columnKey="jenis"
                          sortBy={sortBy}
                          onSort={(newSort) => {
                            setSortBy(newSort);
                            setPage(0);
                          }}
                          isDark={isDark}
                          className="w-[48%] sm:w-[32%]"
                        />
                        {/* 2. Rentang Tanggal */}
                        <SortableHeader
                          label="Rentang Tanggal"
                          columnKey="tanggal_mulai"
                          sortBy={sortBy}
                          onSort={(newSort) => {
                            setSortBy(newSort);
                            setPage(0);
                          }}
                          isDark={isDark}
                          className="hidden sm:table-cell sm:w-[24%]"
                        />
                        {/* 3. Dokumen Bukti */}
                        <SortableHeader
                          label="Dokumen Bukti"
                          columnKey="file_bukti"
                          sortBy={sortBy}
                          onSort={(newSort) => {
                            setSortBy(newSort);
                            setPage(0);
                          }}
                          isDark={isDark}
                          className="hidden sm:table-cell sm:w-[18%]"
                        />
                        {/* 4. Status */}
                        <SortableHeader
                          label="Status Verifikasi"
                          columnKey="status"
                          sortBy={sortBy}
                          onSort={(newSort) => {
                            setSortBy(newSort);
                            setPage(0);
                          }}
                          isDark={isDark}
                          className="w-[28%] sm:w-[14%]"
                        />
                        {/* 5. Aksi */}
                        <th className="px-3 sm:px-6 py-3 text-right w-[24%] sm:w-[12%]">
                          <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                            Aksi
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
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
                                Belum ada pengajuan izin yang sesuai
                              </p>
                              <p className="text-xs text-slate-400 max-w-xl">
                                {readOnly
                                  ? "Tidak ada catatan pengajuan izin yang ditemukan."
                                  : "Gunakan tombol “Ajukan Izin Baru” di atas untuk membuat permohonan baru."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((r) => {
                          const isExpanded = !!expandedRows[r.id];
                          const JenisIcon = r.jenis === "sakit" ? HeartPulse : FileText;
                          const fileInfo = getFileInfo(r.file_bukti);

                          return (
                            <Fragment key={r.id}>
                              <tr
                                className={`group border-b transition-colors duration-150 ${
                                  isDark
                                    ? "border-white/5 hover:bg-white/[0.02]"
                                    : "border-slate-50 hover:bg-blue-50/30"
                                }`}
                              >
                                {/* 1. Jenis & Alasan */}
                                <td
                                  className="px-3.5 sm:px-6 py-3.5 sm:py-4 cursor-pointer sm:cursor-default"
                                  onClick={() => toggleRow(r.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Static Icon Tile */}
                                    <span
                                      className={`mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-black shadow-2xs ${
                                        r.jenis === "sakit"
                                          ? isDark
                                            ? "bg-rose-950/60 text-rose-300 border border-rose-800/50 shadow-rose-950/30"
                                            : "bg-gradient-to-br from-rose-50 to-rose-100/70 text-rose-600 border border-rose-200/80"
                                          : isDark
                                          ? "bg-sky-950/60 text-[#00A5EC] border border-sky-800/50 shadow-sky-950/30"
                                          : "bg-gradient-to-br from-blue-50 to-sky-100/70 text-[#004F9F] border border-blue-200/80"
                                      }`}
                                    >
                                      <JenisIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p
                                          className={`font-black text-xs sm:text-[13.5px] capitalize leading-tight ${
                                            isDark ? "text-slate-100" : "text-[#0B1442]"
                                          }`}
                                        >
                                          {r.jenis}
                                        </p>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${
                                            isExpanded ? "rotate-180 text-[#00A5EC]" : ""
                                          }`}
                                        />
                                      </div>

                                      <p className="text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-1 break-words font-medium mt-1">
                                        {r.alasan || "Tanpa keterangan tambahan"}
                                      </p>

                                      {/* Mentor note indicator if available */}
                                      {r.catatan_mentor && (
                                        <div className="hidden sm:inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[9.5px] font-semibold text-amber-700 dark:text-amber-300 truncate max-w-xs">
                                          <MessageSquare className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                          <span className="truncate">Catatan: {r.catatan_mentor}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Rentang Tanggal (Desktop) - Menampilkan Bulan Lengkap */}
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-3.5 sm:py-4">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[#004F9F] dark:text-[#00A5EC]">
                                      <CalendarRange className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs sm:text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                        {formatTanggalLengkap(r.tanggal_mulai)}
                                        {r.tanggal_mulai !== r.tanggal_selesai && (
                                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                                            {" "}s.d. {formatTanggalLengkap(r.tanggal_selesai)}
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                          Durasi: {hitungDurasiHari(r.tanggal_mulai, r.tanggal_selesai)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Dokumen Bukti (Desktop) */}
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-3.5 sm:py-4">
                                  {r.file_bukti ? (
                                    <a
                                      href={getFileUrl(r.file_bukti)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`group/btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                                        fileInfo.isPdf
                                          ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                                          : fileInfo.isImage
                                          ? "border-sky-200 dark:border-sky-900/50 bg-sky-50/90 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60"
                                          : "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                                      }`}
                                      title="Buka lampiran dokumen di tab baru"
                                    >
                                      {fileInfo.isPdf ? (
                                        <FileText className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover/btn:scale-110" />
                                      ) : fileInfo.isImage ? (
                                        <ImageIcon className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover/btn:scale-110" />
                                      ) : (
                                        <Paperclip className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover/btn:scale-110" />
                                      )}
                                      <span>{fileInfo.label}</span>
                                      <ExternalLink className="w-3 h-3 opacity-60 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                                      <FileX className="w-3.5 h-3.5 opacity-60" />
                                      <span>Tanpa Berkas</span>
                                    </span>
                                  )}
                                </td>

                                {/* 4. Status Badge */}
                                <td className="px-2.5 sm:px-6 py-3.5 sm:py-4">
                                  {renderStatusBadge(r.status)}
                                </td>

                                {/* 5. Aksi Dropdown (Titik 3) */}
                                <td className="px-2 sm:px-6 py-3.5 sm:py-4 text-right">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <PesertaIzinActionsDropdown
                                      onDetail={() => setSelectedDetail(r)}
                                      onBatal={() => handleBatal(r)}
                                      canBatal={!readOnly && r.status === "menunggu"}
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
                                        ? "max-h-[400px] opacity-100 py-3.5 px-4 border-b border-dashed border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]"
                                        : "max-h-0 opacity-0 p-0 border-none"
                                    }`}
                                  >
                                    <div className="space-y-2.5 text-[10.5px]">
                                      {/* Tanggal & Durasi */}
                                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                                        <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                                          <CalendarRange className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" /> Rentang:
                                        </span>
                                        <div className="text-right">
                                          <span className={`font-black ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                                            {formatTanggalLengkap(r.tanggal_mulai)}
                                            {r.tanggal_mulai !== r.tanggal_selesai && ` s.d. ${formatTanggalLengkap(r.tanggal_selesai)}`}
                                          </span>
                                          <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                                            {hitungDurasiHari(r.tanggal_mulai, r.tanggal_selesai)}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Dokumen Bukti */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                                          <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Lampiran:
                                        </span>
                                        {r.file_bukti ? (
                                          <a
                                            href={getFileUrl(r.file_bukti)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-bold text-[#004F9F] dark:text-[#00A5EC] hover:underline"
                                          >
                                            <span>{fileInfo.label}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        ) : (
                                          <span className="text-slate-400 italic">Tanpa berkas</span>
                                        )}
                                      </div>

                                      {/* Alasan */}
                                      <div className="pt-0.5">
                                        <span className="text-slate-400 flex items-center gap-1.5 font-semibold mb-0.5">
                                          <FileText className="w-3.5 h-3.5 text-slate-400" /> Alasan Lengkap:
                                        </span>
                                        <p className={`text-[10px] leading-relaxed break-words p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                          {r.alasan || "Tidak ada rincian alasan."}
                                        </p>
                                      </div>

                                      {/* Catatan Mentor jika ada */}
                                      {r.catatan_mentor && (
                                        <div className="mt-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[10px]">
                                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                                            <MessageSquare className="w-3 h-3" /> Catatan Mentor:
                                          </span>
                                          <p className="text-amber-700 dark:text-amber-400">{r.catatan_mentor}</p>
                                        </div>
                                      )}
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
                  totalItems={sortedRows.length}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  setPerPage={setPerPage}
                  isDark={isDark}
                />
              </div>

              {/* 2 Card Horizontal di Bawah Tabel: Ketentuan Izin & Sakit + Alur Pengajuan Izin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                <IzinKetentuanCard isDark={isDark} />
                <IzinAlurCard isDark={isDark} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Form Pengajuan */}
      {showForm && (
        <FormPengajuanIzinModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setReloadKey((k) => k + 1);
          }}
          isDark={isDark}
        />
      )}

      {/* Modal Filter Pengajuan */}
      {showFilterModal && (
        <PesertaIzinFilterModal
          draft={draftFilters}
          setDraft={setDraftFilters}
          onApply={() => {
            setAppliedFilters(draftFilters);
            setPage(0);
            setShowFilterModal(false);
          }}
          onReset={() => {
            setDraftFilters(emptyFilters);
            setSortBy("terbaru");
          }}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy}
          setSortBy={(val) => {
            setSortBy(val);
            setPage(0);
          }}
        />
      )}

      {/* Modal Detail Pengajuan */}
      {selectedDetail && (
        <DetailIzinModal
          data={selectedDetail}
          item={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onBatal={(r) => handleBatal(r)}
          readOnly={readOnly}
          isDark={isDark}
        />
      )}
    </PesertaLayout>
  );
};

export default PengajuanIzinPage;