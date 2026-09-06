import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import PresensiSortDropdown from "../../components/manajemen/admin/presensi/PresensiSortDropdown";
import RekapPresensiTable from "../../components/manajemen/admin/presensi/RekapPresensiTable";
import RekapMatrixTable from "../../components/manajemen/admin/presensi/RekapMatrixTable";
import RekapPesertaModal from "../../components/manajemen/admin/presensi/RekapPesertaModal";
import RekapExportDropdown from "../../components/manajemen/admin/presensi/RekapExportDropdown";
import RekapFilterModal from "../../components/manajemen/admin/presensi/RekapFilterModal";
import BulanPicker from "../../components/manajemen/admin/presensi/BulanPicker";
import { getRekapPresensi, getMatriksPresensi, getOpsiFilterPresensi } from "../../services/adminService";
import { exportRekapPdf, exportRekapCsv, exportRekapExcel, exportMatriksCsv, exportMatriksExcel } from "../../utils/exportRekapPresensi";
import { toastError, toastSuccess } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { REKAP_SORT_OPTS, formatTanggalHari } from "../../constants/presensiStatus";
import {
  BarChart3,
  Search,
  Users,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Table2,
  LayoutGrid,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  CalendarRange,
  X,
} from "lucide-react";

const bulanSekarang = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const FILTER_AWAL = { bidang: [], kategori: [], persentase: [] };

const hitungFilterAktifDesktop = (f) =>
  (f.bidang?.length || 0) +
  (f.kategori?.length || 0) +
  (f.persentase?.length || 0);

const hitungFilterAktifMobile = (f, sort) =>
  hitungFilterAktifDesktop(f) + (sort ? 1 : 0);

const geserBulan = (bulan, delta) => {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const labelBulan = (bulan) => {
  const [y, m] = bulan.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const RekapPresensiPage = () => {
  const { isDark } = useManajemenTheme();

  const [bulan, setBulan] = useState(bulanSekarang);
  const [rows, setRows] = useState([]);
  const [periode, setPeriode] = useState(null);
  const [ringkasan, setRingkasan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bidangOptions, setBidangOptions] = useState([]);

  // Filter modal
  const [filter, setFilter] = useState(FILTER_AWAL);
  const [draftFilter, setDraftFilter] = useState(FILTER_AWAL);
  const [showFilter, setShowFilter] = useState(false);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [sortBy, setSortBy] = useState("kehadiran_terendah");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [view, setView] = useState("tabel");
  const [statusMap, setStatusMap] = useState({});
  const [matrixBulan, setMatrixBulan] = useState("");
  const [matrixGagal, setMatrixGagal] = useState("");

  const [detail, setDetail] = useState(null);

  const fetchRekap = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getRekapPresensi({ bulan });
      const payload = res.data.data || {};
      setRows(payload.data || []);
      setPeriode(payload.periode || null);
      setRingkasan(payload.ringkasan || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat rekap presensi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bulan]);

  useEffect(() => {
    const id = setTimeout(() => { fetchRekap(); }, 0);
    return () => clearTimeout(id);
  }, [fetchRekap]);

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const res = await getOpsiFilterPresensi();
        setBidangOptions(res.data.data?.bidang || []);
      } catch {
        setBidangOptions([]);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const dari = periode?.dari;
  const sampai = periode?.sampai;

  const bidangQuery = filter.bidang.length > 0 ? filter.bidang.join(",") : "";
  const kunciMatriks = `${bulan}|${bidangQuery}`;

  const matrixLoading =
    view === "matriks" &&
    !!dari &&
    !!sampai &&
    matrixBulan !== kunciMatriks &&
    matrixGagal !== kunciMatriks;

  useEffect(() => {
    if (view !== "matriks" || !dari || !sampai) return;
    if (matrixBulan === kunciMatriks || matrixGagal === kunciMatriks) return;

    let aktif = true;
    (async () => {
      try {
        const res = await getMatriksPresensi({
          bulan,
          bidang: bidangQuery || undefined,
        });
        if (!aktif) return;

        const map = {};
        (res.data.data?.data || []).forEach((r) => {
          map[`${r.peserta_id}|${r.tanggal}`] = r;
        });
        setStatusMap(map);
        setMatrixBulan(kunciMatriks);
      } catch (err) {
        if (!aktif) return;
        setMatrixGagal(kunciMatriks);
        toastError(err.response?.data?.message || "Gagal memuat matriks kehadiran.");
      }
    })();
    return () => { aktif = false; };
  }, [view, dari, sampai, bulan, bidangQuery, kunciMatriks, matrixBulan, matrixGagal]);

  const gantiView = (key) => {
    if (key === "matriks") setMatrixGagal("");
    setView(key);
  };

  const keyword = `${search} ${tableSearch}`.trim().toLowerCase();

  const filtered = useMemo(() => {
    let hasil = rows.filter((r) => {
      if (filter.bidang.length > 0 && !filter.bidang.includes(r.bidang)) return false;
      if (filter.kategori.length > 0 && !filter.kategori.includes(r.kategori_pendaftar)) return false;
      const persen = r.persentase_kehadiran || 0;
      if (filter.persentase?.length > 0) {
        const cocok = filter.persentase.some((p) => {
          if (p === "lt75") return persen < 75;
          if (p === "75_90") return persen >= 75 && persen < 90;
          if (p === "gte90") return persen >= 90;
          return false;
        });
        if (!cocok) return false;
      }
      return true;
    });
    if (keyword) {
      hasil = hasil.filter((r) =>
        [r.nama, r.bidang, r.institusi].filter(Boolean).some((v) => v.toLowerCase().includes(keyword))
      );
    }
    const urut = [...hasil];
    urut.sort((a, b) => {
      if (columnSort.key) {
        let valA, valB;
        if (columnSort.key === "nama") {
          valA = (a.nama || "").toLowerCase();
          valB = (b.nama || "").toLowerCase();
        } else if (columnSort.key === "bidang") {
          valA = (a.bidang || "").toLowerCase();
          valB = (b.bidang || "").toLowerCase();
        } else if (columnSort.key === "rekap") {
          valA = a.hadir || 0;
          valB = b.hadir || 0;
        } else if (columnSort.key === "keterlambatan") {
          valA = a.total_menit_terlambat || 0;
          valB = b.total_menit_terlambat || 0;
        } else if (columnSort.key === "persentase") {
          valA = a.persentase_kehadiran || 0;
          valB = b.persentase_kehadiran || 0;
        }
        const result = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
        return columnSort.direction === "asc" ? result : -result;
      }

      switch (sortBy) {
        case "kehadiran_tertinggi": return (b.persentase_kehadiran || 0) - (a.persentase_kehadiran || 0);
        case "nama_az": return (a.nama || "").localeCompare(b.nama || "");
        case "nama_za": return (b.nama || "").localeCompare(a.nama || "");
        case "alfa_terbanyak": return (b.alfa || 0) - (a.alfa || 0);
        case "terlambat_terbanyak": return (b.terlambat || 0) - (a.terlambat || 0);
        default: return (a.persentase_kehadiran || 0) - (b.persentase_kehadiran || 0);
      }
    });
    return urut;
  }, [rows, filter, keyword, sortBy, columnSort]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPage - 1);

  const paged = useMemo(
    () => filtered.slice(safePage * perPage, safePage * perPage + perPage),
    [filtered, safePage, perPage]
  );

  const gantiBulan = (nilai) => { setBulan(nilai); setPage(0); };
  const gantiSort = (nilai) => { setSortBy(nilai); setColumnSort({ key: null, direction: null }); setPage(0); };
  const gantiCariHeader = (nilai) => { setSearch(nilai); setPage(0); };
  const gantiCariTabel = (nilai) => { setTableSearch(nilai); setPage(0); };
  const gantiPerPage = (nilai) => { setPerPage(nilai); setPage(0); };

  const activeFilterCountDesktop = hitungFilterAktifDesktop(filter);
  const activeFilterCountMobile = hitungFilterAktifMobile(filter, sortBy);

  const openFilter = () => { setDraftFilter(filter); setShowFilter(true); };
  const applyFilter = () => { setFilter(draftFilter); setPage(0); };
  const resetFilter = () => { setDraftFilter(FILTER_AWAL); setFilter(FILTER_AWAL); setSortBy("kehadiran_terendah"); setColumnSort({ key: null, direction: null }); setPage(0); };

  const handleExport = (jenis) => {
    if (filtered.length === 0) {
      toastError("Tidak ada data rekap untuk diekspor.");
      return;
    }

    const payload = { bulan, periode, ringkasan, rows: filtered, bidangFilter: filter.bidang.join(", ") };
    const butuhMatriks = jenis === "matriks_excel" || jenis === "matriks_csv";

    if (butuhMatriks && Object.keys(statusMap).length === 0) {
      toastError('Buka tampilan "Matriks" terlebih dahulu agar data harian dimuat, lalu ekspor kembali.');
      return;
    }

    const payloadMatriks = { bulan, periode, rows: filtered, statusMap };

    try {
      switch (jenis) {
        case "pdf":
          exportRekapPdf(payload);
          toastSuccess("Laporan PDF berhasil diunduh.");
          break;
        case "rekap_excel":
          exportRekapExcel(payload);
          toastSuccess("Rekap Excel (.xlsx) berhasil diunduh.");
          break;
        case "rekap_csv":
          exportRekapCsv(payload);
          toastSuccess("Rekap CSV berhasil diunduh.");
          break;
        case "matriks_excel":
          exportMatriksExcel(payloadMatriks);
          toastSuccess("Matriks Excel (.xlsx) berhasil diunduh.");
          break;
        case "matriks_csv":
          exportMatriksCsv(payloadMatriks);
          toastSuccess("Matriks CSV berhasil diunduh.");
          break;
        default:
          break;
      }
    } catch {
      toastError("Gagal membuat file ekspor.");
    }
  };

  const statCards = [
    {
      icon: Users,
      label: "Total Peserta",
      desktopLabel: "Total Peserta",
      value: ringkasan?.total_peserta ?? 0,
      caption: "Wajib presensi",
      desktopCaption: "Peserta wajib presensi bulan ini",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-[#004F9F]",
    },
    {
      icon: CalendarDays,
      label: "Hari Kerja",
      desktopLabel: "Hari Kerja Efektif",
      value: periode?.hari_kerja_efektif ?? 0,
      caption: "Hari efektif",
      desktopCaption: "Setelah dikurangi hari libur",
      lightGradient: "from-sky-300 to-white",
      gradient: "from-sky-500 to-sky-700",
      iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-600",
    },
    {
      icon: TrendingUp,
      label: "Rata-rata",
      desktopLabel: "Rata-rata Kehadiran",
      value: `${Math.round(ringkasan?.rata_kehadiran ?? 0)}%`,
      caption: "Hadir / hari kerja",
      desktopCaption: "Hadir + terlambat / hari kerja",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: AlertTriangle,
      label: "Bermasalah",
      desktopLabel: "Peserta Bermasalah",
      value: ringkasan?.peserta_bermasalah ?? 0,
      caption: "Kehadiran < 75%",
      desktopCaption: "Kehadiran di bawah 75%",
      lightGradient: "from-rose-300 to-white",
      gradient: "from-rose-500 to-rose-700",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <AdminLayout searchValue={search} onSearchChange={gantiCariHeader}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Rekap &amp; Laporan Presensi
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Rekap kehadiran peserta per bulan &amp; ekspor laporan.</span>
            <span className="hidden sm:inline">
              Rekap kehadiran peserta per bulan berdasarkan hari kerja efektif. Gunakan tampilan matriks untuk melihat pola kehadiran harian setiap peserta.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-24 text-slate-400 text-xs sm:text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Menghitung rekap presensi...
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik Cards: 2x2 pada mobile, 4 kolom pada desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {statCards.map((c, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 p-2.5 sm:p-5 flex flex-col justify-between ${
                    isDark
                      ? "border-white/10 bg-[#161b22]"
                      : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
                  }`}
                >
                  <div
                    className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.25] dark:opacity-[0.18] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125 pointer-events-none`}
                  />
                  <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9.5px] sm:text-sm font-bold tracking-wide truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="inline sm:hidden">{c.label}</span>
                        <span className="hidden sm:inline">{c.desktopLabel}</span>
                      </p>
                      <h3 className={`mt-0.5 sm:mt-1.5 text-lg sm:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        {c.value}
                      </h3>
                      <p className={`mt-0.5 sm:mt-2 text-[8.5px] sm:text-xs font-medium leading-snug sm:whitespace-normal sm:line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <span className="inline sm:hidden truncate">{c.caption}</span>
                        <span className="hidden sm:inline">{c.desktopCaption}</span>
                      </p>
                    </div>
                    <span
                      className={`flex h-6.5 w-6.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
                    >
                      <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {/* Main Card */}
            <div
              className={`rounded-2xl border shadow-sm overflow-hidden ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}
            >
              {/* Header card: judul + periode (kiri) & ekspor (kanan sejajar) - tanpa garis sekat */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="flex h-7.5 w-7.5 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Judul card: 1 baris di mobile */}
                    <h3 className={`text-[10.5px] sm:text-base font-black leading-tight whitespace-nowrap ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Rekap Kehadiran {labelBulan(bulan)}
                    </h3>
                    <p className="mt-1 sm:mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[8.5px] sm:text-xs leading-tight text-slate-400">
                      <span className="inline sm:hidden truncate">
                        {dari && sampai
                          ? `${dari.slice(8, 10)} - ${sampai.slice(8, 10)} ${labelBulan(bulan)} · ${periode?.hari_kerja_efektif ?? 0} hari kerja`
                          : "Periode belum tersedia"}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-x-1.5 gap-y-1">
                        <CalendarRange className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-500" />
                        <span className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Periode</span>
                        <span className={`font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>{dari ? formatTanggalHari(dari) : "-"}</span>
                        <span>s.d.</span>
                        <span className={`font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>{sampai ? formatTanggalHari(sampai) : "-"}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{periode?.hari_kerja_efektif ?? 0} hari kerja efektif</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-center">
                  {refreshing && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold ${
                        isDark ? "bg-white/5 text-slate-400 ring-1 ring-white/10" : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> <span className="hidden sm:inline">Memuat</span>
                    </span>
                  )}
                  <RekapExportDropdown onSelect={handleExport} view={view} disabled={refreshing || filtered.length === 0} isDark={isDark} />
                </div>
              </div>

              {/* Controls Area */}
              <div className={`px-3.5 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3 space-y-3 sm:space-y-4 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}>
                {/* Baris 1: Navigasi Bulan + View Toggle (Tabel & Matriks) */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2.5 w-full sm:w-auto">
                    {/* Navigasi bulan */}
                    <div
                      className={`inline-flex h-7.5 sm:h-[42px] shrink-0 items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border px-0.5 sm:px-1 shadow-sm ${
                        isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        onClick={() => gantiBulan(geserBulan(bulan, -1))}
                        title="Bulan sebelumnya"
                        className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer ${
                          isDark ? "text-slate-400 hover:bg-white/10 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <BulanPicker value={bulan} onChange={gantiBulan} max={bulanSekarang()} isDark={isDark} />
                      <button
                        onClick={() => {
                          const next = geserBulan(bulan, 1);
                          if (next <= bulanSekarang()) gantiBulan(next);
                        }}
                        disabled={bulan >= bulanSekarang()}
                        title="Bulan berikutnya"
                        className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isDark ? "text-slate-400 hover:bg-white/10 hover:text-[#00A5EC]" : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    <span className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-white/10 sm:block" />

                    {/* Toggle tampilan (Tabel / Matriks) */}
                    <div
                      className={`inline-flex h-7.5 sm:h-[42px] shrink-0 items-center rounded-lg sm:rounded-xl border p-0.5 sm:p-1 shadow-xs ${
                        isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      {[
                        { key: "tabel", label: "Tabel", icon: Table2, hint: "Rekap per peserta" },
                        { key: "matriks", label: "Matriks", icon: LayoutGrid, hint: "Peserta × tanggal" },
                      ].map((v) => (
                        <button
                          key={v.key}
                          title={v.hint}
                          onClick={() => gantiView(v.key)}
                          className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[9.5px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                            view === v.key
                              ? isDark
                                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md border border-white/15"
                                : "bg-white text-[#004F9F] shadow-sm ring-1 ring-[#004F9F]/20"
                              : isDark
                                ? "text-slate-400 hover:text-slate-200"
                                : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <v.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Baris 2: Controls Search & Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  {/* Desktop: Sort + Filter */}
                  <div className="hidden sm:flex items-center gap-2.5">
                    <PresensiSortDropdown sortBy={sortBy} setSortBy={gantiSort} options={REKAP_SORT_OPTS} isDark={isDark} />
                    <button
                      onClick={openFilter}
                      title={activeFilterCountDesktop > 0 ? "Ubah atau reset filter" : "Atur filter rekap"}
                      className={`group inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      {activeFilterCountDesktop > 0 && (
                        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[9.5px] font-black">
                          {activeFilterCountDesktop}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Mobile: Filter (Kiri) + Search Bar (Kanan) Sejajar */}
                  <div className="flex sm:hidden items-center gap-2 w-full">
                    {/* Filter Button Mobile (Kiri) */}
                    <button
                      onClick={openFilter}
                      className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      {activeFilterCountMobile > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] font-black">
                          {activeFilterCountMobile}
                        </span>
                      )}
                    </button>

                    {/* Search Input Mobile (Kanan) */}
                    <div className="relative flex-1">
                      <Search
                        className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                          isSearchFocused ? (isDark ? "text-[#00A5EC]" : "text-[#004F9F]") : "text-slate-400"
                        }`}
                      />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => gantiCariTabel(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="Cari nama, bidang..."
                        className={`w-full rounded-lg border pl-8 pr-7 py-1.5 text-[11px] font-medium outline-none transition-all duration-200 ${
                          isDark
                            ? isSearchFocused
                              ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-2 ring-[#00A5EC]/20"
                              : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                            : isSearchFocused
                              ? "border-[#004F9F] bg-white shadow-md ring-2 ring-[#00A5EC]/15 text-slate-700"
                              : "border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                        }`}
                      />
                      {tableSearch && (
                        <button
                          type="button"
                          onClick={() => gantiCariTabel("")}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                            isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop: Search Bar (Ukuran diperbesar dan serasi dengan tombol filter/sort) */}
                  <div className="hidden sm:block w-80 lg:w-96 shrink-0">
                    <div className={`relative w-full transition-transform duration-200 ${isSearchFocused ? "scale-[1.01]" : ""}`}>
                      <Search
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                          isSearchFocused ? (isDark ? "text-[#00A5EC] scale-110" : "text-[#004F9F] scale-110") : "text-slate-400"
                        }`}
                      />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => gantiCariTabel(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="Cari nama, bidang, institusi..."
                        className={`w-full h-[42px] rounded-xl border pl-10 pr-9 text-xs sm:text-[13px] font-medium outline-none transition-all duration-200 ${
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
                          onClick={() => gantiCariTabel("")}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                            isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {view === "tabel" ? (
                <>
                  <RekapPresensiTable
                    rows={paged}
                    onDetail={setDetail}
                    columnSort={columnSort}
                    setColumnSort={setColumnSort}
                    isDark={isDark}
                  />
                  <Pagination
                    totalItems={filtered.length}
                    page={safePage}
                    setPage={setPage}
                    perPage={perPage}
                    setPerPage={gantiPerPage}
                    isDark={isDark}
                  />
                </>
              ) : (
                <div className="pb-5">
                  <RekapMatrixTable
                    rows={filtered}
                    tanggalList={periode?.tanggal_hari_kerja || []}
                    statusMap={statusMap}
                    loading={matrixLoading}
                    onDetail={setDetail}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showFilter && (
        <RekapFilterModal
          draft={draftFilter}
          setDraft={setDraftFilter}
          bidangOptions={bidangOptions}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilter(false)}
          sortBy={sortBy}
          setSortBy={gantiSort}
          isDark={isDark}
        />
      )}

      {detail && (
        <RekapPesertaModal
          peserta={detail}
          bulan={bulan}
          onClose={() => setDetail(null)}
          isDark={isDark}
        />
      )}
    </AdminLayout>
  );
};

export default RekapPresensiPage;