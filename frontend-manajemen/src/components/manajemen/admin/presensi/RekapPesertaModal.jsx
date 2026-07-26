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

/* Avatar peserta — sama seperti di modal Detail Presensi */
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
          className="h-12 w-12 rounded-2xl object-cover border border-white/20 shadow-lg"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[13px] font-black text-white border border-white/20 shadow-lg">
          {getInisial(nama)}
        </span>
      )}
      <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
    </span>
  );
};

/* Judul seksi dengan garis pemisah — identik dengan modal Detail Presensi */
const SectionTitle = ({ children }) => (
  <div className="mb-2.5 flex items-center gap-2.5">
    <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{children}</p>
    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

/* Kartu statistik — mengikuti gaya JamCard */
const StatCard = ({ icon: Icon, label, value, tone = "netral", delay = 0 }) => {
  const tones = {
    hadir: { ring: "ring-emerald-200/70", bg: "bg-gradient-to-br from-emerald-50 to-emerald-50/30", chip: "bg-emerald-500/10 text-emerald-600", text: "text-emerald-700" },
    telat: { ring: "ring-amber-200/70", bg: "bg-gradient-to-br from-amber-50 to-amber-50/30", chip: "bg-amber-500/10 text-amber-600", text: "text-amber-700" },
    izin: { ring: "ring-violet-200/70", bg: "bg-gradient-to-br from-violet-50 to-violet-50/30", chip: "bg-violet-500/10 text-violet-600", text: "text-violet-700" },
    sakit: { ring: "ring-sky-200/70", bg: "bg-gradient-to-br from-sky-50 to-sky-50/30", chip: "bg-sky-500/10 text-sky-600", text: "text-sky-700" },
    alfa: { ring: "ring-rose-200/70", bg: "bg-gradient-to-br from-rose-50 to-rose-50/30", chip: "bg-rose-500/10 text-rose-600", text: "text-rose-700" },
    netral: { ring: "ring-slate-200", bg: "bg-slate-50/70", chip: "bg-slate-200/60 text-slate-400", text: "text-slate-500" },
  };
  const t = tones[tone] || tones.netral;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl ring-1 ${t.ring} ${t.bg} px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out]`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${t.chip} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <p className={`mt-2 text-[17px] font-black leading-none tabular-nums ${t.text}`}>{value ?? 0}</p>
      <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    </div>
  );
};

const RekapPesertaModal = ({ peserta, bulan, onClose }) => {
  const [riwayat, setRiwayat] = useState([]);
  const [periode, setPeriode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-[backdropFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <CalendarRange
            className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <PesertaAvatarModal nama={peserta.nama} foto={peserta.foto_peserta || peserta.foto_profil} />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  Riwayat Kehadiran
                </div>
                <h3 className="text-base font-black text-white leading-tight truncate">{peserta.nama}</h3>
                <p className="flex items-center gap-1.5 text-[11px] text-white/60 mt-0.5">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  <span className="truncate">{labelPeriode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
              aria-label="Tutup riwayat kehadiran"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Deretan badge informasi */}
          <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-[#0B1442] shadow-sm">
              <TrendingUp className="w-3 h-3" /> Kehadiran {persentase}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <GraduationCap className="w-3 h-3" /> {peserta.institusi || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <Building2 className="w-3 h-3" /> {peserta.bidang || "-"}
            </span>
            {terlambatTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-sm">
                <Clock className="w-3 h-3" /> Total telat {formatMenit(terlambatTotal)}
              </span>
            )}
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40 p-6 space-y-5">
          {/* Ringkasan kehadiran */}
          <div>
            <SectionTitle>Ringkasan Kehadiran</SectionTitle>

            <div
              className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-slate-200/80 animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "40ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Tingkat kehadiran</p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black leading-none tracking-tight text-[#0B1442] tabular-nums">{persentase}%</span>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      dari {jumlahHariKerja || peserta.hari_kerja || 0} hari kerja
                    </span>
                  </p>
                </div>
                <span className={`hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold sm:inline-flex ${
                  persentase >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {persentase >= 75 ? <CheckCircle2 className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {persentase >= 90 ? "Sangat baik" : persentase >= 75 ? "Baik" : "Perlu perhatian"}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${warnaBar} transition-all duration-700`}
                  style={{ width: `${Math.min(100, persentase)}%` }}
                />
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <StatCard icon={LogIn} label="Hadir" value={peserta.hadir} tone="hadir" delay={60} />
              <StatCard icon={Clock} label="Telat" value={peserta.terlambat} tone="telat" delay={100} />
              <StatCard icon={FileText} label="Izin" value={peserta.izin} tone="izin" delay={140} />
              <StatCard icon={HeartPulse} label="Sakit" value={peserta.sakit} tone="sakit" delay={180} />
              <StatCard icon={CircleSlash} label="Alfa" value={peserta.alfa} tone="alfa" delay={220} />
            </div>
          </div>

          {/* Riwayat harian */}
          <div>
            <SectionTitle>Riwayat Harian</SectionTitle>

            {loading ? (
              <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-14 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat...
              </div>
            ) : riwayat.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-12 text-center">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <CalendarX2 className="w-6 h-6 text-slate-300" />
                </span>
                <p className="text-sm font-black text-slate-500">Belum ada riwayat pada periode ini</p>
                <p className="mt-1 max-w-xs text-[11px] font-semibold leading-relaxed text-slate-400">
                  Peserta belum memiliki hari magang yang jatuh pada bulan yang dipilih.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {riwayat.map((h, i) => {
                  const p = h.presensi;
                  const status = h.status || (h.hari_kerja ? "belum" : "libur");
                  const isHariIni = h.tanggal?.slice(0, 10) === hariIni;
                  return (
                    <div
                      key={h.tanggal}
                      className={`group flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                        !h.hari_kerja
                          ? "border-slate-200/70 bg-slate-50/70"
                          : isHariIni
                            ? "border-[#004F9F]/25 bg-[#004F9F]/[0.04]"
                            : "border-slate-200/80 bg-white hover:border-[#004F9F]/25"
                      }`}
                      style={{ animationDelay: `${i * 25}ms`, animationFillMode: "backwards" }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                          h.hari_kerja
                            ? "bg-[#004F9F]/10 text-[#004F9F]"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          <CalendarDays className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-[#0B1442] leading-snug">
                            {formatTanggalHari(h.tanggal)}
                            {isHariIni && (
                              <span className="rounded-md bg-[#004F9F] px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-white">
                                Hari ini
                              </span>
                            )}
                          </p>
                          {!h.hari_kerja && (
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              {h.alasan || "Bukan hari kerja"}
                            </p>
                          )}
                          {p?.keterangan && (
                            <p className="mt-0.5 max-w-xs truncate text-[10.5px] text-slate-400">{p.keterangan}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {p?.jam_masuk && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-600 tabular-nums">
                            <LogIn className="w-3 h-3" /> {p.jam_masuk}
                          </span>
                        )}
                        {p?.jam_pulang && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[10.5px] font-bold text-sky-600 tabular-nums">
                            <LogOut className="w-3 h-3" /> {p.jam_pulang}
                          </span>
                        )}
                        {p?.menit_terlambat > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                            <Clock className="w-3 h-3" /> +{formatMenit(p.menit_terlambat)}
                          </span>
                        )}
                        {p?.lupa_presensi && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">
                            <AlarmClockOff className="w-3 h-3" /> Lupa
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
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#004F9F]/15 bg-[#004F9F]/[0.04] px-3.5 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#004F9F]/10 text-[#004F9F]">
              <Info className="w-3.5 h-3.5" />
            </span>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Riwayat hanya menampilkan tanggal di dalam{" "}
              <span className="font-bold text-[#0B1442]">periode magang peserta</span>
              {periode?.mulai_magang ? (
                <> (mulai <span className="font-bold text-[#0B1442]">{formatTanggalLengkap(periode.mulai_magang)}</span>)</>
              ) : null}
              . Hari libur &amp; akhir pekan tidak dihitung sebagai hari kerja.
            </p>
          </div>
        </div>

        {/* ================= Footer ================= */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 shrink-0">
          <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
            Tekan
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[9.5px] font-bold text-slate-500">Esc</kbd>
            untuk menutup
          </p>
          <button
            onClick={onClose}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
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