const tabs = [
  { key: "menunggu", label: "Menunggu", dot: "bg-amber-500" },
  { key: "revisi", label: "Revisi", dot: "bg-orange-500" },
  { key: "diterima", label: "Diterima", dot: "bg-emerald-500" },
  { key: "ditolak", label: "Ditolak", dot: "bg-red-500" },
];

const FilterTabs = ({ active, onChange, counts }) => (
  <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 overflow-x-auto max-w-full">
    {tabs.map((t) => {
      const isActive = active === t.key;
      return (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
            isActive
              ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
              : "text-slate-500 hover:bg-white hover:text-slate-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : t.dot}`} />
          {t.label}
          {counts?.[t.key] !== undefined && (
            <span
              className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9.5px] font-black ${
                isActive ? "bg-white/20 text-white" : "bg-white text-slate-500"
              }`}
            >
              {counts[t.key]}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;