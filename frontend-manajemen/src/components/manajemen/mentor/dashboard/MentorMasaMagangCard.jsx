import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, ArrowRight, ChevronDown } from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInisial = (nama) => {
  if (!nama) return "P";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const formatTanggal = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const MentorMasaMagangCard = ({
  pesertaMasaMagang,
  pesertaHampirSelesai,
  isDark,
}) => {
  const navigate = useNavigate();
  const rawList = useMemo(
    () => pesertaMasaMagang || pesertaHampirSelesai || [],
    [pesertaMasaMagang, pesertaHampirSelesai]
  );
  const [tab, setTab] = useState("semua"); // "semua" | "akan_berakhir" | "selesai"
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

  const total = rawList.length;
  const selesaiCount = rawList.filter((p) => p.status_magang === "selesai").length;
  const akanBerakhirCount = rawList.filter((p) => p.status_magang === "aktif").length;

  const options = useMemo(
    () => [
      { value: "semua", label: "Semua", count: total },
      { value: "akan_berakhir", label: "Akan Berakhir", count: akanBerakhirCount },
      { value: "selesai", label: "Selesai", count: selesaiCount },
    ],
    [total, akanBerakhirCount, selesaiCount]
  );

  const currentOption = options.find((o) => o.value === tab) || options[0];

  const displayList = useMemo(() => {
    if (tab === "selesai") return rawList.filter((p) => p.status_magang === "selesai");
    if (tab === "akan_berakhir") return rawList.filter((p) => p.status_magang === "aktif");
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
            <Clock className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`text-xs sm:text-sm font-black tracking-tight leading-tight truncate ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Monitoring Akhir Magang
            </h3>
            <p
              className={`mt-0.5 text-[9px] sm:text-[10.5px] font-medium line-clamp-2 leading-snug ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Pantau masa bimbingan, laporan akhir, dan kelulusan
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

      {/* List: Scrollable jika data banyak */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-halus">
        {!displayList || displayList.length === 0 ? (
          <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-white/5 dark:to-white/10 text-emerald-500/70 shadow-2xs mb-2 ring-1 ring-slate-200/60 dark:ring-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={1.8} />
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {tab === "akan_berakhir"
                ? "Tidak Ada yang Akan Berakhir"
                : tab === "selesai"
                  ? "Belum Ada Peserta Selesai"
                  : "Tidak Ada Peserta"}
            </h4>
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[220px] leading-snug">
              {tab === "akan_berakhir"
                ? "Semua masa bimbingan peserta aktif masih berjalan normal."
                : tab === "selesai"
                  ? "Belum ada peserta bimbingan yang telah menyelesaikan magang."
                  : "Semua masa bimbingan peserta masih berjalan normal."}
            </p>
          </div>
        ) : (
          displayList.map((p) => {
            const fotoUrl = p.foto_profil ? getFileUrl(p.foto_profil) : null;
            const isLaporanAcc = Boolean(p.file_laporan_akhir);
            const isNilaiFinal = p.status_penilaian === "final";
            const isNilaiDraf = p.status_penilaian === "draf";
            const isSelesai = p.status_magang === "selesai";

            return (
              <div
                key={p.id || p.akun_peserta_id}
                className={`p-3 sm:px-4 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-[background-color] duration-150 ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={p.nama_lengkap}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200">
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
                      <div className="flex items-center flex-wrap gap-1.5 text-[10px] mt-1">
                        <span className="text-slate-400 mr-0.5">
                          Selesai: {formatTanggal(p.tanggal_selesai)}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shrink-0">
                          {isLaporanAcc ? (
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-2.5 w-2.5 text-rose-500" />
                          )}
                          <span className={isLaporanAcc ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            Laporan: {isLaporanAcc ? "Ada" : "Belum"}
                          </span>
                        </span>
                        {isNilaiFinal ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shrink-0">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Nilai: Final</span>
                          </span>
                        ) : isNilaiDraf ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shrink-0">
                            <Clock className="h-2.5 w-2.5 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">Nilai: Draf</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shrink-0">
                            <XCircle className="h-2.5 w-2.5 text-rose-500" />
                            <span className="text-rose-600 dark:text-rose-400">Nilai: Belum</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 ${
                      isSelesai
                        ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                        : p.sisaHari != null && p.sisaHari <= 0
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : p.sisaHari === 1
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : p.sisaHari != null && p.sisaHari <= 7
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {isSelesai
                      ? "Selesai Magang"
                      : p.sisaHari != null && p.sisaHari <= 0
                        ? "Telah Berakhir"
                        : p.sisaHari === 1
                          ? "Besok Berakhir"
                          : p.sisaHari != null
                            ? `${p.sisaHari} Hari Lagi`
                            : "Aktif"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Button Kelola Masa Magang */}
      <div className="p-2.5 sm:px-4 sm:py-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <button
          type="button"
          onClick={() => navigate("/mentor/penilaian")}
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Kelola Penilaian & Kelulusan Peserta</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default MentorMasaMagangCard;
