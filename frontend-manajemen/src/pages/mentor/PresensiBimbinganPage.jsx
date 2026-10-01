import { Fragment, useCallback, useEffect, useState } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import Pagination from "../../components/manajemen/shared/Pagination";
import PresensiSortDropdown from "../../components/manajemen/shared/PresensiSortDropdown";
import PresensiStatusBadge from "../../components/manajemen/shared/PresensiStatusBadge";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import PresensiBimbinganActionsDropdown from "../../components/manajemen/mentor/presensi/PresensiBimbinganActionsDropdown";
import RiwayatPresensiBimbinganModal from "../../components/manajemen/mentor/presensi/RiwayatPresensiBimbinganModal";
import DetailPresensiBimbinganModal from "../../components/manajemen/mentor/presensi/DetailPresensiBimbinganModal";
import PresensiBimbinganFilterModal from "../../components/manajemen/mentor/presensi/PresensiBimbinganFilterModal";
import KoreksiPresensiModal from "../../components/manajemen/mentor/presensi/KoreksiPresensiModal";
import JamKerjaCard from "../../components/manajemen/mentor/presensi/JamKerjaCard";
import { getPresensiMentor, getStatistikPresensiMentor } from "../../services/mentorService";
import { exportPresensiToCsv, exportPresensiToExcel, exportPresensiToPdf } from "../../utils/exportPresensi";
import { getFileUrl } from "../../utils/fileUrl";
import { getBidangColor } from "../../utils/bidangColor";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { toastError, toastSuccess } from "../../utils/swal";
import {
  formatTanggalLengkap,
  formatTanggalHari,
  formatTanggalPresensi,
  namaHari,
  formatMenit,
} from "../../constants/presensiStatus";
import {
  ClipboardList,
  Search,
  Inbox,
  Filter as FilterIcon,
  CheckCircle2,
  Clock,
  GraduationCap,
  LogIn,
  LogOut,
  Eye,
  AlarmClockOff,
  Loader2,
  Users,
  UserX,
  PencilLine,
  CalendarDays,
  Layers,
  Rows3,
  ChevronDown,
  ChevronUp,
  Lock,
  Building2,
  Info,
  CalendarCheck,
  CalendarOff,
  Sun,
  FileText,
} from "lucide-react";

const emptyFilters = {
  status: [],
  kategori: [],
  bidang: [],
  tanggal_dari: "",
  tanggal_sampai: "",
  lupa_presensi: false,
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const PesertaAvatar = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  if (url && !error) {
    return (
      <img
        src={url}
        alt={nama}
        onError={() => setError(true)}
        className="h-8.5 w-8.5 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200/80 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105"
      />
    );
  }
  return (
    <span className="flex h-8.5 w-8.5 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] sm:text-xs font-black border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200/80 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105">
      {getInitials(nama)}
    </span>
  );
};

const hitungFilterAktifDesktop = (f) =>
  f.status.length +
  f.kategori.length +
  (f.tanggal_dari ? 1 : 0) +
  (f.tanggal_sampai ? 1 : 0) +
  (f.lupa_presensi ? 1 : 0);

const hitungFilterAktifMobile = (f, sort) =>
  hitungFilterAktifDesktop(f) + (sort && sort !== "tanggal_baru" ? 1 : 0);

const SortableHeader = ({ label, columnKey, sortBy, onSort, isDark, className = "" }) => {
  let isActive = false;
  let direction = null; // 'asc' | 'desc'
  if (columnKey === "nama") {
    if (sortBy === "nama_az") {
      isActive = true;
      direction = "asc";
    } else if (sortBy === "nama_za") {
      isActive = true;
      direction = "desc";
    }
  } else if (columnKey === "tanggal") {
    if (sortBy === "tanggal_lama") {
      isActive = true;
      direction = "asc";
    } else if (sortBy === "tanggal_baru") {
      isActive = true;
      direction = "desc";
    }
  } else if (columnKey === "status") {
    if (sortBy === "status") {
      isActive = true;
      direction = "asc";
    }
  } else if (columnKey === "jam") {
    if (sortBy === "terlambat_terbanyak") {
      isActive = true;
      direction = "desc";
    }
  }

  const handleClick = () => {
    if (columnKey === "nama") {
      onSort(sortBy === "nama_az" ? "nama_za" : "nama_az");
    } else if (columnKey === "tanggal") {
      onSort(sortBy === "tanggal_baru" ? "tanggal_lama" : "tanggal_baru");
    } else if (columnKey === "status") {
      onSort(sortBy === "status" ? "tanggal_baru" : "status");
    } else if (columnKey === "jam") {
      onSort(sortBy === "terlambat_terbanyak" ? "tanggal_baru" : "terlambat_terbanyak");
    } else {
      onSort("tanggal_baru");
    }
  };

  return (
    <th className={`px-4 sm:px-6 py-3 sm:py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center justify-between gap-1.5 w-full text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "text-[#00A5EC]"
              : "text-[#004F9F]"
            : isDark
            ? "text-slate-400 hover:text-slate-200"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="truncate uppercase">{label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-200 ${
              isActive && direction === "asc"
                ? isDark
                  ? "text-[#00A5EC]"
                  : "text-[#004F9F]"
                : isDark
                ? "text-slate-600 group-hover:text-slate-400"
                : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
          <ChevronDown
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 -mt-1 sm:-mt-1.5 transition-all duration-200 ${
              isActive && direction === "desc"
                ? isDark
                  ? "text-[#00A5EC]"
                  : "text-[#004F9F]"
                : isDark
                ? "text-slate-600 group-hover:text-slate-400"
                : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
        </span>
      </button>
    </th>
  );
};

const PresensiBimbinganPage = () => {
  const { isDark } = useManajemenTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [sortBy, setSortBy] = useState("tanggal_baru");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [detail, setDetail] = useState(null);
  const [koreksi, setKoreksi] = useState(null);
  const [selectedPesertaRiwayat, setSelectedPesertaRiwayat] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Mode tampilan: "terbaru" = 1 baris per peserta (ringkas), "semua" = seluruh baris riwayat
  const [mode, setMode] = useState("terbaru");
  const [expandedRows, setExpandedRows] = useState({});
  const [exporting, setExporting] = useState(false);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const gabungan = [search, tableSearch].filter(Boolean).join(" ").trim();
    const id = setTimeout(() => {
      setDebouncedSearch(gabungan);
      setPage(0);
    }, 350);
    return () => clearTimeout(id);
  }, [search, tableSearch]);

  const buildParams = useCallback(() => {
    const f = appliedFilters;
    const params = { page: page + 1, limit: perPage, sort: sortBy };
    if (mode === "terbaru") params.mode = "terbaru";
    if (debouncedSearch) params.search = debouncedSearch;
    if (f.status.length) params.status = f.status.join(",");
    if (f.kategori.length) params.kategori = f.kategori.join(",");
    if (f.tanggal_dari) params.tanggal_dari = f.tanggal_dari;
    if (f.tanggal_sampai) params.tanggal_sampai = f.tanggal_sampai;
    if (f.lupa_presensi) params.lupa_presensi = 1;
    return params;
  }, [appliedFilters, page, perPage, sortBy, debouncedSearch, mode]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = buildParams();
      const [resList, resStat] = await Promise.all([
        getPresensiMentor(params),
        getStatistikPresensiMentor({
          kategori: params.kategori,
          tanggal_dari: params.tanggal_dari,
          tanggal_sampai: params.tanggal_sampai,
        }),
      ]);
      const payload = resList.data.data || {};
      setRows(payload.data || []);
      setTotal(payload.meta?.total || 0);
      setStat(resStat.data.data || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat presensi bimbingan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const gantiMode = (next) => {
    setMode(next);
    setPage(0);
  };

  const handleExport = (format) => {
    setExporting(true);
    setTimeout(async () => {
      try {
        const dasar = buildParams();
        const semua = [];
        let halaman = 1;
        for (;;) {
          const res = await getPresensiMentor({ ...dasar, page: halaman, limit: 200 });
          const payload = res.data.data || {};
          semua.push(...(payload.data || []));
          const totalHal = payload.meta?.total_page || 1;
          if (halaman >= totalHal || halaman >= 20) break;
          halaman += 1;
        }

        if (semua.length === 0) {
          toastError("Tidak ada data presensi bimbingan untuk diekspor.");
          return;
        }

        if (format === "excel") exportPresensiToExcel(semua, "presensi-bimbingan");
        else if (format === "csv") exportPresensiToCsv(semua, "presensi-bimbingan");
        else exportPresensiToPdf(semua, stat, "presensi-bimbingan");

        toastSuccess(`${semua.length} baris data presensi berhasil diekspor.`);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal mengekspor data presensi.");
      } finally {
        setExporting(false);
      }
    }, 0);
  };

  const openFilter = () => {
    setDraftFilters(appliedFilters);
    setShowFilterModal(true);
  };
  const applyFilter = () => {
    setAppliedFilters(draftFilters);
    setPage(0);
  };
  const resetFilter = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSortBy("tanggal_baru");
    setPage(0);
  };

  const activeFilterCountDesktop = hitungFilterAktifDesktop(appliedFilters);
  const activeFilterCountMobile = hitungFilterAktifMobile(appliedFilters, sortBy);

  const statCards = [
    {
      icon: CheckCircle2,
      label: "Hadir Hari Ini",
      desktopLabel: "Hadir Hari Ini",
      value: stat?.hadir ?? 0,
      caption: "Presensi tepat waktu",
      mobileCaption: "Tepat waktu",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Clock,
      label: "Terlambat",
      desktopLabel: "Terlambat",
      value: stat?.terlambat ?? 0,
      caption: `${stat?.lupa_presensi ?? 0} lupa presensi`,
      mobileCaption: `${stat?.lupa_presensi ?? 0} lupa presensi`,
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: FileText,
      label: "Izin & Sakit",
      desktopLabel: "Izin & Sakit",
      value: (stat?.izin ?? 0) + (stat?.sakit ?? 0),
      caption: `Izin ${stat?.izin ?? 0} · Sakit ${stat?.sakit ?? 0}`,
      mobileCaption: `Izin ${stat?.izin ?? 0} · Sakit ${stat?.sakit ?? 0}`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: UserX,
      label: "Alfa Hari Ini",
      desktopLabel: "Alfa Hari Ini",
      value: stat?.alfa ?? 0,
      caption: "Otomatis saat hari berganti",
      mobileCaption: "Otomatis 00:00",
      lightGradient: "from-rose-300 to-white",
      gradient: "from-rose-500 to-rose-700",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
    },
  ];

  const hariIni = stat?.hari_ini;

  return (
    <MentorLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala Halaman: Judul & Subjudul Standar Admin */}
        <div>
          <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Presensi Bimbingan
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Pantau kehadiran peserta bimbingan Anda. Sebagai mentor, Anda berwenang mengoreksi presensi dan memverifikasi pengajuan izin/sakit.
            </span>
            <span className="inline sm:hidden">
              Pantau dan kelola kehadiran harian peserta bimbingan Anda.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-24 text-slate-400 text-xs sm:text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat presensi bimbingan...
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Section Header Statistik Presensi */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 pt-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A5EC] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00A5EC]" />
                </span>
                <h3 className={`text-xs sm:text-sm font-black tracking-wide uppercase truncate ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                  Ringkasan Kehadiran Hari Ini
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                  isDark ? "bg-white/10 text-sky-300 border border-white/10" : "bg-blue-50 text-[#004F9F] border border-blue-100"
                }`}>
                  Real-Time
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11.5px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
                <span className="leading-snug">
                  {hariIni?.hari_kerja ? (
                    <>
                      <span className="hidden sm:inline">Akumulasi presensi peserta bimbingan diperbarui secara otomatis.</span>
                      <span className="inline sm:hidden">Diperbarui otomatis.</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Data hari ini bernilai 0 karena hari libur. Data lengkap dapat dilihat di tabel.</span>
                      <span className="inline sm:hidden">Hari libur · Data lengkap di tabel.</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {statCards.map((c, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
                    isDark
                      ? "border-white/10 bg-[#161b22]"
                      : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
                  }`}
                >
                  <div className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                    isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
                  }`} />
                  <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="inline sm:hidden">{c.label}</span>
                        <span className="hidden sm:inline">{c.desktopLabel}</span>
                      </p>
                      <h3 className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        {c.value}
                      </h3>
                      <p className={`mt-1 sm:mt-1.5 text-[8.5px] sm:text-xs font-medium leading-snug sm:whitespace-normal sm:line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <span className="inline sm:hidden">{c.mobileCaption}</span>
                        <span className="hidden sm:inline">{c.caption}</span>
                      </p>
                    </div>
                    <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                      <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {/* Panel Informasi Hari Ini */}
            {hariIni && (
              <div className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-md ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}>
                <div className={`absolute inset-y-0 left-0 w-1 sm:w-1.5 bg-gradient-to-b ${hariIni.hari_kerja ? "from-emerald-400 to-emerald-600" : "from-slate-300 to-slate-400"}`} />
                <div className="flex flex-col gap-3 sm:gap-4 px-3.5 sm:px-6 py-3 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Kartu tanggal + Teks */}
                  <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {(() => {
                        const tglStr = String(hariIni.tanggal || "").slice(0, 10);
                        const parts = tglStr.split("-");
                        const blnArr = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                        let dNum = "-";
                        let mStr = "-";
                        let hStr = "-";
                        if (parts.length === 3) {
                          const y = parseInt(parts[0], 10);
                          const m = parseInt(parts[1], 10) - 1;
                          const d = parseInt(parts[2], 10);
                          const dt = new Date(y, m, d);
                          dNum = d;
                          mStr = blnArr[m] || "-";
                          const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                          hStr = !isNaN(dt) ? hariList[dt.getDay()] : "-";
                        }
                        return (
                          <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                            <span className="absolute top-0 inset-x-0 h-3 sm:h-4 bg-white/15 text-center text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-widest leading-3 sm:leading-4">
                              {hStr}
                            </span>
                            <span className="mt-2.5 sm:mt-3 text-lg sm:text-2xl font-black leading-none">
                              {dNum}
                            </span>
                            <span className="text-[7.5px] sm:text-[9px] font-bold uppercase tracking-wider text-white/70">
                              {mStr}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className={`text-xs sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                            {formatTanggalHari(hariIni.tanggal)}
                          </h4>
                          {/* Desktop: Badge Libur / Hari Kerja di samping kanan teks */}
                          {hariIni.hari_kerja ? (
                            <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide ${
                              isDark ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            }`}>
                              <CalendarCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Hari kerja
                            </span>
                          ) : (
                            <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide ${
                              isDark ? "bg-white/10 text-slate-300 ring-1 ring-white/20" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                            }`}>
                              <CalendarOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Libur
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11.5px] font-medium text-slate-400">
                          {hariIni.hari_kerja ? (
                            <>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="hidden sm:inline">Presensi terbuka sampai 23:59 WIB - setelah itu sisanya otomatis alfa.</span>
                              <span className="inline sm:hidden">Presensi aktif s.d. 23:59 WIB.</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-3 h-3 shrink-0" />
                              {hariIni.alasan ? hariIni.alasan.charAt(0).toUpperCase() + hariIni.alasan.slice(1) : "Tidak ada kewajiban presensi hari ini"}.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Only: Badge Libur / Hari Kerja di pojok kanan */}
                    <div className="block sm:hidden shrink-0 self-center ml-auto">
                      {hariIni.hari_kerja ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wide ${
                          isDark ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        }`}>
                          <CalendarCheck className="w-2.5 h-2.5" /> Hari kerja
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wide ${
                          isDark ? "bg-white/10 text-slate-300 ring-1 ring-white/20" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}>
                          <CalendarOff className="w-2.5 h-2.5" /> Libur
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan Desktop: Progres presensi jika hari kerja */}
                  {hariIni.hari_kerja ? (
                    <div className="flex w-full max-w-md flex-col gap-1.5 sm:gap-2 lg:w-80">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                        <span className={`inline-flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          <Users className="w-3 h-3" /> Progres presensi bimbingan
                        </span>
                        <span className={isDark ? "text-slate-200" : "text-[#0B1442]"}>
                          {hariIni.sudah_presensi}/{hariIni.wajib_presensi}
                        </span>
                      </div>
                      <div className={`h-2 sm:h-2.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                          style={{
                            width: `${hariIni.wajib_presensi > 0 ? Math.min(100, Math.round((hariIni.sudah_presensi / hariIni.wajib_presensi) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold ${
                          isDark ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        }`}>
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Sudah {hariIni.sudah_presensi}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold ${
                          isDark ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}>
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Belum {hariIni.belum_presensi}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold ${
                          isDark ? "bg-white/5 text-slate-300 ring-1 ring-white/10" : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                        }`}>
                          <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Wajib {hariIni.wajib_presensi}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className={`hidden sm:inline-flex w-fit items-center gap-2 rounded-xl px-3 py-1.5 text-[10.5px] sm:text-[11.5px] font-bold ${
                      isDark ? "bg-white/5 text-slate-400 ring-1 ring-white/10" : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                    }`}>
                      <CalendarOff className="w-3.5 h-3.5" /> Tidak ada kewajiban presensi
                    </span>
                  )}
                </div>
              </div>
            )}



            {/* Tabel Card Utama Ala Role Admin */}
            <div className={`rounded-2xl border shadow-xs overflow-hidden ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              {/* Header Kartu: Judul + Export Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-5 pb-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Riwayat Presensi Peserta Bimbingan
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">
                      Gunakan tombol koreksi bila peserta lupa presensi atau terdapat kekeliruan pencatatan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {refreshing && (
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
                      isDark ? "bg-white/5 text-slate-400 ring-1 ring-white/10" : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                    }`}>
                      <Loader2 className="w-3 h-3 animate-spin" /> Memuat
                    </span>
                  )}
                  {/* Button Ekspor Data */}
                  <div className={exporting ? "pointer-events-none opacity-60" : ""}>
                    <ExportDropdown onExport={handleExport} isDark={isDark} />
                  </div>
                </div>
              </div>

              {/* Toolbar: Toggle Mode Ringkas/Semua + Sort + Filter + Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-3.5 sm:pb-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {/* Toggle Mode: Ringkas (1 per peserta) vs Semua */}
                  <div className={`inline-flex h-[36px] sm:h-[40px] shrink-0 items-center rounded-lg sm:rounded-xl border p-0.5 sm:p-1 shadow-xs ${
                    isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"
                  }`}>
                    {[
                      { key: "terbaru", label: "Ringkas", icon: Layers, hint: "1 baris terbaru per peserta" },
                      { key: "semua", label: "Semua", icon: Rows3, hint: "Semua baris presensi" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        title={m.hint}
                        onClick={() => gantiMode(m.key)}
                        className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                          mode === m.key
                            ? isDark
                              ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md border border-white/15"
                              : "bg-white text-[#004F9F] shadow-sm ring-1 ring-[#004F9F]/20"
                            : isDark
                            ? "text-slate-400 hover:text-slate-200"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <m.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Desktop Only: Sort dropdown */}
                  <div className="hidden sm:block">
                    <PresensiSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                  </div>

                  {/* Desktop Only: Filter button */}
                  <button
                    type="button"
                    onClick={openFilter}
                    className={`hidden sm:inline-flex group h-[38px] sm:h-[42px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 text-[11px] sm:text-xs font-bold shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
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

                {/* Search Box & Mobile Filter */}
                <div className="flex items-center gap-2 w-full sm:w-64 sm:shrink-0">
                  {/* Mobile Only Filter Button */}
                  <div className="block sm:hidden shrink-0">
                    <button
                      type="button"
                      onClick={openFilter}
                      className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-xs transition-all duration-200 active:scale-95 cursor-pointer ${
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

                  {/* Search Input */}
                  <div className={`relative flex-1 sm:w-64 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.02]" : ""}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 transition-all duration-200 pointer-events-none ${
                      isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"
                    }`} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Cari nama atau institusi..."
                      className={`w-full rounded-lg sm:rounded-xl border pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium outline-hidden transition-all duration-200 ${
                        isSearchFocused
                          ? isDark
                            ? "border-[#00A5EC] bg-[#1c2333] text-slate-100 shadow-md ring-4 ring-[#00A5EC]/15"
                            : "border-[#004F9F] bg-white text-slate-700 shadow-md ring-4 ring-[#00A5EC]/15"
                          : isDark
                          ? "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Presensi Bimbingan */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] sm:text-[13px]">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/60"}`}>
                      {/* Peserta (Mobile & Desktop) */}
                      <SortableHeader
                        label="Peserta"
                        columnKey="nama"
                        sortBy={sortBy}
                        onSort={setSortBy}
                        isDark={isDark}
                        className="w-[50%] sm:w-[22%]"
                      />

                      {/* Tanggal (Desktop Only) */}
                      <SortableHeader
                        label="Tanggal"
                        columnKey="tanggal"
                        sortBy={sortBy}
                        onSort={setSortBy}
                        isDark={isDark}
                        className="hidden sm:table-cell sm:w-[15%]"
                      />

                      {/* Jam Masuk / Pulang (Desktop Only) */}
                      <SortableHeader
                        label="Jam Masuk / Pulang"
                        columnKey="jam"
                        sortBy={sortBy}
                        onSort={setSortBy}
                        isDark={isDark}
                        className="hidden sm:table-cell sm:w-[18%]"
                      />

                      {/* Logbook (Desktop Only) */}
                      <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 sm:w-[17%]">
                        Logbook
                      </th>

                      {/* Bidang (Desktop Only) */}
                      <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 sm:w-[12%]">
                        Bidang
                      </th>

                      {/* Status (Mobile & Desktop) */}
                      <SortableHeader
                        label="Status"
                        columnKey="status"
                        sortBy={sortBy}
                        onSort={setSortBy}
                        isDark={isDark}
                        className="w-[28%] sm:w-[10%]"
                      />

                      {/* Aksi (Mobile & Desktop) */}
                      <th className="px-3 sm:px-6 py-3 sm:py-3.5 text-right text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 w-[22%] sm:w-[6%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-50"}`}>
                    {rows.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={7} className="px-4 sm:px-6 py-14 sm:py-16">
                          <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 text-center">
                            <span className={`relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
                              isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                            }`}>
                              <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
                              <span className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
                                isDark ? "border-white/20" : "border-slate-200"
                              }`} />
                            </span>
                            <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                              Belum ada data presensi peserta bimbingan
                            </p>
                            <p className="text-[10.5px] sm:text-xs text-slate-400 max-w-sm">
                              Coba ubah filter atau periode tanggal. Data presensi akan tercatat otomatis saat peserta melakukan presensi.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => {
                        const bidangColor = getBidangColor(r.bidang);
                        return (
                          <Fragment key={r.id}>
                            <tr
                              className={`group transition-all duration-200 animate-[fadeslide_0.3s_ease-out] ${
                                isDark
                                  ? "hover:bg-white/[0.03]"
                                  : "hover:bg-blue-50/30 hover:shadow-xs"
                              }`}
                              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
                            >
                              {/* 1. Peserta (Mobile & Desktop) */}
                              <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                                <div
                                  onClick={() => toggleRow(r.id)}
                                  className="flex items-center gap-2 sm:gap-3 cursor-pointer sm:cursor-default select-none"
                                >
                                  <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className={`font-bold transition-colors duration-200 line-clamp-2 break-words text-[11px] sm:text-xs leading-snug ${
                                        isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                      }`}>
                                        {r.nama}
                                      </p>
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 shrink-0 block sm:hidden transition-transform duration-300 ${
                                          expandedRows[r.id] ? "rotate-180 text-[#00A5EC]" : "text-slate-400"
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

                              {/* 2. Tanggal (Desktop Only) */}
                              <td className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-4">
                                <div className="group/tgl inline-flex flex-col items-start gap-1">
                                  <p className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap transition-all duration-300 group-hover/tgl:-translate-y-0.5 ${
                                    isDark
                                      ? "border-white/10 bg-white/5 text-slate-300 group-hover/tgl:border-[#00A5EC]/40 group-hover/tgl:text-[#00A5EC]"
                                      : "border-slate-200 bg-slate-50 text-slate-600 group-hover/tgl:border-[#004F9F]/30 group-hover/tgl:bg-white group-hover/tgl:text-[#004F9F] group-hover/tgl:shadow-sm"
                                  }`}>
                                    <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[#004F9F] dark:text-sky-400 transition-transform duration-300 group-hover/tgl:rotate-[-8deg]" />
                                    <span className="flex flex-col leading-tight">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-[#004F9F]/70 dark:text-sky-400/80">
                                        {namaHari(r.tanggal)}
                                      </span>
                                      <span>{formatTanggalLengkap(r.tanggal)}</span>
                                    </span>
                                  </p>
                                  {r.dikunci && (
                                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                      isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-400"
                                    }`}>
                                      <Lock className="w-2.5 h-2.5" /> Terkunci
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 3. Jam Masuk / Pulang (Desktop Only) */}
                              <td className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-4">
                                <div className="group/jam flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold ring-1 transition-all duration-300 group-hover/jam:-translate-y-0.5 ${
                                    isDark
                                      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                                      : "bg-emerald-50 text-emerald-600 ring-transparent group-hover/jam:bg-emerald-100 group-hover/jam:ring-emerald-200"
                                  }`}>
                                    <LogIn className="w-2.5 h-2.5" /> {r.jam_masuk || "--:--"}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold ring-1 transition-all duration-300 group-hover/jam:-translate-y-0.5 ${
                                    isDark
                                      ? "bg-sky-500/10 text-sky-300 ring-sky-500/20"
                                      : "bg-sky-50 text-sky-600 ring-transparent group-hover/jam:bg-sky-100 group-hover/jam:ring-sky-200"
                                  }`}>
                                    <LogOut className="w-2.5 h-2.5" /> {r.jam_pulang || "--:--"}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {r.menit_terlambat > 0 && (
                                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                      isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"
                                    }`}>
                                      <Clock className="w-2.5 h-2.5" /> +{formatMenit(r.menit_terlambat)}
                                    </span>
                                  )}
                                  {r.lupa_presensi && (
                                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                      isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                                    }`}>
                                      <AlarmClockOff className="w-2.5 h-2.5" /> Lupa presensi
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 4. Logbook (Desktop Only) */}
                              <td className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-4">
                                {(() => {
                                  const rawKet = (r.keterangan || "").trim();
                                  const isFallback = rawKet === "Belum melakukan presensi hari ini";
                                  const hasLogbook =
                                    rawKet !== "" &&
                                    !isFallback &&
                                    r.status !== "alfa" &&
                                    r.status !== "alpa" &&
                                    r.status !== "izin" &&
                                    r.status !== "sakit";

                                  if (r.status === "izin" || r.status === "sakit") {
                                    return (
                                      <p
                                        className={`text-[10px] sm:text-[10.5px] italic font-medium leading-relaxed break-words max-w-[220px] ${
                                          isDark ? "text-slate-400" : "text-slate-500"
                                        }`}
                                      >
                                        {rawKet || (r.status === "sakit" ? "Dispensasi Sakit" : "Dispensasi Izin")}
                                      </p>
                                    );
                                  }

                                  if (r.status === "alfa" || r.status === "alpa") {
                                    return <span className="text-[10.5px] text-slate-400">-</span>;
                                  }

                                  if (hasLogbook) {
                                    return (
                                      <p
                                        className={`text-[10px] sm:text-[10.5px] font-medium leading-relaxed break-words max-w-[240px] whitespace-normal ${
                                          isDark ? "text-slate-200" : "text-slate-700"
                                        }`}
                                      >
                                        {rawKet}
                                      </p>
                                    );
                                  }

                                  return (
                                    <span className="text-[10px] sm:text-[10.5px] text-slate-400 italic">
                                      -
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* 5. Bidang (Desktop Only) */}
                              <td className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-4">
                                {r.bidang ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 ${bidangColor.bg} ${bidangColor.text}`}
                                    style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                  >
                                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>{r.bidang}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">-</span>
                                )}
                              </td>

                              {/* 6. Status (Mobile & Desktop) */}
                              <td className="px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                                <PresensiStatusBadge status={r.status} />
                              </td>

                              {/* 7. Aksi (Mobile & Desktop) */}
                              <td className="px-2 sm:px-6 py-2.5 sm:py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <PresensiBimbinganActionsDropdown
                                    onDetail={() => setDetail(r)}
                                    onKoreksi={() => setKoreksi(r)}
                                    hasRiwayat={mode === "terbaru" && Boolean(r.total_riwayat > 1)}
                                    totalRiwayat={r.total_riwayat || 0}
                                    onToggleRiwayat={() =>
                                      setSelectedPesertaRiwayat({
                                        ...r,
                                        peserta_id: r.peserta_id || r.peserta?.id,
                                      })
                                    }
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
                                    expandedRows[r.id]
                                      ? "max-h-[350px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]"
                                      : "max-h-0 opacity-0 p-0 border-none"
                                  }`}
                                >
                                  <div className="space-y-2 text-[10.5px]">
                                    {/* Institusi */}
                                    {r.institusi && (
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <GraduationCap className="w-3 h-3 text-slate-400" /> Institusi:
                                        </span>
                                        <span className={`font-bold truncate max-w-[180px] ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                          {r.institusi}
                                        </span>
                                      </div>
                                    )}

                                    {/* Tanggal */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                        <CalendarDays className="w-3 h-3 text-slate-400" /> Tanggal:
                                      </span>
                                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                                        <span>{namaHari(r.tanggal)}, {formatTanggalPresensi(r.tanggal)}</span>
                                        {r.dikunci && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                      </span>
                                    </div>

                                    {/* Jam Masuk / Pulang */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                        <Clock className="w-3 h-3 text-slate-400" /> Jam:
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">
                                          <LogIn className="w-2.5 h-2.5" /> {r.jam_masuk || "--:--"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-600 dark:text-sky-400">
                                          <LogOut className="w-2.5 h-2.5" /> {r.jam_pulang || "--:--"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Terlambat / Lupa Presensi if any */}
                                    {(r.menit_terlambat > 0 || r.lupa_presensi) && (
                                      <div className="flex items-center justify-end gap-1.5">
                                        {r.menit_terlambat > 0 && (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600 dark:text-amber-400">
                                            <Clock className="w-2.5 h-2.5" /> +{formatMenit(r.menit_terlambat)}
                                          </span>
                                        )}
                                        {r.lupa_presensi && (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-300">
                                            <AlarmClockOff className="w-2.5 h-2.5" /> Lupa presensi
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Bidang */}
                                    {r.bidang && (
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <Building2 className="w-3 h-3 text-slate-400" /> Bidang:
                                        </span>
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black ${bidangColor.bg} ${bidangColor.text}`}
                                          style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                        >
                                          {r.bidang}
                                        </span>
                                      </div>
                                    )}

                                    {/* Quick Actions Mobile */}
                                    <div className="flex items-center justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setDetail(r)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                      >
                                        <Eye className="w-3 h-3" /> Detail
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setKoreksi(r)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-[#004F9F] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
                                      >
                                        <PencilLine className="w-3 h-3" /> Koreksi
                                      </button>
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
                totalItems={total}
                page={page}
                setPage={setPage}
                perPage={perPage}
                setPerPage={setPerPage}
              />
            </div>

            {/* Ketentuan & Jam Kerja Resmi */}
            <JamKerjaCard />
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <PresensiBimbinganFilterModal
          isOpen={showFilterModal}
          draft={draftFilters}
          setDraft={setDraftFilters}
          hasActive={activeFilterCountDesktop > 0}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}

      {/* Detail Presensi Modal */}
      {detail && (
        <DetailPresensiBimbinganModal
          presensi={detail}
          onClose={() => setDetail(null)}
          onKoreksi={(k) => setKoreksi(k)}
          isDark={isDark}
        />
      )}

      {/* Koreksi Presensi Modal (Mentor) */}
      {koreksi && (
        <KoreksiPresensiModal
          data={koreksi}
          onClose={() => setKoreksi(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
          isDark={isDark}
        />
      )}

      {/* Riwayat Presensi Lampau Modal */}
      {selectedPesertaRiwayat && (
        <RiwayatPresensiBimbinganModal
          peserta={selectedPesertaRiwayat}
          onClose={() => setSelectedPesertaRiwayat(null)}
          onSelectDetail={(d) => {
            setSelectedPesertaRiwayat(null);
            setDetail(d);
          }}
          onSelectKoreksi={(k) => {
            setSelectedPesertaRiwayat(null);
            setKoreksi(k);
          }}
          isDark={isDark}
        />
      )}
    </MentorLayout>
  );
};

export default PresensiBimbinganPage;