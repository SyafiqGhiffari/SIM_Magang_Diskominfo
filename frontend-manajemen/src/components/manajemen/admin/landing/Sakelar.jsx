/**
 * Sakelar (toggle) menggantikan kotak centang polos.
 * Perubahan langsung tersimpan otomatis oleh halaman induk.
 */
const Sakelar = ({ nyala, onUbah, judul, ket, isDark, ikon: Ikon = null }) => (
  <button
    type="button"
    onClick={() => onUbah(!nyala)}
    className={`group/sakelar flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.995] ${
      nyala
        ? isDark
          ? "border-[#00A5EC]/40 bg-[#00A5EC]/[0.07]"
          : "border-[#00A5EC]/45 bg-gradient-to-r from-[#00A5EC]/[0.07] to-transparent shadow-sm"
        : isDark
        ? "border-white/10 bg-white/[0.03] hover:border-white/20"
        : "border-slate-200/80 bg-slate-50/60 hover:border-slate-300 hover:bg-white hover:shadow-sm"
    }`}
  >
    {Ikon && (
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          nyala
            ? "bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md"
            : isDark
            ? "bg-white/5 text-slate-500"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        <Ikon className="h-4.5 w-4.5" strokeWidth={2.2} />
      </span>
    )}

    <span className="min-w-0 flex-1">
      <span
        className={`block text-[13px] font-black tracking-tight ${
          isDark ? "text-slate-100" : "text-[#0B1442]"
        }`}
      >
        {judul}
      </span>
      {ket && (
        <span
          className={`mt-0.5 block text-[11.5px] font-medium leading-relaxed ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {ket}
        </span>
      )}
    </span>

    {/* batang sakelar */}
    <span
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
        nyala
          ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC]"
          : isDark
          ? "bg-white/15"
          : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
          nyala ? "left-[22px]" : "left-0.5"
        }`}
      />
    </span>
  </button>
);

export default Sakelar;