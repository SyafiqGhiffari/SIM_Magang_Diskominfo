import { BookOpen, Check, Lightbulb, AlertTriangle } from "lucide-react";
import { PANDUAN } from "./panduanLanding";

const PanduanCard = ({ tab, isDark }) => {
  const data = PANDUAN[tab];
  if (!data) return null;

  return (
    <aside>
      <div
        className={`overflow-hidden rounded-xl sm:rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white"
        }`}
      >
        {/* Kepala kartu */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3 py-2.5 sm:px-5 sm:py-4">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#00A5EC] opacity-20 blur-2xl" />
          <div className="relative flex items-center gap-2 sm:gap-2.5">
            <span className="flex h-6.5 w-6.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-[#00A5EC]" />
            </span>
            <div className="min-w-0">
              <p className="text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-white/50">
                Panduan Penulisan
              </p>
              <h3 className="truncate text-[10.5px] sm:text-[12.5px] font-black text-white">{data.judul}</h3>
            </div>
          </div>
        </div>

        {/* Daftar poin */}
        <ul className="space-y-1.5 sm:space-y-2.5 px-3 py-2.5 sm:px-5 sm:py-4">
          {data.poin.map((p, i) => (
            <li key={i} className="flex items-start gap-1.5 sm:gap-2.5">
              <span
                className={`mt-0.5 flex h-3 w-3 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full ${
                  isDark ? "bg-[#00A5EC]/15 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"
                }`}
              >
                <Check className="h-1.5 w-1.5 sm:h-2.5 sm:w-2.5" strokeWidth={3.5} />
              </span>
              <p
                className={`text-[9.5px] sm:text-[11.5px] leading-snug sm:leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {p}
              </p>
            </li>
          ))}
        </ul>

        {/* Contoh penulisan */}
        {data.contoh && (
          <div className="px-3 pb-2.5 sm:px-5 sm:pb-4">
            <div
              className={`rounded-lg sm:rounded-xl border p-2 sm:p-3 ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="mb-1 flex items-center gap-1">
                <Lightbulb className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                <span
                  className={`text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-widest ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Contoh
                </span>
              </div>
              <p
                className={`whitespace-pre-line text-[9px] sm:text-[11px] italic leading-snug sm:leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {data.contoh}
              </p>
            </div>
          </div>
        )}

        {/* Catatan penting */}
        {data.catatan && (
          <div className="px-3 pb-3 sm:px-5 sm:pb-5">
            <div
              className={`flex items-start gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border p-2 sm:p-3 ${
                isDark
                  ? "border-amber-900/30 bg-amber-950/30 text-amber-300"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-amber-500" />
              <p
                className={`text-[8.5px] sm:text-[10.5px] leading-snug sm:leading-relaxed ${
                  isDark ? "text-amber-200/80" : "text-amber-800"
                }`}
              >
                {data.catatan}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default PanduanCard;