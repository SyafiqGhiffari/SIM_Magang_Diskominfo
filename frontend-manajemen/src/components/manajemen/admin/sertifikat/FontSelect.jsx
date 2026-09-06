import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search, Type } from "lucide-react";
import { FONT_OPTS, FONT_GROUPS, fontCss, fontLabel } from "../../../../constants/certificateFonts";

// Pemilih font khusus: daftarnya panjang, jadi dibuat ringkas
// (tinggi dibatasi + bisa digulir + ada pencarian + dikelompokkan).
const FontSelect = ({ value, onChange, isDark = false }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term ? FONT_OPTS.filter((f) => f.label.toLowerCase().includes(term)) : FONT_OPTS;
    return FONT_GROUPS.map((g) => ({ name: g, items: list.filter((f) => f.group === g) })).filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQ(""); }}
        className={`group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition-all duration-200 cursor-pointer ${
          open
            ? isDark
              ? "border-[#00A5EC] bg-[#0d1117] ring-4 ring-[#00A5EC]/20 text-slate-100"
              : "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15 text-slate-700"
            : isDark
            ? "border-white/10 bg-[#0d1117] text-slate-200 hover:border-white/20 hover:bg-[#161b22]"
            : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Type className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`} />
          <span className="truncate text-[13px]" style={{ fontFamily: fontCss(value) }}>{fontLabel(value)}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? (isDark ? "rotate-180 text-[#00A5EC]" : "rotate-180 text-[#004F9F]") : "group-hover:translate-y-0.5"}`} />
      </button>

      <div
        className={`absolute left-0 right-0 z-40 mt-1.5 origin-top overflow-hidden rounded-xl border shadow-xl transition-all duration-200 ${
          isDark ? "border-white/10 bg-[#1e2530]" : "border-slate-200 bg-white"
        } ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Pencarian font */}
        <div className={`border-b p-2 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"}`}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Cari font..."
              className={`w-full rounded-lg border py-1.5 pl-8 pr-2 text-[11px] font-semibold outline-none transition-all ${
                isDark
                  ? "border-white/10 bg-[#0d1117] text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:ring-2 focus:ring-[#00A5EC]/20"
                  : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-2 focus:ring-[#00A5EC]/20"
              }`}
            />
          </div>
        </div>

        {/* Daftar font: tinggi dibatasi agar tidak terlalu panjang */}
        <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
          {groups.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] font-semibold text-slate-400">Font tidak ditemukan</p>
          ) : (
            groups.map((g) => (
              <div key={g.name}>
                <p className={`sticky top-0 z-10 px-3 py-1 text-[9.5px] font-black uppercase tracking-wider backdrop-blur ${
                  isDark ? "bg-[#1e2530]/95 text-slate-400" : "bg-white/95 text-slate-400"
                }`}>{g.name}</p>
                {g.items.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() => { onChange(o.value); setOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-all duration-150 cursor-pointer ${
                        active
                          ? isDark ? "bg-sky-950/40 text-sky-400 font-bold" : "bg-blue-50 text-[#004F9F]"
                          : isDark ? "text-slate-300 hover:bg-white/5 hover:pl-4" : "text-slate-600 hover:bg-slate-50 hover:pl-4"
                      }`}
                    >
                      <span className="truncate text-[13px]" style={{ fontFamily: o.css }}>{o.label}</span>
                      {active && <Check className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FontSelect;