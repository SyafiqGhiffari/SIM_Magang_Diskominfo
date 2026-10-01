import { useState, useMemo } from "react";
import {
  FileCheck2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Check,
  X,
  Send,
  Eye,
  FileText,
  HelpCircle,
  Clock,
  Target,
  FilePenLine,
  NotebookPen,
} from "lucide-react";
import { reviewPengumpulanTugasMentor } from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

const ReviewDetailModalContent = ({
  onClose,
  tugas,
  submission,
  onSuccess,
  isDark = false,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [catatanMentor, setCatatanMentor] = useState(
    submission?.pengumpulan?.catatan_mentor || ""
  );

  const isKuis = tugas?.tipe_tugas === "kuis";
  const pengumpulan = submission?.pengumpulan;
  const kuisData = tugas?.kuis_data;
  const jawabanKuisRaw = pengumpulan?.jawaban_kuis;

  // Parsing data konfigurasi kuis dari tugas
  const kuisConfig = useMemo(() => {
    if (!isKuis || !kuisData) return null;
    try {
      return typeof kuisData === "string" ? JSON.parse(kuisData) : kuisData;
    } catch {
      return null;
    }
  }, [isKuis, kuisData]);

  // Parsing data jawaban kuis peserta
  const jawabanKuisParsed = useMemo(() => {
    if (!isKuis || !jawabanKuisRaw) return null;
    try {
      return typeof jawabanKuisRaw === "string"
        ? JSON.parse(jawabanKuisRaw)
        : jawabanKuisRaw;
    } catch {
      return null;
    }
  }, [isKuis, jawabanKuisRaw]);

  // State nilai manual untuk tugas berkas/proyek
  const [nilaiManual, setNilaiManual] = useState(
    pengumpulan?.nilai !== null && pengumpulan?.nilai !== undefined
      ? pengumpulan.nilai
      : 100
  );

  // Inisialisasi skor per butir esai langsung pada state initializer
  const [skorEsaiMap, setSkorEsaiMap] = useState(() => {
    const map = {};
    if (kuisConfig?.daftar_soal && jawabanKuisParsed?.detail_per_soal) {
      kuisConfig.daftar_soal.forEach((s) => {
        if (s.tipe === "esai") {
          const det = jawabanKuisParsed.detail_per_soal[s.id];
          map[s.id] = det?.poin_diperoleh ?? 0;
        }
      });
    }
    return map;
  });

  // Hitung total skor kuis secara real-time (Pilihan Ganda + Esai)
  const kalkulasiSkorKuis = useMemo(() => {
    if (!isKuis || !kuisConfig?.daftar_soal) return 0;
    const skorMC = jawabanKuisParsed?.skor_pilihan_ganda ?? 0;
    const skorEsai = Object.values(skorEsaiMap).reduce(
      (sum, val) => sum + (parseInt(val, 10) || 0),
      0
    );
    const totalPoinMaksimal = kuisConfig.daftar_soal.reduce(
      (sum, s) => sum + (parseInt(s.poin, 10) || 0),
      0
    );

    const totalRaw = skorMC + skorEsai;
    if (totalPoinMaksimal > 0 && totalPoinMaksimal !== 100) {
      return Math.round((totalRaw / totalPoinMaksimal) * 100);
    }
    return totalRaw;
  }, [isKuis, kuisConfig, jawabanKuisParsed, skorEsaiMap]);

  const kkm = kuisConfig?.kkm || 75;
  const isTuntas = isKuis ? kalkulasiSkorKuis >= kkm : nilaiManual >= 75;

  // Tanggal pengumpulan terformat
  const waktuKumpulFormatted = pengumpulan?.created_at
    ? new Date(pengumpulan.created_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Cek apakah terlambat mengumpulkan
  const isTerlambat = useMemo(() => {
    if (!pengumpulan?.created_at || !tugas?.tenggat_waktu) return false;
    return new Date(pengumpulan.created_at) > new Date(tugas.tenggat_waktu);
  }, [pengumpulan, tugas]);

  // Submit Penilaian Kuis
  const handleSimpanPenilaianKuis = async () => {
    setSubmitting(true);
    try {
      const updatedDetailPerSoal = {
        ...(jawabanKuisParsed?.detail_per_soal || {}),
      };
      let totalSkorEsai = 0;

      kuisConfig?.daftar_soal?.forEach((s) => {
        if (s.tipe === "esai") {
          const poinDiberikan = Math.min(
            s.poin,
            Math.max(0, parseInt(skorEsaiMap[s.id], 10) || 0)
          );
          totalSkorEsai += poinDiberikan;
          updatedDetailPerSoal[s.id] = {
            ...(updatedDetailPerSoal[s.id] || {}),
            tipe: "esai",
            poin_maksimal: s.poin,
            poin_diperoleh: poinDiberikan,
            benar: poinDiberikan > 0,
            jawaban_peserta:
              jawabanKuisParsed?.jawaban_peserta?.[s.id] ||
              updatedDetailPerSoal[s.id]?.jawaban_peserta ||
              "",
          };
        }
      });

      const updatedPayload = {
        ...(jawabanKuisParsed || {}),
        skor_esai: totalSkorEsai,
        total_skor: kalkulasiSkorKuis,
        kkm: kkm,
        detail_per_soal: updatedDetailPerSoal,
      };

      const statusRemidi = isTuntas ? "tuntas" : "perlu_remidi";

      await reviewPengumpulanTugasMentor(pengumpulan.id, {
        action: "nilai_kuis",
        nilai: kalkulasiSkorKuis,
        catatan_mentor: catatanMentor.trim(),
        status_remidi: statusRemidi,
        jawaban_kuis: JSON.stringify(updatedPayload),
      });

      toastSuccess(
        `Penilaian kuis peserta ${submission.nama} berhasil disimpan (${kalkulasiSkorKuis} Poin)`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal simpan nilai kuis:", err);
      toastError(err.response?.data?.message || "Gagal menyimpan penilaian kuis");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Penilaian Tugas Berkas / Proyek
  const handleReviewBerkas = async (action) => {
    setSubmitting(true);
    try {
      await reviewPengumpulanTugasMentor(pengumpulan.id, {
        action: action === "revisi" ? "revisi" : "nilai_manual",
        nilai: action === "revisi" ? null : nilaiManual,
        catatan_mentor: catatanMentor.trim(),
        status_remidi: action === "revisi" ? "perlu_remidi" : "tuntas",
      });

      toastSuccess(
        action === "revisi"
          ? `Permintaan revisi berhasil dikirim ke ${submission.nama}`
          : `Penilaian tugas ${submission.nama} berhasil disimpan`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal review tugas berkas:", err);
      toastError(err.response?.data?.message || "Gagal memproses penilaian tugas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-4xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#004F9F] px-6 py-4.5 sm:px-8 sm:py-5 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white shadow-xs">
                {isKuis ? (
                  <NotebookPen className="w-5 h-5 text-sky-300" strokeWidth={2.2} />
                ) : (
                  <FilePenLine className="w-5 h-5 text-sky-300" strokeWidth={2.2} />
                )}
              </span>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#00A5EC] mb-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>
                    {isKuis ? "Review & Koreksi Kuis Peserta" : "Evaluasi & Penilaian Tugas Proyek"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {submission.nama}
                </h3>
                <p className="text-[11px] text-white/75 truncate mt-0.5">
                  {submission.institusi} • {submission.posisi_bidang}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Modal Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
          {/* Ringkasan Skor & Status Capaian */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
              isTuntas
                ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Status Capaian Peserta:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${
                    isTuntas
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {isTuntas ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isTuntas ? "LULUS / TUNTAS" : "PERLU REMIDI (< KKM)"}
                  </span>
                </span>

                {isKuis && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                    <Target className="w-3 h-3 text-rose-500" />
                    <span>Standar KKM: {kkm} Poin</span>
                  </span>
                )}

                {waktuKumpulFormatted && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                      isTerlambat
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {isTerlambat ? "Terlambat Mengumpulkan" : "Tepat Waktu"} (
                      {waktuKumpulFormatted})
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Total Perolehan Nilai:
              </span>
              <span
                className={`text-3xl font-black ${
                  isTuntas
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {isKuis ? kalkulasiSkorKuis : nilaiManual}{" "}
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </span>
            </div>
          </div>

          {/* ── TUGAS KUIS: RINCIAN BUTIR SOAL ── */}
          {isKuis && kuisConfig?.daftar_soal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Rincian Evaluasi Jawaban Butir Soal</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-bold">
                  {kuisConfig.daftar_soal.length} Butir Soal
                </span>
              </div>

              <div className="space-y-3.5">
                {kuisConfig.daftar_soal.map((soal, sIdx) => {
                  const detail = jawabanKuisParsed?.detail_per_soal?.[soal.id];
                  const ansPeserta =
                    jawabanKuisParsed?.jawaban_peserta?.[soal.id] ||
                    detail?.jawaban_peserta ||
                    "";
                  const isPG = soal.tipe === "pilihan_ganda";
                  const isPGKompleks = soal.tipe === "pilihan_ganda_kompleks";
                  const isChoice = isPG || isPGKompleks;
                  const isBenar = detail?.benar;

                  return (
                    <div
                      key={soal.id || sIdx}
                      className={`p-4 sm:p-4.5 rounded-2xl border transition-all ${
                        isChoice
                          ? isBenar
                            ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/15 dark:border-emerald-800/40"
                            : "bg-rose-50/40 border-rose-200 dark:bg-rose-950/15 dark:border-rose-800/40"
                          : "bg-indigo-50/30 border-indigo-200 dark:bg-indigo-950/15 dark:border-indigo-800/40"
                      }`}
                    >
                      {/* Baris Atas Soal */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-300">
                            #{sIdx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/5">
                            {isPG
                              ? "Pilihan Ganda"
                              : isPGKompleks
                              ? "PG Kompleks"
                              : "Isian / Esai"}
                          </span>
                        </div>

                        {/* Status Poin Butir */}
                        <div className="shrink-0 text-right">
                          {isChoice ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                                isBenar
                                  ? "bg-emerald-600 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                            >
                              {isBenar ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>+{soal.poin} Poin</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>0 Poin</span>
                                </>
                              )}
                            </span>
                          ) : (
                            /* Input Poin Manual untuk Esai */
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                                Beri Skor:
                              </span>
                              <input
                                type="number"
                                min="0"
                                max={soal.poin || 20}
                                value={skorEsaiMap[soal.id] ?? 0}
                                onChange={(e) =>
                                  setSkorEsaiMap((prev) => ({
                                    ...prev,
                                    [soal.id]: Math.min(
                                      soal.poin || 20,
                                      Math.max(0, parseInt(e.target.value, 10) || 0)
                                    ),
                                  }))
                                }
                                className={`w-14 h-7 text-center text-xs font-black rounded-lg border ${
                                  isDark
                                    ? "bg-slate-900 border-white/10 text-white"
                                    : "bg-slate-50 border-slate-200 text-indigo-700"
                                } focus:outline-none focus:ring-1 focus:ring-indigo-400`}
                              />
                              <span className="text-[11px] font-bold text-slate-400">
                                / {soal.poin}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pertanyaan */}
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
                        {soal.pertanyaan}
                      </p>

                      {/* Gambar Soal (Jika ada) */}
                      {soal.gambar && (
                        <div className="flex justify-center p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 max-h-56 overflow-hidden mb-3">
                          <img
                            src={soal.gambar}
                            alt={`Ilustrasi Soal #${sIdx + 1}`}
                            className="max-h-52 w-auto object-contain rounded-lg"
                          />
                        </div>
                      )}

                      {/* Tampilan Jawaban Pilihan Ganda & PG Kompleks */}
                      {isChoice && (
                        <div className="space-y-1.5 pl-2 text-xs">
                          {soal.opsi?.map((o) => {
                            const ansKeys = String(ansPeserta || "")
                              .split(",")
                              .map((k) => k.trim())
                              .filter(Boolean);
                            const correctKeys = String(soal.kunci_jawaban || "")
                              .split(",")
                              .map((k) => k.trim())
                              .filter(Boolean);

                            const isChosen = ansKeys.includes(o.key);
                            const isCorrectAnswer = correctKeys.includes(o.key);

                            let rowStyle =
                              "border-slate-200/60 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400";
                            if (isCorrectAnswer && isChosen) {
                              rowStyle =
                                "border-emerald-300 bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold";
                            } else if (isCorrectAnswer && !isChosen) {
                              rowStyle =
                                "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 font-semibold";
                            } else if (!isCorrectAnswer && isChosen) {
                              rowStyle =
                                "border-rose-300 bg-rose-100/70 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 font-bold";
                            }

                            return (
                              <div
                                key={o.key}
                                className={`flex items-center gap-2 p-2 rounded-xl border ${rowStyle} transition-colors`}
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white dark:bg-slate-800 text-[10px] font-black shrink-0 border border-black/5">
                                  {o.key}
                                </span>
                                <span className="flex-1 min-w-0">{o.teks}</span>
                                {isChosen && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/30 shrink-0">
                                    Pilihan Peserta
                                  </span>
                                )}
                                {isCorrectAnswer && (
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                                    Kunci Jawaban
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tampilan Jawaban Soal Esai */}
                      {!isChoice && (
                        <div className="mt-2.5 p-3.5 rounded-xl border border-indigo-200/80 bg-white/80 dark:bg-slate-900/50 dark:border-indigo-900/40 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              Jawaban dari Peserta:
                            </span>
                            <span className="text-slate-400">
                              {String(ansPeserta || "").length} Karakter
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-white/5">
                            {ansPeserta || "(Peserta tidak mengisi jawaban esai)"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TUGAS PROYEK / BERKAS: LAMPIRAN & INPUT NILAI ── */}
          {!isKuis && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                <span>Dokumen &amp; Hasil Penyerahan Peserta</span>
              </h4>

              {/* Berkas Pengumpulan */}
              {pengumpulan?.file_pengumpulan && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 dark:bg-slate-900/40 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/40">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Berkas Tugas Yang Diunggah
                      </span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                        {pengumpulan.file_pengumpulan.split("/").pop()}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getFileUrl(pengumpulan.file_pengumpulan)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#004F9F] text-white hover:bg-[#003870] transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka / Unduh Berkas</span>
                  </a>
                </div>
              )}

              {/* Tautan Proyek */}
              {pengumpulan?.link_tugas && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 dark:bg-slate-900/40 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/40">
                      <ExternalLink className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tautan Demo / Repository
                      </span>
                      <p className="text-xs font-bold text-[#004F9F] dark:text-sky-400 truncate">
                        {pengumpulan.link_tugas}
                      </p>
                    </div>
                  </div>

                  <a
                    href={pengumpulan.link_tugas}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    <span>Kunjungi Tautan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Catatan Peserta */}
              {pengumpulan?.catatan_peserta && (
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900/40 dark:border-white/5 space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pesan Pengantar dari Peserta:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                    "{pengumpulan.catatan_peserta}"
                  </p>
                </div>
              )}

              {/* Form Input Nilai Angka */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/40 dark:border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Tetapkan Nilai Angka (0–100 Poin)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Standar nilai kelulusan ACC: minimal 75 poin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiManual}
                      onChange={(e) =>
                        setNilaiManual(
                          Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                        )
                      }
                      className={`w-24 h-11 text-center text-xl font-black rounded-xl border ${
                        isDark
                          ? "bg-slate-900 border-white/10 text-white"
                          : "bg-white border-slate-300 text-[#004F9F]"
                      } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/30`}
                    />
                    <span className="text-xs font-bold text-slate-400">Poin</span>
                  </div>
                </div>

                {/* Preset Nilai Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-[10.5px] font-bold text-slate-400 mr-1">
                    Preset Nilai Cepat:
                  </span>
                  {[
                    { label: "100 (Sempurna)", val: 100 },
                    { label: "85 (Sangat Baik)", val: 85 },
                    { label: "75 (Batas KKM)", val: 75 },
                    { label: "60 (Revisi)", val: 60 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setNilaiManual(p.val)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                        nilaiManual === p.val
                          ? "bg-[#004F9F] text-white border-[#004F9F] shadow-xs"
                          : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CATATAN & FEEDBACK MENTOR ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Catatan Ulasan &amp; Umpan Balik Mentor</span>
              <span className="text-slate-400 font-normal text-[11px]">
                (Akan tampil di akun peserta)
              </span>
            </label>
            <textarea
              rows={3}
              value={catatanMentor}
              onChange={(e) => setCatatanMentor(e.target.value)}
              placeholder="Berikan apresiasi, koreksi konstruktif, atau arahan penyempurnaan bagi peserta..."
              className={`w-full p-3.5 text-xs rounded-2xl border font-medium leading-relaxed transition-all ${
                isDark
                  ? "bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                  : "bg-slate-50/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
              } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20`}
            />
          </div>
        </div>

        {/* Footer Modal Aksi */}
        <div
          className={`px-6 py-4 sm:px-8 sm:py-5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md ${
            isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer disabled:opacity-50 transition-all ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {isKuis ? (
              <button
                type="button"
                onClick={handleSimpanPenilaianKuis}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Simpan Penilaian Kuis</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleReviewBerkas("revisi")}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewBerkas("acc")}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Setujui (ACC Penilaian)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReviewDetailModal = ({ isOpen, onClose, ...props }) => {
  if (!isOpen || !props.submission) return null;

  return (
    <ReviewDetailModalContent
      key={`${props.submission.peserta_id}-${props.submission?.pengumpulan?.id || "baru"}`}
      onClose={onClose}
      {...props}
    />
  );
};
