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
import { BarChart3, Search, Users, CalendarDays, TrendingUp, AlertTriangle, Table2, LayoutGrid, Loader2, ChevronLeft, ChevronRight, Filter as FilterIcon, CalendarRange } from "lucide-react";

const bulanSekarang = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const FILTER_AWAL = { bidang: [], kategori: [], persentase: "" };

const hitungFilterAktif = (f) =>
  (f.bidang.length > 0 ? 1 : 0) + (f.kategori.length > 0 ? 1 : 0) + (f.persentase ? 1 : 0);

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

  // Filter terpusat via modal (pola sama seperti DataPresensiPage)
  const [filter, setFilter] = useState(FILTER_AWAL);
  const [draftFilter, setDraftFilter] = useState(FILTER_AWAL);
  const [showFilter, setShowFilter] = useState(false);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [sortBy, setSortBy] = useState("kehadiran_terendah");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [view, setView] = useState("tabel");
  const [statusMap, setStatusMap] = useState({});
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixBulan, setMatrixBulan] = useState("");

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

  // Ambil baris presensi bulan ini untuk membangun matriks (hanya saat tab matriks dibuka)
  const dari = periode?.dari;
  const sampai = periode?.sampai;

  // Bidang dipakai sebagai query matriks — ambil dari filter modal
  const bidangQuery = filter.bidang.length > 0 ? filter.bidang.join(",") : "";

  useEffect(() => {
    if (view !== "matriks" || !dari || !sampai) return;
    if (matrixBulan === `${bulan}|${bidangQuery}`) return;

    let aktif = true;
    const id = setTimeout(async () => {
      if (!aktif) return;
      setMatrixLoading(true);
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
        setMatrixBulan(`${bulan}|${bidangQuery}`);
      } catch (err) {
        if (aktif) toastError(err.response?.data?.message || "Gagal memuat matriks kehadiran.");
      } finally {
        if (aktif) setMatrixLoading(false);
      }
    }, 0);
    return () => { aktif = false; clearTimeout(id); };
  }, [view, dari, sampai, bulan, bidangQuery, matrixBulan]);

  const keyword = `${search} ${tableSearch}`.trim().toLowerCase();

  const filtered = useMemo(() => {
    let hasil = rows.filter((r) => {
      if (filter.bidang.length > 0 && !filter.bidang.includes(r.bidang)) return false;
      if (filter.kategori.length > 0 && !filter.kategori.includes(r.kategori_pendaftar)) return false;
      const persen = r.persentase_kehadiran || 0;
      if (filter.persentase === "lt75" && persen >= 75) return false;
      if (filter.persentase === "75_90" && (persen < 75 || persen >= 90)) return false;
      if (filter.persentase === "gte90" && persen < 90) return false;
      return true;
    });
    if (keyword) {
      hasil = hasil.filter((r) =>
        [r.nama, r.bidang, r.institusi].filter(Boolean).some((v) => v.toLowerCase().includes(keyword))
      );
    }
    const urut = [...hasil];
    urut.sort((a, b) => {
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
  }, [rows, filter, keyword, sortBy]);

  // Halaman di-reset lewat event handler (bukan effect), lalu dibatasi agar
  // tidak pernah melebihi jumlah halaman yang tersedia.
  const totalPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPage - 1);

  const paged = useMemo(
    () => filtered.slice(safePage * perPage, safePage * perPage + perPage),
    [filtered, safePage, perPage]
  );

  const gantiBulan = (nilai) => { setBulan(nilai); setPage(0); };
  const gantiSort = (nilai) => { setSortBy(nilai); setPage(0); };
  const gantiCariHeader = (nilai) => { setSearch(nilai); setPage(0); };
  const gantiCariTabel = (nilai) => { setTableSearch(nilai); setPage(0); };
  const gantiPerPage = (nilai) => { setPerPage(nilai); setPage(0); };

  const activeFilterCount = hitungFilterAktif(filter);
  const openFilter = () => { setDraftFilter(filter); setShowFilter(true); };
  const applyFilter = () => { setFilter(draftFilter); setPage(0); };
  const resetFilter = () => { setDraftFilter(FILTER_AWAL); setFilter(FILTER_AWAL); setPage(0); };

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
      icon: Users, label: "Total Peserta", value: ringkasan?.total_peserta ?? 0,
      caption: "Peserta wajib presensi bulan ini",
      lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: "bg-blue-50", iconColor: "text-[#004F9F]",
    },
    {
      icon: CalendarDays, label: "Hari Kerja Efektif", value: periode?.hari_kerja_efektif ?? 0,
      caption: "Setelah dikurangi hari libur",
      lightGradient: "from-sky-300 to-white", gradient: "from-sky-500 to-sky-700",
      iconBg: "bg-sky-50", iconColor: "text-sky-600",
    },
    {
      icon: TrendingUp, label: "Rata-rata Kehadiran", value: `${Math.round(ringkasan?.rata_kehadiran ?? 0)}%`,
      caption: "Hadir + terlambat / hari kerja",
      lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700",
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    },
    {
      icon: AlertTriangle, label: "Peserta Bermasalah", value: ringkasan?.peserta_bermasalah ?? 0,
      caption: "Kehadiran di bawah 75%",
      lightGradient: "from-rose-300 to-white", gradient: "from-rose-500 to-rose-700",
      iconBg: "bg-rose-50", iconColor: "text-rose-600",
    },
  ];

  return (
    <AdminLayout searchValue={search} onSearchChange={gantiCariHeader}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Rekap & Laporan Presensi</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Rekap kehadiran peserta per bulan berdasarkan hari kerja efektif. Gunakan tampilan matriks untuk melihat pola kehadiran harian setiap peserta.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Menghitung rekap presensi...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((c, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-sm font-bold tracking-wide text-slate-500 truncate">{c.label}</p>
                      <h3 className="mt-1 sm:mt-1.5 text-2xl sm:text-4xl font-black tracking-tight text-[#0B1442]">{c.value}</h3>
                      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-400 leading-snug">{c.caption}</p>
                    </div>
                    <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg} ${c.iconColor}`}>
                      <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {/* Header card: judul + periode + ekspor */}
              <div className="flex flex-col gap-4 border-b border-slate-100 px-4 sm:px-6 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <BarChart3 className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Rekap Kehadiran {labelBulan(bulan)}</h3>
                    {/* Format periode: hari, tanggal bulan tahun */}
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed text-slate-400">
                      <CalendarRange className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                      <span className="font-semibold text-slate-500">Periode</span>
                      <span className="font-bold text-[#0B1442]">{dari ? formatTanggalHari(dari) : "-"}</span>
                      <span>s.d.</span>
                      <span className="font-bold text-[#0B1442]">{sampai ? formatTanggalHari(sampai) : "-"}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-500">{periode?.hari_kerja_efektif ?? 0} hari kerja efektif</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 self-start">
                  {refreshing && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                      <Loader2 className="w-3 h-3 animate-spin" /> Memuat
                    </span>
                  )}
                  <RekapExportDropdown onSelect={handleExport} view={view} disabled={refreshing || filtered.length === 0} />
                </div>
              </div>

              {/* Baris 1: navigasi bulan + tampilan + pencarian */}
              <div className="flex flex-col gap-3 px-4 sm:px-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Navigasi bulan */}
                  <div className="inline-flex h-[42px] shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 shadow-sm">
                    <button
                      onClick={() => gantiBulan(geserBulan(bulan, -1))}
                      title="Bulan sebelumnya"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <BulanPicker value={bulan} onChange={gantiBulan} max={bulanSekarang()} />
                    <button
                      onClick={() => { const next = geserBulan(bulan, 1); if (next <= bulanSekarang()) gantiBulan(next); }}
                      disabled={bulan >= bulanSekarang()}
                      title="Bulan berikutnya"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="hidden h-7 w-px shrink-0 bg-slate-200 sm:block" />

                  {/* Toggle tampilan */}
                  <div className="inline-flex h-[42px] shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1 shadow-sm">
                    {[
                      { key: "tabel", label: "Tabel", icon: Table2, hint: "Rekap per peserta" },
                      { key: "matriks", label: "Matriks", icon: LayoutGrid, hint: "Peserta × tanggal" },
                    ].map((v) => (
                      <button
                        key={v.key}
                        title={v.hint}
                        onClick={() => setView(v.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                          view === v.key ? "bg-white text-[#004F9F] shadow-sm ring-1 ring-[#004F9F]/20" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <v.icon className="w-3.5 h-3.5" /> {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full sm:w-64 sm:shrink-0">
                  <div className={`relative w-full transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => gantiCariTabel(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Cari nama, bidang, atau institusi..."
                      className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                        isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Baris 2: urutkan + filter + info hasil */}
              <div className="flex flex-col gap-3 px-4 sm:px-6 pt-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <PresensiSortDropdown sortBy={sortBy} setSortBy={gantiSort} options={REKAP_SORT_OPTS} />
                  <button
                    onClick={openFilter}
                    title={activeFilterCount > 0 ? "Ubah atau reset filter" : "Atur filter rekap"}
                    className="group inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer shrink-0"
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

                <p className="text-[11px] font-semibold text-slate-400 sm:text-right">
                  Menampilkan <span className="font-black text-[#0B1442]">{filtered.length}</span> dari {rows.length} peserta
                </p>
              </div>

              {view === "tabel" ? (
                <>
                  <RekapPresensiTable rows={paged} onDetail={setDetail} />
                  <Pagination totalItems={filtered.length} page={safePage} setPage={setPage} perPage={perPage} setPerPage={gantiPerPage} />
                </>
              ) : (
                <div className="pb-5">
                  <RekapMatrixTable
                    rows={filtered}
                    tanggalList={periode?.tanggal_hari_kerja || []}
                    statusMap={statusMap}
                    loading={matrixLoading}
                    onDetail={setDetail}
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
        />
      )}

      {detail && <RekapPesertaModal peserta={detail} bulan={bulan} onClose={() => setDetail(null)} />}
    </AdminLayout>
  );
};

export default RekapPresensiPage;