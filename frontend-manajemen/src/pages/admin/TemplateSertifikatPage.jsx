import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import TemplateDesignerModal from "../../components/manajemen/admin/sertifikat/TemplateDesignerModal";
import TemplatePreview from "../../components/manajemen/admin/sertifikat/TemplatePreview";
import TemplateSortDropdown from "../../components/manajemen/admin/sertifikat/TemplateSortDropdown";
import TemplateFilterModal from "../../components/manajemen/admin/sertifikat/TemplateFilterModal";
import { getAllTemplateSertifikat, deleteTemplateSertifikat } from "../../services/adminService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { Palette, Plus, Pencil, Trash2, Inbox, Loader2, Search, Monitor, Smartphone, Tags, Eye, GraduationCap, Type, FileText, Image as ImageIcon, X, Filter as FilterIcon } from "lucide-react";

// Jumlah field aktif pada sebuah template (untuk badge di kartu)
const countFields = (tpl) => {
  try {
    const obj = JSON.parse(tpl?.konfigurasi_field || "{}");
    return Array.isArray(obj.fields) ? obj.fields.filter((f) => f?.enabled !== false).length : 0;
  } catch {
    return 0;
  }
};

const TemplateSertifikatPage = () => {
  const { isDark } = useManajemenTheme();
  const [templates, setTemplates] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [showDesigner, setShowDesigner] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");

  const emptyFilters = { orientasi: [], jenis_peserta: [], tipe_template: [], kategori: [] };
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
  const resetFilter = () => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setSortBy("nama_az"); };

  const fetchTemplates = async () => {
    try {
      const res = await getAllTemplateSertifikat();
      setTemplates(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat template.");
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
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewTemplate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewTemplate]);

  const openCreateTemplate = () => { setActiveTemplate(null); setShowDesigner(true); };
  const openEditTemplate = (tpl) => { setActiveTemplate(tpl); setShowDesigner(true); };
  const handleDeleteTemplate = async (tpl) => {
    const result = await confirmDialog({
      title: `Hapus template "${tpl.nama}"?`,
      text: "Template beserta file background, tanda tangan, dan stempelnya akan dihapus permanen.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteTemplateSertifikat(tpl.id);
      toastSuccess("Template berhasil dihapus");
      fetchTemplates();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus template.");
    }
  };

  const kategoriOptions = [...new Set(["Magang", "PKL", ...templates.map((t) => t.kategori).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "id"));

  const filtered = templates
    .filter((t) => {
      const s = search.toLowerCase();
      return (t.nama || "").toLowerCase().includes(s) || (t.kategori || "").toLowerCase().includes(s);
    })
    .filter((t) => (appliedFilters.orientasi.length === 0 ? true : appliedFilters.orientasi.includes(t.orientasi || "landscape")))
    .filter((t) => (appliedFilters.jenis_peserta.length === 0 ? true : appliedFilters.jenis_peserta.includes(t.jenis_peserta || "mahasiswa")))
    .filter((t) => (appliedFilters.tipe_template.length === 0 ? true : appliedFilters.tipe_template.includes(t.tipe_template || "image")))
    .filter((t) => (appliedFilters.kategori.length === 0 ? true : appliedFilters.kategori.includes(t.kategori)));

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "nama_za": return (b.nama || "").localeCompare(a.nama || "", "id");
      case "kategori_az": return (a.kategori || "").localeCompare(b.kategori || "", "id");
      case "terbaru": return new Date(b.created_at || b.CreatedAt || 0) - new Date(a.created_at || a.CreatedAt || 0);
      case "terlama": return new Date(a.created_at || a.CreatedAt || 0) - new Date(b.created_at || b.CreatedAt || 0);
      case "field_terbanyak": return countFields(b) - countFields(a);
      default: return (a.nama || "").localeCompare(b.nama || "", "id");
    }
  });

  const activeFilterCount = Object.values(appliedFilters).reduce((n, arr) => n + arr.length, 0);
  const activeFilterCountMobile = activeFilterCount + (sortBy ? 1 : 0);

  const totalTemplate = templates.length;
  const totalLandscape = templates.filter((t) => (t.orientasi || "landscape") === "landscape").length;
  const totalPortrait = templates.filter((t) => t.orientasi === "portrait").length;
  const totalKategori = new Set(templates.map((t) => t.kategori).filter(Boolean)).size;

  return (
    <AdminLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Template Sertifikat</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Kelola berbagai desain template sertifikat. Unggah background lalu atur posisi field yang akan terisi otomatis saat sertifikat diterbitkan.
            </span>
            <span className="inline sm:hidden">
              Kelola desain template, background, dan posisi field sertifikat.
            </span>
          </p>
        </div>

        {/* Statistik ringkas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[
            { icon: Palette, label: "Total Template", value: totalTemplate, caption: "Desain tersimpan", lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]", iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600" },
            { icon: Monitor, label: "Landscape", value: totalLandscape, caption: "Orientasi mendatar", lightGradient: "from-sky-300 to-white", gradient: "from-sky-500 to-sky-700", iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-600" },
            { icon: Smartphone, label: "Portrait", value: totalPortrait, caption: "Orientasi tegak", lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700", iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600" },
            { icon: Tags, label: "Kategori", value: totalKategori, caption: "Jenis kategori berbeda", lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700", iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
          ].map((c, i) => (
            <div key={i} className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              isDark ? "border-white/10 bg-[#161b22]" : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
            }`}>
              <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-sm font-bold tracking-wide truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.label}</p>
                  <h3 className={`mt-1 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0B1442]"}`}>{c.value}</h3>
                  <p className={`mt-1.5 sm:mt-2 text-[9px] sm:text-xs font-medium leading-snug whitespace-normal break-words ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.caption}</p>
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
                <Palette className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </span>
              <div className="min-w-0 text-left">
                <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                  Daftar Template
                </h3>
                <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-xl leading-relaxed">
                  <span className="hidden sm:inline">Simpan beberapa desain template yang bisa dipilih saat menerbitkan sertifikat peserta.</span>
                  <span className="inline sm:hidden">Pilih template saat menerbitkan sertifikat peserta.</span>
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
              <TemplateSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />
              
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
                  placeholder="Cari nama atau kategori..."
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
                    {templates.length === 0 ? "Belum ada template sertifikat" : "Template tidak ditemukan"}
                  </p>
                  <p className="mt-0.5 max-w-[260px] sm:max-w-xs text-[10px] sm:text-xs text-slate-400">
                    {templates.length === 0
                      ? <>Klik <span className="font-bold text-[#004F9F]">Tambah Template</span> untuk membuat desain sertifikat pertama.</>
                      : "Coba kata kunci atau filter lain."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                {sorted.map((tpl) => (
                    <div
                      key={tpl.id}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isDark ? "border-white/10 bg-[#1e2530]" : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* Pratinjau desain: background + seluruh field */}
                      <div
                        onClick={() => setPreviewTemplate(tpl)}
                        className={`relative aspect-[16/10] w-full overflow-hidden p-2.5 sm:p-3.5 cursor-pointer ${
                          isDark ? "bg-[#161b22]" : "bg-[radial-gradient(circle_at_25%_15%,#eef5ff_0%,#f1f5f9_55%,#e7edf7_100%)]"
                        }`}
                      >
                        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                          <TemplatePreview template={tpl} />
                        </div>

                        <span className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 z-10 rounded-full bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2 sm:px-3 py-0.5 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wide text-white shadow-md ring-1 ring-white/25">
                          {tpl.kategori || "Umum"}
                        </span>
                        <span className={`absolute right-2.5 sm:right-3 top-2.5 sm:top-3 z-10 inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider shadow-md ring-1 ${
                          isDark ? "bg-[#161b22] text-sky-400 ring-sky-900/30" : "bg-white text-[#004F9F] ring-[#004F9F]/20"
                        }`}>
                          {tpl.tipe_template === "pdf" ? <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {tpl.tipe_template === "pdf" ? "PDF" : "Gambar"}
                        </span>

                        {/* Overlay saat hover — tombol pratinjau (Hanya desktop) */}
                        <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center bg-gradient-to-t from-[#0B1442]/75 via-[#0B1442]/15 to-[#0B1442]/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewTemplate(tpl); }}
                            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-black text-[#0B1442] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> Pratinjau desain lengkap
                          </button>
                        </div>
                      </div>

                      {/* Info + aksi */}
                      <div className={`relative flex flex-1 flex-col overflow-hidden p-3.5 sm:p-5 ${
                        isDark ? "bg-[#1e2530]" : "bg-gradient-to-br from-blue-50/60 to-white"
                      }`}>
                        <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-[#004F9F] to-[#0B1442] blur-xl transition-all duration-300 group-hover:scale-125 ${
                          isDark ? "opacity-[0.06] group-hover:opacity-[0.14]" : "opacity-[0.12] group-hover:opacity-[0.22]"
                        }`} />

                        <div className="relative flex items-start gap-2.5 sm:gap-3">
                          <span className={`flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                            isDark ? "bg-white/5 text-[#00A5EC]" : "bg-blue-50 text-blue-600"
                          }`}>
                            <Palette className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className={`truncate text-xs sm:text-base font-black tracking-tight transition-colors duration-200 ${
                              isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                            }`}>{tpl.nama}</h4>
                            <p className="mt-0.5 truncate text-[10px] sm:text-xs font-medium text-slate-400">
                              {tpl.kategori || "Umum"}
                            </p>
                          </div>
                        </div>

                        <div className="relative mt-3 sm:mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-bold ${
                            isDark ? "bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10" : "bg-white/80 text-slate-500 ring-1 ring-inset ring-slate-200/70"
                          }`}>
                            {(tpl.orientasi || "landscape") === "portrait" ? <Smartphone className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> : <Monitor className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />}
                            {(tpl.orientasi || "landscape") === "portrait" ? "Portrait" : "Landscape"}
                          </span>
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-bold ${
                            isDark ? "bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10" : "bg-white/80 text-slate-500 ring-1 ring-inset ring-slate-200/70"
                          }`}>
                            <GraduationCap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            {tpl.jenis_peserta === "siswa" ? "Siswa" : "Mahasiswa"}
                          </span>
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-bold ${
                            isDark ? "bg-[#00A5EC]/15 text-sky-300 ring-1 ring-inset ring-sky-500/20" : "bg-blue-50 text-[#004F9F] ring-1 ring-inset ring-blue-100"
                          }`}>
                            <Type className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            {countFields(tpl)} field
                          </span>
                        </div>

                        <div className="relative mt-auto flex items-center gap-1.5 sm:gap-2 pt-3.5 sm:pt-4">
                          <button
                            onClick={() => openEditTemplate(tpl)}
                            className="group/edit inline-flex h-8 sm:h-9.5 flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover/edit:-rotate-12" />
                            <span>Edit Desain</span>
                          </button>
                          <button
                            onClick={() => setPreviewTemplate(tpl)}
                            title="Pratinjau template"
                            className={`inline-flex sm:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                              isDark
                                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:-translate-y-0.5"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl)}
                            title="Hapus template"
                            className={`inline-flex h-8 w-8 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                              isDark
                                ? "border-red-900/30 bg-red-950/40 text-red-400 hover:bg-red-900/40"
                                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:-translate-y-0.5"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
      </div>

      {showDesigner && (
        <TemplateDesignerModal
          template={activeTemplate}
          onClose={() => setShowDesigner(false)}
          onSaved={fetchTemplates}
          isDark={isDark}
        />
      )}

      {showFilterModal && (
        <TemplateFilterModal
          filters={filters}
          toggleFilter={toggleFilter}
          kategoriOptions={kategoriOptions}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          isDark={isDark}
        />
      )}

      {/* Modal pratinjau desain lengkap */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-[#050B24]/85 via-[#0B1442]/80 to-[#00284F]/85 p-3 sm:p-4 backdrop-blur-md animate-[tplFade_0.25s_ease-out]"
          onClick={() => setPreviewTemplate(null)}
        >
          <style>{`
            @keyframes tplFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes tplPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
            @keyframes tplShine { from { transform: translateX(-120%) skewX(-18deg) } to { transform: translateX(320%) skewX(-18deg) } }
          `}</style>

          <div
            className={`flex max-h-[92vh] w-full max-w-[315px] sm:max-w-5xl flex-col overflow-hidden rounded-xl sm:rounded-3xl shadow-[0_35px_90px_-20px_rgba(0,0,0,0.65)] ring-1 animate-[tplPop_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
              isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-white/15"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] px-3 py-2.5 sm:px-5 sm:py-4 text-white shrink-0">
              <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-[#00A5EC]/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="group/icon grid h-7 w-7 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-md sm:rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25">
                    <Palette className="w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/icon:rotate-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs sm:text-base font-black tracking-tight">{previewTemplate.nama}</h3>
                    <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ring-white/20">
                        <Tags className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {previewTemplate.kategori || "Umum"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        {previewTemplate.orientasi === "portrait" ? <Smartphone className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <Monitor className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
                        {previewTemplate.orientasi === "portrait" ? "Portrait" : "Landscape"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        <GraduationCap className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {previewTemplate.jenis_peserta === "siswa" ? "Siswa" : "Mahasiswa"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                        <Type className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {countFields(previewTemplate)} field
                      </span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[7.5px] sm:text-[10px] font-bold uppercase ring-1 ring-inset ring-white/20">
                        {previewTemplate.tipe_template === "pdf" ? <FileText className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <ImageIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
                        {previewTemplate.tipe_template === "pdf" ? "PDF" : "Gambar"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  title="Tutup (Esc)"
                  className="group/x grid h-6.5 w-6.5 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-md sm:rounded-xl bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-red-500/90 hover:text-white hover:ring-red-300/40 active:scale-90 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Isi: sertifikat */}
            <div className={`relative flex-1 overflow-auto p-2.5 sm:p-6 ${
              isDark ? "bg-[#0d1117]" : "bg-[radial-gradient(circle_at_20%_10%,#eef5ff_0%,#f1f5f9_50%,#e4ebf6_100%)]"
            }`}>
              <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(#0b144210_1px,transparent_1px),linear-gradient(90deg,#0b144210_1px,transparent_1px)] [background-size:28px_28px]" />

              <div className="group/sheet relative mx-auto h-[38vh] sm:h-[60vh] w-full max-w-4xl">
                {/* Glow di belakang sertifikat saat hover */}
                <div className="pointer-events-none absolute inset-6 rounded-2xl bg-gradient-to-r from-[#00A5EC]/0 via-[#004F9F]/25 to-[#00A5EC]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover/sheet:opacity-100" />

                <div className="relative h-full w-full transition-transform duration-500 ease-out will-change-transform group-hover/sheet:-translate-y-1.5 group-hover/sheet:scale-[1.025]">
                  <TemplatePreview template={previewTemplate} />

                  {/* Kilau menyapu saat hover */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px]">
                    <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 group-hover/sheet:opacity-100 group-hover/sheet:animate-[tplShine_1.1s_ease-out]" />
                  </div>
                </div>
              </div>

              <p className="relative mt-2 sm:mt-4 text-center text-[9px] sm:text-[11px] font-semibold text-slate-400">
                Data peserta di atas hanyalah contoh
                <span className="hidden sm:inline">
                  {" "}· tekan <span className={`rounded border px-1 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                    isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-300 bg-white text-slate-500"
                  }`}>Esc</span> untuk menutup
                </span>
              </p>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between gap-2 border-t px-3 py-2 sm:px-5 sm:py-3.5 backdrop-blur ${
              isDark ? "border-white/5 bg-[#161b22]/90" : "border-slate-100 bg-white/90"
            }`}>
              <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-400 sm:inline-flex">
                <Eye className="w-3.5 h-3.5" /> Arahkan kursor ke sertifikat untuk memperbesar
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className={`rounded-lg sm:rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
                  className="group/edit inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] bg-[length:200%_100%] bg-left px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-lg hover:shadow-[#004F9F]/30 active:scale-95 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 transition-transform duration-300 group-hover/edit:-rotate-12" /> Edit Desain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TemplateSertifikatPage;