import { Award, Info } from "lucide-react";

export const BobotPredikatPedomanCard = ({ isDark = false }) => {
  const skalaNilai = [
    {
      rentang: "85.00 – 100.00",
      indeks: "A",
      predikat: "Sangat Baik",
      keterangan: "Kompetensi kerja istimewa, mandiri, dan melampaui seluruh target tugas pembimbing.",
      badgeColor: "bg-emerald-500 text-white",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      rentang: "70.00 – 84.99",
      indeks: "B",
      predikat: "Baik",
      keterangan: "Kompetensi kerja baik, disiplin, dan memenuhi seluruh standar target dinas.",
      badgeColor: "bg-blue-600 text-white",
      dotColor: "bg-blue-600",
      textColor: "text-blue-700 dark:text-blue-400",
    },
    {
      rentang: "60.00 – 69.99",
      indeks: "C",
      predikat: "Cukup",
      keterangan: "Kompetensi kerja cukup, memenuhi persyaratan kelulusan magang batas ambang.",
      badgeColor: "bg-amber-500 text-white",
      dotColor: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-400",
    },
    {
      rentang: "0.00 – 59.99",
      indeks: "D / E",
      predikat: "Kurang",
      keterangan: "Belum memenuhi kriteria minimum evaluasi kelulusan program magang.",
      badgeColor: "bg-rose-500 text-white",
      dotColor: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-400",
    },
  ];

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-xs sm:shadow-sm space-y-3.5 sm:space-y-4 transition-all duration-300 ${
        isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
      }`}
    >
      {/* Header Card */}
      <div className="flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <span className="flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-2xs sm:shadow-sm">
            <Award className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Pedoman Rentang Nilai &amp; Predikat
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Standar acuan konversi nilai akhir kumulatif ke huruf mutu resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Segmented Range Indicator */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 px-0.5">
          <span>Skala Konversi 0 – 100</span>
          <span>Batas Kelulusan: 60.00</span>
        </div>
        <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/60 dark:border-white/5">
          <div className="h-full w-[40%] bg-rose-400/80 dark:bg-rose-500/70 rounded-l-full" title="Kurang (<60)" />
          <div className="h-full w-[10%] bg-amber-400/80 dark:bg-amber-500/70" title="Cukup (60-69.99)" />
          <div className="h-full w-[15%] bg-blue-500/80 dark:bg-blue-500/70" title="Baik (70-84.99)" />
          <div className="h-full w-[35%] bg-emerald-500/80 dark:bg-emerald-500/70 rounded-r-full" title="Sangat Baik (85-100)" />
        </div>
      </div>

      {/* 4 Predikat Grid (2x2 Minimalist Cards with Perfect Vertical Alignment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {skalaNilai.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col justify-start space-y-1.5 sm:space-y-2 transition-all duration-200 ${
              isDark
                ? "bg-slate-900/40 border-white/5 hover:border-white/10"
                : "bg-slate-50/70 border-slate-200/70 hover:border-slate-300/80"
            }`}
          >
            {/* Top row: Range & Grade Badge */}
            <div className="flex items-center justify-between gap-1.5 pb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} shrink-0`} />
                <span className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {item.rentang}
                </span>
              </div>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black shadow-2xs shrink-0 ${item.badgeColor}`}>
                {item.indeks}
              </span>
            </div>

            {/* Predikat & Keterangan (Top Aligned, Exact Vertical Alignment across Columns) */}
            <div className="space-y-0.5">
              <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                {item.predikat}
              </h4>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.keterangan}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400">
        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
        <span className="leading-tight">
          Huruf mutu &amp; predikat tercetak otomatis pada <strong>Transkrip Nilai Akhir (PDF Resmi)</strong>.
        </span>
      </div>
    </div>
  );
};

export default BobotPredikatPedomanCard;
