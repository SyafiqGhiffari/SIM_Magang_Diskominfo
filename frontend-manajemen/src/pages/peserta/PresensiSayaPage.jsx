import { useCallback, useEffect, useMemo, useState } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import PresensiStatusBadge from "../../components/manajemen/admin/presensi/PresensiStatusBadge";
import AbsenKameraModal from "../../components/manajemen/peserta/presensi/AbsenKameraModal";
import { getStatusPresensiHariIni, getRiwayatPresensiSaya } from "../../services/pesertaService";
import { toastError } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { formatTanggalPresensi, formatMenit, BULAN_ID } from "../../constants/presensiStatus";
import {
  Fingerprint, LogIn, LogOut, Clock, CheckCircle2, UserX, CalendarDays,
  ChevronLeft, ChevronRight, Inbox, Loader2, AlarmClockOff, CalendarOff, Percent,
} from "lucide-react";

const bulanSekarang = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const geserBulan = (bulan, delta) => {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const labelBulan = (bulan) => {
  const [y, m] = bulan.split("-").map(Number);
  return `${BULAN_ID[m - 1]} ${y}`;
};

const PresensiSayaPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai(); // alumni: hanya boleh melihat riwayat

  const [status, setStatus] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [periode, setPeriode] = useState(null);
  const [bulan, setBulan] = useState(bulanSekarang);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [absen, setAbsen] = useState(null); // "masuk" | "pulang"
  const [reloadKey, setReloadKey] = useState(0);

  const fetchSemua = useCallback(async () => {
    setRefreshing(true);
    try {
      const [resStatus, resRiwayat] = await Promise.all([
        getStatusPresensiHariIni(),
        getRiwayatPresensiSaya({ bulan }),
      ]);
      setStatus(resStatus.data.data || null);

      const payload = resRiwayat.data.data || {};
      setRiwayat(payload.data || []);
      setRingkasan(payload.ringkasan || null);
      setPeriode(payload.periode || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data presensi Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bulan]);

  useEffect(() => {
    const id = setTimeout(() => { fetchSemua(); }, 0);
    return () => clearTimeout(id);
  }, [fetchSemua, reloadKey]);

  const statCards = useMemo(() => {
    const r = ringkasan || {};
    return [
      {
        icon: CheckCircle2, label: "Hadir", value: r.hadir ?? 0, caption: "Presensi tepat waktu",
        lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700",
        iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      },
      {
        icon: Clock, label: "Terlambat", value: r.terlambat ?? 0, caption: `Akumulasi ${formatMenit(r.total_menit_terlambat || 0)}`,
        lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700",
        iconBg: "bg-amber-50", iconColor: "text-amber-600",
      },
      {
        icon: UserX, label: "Alfa", value: r.alfa ?? 0, caption: `Izin ${r.izin ?? 0} · Sakit ${r.sakit ?? 0}`,
        lightGradient: "from-rose-300 to-white", gradient: "from-rose-500 to-rose-700",
        iconBg: "bg-rose-50", iconColor: "text-rose-600",
      },
      {
        icon: Percent, label: "Kehadiran", value: `${Math.round(r.persentase_kehadiran ?? 0)}%`,
        caption: `${periode?.hari_kerja_efektif ?? 0} hari kerja efektif`,
        lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]",
        iconBg: "bg-blue-50", iconColor: "text-[#004F9F]",
      },
    ];
  }, [ringkasan, periode]);

  const hariKerja = status?.hari_kerja;
  const sudahMasuk = status?.sudah_masuk;
  const sudahPulang = status?.sudah_pulang;
  const presensiHariIni = status?.presensi;
  const izinHariIni = status?.izin_hari_ini;

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Presensi Saya</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {readOnly
              ? "Masa magang Anda sudah berakhir. Halaman ini kini hanya menampilkan riwayat kehadiran Anda selama menjalani magang."
              : "Lakukan absen masuk dan pulang setiap hari kerja. Jika terlewat, Anda masih bisa absen sampai hari berganti namun akan tercatat terlambat."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-24 text-sm text-slate-400">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat presensi Anda...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* Kartu absen hari ini */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-5 sm:p-7 shadow-md">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-[#FF2D78]/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-md">
                    <CalendarDays className="w-3 h-3" /> {formatTanggalPresensi(status?.tanggal)}
                  </p>
                  <h3 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight text-white">{status?.jam_sekarang} <span className="text-sm font-bold text-white/50">WIB</span></h3>

                  {hariKerja ? (
                    <p className="mt-1.5 text-[11.5px] font-semibold text-white/60">
                      Jam kerja hari ini {status?.jam_kerja?.jam_masuk} – {status?.jam_kerja?.jam_pulang} · toleransi {status?.jam_kerja?.toleransi_terlambat} menit
                    </p>
                  ) : (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-200">
                      <CalendarOff className="w-3.5 h-3.5" /> Bukan hari kerja ({status?.alasan})
                    </p>
                  )}

                  {presensiHariIni && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/15">
                        <LogIn className="w-3 h-3" /> {presensiHariIni.jam_masuk || "--:--"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/15">
                        <LogOut className="w-3 h-3" /> {presensiHariIni.jam_pulang || "--:--"}
                      </span>
                      {presensiHariIni.menit_terlambat > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-100 ring-1 ring-amber-300/30">
                          <Clock className="w-3 h-3" /> Terlambat {formatMenit(presensiHariIni.menit_terlambat)}
                        </span>
                      )}
                      {presensiHariIni.lupa_presensi && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-100 ring-1 ring-amber-300/30">
                          <AlarmClockOff className="w-3 h-3" /> Lupa presensi
                        </span>
                      )}
                    </div>
                  )}

                  {izinHariIni && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-400/15 px-3 py-1.5 text-[11px] font-bold text-violet-100 ring-1 ring-violet-300/25 capitalize">
                      Hari ini tercatat {izinHariIni.jenis} berdasarkan pengajuan yang disetujui mentor
                    </p>
                  )}
                </div>

                {readOnly ? (
                  <div className="flex shrink-0 items-center">
                    <p className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[11px] font-bold text-white/80 backdrop-blur-md">
                      <CalendarOff className="w-3.5 h-3.5" />
                      Absen ditutup — masa magang telah berakhir
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row shrink-0">
                    <button
                      onClick={() => setAbsen("masuk")}
                      disabled={!hariKerja || sudahMasuk || !!izinHariIni || refreshing}
                      className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-black text-[#0B1442] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      {sudahMasuk ? "Sudah Absen Masuk" : "Absen Masuk"}
                    </button>
                    <button
                      onClick={() => setAbsen("pulang")}
                      disabled={!sudahMasuk || sudahPulang || refreshing}
                      className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-xs font-black text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      {sudahPulang ? "Sudah Absen Pulang" : "Absen Pulang"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat bulanan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((c, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-sm font-bold tracking-wide text-slate-500 truncate">{c.label}</p>
                      <h3 className="mt-1 sm:mt-1.5 text-2xl sm:text-4xl font-black tracking-tight text-[#0B1442]">{c.value}</h3>
                      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-400 leading-snug">{c.caption}</p>
                    </div>
                    <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg} ${c.iconColor}`}>
                      <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {/* Riwayat */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-5 pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <Fingerprint className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Riwayat Presensi</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{riwayat.length} catatan pada {labelBulan(bulan)}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm shrink-0">
                  <button
                    onClick={() => setBulan(geserBulan(bulan, -1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-white hover:text-[#004F9F] hover:shadow-sm active:scale-90 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-[11.5px] font-black text-[#0B1442] whitespace-nowrap">{labelBulan(bulan)}</span>
                  <button
                    onClick={() => setBulan(geserBulan(bulan, 1))}
                    disabled={bulan >= bulanSekarang()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-white hover:text-[#004F9F] hover:shadow-sm active:scale-90 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {refreshing && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1.5" />}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {["Tanggal", "Jam Masuk / Pulang", "Status", "Keterangan"].map((h) => (
                        <th key={h} className="px-6 py-3.5 text-[10.5px] font-black uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada catatan presensi pada bulan ini</p>
                            <p className="text-xs text-slate-400 max-w-sm">Presensi Anda akan muncul di sini setelah melakukan absen masuk.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      riwayat.map((r, i) => (
                        <tr
                          key={r.id}
                          className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 animate-[fadeslide_0.3s_ease-out]"
                          style={{ animationDelay: `${i * 35}ms`, animationFillMode: "backwards" }}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 shadow-sm whitespace-nowrap transition-all duration-200 group-hover:bg-white group-hover:shadow-md">
                              {formatTanggalPresensi(r.tanggal)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-600">
                                <LogIn className="w-2.5 h-2.5" /> {r.jam_masuk || "--:--"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-bold text-sky-600">
                                <LogOut className="w-2.5 h-2.5" /> {r.jam_pulang || "--:--"}
                              </span>
                              {r.menit_terlambat > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                  <Clock className="w-2.5 h-2.5" /> +{formatMenit(r.menit_terlambat)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4"><PresensiStatusBadge status={r.status} /></td>
                          <td className="px-6 py-4">
                            <p className="max-w-xs truncate text-[11.5px] font-medium text-slate-500">{r.keterangan || "-"}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {absen && (
        <AbsenKameraModal
          jenis={absen}
          jamSekarang={status?.jam_sekarang || ""}
          onClose={() => setAbsen(null)}
          onSelesai={() => setReloadKey((k) => k + 1)}
        />
      )}
    </PesertaLayout>
  );
};

export default PresensiSayaPage;