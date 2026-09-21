import { FolderOpen, Sparkles, Code, Shield, Layers, Palette } from "lucide-react";

const KATEGORI_ICONS = {
  Onboarding: Sparkles,
  "Pemrograman & Web": Code,
  "Jaringan & Keamanan": Shield,
  "Tata Kelola & SOP": Layers,
  "Desain & Multimedia": Palette,
};

export const MateriKategoriFilter = ({ kategoriOptions = [], selectedKategori = "Semua", onSelectKategori }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      {kategoriOptions.map((kategori) => {
        const Icon = KATEGORI_ICONS[kategori] || FolderOpen;
        const isSelected = selectedKategori === kategori;
        return (
          <button
            key={kategori}
            type="button"
            onClick={() => onSelectKategori(kategori)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isSelected
                ? "bg-[#004F9F] text-white shadow-xs"
                : "bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{kategori}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MateriKategoriFilter;
