import { useMemo } from "react";
import {
  Upload,
  FileText,
  Award,
  RotateCcw,
  Eye,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FilePenLine,
  NotebookPen,
  Globe,
  CalendarClock,
  UserCheck,
  CirclePlay,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

// Format tanggal dan jam tenggat waktu (Identik dengan format di KelolaTugasMentorPage)
const formatDeadlineText = (dateStr) => {
  if (!dateStr) return "Tanpa Tenggat Waktu";
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateFormatted}, ${hours}:${minutes} WIB`;
  } catch {
    return dateStr;
  }
};

// Mini Avatar Mentor
const MentorAvatar = ({ nama, foto }) => {
  const initial = (nama || "M").charAt(0).toUpperCase();
  const fotoUrl = foto ? getFileUrl(foto) : null;

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        className="h-8 w-8 rounded-full object-cover border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B1442] to-[#00A5EC] text-[10px] font-black text-white shadow-2xs">
      {initial}
    </span>
  );
};

// Helper Format & Tema Berkas Lampiran (Identik dengan Halaman Mentor)
const getFileExtInfo = (filePath) => {
  if (!filePath) {
    return {
      ext: "FILE",
      label: "Berkas Lampiran",
      badgeColor: "bg-slate-700 text-white",
      iconTile: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
      cardBorder: "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      cardBg: "bg-gradient-to-r from-slate-50/80 via-slate-50/40 to-white dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/60",
      textHover: "group-hover/file:text-slate-900 dark:group-hover/file:text-slate-100",
      btnTheme: "text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/40",
    };
  }

  const ext = filePath.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    return {
      ext: "PDF",
      label: "Dokumen PDF",
      badgeColor: "bg-rose-600 text-white",
      iconTile: "bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50",
      cardBorder: "border-rose-200/90 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700",
      cardBg: "bg-gradient-to-r from-rose-50/80 via-red-50/30 to-white dark:from-rose-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-rose-600 dark:group-hover/file:text-rose-400",
      btnTheme: "text-rose-600 dark:text-rose-400 border-rose-200/90 dark:border-rose-800/40 hover:border-rose-400 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/30",
    };
  }

  if (["doc", "docx"].includes(ext)) {
    return {
      ext: "DOC",
      label: "Dokumen Word",
      badgeColor: "bg-blue-600 text-white",
      iconTile: "bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50",
      cardBorder: "border-blue-200/90 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700",
      cardBg: "bg-gradient-to-r from-blue-50/80 via-indigo-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-[#004F9F] dark:group-hover/file:text-sky-400",
      btnTheme: "text-[#004F9F] dark:text-[#00A5EC] border-blue-200/90 dark:border-blue-800/40 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
    };
  }

  if (["ppt", "pptx"].includes(ext)) {
    return {
      ext: "PPT",
      label: "Slide Presentasi",
      badgeColor: "bg-amber-600 text-white",
      iconTile: "bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50",
      cardBorder: "border-amber-200/90 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700",
      cardBg: "bg-gradient-to-r from-amber-50/80 via-orange-50/30 to-white dark:from-amber-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-amber-600 dark:group-hover/file:text-amber-400",
      btnTheme: "text-amber-600 dark:text-amber-400 border-amber-200/90 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
    };
  }

  if (["xls", "xlsx"].includes(ext)) {
    return {
      ext: "XLS",
      label: "Lembar Spreadsheet",
      badgeColor: "bg-emerald-600 text-white",
      iconTile: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50",
      cardBorder: "border-emerald-200/90 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700",
      cardBg: "bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-white dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-emerald-600 dark:group-hover/file:text-emerald-400",
      btnTheme: "text-emerald-600 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
    };
  }

  if (["zip", "rar", "7z"].includes(ext)) {
    return {
      ext: "ZIP",
      label: "Arsip Kompresi",
      badgeColor: "bg-purple-600 text-white",
      iconTile: "bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/50",
      cardBorder: "border-purple-200/90 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700",
      cardBg: "bg-gradient-to-r from-purple-50/80 via-indigo-50/30 to-white dark:from-purple-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
      textHover: "group-hover/file:text-purple-600 dark:group-hover/file:text-purple-400",
      btnTheme: "text-purple-600 dark:text-purple-400 border-purple-200/90 dark:border-purple-800/40 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/30",
    };
  }

  return {
    ext: ext.toUpperCase() || "FILE",
    label: "Berkas Lampiran",
    badgeColor: "bg-sky-600 text-white",
    iconTile: "bg-sky-100 dark:bg-sky-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-sky-200/80 dark:border-sky-800/50",
    cardBorder: "border-sky-200/90 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-700",
    cardBg: "bg-gradient-to-r from-sky-50/80 via-blue-50/30 to-white dark:from-sky-950/25 dark:via-slate-900/40 dark:to-slate-900/60",
    textHover: "group-hover/file:text-[#00A5EC]",
    btnTheme: "text-[#004F9F] dark:text-[#00A5EC] border-sky-200/90 dark:border-sky-800/40 hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/30",
  };
};

export const TugasCard = ({ tugas, onKumpul, onKerjakanKuis }) => {
  const kuisData = tugas?.kuis_data;
  const isKuis = tugas?.tipe_tugas === "kuis";

  // Parse kuis_data jika tugas bertipe kuis
  const kuisConfig = useMemo(() => {
    if (!isKuis || !kuisData) return null;
    try {
      return typeof kuisData === "string" ? JSON.parse(kuisData) : kuisData;
    } catch {
      return null;
    }
  }, [isKuis, kuisData]);

  if (!tugas) return null;

  const pengumpulan = tugas.pengumpulan;
  const isDinilai = pengumpulan?.status === "dinilai";
  const isMenunggu = pengumpulan?.status === "menunggu";
  const isRevisi = pengumpulan?.status === "revisi" || tugas.status_tugas === "revisi";

  const kkm = kuisConfig?.kkm || 75;
  const isTuntas =
    pengumpulan?.status_remidi === "tuntas" ||
    (isDinilai && (pengumpulan?.nilai || 0) >= kkm);
  const isRemidi =
    pengumpulan?.status_remidi === "perlu_remidi" ||
    (isDinilai && (pengumpulan?.nilai || 0) < kkm);

  const maksPercobaan = kuisConfig?.maks_percobaan ?? 2;
  const percobaanKe = pengumpulan?.percobaan_ke || 1;
  const bisaRemidi =
    kuisConfig?.izinkan_remidi &&
    (maksPercobaan === 0 || percobaanKe < maksPercobaan);

  // Kalkulasi Deadline & Urgensi
  const deadlineDate = tugas.tenggat_waktu ? new Date(tugas.tenggat_waktu) : null;
  const now = new Date();
  const diffHours = deadlineDate ? Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
  const isLewatTenggat = diffHours !== null && diffHours < 0;
  const isMendekatiTenggat = diffHours !== null && diffHours >= 0 && diffHours <= 48 && !pengumpulan;

  const handleActionClick = () => {
    if (isKuis && onKerjakanKuis) {
      onKerjakanKuis(tugas);
    } else if (onKumpul) {
      onKumpul(tugas);
    }
  };

  const fileLampiran = tugas.file_lampiran || tugas.file_path;
  const tautanRef = tugas.tautan_eksternal || tugas.link_eksternal;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-[22px] sm:rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isDinilai
          ? "border-emerald-200/90 dark:border-emerald-900/40 bg-white dark:bg-[#161b22] shadow-xs"
          : isRevisi
          ? "border-rose-300 dark:border-rose-800/60 bg-white dark:bg-[#161b22] shadow-xs"
          : isMenunggu
          ? "border-amber-200/90 dark:border-amber-900/40 bg-white dark:bg-[#161b22] shadow-xs"
          : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] hover:border-blue-300 dark:hover:border-sky-500/30 shadow-xs"
      }`}
    >
      {/* Accent Indicator Bar on Top (terpotong rapi dengan overflow-hidden) */}
      {isDinilai ? (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 pointer-events-none" />
      ) : isRevisi ? (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 pointer-events-none" />
      ) : isMenunggu ? (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 pointer-events-none" />
      ) : isMendekatiTenggat ? (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500 pointer-events-none" />
      ) : null}

      {/* ── CARD BODY ── */}
      <div className="p-5 sm:p-6 space-y-3.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Tipe Tugas Badge */}
          {isKuis ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-blue-950/60 dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
              <NotebookPen className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Tugas Kuis</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider bg-blue-50 text-[#004F9F] dark:bg-blue-950/60 dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
              <FilePenLine className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Tugas Proyek</span>
            </span>
          )}

          {/* Status Penilaian / Pengerjaan Pill */}
          <div className="flex items-center gap-1.5">
            {isKuis ? (
              isDinilai ? (
                isTuntas ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Nilai: {pengumpulan.nilai} • Tuntas</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs">
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    <span>Nilai: {pengumpulan.nilai} • Perlu Remidi</span>
                  </span>
                )
              ) : isMenunggu ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 shadow-2xs">
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span>Koreksi Esai</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span>Belum Dikerjakan</span>
                </span>
              )
            ) : isDinilai ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Nilai: {pengumpulan.nilai}/100</span>
              </span>
            ) : isRevisi ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Perlu Revisi</span>
              </span>
            ) : isMenunggu ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Menunggu Review</span>
              </span>
            ) : isLewatTenggat ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Terlewat Tenggat</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span>Belum Kumpul</span>
              </span>
            )}
          </div>
        </div>

        {/* Judul & Deskripsi */}
        <div>
          <h3
            onClick={handleActionClick}
            className="text-base sm:text-lg font-black tracking-tight text-[#0B1442] dark:text-white leading-snug line-clamp-2 cursor-pointer transition-colors duration-200 hover:text-[#004F9F] dark:hover:text-[#00A5EC]"
          >
            {tugas.judul}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-3">
            {tugas.deskripsi || "Instruksi dan ketentuan teknis penugasan magang oleh mentor pembimbing."}
          </p>
        </div>

        {/* Kotak Lampiran Berkas & Tautan Acuan (Memiliki Wadah Kotak & Judul Kolom Sendiri) */}
        {(fileLampiran || tautanRef) && (
          <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white dark:from-white/[0.04] dark:to-transparent shadow-2xs transition-all duration-200">
            {/* Header Kotak Lampiran: Ikon + Judul Kolom + Badge Ringkasan */}
            <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                  Lampiran Berkas &amp; Tautan Panduan:
                </span>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0 text-[10px] font-bold text-[#004F9F] dark:text-[#00A5EC]">
                {fileLampiran && tautanRef ? "2 Panduan" : fileLampiran ? "1 Berkas" : "1 Tautan"}
              </div>
            </div>

            {/* Isi Grid Lampiran Berkas & Tautan Daring */}
            <div
              className={
                fileLampiran && tautanRef
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                  : "space-y-2"
              }
            >
              {fileLampiran && (() => {
                const fileInfo = getFileExtInfo(fileLampiran);
                const fileName = fileLampiran.split("/").pop();
                return (
                  <a
                    href={getFileUrl(fileLampiran)}
                    target="_blank"
                    rel="noreferrer"
                    className={`group/file flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer ${fileInfo.cardBorder} ${fileInfo.cardBg}`}
                    title={fileName}
                  >
                    <div
                      className={`relative flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 shadow-2xs group-hover/file:scale-105 transition-transform ${fileInfo.iconTile}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span
                        className={`absolute -bottom-1 -right-1 px-0.5 py-0 rounded text-[6.5px] font-black tracking-wider shadow-2xs ${fileInfo.badgeColor}`}
                      >
                        {fileInfo.ext}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 truncate transition-colors ${fileInfo.textHover}`}
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                        Klik untuk mengunduh
                      </p>
                    </div>
                  </a>
                );
              })()}

              {tautanRef && (
                <a
                  href={tautanRef}
                  target="_blank"
                  rel="noreferrer"
                  className="group/link flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 h-full shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer border-blue-200/90 dark:border-blue-900/40 hover:border-[#004F9F] dark:hover:border-[#00A5EC] bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white dark:from-blue-950/25 dark:via-slate-900/40 dark:to-slate-900/60"
                  title={tautanRef}
                >
                  <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/50 shrink-0 shadow-2xs group-hover/link:scale-105 transition-transform">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 group-hover/link:text-[#004F9F] dark:group-hover/link:text-[#00A5EC] truncate transition-colors"
                      title={tautanRef}
                    >
                      {tautanRef}
                    </p>
                    <p className="text-[9px] sm:text-[9.5px] text-slate-400 group-hover/link:text-[#004F9F]/80 dark:group-hover/link:text-sky-300/80 font-medium truncate mt-0.5">
                      Klik untuk membuka
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── KOTAK ATURAN & PARAMETER KUIS (MEMILIKI WADAH KOTAK & JUDUL KOLOM SENDIRI) ── */}
        {isKuis && (
          <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white dark:from-white/[0.04] dark:to-transparent shadow-2xs transition-all duration-200">
            {/* Header Kotak Parameter Kuis: Ikon + Judul Kolom + Badge */}
            <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                  <Target className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                  Ketentuan Kuis:
                </span>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0 text-[10px] font-bold text-[#004F9F] dark:text-[#00A5EC]">
                Ujian Interaktif
              </div>
            </div>

            {/* Isi: Grid 4 Metrik Parameter Kuis */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {/* 1. Standar KKM */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30 shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      KKM
                    </span>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                      {kuisConfig?.kkm ?? 75} Poin
                    </span>
                  </div>
                </div>

                {/* 2. Jumlah Butir Soal */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-blue-800/30 shrink-0">
                    <NotebookPen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Soal
                    </span>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                      {kuisConfig?.daftar_soal?.length ?? kuisConfig?.jumlah_soal ?? 0} Soal
                    </span>
                  </div>
                </div>

                {/* 3. Durasi Pengerjaan */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Durasi
                    </span>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                      {kuisConfig?.durasi_menit ?? 30} Menit
                    </span>
                  </div>
                </div>

                {/* 4. Kesempatan Remidi (Singkat, Padat & Tidak Terpotong) */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 border ${
                      kuisConfig?.izinkan_remidi
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30"
                        : "bg-slate-200/50 dark:bg-white/5 text-slate-400 border-slate-200/60 dark:border-white/10"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Remidi
                    </span>
                    <span
                      className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate"
                      title={
                        kuisConfig?.izinkan_remidi
                          ? (kuisConfig?.maks_percobaan && kuisConfig.maks_percobaan > 0
                              ? `Maksimal pengerjaan remidi: ${kuisConfig.maks_percobaan}x coba`
                              : "Remidi tersedia bagi peserta dengan nilai di bawah KKM")
                          : "Hanya 1x kesempatan pengerjaan (tidak ada remidi)"
                      }
                    >
                      {kuisConfig?.izinkan_remidi
                        ? (kuisConfig?.maks_percobaan && kuisConfig.maks_percobaan > 0
                            ? `Maks. ${kuisConfig.maks_percobaan}x`
                            : "Tersedia")
                        : "1x Saja"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kotak Informasi Mentor Pembimbing (Memiliki Wadah Kotak & Judul Kolom Sendiri) */}
        <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-white dark:from-white/[0.04] dark:to-transparent shadow-2xs transition-all duration-200">
          {/* Header Kotak Mentor: Ikon + Judul Kolom + Badge */}
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                Mentor Pembimbing:
              </span>
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0 text-[10px] font-bold text-[#004F9F] dark:text-[#00A5EC]">
              Pembimbing Lapangan
            </div>
          </div>

          {/* Isi: Detail Mentor Pembimbing (Avatar, Nama, Jabatan) */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
            <MentorAvatar nama={tugas.mentor?.nama} foto={tugas.mentor?.foto_profil} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {tugas.mentor?.nama || "Mentor Pembimbing"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                {tugas.mentor?.jabatan || "Pembimbing Lapangan Magang Diskominfo"}
              </p>
            </div>
          </div>
        </div>

        {/* Catatan Feedback Mentor jika ada */}
        {pengumpulan?.catatan_mentor && (
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Masukan Mentor:</span>
            </div>
            <p className="text-[11.5px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
              &ldquo;{pengumpulan.catatan_mentor}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* ── CARD FOOTER ── */}
      <div
        className={`px-5 py-3 border-t flex items-center justify-between gap-2.5 transition-colors ${
          pengumpulan ? "bg-slate-50/60 dark:bg-white/[0.02]" : "bg-white dark:bg-transparent"
        } border-slate-100 dark:border-white/5`}
      >
        {/* Info Tenggat Waktu (Footer Pojok Kiri Bawah - Tanggal & Jam Lengkap Style Persis KelolaTugasMentorPage) */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs transition-colors ${
              isLewatTenggat && !pengumpulan
                ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                : isMendekatiTenggat
                ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 animate-pulse"
                : "bg-slate-50/90 text-slate-600 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10"
            }`}
          >
            <CalendarClock
              className={`w-3.5 h-3.5 shrink-0 ${
                isLewatTenggat && !pengumpulan
                  ? "text-rose-600 dark:text-rose-400"
                  : isMendekatiTenggat
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-[#004F9F] dark:text-[#00A5EC]"
              }`}
            />
            <span>
              <span className="text-slate-400 dark:text-slate-400 font-semibold mr-1">Tenggat:</span>
              <strong className="text-slate-800 dark:text-slate-100 font-black">
                {formatDeadlineText(tugas.tenggat_waktu)}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Button: Gaya Badge Biru Elegan (Pojok Kanan Bawah) */}
        <div className="shrink-0">
          {isKuis ? (
            pengumpulan ? (
              isRemidi && bisaRemidi ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Remidi #{percobaanKe + 1}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Kuis</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <CirclePlay className="w-3.5 h-3.5" />
                <span>Mulai Kuis</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer ${
                pengumpulan
                  ? "border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300"
                  : isLewatTenggat
                  ? "border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:text-rose-300"
                  : "border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{pengumpulan ? "Kelola Jawaban" : "Kumpulkan Tugas"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TugasCard;
