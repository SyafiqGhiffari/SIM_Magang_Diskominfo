import { Fragment, useCallback, useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import PresensiSortDropdown from "../../components/manajemen/admin/presensi/PresensiSortDropdown";
import PresensiFilterModal from "../../components/manajemen/admin/presensi/PresensiFilterModal";
import PresensiStatusBadge from "../../components/manajemen/admin/presensi/PresensiStatusBadge";
import PresensiDetailModal from "../../components/manajemen/admin/presensi/PresensiDetailModal";
import { getAllPresensi, getStatistikPresensi, getOpsiFilterPresensi } from "../../services/adminService";
import { getFileUrl } from "../../utils/fileUrl";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import { exportPresensiToCsv, exportPresensiToExcel, exportPresensiToPdf } from "../../utils/exportPresensi";
import { formatTanggalLengkap, formatTanggalHari, namaHari, formatMenit } from "../../constants/presensiStatus";
import { toastError, toastSuccess } from "../../utils/swal";
import {
  ClipboardList, Search, Inbox, Filter as FilterIcon, CheckCircle2, Clock, FileText, UserX,
  Building2, GraduationCap, LogIn, LogOut, Eye, AlarmClockOff, Lock, CalendarCheck, CalendarOff, Loader2,
  CalendarDays, Layers, Rows3, ChevronDown, History, Sun, Users,
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
        className="h-9 w-9 shrink-0 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] font-black shadow-sm transition-all duration-300 group-hover:scale-110">
      {getInitials(nama)}
    </span>
  );
};

const hitungFilterAktif = (f) =>
  (f.status.length > 0 ? 1 : 0) +
  (f.kategori.length > 0 ? 1 : 0) +
  (f.bidang.length > 0 ? 1 : 0) +
  (f.tanggal_dari || f.tanggal_sampai ? 1 : 0) +
  (f.lupa_presensi ? 1 : 0);

const DataPresensiPage = () => {
  const { isDark } = useManajemenTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stat, setStat] = useState(null);
  const [bidangOptions, setBidangOptions] = useState([]);
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

  // Mode tampilan: "terbaru" = 1 baris per peserta (ringkas), "semua" = seluruh baris
  const [mode, setMode] = useState("terbaru");
  // Baris ringkas yang sedang dibuka + cache riwayat lamanya
  const [expanded, setExpanded] = useState(null);
  const [riwayat, setRiwayat] = useState({});
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Gabungkan pencarian header layout + pencarian tabel, dengan debounce
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
    if (f.bidang.length) params.bidang = f.bidang.join(",");
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
        getAllPresensi(params),
        // Statistik selalu HARIAN (hari ini) — sengaja tidak mengirim
        // tanggal_dari/tanggal_sampai/search agar tidak mengikuti filter tabel.
        getStatistikPresensi({
          bidang: params.bidang,
          kategori: params.kategori,
        }),
      ]);
      const payload = resList.data.data || {};
      setRows(payload.data || []);
      setTotal(payload.meta?.total || 0);
      setStat(resStat.data.data || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data presensi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const id = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(id);
  }, [fetchData]);

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

  // Kunci cache riwayat ikut menyertakan filter, supaya data lama tidak
  // dipakai ulang saat filter berubah.
  const riwayatKey = useCallback(
    (pesertaId) => {
      const f = appliedFilters;
      return [
        pesertaId,
        f.tanggal_dari, f.tanggal_sampai,
        f.status.join("|"), f.kategori.join("|"), f.bidang.join("|"),
        f.lupa_presensi ? 1 : 0,
        debouncedSearch,
      ].join("#");
    },
    [appliedFilters, debouncedSearch],
  );

  // Buka/tutup riwayat lama seorang peserta pada mode ringkas.
  // Riwayat WAJIB memakai filter yang sama dengan tabel (mis. rentang tanggal),
  // hanya mode=terbaru yang dibuang agar semua baris peserta itu ikut tampil.
  const toggleRiwayat = (pesertaId) => {
    if (expanded === pesertaId) {
      setExpanded(null);
      return;
    }
    setExpanded(pesertaId);

    const key = riwayatKey(pesertaId);
    if (riwayat[key]) return;

    setRiwayatLoading(true);
    setTimeout(async () => {
      try {
        // riwayat harus mengikuti filter tabel, tetapi tanpa mode/page/limit
        const filterAktif = { ...buildParams() };
        delete filterAktif.mode;
        delete filterAktif.page;
        delete filterAktif.limit;

        const res = await getAllPresensi({
          ...filterAktif,
          peserta_id: pesertaId,
          sort: "tanggal_baru",
          page: 1,
          limit: 200,
        });
        const list = res.data.data?.data || [];
        setRiwayat((prev) => ({ ...prev, [key]: list }));
      } catch {
        setRiwayat((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setRiwayatLoading(false);
      }
    }, 0);
  };

  const gantiMode = (next) => {
    setMode(next);
    setExpanded(null);
    setPage(0);
  };

  // Ekspor seluruh data sesuai filter aktif (bukan hanya halaman yang tampil)
  const handleExport = (format) => {
    setExporting(true);
    setTimeout(async () => {
      try {
        const dasar = buildParams();
        const semua = [];
        let halaman = 1;
        // ambil bertahap 500 baris agar aman untuk data besar
        for (;;) {
          const res = await getAllPresensi({ ...dasar, page: halaman, limit: 500 });
          const payload = res.data.data || {};
          semua.push(...(payload.data || []));
          const totalHal = payload.meta?.total_page || 1;
          if (halaman >= totalHal || halaman >= 20) break;
          halaman += 1;
        }

        if (semua.length === 0) {
          toastError("Tidak ada data presensi untuk diekspor.");
          return;
        }
        if (format === "excel") exportPresensiToExcel(semua);
        else if (format === "csv") exportPresensiToCsv(semua);
        else exportPresensiToPdf(semua, stat);

        toastSuccess(`${semua.length} baris presensi berhasil diekspor.`);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal mengekspor data presensi.");
      } finally {
        setExporting(false);
      }
    }, 0);
  };

  const openFilter = () => { setDraftFilters(appliedFilters); setShowFilterModal(true); };
  const applyFilter = () => { setAppliedFilters(draftFilters); setPage(0); };
  const resetFilter = () => { setDraftFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(0); };

  const activeFilterCount = hitungFilterAktif(appliedFilters);

  const statCards = [
    {
      icon: CheckCircle2, label: "Hadir Hari Ini", value: stat?.hadir ?? 0,
      caption: "Presensi tepat waktu hari ini",
      lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700",
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    },
    {
      icon: Clock, label: "Terlambat Hari Ini", value: stat?.terlambat ?? 0,
      caption: `${stat?.lupa_presensi ?? 0} di antaranya lupa presensi`,
      lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700",
      iconBg: "bg-amber-50", iconColor: "text-amber-600",
    },
    {
      icon: FileText, label: "Izin & Sakit Hari Ini", value: (stat?.izin ?? 0) + (stat?.sakit ?? 0),
      caption: `Izin ${stat?.izin ?? 0} · Sakit ${stat?.sakit ?? 0}`,
      lightGradient: "from-sky-300 to-white", gradient: "from-sky-500 to-sky-700",
      iconBg: "bg-sky-50", iconColor: "text-sky-600",
    },
    {
      icon: UserX, label: "Alfa Hari Ini", value: stat?.alfa ?? 0,
      caption: "Dibuat otomatis setelah hari kerja berakhir",
      lightGradient: "from-rose-300 to-white", gradient: "from-rose-500 to-rose-700",
      iconBg: "bg-rose-50", iconColor: "text-rose-600",
    },
  ];

  const hariIni = stat?.hari_ini;
  const headerCols = ["Peserta", "Tanggal", "Jam Masuk / Pulang", "Bidang", "Status"];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Data Presensi</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pantau kehadiran harian peserta magang. Status alfa dibuat otomatis oleh sistem saat hari berganti, dan peserta yang baru presensi setelah jam pulang otomatis tercatat terlambat.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data presensi...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik ringkas — HARIAN */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                <CalendarDays className="w-3 h-3" />
                Statistik hari ini{stat?.periode?.dari ? ` · ${formatTanggalLengkap(stat.periode.dari)}` : ""}
              </span>
              {hariIni && !hariIni.hari_kerja && (
                <span className="text-[11px] font-medium text-slate-400">
                  Hari ini bukan hari kerja, jadi angkanya 0. Data lengkap tetap tersedia di tabel & halaman Rekap.
                </span>
              )}
            </div>

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

            {/* Panel informasi hari ini — konsep kartu tanggal + progres presensi */}
            {hariIni && (
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${hariIni.hari_kerja ? "from-emerald-400 to-emerald-600" : "from-slate-300 to-slate-400"}`} />
                <div className="flex flex-col gap-4 px-5 sm:px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Kartu tanggal */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2">
                      <span className="absolute top-0 inset-x-0 h-4 bg-white/15 text-center text-[8.5px] font-black uppercase tracking-widest leading-4">
                        {formatTanggalHari(hariIni.tanggal).split(",")[0]}
                      </span>
                      <span className="mt-3 text-2xl font-black leading-none">
                        {new Date(String(hariIni.tanggal).slice(0, 10)).getDate()}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                        {formatTanggalLengkap(hariIni.tanggal).split(" ")[1]?.slice(0, 3)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-[#0B1442] truncate">
                          {formatTanggalHari(hariIni.tanggal)}
                        </h4>
                        {hariIni.hari_kerja ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                            <CalendarCheck className="w-3 h-3" /> Hari kerja
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                            <CalendarOff className="w-3 h-3" /> Bukan hari kerja
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-slate-400">
                        {hariIni.hari_kerja ? (
                          <>
                            <Clock className="w-3 h-3 shrink-0" />
                            Presensi masih terbuka sampai 23:59 WIB - setelah itu sisanya otomatis alfa.
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

                  {/* Progres presensi hari ini */}
                  {hariIni.hari_kerja ? (
                    <div className="flex w-full max-w-md flex-col gap-2 lg:w-80">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3 h-3" /> Progres presensi
                        </span>
                        <span className="text-[#0B1442]">
                          {hariIni.sudah_presensi}/{hariIni.wajib_presensi}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                          style={{
                            width: `${hariIni.wajib_presensi > 0 ? Math.min(100, Math.round((hariIni.sudah_presensi / hariIni.wajib_presensi) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Sudah {hariIni.sudah_presensi}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 ring-1 ring-amber-200">
                          <Clock className="w-3 h-3" /> Belum {hariIni.belum_presensi}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-[10.5px] font-bold text-slate-500 ring-1 ring-slate-200">
                          <GraduationCap className="w-3 h-3" /> Wajib {hariIni.wajib_presensi}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-[11.5px] font-bold text-slate-500 ring-1 ring-slate-200">
                      <CalendarOff className="w-3.5 h-3.5" /> Tidak ada kewajiban presensi
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-5 pb-5">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Riwayat Presensi Peserta</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                      {mode === "terbaru"
                        ? "Menampilkan presensi terbaru tiap peserta. Klik tombol riwayat untuk membuka data lamanya."
                        : "Menampilkan seluruh baris presensi sesuai filter."}{" "}
                      Koreksi presensi serta persetujuan izin/sakit dilakukan oleh mentor.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 self-start">
                  {refreshing && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                      <Loader2 className="w-3 h-3 animate-spin" /> Memuat
                    </span>
                  )}
                  <div className={exporting ? "pointer-events-none opacity-60" : ""}>
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </div>
              </div>

              {/* Toolbar: Urutkan — Filter — Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Toggle mode tampilan */}
                  <div className="inline-flex h-[42px] shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1 shadow-sm">
                    {[
                      { key: "terbaru", label: "Ringkas", icon: Layers, hint: "1 baris terbaru per peserta" },
                      { key: "semua", label: "Semua", icon: Rows3, hint: "Semua baris presensi" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        title={m.hint}
                        onClick={() => gantiMode(m.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                          mode === m.key
                            ? "bg-white text-[#004F9F] shadow-sm ring-1 ring-[#004F9F]/20"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5" /> {m.label}
                      </button>
                    ))}
                  </div>

                  <PresensiSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                  <button
                    onClick={openFilter}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer shrink-0"
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

                <div className="w-full sm:w-64 sm:shrink-0">
                  <div className={`relative w-full transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
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

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {headerCols.map((h) => (
                        <th key={h} className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                          {h}
                        </th>
                      ))}
                      <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={6} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada data presensi yang sesuai</p>
                            <p className="text-xs text-slate-400 max-w-sm">Coba ubah filter atau periode tanggal. Data alfa otomatis muncul setelah hari kerja berakhir.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <Fragment key={r.id}>
                        <tr
                          className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
                          style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                        >
                          {/* Peserta */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                              <div className="min-w-0">
                                <p className="font-bold text-[#0B1442] transition-colors duration-200 group-hover:text-[#004F9F] truncate">{r.nama}</p>
                                {r.institusi && (
                                  <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                                    <GraduationCap className="w-3 h-3 shrink-0" /> {r.institusi}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Tanggal */}
                          <td className="px-6 py-4">
                            <div className="group/tgl inline-flex flex-col items-start gap-1.5">
                              <p className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm whitespace-nowrap transition-all duration-300 group-hover/tgl:-translate-y-0.5 group-hover/tgl:scale-[1.03] group-hover/tgl:border-[#004F9F]/30 group-hover/tgl:bg-white group-hover/tgl:text-[#004F9F] group-hover/tgl:shadow-md">
                                <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[#004F9F] transition-transform duration-300 group-hover/tgl:rotate-[-8deg] group-hover/tgl:scale-110" />
                                <span className="flex flex-col leading-tight">
                                  <span className="text-[9.5px] font-black uppercase tracking-wider text-[#004F9F]/70">
                                    {namaHari(r.tanggal)}
                                  </span>
                                  <span>{formatTanggalLengkap(r.tanggal)}</span>
                                </span>
                              </p>
                              {r.dikunci && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 transition-all duration-300 group-hover/tgl:bg-slate-200 group-hover/tgl:text-slate-500">
                                  <Lock className="w-2.5 h-2.5" /> Terkunci
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Jam masuk / pulang */}
                          <td className="px-6 py-4">
                            <div className="group/jam flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-600 ring-1 ring-transparent transition-all duration-300 group-hover/jam:-translate-y-0.5 group-hover/jam:bg-emerald-100 group-hover/jam:ring-emerald-200 group-hover/jam:shadow-sm">
                                <LogIn className="w-2.5 h-2.5 transition-transform duration-300 group-hover/jam:scale-125 group-hover/jam:-translate-x-0.5" /> {r.jam_masuk || "--:--"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[10.5px] font-bold text-sky-600 ring-1 ring-transparent transition-all delay-75 duration-300 group-hover/jam:-translate-y-0.5 group-hover/jam:bg-sky-100 group-hover/jam:ring-sky-200 group-hover/jam:shadow-sm">
                                <LogOut className="w-2.5 h-2.5 transition-transform duration-300 group-hover/jam:scale-125 group-hover/jam:translate-x-0.5" /> {r.jam_pulang || "--:--"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {r.menit_terlambat > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                  <Clock className="w-2.5 h-2.5" /> +{formatMenit(r.menit_terlambat)}
                                </span>
                              )}
                              {r.lupa_presensi && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  <AlarmClockOff className="w-2.5 h-2.5" /> Lupa presensi
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Bidang */}
                          <td className="px-6 py-4">
                            <span className="group/bdg inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30">
                              <Building2 className="w-3.5 h-3.5 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                              {r.bidang || "-"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <PresensiStatusBadge status={r.status} />
                          </td>

                                {/* Aksi */}
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {mode === "terbaru" && r.total_riwayat > 1 && (
                                    <button
                                      onClick={() => toggleRiwayat(r.peserta_id)}
                                      className={`group/riw inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer ${
                                        expanded === r.peserta_id
                                          ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/40 hover:bg-blue-50 hover:text-[#004F9F]"
                                      }`}
                                    >
                                      <History className="w-3.5 h-3.5 transition-transform duration-300 group-hover/riw:rotate-[-15deg]" />
                                      {r.total_riwayat - 1} lainnya
                                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${expanded === r.peserta_id ? "rotate-180" : ""}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setDetail(r)}
                                    className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                                    Detail
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Riwayat presensi lama peserta (mode ringkas) */}
                            {mode === "terbaru" && expanded === r.peserta_id && (
                              <tr className="bg-slate-50/60">
                                <td colSpan={6} className="px-6 py-4">
                                  <div className="animate-[fadeslide_0.25s_ease-out] rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
                                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                      <History className="w-3.5 h-3.5" /> Riwayat presensi sebelumnya - {r.nama}
                                    </p>

                                    {riwayatLoading && !riwayat[riwayatKey(r.peserta_id)] ? (
                                        <div className="flex items-center gap-2 py-4 text-[11.5px] font-medium text-slate-400">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat riwayat...
                                        </div>
                                      ) : (
                                        <div className="flex flex-col divide-y divide-slate-100">
                                          {(riwayat[riwayatKey(r.peserta_id)] || [])
                                            .filter((h) => h.id !== r.id)
                                            .map((h) => (
                                            <button
                                              key={h.id}
                                              onClick={() => setDetail(h)}
                                              className="group/row flex flex-wrap items-center justify-between gap-3 px-1 py-2.5 text-left transition-all duration-200 hover:bg-blue-50/40 cursor-pointer rounded-lg"
                                            >
                                              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 transition-transform duration-200 group-hover/row:translate-x-0.5">
                                                <CalendarDays className="w-3.5 h-3.5 text-[#004F9F]" />
                                                {formatTanggalHari(h.tanggal)}
                                                {h.dikunci && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                              </span>
                                              <span className="flex flex-wrap items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-600">
                                                  <LogIn className="w-2.5 h-2.5" /> {h.jam_masuk || "--:--"}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-bold text-sky-600">
                                                  <LogOut className="w-2.5 h-2.5" /> {h.jam_pulang || "--:--"}
                                                </span>
                                                {h.menit_terlambat > 0 && (
                                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                                    <Clock className="w-2.5 h-2.5" /> +{formatMenit(h.menit_terlambat)}
                                                  </span>
                                                )}
                                                <PresensiStatusBadge status={h.status} />
                                              </span>
                                            </button>
                                          ))}
                                        {(riwayat[riwayatKey(r.peserta_id)] || []).filter((h) => h.id !== r.id).length === 0 && (
                                          <p className="py-3 text-[11.5px] font-medium text-slate-400">
                                            Tidak ada riwayat lain dalam filter yang aktif.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                            </Fragment>
                          ))
                        )}
                  </tbody>
                </table>
              </div>

              <Pagination totalItems={total} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
            </div>
          </div>
        )}
      </div>

      {showFilterModal && (
        <PresensiFilterModal
          draft={draftFilters}
          setDraft={setDraftFilters}
          bidangOptions={bidangOptions}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {detail && <PresensiDetailModal data={detail} onClose={() => setDetail(null)} />}
    </AdminLayout>
  );
};

export default DataPresensiPage;