import { useState, useRef, useMemo } from "react";
import {
  X,
  FilePenLine,
  ClosedCaption,
  Sparkles,
  Target,
  Users,
  UserCheck,
  Calendar,
  Clock,
  CalendarClock,
  CheckCircle2,
  UploadCloud,
  Paperclip,
  TextInitial,
  Link,
  Info,
  Send,
  RefreshCw,
  AlertCircle,
  FileText,
  Search,
  Check,
  Trash2,
  GraduationCap,
  Building2,
  Presentation,
  Image as ImageIcon
} from "lucide-react";
import {
  createTugasMentor,
  updateTugasMentor
} from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

const FormTugasProyekDialog = ({
  isEditing = false,
  selectedTugas = null,
  pesertaBimbingan = [],
  onClose,
  onSuccess,
  isDark = false,
}) => {
  // 1. Judul Tugas
  const [judul, setJudul] = useState(() =>
    isEditing && selectedTugas ? selectedTugas.judul || "" : ""
  );

  // 2. Deskripsi / Petunjuk
  const [deskripsi, setDeskripsi] = useState(() =>
    isEditing && selectedTugas ? selectedTugas.deskripsi || "" : ""
  );

  // 3. Tautan Eksternal / Referensi Daring
  const [tautanEksternal, setTautanEksternal] = useState(() =>
    isEditing && selectedTugas ? selectedTugas.tautan_eksternal || "" : ""
  );

  // 4. Target Penugasan: "semua" | "mahasiswa" | "siswa" | "spesifik"
  const [sasaranPenerima, setSasaranPenerima] = useState(() => {
    if (isEditing && selectedTugas) {
      if (
        selectedTugas.target_peserta === "spesifik" ||
        (selectedTugas.peserta_akses && selectedTugas.peserta_akses.length > 0) ||
        selectedTugas.peserta_id
      ) {
        return "spesifik";
      }
      if (
        selectedTugas.target_peserta === "mahasiswa" ||
        selectedTugas.target_jenjang === "mahasiswa"
      ) {
        return "mahasiswa";
      }
      if (
        selectedTugas.target_peserta === "siswa" ||
        selectedTugas.target_jenjang === "siswa"
      ) {
        return "siswa";
      }
      return "semua";
    }
    return "semua";
  });

  // Checklist peserta jika sasaran "spesifik" (multi-select)
  const [modalFilterJenjang, setModalFilterJenjang] = useState("semua"); // "semua" | "mahasiswa" | "siswa"
  const [searchPeserta, setSearchPeserta] = useState("");
  const [formPesertaTerpilih, setFormPesertaTerpilih] = useState(() => {
    if (isEditing && selectedTugas) {
      if (selectedTugas.peserta_akses && selectedTugas.peserta_akses.length > 0) {
        return selectedTugas.peserta_akses.map((p) => p.id);
      }
      if (selectedTugas.peserta_id) {
        return [selectedTugas.peserta_id];
      }
    }
    return [];
  });

  // Hitung jumlah jenjang mahasiswa dan siswa
  const totalMahasiswa = useMemo(() => {
    return pesertaBimbingan.filter(
      (p) => (p.kategori_pendaftar || "").toLowerCase() === "mahasiswa"
    ).length;
  }, [pesertaBimbingan]);

  const totalSiswa = useMemo(() => {
    return pesertaBimbingan.filter(
      (p) => (p.kategori_pendaftar || "").toLowerCase() === "siswa"
    ).length;
  }, [pesertaBimbingan]);

  // Filter daftar peserta untuk panel checklist
  const filteredPesertaModal = useMemo(() => {
    return pesertaBimbingan.filter((p) => {
      const jenjang = (p.kategori_pendaftar || "").toLowerCase();
      if (modalFilterJenjang === "mahasiswa" && jenjang !== "mahasiswa") return false;
      if (modalFilterJenjang === "siswa" && jenjang !== "siswa") return false;

      if (searchPeserta.trim()) {
        const q = searchPeserta.toLowerCase();
        const matchNama = (p.nama || "").toLowerCase().includes(q);
        const matchInst = (p.institusi || "").toLowerCase().includes(q);
        const matchPos = (p.posisi_bidang || "").toLowerCase().includes(q);
        if (!matchNama && !matchInst && !matchPos) return false;
      }
      return true;
    });
  }, [pesertaBimbingan, modalFilterJenjang, searchPeserta]);

  const togglePeserta = (id) => {
    setFormPesertaTerpilih((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    if (errors.peserta_id) setErrors((prev) => ({ ...prev, peserta_id: null }));
  };


  // 5. Tenggat Waktu (Terpisah Tanggal & Jam)
  const [tanggalDeadline, setTanggalDeadline] = useState(() => {
    if (isEditing && selectedTugas?.tenggat_waktu) {
      try {
        const d = new Date(selectedTugas.tenggat_waktu);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      } catch {
        return "";
      }
    }
    return "";
  });

  const [jamDeadline, setJamDeadline] = useState(() => {
    if (isEditing && selectedTugas?.tenggat_waktu) {
      try {
        const d = new Date(selectedTugas.tenggat_waktu);
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return "23:59";
      }
    }
    return "23:59";
  });

  // Preset deadline cepat
  const setQuickDeadline = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    setTanggalDeadline(
      `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
    );
    setJamDeadline("23:59");
  };

  const clearDeadline = () => {
    setTanggalDeadline("");
    setJamDeadline("23:59");
  };

  // 6. File Lampiran & Drag/Drop
  const [fileLampiran, setFileLampiran] = useState(null);
  const existingFile =
    isEditing && selectedTugas?.file_lampiran ? selectedTugas.file_lampiran : "";
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Status Form & Validasi
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper metadata berkas persis seperti FormMateriMentorModal
  const fileMeta = useMemo(() => {
    let name;
    let size;
    let ext;

    if (fileLampiran) {
      name = fileLampiran.name;
      size = (fileLampiran.size / (1024 * 1024)).toFixed(2) + " MB";
      ext = (name.split(".").pop() || "FILE").toUpperCase();
    } else if (existingFile) {
      name = existingFile.split("/").pop();
      size = "Tersimpan di Server";
      ext = (name.split(".").pop() || "FILE").toUpperCase();
    } else {
      return null;
    }

    let badgeColor =
      "bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/20";
    let icon = FileText;

    const lowerExt = ext.toLowerCase();
    if (lowerExt === "pdf") {
      badgeColor =
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      icon = FileText;
    } else if (["ppt", "pptx"].includes(lowerExt)) {
      badgeColor =
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      icon = Presentation;
    } else if (["doc", "docx"].includes(lowerExt)) {
      badgeColor =
        "bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/20";
      icon = FileText;
    } else if (["xls", "xlsx"].includes(lowerExt)) {
      badgeColor =
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      icon = FileText;
    } else if (["zip", "rar", "7z"].includes(lowerExt)) {
      badgeColor =
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      icon = Paperclip;
    } else if (["png", "jpg", "jpeg", "webp"].includes(lowerExt)) {
      badgeColor =
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      icon = ImageIcon;
    }

    return { name, size, ext, badgeColor, icon };
  }, [fileLampiran, existingFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toastError("Ukuran file maksimal 25 MB");
        return;
      }
      setFileLampiran(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toastError("Ukuran file maksimal 25 MB");
        return;
      }
      setFileLampiran(file);
    }
  };

  // Validasi & Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!judul.trim()) {
      newErrors.judul = "Judul tugas wajib diisi";
    }
    if (!deskripsi.trim()) {
      newErrors.deskripsi = "Deskripsi instruksi tugas wajib diisi";
    }
    if (sasaranPenerima === "spesifik" && formPesertaTerpilih.length === 0) {
      newErrors.peserta_id = "Pilih minimal 1 peserta bimbingan penerima tugas";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tipe_tugas", "berkas");
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("tautan_eksternal", tautanEksternal.trim());

      // Target Sasaran & Jenjang
      let targetPesertaVal = "semua_bimbingan";
      let targetJenjangVal = "semua";

      if (sasaranPenerima === "spesifik") {
        targetPesertaVal = "spesifik";
        formPesertaTerpilih.forEach((id) => {
          formData.append("peserta_ids[]", id);
        });
        if (formPesertaTerpilih.length === 1) {
          formData.append("peserta_id", formPesertaTerpilih[0]);
        }
      } else if (sasaranPenerima === "mahasiswa") {
        targetPesertaVal = "mahasiswa";
        targetJenjangVal = "mahasiswa";
      } else if (sasaranPenerima === "siswa") {
        targetPesertaVal = "siswa";
        targetJenjangVal = "siswa";
      }

      formData.append("target_peserta", targetPesertaVal);
      formData.append("target_jenjang", targetJenjangVal);
      formData.append("target_tipe", targetPesertaVal);

      // Deadline terpisah tanggal & jam digabungkan
      if (tanggalDeadline) {
        const timeStr = jamDeadline || "23:59";
        formData.append("tenggat_waktu", `${tanggalDeadline}T${timeStr}:00`);
      } else if (isEditing) {
        formData.append("hapus_tenggat_waktu", "true");
      }

      // Nilai standar 100 untuk kompatibilitas database
      formData.append("bobot_nilai", "100");

      if (fileLampiran) {
        formData.append("file_lampiran", fileLampiran);
      }

      if (isEditing && selectedTugas) {
        await updateTugasMentor(selectedTugas.id, formData);
        toastSuccess("Penugasan magang berhasil diperbarui");
      } else {
        await createTugasMentor(formData);
        toastSuccess("Penugasan magang baru berhasil diterbitkan");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan tugas:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan tugas";
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      {/* ── KOTAK MODAL UTAMA (UKURAN MAX-W-4XL KONSISTEN DENGAN MODAL MATERI) ── */}
      <div
        className={`relative w-full max-w-4xl my-auto rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL SIGNATURE KOMINFO (STAY / FIXED DI ATAS) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4 sm:px-8 sm:py-5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          {/* Watermark Icon */}
          <FilePenLine
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <FilePenLine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  <span>
                    {isEditing ? "Perbarui Penugasan Proyek" : "Penugasan Proyek & Mandiri"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {isEditing ? "Edit Penugasan Proyek" : "Buat Penugasan Proyek Baru"}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/75 mt-0.5">
                  {isEditing
                    ? "Perbarui instruksi pengerjaan, berkas pendukung, tenggat waktu, atau sasaran tugas proyek"
                    : "Rancang instruksi pengerjaan proyek, berkas panduan, dan publikasikan tugas untuk peserta bimbingan"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── FORM FORMULIR ── */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
            {/* Global Error Banner jika ada */}
            {(errors.judul || errors.deskripsi || errors.peserta_id) && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-[fadeslide_0.2s_ease-out]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Mohon lengkapi seluruh kolom wajib yang bertanda bintang (*) dengan benar.</span>
              </div>
            )}

            {/* ── BARIS 1: JUDUL PENUGASAN (Icon ClosedCaption) ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ClosedCaption className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Judul Penugasan Magang</span>
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
                placeholder="Contoh: Pembangunan REST API Autentikasi JWT & Role Manajemen"
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

            {/* ── BARIS 2: SASARAN PENERIMA PENUGASAN (4 Kotak 2x2 Identik dengan Modal Materi) ── */}
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
                      <span>Sasaran Penerima Penugasan</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tentukan cakupan jenjang bimbingan atau pilih beberapa peserta tertentu
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
                        if (errors.peserta_id) setErrors((prev) => ({ ...prev, peserta_id: null }));
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

              {/* Panel Checklist Peserta (Multi-Select Bebas) */}
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

                  {/* List Grid Checklist Peserta */}
                  {pesertaBimbingan.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 py-4 text-center">
                      Belum ada peserta bimbingan aktif yang terdaftar untuk akun Anda.
                    </p>
                  ) : filteredPesertaModal.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Tidak ada peserta bimbingan yang cocok dengan pencarian / filter ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-modal-scrollbar">
                      {filteredPesertaModal.map((p) => {
                        const isChecked = formPesertaTerpilih.includes(p.id);
                        const isMhs =
                          (p.kategori_pendaftar || "").toLowerCase() === "mahasiswa";
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
                            {/* Checkbox box */}
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all duration-200 shrink-0 ${
                                isChecked
                                  ? "bg-[#004F9F] border-[#004F9F] dark:bg-[#00A5EC] dark:border-[#00A5EC] text-white shadow-xs shadow-[#004F9F]/30 scale-105"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover/item:border-[#004F9F]/60"
                              }`}
                            >
                              {isChecked && (
                                <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                              )}
                            </div>

                            {/* Foto Profil */}
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

                            {/* Info Peserta */}
                            <div className="min-w-0 flex-1 pr-16">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                {p.nama}
                              </span>
                              <span className="block text-[10.5px] text-slate-400 truncate mt-0.5">
                                {p.institusi || p.posisi_bidang || "Peserta Magang"}
                              </span>
                            </div>

                            {/* Badge Mahasiswa / Siswa */}
                            <span
                              className={`absolute top-2.5 right-2.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider uppercase border transition-colors ${
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

                  {errors.peserta_id && (
                    <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium pt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.peserta_id}</span>
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
                      <span>Tenggat Waktu Pengerjaan (Deadline)</span>
                      <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Batas akhir tanggal dan jam pengumpulan berkas penugasan oleh peserta bimbingan
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

              {/* Info Box Sistem Penilaian Otomatis (Opsi 1) */}
              <div
                className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-[11px] leading-relaxed ${
                  isDark
                    ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-300"
                    : "bg-emerald-50/80 border-emerald-200/80 text-emerald-900"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-bold">Sistem Penilaian Otomatis Berbasis ACC:</span>
                  <p className="text-[10.5px] opacity-90 mt-0.5">
                    Peserta yang mengumpulkan <strong>tepat waktu</strong> dan disetujui (ACC) mentor otomatis meraih <strong>100 poin</strong>. Jika mengumpulkan <strong>terlambat</strong> dan di-ACC, otomatis meraih <strong>80 poin</strong>. Jika tidak mengumpulkan tugas = <strong>0 poin</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* ── BARIS 4: INSTRUKSI & PETUNJUK PENGERJAAN ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <TextInitial className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Instruksi &amp; Petunjuk Pengerjaan</span>
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
                placeholder="Tuliskan petunjuk penugasan secara terperinci, batasan arsitektur/teknologi yang digunakan, serta kriteria hasil output yang diharapkan..."
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

            {/* ── BARIS 5: TAUTAN EKSTERNAL / RUJUKAN DARING (Icon Link) ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Tautan Rujukan / Referensi Daring</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="url"
                value={tautanEksternal}
                onChange={(e) => setTautanEksternal(e.target.value)}
                placeholder="Contoh: https://github.com/repository / figma.com / drive.google.com / dokumentasi-api..."
                className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                  isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
            </div>

            {/* ── BARIS 6: LAMPIRAN BERKAS PANDUAN / SOAL (DESAIN PERSIS MODAL MATERI) ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Lampiran Berkas Panduan / Soal</span>
                  <span className="text-slate-400 font-normal">(Opsional)</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">
                  {fileMeta ? "Berkas aktif terpilih" : "Maksimal 25 MB"}
                </span>
              </label>

              {/* Input file tersembunyi */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />

              {fileMeta ? (
                /* Card Berkas Terpilih Persis Seperti FormMateriMentorModal */
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative group rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                    isDragging
                      ? isDark
                        ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                        : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                      : isDark
                      ? "border-sky-500/30 bg-gradient-to-r from-[#111927] via-[#162032] to-[#111927] hover:border-sky-400/50"
                      : "border-blue-200/90 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-slate-50/80 hover:border-[#004F9F]/50"
                  }`}
                >
                  {/* Drag Over Overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#004F9F]/90 text-white rounded-3xl backdrop-blur-xs animate-[fadeslide_0.15s_ease-out]">
                      <UploadCloud className="w-9 h-9 animate-bounce mb-1 text-white" />
                      <span className="text-xs font-black">Lepaskan berkas di sini untuk mengganti</span>
                      <span className="text-[10px] text-blue-100">Berkas baru akan otomatis terpilih</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Kolom Kiri: Ikon Tipe Berkas & Detail Berkas */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border ${fileMeta.badgeColor} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                      >
                        <fileMeta.icon className="w-6 h-6 stroke-[2.2]" />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#0B1442] dark:bg-[#004F9F] text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                          {fileMeta.ext}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[220px] sm:max-w-md"
                            title={fileMeta.name}
                          >
                            {fileMeta.name}
                          </h4>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{fileLampiran ? "Siap Diunggah" : "Berkas Tersimpan"}</span>
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5 text-[11px] shadow-2xs">
                            {fileMeta.size}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {fileLampiran
                                ? "Dokumen berhasil dipilih"
                                : "Dokumen panduan tugas aktif di server"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Aksi (Ganti Berkas & Hapus) */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group/btnGanti inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 hover:text-[#004F9F] dark:hover:text-[#00A5EC] hover:border-blue-300 dark:hover:border-sky-500/30 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 group-hover/btnGanti:rotate-180" />
                        <span>Ganti Berkas</span>
                      </button>

                      {fileLampiran && (
                        <button
                          type="button"
                          onClick={() => {
                            setFileLampiran(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          title="Hapus berkas pilihan ini"
                          className="group/btnHapus inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 hover:border-rose-300 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 transition-transform duration-200 group-hover/btnHapus:scale-110" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Area Drag & Drop Zone Saat Belum Ada File */
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group/upload relative p-7 sm:p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? isDark
                        ? "border-sky-400 bg-sky-950/60 ring-4 ring-sky-500/20 scale-[1.01]"
                        : "border-[#004F9F] bg-blue-50/90 ring-4 ring-[#004F9F]/15 scale-[1.01]"
                      : isDark
                      ? "border-white/10 hover:border-sky-500/40 bg-slate-900/40 hover:bg-slate-900/60"
                      : "border-slate-200 hover:border-[#004F9F] bg-slate-50/60 hover:bg-blue-50/20"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] mb-2.5 transition-all duration-300 group-hover/upload:-translate-y-1.5 group-hover/upload:scale-110 group-hover/upload:bg-[#004F9F] group-hover/upload:text-white shadow-2xs">
                    <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <span className="text-xs font-black text-[#004F9F] dark:text-[#00A5EC] group-hover/upload:underline cursor-pointer">
                    {isDragging
                      ? "Lepaskan berkas di sini untuk mengunggah"
                      : "Pilih atau seret berkas panduan / soal ke sini"}
                  </span>

                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Mendukung: PDF, PPTX, DOCX, XLSX, ZIP, RAR, Gambar (Maksimal 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER MODAL (STAY / FIXED DI BAWAH) ── */}
          <div
            className={`px-6 py-4 sm:px-8 sm:py-5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
            }`}
          >
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
              <span>
                {sasaranPenerima === "spesifik"
                  ? `Tugas proyek ini akan diterbitkan khusus untuk ${formPesertaTerpilih.length} peserta terpilih.`
                  : sasaranPenerima === "mahasiswa"
                  ? "Tugas proyek ini akan diterbitkan khusus untuk seluruh mahasiswa bimbingan."
                  : sasaranPenerima === "siswa"
                  ? "Tugas proyek ini akan diterbitkan khusus untuk seluruh siswa bimbingan."
                  : "Tugas proyek ini akan diterbitkan untuk seluruh peserta aktif bimbingan Anda."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="group/btn flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border-0 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                )}
                <span>{isEditing ? "Simpan Perubahan" : "Terbitkan Tugas"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FormTugasProyekModal = (props) => {
  if (!props.isOpen) return null;
  return (
    <FormTugasProyekDialog
      key={props.selectedTugas?.id ? `edit-${props.selectedTugas.id}` : "new-task"}
      {...props}
    />
  );
};

export default FormTugasProyekModal;
