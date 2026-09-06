import { useEffect, useMemo, useState } from "react";
import {
  X, CalendarRange, CalendarDays, Loader2, LogIn, LogOut, Clock,
  Building2, GraduationCap, AlarmClockOff, Info, Sparkles, CalendarX2,
  CheckCircle2, TrendingUp, CircleSlash, HeartPulse, FileText,
} from "lucide-react";
import PresensiStatusBadge from "./PresensiStatusBadge";
import { getRekapPeserta } from "../../../../services/adminService";
import { formatTanggalHari, formatTanggalLengkap, formatMenit } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

/* Inisial nama (fallback bila foto tidak ada) */
const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Avatar peserta */
const PesertaAvatarModal = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  return (
    <span className="relative shrink-0">
      {url && !error ? (
        <img
          src={url}
          alt={nama}
          onError={() => setError(true)}
          className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-2xl object-cover border border-white/20 shadow-md"
        />
      ) : (
        <span className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[10.5px] sm:text-[13px] font-black text-white border border-white/20 shadow-md">
          {getInisial(nama)}
        </span>
      )}
      <span className="absolute -inset-0.5 sm:-inset-1 rounded-lg sm:rounded-2xl border sm:border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
    </span>
  );
};

/* Judul seksi dengan garis pemisah */
const SectionTitle = ({ children, isDark }) => (
  <div className="mb-1.5 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2.5">
    <span className="h-2.5 sm:h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-slate-400" : "text-slate-400"}`}>{children}</p>
    <span className={`h-px flex-1 bg-gradient-to-r ${isDark ? "from-white/10 to-transparent" : "from-slate-200 to-transparent"}`} />
  </div>
);

/* Kartu statistik */
const StatCard = ({ icon: Icon, label, value, tone = "netral", delay = 0, isDark = false }) => {
  const tones = {
    hadir: {
      ring: isDark ? "ring-emerald-500/30" : "ring-emerald-200/70",
      bg: isDark ? "bg-emerald-500/[0.07]" : "bg-gradient-to-br from-emerald-50 to-emerald-50/30",
      chip: isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-500/10 text-emerald-600",
      text: isDark ? "text-emerald-300" : "text-emerald-700",
    },
    telat: {
      ring: isDark ? "ring-amber-500/30" : "ring-amber-200/70",
      bg: isDark ? "bg-amber-500/[0.07]" : "bg-gradient-to-br from-amber-50 to-amber-50/30",
      chip: isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-500/10 text-amber-600",
      text: isDark ? "text-amber-300" : "text-amber-700",
    },
    izin: {
      ring: isDark ? "ring-violet-500/30" : "ring-violet-200/70",
      bg: isDark ? "bg-violet-500/[0.07]" : "bg-gradient-to-br from-violet-50 to-violet-50/30",
      chip: isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-500/10 text-violet-600",
      text: isDark ? "text-violet-300" : "text-violet-700",
    },
    sakit: {
      ring: isDark ? "ring-sky-500/30" : "ring-sky-200/70",
      bg: isDark ? "bg-sky-500/[0.07]" : "bg-gradient-to-br from-sky-50 to-sky-50/30",
      chip: isDark ? "bg-sky-500/20 text-sky-300" : "bg-sky-500/10 text-sky-600",
      text: isDark ? "text-sky-300" : "text-sky-700",
    },
    alfa: {
      ring: isDark ? "ring-rose-500/30" : "ring-rose-200/70",
      bg: isDark ? "bg-rose-500/[0.07]" : "bg-gradient-to-br from-rose-50 to-rose-50/30",
      chip: isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-500/10 text-rose-600",
      text: isDark ? "text-rose-300" : "text-rose-700",
    },
    netral: {
      ring: isDark ? "ring-white/10" : "ring-slate-200",
      bg: isDark ? "bg-white/5" : "bg-slate-50/70",
      chip: isDark ? "bg-white/10 text-slate-400" : "bg-slate-200/60 text-slate-400",
      text: isDark ? "text-slate-300" : "text-slate-500",
    },
  };
  const t = tones[tone] || tones.netral;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg sm:rounded-2xl ring-1 ${t.ring} ${t.bg} px-1.5 py-1.5 sm:px-3 sm:py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out]`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {/* Baris 1: Angka (kiri) & Icon (kanan) lurus sejajar */}
      <div className="flex items-center justify-between gap-1">
        <span className={`text-xs sm:text-[17px] font-black leading-none tabular-nums ${t.text}`}>
          {value ?? 0}
        </span>
        <span className={`flex h-4.5 w-4.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-xl ${t.chip} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
        </span>
      </div>
      {/* Baris 2: Label nama status */}
      <p className="mt-1 sm:mt-1.5 text-[7px] sm:text-[9.5px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.12em] text-slate-400 truncate">
        {label}
      </p>
    </div>
  );
};

const RekapPesertaModal = ({ peserta, bulan, onClose, isDark = false }) => {
  const [riwayat, setRiwayat] = useState([]);
  const [periode, setPeriode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const res = await getRekapPeserta(peserta.peserta_id, { bulan });
        if (!aktif) return;
        setRiwayat(res.data.data?.riwayat || []);
        setPeriode(res.data.data?.periode || null);
      } catch (err) {
        if (aktif) toastError(err.response?.data?.message || "Gagal memuat riwayat presensi peserta.");
      } finally {
        if (aktif) setLoading(false);
      }
    })();
    return () => { aktif = false; };
  }, [peserta.peserta_id, bulan]);

  const persentase = Math.round(peserta.persentase_kehadiran || 0);
  const terlambatTotal = Number(peserta.total_menit_terlambat) || 0;
  const jumlahHariKerja = useMemo(() => riwayat.filter((h) => h.hari_kerja).length, [riwayat]);

  const hariIni = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const warnaBar =
    persentase >= 90 ? "from-emerald-400 to-emerald-500"
      : persentase >= 75 ? "from-[#00A5EC] to-[#004F9F]"
        : "from-amber-400 to-rose-500";

  const labelPeriode = periode?.dari && periode?.sampai
    ? `${formatTanggalLengkap(periode.dari)} — ${formatTanggalLengkap(periode.sampai)}`
    : `Periode ${bulan}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2.5 sm:p-4 animate-[backdropFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col border ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white ring-1 ring-slate-900/5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <CalendarRange
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <PesertaAvatarModal nama={peserta.nama} foto={peserta.foto_peserta || peserta.foto_profil} />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  Riwayat Kehadiran
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight truncate">{peserta.nama}</h3>
                <p className="flex items-center gap-1 text-[8.5px] sm:text-[11px] text-white/60 mt-0.5">
                  <CalendarDays className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">{labelPeriode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
              aria-label="Tutup riwayat kehadiran"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Deretan badge informasi */}
          <div className="relative mt-2 sm:mt-4 flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-[#0B1442] shadow-sm">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {persentase}%
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {peserta.institusi || "-"}
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {peserta.bidang || "-"}
            </span>
            {terlambatTotal > 0 && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-amber-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> +{formatMenit(terlambatTotal)}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-2.5 sm:p-6 space-y-2.5 sm:space-y-5 ${
          isDark ? "bg-[#11161d]" : "bg-slate-50/40"
        }`}>
          {/* Ringkasan kehadiran */}
          <div>
            <SectionTitle isDark={isDark}>Ringkasan Kehadiran</SectionTitle>

            <div
              className={`rounded-lg sm:rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3.5 ring-1 animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-slate-200/80"
              }`}
              style={{ animationDelay: "40ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Tingkat kehadiran</p>
                  <p className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5">
                    <span className={`text-base sm:text-2xl font-black leading-none tracking-tight tabular-nums ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      {persentase}%
                    </span>
                    <span className="text-[8.5px] sm:text-[10.5px] font-semibold text-slate-400">
                      dari {jumlahHariKerja || peserta.hari_kerja || 0} hari kerja
                    </span>
                  </p>
                </div>
                <span className={`hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold sm:inline-flex ${
                  persentase >= 75
                    ? isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                    : isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"
                }`}>
                  {persentase >= 75 ? <CheckCircle2 className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {persentase >= 90 ? "Sangat baik" : persentase >= 75 ? "Baik" : "Perlu perhatian"}
                </span>
              </div>

              <div className={`mt-1.5 sm:mt-3 h-1 sm:h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${warnaBar} transition-all duration-700`}
                  style={{ width: `${Math.min(100, persentase)}%` }}
                />
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2.5 grid grid-cols-5 gap-1 sm:gap-2.5">
              <StatCard icon={LogIn} label="Hadir" value={peserta.hadir} tone="hadir" delay={60} isDark={isDark} />
              <StatCard icon={Clock} label="Telat" value={peserta.terlambat} tone="telat" delay={100} isDark={isDark} />
              <StatCard icon={FileText} label="Izin" value={peserta.izin} tone="izin" delay={140} isDark={isDark} />
              <StatCard icon={HeartPulse} label="Sakit" value={peserta.sakit} tone="sakit" delay={180} isDark={isDark} />
              <StatCard icon={CircleSlash} label="Alfa" value={peserta.alfa} tone="alfa" delay={220} isDark={isDark} />
            </div>
          </div>

          {/* Riwayat harian */}
          <div>
            <SectionTitle isDark={isDark}>Riwayat Harian</SectionTitle>

            {loading ? (
              <div className={`flex items-center justify-center gap-2 rounded-xl border py-6 sm:py-14 text-[11px] sm:text-sm text-slate-400 ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-[#00A5EC]" /> Memuat riwayat...
              </div>
            ) : riwayat.length === 0 ? (
              <div className={`flex flex-col items-center justify-center rounded-xl border py-6 sm:py-12 text-center ${
                isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
              }`}>
                <span className={`mb-2 sm:mb-3 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${
                  isDark ? "bg-white/5" : "bg-slate-100"
                }`}>
                  <CalendarX2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </span>
                <p className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-300" : "text-slate-500"}`}>Belum ada riwayat pada periode ini</p>
                <p className="mt-0.5 max-w-xs text-[9px] sm:text-[11px] font-semibold leading-relaxed text-slate-400">
                  Peserta belum memiliki hari magang yang jatuh pada bulan yang dipilih.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2.5">
                {riwayat.map((h, i) => {
                  const p = h.presensi;
                  const status = h.status || (h.hari_kerja ? "belum" : "libur");
                  const isHariIni = h.tanggal?.slice(0, 10) === hariIni;
                  return (
                    <div
                      key={h.tanggal}
                      className={`group flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 rounded-lg sm:rounded-2xl border px-2.5 py-1.5 sm:px-3.5 sm:py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                        !h.hari_kerja
                          ? isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200/70 bg-slate-50/70"
                          : isHariIni
                            ? isDark ? "border-[#00A5EC]/30 bg-[#00A5EC]/10" : "border-[#004F9F]/25 bg-[#004F9F]/[0.04]"
                            : isDark ? "border-white/10 bg-[#161b22] hover:border-white/20" : "border-slate-200/80 bg-white hover:border-[#004F9F]/25"
                      }`}
                      style={{ animationDelay: `${i * 20}ms`, animationFillMode: "backwards" }}
                    >
                      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                        <span className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-xl transition-all duration-300 group-hover:scale-110 ${
                          h.hari_kerja
                            ? isDark ? "bg-[#00A5EC]/15 text-[#00A5EC]" : "bg-[#004F9F]/10 text-[#004F9F]"
                            : isDark ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                        }`}>
                          <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={`flex flex-wrap items-center gap-1 text-[10px] sm:text-[12.5px] font-bold leading-snug ${
                            isDark ? "text-slate-100" : "text-[#0B1442]"
                          }`}>
                            {formatTanggalHari(h.tanggal)}
                            {isHariIni && (
                              <span className="rounded bg-[#004F9F] px-1 py-0.5 text-[7px] sm:text-[8.5px] font-black uppercase tracking-wide text-white">
                                Hari ini
                              </span>
                            )}
                          </p>
                          {!h.hari_kerja && (
                            <p className="mt-0.5 text-[7.5px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-slate-400">
                              {h.alasan || "Bukan hari kerja"}
                            </p>
                          )}
                          {p?.keterangan && (
                            <p className="mt-0.5 max-w-xs truncate text-[8px] sm:text-[10.5px] text-slate-400">{p.keterangan}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                        {p?.jam_masuk && (
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold tabular-nums ${
                            isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            <LogIn className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {p.jam_masuk}
                          </span>
                        )}
                        {p?.jam_pulang && (
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold tabular-nums ${
                            isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600"
                          }`}>
                            <LogOut className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {p.jam_pulang}
                          </span>
                        )}
                        {p?.menit_terlambat > 0 && (
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold ${
                            isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"
                          }`}>
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> +{formatMenit(p.menit_terlambat)}
                          </span>
                        )}
                        {p?.lupa_presensi && (
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold ${
                            isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                          }`}>
                            <AlarmClockOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Lupa
                          </span>
                        )}
                        <PresensiStatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catatan periode */}
          <div className={`flex items-start gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-2xl border px-2.5 py-2 sm:px-3.5 sm:py-3 ${
            isDark
              ? "border-[#00A5EC]/20 bg-[#00A5EC]/[0.05]"
              : "border-[#004F9F]/15 bg-[#004F9F]/[0.04]"
          }`}>
            <span className={`flex h-4.5 w-4.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded ${
              isDark ? "bg-[#00A5EC]/20 text-[#00A5EC]" : "bg-[#004F9F]/10 text-[#004F9F]"
            }`}>
              <Info className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </span>
            <p className={`text-[8.5px] sm:text-[11px] font-medium leading-relaxed ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Riwayat hanya menampilkan tanggal di dalam{" "}
              <span className={`font-bold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>periode magang peserta</span>
              {periode?.mulai_magang ? (
                <> (mulai <span className={`font-bold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{formatTanggalLengkap(periode.mulai_magang)}</span>)</>
              ) : null}
              . Hari libur &amp; akhir pekan tidak dihitung sebagai hari kerja.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between gap-2 border-t px-3 py-2 sm:px-6 sm:py-4 shrink-0 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-white"
        }`}>
          <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
            Tekan
            <kbd className={`rounded-md border px-1.5 py-0.5 font-sans text-[9.5px] font-bold ${
              isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}>Esc</kbd>
            untuk menutup
          </p>
          <button
            onClick={onClose}
            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#00A5EC] px-4 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shine_0.9s_ease-out]" />
            <span className="relative">Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RekapPesertaModal;