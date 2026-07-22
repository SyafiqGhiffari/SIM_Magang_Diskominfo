import { useEffect, useState } from "react";
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
import {
  Users, Filter as FilterIcon, Search, ChevronUp, ChevronDown, Inbox,
  Building2, Calendar, Info, KeyRound, Plus, UserCog, AlertTriangle, Check, Landmark,
} from "lucide-react";

const columns = [
  { key: "nama", label: "Nama Peserta" },
  { key: "bidang", label: "Bidang" },
  { key: "mentor_nama", label: "Mentor" },
  { key: "institusi", label: "Institusi" },
  { key: "tanggal_mulai", label: "Periode Magang" },
  { key: "status_akun", label: "Status" },
];

const SortableHeader = ({ column, columnSort, setColumnSort }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;
  const handleClick = () => {
    if (!isActive) setColumnSort({ key: column.key, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: column.key, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };
  return (
    <th className="px-6 py-3.5">
      <button onClick={handleClick} className={`group flex w-full items-center justify-between gap-3 text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${isActive ? "text-[#0B1442]" : "text-slate-400 hover:text-slate-600"}`}>
        <span>{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp className={`w-3 h-3 transition-all duration-200 ${isActive && direction === "asc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
          <ChevronDown className={`w-3 h-3 -mt-1.5 transition-all duration-200 ${isActive && direction === "desc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
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

// ⬅ tambah field `key` supaya bisa dipakai sebagai identifier filter (bukan cuma label untuk tampilan)
const getPeriodeStatus = (mulai, selesai) => {
  if (!mulai || !selesai) return { key: "belum_diatur", label: "Belum diatur", color: "text-slate-400", dot: "bg-slate-300" };
  const today = new Date();
  const start = new Date(mulai);
  const end = new Date(selesai);
  if (today < start) return { key: "belum_mulai", label: "Belum mulai", color: "text-amber-600", dot: "bg-amber-400" };
  if (today > end) return { key: "selesai", label: "Selesai", color: "text-slate-500", dot: "bg-slate-400" };
  return { key: "berjalan", label: "Sedang berjalan", color: "text-emerald-600", dot: "bg-emerald-500" };
};

const PesertaPage = () => {
  const { isDark } = useManajemenTheme();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [statusList, setStatusList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]); // ⬅ filter periode magang (belum_mulai / berjalan / selesai)
  const [bidangFilter, setBidangFilter] = useState("");
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedPeriodeList, setAppliedPeriodeList] = useState([]); // ⬅
  const [appliedBidangFilter, setAppliedBidangFilter] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [selectedAssignMentor, setSelectedAssignMentor] = useState(null);

  const toggleStatus = (key) => setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  const togglePeriode = (key) => setPeriodeList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key])); // ⬅

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
    const result = await confirmDialog({
      title: `Reset password ${m.nama}?`,
      text: `Password baru akan dibuat otomatis dan dikirim ke email notifikasi peserta (${m.email_notifikasi || "-"}).`,
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
    setAppliedPeriodeList(periodeList); // ⬅
    setAppliedBidangFilter(bidangFilter);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]); setPeriodeList([]); setBidangFilter(""); // ⬅
    setAppliedStatusList([]); setAppliedPeriodeList([]); setAppliedBidangFilter(""); // ⬅
    setPage(0);
  };

  const bidangOptions = [...new Set(list.map((p) => p.bidang).filter(Boolean))];

  const filtered = list
    .filter((m) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(m.status_akun)))
    .filter((m) => (appliedBidangFilter ? m.bidang === appliedBidangFilter : true))
    .filter((m) => // ⬅ filter berdasarkan periode magang
      appliedPeriodeList.length === 0
        ? true
        : appliedPeriodeList.includes(getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai).key)
    )
    .filter((m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      (m.email_login || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.bidang || "").toLowerCase().includes(search.toLowerCase())
    );

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
  const today = new Date();
  const sedangMagang = list.filter((m) => {
    if (!m.tanggal_mulai || !m.tanggal_selesai) return false;
    const mulai = new Date(m.tanggal_mulai);
    const selesai = new Date(m.tanggal_selesai);
    return today >= mulai && today <= selesai;
  }).length;

  const pesertaSelesai = list.filter((m) => getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai).key === "selesai");

  const pesertaSelesaiBelumNonaktif = pesertaSelesai.filter((m) => m.status_akun === "aktif");

  // ⬅ langsung terapkan filter "selesai + aktif" dan buka modal (opsional bisa juga langsung tampil di tabel)
  const handleLihatSelesaiBelumNonaktif = () => {
    setStatusList(["aktif"]);
    setPeriodeList(["selesai"]);
    setAppliedStatusList(["aktif"]);
    setAppliedPeriodeList(["selesai"]);
    setPage(0);
  };

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    const rows = sorted.map((m) => ({
      Nama: m.nama, "Email Login": m.email_login, "Email Notifikasi": m.email_notifikasi || "-",
      Bidang: m.bidang || "-", Mentor: m.mentor_nama || "Belum Ditugaskan", Institusi: m.institusi || "-",
      "Periode Magang": m.tanggal_mulai ? `${fmtDate(m.tanggal_mulai)} - ${fmtDate(m.tanggal_selesai)}` : "-",
      Status: m.status_akun === "aktif" ? "Aktif" : "Nonaktif",
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

  // ⬅ hitung count filter aktif termasuk periode
  const activeFilterCount = (appliedStatusList.length > 0 ? 1 : 0) + (appliedBidangFilter ? 1 : 0) + (appliedPeriodeList.length > 0 ? 1 : 0);

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Peserta</h2>
          <p className={`mt-1.5 text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Kelola akun peserta magang yang telah diterima, beserta status dan kredensial login mereka.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data peserta...
          </div>
        ) : (
          <>
            <PesertaStats
              total={list.length}
              aktif={totalAktif}
              nonaktif={totalNonaktif}
              sedangMagang={sedangMagang}
              belumAdaMentor={list.filter((p) => p.bidang && !p.mentor_nama).length}
            />

            {/* Baris 1: dua card info berdampingan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] shadow-sm overflow-hidden p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                    <Info className="w-4 h-4 text-[#00A5EC]" />
                  </span>
                  <h3 className="text-xs font-black text-white">Cara Membuat Akun Peserta Baru</h3>
                </div>
                <ol className="space-y-2.5">
                  {[
                    "Buka menu Kelola Pendaftaran.",
                    'Filter status "Diterima".',
                    'Klik titik tiga pada baris peserta, pilih "Buat Akun Peserta".',
                    "Kredensial otomatis dibuat dan dikirim ke email peserta.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-white/75">
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-[#00A5EC]">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
                  <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#00A5EC]" />
                  <p className="text-[10.5px] leading-relaxed text-white/70">
                    Email login dibuat khusus untuk mengakses sistem, sedangkan email pribadi tetap digunakan untuk menerima notifikasi selama masa magang.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <UserCog className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-black text-[#0B1442]">Cara Menentukan Mentor</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 mb-3">
                  Klik badge pada kolom <b>Mentor</b> di tabel untuk membuka pilihan mentor pembimbing peserta tersebut.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white leading-none">
                      <Plus className="w-3 h-3 shrink-0" strokeWidth={3} />
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-700">Tentukan Mentor</span>
                    <span className="ml-auto text-[9.5px] text-slate-400">← belum ada</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                    <UserCog className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="text-[10.5px] font-bold text-emerald-700">Nama Mentor</span>
                    <span className="ml-auto text-[9.5px] text-slate-400">← sudah ada</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-3">
                  Hanya mentor dari bidang yang sama dengan peserta yang bisa dipilih.
                </p>
              </div>
            </div>

          {/* Baris 2: tabel (lebih lebar) + card Sudah Selesai Magang di sampingnya */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            {/* Card tabel — ambil 3 dari 4 kolom */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <Users className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Daftar Peserta</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-md leading-relaxed">
                      Akun ini dibuat otomatis saat admin menerima pendaftaran magang.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 sm:self-start">
                  <ExportDropdown onExport={handleExport} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <PesertaSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer shrink-0"
                  >
                    <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[9.5px] font-black">{activeFilterCount}</span>
                    )}
                  </button>
                </div>
                <div className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                  <input
                    type="text" value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
                    placeholder="Cari nama, email, bidang..."
                    className={`w-full rounded-xl border pl-9 pr-9 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                      isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 animate-[fadeslide_0.3s_ease-out]">
                      {columns.map((col) => <SortableHeader key={col.key} column={col} columnSort={columnSort} setColumnSort={setColumnSort} />)}
                      <th className="px-6 py-3.5 text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={7} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada akun peserta</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {list.length === 0
                                ? "Buat akun lewat menu Kelola Pendaftaran untuk peserta yang sudah diterima."
                                : "Tidak ada peserta yang cocok dengan filter saat ini."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((m, i) => (
                        <tr key={m.id} className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative shrink-0">
                                {m.foto_profil ? (
                                  <img
                                    src={getFileUrl(m.foto_profil)}
                                    alt={m.nama}
                                    className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
                                  />
                                ) : (
                                  <span
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-white text-[10px] font-black shadow-sm transition-all duration-300 group-hover:scale-110"
                                    style={{ background: avatarPalette[m.id % avatarPalette.length] }}
                                  >
                                    {getInitials(m.nama)}
                                  </span>
                                )}
                                {m.is_online && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" title="Sedang online" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-[150px]">
                                <p className="font-bold text-[#0B1442] truncate transition-colors duration-200 group-hover:text-[#004F9F]" title={m.nama}>{m.nama}</p>
                                <p className="text-[11px] text-slate-400 truncate" title={m.email_login}>{m.email_login}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {m.bidang ? (
                              <span className="group/bdg inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30 max-w-[140px]">
                                <Building2 className="w-3 h-3 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                                <span className="text-center leading-snug">{m.bidang}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            {m.mentor_nama ? (
                              <button
                                onClick={() => setSelectedAssignMentor(m)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer max-w-[150px]"
                                title="Klik untuk ubah mentor pembimbing"
                              >
                                <UserCog className="w-3 h-3 shrink-0 self-center" />
                                <span className="text-center leading-snug">{m.mentor_nama}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedAssignMentor(m)}
                                className="group/assign inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10.5px] font-bold text-amber-700 hover:border-amber-400 hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer max-w-[140px]"
                                title="Klik untuk tentukan mentor pembimbing"
                              >
                                <span className="flex h-3.5 w-3.5 shrink-0 self-center items-center justify-center rounded-full bg-amber-400 text-white transition-transform duration-200 group-hover/assign:rotate-90 group-hover/assign:scale-110">
                                  <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                                </span>
                                <span className="text-center leading-snug">Tentukan Mentor</span>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            <span className="group/inst inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-white max-w-[170px]">
                              <Landmark className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/inst:scale-110 group-hover/inst:text-[#004F9F]" />
                              <span className="truncate">{m.institusi || "-"}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const status = getPeriodeStatus(m.tanggal_mulai, m.tanggal_selesai);
                              const belumDiatur = !m.tanggal_mulai || !m.tanggal_selesai;
                              return (
                                <div className="group/periode">
                                  <p className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 shadow-sm whitespace-nowrap transition-all duration-200 group-hover/periode:border-slate-300 group-hover/periode:bg-white group-hover/periode:shadow-md group-hover/periode:-translate-y-0.5">
                                    <Calendar className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/periode:scale-110 group-hover/periode:text-[#004F9F]" />
                                    {belumDiatur ? "Periode belum diatur" : `${fmtDate(m.tanggal_mulai)} - ${fmtDate(m.tanggal_selesai)}`}
                                  </p>
                                  <p className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold ${status.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${status.label === "Sedang berjalan" ? "animate-pulse" : ""}`} />
                                    {status.label}
                                  </p>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(m)}
                              className={`group relative inline-flex h-7 w-[78px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                                m.status_akun === "aktif"
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                                  : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                              } hover:shadow-lg active:scale-95`}
                            >
                              <span className={`absolute left-3 text-[9.5px] font-black uppercase tracking-wider text-white transition-all duration-300 ${m.status_akun === "aktif" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`}>Aktif</span>
                              <span className={`absolute right-2.5 text-[9.5px] font-black uppercase tracking-wider text-slate-500 transition-all duration-300 ${m.status_akun !== "aktif" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"}`}>Off</span>
                              <span
                                className="relative inline-flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 ease-out group-active:scale-90"
                                style={{ transform: m.status_akun === "aktif" ? "translateX(54px)" : "translateX(3px)" }}
                              >
                                <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${m.status_akun === "aktif" ? "bg-emerald-500" : "bg-slate-300"}`} />
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <PesertaActionsDropdown
                              onDetail={() => setSelectedDetailId(m.id)}
                              onResetPassword={() => handleResetPassword(m)}
                              onDelete={() => handleDelete(m)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination totalItems={sorted.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
            </div>
             {/* CARD BARU: Peserta yang sudah selesai magang — ambil 1 dari 4 kolom */}
              <div className="lg:col-span-1 relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 flex flex-col lg:sticky lg:top-4">
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 ${
                  pesertaSelesai.length > 0 ? "bg-gradient-to-br from-amber-300 to-orange-400 opacity-20" : "bg-slate-200 opacity-10"
                }`} />

                <div className="relative flex items-center gap-2.5 mb-3">
                  <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-300 ${
                    pesertaSelesai.length > 0
                      ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-300/40"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    {pesertaSelesai.length > 0 && (
                      <>
                        <span className="absolute -inset-1.5 rounded-xl border-2 border-rose-300/40 animate-ping" style={{ animationDuration: "2.5s" }} />
                        <span className="absolute -inset-1 rounded-xl border border-rose-300/50 animate-pulse" />
                      </>
                    )}
                    <AlertTriangle
                      className={`relative w-4.5 h-4.5 transition-transform duration-300 ${pesertaSelesai.length > 0 ? "animate-[wiggle_1.8s_ease-in-out_infinite]" : ""}`}
                      strokeWidth={2.3}
                    />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-[#0B1442]">Sudah Selesai Magang</h3>
                    <p className="text-[10px] text-slate-400">Perlu ditinjau untuk nonaktifkan akun</p>
                  </div>
                  {pesertaSelesai.length > 0 && (
                    <span className="ml-auto flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 px-1.5 text-[10.5px] font-black text-white shadow-sm animate-pulse">
                      {pesertaSelesai.length}
                    </span>
                  )}
                </div>

                {pesertaSelesaiBelumNonaktif.length > 0 && (
                  <button
                    onClick={handleLihatSelesaiBelumNonaktif}
                    className="group relative mb-3 flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2.5 text-[10.5px] font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-white/20 skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative">{pesertaSelesaiBelumNonaktif.length} akun belum dinonaktifkan</span>
                  </button>
                )}

                {pesertaSelesai.length === 0 ? (
                  <div className="relative flex flex-1 flex-col items-center justify-center gap-3 py-10">
                    <span className="relative flex h-13 w-13 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-500 shadow-sm">
                      <span className="absolute inset-0 rounded-3xl border-2 border-emerald-300/40 animate-ping" style={{ animationDuration: "2s" }} />
                      <span className="absolute -inset-2 rounded-3xl border border-emerald-200/60 animate-pulse" />
                      <Check className="relative w-7 h-7 animate-pulse" strokeWidth={2.5} style={{ animationDuration: "2s" }} />
                    </span>
                    <div className="text-center">
                      <p className="text-xs font-black text-emerald-600">Semua Aman!</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mt-1">
                        Tidak ada peserta yang masa magangnya sudah selesai saat ini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                    {pesertaSelesai.map((m, i) => (
                      <div
                        key={m.id}
                        className="group flex items-center gap-2.5 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-2.5 transition-all duration-200 hover:border-amber-200 hover:shadow-sm hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out]"
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[9.5px] font-black shadow-sm transition-transform duration-200 group-hover:scale-110"
                          style={{ background: avatarPalette[m.id % avatarPalette.length] }}
                        >
                          {getInitials(m.nama)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{m.nama}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Selesai {fmtDate(m.tanggal_selesai)}
                          </p>
                        </div>
                        {m.status_akun === "aktif" ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            Belum nonaktif
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showFilterModal && (
        <PesertaFilterModal
          statusList={statusList} toggleStatus={toggleStatus}
          periodeList={periodeList} togglePeriode={togglePeriode} // ⬅
          bidangList={bidangOptions} bidang={bidangFilter} setBidang={setBidangFilter}
          onApply={handleApplyFilters} onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {selectedDetailId && (
        <PesertaDetailModal pesertaId={selectedDetailId} onClose={() => setSelectedDetailId(null)} />
      )}

      {selectedAssignMentor && (
        <AssignMentorModal
          peserta={selectedAssignMentor}
          onClose={() => setSelectedAssignMentor(null)}
          onUpdated={fetchData}
        />
      )}
    </AdminLayout>
  );
};

export default PesertaPage;