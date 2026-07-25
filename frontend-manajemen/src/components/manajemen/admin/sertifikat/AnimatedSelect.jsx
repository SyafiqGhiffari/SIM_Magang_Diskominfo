import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// options: array of string ATAU array of { value, label }
const AnimatedSelect = ({ value, onChange, options = [], placeholder = "Pilih...", icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 cursor-pointer ${
          open ? "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#004F9F]" />}
          {current ? current.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-[#004F9F]" : "group-hover:translate-y-0.5"}`} />
      </button>

      <div
        className={`absolute left-0 right-0 z-30 mt-1.5 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {opts.map((o) => {
          const active = o.value === value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                active ? "bg-blue-50 text-[#004F9F]" : "text-slate-600 hover:bg-slate-50 hover:pl-4"
              }`}
            >
              {o.label}
              {active && <Check className="w-3.5 h-3.5 text-[#004F9F]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedSelect;