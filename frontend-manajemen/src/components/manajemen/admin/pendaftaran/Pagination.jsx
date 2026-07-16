import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

const PER_PAGE_OPTIONS = [5, 10, 25, 50];

const PerPageDropdown = ({ perPage, setPerPage, setPage }) => {
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
        className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          open ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {perPage}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180 text-[#004F9F]" : "text-slate-400"}`} />
      </button>

      <div
        className={`absolute right-0 bottom-full mb-2 z-30 w-20 origin-bottom-right rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-200 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 translate-y-1 pointer-events-none"
        }`}
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
            className="flex w-full items-center justify-between gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 transition-colors duration-150 hover:bg-slate-50 cursor-pointer"
            style={{
              transitionDelay: open ? `${i * 30}ms` : "0ms",
            }}
          >
            {n}
            {perPage === n && <Check className="w-3 h-3 text-[#004F9F]" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
};

const Pagination = ({ totalItems, page, setPage, perPage, setPerPage }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = page + 1;

  const getPageNumbers = () => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
      <p className="text-[11.5px] text-slate-500 shrink-0">
        Total data masuk: <span className="font-bold text-slate-700">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        {getPageNumbers().map((num) => (
          <button
            key={num}
            onClick={() => setPage(num - 1)}
            className={`relative flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
              currentPage === num
                ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md scale-105"
                : "border border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:shadow-sm"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-semibold text-slate-500">Tampilkan per halaman</span>
        <PerPageDropdown perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
      </div>
    </div>
  );
};

export default Pagination;