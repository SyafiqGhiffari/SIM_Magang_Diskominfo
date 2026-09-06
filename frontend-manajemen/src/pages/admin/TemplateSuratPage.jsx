import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import TemplateSuratDesigner from "../../components/manajemen/admin/surat/TemplateSuratDesigner";
import TemplateSuratPreview from "../../components/manajemen/admin/surat/TemplateSuratPreview";
import TemplateSuratSortDropdown from "../../components/manajemen/admin/surat/TemplateSuratSortDropdown";
import TemplateSuratFilterModal from "../../components/manajemen/admin/surat/TemplateSuratFilterModal";
import {
  getAllTemplateSurat, deleteTemplateSurat, duplikatTemplateSurat,
} from "../../services/suratPenerimaanService";
import { confirmDialog, toastError, toastSuccess } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  FileSignature, Plus, Pencil, Trash2, Copy, Loader2, Inbox, Search,
  Filter as FilterIcon, Eye, X, GraduationCap, BadgeCheck, Image as ImageIcon,
  PenTool, Stamp, LayoutTemplate, CheckCircle2, FileEdit,
} from "lucide-react";

// Jumlah aset gambar yang sudah diunggah (logo, ttd, stempel)
const countAset = (tpl) => [tpl?.file_logo, tpl?.file_ttd, tpl?.file_stempel].filter(Boolean).length;

const labelPeserta = (tpl) => {
  const v = tpl?.jenis_peserta || "semua";
  if (v === "mahasiswa") return "Mahasiswa";
  if (v === "siswa") return "Siswa";
  return "Semua Peserta";
};

const TemplateSuratPage = () => {
  const { isDark } = useManajemenTheme();
  const [templates, setTemplates] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [designer, setDesigner] = useState(null); // { template } | { template: null }
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const emptyFilters = { jenis_peserta: [], status: [], aset: [] };
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleFilter = (group, key) =>
    setFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(key) ? prev[group].filter((k) => k !== key) : [...prev[group], key],
    }));

  const openFilter = () => { setFilters(appliedFilters); setShowFilterModal(true); };
  const applyFilter = () => setAppliedFilters(filters);
  const resetFilter = () => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setSortBy("terbaru"); };

  const fetchTemplates = async () => {
    try {
      const res = await getAllTemplateSurat();
      setTemplates(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat template surat.");
    } finally {
      setLoadingTpl(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchTemplates(); }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Tutup modal pratinjau dengan tombol Escape
  useEffect(() => {
    if (!previewTemplate) return;
    const onKey = (e) => { if (e.key === "Escape") setPreviewTemplate(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewTemplate]);

  const openCreateTemplate = () => setDesigner({ template: null });
  const openEditTemplate = (tpl) => setDesigner({ template: tpl });

  const duplikat = async (tpl) => {
    try {
      await duplikatTemplateSurat(tpl.id);
      toastSuccess("Template berhasil diduplikat");
      fetchTemplates();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menduplikat template.");
    }
  };

  const handleDeleteTemplate = async (tpl) => {
    const result = await confirmDialog({
      title: `Hapus template "${tpl.nama}"?`,
      text: "Template beserta logo, tanda tangan, dan stempelnya akan dihapus permanen.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteTemplateSurat(tpl.id);
      toastSuccess("Template berhasil dihapus");
      fetchTemplates();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus template.");
    }
  };

  const filtered = templates
    .filter((t) => {
      const s = search.toLowerCase();
      return (
        (t.nama || "").toLowerCase().includes(s) ||
        (t.keterangan || "").toLowerCase().includes(s) ||
        (t.nama_instansi || "").toLowerCase().includes(s)
      );
    })
    .filter((t) => (appliedFilters.jenis_peserta.length === 0 ? true : appliedFilters.jenis_peserta.includes(t.jenis_peserta || "semua")))
    .filter((t) => (appliedFilters.status.length === 0 ? true : appliedFilters.status.includes(t.status || "draft")))
    .filter((t) => {
      if (appliedFilters.aset.length === 0) return true;
      return appliedFilters.aset.every((k) =>
        k === "logo" ? Boolean(t.file_logo) : k === "ttd" ? Boolean(t.file_ttd) : Boolean(t.file_stempel)
      );
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "nama_za": return (b.nama || "").localeCompare(a.nama || "", "id");
      case "nama_az": return (a.nama || "").localeCompare(b.nama || "", "id");
      case "status": return (b.status === "publish" ? 1 : 0) - (a.status === "publish" ? 1 : 0);
      case "terbaru": return new Date(b.created_at || b.CreatedAt || 0) - new Date(a.created_at || a.CreatedAt || 0);
      case "terlama": return new Date(a.created_at || a.CreatedAt || 0) - new Date(b.created_at || b.CreatedAt || 0);
      default: return (a.nama || "").localeCompare(b.nama || "", "id");
    }
  });

  const activeFilterCount = Object.values(appliedFilters).reduce((n, arr) => n + arr.length, 0);
  const activeFilterCountMobile = activeFilterCount + (sortBy ? 1 : 0);

  const totalTemplate = templates.length;
  const totalPublish = templates.filter((t) => t.status === "publish").length;
  const totalDraft = templates.filter((t) => (t.status || "draft") !== "publish").length;
  const totalAsetLengkap = templates.filter((t) => countAset(t) === 3).length;

  return (
    <AdminLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Template Surat Penerimaan</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Kelola berbagai desain surat penerimaan magang. Atur kop, redaksi, penandatangan, dan tata letak PDF tanpa mengubah kode, lalu pilih templatenya saat menerbitkan surat.
            </span>
            <span className="inline sm:hidden">
              Kelola kop, redaksi, penandatangan, dan tata letak PDF surat penerimaan.
            </span>
          </p>
        </div>

        {/* Statistik ringkas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[
            { icon: LayoutTemplate, label: "Total Template", value: totalTemplate, caption: "Desain surat tersimpan", lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]", iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600" },
            { icon: CheckCircle2, label: "Publish", value: totalPublish, caption: "Siap dipakai menerbitkan", lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700", iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
            { icon: FileEdit, label: "Draft", value: totalDraft, caption: "Belum bisa dipilih admin", lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700", iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600" },
            { icon: ImageIcon, label: "Aset Lengkap", value: totalAsetLengkap, caption: "Logo, tanda tangan, stempel", lightGradient: "from-sky-300 to-white", gradient: "from-sky-500 to-sky-700", iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-600" },
          ].map((c, i) => (
            <div key={i} className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              isDark ? "border-white/10 bg-[#161b22]" : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
            }`}>
              <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-sm font-bold tracking-wide truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.label}</p>
                  <h3 className={`mt-1 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0B1442]"}`}>{c.value}</h3>
                  <p className={`mt-1.5 sm:mt-2 text-[9px] sm:text-xs font-medium leading-snug ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.caption}</p>
                </div>
                <span className={`flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                  <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
          {/* Header card */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <FileSignature className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </span>
              <div className="min-w-0 text-left">
                <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Daftar Template
                </h3>
                <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-xl leading-relaxed">
                  <span className="hidden sm:inline">Simpan beberapa versi surat, lalu pilih templatenya saat menerbitkan surat penerimaan.</span>
                  <span className="inline sm:hidden">Pilih template saat menerbitkan surat penerimaan.</span>
                </p>
              </div>
            </div>
            <button
              onClick={openCreateTemplate}
              className="group inline-flex items-center gap-1 sm:gap-2 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
              <span className="hidden sm:inline">Tambah Template</span>
              <span className="inline sm:hidden">Tambah</span>
            </button>
          </div>

          {/* Toolbar: Urutkan — Filter — Search */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-4 border-b ${isDark ? "border-white/5 bg-[#161b22]/30" : "border-slate-100"}`}>
            
            {/* Desktop Only: SortDropdown + Filter button */}
            <div className="hidden sm:flex items-center gap-2.5">
              <TemplateSuratSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
              
              <button
                onClick={openFilter}
                className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
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

            {/* Mobile/All: Filter and Search row */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mobile Only: Filter Button */}
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

              {/* Search input */}
              <div className={`relative flex-1 sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "scale-[1.01]" : ""}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? (isDark ? "text-[#00A5EC] scale-110" : "text-[#004F9F] scale-110") : "text-slate-400"}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari sesuatu..."
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 sm:py-2.5 text-xs font-medium outline-none transition-all duration-200 ${
                    isSearchFocused
                      ? isDark
                        ? "border-[#00A5EC] bg-white/[0.07] shadow-md ring-4 ring-[#00A5EC]/20 text-slate-200"
                        : "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15 text-slate-700"
                      : isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"
                  }`}
                />
              </div>
            </div>

          </div>

          {/* Grid daftar template */}
          <div className="p-4 sm:p-6">
            {loadingTpl ? (
              <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat template...
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 py-10 sm:py-16 text-center animate-[fadeslide_0.3s_ease-out]">
                <span className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                }`}>
                  <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className={`absolute inset-0 animate-ping rounded-xl sm:rounded-2xl border-2 opacity-40 ${
                    isDark ? "border-white/10" : "border-slate-200"
                  }`} />
                </span>
                <div>
                  <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {templates.length === 0 ? "Belum ada template surat" : "Template tidak ditemukan"}
                  </p>
                  <p className="mt-0.5 max-w-[260px] sm:max-w-xs text-[10px] sm:text-xs text-slate-400">
                    {templates.length === 0
                      ? <>Klik <span className="font-bold text-[#004F9F]">Tambah Template</span> untuk membuat desain surat pertama.</>
                      : "Coba kata kunci atau filter lain."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sorted.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isDark ? "border-white/10 bg-[#1e2530]" : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Pratinjau surat */}
                    <div
                      onClick={() => setPreviewTemplate(tpl)}
                      className={`relative flex aspect-[1/0.9] w-full flex-col overflow-hidden px-2.5 pt-2 pb-2.5 cursor-pointer ${
                        isDark ? "bg-[#161b22]" : "bg-[radial-gradient(circle_at_25%_15%,#eef5ff_0%,#f1f5f9_55%,#e7edf7_100%)]"
                      }`}
                    >
                      {/* Badge di baris paling atas */}
                      <div className="relative z-10 flex shrink-0 items-center justify-between gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-white shadow-md ring-1 ring-white/25">
                          <GraduationCap className="w-2.5 h-2.5" /> {labelPeserta(tpl)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-md ring-1 ${
                            tpl.status === "publish"
                              ? isDark ? "bg-[#102a1e] text-emerald-400 ring-emerald-900/30" : "bg-white text-emerald-600 ring-emerald-200"
                              : isDark ? "bg-[#332200] text-amber-400 ring-amber-900/30" : "bg-white text-amber-600 ring-amber-200"
                          }`}
                        >
                          {tpl.status === "publish" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <FileEdit className="w-2.5 h-2.5" />}
                          {tpl.status === "publish" ? "Publish" : "Draft"}
                        </span>
                      </div>

                      {/* Kertas surat di bawah badge */}
                      <div className="mt-2 flex min-h-0 flex-1 items-start justify-center">
                        <div className="h-full aspect-[1/1.414] overflow-hidden rounded-sm shadow-[0_10px_24px_-14px_rgba(11,20,66,0.45)] transition-transform duration-500 group-hover:scale-[1.02]">
                          <TemplateSuratPreview template={tpl} base={2.5} />
                        </div>
                      </div>

                      {/* Overlay saat hover — tombol pratinjau (Hanya desktop) */}
                      <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center bg-gradient-to-t from-[#0B1442]/75 via-[#0B1442]/15 to-[#0B1442]/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewTemplate(tpl); }}
                          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-black text-[#0B1442] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Pratinjau surat lengkap
                        </button>
                      </div>
                    </div>

                    {/* Info + aksi */}
                    <div className={`relative flex flex-1 flex-col overflow-hidden p-2.5 sm:p-3 ${
                      isDark ? "bg-[#1b222d]" : "bg-gradient-to-br from-blue-50/60 to-white"
                    }`}>
                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-[#004F9F] to-[#0B1442] opacity-[0.12] blur-xl transition-all duration-300 group-hover:opacity-[0.22] group-hover:scale-125" />

                      <div className="relative flex items-start gap-1.5 sm:gap-2">
                        <span className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                          isDark ? "bg-white/5 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"
                        }`}>
                          <FileSignature className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 text-left">
                          <h4 className={`text-[11px] sm:text-[12.5px] font-black leading-snug tracking-tight break-words transition-colors duration-200 ${isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"}`}>{tpl.nama}</h4>
                          <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium leading-snug text-slate-400 break-words whitespace-normal">
                            {tpl.keterangan || "Tanpa keterangan"}
                          </p>
                        </div>
                      </div>

                      <div className="relative mt-2 flex flex-wrap items-center gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[8px] sm:text-[9px] font-bold ring-1 ring-inset ${
                          isDark ? "bg-white/5 text-slate-300 ring-white/10" : "bg-white/80 text-slate-500 ring-slate-200/70"
                        }`}>
                          <GraduationCap className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {labelPeserta(tpl)}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[8px] sm:text-[9px] font-bold ring-1 ring-inset ${
                          isDark ? "bg-white/5 text-slate-300 ring-white/10" : "bg-white/80 text-slate-500 ring-slate-200/70"
                        }`}>
                          <BadgeCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {tpl.status === "publish" ? "Publish" : "Draft"}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[8px] sm:text-[9px] font-bold ring-1 ring-inset ${
                          isDark ? "bg-sky-500/10 text-sky-400 ring-sky-500/20" : "bg-blue-50 text-[#004F9F] ring-blue-100"
                        }`}>
                          <ImageIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {countAset(tpl)}/3
                        </span>
                      </div>

                      <div className="relative mt-auto flex items-center gap-1.5 pt-2.5">
                        <button
                          onClick={() => openEditTemplate(tpl)}
                          className="group/edit inline-flex h-7.5 sm:h-8.5 flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2 text-[10px] sm:text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 transition-transform duration-300 group-hover/edit:-rotate-12" /> Atur Desain
                        </button>
                        <button
                          onClick={() => setPreviewTemplate(tpl)}
                          title="Pratinjau template"
                          className={`inline-flex sm:hidden h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                            isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => duplikat(tpl)}
                          title="Duplikat template"
                          className={`inline-flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                            isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(tpl)}
                          title="Hapus template"
                          className={`inline-flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                            isDark ? "border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/25" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Garis gradien saat hover */}
                    <div className="absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#004F9F] to-[#0B1442] transition-transform duration-500 group-hover:scale-x-100" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {designer && (
        <TemplateSuratDesigner
          template={designer.template}
          onClose={() => setDesigner(null)}
          onSaved={fetchTemplates}
        />
      )}

      {showFilterModal && (
        <TemplateSuratFilterModal
          filters={filters}
          toggleFilter={toggleFilter}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          isDark={isDark}
        />
      )}

      {/* Modal pratinjau surat lengkap */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-[#050B24]/85 via-[#0B1442]/80 to-[#00284F]/85 p-4 backdrop-blur-md animate-[tplFade_0.25s_ease-out]"
          onClick={() => setPreviewTemplate(null)}
        >
          <style>{`
            @keyframes tplFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes tplPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
            @keyframes tplShine { from { transform: translateX(-120%) skewX(-18deg) } to { transform: translateX(320%) skewX(-18deg) } }
          `}</style>

          <div
            className={`flex max-h-[93vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl shadow-[0_35px_90px_-20px_rgba(0,0,0,0.65)] ring-1 animate-[tplPop_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
              isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-black/5"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] px-4 py-3 sm:px-5 sm:py-4 text-white">
              <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-[#00A5EC]/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="group/icon grid h-8 w-8 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-lg sm:rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25">
                    <FileSignature className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/icon:rotate-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs sm:text-base font-black tracking-tight text-white">{previewTemplate.nama}</h3>
                    <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ring-white/20 transition-colors duration-200 hover:bg-white/25">
                        <GraduationCap className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {labelPeserta(previewTemplate)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase ring-1 ring-inset ring-white/20 transition-colors duration-200 hover:bg-white/25">
                        <BadgeCheck className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {previewTemplate.status === "publish" ? "Publish" : "Draft"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        <ImageIcon className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {previewTemplate.file_logo ? "Logo" : "Tanpa logo"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        <PenTool className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {previewTemplate.file_ttd ? "TTD" : "Tanpa TTD"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        <Stamp className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {previewTemplate.file_stempel ? "Stempel" : "Tanpa stempel"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  title="Tutup (Esc)"
                  className="group/x grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg sm:rounded-xl bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-red-500/90 hover:text-white hover:ring-red-300/40 active:scale-90 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Isi: surat */}
            <div className={`relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 ${
              isDark ? "bg-[#0b0f19]" : "bg-[radial-gradient(circle_at_20%_10%,#eef5ff_0%,#f1f5f9_55%,#e4ebf6_100%)]"
            }`}>
              <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(#0b144210_1px,transparent_1px),linear-gradient(90deg,#0b144210_1px,transparent_1px)] [background-size:28px_28px]" />

              <div className="group/sheet relative mx-auto w-[72vw] sm:w-full max-w-[280px] sm:max-w-2xl">
                <div className="pointer-events-none absolute inset-6 rounded-2xl bg-gradient-to-r from-[#00A5EC]/0 via-[#004F9F]/25 to-[#00A5EC]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover/sheet:opacity-100" />

                <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-sm shadow-2xl transition-transform duration-500 ease-out will-change-transform group-hover/sheet:-translate-y-1.5 group-hover/sheet:scale-[1.01]">
                  <TemplateSuratPreview template={previewTemplate} base={isMobile ? 4.2 : 9} />

                  {/* Kilau menyapu saat hover */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 group-hover/sheet:opacity-100 group-hover/sheet:animate-[tplShine_1.1s_ease-out]" />
                  </div>
                </div>
              </div>

              <p className="relative mt-4 text-center text-[10.5px] sm:text-[11px] font-semibold text-slate-400">
                Data peserta di atas hanyalah contoh
                <span className="hidden sm:inline"> · tekan <span className="rounded border border-slate-350 bg-white/95 dark:border-white/10 dark:bg-white/5 px-1 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">Esc</span> untuk menutup</span>
              </p>
            </div>

            {/* Footer */}
            <div className={`flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur ${
              isDark ? "border-white/5 bg-[#161b22]/95" : "border-slate-100 bg-white/90"
            }`}>
              <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-400 sm:inline-flex">
                <Eye className="w-3.5 h-3.5" /> Pratinjau kasar tata letak; hasil akhir mengikuti PDF yang digenerate
              </span>
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className={`rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                    isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tpl = previewTemplate;
                    setPreviewTemplate(null);
                    openEditTemplate(tpl);
                  }}
                  className="group/edit inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] bg-[length:200%_100%] bg-left px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-lg hover:shadow-[#004F9F]/30 active:scale-95 cursor-pointer"
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover/edit:-rotate-12" /> Atur Desain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default TemplateSuratPage;