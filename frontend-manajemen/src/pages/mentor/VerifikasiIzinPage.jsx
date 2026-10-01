import { useCallback, useEffect, useState } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import Pagination from "../../components/manajemen/shared/Pagination";
import ProsesIzinModal from "../../components/manajemen/mentor/presensi/ProsesIzinModal";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import { getPengajuanIzinMentor, getStatistikPengajuanIzinMentor } from "../../services/mentorService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError, toastSuccess } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { exportIzinToCsv, exportIzinToExcel, exportIzinToPdf } from "../../utils/exportIzin";
import {
  MailCheck,
  Search,
  Inbox,
  FileText,
  CalendarRange,
  Clock,
  CheckCircle2,
  Ban,
  ShieldCheck,
  BriefcaseMedical,
  Info,
  Eye,
  MessageSquareText,
  GraduationCap,
} from "lucide-react";

const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const namaBulan = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const namaBulanSingkat = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatTanggalPanjang = (str) => {
  const d = parseLocalDate(str);
  if (!d) return str || "-";
  return `${d.getDate()} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
};

const formatHariRentang = (mulai, selesai) => {
  const d1 = parseLocalDate(mulai);
  if (!d1) return "";
  const h1 = namaHari[d1.getDay()];
  if (!selesai || mulai === selesai) return `(${h1})`;
  const d2 = parseLocalDate(selesai);
  if (!d2) return `(${h1})`;
  const h2 = namaHari[d2.getDay()];
  const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays === 2) {
    return `(${h1} & ${h2})`;
  }
  return `(${h1} s/d ${h2})`;
};

const hitungDurasiHari = (mulai, selesai) => {
  if (!mulai) return "1 Hari";
  if (!selesai || mulai === selesai) return "1 Hari";
  const d1 = parseLocalDate(mulai);
  const d2 = parseLocalDate(selesai);
  if (!d1 || !d2) return "1 Hari";
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} Hari`;
};

const formatWaktuPengajuanLengkap = (s) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const jam = `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return `Diajukan: Hari Ini, ${jam}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Diajukan: Kemarin, ${jam}`;

  return `Diajukan: ${d.getDate()} ${namaBulanSingkat[d.getMonth()]} ${d.getFullYear()}, ${jam}`;
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
        className="h-11.5 w-11.5 sm:h-12.5 sm:w-12.5 shrink-0 rounded-xl sm:rounded-2xl object-cover border border-slate-200/80 dark:border-white/10 shadow-xs transition-all duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <span className="flex h-11.5 w-11.5 sm:h-12.5 sm:w-12.5 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-xs sm:text-[13px] font-black shadow-xs transition-all duration-300 group-hover:scale-105">
      {getInitials(nama)}
    </span>
  );
};

const IzinCardSkeleton = ({ isDark }) => (
  <div
    className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5.5 shadow-xs flex flex-col justify-between animate-pulse ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
    }`}
  >
    <div>
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-11.5 w-11.5 sm:h-12.5 sm:w-12.5 shrink-0 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-32 sm:w-40 rounded-md bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-24 rounded-md bg-slate-100 dark:bg-white/5" />
              <div className="h-3.5 w-28 rounded-md bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-36 rounded-full bg-slate-100 dark:bg-white/5" />
        </div>
      </div>

      {/* Grid 2 Kolom Placeholder */}
      <div
        className={`mt-4 rounded-2xl border p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
        }`}
      >
        <div className="sm:col-span-7 space-y-2">
          <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="sm:col-span-5 space-y-2">
          <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Alasan Box Placeholder */}
      <div className="mt-3.5 space-y-1.5">
        <div className="h-2.5 w-36 rounded bg-slate-200 dark:bg-white/10" />
        <div
          className={`h-14 rounded-2xl border ${
            isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/80"
          }`}
        />
      </div>
    </div>

    {/* Footer Placeholder */}
    <div
      className={`mt-4 pt-3.5 flex items-center justify-between gap-3 border-t ${
        isDark ? "border-white/10" : "border-slate-100"
      }`}
    >
      <div className="h-3 w-48 rounded bg-slate-100 dark:bg-white/5" />
      <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-white/10" />
    </div>
  </div>
);

const VerifikasiIzinPage = () => {
  const { isDark } = useManajemenTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [statusTab, setStatusTab] = useState("menunggu");
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [proses, setProses] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const gabungan = [search, tableSearch].filter(Boolean).join(" ").trim();
    const id = setTimeout(() => {
      setDebouncedSearch(gabungan);
      setPage(0);
    }, 350);
    return () => clearTimeout(id);
  }, [search, tableSearch]);

  const fetchData = useCallback(async () => {
    try {
      const params = { page: page + 1, limit: perPage };
      if (statusTab) params.status = statusTab;
      if (debouncedSearch) params.search = debouncedSearch;

      const [resList, resStat] = await Promise.all([
        getPengajuanIzinMentor(params),
        getStatistikPengajuanIzinMentor(),
      ]);

      const payload = resList.data.data || {};
      setRows(payload.data || []);
      setTotal(payload.meta?.total || 0);
      setStat(resStat.data?.data || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat pengajuan izin.");
    } finally {
      setLoading(false);
      setIsTabChanging(false);
    }
  }, [page, perPage, statusTab, debouncedSearch]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const gantiTab = (key) => {
    if (key === statusTab) return;
    setIsTabChanging(true);
    setStatusTab(key);
    setPage(0);
  };

  const handleExport = (format) => {
    setExporting(true);
    setTimeout(async () => {
      try {
        const dasar = {};
        if (statusTab) dasar.status = statusTab;
        if (debouncedSearch) dasar.search = debouncedSearch;

        const semua = [];
        let halaman = 1;
        for (;;) {
          const res = await getPengajuanIzinMentor({ ...dasar, page: halaman, limit: 100 });
          const payload = res.data?.data || {};
          semua.push(...(payload.data || []));
          const totalHal = payload.meta?.total_page || 1;
          if (halaman >= totalHal || halaman >= 20) break;
          halaman += 1;
        }

        if (semua.length === 0) {
          toastError("Tidak ada data pengajuan izin/sakit untuk diekspor.");
          return;
        }

        if (format === "excel") exportIzinToExcel(semua, "pengajuan-izin-sakit");
        else if (format === "csv") exportIzinToCsv(semua, "pengajuan-izin-sakit");
        else exportIzinToPdf(semua, stat, "pengajuan-izin-sakit");

        toastSuccess(`${semua.length} data pengajuan izin & sakit berhasil diekspor.`);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal mengekspor data pengajuan izin.");
      } finally {
        setExporting(false);
      }
    }, 0);
  };

  // 4 Card Stats seperti di halaman Presensi Bimbingan
  const statCards = [
    {
      icon: Clock,
      label: "Menunggu",
      desktopLabel: "Menunggu Verifikasi",
      value: stat?.menunggu ?? 0,
      caption: (stat?.menunggu ?? 0) > 0 ? "Memerlukan verifikasi Anda" : "Semua telah diverifikasi",
      mobileCaption: "Perlu tindakan",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: CheckCircle2,
      label: "Disetujui",
      desktopLabel: "Pengajuan Disetujui",
      value: stat?.disetujui ?? 0,
      caption: "Tercatat pada presensi",
      mobileCaption: "Disetujui",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Ban,
      label: "Ditolak",
      desktopLabel: "Pengajuan Ditolak",
      value: stat?.ditolak ?? 0,
      caption: "Permohonan tidak disetujui",
      mobileCaption: "Ditolak",
      lightGradient: "from-rose-300 to-white",
      gradient: "from-rose-500 to-rose-700",
      iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
    },
    {
      icon: MailCheck,
      label: "Total",
      desktopLabel: "Total Pengajuan",
      value: stat?.total ?? 0,
      caption: `${stat?.izin ?? 0} Izin · ${stat?.sakit ?? 0} Sakit`,
      mobileCaption: `${stat?.izin ?? 0} Izin · ${stat?.sakit ?? 0} Sakit`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
  ];

  const TAB_STATUS = [
    { key: "menunggu", label: "Menunggu", icon: Clock, count: stat?.menunggu },
    { key: "disetujui", label: "Disetujui", icon: CheckCircle2, count: stat?.disetujui },
    { key: "ditolak", label: "Ditolak", icon: Ban, count: stat?.ditolak },
    { key: "", label: "Semua", icon: ShieldCheck, count: stat?.total },
  ];

  return (
    <MentorLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala Halaman: Judul & Subjudul Standar Admin */}
        <div>
          <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Verifikasi Izin &amp; Sakit
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Setujui atau tolak pengajuan izin/sakit peserta bimbingan Anda. Pengajuan yang disetujui otomatis tercatat pada presensi setiap hari kerja dalam rentang tanggalnya.
            </span>
            <span className="inline sm:hidden">
              Tinjau dan verifikasi permohonan izin atau sakit peserta bimbingan Anda.
            </span>
          </p>
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
              <div
                className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                  isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
                }`}
              />
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

        {/* ── CARD DAFTAR PENGAJUAN UTAMA ── */}
        <div
          className={`rounded-2xl border shadow-xs overflow-hidden ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Header Card: Judul + Subjudul & Ekspor */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-5 pb-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <MailCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Daftar Pengajuan Izin &amp; Sakit
                </h3>
                <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-xl leading-relaxed">
                  Total {total} permohonan pada tampilan filter ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Button Ekspor Data */}
              <div className={exporting ? "pointer-events-none opacity-60" : ""}>
                <ExportDropdown onExport={handleExport} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Filter Bar: Tabs Status + Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-4">
            {/* Status Tabs */}
            <div
              className={`inline-flex flex-wrap items-center gap-1 rounded-xl border p-1 shadow-xs ${
                isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
              }`}
            >
              {TAB_STATUS.map((t) => (
                <button
                  key={t.key || "semua"}
                  type="button"
                  onClick={() => gantiTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ease-out cursor-pointer active:scale-95 outline-none focus:outline-none ${
                    statusTab === t.key
                      ? isDark
                        ? "bg-[#00A5EC] text-white shadow-sm shadow-[#00A5EC]/20 scale-[1.02]"
                        : "bg-white text-[#004F9F] shadow-xs ring-1 ring-slate-200/70 scale-[1.02]"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      : "text-slate-500 hover:text-[#0B1442] hover:bg-slate-100/60"
                  }`}
                >
                  <t.icon className={`w-3.5 h-3.5 transition-transform duration-200 ${statusTab === t.key ? "scale-110" : ""}`} />
                  <span>{t.label}</span>
                  {typeof t.count === "number" && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[9.5px] font-black transition-colors duration-200 ${
                        statusTab === t.key
                          ? isDark
                            ? "bg-white/20 text-white"
                            : "bg-[#004F9F]/10 text-[#004F9F]"
                          : isDark
                          ? "bg-white/10 text-slate-400"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div
              className={`relative w-full sm:w-72 shrink-0 transition-transform duration-200 ${
                isSearchFocused ? "sm:scale-[1.02]" : ""
              }`}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${
                  isSearchFocused ? "text-[#004F9F] dark:text-[#00A5EC]" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Cari nama peserta atau alasan..."
                className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-medium outline-none transition-all duration-200 ${
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

          {/* List Content */}
          {loading ? (
            <div className="min-h-[360px] grid grid-cols-1 gap-4 sm:gap-5 px-4 sm:px-6 pb-6 lg:grid-cols-2">
              <IzinCardSkeleton isDark={isDark} />
              <IzinCardSkeleton isDark={isDark} />
            </div>
          ) : rows.length === 0 ? (
            <div
              className={`min-h-[360px] flex flex-col items-center justify-center gap-3 py-12 text-center px-4 transition-opacity duration-200 ${
                isTabChanging ? "opacity-40 pointer-events-none" : "opacity-100"
              }`}
            >
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                }`}
              >
                <Inbox className="w-6 h-6" />
                <span
                  className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
                    isDark ? "border-white/20" : "border-slate-200"
                  }`}
                />
              </span>
              <p className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Tidak ada pengajuan pada tampilan ini
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Pengajuan izin/sakit dari peserta bimbingan Anda dengan filter status ini akan ditampilkan di sini.
              </p>
              {(tableSearch || statusTab) && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch("");
                    setStatusTab("");
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Reset Filter &amp; Pencarian
                </button>
              )}
            </div>
          ) : (
            <div
              className={`min-h-[360px] grid grid-cols-1 gap-4 sm:gap-5 px-4 sm:px-6 pb-6 lg:grid-cols-2 transition-opacity duration-200 ${
                isTabChanging ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {rows.map((r) => {
                const durasiStr = hitungDurasiHari(r.tanggal_mulai, r.tanggal_selesai);
                const isMenunggu = r.status === "menunggu";

                return (
                  <div
                    key={r.id}
                    className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5.5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                      isDark
                        ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/30"
                        : "border-slate-200/90 bg-white hover:border-[#004F9F]/30"
                    }`}
                  >
                    <div>
                      {/* Top Header: Avatar + Profil Peserta di kiri, Badge Jenis + Timestamp di kanan */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <PesertaAvatar nama={r.nama} foto={r.foto_profil} />
                          <div className="min-w-0">
                            <h4
                              className={`text-sm sm:text-base font-black truncate transition-colors duration-200 ${
                                isDark
                                  ? "text-slate-100 group-hover:text-[#00A5EC]"
                                  : "text-[#0B1442] group-hover:text-[#004F9F]"
                              }`}
                            >
                              {r.nama}
                            </h4>

                            {/* Baris Badge: NIM & Institusi / Kampus */}
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {r.nomor_induk ? (
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                                    isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  NIM: {r.nomor_induk}
                                </span>
                              ) : null}
                              {r.institusi ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                                    isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <GraduationCap className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span>{r.institusi}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Kanan Atas: Badge Jenis & Durasi + Tanggal Pengajuan */}
                        <div className="flex flex-col items-start sm:items-end shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-xs ${
                              r.jenis === "sakit"
                                ? isDark
                                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                                : isDark
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {r.jenis === "sakit" ? (
                              <BriefcaseMedical className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            )}
                            <span>
                              {r.jenis === "sakit" ? "Izin Sakit" : "Pengajuan Izin"} ({durasiStr})
                            </span>
                          </span>

                          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[10.5px] font-semibold border bg-slate-50/80 text-slate-500 border-slate-200/80 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 shadow-2xs">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatWaktuPengajuanLengkap(r.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kotak Informasi 2 Kolom (Rentang Tanggal & Status Verifikasi) */}
                      <div
                        className={`mt-4 rounded-2xl border p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 ${
                          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
                        }`}
                      >
                        {/* Kolom 1: Rentang Tanggal Permohonan (Lebih lebar: 7 dari 12 kolom = ~58%) */}
                        <div className="min-w-0 sm:col-span-7">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            RENTANG TANGGAL PERMOHONAN
                          </span>
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-white/10 dark:text-sky-300">
                              <CalendarRange className="w-4 h-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs sm:text-[12px] xl:text-[12.5px] font-black leading-tight whitespace-normal sm:whitespace-nowrap xl:whitespace-normal ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                                {formatTanggalPanjang(r.tanggal_mulai)}
                                {r.tanggal_mulai !== r.tanggal_selesai && ` - ${formatTanggalPanjang(r.tanggal_selesai)}`}
                              </p>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                {formatHariRentang(r.tanggal_mulai, r.tanggal_selesai)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Kolom 2: Status Verifikasi (Lebih ramping: 5 dari 12 kolom = ~42%) */}
                        <div className="min-w-0 sm:col-span-5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            STATUS VERIFIKASI
                          </span>
                          <div className="flex items-start gap-2">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                isMenunggu
                                  ? isDark
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-amber-50 text-amber-600"
                                  : r.status === "disetujui"
                                  ? isDark
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-emerald-50 text-emerald-600"
                                  : isDark
                                  ? "bg-rose-500/15 text-rose-400"
                                  : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {isMenunggu && <Clock className="w-4 h-4" />}
                              {r.status === "disetujui" && <CheckCircle2 className="w-4 h-4" />}
                              {r.status === "ditolak" && <Ban className="w-4 h-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs sm:text-[12px] xl:text-[12.5px] font-black leading-tight truncate capitalize ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                                {isMenunggu
                                  ? "Menunggu Verifikasi"
                                  : r.status === "disetujui"
                                  ? "Pengajuan Disetujui"
                                  : "Pengajuan Ditolak"}
                              </p>
                              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {isMenunggu
                                  ? "Menunggu verifikasi mentor"
                                  : r.status === "disetujui"
                                  ? "Tercatat pada presensi"
                                  : "Presensi tidak dibebaskan"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Catatan Peserta Magang */}
                      <div className="mt-3.5">
                        <span className={`text-[11px] sm:text-xs font-bold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          Catatan Peserta Magang:
                        </span>
                        <div
                          className={`rounded-2xl border p-3.5 sm:p-4 ${
                            isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-white"
                          }`}
                        >
                          <p className={`italic font-medium text-xs sm:text-[12.5px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            &ldquo;{r.alasan || "Tidak ada catatan tambahan yang dilampirkan oleh peserta."}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Catatan Mentor (Jika Ada) */}
                      {r.catatan_mentor && (
                        <div
                          className={`mt-2.5 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border flex items-start gap-2 ${
                            isDark
                              ? "border-amber-500/20 bg-amber-500/5 text-amber-300"
                              : "border-amber-200 bg-amber-50 text-amber-900"
                          }`}
                        >
                          <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <div className="min-w-0">
                            <span className="font-bold">Catatan Anda: </span>
                            <span>{r.catatan_mentor}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      className={`mt-4 pt-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-t ${
                        isDark ? "border-white/10" : "border-slate-100"
                      }`}
                    >
                      {/* Info Persetujuan */}
                      <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 max-w-[330px]">
                        <Info className="w-3.5 h-3.5 text-[#0B1442] dark:text-[#00A5EC] shrink-0" />
                        <span className="leading-tight">Verifikasi pengajuan otomatis memperbarui rekap presensi dan kehadiran peserta</span>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {isMenunggu ? (
                          <button
                            type="button"
                            onClick={() => setProses(r)}
                            className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white px-4 py-2 text-xs font-black shadow-md shadow-[#0B1442]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer border border-white/10"
                          >
                            <MailCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                            <span>Verifikasi Pengajuan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProses(r)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer ${
                              isDark
                                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:bg-slate-50"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination totalItems={total} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
        </div>
      </div>

      {/* Modal Proses Izin */}
      {proses && (
        <ProsesIzinModal
          data={proses}
          onClose={() => setProses(null)}
          onSaved={() => {
            setReloadKey((k) => k + 1);
            window.dispatchEvent(new Event("sim_notifikasi_updated"));
          }}
          isDark={isDark}
        />
      )}
    </MentorLayout>
  );
};

export default VerifikasiIzinPage;