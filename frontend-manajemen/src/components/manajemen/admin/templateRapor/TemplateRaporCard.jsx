import {
  Palette, Pencil, Trash2, Eye, Star,
  Stamp, FileText, CheckCircle2, GraduationCap
} from "lucide-react";
import TemplateRaporPreview from "./TemplateRaporPreview";

export const TemplateRaporCard = ({
  template,
  onEdit,
  onPreview,
  onSetDefault,
  onDelete,
  isDark = false,
}) => {
  const isDefault = template.is_default;
  const isPublish = template.status === "publish";

  const hasLogo = Boolean(template.file_logo);
  const hasTtd = Boolean(template.file_ttd);
  const hasStempel = Boolean(template.file_stempel);
  const assetCount = [hasLogo, hasTtd, hasStempel].filter(Boolean).length;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? "border-white/10 bg-[#1e2530]" : "border-slate-200 bg-white"
        }`}
    >
      {/* 1. Pratinjau Kertas A4 (Atas) */}
      <div
        onClick={() => onPreview(template)}
        className={`relative flex aspect-[1/0.9] w-full flex-col overflow-hidden px-2.5 pt-2 pb-2.5 cursor-pointer ${isDark ? "bg-[#161b22]" : "bg-[radial-gradient(circle_at_25%_15%,#eef5ff_0%,#f1f5f9_55%,#e7edf7_100%)]"
          }`}
      >
        {/* Badge di baris paling atas */}
        <div className="relative z-10 flex shrink-0 items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-white shadow-md ring-1 ring-white/25">
            <Star className="w-2.5 h-2.5 fill-current" />
            {isDefault ? "Template Utama" : "Template Alternatif"}
          </span>

          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-md ring-1 ${isPublish
              ? isDark ? "bg-[#102a1e] text-emerald-400 ring-emerald-900/30" : "bg-white text-emerald-600 ring-emerald-200"
              : isDark ? "bg-[#332200] text-amber-400 ring-amber-900/30" : "bg-white text-amber-600 ring-amber-200"
            }`}>
            {isPublish ? <CheckCircle2 className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
            {isPublish ? "Publish" : "Draft"}
          </span>
        </div>

        {/* Lembar Kertas A4 Proposional (Aspek 1 : 1.414) */}
        <div className="mt-2 flex min-h-0 flex-1 items-start justify-center">
          <div className="h-full aspect-[1/1.414] overflow-hidden rounded-sm shadow-[0_10px_24px_-14px_rgba(11,20,66,0.45)] transition-transform duration-500 group-hover:scale-[1.02]">
            <TemplateRaporPreview template={template} base={2.5} />
          </div>
        </div>

        {/* Overlay saat hover — tombol pratinjau (Hanya desktop) */}
        <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center bg-gradient-to-t from-[#0B1442]/75 via-[#0B1442]/15 to-[#0B1442]/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template);
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-black text-[#0B1442] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Pratinjau transkrip lengkap
          </button>
        </div>
      </div>

      {/* 2. Info + Aksi (Bawah) */}
      <div className={`relative flex flex-1 flex-col overflow-hidden p-2.5 sm:p-3.5 ${isDark ? "bg-[#1e2530]" : "bg-gradient-to-br from-blue-50/60 to-white"
        }`}>
        <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-[#004F9F] to-[#0B1442] blur-xl transition-all duration-300 group-hover:scale-125 ${isDark ? "opacity-[0.06] group-hover:opacity-[0.14]" : "opacity-[0.12] group-hover:opacity-[0.22]"
          }`} />

        <div className="relative flex items-start gap-2 sm:gap-2.5">
          <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${isDark ? "bg-white/5 text-[#00A5EC]" : "bg-blue-50 text-blue-600"
            }`}>
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <h4 className={`text-[11px] sm:text-[12.5px] font-black leading-snug tracking-tight break-words line-clamp-2 transition-colors duration-200 ${isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
              }`}>
              {template.nama}
            </h4>
            <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium leading-snug text-slate-400 break-words whitespace-normal line-clamp-2">
              {template.keterangan || template.nama_instansi || "Dinas Komunikasi, Informatika dan Statistik"}
            </p>
          </div>
        </div>

        {/* Badges Info */}
        <div className="relative mt-2 flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold ring-1 ring-inset ${
            template.jenis_peserta === "siswa"
              ? isDark ? "bg-amber-500/10 text-amber-300 ring-amber-500/20" : "bg-amber-50 text-amber-700 ring-amber-200"
              : template.jenis_peserta === "mahasiswa"
              ? isDark ? "bg-purple-500/10 text-purple-300 ring-purple-500/20" : "bg-purple-50 text-purple-700 ring-purple-200"
              : isDark ? "bg-white/5 text-slate-300 ring-white/10" : "bg-slate-50 text-slate-600 ring-slate-200/80"
          }`}>
            <GraduationCap className="w-2.5 h-2.5" />
            {template.jenis_peserta === "siswa" ? "Siswa" : template.jenis_peserta === "mahasiswa" ? "Mahasiswa" : "Semua"}
          </span>

          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold ring-1 ring-inset ${isDark ? "bg-white/5 text-slate-300 ring-white/10" : "bg-white/80 text-slate-600 ring-slate-200/80"
            }`}>
            <FileText className="w-2.5 h-2.5 text-sky-500 shrink-0" />
            <span className="font-mono whitespace-nowrap">{template.format_nomor || "560/TRN-{nomor}/405.08/{tahun}"}</span>
          </span>

          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold ring-1 ring-inset ${assetCount === 3
              ? isDark ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : isDark ? "bg-[#00A5EC]/15 text-sky-300 ring-sky-500/20" : "bg-blue-50 text-[#004F9F] ring-blue-100"
            }`}>
            <Stamp className="w-2.5 h-2.5" />
            {assetCount}/3 aset
          </span>
        </div>

        {/* Action Buttons */}
        <div className="relative mt-auto flex items-center gap-1.5 pt-2.5">
          <button
            type="button"
            onClick={() => onEdit(template)}
            className="group/edit inline-flex h-7.5 sm:h-8 flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-2 text-[10px] sm:text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Pencil className="w-3 h-3 transition-transform duration-300 group-hover/edit:-rotate-12" />
            <span>Edit Desain</span>
          </button>

          {/* Tombol Jadikan Default (jika bukan default) */}
          {!isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(template)}
              title="Jadikan template utama"
              className={`inline-flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${isDark
                  ? "border-sky-900/30 bg-sky-950/40 text-sky-400 hover:bg-sky-900/40"
                  : "border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:-translate-y-0.5"
                }`}
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Tombol Pratinjau Mobile */}
          <button
            type="button"
            onClick={() => onPreview(template)}
            title="Pratinjau template"
            className={`inline-flex sm:hidden h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:-translate-y-0.5"
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Hapus */}
          <button
            type="button"
            onClick={() => onDelete(template)}
            title="Hapus template"
            className={`inline-flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${isDark
                ? "border-red-900/30 bg-red-950/40 text-red-400 hover:bg-red-900/40"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:-translate-y-0.5"
              }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Garis gradien saat hover */}
      <div className="absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#004F9F] to-[#0B1442] transition-transform duration-500 group-hover:scale-x-100" />
    </div>
  );
};

export default TemplateRaporCard;
