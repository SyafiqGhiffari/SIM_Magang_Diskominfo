import { useState, useEffect, useMemo } from "react";
import {
  X,
  NotebookPen,
  ClosedCaption,
  Sparkles,
  Target,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  CalendarClock,
  Trash2,
  TextInitial,
  Info,
  ArrowRight,
  AlertCircle,
  Check,
  Search,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

export const FormTugasKuisModal = ({
  isOpen = false,
  isEditing = false,
  selectedTugas = null,
  pesertaBimbingan = [],
  kuisDraft,
  onClose,
  onLanjutKeSoal,
  isDark = false,
}) => {
  // State Informasi Dasar Kuis
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [sasaranPenerima, setSasaranPenerima] = useState("semua");
  const [formPesertaTerpilih, setFormPesertaTerpilih] = useState([]);
  const [modalFilterJenjang, setModalFilterJenjang] = useState("semua");
  const [searchPeserta, setSearchPeserta] = useState("");
  const [tanggalDeadline, setTanggalDeadline] = useState("");
  const [jamDeadline, setJamDeadline] = useState("23:59");

  const [errors, setErrors] = useState({});

  // Reset atau isi data saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (kuisDraft) {
        // Jika kembali dari modal soal, pertahankan draft yang sudah diisi
        setJudul(kuisDraft.judul || "");
        setDeskripsi(kuisDraft.deskripsi || "");
        setSasaranPenerima(kuisDraft.sasaranPenerima || "semua");
        setFormPesertaTerpilih(kuisDraft.pesertaTerpilih || []);

        if (kuisDraft.tenggatWaktu) {
          try {
            const d = new Date(kuisDraft.tenggatWaktu);
            const pad = (n) => String(n).padStart(2, "0");
            setTanggalDeadline(
              `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
            );
            setJamDeadline(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
          } catch {
            setTanggalDeadline("");
            setJamDeadline("23:59");
          }
        } else {
          setTanggalDeadline("");
          setJamDeadline("23:59");
        }
      } else if (isEditing && selectedTugas) {
        setJudul(selectedTugas.judul || "");
        setDeskripsi(selectedTugas.deskripsi || "");

        if (selectedTugas.target_peserta === "spesifik") {
          setSasaranPenerima("spesifik");
          if (selectedTugas.peserta_akses && selectedTugas.peserta_akses.length > 0) {
            setFormPesertaTerpilih(selectedTugas.peserta_akses.map((p) => p.id));
          } else if (selectedTugas.peserta_id) {
            setFormPesertaTerpilih([selectedTugas.peserta_id]);
          } else {
            setFormPesertaTerpilih([]);
          }
        } else if (selectedTugas.target_jenjang === "mahasiswa") {
          setSasaranPenerima("mahasiswa");
          setFormPesertaTerpilih([]);
        } else if (selectedTugas.target_jenjang === "siswa") {
          setSasaranPenerima("siswa");
          setFormPesertaTerpilih([]);
        } else {
          setSasaranPenerima("semua");
          setFormPesertaTerpilih([]);
        }

        if (selectedTugas.tenggat_waktu) {
          try {
            const d = new Date(selectedTugas.tenggat_waktu);
            const pad = (n) => String(n).padStart(2, "0");
            setTanggalDeadline(
              `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
            );
            setJamDeadline(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
          } catch {
            setTanggalDeadline("");
            setJamDeadline("23:59");
          }
        } else {
          setTanggalDeadline("");
          setJamDeadline("23:59");
        }
      } else {
        // Default kuis baru
        setJudul("");
        setDeskripsi("");
        setSasaranPenerima("semua");
        setFormPesertaTerpilih([]);
        setTanggalDeadline("");
        setJamDeadline("23:59");
      }
      setErrors({});
      setModalFilterJenjang("semua");
      setSearchPeserta("");
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, isEditing, selectedTugas, kuisDraft]);

  // Hitung jumlah bimbingan mahasiswa & siswa
  const totalMahasiswa = pesertaBimbingan.filter(
    (p) => (p.kategori_pendaftar || "").toLowerCase() === "mahasiswa"
  ).length;
  const totalSiswa = pesertaBimbingan.filter(
    (p) => (p.kategori_pendaftar || "").toLowerCase() === "siswa"
  ).length;

  const filteredPesertaModal = useMemo(() => {
    return pesertaBimbingan.filter((p) => {
      const matchJenjang =
        modalFilterJenjang === "semua" ||
        (p.kategori_pendaftar || "").toLowerCase() === modalFilterJenjang;
      const q = (searchPeserta || "").toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.nama || "").toLowerCase().includes(q) ||
        (p.institusi || "").toLowerCase().includes(q) ||
        (p.posisi_bidang || "").toLowerCase().includes(q);
      return matchJenjang && matchSearch;
    });
  }, [pesertaBimbingan, modalFilterJenjang, searchPeserta]);

  const togglePeserta = (id) => {
    setFormPesertaTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (errors.peserta) setErrors((prev) => ({ ...prev, peserta: null }));
  };

  const setQuickDeadline = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    setTanggalDeadline(
      `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
    );
    if (!jamDeadline) setJamDeadline("23:59");
  };

  const clearDeadline = () => {
    setTanggalDeadline("");
    setJamDeadline("23:59");
  };

  // Hitung progres pengisian form Tahap 1 secara real-time (0% -> 50%)
  const progressTahap1 = useMemo(() => {
    const judulLen = (judul || "").trim().length;
    const deskripsiLen = (deskripsi || "").trim().length;

    // Jika form benar-benar kosong/baru dibuka, tetap di 0%
    if (
      judulLen === 0 &&
      deskripsiLen === 0 &&
      !tanggalDeadline &&
      sasaranPenerima === "semua" &&
      formPesertaTerpilih.length === 0
    ) {
      return 0;
    }

    let score = 0;

    // 1. Bobot Judul (Maks 20%)
    if (judulLen >= 5) {
      score += 20;
    } else if (judulLen > 0) {
      score += Math.min(18, Math.round((judulLen / 5) * 20));
    }

    // 2. Bobot Sasaran Peserta (Maks 10%)
    if (sasaranPenerima === "spesifik") {
      if (formPesertaTerpilih.length > 0) {
        score += 10;
      }
    } else {
      // Diberikan jika user sudah berinteraksi mengisi judul/deskripsi/deadline
      if (judulLen > 0 || deskripsiLen > 0 || tanggalDeadline) {
        score += 10;
      }
    }

    // 3. Bobot Tenggat Waktu (Opsional, Maks 5%)
    if (tanggalDeadline) {
      score += 5;
    }

    // 4. Bobot Deskripsi / Petunjuk Pengerjaan (Maks 15%)
    if (deskripsiLen >= 15) {
      score += 15;
    } else if (deskripsiLen > 0) {
      score += Math.min(14, Math.round((deskripsiLen / 15) * 15));
    }

    // Validasi apakah form wajib sudah siap untuk lanjut ke Tahap 2
    const isJudulValid = judulLen >= 3;
    const isSasaranValid =
      sasaranPenerima !== "spesifik" || formPesertaTerpilih.length > 0;
    const isDeskripsiValid = deskripsiLen >= 5;

    // Jika seluruh kolom wajib telah terpenuhi secara valid, genapkan ke 50%
    if (isJudulValid && isSasaranValid && isDeskripsiValid) {
      return 50;
    }

    return Math.min(48, Math.max(0, score));
  }, [judul, deskripsi, sasaranPenerima, formPesertaTerpilih, tanggalDeadline]);

  // Validasi Langkah 1 dan Lanjut ke Langkah 2 (Pembuatan Soal)
  const handleLanjut = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!judul.trim()) {
      newErrors.judul = "Judul penugasan kuis wajib diisi";
    }
    if (!deskripsi.trim()) {
      newErrors.deskripsi = "Instruksi dan petunjuk pengerjaan kuis wajib diisi";
    }
    if (sasaranPenerima === "spesifik" && formPesertaTerpilih.length === 0) {
      newErrors.peserta = "Pilih minimal 1 peserta bimbingan penerima kuis";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const deadlineVal = tanggalDeadline
      ? `${tanggalDeadline}T${jamDeadline || "23:59"}:00`
      : "";

    onLanjutKeSoal({
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      sasaranPenerima,
      pesertaTerpilih: formPesertaTerpilih,
      tenggatWaktu: deadlineVal,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL SIGNATURE KOMINFO ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4 sm:px-8 sm:py-5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />

          {/* Watermark Icon NotebookPen */}
          <NotebookPen
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <NotebookPen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  <span>
                    {isEditing ? "Perbarui Penugasan Kuis" : "Kuis & Soal Interaktif (Tahap 1)"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {isEditing ? "Edit Penugasan Kuis" : "Buat Penugasan Kuis Baru"}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/75 mt-0.5">
                  Langkah 1: Tentukan judul, sasaran peserta, batas waktu, dan instruksi pengerjaan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── STEP PROGRESS INDICATOR ── */}
        <div className="px-6 sm:px-8 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs shrink-0">
          {/* Step 1: Aktif */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 rounded-xl bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-white text-xs font-black items-center justify-center shadow-md shadow-[#004F9F]/25 ring-2 ring-[#00A5EC]/30 shrink-0">
              1
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#004F9F] dark:text-[#00A5EC]">
                  Tahap 1
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00A5EC] animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                Informasi & Sasaran
              </p>
            </div>
          </div>

          {/* Progress Bar Connector Tengah */}
          <div className="flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-xs mx-2 sm:mx-4 flex flex-col items-center gap-1">
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 px-0.5">
              <span>Langkah 1 dari 2</span>
              <span className="text-[#004F9F] dark:text-[#00A5EC] font-black">
                {progressTahap1}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 p-0.5 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] rounded-full relative transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressTahap1}%` }}
              >
                {progressTahap1 > 0 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs" />
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Menunggu */}
          <div className="flex items-center gap-2.5 opacity-55">
            <span className="flex h-7 w-7 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-black items-center justify-center border border-slate-300/60 dark:border-white/10 shrink-0">
              2
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Berikutnya
              </span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">
                Aturan & Butir Soal
              </p>
            </div>
          </div>
        </div>

        {/* ── FORM FORMULIR (SCROLLABLE BODY) ── */}
        <form onSubmit={handleLanjut} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
            {/* Global Error Banner jika ada */}
            {(errors.judul || errors.deskripsi || errors.peserta) && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-[fadeslide_0.2s_ease-out]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Mohon lengkapi seluruh kolom wajib yang bertanda bintang (*) dengan benar.</span>
              </div>
            )}

            {/* ── BARIS 1: JUDUL PENUGASAN KUIS ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ClosedCaption className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Judul Penugasan Kuis</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">Wajib diisi</span>
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => {
                  setJudul(e.target.value);
                  if (errors.judul) setErrors((prev) => ({ ...prev, judul: null }));
                }}
                placeholder="Contoh: Kuis Pemahaman REST API, Database MySQL, & Autentikasi"
                className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                  errors.judul
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400/20"
                    : isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
              {errors.judul && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.judul}</span>
                </p>
              )}
            </div>

            {/* ── BARIS 2: SASARAN PENERIMA KUIS (4 Kotak 2x2 Identik dengan Modal Proyek) ── */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
                isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] shrink-0 mt-0.5" />
                  <div>
                    <label className="flex items-center gap-1 text-xs font-black text-slate-800 dark:text-slate-200">
                      <span>Sasaran Penerima Kuis</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tentukan siapa saja peserta bimbingan yang berhak mengerjakan kuis ini
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span>Total Bimbingan:</span>
                  <strong className="text-[#004F9F] dark:text-[#00A5EC]">
                    {pesertaBimbingan.length} orang
                  </strong>
                </span>
              </div>

              {/* Grid 4 Kotak Pilihan (2x2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {[
                  {
                    id: "semua",
                    title: "Semua Peserta Bimbingan",
                    desc: `Dapat diakses oleh seluruh mahasiswa & siswa bimbingan (${pesertaBimbingan.length} orang).`,
                    badgeText: `${pesertaBimbingan.length} Orang`,
                    icon: Users,
                  },
                  {
                    id: "mahasiswa",
                    title: "Khusus Mahasiswa",
                    desc: `Otomatis seluruh mahasiswa bimbingan perguruan tinggi (${totalMahasiswa} orang).`,
                    badgeText: `${totalMahasiswa} Mhs`,
                    icon: GraduationCap,
                  },
                  {
                    id: "siswa",
                    title: "Khusus Siswa",
                    desc: `Otomatis seluruh siswa magang SMK/SMA yang Anda bimbing (${totalSiswa} orang).`,
                    badgeText: `${totalSiswa} Siswa`,
                    icon: Building2,
                  },
                  {
                    id: "spesifik",
                    title: "Pilih Peserta Manual",
                    desc: `Pilih beberapa peserta tertentu secara fleksibel (${formPesertaTerpilih.length} dipilih).`,
                    badgeText: `${formPesertaTerpilih.length} Dipilih`,
                    icon: UserCheck,
                  },
                ].map((item) => {
                  const isSelected = sasaranPenerima === item.id;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSasaranPenerima(item.id);
                        if (errors.peserta) setErrors((prev) => ({ ...prev, peserta: null }));
                      }}
                      className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-[0.99] ${
                        isSelected
                          ? "border-[#004F9F] dark:border-[#00A5EC] bg-blue-50/40 dark:bg-[#004F9F]/10 ring-2 ring-[#004F9F]/20 dark:ring-[#00A5EC]/30 shadow-xs"
                          : isDark
                          ? "border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-white/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 rounded-2xl items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                          isSelected
                            ? "bg-blue-50 text-[#004F9F] border border-[#004F9F]/25 dark:bg-[#00A5EC]/25 dark:text-[#00A5EC] dark:border-[#00A5EC]/40 shadow-xs"
                            : "bg-slate-100 text-slate-400 border border-slate-200/60 dark:bg-white/5 dark:text-slate-400 dark:border-white/5"
                        }`}
                      >
                        <ItemIcon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1 pr-6">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs font-black tracking-tight ${
                              isSelected
                                ? "text-[#004F9F] dark:text-[#00A5EC]"
                                : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-colors ${
                              isSelected
                                ? "bg-[#004F9F]/10 text-[#004F9F] border-[#004F9F]/25 dark:bg-[#00A5EC]/15 dark:text-[#00A5EC] dark:border-[#00A5EC]/35"
                                : "bg-slate-100 text-slate-500 border-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:border-white/5"
                            }`}
                          >
                            {item.badgeText}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-snug transition-colors ${
                            isSelected
                              ? "text-slate-600 dark:text-slate-300"
                              : "text-slate-400 dark:text-slate-400"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>

                      <div
                        className={`absolute right-3.5 top-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? "border-[#004F9F] bg-[#004F9F] dark:border-[#00A5EC] dark:bg-[#00A5EC] shadow-2xs"
                            : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white block shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Panel Checklist Peserta (Multi-Select Manual) */}
              {sasaranPenerima === "spesifik" && (
                <div className="pt-3 border-t border-slate-200/70 dark:border-white/5 space-y-3 animate-[fadeslide_0.2s_ease-out]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Filter Tab Jenjang */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
                      {[
                        { id: "semua", label: `Semua (${pesertaBimbingan.length})` },
                        { id: "mahasiswa", label: `Mahasiswa (${totalMahasiswa})` },
                        { id: "siswa", label: `Siswa (${totalSiswa})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModalFilterJenjang(tab.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            modalFilterJenjang === tab.id
                              ? isDark
                                ? "bg-[#004F9F] text-white shadow-2xs"
                                : "bg-white text-[#004F9F] shadow-2xs"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Info Counter */}
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 self-end sm:self-auto">
                      Dipilih:{" "}
                      <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                        {formPesertaTerpilih.length}
                      </strong>{" "}
                      dari {pesertaBimbingan.length} orang
                    </div>
                  </div>

                  {/* Input Search Peserta */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchPeserta}
                      onChange={(e) => setSearchPeserta(e.target.value)}
                      placeholder="Cari nama peserta bimbingan, institusi, atau posisi bidang..."
                      className={`w-full h-9.5 pl-9 pr-3 text-xs rounded-xl border outline-none font-medium transition-all ${
                        isDark
                          ? "bg-slate-900/60 border-white/10 text-white placeholder-slate-500 focus:border-[#00A5EC]"
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#004F9F] shadow-2xs"
                      }`}
                    />
                  </div>

                  {pesertaBimbingan.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 py-3 text-center">
                      Belum ada peserta bimbingan aktif yang terdaftar untuk akun Anda.
                    </p>
                  ) : filteredPesertaModal.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Tidak ada peserta bimbingan yang cocok dengan pencarian / jenjang ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-modal-scrollbar">
                      {filteredPesertaModal.map((p) => {
                        const isChecked = formPesertaTerpilih.includes(p.id);
                        const isMhs = (p.kategori_pendaftar || "").toLowerCase() === "mahasiswa";
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePeserta(p.id)}
                            className={`group/item relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                              isChecked
                                ? "border-[#004F9F]/40 bg-blue-50/50 dark:bg-[#004F9F]/10 dark:border-[#00A5EC]/30 ring-1 ring-[#004F9F]/20 shadow-2xs"
                                : isDark
                                ? "border-white/5 bg-slate-800/40 hover:bg-slate-800 hover:border-white/10"
                                : "border-slate-200/80 bg-white hover:bg-slate-50/70 hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all duration-200 shrink-0 ${
                                isChecked
                                  ? "bg-[#004F9F] border-[#004F9F] dark:bg-[#00A5EC] dark:border-[#00A5EC] text-white shadow-xs scale-105"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover/item:border-[#004F9F]/60"
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                            </div>

                            <div className="h-8.5 w-8.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/60 dark:border-white/10">
                              {p.foto_profil ? (
                                <img
                                  src={getFileUrl(p.foto_profil)}
                                  alt={p.nama}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-[11px] font-bold text-slate-500">
                                  {p.nama?.charAt(0) || "P"}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 pr-16">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                {p.nama}
                              </span>
                              <span className="block text-[10.5px] text-slate-400 truncate mt-0.5">
                                {p.institusi || p.posisi_bidang || "Peserta Magang"}
                              </span>
                            </div>

                            <span
                              className={`absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                isMhs
                                  ? "bg-blue-50 text-[#004F9F] border-blue-200/70 dark:bg-blue-950/60 dark:text-[#00A5EC] dark:border-blue-800/40"
                                  : "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40"
                              }`}
                            >
                              {isMhs ? "Mahasiswa" : "Siswa"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {errors.peserta && (
                    <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium pt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.peserta}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── BARIS 3: TENGGAT WAKTU (DEADLINE) - DIPISAH TANGGAL & JAM ── */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-3.5 ${
                isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex items-start gap-2">
                  <CalendarClock className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] shrink-0 mt-0.5" />
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Tenggat Waktu Pengerjaan Kuis</span>
                      <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Batas akhir tanggal dan jam pengerjaan butir soal kuis oleh peserta bimbingan
                    </p>
                  </div>
                </div>

                {tanggalDeadline && (
                  <button
                    type="button"
                    onClick={clearDeadline}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>Hapus Batas Waktu</span>
                  </button>
                )}
              </div>

              {/* Input Kolom Terpisah: Tanggal & Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Kolom Tanggal */}
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Tanggal Batas</span>
                  </div>
                  <input
                    type="date"
                    value={tanggalDeadline}
                    onChange={(e) => setTanggalDeadline(e.target.value)}
                    className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                      isDark
                        ? "bg-slate-900/70 border-white/10 text-slate-100 focus:border-[#00A5EC] focus:bg-slate-900"
                        : "bg-white border-slate-200 text-slate-800 focus:border-[#004F9F] focus:bg-white shadow-2xs"
                    } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
                  />
                </div>

                {/* Kolom Jam */}
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <Clock className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Jam Batas</span>
                  </div>
                  <input
                    type="time"
                    value={jamDeadline}
                    onChange={(e) => setJamDeadline(e.target.value)}
                    className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                      isDark
                        ? "bg-slate-900/70 border-white/10 text-slate-100 focus:border-[#00A5EC] focus:bg-slate-900"
                        : "bg-white border-slate-200 text-slate-800 focus:border-[#004F9F] focus:bg-white shadow-2xs"
                    } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
                  />
                </div>
              </div>

              {/* Preset Batas Cepat */}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Batas Cepat:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "+3 Hari", days: 3 },
                    { label: "+1 Minggu", days: 7 },
                    { label: "+2 Minggu", days: 14 },
                    { label: "+1 Bulan", days: 30 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickDeadline(preset.days)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-white/5 border border-slate-200/90 hover:border-[#004F9F] dark:border-white/10 dark:hover:border-[#00A5EC] text-slate-600 hover:text-[#004F9F] dark:text-slate-300 dark:hover:text-[#00A5EC] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── BARIS 4: INSTRUKSI & KETENTUAN PENGERJAAN KUIS ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <TextInitial className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Instruksi & Ketentuan Pengerjaan Kuis</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">Wajib diisi</span>
              </label>
              <textarea
                rows={4}
                required
                value={deskripsi}
                onChange={(e) => {
                  setDeskripsi(e.target.value);
                  if (errors.deskripsi) setErrors((prev) => ({ ...prev, deskripsi: null }));
                }}
                placeholder="Tuliskan petunjuk pengerjaan kuis, ketentuan waktu pengerjaan, atau kisi-kisi materi yang diujikan..."
                className={`w-full p-4 text-xs rounded-2xl border font-medium leading-relaxed transition-all ${
                  errors.deskripsi
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400/20"
                    : isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
              {errors.deskripsi && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.deskripsi}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── FOOTER MODAL ── */}
          <div
            className={`p-4 sm:px-8 sm:py-4.5 border-t flex items-center justify-between gap-4 shrink-0 ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
            }`}
          >
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
              <span>
                {sasaranPenerima === "spesifik"
                  ? `Kuis ini akan diterbitkan khusus untuk ${formPesertaTerpilih.length} peserta terpilih.`
                  : sasaranPenerima === "mahasiswa"
                  ? "Kuis ini akan diterbitkan khusus untuk seluruh mahasiswa bimbingan."
                  : sasaranPenerima === "siswa"
                  ? "Kuis ini akan diterbitkan khusus untuk seluruh siswa bimbingan."
                  : "Kuis ini akan diterbitkan untuk seluruh peserta aktif bimbingan Anda."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                Batal
              </button>

              <button
                type="submit"
                className="group/btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border-0"
              >
                <span>Lanjut ke Pembuatan Soal & Aturan</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormTugasKuisModal;
