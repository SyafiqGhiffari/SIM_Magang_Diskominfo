import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import SertifikatFormModal from "../../components/manajemen/admin/sertifikat/SertifikatFormModal";
import SertifikatActionsDropdown from "../../components/manajemen/admin/sertifikat/SertifikatActionsDropdown";
import SertifikatSortDropdown from "../../components/manajemen/admin/sertifikat/SertifikatSortDropdown";
import SertifikatFilterModal from "../../components/manajemen/admin/sertifikat/SertifikatFilterModal";
import { getAllSertifikat, createSertifikat, updateSertifikat, deleteSertifikat } from "../../services/adminService";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { ScrollText, Search, Inbox, GraduationCap, CheckCircle2, Clock, CalendarRange, FileWarning, Filter as FilterIcon, Building2, Hash, Hourglass, Timer } from "lucide-react";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatTanggal = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
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

const KelolaSertifikatPage = () => {
  const { isDark } = useManajemenTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [statusList, setStatusList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const toggleStatus = (key) =>
    setStatusList((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const openFilter = () => { setStatusList(appliedStatusList); setShowFilterModal(true); };
  const applyFilter = () => { setAppliedStatusList(statusList); setPage(0); };
  const resetFilter = () => { setStatusList([]); setAppliedStatusList([]); setPage(0); };

  const fetchData = async () => {
    try {
      const res = await getAllSertifikat();
      setRows(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data sertifikat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const openCreate = (row) => { setActiveRow(row); setShowModal(true); };
  const openEdit = (row) => { setActiveRow(row); setShowModal(true); };

  const handleSubmit = async (nomor) => {
    try {
      if (activeRow?.sertifikat) {
        await updateSertifikat(activeRow.sertifikat.id, { nomor_sertifikat: nomor });
        toastSuccess("Nomor sertifikat berhasil diperbarui");
      } else {
        await createSertifikat({ akun_peserta_id: activeRow.akun_peserta_id, nomor_sertifikat: nomor });
        toastSuccess("Sertifikat berhasil diterbitkan & dikirim ke peserta");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan sertifikat.");
    }
  };

  const handleDelete = async (row) => {
    const result = await confirmDialog({
      title: `Hapus sertifikat "${row.nama}"?`,
      text: "Nomor dan data sertifikat peserta ini akan dihapus. Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSertifikat(row.sertifikat.id);
      toastSuccess("Sertifikat berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus sertifikat.");
    }
  };

  const isMasihMagang = (r) => {
    if (!r.tanggal_selesai) return false;
    const end = new Date(r.tanggal_selesai);
    if (isNaN(end)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end >= today;
  };
  const statusOf = (r) => {
    if (r.sertifikat) return "terbit";
    if (isMasihMagang(r)) return "magang";
    return "perlu";
  };

  const hitungDurasi = (r) => {
    if (!r.tanggal_mulai || !r.tanggal_selesai) return null;
    const s = new Date(r.tanggal_mulai), e = new Date(r.tanggal_selesai);
    if (isNaN(s) || isNaN(e)) return null;
    const hari = Math.round((e - s) / 86400000) + 1;
    if (hari < 30) return `${hari} hari`;
    return `± ${Math.round(hari / 30)} bulan`;
  };
  const hitungSisa = (r) => {
    if (!r.tanggal_selesai) return null;
    const e = new Date(r.tanggal_selesai);
    if (isNaN(e)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.ceil((e - today) / 86400000);
  };

  const filtered = rows
    .filter((r) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(statusOf(r))))
    .filter((r) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return (r.nama || "").toLowerCase().includes(s)
          || (r.bidang || "").toLowerCase().includes(s)
          || (r.institusi || "").toLowerCase().includes(s)
          || (r.sertifikat?.nomor_sertifikat || "").toLowerCase().includes(s);
      };
      return match(search) && match(tableSearch);
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "nama_za": return (b.nama || "").localeCompare(a.nama || "", "id");
      case "bidang_az": return (a.bidang || "").localeCompare(b.bidang || "", "id");
      case "periode_baru": return new Date(b.tanggal_mulai || 0) - new Date(a.tanggal_mulai || 0);
      case "periode_lama": return new Date(a.tanggal_mulai || 0) - new Date(b.tanggal_mulai || 0);
      case "status": {
        const ord = { terbit: 0, magang: 1, perlu: 2 };
        return ord[statusOf(a)] - ord[statusOf(b)];
      }
      default: return (a.nama || "").localeCompare(b.nama || "", "id");
    }
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalPeserta = rows.length;
  const totalTerbit = rows.filter((r) => statusOf(r) === "terbit").length;
  const totalMagang = rows.filter((r) => statusOf(r) === "magang").length;
  const totalPerlu = rows.filter((r) => statusOf(r) === "perlu").length;

  const activeFilterCount = appliedStatusList.length > 0 ? 1 : 0;

  const headerCols = ["Peserta", "Bidang", "Periode", "Nomor", "Status"];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Kelola Sertifikat</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Terbitkan sertifikat magang peserta dengan menetapkan nomor. Tanggal terbit terisi otomatis, dan predikat akan mengikuti otomatis dari hasil tugas, logbook, serta absensi.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data sertifikat...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: GraduationCap, label: "Total Peserta", value: totalPeserta, caption: "Peserta magang terdaftar", lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
                { icon: CheckCircle2, label: "Sudah Terbit", value: totalTerbit, caption: "Sertifikat sudah diterbitkan", lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { icon: Clock, label: "Sedang Magang", value: totalMagang, caption: "Masih dalam masa magang", lightGradient: "from-sky-300 to-white", gradient: "from-sky-500 to-sky-700", iconBg: "bg-sky-50", iconColor: "text-sky-600" },
                { icon: FileWarning, label: "Perlu Dibuat", value: totalPerlu, caption: "Selesai magang, belum dibuat", lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
              ].map((c, i) => (
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
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ScrollText className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Daftar Sertifikat Peserta</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                      Gunakan tombol urutkan & filter untuk menyaring peserta berdasarkan status sertifikatnya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Toolbar: Urutkan — Filter — Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <SertifikatSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
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

                <div className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => { setTableSearch(e.target.value); setPage(0); }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Cari nama, bidang, atau nomor..."
                    className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                      isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[13px]">
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
                    {pageItems.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={6} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada peserta yang sesuai</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((r, i) => {
                        const st = statusOf(r);
                        const sisa = hitungSisa(r);
                        return (
                          <tr
                            key={r.akun_peserta_id}
                            className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
                            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                          >
                            {/* Peserta + avatar inisial */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <PesertaAvatar nama={r.nama} foto={r.pendaftaran?.file_pas_foto} />
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
                            {/* Bidang */}
                            <td className="px-6 py-4">
                              <span className="group/bdg inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30">
                                <Building2 className="w-3.5 h-3.5 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                                {r.bidang || "-"}
                              </span>
                            </td>
                            {/* Periode + info durasi/sisa di bawahnya */}
                            <td className="px-6 py-4">
                              <div className="group/periode">
                                <p className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 shadow-sm whitespace-nowrap transition-all duration-200 group-hover/periode:border-slate-300 group-hover/periode:bg-white group-hover/periode:shadow-md group-hover/periode:-translate-y-0.5">
                                  <CalendarRange className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/periode:scale-110 group-hover/periode:text-[#004F9F]" />
                                  {formatTanggal(r.tanggal_mulai)} – {formatTanggal(r.tanggal_selesai)}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  {hitungDurasi(r) && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                      <Hourglass className="w-2.5 h-2.5" /> {hitungDurasi(r)}
                                    </span>
                                  )}
                                  {st === "magang" && sisa != null && sisa >= 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">
                                      <Timer className="w-2.5 h-2.5" /> Sisa {sisa} hari
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Selesai
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Nomor */}
                            <td className="px-6 py-4">
                              {r.sertifikat?.nomor_sertifikat ? (
                                <span className="group/nomor inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-white">
                                  <Hash className="w-3 h-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/nomor:scale-110 group-hover/nomor:text-[#004F9F]" />
                                  {r.sertifikat.nomor_sertifikat}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-slate-300">
                                  <Hash className="w-3.5 h-3.5" /> —
                                </span>
                              )}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4">
                              {st === "terbit" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10.5px] font-bold text-emerald-600">
                                  <CheckCircle2 className="w-3 h-3" /> Sudah Terbit
                                </span>
                              ) : st === "magang" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-100 px-2.5 py-1 text-[10.5px] font-bold text-sky-600">
                                  <Clock className="w-3 h-3" /> Sedang Magang
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-[10.5px] font-bold text-amber-600">
                                  <FileWarning className="w-3 h-3" /> Perlu Dibuat
                                </span>
                              )}
                            </td>
                            {/* Aksi */}
                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <SertifikatActionsDropdown
                                  status={st}
                                  onTerbitkan={() => openCreate(r)}
                                  onView={() => openEdit(r)}
                                  onDelete={() => handleDelete(r)}
                                />
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
          </div>
        )}
      </div>

      {showModal && (
        <SertifikatFormModal
          peserta={activeRow}
          initialData={activeRow?.sertifikat || null}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {showFilterModal && (
        <SertifikatFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default KelolaSertifikatPage;