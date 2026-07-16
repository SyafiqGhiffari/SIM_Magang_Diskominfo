import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import BidangStats from "../../components/manajemen/admin/bidang/BidangStats";
import BidangSortDropdown from "../../components/manajemen/admin/bidang/BidangSortDropdown";
import BidangFilterModal from "../../components/manajemen/admin/bidang/BidangFilterModal";
import BidangModal from "../../components/manajemen/admin/bidang/BidangModal";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import { getAllBidang, createBidang, updateBidang, deleteBidang, toggleStatusBidang, getAllPendaftaran } from "../../services/adminService";
import { exportBidangToExcel } from "../../utils/exportBidang";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { Compass, Plus, Pencil, Trash2, Users2, Download, Filter as FilterIcon, Search, ChevronUp, ChevronDown, Inbox } from "lucide-react";

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

  const [status, setStatus] = useState("semua");
  const [appliedStatus, setAppliedStatus] = useState("semua");
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
    const result = await confirmDialog({
      title: `Hapus bidang "${b.nama}"?`,
      text: "Tindakan ini tidak dapat dibatalkan. Pendaftaran yang sudah memakai bidang ini tidak akan terpengaruh.",
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

  const handleApplyFilters = () => { setAppliedStatus(status); setPage(0); };
  const handleResetFilters = () => { setStatus("semua"); setAppliedStatus("semua"); setPage(0); };

  const filtered = bidangList
    .filter((b) => (appliedStatus === "semua" ? true : appliedStatus === "aktif" ? b.is_active : !b.is_active))
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

  const handleExport = () => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    exportBidangToExcel(sorted, occupancy);
    toastSuccess("Data berhasil diekspor ke Excel");
  };

  const activeFilterCount = appliedStatus !== "semua" ? 1 : 0;

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Bidang</h2>
            <p className={`mt-1.5 text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Atur daftar bidang penempatan magang beserta kuota dan status ketersediaannya.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Bidang
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data bidang...
          </div>
        ) : (
          <>
            <BidangStats total={bidangList.length} aktif={totalAktif} nonaktif={totalNonaktif} totalTerisi={totalTerisi} />

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {/* Header card */}
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <Compass className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#0B1442]">Daftar Bidang</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-md leading-relaxed">
                      Gunakan tombol filter untuk menyaring bidang berdasarkan status.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                  Ekspor ke Excel
                </button>
              </div>

              {/* Baris kedua: Urutkan — Filter — Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
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

                <div className={`relative w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "scale-[1.03]" : ""}`}>
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
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {columns.map((col) => (
                        <SortableHeader key={col.key} column={col} columnSort={columnSort} setColumnSort={setColumnSort} />
                      ))}
                      <th className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">Deskripsi</th>
                      <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada bidang yang sesuai</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((b) => {
                        const terisi = occupancy[b.nama] || 0;
                        const pct = b.kuota > 0 ? Math.min(100, Math.round((terisi / b.kuota) * 100)) : 0;
                        return (
                          <tr key={b.id} className="group border-b border-slate-50 transition-colors duration-150 hover:bg-slate-50/70">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                                  <Compass className="w-4 h-4" />
                                </span>
                                <p className="font-bold text-[#0B1442]">{b.nama}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {b.kuota > 0 ? (
                                <div className="w-32">
                                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 mb-1">
                                    <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{terisi}/{b.kuota}</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-red-500" : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Tanpa batas ({terisi} terisi)</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggle(b)}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer ${b.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                              >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${b.is_active ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                              </button>
                            </td>
                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{b.deskripsi || "-"}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all duration-200 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:-translate-y-0.5 cursor-pointer">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all duration-200 hover:border-red-300 hover:text-red-600 hover:-translate-y-0.5 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
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

              <Pagination totalItems={sorted.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
            </div>
          </>
        )}
      </div>

      {showFormModal && (
        <BidangModal initialData={editData} onClose={() => setShowFormModal(false)} onSubmit={handleSubmit} />
      )}

      {showFilterModal && (
        <BidangFilterModal
          status={status}
          setStatus={setStatus}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default BidangPage;