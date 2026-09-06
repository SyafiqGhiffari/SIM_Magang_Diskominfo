import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  TemplateRaporCard,
  TemplateRaporDesignerModal,
  TemplateRaporPreviewModal,
  TemplateRaporSortDropdown,
  TemplateRaporFilterModal,
} from "../../components/manajemen/admin/templateRapor";
import {
  getAllTemplateRapor,
  deleteTemplateRapor,
  setDefaultTemplateRapor,
} from "../../services/templateRaporService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  Palette, Plus, Inbox, Loader2, Search, Star,
  CheckCircle2, FileText, Filter as FilterIcon
} from "lucide-react";

export const TemplateRaporPage = () => {
  const { isDark } = useManajemenTheme();
  const [templates, setTemplates] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [showDesigner, setShowDesigner] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("nama_az");

  const emptyFilters = { status: [], penandatangan: [], aset: [] };
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleFilter = (group, key) =>
    setFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(key) ? prev[group].filter((k) => k !== key) : [...prev[group], key],
    }));

  const openFilter = () => {
    setFilters(appliedFilters);
    setShowFilterModal(true);
  };
  const applyFilter = () => setAppliedFilters(filters);
  const resetFilter = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSortBy("nama_az");
  };

  const fetchTemplates = async () => {
    try {
      const res = await getAllTemplateRapor();
      setTemplates(res.data?.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat template rapor.");
    } finally {
      setLoadingTpl(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTemplates();
    }, 0);
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

  const openCreateTemplate = () => {
    setActiveTemplate(null);
    setShowDesigner(true);
  };

  const openEditTemplate = (tpl) => {
    setActiveTemplate(tpl);
    setShowDesigner(true);
  };

  const handleSetDefault = async (tpl) => {
    try {
      await setDefaultTemplateRapor(tpl.id);
      toastSuccess(`Template "${tpl.nama}" dijadikan template utama`);
      fetchTemplates();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengatur template utama.");
    }
  };

  const handleDeleteTemplate = async (tpl) => {
    const result = await confirmDialog({
      title: `Hapus template "${tpl.nama}"?`,
      text: "Template beserta seluruh konfigurasi kop, tanda tangan, dan stempelnya akan dihapus permanen.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteTemplateRapor(tpl.id);
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
        (t.nama_instansi || "").toLowerCase().includes(s) ||
        (t.nama_penandatangan || "").toLowerCase().includes(s)
      );
    })
    .filter((t) => (appliedFilters.status.length === 0 ? true : appliedFilters.status.includes(t.status || "publish")))
    .filter((t) => (appliedFilters.penandatangan.length === 0 ? true : appliedFilters.penandatangan.includes(t.tipe_penandatangan || "kepala_dinas")))
    .filter((t) => {
      if (appliedFilters.aset.length === 0) return true;
      const isLengkap = Boolean(t.file_logo && t.file_ttd && t.file_stempel);
      if (appliedFilters.aset.includes("lengkap") && !isLengkap) return false;
      if (appliedFilters.aset.includes("sebagian") && isLengkap) return false;
      return true;
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "nama_za":
        return (b.nama || "").localeCompare(a.nama || "", "id");
      case "terbaru":
        return new Date(b.created_at || b.CreatedAt || 0) - new Date(a.created_at || a.CreatedAt || 0);
      case "terlama":
        return new Date(a.created_at || a.CreatedAt || 0) - new Date(b.created_at || b.CreatedAt || 0);
      case "default_pertama":
        return (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0);
      default:
        return (a.nama || "").localeCompare(b.nama || "", "id");
    }
  });

  const activeFilterCount = Object.values(appliedFilters).reduce((n, arr) => n + arr.length, 0);
  const activeFilterCountMobile = activeFilterCount + (sortBy ? 1 : 0);

  // Statistik Ringkas
  const totalTemplate = templates.length;
  const totalDefault = templates.filter((t) => t.is_default).length;
  const totalPublish = templates.filter((t) => (t.status || "publish") === "publish").length;
  const totalDraft = templates.filter((t) => t.status === "draft").length;

  return (
    <AdminLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Title Header */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Template Rapor &amp; Transkrip
          </h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="hidden sm:inline">
              Kelola berbagai desain template transkrip nilai/rapor magang. Atur kop instansi, pejabat penandatangan, stempel, dan tata letak transkrip nilai resmi.
            </span>
            <span className="inline sm:hidden">
              Kelola desain template, kop, dan penandatangan transkrip nilai.
            </span>
          </p>
        </div>

        {/* Statistik ringkas (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[
            {
              icon: Palette,
              label: "Total Template",
              value: totalTemplate,
              caption: "Desain tersimpan",
              lightGradient: "from-blue-300 to-white",
              gradient: "from-[#004F9F] to-[#0B1442]",
              iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
            },
            {
              icon: Star,
              label: "Template Utama",
              value: totalDefault,
              caption: "Template aktif",
              lightGradient: "from-sky-300 to-white",
              gradient: "from-sky-500 to-sky-700",
              iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-600",
            },
            {
              icon: CheckCircle2,
              label: "Diterbitkan",
              value: totalPublish,
              caption: "Status publish",
              lightGradient: "from-emerald-300 to-white",
              gradient: "from-emerald-500 to-emerald-700",
              iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
            },
            {
              icon: FileText,
              label: "Draf",
              value: totalDraft,
              caption: "Desain konsep",
              lightGradient: "from-amber-300 to-white",
              gradient: "from-amber-500 to-amber-700",
              iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
            },
          ].map((c, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? "border-white/10 bg-[#161b22]" : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
                }`}
            >
              <div
                className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`}
              />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-sm font-bold tracking-wide truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {c.label}
                  </p>
                  <h3 className={`mt-1 sm:mt-1.5 text-xl sm:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0B1442]"}`}>
                    {c.value}
                  </h3>
                  <p className={`mt-1.5 sm:mt-2 text-[9px] sm:text-xs font-medium leading-snug whitespace-normal break-words ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {c.caption}
                  </p>
                </div>
                <span className={`flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                  <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
            </div>
          ))}
        </div>

        {/* Card Utama: Daftar Template */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "border-white/5 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
          {/* Header Card */}
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
                  <span className="hidden sm:inline">Simpan beberapa desain template transkrip nilai yang bisa dipilih saat menerbitkan nilai peserta.</span>
                  <span className="inline sm:hidden">Pilih template saat menerbitkan transkrip nilai.</span>
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
              <TemplateRaporSortDropdown sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} />

              <button
                type="button"
                onClick={openFilter}
                className={`group inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer shrink-0 ${isDark
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
                  className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${isDark
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
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused
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
                  placeholder="Cari template..."
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 sm:py-2.5 text-xs font-medium outline-none transition-all duration-200 ${isSearchFocused
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
                <span className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                  }`}>
                  <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className={`absolute inset-0 animate-ping rounded-xl sm:rounded-2xl border-2 opacity-40 ${isDark ? "border-white/10" : "border-slate-200"
                    }`} />
                </span>
                <div>
                  <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {templates.length === 0 ? "Belum ada template rapor" : "Template tidak ditemukan"}
                  </p>
                  <p className="mt-0.5 max-w-[260px] sm:max-w-xs text-[10px] sm:text-xs text-slate-400">
                    {templates.length === 0 ? (
                      <>
                        Klik <span className="font-bold text-[#004F9F]">Tambah Template</span> untuk membuat desain transkrip pertama.
                      </>
                    ) : (
                      "Coba kata kunci atau filter lain."
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {sorted.map((tpl) => (
                  <TemplateRaporCard
                    key={tpl.id}
                    template={tpl}
                    onEdit={openEditTemplate}
                    onPreview={setPreviewTemplate}
                    onSetDefault={handleSetDefault}
                    onDelete={handleDeleteTemplate}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Desainer */}
      {showDesigner && (
        <TemplateRaporDesignerModal
          show={showDesigner}
          template={activeTemplate}
          onClose={() => setShowDesigner(false)}
          onSaved={fetchTemplates}
          isDark={isDark}
        />
      )}

      {/* Modal Filter */}
      {showFilterModal && (
        <TemplateRaporFilterModal
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

      {/* Modal Pratinjau Desain Lengkap */}
      {previewTemplate && (
        <TemplateRaporPreviewModal
          show={Boolean(previewTemplate)}
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onEdit={(tpl) => {
            setPreviewTemplate(null);
            openEditTemplate(tpl);
          }}
          isDark={isDark}
        />
      )}
    </AdminLayout>
  );
};

export default TemplateRaporPage;
