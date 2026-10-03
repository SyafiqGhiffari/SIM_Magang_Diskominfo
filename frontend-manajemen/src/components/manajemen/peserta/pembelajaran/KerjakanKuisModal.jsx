import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  Check,
  Eye,
  FileQuestion,
  RefreshCw,
  Info,
  MessageSquareText,
  CirclePlay,
  Bookmark,
  BookmarkCheck,
  ListChecks,
  CheckCircle2,
  ZoomIn,
  Target,
} from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";
import { kumpulKuisPeserta } from "../../../../services/pembelajaranService";
import { toastSuccess, toastError, confirmDialog } from "../../../../utils/swal";

export const KerjakanKuisModal = ({
  tugas,
  isOpen,
  onClose,
  onSuccess,
  isDark: propIsDark,
}) => {
  const themeContext = useManajemenTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeContext?.isDark;
  const pengumpulan = tugas?.pengumpulan;
  const isKuis = tugas?.tipe_tugas === "kuis";
  const kuisData = tugas?.kuis_data;
  const jawabanKuisRaw = pengumpulan?.jawaban_kuis;

  // Parse konfigurasi kuis dari tugas
  const kuisConfig = useMemo(() => {
    if (!kuisData) return null;
    try {
      return typeof kuisData === "string"
        ? JSON.parse(kuisData)
        : kuisData;
    } catch {
      return null;
    }
  }, [kuisData]);

  // Parse hasil jawaban kuis yang tersimpan jika sudah pernah mengumpulkan
  const jawabanKuisSaved = useMemo(() => {
    if (!jawabanKuisRaw) return null;
    try {
      return typeof jawabanKuisRaw === "string"
        ? JSON.parse(jawabanKuisRaw)
        : jawabanKuisRaw;
    } catch {
      return null;
    }
  }, [jawabanKuisRaw]);

  const daftarSoal = useMemo(
    () => kuisConfig?.daftar_soal || [],
    [kuisConfig?.daftar_soal]
  );
  const totalSoal = daftarSoal.length;
  const kkm = kuisConfig?.kkm || 75;

  const isSudahPernahSubmit = !!pengumpulan;
  const isSudahDinilai = pengumpulan?.status === "dinilai";
  const isPerluRemidi =
    pengumpulan?.status_remidi === "perlu_remidi" ||
    (isSudahDinilai && (pengumpulan?.nilai || 0) < kkm);
  const isTuntas =
    pengumpulan?.status_remidi === "tuntas" ||
    (isSudahDinilai && (pengumpulan?.nilai || 0) >= kkm);

  // Batas pengerjaan
  const maksPercobaan = kuisConfig?.maks_percobaan ?? 2;
  const percobaanKe = pengumpulan?.percobaan_ke || 1;
  const bisaRemidi =
    kuisConfig?.izinkan_remidi &&
    (maksPercobaan === 0 || percobaanKe < maksPercobaan);

  // Mode Tampilan: "review" (melihat hasil/intro) | "pengerjaan" (saat menjawab)
  const [mode, setMode] = useState(() => (isSudahPernahSubmit ? "review" : "intro"));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [raguRagu, setRaguRagu] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Menutup preview perbesaran gambar jika tombol Escape ditekan
  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  // Timer Countdown State
  const durasiDetikAwal = (kuisConfig?.durasi_menit || 0) * 60;
  const [timeLeft, setTimeLeft] = useState(durasiDetikAwal);
  const timerRef = useRef(null);

  // Submit Jawaban
  const submitJawaban = async (dataJawaban) => {
    setSubmitting(true);
    try {
      const res = await kumpulKuisPeserta(tugas.id, {
        jawaban: dataJawaban,
      });

      const dataRes = res.data?.data || {};
      const statusRemidi = dataRes.status_remidi;
      const skorAkhir = dataRes.nilai_akhir;

      if (statusRemidi === "tuntas") {
        toastSuccess(
          `Selamat! Anda LULUS kuis ini dengan skor ${skorAkhir} poin (KKM: ${kkm})`
        );
      } else if (statusRemidi === "perlu_remidi") {
        toastSuccess(
          `Kuis selesai dengan skor ${skorAkhir} poin (Belum mencapai KKM ${kkm}). Anda dapat melakukan remidi.`
        );
      } else {
        toastSuccess("Jawaban kuis berhasil dikumpulkan dan sedang menunggu evaluasi mentor.");
      }

      setMode("review");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal kumpul kuis:", err);
      toastError(err.response?.data?.message || "Gagal mengumpulkan jawaban kuis");
    } finally {
      setSubmitting(false);
    }
  };

  // Ref auto submit agar interval selalu memanggil versi mutakhir tanpa dependensi melingkar
  const autoSubmitRef = useRef(null);
  useEffect(() => {
    autoSubmitRef.current = async () => {
      toastError("Waktu pengerjaan kuis telah habis! Jawaban Anda akan otomatis dikumpulkan.");
      await submitJawaban(answers);
    };
  });

  // Efek Timer Countdown
  useEffect(() => {
    if (mode === "pengerjaan" && durasiDetikAwal > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmitRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [mode, durasiDetikAwal]);

  // Handler Mulai Kuis
  const handleMulaiKuis = () => {
    setMode("pengerjaan");
    setCurrentIdx(0);
    setAnswers({});
    setRaguRagu({});
    setTimeLeft((kuisConfig?.durasi_menit || 0) * 60);
  };

  // Format detik ke format mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Toggle status Ragu-Ragu untuk soal tertentu
  const toggleRaguRagu = (soalId) => {
    setRaguRagu((prev) => ({
      ...prev,
      [soalId]: !prev[soalId],
    }));
  };

  // Pilih jawaban (mendukung multi jawaban untuk pilihan_ganda_kompleks)
  const handleSelectAnswer = (soalId, val, tipe = "pilihan_ganda") => {
    if (tipe === "pilihan_ganda_kompleks") {
      setAnswers((prev) => {
        const cur = prev[soalId]
          ? prev[soalId]
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [];
        let next;
        if (cur.includes(val)) {
          next = cur.filter((k) => k !== val);
        } else {
          next = [...cur, val];
        }
        next.sort();
        return {
          ...prev,
          [soalId]: next.join(","),
        };
      });
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [soalId]: val,
    }));
  };

  // Submit Manual oleh peserta
  const handleManualSubmit = async () => {
    const belumDijawab = daftarSoal.filter(
      (s) => !answers[s.id] || answers[s.id].trim() === ""
    ).length;
    const totalRagu = Object.values(raguRagu).filter(Boolean).length;

    let pesanKonfirmasi =
      "Apakah Anda yakin ingin menyelesaikan kuis ini? Pastikan seluruh jawaban telah Anda periksa kembali.";
    if (belumDijawab > 0 && totalRagu > 0) {
      pesanKonfirmasi = `Perhatian: Terdapat ${belumDijawab} butir soal belum dijawab dan ${totalRagu} butir soal ditandai ragu-ragu. Yakin ingin mengumpulkan sekarang?`;
    } else if (belumDijawab > 0) {
      pesanKonfirmasi = `Perhatian: Masih ada ${belumDijawab} butir soal yang belum Anda jawab. Yakin ingin mengumpulkan sekarang?`;
    } else if (totalRagu > 0) {
      pesanKonfirmasi = `Perhatian: Masih ada ${totalRagu} butir soal yang Anda tandai ragu-ragu. Yakin ingin mengumpulkan sekarang?`;
    }

    const konfirmasi = await confirmDialog({
      title: "Kumpulkan Jawaban Kuis?",
      text: pesanKonfirmasi,
      confirmText: "Ya, Selesaikan Kuis",
      cancelText: "Periksa Lagi",
      icon: belumDijawab > 0 || totalRagu > 0 ? "warning" : "question",
    });

    if (!konfirmasi.isConfirmed) return;

    await submitJawaban(answers);
  };

  // Kalkulasi statistik pengerjaan kuis yang logis, akurat, dan konsisten dengan nomor soal
  const { jumlahYakin, jumlahRaguRagu, jumlahBelumTerjawab, jumlahTerjawabTotal } = useMemo(() => {
    let yakin = 0;
    let ragu = 0;
    let belum = 0;
    let totalTerjawab = 0;

    daftarSoal.forEach((s) => {
      const isDone = typeof answers[s.id] === "string" && answers[s.id].trim() !== "";
      const isRagu = !!raguRagu[s.id];

      if (isDone) totalTerjawab++;

      if (isRagu) {
        ragu++;
      } else if (isDone) {
        yakin++;
      } else {
        belum++;
      }
    });

    return {
      jumlahYakin: yakin,
      jumlahRaguRagu: ragu,
      jumlahBelumTerjawab: belum,
      jumlahTerjawabTotal: totalTerjawab,
    };
  }, [daftarSoal, answers, raguRagu]);

  if (!isOpen || !tugas || !isKuis) return null;

  const currentSoal = daftarSoal[currentIdx];
  const isPG = currentSoal?.tipe === "pilihan_ganda";
  const isPGKompleks = currentSoal?.tipe === "pilihan_ganda_kompleks";
  const isChoice = isPG || isPGKompleks;

  const progressPersen = totalSoal > 0 ? Math.round((jumlahTerjawabTotal / totalSoal) * 100) : 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        mode === "pengerjaan" ? "p-0" : "p-3 sm:p-4"
      } bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]`}
      onClick={() => {
        if (!submitting && mode !== "pengerjaan") onClose();
      }}
    >
      <div
        className={`relative w-full ${
          mode === "pengerjaan"
            ? "w-screen h-screen max-w-none max-h-none rounded-none m-0 shadow-none"
            : "max-w-3xl max-h-[92vh] my-auto rounded-3xl shadow-2xl"
        } flex flex-col overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 transition-all duration-300 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-4 sm:px-8 sm:py-4.5 shrink-0 border-b border-white/10">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#00A5EC]/20 rounded-full blur-2xl pointer-events-none" />
          <FileQuestion
            className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 opacity-[0.045] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />
          <div className="relative flex items-center justify-between gap-3">
            {/* Sisi Kiri: Branding Ujian & Judul */}
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <FileQuestion className="w-5 h-5 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div className="min-w-0">
                {mode !== "pengerjaan" && (
                  <div className="inline-flex items-center gap-1.5 text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider text-[#00A5EC] bg-white/10 border border-white/10 rounded-full px-2 py-0.5 mb-1">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    <span>
                      {mode === "review"
                        ? "Evaluasi Hasil Kuis"
                        : "Kuis Interaktif Magang"}
                    </span>
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {tugas.judul}
                </h3>
              </div>
            </div>

            {/* Sisi Tengah / Kanan: Status Sesi & Tombol Tutup */}
            <div className="flex items-center gap-2.5 shrink-0">
              {mode === "pengerjaan" && (
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-[11px] font-bold text-white/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sesi Pengerjaan Aktif</span>
                </div>
              )}

              {/* Tombol Tutup (Saat tidak sedang ujian) */}
              {mode !== "pengerjaan" && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="group/close flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10 disabled:opacity-50"
                  title="Tutup (Esc)"
                >
                  <X className="w-4.5 h-4.5 transition-transform duration-300 group-hover/close:rotate-90 group-hover/close:scale-110" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 1. MODE INTRO: HALAMAN SAMBUTAN & ATURAN KUIS ── */}
        {mode === "intro" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
              {/* Banner Sambutan / Ketentuan Kuis */}
              <div className="rounded-3xl border border-blue-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-blue-50/30 to-white dark:from-white/[0.04] dark:to-transparent p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-sky-500/20 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs border border-blue-200/60 dark:border-sky-800/40 mt-0.5">
                      <FileQuestion className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                        Siap Memulai Pengerjaan Kuis?
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                        Bacalah setiap butir soal dengan teliti dan pilih alternatif jawaban yang paling akurat. Sistem akan menghitung akumulasi perolehan skor secara otomatis setelah seluruh soal dikerjakan.
                      </p>
                    </div>
                  </div>

                  {/* Batch Tes Pemahaman di Pojok Kanan */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-sky-800/40 shadow-2xs shrink-0 self-start">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    <span>Tes Pemahaman</span>
                  </span>
                </div>

                {/* Rincian 4 Kartu Metrik Modern */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {/* 1. Jumlah Soal */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <FileQuestion className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Jumlah Soal</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                      {totalSoal} Butir
                    </div>
                    <span className="text-[10px] text-slate-400">Pilihan Ganda &amp; Esai</span>
                  </div>

                  {/* 2. Standar KKM */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Award className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Standar KKM</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                      {kkm} Poin
                    </div>
                    <span className="text-[10px] text-slate-400">Batas Kelulusan</span>
                  </div>

                  {/* 3. Batas Waktu */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Batas Waktu</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                      {kuisConfig?.durasi_menit > 0 ? `${kuisConfig.durasi_menit} Menit` : "Tanpa Batas Waktu"}
                    </div>
                    <span className="text-[10px] text-slate-400">Hitung mundur</span>
                  </div>

                  {/* 4. Kesempatan Remidi */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-[#00A5EC]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Remidi</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#004F9F] dark:text-[#00A5EC]">
                      {kuisConfig?.izinkan_remidi ? (maksPercobaan ? `${maksPercobaan} Kali` : "Tak Terbatas") : "1 Kali Saja"}
                    </div>
                    <span className="text-[10px] text-slate-400">Evaluasi terbaik</span>
                  </div>
                </div>
              </div>

              {/* Petunjuk Tambahan Mentor (Jika Ada) */}
              {tugas.deskripsi && (
                <div className="rounded-2xl border-l-4 border-l-[#004F9F] dark:border-l-[#00A5EC] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-800/90 p-4 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <MessageSquareText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Petunjuk &amp; Arahan Khusus dari Mentor:</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                    {tugas.deskripsi}
                  </p>
                </div>
              )}

              {/* Alert Catatan Kesiapan */}
              <div className="rounded-2xl border border-blue-200/80 dark:border-sky-800/40 bg-blue-50/60 dark:bg-sky-950/20 p-3.5 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-sky-900/50 text-[#004F9F] dark:text-[#00A5EC]">
                  <Info className="w-3.5 h-3.5" />
                </span>
                <span className="leading-relaxed">
                  Pastikan koneksi internet stabil sebelum menekan tombol mulai. Timer pengerjaan kuis akan segera berjalan secara otomatis.
                </span>
              </div>
            </div>

            {/* ── FOOTER MODAL INTRO (KONSISTEN DENGAN MODAL LAIN) ── */}
            <div
              className={`px-6 py-4 sm:px-8 sm:py-5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md ${
                isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
              }`}
            >
              <div className="hidden sm:flex items-center gap-2.5 min-w-0 flex-1 pr-3 text-slate-500 dark:text-slate-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <Info className="w-3 h-3 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
                </span>
                <span className="font-medium text-[10.5px] sm:text-[11px] leading-snug line-clamp-2">
                  Klik Mulai Kerjakan Sekarang untuk membuka lembar soal kuis.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={handleMulaiKuis}
                  className="group/btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10 shrink-0"
                >
                  <CirclePlay className="w-4 h-4 text-white transition-transform duration-300 group-hover/btn:scale-110" />
                  <span>Mulai Kerjakan Sekarang</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── 2. MODE PENGERJAAN: DUA KOLOM (LEMBAR SOAL + SIDEBAR NAVIGASI) ── */}
        {mode === "pengerjaan" && currentSoal && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* ══ KOLOM KIRI: LEMBAR SOAL & JAWABAN ══ */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10">
              {/* Bar Subheader Soal: Nomor Soal, Tipe Soal & Bobot Nilai */}
              <div
                className={`px-5 sm:px-7 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                  isDark ? "bg-[#101620] border-white/10" : "bg-slate-50/90 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  {/* Badge Terpadu: Nomor Soal */}
                  <div className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-white/10 p-0.5 border border-slate-300/70 dark:border-white/10 shadow-2xs">
                    <span className="px-3 py-1 rounded-lg bg-[#0B1442] dark:bg-[#004F9F] text-white text-xs font-black tracking-wide shadow-xs">
                      Soal #{currentIdx + 1}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      dari {totalSoal} Soal
                    </span>
                  </div>

                  {/* Badge Tipe Soal */}
                  {/* Badge Tipe Soal (Konsisten Berwarna Biru) */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs bg-blue-50 text-[#004F9F] border-blue-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60">
                    <ListChecks className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isPGKompleks
                        ? "Pilihan Ganda Kompleks"
                        : isPG
                        ? "Pilihan Ganda Tunggal"
                        : "Soal Esai Terbuka"}
                    </span>
                  </div>

                  {/* Badge Ragu-Ragu (Jika Aktif) */}
                  {raguRagu[currentSoal.id] && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/80 animate-[fadeIn_0.2s_ease-out] shadow-2xs">
                      <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Ditandai Ragu</span>
                    </div>
                  )}
                </div>

                {/* Bobot Nilai Soal */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 shadow-2xs shrink-0">
                  <Award className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>
                    Bobot:{" "}
                    <strong className="text-slate-800 dark:text-white font-black">
                      {currentSoal.poin} Poin
                    </strong>
                  </span>
                </div>
              </div>

              {/* Konten Soal & Opsi Jawaban */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
                {/* Kotak Pertanyaan */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151c27] border border-slate-200/90 dark:border-white/10 border-l-4 border-l-[#004F9F] dark:border-l-[#00A5EC] shadow-xs space-y-4">
                  {/* Gambar Soal (Jika Ada) */}
                  {currentSoal.gambar && (
                    <div className="flex flex-col items-start gap-1.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(currentSoal.gambar);
                        }}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-black/30 shadow-xs hover:shadow-md transition-all duration-200 inline-block"
                        title="Klik untuk memperbesar gambar"
                      >
                        <img
                          src={currentSoal.gambar}
                          alt={`Ilustrasi Soal #${currentIdx + 1}`}
                          className="max-h-48 sm:max-h-56 w-auto max-w-full rounded-2xl object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        {/* Overlay Hover Perbesar */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
                          <ZoomIn className="w-4 h-4" />
                          <span>Klik untuk Memperbesar</span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 italic">
                        * Klik gambar untuk melihat ukuran penuh
                      </span>
                    </div>
                  )}

                  {/* Teks Pertanyaan */}
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentSoal.pertanyaan}
                  </h4>
                </div>

                {/* Input Jawaban: Pilihan Ganda & PG Kompleks */}
                {isChoice && (
                  <div className="space-y-3 pt-1">
                    {/* Header Petunjuk Pemilihan Opsi */}
                    <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {isPGKompleks ? (
                        <>
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 font-black text-[11px] shrink-0">
                            ✓
                          </span>
                          <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban.</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-[9px] shrink-0">
                            ●
                          </span>
                          <span>Pilihan Ganda: Pilih salah satu jawaban yang paling tepat.</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {currentSoal.opsi?.map((opsi) => {
                        const keysArray = (answers[currentSoal.id] || "")
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean);
                        const isSelected = isPGKompleks
                          ? keysArray.includes(opsi.key)
                          : answers[currentSoal.id] === opsi.key;

                        return (
                          <button
                            key={opsi.key}
                            type="button"
                            onClick={() =>
                              handleSelectAnswer(
                                currentSoal.id,
                                opsi.key,
                                isPGKompleks ? "pilihan_ganda_kompleks" : "pilihan_ganda"
                              )
                            }
                            className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex items-center gap-3.5 group shadow-2xs ${
                              isSelected
                                ? isPGKompleks
                                  ? "bg-emerald-50/90 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
                                  : "bg-blue-50/90 border-[#004F9F] dark:bg-sky-950/40 dark:border-sky-400 ring-2 ring-[#004F9F]/20 dark:ring-sky-500/30 shadow-[#004F9F]/10"
                                : isDark
                                ? "bg-[#161b22] border-white/10 hover:border-white/20 hover:bg-slate-800/40"
                                : "bg-white border-slate-200/90 hover:border-[#00A5EC]/60 hover:bg-blue-50/20"
                            }`}
                          >
                            {/* Huruf Opsi A, B, C, D... */}
                            <span
                              className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center font-black text-xs sm:text-sm transition-all duration-150 ${
                                isPGKompleks ? "rounded-lg" : "rounded-xl"
                              } ${
                                isSelected
                                  ? isPGKompleks
                                    ? "bg-emerald-600 text-white shadow-xs scale-105"
                                    : "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-xs scale-105"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover:bg-blue-100/60 dark:group-hover:bg-slate-700 group-hover:text-[#004F9F]"
                              }`}
                            >
                              {opsi.key}
                            </span>

                            {/* Teks Opsi Jawaban */}
                            <span
                              className={`text-xs sm:text-sm font-semibold flex-1 leading-snug ${
                                isSelected
                                  ? isPGKompleks
                                    ? "text-emerald-900 dark:text-emerald-200 font-bold"
                                    : "text-[#004F9F] dark:text-sky-200 font-bold"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {opsi.teks}
                            </span>

                            {/* Indikator Radio / Checkbox Sisi Kanan */}
                            <div className="shrink-0 flex items-center justify-center">
                              {isPGKompleks ? (
                                <div
                                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                                      : "border-slate-300 dark:border-white/20 group-hover:border-emerald-400"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-[#004F9F] dark:border-sky-400 bg-white dark:bg-slate-900 shadow-2xs"
                                      : "border-slate-300 dark:border-white/20 group-hover:border-[#00A5EC]"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#004F9F] dark:bg-sky-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input Jawaban: Esai */}
                {!isChoice && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                        Ketikkan Jawaban Anda Secara Lengkap:
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {answers[currentSoal.id]?.trim()?.length || 0} karakter
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      value={answers[currentSoal.id] || ""}
                      onChange={(e) => handleSelectAnswer(currentSoal.id, e.target.value)}
                      placeholder="Tuliskan elaborasi jawaban Anda secara jelas dan lengkap di sini..."
                      className={`w-full p-4 text-xs sm:text-sm rounded-2xl border font-medium leading-relaxed transition-all duration-200 min-h-[180px] sm:min-h-[220px] ${
                        isDark
                          ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                          : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F]"
                      } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20 shadow-2xs`}
                    />
                  </div>
                )}
              </div>

              {/* Footer Aksi Lembar Soal: Sebelumnya, Ragu-ragu, Berikutnya/Selesai */}
              <div
                className={`px-5 sm:px-7 py-3.5 sm:py-4 border-t shrink-0 flex items-center justify-between gap-2.5 ${
                  isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
                }`}
              >
                {/* Tombol Soal Sebelumnya */}
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className={`group/prev inline-flex items-center gap-1.5 px-4 sm:px-4.5 py-2.5 text-xs font-bold rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover/prev:-translate-x-1" />
                  <span>Soal Sebelumnya</span>
                </button>

                {/* Tombol Ragu-Ragu (Tengah) */}
                <button
                  type="button"
                  onClick={() => toggleRaguRagu(currentSoal.id)}
                  className={`group/ragu inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-black rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs ${
                    raguRagu[currentSoal.id]
                      ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/40"
                      : isDark
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-amber-50 text-amber-800 border-amber-300/80 hover:bg-amber-100/80"
                  }`}
                  title="Tandai nomor ini jika masih ragu-ragu untuk diperiksa kembali nanti"
                >
                  {raguRagu[currentSoal.id] ? (
                    <BookmarkCheck className="w-4 h-4 fill-white text-white transition-transform duration-200 group-hover/ragu:scale-110" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover/ragu:scale-110" />
                  )}
                  <span>{raguRagu[currentSoal.id] ? "Ragu-Ragu (Aktif)" : "Ragu-Ragu"}</span>
                </button>

                {/* Tombol Soal Berikutnya (Disembunyikan pada soal terakhir agar tidak double dengan kumpulkan) */}
                <div className="flex items-center gap-2">
                  {currentIdx < totalSoal - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => Math.min(totalSoal - 1, prev + 1))}
                      className="group/next inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border border-white/10"
                    >
                      <span>Soal Berikutnya</span>
                      <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover/next:translate-x-1" />
                    </button>
                  ) : (
                    <div className="w-24 sm:w-28 invisible" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>

            {/* ══ KOLOM KANAN: SIDEBAR NAVIGASI SOAL & PROGRES ══ */}
            <div
              className={`w-full lg:w-80 xl:w-96 shrink-0 flex flex-col border-t lg:border-t-0 ${
                isDark ? "bg-[#0f141c]" : "bg-slate-50/70"
              }`}
            >
              {/* Header Sidebar & Ringkasan Progres */}
              <div
                className={`p-4 sm:p-5 border-b shrink-0 space-y-3.5 ${
                  isDark ? "border-white/10 bg-[#131922]" : "border-slate-200/80 bg-white"
                }`}
              >
                {/* ── CARD HUD SISA WAKTU (Desain Modern CBT) ── */}
                {durasiDetikAwal > 0 && (
                  <div
                    className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl shadow-sm border transition-all duration-300 ${
                      timeLeft <= 120
                        ? "bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 border-rose-400 text-white animate-pulse"
                        : "bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] border-white/10 text-white"
                    }`}
                  >
                    {/* Glowing Aura Accent */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#00A5EC]/20 rounded-full blur-xl pointer-events-none" />

                    <div className="relative z-10 space-y-2.5">
                      {/* Baris Atas: Status Ujian & Durasi Total */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[9.5px] font-bold text-sky-200">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              timeLeft <= 120
                                ? "bg-rose-300 animate-ping"
                                : "bg-[#00A5EC] animate-pulse"
                            }`}
                          />
                          <span>
                            {timeLeft <= 120
                              ? "Waktu Kritis!"
                              : "Ujian Berlangsung"}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg shrink-0">
                          Durasi: {kuisConfig?.durasi_menit || Math.round(durasiDetikAwal / 60)}m
                        </span>
                      </div>

                      {/* Baris Utama: Countdown Timer & Ikon Jam */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00A5EC]">
                          <Clock className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none text-white block">
                            {formatTime(timeLeft)}
                          </span>
                          <span className="text-[10px] font-medium text-white/60 block mt-1 tracking-wide uppercase">
                            Sisa Waktu Pengerjaan
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header Progres Pengerjaan (Ukuran Lebih Ringkas & Rapi) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-bold text-[#0B1442] dark:text-white flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>Progres Pengerjaan</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-black text-[#004F9F] dark:text-[#00A5EC]">
                      {jumlahTerjawabTotal} / {totalSoal} Selesai ({progressPersen}%)
                    </span>
                  </div>

                  {/* Progress Bar (Lebih Tipis & Elegan) */}
                  <div className="h-1.5 sm:h-2 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00A5EC] to-[#004F9F] transition-all duration-300"
                      style={{ width: `${progressPersen}%` }}
                    />
                  </div>
                </div>

                {/* 3 Mini Stat Cards: Terjawab, Ragu, Belum (Kompak & Formal) */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {/* Terjawab */}
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all ${
                      isDark
                        ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                        : "bg-emerald-50 border-emerald-200/80 text-emerald-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Terjawab</span>
                    </div>
                    <span className="text-sm sm:text-base font-black leading-none mt-1 block">
                      {jumlahYakin}
                    </span>
                  </div>

                  {/* Ragu-Ragu */}
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all ${
                      isDark
                        ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                        : "bg-amber-50 border-amber-200/80 text-amber-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-amber-600 dark:text-amber-400">
                      <Bookmark className="w-2.5 h-2.5 fill-amber-500" />
                      <span>Ragu</span>
                    </div>
                    <span className="text-sm sm:text-base font-black leading-none mt-1 block">
                      {jumlahRaguRagu}
                    </span>
                  </div>

                  {/* Belum Dijawab */}
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all ${
                      isDark
                        ? "bg-slate-900 border-white/10 text-slate-300"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-slate-400">
                      <FileQuestion className="w-2.5 h-2.5" />
                      <span>Belum</span>
                    </div>
                    <span className="text-sm sm:text-base font-black leading-none mt-1 block">
                      {jumlahBelumTerjawab}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Daftar Nomor Soal */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-modal-scrollbar space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Daftar Nomor Soal
                  </span>
                  <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                    Aktif: #{currentIdx + 1}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {daftarSoal.map((s, idx) => {
                    const isDone = !!answers[s.id] && answers[s.id].trim() !== "";
                    const isRagu = !!raguRagu[s.id];
                    const isCurrent = idx === currentIdx;

                    const btnClass = isCurrent
                      ? isRagu
                        ? "bg-amber-500 text-white border-2 border-amber-400 ring-3 ring-amber-400/50 shadow-md font-black scale-105 z-10"
                        : isDone
                        ? "bg-emerald-600 text-white border-2 border-emerald-400 ring-3 ring-emerald-400/50 shadow-md font-black scale-105 z-10"
                        : "bg-[#0B1442] dark:bg-[#101F5C] text-white border-2 border-[#00A5EC] ring-3 ring-[#00A5EC]/50 shadow-md font-black scale-105 z-10"
                      : isRagu
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700/80 font-bold hover:bg-amber-100 hover:border-amber-400"
                      : isDone
                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700/80 font-bold hover:bg-emerald-100 hover:border-emerald-400"
                      : isDark
                      ? "bg-slate-800/60 text-slate-300 border border-white/10 hover:bg-slate-700 hover:text-white"
                      : "bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 shadow-2xs";

                    return (
                      <button
                        key={s.id || idx}
                        type="button"
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-11 sm:h-12 rounded-xl text-xs sm:text-[13px] transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 relative group ${btnClass}`}
                        title={`Soal #${idx + 1}: ${
                          isRagu
                            ? "Ragu-Ragu"
                            : isDone
                            ? "Sudah Dijawab"
                            : "Belum Dijawab"
                        }`}
                      >
                        <span className="font-black">{idx + 1}</span>

                        {/* Tanda Centang untuk nomor terjawab (jika tidak ragu) */}
                        {isDone && !isRagu && (
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] shrink-0 ${
                              isCurrent
                                ? "text-white"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          />
                        )}

                        {/* Ikon Bookmark untuk soal ragu-ragu */}
                        {isRagu && (
                          <Bookmark
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isCurrent
                                ? "fill-white text-white"
                                : "fill-amber-500 text-amber-500"
                            }`}
                          />
                        )}

                        {/* Titik indikator kecil jika nomor sudah diisi jawaban sekaligus ditandai ragu */}
                        {isRagu && isDone && (
                          <span
                            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white shadow-xs"
                            title="Jawaban terisi (Ragu-Ragu)"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Keterangan Status (Legend) */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Keterangan Status:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Terjawab</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                        <Bookmark className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      </span>
                      <span>Ragu-Ragu</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 shrink-0" />
                      <span>Belum Dijawab</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-[#0B1442] dark:bg-[#101F5C] text-[#00A5EC] border-2 border-[#00A5EC] shrink-0" />
                      <span>Sedang Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Card Tips Pengerjaan (Ukuran Ringkas & Proporsional) */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-sky-950/20 border border-blue-200/60 dark:border-sky-800/30 flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-[#00A5EC] shrink-0 mt-0.5" />
                  <div className="text-[9.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-white block text-[10px] mb-0.5">
                      Petunjuk Ujian:
                    </span>
                    Klik nomor untuk berpindah soal secara instan. Tandai nomor dengan tombol <strong>Ragu-Ragu</strong> bila ingin memeriksa kembali nanti.
                  </div>
                </div>
              </div>

              {/* Footer Sidebar: Tombol Kumpulkan */}
              <div
                className={`p-4 border-t shrink-0 ${
                  isDark ? "border-white/10 bg-[#131922]" : "border-slate-200/80 bg-white"
                }`}
              >
                {/* Tombol Kumpulkan Cepat (Warna Hijau Solid Tanpa Pergantian Warna, Animasi Ikon Saat Hover) */}
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="group/submit w-full py-2.5 sm:py-3 px-4 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-transform duration-150 cursor-pointer flex items-center justify-center gap-2 border border-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim Jawaban...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover/submit:translate-x-1 group-hover/submit:-translate-y-0.5" />
                      <span>Kumpulkan &amp; Selesaikan Kuis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. MODE REVIEW: HASIL PENILAIAN & PEMBAHASAN ── */}
        {mode === "review" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-modal-scrollbar">
            {/* Banner Hasil Capaian Nilai */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border text-center space-y-2.5 relative overflow-hidden shadow-2xs ${
                isTuntas
                  ? "bg-gradient-to-br from-emerald-500/[0.07] via-teal-500/[0.03] to-white dark:from-emerald-950/25 dark:via-slate-900/60 dark:to-[#141a24] border-emerald-200/90 dark:border-emerald-800/50"
                  : isPerluRemidi
                  ? "bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-white dark:from-amber-950/25 dark:via-slate-900/60 dark:to-[#141a24] border-amber-200/90 dark:border-amber-800/50"
                  : "bg-gradient-to-br from-blue-500/[0.07] via-sky-500/[0.03] to-white dark:from-blue-950/25 dark:via-slate-900/60 dark:to-[#141a24] border-blue-200/90 dark:border-sky-800/50"
              }`}
            >
              {/* Background ambient decorative glow */}
              <div
                className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 ${
                  isTuntas
                    ? "bg-emerald-400"
                    : isPerluRemidi
                    ? "bg-amber-400"
                    : "bg-sky-400"
                }`}
              />

              {/* Icon Container with glowing double ring */}
              <div className="flex justify-center">
                <div className="relative">
                  <span
                    className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl shadow-md ring-4 ${
                      isTuntas
                        ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 ring-emerald-100 dark:ring-emerald-950/70"
                        : isPerluRemidi
                        ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20 ring-amber-100 dark:ring-amber-950/70"
                        : "bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-white shadow-blue-500/20 ring-blue-100 dark:ring-blue-950/70"
                    }`}
                  >
                    {isTuntas ? (
                      <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : isPerluRemidi ? (
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </span>
                </div>
              </div>

              {/* Status Badge, Score & Guidance Description */}
              <div className="space-y-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                    isTuntas
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60"
                      : isPerluRemidi
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300/80 dark:border-blue-700/60"
                  }`}
                >
                  {isTuntas ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>LULUS / TUNTAS • MEMENUHI KKM</span>
                    </>
                  ) : isPerluRemidi ? (
                    <>
                      <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>PERLU REMIDI • DI BAWAH STANDAR KKM</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-blue-600 dark:text-sky-400" />
                      <span>MENUNGGU EVALUASI ESAI</span>
                    </>
                  )}
                </span>

                <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {pengumpulan?.nilai ?? "-"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">/ 100 Poin</span>
                </div>

                <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isTuntas
                    ? `Selamat! Nilai Anda telah memenuhi batas kelulusan standar KKM (${kkm} poin). Kompetensi materi penugasan ini telah tercapai dengan baik.`
                    : isPerluRemidi
                    ? `Nilai Anda belum mencapai standar kelulusan KKM (${kkm} poin). ${
                        bisaRemidi
                          ? `Anda memiliki kesempatan remidi (Percobaan ke-${percobaanKe + 1}${maksPercobaan ? ` dari maksimal ${maksPercobaan} kali` : " • Tanpa Batas Kuota"}). Silakan pelajari masukan dari mentor sebelum memulai ujian kembali.`
                          : "Batas maksimal kesempatan percobaan remidi telah selesai digunakan."
                      }`
                    : "Jawaban pilihan ganda telah selesai diperiksa otomatis. Nilai akhir akan ditetapkan setelah mentor mengevaluasi jawaban esai Anda."}
                </p>
              </div>

              {/* 3 Metric Cards for Rich Information Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-left">
                {/* 1. Nilai Anda */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <Award className="w-3 h-3 text-amber-500" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider">Perolehan Nilai</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {pengumpulan?.nilai ?? 0} Poin
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    {isTuntas ? "Status: Lulus" : isPerluRemidi ? "Status: Belum Lolos" : "Status: Sementara"}
                  </span>
                </div>

                {/* 2. Standar KKM */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <Target className="w-3 h-3 text-rose-500" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider">Standar KKM</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                    {kkm} Poin
                  </div>
                  <span className="text-[9.5px] text-slate-400">Batas Kelulusan</span>
                </div>

                {/* 3. Kesempatan Remidi */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <RotateCcw className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider">Kesempatan Remidi</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {bisaRemidi
                      ? `Percobaan #${percobaanKe + 1}`
                      : isTuntas
                      ? "Tidak Perlu"
                      : "Habis"}
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    {bisaRemidi
                      ? maksPercobaan
                        ? `Maksimal ${maksPercobaan} kali`
                        : "Percobaan tidak terbatas"
                      : "Evaluasi selesai"}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Feedback Mentor jika ada */}
            {pengumpulan?.catatan_mentor && (
              <div className="p-3 sm:p-3.5 rounded-xl border border-amber-200/90 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/70 via-orange-50/20 to-white dark:from-amber-950/25 dark:via-slate-900/40 dark:to-transparent border-l-4 border-l-amber-500 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                      <MessageSquareText className="w-3 h-3" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Catatan &amp; Masukan dari Mentor:
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                    Evaluasi Kuis
                  </span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] text-slate-700 dark:text-slate-300 italic pl-6 leading-relaxed">
                  "{pengumpulan.catatan_mentor}"
                </p>
              </div>
            )}

            {/* Pembahasan Butir Soal (Jika diizinkan atau sudah tuntas) */}
            {kuisConfig?.tampilkan_pembahasan && jawabanKuisSaved?.detail_per_soal && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Pembahasan &amp; Kunci Jawaban</span>
                </h4>

                <div className="space-y-3">
                  {daftarSoal.map((soal, sIdx) => {
                    const detail = jawabanKuisSaved.detail_per_soal[soal.id];
                    const isPGChoice =
                      soal.tipe === "pilihan_ganda" ||
                      soal.tipe === "pilihan_ganda_kompleks";
                    const isBenar = detail?.benar;

                    return (
                      <div
                        key={soal.id || sIdx}
                        className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          isPGChoice
                            ? isBenar
                              ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/15 dark:border-emerald-800/40"
                              : "bg-rose-50/40 border-rose-200 dark:bg-rose-950/15 dark:border-rose-800/40"
                            : "bg-purple-50/30 border-purple-200 dark:bg-purple-950/15 dark:border-purple-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            #{sIdx + 1}. {soal.pertanyaan}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              isBenar
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-600 text-white"
                            }`}
                          >
                            {detail?.poin_diperoleh ?? 0} / {soal.poin} Poin
                          </span>
                        </div>

                        {/* Gambar Soal (Jika ada) */}
                        {soal.gambar && (
                          <div className="flex justify-center p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 max-h-48 overflow-hidden">
                            <img
                              src={soal.gambar}
                              alt={`Gambar Soal #${sIdx + 1}`}
                              className="max-h-44 w-auto object-contain rounded-lg"
                            />
                          </div>
                        )}

                        {/* Jawaban Anda */}
                        <div className="text-[11.5px] text-slate-600 dark:text-slate-400">
                          <span>Jawaban Anda: </span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {detail?.jawaban_peserta || "(Tidak dijawab)"}
                          </strong>
                        </div>

                        {/* Kunci Benar jika ada */}
                        {detail?.kunci_jawaban && (
                          <div className="text-[11.5px] text-emerald-700 dark:text-emerald-400 font-bold">
                            <span>Kunci Jawaban Benar: </span>
                            <span>{detail.kunci_jawaban}</span>
                          </div>
                        )}

                        {/* Pembahasan */}
                        {detail?.pembahasan && (
                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 dark:border-white/5">
                            Pembahasan: {detail.pembahasan}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER MODAL REVIEW (KONSISTEN DENGAN MODAL LAIN) ── */}
          <div
            className={`px-6 py-4 sm:px-8 sm:py-5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
            }`}
          >
            <div className="hidden sm:flex items-center gap-2.5 min-w-0 flex-1 pr-3 text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <Info className="w-3 h-3 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
              </span>
              <span className="font-medium text-[10.5px] sm:text-[11px] leading-snug line-clamp-2">
                {isTuntas
                  ? "Selamat! Nilai kuis Anda telah memenuhi standar KKM."
                  : isPerluRemidi && bisaRemidi
                  ? `Tersedia kesempatan remidi (Percobaan ke-${percobaanKe + 1}${maksPercobaan ? ` dari maksimal ${maksPercobaan} kali` : " • Kuota Tidak Terbatas"}).`
                  : "Hasil pengerjaan kuis telah tercatat di sistem."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                Tutup
              </button>

              {isPerluRemidi && bisaRemidi && (
                <button
                  type="button"
                  onClick={handleMulaiKuis}
                  className="group/btn inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:-rotate-90 group-hover/btn:scale-110 shrink-0" />
                  <span>Mulai Ujian Remidi (Ke-{percobaanKe + 1})</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
      </div>

      {/* ── MODAL LIGHTBOX PERBESAR GAMBAR ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center animate-[modalFadeUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="absolute -top-11 right-0 sm:-right-11 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all shadow-md"
              title="Tutup Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview Gambar Soal"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20 bg-slate-900"
            />
            <span className="mt-3 text-xs font-semibold text-white/80 select-none">
              Klik di luar gambar atau tombol silang untuk menutup
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KerjakanKuisModal;
