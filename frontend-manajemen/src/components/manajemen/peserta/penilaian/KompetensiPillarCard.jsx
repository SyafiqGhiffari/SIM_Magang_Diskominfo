import { Layers } from "lucide-react";

export const KompetensiPillarCard = ({
  title = "Pilar Kompetensi",
  icon: Icon = Layers,
  bobot = 20,
  rataRata = 0,
  predikat = "A",
  items = [],
  isDark = false,
}) => {
  const rataRataNum = Number(rataRata || 0).toFixed(2);
  const bobotNum = Math.round(Number(bobot || 0));

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all space-y-3 ${
        isDark
          ? "border-white/10 bg-[#161b22] hover:border-white/20"
          : "border-slate-200/80 bg-white hover:border-slate-300"
      }`}
    >
      {/* 1. Header Pilar: Icon, Judul & Subtitle, Badge Predikat */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Kotak Icon Bulat */}
          <div
            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${
              isDark
                ? "bg-sky-950/40 text-[#00A5EC] border-sky-800/30"
                : "bg-blue-50/80 text-[#004F9F] border-blue-100/80"
            }`}
          >
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>

          {/* Judul & Info Bobot/Rata-rata */}
          <div className="min-w-0">
            <h3
              className={`font-bold text-xs sm:text-sm truncate leading-snug ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              {title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Bobot: {bobotNum}% • Rata-rata: {rataRataNum}
            </p>
          </div>
        </div>

        {/* Badge Predikat di Kanan Atas (Warna senada dengan Badge 4 Pilar Evaluasi) */}
        <div
          className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold shrink-0 shadow-2xs border ${
            isDark
              ? "bg-sky-950/60 text-[#00A5EC] border-sky-800/40"
              : "bg-blue-50 text-[#004F9F] border-blue-200/60"
          }`}
        >
          Predikat: {predikat}
        </div>
      </div>

      {/* 2. Daftar Sub-Item Indikator (Gaya Kotak Rounded dengan Skor di Kanan) */}
      <div className="space-y-1.5 sm:space-y-2 pt-0.5">
        {items.map((it, idx) => {
          const itemJudul = it.judul || it.teks || `Indikator ${idx + 1}`;
          const itemScore = Math.round(Number(it.nilai || 0));

          return (
            <div
              key={idx}
              className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                isDark
                  ? "bg-slate-800/40 hover:bg-slate-800/70"
                  : "bg-[#F8FAFC] hover:bg-slate-100/80"
              }`}
            >
              {/* Kolom Kiri: Judul Indikator */}
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-[11px] sm:text-xs font-semibold leading-snug ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {itemJudul}
                </h4>
              </div>

              {/* Kolom Kanan: Angka Skor Besar */}
              <div
                className={`text-lg sm:text-xl font-black tabular-nums shrink-0 ${
                  isDark ? "text-sky-300" : "text-[#0B1442]"
                }`}
              >
                {itemScore}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KompetensiPillarCard;
