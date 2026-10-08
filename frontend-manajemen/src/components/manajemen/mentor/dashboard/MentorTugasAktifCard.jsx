import { useNavigate } from "react-router-dom";
import { Layers, Clock, ExternalLink, CheckSquare, PlusCircle } from "lucide-react";

export const MentorTugasAktifCard = ({ tugasList, isDark }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h3
              className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
                isDark ? "text-white" : "text-[#0B1442]"
              }`}
            >
              Penugasan Aktif
            </h3>
            <p className="text-[10.5px] font-medium text-slate-400">
              Pantau progres pengumpulan tugas bimbingan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/mentor/tugas")}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline cursor-pointer"
        >
          <span>Semua</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[340px] overflow-y-auto">
        {!tugasList || tugasList.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <CheckSquare className="h-7 w-7 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold">Belum ada tugas aktif saat ini.</p>
            <button
              type="button"
              onClick={() => navigate("/mentor/tugas")}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F9F] text-white hover:bg-[#0B1442] transition-colors cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        ) : (
          tugasList.map((t) => {
            const totalTarget = t.total_target || t.target_peserta_count || 0;
            const totalKumpul = t.total_pengumpulan || t.pengumpulan_count || 0;
            const pct = totalTarget > 0 ? Math.round((totalKumpul / totalTarget) * 100) : 0;
            const isKuis = t.tipe === "kuis";

            return (
              <div
                key={t.id}
                className={`p-3.5 sm:p-4 transition-colors ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          isKuis
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20"
                        }`}
                      >
                        {isKuis ? "Kuis" : "Tugas"}
                      </span>
                      {t.tenggat_waktu && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{t.tenggat_waktu}</span>
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-xs sm:text-[13px] font-bold truncate leading-snug ${
                        isDark ? "text-slate-100" : "text-slate-800"
                      }`}
                    >
                      {t.judul}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/mentor/tugas?review=${t.id}`)}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Review
                  </button>
                </div>

                {/* Progress Terkumpul */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10.5px] font-medium text-slate-400 mb-1">
                    <span>Progres Pengumpulan</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {totalKumpul}/{totalTarget || "Semua"} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MentorTugasAktifCard;
