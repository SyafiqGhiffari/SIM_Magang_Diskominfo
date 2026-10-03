import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  GraduationCap,
  Bell,
  AlertCircle,
  X,
  CalendarClock,
  FileCheck2,
  MailCheck,
  Award,
  Globe,
  Info,
  MessageSquareMore,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import {
  getLaporanAkhirMentor,
  kirimPengingatLaporanMentor,
} from "../../services/mentorService";
import { getFileUrl } from "../../utils/fileUrl";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";
import ReviewLaporanModal from "../../components/manajemen/mentor/laporan/ReviewLaporanModal";
import PratinjauLaporanModal from "../../components/manajemen/mentor/laporan/PratinjauLaporanModal";

// Komponen Avatar Peserta Mini
const PesertaAvatarMini = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-white text-xs sm:text-sm font-black shadow-2xs shrink-0">
      {initial}
    </div>
  );
};

const LaporanAkhirMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const navigate = useNavigate();

  const handleBukaPenilaian = (item) => {
    const targetId = item.akun_peserta_id || item.id;
    navigate(`/mentor/penilaian?peserta_id=${targetId}&search=${encodeURIComponent(item.nama_lengkap || "")}`, {
      state: { selectedPesertaId: targetId, autoOpen: true },
    });
  };

  // State Data
  const [list, setList] = useState([]);
  const [stats, setStats] = useState({
    total_peserta: 0,
    menunggu_review: 0,
    disetujui: 0,
    revisi: 0,
    belum_mengunggah: 0,
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("semua"); // "semua" | "menunggu" | "revisi" | "disetujui" | "belum"
  
  // TAMPILAN AWAL: GRID VIEW (Sesuai Permintaan Pengguna)
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal Review & Verifikasi State
  const [selectedPesertaReview, setSelectedPesertaReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Modal Pratinjau PDF State
  const [previewPdfState, setPreviewPdfState] = useState({
    isOpen: false,
    fileUrl: null,
    fileName: "",
    docTitle: "",
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLaporanAkhirMentor();
      const payload = res.data?.data;
      if (payload) {
        setList(payload.laporan || []);
        if (payload.statistik) {
          setStats(payload.statistik);
        }
      }
    } catch (err) {
      console.error(err);
      toastError("Gagal memuat data laporan akhir peserta bimbingan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Filter Data
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      // 1. Filter Search
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(q)) ||
        (item.institusi && item.institusi.toLowerCase().includes(q)) ||
        (item.jurusan && item.jurusan.toLowerCase().includes(q)) ||
        (item.judul_laporan_akhir && item.judul_laporan_akhir.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Filter Tab Status
      if (activeTab === "menunggu") {
        if (item.status_laporan !== "menunggu_review") return false;
      } else if (activeTab === "revisi") {
        if (item.status_laporan !== "revisi") return false;
      } else if (activeTab === "disetujui") {
        if (item.status_laporan !== "disetujui") return false;
      } else if (activeTab === "belum") {
        if (item.status_laporan !== "belum_mengunggah") return false;
      }

      return true; // "semua"
    });
  }, [list, search, activeTab]);

  // Handler Buka Modal Review
  const handleOpenReview = (peserta) => {
    setSelectedPesertaReview(peserta);
    setIsReviewModalOpen(true);
  };

  // Handler Buka Modal Pratinjau PDF
  const handleOpenPreviewPdf = (fileUrl, fileName, docTitle) => {
    setPreviewPdfState({
      isOpen: true,
      fileUrl,
      fileName,
      docTitle,
    });
  };

  const handleClosePreviewPdf = () => {
    setPreviewPdfState((prev) => ({ ...prev, isOpen: false }));
  };

  // Handler Kirim Pengingat ke Peserta
  const handleKirimPengingat = async (peserta) => {
    const result = await confirmDialog({
      title: "Kirim Pengingat Laporan?",
      text: `Kirim notifikasi pengingat ke "${peserta.nama_lengkap}" agar segera mengunggah naskah laporan akhir?`,
      confirmText: "Ya, Kirim Pengingat",
      cancelText: "Batal",
      icon: "question",
      danger: false,
    });
    if (!result?.isConfirmed) return;

    try {
      await kirimPengingatLaporanMentor(peserta.pendaftaran_id);
      toastSuccess(`Pengingat laporan akhir berhasil dikirimkan ke ${peserta.nama_lengkap}.`);
    } catch (err) {
      console.error(err);
      toastError(err?.response?.data?.message || "Gagal mengirimkan pengingat");
    }
  };

  // Handler Ekspor Rekap via ExportDropdown (Excel, CSV, PDF)
  const handleExport = (format) => {
    if (!list.length) {
      toastError("Tidak ada data laporan akhir untuk diekspor");
      return;
    }

    const dataRows = list.map((item, idx) => ({
      no: idx + 1,
      nama: item.nama_lengkap || "-",
      nim_nisn: item.nim_nisn || "-",
      institusi: item.institusi || "-",
      jurusan: item.jurusan || "-",
      bidang: item.posisi_bidang || "-",
      status_laporan:
        item.status_laporan === "disetujui"
          ? "Disetujui"
          : item.status_laporan === "revisi"
          ? "Perlu Revisi"
          : item.status_laporan === "menunggu_review"
          ? "Menunggu Review"
          : "Belum Mengunggah",
      judul: item.judul_laporan_akhir || "-",
      tgl_unggah: item.tanggal_upload_laporan
        ? formatTanggalPresensi(item.tanggal_upload_laporan)
        : "-",
      luaran: item.link_proyek || "-",
      catatan: item.catatan_laporan_akhir || "-",
    }));

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === "excel") {
      const excelRows = dataRows.map((d) => ({
        No: d.no,
        "Nama Peserta": d.nama,
        "NIM / NISN": d.nim_nisn,
        "Asal Institusi": d.institusi,
        Jurusan: d.jurusan,
        Bidang: d.bidang,
        "Status Laporan": d.status_laporan,
        "Judul Laporan": d.judul,
        "Tanggal Unggah": d.tgl_unggah,
        "Tautan Luaran Proyek": d.luaran,
        "Catatan Mentor": d.catatan,
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 16 },
        { wch: 26 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 35 },
        { wch: 20 },
        { wch: 25 },
        { wch: 30 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Akhir Bimbingan");
      XLSX.writeFile(workbook, `rekap-laporan-akhir-mentor-${dateStamp}.xlsx`);
      toastSuccess("Rekap laporan akhir berhasil diekspor ke Excel (.xlsx)");
    } else if (format === "csv") {
      const csvHeaders = [
        "No",
        "Nama Peserta",
        "NIM/NISN",
        "Asal Institusi",
        "Jurusan",
        "Bidang",
        "Status Laporan",
        "Judul Laporan",
        "Tanggal Unggah",
        "Tautan Luaran",
        "Catatan Mentor",
      ];
      const escapeCsv = (val) => {
        const str = String(val ?? "-");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const csvRows = dataRows.map((d) => [
        d.no,
        d.nama,
        d.nim_nisn,
        d.institusi,
        d.jurusan,
        d.bidang,
        d.status_laporan,
        d.judul,
        d.tgl_unggah,
        d.luaran,
        d.catatan,
      ]);
      const csvContent = [csvHeaders, ...csvRows]
        .map((r) => r.map(escapeCsv).join(","))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rekap-laporan-akhir-mentor-${dateStamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toastSuccess("Rekap laporan akhir berhasil diekspor ke CSV (.csv)");
    } else if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(11, 20, 66);
      doc.rect(0, 0, pageWidth, 52, "F");

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("REKAPITULASI VERIFIKASI LAPORAN AKHIR PESERTA MAGANG", 36, 26);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 220, 255);
      doc.text(
        "Dinas Komunikasi dan Informatika · Pembimbing / Mentor Lapangan",
        36,
        42
      );

      const tglCetak = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Dicetak pada: ${tglCetak}  |  Total Peserta: ${stats.total_peserta}  |  Menunggu Review: ${stats.menunggu_review}  |  Disetujui: ${stats.disetujui}  |  Belum Mengunggah: ${stats.belum_mengunggah}`,
        36,
        70
      );

      const tableData = dataRows.map((d) => [
        d.no,
        d.nama,
        d.institusi,
        d.bidang,
        d.status_laporan,
        d.judul,
        d.tgl_unggah,
        d.catatan,
      ]);

      autoTable(doc, {
        startY: 82,
        head: [
          [
            "No",
            "Nama Peserta",
            "Institusi",
            "Bidang",
            "Status",
            "Judul Laporan",
            "Tgl Unggah",
            "Catatan Mentor",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [0, 79, 159], fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 3.5 },
      });

      doc.save(`rekap-laporan-akhir-mentor-${dateStamp}.pdf`);
      toastSuccess("Rekap laporan akhir berhasil diekspor ke PDF (.pdf)");
    }
  };

  // Konfigurasi 3 Kartu Stats (Identik dengan Card Stats Daftar Tugas Role Mentor)
  const statCards = [
    {
      icon: Clock,
      label: "Menunggu Review",
      desktopLabel: "Laporan Menunggu Review",
      value: stats.menunggu_review,
      caption: "Perlu tindakan verifikasi mentor",
      mobileCaption: "Perlu verifikasi",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
      onClick: () => setActiveTab("menunggu"),
    },
    {
      icon: CheckCircle2,
      label: "Disetujui",
      desktopLabel: "Laporan Disetujui",
      value: stats.disetujui,
      caption: "Tervalidasi & siap penilaian akhir",
      mobileCaption: "Tervalidasi",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
      onClick: () => setActiveTab("disetujui"),
    },
    {
      icon: AlertTriangle,
      label: "Belum Unggah",
      desktopLabel: "Belum Mengunggah",
      value: stats.belum_mengunggah,
      caption: `${stats.total_peserta} Total peserta bimbingan`,
      mobileCaption: "Peserta bimbingan",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-blue-500 to-blue-700",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
      onClick: () => setActiveTab("belum"),
    },
  ];

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── HEADER HALAMAN: Bersih, Rapi, Tanpa Tombol Bertumpuk di Header ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Verifikasi Laporan Akhir Magang
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Periksa naskah laporan akhir praktek kerja dan luaran proyek akhir yang diunggah peserta sebelum finalisasi penilaian.
          </p>
        </div>

        {/* ── 3 KARTU STATISTIK (IDENTIK DENGAN HALAMAN DAFTAR TUGAS ROLE MENTOR) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((c, i) => (
            <div
              key={i}
              onClick={c.onClick}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                isDark
                  ? "border-white/10 bg-[#161b22]"
                  : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
              }`}
            >
              <div
                className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                  isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
                }`}
              />
              <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <span className="inline sm:hidden">{c.label}</span>
                    <span className="hidden sm:inline">{c.desktopLabel}</span>
                  </p>
                  <h3 className={`mt-0.5 sm:mt-1.5 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                    {loading ? "..." : c.value}
                  </h3>
                  <p className={`mt-1 sm:mt-1.5 text-[8.5px] sm:text-xs font-medium leading-snug sm:whitespace-normal sm:line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <span className="inline sm:hidden">{c.mobileCaption}</span>
                    <span className="hidden sm:inline">{c.caption}</span>
                  </p>
                </div>
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                  <c.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
            </div>
          ))}
        </div>

        {/* ── TOOLBAR: FILTER STATUS, PENCARIAN, TOGGLE VIEW, & UNDUH REKAP (IDENTIK DENGAN HALAMAN REVIEW TUGAS) ── */}
        <div
          className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all ${
            isDark
              ? "bg-[#161b22] border-white/10 shadow-xs"
              : "bg-white border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Tab Filter Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto xl:overflow-x-visible py-1.5 custom-scrollbar">
              {[
                { key: "semua", label: "Semua", count: stats.total_peserta },
                { key: "menunggu", label: "Perlu Direview", count: stats.menunggu_review },
                { key: "revisi", label: "Perlu Revisi", count: stats.revisi },
                { key: "disetujui", label: "Disetujui", count: stats.disetujui },
                { key: "belum", label: "Belum Unggah", count: stats.belum_mengunggah },
              ].map((tab) => {
                const isAktif = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                            : "bg-[#004F9F] text-white shadow-2xs"
                          : isDark
                          ? "bg-white/10 text-sky-400 border border-white/10"
                          : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sisi Kanan: Search Bar, Toggle View, Tombol Ekspor Rekap */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1.5">
              {/* Search Input dengan Focus Line & Efek Interaktif (Ukuran Kompak) */}
              <div
                className={`group relative flex-1 sm:w-48 md:w-56 sm:flex-initial transition-transform duration-200 ${
                  isSearchFocused ? "scale-[1.005]" : ""
                }`}
              >
                <Search
                  className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 pointer-events-none ${
                    isSearchFocused
                      ? isDark
                        ? "text-[#00A5EC] scale-110"
                        : "text-[#004F9F] scale-110"
                      : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari peserta / judul..."
                  className={`w-full h-7.5 sm:h-8 rounded-xl border pl-8 sm:pl-8.5 pr-7 text-[11px] font-medium outline-hidden transition-all duration-200 ${
                    isDark
                      ? isSearchFocused
                        ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-3 ring-[#00A5EC]/20"
                        : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                      : isSearchFocused
                        ? "border-[#004F9F] bg-white shadow-md ring-3 ring-[#00A5EC]/15 text-slate-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                      isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Hapus Pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                    isSearchFocused ? "w-[calc(100%-10px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                  }`}
                />
              </div>

              {/* Toggle Grid vs Table (Grid aktif pertama / default, ukuran kompak h-7.5 sm:h-8) */}
              <div
                className={`flex items-center h-7.5 sm:h-8 p-0.5 rounded-xl border shrink-0 ${
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-100/70 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Grid Kartu (Default)"
                  aria-label="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Tabel"
                  aria-label="Tampilan Tabel"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tombol Ekspor Multi-Format Menggunakan ExportDropdown (Kompak size="sm") */}
              <div className={`shrink-0 ${filteredList.length === 0 ? "pointer-events-none opacity-50" : ""}`}>
                <ExportDropdown onExport={handleExport} isDark={isDark} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── KONTEN UTAMA: GRID ATAU TABEL ── */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#004F9F] dark:text-[#00A5EC] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Memuat data laporan akhir peserta bimbingan...
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div
            className={`p-12 rounded-3xl border text-center space-y-3 shadow-xs ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              Tidak Ada Laporan Ditemukan
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `Tidak ada data yang cocok dengan kata kunci "${search}".`
                : "Belum ada data laporan akhir untuk kategori filter yang dipilih."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ── TAMPILAN 1: KARTU GRID (DEFAULT - SERAGAM DENGAN DAFTAR TUGAS) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
            {filteredList.map((item, idx) => {
              const isSudahUnggah = Boolean(item.file_laporan_akhir);
              const fileUrl = isSudahUnggah ? getFileUrl(item.file_laporan_akhir) : null;
              const fileName = isSudahUnggah
                ? String(item.file_laporan_akhir).split("/").pop()
                : "naskah-laporan.pdf";
              const linkProyekValid = item.link_proyek
                ? item.link_proyek.startsWith("http")
                  ? item.link_proyek
                  : `https://${item.link_proyek}`
                : null;

              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
                  className={`animate-[fadeslide_0.3s_cubic-bezier(0.16,1,0.3,1)_both] group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5.5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    item.status_laporan === "disetujui"
                      ? "border-emerald-200/90 dark:border-emerald-800/40 bg-gradient-to-br from-white via-white to-emerald-50/20 dark:from-[#161b22] dark:to-emerald-950/20 hover:border-emerald-400"
                      : item.status_laporan === "revisi"
                      ? "border-rose-200/90 dark:border-rose-800/40 bg-gradient-to-br from-white via-white to-rose-50/20 dark:from-[#161b22] dark:to-rose-950/20 hover:border-rose-400"
                      : item.status_laporan === "menunggu_review"
                      ? "border-amber-200/90 dark:border-amber-800/40 bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-[#161b22] dark:to-amber-950/20 hover:border-amber-400"
                      : isDark
                      ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/30"
                      : "border-slate-200/90 bg-white hover:border-[#004F9F]/30"
                  }`}
                >
                  <div>
                    {/* Header Kartu: Avatar Peserta, Identitas, dan Stack Badge di Pojok Kanan Atas */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <PesertaAvatarMini nama={item.nama_lengkap} foto={item.foto_profil} />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {item.nama_lengkap}
                          </h4>
                          {/* Info Instansi dan Jurusan di bawah nama (tanpa ikon, tanpa bidang) */}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            <span>{item.institusi || "-"}</span>
                            {item.jurusan && (
                              <>
                                <span className="mx-1 text-slate-300 dark:text-slate-600 font-semibold">&bull;</span>
                                <span>{item.jurusan}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Pojok Kanan Atas: Stack Badge Kategori Jenjang & Status Laporan */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {/* Badge Kategori Jenjang (Mahasiswa / Siswa) */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/60 dark:to-slate-900/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                          <GraduationCap className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                          <span>{item.kategori_pendaftar === "mahasiswa" ? "Mahasiswa" : "Siswa SMK"}</span>
                        </span>

                        {/* Badge Status Laporan (Tanpa Animasi Berkedip) */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border ${
                            item.status_laporan === "disetujui"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                              : item.status_laporan === "revisi"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                              : item.status_laporan === "menunggu_review"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                          }`}
                        >
                          {item.status_laporan === "disetujui" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Disetujui</span>
                            </>
                          ) : item.status_laporan === "revisi" ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Perlu Revisi</span>
                            </>
                          ) : item.status_laporan === "menunggu_review" ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Review</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Belum Unggah</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ── KOTAK KONTEN UTAMA ── */}
                    <div
                      className={`mt-3.5 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
                        isDark
                          ? "bg-gradient-to-br from-white/[0.04] to-transparent border-white/10"
                          : "bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white border-slate-200/80 shadow-2xs"
                      }`}
                    >
                      {/* 1. Header Konten: Judul Naskah Laporan Akhir */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                            Judul Laporan Akhir
                          </span>
                          {isSudahUnggah ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 border border-blue-200/80 dark:border-sky-800/40">
                              Naskah Terlampir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
                              Menunggu Pengajuan
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs sm:text-[13px] font-black leading-snug line-clamp-2 ${
                            isSudahUnggah
                              ? isDark ? "text-slate-100" : "text-[#0B1442]"
                              : isDark ? "text-slate-400 italic font-medium" : "text-slate-500 italic font-medium"
                          }`}
                        >
                          {item.judul_laporan_akhir || "Belum ada judul laporan akhir yang diajukan oleh peserta"}
                        </p>
                      </div>

                      {/* 2. Lampiran Berkas & Tautan Luaran Proyek (Dilengkapi Judul Kolom & Pemisah Rapi) */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                            Berkas &amp; Luaran Proyek
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {isSudahUnggah ? (
                            <>
                              {/* 1. File PDF Laporan Akhir (Icon Kembali dengan Style Badge Elegan) */}
                              <button
                                type="button"
                                onClick={() => handleOpenPreviewPdf(fileUrl, fileName, item.judul_laporan_akhir)}
                                className="group/file flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer text-left w-full border-rose-200/90 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/80 via-red-50/30 to-white dark:from-rose-950/25 dark:via-slate-900/40 dark:to-slate-900/60"
                                title={`Klik untuk pratinjau ${fileName}`}
                              >
                                <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 shadow-2xs bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 group-hover/file:scale-105 transition-transform">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="absolute -bottom-1 -right-1 px-0.5 py-0 rounded text-[6.5px] font-black tracking-wider bg-rose-600 text-white shadow-2xs">
                                    PDF
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 group-hover/file:text-rose-600 dark:group-hover/file:text-rose-400 truncate transition-colors">
                                    {fileName}
                                  </p>
                                  <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                    Klik untuk pratinjau berkas
                                  </p>
                                </div>
                              </button>

                              {/* 2. Tautan Luaran Proyek / Portofolio Eksternal */}
                              {linkProyekValid ? (
                                <a
                                  href={linkProyekValid}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/link flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer border-blue-200/90 dark:border-blue-900/40 hover:border-[#004F9F] dark:hover:border-[#00A5EC] bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60"
                                  title={item.link_proyek}
                                >
                                  <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50 shrink-0 shadow-2xs group-hover/link:scale-105 transition-transform">
                                    <Globe className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 group-hover/link:text-[#004F9F] dark:group-hover/link:text-[#00A5EC] truncate transition-colors">
                                      Luaran Proyek Magang
                                    </p>
                                    <p className="text-[9px] sm:text-[9.5px] text-slate-400 group-hover/link:text-[#004F9F]/80 dark:group-hover/link:text-sky-300/80 font-medium truncate mt-0.5">
                                      Buka tautan luaran eksternal
                                    </p>
                                  </div>
                                </a>
                              ) : (
                                <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-dashed border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shadow-2xs h-full">
                                  <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/10 shrink-0 shadow-2xs">
                                    <Globe className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">
                                      Tautan Luaran Proyek
                                    </p>
                                    <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                      Tidak ada luaran dilampirkan
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            /* KONTEN KETIKA BELUM MENGIRIMKAN LAPORAN AKHIR */
                            <>
                              {/* 1. Berkas Naskah Belum Diunggah */}
                              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-dashed border-amber-200/90 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/60 via-orange-50/20 to-white dark:from-amber-950/20 dark:via-slate-900/40 dark:to-slate-900/60 shadow-2xs h-full">
                                <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 shadow-2xs bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="absolute -bottom-1 -right-1 px-0.5 py-0 rounded text-[6.5px] font-black tracking-wider bg-amber-500 text-white shadow-2xs">
                                    PDF
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                    Naskah Laporan Akhir
                                  </p>
                                  <p className="text-[9px] sm:text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold truncate mt-0.5">
                                    Belum diunggah oleh peserta
                                  </p>
                                </div>
                              </div>

                              {/* 2. Tautan Luaran Proyek Belum Dicantumkan */}
                              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-dashed border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shadow-2xs h-full">
                                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/10 shrink-0 shadow-2xs">
                                  <Globe className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">
                                    Tautan Luaran Proyek
                                  </p>
                                  <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                    Belum dicantumkan
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 3. Catatan dari Peserta untuk Mentor (Berada di bawah berkas & luaran) */}
                      {isSudahUnggah ? (
                        <>
                          {item.catatan_laporan_akhir ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px]">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                                <MessageSquareMore className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                                <span>Catatan dari Peserta:</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed bg-white/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-white/5 truncate">
                                "{item.catatan_laporan_akhir}"
                              </p>
                            </div>
                          ) : null}

                          {item.status_laporan === "revisi" && item.catatan_mentor_laporan ? (
                            <div className={`text-[11px] ${item.catatan_laporan_akhir ? "mt-2" : "mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5"}`}>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Arahan Revisi Mentor:</span>
                              </div>
                              <p className="text-rose-700 dark:text-rose-300 italic text-[11px] leading-relaxed bg-rose-50/70 dark:bg-rose-950/25 p-2 rounded-xl border border-rose-200/60 dark:border-rose-800/30 truncate">
                                "{item.catatan_mentor_laporan}"
                              </p>
                            </div>
                          ) : null}

                          {item.status_laporan === "menunggu_review" && item.catatan_mentor_laporan ? (
                            <div className={`text-[11px] ${item.catatan_laporan_akhir ? "mt-2" : "mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5"}`}>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Riwayat Arahan Revisi Sebelumnya:</span>
                              </div>
                              <p className="text-amber-800 dark:text-amber-300 italic text-[11px] leading-relaxed bg-amber-50/70 dark:bg-amber-950/25 p-2 rounded-xl border border-amber-200/60 dark:border-amber-800/30 truncate">
                                "{item.catatan_mentor_laporan}"
                              </p>
                            </div>
                          ) : null}

                          {item.status_laporan === "disetujui" && item.catatan_mentor_laporan ? (
                            <div className={`text-[11px] ${item.catatan_laporan_akhir ? "mt-2" : "mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5"}`}>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Catatan Evaluasi / Pengesahan:</span>
                              </div>
                              <p className="text-emerald-800 dark:text-emerald-300 italic text-[11px] leading-relaxed bg-emerald-50/70 dark:bg-emerald-950/25 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30 truncate">
                                "{item.catatan_mentor_laporan}"
                              </p>
                            </div>
                          ) : null}

                          {!item.catatan_laporan_akhir && item.status_laporan !== "revisi" && !item.catatan_mentor_laporan && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px]">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/30 text-[10.5px] text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <p className="truncate">
                                  {item.status_laporan === "disetujui"
                                    ? "Laporan akhir telah ditinjau dan dinyatakan memenuhi kriteria magang."
                                    : "Naskah telah dikumpulkan dan siap diverifikasi oleh mentor."}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px]">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/30 text-[10.5px] text-amber-800 dark:text-amber-300">
                            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="truncate">
                              Peserta belum mengunggah naskah. Silakan kirimkan pengingat sebelum masa magang selesai.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── FOOTER CARD & AKSI (Konsisten dengan Kelola Penugasan Magang) ── */}
                  <div
                    className={`mt-4 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    {/* Info Tanggal Pengunggahan / Status */}
                    <div className="flex items-center gap-2">
                      {isSudahUnggah ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs bg-slate-50/90 text-slate-600 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10">
                          <CalendarClock className="w-3.5 h-3.5 shrink-0 text-[#004F9F] dark:text-[#00A5EC]" />
                          <span>
                            <span className="text-slate-400 dark:text-slate-400 font-semibold mr-1">Diunggah:</span>
                            <strong className="text-slate-800 dark:text-slate-100 font-black">
                              {item.tanggal_upload_laporan ? formatTanggalPresensi(item.tanggal_upload_laporan) : "Sudah diunggah"}
                            </strong>
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                          <CalendarClock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            <span className="text-amber-600/70 dark:text-amber-400/70 font-semibold mr-1">Status:</span>
                            <strong className="font-black">Menunggu Berkas</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Kanan */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                      {isSudahUnggah ? (
                        <>
                          {/* Tombol Arahkan ke Penilaian Peserta (Hanya saat Disetujui, di sebelah kiri Ubah Verifikasi) */}
                          {item.status_laporan === "disetujui" && (
                            <button
                              type="button"
                              onClick={() => handleBukaPenilaian(item)}
                              className="group/penilaian inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shrink-0"
                              title={`Buka form penilaian 4 pilar untuk ${item.nama_lengkap}`}
                            >
                              <Award className="w-3.5 h-3.5 transition-transform duration-200 group-hover/penilaian:scale-110 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{item.status_penilaian === "sudah_dinilai" ? "Edit Penilaian" : "Beri Penilaian"}</span>
                            </button>
                          )}

                          {/* Tombol Review & Verifikasi */}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(item)}
                            className={`group/rev inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ${
                              item.status_laporan === "disetujui"
                                ? "bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 border border-white/10 hover:shadow-lg"
                                : item.status_laporan === "revisi"
                                ? "border border-rose-300 dark:border-rose-700/60 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
                                : "border border-amber-300 dark:border-amber-700/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 hover:text-amber-800"
                            }`}
                            title="Tinjau dan verifikasi laporan akhir peserta"
                          >
                            {item.status_laporan === "disetujui" ? (
                              <MailCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover/rev:scale-110 shrink-0" />
                            ) : (
                              <FileCheck2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover/rev:scale-110 shrink-0" />
                            )}
                            <span>{item.status_laporan === "disetujui" ? "Ubah Verifikasi" : "Tinjau & Verifikasi"}</span>
                          </button>
                        </>
                      ) : (
                        /* Tombol Kirim Pengingat jika belum mengunggah (Sejajar di sisi kanan) */
                        <button
                          type="button"
                          onClick={() => handleKirimPengingat(item)}
                          className="group/remind inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-800 dark:hover:text-amber-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shrink-0"
                          title="Kirim notifikasi pengingat kepada peserta agar segera mengunggah laporan"
                        >
                          <Bell className="w-3.5 h-3.5 transition-transform duration-200 group-hover/remind:rotate-12 shrink-0" />
                          <span>Kirim Pengingat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TAMPILAN 2: TABEL LIST ── */
          <div
            className={`rounded-3xl border overflow-hidden shadow-xs ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4 sm:px-5">Peserta Bimbingan</th>
                    <th className="py-3.5 px-4">Institusi &amp; Bidang</th>
                    <th className="py-3.5 px-4">Judul &amp; Naskah Laporan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Tgl Unggah</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {filteredList.map((item) => {
                    const fileUrl = item.file_laporan_akhir
                      ? getFileUrl(item.file_laporan_akhir)
                      : null;
                    const fileName = item.file_laporan_akhir
                      ? String(item.file_laporan_akhir).split("/").pop()
                      : "naskah.pdf";
                    const linkProyekValid = item.link_proyek
                      ? item.link_proyek.startsWith("http")
                        ? item.link_proyek
                        : `https://${item.link_proyek}`
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Peserta */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <PesertaAvatarMini
                              nama={item.nama_lengkap}
                              foto={item.foto_profil}
                            />
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 dark:text-white truncate">
                                {item.nama_lengkap}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {item.nim_nisn || "NIM/NISN -"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Institusi */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {item.institusi}
                          </p>
                          <span className="text-[11px] text-slate-400">{item.jurusan}</span>
                        </td>

                        {/* Judul & Naskah */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p
                            className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1"
                            title={item.judul_laporan_akhir || "(Belum mengunggah)"}
                          >
                            {item.judul_laporan_akhir || "(Belum mengunggah)"}
                          </p>
                          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                            {fileUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPreviewPdf(fileUrl, fileName, item.judul_laporan_akhir)
                                }
                                className="group/pdf inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-800/60 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95 text-left shrink-0"
                                title="Klik untuk pratinjau berkas PDF"
                              >
                                <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0 group-hover/pdf:scale-105 transition-transform" />
                                <span className="truncate max-w-[130px]">{fileName}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 italic">
                                Belum ada berkas PDF
                              </span>
                            )}

                            {linkProyekValid && (
                              <a
                                href={linkProyekValid}
                                target="_blank"
                                rel="noreferrer"
                                className="group/luaran inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-200 dark:border-blue-800/60 bg-blue-50 text-[#004F9F] dark:bg-blue-950/40 dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95 shrink-0"
                                title="Buka tautan luaran proyek di tab baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0 group-hover/luaran:scale-105 transition-transform" />
                                <span>Luaran</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.status_laporan === "disetujui"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-300"
                                : item.status_laporan === "revisi"
                                ? "bg-rose-100 text-rose-800 border border-rose-300/80 dark:bg-rose-950/70 dark:text-rose-300"
                                : item.status_laporan === "menunggu_review"
                                ? "bg-amber-100 text-amber-800 border border-amber-300/80 dark:bg-amber-950/70 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {item.status_laporan === "disetujui"
                              ? "Disetujui"
                              : item.status_laporan === "revisi"
                              ? "Perlu Revisi"
                              : item.status_laporan === "menunggu_review"
                              ? "Menunggu Review"
                              : "Belum Unggah"}
                          </span>
                        </td>

                        {/* Tgl Unggah */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.tanggal_upload_laporan
                            ? formatTanggalPresensi(item.tanggal_upload_laporan)
                            : "-"}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {fileUrl ? (
                              <>
                                {item.status_laporan === "disetujui" && (
                                  <button
                                    type="button"
                                    onClick={() => handleBukaPenilaian(item)}
                                    className="group/penilaian inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shrink-0"
                                    title={`Buka form penilaian 4 pilar untuk ${item.nama_lengkap}`}
                                  >
                                    <Award className="w-3.5 h-3.5 transition-transform duration-200 group-hover/penilaian:scale-110 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>{item.status_penilaian === "sudah_dinilai" ? "Edit Nilai" : "Beri Nilai"}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(item)}
                                  className={`group/rev inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200 shrink-0 ${
                                    item.status_laporan === "disetujui"
                                      ? "bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 border border-white/10 hover:shadow-lg"
                                      : "bg-[#004F9F] text-white hover:bg-[#003875]"
                                  }`}
                                  title="Tinjau dan verifikasi laporan akhir peserta"
                                >
                                  {item.status_laporan === "disetujui" ? (
                                    <MailCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover/rev:scale-110 shrink-0" />
                                  ) : (
                                    <FileCheck2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover/rev:scale-110 shrink-0" />
                                  )}
                                  <span>{item.status_laporan === "disetujui" ? "Ubah" : "Review"}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleKirimPengingat(item)}
                                className="group/remind inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shrink-0"
                                title="Kirim pengingat kepada peserta agar segera mengunggah naskah laporan"
                              >
                                <Bell className="w-3.5 h-3.5 transition-transform duration-200 group-hover/remind:rotate-12 shrink-0" />
                                <span>Ingatkan</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: REVIEW & VERIFIKASI LAPORAN */}
        <ReviewLaporanModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          peserta={selectedPesertaReview}
          onSuccess={fetchData}
          onOpenPreviewPdf={handleOpenPreviewPdf}
          isDark={isDark}
        />

        {/* MODAL 2: PRATINJAU DOKUMEN PDF (CANVAS VIEWER) */}
        <PratinjauLaporanModal
          isOpen={previewPdfState.isOpen}
          onClose={handleClosePreviewPdf}
          fileUrl={previewPdfState.fileUrl}
          fileName={previewPdfState.fileName}
          docTitle={previewPdfState.docTitle}
        />
      </div>
    </MentorLayout>
  );
};

export default LaporanAkhirMentorPage;
