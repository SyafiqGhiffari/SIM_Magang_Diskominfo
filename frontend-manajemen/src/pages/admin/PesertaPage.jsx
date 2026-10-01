import { Fragment, useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PesertaStats from "../../components/manajemen/admin/peserta/PesertaStats";
import PesertaSortDropdown from "../../components/manajemen/admin/peserta/PesertaSortDropdown";
import PesertaFilterModal from "../../components/manajemen/admin/peserta/PesertaFilterModal";
import PesertaActionsDropdown from "../../components/manajemen/admin/peserta/PesertaActionsDropdown";
import PesertaDetailModal from "../../components/manajemen/admin/peserta/PesertaDetailModal";
import AssignMentorModal from "../../components/manajemen/admin/peserta/AssignMentorModal";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getAllAkunPeserta, updateStatusAkun, resetPasswordPeserta, deleteAkun, cekAkunBisaDihapus,
} from "../../services/adminService";
import { confirmDialog, toastSuccess, toastError, blockedActionDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import * as XLSX from "xlsx";
import { getFileUrl } from "../../utils/fileUrl";
import { getBidangColor } from "../../utils/bidangColor";
import {
  Users, Filter as FilterIcon, Search, ChevronUp, ChevronDown, ChevronsUpDown, Inbox,
  Building2, Calendar, Info, KeyRound, Plus, UserCog, Landmark,
} from "lucide-react";

const columns = [
  { key: "nama", label: "Nama Peserta" },
  { key: "bidang", label: "Bidang" },
  { key: "mentor_nama", label: "Mentor" },
  { key: "institusi", label: "Institusi" },
  { key: "tanggal_mulai", label: "Periode Magang" },
  { key: "status_akun", label: "Status Akun" },
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
    <th className={`px-2 sm:px-4 py-2.5 sm:py-3.5 ${className}`}>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-1 sm:gap-2 rounded-lg px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "text-[#00A5EC]"
              : "text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="truncate">{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          {isActive && direction === "asc" ? (
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00A5EC]" strokeWidth={3} />
          ) : isActive && direction === "desc" ? (
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00A5EC]" strokeWidth={3} />
          ) : (
            <ChevronsUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const avatarPalette = [
  "linear-gradient(135deg, #0B1442, #00A5EC)", "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #059669, #10b981)", "linear-gradient(135deg, #d97706, #f59e0b)",
];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

const getPeriodeStatus = (mulai, selesai) => {
  if (!mulai || !selesai) return { key: "belum_diatur", label: "Belum diatur", color: "text-slate-400", dot: "bg-slate-300" };
  const today = new Date();
  const start = new Date(mulai);
  const end = new Date(selesai);
  if (today < start) return { key: "belum_mulai", label: "Belum mulai", color: "text-amber-500", dot: "bg-amber-400" };
  if (today > end) return { key: "selesai", label: "Selesai", color: "text-slate-400", dot: "bg-slate-400" };
  return { key: "berjalan", label: "Sedang berjalan", color: "text-emerald-500", dot: "bg-emerald-500" };
};

const PesertaPage = () => {
  const { isDark } = useManajemenTheme();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [statusList, setStatusList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);
  const [mentorStatusList, setMentorStatusList] = useState([]);
  const [bidangFilter, setBidangFilter] = useState("");
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedPeriodeList, setAppliedPeriodeList] = useState([]);
  const [appliedMentorStatusList, setAppliedMentorStatusList] = useState([]);
  const [appliedBidangFilter, setAppliedBidangFilter] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [selectedAssignMentor, setSelectedAssignMentor] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatus = (key) => setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  const togglePeriode = (key) => setPeriodeList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  const toggleMentorStatus = (key) => setMentorStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));

  const fetchData = async () => {
    try {
      const res = await getAllAkunPeserta();
      setList(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data peserta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleToggleStatus = async (m) => {
    const newStatus = m.status_akun === "aktif" ? "nonaktif" : "aktif";
    try {
      await updateStatusAkun(m.id, { status_akun: newStatus });
      setList((prev) => prev.map((x) => (x.id === m.id ? { ...x, status_akun: newStatus } : x)));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status.");
    }
  };

  const handleResetPassword = async (m) => {
    const emailPeserta = m.email_login || m.email_notifikasi || m.email || "-";
    const result = await confirmDialog({
      title: `Reset password ${m.nama}?`,
      text: `Password baru akan dibuat otomatis dan dikirim ke email peserta (${emailPeserta}).`,
      confirmText: "Ya, Reset Password",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    try {
      await resetPasswordPeserta(m.id);
      toastSuccess("Password berhasil direset dan dikirim ke email peserta");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mereset password.");
    }
  };

  const handleDelete = async (m) => {
    let cekResult;
    try {
      const res = await cekAkunBisaDihapus(m.id);
      cekResult = res.data.data;
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memeriksa status akun.");
      return;
    }

    if (!cekResult.bisa_dihapus) {
      await blockedActionDialog({
        title: "Akun peserta tidak dapat dihapus",
        text: `Akun "${m.nama}" ${cekResult.alasan.join(" dan ")}. Nonaktifkan akun terlebih dahulu dan pastikan masa magang telah selesai.`,
      });
      return;
    }

    const result = await confirmDialog({
      title: `Hapus akun ${m.nama}?`,
      text: "Riwayat pendaftaran magang peserta ini tetap tersimpan. Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAkun(m.id);
      toastSuccess("Akun peserta berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus akun.");
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedPeriodeList(periodeList);
    setAppliedMentorStatusList(mentorStatusList);
    setAppliedBidangFilter(bidangFilter);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]); setPeriodeList([]); setMentorStatusList([]); setBidangFilter("");
    setAppliedStatusList([]); setAppliedPeriodeList([]); setAppliedMentorStatusList([]); setAppliedBidangFilter("");
    setSortBy("nama_az");
    setPage(0);
  };

  const bidangOptions = [...new Set(list.map((p) => p.bidang).filter(Boolean))];

  const filtered = list
    .filter((m) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(m.status_akun)))
    .filter((m) => (appliedBidangFilter ? m.bidang === appliedBidangFilter : true))
    .filter((m) =>
      appliedPeriodeList.length === 0
        ? true
        : appliedPeriodeList.includes(getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai).key)
    )
    .filter((m) => {
      if (appliedMentorStatusList.length === 0 || appliedMentorStatusList.length === 2) return true;
      if (appliedMentorStatusList.includes("belum_ada")) return !m.mentor_nama;
      if (appliedMentorStatusList.includes("sudah_ada")) return Boolean(m.mentor_nama);
      return true;
    })
    .filter((m) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return (
          m.nama.toLowerCase().includes(s) ||
          (m.email_login || "").toLowerCase().includes(s) ||
          (m.bidang || "").toLowerCase().includes(s)
        );
      };
      return match(search) && match(tableSearch);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (columnSort.key) {
      const valA = (a[columnSort.key] || "").toString().toLowerCase();
      const valB = (b[columnSort.key] || "").toString().toLowerCase();
      const result = valA.localeCompare(valB);
      return columnSort.direction === "asc" ? result : -result;
    }
    if (sortBy === "nama_az") return a.nama.localeCompare(b.nama);
    if (sortBy === "nama_za") return b.nama.localeCompare(a.nama);
    if (sortBy === "terbaru") return b.id - a.id;
    return 0;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalAktif = list.filter((m) => m.status_akun === "aktif").length;
  const totalNonaktif = list.filter((m) => m.status_akun === "nonaktif").length;
  const totalAlumni = list.filter((m) => m.status_magang === "selesai").length;
  const totalAktifMagang = list.filter((m) => m.status_akun === "aktif" && m.status_magang !== "selesai").length;

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    const rows = sorted.map((m) => ({
      Nama: m.nama, Email: m.email_login || m.email || "-",
      Bidang: m.bidang || "-", Mentor: m.mentor_nama || "Belum Ditugaskan", Institusi: m.institusi || "-",
      "Periode Magang": m.tanggal_mulai ? `${fmtDate(m.tanggal_mulai)} - ${fmtDate(m.tanggal_selesai)}` : "-",
      "Status Akun": m.status_akun === "aktif" ? "Aktif" : "Nonaktif",
      "Status Magang": m.status_magang === "selesai" ? "Alumni (read-only)" : "Aktif magang",
    }));
    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Peserta");
      XLSX.writeFile(wb, `data-peserta-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else {
      toastError("Format ekspor ini belum didukung untuk data peserta.");
    }
  };

  const activeFilterCount =
    appliedStatusList.length +
    (appliedBidangFilter ? 1 : 0) +
    appliedPeriodeList.length +
    appliedMentorStatusList.length +
    (isMobile ? (sortBy ? 1 : 0) : 0);

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="flex flex-col space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Title */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Peserta</h2>
          <p className={`mt-1 text-[11px] sm:text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Kelola akun & status login peserta.</span>
            <span className="hidden sm:inline">Kelola akun peserta magang yang telah diterima, beserta status dan kredensial login mereka.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-24 text-slate-400 text-xs sm:text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data peserta...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
            {/* 6 Stats Cards (Order 1) */}
            <div className="order-1 col-span-1 lg:col-span-4">
              <PesertaStats
                total={list.length}
                aktif={totalAktif}
                nonaktif={totalNonaktif}
                sedangMagang={totalAktifMagang}
                alumni={totalAlumni}
                belumAdaMentor={list.filter((p) => p.bidang && !p.mentor_nama).length}
                isDark={isDark}
              />
            </div>

            {/* Dua Card Info Berdampingan (Order 3 di Mobile, Order 2 di Desktop) */}
            <div className="order-3 lg:order-2 col-span-1 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
              {/* Card 1: Aktivasi Otomatis Akun Peserta */}
              <div className={`rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden p-3 sm:p-5 ${
                isDark ? "border-white/10" : "border-slate-200/80"
              } bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A]`}>
                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                  <span className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 border border-white/15">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A5EC]" />
                  </span>
                  <h3 className="text-[11px] sm:text-xs font-black text-white">Aktivasi Otomatis Akun Peserta</h3>
                </div>
                <ol className="space-y-1.5 sm:space-y-2.5">
                  {[
                    "Buka menu Kelola Pendaftaran.",
                    "Review berkas pendaftaran calon peserta.",
                    'Klik tombol "Terima" pada modal verifikasi.',
                    "Akun magang otomatis aktif & terhubung dengan kredensial pendaftaran peserta.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5 sm:gap-2.5 text-[9.5px] sm:text-[11px] leading-relaxed text-white/75">
                      <span className="flex h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[8px] sm:text-[9px] font-black text-[#00A5EC]">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-2.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 p-2 sm:p-3">
                  <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#00A5EC]" />
                  <p className="text-[9px] sm:text-[10.5px] leading-relaxed text-white/70">
                    <span className="inline sm:hidden">Peserta login menggunakan email aktif &amp; kata sandi pendaftaran mereka.</span>
                    <span className="hidden sm:inline">Peserta langsung dapat login ke portal manajemen menggunakan email aktif &amp; kata sandi pendaftaran mereka tanpa perlu kredensial terpisah.</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Cara Menentukan Mentor */}
              <div className={`rounded-xl sm:rounded-2xl border shadow-sm p-3 sm:p-5 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}>
                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                  <span className={`flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                    isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
                  }`}>
                    <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <h3 className={`text-[11px] sm:text-xs font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Cara Menentukan Mentor</h3>
                </div>
                <p className={`text-[9.5px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Klik badge pada kolom <b>Mentor</b> di tabel untuk membuka pilihan mentor pembimbing peserta tersebut.
                </p>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <div className={`flex items-center gap-1.5 sm:gap-2 rounded-lg border border-dashed px-2 sm:px-3 py-1 sm:py-2 ${
                    isDark ? "border-amber-500/30 bg-amber-500/10" : "border-amber-300 bg-amber-50"
                  }`}>
                    <span className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white leading-none">
                      <Plus className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" strokeWidth={3} />
                    </span>
                    <span className="text-[9px] sm:text-[10.5px] font-bold text-amber-500 dark:text-amber-300">Tentukan Mentor</span>
                    <span className="ml-auto text-[8.5px] sm:text-[9.5px] text-slate-400">← belum ada</span>
                  </div>
                  <div className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1 sm:py-2 ${
                    isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                  }`}>
                    <UserCog className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] sm:text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">Nama Mentor</span>
                    <span className="ml-auto text-[8.5px] sm:text-[9.5px] text-slate-400">← sudah ada</span>
                  </div>
                </div>
                <p className="text-[8.5px] sm:text-[10.5px] text-slate-400 mt-2 sm:mt-3">
                  Hanya mentor dari bidang yang sama dengan peserta yang bisa dipilih.
                </p>
              </div>
            </div>

            {/* Card Tabel (Order 2 di Mobile, Order 3 di Desktop) */}
            <div className={`order-2 lg:order-3 col-span-1 lg:col-span-4 rounded-2xl border shadow-sm overflow-hidden ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              {/* Header Card: Judul di Kiri & Button Ekspor di Kanan (Sejajar) */}
              <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-5">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Daftar Peserta</h3>
                      <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-md leading-relaxed">
                        <span className="inline sm:hidden">Filter status & periode</span>
                        <span className="hidden sm:inline">Akun ini dibuat otomatis saat admin menerima pendaftaran magang.</span>
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ExportDropdown onExport={handleExport} isDark={isDark} />
                  </div>
                </div>

                {/* Toolbar: Button Filter & Kolom Search Sejajar di Mobile, Sort Dropdown di Desktop */}
                <div className={`flex flex-row items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-6 pb-3.5 sm:pb-5 border-b ${
                  isDark ? "border-white/10" : "border-slate-100"
                }`}>
                  <div className="flex items-center gap-2">
                    {/* Desktop Sort Dropdown */}
                    <div className="hidden sm:block">
                      <PesertaSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                    </div>
                    {/* Filter Button */}
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className={`group inline-flex h-8 sm:h-auto items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <FilterIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      {activeFilterCount > 0 && (
                        <span className="flex h-4 min-w-[16px] sm:h-4.5 sm:min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] sm:text-[9.5px] font-black">{activeFilterCount}</span>
                      )}
                    </button>
                  </div>

                  {/* Search Input Sejajar di Kanan */}
                  <div className="relative w-full max-w-[200px] sm:max-w-xs">
                    <Search className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => { setTableSearch(e.target.value); setPage(0); }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder={isMobile ? "Cari peserta..." : "Cari nama, email, bidang..."}
                      className={`w-full rounded-xl border pl-8.5 sm:pl-9 pr-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium outline-none transition-all duration-200 ${
                        isDark
                          ? isSearchFocused
                            ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 ring-4 ring-[#00A5EC]/20"
                            : "border-white/10 bg-white/5 text-slate-300 placeholder-slate-500 hover:border-white/20"
                          : isSearchFocused
                            ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15 text-slate-700"
                            : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Tabel Peserta */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] sm:text-[13px]">
                    <thead>
                      <tr className={`border-b ${isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/60"}`}>
                        {columns.map((col) => {
                          const isHiddenMobile = col.key === "bidang" || col.key === "mentor_nama" || col.key === "institusi" || col.key === "tanggal_mulai";
                          const hiddenClass = isHiddenMobile ? "hidden sm:table-cell" : "";
                          const label = col.key === "status_akun" ? (
                            <>
                              <span className="inline sm:hidden">Status</span>
                              <span className="hidden sm:inline">Status Akun</span>
                            </>
                          ) : col.label;

                          return (
                            <SortableHeader
                              key={col.key}
                              column={{ ...col, label }}
                              columnSort={columnSort}
                              setColumnSort={setColumnSort}
                              isDark={isDark}
                              className={hiddenClass}
                            />
                          );
                        })}
                        <th className="px-3 sm:px-6 py-2.5 sm:py-3.5 text-right text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr className="animate-[fadeslide_0.3s_ease-out]">
                          <td colSpan={7} className="px-4 sm:px-6 py-12 sm:py-16">
                            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center">
                              <span className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                              }`}>
                                <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className={`absolute inset-0 rounded-xl sm:rounded-2xl border-2 animate-ping opacity-40 ${
                                  isDark ? "border-white/10" : "border-slate-200"
                                }`} />
                              </span>
                              <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-500"}`}>Belum ada akun peserta</p>
                              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 max-w-[260px] sm:max-w-none">
                                {list.length === 0
                                  ? "Terima pendaftaran magang lewat menu Kelola Pendaftaran untuk mengaktifkan akun peserta."
                                  : "Tidak ada peserta yang cocok dengan filter saat ini."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((m, i) => {
                          const bidangColor = getBidangColor(m.bidang);
                          return (
                            <Fragment key={m.id}>
                              <tr
                                className={`group border-b transition-all duration-200 ${
                                  isDark
                                    ? "border-white/5 hover:bg-white/[0.02]"
                                    : "border-slate-50 hover:bg-blue-50/30"
                                } animate-[fadeslide_0.3s_ease-out]`}
                                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
                              >
                                {/* Nama Peserta (Clickable on Mobile for Accordion) */}
                                <td
                                  className="px-2.5 sm:px-4 py-2.5 sm:py-4 cursor-pointer sm:cursor-default"
                                  onClick={() => toggleRow(m.id)}
                                >
                                  <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className="relative shrink-0">
                                      {m.foto_profil ? (
                                        <img
                                          src={getFileUrl(m.foto_profil)}
                                          alt={m.nama}
                                          className="h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 rounded-full object-cover border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
                                        />
                                      ) : (
                                        <span
                                          className="flex h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full text-white text-[10px] sm:text-sm font-black border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
                                          style={{ background: avatarPalette[m.id % avatarPalette.length] }}
                                        >
                                          {getInitials(m.nama)}
                                        </span>
                                      )}
                                      {m.is_online && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" title="Sedang online" />
                                      )}
                                    </div>
                                    <div className="min-w-0 max-w-[130px] sm:max-w-[150px]">
                                      <div className="flex items-center gap-1">
                                        <p className={`font-bold text-[11px] sm:text-xs truncate transition-colors duration-200 ${
                                          isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                        }`} title={m.nama}>
                                          {m.nama}
                                        </p>
                                        <ChevronDown className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${expandedRows[m.id] ? "rotate-180 text-[#00A5EC]" : ""}`} />
                                      </div>
                                      <p className="text-[9.5px] sm:text-[11px] text-slate-400 truncate" title={m.email_login}>{m.email_login}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Bidang (Desktop) */}
                                <td className="hidden sm:table-cell px-4 py-4">
                                  {m.bidang ? (
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black whitespace-nowrap ${bidangColor.bg} ${bidangColor.text}`}
                                      style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                    >
                                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>{m.bidang}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">-</span>
                                  )}
                                </td>

                                {/* Mentor (Desktop) */}
                                <td className="hidden sm:table-cell px-4 py-4 text-left">
                                  {m.mentor_nama ? (
                                    <button
                                      onClick={() => setSelectedAssignMentor(m)}
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                        isDark
                                          ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:-translate-y-0.5"
                                      }`}
                                      title="Klik untuk ubah mentor pembimbing"
                                    >
                                      <UserCog className="w-3.5 h-3.5 shrink-0" />
                                      <span>{m.mentor_nama}</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedAssignMentor(m)}
                                      className={`group/assign inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[10.5px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                        isDark
                                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                          : "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-sm"
                                      }`}
                                      title="Klik untuk tentukan mentor pembimbing"
                                    >
                                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white transition-transform duration-200 group-hover/assign:rotate-90 group-hover/assign:scale-110">
                                        <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                                      </span>
                                      <span>Tentukan Mentor</span>
                                    </button>
                                  )}
                                </td>

                                {/* Institusi (Desktop) */}
                                <td className="hidden sm:table-cell px-4 py-4 text-slate-500">
                                  <span className={`group/inst inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md max-w-full ${
                                    isDark
                                      ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                                      : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                                  }`}>
                                    <Landmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/inst:scale-110" />
                                    <span className="whitespace-normal break-words leading-relaxed text-left">{m.institusi || "-"}</span>
                                  </span>
                                </td>

                                {/* Periode Magang (Desktop) */}
                                <td className="hidden sm:table-cell px-4 py-4">
                                  {(() => {
                                    const status = getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai);
                                    const belumDiatur = !m.tanggal_mulai || !m.tanggal_selesai;
                                    return (
                                      <div className="group/periode flex flex-col items-start">
                                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold shadow-sm whitespace-nowrap transition-all duration-200 group-hover/periode:-translate-y-0.5 ${
                                          isDark
                                            ? "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20"
                                            : "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-slate-300 group-hover:bg-white group-hover:shadow-md"
                                        }`}>
                                          <Calendar className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/periode:scale-110 group-hover/periode:text-[#00A5EC]" />
                                          {belumDiatur ? "Periode belum diatur" : `${fmtDate(m.tanggal_mulai)} - ${fmtDate(m.tanggal_selesai)}`}
                                        </span>
                                        <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold ${status.color}`}>
                                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${status.label === "Sedang berjalan" ? "animate-pulse" : ""}`} />
                                          {status.label}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* Status Akun Switch (Mobile & Desktop) */}
                                <td className="px-2 sm:px-4 py-2.5 sm:py-4">
                                  <button
                                    onClick={() => handleToggleStatus(m)}
                                    className={`group relative inline-flex h-[27px] w-[68px] sm:h-[30px] sm:w-[86px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                                      m.status_akun === "aktif"
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                                        : isDark ? "bg-slate-700" : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                                    } hover:shadow-md active:scale-95`}
                                  >
                                    <span
                                      className={`absolute left-2 sm:left-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
                                        m.status_akun === "aktif" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                      }`}
                                    >
                                      Aktif
                                    </span>
                                    <span
                                      className={`absolute right-2 sm:right-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 transition-all duration-300 ${
                                        m.status_akun !== "aktif" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
                                      }`}
                                    >
                                      Off
                                    </span>
                                    <span
                                      className="relative inline-flex h-5 w-5 sm:h-6 sm:w-6 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out group-active:scale-90"
                                      style={{
                                        transform: m.status_akun === "aktif" ? (isMobile ? "translateX(45px)" : "translateX(59px)") : "translateX(3px)",
                                      }}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-colors duration-300 ${
                                          m.status_akun === "aktif" ? "bg-emerald-500" : "bg-slate-300"
                                        }`}
                                      />
                                    </span>
                                  </button>

                                  <div className="mt-1 sm:mt-1.5">
                                    <p
                                      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 w-[68px] sm:w-[86px] text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap text-center ${
                                        m.status_akun === "nonaktif"
                                          ? isDark ? "bg-red-950/40 text-red-400 ring-1 ring-red-900/40" : "bg-red-50 text-red-600 ring-1 ring-red-200"
                                          : m.status_magang === "selesai"
                                            ? isDark ? "bg-white/5 text-slate-400 ring-1 ring-white/10" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                                            : isDark ? "bg-[#00A5EC]/15 text-sky-300 ring-1 ring-[#00A5EC]/30" : "bg-blue-50 text-[#004F9F] ring-1 ring-blue-200"
                                      }`}
                                      title={
                                        m.status_akun === "nonaktif"
                                          ? "Akun nonaktif — akses login diblokir sementara"
                                          : m.status_magang === "selesai"
                                            ? "Masa magang selesai — akun read-only, sertifikat tetap dapat diakses"
                                            : "Masih aktif magang — wajib presensi"
                                      }
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                        m.status_akun === "nonaktif"
                                          ? "bg-red-500"
                                          : m.status_magang === "selesai"
                                            ? "bg-slate-400"
                                            : "bg-[#00A5EC] animate-pulse"
                                      }`} />
                                      <span>
                                        {m.status_akun === "nonaktif"
                                          ? "Nonaktif"
                                          : m.status_magang === "selesai"
                                            ? "Alumni"
                                            : "Aktif"}
                                      </span>
                                    </p>
                                  </div>
                                </td>

                                {/* Aksi Dropdown */}
                                <td className="px-2 sm:px-6 py-2.5 sm:py-4 text-right">
                                  <PesertaActionsDropdown
                                    onDetail={() => setSelectedDetailId(m.id)}
                                    onResetPassword={() => handleResetPassword(m)}
                                    onDelete={() => handleDelete(m)}
                                    isDark={isDark}
                                  />
                                </td>
                              </tr>

                              {/* Mobile Collapsible Accordion Row */}
                              <tr className="table-row sm:hidden">
                                <td colSpan={3} className="p-0">
                                  <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      expandedRows[m.id]
                                        ? "max-h-[300px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]"
                                        : "max-h-0 opacity-0 p-0 border-none"
                                    }`}
                                  >
                                    <div className="space-y-2 text-[10.5px]">
                                      {/* Institusi */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                          <Landmark className="w-3 h-3 text-slate-400" /> Institusi
                                        </span>
                                        <span className={`group/inst inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md max-w-[70%] ${
                                          isDark
                                            ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                                            : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                                        }`}>
                                          <Landmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/inst:scale-110" />
                                          <span className="whitespace-normal break-words leading-relaxed text-left">{m.institusi || "-"}</span>
                                        </span>
                                      </div>

                                      {/* Bidang */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <Building2 className="w-3 h-3 text-slate-400" /> Bidang:
                                        </span>
                                        <span
                                          className={`font-black rounded-full px-2 py-0.5 text-[9.5px] shadow-sm ${bidangColor.bg} ${bidangColor.text}`}
                                          style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                        >
                                          {m.bidang || "-"}
                                        </span>
                                      </div>

                                      {/* Mentor */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <UserCog className="w-3 h-3 text-slate-400" /> Mentor:
                                        </span>
                                        {m.mentor_nama ? (
                                          <button
                                            onClick={() => setSelectedAssignMentor(m)}
                                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                                              isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                                            }`}
                                          >
                                            <UserCog className="w-2.5 h-2.5" />
                                            {m.mentor_nama}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setSelectedAssignMentor(m)}
                                            className="inline-flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600 dark:text-amber-300 cursor-pointer"
                                          >
                                            <Plus className="w-2.5 h-2.5" />
                                            Tentukan Mentor
                                          </button>
                                        )}
                                      </div>

                                      {/* Periode Magang */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                          <Calendar className="w-3 h-3 text-slate-400" /> Periode:
                                        </span>
                                        {(() => {
                                          const st = getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai);
                                          return (
                                            <span className="text-right">
                                              <span className={`block font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                                {m.tanggal_mulai ? `${fmtDate(m.tanggal_mulai)} - ${fmtDate(m.tanggal_selesai)}` : "-"}
                                              </span>
                                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${st.color}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                              </span>
                                            </span>
                                          );
                                        })()}
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

      {showFilterModal && (
        <PesertaFilterModal
          statusList={statusList} toggleStatus={toggleStatus}
          periodeList={periodeList} togglePeriode={togglePeriode}
          mentorStatusList={mentorStatusList} toggleMentorStatus={toggleMentorStatus}
          bidangList={bidangOptions} bidang={bidangFilter} setBidang={setBidangFilter}
          onApply={handleApplyFilters} onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy} setSortBy={setSortBy}
        />
      )}

      {selectedDetailId && (
        <PesertaDetailModal pesertaId={selectedDetailId} onClose={() => setSelectedDetailId(null)} isDark={isDark} />
      )}

      {selectedAssignMentor && (
        <AssignMentorModal
          peserta={selectedAssignMentor}
          onClose={() => setSelectedAssignMentor(null)}
          onUpdated={fetchData}
          isDark={isDark}
        />
      )}
    </AdminLayout>
  );
};

export default PesertaPage;