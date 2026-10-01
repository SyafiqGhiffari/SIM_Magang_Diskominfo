import { useCallback, useEffect, useMemo, useState } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import PresensiStatusBadge from "../../components/manajemen/shared/PresensiStatusBadge";
import PresensiStats from "../../components/manajemen/peserta/presensi/PresensiStats";
import DetailPresensiModal from "../../components/manajemen/peserta/presensi/DetailPresensiModal";
import PresensiSortDropdown from "../../components/manajemen/shared/PresensiSortDropdown";
import PresensiSayaFilterModal from "../../components/manajemen/peserta/presensi/PesertaRiwayatFilterModal";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import Pagination from "../../components/manajemen/shared/Pagination";
import BulanPicker from "../../components/manajemen/shared/BulanPicker";
import { getRiwayatPresensiSaya, getHariLibur } from "../../services/pesertaService";
import {
  formatTanggalPresensi,
  formatTanggalLengkap,
  formatMenit,
  namaHari,
  BULAN_ID,
  PESERTA_PRESENSI_SORT_OPTS,
} from "../../constants/presensiStatus";
import { toastError, toastSuccess } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { exportPresensiToPdf, exportPresensiToExcel, exportPresensiToCsv } from "../../utils/exportPresensi";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter as FilterIcon,
  Inbox,
  Eye,
  Search,
  Fingerprint,
  FileText,
  X,
  CalendarDays,
  Clock,
  Timer,
  Check,
} from "lucide-react";

const BULAN_PANJANG_KALENDER = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const bulanSekarang = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const geserBulan = (bulan, delta) => {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const labelBulan = (bulan) => {
  const [y, m] = bulan.split("-").map(Number);
  return `${BULAN_ID[m - 1]} ${y}`;
};

const emptyFilters = {
  status: [],
  tanggal_dari: "",
  tanggal_sampai: "",
  lupa_presensi: false,
};

const hitungDurasiKerja = (jamMasuk, jamPulang) => {
  if (!jamMasuk || !jamPulang) return "-";
  const [h1, m1] = jamMasuk.slice(0, 5).split(":").map(Number);
  const [h2, m2] = jamPulang.slice(0, 5).split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "-";
  let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMin <= 0) return "-";
  const jam = Math.floor(diffMin / 60);
  const sisa = diffMin % 60;
  if (jam > 0 && sisa > 0) return `${jam} Jam ${sisa} Menit`;
  if (jam > 0) return `${jam} Jam`;
  return `${sisa} Menit`;
};

const hitungFilterAktifDesktop = (f = {}) =>
  (f?.status?.length || 0) +
  (f?.tanggal_dari ? 1 : 0) +
  (f?.tanggal_sampai ? 1 : 0) +
  (f?.lupa_presensi ? 1 : 0);

const hitungFilterAktifMobile = (f = {}, sort) =>
  hitungFilterAktifDesktop(f) + (sort && sort !== "tanggal_baru" ? 1 : 0);

const SortableHeader = ({ label, columnKey, sortBy, onSort, isDark, className = "" }) => {
  let isActive = false;
  let direction = null; // 'asc' | 'desc'
  if (columnKey === "tanggal") {
    if (sortBy === "tanggal_lama") { isActive = true; direction = "asc"; }
    else if (sortBy === "tanggal_baru") { isActive = true; direction = "desc"; }
  } else if (columnKey === "jam_masuk") {
    if (sortBy === "jam_masuk_awal") { isActive = true; direction = "asc"; }
    else if (sortBy === "jam_masuk_akhir" || sortBy === "terlambat_terbanyak") { isActive = true; direction = "desc"; }
  } else if (columnKey === "jam_pulang") {
    if (sortBy === "jam_pulang_awal") { isActive = true; direction = "asc"; }
    else if (sortBy === "jam_pulang_akhir") { isActive = true; direction = "desc"; }
  } else if (columnKey === "status") {
    if (sortBy === "status" || sortBy === "status_asc") { isActive = true; direction = "asc"; }
    else if (sortBy === "status_desc") { isActive = true; direction = "desc"; }
  }

  const handleClick = () => {
    if (columnKey === "tanggal") {
      onSort(sortBy === "tanggal_baru" ? "tanggal_lama" : "tanggal_baru");
    } else if (columnKey === "jam_masuk") {
      onSort(sortBy === "jam_masuk_awal" ? "jam_masuk_akhir" : "jam_masuk_awal");
    } else if (columnKey === "jam_pulang") {
      onSort(sortBy === "jam_pulang_akhir" ? "jam_pulang_awal" : "jam_pulang_akhir");
    } else if (columnKey === "status") {
      onSort(sortBy === "status" ? "status_desc" : "status");
    } else {
      onSort("tanggal_baru");
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

export const PesertaRiwayatPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai();

  // State Data
  const [riwayat, setRiwayat] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [periodeInfo, setPeriodeInfo] = useState(null);
  const [bulan, setBulan] = useState(bulanSekarang);
  const [liburList, setLiburList] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [selectedPresensiDetail, setSelectedPresensiDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("tanggal_baru");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter State
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const openFilter = () => {
    setDraftFilters(appliedFilters);
    setShowFilterModal(true);
  };

  const activeFilterCountDesktop = hitungFilterAktifDesktop(appliedFilters);
  const activeFilterCountMobile = hitungFilterAktifMobile(appliedFilters, sortBy);

  const fetchRiwayat = useCallback(async () => {
    try {
      const res = await getRiwayatPresensiSaya({ bulan });
      const payload = res.data?.data || {};
      setRiwayat(payload.data || []);
      setRingkasan(payload.ringkasan || null);
      setPeriodeInfo(payload.periode || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat riwayat presensi.");
    } finally {
      setLoading(false);
    }
  }, [bulan]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchRiwayat();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchRiwayat, reloadKey]);

  useEffect(() => {
    let isMounted = true;
    getHariLibur()
      .then((res) => {
        if (isMounted) setLiburList(res.data?.data || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const liburByDay = useMemo(() => {
    const map = {};
    liburList.forEach((item) => {
      if (item.tanggal) {
        const tgl = String(item.tanggal).slice(0, 10);
        map[tgl] = item;
      }
    });
    return map;
  }, [liburList]);

  // ── Perhitungan Akumulasi Jam Dinas Pekan Ini (Senin - Jumat) ──
  const weeklyWorkStats = useMemo(() => {
    const today = new Date();
    const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOfWeek = today.getDay(); // 0: Min, 1: Sen, ..., 6: Sab
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today0);
    monday.setDate(monday.getDate() + diffToMonday);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const weekNumber = Math.ceil(monday.getDate() / 7);
    const formatTglSingkat = (d) =>
      `${d.getDate()} ${BULAN_PANJANG_KALENDER[d.getMonth()]}`;
    const subtitle = `Periode Pekan Ke-${weekNumber} (${formatTglSingkat(monday)} - ${formatTglSingkat(friday)} ${friday.getFullYear()})`;

    const DAY_LABELS = [
      { key: "sen", label: "SEN", dayName: "Senin", defaultEst: 8.0 },
      { key: "sel", label: "SEL", dayName: "Selasa", defaultEst: 8.0 },
      { key: "rab", label: "RAB", dayName: "Rabu", defaultEst: 8.0 },
      { key: "kam", label: "KAM", dayName: "Kamis", defaultEst: 8.0 },
      { key: "jum", label: "JUM", dayName: "Jumat", defaultEst: 6.5 },
    ];

    let totalHours = 0;
    let hadirCount = 0;
    let terlambatCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let alfaCount = 0;
    let dinasLuarCount = 0;

    const days = DAY_LABELS.map((dl, idx) => {
      const curDate = new Date(monday);
      curDate.setDate(monday.getDate() + idx);
      const isToday =
        curDate.getFullYear() === today.getFullYear() &&
        curDate.getMonth() === today.getMonth() &&
        curDate.getDate() === today.getDate();
      const isPast = curDate < today0;
      const isFuture = curDate > today0;

      const dateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, "0")}-${String(curDate.getDate()).padStart(2, "0")}`;
      const rec = riwayat.find((r) => String(r.tanggal).slice(0, 10) === dateStr);

      const isHoliday = Boolean(liburByDay[dateStr]);

      let statusCode = "belum";
      let hours = 0;
      let durationText = "";
      let jamMasuk = null;
      let jamPulang = null;
      let menitTerlambat = 0;

      if (rec) {
        statusCode = rec.status || "belum";
        jamMasuk = rec.jam_masuk ? rec.jam_masuk.slice(0, 5) : null;
        jamPulang = rec.jam_pulang ? rec.jam_pulang.slice(0, 5) : null;
        menitTerlambat = rec.menit_terlambat || 0;

        if (statusCode === "pulang" || (statusCode === "belum" && jamMasuk)) {
          statusCode = (menitTerlambat > 0 || rec.status === "terlambat") ? "terlambat" : "hadir";
        }
        if (statusCode === "hadir" && menitTerlambat > 0) {
          statusCode = "terlambat";
        }

        if (jamMasuk && jamPulang) {
          const [h1, m1] = jamMasuk.split(":").map(Number);
          const [h2, m2] = jamPulang.split(":").map(Number);
          const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
          hours = diffMin > 0 ? Number((diffMin / 60).toFixed(1)) : 0;
          durationText = `${hours} jam`;
        } else if (jamMasuk) {
          hours = dl.defaultEst;
          durationText = `${hours} jam`;
        } else if (statusCode === "izin" || statusCode === "sakit") {
          hours = 0;
          durationText = statusCode === "izin" ? "Izin Resmi" : "Surat Sakit";
        } else if (statusCode === "alfa") {
          hours = 0;
          durationText = "Alfa (0 jam)";
        } else if (statusCode === "libur" || isHoliday) {
          statusCode = "libur";
          hours = 0;
          durationText = "Libur";
        }
      } else if (isHoliday) {
        statusCode = "libur";
        hours = 0;
        durationText = "Libur";
      } else if (isPast) {
        statusCode = "alfa";
        hours = 0;
        durationText = "Alfa";
      }

      if (statusCode === "hadir") {
        totalHours += hours;
        hadirCount += 1;
      } else if (statusCode === "terlambat") {
        totalHours += hours;
        terlambatCount += 1;
      } else if (statusCode === "izin") {
        izinCount += 1;
      } else if (statusCode === "sakit") {
        sakitCount += 1;
      } else if (statusCode === "alfa") {
        alfaCount += 1;
      } else if (statusCode === "dinas_luar") {
        dinasLuarCount += 1;
        totalHours += dl.defaultEst;
      }

      return {
        ...dl,
        tglDisplay: `${curDate.getDate()} ${BULAN_PANJANG_KALENDER[curDate.getMonth()]}`,
        tglDisplayLengkap: `${curDate.getDate()} ${BULAN_PANJANG_KALENDER[curDate.getMonth()]} ${curDate.getFullYear()}`,
        isToday,
        isPast,
        isFuture,
        hasActual: Boolean(rec),
        statusCode,
        menitTerlambat,
        hours,
        jamMasuk,
        jamPulang,
        durationText:
          durationText ||
          (isHoliday
            ? (liburByDay[dateStr]?.nama || "Libur")
            : isFuture
            ? "-"
            : isPast
            ? "0.0 jam"
            : "Belum Presensi"),
        isHoliday,
        holidayName: isHoliday ? (liburByDay[dateStr]?.nama || "Libur") : "",
      };
    });

    const recordedDaysCount = hadirCount + terlambatCount + izinCount + sakitCount + alfaCount + dinasLuarCount;
    const totalWorkingDays = hadirCount + terlambatCount + dinasLuarCount;
    const avgDailyHours = totalWorkingDays > 0 ? (totalHours / totalWorkingDays) : 0;
    const totalMinutes = Math.round(totalHours * 60);
    const jamFormat = Math.floor(totalMinutes / 60);
    const menitFormat = totalMinutes % 60;
    const formattedTotalHoursMinutes = `${jamFormat} Jam${menitFormat > 0 ? ` ${menitFormat} Menit` : ""}`;

    return {
      subtitle,
      totalHours,
      recordedDaysCount,
      hadirCount,
      terlambatCount,
      izinCount,
      sakitCount,
      alfaCount,
      dinasLuarCount,
      avgDailyHours,
      formattedTotalHoursMinutes,
      days,
    };
  }, [riwayat, liburByDay]);

  // Filter & Search & Sort
  const filteredRiwayat = useMemo(() => {
    let list = [...riwayat];

    // Status filter
    if (appliedFilters?.status?.length > 0) {
      list = list.filter((r) => appliedFilters.status.includes(r.status));
    }

    // Rentang Tanggal
    if (appliedFilters?.tanggal_dari) {
      list = list.filter((r) => String(r.tanggal || "").slice(0, 10) >= appliedFilters.tanggal_dari);
    }
    if (appliedFilters?.tanggal_sampai) {
      list = list.filter((r) => String(r.tanggal || "").slice(0, 10) <= appliedFilters.tanggal_sampai);
    }

    // Lupa Presensi
    if (appliedFilters?.lupa_presensi) {
      list = list.filter((r) => Boolean(r.lupa_presensi));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const tglStr = formatTanggalPresensi(r.tanggal).toLowerCase();
        const tglLengkap = formatTanggalLengkap(r.tanggal).toLowerCase();
        const hari = namaHari(r.tanggal).toLowerCase();
        const st = (r.status || "").toLowerCase();
        const ket = (r.keterangan || "").toLowerCase();
        const jm = (r.jam_masuk || "").slice(0, 5);
        const jp = (r.jam_pulang || "").slice(0, 5);
        return (
          tglStr.includes(q) ||
          tglLengkap.includes(q) ||
          hari.includes(q) ||
          st.includes(q) ||
          ket.includes(q) ||
          jm.includes(q) ||
          jp.includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "tanggal_baru") return (b.tanggal || "").localeCompare(a.tanggal || "");
      if (sortBy === "tanggal_lama") return (a.tanggal || "").localeCompare(b.tanggal || "");
      if (sortBy === "jam_masuk_awal") return (a.jam_masuk || "99:99").localeCompare(b.jam_masuk || "99:99");
      if (sortBy === "jam_masuk_akhir") return (b.jam_masuk || "00:00").localeCompare(a.jam_masuk || "00:00");
      if (sortBy === "jam_pulang_awal") return (a.jam_pulang || "99:99").localeCompare(a.jam_pulang || "99:99");
      if (sortBy === "jam_pulang_akhir") return (b.jam_pulang || "00:00").localeCompare(a.jam_pulang || "00:00");
      if (sortBy === "terlambat_terbanyak") return (b.menit_terlambat || 0) - (a.menit_terlambat || 0);
      if (sortBy === "status" || sortBy === "status_asc") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "status_desc") return (b.status || "").localeCompare(a.status || "");
      return 0;
    });

    // Deduplikasi per tanggal (utamakan record yang memiliki jam_masuk / status tercatat)
    const uniqueMap = new Map();
    for (const item of list) {
      const tglKey = String(item.tanggal || "").slice(0, 10);
      if (!tglKey) continue;
      if (!uniqueMap.has(tglKey)) {
        uniqueMap.set(tglKey, item);
      } else {
        const existing = uniqueMap.get(tglKey);
        if ((item.jam_masuk || item.status !== "belum") && (!existing.jam_masuk && existing.status === "belum")) {
          uniqueMap.set(tglKey, item);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }, [riwayat, appliedFilters, searchQuery, sortBy]);

  // Paginated List
  const paginatedRiwayat = useMemo(() => {
    const start = page * perPage;
    return filteredRiwayat.slice(start, start + perPage);
  }, [filteredRiwayat, page, perPage]);

  // Export handlers
  const handleExport = (type) => {
    if (filteredRiwayat.length === 0) {
      toastError("Tidak ada data presensi yang sesuai untuk diekspor.");
      return;
    }
    const filename = `Riwayat_Presensi_${bulan}`;
    if (type === "pdf") {
      exportPresensiToPdf(filteredRiwayat, labelBulan(bulan), filename);
    } else if (type === "excel") {
      exportPresensiToExcel(filteredRiwayat, filename);
    } else if (type === "csv") {
      exportPresensiToCsv(filteredRiwayat, filename);
    }
    toastSuccess(`Data presensi berhasil diekspor ke ${type.toUpperCase()}.`);
  };

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Riwayat Aktivitas &amp; Presensi
            </h2>
            <p className={`mt-1 text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {readOnly
                ? "Masa magang Anda telah selesai. Anda dapat meninjau seluruh riwayat kehadiran dan mengekspor dokumen laporan."
                : "Rekapitulasi lengkap catatan kehadiran harian, keterlambatan, surat izin resmi, jurnal logbook, serta ekspor dokumen resmi."}
            </p>
          </div>
        </div>

        {/* 4 CARD RINGKASAN STATISTIK BULANAN */}
        <PresensiStats
          ringkasan={ringkasan}
          periodeInfo={periodeInfo}
          bulan={bulan}
          isDark={isDark}
        />

        {/* CARD TABEL RIWAYAT PRESENSI BULANAN */}
        <div
          className={`w-full rounded-2xl border shadow-sm overflow-hidden ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Baris 1: Header Card */}
          <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="min-w-0">
                <h3 className={`text-sm sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Riwayat Presensi Bulanan
                </h3>
                <p className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-md truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="inline sm:hidden">Daftar presensi {labelBulan(bulan)}.</span>
                  <span className="hidden sm:inline">
                    Menampilkan {filteredRiwayat.length} catatan presensi pada {labelBulan(bulan)}.
                  </span>
                </p>
              </div>
            </div>

            {/* Tombol Ekspor */}
            <div className="shrink-0">
              <ExportDropdown onExport={handleExport} isDark={isDark} />
            </div>
          </div>

          {/* Baris 2: Controls (Bulan, Sort, Filter, Search) */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-4 sm:pb-5 border-b ${
              isDark ? "border-white/10" : "border-slate-100"
            }`}
          >
            {/* Sisi Kiri: Navigasi Bulan + Sort + Filter */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div
                className={`inline-flex h-[38px] sm:h-[42px] shrink-0 items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border px-0.5 sm:px-1 shadow-sm ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setBulan((b) => geserBulan(b, -1));
                    setPage(0);
                  }}
                  title="Bulan sebelumnya"
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer ${
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <BulanPicker
                  value={bulan}
                  onChange={(val) => {
                    setBulan(val);
                    setPage(0);
                  }}
                  max={bulanSekarang()}
                  isDark={isDark}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = geserBulan(bulan, 1);
                    if (next <= bulanSekarang()) {
                      setBulan(next);
                      setPage(0);
                    }
                  }}
                  disabled={bulan >= bulanSekarang()}
                  title="Bulan berikutnya"
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Desktop Only: Sort dropdown */}
              <div className="hidden sm:block">
                <PresensiSortDropdown
                  sortBy={sortBy}
                  setSortBy={(val) => {
                    setSortBy(val);
                    setPage(0);
                  }}
                  options={PESERTA_PRESENSI_SORT_OPTS}
                  isDark={isDark}
                />
              </div>

              {/* Desktop Only: Filter button */}
              <button
                type="button"
                onClick={openFilter}
                className={`hidden sm:inline-flex group items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari tanggal, status, waktu..."
                  className={`w-full rounded-lg sm:rounded-xl border pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium outline-none transition-all duration-200 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#00A5EC]/20"
                      : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-[#004F9F] focus:ring-2 focus:ring-[#004F9F]/20"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(0);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className={`border-b ${
                  isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-slate-200/80 bg-slate-50/70 text-slate-500"
                }`}>
                  <SortableHeader
                    label="Tanggal"
                    columnKey="tanggal"
                    sortBy={sortBy}
                    onSort={(newSort) => {
                      setSortBy(newSort);
                      setPage(0);
                    }}
                    isDark={isDark}
                    className="min-w-[170px]"
                  />
                  <SortableHeader
                    label="Jam Masuk"
                    columnKey="jam_masuk"
                    sortBy={sortBy}
                    onSort={(newSort) => {
                      setSortBy(newSort);
                      setPage(0);
                    }}
                    isDark={isDark}
                    className="min-w-[120px]"
                  />
                  <SortableHeader
                    label="Jam Pulang"
                    columnKey="jam_pulang"
                    sortBy={sortBy}
                    onSort={(newSort) => {
                      setSortBy(newSort);
                      setPage(0);
                    }}
                    isDark={isDark}
                    className="min-w-[120px]"
                  />
                  <th className="px-3.5 sm:px-4 py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider min-w-[110px]">
                    Total Jam
                  </th>
                  <th className="px-3.5 sm:px-4 py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider min-w-[120px]">
                    Terlambat
                  </th>
                  <th className="px-3.5 sm:px-4 py-3.5 text-left text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider min-w-[200px]">
                    Logbook Harian
                  </th>
                  <SortableHeader
                    label="Status Kehadiran"
                    columnKey="status"
                    sortBy={sortBy}
                    onSort={(newSort) => {
                      setSortBy(newSort);
                      setPage(0);
                    }}
                    isDark={isDark}
                    className="min-w-[130px]"
                  />
                  <th className="px-3 sm:px-4 py-3.5 text-center text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider w-16">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                      </td>
                    </tr>
                  ))
                ) : paginatedRiwayat.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 shadow-inner">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <h4 className={`text-sm font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          Tidak Ada Data Presensi
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {searchQuery || activeFilterCountDesktop > 0
                            ? "Tidak ada data yang sesuai dengan pencarian atau filter yang dipilih."
                            : `Belum ada catatan presensi yang tercatat untuk bulan ${labelBulan(bulan)}.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRiwayat.map((r) => (
                    <tr
                      key={r.id || r.tanggal}
                      onClick={() => setSelectedPresensiDetail(r)}
                      className={`group transition-all duration-150 cursor-pointer ${
                        isDark
                          ? "hover:bg-white/[0.04] text-slate-300"
                          : "hover:bg-blue-50/50 text-slate-700"
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="px-3.5 sm:px-4 py-3.5 font-bold">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl border text-center transition-all duration-200 group-hover:scale-105 ${
                            isDark
                              ? "border-white/10 bg-white/[0.03] text-slate-200 group-hover:border-[#00A5EC]/40"
                              : "border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/60 text-slate-800 shadow-2xs group-hover:border-[#004F9F]/30"
                          }`}>
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-[#004F9F] dark:text-[#00A5EC] leading-none">
                              {namaHari(r.tanggal).slice(0, 3)}
                            </span>
                            <span className="text-xs font-black leading-tight mt-0.5">
                              {String(r.tanggal).slice(8, 10)}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-extrabold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                              {formatTanggalPresensi(r.tanggal)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">
                              {namaHari(r.tanggal)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jam Masuk */}
                      <td className="px-3.5 sm:px-4 py-3.5">
                        {r.jam_masuk ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono text-[11px] font-bold shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{r.jam_masuk.slice(0, 5)}</span>
                            <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-sans font-bold">WIB</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs font-mono pl-2">--:--</span>
                        )}
                      </td>

                      {/* Jam Pulang */}
                      <td className="px-3.5 sm:px-4 py-3.5">
                        {r.jam_pulang ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#004F9F] dark:text-sky-300 border border-blue-500/20 font-mono text-[11px] font-bold shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#004F9F] dark:bg-[#00A5EC]" />
                            <span>{r.jam_pulang.slice(0, 5)}</span>
                            <span className="text-[9px] text-blue-600/70 dark:text-sky-400/70 font-sans font-bold">WIB</span>
                          </span>
                        ) : r.jam_masuk && (r.status === "hadir" || r.status === "terlambat") ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[10.5px] font-bold shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs font-mono pl-2">--:--</span>
                        )}
                      </td>

                      {/* Total Jam */}
                      <td className="px-3.5 sm:px-4 py-3.5">
                        {(() => {
                          const durasi = hitungDurasiKerja(r.jam_masuk, r.jam_pulang);
                          return durasi !== "-" ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-2xs border ${
                              isDark
                                ? "bg-white/[0.04] text-slate-200 border-white/10"
                                : "bg-slate-100/80 text-slate-700 border-slate-200/80"
                            }`}>
                              <Timer className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                              <span>{durasi}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-medium text-xs pl-2">-</span>
                          );
                        })()}
                      </td>

                      {/* Terlambat */}
                      <td className="px-3.5 sm:px-4 py-3.5">
                        {r.menit_terlambat && r.menit_terlambat > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>+{formatMenit(r.menit_terlambat)}</span>
                          </span>
                        ) : r.jam_masuk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Tepat Waktu</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-medium text-xs pl-2">-</span>
                        )}
                      </td>

                      {/* Logbook Harian */}
                      <td className="px-3.5 sm:px-4 py-3.5 max-w-[280px]">
                        {r.kegiatan_logbook || (r.keterangan && !r.keterangan.toLowerCase().includes("tidak melakukan presensi")) ? (
                          <div
                            title={r.kegiatan_logbook || r.keterangan}
                            className={`flex items-start gap-2 px-2.5 py-2 rounded-xl border transition-all duration-200 ${
                              isDark
                                ? "bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20"
                                : "bg-slate-50/90 border-slate-200/80 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0 mt-0.5 opacity-80" />
                            <p className="line-clamp-2 text-xs font-medium leading-relaxed break-words">
                              {r.kegiatan_logbook || r.keterangan}
                            </p>
                          </div>
                        ) : r.status === "izin" || r.status === "sakit" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPresensiDetail(r);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Dokumen Resmi</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-1">
                            {r.status === "alfa" ? "Tidak ada presensi" : "Belum diisi"}
                          </span>
                        )}
                      </td>

                      {/* Status Kehadiran */}
                      <td className="px-3.5 sm:px-4 py-3.5">
                        <PresensiStatusBadge status={r.status} />
                      </td>

                      {/* Aksi (Icon-Only) */}
                      <td className="px-3 sm:px-4 py-3.5 text-center">
                        <button
                          type="button"
                          title="Lihat Detail Presensi"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPresensiDetail(r);
                          }}
                          className={`group/btn inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer ${
                            isDark
                              ? "border-white/10 bg-white/5 text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10"
                              : "border-slate-200 bg-white text-[#004F9F] hover:border-[#004F9F]/30 hover:bg-blue-50 shadow-2xs"
                          }`}
                        >
                          <Eye className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Component */}
          <Pagination
            totalItems={filteredRiwayat.length}
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            isDark={isDark}
          />
        </div>

        {/* CARD: AKUMULASI JAM DINAS PEKAN INI */}
        <div
          className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-sm ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Header Card Akumulasi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="min-w-0">
                <h3 className={`text-sm sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Akumulasi Jam Dinas Pekan Ini
                </h3>
                <p className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-md truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {weeklyWorkStats.subtitle}
                </p>
              </div>
            </div>

            {/* Top Right: Total Jam Terakumulasi */}
            <div className="flex items-center gap-3 sm:justify-end">
              <div className="flex flex-col sm:items-end">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg sm:text-xl font-black ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`}>
                    {weeklyWorkStats.totalHours.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Jam
                  </span>
                </div>
                <span className="text-[9.5px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  Total ({weeklyWorkStats.recordedDaysCount} Hari Aktif)
                </span>
              </div>
            </div>
          </div>

          {/* Sub-header Information Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 my-3">
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${
              isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
            }`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/10 text-[#004F9F] dark:text-sky-400">
                <Timer className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[9.5px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Rata-rata Jam Harian
                </p>
                <p className={`text-xs sm:text-[13px] font-extrabold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  ± {weeklyWorkStats.avgDailyHours.toFixed(1)} Jam / Hari
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${
              isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
            }`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[9.5px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Status Presensi Pekan Ini
                </p>
                <p className={`text-xs sm:text-[13px] font-extrabold ${isDark ? "text-slate-200" : "text-slate-800"} truncate`}>
                  {weeklyWorkStats.alfaCount === 0 && weeklyWorkStats.izinCount === 0 && weeklyWorkStats.sakitCount === 0 && weeklyWorkStats.dinasLuarCount === 0 && weeklyWorkStats.terlambatCount === 0
                    ? `${weeklyWorkStats.recordedDaysCount} dari 5 Hari Tercatat`
                    : [
                        weeklyWorkStats.hadirCount > 0 ? `${weeklyWorkStats.hadirCount} Hadir` : null,
                        weeklyWorkStats.terlambatCount > 0 ? `${weeklyWorkStats.terlambatCount} Terlambat` : null,
                        weeklyWorkStats.dinasLuarCount > 0 ? `${weeklyWorkStats.dinasLuarCount} Dinas` : null,
                        weeklyWorkStats.izinCount > 0 ? `${weeklyWorkStats.izinCount} Izin` : null,
                        weeklyWorkStats.sakitCount > 0 ? `${weeklyWorkStats.sakitCount} Sakit` : null,
                        weeklyWorkStats.alfaCount > 0 ? `${weeklyWorkStats.alfaCount} Alfa` : null,
                      ].filter(Boolean).join(", ") || `${weeklyWorkStats.recordedDaysCount} dari 5 Hari Tercatat`}
                </p>
              </div>
            </div>
          </div>

          {/* 5-Segment Weekly Visualizer Track */}
          <div className="space-y-1.5 mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] font-bold text-slate-400">
              <span>Alur Kehadiran Pekan Ini</span>
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[9.5px] sm:text-[10px]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#004F9F] dark:bg-[#00A5EC]" /> Hadir
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Terlambat
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Izin
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Sakit
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Alfa
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Belum
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/80 p-0.5">
              {weeklyWorkStats.days.map((d) => (
                <div
                  key={`track-${d.key}`}
                  className={`h-full rounded-full transition-all duration-300 ${
                    d.isToday && d.statusCode === "hadir"
                      ? "bg-emerald-500 shadow-xs"
                      : d.isToday && d.statusCode === "terlambat"
                      ? "bg-amber-500 shadow-xs ring-1 ring-amber-400/40"
                      : d.statusCode === "hadir"
                      ? "bg-[#004F9F] dark:bg-[#00A5EC]"
                      : d.statusCode === "terlambat"
                      ? "bg-amber-500"
                      : d.statusCode === "izin"
                      ? "bg-sky-500"
                      : d.statusCode === "sakit"
                      ? "bg-violet-500"
                      : d.statusCode === "alfa"
                      ? "bg-rose-500"
                      : d.statusCode === "dinas_luar"
                      ? "bg-indigo-500"
                      : d.statusCode === "libur"
                      ? "bg-amber-400"
                      : "bg-slate-200 dark:bg-slate-700/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 5-Day Interactive Day Cards (Senin - Jumat) - Nama Hari & Tanggal Lengkap */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {weeklyWorkStats.days.map((day) => (
              <div
                key={day.key}
                className={`group relative flex flex-col justify-between rounded-xl p-2.5 sm:p-3 transition-all duration-200 border ${
                  day.isToday && day.statusCode === "hadir"
                    ? isDark
                      ? "bg-gradient-to-b from-emerald-950/40 via-[#161b22] to-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-400/30"
                      : "bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/40 border-emerald-300 shadow-sm ring-1 ring-emerald-400/25"
                    : day.isToday && day.statusCode === "terlambat"
                    ? isDark
                      ? "bg-gradient-to-b from-amber-950/40 via-[#161b22] to-amber-950/20 border-amber-500/50 shadow-md ring-1 ring-amber-400/30"
                      : "bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 border-amber-300 shadow-sm ring-1 ring-amber-400/25"
                    : day.isToday && day.statusCode === "belum"
                    ? isDark
                      ? "bg-gradient-to-b from-amber-950/20 via-[#161b22] to-amber-950/10 border-amber-500/40 shadow-xs ring-1 ring-amber-400/20"
                      : "bg-gradient-to-b from-amber-50/40 via-white to-amber-50/10 border-amber-300/80 shadow-xs ring-1 ring-amber-400/20"
                    : day.statusCode === "terlambat"
                    ? isDark
                      ? "bg-gradient-to-b from-amber-950/20 to-white/[0.01] border-amber-500/30 shadow-2xs"
                      : "bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 border-amber-200/80 shadow-2xs"
                    : day.statusCode === "izin"
                    ? isDark
                      ? "bg-gradient-to-b from-sky-950/20 to-white/[0.01] border-sky-500/30 shadow-2xs"
                      : "bg-gradient-to-b from-sky-50/50 via-white to-sky-50/20 border-sky-200/80 shadow-2xs"
                    : day.statusCode === "sakit"
                    ? isDark
                      ? "bg-violet-950/20 to-white/[0.01] border-violet-500/30 shadow-2xs"
                      : "bg-gradient-to-b from-violet-50/50 via-white to-violet-50/20 border-violet-200/80 shadow-2xs"
                    : day.statusCode === "alfa"
                    ? isDark
                      ? "bg-gradient-to-b from-rose-950/20 to-white/[0.01] border-rose-500/30 shadow-2xs"
                      : "bg-gradient-to-b from-rose-50/50 via-white to-rose-50/20 border-rose-200/80 shadow-2xs"
                    : day.statusCode === "dinas_luar"
                    ? isDark
                      ? "bg-gradient-to-b from-indigo-950/20 to-white/[0.01] border-indigo-500/30 shadow-2xs"
                      : "bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/20 border-indigo-200/80 shadow-2xs"
                    : day.statusCode === "libur"
                    ? isDark
                      ? "bg-gradient-to-b from-amber-950/10 to-white/[0.01] border-amber-500/20 shadow-2xs"
                      : "bg-gradient-to-b from-amber-50/40 via-white to-amber-50/10 border-amber-200/60 shadow-2xs"
                    : day.hasActual
                    ? isDark
                      ? "bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-white/10 hover:border-[#00A5EC]/40 hover:bg-white/[0.06]"
                      : "bg-gradient-to-b from-blue-50/50 via-white to-blue-50/20 border-blue-100/80 hover:border-[#004F9F]/30 hover:bg-blue-50/60 shadow-2xs"
                    : isDark
                    ? "bg-white/[0.01] border-white/5 text-slate-500"
                    : "bg-slate-50/60 border-slate-200/60 text-slate-400"
                }`}
              >
                {/* Header Card: Nama Hari Lengkap */}
                <div className="flex flex-col items-center text-center px-0.5">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <span
                      className={`text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-wider ${
                        day.isToday
                          ? isDark ? "text-emerald-400" : "text-emerald-600"
                          : isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  {/* Tanggal Lengkap */}
                  <span className="text-[9px] sm:text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-full">
                    {day.tglDisplay}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="my-1.5 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-tight shadow-2xs ${
                      day.statusCode === "terlambat"
                        ? isDark
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                        : day.isToday && day.statusCode === "hadir"
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : day.isToday && day.statusCode === "belum"
                        ? isDark
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                        : day.statusCode === "izin"
                        ? isDark
                          ? "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                          : "bg-sky-100 text-sky-800 border border-sky-200"
                        : day.statusCode === "sakit"
                        ? isDark
                          ? "bg-violet-500/20 text-violet-300 border border-violet-400/30"
                          : "bg-violet-100 text-violet-800 border border-violet-200"
                        : day.statusCode === "alfa"
                        ? isDark
                          ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                        : day.statusCode === "dinas_luar"
                        ? isDark
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        : day.statusCode === "libur"
                        ? isDark
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                        : day.hasActual
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : isDark
                        ? "bg-white/5 text-slate-400 border border-white/5"
                        : "bg-slate-200/70 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {day.statusCode === "terlambat"
                      ? "Terlambat"
                      : day.statusCode === "hadir"
                      ? "Hadir"
                      : day.statusCode === "belum"
                      ? "Belum"
                      : day.statusCode === "dinas_luar"
                      ? "Dinas"
                      : day.statusCode === "libur"
                      ? "Libur"
                      : day.statusCode.toUpperCase()}
                  </span>
                </div>

                {/* Jam / Durasi */}
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex flex-col items-center text-center">
                  <span
                    className={`text-[10.5px] sm:text-xs font-black ${
                      day.hasActual
                        ? isDark ? "text-slate-100" : "text-slate-800"
                        : "text-slate-400 dark:text-slate-500 font-medium"
                    }`}
                  >
                    {day.durationText}
                  </span>
                  <span className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-full">
                    {day.jamMasuk && day.jamPulang
                      ? `${day.jamMasuk} - ${day.jamPulang}`
                      : day.jamMasuk
                      ? `${day.jamMasuk} - Aktif`
                      : day.isHoliday
                      ? (day.holidayName ? day.holidayName.slice(0, 10) : "Libur")
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL PRESENSI MODAL */}
      {selectedPresensiDetail && (
        <DetailPresensiModal
          item={selectedPresensiDetail}
          onClose={() => setSelectedPresensiDetail(null)}
          onSelesai={() => {
            setSelectedPresensiDetail(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* FILTER MODAL */}
      {showFilterModal && (
        <PresensiSayaFilterModal
          draft={draftFilters}
          setDraft={setDraftFilters}
          onApply={(f) => {
            setAppliedFilters(f || draftFilters);
            setShowFilterModal(false);
            setPage(0);
          }}
          onReset={() => {
            setDraftFilters(emptyFilters);
            setSortBy("tanggal_baru");
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
    </PesertaLayout>
  );
};

export default PesertaRiwayatPage;
