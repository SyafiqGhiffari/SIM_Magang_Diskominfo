import { Info, Briefcase, ShieldCheck, HeartHandshake, FileCheck } from "lucide-react";

export const RekapNilaiBobotCard = ({ isDark }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-sm space-y-3 ${
      isDark
        ? "border-white/10 bg-[#161b22] text-slate-200"
        : "border-slate-200/80 bg-white text-slate-800"
    }`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/10 blur-xl pointer-events-none" />

      {/* Header Card (Ukuran Pas & Warna Icon Persis Card Daftar Rekapitulasi) */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-xs">
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs sm:text-[13px] font-black tracking-tight truncate ${isDark ? "text-white" : "text-[#0B1442]"}`}>
            Bobot 4 Pilar Penilaian
          </h4>
          <p className={`text-[10px] sm:text-[10.5px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Formula evaluasi &amp; nilai akhir
          </p>
        </div>
      </div>

      {/* Bar Visual Progress Pembobotan */}
      <div className="space-y-1">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 p-0.5 shadow-inner gap-0.5">
          <div className="h-full rounded-l-full bg-blue-500 transition-all duration-500" style={{ width: "35%" }} title="Profesional: 35%" />
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: "25%" }} title="Personal: 25%" />
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: "20%" }} title="Sosial: 20%" />
          <div className="h-full rounded-r-full bg-purple-500 transition-all duration-500" style={{ width: "20%" }} title="Administratif: 20%" />
        </div>
        <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 px-0.5">
          <span className="text-blue-500">Prof 35%</span>
          <span className="text-emerald-500">Pers 25%</span>
          <span className="text-amber-500">Sos 20%</span>
          <span className="text-purple-500">Adm 20%</span>
        </div>
      </div>

      {/* Compact List of 4 Pillars */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
        {/* 1. Profesional */}
        <div className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all duration-150 hover:scale-[1.01] ${
          isDark ? "border-blue-500/15 bg-blue-950/20" : "border-blue-100 bg-blue-50/40"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-3 h-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">Profesional</p>
              <p className="text-[9.5px] text-slate-400 truncate">Pemahaman tugas &amp; mutu hasil</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-md font-black text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
            35%
          </span>
        </div>

        {/* 2. Personal */}
        <div className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all duration-150 hover:scale-[1.01] ${
          isDark ? "border-emerald-500/15 bg-emerald-950/20" : "border-emerald-100 bg-emerald-50/40"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">Personal</p>
              <p className="text-[9.5px] text-slate-400 truncate">Kedisiplinan, inisiatif, etika</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-md font-black text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            25%
          </span>
        </div>

        {/* 3. Sosial */}
        <div className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all duration-150 hover:scale-[1.01] ${
          isDark ? "border-amber-500/15 bg-amber-950/20" : "border-amber-100 bg-amber-50/40"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <HeartHandshake className="w-3 h-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">Sosial</p>
              <p className="text-[9.5px] text-slate-400 truncate">Komunikasi &amp; kerja sama tim</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-md font-black text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            20%
          </span>
        </div>

        {/* 4. Administratif */}
        <div className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all duration-150 hover:scale-[1.01] ${
          isDark ? "border-purple-500/15 bg-purple-950/20" : "border-purple-100 bg-purple-50/40"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <FileCheck className="w-3 h-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">Administratif</p>
              <p className="text-[9.5px] text-slate-400 truncate">Presensi, logbook, &amp; laporan</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-md font-black text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
            20%
          </span>
        </div>
      </div>

      {/* Compact Tip Notice */}
      <div className={`p-2 sm:p-2.5 rounded-xl border text-[9.5px] sm:text-[10px] leading-relaxed flex items-start gap-1.5 ${
        isDark
          ? "bg-white/[0.02] border-white/5 text-slate-400"
          : "bg-slate-50 border-slate-200/60 text-slate-500"
      }`}>
        <span className="font-extrabold text-[#00A5EC] shrink-0">Tips:</span>
        <span>Nilai &amp; Transkrip resmi dapat diunduh peserta setelah status <span className="font-bold text-emerald-600 dark:text-emerald-400">Diterbitkan</span>.</span>
      </div>
    </div>
  );
};

export default RekapNilaiBobotCard;
