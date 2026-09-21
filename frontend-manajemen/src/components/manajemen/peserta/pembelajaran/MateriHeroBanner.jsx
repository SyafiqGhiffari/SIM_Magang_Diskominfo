import { Sparkles } from "lucide-react";

export const MateriHeroBanner = ({ totalMateri = 0 }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-white/10 bg-gradient-to-r from-blue-600 via-[#004F9F] to-[#0B1442] p-6 sm:p-7 text-white shadow-lg">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#00A5EC]" />
            Knowledge Center Diskominfo
          </span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white">
            Kurikulum &amp; Bahan Bacaan Praktek Kerja
          </h3>
          <p className="mt-1 text-xs text-white/80 leading-relaxed">
            Tingkatkan wawasan teknis Anda selama masa magang dengan mempelajari modul resmi yang disediakan mentor dan instruktur dinas.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
            <p className="text-xl font-black text-white">{totalMateri}</p>
            <p className="text-[10.5px] font-bold text-white/70 uppercase">Modul Materi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MateriHeroBanner;
