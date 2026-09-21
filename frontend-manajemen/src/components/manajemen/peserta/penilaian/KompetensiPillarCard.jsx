export const KompetensiPillarCard = ({ title, bobot, rataRata, items = [], colorScheme = "blue", isDark = false }) => {
  const colorMap = {
    blue: {
      text: "text-blue-600 dark:text-blue-400",
      subtext: "text-blue-700 dark:text-blue-300",
    },
    emerald: {
      text: "text-emerald-600 dark:text-emerald-400",
      subtext: "text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      text: "text-amber-600 dark:text-amber-400",
      subtext: "text-amber-700 dark:text-amber-300",
    },
    purple: {
      text: "text-purple-600 dark:text-purple-400",
      subtext: "text-purple-700 dark:text-purple-300",
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
        isDark
          ? "border-white/10 bg-[#161b22]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-white/5">
        <div className={`font-extrabold text-xs ${scheme.text}`}>
          {title} ({bobot}%)
        </div>
        <div className={`text-xs font-black ${scheme.subtext}`}>
          Rata-rata: {Number(rataRata || 0).toFixed(2)}
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-slate-600 dark:text-slate-300"
          >
            <span className="truncate pr-2">
              {i + 1}. {it.teks}
            </span>
            <span className="font-bold text-slate-900 dark:text-white shrink-0">
              {it.nilai} ({it.indeks || "A"})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KompetensiPillarCard;
