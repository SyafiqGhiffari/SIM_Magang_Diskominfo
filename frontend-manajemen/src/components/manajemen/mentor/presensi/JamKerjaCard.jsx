import { useEffect, useState, useMemo, useCallback } from "react";
import { getJamKerjaMentor } from "../../../../services/mentorService";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import {
  Clock,
  CalendarDays,
  CalendarClock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Info,
  Timer,
  Loader2,
  CalendarOff,
} from "lucide-react";

const HARI_LABEL = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};

const HARI_KEYS = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

// Hitung batas waktu maksimal toleransi: "08:00" + 15 mnt -> "08:15"
const hitungBatasToleransi = (jamMasuk, toleransi) => {
  if (!jamMasuk) return "--:--";
  const [h, m] = jamMasuk.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return jamMasuk;
  const totalMenit = h * 60 + m + (Number(toleransi) || 0);
  const newH = Math.floor(totalMenit / 60) % 24;
  const newM = totalMenit % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

// Hitung durasi jam kerja dari masuk ke pulang
const hitungDurasi = (jamMasuk, jamPulang) => {
  if (!jamMasuk || !jamPulang) return "-";
  const [h1, m1] = jamMasuk.split(":").map(Number);
  const [h2, m2] = jamPulang.split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "-";
  const selisih = h2 * 60 + m2 - (h1 * 60 + m1);
  if (selisih <= 0) return "-";
  const jam = Math.floor(selisih / 60);
  const sisaMenit = selisih % 60;
  if (sisaMenit === 0) return `${jam} Jam`;
  return `${jam} Jam ${sisaMenit} Menit`;
};

const JamKerjaCard = () => {
  const { isDark } = useManajemenTheme();
  const [jamList, setJamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJamKerja = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJamKerjaMentor();
      const data = res.data?.data || [];
      setJamList(data);
    } catch (err) {
      console.error("Gagal memuat ketentuan jam kerja:", err);
      setError("Gagal memuat ketentuan jam kerja resmi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchJamKerja();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchJamKerja]);

  // Identifikasi hari saat ini
  const hariIniKey = useMemo(() => {
    const dayIdx = new Date().getDay();
    return HARI_KEYS[dayIdx];
  }, []);

  const labelHariIni = useMemo(() => {
    return HARI_LABEL[hariIniKey] || "Akhir Pekan";
  }, [hariIniKey]);

  // Cari konfigurasi hari ini
  const configHariIni = useMemo(() => {
    return jamList.find((j) => j.hari?.toLowerCase() === hariIniKey);
  }, [jamList, hariIniKey]);

  const isHariKerjaAktif = Boolean(configHariIni && configHariIni.is_aktif);

  return (
    <div
      className={`rounded-2xl border shadow-xs overflow-hidden transition-colors duration-200 ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* ── HEADER CARD ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Ketentuan &amp; Jam Kerja Resmi
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">
              Jadwal operasional presensi, jam masuk, jam pulang, dan batas toleransi keterlambatan peserta magang.
            </p>
          </div>
        </div>

        {/* Pojok Kanan Atas: Badge Standar Admin */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Standar Admin
          </span>
        </div>
      </div>

      {/* ── HIGHLIGHT STRIP (4 STATS SESUAI DATA HARI INI) ── */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 px-3.5 sm:px-6 py-3.5 border-t border-b ${
          isDark ? "border-white/5 bg-white/[0.015]" : "border-slate-100 bg-slate-50/60"
        }`}
      >
        {/* Stat 1: Jam Masuk Hari Ini */}
        <div
          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border ${
            isDark ? "border-white/5 bg-white/5" : "border-slate-200/70 bg-white"
          }`}
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <LogIn className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Jam Masuk ({labelHariIni})
            </span>
            <span className={`text-xs sm:text-sm font-black truncate block ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              {loading ? "..." : isHariKerjaAktif ? `${configHariIni.jam_masuk} WIB` : "Libur"}
            </span>
          </div>
        </div>

        {/* Stat 2: Jam Pulang Hari Ini */}
        <div
          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border ${
            isDark ? "border-white/5 bg-white/5" : "border-slate-200/70 bg-white"
          }`}
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <LogOut className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Jam Pulang ({labelHariIni})
            </span>
            <span className={`text-xs sm:text-sm font-black truncate block ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              {loading ? "..." : isHariKerjaAktif ? `${configHariIni.jam_pulang} WIB` : "Libur"}
            </span>
          </div>
        </div>

        {/* Stat 3: Toleransi Terlambat Hari Ini */}
        <div
          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border ${
            isDark ? "border-white/5 bg-white/5" : "border-slate-200/70 bg-white"
          }`}
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Toleransi Terlambat
            </span>
            <span className={`text-xs sm:text-sm font-black truncate block ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              {loading ? "..." : isHariKerjaAktif ? `${configHariIni.toleransi_terlambat || 0} Menit` : "-"}
            </span>
          </div>
        </div>

        {/* Stat 4: Status Hari Ini */}
        <div
          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border ${
            isDark ? "border-white/5 bg-white/5" : "border-slate-200/70 bg-white"
          }`}
        >
          <span
            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${
              isHariKerjaAktif
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Status ({labelHariIni})
            </span>
            <span
              className={`text-xs sm:text-sm font-black truncate block ${
                isHariKerjaAktif
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isDark
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {loading ? "..." : isHariKerjaAktif ? "Wajib Presensi" : "Libur"}
            </span>
          </div>
        </div>
      </div>

      {/* ── TABEL JADWAL JAM KERJA PER HARI ── */}
      <div className="p-3.5 sm:p-6 pt-2 sm:pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#00A5EC] mb-2" />
            <span className="text-xs font-semibold">Memuat ketentuan jam kerja...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
                  }`}
                >
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Hari
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Jam Masuk
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Batas Toleransi
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Jam Pulang
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Durasi Kerja
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                {jamList.map((item) => {
                  const isHariIni = item.hari?.toLowerCase() === hariIniKey;
                  const labelHari = HARI_LABEL[item.hari?.toLowerCase()] || item.hari;
                  const batasToleransi = hitungBatasToleransi(item.jam_masuk, item.toleransi_terlambat);
                  const durasi = hitungDurasi(item.jam_masuk, item.jam_pulang);

                  return (
                    <tr
                      key={item.id || item.hari}
                      className={`transition-colors duration-150 ${
                        isHariIni
                          ? isDark
                            ? "bg-sky-950/20 hover:bg-sky-950/30"
                            : "bg-sky-50/50 hover:bg-sky-50/70"
                          : isDark
                          ? "hover:bg-white/[0.02]"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Hari */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-xs ${
                              isHariIni
                                ? "bg-gradient-to-br from-[#004F9F] to-[#00A5EC]"
                                : "bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900"
                            }`}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span
                              className={`text-xs font-black block ${
                                isDark ? "text-slate-100" : "text-[#0B1442]"
                              }`}
                            >
                              {labelHari}
                            </span>
                            {isHariIni && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Jam Masuk */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                            <LogIn className="w-3 h-3 text-emerald-500" />
                            {item.jam_masuk || "--:--"} WIB
                          </span>
                        </div>
                      </td>

                      {/* Batas Toleransi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {batasToleransi} WIB
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            (+{item.toleransi_terlambat || 0} mnt)
                          </span>
                        </div>
                      </td>

                      {/* Jam Pulang */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20">
                            <LogOut className="w-3 h-3 text-sky-500" />
                            {item.jam_pulang || "--:--"} WIB
                          </span>
                        </div>
                      </td>

                      {/* Durasi Kerja */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Timer className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold">{durasi}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {item.is_aktif ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Wajib Presensi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                            <CalendarOff className="w-3 h-3" /> Diliburkan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ATURAN & CATATAN PRESENSI ── */}
        <div
          className={`mt-4 rounded-xl p-3 sm:p-4 border ${
            isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200/70 bg-slate-50/70"
          }`}
        >
          <div className="flex items-start gap-2.5 sm:gap-3">
            <span
              className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                isDark ? "bg-sky-500/10 text-sky-400" : "bg-sky-100 text-[#004F9F]"
              }`}
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-[11px] sm:text-xs font-black ${
                  isDark ? "text-slate-200" : "text-[#0B1442]"
                }`}
              >
                Informasi &amp; Aturan Perhitungan Presensi
              </h4>
              <ul className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Presensi Tepat Waktu:</strong> Dicatat jika
                  peserta melakukan presensi masuk sebelum atau tepat pada batas waktu toleransi keterlambatan.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Presensi Terlambat:</strong> Dicatat jika
                  peserta melakukan presensi masuk setelah batas waktu toleransi. Sistem secara otomatis menghitung menit
                  keterlambatan dari jam masuk resmi.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Presensi Pulang:</strong> Tombol presensi
                  pulang dibuka saat jam pulang operasional hari tersebut telah tercapai.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Status Alfa Otomatis:</strong> Peserta yang
                  tidak melakukan presensi dan tidak memiliki pengajuan izin/sakit yang disetujui akan tercatat otomatis
                  sebagai Alfa saat pergantian hari.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JamKerjaCard;
