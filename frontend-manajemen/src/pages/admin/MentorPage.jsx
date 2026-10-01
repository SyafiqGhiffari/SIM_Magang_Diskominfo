import { useEffect, useState, Fragment } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import MentorStats from "../../components/manajemen/admin/mentor/MentorStats";
import MentorSortDropdown from "../../components/manajemen/admin/mentor/MentorSortDropdown";
import MentorFilterModal from "../../components/manajemen/admin/mentor/MentorFilterModal";
import MentorActionsDropdown from "../../components/manajemen/admin/mentor/MentorActionsDropdown";
import MentorModal from "../../components/manajemen/admin/mentor/MentorModal";
import MentorPesertaModal from "../../components/manajemen/admin/mentor/MentorPesertaModal";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getAllAkun,
  createAkun,
  updateAkun,
  uploadFotoAkun,
  deleteAkun,
  updateStatusAkun,
  cekAkunBisaDihapus,
  getAllBidang,
} from "../../services/adminService";
import { getFileUrl } from "../../utils/fileUrl";
import { getBidangColor } from "../../utils/bidangColor";
import { confirmDialog, toastSuccess, toastError, blockedActionDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  UserCog,
  Search,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Users2,
  Building2,
  Briefcase,
  ChevronRight,
  Infinity as InfinityIcon,
  Inbox,
  Phone,
  Fingerprint,
} from "lucide-react";

const getInitials = (nama) =>
  (nama || "?")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const avatarPalette = [
  "linear-gradient(135deg, #0B1442, #00A5EC)",
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
  "linear-gradient(135deg, #dc2626, #ef4444)",
];

const Avatar = ({ m }) => {
  const fotoUrl = getFileUrl(m.foto_profil);
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={m.nama}
        className="h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 rounded-full object-cover border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
      />
    );
  }
  return (
    <span
      style={{ background: avatarPalette[m.id % avatarPalette.length] }}
      className="flex h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full text-white text-[10px] sm:text-sm font-black border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
    >
      {getInitials(m.nama)}
    </span>
  );
};

const columns = [
  { key: "nama", label: "Nama Mentor" },
  { key: "jabatan", label: "Jabatan" },
  { key: "bidang_nama", label: "Bidang" },
  { key: "kapasitas_bimbingan", label: "Bimbingan" },
  { key: "status_akun", label: "Status" },
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
    <th className={`px-4 sm:px-6 py-3.5 ${className}`}>
      <button
        onClick={handleClick}
        className={`group flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark ? "text-slate-100" : "text-[#0B1442]"
            : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span>{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp
            className={`w-3 h-3 transition-all duration-200 ${
              isActive && direction === "asc"
                ? "text-[#00A5EC]"
                : isDark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1.5 transition-all duration-200 ${
              isActive && direction === "desc"
                ? "text-[#00A5EC]"
                : isDark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
        </span>
      </button>
    </th>
  );
};

const MentorPage = () => {
  const { isDark } = useManajemenTheme();

  const [mentorList, setMentorList] = useState([]);
  const [bidangOptions, setBidangOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [statusList, setStatusList] = useState([]);
  const [bidangFilter, setBidangFilter] = useState("");
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedBidangFilter, setAppliedBidangFilter] = useState("");

  // Pagination & Mobile Expand
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});

  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedPesertaMentor, setSelectedPesertaMentor] = useState(null);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatus = (st) => {
    setStatusList((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };

  const activeFilterCount =
    appliedStatusList.length + (appliedBidangFilter ? 1 : 0);
  const mobileActiveFilterCount = activeFilterCount + (sortBy ? 1 : 0);

  const fetchData = async () => {
    try {
      const [resA, resB] = await Promise.all([getAllAkun(), getAllBidang()]);
      const mentorsOnly = (resA.data.data || []).filter((a) => a.role === "mentor");
      setMentorList(mentorsOnly);
      setBidangOptions(resB.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data mentor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setShowFormModal(true);
  };

  const handleEdit = (m) => {
    setEditData(m);
    setShowFormModal(true);
  };

  const handleSubmit = async (formData) => {
    const { foto_file, ...payload } = formData;
    try {
      let resolvedBidangId = payload.bidang_id || null;
      if (!resolvedBidangId && payload.bidang_nama) {
        const found = bidangOptions.find((b) => b.nama === payload.bidang_nama);
        if (found) resolvedBidangId = found.id;
      }

      const submitPayload = {
        ...payload,
        bidang_id: resolvedBidangId,
        role: "mentor",
      };

      if (editData) {
        await updateAkun(editData.id, submitPayload);
        if (foto_file) {
          const fd = new FormData();
          fd.append("foto_profil", foto_file);
          fd.append("foto", foto_file);
          await uploadFotoAkun(editData.id, fd);
        }
        toastSuccess("Data mentor berhasil diperbarui");
      } else {
        const res = await createAkun(submitPayload);
        const newId = res.data.data?.id;
        if (foto_file && newId) {
          const fd = new FormData();
          fd.append("foto_profil", foto_file);
          fd.append("foto", foto_file);
          await uploadFotoAkun(newId, fd);
        }
        toastSuccess("Mentor baru berhasil ditambahkan");
      }
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
      setMentorList((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, status_akun: newStatus } : x))
      );
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
    setStatusList([]);
    setBidangFilter("");
    setAppliedStatusList([]);
    setAppliedBidangFilter("");
    setSortBy("nama_az");
    setPage(0);
  };

  const filtered = mentorList
    .filter((m) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(m.status_akun)))
    .filter((m) => {
      if (!appliedBidangFilter) return true;
      if (appliedBidangFilter === "__belum__") return !m.bidang_nama;
      return m.bidang_nama === appliedBidangFilter;
    })
    .filter((m) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return (
          m.nama.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          (m.nip || "").toLowerCase().includes(s) ||
          (m.jabatan || "").toLowerCase().includes(s)
        );
      };
      return match(search) && match(tableSearch);
    });

  const getBimbinganCount = (m) => m.jumlah_bimbingan ?? m.jumlah_bimbingan_aktif ?? 0;

  const sorted = [...filtered].sort((a, b) => {
    if (columnSort.key) {
      const valA = (a[columnSort.key] || "").toString().toLowerCase();
      const valB = (b[columnSort.key] || "").toString().toLowerCase();
      const result = valA.localeCompare(valB);
      return columnSort.direction === "asc" ? result : -result;
    }
    if (sortBy === "nama_az") return a.nama.localeCompare(b.nama);
    if (sortBy === "nama_za") return b.nama.localeCompare(a.nama);
    if (sortBy === "bimbingan_terbanyak" || sortBy === "bimbingan_banyak")
      return getBimbinganCount(b) - getBimbinganCount(a);
    if (sortBy === "bimbingan_tersedikit" || sortBy === "bimbingan_sedikit")
      return getBimbinganCount(a) - getBimbinganCount(b);
    if (sortBy === "kapasitas_terbanyak" || sortBy === "kapasitas_banyak")
      return (b.kapasitas_bimbingan || 0) - (a.kapasitas_bimbingan || 0);
    return b.id - a.id;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalAktif = mentorList.filter((m) => m.status_akun === "aktif").length;
  const totalNonaktif = mentorList.filter((m) => m.status_akun === "nonaktif").length;
  const bidangTerisi = new Set(
    mentorList.filter((m) => m.bidang_nama).map((m) => m.bidang_nama)
  ).size;

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    const rows = sorted.map((m) => ({
      "Nama Mentor": m.nama,
      NIP: m.nip || "-",
      Email: m.email,
      "No. HP": m.no_hp || "-",
      Jabatan: m.jabatan || "-",
      Bidang: m.bidang_nama || "-",
      "Kapasitas Bimbingan": m.kapasitas_bimbingan === 0 ? "Tanpa Batas" : m.kapasitas_bimbingan,
      "Bimbingan Aktif": getBimbinganCount(m),
      "Status Akun": m.status_akun === "aktif" ? "Aktif" : "Nonaktif",
    }));

    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mentor");
      XLSX.writeFile(wb, `daftar-mentor-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toastSuccess("Data mentor berhasil diekspor ke Excel");
    } else if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `daftar-mentor-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      toastSuccess("Data mentor berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      const doc = new jsPDF("landscape");
      doc.setFontSize(14);
      doc.text("Daftar Mentor - SIM Magang Diskominfo", 14, 15);
      doc.setFontSize(9);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 21);

      const tableColumn = ["Nama", "NIP", "Email", "No. HP", "Jabatan", "Bidang", "Bimbingan", "Status"];
      const tableRows = rows.map((r) => [
        r["Nama Mentor"],
        r["NIP"],
        r["Email"],
        r["No. HP"],
        r["Jabatan"],
        r["Bidang"],
        `${r["Bimbingan Aktif"]} / ${r["Kapasitas Bimbingan"]}`,
        r["Status Akun"],
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 26,
        theme: "striped",
        headStyles: { fillColor: [11, 20, 66] },
        styles: { fontSize: 8 },
      });
      doc.save(`daftar-mentor-${new Date().toISOString().slice(0, 10)}.pdf`);
      toastSuccess("Data mentor berhasil diekspor ke PDF");
    }
  };

  const renderAddMentorCard = () => (
    <button
      onClick={handleAdd}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] shadow-sm p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5 text-left w-full transition-all duration-300 hover:shadow-xl hover:shadow-[#0B1442]/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
      <span className="relative flex h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/15">
        <UserCog className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
      </span>
      <div className="relative flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-black text-white">Mentor Baru?</h3>
        <p className="text-[10px] sm:text-[10.5px] text-white/60 leading-snug mt-0.5">Tambahkan akun mentor baru</p>
      </div>
      <span className="relative flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#00A5EC] text-[#0B1442] shadow-md shadow-[#00A5EC]/30 transition-all duration-300 group-hover:bg-[#33bdf5] group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#00A5EC]/40">
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-90" />
      </span>
    </button>
  );

  const renderRingkasanBidangCard = () => (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden p-4 sm:p-5 transition-all duration-300 ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
          <Users2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </span>
        <div>
          <h3 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Ringkasan Bidang
          </h3>
          <p className="text-[10px] sm:text-[10.5px] text-slate-400">Kebutuhan mentor per bidang</p>
        </div>
      </div>

      {bidangOptions.length === 0 ? (
        <p className="text-[11px] text-slate-400">Belum ada bidang terdaftar.</p>
      ) : (
        <div className="space-y-2">
          {bidangOptions.map((b) => {
            const jumlahMentor = mentorList.filter((m) => m.bidang_nama === b.nama).length;
            return (
              <div
                key={b.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors ${
                  isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-white"
                }`}
              >
                <p className={`text-xs font-bold break-words whitespace-normal leading-tight text-left flex-1 min-w-0 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  {b.nama}
                </p>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-black ${
                    jumlahMentor > 0
                      ? isDark
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-emerald-50 text-emerald-600"
                      : isDark
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
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
  );

  return (
    <AdminLayout
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(0);
      }}
      searchPlaceholder="Cari mentor berdasarkan nama, email, jabatan..."
    >
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala Halaman: Judul & Subjudul */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Kelola Mentor
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Kelola akun mentor &amp; penugasan bidang.</span>
            <span className="hidden sm:inline">Kelola akun mentor beserta penugasan bidang dan status aktivasinya.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="h-8 w-8 rounded-full border-2 border-[#00A5EC] border-t-transparent animate-spin" />
            <p className="text-xs font-bold">Memuat data mentor...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <MentorStats
              total={mentorList.length}
              aktif={totalAktif}
              nonaktif={totalNonaktif}
              bidangTerisi={bidangTerisi}
              isDark={isDark}
            />

            {/* Mobile: Tambah Mentor Baru Card placed ABOVE the table card */}
            <div className="block lg:hidden">
              {renderAddMentorCard()}
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
              {/* Table Column (3 cols on desktop) */}
              <div
                className={`lg:col-span-3 rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}
              >
                {/* Card Header & Toolbar */}
                <div className={`p-4 sm:p-6 border-b ${isDark ? "border-white/5 bg-[#1f242c]" : "border-slate-100 bg-white"}`}>
                  {/* Row 1: Judul Card (kiri) & Tombol Ekspor (kanan) */}
                  <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
                    <div className="flex min-w-0 items-start gap-2.5 sm:gap-3 flex-1">
                      <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                        <UserCog className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm sm:text-base font-black text-left ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                          <span className="inline sm:hidden">Daftar Mentor</span>
                          <span className="hidden sm:inline">Daftar Mentor</span>
                        </h3>
                        <p className="mt-0.5 text-[10.5px] sm:text-xs text-slate-400 max-w-xl leading-relaxed text-left">
                          <span className="inline sm:hidden">Filter status &amp; bidang</span>
                          <span className="hidden sm:inline">Kelola akun dan penugasan mentor</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <ExportDropdown onExport={handleExport} isDark={isDark} />
                    </div>
                  </div>

                  {/* Row 2: Toolbar: Urutkan & Filter di kiri, Search di kanan (Desktop) / Filter & Search sejajar (Mobile) */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Desktop Only: SortDropdown + Filter button */}
                    <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
                      <MentorSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />

                      {/* Tombol Filter */}
                      <button
                        onClick={() => setShowFilterModal(true)}
                        className={`group inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                          activeFilterCount > 0
                            ? isDark
                              ? "border-[#00A5EC]/50 bg-[#00A5EC]/15 text-sky-300"
                              : "border-[#004F9F]/50 bg-blue-50 text-[#004F9F]"
                            : isDark
                              ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] dark:bg-[#00A5EC] text-white px-1 text-[8px] sm:text-[9.5px] font-black shadow-xs">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Mobile & Desktop Search Container */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Mobile Only: Filter Button next to search */}
                      <div className="block sm:hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowFilterModal(true)}
                          className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                            mobileActiveFilterCount > 0
                              ? isDark
                                ? "border-[#00A5EC]/50 bg-[#00A5EC]/15 text-sky-300"
                                : "border-[#004F9F]/50 bg-blue-50 text-[#004F9F]"
                              : isDark
                                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                          <span>Filter</span>
                          {mobileActiveFilterCount > 0 && (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] dark:bg-[#00A5EC] text-white px-1 text-[8.5px] font-black shadow-xs">
                              {mobileActiveFilterCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Desktop Search Input */}
                      <div className="hidden sm:block group relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setPage(0);
                          }}
                          placeholder="Cari nama, email, jabatan..."
                          className={`w-full rounded-xl border pl-8.5 pr-3 py-2 sm:py-2.5 text-xs font-semibold outline-none transition-all duration-200 ${
                            isDark
                              ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-2 focus:ring-[#00A5EC]/20"
                              : "border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20"
                          }`}
                        />
                      </div>

                      {/* Mobile Search Input */}
                      <div className="block sm:hidden group relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setPage(0);
                          }}
                          placeholder="Cari mentor..."
                          className={`w-full rounded-xl border pl-8.5 pr-3 py-2 text-xs font-semibold outline-none transition-all duration-200 ${
                            isDark
                              ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC]"
                              : "border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:border-[#004F9F]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-[13px]">
                    <thead>
                      <tr className={`border-b ${isDark ? "border-white/5 bg-[#1f242c]" : "border-slate-100 bg-slate-50/60"}`}>
                        <SortableHeader
                          column={columns[0]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                        />
                        <SortableHeader
                          column={columns[1]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="hidden sm:table-cell"
                        />
                        <SortableHeader
                          column={columns[2]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="hidden sm:table-cell"
                        />
                        <SortableHeader
                          column={columns[3]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                          className="hidden sm:table-cell"
                        />
                        <SortableHeader
                          column={columns[4]}
                          columnSort={columnSort}
                          setColumnSort={setColumnSort}
                          isDark={isDark}
                        />
                        <th className="px-4 sm:px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
                              <span
                                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
                                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                                }`}
                              >
                                <Inbox className="w-6 h-6" />
                              </span>
                              <div>
                                <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                                  Belum ada mentor yang sesuai
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                                  Coba ubah kata kunci pencarian atau reset filter.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((m) => {
                          const terisi = getBimbinganCount(m);
                          const bidangColor = getBidangColor(m.bidang_nama);
                          const isExpanded = Boolean(expandedRows[m.id]);

                          return (
                            <Fragment key={m.id}>
                              <tr
                                className={`group border-b transition-colors duration-150 ${
                                  isDark
                                    ? "border-white/5 hover:bg-white/[0.02]"
                                    : "border-slate-50 hover:bg-blue-50/30"
                                }`}
                              >
                                {/* 1. Nama Mentor */}
                                <td
                                  className="px-3 sm:px-6 py-3.5 cursor-pointer sm:cursor-default"
                                  onClick={() => toggleRow(m.id)}
                                >
                                  <div className="flex items-center gap-2.5 sm:gap-3">
                                    <Avatar m={m} />
                                    <div className="min-w-0 text-left flex-1">
                                      <div className="flex items-center gap-1">
                                        <p
                                          className={`font-bold text-[11px] sm:text-[13px] leading-tight break-words line-clamp-2 sm:line-clamp-none transition-colors duration-200 ${
                                            isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                          }`}
                                        >
                                          {m.nama}
                                        </p>
                                        <ChevronDown
                                          className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${
                                            isExpanded ? "rotate-180 text-[#00A5EC]" : ""
                                          }`}
                                        />
                                      </div>
                                      <p className="text-[9.5px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                                        {m.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Jabatan (Desktop Only) */}
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-3.5">
                                  <div className="flex flex-col gap-1 text-left items-start">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${
                                      isDark
                                        ? "bg-slate-800/80 border border-slate-700/60 text-slate-200"
                                        : "bg-blue-50/80 border border-blue-100 text-[#0B1442]"
                                    }`}>
                                      <Briefcase className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                      <span className="truncate max-w-[200px]">{m.jabatan || "-"}</span>
                                    </span>
                                    {m.nip && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] font-mono font-medium ${
                                        isDark
                                          ? "bg-white/5 text-sky-300 border border-white/5"
                                          : "bg-slate-100 text-slate-600 border border-slate-200/60"
                                      }`}>
                                        <Fingerprint className="w-2.5 h-2.5 text-[#00A5EC] shrink-0" />
                                        NIP: {m.nip}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 3. Bidang (Desktop Only) */}
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-3.5">
                                  {m.bidang_nama ? (
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black whitespace-nowrap ${bidangColor.bg} ${bidangColor.text}`}
                                      style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                    >
                                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>{m.bidang_nama}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Belum ditentukan</span>
                                  )}
                                </td>

                                {/* 4. Bimbingan (Desktop Only) */}
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-3.5">
                                  {(() => {
                                    if (m.kapasitas_bimbingan === 0) {
                                      return (
                                        <button
                                          onClick={() => setSelectedPesertaMentor(m)}
                                          className={`group/inf inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 cursor-pointer hover:scale-105 ${
                                            isDark
                                              ? "border-[#00A5EC]/30 bg-[#00A5EC]/10 text-sky-300"
                                              : "border-[#004F9F]/20 bg-blue-50 text-[#004F9F]"
                                          }`}
                                          title="Klik untuk lihat daftar peserta bimbingan"
                                        >
                                          <InfinityIcon className="w-3 h-3 shrink-0 text-[#00A5EC]" />
                                          <span>Tanpa batas</span>
                                          <span className="opacity-40">·</span>
                                          <span className="font-black">{terisi}</span>
                                          <ChevronRight className="w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 group-hover/inf:translate-x-0.5" />
                                        </button>
                                      );
                                    }

                                    const pct = Math.min(100, Math.round((terisi / m.kapasitas_bimbingan) * 100));
                                    return (
                                      <button
                                        onClick={() => setSelectedPesertaMentor(m)}
                                        className="group/prog w-28 sm:w-32 text-left cursor-pointer"
                                        title="Klik untuk lihat daftar peserta bimbingan"
                                      >
                                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-400 mb-1">
                                          <span className={`inline-flex items-center gap-1 transition-colors ${
                                            isDark ? "group-hover/prog:text-slate-200" : "group-hover/prog:text-[#0B1442]"
                                          }`}>
                                            {terisi}/{m.kapasitas_bimbingan}
                                            <ChevronRight className="w-3 h-3 shrink-0 text-slate-400 transition-transform group-hover/prog:translate-x-0.5" />
                                          </span>
                                          <span className={`font-bold ${pct >= 100 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>
                                            {pct}%
                                          </span>
                                        </div>
                                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              pct >= 100
                                                ? "bg-red-500"
                                                : pct >= 70
                                                  ? "bg-amber-500"
                                                  : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </button>
                                    );
                                  })()}
                                </td>

                                {/* 5. Status Akun */}
                                <td className="px-3 sm:px-6 py-3.5">
                                  <button
                                    onClick={() => handleToggleStatus(m)}
                                    className={`group relative inline-flex h-[24px] w-[56px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                                      m.status_akun === "aktif"
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                                        : isDark ? "bg-slate-700" : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                                    } hover:shadow-md active:scale-95`}
                                  >
                                    <span
                                      className={`absolute left-1.5 text-[8.5px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
                                        m.status_akun === "aktif" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                      }`}
                                    >
                                      Aktif
                                    </span>
                                    <span
                                      className={`absolute right-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 transition-all duration-300 ${
                                        m.status_akun !== "aktif" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
                                      }`}
                                    >
                                      Off
                                    </span>
                                    <span
                                      className="relative inline-flex h-4.5 w-4.5 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out group-active:scale-90"
                                      style={{
                                        transform: m.status_akun === "aktif" ? "translateX(35px)" : "translateX(3px)",
                                      }}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                                          m.status_akun === "aktif" ? "bg-emerald-500" : "bg-slate-300"
                                        }`}
                                      />
                                    </span>
                                  </button>
                                </td>

                                {/* 6. Aksi */}
                                <td className="px-3 sm:px-6 py-3.5 text-right">
                                  <MentorActionsDropdown
                                    onEdit={() => handleEdit(m)}
                                    onDelete={() => handleDelete(m)}
                                    isDark={isDark}
                                  />
                                </td>
                              </tr>

                              {/* Mobile Accordion Details Row */}
                              <tr className="table-row sm:hidden">
                                <td colSpan={6} className="p-0">
                                  <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      isExpanded
                                        ? "max-h-[300px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.01]"
                                        : "max-h-0 opacity-0 p-0 border-none"
                                    }`}
                                  >
                                    <div className="space-y-2 text-left">
                                      {/* Jabatan */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                          Jabatan
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                                          isDark
                                            ? "bg-slate-800/80 border border-slate-700/60 text-slate-200"
                                            : "bg-blue-50/80 border border-blue-100 text-[#0B1442]"
                                        }`}>
                                          <Briefcase className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                          {m.jabatan || "-"}
                                        </span>
                                      </div>

                                      {/* NIP */}
                                      {m.nip && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            NIP
                                          </span>
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                            isDark
                                              ? "bg-white/5 text-sky-300 border border-white/5"
                                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                                          }`}>
                                            <Fingerprint className="w-2.5 h-2.5 text-[#00A5EC] shrink-0" />
                                            {m.nip}
                                          </span>
                                        </div>
                                      )}



                                      {/* Bimbingan */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                          Bimbingan
                                        </span>
                                        <button
                                          onClick={() => setSelectedPesertaMentor(m)}
                                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-transform active:scale-95 cursor-pointer ${
                                            isDark
                                              ? "border-[#00A5EC]/30 bg-[#00A5EC]/10 text-sky-300"
                                              : "border-[#004F9F]/20 bg-blue-50 text-[#004F9F]"
                                          }`}
                                        >
                                          {m.kapasitas_bimbingan === 0 ? (
                                            <>
                                              <InfinityIcon className="w-2.5 h-2.5" />
                                              <span>{terisi} peserta (Tanpa batas)</span>
                                            </>
                                          ) : (
                                            <span>
                                              {terisi}/{m.kapasitas_bimbingan} peserta ({Math.min(100, Math.round((terisi / m.kapasitas_bimbingan) * 100))}%)
                                            </span>
                                          )}
                                          <ChevronRight className="w-3 h-3 opacity-60" />
                                        </button>
                                      </div>

                                      {/* Bidang */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                          Bidang
                                        </span>
                                        {m.bidang_nama ? (
                                          <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm ${bidangColor.bg} ${bidangColor.text}`}
                                            style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                          >
                                            <Building2 className="w-2.5 h-2.5" />
                                            {m.bidang_nama}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 italic">Belum ada</span>
                                        )}
                                      </div>

                                      {/* No HP */}
                                      {m.no_hp && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            No. HP
                                          </span>
                                          <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold ${
                                            isDark ? "text-slate-300" : "text-slate-600"
                                          }`}>
                                            <Phone className="w-3 h-3 text-slate-400" />
                                            {m.no_hp}
                                          </span>
                                        </div>
                                      )}
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
                  totalItems={sorted.length}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  setPerPage={setPerPage}
                  isDark={isDark}
                />
              </div>

              {/* Sidebar Column (1 col on desktop) */}
              <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 sm:gap-5 h-full">
                {/* Desktop: Tambah Mentor Baru Card */}
                {renderAddMentorCard()}

                {/* Ringkasan Bidang Card */}
                {renderRingkasanBidangCard()}
              </div>
            </div>

            {/* Mobile: Ringkasan Bidang Card placed BELOW the table card */}
            <div className="block lg:hidden">
              {renderRingkasanBidangCard()}
            </div>
          </>
        )}
      </div>

      {/* Form Modal: Tambah/Edit Mentor */}
      {showFormModal && (
        <MentorModal
          initialData={editData}
          bidangOptions={bidangOptions}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSubmit}
          isDark={isDark}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <MentorFilterModal
          sortBy={sortBy}
          setSortBy={setSortBy}
          statusList={statusList}
          toggleStatus={toggleStatus}
          bidangList={bidangOptions}
          bidang={bidangFilter}
          setBidang={setBidangFilter}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
        />
      )}

      {/* Peserta Modal */}
      {selectedPesertaMentor && (
        <MentorPesertaModal
          mentor={selectedPesertaMentor}
          onClose={() => setSelectedPesertaMentor(null)}
          isDark={isDark}
        />
      )}
    </AdminLayout>
  );
};

export default MentorPage;