import { Calendar, Upload, FileText, Award } from "lucide-react";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";

export const TugasCard = ({ tugas, onKumpul }) => {
  if (!tugas) return null;
  const pengumpulan = tugas.pengumpulan;
  const isDinilai = pengumpulan?.status === "dinilai";
  const isMenunggu = pengumpulan?.status === "menunggu";

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 sm:p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-sky-500/30 flex flex-col justify-between">
      <div>
        {/* Top Row: Deadline & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400" />
            Deadline: {formatTanggalPresensi(tugas.deadline)}
          </span>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black capitalize ${
              isDinilai
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                : isMenunggu
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/20"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {isDinilai ? `Nilai: ${pengumpulan.nilai}` : isMenunggu ? "Menunggu Review" : "Belum Kumpul"}
          </span>
        </div>

        {/* Judul & Deskripsi */}
        <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
          {tugas.judul}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
          {tugas.deskripsi}
        </p>

        {/* Lampiran Soal / Modul bila ada */}
        {tugas.file_lampiran && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Berkas Soal:</span>
            <a
              href={getFileUrl(tugas.file_lampiran)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" /> Unduh Soal
            </a>
          </div>
        )}

        {/* Mentor Feedback jika sudah dinilai */}
        {pengumpulan?.catatan_mentor && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Catatan Mentor:
            </div>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 italic">
              "{pengumpulan.catatan_mentor}"
            </p>
          </div>
        )}
      </div>

      {/* Button Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-slate-400">
          {pengumpulan ? `Dikumpulkan: ${formatTanggalPresensi(pengumpulan.created_at)}` : "Tugas Wajib"}
        </span>

        <button
          type="button"
          onClick={() => onKumpul(tugas)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{pengumpulan ? "Lihat / Edit Pengumpulan" : "Kumpulkan Jawaban"}</span>
        </button>
      </div>
    </div>
  );
};

export default TugasCard;
