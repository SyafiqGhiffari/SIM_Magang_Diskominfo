import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Award,
  BookOpen,
  CalendarCheck,
  Building2,
} from "lucide-react";

export const SertifikatChecklistCard = ({
  laporanDisetujui = false,
  nilaiDiterbitkan = false,
  presensiAktif = true,
}) => {
  const steps = [
    {
      id: "presensi",
      title: "Presensi & Logbook Magang",
      desc: "Kehadiran harian dan pencatatan logbook kegiatan secara konsisten.",
      status: presensiAktif ? "selesai" : "proses",
      statusLabel: presensiAktif ? "Tuntas" : "Sedang Berjalan",
      linkTo: "/peserta/presensi",
      linkText: "Buka Presensi",
      icon: CalendarCheck,
    },
    {
      id: "laporan",
      title: "Laporan Akhir & Luaran Proyek",
      desc: "Naskah laporan akhir dan luaran proyek telah disetujui (ACC) oleh mentor.",
      status: laporanDisetujui ? "selesai" : "proses",
      statusLabel: laporanDisetujui ? "Disetujui (ACC)" : "Menunggu ACC",
      linkTo: "/peserta/penilaian/laporan",
      linkText: "Lihat Laporan",
      icon: BookOpen,
    },
    {
      id: "nilai",
      title: "Evaluasi & Rapor Nilai 4 Pilar",
      desc: "Mentor pembimbing telah memfinalisasi penilaian seluruh kompetensi.",
      status: nilaiDiterbitkan ? "selesai" : "proses",
      statusLabel: nilaiDiterbitkan ? "Final Diterbitkan" : "Menunggu Evaluasi",
      linkTo: "/peserta/penilaian/rapor",
      linkText: "Lihat Rapor",
      icon: Award,
    },
    {
      id: "sertifikat",
      title: "Penerbitan & SK Diskominfo",
      desc: "Verifikasi nomor registrasi resmi oleh administrator Diskominfo Ponorogo.",
      status: laporanDisetujui && nilaiDiterbitkan ? "proses" : "menunggu",
      statusLabel:
        laporanDisetujui && nilaiDiterbitkan
          ? "Siap Diterbitkan"
          : "Menunggu Berkas",
      linkTo: null,
      linkText: null,
      icon: Building2,
    },
  ];

  const tuntasCount = [presensiAktif, laporanDisetujui, nilaiDiterbitkan].filter(Boolean).length;
  const progressPercent = Math.round((tuntasCount / 3) * 100);

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header & Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-[#004F9F] dark:text-sky-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Alur &amp; Persyaratan Penerbitan Sertifikat
            </h4>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sertifikat kelulusan diterbitkan otomatis setelah seluruh tahapan di bawah ini terpenuhi.
          </p>
        </div>

        {/* Progress Bar Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#004F9F] to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
            {tuntasCount} / 3 Syarat
          </span>
        </div>
      </div>

      {/* Grid 4 Langkah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = step.status === "selesai";
          const isCurrent = step.status === "proses";

          return (
            <div
              key={step.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20"
                  : isCurrent
                  ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-[#004F9F] text-white shadow-xs"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                        : isCurrent
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                        : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 shrink-0" />
                    )}
                    <span>{step.statusLabel}</span>
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span>{step.title}</span>
                  </h5>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
              </div>

              {step.linkTo && (
                <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5">
                  <Link
                    to={step.linkTo}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004F9F] dark:text-sky-400 hover:underline"
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong>Perhatian:</strong> Apabila Anda telah menyelesaikan naskah Laporan Akhir namun belum disahkan oleh mentor, silakan ingatkan mentor pembimbing Anda agar melakukan ACC naskah dan memfinalisasi evaluasi 4 pilar di portal SIM Magang.
        </p>
      </div>
    </div>
  );
};

export default SertifikatChecklistCard;
