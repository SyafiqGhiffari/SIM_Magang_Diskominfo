import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import MentorStats from "../../components/manajemen/admin/mentor/MentorStats";
import MentorSortDropdown from "../../components/manajemen/admin/mentor/MentorSortDropdown";
import MentorFilterModal from "../../components/manajemen/admin/mentor/MentorFilterModal";
import MentorModal from "../../components/manajemen/admin/mentor/MentorModal";
import MentorActionsDropdown from "../../components/manajemen/admin/mentor/MentorActionsDropdown";
import MentorPesertaModal from "../../components/manajemen/admin/mentor/MentorPesertaModal";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getAllAkun, createAkun, updateAkun, updateStatusAkun, assignBidangMentor,
  uploadFotoAkun, cekAkunBisaDihapus, deleteAkun, getAllBidang,
} from "../../services/adminService";
import { confirmDialog, toastSuccess, toastError, blockedActionDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getFileUrl } from "../../utils/fileUrl";
import * as XLSX from "xlsx";
import {
  UserCog, Plus, Users2, Filter as FilterIcon, Search, ChevronUp, ChevronDown,
  Inbox, Mail, Building2, Infinity as InfinityIcon, ChevronRight, Briefcase,
} from "lucide-react";

const columns = [
  { key: "nama", label: "Nama Mentor" },
  { key: "jabatan", label: "Jabatan" },
  { key: "bidang_nama", label: "Bidang" },
  { key: "kapasitas_bimbingan", label: "Bimbingan", sublabel: "(klik untuk detail)" },
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
      <button onClick={handleClick} className={`group flex w-full items-center justify-between gap-3 font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${isActive ? "text-[#0B1442]" : "text-slate-400 hover:text-slate-600"}`}>
        <span className="flex flex-col items-start">
          <span className="text-[10.5px]">{column.label}</span>
          {column.sublabel && <span className="text-[8.5px] font-semibold normal-case tracking-normal text-slate-400 -mt-0.5">{column.sublabel}</span>}
        </span>
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

const MentorPage = () => {
  const { isDark } = useManajemenTheme();
  const [mentorList, setMentorList] = useState([]);
  const [bidangOptions, setBidangOptions] = useState([]);
  const [selectedPesertaMentor, setSelectedPesertaMentor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [statusList, setStatusList] = useState([]);
  const [bidangFilter, setBidangFilter] = useState("");
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedBidangFilter, setAppliedBidangFilter] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const toggleStatus = (key) => setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));

  const fetchData = async () => {
    try {
      const [uRes, bRes] = await Promise.all([getAllAkun(), getAllBidang().catch(() => null)]);
      const allUsers = uRes.data.data || [];
      setMentorList(allUsers.filter((u) => u.role === "mentor"));
      if (bRes) setBidangOptions(bRes.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data mentor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = () => { setEditData(null); setShowFormModal(true); };
  const handleEdit = (m) => { setEditData(m); setShowFormModal(true); };

  const handleSubmit = async (payload) => {
    try {
      let userId = editData?.id;

      if (editData) {
        await updateAkun(editData.id, {
          nama: payload.nama, email: payload.email, no_hp: payload.no_hp,
          jabatan: payload.jabatan, kapasitas_bimbingan: payload.kapasitas_bimbingan,
        });
        await updateStatusAkun(editData.id, { status_akun: payload.status_akun });
      } else {
        const bidangMatch = bidangOptions.find((b) => b.nama === payload.bidang_nama);
      const res = await createAkun({
        nama: payload.nama, email: payload.email, password: payload.password,
        role: "mentor", no_hp: payload.no_hp, jabatan: payload.jabatan,
        kapasitas_bimbingan: payload.kapasitas_bimbingan,
        bidang_id: bidangMatch?.id || null,
      });
        userId = res.data.data.id;
      }

      // Untuk edit: assign/lepas bidang secara eksplisit lewat endpoint terpisah
      if (editData) {
        const bidangMatch = bidangOptions.find((b) => b.nama === payload.bidang_nama);
        await assignBidangMentor(userId, { bidang_id: bidangMatch?.id || null });
      }

      if (payload.foto_file && userId) {
        const fd = new FormData();
        fd.append("foto_profil", payload.foto_file);
        await uploadFotoAkun(userId, fd);
      }

      toastSuccess(editData ? "Mentor berhasil diperbarui" : "Mentor baru berhasil ditambahkan");
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan data mentor.");
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
        title: "Mentor tidak dapat dihapus",
        text: `Mentor "${m.nama}" ${cekResult.alasan.join(" dan ")}. Lepaskan penugasan terlebih dahulu.`,
      });
      return;
    }

    const result = await confirmDialog({
      title: `Hapus mentor "${m.nama}"?`,
      text: "Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAkun(m.id);
      toastSuccess("Mentor berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus mentor.");
    }
  };

  const handleToggleStatus = async (m) => {
    const newStatus = m.status_akun === "aktif" ? "nonaktif" : "aktif";
    try {
      await updateStatusAkun(m.id, { status_akun: newStatus });
      setMentorList((prev) => prev.map((x) => (x.id === m.id ? { ...x, status_akun: newStatus } : x)));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status.");
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedBidangFilter(bidangFilter);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]); setBidangFilter("");
    setAppliedStatusList([]); setAppliedBidangFilter("");
    setPage(0);
  };

  const filtered = mentorList
    .filter((m) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(m.status_akun)))
    .filter((m) => {
      if (!appliedBidangFilter) return true;
      if (appliedBidangFilter === "__belum__") return !m.bidang_nama;
      return m.bidang_nama === appliedBidangFilter;
    })
    .filter((m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.jabatan || "").toLowerCase().includes(search.toLowerCase())
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

  const totalAktif = mentorList.filter((m) => m.status_akun === "aktif").length;
  const totalNonaktif = mentorList.filter((m) => m.status_akun === "nonaktif").length;
  const bidangTerisi = new Set(mentorList.filter((m) => m.bidang_nama).map((m) => m.bidang_nama)).size;

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    const rows = sorted.map((m) => ({
      Nama: m.nama, Email: m.email, "No. HP": m.no_hp || "-", Jabatan: m.jabatan || "-",
      Bidang: m.bidang_nama || "Belum Ditugaskan",
      "Kapasitas Bimbingan": m.kapasitas_bimbingan > 0 ? m.kapasitas_bimbingan : "Tanpa batas",
      "Peserta Terbimbing": m.jumlah_bimbingan || 0,
      Status: m.status_akun === "aktif" ? "Aktif" : "Nonaktif",
    }));
    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mentor");
      XLSX.writeFile(wb, `data-mentor-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else {
      toastError("Format ekspor ini belum didukung untuk data mentor.");
    }
  };

  const activeFilterCount = (appliedStatusList.length > 0 ? 1 : 0) + (appliedBidangFilter ? 1 : 0);

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Mentor</h2>
          <p className={`mt-1.5 text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Kelola akun mentor beserta penugasan bidang dan status aktivasinya.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data mentor...
          </div>
        ) : (
          <>
            <MentorStats total={mentorList.length} aktif={totalAktif} nonaktif={totalNonaktif} bidangTerisi={bidangTerisi} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
              <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <UserCog className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-[#0B1442]">Daftar Mentor</h3>
                      <p className="mt-0.5 text-xs text-slate-400 max-w-md leading-relaxed">
                        Gunakan tombol filter untuk menyaring mentor berdasarkan status dan bidang.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 sm:self-start">
                    <ExportDropdown onExport={handleExport} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <MentorSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
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
                      placeholder="Cari nama, email, jabatan..."
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
                        <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr className="animate-[fadeslide_0.3s_ease-out]">
                          <td colSpan={6} className="px-6 py-16">
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                <Inbox className="w-6 h-6" />
                                <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                              </span>
                              <p className="text-sm font-bold text-slate-500">Belum ada mentor yang sesuai</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((m, i) => {
                          const fotoUrl = getFileUrl(m.foto_profil);
                          return (
                            <tr key={m.id} className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="relative shrink-0">
                                    {fotoUrl ? (
                                      <img src={fotoUrl} alt={m.nama} className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110 group-hover:ring-[#00A5EC]/40" />
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
                                  <div className="min-w-0 max-w-[220px]">
                                    <p className="font-bold text-[#0B1442] truncate transition-colors duration-200 group-hover:text-[#004F9F]" title={m.nama}>{m.nama}</p>
                                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 max-w-[100px]" title={m.email}>
                                      <Mail className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">{m.email}</span>
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {m.jabatan ? (
                                  <span className="group/jbt inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30 max-w-[140px]">
                                    <Briefcase className="w-3 h-3 shrink-0 self-center transition-transform duration-300 group-hover/jbt:scale-110" />
                                    <span className="text-center leading-snug">{m.jabatan}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-300 italic">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {m.bidang_nama ? (
                                  <span className="group/badge inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30 max-w-[140px]">
                                    <Building2 className="w-3 h-3 shrink-0 self-center transition-transform duration-300 group-hover/badge:rotate-12 group-hover/badge:scale-110" />
                                    <span className="text-center leading-snug">{m.bidang_nama}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[10.5px] font-semibold text-amber-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Belum ditugaskan
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {(() => {
                                  const terisi = m.jumlah_bimbingan || 0;
                                  if (!m.bidang_nama) return <span className="text-[11px] text-slate-300">-</span>;
                                  if (!m.kapasitas_bimbingan || m.kapasitas_bimbingan === 0) {
                                    return (
                                      <div className="w-32">
                                        <button
                                          onClick={() => setSelectedPesertaMentor(m)}
                                          className="group/inf inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 border border-[#004F9F]/15 px-2.5 py-1 text-[10px] font-bold text-[#004F9F] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#004F9F]/30 cursor-pointer"
                                          title="Klik untuk lihat daftar peserta bimbingan"
                                        >
                                          <InfinityIcon className="w-3 h-3 shrink-0 text-[#0B1442] transition-transform duration-500 group-hover/inf:rotate-180 group-hover/inf:text-[#00A5EC]" />
                                          <span>Tanpa batas</span>
                                          <span className="text-[#0B1442]/40">·</span>
                                          <span className="font-black transition-transform duration-300 group-hover/inf:scale-110">{terisi}</span>
                                          <ChevronRight className="w-3 h-3 shrink-0 text-[#004F9F]/50 transition-transform duration-200 group-hover/inf:translate-x-0.5" />
                                        </button>
                                      </div>
                                    );
                                  }

                                  const pct = Math.min(100, Math.round((terisi / m.kapasitas_bimbingan) * 100));
                                  return (
                                    <button
                                      onClick={() => setSelectedPesertaMentor(m)}
                                      className="group/prog w-32.5 text-left cursor-pointer"
                                      title="Klik untuk lihat daftar peserta bimbingan"
                                    >
                                      <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500 mb-1">
                                        <span className="inline-flex items-center gap-1 transition-colors duration-200 group-hover/prog:text-[#0B1442]">
                                          {terisi}/{m.kapasitas_bimbingan}
                                          <ChevronRight className="w-3 h-3 shrink-0 text-slate-300 transition-all duration-200 group-hover/prog:translate-x-0.5 group-hover/prog:text-[#004F9F]" />
                                        </span>
                                        <span className={`inline-flex items-center gap-1 transition-all duration-200 ${pct >= 100 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>
                                          {pct >= 100 && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                          {pct}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-700 ease-out group-hover/prog:brightness-110 ${
                                            pct >= 100 ? "bg-gradient-to-r from-red-600 to-red-400" : pct >= 70 ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                          }`}
                                          style={{ width: `${pct}%`, transitionDelay: "100ms" }}
                                        />
                                      </div>
                                    </button>
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
                                <MentorActionsDropdown onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination totalItems={sorted.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-5 h-full">
                <button
                  onClick={handleAdd}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] shadow-sm p-4 flex items-center gap-3.5 text-left w-full transition-all duration-300 hover:shadow-xl hover:shadow-[#0B1442]/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/15">
                    <UserCog className="w-5 h-5 text-white" />
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <h3 className="text-xs font-black text-white">Mentor Baru?</h3>
                    <p className="text-[10.5px] text-white/60 leading-snug mt-0.5">Tambahkan akun mentor baru</p>
                  </div>
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A5EC] text-[#0B1442] shadow-md shadow-[#00A5EC]/30 transition-all duration-300 group-hover:bg-[#33bdf5] group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#00A5EC]/40">
                    <Plus className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-90" />
                  </span>
                </button>

                <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-black text-[#0B1442]">Ringkasan Bidang</h3>
                      <p className="text-[10px] text-slate-400">Kebutuhan mentor per bidang</p>
                    </div>
                  </div>
                  {bidangOptions.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Belum ada bidang terdaftar.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {bidangOptions.slice(0, 5).map((b) => {
                        const jumlahMentor = mentorList.filter((m) => m.bidang_nama === b.nama).length;
                        return (
                          <div key={b.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2.5">
                            <p className="text-xs font-bold text-slate-700 truncate">{b.nama}</p>
                            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-black ${jumlahMentor > 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                              {jumlahMentor > 0 ? (
                                <>
                                  <Users2 className="w-2.5 h-2.5" />
                                  {jumlahMentor} Mentor
                                </>
                              ) : (
                                "Kosong"
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showFormModal && (
        <MentorModal initialData={editData} bidangOptions={bidangOptions} onClose={() => setShowFormModal(false)} onSubmit={handleSubmit} />
      )}

      {showFilterModal && (
        <MentorFilterModal
          statusList={statusList} toggleStatus={toggleStatus}
          bidangList={bidangOptions} bidang={bidangFilter} setBidang={setBidangFilter}
          onApply={handleApplyFilters} onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {selectedPesertaMentor && (
        <MentorPesertaModal mentor={selectedPesertaMentor} onClose={() => setSelectedPesertaMentor(null)} />
      )}
    </AdminLayout>
  );
};

export default MentorPage;