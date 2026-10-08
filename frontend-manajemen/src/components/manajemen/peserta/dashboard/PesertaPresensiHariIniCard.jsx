import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  CalendarOff,
  AlarmClockOff,
  HeartPulse,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const formatTanggalLengkap = (dateStr) => {
  if (!dateStr) return "";
  try {
    const clean = String(dateStr).split("T")[0];
    const [y, m, d] = clean.split("-");
    if (!y || !m || !d) return dateStr;
    const bulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const bIndex = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${bulan[bIndex] || m} ${y}`;
  } catch {
    return dateStr;
  }
};

export const PesertaPresensiHariIniCard = ({
  presensiHariIni,
  timeline,
  izinTerkini = [],
  onSelectIzin,
  isDark = false,
}) => {
  const navigate = useNavigate();

  const hariKerja = presensiHariIni?.hari_kerja;
  const sudahMasuk = presensiHariIni?.sudah_masuk;
  const sudahPulang = presensiHariIni?.sudah_pulang;
  const izinAktifHariIni = presensiHariIni?.izin_hari_ini;
  const jamKerja = presensiHariIni?.jam_kerja;

  // Evaluasi Status Presensi Sebenarnya (hadir, terlambat, alfa, izin, sakit)
  const statusPresensi =
    presensiHariIni?.status_presensi ||
    (presensiHariIni?.status !== "selesai" && presensiHariIni?.status !== "sudah_masuk"
      ? presensiHariIni?.status
      : "") ||
    "";

  // Cek apakah masuk dalam kondisi terlambat (dari backend status atau perbandingan jam kerja)
  const isTerlambat = (() => {
    if (statusPresensi === "terlambat") return true;
    if (Number(presensiHariIni?.menit_terlambat || 0) > 0) return true;
    if (sudahMasuk && presensiHariIni?.jam_masuk_aktual && jamKerja?.jam_masuk) {
      const [hM, mM] = String(presensiHariIni.jam_masuk_aktual).split(":").map(Number);
      const [hK, mK] = String(jamKerja.jam_masuk).split(":").map(Number);
      if (!isNaN(hM) && !isNaN(mM) && !isNaN(hK) && !isNaN(mK)) {
        const menitAktual = hM * 60 + mM;
        const toleransi = Number(jamKerja?.toleransi_terlambat) || 15;
        const menitBatas = hK * 60 + mK + toleransi;
        if (menitAktual > menitBatas) return true;
      }
    }
    return false;
  })();

  const isAlfa = statusPresensi === "alfa";
  const isIzinSakit = !!izinAktifHariIni || statusPresensi === "izin" || statusPresensi === "sakit";

  const fotoMasukUrl = presensiHariIni?.foto_masuk
    ? getFileUrl(presensiHariIni.foto_masuk)
    : null;
  const fotoPulangUrl = presensiHariIni?.foto_pulang
    ? getFileUrl(presensiHariIni.foto_pulang)
    : null;

  // Dynamic styling untuk box Masuk & Pulang (kuning/amber jika tercatat terlambat)
  const masukBoxClass = isAlfa
    ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
    : isIzinSakit
    ? "bg-purple-500/10 border-purple-500/25 text-purple-700 dark:text-purple-300"
    : sudahMasuk
    ? isTerlambat
      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
    : "bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-400";

  const pulangBoxClass = isAlfa
    ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
    : isIzinSakit
    ? "bg-purple-500/10 border-purple-500/25 text-purple-700 dark:text-purple-300"
    : sudahPulang
    ? isTerlambat
      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
    : "bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-400";

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col h-full justify-between transition-colors ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* ── BAGIAN BODY ATAS & KONTEN KARTU (FLEX-1 MENGISI RUANG PENUH AGAR SEJAJAR DENGAN CARD STATS) ── */}
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col min-h-0">
        {/* Header: Ikon + Judul "Presensi Hari Ini & Izin" + Tanggal Lengkap + Pojok Kanan Batch */}
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <CalendarDays className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight leading-tight truncate ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Presensi Hari Ini &amp; Izin
              </h3>
              <p
                className={`mt-0.5 text-[9px] sm:text-[10px] font-medium leading-tight truncate ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {formatTanggalLengkap(presensiHariIni?.tanggal)}
              </p>
            </div>
          </div>

          {/* Kolom Pojok Kanan Atas: Batch (Badge) Status Kehadiran Hari Ini (Multi Kondisi & Warna) */}
          <div className="shrink-0 pt-0.5">
            {isIzinSakit ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/80">
                <HeartPulse className="w-3 h-3 text-purple-600" />
                <span>{statusPresensi === "sakit" ? "Sakit Hari Ini" : "Izin Hari Ini"}</span>
              </span>
            ) : isAlfa ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80">
                <AlarmClockOff className="w-3 h-3 text-rose-600" />
                <span>Alfa</span>
              </span>
            ) : isTerlambat ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{sudahPulang ? "Terlambat (Selesai)" : "Terlambat"}</span>
              </span>
            ) : sudahPulang ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Presensi Lengkap</span>
              </span>
            ) : sudahMasuk ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-100 text-[#004F9F] dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/80">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>Sedang Magang</span>
              </span>
            ) : !hariKerja ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/80">
                <CalendarOff className="w-3 h-3 text-slate-600" />
                <span>Libur Dinas</span>
              </span>
            ) : timeline?.status === "belum_mulai" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-[#004F9F] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/80">
                <span>Belum Mulai</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80">
                <AlarmClockOff className="w-3 h-3 text-rose-600" />
                <span>Belum Presensi</span>
              </span>
            )}
          </div>
        </div>

        {/* ── 1. STATUS PRESENSI HARI INI & JAM AKTUAL (KOTAK 1) ── */}
        <div
          className={`rounded-xl border p-2.5 space-y-2 transition-all shrink-0 ${
            isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-200/70"
          }`}
        >
          {/* Header Baris Jam Kerja & Toleransi di Pojok Kanan */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 min-w-0 truncate">
              <Clock className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
              {hariKerja ? (
                <span>
                  {jamKerja?.jam_masuk || "08:00"} – {jamKerja?.jam_pulang || "15:30"}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  Libur Dinas ({presensiHariIni?.alasan_libur || "Non Hari Kerja"})
                </span>
              )}
            </div>

            {/* Toleransi Berapa Menit di Pojok Kanan */}
            {hariKerja && (
              <span className="text-[9.5px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/5 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                Toleransi {jamKerja?.toleransi_terlambat || 15} Menit
              </span>
            )}
          </div>

          {/* Baris Jam Masuk & Pulang Aktual (Keduanya Kuning/Amber jika Terlambat) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Box Masuk */}
            <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${masukBoxClass}`}>
              <div className="min-w-0">
                <span className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {isTerlambat && sudahMasuk ? "Masuk (Telat)" : "Masuk"}
                </span>
                <span
                  className={`text-[11px] font-black tabular-nums ${
                    isAlfa
                      ? "text-rose-600 dark:text-rose-400"
                      : isIzinSakit
                      ? "text-purple-600 dark:text-purple-400"
                      : isTerlambat && sudahMasuk
                      ? "text-amber-600 dark:text-amber-400"
                      : sudahMasuk
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {isAlfa
                    ? "Alfa"
                    : isIzinSakit
                    ? statusPresensi === "sakit"
                      ? "Sakit"
                      : "Izin"
                    : presensiHariIni?.jam_masuk_aktual || "--:--"}
                </span>
              </div>
              {fotoMasukUrl ? (
                <img
                  src={fotoMasukUrl}
                  alt="Selfie Masuk"
                  className={`h-7 w-7 rounded-full object-cover border shrink-0 ${
                    isTerlambat ? "border-amber-400" : "border-emerald-400"
                  }`}
                />
              ) : (
                <LogIn className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </div>

            {/* Box Pulang (Ikut Kuning/Amber jika Tercatat Terlambat) */}
            <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${pulangBoxClass}`}>
              <div className="min-w-0">
                <span className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Pulang
                </span>
                <span
                  className={`text-[11px] font-black tabular-nums ${
                    isAlfa
                      ? "text-rose-600 dark:text-rose-400"
                      : isIzinSakit
                      ? "text-purple-600 dark:text-purple-400"
                      : sudahPulang
                      ? isTerlambat
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {isAlfa ? "Alfa" : isIzinSakit ? "–" : presensiHariIni?.jam_pulang_aktual || "--:--"}
                </span>
              </div>
              {fotoPulangUrl ? (
                <img
                  src={fotoPulangUrl}
                  alt="Selfie Pulang"
                  className={`h-7 w-7 rounded-full object-cover border shrink-0 ${
                    isTerlambat ? "border-amber-400" : "border-emerald-400"
                  }`}
                />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* ── 2. DATA PENGAJUAN IZIN & SAKIT ── */}
        <div
          className={`rounded-xl border p-2.5 sm:p-3 transition-all shrink-0 ${
            isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-200/70"
          }`}
        >
          {/* Header Kotak */}
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 dark:text-slate-200 shrink-0 pb-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
            <span>Pengajuan Izin &amp; Sakit</span>
          </div>

          {/* List Data Pengajuan Izin (Ukuran sedikit diperbesar agar proporsional dan tidak terpotong) */}
          {izinTerkini.length === 0 ? (
            <div className="py-2.5 px-2 text-center rounded-lg bg-white/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-[10px] text-slate-400">
              Belum ada permohonan izin atau sakit.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[107px] space-y-1.5 custom-scrollbar pr-0.5">
              {izinTerkini.map((iz) => {
                const badgeClass =
                  iz.status === "disetujui"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : iz.status === "ditolak"
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300";

                return (
                  <div
                    key={iz.id}
                    onClick={() => onSelectIzin && onSelectIzin(iz)}
                    className="flex items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 text-xs hover:border-[#004F9F]/40 dark:hover:border-sky-500/40 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-black text-slate-800 dark:text-slate-100 capitalize text-[10.5px] truncate">
                          {iz.jenis}
                        </span>
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border leading-none ${badgeClass}`}
                        >
                          {iz.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 truncate leading-none">
                        {formatTanggalLengkap(iz.tanggal_mulai)} s.d. {formatTanggalLengkap(iz.tanggal_selesai)}
                      </p>
                    </div>

                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. BAGIAN BAWAH: FOOTER STRIP BUTTON ── */}
      <div className="p-2 sm:px-3.5 sm:py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <button
          type="button"
          onClick={() => navigate("/peserta/presensi")}
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Lihat Riwayat &amp; Logbook</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default PesertaPresensiHariIniCard;
