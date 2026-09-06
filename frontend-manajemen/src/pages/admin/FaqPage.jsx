import { useEffect, useState, Fragment } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import FaqStats from "../../components/manajemen/admin/faq/FaqStats";
import FaqModal from "../../components/manajemen/admin/faq/FaqModal";
import FaqSortDropdown from "../../components/manajemen/admin/faq/FaqSortDropdown";
import FaqFilterModal from "../../components/manajemen/admin/faq/FaqFilterModal";
import FaqActionsDropdown from "../../components/manajemen/admin/faq/FaqActionsDropdown";
import FaqExportDropdown from "../../components/manajemen/admin/faq/FaqExportDropdown";
import QuickActionBoard from "../../components/manajemen/admin/faq/QuickActionBoard";
import PratinjauQuickAction from "../../components/manajemen/admin/faq/PratinjauQuickAction";
import BilahAksiMassal from "../../components/manajemen/admin/faq/BilahAksiMassal";
import DialogImporCsv from "../../components/manajemen/admin/faq/DialogImporCsv";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getFaqList, createFaq, updateFaq, deleteFaq, reorderFaq,
  aksiMassalFaq, eksporFaqCsv,
} from "../../services/chatService";
import { confirmDialog, toastSuccess, toastError, pilihOpsiDialog } from "../../utils/swal";
import { unduhBlob } from "../../utils/unduhBerkas";
import { exportFaqToExcel } from "../../utils/exportFaqExcel";
import { exportFaqToCsv } from "../../utils/exportFaqCsv";
import { exportFaqToPdf } from "../../utils/exportFaqPdf";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import TeksKaya, { TeksKayaInline } from "../../utils/teksKaya";
import {
    HelpCircle, Plus, Filter as FilterIcon, Search, ChevronUp, ChevronDown, Inbox,
  Zap, MessageSquare, ArrowRight, Download, UserRound, ClipboardCheck, Upload,
  Layers, FileText, CalendarClock, Award, Building2, CheckCircle2, XCircle, Eye, Lock,
  Check, Minus,
} from "lucide-react";

// Ikon kategori disamakan dengan daftar KATEGORI pada modal FAQ
const IKON_KATEGORI = {
  "Umum": Layers,
  "Pendaftaran": ClipboardCheck,
  "Berkas & Dokumen": FileText,
  "Jadwal & Lokasi": CalendarClock,
  "Sertifikat": Award,
  "Teknis Sistem": Building2,
};

// Pilihan kategori untuk aksi massal, warna dan urutannya disamakan dengan
// daftar KATEGORI pada modal FAQ.
const PILIHAN_KATEGORI = [
  { nilai: "Umum", label: "Umum", deskripsi: "Pertanyaan umum", warna: "#64748b", inisial: "U" },
  { nilai: "Pendaftaran", label: "Pendaftaran", deskripsi: "Alur & syarat daftar", warna: "#0ea5e9", inisial: "P" },
  { nilai: "Berkas & Dokumen", label: "Berkas & Dokumen", deskripsi: "Unggahan & revisi", warna: "#8b5cf6", inisial: "B" },
  { nilai: "Jadwal & Lokasi", label: "Jadwal & Lokasi", deskripsi: "Jam kerja & presensi", warna: "#f59e0b", inisial: "J" },
  { nilai: "Sertifikat", label: "Sertifikat", deskripsi: "Penerbitan & pengambilan", warna: "#10b981", inisial: "S" },
  { nilai: "Teknis Sistem", label: "Teknis Sistem", deskripsi: "Akun & kendala aplikasi", warna: "#ef4444", inisial: "T" },
];

// Penanda visual singkat untuk kolom Quick Action
const LENCANA_AKSI = {
  jawaban:  { ikon: MessageSquare,  teks: "Jawaban",  kelas: "bg-slate-100 text-slate-600" },
  navigasi: { ikon: ArrowRight,     teks: "Navigasi", kelas: "bg-sky-50 text-sky-600" },
  unduh:    { ikon: Download,       teks: "Unduh",    kelas: "bg-violet-50 text-violet-600" },
  eskalasi: { ikon: UserRound,      teks: "Admin",    kelas: "bg-red-50 text-red-600" },
  status:   { ikon: ClipboardCheck, teks: "Status",   kelas: "bg-emerald-50 text-emerald-600" },
};

const columns = [
  { key: "question", label: "Pertanyaan" },
  { key: "category", label: "Kategori" },
  { key: "kepuasan", label: "Kepuasan" },
  { key: "is_active", label: "Status" },
];

// Ringkasan penilaian satu FAQ, dipakai baik oleh kolom tabel maupun pengurutan.
const hitungKepuasan = (f) => {
  const suka = f.helpful_count || 0;
  const tidak = f.unhelpful_count || 0;
  const total = suka + tidak;
  const rasio = total > 0 ? Math.round((suka / total) * 100) : null;
  return { suka, tidak, total, rasio, perluPerbaikan: total >= 3 && rasio < 50 };
};

// Kotak centang khusus: input aslinya disembunyikan, tampilannya digambar
// ulang agar bisa diberi gradien, tanda centang, dan gerak halus.
const KotakCentang = ({ tercentang = false, sebagian = false, onUbah, judul }) => (
  <label className="group/cb relative inline-flex cursor-pointer items-center justify-center" title={judul}>
    <input type="checkbox" checked={tercentang} onChange={onUbah} className="peer sr-only" />
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border-2 transition-all duration-300 group-hover/cb:scale-110 group-active/cb:scale-90 ${
        tercentang || sebagian
          ? "border-transparent bg-gradient-to-br from-[#0B1442] to-[#004F9F] shadow-[0_4px_10px_-3px_rgba(0,79,159,0.9)]"
          : "border-slate-300 bg-white group-hover/cb:border-[#004F9F] group-hover/cb:bg-blue-50/60"
      }`}
    >
      {sebagian ? (
        <Minus className="h-3 w-3 text-white" strokeWidth={4} />
      ) : (
        <Check
          className={`h-3 w-3 text-white transition-all duration-200 ${tercentang ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          strokeWidth={4}
        />
      )}
    </span>
    {/* Cincin fokus untuk pengguna papan ketik */}
    <span className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-[#00A5EC]/0 transition-all duration-200 peer-focus-visible:ring-[#00A5EC]/50" aria-hidden="true" />
  </label>
);

const SortableHeader = ({ column, columnSort, setColumnSort, isDark = false, className = "" }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;

  const handleClick = () => {
    if (!isActive) setColumnSort({ key: column.key, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: column.key, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };

  return (
    <th className={`px-3 sm:px-6 py-3 sm:py-3.5 ${className}`}>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-2 sm:gap-3 text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark ? "text-sky-400" : "text-[#0B1442]"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <span>{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-200 ${isActive && direction === "asc" ? (isDark ? "text-sky-400" : "text-[#004F9F]") : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"}`} strokeWidth={3} />
          <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 -mt-1 sm:-mt-1.5 transition-all duration-200 ${isActive && direction === "desc" ? (isDark ? "text-sky-400" : "text-[#004F9F]") : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"}`} strokeWidth={3} />
        </span>
      </button>
    </th>
  );
};

const FaqPage = () => {
  const { isDark } = useManajemenTheme();

  const [faqs, setFaqs] = useState([]);
  const [memuat, setMemuat] = useState(true);

  // Pencarian, urutan, filter, dan halaman — pola sama dengan Kelola Bidang
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("terbaru");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [statusList, setStatusList] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [appliedStatusList, setAppliedStatusList] = useState([]);
  const [appliedJenisList, setAppliedJenisList] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleStatus = (key) => {
    setStatusList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };
  const toggleJenis = (key) => {
    setJenisList((prev) => (prev.includes(key) ? prev.filter((j) => j !== key) : [...prev, key]));
  };

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("Umum");
  const [quickLabel, setQuickLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showOnLanding, setShowOnLanding] = useState(true);
  const [isQuickAction, setIsQuickAction] = useState(false);
  const [actionType, setActionType] = useState("jawaban");
  const [actionTarget, setActionTarget] = useState("");
  const [quickIcon, setQuickIcon] = useState("");
  const [tampilSaatStatus, setTampilSaatStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const [qaAktif, setQaAktif] = useState(0);
  const [qaMaks, setQaMaks] = useState(6);

  // Dinaikkan setiap data berubah. Dipakai sebagai `key` papan urutan
  // dan pemicu muat ulang pratinjau, sehingga keduanya selalu segar
  // tanpa perlu useEffect tambahan.
  const [versiData, setVersiData] = useState(0);
  const [menyimpanUrutan, setMenyimpanUrutan] = useState(false);
  const [statistik, setStatistik] = useState({ penilaian: 0, membantu: 0, perlu: 0, tayang: 0 });

  // Pemilihan massal & impor
  const [terpilih, setTerpilih] = useState([]);
  const [sibukMassal, setSibukMassal] = useState(false);
  const [bukaImpor, setBukaImpor] = useState(false);

  // Pengambil data murni — TIDAK menyentuh state sama sekali
  const ambilDataFaq = async () => {
    const res = await getFaqList();
    return {
      list: res.data.data || [],
      aktif: res.data.quick_action_aktif ?? 0,
      maks: res.data.quick_action_maks ?? 6,
      statistik: {
        penilaian: res.data.total_penilaian ?? 0,
        membantu: res.data.total_membantu ?? 0,
        perlu: res.data.perlu_diperbaiki ?? 0,
        // total tayang dihitung dari daftar FAQ supaya tidak perlu endpoint baru
        tayang: (res.data.data || []).reduce((n, f) => n + (f.view_count || 0), 0),
      },
    };
  };

  // Dipakai oleh handler (tambah/edit/hapus), bukan oleh effect
  const fetchFaqs = async () => {
    try {
      const d = await ambilDataFaq();
      setFaqs(d.list);
      setQaAktif(d.aktif);
      setQaMaks(d.maks);
      setStatistik(d.statistik);
      setVersiData((v) => v + 1);
      setTerpilih([]);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data FAQ.");
    }
  };

  useEffect(() => {
    let batal = false;

    (async () => {
      try {
        const d = await ambilDataFaq();
        if (batal) return;
        setFaqs(d.list);
        setQaAktif(d.aktif);
        setQaMaks(d.maks);
        setStatistik(d.statistik);
        setVersiData((v) => v + 1);
      } catch (err) {
        if (!batal) toastError(err.response?.data?.message || "Gagal memuat data FAQ.");
      } finally {
        if (!batal) setMemuat(false);
      }
    })();

    return () => {
      batal = true;
    };
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setSelectedId(null);
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setCategory("Umum");
    setQuickLabel("");
    setIsActive(true);
    setShowOnLanding(true);
    setIsQuickAction(false);
    setActionType("jawaban");
    setActionTarget("");
    setQuickIcon("");
    setTampilSaatStatus([]);
    setShowModal(true);
  };

  const openEditModal = (faq) => {
    setEditMode(true);
    setSelectedId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setKeywords(faq.keywords || "");
    setCategory(faq.category || "Umum");
    setQuickLabel(faq.quick_label || "");
    setIsActive(faq.is_active);
    setShowOnLanding(faq.show_on_landing ?? true);
    setIsQuickAction(faq.is_quick_action || false);
    setActionType(faq.action_type || "jawaban");
    setActionTarget(faq.action_target || "");
    setQuickIcon(faq.quick_icon || "");
    setTampilSaatStatus(
      (faq.tampil_saat_status || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      question,
      answer,
      keywords,
      category,
      quick_label: quickLabel,
      is_active: isActive,
      show_on_landing: showOnLanding,
      is_quick_action: isQuickAction,
      // Field aksi hanya bermakna bila FAQ dijadikan quick action.
      // Saat tidak aktif, semuanya dikembalikan ke nilai netral agar
      // tidak ada pengaturan lama yang tertinggal di database.
      action_type: isQuickAction ? actionType : "jawaban",
      action_target: isQuickAction ? actionTarget : "",
      quick_icon: isQuickAction ? quickIcon : "",
      tampil_saat_status: isQuickAction ? tampilSaatStatus.join(",") : "",
    };

    try {
      if (editMode) {
        await updateFaq(selectedId, data);
        toastSuccess("FAQ berhasil diperbarui");
      } else {
        await createFaq(data);
        toastSuccess("FAQ baru berhasil dibuat");
      }
      await fetchFaqs();
      setShowModal(false);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan FAQ. Pastikan semua field terisi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faq) => {
    const result = await confirmDialog({
      title: "Hapus FAQ ini?",
      text: `"${faq.question}" akan dihapus permanen beserta penilaiannya.`,
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteFaq(faq.id);
      toastSuccess("FAQ berhasil dihapus");
      fetchFaqs();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus FAQ");
    }
  };

  const handleReorder = async (urutan) => {
    setMenyimpanUrutan(true);
    try {
      await reorderFaq(urutan);
      toastSuccess("Urutan tombol berhasil disimpan");
      await fetchFaqs();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan urutan");
      await fetchFaqs(); // kembalikan papan ke kondisi server
    } finally {
      setMenyimpanUrutan(false);
    }
  };

  const togglePilih = (id) => {
    setTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const togglePilihSemua = (daftarId) => {
    setTerpilih((prev) => {
      const semuaSudah = daftarId.every((id) => prev.includes(id));
      // Mencentang ulang hanya membuang baris yang terlihat, sehingga pilihan
      // pada hasil pencarian lain tidak ikut hilang.
      return semuaSudah
        ? prev.filter((id) => !daftarId.includes(id))
        : [...new Set([...prev, ...daftarId])];
    });
  };

  const jalankanAksiMassal = async (aksi, nilai = "") => {
    if (terpilih.length === 0) return;

    // Peladen menolak aksi ubah kategori bila nilainya kosong, jadi kategori
    // tujuan ditanyakan lebih dulu lewat dialog pemilihan.
    let nilaiAkhir = nilai;
    if (aksi === "ubah_kategori" && !nilaiAkhir) {
      const hasil = await pilihOpsiDialog({
        title: `Ubah kategori ${terpilih.length} FAQ`,
        text: "Pilih kategori tujuan. Seluruh FAQ terpilih akan dipindahkan ke sana.",
        opsi: PILIHAN_KATEGORI,
        confirmText: "Ya, Ubah Kategori",
        pesanKosong: "Kategori tujuan wajib dipilih",
      });
      if (!hasil.isConfirmed || !hasil.value) return;
      nilaiAkhir = hasil.value;
    }

    if (aksi === "hapus") {
      const konfirmasi = await confirmDialog({
        title: `Hapus ${terpilih.length} FAQ?`,
        text: "Penilaian yang terkumpul ikut terhapus dan tidak dapat dikembalikan.",
        confirmText: "Ya, Hapus Semua",
        icon: "warning",
        danger: true,
      });
      if (!konfirmasi.isConfirmed) return;
    }

    setSibukMassal(true);
    try {
      const res = await aksiMassalFaq(terpilih, aksi, nilaiAkhir);
      toastSuccess(res.data.message || "Perubahan tersimpan");
      await fetchFaqs();
    } catch (err) {
      toastError(err.response?.data?.message || "Aksi massal gagal");
    } finally {
      setSibukMassal(false);
    }
  };

  // Satu pintu ekspor: tiga format laporan dibuat di sisi klien dari data yang
  // sedang tampil, sedangkan "impor" memanggil endpoint bawaan agar berkasnya
  // tetap bisa disunting lalu diimpor ulang.
  const handleExport = async (format) => {
    if (format === "impor") {
      try {
        const res = await eksporFaqCsv();
        unduhBlob(res, "faq-diskominfo.csv");
        toastSuccess("Berkas CSV format impor berhasil diunduh");
      } catch {
        toastError("Gagal mengunduh berkas CSV");
      }
      return;
    }

    if (sorted.length === 0) {
      toastError("Tidak ada data FAQ untuk diekspor");
      return;
    }

    try {
      if (format === "excel") exportFaqToExcel(sorted);
      else if (format === "csv") exportFaqToCsv(sorted);
      else if (format === "pdf") exportFaqToPdf(sorted);
      toastSuccess(`Data FAQ berhasil diekspor ke ${format.toUpperCase()}`);
    } catch {
      toastError("Gagal mengekspor data FAQ");
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusList(statusList);
    setAppliedJenisList(jenisList);
    setPage(0);
  };
  const handleResetFilters = () => {
    setStatusList([]);
    setJenisList([]);
    setAppliedStatusList([]);
    setAppliedJenisList([]);
    setSortBy("terbaru");
    setPage(0);
  };

  const activeFilterCount = appliedStatusList.length + appliedJenisList.length;
  const activeFilterCountMobile = activeFilterCount + (sortBy ? 1 : 0);

  const filtered = faqs
    .filter((f) => {
      if (appliedStatusList.length === 0) return true;
      return appliedStatusList.includes(f.is_active ? "aktif" : "nonaktif");
    })
    .filter((f) => {
      if (appliedJenisList.length === 0) return true;
      return appliedJenisList.some((j) => {
        if (j === "quick_action") return !!f.is_quick_action;
        if (j === "publik") return !!f.show_on_landing;
        if (j === "perlu_perbaikan") return hitungKepuasan(f).perluPerbaikan;
        return false;
      });
    })
    .filter((f) => {
      const match = (q) => {
        const s = q.toLowerCase();
        return (
          (f.question || "").toLowerCase().includes(s) ||
          (f.answer || "").toLowerCase().includes(s) ||
          (f.keywords || "").toLowerCase().includes(s) ||
          (f.category || "").toLowerCase().includes(s)
        );
      };
      return match(search) && match(tableSearch);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (columnSort.key) {
      let valA, valB;
      if (columnSort.key === "kepuasan") {
        valA = hitungKepuasan(a).rasio ?? -1;
        valB = hitungKepuasan(b).rasio ?? -1;
      } else if (columnSort.key === "is_active") {
        valA = a.is_active ? 1 : 0;
        valB = b.is_active ? 1 : 0;
      } else if (columnSort.key === "category") {
        valA = (a.category || "").toLowerCase();
        valB = (b.category || "").toLowerCase();
      } else {
        valA = (a.question || "").toLowerCase();
        valB = (b.question || "").toLowerCase();
      }
      const result = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
      return columnSort.direction === "asc" ? result : -result;
    }
    if (sortBy === "pertanyaan_az") return (a.question || "").localeCompare(b.question || "");
    if (sortBy === "pertanyaan_za") return (b.question || "").localeCompare(a.question || "");
    if (sortBy === "tayang_tinggi") return (b.view_count || 0) - (a.view_count || 0);
    if (sortBy === "kepuasan_rendah") return (hitungKepuasan(a).rasio ?? 101) - (hitungKepuasan(b).rasio ?? 101);
    if (sortBy === "terbaru") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const pageItems = sorted.slice(page * perPage, page * perPage + perPage);
  const idHalamanIni = pageItems.map((f) => f.id);
  const semuaTerpilih = pageItems.length > 0 && idHalamanIni.every((id) => terpilih.includes(id));
  const sebagianTerpilih = !semuaTerpilih && idHalamanIni.some((id) => terpilih.includes(id));

  // Kondisi nyata baris terpilih, dipakai bilah aksi massal agar hanya
  // menampilkan tindakan yang benar-benar mengubah data.
  const faqTerpilih = faqs.filter((f) => terpilih.includes(f.id));
  const ringkasanTerpilih = {
    total: faqTerpilih.length,
    aktif: faqTerpilih.filter((f) => f.is_active).length,
    nonaktif: faqTerpilih.filter((f) => !f.is_active).length,
    tampil: faqTerpilih.filter((f) => f.show_on_landing).length,
    belumTampil: faqTerpilih.filter((f) => !f.show_on_landing).length,
    quick: faqTerpilih.filter((f) => f.is_quick_action).length,
  };

  const sisaQuickAction = Math.max(
    0,
    qaMaks - qaAktif + (editMode && isQuickAction ? 1 : 0)
  );

  // Papan urutan memakai data lengkap, bukan hasil pencarian,
  // supaya urutan tidak kacau saat admin sedang menyaring tabel.
  const daftarQuickAction = faqs
    .filter((f) => f.is_quick_action)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>FAQ &amp; Quick Action</h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-2xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Kelola jawaban otomatis chatbot &amp; quick action.</span>
            <span className="hidden sm:inline">Kelola jawaban otomatis chatbot, isi halaman FAQ publik, dan tombol quick action di widget chat peserta.</span>
          </p>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center py-20 sm:py-24 text-slate-400 text-xs sm:text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data FAQ...
          </div>
        ) : (
          <>
            <FaqStats
              total={faqs.length}
              aktif={faqs.filter((f) => f.is_active).length}
              quickAction={qaAktif}
              quickActionMaks={qaMaks}
              totalTayang={statistik.tayang}
              totalPenilaian={statistik.penilaian}
              rasioMembantu={statistik.penilaian > 0 ? (statistik.membantu / statistik.penilaian) * 100 : 0}
              perluDiperbaiki={statistik.perlu}
              isDark={isDark}
            />

            <div className={`rounded-2xl border shadow-sm overflow-hidden ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-5">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm sm:text-base font-black text-left ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      <span className="inline sm:hidden">Daftar FAQ</span>
                      <span className="hidden sm:inline">Daftar FAQ & Quick Action</span>
                    </h3>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-xl leading-relaxed text-left">
                      <span className="inline sm:hidden">Menyaring dan mengelola FAQ.</span>
                      <span className="hidden sm:inline">Gunakan tombol filter untuk menyaring FAQ berdasarkan status dan jenis tampilannya.</span>
                    </p>
                  </div>
                </div>

                {/* Aksi kartu header di pojok kanan (Hanya Desktop) */}
                <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setBukaImpor(true)}
                    className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    Impor CSV
                  </button>

                  <FaqExportDropdown onExport={handleExport} isDark={isDark} />

                  <button
                    onClick={openAddModal}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#00A5EC] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                    Tambah FAQ
                  </button>
                </div>
              </div>

              {/* Tombol Aksi Mobile (Tambah, Ekspor, Impor) berjejer 3 kolom dengan ukuran sama rata */}
              <div className="grid grid-cols-3 gap-1.5 px-3.5 pb-2.5 sm:hidden">
                <button
                  onClick={openAddModal}
                  className="group inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#00A5EC] px-2 py-2 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer min-w-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="truncate">Tambah</span>
                </button>

                <FaqExportDropdown onExport={handleExport} isDark={isDark} />

                <button
                  onClick={() => setBukaImpor(true)}
                  className={`group inline-flex w-full items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer min-w-0 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="truncate">Impor</span>
                </button>
              </div>

              {/* Baris Toolbar: Filter — Search */}
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 pb-3.5 sm:pb-5 border-b ${
                isDark ? "border-white/5" : "border-slate-100"
              }`}>
                {/* Desktop Sort & Filter */}
                <div className="hidden sm:flex items-center gap-2">
                  <FaqSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0 ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#00A5EC] text-white px-1 text-[9.5px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Search & Filter Bar Mobile / Desktop: Filter and Search side-by-side */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Mobile Only: Filter Button next to search input */}
                  <div className="block sm:hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(true)}
                      className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FilterIcon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      {activeFilterCountMobile > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00A5EC] text-white px-1 text-[8.5px] font-black">
                          {activeFilterCountMobile}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className={`relative flex-1 sm:w-64 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? (isDark ? "text-sky-400" : "text-[#004F9F]") + " scale-110" : "text-slate-400"}`} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => { setTableSearch(e.target.value); setPage(0); }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Cari pertanyaan..."
                      className={`w-full rounded-xl border pl-9 pr-4 py-2 sm:py-2.5 text-xs font-medium outline-none transition-all duration-200 ${
                        isDark
                          ? isSearchFocused
                            ? "border-[#00A5EC] bg-[#161b22] text-slate-100 placeholder-slate-500 ring-4 ring-[#00A5EC]/15"
                            : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                          : isSearchFocused
                          ? "border-[#004F9F] bg-white text-slate-700 placeholder-slate-400 shadow-md ring-4 ring-[#00A5EC]/15"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full sm:min-w-[920px] text-left text-[11px] sm:text-[13px] table-fixed sm:table-auto">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-white/5 bg-[#1f242c]" : "border-slate-100 bg-slate-50/60"}`}>
                      <th className="px-2 sm:px-5 py-3 sm:py-3.5 w-9 sm:w-10">
                        <KotakCentang
                          tercentang={semuaTerpilih}
                          sebagian={sebagianTerpilih}
                          onUbah={() => togglePilihSemua(idHalamanIni)}
                          judul="Pilih semua baris yang terlihat"
                        />
                      </th>
                      <SortableHeader column={columns[0]} columnSort={columnSort} setColumnSort={setColumnSort} isDark={isDark} className="w-auto sm:w-[250px] sm:max-w-[250px]" />
                      <SortableHeader column={columns[1]} columnSort={columnSort} setColumnSort={setColumnSort} isDark={isDark} className="hidden sm:table-cell sm:w-[130px] sm:max-w-[130px]" />
                      <th className="hidden sm:table-cell px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400 sm:w-[170px] sm:max-w-[170px]">Kata Kunci</th>
                      <SortableHeader column={columns[2]} columnSort={columnSort} setColumnSort={setColumnSort} isDark={isDark} className="hidden sm:table-cell sm:w-[150px] sm:max-w-[150px]" />
                      <SortableHeader column={columns[3]} columnSort={columnSort} setColumnSort={setColumnSort} isDark={isDark} className="w-20 sm:w-[120px] text-center" />
                      <th className="hidden sm:table-cell px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400 sm:w-[140px] sm:max-w-[140px]">Quick Action</th>
                      <th className="px-2 sm:px-6 py-3 sm:py-3.5 text-right text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 w-12 sm:w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
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
                                Coba ubah kata kunci pencarian atau filter status lainnya.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((f) => {
                        const dipilih = terpilih.includes(f.id);
                        const isExpanded = expandedRows.has(f.id);
                        const nilai = hitungKepuasan(f);
                        const aksi = LENCANA_AKSI[f.action_type || "jawaban"];
                        const IkonAksi = aksi?.ikon;
                        const IkonKategori = IKON_KATEGORI[f.category] || Layers;

                        return (
                          <Fragment key={f.id}>
                            <tr
                              className={`group border-b border-slate-50 dark:border-white/5 transition-colors duration-200 ${
                                dipilih
                                  ? isDark ? "bg-sky-500/10" : "bg-blue-50/60"
                                  : isDark ? "hover:bg-white/5" : "hover:bg-blue-50/30"
                              }`}
                            >
                              <td className="px-2 sm:px-5 py-2.5 sm:py-4 align-top w-9 sm:w-10">
                                <KotakCentang
                                  tercentang={dipilih}
                                  onUbah={() => togglePilih(f.id)}
                                  judul={dipilih ? "Batalkan pilihan baris ini" : "Pilih baris ini"}
                                />
                              </td>

                              <td
                                className="px-2 sm:px-6 py-2.5 sm:py-4 align-top w-auto sm:w-[250px] sm:max-w-[250px] cursor-pointer sm:cursor-default"
                                onClick={() => toggleRow(f.id)}
                              >
                                <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <div className={`text-[11px] sm:text-[12px] font-bold leading-snug break-words line-clamp-2 transition-colors duration-200 ${
                                        isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                                      }`}>
                                        <TeksKayaInline teks={f.question} />
                                      </div>
                                      <ChevronDown className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180 text-[#00A5EC]" : ""}`} />
                                    </div>
                                    <div className="mt-0.5 sm:mt-1 truncate text-[9.5px] sm:text-[10.5px] text-slate-400">
                                      <TeksKayaInline teks={f.answer} />
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[130px] sm:max-w-[130px] align-top">
                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                  isDark
                                    ? "bg-white/5 text-slate-300 group-hover:bg-[#00A5EC]/20 group-hover:text-sky-300"
                                    : "bg-slate-100 text-slate-600 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F]"
                                }`}>
                                  <IkonKategori className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                  {f.category || "Umum"}
                                </span>
                              </td>

                              <td className="hidden sm:table-cell px-6 py-4 w-[170px] max-w-[170px] align-top">
                                <p className={`whitespace-normal break-words text-[10.5px] leading-relaxed ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`} title={f.keywords || "-"}>{f.keywords || "-"}</p>
                              </td>

                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[150px] sm:max-w-[150px] align-top">
                                {nilai.total === 0 ? (
                                  <span className="text-[11px] text-slate-400">Belum dinilai</span>
                                ) : (
                                  <div className="w-36">
                                    <div className={`flex items-center justify-between text-[10.5px] font-bold mb-1 ${
                                      isDark ? "text-slate-400" : "text-slate-500"
                                    }`}>
                                      <span>{nilai.suka} suka · {nilai.tidak} tidak</span>
                                      <span className={nilai.perluPerbaikan ? "text-red-400" : ""}>{nilai.rasio}%</span>
                                    </div>
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                                      <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                          nilai.perluPerbaikan
                                            ? "bg-gradient-to-r from-red-600 to-red-400"
                                            : nilai.rasio >= 70
                                              ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                              : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                        }`}
                                        style={{ width: `${nilai.rasio}%` }}
                                      />
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-400">{f.view_count || 0} tayang</p>
                                  </div>
                                )}
                              </td>

                              <td className="px-1.5 sm:px-6 py-2.5 sm:py-4 w-20 sm:w-[120px] text-center align-top">
                                <div className="flex flex-col items-center sm:items-start gap-1">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                    f.is_active
                                      ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                      : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {f.is_active
                                      ? <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                      : <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />}
                                    <span>{f.is_active ? "Aktif" : "Nonaktif"}</span>
                                  </span>
                                  {f.show_on_landing && (
                                    <span className={`hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                      isDark ? "bg-sky-500/20 text-sky-400" : "bg-sky-50 text-sky-600"
                                    }`}>
                                      <Eye className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                      Tampil publik
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="hidden sm:table-cell px-6 py-4 sm:w-[140px] sm:max-w-[140px] align-top">
                                {f.is_quick_action ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                      isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600"
                                    }`}>
                                      <Zap className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                                      Tombol Cepat
                                    </span>
                                    {IkonAksi && (
                                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                        isDark ? "bg-white/10 text-slate-300" : aksi.kelas
                                      }`}>
                                        <IkonAksi className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        {aksi.teks}
                                      </span>
                                    )}
                                    {f.tampil_saat_status && (
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                                          isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
                                        }`}
                                        title={`Hanya untuk status: ${f.tampil_saat_status}`}
                                      >
                                        <Lock className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        Terbatas status
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">—</span>
                                )}
                              </td>

                              <td className="px-2 sm:px-6 py-2.5 sm:py-4 text-right align-top w-12 sm:w-20">
                                <FaqActionsDropdown onEdit={() => openEditModal(f)} onDelete={() => handleDelete(f)} isDark={isDark} />
                              </td>
                            </tr>

                            {/* Mobile Collapsible Accordion Row */}
                            <tr className="table-row sm:hidden">
                              <td colSpan={4} className="p-0">
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    isExpanded
                                      ? "max-h-[600px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]"
                                      : "max-h-0 opacity-0 p-0 border-none"
                                  }`}
                                >
                                  <div className="space-y-2.5 text-left text-[10.5px]">
                                    {/* Kategori & Publik */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Kategori:</span>
                                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                                          isDark ? "bg-white/10 text-slate-200" : "bg-white text-slate-700 ring-1 ring-slate-200"
                                        }`}>
                                          <IkonKategori className="h-3 w-3" />
                                          {f.category || "Umum"}
                                        </span>
                                      </div>

                                      {f.show_on_landing && (
                                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                          isDark ? "bg-sky-500/20 text-sky-400" : "bg-sky-50 text-sky-600"
                                        }`}>
                                          <Eye className="h-2.5 w-2.5" />
                                          Publik
                                        </span>
                                      )}
                                    </div>

                                    {/* Jawaban */}
                                    <div>
                                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Jawaban:</span>
                                      <div className={`text-[10.5px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                        <TeksKaya teks={f.answer} />
                                      </div>
                                    </div>

                                    {/* Kata Kunci */}
                                    {f.keywords && (
                                      <div>
                                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Kata Kunci:</span>
                                        <p className={`text-[10.5px] font-medium leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                          {f.keywords}
                                        </p>
                                      </div>
                                    )}

                                    {/* Kepuasan */}
                                    <div>
                                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">Kepuasan:</span>
                                      {nilai.total === 0 ? (
                                        <span className="text-[10.5px] text-slate-400">Belum dinilai</span>
                                      ) : (
                                        <div className="space-y-1">
                                          <div className={`flex items-center justify-between text-[10px] font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                            <span>{nilai.suka} suka · {nilai.tidak} tidak ({f.view_count || 0} tayang)</span>
                                            <span className={nilai.perluPerbaikan ? "text-red-400 font-black" : "font-black"}>{nilai.rasio}%</span>
                                          </div>
                                          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                                            <div
                                              className={`h-full rounded-full ${
                                                nilai.perluPerbaikan
                                                  ? "bg-gradient-to-r from-red-600 to-red-400"
                                                  : nilai.rasio >= 70
                                                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                                  : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                              }`}
                                              style={{ width: `${nilai.rasio}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Quick Action Info */}
                                    <div>
                                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">Quick Action:</span>
                                      {f.is_quick_action ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                                            isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600"
                                          }`}>
                                            <Zap className="h-2.5 w-2.5" />
                                            Tombol Cepat
                                          </span>
                                          {IkonAksi && (
                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                                              isDark ? "bg-white/10 text-slate-300" : aksi.kelas
                                            }`}>
                                              <IkonAksi className="h-2.5 w-2.5" />
                                              {aksi.teks}
                                            </span>
                                          )}
                                          {f.tampil_saat_status && (
                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                                              isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
                                            }`}>
                                              <Lock className="h-2.5 w-2.5" />
                                              {f.tampil_saat_status}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10.5px] text-slate-400 italic">Bukan tombol cepat</span>
                                      )}
                                    </div>
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

              <Pagination totalItems={sorted.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} isDark={isDark} />
            </div>

            {/* Papan urutan + pratinjau, berdampingan pada layar lebar */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2 xl:items-start">
              <QuickActionBoard
                key={versiData}
                daftarAwal={daftarQuickAction}
                onSimpan={handleReorder}
                menyimpan={menyimpanUrutan}
                isDark={isDark}
              />
              <PratinjauQuickAction pemicuMuatUlang={versiData} isDark={isDark} />
            </div>
          </>
        )}
      </div>

      <BilahAksiMassal
        jumlah={terpilih.length}
        ringkasan={ringkasanTerpilih}
        sibuk={sibukMassal}
        onAksi={jalankanAksiMassal}
        onTutup={() => setTerpilih([])}
      />

      {showFilterModal && (
        <FaqFilterModal
          statusList={statusList}
          toggleStatus={toggleStatus}
          jenisList={jenisList}
          toggleJenis={toggleJenis}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
          isDark={isDark}
        />
      )}

      {bukaImpor && (
        <DialogImporCsv onTutup={() => setBukaImpor(false)} onSelesai={fetchFaqs} />
      )}

      {showModal && (
        <FaqModal
          editMode={editMode}
          question={question} setQuestion={setQuestion}
          answer={answer} setAnswer={setAnswer}
          keywords={keywords} setKeywords={setKeywords}
          category={category} setCategory={setCategory}
          quickLabel={quickLabel} setQuickLabel={setQuickLabel}
          isActive={isActive} setIsActive={setIsActive}
          showOnLanding={showOnLanding} setShowOnLanding={setShowOnLanding}
          isQuickAction={isQuickAction} setIsQuickAction={setIsQuickAction}
          actionType={actionType} setActionType={setActionType}
          actionTarget={actionTarget} setActionTarget={setActionTarget}
          quickIcon={quickIcon} setQuickIcon={setQuickIcon}
          tampilSaatStatus={tampilSaatStatus} setTampilSaatStatus={setTampilSaatStatus}
          sisaQuickAction={sisaQuickAction}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default FaqPage;