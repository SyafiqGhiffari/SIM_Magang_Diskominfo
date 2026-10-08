import { useState, useEffect, useCallback } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import TranskripHeroCard from "../../components/manajemen/peserta/penilaian/TranskripHeroCard";
import KompetensiPillarCard from "../../components/manajemen/peserta/penilaian/KompetensiPillarCard";
import RaporProgressionStepperCard from "../../components/manajemen/peserta/penilaian/RaporProgressionStepperCard";
import RaporMockupCard from "../../components/manajemen/peserta/penilaian/RaporMockupCard";
import {
  RefreshCw,
  Layers,
  LayoutGrid,
  Eye,
  Briefcase,
  UserCheck,
  Users,
  ClipboardCheck,
  FileEdit,
  BadgeCheck,
} from "lucide-react";
import { getNilaiSaya } from "../../services/penilaianService";
import { getDashboardPeserta, getSertifikatSaya } from "../../services/pesertaService";
import { getTemplateRaporAktif } from "../../services/templateRaporService";
import { getFileUrl } from "../../utils/fileUrl";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
import { toastSuccess, toastError } from "../../utils/swal";

const HitungIndeks = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "A";
  if (n >= 70) return "B";
  if (n >= 60) return "C";
  if (n >= 40) return "D";
  return "E";
};

// Master butir indikator baku jika data detail_nilai kosong
const DEFAULT_INDIKATOR = [
  {
    kategori: "profesional",
    items: [
      { id: "prof_1", teks: "Kemampuan memahami tugas yang diberikan" },
      { id: "prof_2", teks: "Kemampuan melaksanakan tugas" },
      { id: "prof_3", teks: "Kemampuan menyelesaikan tugas tepat waktu" },
      { id: "prof_4", teks: "Kualitas hasil pekerjaan" },
    ],
  },
  {
    kategori: "personal",
    items: [
      { id: "pers_1", teks: "Kedisiplinan dan tanggung jawab" },
      { id: "pers_2", teks: "Kejujuran dan integritas" },
      { id: "pers_3", teks: "Kemandirian dan inisiatif" },
      { id: "pers_4", teks: "Antusias kerja dan kemampuan beradaptasi" },
      { id: "pers_5", teks: "Sikap dan etika kerja" },
    ],
  },
  {
    kategori: "sosial",
    items: [
      { id: "sos_1", teks: "Kemampuan berkomunikasi" },
      { id: "sos_2", teks: "Kerja sama dengan mentor dan pegawai" },
      { id: "sos_3", teks: "Sopan santun dalam lingkungan kerja" },
      { id: "sos_4", teks: "Kemampuan menerima arahan dan masukan" },
    ],
  },
  {
    kategori: "administratif",
    items: [
      { id: "adm_1", teks: "Ketertiban melakukan absensi (dihitung otomatis)" },
      { id: "adm_2", teks: "Kelengkapan pengisian logbook (dihitung otomatis)" },
      { id: "adm_3", teks: "Ketepatan waktu pengumpulan tugas (dihitung otomatis)" },
      { id: "adm_4", teks: "Kelengkapan laporan akhir magang (dikonfirmasi)" },
    ],
  },
];

export const TranskripNilaiPesertaPage = () => {
  const { isDark } = useManajemenTheme();
  const [data, setData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [sertifikatInfo, setSertifikatInfo] = useState(null);
  const [templateRapor, setTemplateRapor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingTranskrip, setDownloadingTranskrip] = useState(false);
  const [activeTab, setActiveTab] = useState("ringkasan"); // "ringkasan" | "dokumen"

  const loadData = useCallback(async () => {
    try {
      const [nilaiRes, dashRes, sertRes, tplRes] = await Promise.allSettled([
        getNilaiSaya(),
        getDashboardPeserta(),
        getSertifikatSaya(),
        getTemplateRaporAktif(),
      ]);

      if (nilaiRes.status === "fulfilled") {
        setData(nilaiRes.value?.data?.data || null);
      }
      if (dashRes.status === "fulfilled") {
        setDashboardData(dashRes.value?.data?.data || null);
      }
      if (sertRes.status === "fulfilled") {
        setSertifikatInfo(sertRes.value?.data?.data || null);
      }
      if (tplRes.status === "fulfilled") {
        setTemplateRapor(tplRes.value?.data?.data || null);
      }
    } catch {
      toastError("Gagal memuat data rapor nilai");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(id);
  }, [loadData]);

  const handleDownloadTranskripPdf = async () => {
    if (!data || !data.penilaian) return;
    setDownloadingTranskrip(true);
    try {
      await exportTranskripNilaiPdf(
        {
          ...data,
          template_rapor: templateRapor,
          peserta: p,
          mentor: m,
          instansi,
        },
        templateRapor
      );
      toastSuccess("Dokumen transkrip nilai resmi PDF berhasil diunduh");
    } catch (err) {
      toastError("Gagal mengekspor Transkrip PDF: " + err.message);
    } finally {
      setDownloadingTranskrip(false);
    }
  };

  const p = data?.peserta || dashboardData?.pendaftaran || {};
  const pn = data?.penilaian || {};
  const m = {
    ...(dashboardData?.mentor || {}),
    ...(data?.mentor || {}),
    foto_profil:
      data?.mentor?.foto_profil ||
      dashboardData?.mentor?.foto_profil ||
      "",
  };
  const instansi = data?.instansi || {};
  const isEvaluated = Boolean(data?.sudah_dinilai && pn.status_penilaian === "final");

  const adaSertifikat = Boolean(
    sertifikatInfo?.ada_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat !== "-"
  );

  // Status Laporan & Timeline dari Dashboard
  const statusLaporan = dashboardData?.laporan_akhir?.status || "belum_unggah";
  const catatanMentorLaporan = dashboardData?.laporan_akhir?.catatan_mentor || "";
  const statusTimeline = dashboardData?.timeline?.status_timeline || "berjalan";

  // Parse detail items riil dari database (pn.detail_nilai)
  let detailItems = [];
  try {
    if (typeof pn.detail_nilai === "string") {
      detailItems = JSON.parse(pn.detail_nilai || "[]");
    } else if (Array.isArray(pn.detail_nilai)) {
      detailItems = pn.detail_nilai;
    }
  } catch {
    detailItems = [];
  }

  const rawProf = detailItems.filter(
    (x) =>
      x.kategori?.toLowerCase() === "profesional" ||
      x.id?.startsWith("prof_") ||
      x.id?.startsWith("profesional_")
  );
  const rawPers = detailItems.filter(
    (x) =>
      x.kategori?.toLowerCase() === "personal" ||
      x.id?.startsWith("pers_") ||
      x.id?.startsWith("personal_")
  );
  const rawSos = detailItems.filter(
    (x) =>
      x.kategori?.toLowerCase() === "sosial" ||
      x.id?.startsWith("sos_") ||
      x.id?.startsWith("sosial_")
  );
  const rawAdm = detailItems.filter(
    (x) =>
      x.kategori?.toLowerCase() === "administratif" ||
      x.id?.startsWith("adm_") ||
      x.id?.startsWith("administratif_")
  );

  // Helper untuk mengekstrak data indikator riil langsung dari database
  const getPillarItems = (rawList, defaultCategory, fallbackValue) => {
    if (rawList && rawList.length > 0) {
      return rawList.map((it) => ({
        judul: it.teks || it.judul || "Indikator Penilaian",
        nilai: it.nilai !== undefined && it.nilai !== null ? it.nilai : fallbackValue,
      }));
    }
    const def = DEFAULT_INDIKATOR.find((k) => k.kategori === defaultCategory);
    if (def?.items) {
      return def.items.map((it) => ({
        judul: it.teks,
        nilai: fallbackValue,
      }));
    }
    return [];
  };

  const profItems = getPillarItems(rawProf, "profesional", pn.nilai_profesional || 0);
  const persItems = getPillarItems(rawPers, "personal", pn.nilai_personal || 0);
  const sosItems = getPillarItems(rawSos, "sosial", pn.nilai_sosial || 0);
  const admItems = getPillarItems(rawAdm, "administratif", pn.nilai_administratif || 0);

  // Ekstrak inisial mentor untuk avatar (mis. "Aris Setiawan, S.Kom" => "AS")
  const getMentorInitials = (nama) => {
    if (!nama) return "M";
    const clean = nama.split(",")[0].replace(/^(Drs\.|Dr\.|Ir\.|H\.|Hj\.)\s+/i, "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const mentorInitials = getMentorInitials(m.nama);
  const fotoMentorSrc = m.foto_profil ? getFileUrl(m.foto_profil) : null;
  const rawCatatan =
    pn.catatan_mentor ||
    "Peserta menunjukkan dedikasi dan kapasitas yang sangat baik dalam menyelesaikan seluruh tugas dan kegiatan praktik kerja lapangan / magang di lingkungan dinas.";
  const cleanCatatan = rawCatatan.replace(/^["“]+|["”]+$/g, "").trim();

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Halaman & Aksi Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Transkrip Nilai &amp; Rapor Magang
            </h2>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Lembar evaluasi capaian 4 pilar kompetensi magang resmi diterbitkan langsung oleh Mentor Pembimbing.
            </p>
          </div>
        </div>

        {/* State Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#004F9F] mb-2" />
            <span>Memuat lembar evaluasi dan transkrip nilai resmi...</span>
          </div>
        ) : !isEvaluated ? (
          /* STATE BELUM DINILAI: Tampilkan Alur Bimbingan Stepper */
          <RaporProgressionStepperCard
            mentor={m}
            peserta={p}
            statusLaporan={statusLaporan}
            catatanMentorLaporan={catatanMentorLaporan}
            statusTimeline={statusTimeline}
            isDark={isDark}
          />
        ) : (
          /* STATE SUDAH DINILAI: Tampilkan Halaman Rapor Lengkap */
          <div className="space-y-6">
            {/* Hero Card Summary Nilai Akhir */}
            <TranskripHeroCard
              peserta={p}
              mentor={m}
              penilaian={pn}
              adaSertifikat={adaSertifikat}
            />

            {/* Tab Navigasi Tampilan (Segmented Control Track Tanpa Garis Sekat Bawah) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 gap-1 sm:gap-1.5 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab("ringkasan")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all duration-200 cursor-pointer outline-none focus:outline-none focus:ring-0 select-none ${
                    activeTab === "ringkasan"
                      ? "bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white shadow-md ring-1 ring-sky-400/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Ringkasan Kompetensi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("dokumen")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-black transition-all duration-200 cursor-pointer outline-none focus:outline-none focus:ring-0 select-none ${
                    activeTab === "dokumen"
                      ? "bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white shadow-md ring-1 ring-sky-400/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>Pratinjau Lembar Rapor Resmi (A4)</span>
                </button>
              </div>

              <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                {activeTab === "ringkasan"
                  ? "4 Pilar Kompetensi Bimbingan"
                  : "Format Cetak Lembar Rapor"}
              </span>
            </div>

            {/* TAB KONTEN 1: RINGKASAN KOMPETENSI INTERAKTIF */}
            {activeTab === "ringkasan" && (
              <div className="space-y-6 animate-[fadeslide_0.25s_ease-out]">
                {/* 1. CARD TABEL/GRID 4 PILAR KOMPETENSI (GAYA CARD RIWAYAT PRESENSI BULANAN) */}
                <div
                  className={`w-full rounded-2xl border shadow-sm overflow-hidden ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}
                >
                  {/* Header Card di dalam (Tanpa Garis Sekat ke Konten) */}
                  <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-6 pb-1 sm:pb-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                        <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <div className="min-w-0">
                        <h3
                          className={`text-sm sm:text-base font-black truncate ${
                            isDark ? "text-slate-100" : "text-[#0B1442]"
                          }`}
                        >
                          Rincian Capaian 4 Pilar Kompetensi Magang
                        </h3>
                        <p
                          className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-xl truncate ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Evaluasi kuantitatif menyeluruh aspek profesional, personal, sosial, dan administratif oleh Mentor
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
                      4 Pilar Evaluasi
                    </span>
                  </div>

                  {/* Body Card: Grid 4 Pilar Kompetensi */}
                  <div className="px-3.5 sm:px-6 pb-4 sm:pb-6 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                      <KompetensiPillarCard
                        title="Pilar I: Kompetensi Profesional"
                        icon={Briefcase}
                        bobot={pn.bobot_profesional || 30}
                        rataRata={pn.nilai_profesional}
                        predikat={HitungIndeks(pn.nilai_profesional)}
                        items={profItems}
                        isDark={isDark}
                      />

                      <KompetensiPillarCard
                        title="Pilar II: Kompetensi Personal"
                        icon={UserCheck}
                        bobot={pn.bobot_personal || 25}
                        rataRata={pn.nilai_personal}
                        predikat={HitungIndeks(pn.nilai_personal)}
                        items={persItems}
                        isDark={isDark}
                      />

                      <KompetensiPillarCard
                        title="Pilar III: Kompetensi Sosial"
                        icon={Users}
                        bobot={pn.bobot_sosial || 20}
                        rataRata={pn.nilai_sosial}
                        predikat={HitungIndeks(pn.nilai_sosial)}
                        items={sosItems}
                        isDark={isDark}
                      />

                      <KompetensiPillarCard
                        title="Pilar IV: Kompetensi Administratif"
                        icon={ClipboardCheck}
                        bobot={pn.bobot_administratif || 25}
                        rataRata={pn.nilai_administratif}
                        predikat={HitungIndeks(pn.nilai_administratif)}
                        items={admItems}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CARD ULASAN & EVALUASI PEMBIMBING LAPANGAN (GAYA CARD RIWAYAT PRESENSI BULANAN) */}
                <div
                  className={`w-full rounded-2xl border shadow-sm overflow-hidden ${
                    isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
                  }`}
                >
                  {/* Header Card di dalam (Dengan Garis Sekat ke Konten) */}
                  <div
                    className={`flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-3.5 sm:pt-5 pb-2.5 sm:pb-3 border-b ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                        <FileEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <div className="min-w-0">
                        <h3
                          className={`text-sm sm:text-base font-black truncate ${
                            isDark ? "text-slate-100" : "text-[#0B1442]"
                          }`}
                        >
                          Ulasan &amp; Evaluasi Pembimbing Lapangan
                        </h3>
                        <p
                          className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-2xl truncate ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Penilaian kualitatif resmi dan catatan perkembangan kompetensi dari Mentor Dinas Komunikasi dan Informatika
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>Telah Diverifikasi</span>
                    </div>
                  </div>

                  {/* Body Card: Isi Ulasan & Profil Mentor */}
                  <div className="px-3.5 sm:px-6 pt-2.5 sm:pt-3.5 pb-3.5 sm:pb-5 relative overflow-hidden">
                    {/* Watermark Quote Mark */}
                    <div className="text-slate-200/60 dark:text-slate-700/20 text-4xl sm:text-5xl font-sans font-black absolute top-3 right-5 select-none pointer-events-none leading-none">
                      ”
                    </div>

                    {/* Isi Catatan Mentor Aktual Berformat Miring / Italic */}
                    <p
                      className={`italic text-xs sm:text-sm leading-relaxed pr-8 relative z-10 ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}
                    >
                      “{cleanCatatan}”
                    </p>

                    {/* Garis Sekat Pemisah antara Kalimat Evaluasi dan Profil Mentor */}
                    <div
                      className={`border-t pt-3.5 mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 ${
                        isDark ? "border-white/10" : "border-slate-100"
                      }`}
                    >
                      {/* Kiri: Foto Profil Mentor (jika ada) atau Avatar Biru Gradasi (jika belum ada foto) */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {fotoMentorSrc ? (
                            <img
                              src={fotoMentorSrc}
                              alt={m.nama || "Mentor"}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-[#004F9F]/20 shadow-xs"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`avatar-fallback w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#0B1442] via-[#004F9F] to-[#00A5EC] text-white items-center justify-center font-black text-xs sm:text-sm shadow-xs ring-1 ring-white/20 ${
                              fotoMentorSrc ? "hidden" : "flex"
                            }`}
                          >
                            {mentorInitials}
                          </div>
                        </div>
                        <div>
                          <h5
                            className={`font-bold text-xs sm:text-sm leading-tight ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {m.nama || "Pembimbing Lapangan"}
                          </h5>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {m.jabatan || "Pranata Komputer Ahli Muda"}
                            {m.nip ? ` • NIP. ${m.nip}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Kanan: Keterangan Pembimbing */}
                      <div className="text-[11px] sm:text-xs text-slate-400 font-medium">
                        Pembimbing Lapangan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB KONTEN 2: LEMBAR DOKUMEN RAPOR RESMI (A4 PAPER VIEW) */}
            {activeTab === "dokumen" && (
              <div className="animate-[fadeslide_0.25s_ease-out]">
                <RaporMockupCard
                  peserta={p}
                  mentor={m}
                  penilaian={pn}
                  instansi={instansi}
                  templateRapor={templateRapor}
                  onDownloadPdf={handleDownloadTranskripPdf}
                  downloading={downloadingTranskrip}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default TranskripNilaiPesertaPage;
