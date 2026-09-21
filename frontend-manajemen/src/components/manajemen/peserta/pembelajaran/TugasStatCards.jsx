import { ClipboardList, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export const TugasStatCards = ({ stats = { total: 0, belum: 0, menunggu: 0, selesai: 0 } }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Total Tugas</span>
          <span className="p-2 rounded-xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400">
            <ClipboardList className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Penugasan aktif</p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Belum Kumpul</span>
          <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{stats.belum}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Perlu diselesaikan</p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Menunggu Review</span>
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{stats.menunggu}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Sedang diperiksa mentor</p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Selesai &amp; Dinilai</span>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.selesai}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Telah memperoleh nilai</p>
      </div>
    </div>
  );
};

export default TugasStatCards;
