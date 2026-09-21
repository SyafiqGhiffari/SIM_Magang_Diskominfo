import { useEffect, useState } from "react";
import {
  X,
  LogIn,
  LogOut,
  Building2,
  GraduationCap,
  CalendarDays,
  UserCog,
  AlarmClockOff,
  Lock,
  Image as ImageIcon,
  Info,
  Timer,
  Clock,
  Maximize2,
  Sparkles,
  ClipboardList,
  MapPin,
  FileText,
  BookOpen,
  ExternalLink,
  Navigation,
} from "lucide-react";
import PresensiStatusBadge from "./PresensiStatusBadge";
import FotoPresensiPreviewModal from "../../shared/FotoPresensiPreviewModal";
import {
  formatTanggalHari,
  formatMenit,
} from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { getPresensi, getDetailAkunPeserta } from "../../../../services/adminService";

/* Inisial nama (fallback bila foto tidak ada) */
const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Hitung Durasi Kerja Aktual dari Jam Masuk & Jam Pulang */
const hitungDurasiKerja = (jamMasuk, jamPulang) => {
  if (!jamMasuk || !jamPulang) return null;
  const [h1, m1] = jamMasuk.split(":").map(Number);
  const [h2, m2] = jamPulang.split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
  let totalMenit = h2 * 60 + m2 - (h1 * 60 + m1);
  if (totalMenit < 0) totalMenit += 24 * 60;
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (jam === 0) return `${menit} Menit`;
  if (menit === 0) return `${jam} Jam`;
  return `${jam} Jam ${menit} Menit`;
};

/* Avatar peserta — header modal */
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
          className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl object-cover border border-white/20 shadow-lg bg-white/10"
        />
      ) : (
        <span className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-xs sm:text-[14px] font-black text-white border border-white/20 shadow-lg">
          {getInisial(nama)}
        </span>
      )}
      <span className="absolute -inset-0.5 sm:-inset-1 rounded-xl sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
    </span>
  );
};

/* Baris informasi pendukung dengan 4 warna tema berbeda */
const InfoItem = ({ icon: Icon, label, value, colorScheme = "blue", delay = 0, isDark = false }) => {
  const schemes = {
    blue: {
      card: isDark
        ? "border-sky-500/20 bg-sky-950/20 hover:border-sky-500/40"
        : "border-sky-200/80 bg-sky-50/60 hover:border-sky-400/60 shadow-xs",
      icon: isDark
        ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30"
        : "bg-sky-100 text-[#004F9F] ring-1 ring-sky-200",
      label: isDark ? "text-sky-300/80" : "text-[#004F9F]/80",
      value: isDark ? "text-white" : "text-slate-900",
    },
    purple: {
      card: isDark
        ? "border-violet-500/20 bg-violet-950/20 hover:border-violet-500/40"
        : "border-violet-200/80 bg-violet-50/60 hover:border-violet-400/60 shadow-xs",
      icon: isDark
        ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30"
        : "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
      label: isDark ? "text-violet-300/80" : "text-violet-700/80",
      value: isDark ? "text-white" : "text-slate-900",
    },
    emerald: {
      card: isDark
        ? "border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-500/40"
        : "border-emerald-200/80 bg-emerald-50/60 hover:border-emerald-400/60 shadow-xs",
      icon: isDark
        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
        : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      label: isDark ? "text-emerald-300/80" : "text-emerald-700/80",
      value: isDark ? "text-white" : "text-slate-900",
    },
    amber: {
      card: isDark
        ? "border-amber-500/20 bg-amber-950/20 hover:border-amber-500/40"
        : "border-amber-200/80 bg-amber-50/60 hover:border-amber-400/60 shadow-xs",
      icon: isDark
        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30"
        : "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      label: isDark ? "text-amber-300/80" : "text-amber-700/80",
      value: isDark ? "text-white" : "text-slate-900",
    },
  };

  const theme = schemes[colorScheme] || schemes.blue;

  return (
    <div
      className={`group flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-3.5 sm:py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out] ${theme.card}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <span
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-110 ${theme.icon}`}
      >
        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[8px] sm:text-[9.5px] font-bold uppercase tracking-[0.12em] ${theme.label}`}>
          {label}
        </p>
        <p className={`mt-0.5 text-[11px] sm:text-[12.5px] font-bold break-words leading-snug ${theme.value}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
};

/* Judul seksi dengan garis pemisah */
const SectionTitle = ({ children, isDark = false }) => (
  <div className="mb-2 sm:mb-2.5 flex items-center gap-2 sm:gap-2.5">
    <span className="h-3 sm:h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </p>
    <span
      className={`h-px flex-1 ${
        isDark ? "bg-white/10" : "bg-gradient-to-r from-slate-200 to-transparent"
      }`}
    />
  </div>
);

const PresensiDetailModal = ({ data, item, onClose, isDark = false, dk }) => {
  const darkMode = isDark || dk;
  const [previewFotoJenis, setPreviewFotoJenis] = useState(null);
  const [extraData, setExtraData] = useState(null);
  const [pesertaAccountData, setPesertaAccountData] = useState(null);

  const rawActiveData = data || item;

  useEffect(() => {
    let isMounted = true;
    if (rawActiveData?.id) {
      getPresensi(rawActiveData.id)
        .then((res) => {
          if (isMounted && res.data?.data) {
            setExtraData(res.data.data);
          }
        })
        .catch(() => {});
    }
    const pid = rawActiveData?.peserta_id || rawActiveData?.peserta?.id;
    if (pid) {
      getDetailAkunPeserta(pid)
        .then((res) => {
          if (isMounted && res.data?.data) {
            setPesertaAccountData(res.data.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [rawActiveData?.id, rawActiveData?.peserta_id, rawActiveData?.peserta?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewFotoJenis) {
          setPreviewFotoJenis(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, previewFotoJenis]);

  if (!rawActiveData) return null;

  const activeData = {
    ...rawActiveData,
    ...(extraData || {}),
  };

  const pendaftaranAccount = pesertaAccountData?.pendaftaran || {};

  const namaPeserta =
    activeData.nama ||
    activeData.peserta?.nama ||
    pesertaAccountData?.nama ||
    pendaftaranAccount.nama_lengkap ||
    "Peserta Magang";

  // Foto peserta di header: utamakan foto pas foto pendaftaran atau foto profil
  const fotoPeserta =
    activeData.foto_peserta ||
    activeData.foto_profil ||
    pendaftaranAccount.file_pas_foto ||
    pesertaAccountData?.foto_profil ||
    activeData.pendaftaran?.file_pas_foto ||
    activeData.peserta?.foto_profil ||
    null;

  // Data Bidang, Institusi, Jurusan/Prodi, Mentor yang sebenarnya
  const bidangPeserta =
    activeData.bidang ||
    activeData.posisi_bidang ||
    pendaftaranAccount.posisi_bidang ||
    activeData.pendaftaran?.posisi_bidang ||
    "-";

  const institusiPeserta =
    activeData.institusi ||
    activeData.asal_kampus ||
    activeData.asal_sekolah ||
    pendaftaranAccount.asal_kampus ||
    pendaftaranAccount.asal_sekolah ||
    activeData.pendaftaran?.asal_kampus ||
    activeData.pendaftaran?.asal_sekolah ||
    "-";

  const jurusanPeserta =
    activeData.program_studi ||
    activeData.jurusan_sekolah ||
    activeData.jurusan ||
    pendaftaranAccount.program_studi ||
    pendaftaranAccount.jurusan_sekolah ||
    activeData.pendaftaran?.program_studi ||
    activeData.pendaftaran?.jurusan_sekolah ||
    activeData.pendaftaran?.jurusan ||
    activeData.peserta?.program_studi ||
    activeData.peserta?.jurusan_sekolah ||
    activeData.peserta?.jurusan ||
    "-";

  const mentorPeserta =
    activeData.mentor_nama ||
    activeData.mentor?.nama ||
    pendaftaranAccount.mentor?.nama ||
    activeData.pendaftaran?.mentor?.nama ||
    activeData.dicatat_oleh?.nama ||
    "Belum Ditugaskan";

  const terlambat = Number(activeData.menit_terlambat) || 0;
  const durasiKerja = hitungDurasiKerja(activeData.jam_masuk, activeData.jam_pulang);

  // Resolusi data Titik Lokasi Presensi yang sebenarnya sesuai status kehadiran & data GPS riil
  const getLokasiPresensi = (jenis) => {
    const isMasuk = jenis === "masuk";
    const jam = isMasuk ? activeData.jam_masuk : activeData.jam_pulang;

    if (activeData.status === "izin") {
      return {
        nama: "Luar Kantor (Pengajuan Izin)",
        detail: "Pengajuan izin dinas resmi disetujui mentor pembimbing",
        koordinat: null,
        jarak: null,
        mode: "Izin Dinas",
        mapsUrl: null,
      };
    }
    if (activeData.status === "sakit") {
      return {
        nama: "Luar Kantor (Dispensasi Sakit)",
        detail: "Dispensasi surat keterangan sakit disetujui mentor",
        koordinat: null,
        jarak: null,
        mode: "Dispensasi Sakit",
        mapsUrl: null,
      };
    }
    if (activeData.status === "alfa" || activeData.status === "alpa") {
      return {
        nama: "Tidak Hadir (Alpa)",
        detail: "Tidak ada data titik lokasi presensi yang terekam",
        koordinat: null,
        jarak: null,
        mode: "Alpa",
        mapsUrl: null,
      };
    }

    if (jam) {
      const lat = activeData.latitude;
      const lng = activeData.longitude;
      const hasCoords = Boolean(lat && lng && String(lat).trim() !== "" && String(lng).trim() !== "");
      const jarak = activeData.jarak_meter != null ? Number(activeData.jarak_meter) : null;
      const mode = (activeData.mode_kehadiran || "wfo").toLowerCase();

      let namaLokasi = "Diskominfo Kab. Ponorogo";
      let detailLokasi = `Jl. Ir. H. Juanda No. 198, Tonatan, Ponorogo (Bidang: ${bidangPeserta !== "-" ? bidangPeserta : "APTIKA"})`;
      let labelMode = "WFO Kantor";

      if (mode === "wfh") {
        namaLokasi = "Lokasi Mandiri (WFH Remote)";
        detailLokasi = "Presensi kehadiran dinas dari kediaman / lokasi kerja remote";
        labelMode = "WFH";
      } else if (mode === "dinas_luar") {
        namaLokasi = "Tugas Lapangan (Dinas Luar)";
        detailLokasi = "Penugasan dinas resmi di luar lingkungan kantor";
        labelMode = "Dinas Luar";
      }

      const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null;
      const koordinatStr = hasCoords ? `${lat}, ${lng}` : null;

      return {
        nama: namaLokasi,
        detail: detailLokasi,
        koordinat: koordinatStr,
        jarak: jarak !== null ? `${jarak} meter dari titik kantor` : null,
        mode: labelMode,
        mapsUrl,
      };
    }

    return {
      nama: isMasuk
        ? "Belum Melakukan Presensi Masuk"
        : activeData.jam_masuk
        ? "Menunggu Presensi Kepulangan"
        : "Belum Melakukan Presensi Pulang",
      detail: isMasuk
        ? "Titik lokasi resmi kantor akan tercatat saat presensi kedatangan"
        : activeData.jam_masuk
        ? "Titik lokasi kepulangan akan tercatat saat presensi pulang"
        : "Sesi presensi kepulangan belum dilakukan",
      koordinat: null,
      jarak: null,
      mode: null,
      mapsUrl: null,
    };
  };

  const lokasiMasuk = getLokasiPresensi("masuk");
  const lokasiPulang = getLokasiPresensi("pulang");

  // Evaluasi Kondisi Logbook Harian yang Sebenarnya
  const rawKet = (activeData.keterangan || "").trim();
  const isFallbackKet = rawKet === "Belum melakukan presensi hari ini";
  const hasRealLogbook =
    rawKet !== "" &&
    !isFallbackKet &&
    activeData.status !== "izin" &&
    activeData.status !== "sakit" &&
    activeData.status !== "alfa" &&
    activeData.status !== "alpa";

  const getLogbookInfo = () => {
    // 1. Dispensasi Izin
    if (activeData.status === "izin") {
      return {
        title: "Keterangan Pengajuan Izin",
        subtitle: "Alasan dispensasi kehadiran izin yang diajukan peserta",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-300 border border-blue-200/80 dark:border-blue-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A5EC]" />
            Dispensasi Izin
          </span>
        ),
        content: rawKet || "Pengajuan izin tidak hadir dinas resmi telah disetujui mentor pembimbing.",
        isQuote: true,
        footer: "Pengajuan izin resmi telah diverifikasi dan disetujui oleh mentor pembimbing.",
      };
    }

    // 2. Dispensasi Sakit
    if (activeData.status === "sakit") {
      return {
        title: "Keterangan Surat Sakit",
        subtitle: "Alasan dispensasi kehadiran sakit yang diajukan peserta",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Dispensasi Sakit
          </span>
        ),
        content: rawKet || "Izin tidak masuk karena kondisi sakit dan memerlukan istirahat medis.",
        isQuote: true,
        footer: "Dispensasi sakit telah diverifikasi dan disetujui oleh mentor pembimbing.",
      };
    }

    // 3. Alpa / Tidak Hadir
    if (activeData.status === "alfa" || activeData.status === "alpa") {
      return {
        title: "Logbook Tidak Tersedia",
        subtitle: "Aktivitas magang tidak terekam pada hari ini",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Tidak Hadir (Alpa)
          </span>
        ),
        content: "Peserta tidak hadir (alpa) pada tanggal ini sehingga tidak ada catatan logbook kegiatan.",
        isQuote: false,
        footer: "Sesi presensi dan logbook untuk tanggal ini telah ditutup oleh sistem.",
      };
    }

    // 4. Belum Presensi Sama Sekali (Status Belum / Tidak Ada Jam Masuk & Pulang)
    if (activeData.status === "belum" || (!activeData.jam_masuk && !activeData.jam_pulang && !hasRealLogbook)) {
      return {
        title: "Logbook & Catatan Aktivitas",
        subtitle: "Catatan capaian dan uraian kegiatan magang",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Belum Presensi
          </span>
        ),
        content: "Peserta belum melakukan presensi hari ini. Uraian logbook kegiatan akan diisi saat presensi kepulangan dinas.",
        isQuote: false,
        footer: "Sesi presensi kepulangan dan pengisian logbook dibuka mulai pukul 16:00 WIB.",
      };
    }

    // 5. Sedang Berlangsung (Sudah Presensi Masuk, Belum Pulang & Belum Isi Logbook)
    if (activeData.jam_masuk && !activeData.jam_pulang && !hasRealLogbook) {
      return {
        title: "Logbook & Catatan Aktivitas",
        subtitle: "Catatan capaian dan uraian kegiatan magang harian",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu Pengisian Logbook
          </span>
        ),
        content: "Presensi masuk telah tercatat. Uraian capaian tugas dan logbook aktivitas akan diisi peserta saat presensi kepulangan dinas.",
        isQuote: false,
        footer: "Uraian logbook diwajibkan saat proses check-out presensi kepulangan.",
      };
    }

    // 6. Logbook Terisi (Real Logbook)
    if (hasRealLogbook) {
      return {
        title: "Logbook & Catatan Aktivitas",
        subtitle: "Catatan capaian dan uraian kegiatan magang yang disubmit",
        badge: (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Logbook Terisi
          </span>
        ),
        content: rawKet,
        isQuote: true,
        footer: `${rawKet.length} Karakter • Terekam dalam sistem jurnal harian SIM Magang`,
      };
    }

    // 7. Sudah Pulang / Terkunci tapi Belum Isi Logbook
    return {
      title: "Logbook & Catatan Aktivitas",
      subtitle: "Catatan capaian dan uraian kegiatan magang harian",
      badge: (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Logbook Belum Diisi
        </span>
      ),
      content: "Peserta belum mengisi catatan logbook kegiatan untuk presensi pada tanggal ini.",
      isQuote: false,
      footer: "Catatan logbook kegiatan dapat dilengkapi oleh peserta melalui menu Logbook.",
    };
  };

  const logbookInfo = getLogbookInfo();

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 animate-[backdropFade_0.25s_ease-out]"
        onClick={onClose}
      >
        <div
          className={`w-full max-w-sm sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col ${
            darkMode ? "bg-[#161b22] border border-white/10" : "bg-white ring-1 ring-slate-900/5"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Navy Gradient, Watermark & Badges Inline with Date */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 py-3.5 sm:px-6 sm:py-5 shrink-0">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <ClipboardList
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.07] sm:opacity-[0.09] text-sky-300 pointer-events-none rotate-6"
              strokeWidth={1}
            />

            <div className="relative flex items-start justify-between gap-2.5 sm:gap-3">
              {/* Identitas Peserta */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <PesertaAvatarModal nama={namaPeserta} foto={fotoPeserta} />
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#00A5EC]" />
                    Detail Presensi
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-white leading-tight truncate">
                    {namaPeserta}
                  </h3>

                  {/* Sejajar: Tanggal dan Hari + Badges Status */}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className="flex items-center gap-1 text-[10px] sm:text-[11.5px] text-white/90 font-bold shrink-0">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                      <span>{formatTanggalHari(activeData.tanggal)}</span>
                    </p>

                    <span className="hidden sm:inline-block text-white/30 text-xs font-light">•</span>

                    <span className="animate-[popIn_0.35s_ease-out]">
                      <PresensiStatusBadge
                        status={activeData.status}
                        className="!bg-white/95 !ring-0 shadow-sm !text-slate-800 !py-0.5 !px-2 !text-[8.5px] sm:!text-[9.5px]"
                      />
                    </span>

                    {activeData.mode_kehadiran && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold ring-1 backdrop-blur-sm ${
                        activeData.mode_kehadiran === "wfo"
                          ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30"
                          : activeData.mode_kehadiran === "wfh"
                          ? "bg-sky-500/20 text-sky-200 ring-sky-400/30"
                          : "bg-indigo-500/20 text-indigo-200 ring-indigo-400/30"
                      }`}>
                        {activeData.mode_kehadiran === "wfo"
                          ? "🏢 WFO"
                          : activeData.mode_kehadiran === "wfh"
                          ? "🏠 WFH"
                          : "🚗 Dinas Luar"}
                      </span>
                    )}
                    {durasiKerja && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-emerald-200 ring-1 ring-emerald-300/30 backdrop-blur-sm">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300" /> Durasi: {durasiKerja}
                      </span>
                    )}
                    {terlambat > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-sm">
                        <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> +{formatMenit(terlambat)}
                      </span>
                    )}
                    {activeData.lupa_presensi && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                        <AlarmClockOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Lupa presensi
                      </span>
                    )}
                    {activeData.dikunci && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Terkunci
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
                aria-label="Tutup detail presensi"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div
            className={`flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 ${
              darkMode ? "bg-[#161b22]" : "bg-slate-50/40"
            }`}
          >
            {/* 1. Dua Kartu Sesi Presensi: Presensi Masuk & Presensi Pulang */}
            <div>
              <SectionTitle isDark={darkMode}>Sesi &amp; Bukti Presensi Harian</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4.5">
                
                {/* KARTU 1: Bukti Presensi Masuk */}
                <div
                  className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4.5 flex flex-col justify-between gap-3.5 transition-all animate-[fadeslide_0.3s_ease-out] ${
                    darkMode
                      ? "bg-[#1c2333]/90 border-white/10 hover:border-white/20"
                      : "bg-white border-slate-200/90 shadow-sm hover:border-emerald-500/30"
                  }`}
                  style={{ animationDelay: "50ms", animationFillMode: "backwards" }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                        <LogIn className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                          Bukti Presensi Masuk
                        </h4>
                        <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                          Sesi Kedatangan Dinas
                        </p>
                      </div>
                    </div>

                    {/* Top Right Pill Badge */}
                    <div>
                      {activeData.status === "sakit" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Dispensasi Sakit
                        </span>
                      ) : activeData.status === "izin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-300 border border-blue-200/80 dark:border-blue-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00A5EC]" />
                          Dispensasi Izin
                        </span>
                      ) : activeData.status === "alfa" || activeData.status === "alpa" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Tidak Hadir (Alpa)
                        </span>
                      ) : activeData.jam_masuk ? (
                        terlambat > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Terlambat ({formatMenit(terlambat)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Tepat Waktu (On-Time)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Belum Presensi Masuk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waktu Tercatat & Batas Maksimal */}
                  <div
                    className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between border ${
                      darkMode ? "bg-[#161b22] border-white/5" : "bg-slate-50/80 border-slate-200/80 shadow-xs"
                    }`}
                  >
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Waktu Tercatat
                      </p>
                      <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tabular-nums mt-0.5">
                        {activeData.jam_masuk ? (
                          <>
                            {activeData.jam_masuk.slice(0, 5)}{" "}
                            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              WIB
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-bold">--:-- WIB</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Batas Maksimal
                      </p>
                      <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tabular-nums mt-0.5">
                        08:00{" "}
                        <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                          WIB
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Bukti Foto Presensi Masuk (Bersih fit full 16:9) */}
                  <div className="relative">
                    {activeData.foto_masuk ? (
                      <div
                        onClick={() => setPreviewFotoJenis("masuk")}
                        className="group relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 flex items-center justify-center cursor-pointer shadow-sm"
                        title="Klik untuk memperbesar foto presensi masuk"
                      >
                        <img
                          src={getFileUrl(activeData.foto_masuk)}
                          alt="Bukti Presensi Masuk"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {/* Hover zoom indicator */}
                        <span className="absolute right-2.5 bottom-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 shadow-md">
                          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`aspect-video w-full rounded-xl sm:rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1.5 text-center p-4 ${
                          darkMode ? "border-white/10 bg-[#161b22]/50" : "border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Foto Presensi Masuk Tidak Tersedia
                        </p>
                        <p className="text-[8.5px] sm:text-[9.5px] text-slate-400">
                          {activeData.status === "izin" || activeData.status === "sakit"
                            ? "Dispensasi izin resmi tanpa foto selfie"
                            : "Belum melakukan presensi masuk"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Titik Lokasi Presensi Masuk (Data Riil) */}
                  <div
                    className={`rounded-xl p-2.5 sm:p-3 border flex flex-col gap-2 ${
                      darkMode ? "bg-[#161b22] border-white/5" : "bg-slate-50/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <p className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Titik Lokasi Presensi:
                          </p>
                          {lokasiMasuk.mode && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                              {lokasiMasuk.mode}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                          {lokasiMasuk.nama}
                        </p>
                        <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {lokasiMasuk.detail}
                        </p>
                      </div>
                    </div>

                    {/* Data Riil Koordinat & Link Google Maps */}
                    {(lokasiMasuk.koordinat || lokasiMasuk.jarak) && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[8.5px] sm:text-[9.5px]">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                          <Navigation className="w-3 h-3 text-[#00A5EC] shrink-0" />
                          <span className="truncate">{lokasiMasuk.koordinat || "Geofence Kantor"}</span>
                          {lokasiMasuk.jarak && (
                            <span className="text-slate-400 font-sans">({lokasiMasuk.jarak})</span>
                          )}
                        </div>
                        {lokasiMasuk.mapsUrl && (
                          <a
                            href={lokasiMasuk.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#004F9F] dark:text-sky-300 hover:text-[#00A5EC] dark:hover:text-sky-200 hover:underline transition-colors ml-auto"
                          >
                            <span>Buka Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* KARTU 2: Bukti Presensi Pulang */}
                <div
                  className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4.5 flex flex-col justify-between gap-3.5 transition-all animate-[fadeslide_0.3s_ease-out] ${
                    darkMode
                      ? "bg-[#1c2333]/90 border-white/10 hover:border-white/20"
                      : "bg-white border-slate-200/90 shadow-sm hover:border-amber-500/30"
                  }`}
                  style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
                        <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                          Bukti Presensi Pulang
                        </h4>
                        <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                          {activeData.jam_pulang
                            ? "Sesi Kepulangan Dinas Selesai"
                            : "Menunggu Waktu Kepulangan Dinas"}
                        </p>
                      </div>
                    </div>

                    {/* Top Right Pill Badge */}
                    <div>
                      {activeData.status === "sakit" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Dispensasi Sakit
                        </span>
                      ) : activeData.status === "izin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#004F9F] dark:text-sky-300 border border-blue-200/80 dark:border-blue-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00A5EC]" />
                          Dispensasi Izin
                        </span>
                      ) : activeData.status === "alfa" || activeData.status === "alpa" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Alpa (Tanpa Keterangan)
                        </span>
                      ) : activeData.jam_pulang ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Sudah Presensi Pulang
                        </span>
                      ) : activeData.lupa_presensi ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Lupa Presensi Pulang
                        </span>
                      ) : activeData.jam_masuk ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Belum Presensi Pulang
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Belum Presensi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waktu Selesai & Jam Pulang Standar */}
                  <div
                    className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between border ${
                      darkMode ? "bg-[#161b22] border-white/5" : "bg-slate-50/80 border-slate-200/80 shadow-xs"
                    }`}
                  >
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Waktu Selesai
                      </p>
                      <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tabular-nums mt-0.5">
                        {activeData.jam_pulang ? (
                          <>
                            {activeData.jam_pulang.slice(0, 5)}{" "}
                            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              WIB
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-bold">--:-- WIB</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Total Durasi Kerja
                      </p>
                      <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tabular-nums mt-0.5">
                        {durasiKerja ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{durasiKerja}</span>
                        ) : activeData.jam_masuk && !activeData.jam_pulang ? (
                          <span className="text-amber-500 font-bold text-[10.5px] sm:text-xs">Sedang Berlangsung</span>
                        ) : (
                          <span className="text-slate-400 font-bold">--</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Bukti Foto Presensi Pulang (Bersih fit full 16:9) */}
                  <div className="relative">
                    {activeData.foto_pulang ? (
                      <div
                        onClick={() => setPreviewFotoJenis("pulang")}
                        className="group relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 flex items-center justify-center cursor-pointer shadow-sm"
                        title="Klik untuk memperbesar foto presensi pulang"
                      >
                        <img
                          src={getFileUrl(activeData.foto_pulang)}
                          alt="Bukti Presensi Pulang"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {/* Hover zoom indicator */}
                        <span className="absolute right-2.5 bottom-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 shadow-md">
                          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`aspect-video w-full rounded-xl sm:rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1.5 text-center p-4 ${
                          darkMode ? "border-white/10 bg-[#161b22]/50" : "border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Foto Presensi Pulang Belum Tersedia
                        </p>
                        <p className="text-[8.5px] sm:text-[9.5px] text-slate-400">
                          {activeData.status === "izin" || activeData.status === "sakit"
                            ? "Dispensasi tanpa foto selfie kepulangan"
                            : activeData.status === "alfa" || activeData.status === "alpa"
                            ? "Tidak hadir presensi"
                            : activeData.jam_masuk && !activeData.jam_pulang
                            ? "Peserta belum melakukan presensi kepulangan dinas"
                            : "Belum melakukan presensi kepulangan"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Titik Lokasi Presensi Pulang (Data Riil) */}
                  <div
                    className={`rounded-xl p-2.5 sm:p-3 border flex flex-col gap-2 ${
                      darkMode ? "bg-[#161b22] border-white/5" : "bg-slate-50/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <p className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Titik Lokasi Presensi:
                          </p>
                          {lokasiPulang.mode && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                              {lokasiPulang.mode}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                          {lokasiPulang.nama}
                        </p>
                        <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {lokasiPulang.detail}
                        </p>
                      </div>
                    </div>

                    {/* Data Riil Koordinat & Link Google Maps */}
                    {(lokasiPulang.koordinat || lokasiPulang.jarak) && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[8.5px] sm:text-[9.5px]">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                          <Navigation className="w-3 h-3 text-[#00A5EC] shrink-0" />
                          <span className="truncate">{lokasiPulang.koordinat || "Geofence Kantor"}</span>
                          {lokasiPulang.jarak && (
                            <span className="text-slate-400 font-sans">({lokasiPulang.jarak})</span>
                          )}
                        </div>
                        {lokasiPulang.mapsUrl && (
                          <a
                            href={lokasiPulang.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#004F9F] dark:text-sky-300 hover:text-[#00A5EC] dark:hover:text-sky-200 hover:underline transition-colors ml-auto"
                          >
                            <span>Buka Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Logbook & Jurnal Kegiatan Harian */}
            <div>
              <SectionTitle isDark={darkMode}>Logbook &amp; Jurnal Kegiatan Harian</SectionTitle>
              <div
                className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all animate-[fadeslide_0.3s_ease-out] ${
                  darkMode
                    ? "bg-[#1c2333]/90 border-white/10 hover:border-white/20"
                    : "bg-white border-slate-200/90 shadow-sm hover:border-[#004F9F]/30"
                }`}
                style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
              >
                {/* Header Card Logbook */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-400 border border-blue-100 dark:border-sky-800/40">
                      <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                        {logbookInfo.title}
                      </h4>
                      <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                        {logbookInfo.subtitle}
                      </p>
                    </div>
                  </div>

                  <div>{logbookInfo.badge}</div>
                </div>

                {/* Isi Konten Logbook */}
                <div className="mt-3.5 space-y-2.5">
                  <div
                    className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${
                      darkMode
                        ? "bg-[#161b22] border-white/5"
                        : "bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200/80"
                    }`}
                  >
                    {logbookInfo.isQuote ? (
                      <p className="text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-200 leading-relaxed break-words whitespace-pre-line font-medium">
                        &ldquo;{logbookInfo.content}&rdquo;
                      </p>
                    ) : (
                      <div className="py-2 text-center">
                        <p className="text-[11px] sm:text-xs italic text-slate-400 dark:text-slate-500 font-medium">
                          {logbookInfo.content}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] sm:text-[10px] text-slate-400 px-1">
                    <span className="flex items-center gap-1 font-medium">
                      <FileText className="w-3 h-3 text-[#00A5EC]" />
                      {logbookInfo.footer}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Informasi & Penempatan Peserta */}
            <div>
              <SectionTitle isDark={darkMode}>Informasi &amp; Penempatan Peserta</SectionTitle>
              <div className="grid grid-cols-1 gap-2 sm:gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                  icon={Building2}
                  label="Bidang Penempatan"
                  value={bidangPeserta}
                  colorScheme="blue"
                  delay={40}
                  isDark={darkMode}
                />
                <InfoItem
                  icon={GraduationCap}
                  label="Asal Institusi / Sekolah"
                  value={institusiPeserta}
                  colorScheme="purple"
                  delay={80}
                  isDark={darkMode}
                />
                <InfoItem
                  icon={BookOpen}
                  label="Program Studi / Jurusan"
                  value={jurusanPeserta}
                  colorScheme="emerald"
                  delay={120}
                  isDark={darkMode}
                />
                <InfoItem
                  icon={UserCog}
                  label="Mentor Pembimbing"
                  value={mentorPeserta}
                  colorScheme="amber"
                  delay={160}
                  isDark={darkMode}
                />
              </div>
            </div>

            {/* Catatan Hak Akses & Info Sistem */}
            <div
              className={`flex items-start gap-2.5 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${
                darkMode
                  ? "border-blue-500/20 bg-blue-500/[0.05]"
                  : "border-[#004F9F]/15 bg-[#004F9F]/[0.04]"
              }`}
            >
              <span
                className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg ${
                  darkMode ? "bg-blue-500/20 text-[#00A5EC]" : "bg-[#004F9F]/10 text-[#004F9F]"
                }`}
              >
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
              <p
                className={`text-[10px] sm:text-[11px] font-medium leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Data presensi tercatat otomatis ke dalam sistem SIM Magang Diskominfo Ponorogo. Koreksi presensi
                dan verifikasi kehadiran adalah wewenang mentor pembimbing.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between gap-3 border-t p-3 sm:px-6 sm:py-3.5 shrink-0 ${
              darkMode ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-white"
            }`}
          >
            <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
              Tekan
              <kbd
                className={`rounded-md border px-1.5 py-0.5 font-sans text-[9.5px] font-bold ${
                  darkMode
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                Esc
              </kbd>
              untuk menutup
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                darkMode
                  ? "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Interactive Photo Inspector Modal */}
      <FotoPresensiPreviewModal
        isOpen={Boolean(previewFotoJenis)}
        onClose={() => setPreviewFotoJenis(null)}
        initialJenis={previewFotoJenis || "masuk"}
        fotoMasuk={activeData.foto_masuk ? getFileUrl(activeData.foto_masuk) : null}
        fotoPulang={activeData.foto_pulang ? getFileUrl(activeData.foto_pulang) : null}
        jamMasuk={activeData.jam_masuk}
        jamPulang={activeData.jam_pulang}
        tanggal={activeData.tanggal}
        namaPeserta={namaPeserta}
        modeKehadiran={activeData.mode_kehadiran}
        lokasiMasuk={lokasiMasuk}
        lokasiPulang={lokasiPulang}
      />
    </>
  );
};

export default PresensiDetailModal;