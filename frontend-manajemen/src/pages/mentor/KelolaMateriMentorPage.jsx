import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  BookOpenText, RefreshCw, Tags, FolderOpen,
  Search, Pencil, Trash2,
  FileText, Link2, Users, X,
  FolderTree, Sparkles, FilePlusCorner, GraduationCap,
  Calendar, Presentation, Video, BookOpen, Globe, Info,
  ArrowRight, LayersPlus, Save, ChevronLeft, ChevronRight
} from "lucide-react";
import { CustomSelectDropdown } from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";
import FormMateriMentorModal from "../../components/manajemen/mentor/materi/FormMateriMentorModal";
import {
  getMateriMentor,
  getPesertaBimbinganMateri,
  deleteMateriMentor,
  createKategoriMateriMentor
} from "../../services/pembelajaranService";
import { getFileUrl } from "../../utils/fileUrl";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";

const getMediaTheme = (tipe) => {
  switch (tipe) {
    case "video":
      return {
        gradient: "from-rose-500 via-pink-600 to-rose-600",
        shadow: "shadow-rose-500/25",
        icon: Video,
        accent: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/40",
      };
    case "slide":
      return {
        gradient: "from-amber-500 via-orange-500 to-amber-600",
        shadow: "shadow-amber-500/25",
        icon: Presentation,
        accent: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/40",
      };
    case "tautan":
      return {
        gradient: "from-teal-500 via-emerald-600 to-teal-600",
        shadow: "shadow-emerald-500/25",
        icon: Link2,
        accent: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/40",
      };
    default: // "dokumen"
      return {
        gradient: "from-[#0B1442] via-[#004F9F] to-[#00A5EC]",
        shadow: "shadow-blue-500/25",
        icon: BookOpen,
        accent: "text-[#004F9F] dark:text-[#00A5EC]",
        bg: "bg-blue-50 dark:bg-sky-950/50 text-blue-700 dark:text-sky-300 border-blue-200/70 dark:border-sky-800/40",
      };
  }
};

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

const SASARAN_OPTIONS = [
  { value: "semua", label: "Semua Sasaran Bimbingan" },
  { value: "semua_bimbingan", label: "Seluruh Bimbingan" },
  { value: "spesifik", label: "Peserta Tertentu" },
];

const JENJANG_OPTIONS = [
  { value: "semua", label: "Semua Jenjang Studi" },
  { value: "mahasiswa", label: "Mahasiswa (Perguruan Tinggi)" },
  { value: "siswa", label: "Siswa (SMK/SMA)" },
];

const KelolaMateriMentorPage = () => {
  const { isDark } = useManajemenTheme();

  // State data materi & bimbingan
  const [materiList, setMateriList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [pesertaBimbingan, setPesertaBimbingan] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState("semua");
  const [filterSasaran, setFilterSasaran] = useState("semua"); // "semua" | "semua_bimbingan" | "spesifik"
  const [filterJenjang, setFilterJenjang] = useState("semua"); // "semua" | "mahasiswa" | "siswa"

  // Horizontal Scroll Helper untuk Pills Kategori
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isOverflowing =
      scrollWidth > clientWidth + 2 || (kategoriList.length >= 4 && clientWidth > 0);
    setHasOverflow(isOverflowing);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(
      isOverflowing && (scrollWidth <= clientWidth || scrollLeft < scrollWidth - clientWidth - 4)
    );
  }, [kategoriList.length]);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    checkCategoryScroll();

    // MutationObserver to detect when category items are rendered into DOM
    const mo = new MutationObserver(() => {
      checkCategoryScroll();
    });
    mo.observe(el, { childList: true, subtree: true });

    // ResizeObserver on el and its parent
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        checkCategoryScroll();
      });
      ro.observe(el);
      if (el.parentElement) {
        ro.observe(el.parentElement);
      }
    }

    el.addEventListener("scroll", checkCategoryScroll, { passive: true });
    window.addEventListener("resize", checkCategoryScroll);

    // Staggered timers to ensure font loading / CSS transitions settle
    const t0 = requestAnimationFrame(checkCategoryScroll);
    const t1 = setTimeout(checkCategoryScroll, 50);
    const t2 = setTimeout(checkCategoryScroll, 150);
    const t3 = setTimeout(checkCategoryScroll, 350);
    const t4 = setTimeout(checkCategoryScroll, 700);

    return () => {
      cancelAnimationFrame(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      mo.disconnect();
      if (ro) ro.disconnect();
      el.removeEventListener("scroll", checkCategoryScroll);
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [checkCategoryScroll, kategoriList, loading]);

  const handleScrollCategory = (direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Modal State Form Tambah/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMateri, setSelectedMateri] = useState(null);

  // Modal Info Ringkasan Kategori
  const [modalKategoriOpen, setModalKategoriOpen] = useState(false);
  const [searchKategoriModal, setSearchKategoriModal] = useState("");
  const [tambahKategoriMode, setTambahKategoriMode] = useState(false);
  const [inputKategoriBaru, setInputKategoriBaru] = useState("");
  const [simpanKategoriLoading, setSimpanKategoriLoading] = useState(false);
  const inputKategoriRef = useRef(null);

  useEffect(() => {
    if (tambahKategoriMode) {
      const timer = setTimeout(() => {
        inputKategoriRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [tambahKategoriMode]);

  const handleTambahKategoriLangsung = async (e) => {
    e.preventDefault();
    const namaTrimmed = inputKategoriBaru.trim();
    if (!namaTrimmed) return;

    setSimpanKategoriLoading(true);
    try {
      await createKategoriMateriMentor({ nama: namaTrimmed });
      toastSuccess(`Kategori "${namaTrimmed}" berhasil disimpan`);
      setInputKategoriBaru("");
      setTambahKategoriMode(false);
      muatData();
    } catch (err) {
      console.error("Gagal menambahkan kategori:", err);
      const msg = err.response?.data?.message || "Gagal menyimpan kategori baru";
      toastError(msg);
    } finally {
      setSimpanKategoriLoading(false);
    }
  };

  // Tutup modal kategori dengan tombol Escape
  useEffect(() => {
    if (!modalKategoriOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalKategoriOpen(false);
        setTambahKategoriMode(false);
        setSearchKategoriModal("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalKategoriOpen]);

  const filteredKategoriModal = useMemo(() => {
    if (!searchKategoriModal.trim()) return kategoriList;
    const q = searchKategoriModal.toLowerCase();
    return kategoriList.filter((k) => (k.nama || "").toLowerCase().includes(q));
  }, [kategoriList, searchKategoriModal]);

  // Muat data materi & peserta
  const muatData = useCallback(async () => {
    try {
      const [resMateri, resPeserta] = await Promise.all([
        getMateriMentor(),
        getPesertaBimbinganMateri(),
      ]);

      const dataMateri = resMateri.data?.data || {};
      setMateriList(dataMateri.materi || []);
      setKategoriList(dataMateri.kategori || []);
      setPesertaBimbingan(resPeserta.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat materi mentor:", err);
      toastError("Gagal memuat data materi bimbingan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      muatData();
    }, 0);
    return () => clearTimeout(timer);
  }, [muatData]);

  const bukaModalTambah = () => {
    setSelectedMateri(null);
    setIsEditing(false);
    setModalOpen(true);
  };

  const bukaModalEdit = (m) => {
    setSelectedMateri(m);
    setIsEditing(true);
    setModalOpen(true);
  };

  // Konfirmasi & Eksekusi Hapus menggunakan SweetAlert2 (swal)
  const handleHapusMateri = async (m) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus Materi Pembelajaran?",
      text: `Materi "${m.judul}" beserta seluruh berkas lampiran akan dihapus secara permanen.`,
      confirmText: "Ya, Hapus Materi",
      cancelText: "Batal",
      danger: true,
      icon: "warning",
    });

    if (!konfirmasi.isConfirmed) return;

    try {
      await deleteMateriMentor(m.id);
      toastSuccess(`Materi "${m.judul}" berhasil dihapus`);
      muatData();
    } catch (err) {
      console.error("Gagal menghapus materi:", err);
      toastError(err.response?.data?.message || "Gagal menghapus materi");
    }
  };

  // Perhitungan Statistik
  const stats = useMemo(() => {
    const total = materiList.length;
    let semuaBimbingan = 0;
    let spesifik = 0;
    materiList.forEach((m) => {
      if (m.target_peserta === "spesifik") spesifik++;
      else semuaBimbingan++;
    });
    return {
      total,
      semuaBimbingan,
      spesifik,
      totalKategori: kategoriList.length,
    };
  }, [materiList, kategoriList]);

  // 3 Card Stats Konsisten dengan Halaman Presensi & Verifikasi Izin
  const statCards = [
    {
      icon: BookOpenText,
      label: "Total Modul",
      desktopLabel: "Total Modul Materi",
      value: stats.total,
      caption: "Modul bimbingan aktif",
      mobileCaption: "Modul aktif",
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
    },
    {
      icon: Users,
      label: "Sasaran",
      desktopLabel: "Sasaran Bimbingan",
      value: stats.semuaBimbingan,
      caption: `${stats.semuaBimbingan} Semua · ${stats.spesifik} Khusus`,
      mobileCaption: `${stats.semuaBimbingan} Semua · ${stats.spesifik} Khusus`,
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: FolderTree,
      label: "Kategori",
      desktopLabel: "Kategori Modul",
      value: stats.totalKategori,
      caption: "Topik & klaster materi",
      mobileCaption: "Klaster materi",
      lightGradient: "from-amber-300 to-white",
      gradient: "from-amber-500 to-amber-700",
      iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
    },
  ];

  // Filtered List
  const filteredMateri = useMemo(() => {
    return materiList.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.judul?.toLowerCase().includes(q) ||
        m.deskripsi?.toLowerCase().includes(q) ||
        m.kategori?.toLowerCase().includes(q) ||
        (m.peserta_akses || []).some((p) => p.nama?.toLowerCase().includes(q));

      const matchKategori =
        selectedKategori === "semua" || m.kategori === selectedKategori;

      const matchSasaran =
        filterSasaran === "semua" ||
        (filterSasaran === "semua_bimbingan" && m.target_peserta !== "spesifik") ||
        (filterSasaran === "spesifik" && m.target_peserta === "spesifik");

      const matchJenjang = (() => {
        if (filterJenjang === "semua") return true;
        // Jika materi spesifik target_jenjang
        if (m.target_jenjang && m.target_jenjang !== "semua") {
          return m.target_jenjang === filterJenjang;
        }
        // Jika materi target pesertanya spesifik, cek apakah ada peserta bimbingan penerima yang sesuai jenjang
        if (m.target_peserta === "spesifik") {
          const list = m.peserta_akses || [];
          if (list.length === 0) return true;
          return list.some(
            (p) => (p.kategori_pendaftar || "").toLowerCase() === filterJenjang
          );
        }
        return true;
      })();

      return matchSearch && matchKategori && matchSasaran && matchJenjang;
    });
  }, [materiList, search, selectedKategori, filterSasaran, filterJenjang]);

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Halaman: Clear, bersih, tanpa tombol bertumpuk */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Materi Pembelajaran
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Kelola, publikasikan, dan bagikan materi pembelajaran, modul panduan, serta bahan referensi kerja baik untuk seluruh peserta bimbingan maupun peserta tertentu guna mendukung kelancaran dan capaian kompetensi magang.
            </span>
            <span className="inline sm:hidden">
              Kelola dan bagikan materi pembelajaran serta bahan referensi untuk peserta bimbingan Anda.
            </span>
          </p>
        </div>

        {/* 3 Kartu Statistik Konsisten dengan Presensi & Verifikasi Izin */}
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
                    {c.value}
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

        {/* ── TOOLBAR PENCARIAN, FILTER & AKSI (IDENTIK DENGAN PESERTA BIMBINGAN) ── */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border space-y-3.5 shadow-xs transition-all duration-300 ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : "border-slate-200/80 bg-white"
          }`}
        >
          {/* Baris Pencarian & Kontrol Aksi Terpadu */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Input Pencarian dengan Animasi Admin/Peserta Bimbingan Identik */}
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
                placeholder="Cari judul materi, deskripsi, atau nama peserta bimbingan..."
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
              {/* Custom Dropdown Filter Sasaran Bimbingan */}
              <CustomSelectDropdown
                value={filterSasaran}
                onChange={setFilterSasaran}
                options={SASARAN_OPTIONS}
                icon={Users}
                isDark={isDark}
                menuWidth={215}
              />

              {/* Custom Dropdown Filter Jenjang Studi */}
              <CustomSelectDropdown
                value={filterJenjang}
                onChange={setFilterJenjang}
                options={JENJANG_OPTIONS}
                icon={GraduationCap}
                isDark={isDark}
                menuWidth={235}
              />

              {/* Tombol Ringkasan Kelola Kategori: Warna Identik dengan Modal & Icon Semula (FolderTree) */}
              <button
                type="button"
                onClick={() => setModalKategoriOpen(true)}
                title="Kelola & lihat ringkasan kategori modul"
                className="group/btn relative inline-flex h-9 sm:h-[38px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-[#004F9F] dark:text-[#00A5EC] border border-[#004F9F]/20 dark:border-[#00A5EC]/30 px-3 sm:px-3.5 text-xs font-bold transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5 active:scale-95 shrink-0 shadow-2xs hover:shadow-xs"
              >
                <FolderTree className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 ease-out group-hover/btn:scale-115 group-hover/btn:-rotate-6 shrink-0" />
                <span className="hidden sm:inline">Kelola Kategori</span>
              </button>

              {/* Tombol Tambah Materi Baru - Warna & Animasi Identik dengan Verifikasi Izin */}
              <button
                type="button"
                onClick={bukaModalTambah}
                className="group/btn relative inline-flex h-9 sm:h-[38px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 text-xs font-black text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0"
              >
                <FilePlusCorner className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 shrink-0" />
                <span>Tambah Materi</span>
              </button>
            </div>
          </div>

          {/* Pills Kategori Horizontal Modern & Menarik */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Label Chip Kategori (Fixed/Pinned di Kiri, Tidak Ikut Ter-scroll) */}
            <div className="flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 text-[11px] font-bold shrink-0 shadow-2xs">
              <Tags className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Kategori:</span>
            </div>

            {/* Tombol Scroll Kiri (Alat bantu scroll kategori ke kiri) */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => handleScrollCategory("left")}
                disabled={!canScrollLeft}
                aria-label="Geser kategori ke kiri"
                title="Geser kategori ke kiri"
                className={`flex h-7.5 w-7 items-center justify-center rounded-xl border shrink-0 transition-all duration-200 select-none ${
                  canScrollLeft
                    ? isDark
                      ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/10 hover:text-[#00A5EC] hover:border-[#00A5EC]/40 shadow-xs cursor-pointer active:scale-90"
                      : "border-slate-200/90 bg-white text-slate-600 hover:bg-blue-50/70 hover:text-[#004F9F] hover:border-[#004F9F]/30 shadow-2xs cursor-pointer active:scale-90"
                    : isDark
                    ? "border-transparent bg-white/5 text-slate-600 cursor-not-allowed opacity-35"
                    : "border-transparent bg-slate-100/60 text-slate-300 cursor-not-allowed opacity-35"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Container List Kategori yang Dapat Di-scroll Secara Horizontal */}
            <div
              ref={categoryScrollRef}
              onMouseEnter={checkCategoryScroll}
              className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none scroll-smooth min-w-0"
            >
              {/* Pill 'Semua Modul' (Seukuran dengan Batch Kategori, Berwarna Abu-abu, Border Biru Kominfo saat Aktif) */}
              <button
                type="button"
                onClick={() => setSelectedKategori("semua")}
                className={`group inline-flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                  selectedKategori === "semua"
                    ? isDark
                      ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                      : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                    : isDark
                    ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                    : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                } hover:-translate-y-0.5 active:scale-95`}
              >
                <span>Semua Modul</span>
                <span
                  className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                    selectedKategori === "semua"
                      ? isDark
                        ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                        : "bg-[#004F9F] text-white shadow-2xs"
                      : isDark
                      ? "bg-white/10 text-sky-400 border border-white/10"
                      : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                  }`}
                >
                  {materiList.length}
                </span>
              </button>

              {/* Pills Daftar Kategori */}
              {kategoriList.map((kat) => {
                const isAktif = selectedKategori === kat.nama;
                return (
                  <button
                    key={kat.nama}
                    type="button"
                    onClick={() => setSelectedKategori(kat.nama)}
                    className={`group inline-flex h-7.5 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{kat.nama}</span>
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
                      {kat.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tombol Scroll Kanan (Alat bantu scroll kategori ke kanan) */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => handleScrollCategory("right")}
                disabled={!canScrollRight}
                aria-label="Geser kategori ke kanan"
                title="Geser kategori ke kanan"
                className={`flex h-7.5 w-7 items-center justify-center rounded-xl border shrink-0 transition-all duration-200 select-none ${
                  canScrollRight
                    ? isDark
                      ? "border-white/10 bg-[#161b22] text-slate-300 hover:bg-white/10 hover:text-[#00A5EC] hover:border-[#00A5EC]/40 shadow-xs cursor-pointer active:scale-90"
                      : "border-slate-200/90 bg-white text-slate-600 hover:bg-blue-50/70 hover:text-[#004F9F] hover:border-[#004F9F]/30 shadow-2xs cursor-pointer active:scale-90"
                    : isDark
                    ? "border-transparent bg-white/5 text-slate-600 cursor-not-allowed opacity-35"
                    : "border-transparent bg-slate-100/60 text-slate-300 cursor-not-allowed opacity-35"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Daftar Modul Materi (Cards Grid) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat materi bimbingan...</p>
          </div>
        ) : filteredMateri.length === 0 ? (
          <div
            key={`empty-${selectedKategori}`}
            className={`flex flex-col items-center justify-center gap-3 py-20 text-center rounded-3xl border shadow-xs animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both] ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC]">
              <BookOpenText className="w-7 h-7" />
            </span>
            <div className="max-w-sm space-y-1">
              <p className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                Belum ada materi pembelajaran yang cocok
              </p>
              <p className="text-xs text-slate-400">
                {search || selectedKategori !== "semua" || filterSasaran !== "semua" || filterJenjang !== "semua"
                  ? "Coba sesuaikan kata kunci pencarian atau ubah filter kategori/sasaran/jenjang."
                  : "Mulai unggah materi pembelajaran pertama untuk peserta bimbingan Anda."}
              </p>
            </div>
            <button
              type="button"
              onClick={bukaModalTambah}
              className="group/btn mt-2 inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white text-xs font-black shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10"
            >
              <FilePlusCorner className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 shrink-0" />
              <span>Unggah Materi Baru</span>
            </button>
          </div>
        ) : (
          <div
            key={selectedKategori}
            className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            {filteredMateri.map((m, idx) => {
              const mediaTheme = getMediaTheme(m.tipe_media);
              const isSpesifik = m.target_peserta === "spesifik";
              let daftarPenerima;
              if (isSpesifik) {
                daftarPenerima = m.peserta_akses || [];
              } else if (m.target_jenjang && m.target_jenjang !== "semua") {
                const targetJ = m.target_jenjang.toLowerCase();
                const filtered = pesertaBimbingan.filter(
                  (pb) => (pb.kategori_pendaftar || "").toLowerCase() === targetJ
                );
                daftarPenerima = filtered.length > 0 ? filtered : pesertaBimbingan;
              } else {
                daftarPenerima = pesertaBimbingan;
              }

              return (
                <div
                  key={m.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
                  className={`animate-[fadeslide_0.3s_cubic-bezier(0.16,1,0.3,1)_both] group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5.5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    isDark
                      ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/30"
                      : "border-slate-200/90 bg-white hover:border-[#004F9F]/30"
                  }`}
                >
                  <div>
                    {/* Header Card: Ikon + Judul + Sub Judul Petunjuk Belajar (Identik dengan Card Daftar Tugas) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                          <mediaTheme.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.2} />
                        </span>

                        <div className="min-w-0">
                          <h3
                            className={`text-sm sm:text-base font-black truncate sm:whitespace-normal line-clamp-2 ${
                              isDark ? "text-slate-100" : "text-[#0B1442]"
                            }`}
                            title={m.judul}
                          >
                            {m.judul}
                          </h3>

                          {/* Tulisan Petunjuk / Instruksi Belajar Sebagai Sub Judul Kolom Konten */}
                          {m.deskripsi && (
                            <p
                              className="text-[10px] sm:text-xs text-slate-400 leading-tight line-clamp-2 mt-0.5"
                              title={m.deskripsi}
                            >
                              {m.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badge Tanggal Rilis di Kanan Atas */}
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTanggalPresensi(m.created_at)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Kotak Seluruh Peserta Bimbingan / Peserta Sasaran Khusus */}
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
                    {(m.file_materi || m.tautan_eksternal) && (
                      <div
                        className={`mt-3.5 ${
                          m.file_materi && m.tautan_eksternal
                            ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                            : "space-y-2"
                        }`}
                      >
                        {m.file_materi && (() => {
                          const fileInfo = getFileExtInfo(m.file_materi);
                          const fileName = m.file_materi.split("/").pop();
                          return (
                            <a
                              href={getFileUrl(m.file_materi)}
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

                        {m.tautan_eksternal && (
                          <a
                            href={m.tautan_eksternal}
                            target="_blank"
                            rel="noreferrer"
                            className="group/link flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer border-blue-200/90 dark:border-blue-900/40 hover:border-[#004F9F] dark:hover:border-[#00A5EC] bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60"
                            title={m.tautan_eksternal}
                          >
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50 shrink-0 shadow-2xs group-hover/link:scale-105 transition-transform">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 group-hover/link:text-[#004F9F] dark:group-hover/link:text-[#00A5EC] truncate transition-colors" title={m.tautan_eksternal}>
                                {m.tautan_eksternal}
                              </p>
                              <p className="text-[9px] sm:text-[9.5px] text-slate-400 group-hover/link:text-[#004F9F]/80 dark:group-hover/link:text-sky-300/80 font-medium truncate mt-0.5">
                                Klik untuk membuka
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER CARD & AKSI ── */}
                  <div
                    className={`mt-4 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    {/* Info Kategori (Style Identik dengan Badge Tenggat di Daftar Tugas) */}
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs transition-colors bg-slate-50/90 text-slate-600 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10"
                      >
                        <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#004F9F] dark:text-[#00A5EC]" />
                        <span>
                          <span className="text-slate-400 dark:text-slate-400 font-semibold mr-1">Kategori:</span>
                          <strong className="text-slate-800 dark:text-slate-100 font-black">{m.kategori || "Umum"}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Kanan (Hapus & Edit) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleHapusMateri(m)}
                        className="group/del inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:hover:bg-rose-600 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
                        title="Hapus materi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover/del:scale-110" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>

                      {/* Tombol Edit: Style Badge Biru Kominfo */}
                      <button
                        type="button"
                        onClick={() => bukaModalEdit(m)}
                        className="group/edit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/40 text-[#004F9F] dark:text-[#00A5EC] bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700/60 hover:text-[#003870] dark:hover:text-sky-200 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
                        title="Edit modul materi ini"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-200 group-hover/edit:rotate-12 shrink-0" />
                        <span className="hidden sm:inline">Edit Modul</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MODAL FORM TAMBAH / EDIT MATERI ─────────────────────────── */}
        <FormMateriMentorModal
          isOpen={modalOpen}
          isEditing={isEditing}
          selectedMateri={selectedMateri}
          kategoriList={kategoriList}
          pesertaBimbingan={pesertaBimbingan}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            muatData();
          }}
          onKategoriAdded={() => {
            muatData();
          }}
          isDark={isDark}
        />

        {/* ── MODAL RINGKASAN KELOLA KATEGORI MODERN & KONSISTEN ──────────── */}
        {modalKategoriOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setModalKategoriOpen(false);
              setTambahKategoriMode(false);
              setSearchKategoriModal("");
            }}
          >
            {/* Modal Container: border-0 menghilangkan border putih di luar modal */}
            <div
              className={`relative w-full max-w-xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
                isDark
                  ? "bg-[#141a24] text-slate-100 shadow-black/60"
                  : "bg-white text-slate-900 shadow-slate-900/25"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── HEADER MODAL (SIGNATURE KOMINFO GRADIENT) ── */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4 sm:px-6 sm:py-5 shrink-0 border-0">
                {/* Ambient Glow */}
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
                {/* Watermark Icon */}
                <FolderTree
                  className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
                  strokeWidth={1}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                      <FolderTree className="w-5 h-5 text-white" />
                      <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
                    </span>
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                        <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                        Kategori Modul Pembelajaran
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                        Daftar Kategori Materi
                      </h3>
                      <p className="text-[11px] sm:text-xs text-white/75 mt-0.5">
                        Pengelompokan kategori materi &amp; modul bimbingan magang
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setModalKategoriOpen(false);
                      setTambahKategoriMode(false);
                      setSearchKategoriModal("");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
                    title="Tutup (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ── MODAL BODY (SCROLLABLE) ── */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-modal-scrollbar">
                {/* Stat Highlights Card: Keduanya Menggunakan Warna Biru Kominfo & Kalimat Awam */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Kategori dengan Icon Tags & Warna Biru Kominfo */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
                      isDark
                        ? "bg-blue-950/15 border-blue-500/20"
                        : "bg-blue-50/60 border-blue-200/70"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0 shadow-2xs">
                      <Tags className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Kategori
                      </p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                        {kategoriList.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategori</span>
                      </p>
                    </div>
                  </div>

                  {/* Total Modul dengan Icon BookOpen & Warna Biru Kominfo */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
                      isDark
                        ? "bg-blue-950/15 border-blue-500/20"
                        : "bg-blue-50/60 border-blue-200/70"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0 shadow-2xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Modul
                      </p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                        {materiList.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Modul</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Baris Pencarian & Form Tambah Kategori */}
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchKategoriModal}
                        onChange={(e) => setSearchKategoriModal(e.target.value)}
                        placeholder="Cari nama kategori..."
                        className={`w-full h-10 pl-10 pr-9 text-xs rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? "bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
                        }`}
                      />
                      {searchKategoriModal && (
                        <button
                          type="button"
                          onClick={() => setSearchKategoriModal("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title="Bersihkan filter pencarian"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Tombol Kategori Baru: Icon LayersPlus & Warna Biru Kominfo Identik dengan FormMateriMentorModal */}
                    <button
                      type="button"
                      onClick={() => setTambahKategoriMode(!tambahKategoriMode)}
                      className={`group/btn inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none shrink-0 ${
                        tambahKategoriMode
                          ? "bg-[#004F9F] text-white shadow-xs hover:bg-[#101F5C] active:scale-95"
                          : "bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-[#004F9F] dark:text-[#00A5EC] border border-[#004F9F]/20 dark:border-[#00A5EC]/30 shadow-2xs hover:shadow-xs active:scale-95"
                      }`}
                    >
                      {tambahKategoriMode ? (
                        <X className="w-4 h-4 transition-transform duration-300 group-hover/btn:rotate-90" />
                      ) : (
                        <LayersPlus className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 ease-out group-hover/btn:scale-125 group-hover/btn:rotate-12" />
                      )}
                      <span>{tambahKategoriMode ? "Batal" : "Kategori Baru"}</span>
                    </button>
                  </div>

                  {/* Form Tambah Kategori Cepat (Collapsible dengan animasi halus muncul & hilang) */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      tambahKategoriMode
                        ? "grid-rows-[1fr] opacity-100 pt-2.5"
                        : "grid-rows-[0fr] opacity-0 pt-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <form
                        onSubmit={handleTambahKategoriLangsung}
                        className={`p-3.5 rounded-2xl border flex items-center gap-2.5 transition-all duration-200 ${
                          isDark
                            ? "bg-blue-950/20 border-blue-500/30"
                            : "bg-blue-50/70 border-blue-200/80"
                        }`}
                      >
                        <input
                          ref={inputKategoriRef}
                          type="text"
                          value={inputKategoriBaru}
                          onChange={(e) => setInputKategoriBaru(e.target.value)}
                          placeholder="Tuliskan nama kategori baru..."
                          className={`flex-1 h-9 px-3.5 rounded-xl border text-xs outline-none transition-all ${
                            isDark
                              ? "bg-[#161b22] border-white/10 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-2 focus:ring-[#00A5EC]/20"
                              : "bg-white border-blue-200 text-slate-800 placeholder-slate-400 focus:border-[#004F9F] focus:ring-2 focus:ring-[#004F9F]/20"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={simpanKategoriLoading || !inputKategoriBaru.trim()}
                          className={`group/save inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none shrink-0 shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDark
                              ? "bg-[#00A5EC]/15 text-[#00A5EC] border border-[#00A5EC]/30 hover:bg-[#00A5EC]/25"
                              : "bg-blue-50 text-[#004F9F] border border-blue-200/90 hover:bg-blue-100/80 hover:border-blue-300"
                          }`}
                        >
                          {simpanKategoriLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover/save:scale-125 group-hover/save:-rotate-12" />
                          )}
                          <span>Simpan</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* List Daftar Kategori: Warna Biru Kominfo, Garis Atas Tidak Terpotong (Padding Container), Icon Tidak Berubah Warna Saat Hover */}
                <div className="p-1 space-y-2 max-h-56 overflow-y-auto custom-modal-scrollbar">
                  {filteredKategoriModal.length === 0 ? (
                    <div className="py-7 text-center text-xs text-slate-400">
                      <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold">Tidak ada kategori yang sesuai.</p>
                    </div>
                  ) : (
                    filteredKategoriModal.map((kat) => {
                      const isSelected = selectedKategori === kat.nama;
                      return (
                        <div
                          key={kat.nama}
                          onClick={() => {
                            setSelectedKategori(kat.nama);
                            setModalKategoriOpen(false);
                          }}
                          title={`Klik untuk memfilter modul dalam kategori "${kat.nama}"`}
                          className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-[#00A5EC]/15 border-[#00A5EC] ring-1 ring-[#00A5EC]/30"
                                : "bg-blue-50/90 border-[#004F9F] ring-1 ring-[#004F9F]/30"
                              : isDark
                              ? "bg-white/[0.03] border-white/5 hover:bg-blue-950/20 hover:border-[#00A5EC]/40 hover:shadow-xs"
                              : "bg-slate-50/80 border-slate-200/80 hover:bg-blue-50/40 hover:border-[#004F9F]/40 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Icon Folder Statis Biru Kominfo Tanpa Perubahan Warna Saat Row Hover */}
                            <div
                              className={`flex h-9.5 w-9.5 items-center justify-center rounded-xl shrink-0 transition-transform duration-200 ${
                                isSelected
                                  ? "bg-[#004F9F] text-white dark:bg-[#00A5EC] dark:text-slate-950 shadow-xs"
                                  : "bg-blue-500/10 text-[#004F9F] dark:bg-blue-500/15 dark:text-[#00A5EC]"
                              }`}
                            >
                              <FolderOpen className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-xs sm:text-[13px] font-bold truncate transition-colors ${
                                  isSelected
                                    ? "text-[#004F9F] dark:text-[#00A5EC]"
                                    : "text-slate-800 dark:text-slate-200 group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC]"
                                }`}
                              >
                                {kat.nama}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {isSelected ? "Sedang aktif difilter" : "Klik untuk memfilter kategori ini"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-[#004F9F] text-white border-[#004F9F] dark:bg-[#00A5EC] dark:text-slate-950 dark:border-[#00A5EC]"
                                  : "bg-blue-50 text-[#004F9F] border-blue-100 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40"
                              }`}
                            >
                              {kat.total} Modul
                            </span>
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "text-[#004F9F] dark:text-[#00A5EC]"
                                  : "text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC]"
                              }`}
                            >
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Info Keterangan Banner Abu-Abu: Ukuran Ringkas & Ramping */}
                <div
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 ${
                    isDark
                      ? "bg-white/[0.02] border-white/5 text-slate-400"
                      : "bg-slate-50/80 border-slate-200/70 text-slate-500"
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-[10px] sm:text-[11px] leading-snug text-left">
                    Kategori baru otomatis tersimpan di database dan dapat dipilih langsung saat Anda membuat atau mengedit modul materi bimbingan.
                  </p>
                </div>
              </div>

              {/* ── FOOTER MODAL (STAY / FIXED DI BAWAH) ── */}
              <div
                className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
                  isDark
                    ? "bg-[#10141d] border-white/5"
                    : "bg-slate-50/90 border-slate-200/80"
                }`}
              >
                {selectedKategori !== "semua" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKategori("semua");
                      setModalKategoriOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004F9F] dark:text-[#00A5EC] hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset ke Semua Modul</span>
                  </button>
                ) : (
                  <span className="text-[11.5px] font-medium text-slate-400">
                    Total <strong className="text-slate-700 dark:text-slate-200 font-bold">{kategoriList.length}</strong> kategori aktif
                  </span>
                )}

                {/* Tombol Tutup Warna Abu-Abu */}
                <button
                  type="button"
                  onClick={() => {
                    setModalKategoriOpen(false);
                    setTambahKategoriMode(false);
                    setSearchKategoriModal("");
                  }}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MentorLayout>
  );
};

export default KelolaMateriMentorPage;
