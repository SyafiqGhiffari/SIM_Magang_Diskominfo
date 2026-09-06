import { CheckCircle2, AlertTriangle, Sparkles, Equal, Loader2 } from "lucide-react";

export const BobotTotalBarCard = ({
  bobot,
  totalBobot,
  isTotalValid,
  isDark,
  onSetPreset,
  saveStatus = "saved",
}) => {
  const selisih = 100 - totalBobot;
  const isKelebihan = totalBobot > 100;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 shadow-sm ${
        isDark
          ? "border-white/10 bg-[#161b22]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl transition-opacity duration-500 ${
          isTotalValid
            ? isDark ? "bg-emerald-500/10" : "bg-emerald-500/15"
            : isDark ? "bg-rose-500/10" : "bg-rose-500/15"
        }`}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Akumulasi Total Bobot Kompetensi
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[8.5px] font-black uppercase text-blue-600 dark:text-blue-400">
              Wajib 100%
            </span>
          </div>

          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span
              className={`text-3xl sm:text-4xl font-black tabular-nums transition-colors duration-300 ${
                isTotalValid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {totalBobot.toFixed(1)}%
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-400">/ 100.0% Maksimal</span>
          </div>
        </div>

        {/* Status Badge & Quick Preset Buttons */}
        <div className="flex flex-col sm:items-end gap-2">
          {saveStatus === "saving" ? (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan Otomatis...
            </span>
          ) : isTotalValid ? (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              100% • Tersimpan Otomatis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-xs animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              {isKelebihan
                ? `Kelebihan ${Math.abs(selisih).toFixed(1)}% (Belum Tersimpan)`
                : `Kurang ${Math.abs(selisih).toFixed(1)}% (Belum Tersimpan)`}
            </span>
          )}

          {/* Quick Presets */}
          {onSetPreset && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSetPreset({ bobot_profesional: 35, bobot_personal: 25, bobot_sosial: 20, bobot_administratif: 20 })}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                  isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-white/10"
                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 ring-1 ring-slate-200"
                }`}
                title="Atur bobot baku: 35% Prof, 25% Pers, 20% Sos, 20% Adm"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Format Baku (35/25/20/20)
              </button>
              <button
                type="button"
                onClick={() => onSetPreset({ bobot_profesional: 25, bobot_personal: 25, bobot_sosial: 25, bobot_administratif: 25 })}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                  isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-white/10"
                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 ring-1 ring-slate-200"
                }`}
                title="Bagi rata 25% untuk setiap pilar"
              >
                <Equal className="w-3 h-3 text-sky-500" />
                Bagi Rata (25% Tiap Pilar)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-2.5 pt-2">
        <div className="relative h-4 sm:h-5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner p-0.5">
          <div
            style={{ width: `${Math.max(0, bobot.bobot_profesional)}%` }}
            className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 transition-all duration-300 rounded-l-full relative group cursor-pointer flex items-center justify-center"
            title={`Profesional: ${bobot.bobot_profesional}%`}
          >
            {bobot.bobot_profesional >= 10 && (
              <span className="text-[9.5px] font-black text-white drop-shadow-xs truncate px-1">
                {bobot.bobot_profesional}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_personal)}%` }}
            className="bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300 relative group cursor-pointer flex items-center justify-center"
            title={`Personal: ${bobot.bobot_personal}%`}
          >
            {bobot.bobot_personal >= 10 && (
              <span className="text-[9.5px] font-black text-white drop-shadow-xs truncate px-1">
                {bobot.bobot_personal}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_sosial)}%` }}
            className="bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-300 relative group cursor-pointer flex items-center justify-center"
            title={`Sosial: ${bobot.bobot_sosial}%`}
          >
            {bobot.bobot_sosial >= 10 && (
              <span className="text-[9.5px] font-black text-white drop-shadow-xs truncate px-1">
                {bobot.bobot_sosial}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_administratif)}%` }}
            className="bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-300 rounded-r-full relative group cursor-pointer flex items-center justify-center"
            title={`Administratif: ${bobot.bobot_administratif}%`}
          >
            {bobot.bobot_administratif >= 10 && (
              <span className="text-[9.5px] font-black text-white drop-shadow-xs truncate px-1">
                {bobot.bobot_administratif}%
              </span>
            )}
          </div>
        </div>

        {/* Legend Distribution Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/30">
            <span className="w-3 h-3 rounded-full bg-blue-600 shadow-xs shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">I. Profesional</p>
              <p className="text-xs font-black text-blue-700 dark:text-blue-300">{bobot.bobot_profesional}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">II. Personal</p>
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{bobot.bobot_personal}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">III. Sosial</p>
              <p className="text-xs font-black text-amber-700 dark:text-amber-300">{bobot.bobot_sosial}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/30">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">IV. Administratif</p>
              <p className="text-xs font-black text-purple-700 dark:text-purple-300">{bobot.bobot_administratif}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BobotTotalBarCard;
