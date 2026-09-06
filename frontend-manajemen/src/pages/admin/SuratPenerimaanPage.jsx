import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import ExportDropdown from "../../components/manajemen/admin/pendaftaran/ExportDropdown";
import SuratPenerimaanModal from "../../components/manajemen/admin/surat/SuratPenerimaanModal";
import SuratSortDropdown from "../../components/manajemen/admin/surat/SuratSortDropdown";
import SuratFilterModal from "../../components/manajemen/admin/surat/SuratFilterModal";
import SuratActionsDropdown from "../../components/manajemen/admin/surat/SuratActionsDropdown";
import {
  getAllSuratPenerimaan,
  deleteSuratPenerimaan,
  kirimEmailSuratPenerimaan,
} from "../../services/suratPenerimaanService";
import { exportSuratToExcel } from "../../utils/exportSuratExcel";
import { exportSuratToCsv } from "../../utils/exportSuratCsv";
import { exportSuratToPdf } from "../../utils/exportSuratPdf";
import { getFileUrl } from "../../utils/fileUrl";
import { getBidangColor } from "../../utils/bidangColor";
import { toastError, toastSuccess, confirmDialog } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  FileSignature,
  Search,
  X,
  Inbox,
  Users,
  MailCheck,
  MailWarning,
  FileWarning,
  CalendarCheck,
  Building2,
  Hash,
  GraduationCap,
  CheckCircle2,
  Clock3,
  Filter as FilterIcon,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";

const fmtPanjang = (d) => {
  if (!d) return "-";
  const t = new Date(d);
  if (isNaN(t)) return String(d);
  return t.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const inisial = (nama) => {
  if (!nama) return "?";
  const p = String(nama).trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] || "")).toUpperCase();
};

const PesertaAvatar = ({ nama, foto }) => {
  const [gagal, setGagal] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  if (url && !gagal) {
    return (
      <img
        src={url}
        alt={nama}
        onError={() => setGagal(true)}
        className="h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 rounded-full object-cover border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[10px] sm:text-sm font-black text-white border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110">
      {inisial(nama)}
    </span>
  );
};

// Menyeragamkan bentuk data dari backend menjadi { pendaftaran, surat }.
const normalisasi = (item) => {
  const surat = item.surat || (item.nomor_surat ? item : null);
  const pendaftaran = item.pendaftaran || {
    id: item.pendaftaran_id ?? item.pendaftaran_magang_id ?? surat?.pendaftaran_magang_id,
    nama_lengkap: item.nama ?? item.nama_lengkap ?? surat?.snapshot_nama,
    kategori_pendaftar: item.kategori ?? item.kategori_pendaftar ?? surat?.snapshot_kategori,
    nomor_induk: item.nomor_induk ?? surat?.snapshot_nomor_induk,
    posisi_bidang: item.bidang ?? item.posisi_bidang ?? surat?.snapshot_bidang,
    asal_kampus: item.asal_kampus ?? item.institusi,
    asal_sekolah: item.asal_sekolah ?? item.institusi,
    file_pas_foto: item.file_pas_foto ?? item.pendaftaran?.file_pas_foto,
    // Tanpa dua baris ini, badge periode magang di modal tampil "- s/d -"
    // karena backend mengirim tanggal di level item, bukan di dalam pendaftaran.
    tanggal_mulai: item.tanggal_mulai ?? surat?.snapshot_tanggal_mulai,
    tanggal_selesai: item.tanggal_selesai ?? surat?.snapshot_tanggal_selesai,
  };
  return { pendaftaran, surat };
};

const SortableHeader = ({ label, sortKey, currentSort, onSort, isDark, className = "" }) => {
  let isActive = false;
  let direction = null; // "asc" or "desc"
  
  if (sortKey === "nama") {
    isActive = currentSort === "nama_az" || currentSort === "nama_za";
    direction = currentSort === "nama_za" ? "desc" : "asc";
  } else if (sortKey === "bidang") {
    isActive = currentSort === "bidang_az";
    direction = "asc";
  } else if (sortKey === "status") {
    isActive = currentSort === "status";
    direction = "asc";
  } else if (sortKey === "tanggal") {
    isActive = currentSort === "tanggal_baru" || currentSort === "tanggal_lama";
    direction = currentSort === "tanggal_baru" ? "desc" : "asc";
  }

  const handleClick = () => {
    if (sortKey === "nama") {
      if (currentSort === "nama_az") {
        onSort("nama_za");
      } else {
        onSort("nama_az");
      }
    } else if (sortKey === "bidang") {
      if (currentSort === "bidang_az") {
        onSort("status"); // fallback to status
      } else {
        onSort("bidang_az");
      }
    } else if (sortKey === "status") {
      if (currentSort === "status") {
        onSort("nama_az"); // fallback to nama_az
      } else {
        onSort("status");
      }
    } else if (sortKey === "tanggal") {
      if (currentSort === "tanggal_baru") {
        onSort("tanggal_lama");
      } else {
        onSort("tanggal_baru");
      }
    }
  };

  const isSortable = !!sortKey;

  if (!isSortable) {
    return (
      <th className={`px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400 ${className}`}>
        {label}
      </th>
    );
  }

  return (
    <th className={`px-1 sm:px-2 py-2.5 sm:py-3 ${className}`}>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "bg-white/10 text-slate-200"
              : "bg-[#0B1442]/5 text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <span className="truncate">{label}</span>
        <span
          className={`flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
            isActive ? "bg-[#004F9F] shadow-sm" : (isDark ? "bg-transparent group-hover:bg-white/5" : "bg-transparent group-hover:bg-slate-200")
          }`}
        >
          {isActive && direction === "asc" ? (
            <ChevronUp className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : isActive && direction === "desc" ? (
            <ChevronDown className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : (
            <ChevronsUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const SuratPenerimaanPage = () => {
  const { isDark } = useManajemenTheme();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fokus, setFokus] = useState(false);
  const [sortBy, setSortBy] = useState("status");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [statusList, setStatusList] = useState(statusParam ? (statusParam === "semua" ? [] : [statusParam]) : []);
  const [appliedStatusList, setAppliedStatusList] = useState(statusParam ? (statusParam === "semua" ? [] : [statusParam]) : []);
  const [kategoriList, setKategoriList] = useState([]);
  const [appliedKategoriList, setAppliedKategoriList] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [appliedBidangList, setAppliedBidangList] = useState([]);
  const [tglDari, setTglDari] = useState("");
  const [tglSampai, setTglSampai] = useState("");
  const [appliedTgl, setAppliedTgl] = useState({ dari: "", sampai: "" });
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [prevStatusParam, setPrevStatusParam] = useState(statusParam);
  if (statusParam !== prevStatusParam) {
    setPrevStatusParam(statusParam);
    const listBaru = statusParam ? (statusParam === "semua" ? [] : [statusParam]) : [];
    setStatusList(listBaru);
    setAppliedStatusList(listBaru);
    setPage(0);
  }

  const [modal, setModal] = useState(null);

  const toggleDaftar = (setter) => (key) =>
  setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleStatus = toggleDaftar(setStatusList);
  const toggleKategori = toggleDaftar(setKategoriList);
  const toggleBidang = toggleDaftar(setBidangList);

  const openFilter = () => {
    setStatusList(appliedStatusList);
    setKategoriList(appliedKategoriList);
    setBidangList(appliedBidangList);
    setTglDari(appliedTgl.dari);
    setTglSampai(appliedTgl.sampai);
    setShowFilterModal(true);
  };
  const applyFilter = () => {
    setAppliedStatusList(statusList);
    setAppliedKategoriList(kategoriList);
    setAppliedBidangList(bidangList);
    setAppliedTgl({ dari: tglDari, sampai: tglSampai });
    setPage(0);
  };
  const resetFilter = () => {
    setStatusList([]); setKategoriList([]); setBidangList([]); setTglDari(""); setTglSampai("");
    setAppliedStatusList([]); setAppliedKategoriList([]); setAppliedBidangList([]);
    setAppliedTgl({ dari: "", sampai: "" });
    setSortBy("terbaru");
    setPage(0);
  };

  const fetchData = async () => {
    try {
      const res = await getAllSuratPenerimaan();
      setRows((res.data.data || []).map(normalisasi));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data surat penerimaan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleHapus = async (row) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus surat penerimaan?",
      text: `Surat nomor ${row.surat.nomor_surat} untuk ${row.pendaftaran.nama_lengkap} akan dihapus beserta file PDF-nya.`,
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;

    try {
      await deleteSuratPenerimaan(row.surat.id);
      toastSuccess("Surat penerimaan berhasil dihapus");
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus surat penerimaan.");
    }
  };

  // Kirim / kirim ulang PDF surat ke email peserta (email saat pendaftaran).
  const handleKirimEmail = async (row) => {
    const s = row.surat;
    if (!s) return;

    const email = row.pendaftaran?.email || "email peserta";
    const konfirmasi = await confirmDialog({
      title: s.email_terkirim_at ? "Kirim ulang surat?" : "Kirim surat ke peserta?",
      text: `PDF surat akan dikirim ke ${email}.`,
      confirmButtonText: "Ya, kirim",
    });
    if (!konfirmasi.isConfirmed) return;

      try {
      const res = await kirimEmailSuratPenerimaan(s.id);
      const baru = res?.data?.data || null;

      // Tambal state langsung supaya kolom "Status Email" berubah seketika
      // tanpa menunggu request ulang / reload browser.
      setRows((prev) =>
        prev.map((r) =>
          r.surat?.id === s.id
            ? {
                ...r,
                surat: {
                  ...r.surat,
                  email_tujuan:
                    baru?.email_tujuan || row.pendaftaran?.email || r.surat.email_tujuan || "",
                  email_terkirim_at:
                    baru?.email_terkirim_at || new Date().toISOString(),
                },
              }
            : r
        )
      );

      toastSuccess(res?.data?.message || "Surat berhasil dikirim ke email peserta");
      fetchData(); // sinkronisasi diam-diam dengan server
    } catch (err) {
      toastError(err?.response?.data?.message || "Gagal mengirim email surat");
    }
  };

  const institusiPeserta = (p) => p?.asal_kampus || p?.asal_sekolah || "";
  const statusOf = (r) => (r.surat ? "terbit" : "belum");

  const opsiBidang = [...new Set(rows.map((r) => r.pendaftaran?.posisi_bidang).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "id"));

  const filtered = rows
    .filter((r) => (appliedStatusList.length === 0 ? true : appliedStatusList.includes(statusOf(r))))
    .filter((r) =>
      appliedKategoriList.length === 0 ? true : appliedKategoriList.includes(r.pendaftaran?.kategori_pendaftar)
    )
    .filter((r) =>
      appliedBidangList.length === 0 ? true : appliedBidangList.includes(r.pendaftaran?.posisi_bidang)
    )
    .filter((r) => {
      if (!appliedTgl.dari && !appliedTgl.sampai) return true;
      const tgl = r.surat?.tanggal_terbit ? String(r.surat.tanggal_terbit).slice(0, 10) : "";
      if (!tgl) return false;
      if (appliedTgl.dari && tgl < appliedTgl.dari) return false;
      if (appliedTgl.sampai && tgl > appliedTgl.sampai) return false;
      return true;
    })
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.pendaftaran.nama_lengkap || "").toLowerCase().includes(q) ||
        (r.surat?.nomor_surat || "").toLowerCase().includes(q) ||
        (r.pendaftaran.posisi_bidang || "").toLowerCase().includes(q) ||
        (r.surat?.institusi_tujuan || "").toLowerCase().includes(q) ||
        institusiPeserta(r.pendaftaran).toLowerCase().includes(q)
      );
    });

  const sorted = [...filtered].sort((a, b) => {
    const na = a.pendaftaran.nama_lengkap || "";
    const nb = b.pendaftaran.nama_lengkap || "";
    switch (sortBy) {
      case "nama_za":
        return nb.localeCompare(na, "id");
      case "bidang_az":
        return (a.pendaftaran.posisi_bidang || "").localeCompare(b.pendaftaran.posisi_bidang || "", "id");
      case "tanggal_baru":
        return new Date(b.surat?.tanggal_terbit || 0) - new Date(a.surat?.tanggal_terbit || 0);
      case "tanggal_lama":
        return new Date(a.surat?.tanggal_terbit || 0) - new Date(b.surat?.tanggal_terbit || 0);
      case "status":
        return (a.surat ? 1 : 0) - (b.surat ? 1 : 0) || na.localeCompare(nb, "id");
      default:
        return na.localeCompare(nb, "id");
    }
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);

  const totalPeserta = rows.length;
  const totalTerbit = rows.filter((r) => !!r.surat).length;
  const jumlahBelum = totalPeserta - totalTerbit;

  const kini = new Date();
  const terbitBulanIni = rows.filter((r) => {
    if (!r.surat?.tanggal_terbit) return false;
    const t = new Date(r.surat.tanggal_terbit);
    if (isNaN(t)) return false;
    return t.getMonth() === kini.getMonth() && t.getFullYear() === kini.getFullYear();
  }).length;

  const handleExport = (format) => {
    if (sorted.length === 0) {
      toastError("Tidak ada data untuk diekspor pada filter saat ini.");
      return;
    }
    if (format === "excel") {
      exportSuratToExcel(sorted);
      toastSuccess("Data berhasil diekspor ke Excel");
    } else if (format === "csv") {
      exportSuratToCsv(sorted);
      toastSuccess("Data berhasil diekspor ke CSV");
    } else if (format === "pdf") {
      exportSuratToPdf(sorted);
      toastSuccess("Data berhasil diekspor ke PDF");
    }
  };

  const activeFilterCount =
    appliedStatusList.length +
    appliedKategoriList.length +
    appliedBidangList.length +
    (appliedTgl.dari ? 1 : 0) +
    (appliedTgl.sampai ? 1 : 0);

  const activeFilterCountMobile = activeFilterCount + (sortBy ? 1 : 0);

  const kartu = [
    {
      icon: Users,
      label: "Peserta Diterima",
      value: totalPeserta,
      caption: "Pendaftar berstatus diterima",
      mobileCaption: "Peserta diterima",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: MailCheck,
      label: "Surat Terbit",
      value: totalTerbit,
      caption: "Surat penerimaan sudah dibuat",
      mobileCaption: "Surat terbit",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: FileWarning,
      label: "Belum Terbit",
      value: jumlahBelum,
      caption: "Menunggu diterbitkan admin",
      mobileCaption: "Belum terbit",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
    {
      icon: CalendarCheck,
      label: "Terbit Bulan Ini",
      value: terbitBulanIni,
      caption: `Periode ${kini.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      mobileCaption: "Bulan ini",
      lightGradient: "from-sky-300 to-white",
      gradient: "from-sky-500 to-sky-700",
      iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-600",
    },
  ];

  const headerCols = [
    { label: "Peserta", key: "nama", className: "w-[55%] sm:w-[32%] min-w-[160px] sm:min-w-[240px]" },
    { label: "Bidang", key: "bidang", className: "hidden sm:table-cell sm:w-[15%]" },
    { label: "Nomor Surat", key: null, className: "hidden sm:table-cell sm:w-[15%]" },
    { label: "Status", key: "status", className: "w-[25%] sm:w-[10%]" },
    { label: "Tanggal Surat", key: "tanggal", className: "hidden sm:table-cell sm:w-[10%]" },
    { label: "Status Email", key: null, className: "hidden sm:table-cell sm:w-[10%]" },
    { label: "Tujuan", key: null, className: "hidden sm:table-cell sm:w-[9%]" },
  ];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">        {/* Judul halaman (hero) */}
        <div>
          <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Surat Penerimaan Magang
          </h2>
          <p className={`mt-1.5 text-[11px] sm:text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">
              Terbitkan dan kelola surat penerimaan untuk peserta magang.
            </span>
            <span className="hidden sm:inline">
              Terbitkan surat penerimaan untuk peserta yang sudah diterima. Nomor surat diisi manual mengikuti penomoran internal instansi, sedangkan data peserta terisi otomatis dari berkas pendaftaran. Kop, redaksi, dan tata letak PDF mengikuti template yang dipilih.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-24 text-sm text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#004F9F] border-t-transparent" />
            Memuat data surat penerimaan...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Statistik ringkas */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {kartu.map((c, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-2.5 sm:p-5 ${
                    isDark
                      ? "border-white/10 bg-[#161b22]"
                      : `border-slate-200 bg-gradient-to-br ${c.lightGradient} shadow-sm`
                  }`}
                >
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                    isDark ? "opacity-[0.18] group-hover:opacity-[0.28]" : "opacity-[0.3] group-hover:opacity-[0.4]"
                  }`} />
                  <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[9px] sm:text-sm font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.label}</p>
                      <h3 className={`mt-1 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{c.value}</h3>
                      <p className={`mt-1.5 text-[8.5px] sm:text-xs font-medium leading-tight sm:leading-snug whitespace-normal break-words ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <span className="hidden sm:inline">{c.caption}</span>
                        <span className="inline sm:hidden">{c.mobileCaption}</span>
                      </p>
                    </div>
                    <span className={`flex h-5 w-5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${c.iconBg}`}>
                      <c.icon className="h-3 w-3 sm:h-4.5 sm:w-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {jumlahBelum > 0 && (
              <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                isDark
                  ? "border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent"
                  : "border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/60 to-white"
              }`}>
                <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-30" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <FileWarning className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9.5px] font-black text-white ring-2 ring-white">
                        {jumlahBelum}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-black ${isDark ? "text-amber-400" : "text-amber-900"}`}>Surat penerimaan menunggu diterbitkan</h4>
                      <p className={`mt-0.5 max-w-2xl text-[11.5px] font-medium leading-relaxed ${isDark ? "text-amber-500/90" : "text-amber-700/90"}`}>
                        {jumlahBelum} dari {totalPeserta} peserta yang sudah diterima belum memiliki surat penerimaan.
                        Terbitkan suratnya agar berkas peserta lengkap.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <div className={`h-1.5 w-36 overflow-hidden rounded-full sm:w-48 ${isDark ? "bg-amber-950/40" : "bg-amber-200/70"}`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700 ease-out"
                            style={{ width: `${totalPeserta ? Math.round((totalTerbit / totalPeserta) * 100) : 0}%` }}
                          />
                        </div>
                        <span className={`whitespace-nowrap text-[10.5px] font-black ${isDark ? "text-amber-500" : "text-amber-700"}`}>
                          {totalPeserta ? Math.round((totalTerbit / totalPeserta) * 100) : 0}% sudah terbit
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setStatusList(["belum"]); setAppliedStatusList(["belum"]); setPage(0); }}
                    className="group/btn inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 sm:self-auto"
                  >
                    Lihat daftarnya
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            <div className={`overflow-hidden rounded-2xl border shadow-sm ${
              isDark ? "border-white/10 bg-[#11161d]" : "border-slate-200/80 bg-white"
            }`}>
              {/* Header card */}
              <div className="flex items-start justify-between gap-3 sm:gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-3.5 sm:pb-5">
                <div className="flex min-w-0 items-start gap-2.5 sm:gap-3 flex-1">
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <FileSignature className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm sm:text-base font-black text-left ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      <span className="inline sm:hidden">Daftar Surat</span>
                      <span className="hidden sm:inline">Daftar Surat Penerimaan</span>
                    </h3>
                    <p className="mt-0.5 text-[10.5px] sm:text-xs text-slate-400 max-w-xl leading-relaxed text-left">
                      <span className="inline sm:hidden">Menyaring data surat terbit.</span>
                      <span className="hidden sm:inline">Total {totalPeserta} peserta diterima · {totalTerbit} surat terbit · {jumlahBelum} belum terbit.</span>
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <ExportDropdown onExport={handleExport} isDark={isDark} />
                </div>
              </div>

              {/* Toolbar: Urutkan — Filter — Pencarian */}
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-3.5 sm:pb-5 border-b ${
                isDark ? "border-white/5" : "border-slate-100"
              }`}>
                {/* Desktop Only: SortDropdown + Filter button */}
                <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
                  <SuratSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                  
                  <button
                    onClick={openFilter}
                    className={`group inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8px] sm:text-[9.5px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Mobile & Desktop Search: contains Mobile Only Filter and Search Input side-by-side */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Mobile Only: Filter Button next to search */}
                  <div className="block sm:hidden shrink-0">
                    <button
                      type="button"
                      onClick={openFilter}
                      className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      {activeFilterCountMobile > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[8.5px] font-black">
                          {activeFilterCountMobile}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className={`group relative flex-1 sm:w-64 transition-transform duration-200 ${fokus ? "scale-[1.01]" : ""}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${
                      fokus ? (isDark ? "text-[#00A5EC] scale-110" : "text-[#004F9F] scale-110") : "text-slate-400"
                    }`} />
                    {/* Desktop Search Input */}
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      onFocus={() => setFokus(true)}
                      onBlur={() => setFokus(false)}
                      placeholder="Cari nama, nomor surat..."
                      className={`hidden sm:block w-full rounded-xl border py-2.5 pl-9 pr-9 text-xs font-medium outline-none transition-all duration-200 ${
                        isDark
                          ? fokus
                            ? "border-[#00A5EC] bg-[#1f2630] text-slate-200 shadow-md ring-4 ring-[#00A5EC]/10"
                            : "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-[#1a202a]"
                          : fokus
                            ? "border-[#004F9F] bg-white text-slate-700 shadow-md ring-4 ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                    {/* Mobile Search Input */}
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      onFocus={() => setFokus(true)}
                      onBlur={() => setFokus(false)}
                      placeholder="Cari sesuatu..."
                      className={`block sm:hidden w-full rounded-xl border py-2.5 pl-9 pr-9 text-xs font-medium outline-none transition-all duration-200 ${
                        isDark
                          ? fokus
                            ? "border-[#00A5EC] bg-[#1f2630] text-slate-200 shadow-md ring-4 ring-[#00A5EC]/10"
                            : "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-[#1a202a]"
                          : fokus
                            ? "border-[#004F9F] bg-white text-slate-700 shadow-md ring-4 ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                    {search && (
                      <button
                        onClick={() => { setSearch(""); setPage(0); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-0 sm:min-w-[940px] text-left text-[13px]">
                  <thead>
                    <tr className={`border-b ${
                      isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/60"
                    }`}>
                      {headerCols.map((h) => (
                        <SortableHeader
                          key={h.label}
                          label={h.label}
                          sortKey={h.key}
                          currentSort={sortBy}
                          onSort={(newSort) => { setSortBy(newSort); setPage(0); }}
                          isDark={isDark}
                          className={h.className}
                        />
                      ))}
                      <th className="px-2 sm:px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400 w-[20%] sm:w-[9%]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={8} className="px-4 sm:px-6 py-10 sm:py-16">
                          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center">
                            <span className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                              isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                            }`}>
                              <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
                              <span className={`absolute inset-0 animate-ping rounded-xl sm:rounded-2xl border-2 opacity-40 ${
                                isDark ? "border-white/10" : "border-slate-200"
                              }`} />
                            </span>
                            <div>
                              <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Belum ada data yang sesuai</p>
                              <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-[260px] sm:max-w-none">
                                Surat penerimaan muncul di sini setelah ada pendaftar berstatus diterima.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((row, i) => {
                        const p = row.pendaftaran;
                        const s = row.surat;
                        const institusi = institusiPeserta(p);
                        const bidangColor = getBidangColor(p.posisi_bidang);
                        return (
                           <React.Fragment key={`${p.id}-${s?.id ?? "belum"}`}>
                            <tr
                              className={`group animate-[fadeslide_0.3s_ease-out] border-b transition-all duration-200 ${
                                isDark
                                  ? "border-white/5 hover:bg-white/[0.02]"
                                  : "border-slate-50 hover:bg-blue-50/30 hover:shadow-sm"
                              }`}
                              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                            >
                              {/* Peserta */}
                              <td
                                className="px-2 sm:px-6 py-3 sm:py-4 cursor-pointer sm:cursor-default w-[55%] sm:w-[32%] min-w-[160px] sm:min-w-[240px]"
                                onClick={() => toggleRow(p.id)}
                              >
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                  <PesertaAvatar nama={p.nama_lengkap} foto={p.file_pas_foto} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <p className={`whitespace-normal break-words leading-tight font-bold text-xs sm:text-sm transition-colors duration-200 ${
                                        isDark
                                          ? "text-slate-200 group-hover:text-[#00A5EC]"
                                          : "text-[#0B1442] group-hover:text-[#004F9F]"
                                      }`}>
                                        {p.nama_lengkap || "-"}
                                      </p>
                                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${expandedRows[p.id] ? "rotate-180 text-[#00A5EC]" : ""}`} />
                                    </div>
                                    {institusi && (
                                      <p className="mt-0.5 flex items-center gap-1 whitespace-normal break-words leading-tight text-[10px] sm:text-[11px] text-slate-400" title={institusi}>
                                        <GraduationCap className="h-3 w-3 shrink-0" /> {institusi}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Bidang */}
                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[15%]">
                                {p.posisi_bidang ? (
                                  <span
                                    className={`group/bdg inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black whitespace-nowrap shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bidangColor.bg} ${bidangColor.text}`}
                                    style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                  >
                                    <Building2 className="h-3.5 w-3.5 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                                    <span>{p.posisi_bidang}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">-</span>
                                )}
                              </td>

                              {/* Nomor surat */}
                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[15%]">
                                {s ? (
                                  <span className={`group/nomor inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                    isDark
                                      ? "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-[#1a202a]"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                  }`}>
                                    <Hash className="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/nomor:scale-110 group-hover/nomor:text-[#004F9F]" />
                                    {s.nomor_surat}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                                    <Hash className="h-3.5 w-3.5" /> —
                                  </span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-2 sm:px-6 py-3 sm:py-4 w-[25%] sm:w-[10%]">
                                {s ? (
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10.5px] font-bold text-emerald-600">
                                    <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span className="hidden sm:inline">Sudah Terbit</span>
                                    <span className="inline sm:hidden">Terbit</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-100 bg-amber-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10.5px] font-bold text-amber-600">
                                    <Clock3 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span className="hidden sm:inline">Belum Terbit</span>
                                    <span className="inline sm:hidden">Belum</span>
                                  </span>
                                )}
                              </td>

                              {/* Tanggal surat */}
                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[12%]">
                                <p className={`group/tgl inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[10.5px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                  isDark
                                    ? "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-[#1a202a]"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                }`}>
                                  <CalendarCheck className="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/tgl:scale-110 group-hover/tgl:text-[#004F9F]" />
                                  {s ? fmtPanjang(s.tanggal_terbit) : "Belum ada"}
                                </p>
                              </td>

                              {/* Status Email — kolom tersendiri */}
                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[11%]">
                                {!s ? (
                                  <span className="text-slate-300">—</span>
                                ) : s.email_terkirim_at ? (
                                  <div className="min-w-0">
                                    <span
                                      title={`Dikirim ke ${s.email_tujuan || "-"}`}
                                      className="group/ml inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md"
                                    >
                                      <MailCheck className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover/ml:scale-110" />
                                      Terkirim
                                    </span>
                                    {s.email_tujuan && (
                                      <p className="mt-1 max-w-[170px] truncate text-[10px] font-medium text-slate-400">
                                        {s.email_tujuan}
                                      </p>
                                    )}
                                    <p className="mt-0.5 text-[9.5px] text-slate-300">{fmtPanjang(s.email_terkirim_at)}</p>
                                  </div>
                                ) : (
                                  <span className="group/ml inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-md">
                                    <MailWarning className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover/ml:scale-110" />
                                    Belum Dikirim
                                  </span>
                                )}
                              </td>

                              {/* Tujuan */}
                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[10%]">
                                {s?.institusi_tujuan ? (
                                  <div className="min-w-0">
                                    <p className={`whitespace-normal break-words text-[11px] font-semibold leading-relaxed ${
                                      isDark ? "text-slate-300" : "text-slate-600"
                                    }`}>{s.institusi_tujuan}</p>
                                    {(s.unit_tujuan || s.kota_tujuan) && (
                                      <p className="mt-0.5 whitespace-normal break-words text-[9px] leading-relaxed text-slate-400">
                                        {[s.unit_tujuan, s.kota_tujuan].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              {/* Aksi */}
                              <td className="px-2 sm:px-6 py-3 sm:py-4 text-right w-[20%] sm:w-[9%]">
                                <div className="flex justify-end">
                                  <SuratActionsDropdown
                                    sudahTerbit={!!s}
                                    sudahDikirim={!!s?.email_terkirim_at}
                                    onEdit={() => setModal(row)}
                                    onDelete={() => handleHapus(row)}
                                    onTerbitkan={() => setModal(row)}
                                    onKirimEmail={() => handleKirimEmail(row)}
                                    isDark={isDark}
                                  />
                                </div>
                              </td>
                            </tr>

                            {/* Mobile Collapsible details row */}
                            <tr className="table-row sm:hidden">
                              <td colSpan={3} className="p-0">
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    expandedRows[p.id]
                                      ? "max-h-[350px] opacity-100 py-3 px-4 border-b border-dashed dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]"
                                      : "max-h-0 opacity-0 p-0 border-none"
                                  }`}
                                >
                                  <div className="space-y-2.5 text-left">
                                    {/* Bidang */}
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bidang</span>
                                      <span
                                        className={`group/bdg inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-black shadow-sm ${bidangColor.bg} ${bidangColor.text}`}
                                        style={isDark ? bidangColor.darkStyle : bidangColor.style}
                                      >
                                        <Building2 className="w-2.5 h-2.5 shrink-0" />
                                        {p.posisi_bidang || "-"}
                                      </span>
                                    </div>
                                    {/* Nomor Surat */}
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nomor Surat</span>
                                      {s ? (
                                        <span className={`group/nomor inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold shadow-sm ${
                                          isDark
                                            ? "border-white/10 bg-[#161b22] text-slate-300"
                                            : "border-slate-200 bg-slate-50 text-slate-600"
                                        }`}>
                                          <Hash className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                          {s.nomor_surat}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-300">—</span>
                                      )}
                                    </div>
                                    {/* Tanggal Surat */}
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Surat</span>
                                      <span className={`group/tgl inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                                        isDark
                                          ? "border-white/10 bg-[#161b22] text-slate-300"
                                          : "border-slate-200 bg-slate-50 text-slate-600"
                                      }`}>
                                        <CalendarCheck className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                        {s ? fmtPanjang(s.tanggal_terbit) : "Belum ada"}
                                      </span>
                                    </div>
                                    {/* Status Email */}
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Email</span>
                                      {!s ? (
                                        <span className="text-[10px] text-slate-300">—</span>
                                      ) : s.email_terkirim_at ? (
                                        <div className="text-right">
                                          <span className="group/ml inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                                            <MailCheck className="h-2.5 w-2.5 shrink-0" />
                                            Terkirim
                                          </span>
                                          <p className="mt-0.5 text-[9px] text-slate-400">{s.email_tujuan}</p>
                                        </div>
                                      ) : (
                                        <span className="group/ml inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 shadow-sm">
                                          <MailWarning className="h-2.5 w-2.5 shrink-0" />
                                          Belum Dikirim
                                        </span>
                                      )}
                                    </div>
                                    {/* Tujuan */}
                                    <div className="flex flex-col gap-1 pt-1.5 border-t border-dashed dark:border-white/5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tujuan Surat</span>
                                      {s?.institusi_tujuan ? (
                                        <div className="pl-1 text-xs">
                                          <p className={`font-bold leading-normal ${isDark ? "text-slate-300" : "text-slate-600"}`}>{s.institusi_tujuan}</p>
                                          {(s.unit_tujuan || s.kota_tujuan) && (
                                            <p className="text-[10px] leading-relaxed text-slate-400">
                                              {[s.unit_tujuan, s.kota_tujuan].filter(Boolean).join(" · ")}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="pl-1 text-[10px] text-slate-300">—</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
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

      {modal && (
        <SuratPenerimaanModal
          pendaftaran={modal.pendaftaran}
          surat={modal.surat}
          onClose={() => setModal(null)}
          onSaved={() => {
            fetchData();
            // email dikirim di background, segarkan sekali lagi setelah selesai
            setTimeout(fetchData, 2500);
            setTimeout(fetchData, 6000);
          }}
          isDark={isDark}
        />
      )}

      {showFilterModal && (
        <SuratFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          kategoriList={kategoriList}
          toggleKategori={toggleKategori}
          opsiBidang={opsiBidang}
          bidangList={bidangList}
          toggleBidang={toggleBidang}
          tglDari={tglDari}
          tglSampai={tglSampai}
          setTglDari={setTglDari}
          setTglSampai={setTglSampai}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
    </AdminLayout>
  );
};

export default SuratPenerimaanPage;