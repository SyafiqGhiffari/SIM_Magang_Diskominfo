import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import BidangStats from "../../components/manajemen/admin/bidang/BidangStats";
import BidangSortDropdown from "../../components/manajemen/admin/bidang/BidangSortDropdown";
import BidangFilterModal from "../../components/manajemen/admin/bidang/BidangFilterModal";
import BidangModal from "../../components/manajemen/admin/bidang/BidangModal";
import BidangAlertCard from "../../components/manajemen/admin/bidang/BidangAlertCard";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import { getAllBidang, createBidang, updateBidang, deleteBidang, toggleStatusBidang, getAllPendaftaran, cekBidangBisaDihapus } from "../../services/adminService";
import { exportBidangToExcel } from "../../utils/exportBidangExcel";
import { exportBidangToCsv } from "../../utils/exportBidangCsv";
import { exportBidangToPdf } from "../../utils/exportBidangPdf";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import { confirmDialog, toastSuccess, toastError, blockedActionDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { Compass, Plus, Users2, Filter as FilterIcon, Search, ChevronUp, ChevronDown, Inbox, Infinity as InfinityIcon } from "lucide-react";
import BidangActionsDropdown from "../../components/manajemen/admin/bidang/BidangActionsDropdown";
import BidangDescTooltip from "../../components/manajemen/admin/bidang/BidangDescTooltip";

const columns = [
  { key: "nama", label: "Nama Bidang" },
  { key: "kuota", label: "Kuota Terisi" },
  { key: "is_active", label: "Status" },
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
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-3 text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive ? "text-[#0B1442]" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span>{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp className={`w-3 h-3 transition-all duration-200 ${isActive && direction === "asc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
          <ChevronDown className={`w-3 h-3 -mt-1.5 transition-all duration-200 ${isActive && direction === "desc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
        </span>
      </button>
    </th>
  );
};

const BidangPage = () => {
  const { isDark } = useManajemenTheme();
  const [bidangList, setBidangList] = useState([]);
  const [occupancy, setOccupancy] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [statusList, setStatusList] = useState([]);
  const [kuotaList, setKuotaList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedKuotaList, setAppliedKuotaList] = useState([]);

  const toggleStatus = (key) => {
    setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };
  const toggleKuota = (key) => {
    setKuotaList((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      const [bRes, pRes] = await Promise.all([getAllBidang(), getAllPendaftaran().catch(() => null)]);
      setBidangList(bRes.data.data || []);

      if (pRes) {
        const counts = {};
        (pRes.data.data || [])
          .filter((p) => p.status_pendaftaran === "diterima")
          .forEach((p) => { counts[p.posisi_bidang] = (counts[p.posisi_bidang] || 0) + 1; });
        setOccupancy(counts);
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data bidang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleAdd = () => { setEditData(null); setShowFormModal(true); };
  const handleEdit = (b) => { setEditData(b); setShowFormModal(true); };

  const handleSubmit = async (payload) => {
    try {
      if (editData) {
        await updateBidang(editData.id, payload);
        toastSuccess("Bidang berhasil diperbarui");
      } else {
        await createBidang(payload);
        toastSuccess("Bidang baru berhasil ditambahkan");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan bidang.");
    }
  };

  const handleDelete = async (b) => {
    // Cek dulu apakah bidang ini boleh dihapus, sebelum menampilkan dialog konfirmasi.
    let cekResult;
    try {
      const res = await cekBidangBisaDihapus(b.id);
      cekResult = res.data.data;
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memeriksa status bidang.");
      return;
    }

    if (!cekResult.bisa_dihapus) {
      const alasan = [];
      if (cekResult.jumlah_peserta > 0) {
        alasan.push(`${cekResult.jumlah_peserta} peserta yang sudah diterima`);
      }
      if (cekResult.ada_mentor) {
        const daftarMentor = (cekResult.nama_mentor || []).join(", ");
        alasan.push(`${cekResult.jumlah_mentor} mentor yang masih ditugaskan (${daftarMentor})`);
      }

      await blockedActionDialog({
        title: "Bidang tidak dapat dihapus",
        text: `Bidang "${b.nama}" masih memiliki ${alasan.join(" dan ")}. Nonaktifkan bidang ini melalui toggle status jika tidak ingin menerima pendaftar baru, atau pindahkan mentor tersebut terlebih dahulu melalui menu Edit Mentor.`,
      });
      return;
    }

    const result = await confirmDialog({
      title: `Hapus bidang "${b.nama}"?`,
      text: "Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteBidang(b.id);
      toastSuccess("Bidang berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus bidang.");
    }
  };

  const handleToggle = async (b) => {
    try {
      await toggleStatusBidang(b.id);
      setBidangList((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status bidang.");
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedKuotaList(kuotaList);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]);
    setKuotaList([]);
    setAppliedStatusList([]);
    setAppliedKuotaList([]);
    setPage(0);
  };

  const filtered = bidangList
  .filter((b) => {
    if (appliedStatusList.length === 0) return true;
    return appliedStatusList.includes(b.is_active ? "aktif" : "nonaktif");
  })
  .filter((b) => {
    if (appliedKuotaList.length === 0) return true;
    const terisi = occupancy[b.nama] || 0;
    return appliedKuotaList.some((k) => {
      if (k === "tanpa_batas") return b.kuota === 0;
      if (k === "penuh") return b.kuota > 0 && terisi >= b.kuota;
      if (k === "tersedia") return b.kuota > 0 && terisi < b.kuota;
      return false;
    });
  })
  .filter((b) => b.nama.toLowerCase().includes(search.toLowerCase()) || (b.deskripsi || "").toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (columnSort.key) {
      let valA, valB;
      if (columnSort.key === "kuota") { valA = occupancy[a.nama] || 0; valB = occupancy[b.nama] || 0; }
      else if (columnSort.key === "is_active") { valA = a.is_active ? 1 : 0; valB = b.is_active ? 1 : 0; }
      else { valA = a.nama.toLowerCase(); valB = b.nama.toLowerCase(); }
      const result = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
      return columnSort.direction === "asc" ? result : -result;
    }
    if (sortBy === "nama_az") return a.nama.localeCompare(b.nama);
    if (sortBy === "nama_za") return b.nama.localeCompare(a.nama);
    if (sortBy === "kuota_tinggi") return b.kuota - a.kuota;
    if (sortBy === "kuota_rendah") return a.kuota - b.kuota;
    if (sortBy === "terbaru") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalAktif = bidangList.filter((b) => b.is_active).length;
  const totalNonaktif = bidangList.filter((b) => !b.is_active).length;
  const totalTerisi = Object.values(occupancy).reduce((sum, n) => sum + n, 0);

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    if (format === "excel") {
      exportBidangToExcel(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else if (format === "csv") {
      exportBidangToCsv(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      exportBidangToPdf(sorted, occupancy);
      toastSuccess("Data berhasil diekspor ke PDF");
    }
  };

  const activeFilterCount = (appliedStatusList.length > 0 ? 1 : 0) + (appliedKuotaList.length > 0 ? 1 : 0);

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Bidang</h2>
          <p className={`mt-1.5 text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Atur daftar bidang penempatan magang beserta kuota dan status ketersediaannya.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data bidang...
          </div>
        ) : (
      <>
        <BidangStats total={bidangList.length} aktif={totalAktif} nonaktif={totalNonaktif} totalTerisi={totalTerisi} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
          <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header card */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                  <Compass className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-[#0B1442]">Daftar Bidang</h3>
                  <p className="mt-0.5 text-xs text-slate-400 max-w-md leading-relaxed">
                    Gunakan tombol filter untuk menyaring bidang berdasarkan status.
                  </p>
                </div>
              </div>
              <div className="shrink-0 sm:self-start">
                <ExportDropdown onExport={handleExport} />
              </div>
            </div>

              {/* Baris kedua: Urutkan — Filter — Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <BidangSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                  <button
                    onClick={() => setShowFilterModal(true)}
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

                <div className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Cari nama bidang..."
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
                      <SortableHeader column={columns[0]} columnSort={columnSort} setColumnSort={setColumnSort} />
                      <SortableHeader column={columns[1]} columnSort={columnSort} setColumnSort={setColumnSort} />
                      <th className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">Deskripsi</th>
                      <SortableHeader column={columns[2]} columnSort={columnSort} setColumnSort={setColumnSort} />
                      <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={5} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada bidang yang sesuai</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((b, i) => {
                        const terisi = occupancy[b.nama] || 0;
                        const pct = b.kuota > 0 ? Math.min(100, Math.round((terisi / b.kuota) * 100)) : 0;
                        return (
                          <tr
                            key={b.id}
                            className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
                            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                          >
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#0B1442] transition-colors duration-200 group-hover:text-[#004F9F]">{b.nama}</p>
                            </td>
                            <td className="px-6 py-4">
                              {b.kuota > 0 ? (
                                <div className="w-35">
                                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 mb-1">
                                    <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{terisi}/{b.kuota}</span>
                                    <span className={pct >= 100 ? "text-red-500" : ""}>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ease-out ${pct >= 100 ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-32">
                                  <span className="group/inf inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 border border-[#004F9F]/15 px-2.5 py-1 text-[10px] font-bold text-[#004F9F] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#004F9F]/30">
                                    <InfinityIcon className="w-3 h-3 shrink-0 text-[#0B1442] transition-transform duration-500 group-hover/inf:rotate-180 group-hover/inf:text-[#00A5EC]" />
                                    <span>Tanpa batas</span>
                                    <span className="text-[#0B1442]/40">·</span>
                                    <span className="font-black transition-transform duration-300 group-hover/inf:scale-110">{terisi}</span>
                                    <span className="text-[#0B1442]/60 font-medium">terisi</span>
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-2xs">
                              <BidangDescTooltip text={b.deskripsi} />
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggle(b)}
                                className={`group relative inline-flex h-7 w-[78px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                                  b.is_active
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                                    : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                                } hover:shadow-lg active:scale-95`}
                              >
                                <span
                                  className={`absolute left-3 text-[9.5px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
                                    b.is_active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                  }`}
                                >
                                  Aktif
                                </span>
                                <span
                                  className={`absolute right-2.5 text-[9.5px] font-black uppercase tracking-wider text-slate-500 transition-all duration-300 ${
                                    !b.is_active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
                                  }`}
                                >
                                  Off
                                </span>
                                <span
                                  className="relative inline-flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 ease-out group-active:scale-90"
                                  style={{ transform: b.is_active ? "translateX(54px)" : "translateX(3px)" }}
                                >
                                  <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${b.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                                </span>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <BidangActionsDropdown onEdit={() => handleEdit(b)} onDelete={() => handleDelete(b)} />
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

            {/* Kolom kanan: Tambah Bidang + Perlu Perhatian, satu grid-item, bertumpuk vertikal */}
            <div className="lg:col-span-1 flex flex-col gap-5 h-full">
              <button
                onClick={handleAdd}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] shadow-sm p-4 flex items-center gap-3.5 text-left w-full transition-all duration-300 hover:shadow-xl hover:shadow-[#0B1442]/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/15">
                  <Compass className="w-5 h-5 text-white transition-transform duration-500 group-hover:rotate-[360deg]" />
                </span>

                <div className="relative flex-1 min-w-0">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    Bidang Baru?
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC] animate-pulse" />
                  </h3>
                  <p className="text-[10.5px] text-white/60 leading-snug mt-0.5">Tambahkan bidang penempatan baru</p>
                </div>

                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A5EC] text-[#0B1442] shadow-md shadow-[#00A5EC]/30 transition-all duration-300 group-hover:bg-[#33bdf5] group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#00A5EC]/40">
                  <Plus className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-90" />
                </span>
              </button>
              <div className="flex-1 min-h-0">
                <BidangAlertCard bidangList={bidangList} occupancy={occupancy} />
              </div>
            </div>
          </div>
        </>
      )}
      </div>

      {showFormModal && (
        <BidangModal initialData={editData} onClose={() => setShowFormModal(false)} onSubmit={handleSubmit} />
      )}

      {showFilterModal && (
        <BidangFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          kuotaList={kuotaList}
          toggleKuota={toggleKuota}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default BidangPage;