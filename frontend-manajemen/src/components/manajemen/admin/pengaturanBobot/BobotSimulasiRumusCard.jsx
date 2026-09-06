import { useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";

export const BobotSimulasiRumusCard = ({ bobot = {}, isDark = false }) => {
  const [simulasiNilai, setSimulasiNilai] = useState({
    prof: 88,
    pers: 84,
    sos: 90,
    adm: 95,
  });

  const bProf = Number(bobot?.bobot_profesional || 35);
  const bPers = Number(bobot?.bobot_personal || 25);
  const bSos = Number(bobot?.bobot_sosial || 20);
  const bAdm = Number(bobot?.bobot_administratif || 20);

  const totalBobot = bProf + bPers + bSos + bAdm;

  const nilaiAkhirKalkulasi =
    (simulasiNilai.prof * bProf +
      simulasiNilai.pers * bPers +
      simulasiNilai.sos * bSos +
      simulasiNilai.adm * bAdm) /
    (totalBobot > 0 ? totalBobot : 100);

  const getPredikat = (skor) => {
    if (skor >= 85) return { huruf: "A", predikat: "Sangat Baik", status: "Lulus dengan Pujian" };
    if (skor >= 70) return { huruf: "B", predikat: "Baik", status: "Lulus Memuaskan" };
    if (skor >= 60) return { huruf: "C", predikat: "Cukup", status: "Lulus Standar" };
    return { huruf: "D", predikat: "Kurang", status: "Perlu Evaluasi Ulang" };
  };

  const hasilPredikat = getPredikat(nilaiAkhirKalkulasi);

  const adjustScore = (key, delta) => {
    setSimulasiNilai((prev) => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, (Number(prev[key]) || 0) + delta)),
    }));
  };

  const setPresetAll = (score) => {
    setSimulasiNilai({
      prof: score,
      pers: score,
      sos: score,
      adm: score,
    });
  };

  const resetDefault = () => {
    setSimulasiNilai({
      prof: 88,
      pers: 84,
      sos: 90,
      adm: 95,
    });
  };

  const pillars = [
    {
      key: "prof",
      kode: "P1",
      label: "Kompetensi Profesional",
      bobot: bProf,
      val: simulasiNilai.prof,
      subSkor: ((simulasiNilai.prof * bProf) / 100).toFixed(2),
    },
    {
      key: "pers",
      kode: "P2",
      label: "Kompetensi Personal",
      bobot: bPers,
      val: simulasiNilai.pers,
      subSkor: ((simulasiNilai.pers * bPers) / 100).toFixed(2),
    },
    {
      key: "sos",
      kode: "P3",
      label: "Kompetensi Sosial",
      bobot: bSos,
      val: simulasiNilai.sos,
      subSkor: ((simulasiNilai.sos * bSos) / 100).toFixed(2),
    },
    {
      key: "adm",
      kode: "P4",
      label: "Kompetensi Administratif & Laporan",
      bobot: bAdm,
      val: simulasiNilai.adm,
      subSkor: ((simulasiNilai.adm * bAdm) / 100).toFixed(2),
    },
  ];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4 transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-[#161b22]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Header Minimalis */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
            <Calculator className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Simulasi Kalkulasi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Uji coba simulasi nilai rapor dengan persentase bobot aktif.
            </p>
          </div>
        </div>

        {/* Live Preview Indicator (Top Aligned) */}
        <div className="shrink-0 self-start pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview
          </span>
        </div>
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Preset Uji Coba:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPresetAll(100)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200"
            title="Uji coba nilai maksimal 100"
          >
            Maks 100
          </button>
          <button
            type="button"
            onClick={() => setPresetAll(85)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200"
            title="Uji coba nilai rata-rata 85 (Grade A)"
          >
            Rata 85
          </button>
          <button
            type="button"
            onClick={() => setPresetAll(75)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200"
            title="Uji coba nilai rata-rata 75 (Grade B)"
          >
            Rata 75
          </button>
          <button
            type="button"
            onClick={resetDefault}
            className="group p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200"
            title="Kembalikan ke contoh default"
          >
            <RotateCcw className="w-3 h-3 transition-transform duration-500 group-hover:-rotate-180" />
          </button>
        </div>
      </div>

      {/* 4 Pillars Minimalist Clean Rows */}
      <div className="space-y-2">
        {pillars.map((p) => (
          <div
            key={p.key}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${
              isDark
                ? "bg-slate-900/40 border-white/5 hover:border-white/10"
                : "bg-slate-50/70 border-slate-200/70 hover:border-slate-300/80"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                  {p.kode} •
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {p.label}
                </h4>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Bobot: <strong>{p.bobot}%</strong></span>
                <span>•</span>
                <span>Skor Tertimbang: <strong className="text-slate-700 dark:text-slate-200">{p.subSkor}</strong></span>
              </div>
            </div>

            {/* Stepper Controls & Input */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => adjustScore(p.key, -5)}
                className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs"
                title="Kurangi 5 poin"
              >
                -5
              </button>

              <input
                type="number"
                min="0"
                max="100"
                value={p.val}
                onChange={(e) => {
                  const num = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                  setSimulasiNilai((prev) => ({ ...prev, [p.key]: num }));
                }}
                className={`w-14 sm:w-15 px-1.5 py-1 rounded-lg border text-center font-black text-xs sm:text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 ${
                  isDark
                    ? "bg-slate-800 border-white/15 text-white"
                    : "bg-white border-slate-200 text-[#0B1442] shadow-2xs"
                }`}
              />

              <button
                type="button"
                onClick={() => adjustScore(p.key, 5)}
                className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs"
                title="Tambah 5 poin"
              >
                +5
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formula Rapor Minimalist Box */}
      <div
        className={`p-3 rounded-xl border space-y-1 ${
          isDark
            ? "bg-slate-900/30 border-white/5 text-slate-400"
            : "bg-slate-50/50 border-slate-200/60 text-slate-600"
        }`}
      >
        <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Formula Perhitungan Aktif:
        </div>
        <code className="font-mono text-[10.5px] font-bold text-slate-800 dark:text-slate-200 block break-words leading-relaxed">
          ({simulasiNilai.prof} × {(bProf / 100).toFixed(2)}) + ({simulasiNilai.pers} × {(bPers / 100).toFixed(2)}) + ({simulasiNilai.sos} × {(bSos / 100).toFixed(2)}) + ({simulasiNilai.adm} × {(bAdm / 100).toFixed(2)})
        </code>
      </div>

      {/* Featured Hasil Nilai Akhir Card (Consistent Executive Blue) */}
      <div className="bg-gradient-to-br from-[#0B1442] via-[#003B75] to-[#004F9F] text-white p-4.5 rounded-xl shadow-md flex items-center justify-between gap-3 border border-blue-400/20">
        <div>
          <span className="text-[9.5px] font-black uppercase tracking-wider text-blue-200/90 block">
            HASIL NILAI AKHIR KUMULATIF
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl sm:text-3.5xl font-black tracking-tight tabular-nums text-white drop-shadow-xs">
              {nilaiAkhirKalkulasi.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-blue-200/80">/ 100.00</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-xs bg-white/20 border border-white/30 backdrop-blur-xs">
            {hasilPredikat.huruf}
          </span>
          <div>
            <span className="text-[9px] font-bold text-blue-200/80 uppercase tracking-wider block">
              Predikat Mutu
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white block leading-tight">
              {hasilPredikat.predikat}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BobotSimulasiRumusCard;
