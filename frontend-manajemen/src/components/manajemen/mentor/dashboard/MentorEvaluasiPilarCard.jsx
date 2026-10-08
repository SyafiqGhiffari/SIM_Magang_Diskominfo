import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, CheckCircle2, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInisial = (nama) => {
  if (!nama) return "P";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export const MentorEvaluasiPilarCard = ({ pesertaList, isDark }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("semua"); // "semua" | "aktif" | "selesai"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rawList = useMemo(() => pesertaList || [], [pesertaList]);
  const total = rawList.length;
  const aktifCount = rawList.filter((p) => p.status_magang === "aktif").length;
  const selesaiCount = rawList.filter((p) => p.status_magang === "selesai").length;

  const options = useMemo(
    () => [
      { value: "semua", label: "Semua", count: total },
      { value: "aktif", label: "Aktif", count: aktifCount },
      { value: "selesai", label: "Selesai", count: selesaiCount },
    ],
    [total, aktifCount, selesaiCount]
  );

  const currentOption = options.find((o) => o.value === tab) || options[0];

  const displayList = useMemo(() => {
    if (tab === "aktif") return rawList.filter((p) => p.status_magang === "aktif");
    if (tab === "selesai") return rawList.filter((p) => p.status_magang === "selesai");
    return rawList;
  }, [rawList, tab]);

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col h-full justify-between min-h-[350px] max-h-[350px] ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-2.5 shrink-0 relative">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <Award className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`text-xs sm:text-sm font-black tracking-tight leading-tight truncate ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Evaluasi 4 Pilar Kompetensi
            </h3>
            <p
              className={`mt-0.5 text-[9px] sm:text-[10.5px] font-medium line-clamp-2 leading-snug ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Progres penilaian aspek profesional, personal, sosial, dan administratif
            </p>
          </div>
        </div>

        {/* Dropdown Filter di Kanan Atas */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
              isDark
                ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-sky-400/40"
                : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-[#004F9F]/40"
            }`}
          >
            <span>
              {currentOption.label} ({currentOption.count})
            </span>
            <ChevronDown
              className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-38 rounded-xl border shadow-xl p-1 z-30 animate-[fadeIn_0.15s_ease-out] backdrop-blur-md ${
                isDark
                  ? "bg-[#161b22]/95 border-white/10 text-slate-200"
                  : "bg-white/95 border-slate-200 text-slate-700"
              }`}
            >
              {options.map((opt) => {
                const isActive = tab === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTab(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer text-left ${
                      isActive
                        ? isDark
                          ? "bg-sky-500/15 text-sky-400 font-extrabold"
                          : "bg-blue-50 text-[#004F9F] font-extrabold"
                        : isDark
                          ? "hover:bg-white/5 text-slate-300"
                          : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? isDark
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-blue-100 text-[#004F9F]"
                          : isDark
                            ? "bg-white/5 text-slate-400"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table / List: Scrollable jika data banyak */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-halus">
        {!displayList || displayList.length === 0 ? (
          <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-white/5 dark:to-white/10 text-slate-400 dark:text-slate-500 shadow-2xs mb-2 ring-1 ring-slate-200/60 dark:ring-white/10">
              <Award className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {tab === "aktif"
                ? "Belum Ada Peserta Aktif"
                : tab === "selesai"
                  ? "Belum Ada Peserta Selesai"
                  : "Belum Ada Peserta Bimbingan"}
            </h4>
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[220px] leading-snug">
              {tab === "aktif"
                ? "Tidak ada peserta bimbingan aktif yang terdaftar saat ini."
                : tab === "selesai"
                  ? "Belum ada peserta bimbingan yang telah menyelesaikan masa magang."
                  : "Belum ada riwayat peserta bimbingan yang ditugaskan kepada Anda."}
            </p>
          </div>
        ) : (
          displayList.map((p) => {
            const fotoUrl = p.foto_profil ? getFileUrl(p.foto_profil) : null;
            const isFinal = p.status_penilaian === "final";
            const isDraf = p.status_penilaian === "draf";
            const nilaiAkhir = p.nilai_akhir_angka != null ? Number(p.nilai_akhir_angka).toFixed(1) : null;
            const isSelesai = p.status_magang === "selesai";

            return (
              <div
                key={p.id || p.akun_peserta_id}
                className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-[background-color] duration-150 ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"
                }`}
              >
                {/* Info Peserta */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={p.nama_lengkap}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {getInisial(p.nama_lengkap)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs sm:text-[13px] font-bold truncate leading-tight ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {p.nama_lengkap}
                      </h4>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] sm:text-[9px] font-bold shrink-0 ${
                          isSelesai
                            ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isSelesai ? "Selesai" : "Aktif"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {p.institusi || "-"} • {p.jurusan || "-"}
                    </p>
                  </div>
                </div>

                {/* Nilai 4 Pilar & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                  {/* Skor 4 Pilar Mini */}
                  <div className="flex items-center gap-1">
                    <span
                      title="Skor Profesional"
                      className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                    >
                      {p.nilai_profesional != null ? Number(p.nilai_profesional).toFixed(0) : "-"}
                    </span>
                    <span
                      title="Skor Personal"
                      className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      {p.nilai_personal != null ? Number(p.nilai_personal).toFixed(0) : "-"}
                    </span>
                    <span
                      title="Skor Sosial"
                      className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    >
                      {p.nilai_sosial != null ? Number(p.nilai_sosial).toFixed(0) : "-"}
                    </span>
                    <span
                      title="Skor Administratif"
                      className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                    >
                      {p.nilai_administratif != null ? Number(p.nilai_administratif).toFixed(0) : "-"}
                    </span>
                  </div>

                  {/* Badge Status & Nilai Akhir */}
                  <div className="flex items-center">
                    {isFinal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{nilaiAkhir} ({p.indeks_nilai_akhir || "A"})</span>
                      </span>
                    ) : isDraf ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Draf</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-500/10 text-slate-400">
                        Belum Dinilai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Button Kelola Penilaian Lengkap */}
      <div className="p-2.5 sm:px-4 sm:py-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <button
          type="button"
          onClick={() => navigate("/mentor/penilaian")}
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Kelola Penilaian 4 Pilar Lengkap</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default MentorEvaluasiPilarCard;
