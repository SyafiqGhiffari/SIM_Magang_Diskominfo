import { useState } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { FolderTree, Plus, RefreshCw, Sparkles, Layers, Tag } from "lucide-react";

const KategoriMateriMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const [search, setSearch] = useState("");

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Kategori Materi Pembelajaran
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Kelola topik dan klasifikasi modul pembelajaran (SOP Dinas, Keamanan Informasi, Pemrograman, Desain, dll).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark ? "border-white/10 bg-[#161b22] text-slate-300 hover:text-white" : "border-slate-200 bg-white text-slate-700 hover:text-[#004F9F]"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori Baru
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Kategori</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-[#004F9F]">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0B1442] dark:text-white">4</span>
              <span className="text-[11px] font-semibold text-slate-400">Kategori terdaftar</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Kategori Aktif</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Tag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">4</span>
              <span className="text-[11px] font-semibold text-slate-400">Digunakan dalam materi</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Cakupan Bidang</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">Lintas Bidang</span>
              <span className="text-[11px] font-semibold text-slate-400">&amp; Spesifik</span>
            </div>
          </div>
        </div>

        {/* Placeholder Box */}
        <div className={`rounded-3xl border p-8 sm:p-12 text-center space-y-4 shadow-xs ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border border-blue-500/20">
              <FolderTree className="w-8 h-8" />
            </span>
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className={`text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Pengelompokan Kategori Materi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Halaman ini memudahkan mentor mengorganisasi materi belajar berdasarkan klaster kompetensi seperti Onboarding &amp; SOP, Standar Keamanan Informasi, Git &amp; Clean Code, serta Administrasi Laporan.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#00A5EC]" />
              Fitur Siap Diimplementasikan
            </span>
          </div>
        </div>
      </div>
    </MentorLayout>
  );
};

export default KategoriMateriMentorPage;
