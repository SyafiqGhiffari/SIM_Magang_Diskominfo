import { useState, useEffect, useMemo, useCallback } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  X,
  RefreshCw,
  Eye,
  BookOpen,
  Building2,
  Briefcase,
  Calendar,
  Inbox,
} from "lucide-react";
import {
  getPesertaBimbinganPenilaian,
  getDetailPenilaianPeserta,
} from "../../services/penilaianService";
import {
  exportRekapNilaiToExcel,
  exportRekapNilaiToCsv,
  exportRekapNilaiToPdf,
} from "../../utils/exportRekapNilai";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
import { RekapNilaiDetailModal } from "../../components/manajemen/admin/rekapNilai";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import { toastSuccess, toastError } from "../../utils/swal";
import { getFileUrl } from "../../utils/fileUrl";

const formatPeriodeTanggal = (start, end) => {
  if (!start && !end) return "-";
  const fmt = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };
  if (start && end) {
    return `${fmt(start)} – ${fmt(end)}`;
  }
  return fmt(start || end);
};

const formatTitleCase = (text) => {
  if (!text) return "-";
  return String(text)
    .toLowerCase()
    .replace(/(^|[\s\-/])([a-z])/g, (_, boundary, letter) => boundary + letter.toUpperCase())
    .replace(/\bUpn\b/g, "UPN")
    .replace(/\bSmk\b/g, "SMK")
    .replace(/\bSma\b/g, "SMA")
    .replace(/\bS1\b/g, "S1")
    .replace(/\bD3\b/g, "D3")
    .replace(/\bD4\b/g, "D4")
    .replace(/\bTi\b/g, "TI")
    .replace(/\bSi\b/g, "SI");
};

const getPredikatBadge = (nilai, indeksFromDb, predikatFromDb) => {
  if (nilai == null) return null;
  const score = Number(nilai);

  let indeks = indeksFromDb;
  let predikat = predikatFromDb;

  if (!indeks || !predikat) {
    if (score >= 85) {
      indeks = "A";
      predikat = "Sangat Baik";
    } else if (score >= 70) {
      indeks = "B";
      predikat = "Baik";
    } else if (score >= 60) {
      indeks = "C";
      predikat = "Cukup";
    } else if (score >= 40) {
      indeks = "D";
      predikat = "Kurang";
    } else {
      indeks = "E";
      predikat = "Kurang";
    }
  }

  let textColor = "text-rose-600 dark:text-rose-400";
  let badgeClass = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (indeks === "A") {
    textColor = "text-blue-600 dark:text-sky-400";
    badgeClass = "bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/30";
  } else if (indeks === "B") {
    textColor = "text-emerald-600 dark:text-emerald-400";
    badgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  } else if (indeks === "C") {
    textColor = "text-amber-600 dark:text-amber-400";
    badgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  } else if (indeks === "D") {
    textColor = "text-orange-600 dark:text-orange-400";
    badgeClass = "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
  }

  return {
    score: score.toFixed(2),
    indeks,
    predikat,
    textColor,
    badgeClass,
  };
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const RekapPenilaianMentorPage = () => {
  const { isDark } = useManajemenTheme();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "final" | "draf" | "belum_dinilai"
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modal Detail Transkrip State
  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Data Peserta Bimbingan
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPesertaBimbinganPenilaian();
      setList(res.data?.data || []);
    } catch {
      toastError("Gagal memuat rekapitulasi penilaian peserta");
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

  // Buka Modal Detail Transkrip
  const handleOpenDetail = async (pesertaId) => {
    setModalDetailOpen(true);
    setLoadingDetail(true);
    try {
      const res = await getDetailPenilaianPeserta(pesertaId);
      setDetailData(res.data?.data || null);
    } catch {
      toastError("Gagal memuat rincian transkrip nilai");
      setModalDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handler Ekspor Rekap via ExportDropdown (Excel, CSV, PDF)
  const handleExport = (format) => {
    if (list.length === 0) {
      toastError("Belum ada data untuk diekspor");
      return;
    }
    try {
      if (format === "excel") {
        exportRekapNilaiToExcel(list, "Rekapitulasi_Nilai_Bimbingan_Mentor");
        toastSuccess("Rekapitulasi nilai bimbingan berhasil diekspor ke Excel (.xlsx)");
      } else if (format === "csv") {
        exportRekapNilaiToCsv(list, "Rekapitulasi_Nilai_Bimbingan_Mentor");
        toastSuccess("Rekapitulasi nilai bimbingan berhasil diekspor ke CSV (.csv)");
      } else if (format === "pdf") {
        exportRekapNilaiToPdf(list, "Rekapitulasi_Nilai_Bimbingan_Mentor");
        toastSuccess("Rekapitulasi nilai bimbingan berhasil diekspor ke PDF (.pdf)");
      }
    } catch (err) {
      toastError("Gagal mengekspor data: " + err.message);
    }
  };

  // Hitung Metrik Statistik
  const stats = useMemo(() => {
    const total = list.length;
    const finalItems = list.filter((r) => r.status_penilaian === "final" && r.nilai_akhir_angka != null);
    const transkripTerbit = finalItems.length;
    const draf = list.filter((r) => r.status_penilaian === "draf").length;
    const belumDinilai = list.filter((r) => !r.status_penilaian || r.status_penilaian === "belum_dinilai").length;

    let rataRata = "-";
    if (finalItems.length > 0) {
      const sum = finalItems.reduce((acc, curr) => acc + Number(curr.nilai_akhir_angka), 0);
      rataRata = (sum / finalItems.length).toFixed(2);
    }

    return {
      total,
      transkripTerbit,
      draf,
      belumDinilai,
      rataRata,
    };
  }, [list]);

  // Filter Data
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.institusi || "").toLowerCase().includes(q) ||
        (item.jurusan || "").toLowerCase().includes(q) ||
        (item.nim || "").toLowerCase().includes(q) ||
        (item.bidang || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === "final") return item.status_penilaian === "final";
      if (statusFilter === "draf") return item.status_penilaian === "draf";
      if (statusFilter === "belum_dinilai") {
        return !item.status_penilaian || item.status_penilaian === "belum_dinilai";
      }
      return true;
    });
  }, [list, search, statusFilter]);

  // Konfigurasi 4 Kartu Stats (Identik dengan Card Stats Halaman Laporan Akhir Role Mentor)
  const statCards = [
    {
      icon: Users,
      label: "Total Peserta",
      desktopLabel: "Total Peserta Bimbingan",
      value: stats.total,
      caption: `${stats.transkripTerbit} peserta selesai dinilai`,
      mobileCaption: "Peserta bimbingan",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-blue-500 to-blue-700",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
      onClick: () => setStatusFilter("semua"),
    },
    {
      icon: CheckCircle2,
      label: "Transkrip Terbit",
      desktopLabel: "Transkrip Nilai Terbit (Final)",
      value: stats.transkripTerbit,
      caption: "Nilai resmi disahkan & siap diunduh",
      mobileCaption: "Final & resmi",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
      onClick: () => setStatusFilter("final"),
    },
    {
      icon: Clock,
      label: "Menunggu",
      desktopLabel: "Menunggu Finalisasi",
      value: stats.draf + stats.belumDinilai,
      caption: `${stats.draf} status draf • ${stats.belumDinilai} belum dinilai`,
      mobileCaption: "Perlu penilaian",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
      onClick: () => setStatusFilter(stats.draf > 0 ? "draf" : "belum_dinilai"),
    },
    {
      icon: TrendingUp,
      label: "Rata-Rata",
      desktopLabel: "Nilai Rata-Rata Bimbingan",
      value: stats.rataRata,
      caption: stats.rataRata !== "-" ? "Skor kumulatif seluruh nilai final" : "Belum ada nilai yang final",
      mobileCaption: "Skor kumulatif",
      lightGradient: "from-indigo-300 to-white",
      gradient: "from-indigo-500 to-purple-700",
      iconBg: isDark ? "bg-purple-950/60 text-purple-400" : "bg-purple-50 text-purple-600",
      onClick: () => setStatusFilter("final"),
    },
  ];

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── 1. HEADER HALAMAN: Bersih, Rapi, Tanpa Tombol Bertumpuk di Header ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Rekapitulasi Nilai Akhir Magang
          </h2>
          <p
            className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Pantau rekapitulasi nilai akhir 4 pilar kompetensi seluruh peserta bimbingan Anda dan unduh transkrip nilai resmi.
          </p>
        </div>

        {/* ── 2. 4 KARTU STATISTIK (IDENTIK DENGAN HALAMAN LAPORAN AKHIR ROLE MENTOR) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((c, i) => (
            <div
              key={i}
              onClick={c.onClick}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                isDark
                  ? "border-white/10 bg-[#161b22]"
                  : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
              }`}
            >
              <div
                className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                  isDark
                    ? "opacity-[0.16] group-hover:opacity-[0.26]"
                    : "opacity-[0.3] group-hover:opacity-[0.4]"
                }`}
              />
              <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <span className="inline sm:hidden">{c.label}</span>
                    <span className="hidden sm:inline">{c.desktopLabel}</span>
                  </p>
                  <h3
                    className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    {loading ? "..." : c.value}
                  </h3>
                  <p
                    className={`mt-1 sm:mt-1.5 text-[8.5px] sm:text-xs font-medium leading-snug sm:whitespace-normal sm:line-clamp-2 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    <span className="inline sm:hidden">{c.mobileCaption}</span>
                    <span className="hidden sm:inline">{c.caption}</span>
                  </p>
                </div>
                <span
                  className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}
                >
                  <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                </span>
              </div>
              <div
                className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
              />
            </div>
          ))}
        </div>

        {/* ── 3. TOOLBAR: FILTER STATUS, PENCARIAN, & EKSPOR REKAP (IDENTIK DENGAN HALAMAN LAPORAN AKHIR) ── */}
        <div
          className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all ${
            isDark
              ? "bg-[#161b22] border-white/10 shadow-xs"
              : "bg-white border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Tab Filter Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto xl:overflow-x-visible py-1.5 custom-scrollbar">
              {[
                { key: "semua", label: "Semua Rekap", count: stats.total },
                { key: "final", label: "Diterbitkan (Final)", count: stats.transkripTerbit },
                { key: "draf", label: "Status Draf", count: stats.draf },
                { key: "belum_dinilai", label: "Belum Dinilai", count: stats.belumDinilai },
              ].map((tab) => {
                const isAktif = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                            : "bg-[#004F9F] text-white shadow-2xs"
                          : isDark
                          ? "bg-white/10 text-sky-400 border border-white/10"
                          : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sisi Kanan: Search Bar & Tombol Ekspor Rekap */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1.5">
              {/* Search Input dengan Focus Line & Efek Interaktif (Ukuran Kompak) */}
              <div
                className={`group relative flex-1 sm:w-48 md:w-56 sm:flex-initial transition-transform duration-200 ${
                  isSearchFocused ? "scale-[1.005]" : ""
                }`}
              >
                <Search
                  className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 pointer-events-none ${
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
                  placeholder="Cari peserta / institusi..."
                  className={`w-full h-7.5 sm:h-8 rounded-xl border pl-8 sm:pl-8.5 pr-7 text-[11px] font-medium outline-hidden transition-all duration-200 ${
                    isDark
                      ? isSearchFocused
                        ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-3 ring-[#00A5EC]/20"
                        : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                      : isSearchFocused
                        ? "border-[#004F9F] bg-white shadow-md ring-3 ring-[#00A5EC]/15 text-slate-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                      isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Hapus Pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                    isSearchFocused ? "w-[calc(100%-10px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                  }`}
                />
              </div>

              {/* Tombol Ekspor Multi-Format Menggunakan ExportDropdown (Kompak size="sm") */}
              <div className={`shrink-0 ${filteredList.length === 0 ? "pointer-events-none opacity-50" : ""}`}>
                <ExportDropdown onExport={handleExport} isDark={isDark} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. TABEL REKAPITULASI NILAI ── */}
        <div
          className={`overflow-hidden rounded-2xl border shadow-xs ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr
                  className={`border-b ${
                    isDark
                      ? "border-white/10 bg-white/[0.02] text-slate-400"
                      : "border-slate-200 bg-slate-50/80 text-slate-600"
                  } text-[10.5px] font-black uppercase tracking-wider`}
                >
                  <th className="py-3.5 px-4">Peserta Bimbingan</th>
                  <th className="py-3.5 px-4">Bidang & Periode Magang</th>
                  <th className="py-3.5 px-4 text-center">Rincian Penilaian 4 Pilar</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir & Predikat</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? "divide-white/5 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00A5EC]" />
                      <p className="text-xs font-bold">Memuat data rekapitulasi nilai...</p>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">Tidak ada data rekapitulasi nilai ditemukan.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {search ? "Coba kata kunci pencarian lain" : "Belum ada peserta bimbingan yang sesuai kriteria"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => {
                    const isFinal = row.status_penilaian === "final";
                    const isDraf = row.status_penilaian === "draf";
                    const foto = row.foto_profil;

                    // Predikat Nilai Akhir
                    const pInfo = getPredikatBadge(row.nilai_akhir_angka, row.indeks_nilai_akhir, row.predikat_akhir);

                    return (
                      <tr
                        key={row.peserta_id || row.id}
                        className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}
                      >
                        {/* Kolom 1: Peserta Bimbingan (Nama, NIM/NISN, Jurusan & Institusi dengan Title Case, Foto Lebih Besar) */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0 mt-0.5">
                              {foto ? (
                                <img
                                  src={getFileUrl(foto)}
                                  alt={row.nama}
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center text-white font-black text-sm shadow-xs">
                                  {getInitials(row.nama)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block truncate text-xs sm:text-sm">
                                {formatTitleCase(row.nama)}
                              </span>
                              <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <div className="font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                                  {row.kategori_pendaftar === "siswa" ? "NISN" : "NIM"}: {row.nim || "-"}
                                </div>
                                <div
                                  className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 truncate max-w-[210px] sm:max-w-[250px]"
                                  title={`Jurusan: ${formatTitleCase(row.jurusan)}`}
                                >
                                  <BookOpen className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{formatTitleCase(row.jurusan)}</span>
                                </div>
                                <div
                                  className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[210px] sm:max-w-[250px]"
                                  title={`Institusi: ${formatTitleCase(row.institusi)}`}
                                >
                                  <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{formatTitleCase(row.institusi)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: Bidang & Periode Magang (Fokus Penugasan & Rekapitulasi Kelulusan) */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5 min-w-[160px] max-w-[220px]">
                            {/* Posisi Bidang */}
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                              <Briefcase className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
                              <span className="font-extrabold text-xs truncate" title={row.bidang || "Bidang Magang"}>
                                {row.bidang || "Magang Diskominfo"}
                              </span>
                            </div>

                            {/* Rentang Periode Magang */}
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10.5px]">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-medium whitespace-nowrap">
                                {formatPeriodeTanggal(row.tanggal_mulai, row.tanggal_selesai)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 3: Rincian Penilaian 4 Pilar (Berjejer Menurun & Nama Lengkap) */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center justify-center">
                            {row.nilai_profesional != null ? (
                              <div className="space-y-1 text-[11px] w-full max-w-[170px] sm:max-w-[185px]">
                                {/* 1. Profesional */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Profesional</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                    {Number(row.nilai_profesional).toFixed(0)}
                                  </span>
                                </div>

                                {/* 2. Personal */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Personal</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                    {Number(row.nilai_personal).toFixed(0)}
                                  </span>
                                </div>

                                {/* 3. Sosial */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Sosial</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    {Number(row.nilai_sosial).toFixed(0)}
                                  </span>
                                </div>

                                {/* 4. Administratif */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Administratif</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                    {Number(row.nilai_administratif).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 italic">
                                Belum dinilai
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kolom 4: Nilai Akhir & Predikat */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center justify-center min-w-[125px] sm:min-w-[135px] px-3 py-2 sm:py-2.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-2xs">
                            {pInfo ? (
                              <>
                                <span className="text-xl sm:text-2xl font-black text-[#030048] dark:text-white leading-tight tracking-tight">
                                  {pInfo.score}
                                </span>
                                <span className={`text-xs sm:text-[13px] font-extrabold mt-0.5 leading-tight ${pInfo.textColor}`}>
                                  Predikat {pInfo.indeks}
                                </span>
                                <span className={`text-[11px] sm:text-xs font-bold leading-tight ${pInfo.textColor}`}>
                                  ({pInfo.predikat})
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                  {isFinal ? "Nilai Diterbitkan" : "Nilai Sementara"}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-lg sm:text-xl font-black text-slate-300 dark:text-slate-600 leading-tight">
                                  -
                                </span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                  Belum Dinilai
                                </span>
                                <span className="text-[10.5px] font-medium text-slate-400/80 dark:text-slate-500">
                                  (Belum Ada Nilai)
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 italic">
                                  Menunggu Evaluasi
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Kolom 5: Status */}
                        <td className="py-3 px-4 text-center">
                          {isFinal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Diterbitkan
                            </span>
                          ) : isDraf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              Draf
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400">
                              Belum Dinilai
                            </span>
                          )}
                        </td>

                        {/* Kolom 6: Aksi (Hanya Tombol Detail untuk Membuka Modal) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(row.peserta_id || row.id)}
                              title="Lihat Detail Transkrip Nilai"
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                            >
                              <Eye className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:scale-115 group-hover:-translate-y-0.5 text-slate-500 dark:text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400" />
                              <span>Detail</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 5. MODAL DETAIL PRATINJAU TRANSKRIP (REUSABLE COMPONENT) ── */}
        <RekapNilaiDetailModal
          show={modalDetailOpen}
          onClose={() => setModalDetailOpen(false)}
          loading={loadingDetail}
          detailData={detailData}
          isDark={isDark}
          showSertifikatButton={false}
          onDownloadPdf={() => {
            if (detailData) {
              exportTranskripNilaiPdf(detailData)
                .then(() => toastSuccess("Transkrip nilai PDF berhasil diunduh"))
                .catch((e) => toastError("Gagal mengunduh: " + e.message));
            }
          }}
          downloadingPdf={false}
        />
      </div>
    </MentorLayout>
  );
};

export default RekapPenilaianMentorPage;
