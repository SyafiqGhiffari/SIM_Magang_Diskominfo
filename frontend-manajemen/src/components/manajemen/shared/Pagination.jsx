import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

const PER_PAGE_OPTIONS = [5, 10, 25, 50];

const PerPageDropdown = ({ perPage, setPerPage, setPage, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          open
            ? isDark
              ? "border-[#00A5EC]/50 bg-[#00A5EC]/15 text-sky-300"
              : "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]"
            : isDark
              ? "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {perPage}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180 text-[#00A5EC]" : "text-slate-400"}`} />
      </button>

      <div
        className={`absolute right-0 bottom-full mb-2 z-30 w-20 origin-bottom-right rounded-xl border overflow-hidden transition-all duration-200 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 translate-y-1 pointer-events-none"
        } ${isDark ? "border-white/10 bg-[#161b22] shadow-2xl" : "border-slate-200 bg-white shadow-xl"}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {PER_PAGE_OPTIONS.map((n, i) => (
          <button
            key={n}
            onClick={() => {
              setPerPage(n);
              setPage(0);
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between gap-1.5 px-3 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer ${
              isDark ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
            style={{
              transitionDelay: open ? `${i * 30}ms` : "0ms",
            }}
          >
            {n}
            {perPage === n && <Check className={`w-3 h-3 ${isDark ? "text-[#00A5EC]" : "text-[#004F9F]"}`} strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export const Pagination = ({ totalItems, page, setPage, perPage, setPerPage, isDark = false }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = page + 1;

  const getPageNumbers = () => {
    // Delta 1 on mobile (max 3 buttons), Delta 2 on desktop (max 5 buttons)
    const delta = typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-t ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/40"
    }`}>
      <p className={`text-[10px] sm:text-[11.5px] shrink-0 hidden sm:block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Total data masuk: <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{totalItems}</span>
      </p>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className={`group flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed ${
            isDark
              ? "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/10 disabled:hover:border-white/10 disabled:hover:text-slate-400"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] disabled:hover:border-slate-200 disabled:hover:text-slate-500"
          }`}
        >
          <ChevronLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        {getPageNumbers().map((num) => (
          <button
            key={num}
            onClick={() => setPage(num - 1)}
            className={`relative flex h-7.5 min-w-7.5 sm:h-8 sm:min-w-8 items-center justify-center rounded-lg px-1.5 sm:px-2 text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
              currentPage === num
                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md scale-105 border border-white/10"
                : isDark
                  ? "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-slate-100 hover:bg-white/10 hover:shadow-sm"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:shadow-sm"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className={`group flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed ${
            isDark
              ? "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/10 disabled:hover:border-white/10 disabled:hover:text-slate-400"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] disabled:hover:border-slate-200 disabled:hover:text-slate-500"
          }`}
        >
          <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className={`text-[10px] sm:text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          <span className="inline sm:hidden">Tampilkan:</span>
          <span className="hidden sm:inline">Tampilkan per halaman</span>
        </span>
        <PerPageDropdown perPage={perPage} setPerPage={setPerPage} setPage={setPage} isDark={isDark} />
      </div>
    </div>
  );
};

export default Pagination;
