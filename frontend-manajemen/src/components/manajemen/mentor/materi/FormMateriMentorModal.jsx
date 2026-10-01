import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  BookOpenText,
  ClosedCaption,
  FolderTree,
  LayersPlus,
  Sparkles,
  Target,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  Check,
  FileCode,
  FileText,
  Presentation,
  Video,
  Link2,
  ExternalLink,
  UploadCloud,
  Paperclip,
  AlignLeft,
  Info,
  Send,
  RefreshCw,
  AlertCircle,
  Save,
  Tags,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { CustomSelectDropdown } from "../peserta/CustomSelectDropdown";
import {
  createMateriMentor,
  updateMateriMentor,
  createKategoriMateriMentor
} from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

// Opsi Format Media Pembelajaran
const FORMAT_MEDIA_OPTIONS = [
  {
    value: "dokumen",
    label: "Dokumen File (PDF / Word / ZIP)",
    icon: FileText,
  },
  {
    value: "slide",
    label: "Slide Presentasi (PPTX)",
    icon: Presentation,
  },
  {
    value: "video",
    label: "Video Pembelajaran (MP4)",
    icon: Video,
  },
  {
    value: "tautan",
    label: "Tautan Daring (Repository / Cloud)",
    icon: Link2,
  },
];

const FormMateriMentorDialog = ({
  isEditing = false,
  selectedMateri = null,
  kategoriList = [],
  pesertaBimbingan = [],
  onClose,
  onSuccess,
  onKategoriAdded,
  isDark = false,
}) => {
  // 1. Judul Materi
  const [formJudul, setFormJudul] = useState(() =>
    isEditing && selectedMateri ? selectedMateri.judul || "" : ""
  );

  // 2. Kategori Modul
  const [formKategori, setFormKategori] = useState(() => {
    if (isEditing && selectedMateri?.kategori) return selectedMateri.kategori;
    return "";
  });
  const [customKategoriList, setCustomKategoriList] = useState([]);
  const [modalKategoriBaruOpen, setModalKategoriBaruOpen] = useState(false);
  const [inputNamaKategoriBaru, setInputNamaKategoriBaru] = useState("");
  const [errorKategoriBaru, setErrorKategoriBaru] = useState("");
  const [submittingKategori, setSubmittingKategori] = useState(false);

  const handleSimpanKategoriBaru = async () => {
    const trimmed = inputNamaKategoriBaru.trim();
    if (!trimmed) {
      setErrorKategoriBaru("Nama kategori tidak boleh kosong.");
      return;
    }
    setSubmittingKategori(true);
    try {
      await createKategoriMateriMentor({ nama: trimmed });
      setCustomKategoriList((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setFormKategori(trimmed);
      setModalKategoriBaruOpen(false);
      setInputNamaKategoriBaru("");
      setErrorKategoriBaru("");
      toastSuccess(`Kategori "${trimmed}" berhasil disimpan`);
      if (onKategoriAdded) {
        onKategoriAdded(trimmed);
      }
    } catch (err) {
      console.error("Gagal menyimpan kategori baru:", err);
      const msg = err.response?.data?.message || "Gagal menyimpan kategori ke database.";
      setErrorKategoriBaru(msg);
      toastError(msg);
    } finally {
      setSubmittingKategori(false);
    }
  };

  // 3. Format Media
  const [formTipeMedia, setFormTipeMedia] = useState(() =>
    isEditing && selectedMateri ? selectedMateri.tipe_media || "dokumen" : "dokumen"
  );

  // 4. Tautan Eksternal
  const [formTautanEksternal, setFormTautanEksternal] = useState(() =>
    isEditing && selectedMateri ? selectedMateri.tautan_eksternal || "" : ""
  );

  // 5. Berkas Lampiran & Drag and Drop Handler
  const [formFile, setFormFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
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

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 25 * 1024 * 1024) {
        toastError("Ukuran file melebihi batas maksimal 25 MB.");
        return;
      }
      setFormFile(droppedFile);
    }
  };

  // 6. Helper & metadata berkas terpilih / berkas yang sudah ada
  const fileMeta = useMemo(() => {
    let name = "";
    let size = "";
    let ext = "FILE";

    if (formFile) {
      name = formFile.name;
      size = (formFile.size / (1024 * 1024)).toFixed(2) + " MB";
      ext = (name.split(".").pop() || "FILE").toUpperCase();
    } else if (isEditing && selectedMateri?.file_materi) {
      name = selectedMateri.file_materi.split("/").pop();
      size = "Tersimpan di Server";
      ext = (name.split(".").pop() || "FILE").toUpperCase();
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
    } else if (["mp4", "mkv", "webm"].includes(lowerExt)) {
      badgeColor =
        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      icon = Video;
    }

    return { name, size, ext, badgeColor, icon };
  }, [formFile, isEditing, selectedMateri]);

  // 7. Deskripsi
  const [formDeskripsi, setFormDeskripsi] = useState(() =>
    isEditing && selectedMateri ? selectedMateri.deskripsi || "" : ""
  );

  // 7. Sasaran Penerima Materi
  const [sasaranPenerima, setSasaranPenerima] = useState(() => {
    if (isEditing && selectedMateri) {
      if (selectedMateri.target_peserta === "spesifik") return "spesifik";
      if (selectedMateri.target_jenjang === "mahasiswa") return "mahasiswa";
      if (selectedMateri.target_jenjang === "siswa") return "siswa";
      return "semua";
    }
    return "semua";
  });

  // Checklist peserta jika sasaran "spesifik"
  const [modalFilterJenjang, setModalFilterJenjang] = useState("semua");
  const [formPesertaTerpilih, setFormPesertaTerpilih] = useState(() => {
    if (isEditing && selectedMateri?.peserta_akses) {
      return selectedMateri.peserta_akses.map((p) => p.id);
    }
    return [];
  });

  // State loading & error
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (modalKategoriBaruOpen) {
          setModalKategoriBaruOpen(false);
          setInputNamaKategoriBaru("");
          setErrorKategoriBaru("");
        } else if (!submitting) {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose, modalKategoriBaruOpen]);

  // Perhitungan kuota peserta bimbingan
  const totalMahasiswa = useMemo(
    () =>
      pesertaBimbingan.filter(
        (p) => (p.kategori_pendaftar || "").toLowerCase() === "mahasiswa"
      ).length,
    [pesertaBimbingan]
  );
  const totalSiswa = useMemo(
    () =>
      pesertaBimbingan.filter(
        (p) => (p.kategori_pendaftar || "").toLowerCase() === "siswa"
      ).length,
    [pesertaBimbingan]
  );

  // Checklist handler
  const togglePeserta = (id) => {
    setFormPesertaTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredPesertaModal = useMemo(() => {
    if (modalFilterJenjang === "semua") return pesertaBimbingan;
    return pesertaBimbingan.filter(
      (p) => (p.kategori_pendaftar || "").toLowerCase() === modalFilterJenjang
    );
  }, [pesertaBimbingan, modalFilterJenjang]);

  // Opsi dropdown kategori untuk CustomSelectDropdown (Nama murni tanpa embel-embel & Icon Tags)
  const kategoriOptions = useMemo(() => {
    const allNames = new Set();
    const list = [];

    kategoriList.forEach((k) => {
      if (k.nama && !allNames.has(k.nama)) {
        allNames.add(k.nama);
        list.push({
          value: k.nama,
          label: k.nama,
          icon: Tags,
        });
      }
    });

    customKategoriList.forEach((nama) => {
      if (nama && !allNames.has(nama)) {
        allNames.add(nama);
        list.push({
          value: nama,
          label: nama,
          icon: Tags,
        });
      }
    });

    if (formKategori && !allNames.has(formKategori)) {
      list.unshift({
        value: formKategori,
        label: formKategori,
        icon: Tags,
      });
    }

    return list;
  }, [kategoriList, customKategoriList, formKategori]);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formJudul.trim()) {
      const msg = "Judul materi pembelajaran wajib diisi.";
      setFormError(msg);
      toastError(msg);
      return;
    }

    const finalKategori = formKategori.trim();
    if (!finalKategori) {
      const msg = "Kategori modul wajib dipilih atau dibuat terlebih dahulu.";
      setFormError(msg);
      toastError(msg);
      return;
    }

    let targetPesertaVal = "semua_bimbingan";
    let targetJenjangVal = "semua";

    if (sasaranPenerima === "spesifik") {
      targetPesertaVal = "spesifik";
      if (formPesertaTerpilih.length === 0) {
        const msg = "Pilih minimal 1 peserta bimbingan yang berhak menerima materi ini.";
        setFormError(msg);
        toastError(msg);
        return;
      }
    } else if (sasaranPenerima === "mahasiswa") {
      targetJenjangVal = "mahasiswa";
    } else if (sasaranPenerima === "siswa") {
      targetJenjangVal = "siswa";
    }

    const formData = new FormData();
    formData.append("judul", formJudul.trim());
    formData.append("kategori", finalKategori);
    formData.append("deskripsi", formDeskripsi.trim());
    formData.append("tipe_media", formTipeMedia);
    formData.append("tautan_eksternal", formTautanEksternal.trim());
    formData.append("target_peserta", targetPesertaVal);
    formData.append("target_jenjang", targetJenjangVal);

    if (targetPesertaVal === "spesifik") {
      formPesertaTerpilih.forEach((id) => {
        formData.append("peserta_ids[]", id);
      });
    }

    if (formFile) {
      formData.append("file_materi", formFile);
    }

    setSubmitting(true);
    try {
      if (isEditing && selectedMateri) {
        await updateMateriMentor(selectedMateri.id, formData);
        const successMsg = "Materi berhasil diperbarui";
        toastSuccess(successMsg);
        onSuccess(successMsg);
      } else {
        await createMateriMentor(formData);
        const successMsg = "Materi baru berhasil dipublikasikan";
        toastSuccess(successMsg);
        onSuccess(successMsg);
      }
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan materi:", err);
      const msg =
        err.response?.data?.message ||
        (isEditing
          ? "Gagal memperbarui materi pembelajaran."
          : "Gagal mempublikasikan materi pembelajaran baru.");
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={() => {
        if (modalKategoriBaruOpen) {
          setModalKategoriBaruOpen(false);
          setInputNamaKategoriBaru("");
          setErrorKategoriBaru("");
        } else if (!submitting) {
          onClose();
        }
      }}
    >
      {/* ── KOTAK MODAL UTAMA: TAMBAH / EDIT MATERI PEMBELAJARAN ── */}
      <div
        className={`relative w-full max-w-4xl my-auto rounded-3xl shadow-2xl flex-col max-h-[92vh] overflow-hidden border-0 ${
          modalKategoriBaruOpen
            ? "hidden"
            : "flex animate-[modalFadeUp_0.25s_ease-out]"
        } ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL (STAY / FIXED DI ATAS) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4 sm:px-8 sm:py-5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          {/* Watermark Icon */}
          <BookOpenText
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <BookOpenText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEditing ? "Perbarui Modul Pembelajaran" : "Materi Pembelajaran Baru"}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {isEditing ? "Edit Materi Pembelajaran" : "Tambah Materi Pembelajaran Baru"}
                </h3>
                {/* Kalimat lebih umum sesuai arahan pengguna */}
                <p className="text-[11px] sm:text-xs text-white/75 mt-0.5">
                  {isEditing
                    ? "Perbarui berkas materi pembelajaran dan sasaran peserta bimbingan"
                    : "Kelola dan bagikan materi pembelajaran untuk peserta bimbingan Anda"}
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
          {/* 
            SCROLLABLE BODY:
            Hanya bagian ini yang bisa di-scroll secara independen.
            Header di atas dan Footer di bawah 100% STAY!
          */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-modal-scrollbar">
            {/* Alert Error */}
            {formError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-[fadeslide_0.2s_ease-out]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* ── BARIS 1: JUDUL MATERI PEMBELAJARAN (Icon ClosedCaption) ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ClosedCaption className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  Judul Materi Pembelajaran <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">Wajib diisi</span>
              </label>
              <input
                type="text"
                required
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                placeholder="Contoh: SOP Deployment Aplikasi & Standar Git Workflow Dinas"
                className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                  isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
            </div>

            {/* ── BARIS 2: KATEGORI MODUL (Icon FolderTree Statis + Button LayersPlus) ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <FolderTree className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Kategori Modul</span>
                  <span className="text-rose-500">*</span>
                </label>

                {/* Tombol Kategori Baru membuka Modal Kategori Baru */}
                <button
                  type="button"
                  onClick={() => {
                    setInputNamaKategoriBaru("");
                    setErrorKategoriBaru("");
                    setModalKategoriBaruOpen(true);
                  }}
                  className="group inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-[#004F9F] dark:text-[#00A5EC] border border-[#004F9F]/20 dark:border-[#00A5EC]/30 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                >
                  <LayersPlus className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 group-hover:scale-110" />
                  <span>Kategori Baru</span>
                </button>
              </div>

              <CustomSelectDropdown
                value={formKategori}
                onChange={setFormKategori}
                options={kategoriOptions}
                placeholder="Pilih Kategori Modul..."
                icon={Tags}
                isDark={isDark}
                fullWidth
                className="h-11 rounded-2xl"
                maxMenuHeight={280}
              />
            </div>

            {/* ── BARIS 3: SASARAN PENERIMA MATERI (Grid 2 Kotak per Baris) ── */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
                isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Target className="w-4 h-4 text-[#004F9F] dark:text-[#00A5EC]" />
                    <span>Sasaran Penerima Materi Pembelajaran</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih cakupan kelompok atau tentukan peserta tertentu yang berhak mengakses materi
                  </p>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span>Total Bimbingan:</span>
                  <strong className="text-[#004F9F] dark:text-[#00A5EC]">{pesertaBimbingan.length} orang</strong>
                </span>
              </div>

              {/* Grid 2 Kotak per Baris - Model Batch Biru Kominfo saat Aktif, Abu-abu saat Tidak Aktif */}
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
                    desc: `Otomatis seluruh mahasiswa bimbingan jenjang perguruan tinggi (${totalMahasiswa} orang).`,
                    badgeText: `${totalMahasiswa} Mhs`,
                    icon: GraduationCap,
                  },
                  {
                    id: "siswa",
                    title: "Khusus Siswa",
                    desc: `Otomatis seluruh siswa magang yang Anda bimbing (${totalSiswa} orang).`,
                    badgeText: `${totalSiswa} Siswa`,
                    icon: Building2,
                  },
                  {
                    id: "spesifik",
                    title: "Pilih Peserta Manual",
                    desc: `Tentukan nama peserta bimbingan tertentu secara fleksibel (${formPesertaTerpilih.length} dipilih).`,
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
                      onClick={() => setSasaranPenerima(item.id)}
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
                            ? "bg-blue-50 text-[#004F9F] border border-[#004F9F]/25 dark:bg-[#004F9F]/25 dark:text-[#00A5EC] dark:border-[#00A5EC]/40 shadow-xs"
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
                        className={`absolute right-3.5 top-3.5 w-5 h-5 rounded-full border-2 grid place-items-center transition-all duration-200 ${
                          isSelected
                            ? "border-[#004F9F] bg-[#004F9F] dark:border-[#00A5EC] dark:bg-[#00A5EC] shadow-2xs"
                            : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-white block shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Panel Checklist Peserta */}
              {sasaranPenerima === "spesifik" && (
                <div className="pt-3 border-t border-slate-200/70 dark:border-white/5 space-y-3 animate-[fadeslide_0.2s_ease-out]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Peserta Terpilih:{" "}
                      <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">
                        {formPesertaTerpilih.length}
                      </strong>{" "}
                      dari {pesertaBimbingan.length} orang
                    </div>
                  </div>

                  {modalFilterJenjang !== "semua" && (
                    <div className="text-[10.5px] text-slate-400 font-medium">
                      Menampilkan jenjang {modalFilterJenjang === "mahasiswa" ? "Mahasiswa" : "Siswa"} ({filteredPesertaModal.length} orang)
                    </div>
                  )}

                  {pesertaBimbingan.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 py-3 text-center">
                      Belum ada peserta bimbingan aktif yang terdaftar untuk akun Anda.
                    </p>
                  ) : filteredPesertaModal.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Tidak ada peserta bimbingan untuk jenjang {modalFilterJenjang === "mahasiswa" ? "Mahasiswa" : "Siswa"}.
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
                            {/* Checkbox box yang diperbagus */}
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all duration-200 shrink-0 ${
                                isChecked
                                  ? "bg-[#004F9F] border-[#004F9F] dark:bg-[#00A5EC] dark:border-[#00A5EC] text-white shadow-xs shadow-[#004F9F]/30 scale-105"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover/item:border-[#004F9F]/60"
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                            </div>

                            {/* Foto Profil */}
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/60 dark:border-white/10">
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

                            {/* Info Peserta (Nama & Asal Institusi) */}
                            <div className="min-w-0 flex-1 pr-16">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                {p.nama}
                              </span>
                              <span className="block text-[10.5px] text-slate-400 truncate mt-0.5">
                                {p.institusi || p.posisi_bidang || "Peserta Magang"}
                              </span>
                            </div>

                            {/* Batch Mahasiswa / Siswa di Pojok Kanan Atas (Ukuran Diperkecil) */}
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
                </div>
              )}
            </div>

            {/* ── BARIS 4: FORMAT MEDIA PEMBELAJARAN (Icon Statis FileCode) ── */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                <span>Format Media Pembelajaran</span>
                <span className="text-rose-500">*</span>
              </label>

              <CustomSelectDropdown
                value={formTipeMedia}
                onChange={setFormTipeMedia}
                options={FORMAT_MEDIA_OPTIONS}
                isDark={isDark}
                fullWidth
                className="h-11 rounded-2xl"
              />
            </div>

            {/* ── BARIS 5: TAUTAN DARING EKSTERNAL (1 KOLOM PENUH) ── */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                <span>Tautan Daring Eksternal</span>
                <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="url"
                value={formTautanEksternal}
                onChange={(e) => setFormTautanEksternal(e.target.value)}
                placeholder="https://drive.google.com / youtube.com / github.com..."
                className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                  isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC]"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
            </div>

            {/* ── BARIS 6: UNGGAH BERKAS MATERI (Tampilan Sangat Menarik Saat Terpilih) ── */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                  <span>Unggah Berkas Materi</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {formFile || (isEditing && selectedMateri?.file_materi)
                    ? "Berkas aktif terpilih"
                    : "Maksimal 25 MB"}
                </span>
              </label>

              {/* JIKA BERKAS SUDAH DIPILIH / SUDAH ADA DARI SERVER */}
              {formFile || (isEditing && selectedMateri?.file_materi) ? (
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
                  {/* Hidden input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFormFile(e.target.files[0] || null)}
                    className="hidden"
                    id="modal_file_materi_upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.png,.jpg,.jpeg"
                  />

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
                      {/* Ikon Tipe Berkas Cantik & Elegan */}
                      <div className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border ${fileMeta.badgeColor} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                        <fileMeta.icon className="w-6 h-6 stroke-[2.2]" />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#0B1442] dark:bg-[#004F9F] text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                          {fileMeta.ext}
                        </span>
                      </div>

                      {/* Informasi Nama, Ukuran, dan Status */}
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
                            <span>{formFile ? "Siap Diunggah" : "Berkas Tersimpan"}</span>
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5 text-[11px] shadow-2xs">
                            {fileMeta.size}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{formFile ? "Dokumen berhasil dipilih" : "Dokumen modul aktif pada server"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Aksi (Ganti Berkas & Hapus) */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10 w-full sm:w-auto justify-end">
                      {/* Tombol Ganti Berkas */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="group/btnGanti inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 hover:text-[#004F9F] dark:hover:text-[#00A5EC] hover:border-blue-300 dark:hover:border-sky-500/30 transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] transition-transform duration-300 group-hover/btnGanti:rotate-180" />
                        <span>Ganti Berkas</span>
                      </button>

                      {/* Tombol Hapus / Batal Pilih */}
                      {formFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormFile(null);
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
                /* KOTAK UNGGAH DROPZONE SAAT BELUM ADA FILE */
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFormFile(e.target.files[0] || null)}
                    className="hidden"
                    id="modal_file_materi_upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.png,.jpg,.jpeg"
                  />

                  {/* Ikon Upload Cantik dengan Lingkaran Glow */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] mb-2.5 transition-all duration-300 group-hover/upload:-translate-y-1.5 group-hover/upload:scale-110 group-hover/upload:bg-[#004F9F] group-hover/upload:text-white shadow-2xs">
                    <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <span className="text-xs font-black text-[#004F9F] dark:text-[#00A5EC] group-hover/upload:underline cursor-pointer">
                    {isDragging ? "Lepaskan berkas di sini untuk mengunggah" : "Pilih atau seret berkas materi ke sini"}
                  </span>

                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Mendukung: PDF, PPTX, DOCX, XLSX, ZIP, RAR (Maksimal 25 MB)
                  </p>
                </div>
              )}
            </div>

            {/* ── BARIS 7: DESKRIPSI / PETUNJUK BELAJAR (1 KOLOM PENUH) ── */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                <span>Deskripsi / Petunjuk Belajar Modul</span>
              </label>
              <textarea
                rows={4}
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                placeholder="Tuliskan arahan, rangkuman, atau poin petunjuk apa yang harus dipelajari peserta bimbingan dari modul ini..."
                className={`w-full p-3.5 text-xs rounded-2xl border font-medium transition-all ${
                  isDark
                    ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC]"
                    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15`}
              />
            </div>
          </div>

          {/* 
            ── FOOTER MODAL (STAY / FIXED DI BAWAH) ──
            Icon Info abu-abu & Button Batal dengan animasi hover
          */}
          <div
            className={`px-6 py-4 sm:px-8 sm:py-4.5 border-t shrink-0 flex items-center justify-between gap-3 shadow-md z-10 ${
              isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
            }`}
          >
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Materi langsung tersinkronisasi ke portal peserta bimbingan</span>
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
                <span>{isEditing ? "Simpan Perubahan" : "Publikasikan Materi"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── KOTAK 2: MODAL POP-UP TAMBAH KATEGORI BARU (HANYA KOTAKNYA YANG DIANIMASIKAN) ── */}
      {modalKategoriBaruOpen && (
        <div
          className={`relative w-full max-w-lg my-auto rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
            isDark
              ? "bg-[#141a24] text-slate-100 shadow-black/60"
              : "bg-white text-slate-900 shadow-slate-900/25"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
              {/* ── HEADER MODAL (DISEDERHANAKAN & SKALA LEBIH RINGKAS) ── */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 py-3.5 sm:px-6 sm:py-4 shrink-0 border-0">
                {/* Ambient Glow */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
                {/* Watermark Icon */}
                <LayersPlus
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-20 h-20 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
                  strokeWidth={1}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                      <LayersPlus className="w-4 h-4 text-white" />
                      <span className="absolute -inset-0.5 rounded-xl border border-[#00A5EC]/40 animate-pulse" />
                    </span>
                    <div>
                      <div className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2 py-0.5">
                        <Sparkles className="w-2 h-2 animate-pulse" />
                        <span>Kategori Modul Baru</span>
                      </div>
                      <h3 className="text-sm sm:text-[15px] font-black text-white leading-tight">
                        Tambah Kategori Modul Baru
                      </h3>
                      <p className="text-[10px] sm:text-[10.5px] text-white/70 mt-0.5 leading-snug">
                        Kelola dan buat kategori baru untuk materi pembelajaran bimbingan Anda
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalKategoriBaruOpen(false);
                      setInputNamaKategoriBaru("");
                      setErrorKategoriBaru("");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
                    title="Tutup (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── BODY MODAL ── */}
              <div className="p-6 sm:p-7 space-y-5">
                {/* Field Input Nama Kategori */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
                      <span>Nama Kategori Modul</span>
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-normal">Wajib diisi</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={inputNamaKategoriBaru}
                      onChange={(e) => {
                        setInputNamaKategoriBaru(e.target.value);
                        if (errorKategoriBaru) setErrorKategoriBaru("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSimpanKategoriBaru();
                        }
                      }}
                      placeholder="Contoh: Keamanan Jaringan & Server Dinas..."
                      className={`w-full h-11 px-4 text-xs rounded-2xl border font-medium transition-all ${
                        isDark
                          ? "bg-slate-900/70 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#00A5EC] focus:bg-slate-900"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                      } focus:outline-none focus:ring-3 focus:ring-[#00A5EC]/15 ${
                        errorKategoriBaru ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : ""
                      }`}
                    />
                  </div>
                  {errorKategoriBaru && (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-[fadeslide_0.2s_ease-out]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorKategoriBaru}</span>
                    </p>
                  )}
                </div>

                {/* Rekomendasi Cepat / Saran Kategori */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200/80"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00A5EC]" />
                    <span>Saran Kategori Cepat:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Keamanan Jaringan & Server",
                      "Pengembangan Web & API",
                      "Standar Koding & Git",
                      "Desain Grafis & UI/UX",
                      "Dokumentasi & SOP Teknis",
                      "Tata Kelola TI & Layanan Publik",
                    ].map((saran) => (
                      <button
                        key={saran}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInputNamaKategoriBaru(saran);
                          setErrorKategoriBaru("");
                        }}
                        className="group px-3 py-1.5 text-[11px] font-bold rounded-xl bg-white hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-blue-950/40 text-slate-600 hover:text-[#004F9F] dark:text-slate-300 dark:hover:text-[#00A5EC] border border-slate-200/80 hover:border-[#004F9F]/30 dark:border-white/10 dark:hover:border-[#00A5EC]/30 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                      >
                        <span className="text-[#00A5EC] mr-1 group-hover:scale-125 inline-block transition-transform">+</span>
                        <span>{saran}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── FOOTER MODAL ── */}
              <div
                className={`px-5 py-3.5 sm:px-6 sm:py-4 border-t shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 shadow-md ${
                  isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
                }`}
              >
                {/* Tombol Batal */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalKategoriBaruOpen(false);
                    setInputNamaKategoriBaru("");
                    setErrorKategoriBaru("");
                  }}
                  className={`px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  Batal
                </button>

                {/* Tombol Simpan Kategori dengan Icon Save Putih Solid + Animasi Hover */}
                <button
                  type="button"
                  disabled={submittingKategori}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimpanKategoriBaru();
                  }}
                  className="group/btnSimpan inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 text-xs font-black rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer border-0 disabled:opacity-50"
                >
                  {submittingKategori ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-white shrink-0 transition-transform duration-200 ease-out group-hover/btnSimpan:scale-115 group-hover/btnSimpan:-translate-y-0.5" />
                  )}
                  <span>{submittingKategori ? "Menyimpan..." : "Simpan Kategori"}</span>
                </button>
              </div>
            </div>
          )}
      </div>
  );
};

const FormMateriMentorModal = (props) => {
  if (!props.isOpen) return null;

  const modalKey =
    props.isEditing && props.selectedMateri
      ? `edit-${props.selectedMateri.id}`
      : "tambah-baru";

  return <FormMateriMentorDialog key={modalKey} {...props} />;
};

export default FormMateriMentorModal;
