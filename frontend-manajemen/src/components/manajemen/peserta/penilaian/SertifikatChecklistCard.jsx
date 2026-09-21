import { CheckCircle2, Clock } from "lucide-react";

export const SertifikatChecklistCard = ({ laporanDisetujui = false, nilaiDiterbitkan = false }) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-6 shadow-xs space-y-4">
      <h4 className="text-sm font-black text-slate-900 dark:text-white">
        Status Persyaratan Penerbitan Sertifikat:
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-black text-slate-900 dark:text-white">1. Presensi &amp; Logbook</strong>
            <p className="mt-0.5 text-[11px] text-slate-400">Presensi harian dan logbook kegiatan aktif</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-start gap-3">
          {laporanDisetujui ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="text-xs font-black text-slate-900 dark:text-white">2. Laporan Akhir Magang</strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {laporanDisetujui ? "Laporan telah disetujui mentor" : "Perlu persetujuan mentor"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-start gap-3">
          {nilaiDiterbitkan ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="text-xs font-black text-slate-900 dark:text-white">3. Evaluasi &amp; Rapor Nilai</strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {nilaiDiterbitkan ? "Rapor nilai telah final" : "Menunggu finalisasi mentor"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SertifikatChecklistCard;
