import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarX2,
  RotateCcw,
  Building2,
  ArrowRight,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInisial = (nama) => {
  if (!nama) return "P";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export const MentorPresensiHariIniCard = ({ presensiHariIniList, isDark }) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("semua"); // "semua" | "hadir" | "izin" | "belum"

  const filteredList = useMemo(() => {
    return (presensiHariIniList || []).filter((item) => {
      const matchFilter =
        filterStatus === "semua" ||
        (filterStatus === "hadir" && (item.status === "hadir" || item.status === "terlambat")) ||
        (filterStatus === "izin" && (item.status === "izin" || item.status === "sakit")) ||
        (filterStatus === "belum" && (!item.status || item.status === "belum_absen" || item.status === "alpa"));

      return matchFilter;
    });
  }, [presensiHariIniList, filterStatus]);

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col h-full justify-between transition-colors ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Bagian Atas: Header + Filter Tabs */}
      <div className="shrink-0">
        {/* Header Card: Gaya persis seperti Perlu Tindakan Anda */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <CalendarCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight line-clamp-2 leading-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Presensi Peserta Hari Ini
              </h3>
              <p
                className={`mt-0.5 text-[9px] sm:text-[10.5px] font-medium line-clamp-2 leading-tight ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Pantau kehadiran seluruh peserta bimbingan hari ini
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs: Grid 4 Kolom Pas (Fit 100% Tanpa Perlu Scroll) */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 dark:bg-white/5 rounded-xl w-full">
            {[
              { id: "semua", label: "Semua" },
              { id: "hadir", label: "Hadir" },
              { id: "izin", label: "Izin" },
              { id: "belum", label: "Belum" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`py-1 px-0.5 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                  filterStatus === tab.id
                    ? "bg-[#0B1442] dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bagian Tengah: List Presensi Hari Ini (Scrollable max-h-[210px] agar pas dengan 3 stats) */}
      <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1 overflow-y-auto min-h-0 max-h-[215px] scroll-halus">
        {filteredList.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-3 sm:p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-white/5 dark:to-white/10 text-slate-400 dark:text-slate-500 shadow-2xs mb-2 ring-1 ring-slate-200/60 dark:ring-white/10">
              <CalendarX2 className="h-5 w-5 text-slate-400 dark:text-slate-400" strokeWidth={1.8} />
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Tidak Ada Data Presensi
            </h4>
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[210px] leading-snug">
              {filterStatus === "semua"
                ? "Belum ada catatan presensi hari ini."
                : `Tidak ada peserta dengan status filter "${filterStatus}".`}
            </p>
            {filterStatus !== "semua" && (
              <button
                type="button"
                onClick={() => setFilterStatus("semua")}
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#004F9F] dark:text-sky-400 bg-blue-50 dark:bg-sky-500/10 hover:bg-blue-100 dark:hover:bg-sky-500/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Tampilkan Semua</span>
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const fotoUrl = item.foto ? getFileUrl(item.foto) : null;
            const isHadir = item.status === "hadir";
            const isTerlambat = item.status === "terlambat";
            const isIzin = item.status === "izin" || item.status === "sakit";

            return (
              <div
                key={item.id || item.peserta_id}
                className={`p-2.5 sm:px-4 flex items-center justify-between gap-2.5 transition-colors ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={item.nama}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {getInisial(item.nama)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4
                      className={`text-xs sm:text-[13px] font-bold truncate leading-tight ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.nama}
                    </h4>
                    <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                      <Building2 className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{item.institusi || "-"}</span>
                    </p>
                  </div>
                </div>

                {/* Badge Status & Jam Masuk */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  {isHadir ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Hadir</span>
                    </span>
                  ) : isTerlambat ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Clock className="h-2.5 w-2.5" />
                      <span>Terlambat</span>
                    </span>
                  ) : isIzin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>{item.status === "sakit" ? "Sakit" : "Izin"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 dark:text-slate-500">
                      <span>Belum Hadir</span>
                    </span>
                  )}

                  {item.jam_masuk && (
                    <span className="text-[9px] text-slate-400 font-medium">
                      Masuk: {item.jam_masuk}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bagian Bawah: Footer Button Lihat Data Presensi Lengkap */}
      <div className="p-2.5 sm:px-4 sm:py-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <button
          type="button"
          onClick={() => navigate("/mentor/presensi")}
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Lihat Data Presensi Lengkap</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default MentorPresensiHariIniCard;
