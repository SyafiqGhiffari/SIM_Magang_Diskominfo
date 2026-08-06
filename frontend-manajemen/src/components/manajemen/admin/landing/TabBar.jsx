/**
 * Baris tombol tab di atas kartu pengaturan.
 * Tampilan: kartu melengkung dengan latar bergradasi lembut, tiap tab punya
 * chip ikon sendiri, tab aktif diberi isian gradasi + bayangan + garis penanda.
 */
const TabBar = ({ tabs, aktif, onPilih, isDark }) => (
  <div
    className={`relative overflow-hidden rounded-3xl border p-2 shadow-sm transition-colors duration-300 ${
      isDark
        ? "border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.01]"
        : "border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50"
    }`}
  >
    {/* cahaya dekoratif di sudut */}
    <div
      className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#00A5EC] to-[#004F9F] blur-3xl ${
        isDark ? "opacity-10" : "opacity-[0.07]"
      }`}
    />

    <div className="relative flex snap-x gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t, i) => {
        const ini = aktif === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onPilih(t.key)}
            className={`group/tab relative inline-flex shrink-0 snap-start cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl px-4 py-3 text-[12.5px] font-bold transition-all duration-300 active:scale-[0.97] ${
              ini
                ? "bg-gradient-to-r from-[#0B1442] via-[#153070] to-[#1E3A8A] text-white shadow-lg shadow-[#0B1442]/30 -translate-y-0.5"
                : isDark
                ? "text-slate-400 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-slate-100"
                : "text-slate-500 hover:-translate-y-0.5 hover:bg-white hover:text-[#0B1442] hover:shadow-md"
            }`}
          >
            {/* kilau melintas saat disorot */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform duration-1000 group-hover/tab:translate-x-full" />

            {/* chip ikon */}
            <span
              className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                ini
                  ? "bg-white/15 text-[#7DD3FC] group-hover/tab:rotate-6 group-hover/tab:scale-110"
                  : isDark
                  ? "bg-white/[0.06] text-slate-400 group-hover/tab:bg-[#00A5EC]/15 group-hover/tab:text-[#00A5EC]"
                  : "bg-slate-100 text-slate-400 group-hover/tab:bg-[#00A5EC]/10 group-hover/tab:text-[#004F9F]"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>

            <span className="relative flex flex-col items-start leading-tight">
              <span
                className={`text-[9.5px] font-black uppercase tracking-widest ${
                  ini ? "text-white/45" : isDark ? "text-slate-600" : "text-slate-300"
                }`}
              >
                Bagian {String(i + 1).padStart(2, "0")}
              </span>
              <span className="whitespace-nowrap">{t.label}</span>
            </span>

            {/* garis penanda tab aktif */}
            <span
              className={`pointer-events-none absolute bottom-1 left-1/2 h-1 -translate-x-1/2 rounded-full bg-[#00A5EC] transition-all duration-300 ${
                ini
                  ? "w-10 opacity-100"
                  : "w-0 opacity-0 group-hover/tab:w-6 group-hover/tab:opacity-60"
              }`}
            />
          </button>
        );
      })}
    </div>
  </div>
);

export default TabBar;