import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  Award,
  Briefcase,
  UserCheck,
  Users,
  FileCheck2,
  CalendarClock,
  NotebookPen,
  BookOpenCheck,
  FileCheckCorner,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Save,
  FileText,
  Check,
  AlertCircle,
  Info,
  Scale
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastWarning, confirmDialog } from "../../../../utils/swal";

const HitungIndeks = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "A";
  if (n >= 70) return "B";
  if (n >= 60) return "C";
  if (n >= 40) return "D";
  return "E";
};

const HitungPredikat = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "Sangat Baik (Melebihi Harapan)";
  if (n >= 70) return "Baik (Sesuai Harapan)";
  if (n >= 60) return "Cukup (Perlu Peningkatan)";
  return "Kurang (Perlu Pembinaan)";
};

const getIndeksBadgeClass = (indeks) => {
  if (indeks === "A")
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (indeks === "B")
    return "bg-blue-50 text-[#004F9F] border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800";
  if (indeks === "C")
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
};

const getPredikatRingkas = (indeks) => {
  if (indeks === "A") return "Sangat Baik";
  if (indeks === "B") return "Baik";
  if (indeks === "C") return "Cukup";
  return "Kurang";
};

const DEFAULT_INDIKATOR = [
  {
    kategori: "profesional",
    judul_kategori: "Kompetensi Profesional",
    bobot: 35,
    items: [
      { id: "prof_1", teks: "Kemampuan memahami tugas yang diberikan" },
      { id: "prof_2", teks: "Kemampuan melaksanakan tugas" },
      { id: "prof_3", teks: "Kemampuan menyelesaikan tugas tepat waktu" },
      { id: "prof_4", teks: "Kualitas hasil pekerjaan" },
    ],
  },
  {
    kategori: "personal",
    judul_kategori: "Kompetensi Personal",
    bobot: 25,
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
    judul_kategori: "Kompetensi Sosial",
    bobot: 20,
    items: [
      { id: "sos_1", teks: "Kemampuan berkomunikasi" },
      { id: "sos_2", teks: "Kerja sama dengan mentor dan pegawai" },
      { id: "sos_3", teks: "Sopan santun dalam lingkungan kerja" },
      { id: "sos_4", teks: "Kemampuan menerima arahan dan masukan" },
    ],
  },
  {
    kategori: "administratif",
    judul_kategori: "Kompetensi Administratif",
    bobot: 20,
    items: [
      { id: "adm_1", teks: "Ketertiban melakukan absensi (dihitung otomatis)" },
      { id: "adm_2", teks: "Kelengkapan pengisian logbook (dihitung otomatis)" },
      { id: "adm_3", teks: "Ketepatan waktu pengumpulan tugas (dihitung otomatis)" },
      { id: "adm_4", teks: "Kelengkapan laporan akhir magang (dikonfirmasi)" },
    ],
  },
];

const TEMPLATE_CATATAN = [
  "Peserta menunjukkan kedisiplinan dan inisiatif kerja yang sangat memuaskan.",
  "Mampu beradaptasi dengan cepat dan berkolaborasi secara produktif dengan tim kerja.",
  "Kualitas pekerjaan sangat rapi, teliti, serta konsisten selesai tepat waktu.",
  "Memiliki etika komunikasi dan sikap profesional yang patut diapresiasi.",
];

const PenilaianFormBody = ({
  onClose,
  selectedPeserta,
  detailData,
  onSave,
  saving,
  isDark,
}) => {
  // Step State (0 = Profesional, 1 = Personal, 2 = Sosial, 3 = Administratif, 4 = Catatan & Finalisasi)
  const [currentStep, setCurrentStep] = useState(0);

  // Parsing Indikator Konfigurasi
  const indikatorList = useMemo(() => {
    if (detailData?.setting?.daftar_indikator) {
      try {
        const parsed = JSON.parse(detailData.setting.daftar_indikator);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_INDIKATOR;
  }, [detailData]);

  // Bobot Konfigurasi
  const bobotSetting = useMemo(() => {
    return {
      profesional: Number(detailData?.setting?.bobot_profesional) || 35,
      personal: Number(detailData?.setting?.bobot_personal) || 25,
      sosial: Number(detailData?.setting?.bobot_sosial) || 20,
      administratif: Number(detailData?.setting?.bobot_administratif) || 20,
    };
  }, [detailData]);

  // Inisialisasi Nilai Awal
  const [scores, setScores] = useState(() => {
    if (detailData?.penilaian?.detail_nilai) {
      try {
        const parsed =
          typeof detailData.penilaian.detail_nilai === "string"
            ? JSON.parse(detailData.penilaian.detail_nilai)
            : detailData.penilaian.detail_nilai;

        const initialScores = {};
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item.id) initialScores[item.id] = Number(item.nilai) || 0;
          });
        }
        return initialScores;
      } catch {
        // ignore
      }
    }

    const initialScores = {};
    indikatorList.forEach((kat) => {
      if (kat.kategori !== "administratif") {
        kat.items?.forEach((it) => {
          initialScores[it.id] = 85;
        });
      }
    });
    return initialScores;
  });

  const [catatan, setCatatan] = useState(() => {
    const saved = detailData?.penilaian?.catatan_mentor;
    const laporanNote = detailData?.pendaftaran?.catatan_mentor_laporan;
    // Jangan isi otomatis jika nilainya berasal dari catatan revisi bab laporan akhir atau peserta belum dinilai
    if (
      saved &&
      saved !== laporanNote &&
      !saved.toLowerCase().includes("bab") &&
      !saved.toLowerCase().includes("revisi") &&
      saved !== "perbaiki kembali bab 4"
    ) {
      return saved;
    }
    return "";
  });

  const isAccFromData = Boolean(
    detailData?.penilaian?.laporan_akhir_disetujui ||
    detailData?.peserta?.laporan_akhir_disetujui ||
    (detailData?.peserta?.status_laporan_akhir || selectedPeserta?.status_laporan_akhir || "").toLowerCase() === "disetujui"
  );
  const [laporanDisetujui, setLaporanDisetujui] = useState(
    () => detailData?.penilaian?.laporan_akhir_disetujui ?? isAccFromData ?? true
  );

  // Helper kalkulasi nilai
  const getNum = (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v));

  // Hitung rata-rata per pilar
  const calculateCategoryAverage = (katKey) => {
    const kat = indikatorList.find((k) => k.kategori === katKey);
    if (!kat || !kat.items || kat.items.length === 0) return 0;
    const total = kat.items.reduce((acc, it) => acc + getNum(scores[it.id]), 0);
    return total / kat.items.length;
  };

  const avgProf = calculateCategoryAverage("profesional");
  const avgPers = calculateCategoryAverage("personal");
  const avgSos = calculateCategoryAverage("sosial");

  // Skor Administratif Otomatis
  const autoAdmin = detailData?.auto_administratif || {};
  const skorAbsensi = getNum(autoAdmin.skor_absensi ?? 100);
  const skorLogbook = getNum(autoAdmin.skor_logbook ?? 100);
  const skorTugas = getNum(autoAdmin.skor_tugas ?? 100);
  const skorLaporan = laporanDisetujui ? 100 : 0;
  const avgAdm = (skorAbsensi + skorLogbook + skorTugas + skorLaporan) / 4.0;

  // Nilai Akhir Tertimbang
  const totalNilaiAkhir =
    avgProf * (bobotSetting.profesional / 100) +
    avgPers * (bobotSetting.personal / 100) +
    avgSos * (bobotSetting.sosial / 100) +
    avgAdm * (bobotSetting.administratif / 100);

  const indeksAkhir = HitungIndeks(totalNilaiAkhir);
  const predikatAkhir = HitungPredikat(totalNilaiAkhir);
  const isCatatanFilled = Boolean(catatan && catatan.trim().length > 0);
  const [isModified, setIsModified] = useState(false);

  // Close handler dengan konfirmasi Swal jika ada data yang diubah
  const handleAttemptClose = async () => {
    if (saving) return;
    if (isModified) {
      const confirm = await confirmDialog({
        title: "Tutup Form Penilaian?",
        text: "Perubahan nilai atau catatan evaluasi yang belum disimpan akan hilang. Yakin ingin menutup form ini?",
        confirmText: "Ya, Tutup",
        cancelText: "Lanjutkan Menilai",
        icon: "warning",
        danger: true,
      });
      if (!confirm?.isConfirmed) return;
    }
    onClose();
  };

  const tanggalSelesaiMagang = detailData?.peserta?.tanggal_selesai || selectedPeserta?.tanggal_selesai;

  const hitungSisaHariMagang = (dateStr) => {
    if (!dateStr) return null;
    const end = new Date(dateStr);
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  const handleFinalisasiClick = async () => {
    if (!isCatatanFilled) {
      toastWarning("Catatan evaluasi mentor wajib diisi sebelum melakukan finalisasi nilai.");
      const el = document.getElementById("catatan-evaluasi-textarea");
      if (el) el.focus();
      return;
    }

    const sisaHari = hitungSisaHariMagang(tanggalSelesaiMagang);
    if (sisaHari != null && sisaHari > 0) {
      const formatTgl = (tglStr) => {
        try {
          const d = new Date(tglStr);
          return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        } catch {
          return tglStr;
        }
      };

      const konfirmasiDini = await confirmDialog({
        title: `Masa Magang Masih Aktif (Sisa ${sisaHari} Hari)`,
        text: `Masa magang peserta masih berjalan hingga ${formatTgl(tanggalSelesaiMagang)}. Akumulasi rasio presensi dan logbook belum mencapai periode penuh.\n\nJika Anda hanya ingin mencicil atau menyimpan evaluasi bertahap, disarankan memilih "Simpan Draf". Yakin tetap ingin memfinalisasi dan menerbitkan nilai resmi sekarang?`,
        confirmText: "Tetap Finalisasi Sekarang",
        cancelText: "Simpan Sebagai Draf Saja",
        icon: "warning",
      });

      if (!konfirmasiDini?.isConfirmed) {
        if (konfirmasiDini?.dismiss === "cancel") {
          handleFormSubmit("draf", { skipConfirm: true });
        }
        return;
      }
    }

    handleFormSubmit("final");
  };

  // Submit Handler (Hanya dari Step Terakhir)
  const handleFormSubmit = (statusTarget, options = {}) => {
    if (statusTarget === "final" && !isCatatanFilled) {
      toastWarning("Catatan evaluasi mentor wajib diisi sebelum melakukan finalisasi nilai.");
      const el = document.getElementById("catatan-evaluasi-textarea");
      if (el) el.focus();
      return;
    }

    const detailArray = [];
    indikatorList.forEach((kat) => {
      if (kat.kategori === "administratif") {
        detailArray.push(
          { id: "adm_1", kategori: "administratif", teks: "Ketertiban melakukan absensi (dihitung otomatis)", nilai: skorAbsensi, indeks: HitungIndeks(skorAbsensi) },
          { id: "adm_2", kategori: "administratif", teks: "Kelengkapan pengisian logbook (dihitung otomatis)", nilai: skorLogbook, indeks: HitungIndeks(skorLogbook) },
          { id: "adm_3", kategori: "administratif", teks: "Ketepatan waktu pengumpulan tugas (dihitung otomatis)", nilai: skorTugas, indeks: HitungIndeks(skorTugas) },
          { id: "adm_4", kategori: "administratif", teks: "Kelengkapan laporan akhir magang (dikonfirmasi)", nilai: skorLaporan, indeks: HitungIndeks(skorLaporan) }
        );
      } else {
        kat.items?.forEach((it) => {
          const val = getNum(scores[it.id]);
          detailArray.push({
            id: it.id,
            kategori: kat.kategori,
            teks: it.teks,
            nilai: val,
            indeks: HitungIndeks(val),
          });
        });
      }
    });

    const payload = {
      nilai_profesional: Number(avgProf.toFixed(2)),
      nilai_personal: Number(avgPers.toFixed(2)),
      nilai_sosial: Number(avgSos.toFixed(2)),
      nilai_administratif: Number(avgAdm.toFixed(2)),
      catatan_mentor: catatan,
      laporan_akhir_disetujui: laporanDisetujui,
      status_penilaian: statusTarget,
      detail_nilai: JSON.stringify(detailArray),
    };

    onSave(statusTarget, payload, totalNilaiAkhir, indeksAkhir, options);
  };

  // Definisi Tahapan (Semua bernuansa Biru Diskominfo seperti Pilar Profesional, kecuali tahap terakhir)
  const STEPS = [
    {
      key: "profesional",
      name: "Profesional",
      subName: "Kompetensi Teknis & Tugas",
      bobot: bobotSetting.profesional,
      avg: avgProf,
      icon: Briefcase,
      deskripsi: "Evaluasi kemampuan teknis spesifik, pemahaman instruksi, ketepatan tenggat waktu, dan kualitas hasil keluaran proyek magang.",
    },
    {
      key: "personal",
      name: "Personal",
      subName: "Integritas & Sikap Kerja",
      bobot: bobotSetting.personal,
      avg: avgPers,
      icon: UserCheck,
      deskripsi: "Evaluasi kedisiplinan kehadiran, kejujuran & integritas moral, inisiatif mandiri, antusiasme belajar, dan etika sikap kerja.",
    },
    {
      key: "sosial",
      name: "Sosial",
      subName: "Komunikasi & Kolaborasi",
      bobot: bobotSetting.sosial,
      avg: avgSos,
      icon: Users,
      deskripsi: "Evaluasi kemampuan komunikasi antarpribadi, kemampuan kerja sama tim, kesopanan dengan pegawai dinas, dan keterbukaan terhadap kritik/arahan.",
    },
    {
      key: "administratif",
      name: "Administratif",
      subName: "Presensi, Logbook & Laporan",
      bobot: bobotSetting.administratif,
      avg: avgAdm,
      icon: FileCheck2,
      deskripsi: "Rekam jejak administratif terintegrasi: kehadiran presensi tepat waktu, kelengkapan logbook harian, tugas mandiri, serta verifikasi laporan akhir magang.",
    },
    {
      key: "catatan",
      name: "Catatan & Finalisasi",
      subName: "Rangkuman & Penerbitan Nilai",
      bobot: null,
      avg: totalNilaiAkhir,
      icon: Award,
      deskripsi: "Rangkuman komprehensif kontribusi 4 pilar kompetensi, predikat mutu kelulusan, dan catatan evaluasi resmi dari mentor pembimbing.",
    },
  ];

  const currentStepData = STEPS[currentStep];

  // Navigasi Antar Step
  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Cek apakah siswa atau mahasiswa untuk label NIM / NISN
  const isSiswa = (
    selectedPeserta?.kategori_pendaftar ||
    detailData?.peserta?.kategori_pendaftar ||
    ""
  ).toLowerCase() === "siswa";

  const nomorInduk =
    selectedPeserta?.nim ||
    selectedPeserta?.nisn ||
    detailData?.peserta?.nim ||
    detailData?.peserta?.nisn;

  const fotoPeserta = selectedPeserta?.foto_profil || detailData?.peserta?.foto_profil;

  return (
    <div
      className={`relative w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[90vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 transition-all ${
        isDark
          ? "bg-[#141a24] text-slate-100 shadow-black/60"
          : "bg-white text-slate-900 shadow-slate-900/25"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── 1. HEADER MODAL SIGNATURE KOMINFO (WARNA ASLI KEMBALI) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4 sm:px-8 sm:py-5 shrink-0 border-0 text-white">
        {/* Ambient Glow */}
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
        {/* Watermark Icon */}
        <Scale
          className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.07] text-sky-200 pointer-events-none rotate-6"
          strokeWidth={1.2}
        />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {fotoPeserta ? (
                <img
                  src={getFileUrl(fotoPeserta)}
                  alt={selectedPeserta?.nama || "Peserta"}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#101F5C] to-[#00A5EC] flex items-center justify-center text-white font-black text-lg shadow-md ring-2 ring-white/20">
                  {selectedPeserta?.nama?.charAt(0) || "P"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <div className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-white/10 border border-white/15 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse text-sky-300" />
                  <span>Tahap {currentStep + 1} dari 5: {currentStepData.name}</span>
                </div>

                {selectedPeserta?.status_penilaian === "final" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Nilai Diterbitkan
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedPeserta?.status_penilaian === "draf" ? "Draf Tersimpan" : "Belum Dinilai"}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                {selectedPeserta?.nama || "Form Penilaian Peserta"}
              </h3>

              <div className="flex items-center gap-2 text-xs text-white/75 mt-0.5 truncate flex-wrap">
                {nomorInduk && (
                  <span>
                    {isSiswa ? "NISN" : "NIM"}:{" "}
                    <strong className="text-white font-mono">{nomorInduk}</strong>
                  </span>
                )}
                {selectedPeserta?.jurusan && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{selectedPeserta.jurusan}</span>
                  </>
                )}
                {selectedPeserta?.institusi && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[240px]">
                      {selectedPeserta.institusi}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── 2. STEP PROGRESS INDICATOR (PRESISI DI TENGAH-TENGAH & SOLID WHITE BEAD) ── */}
      <div className={`px-5 sm:px-8 py-2 border-b shrink-0 select-none pointer-events-none ${
        isDark ? "border-white/5 bg-[#121824]" : "border-slate-200/80 bg-slate-50/90"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs">
          {/* Sisi Kiri: Status Step Aktif */}
          <div className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 rounded-xl items-center justify-center text-xs font-black shadow-xs ring-2 ${
              currentStep === 4
                ? "bg-emerald-600 text-white ring-emerald-500/30"
                : "bg-[#004F9F] text-white ring-[#00A5EC]/30"
            }`}>
              <currentStepData.icon className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  currentStep === 4
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#004F9F] dark:text-[#00A5EC]"
                }`}>
                  Tahap {currentStep + 1} dari 5
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00A5EC]" />
                {currentStep < 3 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    • {indikatorList.find((k) => k.kategori === currentStepData.key)?.items?.length || 0} Butir
                  </span>
                )}
                {currentStep === 3 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    • 4 Aspek Administratif
                  </span>
                )}
                {currentStep === 4 && (
                  <span className="text-[10px] text-[#004F9F] dark:text-[#00A5EC] font-semibold">
                    • Akumulasi 4 Pilar (100%)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-tight">
                {currentStep === 4 ? "Catatan Evaluasi & Finalisasi Penilaian" : `Kompetensi ${currentStepData.name} ${currentStepData.bobot ? `(Bobot ${currentStepData.bobot}%)` : ""}`}
              </p>
            </div>
          </div>

          {/* Tengah: Stepper & Progress Bar Presisi di Tengah-tengah Tahap */}
          <div className="flex-1 max-w-sm sm:max-w-md lg:max-w-lg mx-0 sm:mx-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold px-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Progres Penilaian:</span>
                <span className="text-[#004F9F] dark:text-[#00A5EC] font-extrabold">{currentStepData.name}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] border border-blue-500/20">
                Tahap {currentStep + 1} dari 5 ({((currentStep + 1) * 20)}%)
              </span>
            </div>

            {/* Stepper dengan 5 Titik & Garis Penghubung yang Presisi di Tengah */}
            <div className="relative py-1">
              {/* Garis Track Abu-abu di Tengah Titik Milestone (Dari 10% s/d 90%) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full"
                style={{ left: "10%", right: "10%" }}
              />

              {/* Garis Biru Progres Berjalan yang Menyambungkan Titik secara Presisi */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#004F9F] via-[#0066CC] to-[#00A5EC] rounded-full transition-all duration-300 ease-out"
                style={{
                  left: "10%",
                  width: `${(currentStep / 4) * 80}%`,
                }}
              >
                {/* Bulatan Putih Solid di Ujung Garis (TIDAK Berkedip, Presisi di Ujung Terdepan) */}
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#004F9F] shadow-sm z-30 pointer-events-none" />
              </div>

              {/* 5 Kolom Grid untuk Menempatkan Titik Tepat di Tengah Masing-masing Tahap */}
              <div className="relative grid grid-cols-5 z-20">
                {STEPS.map((s, idx) => {
                  const isCompleted = idx < currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={s.key} className="flex items-center justify-center">
                      <div
                        className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                          isCompleted
                            ? "w-4 h-4 bg-emerald-500 text-white shadow-xs"
                            : isCurrent
                            ? "w-4 h-4 bg-[#004F9F] text-white ring-4 ring-blue-100 dark:ring-blue-900/40 shadow-xs"
                            : "w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : isCurrent ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Label 5 Tahapan Tepat di Bawah Titik Masing-masing */}
            <div className="grid grid-cols-5 text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center mt-0.5">
              {STEPS.map((s, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <span
                    key={s.key}
                    className={`transition-colors duration-200 truncate px-0.5 ${
                      isCompleted
                        ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                        : isCurrent
                        ? "text-[#004F9F] dark:text-[#00A5EC] font-black"
                        : "text-slate-400 dark:text-slate-500 font-medium"
                    }`}
                  >
                    {s.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sisi Kanan: Mini Preview Rata-rata & Kontribusi Poin */}
          <div className="text-right shrink-0">
            {currentStep < 4 ? (
              <div className="flex items-center gap-2.5 justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                    Rata-rata {currentStepData.name}
                  </span>
                  <div className="flex items-baseline justify-end gap-1.5 font-mono font-black text-xs">
                    <span className="text-slate-800 dark:text-white">
                      {currentStepData.avg.toFixed(1)} / 100
                    </span>
                    <span className="text-[10px] text-[#004F9F] dark:text-sky-400 font-sans font-bold">
                      (+{(currentStepData.avg * (currentStepData.bobot || 0) / 100).toFixed(1)} poin)
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-xs font-black border bg-blue-50 text-[#004F9F] border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800">
                  {HitungIndeks(currentStepData.avg)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                    Nilai Akhir Kumulatif
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {totalNilaiAkhir.toFixed(2)} / 100
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-xs">
                  {indeksAkhir}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. STEP CONTENT BODY (BERSIH, FOKUS & BEBAS DARI BANNER BERLEBIHAN) ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 sm:px-7">
        <div className="space-y-4">
          {/* STEP 0, 1, 2: PILAR KOMPETENSI (SEBARIS 2 KOTAK BERSIH & PROPORSIAL) */}
          {currentStep < 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indikatorList
                .find((k) => k.kategori === currentStepData.key)
                ?.items?.map((it, idx) => {
                    const numVal = Number(scores[it.id] ?? 85) || 0;
                    const indeks = HitungIndeks(numVal);
                    const predikat = getPredikatRingkas(indeks);
                    const badgeClass = getIndeksBadgeClass(indeks);

                    return (
                      <div
                        key={it.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isDark
                            ? "border-white/10 bg-[#161d2b]/90 hover:border-blue-500/40 hover:bg-[#1a2335]"
                            : "border-slate-200/90 bg-white hover:border-[#004F9F]/40 hover:shadow-md"
                        }`}
                      >
                        <div>
                          {/* 1. Baris Atas: Nomor + Judul Indikator (Kiri) vs Badge Indeks (Pojok Kanan Atas) */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[#004F9F] dark:text-sky-400 font-black text-xs border border-blue-500/20">
                                {idx + 1}
                              </span>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                {it.teks}
                              </h5>
                            </div>

                            {/* Badge Indeks & Predikat di Pojok Kanan Atas (Ukuran Lebih Ringkas) */}
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black border tracking-wide shrink-0 whitespace-nowrap shadow-2xs ${badgeClass}`}
                            >
                              Indeks {indeks} • {predikat}
                            </span>
                          </div>
                        </div>

                        {/* 2. Baris Bawah: Interactive Range Slider & Tombol Preset Benchmark */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                          {/* Slider Range */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                              <span>0 Poin</span>
                              <span className="font-bold text-[#004F9F] dark:text-sky-400 text-[11px]">
                                Skor: {numVal} / 100
                              </span>
                              <span>100 Poin</span>
                            </div>

                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={numVal}
                              onChange={(e) => {
                                setIsModified(true);
                                setScores((prev) => ({
                                  ...prev,
                                  [it.id]: Number(e.target.value),
                                }));
                              }}
                              style={{
                                background: `linear-gradient(to right, #004F9F 0%, #004F9F ${numVal}%, ${
                                  isDark ? "#334155" : "#e2e8f0"
                                } ${numVal}%, ${isDark ? "#334155" : "#e2e8f0"} 100%)`,
                              }}
                              className="w-full cursor-pointer h-2 rounded-full appearance-none transition-all shadow-inner [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#004F9F] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#004F9F] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
                            />
                          </div>

                          {/* Tombol Shortcut Preset Cepat */}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
                              Preset Cepat:
                            </span>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {[70, 80, 85, 95].map((presetVal) => (
                                <button
                                  key={presetVal}
                                  type="button"
                                  onClick={() => {
                                    setIsModified(true);
                                    setScores((prev) => ({
                                      ...prev,
                                      [it.id]: presetVal,
                                    }));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                    numVal === presetVal
                                      ? "bg-[#004F9F] text-white border-[#004F9F] shadow-xs"
                                      : isDark
                                      ? "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                                  }`}
                                >
                                  {presetVal} ({HitungIndeks(presetVal)})
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
          )}

          {/* STEP 3: PILAR ADMINISTRATIF (DASHBOARD METRIK OTOMATIS & INTERAKTIF) */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Presensi */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark ? "border-white/10 bg-[#161d2b]/90 hover:border-[#00A5EC]/40" : "border-slate-200/90 bg-white hover:border-[#004F9F]/40 hover:shadow-md"
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold">
                      <span className="w-7 h-7 rounded-lg bg-[#004F9F]/10 text-[#004F9F] dark:bg-[#00A5EC]/15 dark:text-[#00A5EC] flex items-center justify-center">
                        <CalendarClock className="w-4 h-4" />
                      </span>
                      <span>1. Ketertiban Presensi Kehadiran</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-[#00A5EC] dark:border-blue-800/60">
                      Otomatis Sistem
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {skorAbsensi.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getIndeksBadgeClass(HitungIndeks(skorAbsensi))}`}>
                      Indeks {HitungIndeks(skorAbsensi)} • {getPredikatRingkas(HitungIndeks(skorAbsensi))}
                    </span>
                  </div>

                  {/* Progress Bar Meter */}
                  <div className="mt-2.5 w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, skorAbsensi))}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 leading-relaxed">
                  Dihitung otomatis: Hadir tepat waktu (100 poin), Terlambat (75 poin), Izin/Sakit (50 poin), dan Alfa (0 poin).
                </p>
              </div>

              {/* 2. Logbook */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark ? "border-white/10 bg-[#161d2b]/90 hover:border-[#00A5EC]/40" : "border-slate-200/90 bg-white hover:border-[#004F9F]/40 hover:shadow-md"
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold">
                      <span className="w-7 h-7 rounded-lg bg-[#004F9F]/10 text-[#004F9F] dark:bg-[#00A5EC]/15 dark:text-[#00A5EC] flex items-center justify-center">
                        <NotebookPen className="w-4 h-4" />
                      </span>
                      <span>2. Kelengkapan Pengisian Logbook</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-[#00A5EC] dark:border-blue-800/60">
                      Otomatis Sistem
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {skorLogbook.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getIndeksBadgeClass(HitungIndeks(skorLogbook))}`}>
                      Indeks {HitungIndeks(skorLogbook)} • {getPredikatRingkas(HitungIndeks(skorLogbook))}
                    </span>
                  </div>

                  {/* Progress Bar Meter */}
                  <div className="mt-2.5 w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, skorLogbook))}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 leading-relaxed">
                  Dihitung dari rasio kelengkapan pengisian jurnal aktivitas harian kerja peserta selama masa aktif magang.
                </p>
              </div>

              {/* 3. Tugas */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark ? "border-white/10 bg-[#161d2b]/90 hover:border-[#00A5EC]/40" : "border-slate-200/90 bg-white hover:border-[#004F9F]/40 hover:shadow-md"
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold">
                      <span className="w-7 h-7 rounded-lg bg-[#004F9F]/10 text-[#004F9F] dark:bg-[#00A5EC]/15 dark:text-[#00A5EC] flex items-center justify-center">
                        <BookOpenCheck className="w-4 h-4" />
                      </span>
                      <span>3. Ketepatan Pengumpulan Tugas</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-[#00A5EC] dark:border-blue-800/60">
                      Otomatis Sistem
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {skorTugas.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getIndeksBadgeClass(HitungIndeks(skorTugas))}`}>
                      Indeks {HitungIndeks(skorTugas)} • {getPredikatRingkas(HitungIndeks(skorTugas))}
                    </span>
                  </div>

                  {/* Progress Bar Meter */}
                  <div className="mt-2.5 w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, skorTugas))}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 leading-relaxed">
                  Dihitung dari ketepatan waktu pengumpulan dan rata-rata skor tugas atau kuis yang telah di-ACC mentor.
                </p>
              </div>

              {/* 4. Laporan Akhir (Interaktif Mentor) */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark ? "border-white/10 bg-[#161d2b]/90 hover:border-emerald-500/40" : "border-slate-200/90 bg-white hover:border-emerald-500/40 hover:shadow-md"
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <FileCheckCorner className="w-4 h-4" />
                      </span>
                      <span>4. Persetujuan Laporan Akhir Magang</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Verifikasi Mentor
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {skorLaporan}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${laporanDisetujui ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"}`}>
                      {laporanDisetujui ? "Indeks A • Disetujui Penuh" : "Indeks E • Belum Disetujui"}
                    </span>
                  </div>

                  {/* Progress Bar Meter */}
                  <div className="mt-2.5 w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${laporanDisetujui ? "bg-emerald-500 w-full" : "bg-slate-300 dark:bg-slate-700 w-0"}`}
                    />
                  </div>
                </div>

                {/* Interactive Toggle Card ACC Laporan */}
                <button
                  type="button"
                  onClick={() => {
                    setIsModified(true);
                    setLaporanDisetujui(!laporanDisetujui);
                  }}
                  className={`mt-3 w-full p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer select-none group ${
                    laporanDisetujui
                      ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-400/50 dark:from-emerald-950/30 dark:border-emerald-700/60 shadow-xs hover:border-emerald-500"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-2xs"
                  }`}
                >
                  <div className="text-left">
                    <span className={`text-xs font-bold block leading-tight ${
                      laporanDisetujui ? "text-emerald-900 dark:text-emerald-200" : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {laporanDisetujui ? "Laporan Akhir Di-ACC Mentor" : "Persetujuan Laporan Akhir"}
                    </span>
                    <span className={`text-[10px] leading-none mt-0.5 block ${
                      laporanDisetujui ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {laporanDisetujui ? "Status: Terverifikasi oleh Mentor" : "Klik untuk berikan ACC Mentor"}
                    </span>
                  </div>

                  {/* Modern Toggle Switch Indicator */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                        laporanDisetujui
                          ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {laporanDisetujui ? "ACC (100%)" : "Belum (0%)"}
                    </span>
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        laporanDisetujui
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          laporanDisetujui ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TAHAP TERAKHIR (RANGKUMAN RESMI & CATATAN EVALUASI) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Grand Banner Nilai Akhir Kumulatif (Hero Card Resmi - Selaras dengan Header Modal) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-400/20">
                {/* Glow & Watermark */}
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
                <Award className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.07] text-sky-200 pointer-events-none rotate-6" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                        Rangkuman Nilai Akhir Resmi
                      </span>
                      <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Semua 4 Pilar Siap Diterbitkan
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {totalNilaiAkhir.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-sky-200">/ 100</span>
                      <span className="px-3 py-1 rounded-xl text-sm font-black bg-white/20 text-white backdrop-blur-xs border border-white/25 shadow-sm">
                        Indeks {indeksAkhir}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-sm">
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-200 mb-0.5">
                      Predikat Mutu Kelulusan
                    </div>
                    <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{predikatAkhir}</span>
                    </div>
                    <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                      {indeksAkhir === "A" && "Peserta menunjukkan performa yang sangat baik dan melampaui seluruh target capaian magang."}
                      {indeksAkhir === "B" && "Peserta menunjukkan kinerja yang baik serta mampu menyelesaikan tugas magang dengan optimal."}
                      {indeksAkhir === "C" && "Peserta memenuhi kualifikasi dasar pelaksanaan magang dengan kinerja cukup."}
                      {(indeksAkhir === "D" || indeksAkhir === "E") && "Peserta memerlukan peningkatan pemahaman dan pembinaan lebih lanjut."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian 4 Kartu Pilar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Profesional */}
                <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? "border-white/10 bg-[#161d2b]/90" : "border-slate-200/90 bg-white shadow-2xs hover:shadow-sm"
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                      <Briefcase className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>1. Profesional</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800 font-black">
                      {bobotSetting.profesional}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {avgProf.toFixed(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getIndeksBadgeClass(HitungIndeks(avgProf))}`}>
                      Indeks {HitungIndeks(avgProf)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span>Kontribusi:</span>
                    <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                      +{(avgProf * bobotSetting.profesional / 100).toFixed(2)} poin
                    </strong>
                  </div>
                </div>

                {/* 2. Personal */}
                <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? "border-white/10 bg-[#161d2b]/90" : "border-slate-200/90 bg-white shadow-2xs hover:shadow-sm"
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                      <UserCheck className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>2. Personal</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800 font-black">
                      {bobotSetting.personal}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {avgPers.toFixed(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getIndeksBadgeClass(HitungIndeks(avgPers))}`}>
                      Indeks {HitungIndeks(avgPers)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span>Kontribusi:</span>
                    <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                      +{(avgPers * bobotSetting.personal / 100).toFixed(2)} poin
                    </strong>
                  </div>
                </div>

                {/* 3. Sosial */}
                <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? "border-white/10 bg-[#161d2b]/90" : "border-slate-200/90 bg-white shadow-2xs hover:shadow-sm"
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                      <Users className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>3. Sosial</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800 font-black">
                      {bobotSetting.sosial}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {avgSos.toFixed(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getIndeksBadgeClass(HitungIndeks(avgSos))}`}>
                      Indeks {HitungIndeks(avgSos)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span>Kontribusi:</span>
                    <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                      +{(avgSos * bobotSetting.sosial / 100).toFixed(2)} poin
                    </strong>
                  </div>
                </div>

                {/* 4. Administratif */}
                <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? "border-white/10 bg-[#161d2b]/90" : "border-slate-200/90 bg-white shadow-2xs hover:shadow-sm"
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                      <FileCheckCorner className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>4. Administratif</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#004F9F] border border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800 font-black">
                      {bobotSetting.administratif}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {avgAdm.toFixed(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getIndeksBadgeClass(HitungIndeks(avgAdm))}`}>
                      Indeks {HitungIndeks(avgAdm)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span>Kontribusi:</span>
                    <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                      +{(avgAdm * bobotSetting.administratif / 100).toFixed(2)} poin
                    </strong>
                  </div>
                </div>
              </div>

              {/* Form Catatan Evaluasi & Ulasan Kinerja Mentor */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Catatan Evaluasi, Ulasan Kinerja, & Rekomendasi Mentor:</span>
                    <span className="text-rose-500 dark:text-rose-400 font-bold text-[11px]">* (Wajib diisi)</span>
                  </label>
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                    (Dicantumkan resmi pada Rapor Transkrip Nilai Peserta)
                  </span>
                </div>
                <textarea
                  id="catatan-evaluasi-textarea"
                  rows={4}
                  value={catatan}
                  onChange={(e) => {
                    setIsModified(true);
                    setCatatan(e.target.value);
                  }}
                  placeholder="Tuliskan ulasan kinerja, apresiasi atas capaian kerja, serta saran pengembangan untuk peserta bimbingan ini..."
                  className={`w-full rounded-2xl border p-4 text-xs sm:text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 leading-relaxed shadow-2xs text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                    !isCatatanFilled
                      ? "border-amber-300 dark:border-amber-700/60 focus:ring-amber-500"
                      : "border-slate-300 dark:border-white/15 focus:ring-[#004F9F]"
                  }`}
                />
                {!isCatatanFilled && (
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 -mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Catatan evaluasi wajib diisi untuk dapat menerbitkan nilai final.</span>
                  </p>
                )}

                {/* Template Rekomendasi Cepat */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Saran Kalimat Cepat (Klik untuk menyisipkan):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_CATATAN.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIsModified(true);
                          if (catatan.trim()) {
                            setCatatan(`${catatan.trim()} ${tpl}`);
                          } else {
                            setCatatan(tpl);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border text-[11px] text-left transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-[#004F9F] hover:text-[#004F9F] dark:hover:border-sky-400 dark:hover:text-sky-400 cursor-pointer shadow-2xs hover:scale-101 active:scale-99"
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Perbedaan Simpan Draf vs Finalisasi */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                isDark ? "border-white/5 bg-slate-800/40 text-slate-300" : "border-slate-200/80 bg-slate-50 text-slate-600"
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 text-[#004F9F] dark:text-[#00A5EC] mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Panduan Penerbitan: </strong>
                  Gunakan <strong className="text-amber-700 dark:text-amber-400">Simpan Draf</strong> untuk menyimpan nilai sementara tanpa mempublikasikannya. Klik <strong className="text-emerald-700 dark:text-emerald-400">Finalisasi & Terbitkan Nilai</strong> untuk membekukan penilaian secara permanen dan menerbitkan transkrip nilai resmi peserta.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. FOOTER MODAL (WIZARD NAVIGATION & AKSI) ── */}
      <div
        className={`p-4 sm:px-8 sm:py-4.5 border-t flex items-center justify-between gap-4 shrink-0 ${
          isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
        }`}
      >
        {/* Info di Sisi Kiri (Hanya muncul untuk Langkah 1-4, langkah 5 dihapus agar lebih lega) */}
        {currentStep < 4 ? (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
            <span>
              {currentStep === 0 && "Langkah 1: Berikan skor kompetensi teknis, pemahaman tugas, dan kualitas kerja peserta."}
              {currentStep === 1 && "Langkah 2: Berikan skor kedisiplinan, integritas, inisiatif, dan etika kerja peserta."}
              {currentStep === 2 && "Langkah 3: Berikan skor kemampuan komunikasi dan kerja sama peserta di lingkungan dinas."}
              {currentStep === 3 && "Langkah 4: Tinjau kalkulasi otomatis absensi, logbook, tugas, serta persetujuan laporan akhir."}
            </span>
          </div>
        ) : (
          /* Pada Langkah 5: Tombol Sebelumnya berada di Pojok Kiri */
          <div>
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={saving}
              className={`group/prev inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover/prev:-translate-x-0.5" />
              <span>Sebelumnya</span>
            </button>
          </div>
        )}

        {/* Tombol Aksi di Sisi Kanan */}
        <div className="flex items-center justify-end gap-3">
          {currentStep === 0 ? (
            <button
              type="button"
              onClick={handleAttemptClose}
              disabled={saving}
              className={`px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              }`}
            >
              Batal
            </button>
          ) : currentStep < 4 ? (
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={saving}
              className={`group/prev flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover/prev:-translate-x-0.5" />
              <span>Sebelumnya</span>
            </button>
          ) : null}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="group/btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border-0"
            >
              <span>Lanjut ke {STEPS[currentStep + 1].name}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleFormSubmit("draf")}
                disabled={saving}
                className="group/draft inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Save className="w-4 h-4 transition-transform duration-300 group-hover/draft:scale-115 group-hover/draft:-rotate-12" />
                <span>Simpan Draf</span>
              </button>

              <button
                type="button"
                onClick={handleFinalisasiClick}
                disabled={saving}
                className={`group/final inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl border-0 transition-all duration-200 ${
                  saving || !isCatatanFilled
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                }`}
                title={!isCatatanFilled ? "Catatan evaluasi wajib diisi untuk melakukan finalisasi nilai (Klik untuk info)" : undefined}
              >
                <CheckCircle2 className={`w-4 h-4 transition-transform duration-300 ${
                  !isCatatanFilled || saving ? "" : "group-hover/final:scale-115 group-hover/final:rotate-12"
                }`} />
                <span>{saving ? "Menerbitkan..." : "Finalisasi & Terbitkan Nilai"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const PenilaianModalTabs = ({
  isOpen,
  onClose,
  selectedPeserta,
  detailData,
  onSave,
  saving,
  isDark,
}) => {
  // Lock scroll background saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !detailData) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm overflow-hidden"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <PenilaianFormBody
        key={detailData?.peserta?.id || selectedPeserta?.peserta_id || selectedPeserta?.id || "form"}
        onClose={onClose}
        selectedPeserta={selectedPeserta}
        detailData={detailData}
        onSave={onSave}
        saving={saving}
        isDark={isDark}
      />
    </div>,
    document.body
  );
};

export default PenilaianModalTabs;
