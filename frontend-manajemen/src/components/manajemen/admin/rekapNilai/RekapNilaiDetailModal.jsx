import { useEffect, useState } from "react";
import {
  X, Sparkles, Award, GraduationCap, Building2, UserCog,
  Briefcase, Heart, Users, FileCheck, CheckCircle2, TrendingUp,
  Clock, Download, Info, BookOpen, CheckSquare, FileText, MessageSquareQuote
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

/* Inisial nama (fallback bila foto tidak ada) */
const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Avatar peserta modal */
const PesertaAvatarModal = ({ nama, foto }) => {
  const [prevFoto, setPrevFoto] = useState(foto);
  const [error, setError] = useState(false);

  if (prevFoto !== foto) {
    setPrevFoto(foto);
    setError(false);
  }

  const url = foto ? getFileUrl(foto) : null;

  return (
    <span className="relative shrink-0">
      {url && !error ? (
        <img
          src={url}
          alt={nama || "Peserta"}
          onError={() => setError(true)}
          className="h-9 w-9 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl object-cover border border-white/20 shadow-md"
        />
      ) : (
        <span className="flex h-9 w-9 sm:h-13 sm:w-13 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[11px] sm:text-[14px] font-black text-white border border-white/20 shadow-md">
          {getInisial(nama)}
        </span>
      )}
      <span className="absolute -inset-0.5 sm:-inset-1 rounded-xl sm:rounded-2xl border sm:border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
    </span>
  );
};

/* Judul seksi dengan garis pemisah */
const SectionTitle = ({ children, isDark }) => (
  <div className="mb-1.5 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2.5">
    <span className="h-2.5 sm:h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
      {children}
    </p>
    <span className={`h-px flex-1 bg-gradient-to-r ${isDark ? "from-white/10 to-transparent" : "from-slate-200 to-transparent"}`} />
  </div>
);

/* Kartu statistik nilai 4 pilar */
const PillarStatCard = ({ icon: Icon, label, bobot, value, tone = "netral", delay = 0, isDark = false }) => {
  const tones = {
    prof: {
      ring: isDark ? "ring-blue-500/30" : "ring-blue-200/70",
      bg: isDark ? "bg-blue-500/[0.07]" : "bg-gradient-to-br from-blue-50 to-blue-50/30",
      chip: isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-500/10 text-blue-600",
      text: isDark ? "text-blue-300" : "text-blue-700",
    },
    pers: {
      ring: isDark ? "ring-emerald-500/30" : "ring-emerald-200/70",
      bg: isDark ? "bg-emerald-500/[0.07]" : "bg-gradient-to-br from-emerald-50 to-emerald-50/30",
      chip: isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-500/10 text-emerald-600",
      text: isDark ? "text-emerald-300" : "text-emerald-700",
    },
    sos: {
      ring: isDark ? "ring-amber-500/30" : "ring-amber-200/70",
      bg: isDark ? "bg-amber-500/[0.07]" : "bg-gradient-to-br from-amber-50 to-amber-50/30",
      chip: isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-500/10 text-amber-600",
      text: isDark ? "text-amber-300" : "text-amber-700",
    },
    adm: {
      ring: isDark ? "ring-purple-500/30" : "ring-purple-200/70",
      bg: isDark ? "bg-purple-500/[0.07]" : "bg-gradient-to-br from-purple-50 to-purple-50/30",
      chip: isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-500/10 text-purple-600",
      text: isDark ? "text-purple-300" : "text-purple-700",
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
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl ring-1 ${t.ring} ${t.bg} px-2.5 py-2.5 sm:px-3.5 sm:py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out]`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={`text-sm sm:text-[18px] font-black leading-none tabular-nums ${t.text}`}>
          {value != null ? Number(value).toFixed(1) : "-"}
        </span>
        <span className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-xl ${t.chip} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1">
        <p className="text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-slate-400 truncate">
          {label}
        </p>
        <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400">
          {bobot}%
        </span>
      </div>
    </div>
  );
};

export const RekapNilaiDetailModal = ({
  show,
  onClose,
  loading,
  detailData,
  isDark = false,
  onDownloadPdf,
  downloadingPdf,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (show) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [show, onClose]);

  if (!show) return null;

  const peserta = detailData?.peserta || {};
  const penilaian = detailData?.penilaian || {};
  const autoAdmin = detailData?.auto_administratif || {};
  const setting = detailData?.setting || {};

  const isFinal = penilaian.status_penilaian === "final";
  const isDraf = penilaian.status_penilaian === "draf";
  const isBelumDinilai = !isFinal && !isDraf;

  const hasScore = !isBelumDinilai && penilaian.nilai_akhir_angka != null;
  const nilaiAkhir = hasScore ? Number(penilaian.nilai_akhir_angka) : null;
  const indeks = hasScore ? (penilaian.indeks_nilai_akhir || "-") : "-";
  const predikat = hasScore ? (penilaian.predikat_akhir || (isDraf ? "Draf Mentor" : "Telah Dinilai")) : "Belum Dinilai";

  const bobotProf = setting.bobot_profesional || penilaian.bobot_profesional || 35;
  const bobotPers = setting.bobot_personal || penilaian.bobot_personal || 25;
  const bobotSos = setting.bobot_sosial || penilaian.bobot_sosial || 20;
  const bobotAdm = setting.bobot_administratif || penilaian.bobot_administratif || 20;

  const nilaiProf = hasScore || isDraf ? penilaian.nilai_profesional : null;
  const nilaiPers = hasScore || isDraf ? penilaian.nilai_personal : null;
  const nilaiSos = hasScore || isDraf ? penilaian.nilai_sosial : null;
  const skorAdmFinal = (hasScore || isDraf) && penilaian.nilai_administratif != null
    ? penilaian.nilai_administratif
    : (autoAdmin.rata_rata != null && (autoAdmin.skor_absensi > 0 || autoAdmin.skor_logbook > 0 || autoAdmin.skor_tugas > 0 || autoAdmin.skor_laporan > 0) ? autoAdmin.rata_rata : null);

  const warnaBar =
    nilaiAkhir >= 85 ? "from-emerald-400 to-emerald-500"
      : nilaiAkhir >= 70 ? "from-[#00A5EC] to-[#004F9F]"
        : "from-amber-400 to-rose-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2.5 sm:p-4 animate-[backdropFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-2xl md:max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col border ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white ring-1 ring-slate-900/5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <Award
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <PesertaAvatarModal
                nama={peserta.nama}
                foto={peserta.foto_profil || peserta.file_pas_foto || peserta.foto}
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[7.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  Pratinjau Transkrip Nilai
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight truncate">
                  {peserta.nama || "Memuat Peserta..."}
                </h3>
                <p className="flex items-center gap-1 text-[8.5px] sm:text-[11px] text-white/60 mt-0.5 truncate">
                  <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">{peserta.institusi || "-"}</span>
                  {peserta.jurusan && <span className="opacity-75">• {peserta.jurusan}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
              aria-label="Tutup pratinjau transkrip"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Deretan badge informasi */}
          <div className="relative mt-2 sm:mt-4 flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-black text-[#0B1442] shadow-sm">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {nilaiAkhir != null ? `${nilaiAkhir.toFixed(2)} (${indeks})` : "Belum Dinilai"}
            </span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/10 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {peserta.bidang || "Bidang Magang"}
            </span>
            {isFinal ? (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-emerald-200 ring-1 ring-emerald-300/30 backdrop-blur-sm">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Diterbitkan
              </span>
            ) : isDraf ? (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-amber-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Draf Mentor
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-slate-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10.5px] font-bold text-slate-200 ring-1 ring-white/10 backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Belum Dinilai
              </span>
            )}
          </div>
        </div>

        {/* Body Modal */}
        <div className={`flex-1 overflow-y-auto p-2.5 sm:p-6 space-y-3 sm:space-y-5 ${
          isDark ? "bg-[#11161d]" : "bg-slate-50/40"
        }`}>
          {loading ? (
            <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border py-12 sm:py-16 text-[11px] sm:text-sm text-slate-400 ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              <div className="h-6 w-6 rounded-full border-2 border-[#00A5EC] border-t-transparent animate-spin" />
              <span>Memuat rincian transkrip nilai resmi...</span>
            </div>
          ) : !detailData ? (
            <div className={`flex flex-col items-center justify-center rounded-2xl border py-8 text-center ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Gagal memuat rincian transkrip nilai.</p>
            </div>
          ) : (
            <>
              {/* 1. Ringkasan Nilai Akhir & Akumulasi */}
              <div>
                <SectionTitle isDark={isDark}>Akumulasi Nilai Akhir</SectionTitle>

                <div
                  className={`rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-4 ring-1 animate-[fadeslide_0.3s_ease-out] ${
                    isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-slate-200/80"
                  }`}
                >
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Skor Akhir &amp; Indeks Mutu
                      </p>
                      <p className="mt-0.5 flex items-baseline gap-1.5 sm:gap-2">
                        <span className={`text-xl sm:text-3xl font-black leading-none tracking-tight tabular-nums ${
                          isDark ? "text-slate-100" : "text-[#0B1442]"
                        }`}>
                          {nilaiAkhir != null ? nilaiAkhir.toFixed(2) : "-"}
                        </span>
                        <span className="inline-flex items-center justify-center font-black px-2 py-0.5 rounded-md text-[11px] sm:text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
                          {indeks}
                        </span>
                        <span className="text-[9.5px] sm:text-xs font-bold text-slate-400">
                          ({predikat})
                        </span>
                      </p>
                    </div>
                    <span className={`hidden shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold sm:inline-flex ${
                      hasScore
                        ? nilaiAkhir >= 85
                          ? isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                          : nilaiAkhir >= 70
                            ? isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600"
                            : isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"
                        : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      {hasScore && nilaiAkhir >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                      {predikat}
                    </span>
                  </div>

                  <div className={`mt-2 sm:mt-3 h-1.5 sm:h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${warnaBar} transition-all duration-700`}
                      style={{ width: `${Math.min(100, nilaiAkhir || 0)}%` }}
                    />
                  </div>
                </div>

                {/* 4 Pilar Card Grid */}
                <div className="mt-2 sm:mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
                  <PillarStatCard
                    icon={Briefcase}
                    label="1. Profesional"
                    bobot={bobotProf}
                    value={nilaiProf}
                    tone="prof"
                    delay={60}
                    isDark={isDark}
                  />
                  <PillarStatCard
                    icon={Heart}
                    label="2. Personal"
                    bobot={bobotPers}
                    value={nilaiPers}
                    tone="pers"
                    delay={100}
                    isDark={isDark}
                  />
                  <PillarStatCard
                    icon={Users}
                    label="3. Sosial"
                    bobot={bobotSos}
                    value={nilaiSos}
                    tone="sos"
                    delay={140}
                    isDark={isDark}
                  />
                  <PillarStatCard
                    icon={FileCheck}
                    label="4. Administratif"
                    bobot={bobotAdm}
                    value={skorAdmFinal}
                    tone="adm"
                    delay={180}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* 2. Rincian Otomatis Administratif */}
              <div>
                <SectionTitle isDark={isDark}>Rincian Skor Administratif Otomatis</SectionTitle>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
                  {/* Presensi */}
                  <div className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider">Kehadiran</span>
                      <Clock className="w-3 h-3 text-sky-500" />
                    </div>
                    <div className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      {autoAdmin.skor_absensi != null ? Number(autoAdmin.skor_absensi).toFixed(1) : "0.0"}
                    </div>
                    <p className="text-[7.5px] sm:text-[9.5px] text-slate-400 mt-0.5">Presensi harian</p>
                  </div>

                  {/* Logbook */}
                  <div className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider">Logbook</span>
                      <BookOpen className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      {autoAdmin.skor_logbook != null ? Number(autoAdmin.skor_logbook).toFixed(1) : "0.0"}
                    </div>
                    <p className="text-[7.5px] sm:text-[9.5px] text-slate-400 mt-0.5">Jurnal harian disetujui</p>
                  </div>

                  {/* Tugas */}
                  <div className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider">Tugas</span>
                      <CheckSquare className="w-3 h-3 text-amber-500" />
                    </div>
                    <div className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      {autoAdmin.skor_tugas != null ? Number(autoAdmin.skor_tugas).toFixed(1) : "0.0"}
                    </div>
                    <p className="text-[7.5px] sm:text-[9.5px] text-slate-400 mt-0.5">Penugasan mentor</p>
                  </div>

                  {/* Laporan Akhir */}
                  <div className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider">Laporan</span>
                      <FileText className="w-3 h-3 text-purple-500" />
                    </div>
                    <div className={`text-sm sm:text-base font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      {autoAdmin.skor_laporan != null ? Number(autoAdmin.skor_laporan).toFixed(1) : "0.0"}
                    </div>
                    <p className="text-[7.5px] sm:text-[9.5px] text-slate-400 mt-0.5">
                      {penilaian.laporan_akhir_disetujui ? "Disetujui Mentor" : "Belum Disetujui"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Catatan Evaluasi Mentor */}
              <div>
                <SectionTitle isDark={isDark}>Catatan Evaluasi Mentor</SectionTitle>
                <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                      isDark ? "bg-[#00A5EC]/15 text-[#00A5EC]" : "bg-[#004F9F]/10 text-[#004F9F]"
                    }`}>
                      <MessageSquareQuote className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0B1442] dark:text-slate-100">
                        <UserCog className="w-3.5 h-3.5 text-[#00A5EC]" />
                        <span>Catatan Mentor Pembimbing:</span>
                      </div>
                      {penilaian.catatan_mentor ? (
                        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed italic text-slate-600 dark:text-slate-300">
                          "{penilaian.catatan_mentor}"
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] sm:text-xs italic text-slate-400">
                          Belum ada catatan evaluasi khusus dari mentor pembimbing.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Banner Catatan Informasi */}
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
                <p className={`text-[8.5px] sm:text-[11px] font-medium leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-500"
                }`}>
                  Transkrip ini memuat hasil evaluasi kinerja magang resmi 4 pilar kompetensi. Dokumen PDF yang diunduh mencakup verifikasi barcode digital dan tanda tangan instansi resmi Diskominfo.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal */}
        <div className={`flex items-center justify-between gap-2 border-t px-3 py-2 sm:px-6 sm:py-4 shrink-0 ${
          isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-white"
        }`}>
          <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
            Tekan
            <kbd className={`rounded-md border px-1.5 py-0.5 font-sans text-[9.5px] font-bold ${
              isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}>
              Esc
            </kbd>
            untuk menutup
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border text-[10.5px] sm:text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={downloadingPdf || !hasScore}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#00A5EC] px-4 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shine_0.9s_ease-out]" />
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative shrink-0" />
              <span className="relative">
                {downloadingPdf ? "Menyiapkan PDF..." : "Unduh Transkrip Nilai (PDF)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RekapNilaiDetailModal;
