import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Video,
  Presentation,
  Link2,
  FileText,
  GraduationCap,
  Eye,
  FolderOpen,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

const getMediaTheme = (tipe) => {
  switch (tipe) {
    case "video":
      return {
        icon: Video,
        label: "Video Interaktif",
        badge: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40",
      };
    case "slide":
      return {
        icon: Presentation,
        label: "Slide Presentasi",
        badge: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
      };
    case "tautan":
      return {
        icon: Link2,
        label: "Tautan Daring",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
      };
    default:
      return {
        icon: FileText,
        label: "Dokumen Modul",
        badge: "bg-blue-50 text-[#004F9F] border-blue-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40",
      };
  }
};

const MentorMiniAvatar = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "M").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-6 w-6 rounded-full object-cover border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs"
      />
    );
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B1442] to-[#00A5EC] text-[9.5px] font-black text-white shadow-2xs">
      {initial}
    </span>
  );
};

export const MateriCard = ({
  materi,
  isSelesai = false,
  onSelect,
  onToggleSelesai,
  isDark = false,
  userBidang = "",
}) => {
  if (!materi) return null;

  const mediaTheme = getMediaTheme(materi.tipe_media);
  const MediaIcon = mediaTheme.icon;

  const isBidangCocok =
    materi.posisi_bidang &&
    materi.posisi_bidang !== "semua" &&
    userBidang &&
    materi.posisi_bidang.toLowerCase() === userBidang.toLowerCase();

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-[22px] sm:rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelesai
          ? isDark
            ? "border-emerald-500/40 bg-[#161b22]/90 shadow-2xs hover:border-emerald-500/60"
            : "border-emerald-200/90 bg-white shadow-xs hover:border-emerald-300"
          : isDark
          ? "border-white/10 bg-[#161b22] shadow-2xs hover:border-sky-500/40"
          : "border-slate-200/80 bg-white shadow-xs hover:border-blue-300"
      }`}
    >
      {/* Accent Indicator Bar on Top when completed (rapi mengikuti lengkungan kartu) */}
      {isSelesai && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 pointer-events-none" />
      )}

      {/* ── CARD HEADER & BODY ── */}
      <div className="p-5 sm:p-5.5 space-y-3">
        {/* Top Badges Row: Media Badge di pojok kiri, Status Read di pojok kanan */}
        <div className="flex items-center justify-between gap-2">
          {/* Media Type Badge (Pojok Kiri) */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold ${mediaTheme.badge}`}
          >
            <MediaIcon className="w-3.5 h-3.5" />
            <span>{mediaTheme.label}</span>
          </span>

          {/* Status Read Pill (Pojok Kanan) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelesai?.(materi.id);
            }}
            title={isSelesai ? "Klik untuk tandai belum selesai" : "Klik untuk tandai selesai"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              isSelesai
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10"
            }`}
          >
            {isSelesai ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Selesai</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Belum</span>
              </>
            )}
          </button>
        </div>

        {/* Bidang Tag if applicable */}
        {isBidangCocok ? (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/40">
            <GraduationCap className="w-3 h-3 text-indigo-500" />
            <span>Khusus Bidang Anda ({materi.posisi_bidang})</span>
          </div>
        ) : materi.posisi_bidang && materi.posisi_bidang !== "semua" ? (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400">
            <span>Bidang: {materi.posisi_bidang}</span>
          </div>
        ) : null}

        {/* Title */}
        <h3
          onClick={() => onSelect?.(materi)}
          className="text-[14.5px] sm:text-base font-black tracking-tight text-[#0B1442] dark:text-white leading-snug line-clamp-2 cursor-pointer transition-colors duration-200 group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC]"
        >
          {materi.judul}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
          {materi.deskripsi || "Modul panduan dan materi teknis pembelajaran magang Diskominfo."}
        </p>

        {/* Mentor / Author Info */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 min-w-0">
            {materi.mentor?.nama ? (
              <>
                <MentorMiniAvatar nama={materi.mentor.nama} foto={materi.mentor.foto_profil} />
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                  {materi.mentor.nama}
                </span>
              </>
            ) : (
              <>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] text-[9.5px]">
                  <BookOpen className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-600 dark:text-slate-300 truncate text-[11px]">
                  Instruktur Diskominfo
                </span>
              </>
            )}
          </div>

          <span className="text-[10px] font-medium text-slate-400 shrink-0">
            {formatTanggalPresensi(materi.created_at)}
          </span>
        </div>
      </div>

      {/* ── CARD FOOTER & AKSI ── */}
      <div
        className={`px-5 py-3 border-t rounded-b-[22px] sm:rounded-b-3xl flex items-center justify-between gap-2.5 ${
          isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/50"
        }`}
      >
        {/* Info Kategori (Pojok Kiri, style identik dengan Halaman Materi Pembelajaran Role Mentor) */}
        <div className="flex items-center min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs transition-colors bg-slate-50/90 text-slate-600 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 truncate max-w-full">
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#004F9F] dark:text-[#00A5EC]" />
            <span className="truncate">
              <span className="text-slate-400 dark:text-slate-400 font-semibold mr-1">Kategori:</span>
              <strong className="text-slate-800 dark:text-slate-100 font-black">{materi.kategori || "Umum"}</strong>
            </span>
          </div>
        </div>

        {/* Tombol Pelajari Modul (Pojok Kanan, Warna & Animasi Identik dengan Button Verifikasi di Role Mentor) */}
        <button
          type="button"
          onClick={() => onSelect?.(materi)}
          className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white px-3.5 py-1.5 text-xs font-black shadow-md shadow-[#0B1442]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer border border-white/10 shrink-0"
        >
          <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
          <span>Pelajari Modul</span>
        </button>
      </div>
    </div>
  );
};

export default MateriCard;
