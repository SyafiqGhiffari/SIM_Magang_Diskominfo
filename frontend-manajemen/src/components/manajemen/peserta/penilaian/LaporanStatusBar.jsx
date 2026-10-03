import {
  CheckCircle2,
  Clock,
  UploadCloud,
  AlertCircle,
  Building2,
  UserCheck,
  Calendar,
  MessageSquareQuote,
} from "lucide-react";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

export const LaporanStatusBar = ({
  pendaftaran = {},
  laporanStatus = {},
  timeline = {},
  mentor = {},
}) => {
  const { isDark } = useManajemenTheme();

  const rawStatus = (laporanStatus.status || laporanStatus.status_laporan || "").toLowerCase();
  const fileAda = Boolean(pendaftaran.file_laporan_akhir || laporanStatus.file_laporan_akhir);
  const isDisetujui = Boolean(laporanStatus.disetujui || rawStatus === "disetujui");
  const isPerluRevisi = !isDisetujui && fileAda && (rawStatus === "perlu_revisi" || rawStatus === "revisi");
  const isMenunggu = !isDisetujui && !isPerluRevisi && fileAda;
  const catatanMentor =
    laporanStatus.catatan_mentor ||
    laporanStatus.catatan_mentor_laporan ||
    pendaftaran.catatan_mentor_laporan ||
    pendaftaran.catatan_mentor ||
    "";

  const sisaHari =
    typeof timeline?.sisa_hari === "number"
      ? timeline.sisa_hari
      : typeof laporanStatus?.sisa_hari === "number"
      ? laporanStatus.sisa_hari
      : null;

  const institusi = pendaftaran.institusi || pendaftaran.asal_kampus || pendaftaran.asal_sekolah || "-";
  const bidang = pendaftaran.posisi_bidang || "-";
  const namaMentor = mentor?.nama || "Mentor Pembimbing Lapangan";

  const cardsInfo = [
    {
      id: "instansi",
      icon: Building2,
      label: "Instansi / Kampus Asal",
      value: institusi,
      caption: pendaftaran.jurusan_prodi
        ? `${pendaftaran.jurusan_prodi} · ${bidang}`
        : `Bidang ${bidang}`,
      captionTooltip: `${pendaftaran.jurusan_prodi || "-"} · Bidang: ${bidang}`,
      lightGradient: "from-blue-300 to-white",
      gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-[#004F9F]",
    },
    {
      id: "mentor",
      icon: UserCheck,
      label: "Pembimbing Lapangan",
      value: namaMentor,
      caption: mentor?.jabatan || (mentor?.nip ? `NIP. ${mentor.nip}` : "Pembimbing Diskominfo"),
      captionTooltip: mentor?.nip ? `${mentor?.jabatan || "Pembimbing Lapangan"} (NIP. ${mentor.nip})` : mentor?.jabatan || "Pembimbing Lapangan",
      lightGradient: "from-emerald-300 to-white",
      gradient: "from-emerald-500 to-emerald-700",
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    },
    {
      id: "masa_magang",
      icon: Calendar,
      label: "Masa Magang",
      value: pendaftaran.tanggal_selesai
        ? `Hingga ${formatTanggalPresensi(pendaftaran.tanggal_selesai)}`
        : "Jadwal Magang Dinas",
      caption: isDisetujui
        ? "Prasyarat kelulusan magang terpenuhi"
        : sisaHari !== null && sisaHari <= 0
        ? "Periode magang telah berakhir"
        : sisaHari !== null && sisaHari <= 7
        ? "Harap segera serahkan laporan"
        : "Unggah sebelum tanggal selesai",
      badge:
        isDisetujui
          ? "Telah ACC"
          : sisaHari !== null
          ? sisaHari <= 0
            ? "Selesai"
            : `${sisaHari} Hari Lagi`
          : null,
      badgeClass: isDisetujui
        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
        : sisaHari !== null && sisaHari <= 0
        ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
        : sisaHari !== null && sisaHari <= 3
        ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse"
        : sisaHari !== null && sisaHari <= 7
        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
        : "bg-blue-100 dark:bg-blue-950 text-[#004F9F] dark:text-sky-300",
      lightGradient:
        sisaHari !== null && sisaHari <= 0
          ? "from-rose-300 to-white"
          : sisaHari !== null && sisaHari <= 3 && !isDisetujui
          ? "from-rose-300 to-white"
          : sisaHari !== null && sisaHari <= 7 && !isDisetujui
          ? "from-amber-300 to-white"
          : "from-amber-200 to-white",
      gradient:
        sisaHari !== null && sisaHari <= 0
          ? "from-rose-500 to-rose-700"
          : sisaHari !== null && sisaHari <= 3 && !isDisetujui
          ? "from-rose-500 to-rose-700"
          : sisaHari !== null && sisaHari <= 7 && !isDisetujui
          ? "from-amber-500 to-amber-700"
          : "from-amber-500 to-orange-600",
      iconBg:
        sisaHari !== null && sisaHari <= 0
          ? (isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600")
          : sisaHari !== null && sisaHari <= 3 && !isDisetujui
          ? (isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600")
          : sisaHari !== null && sisaHari <= 7 && !isDisetujui
          ? (isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600")
          : isDark
          ? "bg-amber-950/60 text-amber-400"
          : "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── 1. BANNER UTAMA STATUS LAPORAN ── */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-xs transition-all duration-300 ${
          isDisetujui
            ? "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100"
            : isPerluRevisi
            ? "bg-rose-50/80 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/40 text-rose-950 dark:text-rose-100"
            : isMenunggu
            ? "bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-100"
            : "bg-gradient-to-r from-blue-50/90 to-sky-50/80 dark:from-blue-950/30 dark:to-sky-950/20 border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon Bulat Kiri */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
              isDisetujui
                ? "bg-emerald-600 text-white shadow-sm"
                : isPerluRevisi
                ? "bg-rose-600 text-white shadow-sm animate-pulse"
                : isMenunggu
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md"
            }`}
          >
            {isDisetujui ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : isPerluRevisi ? (
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            ) : isMenunggu ? (
              <Clock className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <UploadCloud className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>

          {/* Konten Status */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black tracking-tight">
                {isDisetujui
                  ? "Laporan Akhir Disetujui Mentor (ACC)"
                  : isPerluRevisi
                  ? "Revisi Laporan Diperlukan"
                  : isMenunggu
                  ? "Naskah Sedang Ditinjau Pembimbing Lapangan"
                  : "Laporan Akhir Magang Belum Diunggah"}
              </h3>

              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isDisetujui
                    ? "bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                    : isPerluRevisi
                    ? "bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200"
                    : isMenunggu
                    ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                    : "bg-blue-200/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
                }`}
              >
                {isDisetujui
                  ? "Disetujui"
                  : isPerluRevisi
                  ? "Perlu Revisi"
                  : isMenunggu
                  ? "Menunggu Review"
                  : "Belum Unggah"}
              </span>
            </div>

            <p className="mt-1 text-xs opacity-90 leading-relaxed max-w-2xl">
              {isDisetujui
                ? "Selamat! Naskah laporan akhir Anda telah diperiksa dan disetujui resmi oleh mentor pembimbing. Nilai kompetensi administratif tervalidasi penuh untuk penerbitan transkrip nilai dan sertifikat magang."
                : isPerluRevisi
                ? "Mentor pembimbing telah membaca naskah laporan Anda dan memberikan catatan perbaikan. Silakan pelajari masukan revisi di bawah ini, perbaiki dokumen sesuai ketentuan kampus Anda, lalu unggah naskah yang diperbarui."
                : isMenunggu
                ? catatanMentor
                  ? "Naskah revisi laporan akhir Anda telah berhasil terkirim. Pembimbing lapangan sedang meninjau kembali berkas perbaikan naskah yang Anda serahkan."
                  : "Naskah laporan akhir Anda telah berhasil terkirim. Pembimbing lapangan Diskominfo sedang memverifikasi kesesuaian uraian kegiatan dan lembar pengesahan Anda."
                : "Format naskah laporan mengikuti pedoman resmi kampus/sekolah Anda. Susun dokumen PDF lengkap dengan lembar pengesahan mentor dan unggah sebelum periode magang berakhir."}
            </p>
          </div>
        </div>

        {/* Kotak Catatan Revisi Mentor (Saat status aktif adalah Perlu Revisi) */}
        {isPerluRevisi && catatanMentor && (
          <div className="mt-4 pt-4 border-t border-rose-200/60 dark:border-rose-800/40">
            <div className="rounded-2xl bg-white/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-4 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                <MessageSquareQuote className="w-4 h-4 shrink-0" />
                <span>Catatan Evaluasi dari Mentor ({namaMentor}):</span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed whitespace-pre-wrap pl-6 italic">
                "{catatanMentor}"
              </p>
            </div>
          </div>
        )}

        {/* Kotak Riwayat Catatan Revisi Mentor (Saat naskah revisi sedang menunggu peninjauan mentor) */}
        {isMenunggu && catatanMentor && (
          <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-800/40">
            <div className="rounded-2xl bg-white/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-4 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <MessageSquareQuote className="w-4 h-4 shrink-0" />
                  <span>Riwayat Arahan Revisi Mentor ({namaMentor}):</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-amber-100 text-amber-800 border border-amber-300/80 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700/60">
                  <Clock className="w-3 h-3" />
                  Revisi Telah Dikirim &amp; Menunggu Review
                </span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed whitespace-pre-wrap pl-6 italic">
                "{catatanMentor}"
              </p>
            </div>
          </div>
        )}

        {/* Kotak Catatan Apresiasi / Evaluasi Mentor (Saat status aktif adalah Disetujui) */}
        {isDisetujui && catatanMentor && (
          <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40">
            <div className="rounded-2xl bg-white/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-4 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <MessageSquareQuote className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Catatan Evaluasi / Masukan dari Pembimbing Lapangan ({namaMentor}):</span>
              </div>
              <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed whitespace-pre-wrap pl-6 italic">
                "{catatanMentor}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. KARTU IDENTITAS BIMBINGAN & COUNTDOWN TENGGAT WAKTU (Style TugasStatCards Asli) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cardsInfo.map((c) => (
          <div
            key={c.id}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4.5 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
              isDark
                ? "border-white/10 bg-[#161b22]"
                : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
            }`}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -right-8 -top-8 sm:-right-12 sm:-top-12 h-24 w-24 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                isDark
                  ? "opacity-[0.16] group-hover:opacity-[0.26]"
                  : "opacity-[0.3] group-hover:opacity-[0.4]"
              }`}
            />

            <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p
                    className={`text-[9.5px] sm:text-xs font-bold tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {c.label}
                  </p>
                  {c.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${c.badgeClass}`}
                    >
                      {c.badge}
                    </span>
                  )}
                </div>
                <h3
                  className={`mt-0.5 sm:mt-1.5 text-base sm:text-lg font-black tracking-tight truncate ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                  title={typeof c.value === "string" ? c.value : undefined}
                >
                  {c.value}
                </h3>
                <p
                  className={`mt-1 text-[9px] sm:text-[10px] font-medium leading-snug truncate ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                  title={typeof c.captionTooltip === "string" ? c.captionTooltip : typeof c.caption === "string" ? c.caption : undefined}
                >
                  {c.caption}
                </p>
              </div>
              <span
                className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-2xs ${c.iconBg}`}
              >
                <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </span>
            </div>

            {/* Bottom active/hover accent bar */}
            <div
              className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaporanStatusBar;
