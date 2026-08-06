import { BookOpen, Check, Lightbulb, AlertTriangle } from "lucide-react";
import { PANDUAN } from "./panduanLanding";

const PanduanCard = ({ tab, isDark }) => {
  const data = PANDUAN[tab];
  if (!data) return null;

  return (
    <aside>
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDark ? "border-white/10 bg-[#0f172a]" : "border-slate-200 bg-white"
        }`}
      >
        {/* Kepala kartu */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#00A5EC] opacity-20 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-4 w-4 text-[#00A5EC]" />
            </span>
            <div className="min-w-0">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-white/50">
                Panduan Penulisan
              </p>
              <h3 className="truncate text-[12.5px] font-black text-white">{data.judul}</h3>
            </div>
          </div>
        </div>

        {/* Daftar poin */}
        <ul className="space-y-2.5 px-5 py-4">
          {data.poin.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  isDark ? "bg-[#00A5EC]/15 text-[#00A5EC]" : "bg-blue-50 text-[#004F9F]"
                }`}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              <p
                className={`text-[11.5px] leading-relaxed ${
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
          <div className="px-5 pb-4">
            <div
              className={`rounded-xl border p-3 ${
                isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span
                  className={`text-[9.5px] font-black uppercase tracking-widest ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Contoh
                </span>
              </div>
              <p
                className={`whitespace-pre-line text-[11px] italic leading-relaxed ${
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
          <div className="px-5 pb-5">
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 ${
                isDark
                  ? "border-amber-500/20 bg-amber-500/10"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p
                className={`text-[10.5px] leading-relaxed ${
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