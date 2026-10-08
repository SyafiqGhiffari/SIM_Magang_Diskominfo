import { CheckCircle2, Clock, AlertCircle, ArrowRight, UserCheck, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export const RaporProgressionStepperCard = ({
  mentor = {},
  peserta = {},
  statusLaporan = "belum_unggah", // belum_unggah | menunggu_review | perlu_revisi | disetujui
  catatanMentorLaporan = "",
  statusTimeline = "berjalan", // belum_mulai | berjalan | selesai
  isDark = false,
}) => {
  // Evaluasi 4 Langkah
  const step1Done = statusTimeline === "berjalan" || statusTimeline === "selesai";
  const step2Done = statusLaporan !== "belum_unggah";
  const step3Done = statusLaporan === "disetujui";
  const step4Done = false; // Karena komponen ini dipanggil saat nilai belum final

  const steps = [
    {
      id: 1,
      title: "Pelaksanaan Magang",
      desc: "Menjalani aktivitas harian, presensi GPS, dan pengisian logbook.",
      done: step1Done,
      current: !step2Done,
      icon: Calendar,
    },
    {
      id: 2,
      title: "Unggah Laporan Akhir",
      desc:
        statusLaporan === "belum_unggah"
          ? "Berkas laporan akhir belum diunggah."
          : statusLaporan === "perlu_revisi"
          ? "Laporan memerlukan perbaikan/revisi."
          : "Berkas laporan akhir telah diunggah.",
      done: step2Done && statusLaporan !== "perlu_revisi",
      warning: statusLaporan === "perlu_revisi",
      current: step1Done && !step2Done,
      icon: FileText,
    },
    {
      id: 3,
      title: "Review & ACC Mentor",
      desc:
        statusLaporan === "disetujui"
          ? "Laporan telah disetujui mentor."
          : statusLaporan === "menunggu_review"
          ? "Sedang ditinjau oleh mentor."
          : "Menunggu pengunggahan laporan.",
      done: step3Done,
      current: step2Done && !step3Done,
      icon: UserCheck,
    },
    {
      id: 4,
      title: "Finalisasi Rapor Nilai",
      desc: step3Done
        ? "Mentor sedang menyusun penilaian 4 pilar."
        : "Menunggu persetujuan laporan akhir.",
      done: step4Done,
      current: step3Done && !step4Done,
      icon: CheckCircle2,
    },
  ];

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-8 shadow-xs space-y-6 ${
        isDark
          ? "border-white/10 bg-[#161b22]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Header Info Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mb-1">
              Penilaian Sedang Dalam Proses
            </div>
            <h3
              className={`text-base sm:text-lg font-black tracking-tight ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Alur Penerbitan Rapor Nilai Magang
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rapor nilai resmi akan diterbitkan langsung oleh Mentor Pembimbing Anda setelah tahapan bimbingan diselesaikan.
            </p>
          </div>
        </div>

        {/* Info Box Mentor Pembimbing */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs shrink-0 ${
            isDark
              ? "border-white/5 bg-slate-800/60 text-slate-300"
              : "border-slate-200/60 bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#004F9F]/10 text-[#004F9F] dark:text-sky-400 font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Mentor Pembimbing
            </p>
            <p className="font-extrabold text-slate-900 dark:text-white">
              {mentor.nama || "Pembimbing Diskominfo"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {mentor.jabatan || peserta.bidang || "Bidang Magang"}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Timeline Visual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          return (
            <div
              key={s.id}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                s.done
                  ? isDark
                    ? "border-emerald-500/30 bg-emerald-950/15"
                    : "border-emerald-200 bg-emerald-50/50"
                  : s.warning
                  ? isDark
                    ? "border-rose-500/30 bg-rose-950/15"
                    : "border-rose-200 bg-rose-50/60"
                  : s.current
                  ? isDark
                    ? "border-sky-500/40 bg-sky-950/20 shadow-sm"
                    : "border-sky-200 bg-sky-50/60 shadow-xs"
                  : isDark
                  ? "border-white/5 bg-slate-800/30 opacity-60"
                  : "border-slate-200/50 bg-slate-50/50 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                      s.done
                        ? "bg-emerald-500 text-white"
                        : s.warning
                        ? "bg-rose-500 text-white"
                        : s.current
                        ? "bg-[#004F9F] text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {s.done ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : s.warning ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </span>

                  <StepIcon
                    className={`w-4 h-4 ${
                      s.done
                        ? "text-emerald-500"
                        : s.warning
                        ? "text-rose-500"
                        : s.current
                        ? "text-[#00A5EC]"
                        : "text-slate-400"
                    }`}
                  />
                </div>

                <h4
                  className={`text-xs font-black ${
                    s.done
                      ? "text-emerald-900 dark:text-emerald-300"
                      : s.warning
                      ? "text-rose-900 dark:text-rose-300"
                      : s.current
                      ? "text-[#0B1442] dark:text-sky-200"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {s.title}
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {s.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold">
                <span
                  className={
                    s.done
                      ? "text-emerald-600 dark:text-emerald-400"
                      : s.warning
                      ? "text-rose-600 dark:text-rose-400"
                      : s.current
                      ? "text-[#004F9F] dark:text-sky-400"
                      : "text-slate-400"
                  }
                >
                  {s.done
                    ? "Tuntas"
                    : s.warning
                    ? "Perlu Revisi"
                    : s.current
                    ? "Sedang Berlangsung"
                    : "Menunggu"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Action Notification Box */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          statusLaporan === "belum_unggah"
            ? "border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/20"
            : statusLaporan === "perlu_revisi"
            ? "border-rose-200 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/20"
            : "border-sky-200 dark:border-sky-500/20 bg-sky-50/70 dark:bg-sky-950/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {statusLaporan === "belum_unggah" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : statusLaporan === "perlu_revisi" ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : (
              <Clock className="w-5 h-5 text-[#004F9F] dark:text-sky-400" />
            )}
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-900 dark:text-white">
              {statusLaporan === "belum_unggah"
                ? "Langkah Diperlukan: Unggah Laporan Akhir Magang"
                : statusLaporan === "perlu_revisi"
                ? "Perhatian: Ada Catatan Revisi dari Mentor"
                : "Menunggu Finalisasi Penilaian oleh Mentor"}
            </h5>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {statusLaporan === "belum_unggah"
                ? "Untuk memicu proses penilaian akhir oleh mentor pembimbing, silakan serahkan berkas laporan akhir magang Anda terlebih dahulu."
                : statusLaporan === "perlu_revisi"
                ? catatanMentorLaporan
                  ? `Catatan mentor: "${catatanMentorLaporan}". Mohon perbaiki dan unggah ulang berkas laporan Anda.`
                  : "Mentor meminta revisi pada dokumen laporan akhir Anda. Silakan unggah perbaikan berkas."
                : `Laporan akhir Anda telah diserahkan. Mentor pembimbing (${mentor.nama || "Mentor"}) sedang memvalidasi capaian kompetensi magang Anda.`}
            </p>
          </div>
        </div>

        {/* Tombol Tindakan Langsung ke Laporan */}
        {(statusLaporan === "belum_unggah" || statusLaporan === "perlu_revisi") && (
          <Link
            to="/peserta/penilaian/laporan"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0 cursor-pointer"
          >
            <span>{statusLaporan === "perlu_revisi" ? "Revisi Laporan" : "Unggah Laporan Sekarang"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default RaporProgressionStepperCard;
