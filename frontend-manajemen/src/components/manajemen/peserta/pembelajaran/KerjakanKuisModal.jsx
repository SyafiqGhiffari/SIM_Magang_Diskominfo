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
  Play,
  Eye,
  FileQuestion,
  RefreshCw
} from "lucide-react";
import { kumpulKuisPeserta } from "../../../../services/pembelajaranService";
import { toastSuccess, toastError, confirmDialog } from "../../../../utils/swal";

export const KerjakanKuisModal = ({
  tugas,
  isOpen,
  onClose,
  onSuccess,
  isDark = false,
}) => {
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
  const [submitting, setSubmitting] = useState(false);

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
    setTimeLeft((kuisConfig?.durasi_menit || 0) * 60);
  };

  // Format detik ke format mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

    let pesanKonfirmasi =
      "Apakah Anda yakin ingin menyelesaikan kuis ini? Pastikan seluruh jawaban telah Anda periksa kembali.";
    if (belumDijawab > 0) {
      pesanKonfirmasi = `Masih ada ${belumDijawab} butir soal yang belum Anda jawab. Yakin ingin mengumpulkan sekarang?`;
    }

    const konfirmasi = await confirmDialog({
      title: "Kumpulkan Jawaban Kuis?",
      text: pesanKonfirmasi,
      confirmText: "Ya, Selesaikan Kuis",
      cancelText: "Periksa Lagi",
      icon: belumDijawab > 0 ? "warning" : "question",
    });

    if (!konfirmasi.isConfirmed) return;

    await submitJawaban(answers);
  };

  if (!isOpen || !tugas || !isKuis) return null;

  const currentSoal = daftarSoal[currentIdx];
  const isPG = currentSoal?.tipe === "pilihan_ganda";
  const isPGKompleks = currentSoal?.tipe === "pilihan_ganda_kompleks";
  const isChoice = isPG || isPGKompleks;
  const jumlahTerjawab = Object.values(answers).filter(
    (v) => typeof v === "string" && v.trim() !== ""
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
      onClick={() => {
        if (!submitting && mode !== "pengerjaan") onClose();
      }}
    >
      <div
        className={`relative w-full max-w-3xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4.5 sm:px-8 sm:py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white shadow-xs">
                <FileQuestion className="w-5 h-5 text-sky-300" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#00A5EC] mb-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Kuis Interaktif Magang</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {tugas.judul}
                </h3>
                <p className="text-[11px] text-white/70">
                  KKM: {kkm} Poin • {totalSoal} Butir Soal
                </p>
              </div>
            </div>

            {/* Timer Saat Mode Pengerjaan */}
            {mode === "pengerjaan" && durasiDetikAwal > 0 && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl font-black text-xs shadow-md border ${
                  timeLeft <= 120
                    ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                    : "bg-white/10 text-white border-white/20 backdrop-blur-md"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Tombol Tutup (Hanya saat tidak sedang ujian) */}
            {mode !== "pengerjaan" && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ── 1. MODE INTRO: HALAMAN SAMBUTAN & ATURAN KUIS ── */}
        {mode === "intro" && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] mb-2 shadow-xs">
                <FileQuestion className="w-8 h-8 stroke-[2.2]" />
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Siap Memulai Pengerjaan Kuis?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bacalah setiap soal dengan teliti dan pilih jawaban yang paling tepat. Sistem akan menghitung akumulasi skor secara otomatis.
              </p>
            </div>

            {/* Kotak Rincian Ketentuan Kuis */}
            <div
              className={`p-5 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-4 ${
                isDark ? "bg-[#161b22] border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Jumlah Soal</span>
                <strong className="text-base font-black text-slate-800 dark:text-slate-100">
                  {totalSoal} Butir
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Standar KKM</span>
                <strong className="text-base font-black text-rose-600">
                  {kkm} Poin
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Batas Waktu</span>
                <strong className="text-base font-black text-slate-800 dark:text-slate-100">
                  {kuisConfig?.durasi_menit > 0 ? `${kuisConfig.durasi_menit} Menit` : "Bebas"}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Kesempatan Remidi</span>
                <strong className="text-base font-black text-[#004F9F] dark:text-[#00A5EC]">
                  {kuisConfig?.izinkan_remidi ? `${maksPercobaan || "∞"} Kali` : "1 Kali Saja"}
                </strong>
              </div>
            </div>

            {/* Petunjuk Tambahan */}
            {tugas.deskripsi && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                  isDark ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200/80"
                }`}
              >
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Petunjuk dari Mentor:
                </span>
                <p className="text-slate-500 dark:text-slate-400">{tugas.deskripsi}</p>
              </div>
            )}

            {/* Tombol Mulai */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleMulaiKuis}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Kerjakan Sekarang</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 2. MODE PENGERJAAN: ALUR QUIZIZZ / GOOGLE FORMS ── */}
        {mode === "pengerjaan" && currentSoal && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Navigasi Nomor Soal & Progres */}
            <div
              className={`p-4 border-b flex items-center justify-between gap-3 ${
                isDark ? "border-white/10 bg-slate-900/40" : "border-slate-100 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-2 overflow-x-auto custom-modal-scrollbar py-1">
                {daftarSoal.map((s, idx) => {
                  const isDone = !!answers[s.id] && answers[s.id].trim() !== "";
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-8 w-8 shrink-0 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#004F9F] text-white ring-2 ring-[#00A5EC]/40 scale-105 shadow-xs"
                          : isDone
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60"
                          : isDark
                          ? "bg-slate-800 text-slate-400 hover:text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-400 block">
                  Terjawab:
                </span>
                <span className="text-xs font-black text-[#004F9F] dark:text-[#00A5EC]">
                  {jumlahTerjawab} / {totalSoal} Soal
                </span>
              </div>
            </div>

            {/* Area Soal & Pilihan Jawaban */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
              {/* Info Soal */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/40">
                  Soal #{currentIdx + 1} dari {totalSoal}
                </span>

                <span className="text-xs font-bold text-slate-400">
                  Bobot: <strong className="text-slate-800 dark:text-slate-200">{currentSoal.poin} Poin</strong>
                </span>
              </div>

              {/* Teks Pertanyaan */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5 space-y-3">
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                  {currentSoal.pertanyaan}
                </h4>

                {/* Gambar Soal (Jika ada) */}
                {currentSoal.gambar && (
                  <div className="flex justify-center p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-hidden max-h-72">
                    <img
                      src={currentSoal.gambar}
                      alt={`Ilustrasi Soal #${currentIdx + 1}`}
                      className="max-h-64 w-auto object-contain rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Input Jawaban: Pilihan Ganda & PG Kompleks */}
              {isChoice && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isPGKompleks
                      ? "Pilih Satu atau Beberapa Jawaban Benar (Multi-Jawaban):"
                      : "Pilih Satu Jawaban Benar:"}
                  </span>

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
                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 group shadow-2xs ${
                          isSelected
                            ? isPGKompleks
                              ? "bg-emerald-50/80 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-400 ring-2 ring-emerald-500/20 scale-[1.01]"
                              : "bg-blue-50/80 border-[#004F9F] dark:bg-sky-950/40 dark:border-sky-400 ring-2 ring-[#004F9F]/20 dark:ring-sky-500/30 scale-[1.01]"
                            : isDark
                            ? "bg-[#161b22] border-white/10 hover:border-white/20 hover:bg-slate-800/40"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center font-black text-xs transition-all ${
                            isPGKompleks ? "rounded-lg" : "rounded-xl"
                          } ${
                            isSelected
                              ? isPGKompleks
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-[#004F9F] text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : opsi.key}
                        </span>

                        <span
                          className={`text-xs sm:text-sm font-semibold flex-1 ${
                            isSelected
                              ? isPGKompleks
                                ? "text-emerald-700 dark:text-emerald-300 font-bold"
                                : "text-[#004F9F] dark:text-sky-300 font-bold"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {opsi.teks}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input Jawaban: Esai */}
              {!isChoice && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ketikkan Jawaban Anda Secara Terperinci:
                  </label>
                  <textarea
                    rows={6}
                    value={answers[currentSoal.id] || ""}
                    onChange={(e) => handleSelectAnswer(currentSoal.id, e.target.value)}
                    placeholder="Tuliskan jawaban Anda di sini..."
                    className={`w-full p-4 text-xs rounded-2xl border font-medium leading-relaxed ${
                      isDark
                        ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                        : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F]"
                    } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20`}
                  />
                </div>
              )}
            </div>

            {/* Footer Aksi Pengerjaan */}
            <div
              className={`p-4 sm:px-8 border-t flex items-center justify-between gap-3 ${
                isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
              }`}
            >
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIdx < totalSoal - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(totalSoal - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Selesai &amp; Kumpulkan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. MODE REVIEW: HASIL PENILAIAN & PEMBAHASAN ── */}
        {mode === "review" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-modal-scrollbar">
            {/* Banner Hasil Capaian Nilai */}
            <div
              className={`p-6 rounded-3xl border text-center space-y-3 relative overflow-hidden ${
                isTuntas
                  ? "bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-[#141a24] border-emerald-300 dark:border-emerald-800"
                  : isPerluRemidi
                  ? "bg-gradient-to-br from-amber-50 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-[#141a24] border-amber-300 dark:border-amber-800"
                  : "bg-blue-50/60 dark:bg-sky-950/30 border-blue-200 dark:border-sky-800"
              }`}
            >
              <div className="flex justify-center">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl shadow-sm ${
                    isTuntas
                      ? "bg-emerald-600 text-white"
                      : isPerluRemidi
                      ? "bg-amber-500 text-white"
                      : "bg-[#004F9F] text-white"
                  }`}
                >
                  {isTuntas ? (
                    <Award className="w-8 h-8" />
                  ) : isPerluRemidi ? (
                    <RotateCcw className="w-8 h-8" />
                  ) : (
                    <Clock className="w-8 h-8" />
                  )}
                </span>
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1 ${
                    isTuntas
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                      : isPerluRemidi
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                  }`}
                >
                  {isTuntas
                    ? "LULUS / TUNTAS"
                    : isPerluRemidi
                    ? "PERLU REMIDI (< KKM)"
                    : "MENUNGGU EVALUASI ESAI"}
                </span>

                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {pengumpulan?.nilai ?? "-"}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100 Poin</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  {isTuntas
                    ? `Selamat! Nilai Anda telah memenuhi batas kelulusan standar KKM (${kkm} poin).`
                    : isPerluRemidi
                    ? `Nilai Anda belum mencapai standar kelulusan KKM (${kkm} poin). ${
                        bisaRemidi
                          ? `Anda memiliki kesempatan remidi (Percobaan ke-${percobaanKe + 1} dari ${maksPercobaan || "bebas"}).`
                          : "Batas maksimal percobaan remidi telah selesai."
                      }`
                    : "Jawaban pilihan ganda telah selesai diperiksa otomatis. Nilai akhir akan ditetapkan setelah mentor mengevaluasi jawaban esai Anda."}
                </p>
              </div>

              {/* Tombol Kerjakan Remidi jika diizinkan */}
              {isPerluRemidi && bisaRemidi && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleMulaiKuis}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Mulai Ujian Remidi (Percobaan ke-{percobaanKe + 1})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Catatan Feedback Mentor jika ada */}
            {pengumpulan?.catatan_mentor && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-900/40 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Catatan Feedback dari Mentor:</span>
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
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
        )}
      </div>
    </div>
  );
};

export default KerjakanKuisModal;
