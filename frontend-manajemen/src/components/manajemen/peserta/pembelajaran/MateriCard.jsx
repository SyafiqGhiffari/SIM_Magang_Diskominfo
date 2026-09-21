import { BookOpen, Download, ExternalLink, Sparkles, Code, Shield, Layers, Palette } from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

const KATEGORI_ICONS = {
  Onboarding: Sparkles,
  "Pemrograman & Web": Code,
  "Jaringan & Keamanan": Shield,
  "Tata Kelola & SOP": Layers,
  "Desain & Multimedia": Palette,
};

export const MateriCard = ({ materi }) => {
  if (!materi) return null;
  const CategoryIcon = KATEGORI_ICONS[materi.kategori] || BookOpen;

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-blue-300 dark:hover:border-sky-500/30 flex flex-col justify-between">
      <div>
        {/* Badge Kategori & Tanggal */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 px-2.5 py-1 text-[11px] font-bold">
            <CategoryIcon className="w-3.5 h-3.5" />
            {materi.kategori || "Umum"}
          </span>

          <span className="text-[10.5px] font-bold text-slate-400">
            {formatTanggalPresensi(materi.created_at)}
          </span>
        </div>

        {/* Judul & Deskripsi */}
        <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white leading-snug">
          {materi.judul}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
          {materi.deskripsi || "Modul panduan dan materi teknis pembelajaran magang Diskominfo."}
        </p>
      </div>

      {/* Actions Links */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
        {materi.file_path ? (
          <a
            href={getFileUrl(materi.file_path)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline"
          >
            <Download className="w-3.5 h-3.5" /> Unduh Dokumen
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">Tautan daring</span>
        )}

        {materi.link_eksternal && (
          <a
            href={materi.link_eksternal}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>Buka Modul</span>
            <ExternalLink className="w-3 h-3 text-[#004F9F] dark:text-sky-400" />
          </a>
        )}
      </div>
    </div>
  );
};

export default MateriCard;
