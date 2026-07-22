import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PendaftaranStats from "../../components/manajemen/admin/pendaftaran/PendaftaranStats";
import SortDropdown from "../../components/manajemen/admin/pendaftaran/SortDropdown";
import FilterModal from "../../components/manajemen/admin/pendaftaran/FilterModal";
import PendaftaranTable from "../../components/manajemen/admin/pendaftaran/PendaftaranTable";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import DetailModal from "../../components/manajemen/admin/pendaftaran/DetailModal";
import ReviewModal from "../../components/manajemen/admin/pendaftaran/ReviewModal";
import { getAllPendaftaran, getAllBidang, createAkunPeserta } from "../../services/adminService";
import { exportPendaftaranToExcel } from "../../utils/exportExcel";
import { exportPendaftaranToCsv } from "../../utils/exportCsv";
import { exportPendaftaranToPdf } from "../../utils/exportPdf";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import { toastError, toastSuccess, confirmDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { ClipboardList, Filter as FilterIcon, Search, X } from "lucide-react";

const PendaftaranPage = () => {
  const { isDark } = useManajemenTheme();
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [bidangOptions, setBidangOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("terbaru");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [statusList, setStatusList] = useState(["menunggu"]);
  const [bidang, setBidang] = useState("");
  const [kategori, setKategori] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedStatusList, setAppliedStatusList] = useState(["menunggu"]);
  const [appliedBidang, setAppliedBidang] = useState("");
  const [appliedKategori, setAppliedKategori] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const toggleStatus = (key) => {
    setStatusList((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleBuatAkun = async (p) => {
    const result = await confirmDialog({
      title: `Buat akun untuk ${p.nama_lengkap}?`,
      text: `Sistem akan membuat akun login otomatis dan mengirimkan kredensial ke email ${p.email}.`,
      confirmText: "Ya, Buat Akun",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    try {
      await createAkunPeserta(p.id);
      toastSuccess("Akun peserta berhasil dibuat dan kredensial telah dikirim ke email");
      fetchData();

      const lanjutkan = await confirmDialog({
        title: "Tentukan mentor pembimbing sekarang?",
        text: `Peserta "${p.nama_lengkap}" belum memiliki mentor pembimbing. Anda bisa mengaturnya sekarang atau nanti lewat menu Kelola Peserta.`,
        confirmText: "Ya, Atur Sekarang",
        cancelText: "Nanti Saja",
        icon: "question",
      });
      if (lanjutkan.isConfirmed) {
        navigate("/admin/peserta");
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membuat akun peserta.");
    }
  };

  const fetchData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([getAllPendaftaran(), getAllBidang().catch(() => null)]);
      setList(pRes.data.data || []);

      const bidangFromDB = bRes ? (bRes.data.data || []).map((b) => b.nama) : [];
      const bidangFromData = [...new Set((pRes.data.data || []).map((p) => p.posisi_bidang).filter(Boolean))];
      setBidangOptions([...new Set([...bidangFromDB, ...bidangFromData])]);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data pendaftaran.");
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

  const counts = {
    menunggu: list.filter((p) => p.status_pendaftaran === "menunggu").length,
    revisi: list.filter((p) => p.status_pendaftaran === "revisi").length,
    diterima: list.filter((p) => p.status_pendaftaran === "diterima").length,
    ditolak: list.filter((p) => p.status_pendaftaran === "ditolak").length,
  };

  const verifiedList = list.filter((p) => p.status_pendaftaran === "diterima" || p.status_pendaftaran === "ditolak");
  const avgDays = verifiedList.length
    ? (
        verifiedList.reduce((sum, p) => {
          const diff = (new Date(p.updated_at) - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
          return sum + Math.max(diff, 0);
        }, 0) / verifiedList.length
      ).toFixed(1)
    : "0";

  const filtered = list
    .filter((p) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(p.status_pendaftaran)))
    .filter((p) => (appliedBidang ? p.posisi_bidang === appliedBidang : true))
    .filter((p) => (appliedKategori ? p.kategori_pendaftar === appliedKategori : true))
    .filter((p) => {
      if (!appliedDateFrom && !appliedDateTo) return true;
      const created = new Date(p.created_at);
      if (appliedDateFrom && created < new Date(appliedDateFrom)) return false;
      if (appliedDateTo && created > new Date(appliedDateTo + "T23:59:59")) return false;
      return true;
    })
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.nama_lengkap?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.posisi_bidang?.toLowerCase().includes(q)
      );
    });

  const getSortValue = (p, key) => {
    if (key === "institusi") return (p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah) || "";
    if (key === "created_at") return new Date(p.created_at).getTime();
    return (p[key] || "").toString().toLowerCase();
  };

  const sorted = [...filtered].sort((a, b) => {
    // Prioritas 1: sort per kolom tabel (kalau ada kolom yang sedang aktif di-klik)
    if (columnSort.key) {
      const valA = getSortValue(a, columnSort.key);
      const valB = getSortValue(b, columnSort.key);
      let result;
      if (typeof valA === "number" && typeof valB === "number") {
        result = valA - valB;
      } else {
        result = String(valA).localeCompare(String(valB));
      }
      return columnSort.direction === "asc" ? result : -result;
    }

    // Prioritas 2: sort dari dropdown "Urutkan"
    if (sortBy === "terbaru") return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "terlama") return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === "nama_az") return (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "");
    if (sortBy === "nama_za") return (b.nama_lengkap || "").localeCompare(a.nama_lengkap || "");
    return 0;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedBidang(bidang);
    setAppliedKategori(kategori);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(0);
  };

  const handleResetFilters = () => {
    setStatusList([]);
    setBidang("");
    setKategori("");
    setDateFrom("");
    setDateTo("");
    setAppliedStatusList([]);
    setAppliedBidang("");
    setAppliedKategori("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setPage(0);
  };

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    const label = appliedStatusList.length === 1 ? appliedStatusList[0] : "semua-status";
    const fileName = `pendaftaran-${label}`;

    if (format === "excel") {
      exportPendaftaranToExcel(sorted, fileName);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else if (format === "csv") {
      exportPendaftaranToCsv(sorted, fileName);
      toastSuccess("Data berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      exportPendaftaranToPdf(sorted, fileName);
      toastSuccess("Data berhasil diekspor ke PDF");
    }
  };

  const activeFilterCount =
    (appliedStatusList.length > 0 && appliedStatusList.length < 4 ? 1 : 0) +
    (appliedBidang ? 1 : 0) +
    (appliedKategori ? 1 : 0) +
    (appliedDateFrom || appliedDateTo ? 1 : 0);

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Judul halaman (hero) */}
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Kelola Pendaftaran Magang
          </h2>
          <p className={`mt-1.5 text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pantau setiap pengajuan magang yang masuk, tinjau kelengkapan berkas, lalu putuskan status penerimaan peserta dalam satu tempat.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data pendaftaran...
          </div>
        ) : (
          <>
            <PendaftaranStats
              total={list.length}
              diterima={counts.diterima}
              ditolak={counts.ditolak}
              avgDays={avgDays}
            />

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {/* Header card */}
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#0B1442]">Daftar Pendaftaran Peserta</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                      Gunakan tombol filter untuk menyaring data berdasarkan status, bidang, dan tanggal.
                    </p>
                  </div>
                </div>
                <ExportDropdown onExport={handleExport} />
              </div>

              {/* Baris kedua: Urutkan (kiri) — Filter — Search (kanan pojok) */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />

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

                <div className={`group relative w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Cari nama, email, bidang..."
                    className={`w-full rounded-xl border pl-9 pr-9 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                      isSearchFocused
                        ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                    }`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setPage(0); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span
                    className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                      isSearchFocused ? "w-[calc(100%-12px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                    }`}
                  />
                </div>
              </div>

              <PendaftaranTable
                data={pageItems}
                onReview={setSelectedReview}
                onVerifikasi={setSelectedVerifikasi}
                onBuatAkun={handleBuatAkun}
                columnSort={columnSort}
                setColumnSort={setColumnSort}
              />

              <Pagination
                totalItems={sorted.length}
                page={page}
                setPage={setPage}
                perPage={perPage}
                setPerPage={setPerPage}
              />
            </div>
          </>
        )}
      </div>

      {selectedVerifikasi && (
        <DetailModal
          pendaftaran={selectedVerifikasi}
          onClose={() => setSelectedVerifikasi(null)}
          onUpdated={fetchData}
        />
      )}

      {selectedReview && (
        <ReviewModal
          pendaftaran={selectedReview}
          onClose={() => setSelectedReview(null)}
          onUpdated={fetchData}
        />
      )}

      {showFilterModal && (
        <FilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          bidangList={bidangOptions}
          bidang={bidang}
          setBidang={setBidang}
          kategori={kategori}
          setKategori={setKategori}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default PendaftaranPage;