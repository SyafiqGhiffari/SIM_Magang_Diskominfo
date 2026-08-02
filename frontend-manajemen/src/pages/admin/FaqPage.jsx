import { useEffect, useState } from "react";
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
    setPage(0);
  };

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

  const activeFilterCount = (appliedStatusList.length > 0 ? 1 : 0) + (appliedJenisList.length > 0 ? 1 : 0);

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
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>FAQ &amp; Quick Action</h2>
          <p className={`mt-1.5 text-xs max-w-2xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Kelola jawaban otomatis chatbot, isi halaman FAQ publik, dan tombol quick action di widget chat peserta.
          </p>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
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
            />

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <HelpCircle className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-[#0B1442]">Daftar FAQ</h3>
                      <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                        Gunakan tombol filter untuk menyaring FAQ berdasarkan status dan jenis tampilannya.
                      </p>
                    </div>
                  </div>

                  {/* Semua aksi kartu tabel: impor, ekspor, dan tambah FAQ */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-start">
                    <button
                      onClick={() => setBukaImpor(true)}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      Impor CSV
                    </button>

                    <FaqExportDropdown onExport={handleExport} />

                    <button
                      onClick={openAddModal}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                      Tambah FAQ
                    </button>
                  </div>
                </div>

                {/* Baris kedua: Urutkan — Filter — Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <FaqSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
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
                      value={tableSearch}
                      onChange={(e) => { setTableSearch(e.target.value); setPage(0); }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Cari pertanyaan atau kata kunci..."
                      className={`w-full rounded-xl border pl-9 pr-9 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                        isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="px-5 py-3.5 w-10">
                          <KotakCentang
                            tercentang={semuaTerpilih}
                            sebagian={sebagianTerpilih}
                            onUbah={() => togglePilihSemua(idHalamanIni)}
                            judul="Pilih semua baris yang terlihat"
                          />
                        </th>
                        <SortableHeader column={columns[0]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <SortableHeader column={columns[1]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <th className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">Kata Kunci</th>
                        <SortableHeader column={columns[2]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <SortableHeader column={columns[3]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <th className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">Quick Action</th>
                        <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr className="animate-[fadeslide_0.3s_ease-out]">
                          <td colSpan={8} className="px-6 py-16">
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                <Inbox className="w-6 h-6" />
                                <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                              </span>
                              <p className="text-sm font-bold text-slate-500">Belum ada FAQ yang sesuai</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((f) => {
                          const dipilih = terpilih.includes(f.id);
                          const nilai = hitungKepuasan(f);
                          const aksi = LENCANA_AKSI[f.action_type || "jawaban"];
                          const IkonAksi = aksi?.ikon;
                          const IkonKategori = IKON_KATEGORI[f.category] || Layers;

                          return (
                            <tr
                              key={f.id}
                              className={`group border-b border-slate-50 transition-colors duration-200 ${
                                dipilih ? "bg-blue-50/60" : "hover:bg-blue-50/30"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <KotakCentang
                                  tercentang={dipilih}
                                  onUbah={() => togglePilih(f.id)}
                                  judul={dipilih ? "Batalkan pilihan baris ini" : "Pilih baris ini"}
                                />
                              </td>

                              <td className="px-6 py-4 w-[250px] max-w-[250px] align-top">
                                <p className="text-[12px] font-bold leading-snug text-[#0B1442] line-clamp-2">{f.question}</p>
                                <p className="mt-1 truncate text-[10.5px] text-slate-400">{f.answer}</p>
                              </td>

                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F] group-hover:shadow-sm">
                                  <IkonKategori className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                  {f.category || "Umum"}
                                </span>
                              </td>

                              <td className="px-6 py-4 w-[170px] max-w-[170px] align-top">
                                <p className="whitespace-normal break-words text-[10.5px] leading-relaxed text-slate-500" title={f.keywords || "-"}>{f.keywords || "-"}</p>
                              </td>

                              <td className="px-6 py-4">
                                {nilai.total === 0 ? (
                                  <span className="text-[11px] text-slate-300">Belum dinilai</span>
                                ) : (
                                  <div className="w-36">
                                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 mb-1">
                                      <span>{nilai.suka} suka · {nilai.tidak} tidak</span>
                                      <span className={nilai.perluPerbaikan ? "text-red-500" : ""}>{nilai.rasio}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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

                              <td className="px-6 py-4">
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${f.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                    {f.is_active
                                      ? <CheckCircle2 className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                      : <XCircle className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />}
                                    {f.is_active ? "Aktif" : "Nonaktif"}
                                  </span>
                                  {f.show_on_landing && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm">
                                      <Eye className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                      Tampil publik
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                {f.is_quick_action ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm">
                                      <Zap className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                                      Tombol Cepat
                                    </span>
                                    {IkonAksi && (
                                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${aksi.kelas}`}>
                                        <IkonAksi className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        {aksi.teks}
                                      </span>
                                    )}
                                    {f.tampil_saat_status && (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm"
                                        title={`Hanya untuk status: ${f.tampil_saat_status}`}
                                      >
                                        <Lock className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        Terbatas status
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-300">—</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-right">
                                <FaqActionsDropdown onEdit={() => openEditModal(f)} onDelete={() => handleDelete(f)} />
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

            {/* Papan urutan + pratinjau, berdampingan pada layar lebar */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
              <QuickActionBoard
                key={versiData}
                daftarAwal={daftarQuickAction}
                onSimpan={handleReorder}
                menyimpan={menyimpanUrutan}
              />
              <PratinjauQuickAction pemicuMuatUlang={versiData} />
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
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilterModal(false)}
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