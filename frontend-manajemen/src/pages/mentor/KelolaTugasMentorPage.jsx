import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  ClipboardList,
  BookPlus,
  Clock,
  Users,
  Search,
  X,
  Trash2,
  Pencil,
  CheckCircle2,
  CalendarClock,
  FileCheck2,
  Globe,
  FileText,
  Target,
  FilePenLine,
  NotebookPen,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  getTugasMentor,
  deleteTugasMentor,
  getPesertaBimbinganTugas
} from "../../services/pembelajaranService";
import { PilihTipeTugasModal } from "../../components/manajemen/mentor/tugas/PilihTipeTugasModal";
import { FormTugasProyekModal } from "../../components/manajemen/mentor/tugas/FormTugasProyekModal";
import { FormTugasKuisModal } from "../../components/manajemen/mentor/tugas/FormTugasKuisModal";
import { FormKuisSoalModal } from "../../components/manajemen/mentor/tugas/FormKuisSoalModal";
import { CustomSelectDropdown } from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";
import { getFileUrl } from "../../utils/fileUrl";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";

// Komponen Avatar / Inisial Mini Peserta (Identik dengan Halaman Materi)
const PesertaMiniFoto = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-5 w-5 rounded-full object-cover shrink-0 border border-slate-200/80 dark:border-white/20 shadow-2xs"
      />
    );
  }

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-[8.5px] font-black text-white shadow-xs">
      {initial}
    </span>
  );
};

// Helper Format & Tema Berkas Lampiran (Identik dengan Halaman Materi)
const getFileExtInfo = (filePath) => {
  if (!filePath) {
    return {
      ext: "FILE",
      label: "Berkas Lampiran",
      badgeColor: "bg-slate-700 text-white",
      iconTile: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
      cardBorder: "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      cardBg: "bg-gradient-to-r from-slate-50/80 via-slate-50/40 to-white dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/60",
      textHover: "group-hover/file:text-slate-900 dark:group-hover/file:text-slate-100",
      btnTheme: "text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/40",
    };
  }

  const ext = filePath.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    return {
      ext: "PDF",
      label: "Dokumen PDF",
      badgeColor: "bg-rose-600 text-white",
      iconTile: "bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50",
      cardBorder: "border-rose-200/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700",
      cardBg: "bg-gradient-to-r from-rose-50/80 via-red-50/30 to-white dark:from-rose-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-rose-600 dark:group-hover/file:text-rose-400",
      btnTheme: "text-rose-600 dark:text-rose-400 border-rose-200/90 dark:border-rose-800/40 hover:border-rose-400 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/30",
    };
  }

  if (["doc", "docx"].includes(ext)) {
    return {
      ext: "DOC",
      label: "Dokumen Word",
      badgeColor: "bg-blue-600 text-white",
      iconTile: "bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50",
      cardBorder: "border-blue-200/90 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700",
      cardBg: "bg-gradient-to-r from-blue-50/80 via-indigo-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-[#004F9F] dark:group-hover/file:text-sky-400",
      btnTheme: "text-[#004F9F] dark:text-[#00A5EC] border-blue-200/90 dark:border-blue-800/40 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
    };
  }

  if (["ppt", "pptx"].includes(ext)) {
    return {
      ext: "PPT",
      label: "Slide Presentasi",
      badgeColor: "bg-amber-600 text-white",
      iconTile: "bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50",
      cardBorder: "border-amber-200/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700",
      cardBg: "bg-gradient-to-r from-amber-50/80 via-orange-50/30 to-white dark:from-amber-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-amber-600 dark:group-hover/file:text-amber-400",
      btnTheme: "text-amber-600 dark:text-amber-400 border-amber-200/90 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
    };
  }

  if (["xls", "xlsx"].includes(ext)) {
    return {
      ext: "XLS",
      label: "Lembar Spreadsheet",
      badgeColor: "bg-emerald-600 text-white",
      iconTile: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50",
      cardBorder: "border-emerald-200/90 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700",
      cardBg: "bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-white dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-emerald-600 dark:group-hover/file:text-emerald-400",
      btnTheme: "text-emerald-600 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
    };
  }

  if (["zip", "rar", "7z"].includes(ext)) {
    return {
      ext: "ZIP",
      label: "Arsip Kompresi",
      badgeColor: "bg-purple-600 text-white",
      iconTile: "bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/50",
      cardBorder: "border-purple-200/90 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700",
      cardBg: "bg-gradient-to-r from-purple-50/80 via-indigo-50/30 to-white dark:from-purple-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-purple-600 dark:group-hover/file:text-purple-400",
      btnTheme: "text-purple-600 dark:text-purple-400 border-purple-200/90 dark:border-purple-800/40 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/30",
    };
  }

  return {
    ext: ext.toUpperCase() || "FILE",
    label: "Berkas Lampiran",
    badgeColor: "bg-sky-600 text-white",
    iconTile: "bg-sky-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-sky-200/80 dark:border-sky-800/50",
    cardBorder: "border-sky-200/90 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-700",
    cardBg: "bg-gradient-to-r from-sky-50/80 via-blue-50/30 to-white dark:from-sky-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
    textHover: "group-hover/file:text-[#00A5EC]",
    btnTheme: "text-[#004F9F] dark:text-[#00A5EC] border-sky-200/90 dark:border-sky-800/40 hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/30",
  };
};

const DEADLINE_OPTIONS = [
  { value: "semua", label: "Semua Status Tenggat" },
  { value: "aktif", label: "Aktif / Berjalan" },
  { value: "mendekati", label: "Mendekati Deadline (≤ 2 Hari)" },
  { value: "berakhir", label: "Lewat Tenggat Waktu" },
  { value: "tanpa_deadline", label: "Tanpa Deadline" },
];

const TARGET_OPTIONS = [
  { value: "semua", label: "Semua Sasaran Bimbingan" },
  { value: "semua_bimbingan", label: "Seluruh Bimbingan" },
  { value: "spesifik", label: "Peserta Tertentu" },
];

const TIPE_OPTIONS = [
  { value: "semua", label: "Semua Tipe Tugas" },
  { value: "proyek", label: "Tugas Proyek" },
  { value: "kuis", label: "Tugas Kuis" },
];

const KelolaTugasMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const navigate = useNavigate();

  // Data State
  const [tugasList, setTugasList] = useState([]);
  const [pesertaBimbingan, setPesertaBimbingan] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterTipe, setFilterTipe] = useState("semua"); // "semua" | "proyek" | "kuis"
  const [filterDeadline, setFilterDeadline] = useState("semua"); // "semua" | "aktif" | "mendekati" | "berakhir"
  const [filterTarget, setFilterTarget] = useState("semua"); // "semua" | "semua_bimbingan" | "spesifik"

  // Modal Form State (Pemisahan Penugasan Proyek & Kuis Interaktif)
  const [pilihTipeOpen, setPilihTipeOpen] = useState(false);
  const [proyekModalOpen, setProyekModalOpen] = useState(false);
  const [kuisInfoModalOpen, setKuisInfoModalOpen] = useState(false);
  const [kuisSoalModalOpen, setKuisSoalModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);

  // Draft Data Kuis (Pemisahan 2 Tahap: Info & Soal)
  const [kuisDraft, setKuisDraft] = useState(null);
  const [kuisConfig, setKuisConfig] = useState({
    durasi_menit: 30,
    kkm: 75,
    izinkan_remidi: true,
    maks_percobaan: 2,
    daftar_soal: [],
  });

  // Stats Server
  const [statsData, setStatsData] = useState({
    total_tugas: 0,
    tugas_aktif: 0,
    menunggu_review: 0,
    perlu_revisi: 0,
    selesai_dinilai: 0,
    total_bimbingan: 0,
  });

  // Muat data penugasan
  const muatData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      const [resTugas, resPeserta] = await Promise.all([
        getTugasMentor(),
        getPesertaBimbinganTugas(),
      ]);

      const dataTugas = resTugas.data?.data || {};
      setTugasList(dataTugas.tugas || []);
      setStatsData({
        total_tugas: dataTugas.total_tugas || 0,
        tugas_aktif: dataTugas.tugas_aktif || 0,
        menunggu_review: dataTugas.menunggu_review || 0,
        perlu_revisi: dataTugas.perlu_revisi || 0,
        selesai_dinilai: dataTugas.selesai_dinilai || 0,
        total_bimbingan: dataTugas.total_bimbingan || 0,
      });

      setPesertaBimbingan(resPeserta.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat data tugas:", err);
      toastError("Gagal memuat daftar penugasan magang");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      muatData();
    }, 0);
    return () => clearTimeout(id);
  }, [muatData]);

  // 1. Klik "+ Buat Tugas Baru" -> Buka modal pemilih model penugasan
  const bukaModalTambah = () => {
    setIsEditing(false);
    setSelectedTugas(null);
    setKuisDraft(null);
    setKuisConfig({
      durasi_menit: 30,
      kkm: 75,
      izinkan_remidi: true,
      maks_percobaan: 2,
      daftar_soal: [],
    });
    setPilihTipeOpen(true);
  };

  // 2. Pilih Tipe Penugasan dari Modal Pemilih ("proyek" | "kuis")
  const handlePilihTipeTugas = (tipe) => {
    setPilihTipeOpen(false);
    if (tipe === "proyek" || tipe === "berkas") {
      setProyekModalOpen(true);
    } else if (tipe === "kuis") {
      setKuisInfoModalOpen(true);
    }
  };

  // 3. Buka Modal Edit Tugas (Otomatis mendeteksi tipe kuis atau proyek mandiri)
  const bukaModalEdit = (t) => {
    setIsEditing(true);
    setSelectedTugas(t);
    if (t.tipe_tugas === "kuis") {
      let parsedConfig = {
        durasi_menit: 30,
        kkm: 75,
        izinkan_remidi: true,
        maks_percobaan: 2,
        daftar_soal: [],
      };
      if (t.kuis_data) {
        try {
          const meta =
            typeof t.kuis_data === "string"
              ? JSON.parse(t.kuis_data)
              : t.kuis_data;
          parsedConfig = {
            durasi_menit: meta.durasi_menit ?? 30,
            kkm: meta.kkm ?? 75,
            izinkan_remidi: meta.izinkan_remidi ?? true,
            maks_percobaan: meta.maks_percobaan ?? 2,
            daftar_soal: meta.daftar_soal || [],
          };
        } catch (e) {
          console.error("Gagal parse kuis_data:", e);
        }
      }
      setKuisConfig(parsedConfig);
      setKuisDraft(null);
      setKuisInfoModalOpen(true);
    } else {
      setProyekModalOpen(true);
    }
  };

  // 4. Lanjut dari Modal Info Kuis (Tahap 1) ke Modal Soal Kuis (Tahap 2)
  const handleLanjutKeSoalKuis = (dataInfo) => {
    setKuisDraft(dataInfo);
    setKuisInfoModalOpen(false);
    setKuisSoalModalOpen(true);
  };

  // 5. Kembali dari Modal Soal Kuis ke Modal Info Kuis
  const handleKembaliKeInfoKuis = () => {
    setKuisSoalModalOpen(false);
    setKuisInfoModalOpen(true);
  };

  // Eksekusi hapus tugas menggunakan confirmDialog dari SweetAlert2 (swal)
  const handleHapusTugas = async (t) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus Penugasan Magang?",
      text: `Tugas "${t.judul}" beserta seluruh data riwayat pengumpulan, berkas, dan nilai peserta terkait akan dihapus secara permanen.`,
      confirmText: "Ya, Hapus Tugas",
      cancelText: "Batal",
      danger: true,
      icon: "warning",
    });

    if (!konfirmasi.isConfirmed) return;

    try {
      await deleteTugasMentor(t.id);
      toastSuccess(`Tugas "${t.judul}" berhasil dihapus`);
      muatData(true);
      window.dispatchEvent(new Event("sim_notifikasi_updated"));
    } catch (err) {
      console.error("Gagal menghapus tugas:", err);
      const msg = err.response?.data?.message || "Gagal menghapus penugasan";
      toastError(msg);
    }
  };

  // Navigasi cepat ke review pengumpulan tugas
  const handleReviewTugas = (tugasId) => {
    navigate(`/mentor/tugas/review?tugas_id=${tugasId}`);
  };

  // Filter daftar tugas
  const filteredTugas = useMemo(() => {
    return tugasList.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.judul?.toLowerCase().includes(q) ||
        t.deskripsi?.toLowerCase().includes(q) ||
        t.target_peserta_info?.nama_peserta?.toLowerCase().includes(q);

      const matchDeadline =
        filterDeadline === "semua" || t.status_deadline === filterDeadline;

      const matchTarget =
        filterTarget === "semua" ||
        (filterTarget === "semua_bimbingan" && t.target_peserta_info?.tipe === "semua_bimbingan") ||
        (filterTarget === "spesifik" && t.target_peserta_info?.tipe === "spesifik");

      const matchTipe =
        filterTipe === "semua" ||
        (filterTipe === "kuis" && t.tipe_tugas === "kuis") ||
        (filterTipe === "proyek" && t.tipe_tugas !== "kuis");

      return matchSearch && matchDeadline && matchTarget && matchTipe;
    });
  }, [tugasList, search, filterDeadline, filterTarget, filterTipe]);

  // 3 Metric Stat Cards Konsisten dengan Halaman Materi Pembelajaran
  const statCards = [
    {
      icon: ClipboardList,
      label: "Total Tugas",
      desktopLabel: "Total Tugas Magang",
      value: statsData.total_tugas,
      caption: `${statsData.total_bimbingan} Peserta bimbingan`,
      mobileCaption: `${statsData.total_bimbingan} Peserta`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: Clock,
      label: "Tugas Aktif",
      desktopLabel: "Tugas Aktif Berjalan",
      value: statsData.tugas_aktif,
      caption: "Belum melewati deadline",
      mobileCaption: "Aktif berjalan",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: FileCheck2,
      label: "Perlu Review",
      desktopLabel: "Perlu Dinilai & Review",
      value: statsData.menunggu_review,
      caption: `${statsData.perlu_revisi} Revisi · ${statsData.selesai_dinilai} Selesai`,
      mobileCaption: `${statsData.perlu_revisi} Rev · ${statsData.selesai_dinilai} Selesai`,
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
  ];

  // Format tanggal deadline
  const formatDeadlineText = (dateStr) => {
    if (!dateStr) return "Tanpa Tenggat Waktu";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── HEADER HALAMAN: Clear, bersih, tanpa tombol bertumpuk ── */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Kelola Penugasan Magang
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Rancang, publikasikan, dan jadwalkan penugasan kerja proyek guna mengasah dan menguji capaian kompetensi peserta bimbingan secara terstruktur.
          </p>
        </div>

        {/* ── 3 KARTU STATISTIK KONSISTEN DENGAN MATERI PEMBELAJARAN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((c, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
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

        {/* ── TOOLBAR PENCARIAN, FILTER & AKSI (IDENTIK DENGAN MATERI PEMBELAJARAN) ── */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border space-y-3.5 shadow-xs transition-all duration-300 ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Baris Pencarian & Kontrol Aksi Terpadu */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Input Pencarian dengan Animasi Focus Line Bawah & Icon Active */}
            <div
              className={`group relative flex-1 shrink-0 transition-transform duration-200 ${
                isSearchFocused ? "scale-[1.005]" : ""
              }`}
            >
              <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 transition-all duration-200 pointer-events-none ${
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
                placeholder="Cari judul tugas, petunjuk tugas, atau nama peserta..."
                className={`w-full h-9 sm:h-[38px] rounded-xl border pl-9 sm:pl-10 pr-9 text-[11px] sm:text-xs font-medium outline-hidden transition-all duration-200 ${
                  isDark
                    ? isSearchFocused
                      ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-4 ring-[#00A5EC]/20"
                      : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                    : isSearchFocused
                      ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15 text-slate-700"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                    isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Hapus Pencarian"
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

            {/* Filter Dropdown & Aksi Button */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Custom Dropdown Filter Tipe Tugas (Proyek / Kuis) */}
              <CustomSelectDropdown
                value={filterTipe}
                onChange={setFilterTipe}
                options={TIPE_OPTIONS}
                icon={SlidersHorizontal}
                isDark={isDark}
                menuWidth={185}
              />

              {/* Custom Dropdown Filter Status Tenggat */}
              <CustomSelectDropdown
                value={filterDeadline}
                onChange={setFilterDeadline}
                options={DEADLINE_OPTIONS}
                icon={Clock}
                isDark={isDark}
                menuWidth={225}
              />

              {/* Custom Dropdown Filter Sasaran Target */}
              <CustomSelectDropdown
                value={filterTarget}
                onChange={setFilterTarget}
                options={TARGET_OPTIONS}
                icon={Users}
                isDark={isDark}
                menuWidth={205}
              />

              {/* Tombol Buat Tugas Baru */}
              <button
                type="button"
                onClick={bukaModalTambah}
                className="group/btn relative inline-flex h-9 sm:h-[38px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0"
              >
                <BookPlus className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-115 shrink-0" />
                <span>Buat Tugas Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── DAFTAR KARTU PENUGASAN (CARDS GRID) ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat data penugasan magang...</p>
          </div>
        ) : filteredTugas.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center gap-3 py-20 text-center rounded-3xl border shadow-xs animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both] ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC]">
              <ClipboardList className="w-7 h-7" />
            </span>
            <div className="max-w-sm space-y-1">
              <p className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                Belum ada penugasan magang yang cocok
              </p>
              <p className="text-xs text-slate-400">
                {search || filterDeadline !== "semua" || filterTarget !== "semua" || filterTipe !== "semua"
                  ? "Coba sesuaikan kata kunci pencarian atau ganti filter tipe tugas/status tenggat/sasaran."
                  : "Mulai buat tugas proyek pertama untuk menguji kompetensi peserta bimbingan Anda."}
              </p>
            </div>
            <button
              type="button"
              onClick={bukaModalTambah}
              className="group/btn relative inline-flex h-9 sm:h-[38px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0 mt-2"
            >
              <BookPlus className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-115 shrink-0" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
            {filteredTugas.map((t, idx) => {
              const summary = t.pengumpulan_summary || {};
              const targetInfo = t.target_peserta_info || {};
              const isBerakhir = t.status_deadline === "berakhir";
              const isMendekati = t.status_deadline === "mendekati";
              const isKuis = t.tipe_tugas === "kuis";

              let kuisMeta = null;
              if (isKuis && t.kuis_data) {
                try {
                  kuisMeta =
                    typeof t.kuis_data === "string"
                      ? JSON.parse(t.kuis_data)
                      : t.kuis_data;
                } catch {
                  kuisMeta = null;
                }
              }

              // Resolusi Peserta Penerima Tugas (Identik dengan Kolom Konten di Halaman Materi)
              const isSpesifik = t.target_peserta === "spesifik";
              let daftarPenerima = [];
              if (isSpesifik) {
                if (t.peserta_akses && t.peserta_akses.length > 0) {
                  daftarPenerima = t.peserta_akses;
                } else if (t.peserta) {
                  daftarPenerima = [t.peserta];
                } else if (t.peserta_id) {
                  const found = pesertaBimbingan.find((pb) => pb.id === t.peserta_id);
                  if (found) daftarPenerima = [found];
                }
              } else if (t.target_jenjang && t.target_jenjang !== "semua") {
                const targetJ = t.target_jenjang.toLowerCase();
                const filtered = pesertaBimbingan.filter(
                  (pb) => (pb.kategori_pendaftar || "").toLowerCase() === targetJ
                );
                daftarPenerima = filtered.length > 0 ? filtered : pesertaBimbingan;
              } else if (t.target_peserta === "mahasiswa") {
                const filtered = pesertaBimbingan.filter(
                  (pb) => (pb.kategori_pendaftar || "").toLowerCase() === "mahasiswa"
                );
                daftarPenerima = filtered.length > 0 ? filtered : pesertaBimbingan;
              } else if (t.target_peserta === "siswa") {
                const filtered = pesertaBimbingan.filter(
                  (pb) => (pb.kategori_pendaftar || "").toLowerCase() === "siswa"
                );
                daftarPenerima = filtered.length > 0 ? filtered : pesertaBimbingan;
              } else {
                daftarPenerima = pesertaBimbingan;
              }

              const totalTarget = targetInfo.total_target || (isSpesifik ? daftarPenerima.length : pesertaBimbingan.length) || 1;
              const kumpulCount = summary.total_mengumpulkan || 0;
              const persentase = targetInfo.total_target
                ? Math.round(summary.persentase_kumpul || 0)
                : Math.round((kumpulCount / Math.max(1, totalTarget)) * 100);

              return (
                <div
                  key={t.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
                  className={`animate-[fadeslide_0.3s_cubic-bezier(0.16,1,0.3,1)_both] group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5.5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    isDark
                      ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/30"
                      : "border-slate-200/90 bg-white hover:border-[#004F9F]/30"
                  }`}
                >
                  <div>
                    {/* Header Card: Ikon (FilePenLine untuk Proyek, NotebookPen untuk Kuis) + Judul + Sub Judul */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-105 bg-gradient-to-br from-[#0B1442] to-[#00A5EC] shadow-blue-500/20">
                          {isKuis ? (
                            <NotebookPen className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.2} />
                          ) : (
                            <FilePenLine className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.2} />
                          )}
                        </span>

                        <div className="min-w-0">
                          <h3
                            className={`text-sm sm:text-base font-black truncate sm:whitespace-normal line-clamp-2 ${
                              isDark ? "text-slate-100" : "text-[#0B1442]"
                            }`}
                            title={t.judul}
                          >
                            {t.judul}
                          </h3>

                          {/* Tulisan Instruksi Pengerjaan Sebagai Sub Judul Kolom Konten */}
                          {t.deskripsi && (
                            <p
                              className="text-[10px] sm:text-xs text-slate-400 leading-tight line-clamp-2 mt-0.5"
                              title={t.deskripsi}
                            >
                              {t.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badge Tipe Tugas & Tenggat Waktu / Sisa Hari di Kanan Atas */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {/* Badge Tipe Tugas (Di atas badge sisa hari) */}
                        {isKuis ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/60 dark:to-slate-900/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                            <NotebookPen className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                            <span>Tugas Kuis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/60 dark:to-slate-900/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                            <FilePenLine className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                            <span>Tugas Proyek</span>
                          </span>
                        )}

                        {/* Badge Tenggat Waktu / Sisa Hari */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border ${
                            isBerakhir
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                              : isMendekati
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 animate-pulse"
                              : t.status_deadline === "aktif"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {isBerakhir
                              ? "Lewat Tenggat"
                              : isMendekati
                              ? `Sisa ${t.sisa_hari !== null ? Math.max(1, t.sisa_hari) : ""} Hari`
                              : t.sisa_hari !== null
                              ? `Sisa ${t.sisa_hari} Hari`
                              : "Fleksibel"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Kotak Seluruh Peserta Bimbingan (Memiliki Wadah Kotak Sendiri Seperti Kolom Progres Pengumpulan) */}
                    {daftarPenerima.length > 0 && (
                      <div
                        className={`mt-3.5 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
                          isDark
                            ? "bg-gradient-to-br from-white/[0.04] to-transparent border-white/10"
                            : "bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white border-slate-200/80 shadow-2xs"
                        }`}
                      >
                        {/* Header Kotak Peserta: Ikon + Label + Badge Jumlah Peserta */}
                        <div className="flex items-center justify-between gap-2 text-xs mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                              <Users className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                              {isSpesifik
                                ? "Peserta Sasaran Khusus:"
                                : "Seluruh Peserta Bimbingan:"}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0">
                            <span className="font-bold text-[#004F9F] dark:text-[#00A5EC] text-[10px] sm:text-[10.5px]">
                              {daftarPenerima.length} Peserta
                            </span>
                          </div>
                        </div>

                        {/* List Avatar/Chip Peserta */}
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 pt-0.5">
                          {daftarPenerima.map((p) => {
                            const matchingPb = pesertaBimbingan.find((pb) => pb.id === p.id);
                            const fotoPeserta = p.foto_profil || matchingPb?.foto_profil || "";
                            return (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-[#004F9F] hover:text-[#004F9F] hover:bg-blue-50/40 dark:hover:border-[#00A5EC]/60 dark:hover:text-sky-300 dark:hover:bg-sky-950/20 transition-all duration-200 cursor-default"
                              >
                                <PesertaMiniFoto nama={p.nama} foto={fotoPeserta} />
                                <span className="truncate max-w-[140px]">{p.nama}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Lampiran Berkas & Tautan Daring (Berjejer Kanan Kiri jika Ada Keduanya) */}
                    {(t.file_lampiran || t.tautan_eksternal) && (
                      <div
                        className={`mt-3.5 ${
                          t.file_lampiran && t.tautan_eksternal
                            ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                            : "space-y-2"
                        }`}
                      >
                        {t.file_lampiran && (() => {
                          const fileInfo = getFileExtInfo(t.file_lampiran);
                          const fileName = t.file_lampiran.split("/").pop();
                          return (
                            <a
                              href={getFileUrl(t.file_lampiran)}
                              target="_blank"
                              rel="noreferrer"
                              className={`group/file flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer ${fileInfo.cardBorder} ${fileInfo.cardBg}`}
                              title={fileName}
                            >
                              <div className={`relative flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 shadow-2xs group-hover/file:scale-105 transition-transform ${fileInfo.iconTile}`}>
                                <FileText className="w-3.5 h-3.5" />
                                <span className={`absolute -bottom-1 -right-1 px-0.5 py-0 rounded text-[6.5px] font-black tracking-wider shadow-2xs ${fileInfo.badgeColor}`}>
                                  {fileInfo.ext}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 truncate transition-colors ${fileInfo.textHover}`} title={fileName}>
                                  {fileName}
                                </p>
                                <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                  Klik untuk mengunduh
                                </p>
                              </div>
                            </a>
                          );
                        })()}

                        {t.tautan_eksternal && (
                          <a
                            href={t.tautan_eksternal}
                            target="_blank"
                            rel="noreferrer"
                            className="group/link flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer border-blue-200/90 dark:border-blue-900/40 hover:border-[#004F9F] dark:hover:border-[#00A5EC] bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60"
                            title={t.tautan_eksternal}
                          >
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50 shrink-0 shadow-2xs group-hover/link:scale-105 transition-transform">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 group-hover/link:text-[#004F9F] dark:group-hover/link:text-[#00A5EC] truncate transition-colors" title={t.tautan_eksternal}>
                                {t.tautan_eksternal}
                              </p>
                              <p className="text-[9px] sm:text-[9.5px] text-slate-400 group-hover/link:text-[#004F9F]/80 dark:group-hover/link:text-sky-300/80 font-medium truncate mt-0.5">
                                Klik untuk membuka
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}

                    {/* ── SUBMISSION PROGRESS SECTION (LEBIH MENARIK & MODERN) ── */}
                    <div
                      className={`mt-3.5 p-3.5 rounded-2xl border transition-all duration-200 ${
                        isDark
                          ? "bg-gradient-to-br from-white/[0.04] to-transparent border-white/10"
                          : "bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white border-slate-200/80 shadow-2xs"
                      }`}
                    >
                      {/* Baris Atas Progres: Hitungan & Persentase */}
                      <div className="flex items-center justify-between gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                            Progres Pengumpulan:
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0 text-[10px] sm:text-[10.5px]">
                          <span className="font-bold text-[#004F9F] dark:text-[#00A5EC]">
                            {kumpulCount} / {totalTarget} Peserta
                          </span>
                          <span className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400">
                            ({persentase}%)
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="relative h-2 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] transition-all duration-500 shadow-xs"
                          style={{ width: `${Math.min(100, Math.max(0, persentase))}%` }}
                        />
                      </div>

                      {/* Status Badges Rincian */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[10.5px]">
                        {isKuis ? (
                          <>
                            {/* Kuis: Total Tuntas */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold border transition-colors ${
                                (summary.total_tuntas || 0) > 0
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/50 shadow-2xs"
                                  : "bg-slate-100/80 dark:bg-white/5 text-slate-400 dark:text-slate-400 border-slate-200/60 dark:border-transparent"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{summary.total_tuntas || 0} Tuntas (≥ KKM)</span>
                            </span>

                            {/* Kuis: Perlu Remidi */}
                            {(summary.total_remidi || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/50 shadow-2xs animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{summary.total_remidi} Perlu Remidi</span>
                              </span>
                            )}

                            {/* Kuis: Menunggu Review jika ada esai */}
                            {(summary.menunggu_review || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300/70 dark:border-purple-700/50 shadow-2xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                                <span>{summary.menunggu_review} Menunggu Koreksi Esai</span>
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Tugas Berkas: Menunggu Review */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold border transition-colors ${
                                summary.menunggu_review > 0
                                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/50 animate-pulse shadow-2xs"
                                  : "bg-slate-100/80 dark:bg-white/5 text-slate-400 dark:text-slate-400 border-slate-200/60 dark:border-transparent"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>{summary.menunggu_review || 0} Menunggu Dinilai</span>
                            </span>

                            {/* Tugas Berkas: Perlu Revisi */}
                            {summary.perlu_revisi > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300/70 dark:border-rose-700/50 shadow-2xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>{summary.perlu_revisi} Perlu Revisi</span>
                              </span>
                            )}

                            {/* Tugas Berkas: Selesai Dinilai */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold border transition-colors ${
                                summary.sudah_dinilai > 0
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/50 shadow-2xs"
                                  : "bg-slate-100/80 dark:bg-white/5 text-slate-400 dark:text-slate-400 border-slate-200/60 dark:border-transparent"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{summary.sudah_dinilai || 0} Selesai</span>
                            </span>
                          </>
                        )}

                        {/* Nilai Rata-rata jika ada */}
                        {summary.rata_rata_nilai !== null && summary.rata_rata_nilai !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/40 ml-auto shadow-2xs">
                            <span>Rata-rata: {summary.rata_rata_nilai.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── ATURAN & PARAMETER KUIS (DI ROMBAK MENJADI GRID METRIK EKSEKUTIF, BUKAN BATCH/PILL) ── */}
                    {isKuis && (
                      <div
                        className={`mt-3 p-3 rounded-2xl border transition-all duration-200 ${
                          isDark
                            ? "bg-slate-900/40 border-white/10"
                            : "bg-slate-50/70 border-slate-200/80 shadow-2xs"
                        }`}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {/* 1. Standar KKM */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30 shrink-0">
                              <Target className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                Standar KKM
                              </span>
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                                {kuisMeta?.kkm ?? 75} Poin
                              </span>
                            </div>
                          </div>

                          {/* 2. Jumlah Butir Soal */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-blue-800/30 shrink-0">
                              <NotebookPen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                Butir Soal
                              </span>
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                                {kuisMeta?.daftar_soal?.length ?? 0} Soal
                              </span>
                            </div>
                          </div>

                          {/* 3. Durasi Pengerjaan */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                Waktu Ujian
                              </span>
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                                {kuisMeta?.durasi_menit ?? 30} Menit
                              </span>
                            </div>
                          </div>

                          {/* 4. Kebijakan Remidi */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 border ${
                                kuisMeta?.izinkan_remidi
                                  ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30"
                                  : "bg-slate-200/50 dark:bg-white/5 text-slate-400 border-slate-200/60 dark:border-white/10"
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                Opsi Remidi
                              </span>
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                {kuisMeta?.izinkan_remidi
                                  ? kuisMeta.maks_percobaan
                                    ? `${kuisMeta.maks_percobaan}x Percobaan`
                                    : "Remidi Aktif"
                                  : "Nonaktif"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER CARD & AKSI ── */}
                  <div
                    className={`mt-4 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    {/* Info Tenggat Waktu (Ikon CalendarClock & Tampilan Menarik) */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs transition-colors ${
                          isBerakhir
                            ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                            : isMendekati
                            ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                            : "bg-slate-50/90 text-slate-600 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10"
                        }`}
                      >
                        <CalendarClock
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isBerakhir
                              ? "text-rose-600 dark:text-rose-400"
                              : isMendekati
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-[#004F9F] dark:text-[#00A5EC]"
                          }`}
                        />
                        <span>
                          <span className="text-slate-400 dark:text-slate-400 font-semibold mr-1">Tenggat:</span>
                          <strong className="text-slate-800 dark:text-slate-100 font-black">{formatDeadlineText(t.tenggat_waktu)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Kanan (Hapus, Edit, [Sekat Tipis], Review Kuning Batch) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleHapusTugas(t)}
                        className="group/del inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:hover:bg-rose-600 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
                        title="Hapus tugas ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover/del:scale-110" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>

                      {/* Tombol Edit: Style Badge Biru Kominfo */}
                      <button
                        type="button"
                        onClick={() => bukaModalEdit(t)}
                        className="group/edit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/40 text-[#004F9F] dark:text-[#00A5EC] bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700/60 hover:text-[#003870] dark:hover:text-sky-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
                        title="Edit rincian tugas"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-200 group-hover/edit:rotate-12 shrink-0" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Sekat tipis antara Tombol Edit dan Tombol Review */}
                      <div className="h-5 w-px bg-slate-200 dark:bg-white/15 mx-0.5 my-auto shrink-0" />

                      {/* Tombol Review: Kuning Batch Style dengan FileCheck2 (tanpa arrow kanan) */}
                      <button
                        type="button"
                        onClick={() => handleReviewTugas(t.id)}
                        className="group/rev inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-800 dark:hover:text-amber-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shrink-0"
                        title="Review pengumpulan tugas"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover/rev:scale-110 shrink-0" />
                        <span>Review ({summary.total_mengumpulkan || 0})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 1. MODAL PILIH FORMAT PENUGASAN (BERKAS ATAU KUIS) ── */}
        <PilihTipeTugasModal
          isOpen={pilihTipeOpen}
          onClose={() => setPilihTipeOpen(false)}
          onPilihTipe={handlePilihTipeTugas}
          isDark={isDark}
        />

        {/* ── 2. MODAL FORM PENUGASAN PROYEK & MANDIRI (PERSIS SEPERTI MODAL ASLI) ── */}
        <FormTugasProyekModal
          isOpen={proyekModalOpen}
          isEditing={isEditing}
          selectedTugas={selectedTugas}
          pesertaBimbingan={pesertaBimbingan}
          onClose={() => {
            setProyekModalOpen(false);
            setSelectedTugas(null);
          }}
          onSuccess={() => {
            setProyekModalOpen(false);
            setSelectedTugas(null);
            muatData(true);
            window.dispatchEvent(new Event("sim_notifikasi_updated"));
          }}
          isDark={isDark}
        />

        {/* ── 3. MODAL FORM TUGAS KUIS: TAHAP 1 (INFORMASI DASAR & INSTRUKSI) ── */}
        <FormTugasKuisModal
          isOpen={kuisInfoModalOpen}
          isEditing={isEditing}
          selectedTugas={selectedTugas}
          pesertaBimbingan={pesertaBimbingan}
          kuisDraft={kuisDraft}
          onClose={() => {
            setKuisInfoModalOpen(false);
            setKuisDraft(null);
            setSelectedTugas(null);
          }}
          onLanjutKeSoal={handleLanjutKeSoalKuis}
          isDark={isDark}
        />

        {/* ── 4. MODAL FORM TUGAS KUIS: TAHAP 2 (ATURAN EVALUASI & BUTIR SOAL) ── */}
        <FormKuisSoalModal
          isOpen={kuisSoalModalOpen}
          isEditing={isEditing}
          selectedTugas={selectedTugas}
          kuisInfo={kuisDraft || {}}
          kuisConfig={kuisConfig}
          setKuisConfig={setKuisConfig}
          onBackToInfo={handleKembaliKeInfoKuis}
          onClose={() => {
            setKuisSoalModalOpen(false);
            setKuisDraft(null);
            setSelectedTugas(null);
          }}
          onSuccess={() => {
            setKuisSoalModalOpen(false);
            setKuisDraft(null);
            setSelectedTugas(null);
            muatData(true);
            window.dispatchEvent(new Event("sim_notifikasi_updated"));
          }}
          isDark={isDark}
        />
      </div>
    </MentorLayout>
  );
};

export default KelolaTugasMentorPage;
