import { useEffect, useState } from "react";
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
        className="h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[10px] font-black text-white shadow-sm transition-all duration-300 group-hover:scale-110">
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

const SuratPenerimaanPage = () => {
  const { isDark } = useManajemenTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fokus, setFokus] = useState(false);
  const [sortBy, setSortBy] = useState("status");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [statusList, setStatusList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [appliedKategoriList, setAppliedKategoriList] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [appliedBidangList, setAppliedBidangList] = useState([]);
  const [tglDari, setTglDari] = useState("");
  const [tglSampai, setTglSampai] = useState("");
  const [appliedTgl, setAppliedTgl] = useState({ dari: "", sampai: "" });
  const [showFilterModal, setShowFilterModal] = useState(false);

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
    (appliedStatusList.length > 0 ? 1 : 0) +
    (appliedKategoriList.length > 0 ? 1 : 0) +
    (appliedBidangList.length > 0 ? 1 : 0) +
    (appliedTgl.dari || appliedTgl.sampai ? 1 : 0);

  const kartu = [
    {
      icon: Users,
      label: "Peserta Diterima",
      value: totalPeserta,
      caption: "Pendaftar berstatus diterima",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: MailCheck,
      label: "Surat Terbit",
      value: totalTerbit,
      caption: "Surat penerimaan sudah dibuat",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: FileWarning,
      label: "Belum Terbit",
      value: jumlahBelum,
      caption: "Menunggu diterbitkan admin",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: CalendarCheck,
      label: "Terbit Bulan Ini",
      value: terbitBulanIni,
      caption: `Periode ${kini.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      lightGradient: "from-sky-300 to-white",
      gradient: "from-sky-500 to-sky-700",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
  ];

  const headerCols = ["Peserta", "Bidang", "Nomor Surat", "Status", "Tanggal Surat", "Status Email", "Tujuan"];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Surat Penerimaan Magang
          </h2>
          <p className={`mt-1.5 max-w-5xl text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Terbitkan surat penerimaan untuk peserta yang sudah diterima. Nomor surat diisi manual mengikuti
            penomoran internal instansi, sedangkan data peserta terisi otomatis dari berkas pendaftaran. Kop,
            redaksi, dan tata letak PDF mengikuti template yang dipilih.
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {kartu.map((c, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5`}
                >
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:scale-125 group-hover:opacity-[0.4]`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold tracking-wide text-slate-500 sm:text-sm">{c.label}</p>
                      <h3 className="mt-1 text-2xl font-black tracking-tight text-[#0B1442] sm:mt-1.5 sm:text-4xl">{c.value}</h3>
                      <p className="mt-1.5 text-[10px] font-medium leading-snug text-slate-400 sm:mt-2 sm:text-xs">{c.caption}</p>
                    </div>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 sm:h-9 sm:w-9 ${c.iconBg} ${c.iconColor}`}>
                      <c.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {jumlahBelum > 0 && (
              <div className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/60 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
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
                      <h4 className="text-sm font-black text-amber-900">Surat penerimaan menunggu diterbitkan</h4>
                      <p className="mt-0.5 max-w-2xl text-[11.5px] font-medium leading-relaxed text-amber-700/90">
                        {jumlahBelum} dari {totalPeserta} peserta yang sudah diterima belum memiliki surat penerimaan.
                        Terbitkan suratnya agar berkas peserta lengkap.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-amber-200/70 sm:w-48">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700 ease-out"
                            style={{ width: `${totalPeserta ? Math.round((totalTerbit / totalPeserta) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-[10.5px] font-black text-amber-700">
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

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {/* Header card */}
              <div className="flex flex-col gap-4 px-4 pb-5 pt-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <FileSignature className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Daftar Surat Penerimaan</h3>
                    <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-400">
                      Total {totalPeserta} peserta diterima · {totalTerbit} surat terbit · {jumlahBelum} belum terbit.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 sm:self-start">
                  <ExportDropdown onExport={handleExport} />
                </div>
              </div>

              {/* Toolbar: Urutkan — Filter — Pencarian */}
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <SuratSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                  <button
                    onClick={openFilter}
                    className="group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
                  >
                    <FilterIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] px-1 text-[9.5px] font-black text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className={`relative w-full shrink-0 transition-transform duration-200 sm:w-64 ${fokus ? "sm:scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-all duration-200 ${fokus ? "scale-110 text-[#004F9F]" : "text-slate-400"}`} />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    onFocus={() => setFokus(true)}
                    onBlur={() => setFokus(false)}
                    placeholder="Cari nama, nomor surat, bidang..."
                    className={`w-full rounded-xl border py-2.5 pl-9 pr-9 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                      fokus
                        ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
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

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-[13px]">
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
                        <td colSpan={8} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="h-6 w-6" />
                              <span className="absolute inset-0 animate-ping rounded-2xl border-2 border-slate-200 opacity-40" />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-500">Belum ada data yang sesuai</p>
                              <p className="mt-0.5 text-xs text-slate-400">
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
                        return (
                          <tr
                            key={`${p.id}-${s?.id ?? "belum"}`}
                            className="group animate-[fadeslide_0.3s_ease-out] border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm"
                            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                          >
                            {/* Peserta */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <PesertaAvatar nama={p.nama_lengkap} foto={p.file_pas_foto} />
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-[#0B1442] transition-colors duration-200 group-hover:text-[#004F9F]">
                                    {p.nama_lengkap || "-"}
                                  </p>
                                  {institusi && (
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400" title={institusi}>
                                      <GraduationCap className="h-3 w-3 shrink-0" /> {institusi}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Bidang */}
                            <td className="px-6 py-4">
                              <span className="group/bdg inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/30 hover:shadow-md">
                                <Building2 className="h-3.5 w-3.5 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                                {p.posisi_bidang || "-"}
                              </span>
                            </td>

                            {/* Nomor surat */}
                            <td className="px-6 py-4">
                              {s ? (
                                <span className="group/nomor inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md">
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
                            <td className="px-6 py-4">
                              {s ? (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-600">
                                  <CheckCircle2 className="h-3 w-3" /> Sudah Terbit
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-600">
                                  <Clock3 className="h-3 w-3" /> Belum Terbit
                                </span>
                              )}
                            </td>

                            {/* Tanggal surat */}
                            <td className="px-6 py-4">
                              <p className="group/tgl inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md">
                                <CalendarCheck className="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-300 group-hover/tgl:scale-110 group-hover/tgl:text-[#004F9F]" />
                                {s ? fmtPanjang(s.tanggal_terbit) : "Belum ada"}
                              </p>
                            </td>

                            {/* Status Email — kolom tersendiri */}
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4">
                              {s?.institusi_tujuan ? (
                                <div className="min-w-0">
                                  <p className="whitespace-normal break-words text-[11px] font-semibold leading-relaxed text-slate-600">{s.institusi_tujuan}</p>
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
                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <SuratActionsDropdown
                                  sudahTerbit={!!s}
                                  sudahDikirim={!!s?.email_terkirim_at}
                                  onEdit={() => setModal(row)}
                                  onDelete={() => handleHapus(row)}
                                  onTerbitkan={() => setModal(row)}
                                  onKirimEmail={() => handleKirimEmail(row)}
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
        />
      )}
    </AdminLayout>
  );
};

export default SuratPenerimaanPage;