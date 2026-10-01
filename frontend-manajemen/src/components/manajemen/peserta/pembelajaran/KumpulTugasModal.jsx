import { useState } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  Save,
  Download,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Paperclip,
  Trash2,
} from "lucide-react";
import { kumpulTugasPeserta } from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";
import { toastSuccess, toastError } from "../../../../utils/swal";

export const KumpulTugasModal = ({ tugas, onClose, onSaved }) => {
  const pengumpulan = tugas?.pengumpulan;
  const isSudahDinilai = pengumpulan?.status === "dinilai";
  const isRevisi = pengumpulan?.status === "revisi" || tugas?.status_tugas === "revisi";

  const [file, setFile] = useState(null);
  const [linkTugas, setLinkTugas] = useState(pengumpulan?.link_tugas || "");
  const [catatanPeserta, setCatatanPeserta] = useState(pengumpulan?.catatan_peserta || "");
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileLampiranMentor = tugas?.file_lampiran || tugas?.file_path;
  const tautanRefMentor = tugas?.tautan_eksternal || tugas?.link_eksternal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !pengumpulan?.file_pengumpulan && !linkTugas.trim() && !catatanPeserta.trim()) {
      toastError("Harap sertakan berkas tugas, tautan hasil karya, atau catatan penyelesaian.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) formData.append("file_tugas", file);
      if (linkTugas.trim()) formData.append("link_tugas", linkTugas.trim());
      if (catatanPeserta.trim()) formData.append("catatan_peserta", catatanPeserta.trim());

      await kumpulTugasPeserta(tugas.id, formData);
      toastSuccess(pengumpulan ? "Pengumpulan tugas berhasil diperbarui." : "Tugas magang berhasil dikumpulkan.");
      if (onSaved) onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengumpulkan tugas.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  if (!tugas) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] shadow-2xl overflow-hidden my-auto animate-[modalPop_0.25s_ease-out]">
        {/* Header Khas Diskominfo Blue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-5 sm:px-7 py-4.5 sm:py-5 text-white">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-sky-200 border border-white/15">
                <Upload className="w-3 h-3 text-[#00A5EC]" />
                <span>Pengumpulan Tugas Magang</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-1">
                {tugas.judul}
              </h3>
              <p className="text-[11px] text-white/70 flex items-center gap-1.5 flex-wrap">
                <Calendar className="w-3 h-3" />
                <span>Tenggat: {formatTanggalPresensi(tugas.tenggat_waktu)}</span>
                {tugas.mentor?.nama && (
                  <>
                    <span>•</span>
                    <span>Mentor: {tugas.mentor.nama}</span>
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-4.5">
          {/* Instruksi & Deskripsi Tugas */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span>Instruksi &amp; Ketentuan Penugasan</span>
            </span>
            <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {tugas.deskripsi || "Silakan selesaikan tugas ini sesuai dengan arahan dan panduan teknis yang diberikan oleh mentor pembimbing."}
            </p>

            {/* Lampiran Panduan Mentor */}
            {(fileLampiranMentor || tautanRefMentor) && (
              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">Berkas/Tautan Panduan:</span>
                <div className="flex items-center gap-2">
                  {fileLampiranMentor && (
                    <a
                      href={getFileUrl(fileLampiranMentor)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen Panduan</span>
                    </a>
                  )}
                  {tautanRefMentor && (
                    <a
                      href={tautanRefMentor}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-indigo-200/90 dark:border-indigo-800/60 bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-2xs hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tautan Acuan</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kartu Status Penilaian & Feedback Mentor jika sudah dinilai / ada revisi */}
          {pengumpulan && (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isSudahDinilai
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40"
                  : isRevisi
                  ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/40"
                  : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  {isSudahDinilai ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isRevisi ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Status Pengumpulan:</span>
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black ${
                    isSudahDinilai
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : isRevisi
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                  }`}
                >
                  {isSudahDinilai
                    ? `Sudah Dinilai: ${pengumpulan.nilai}/100`
                    : isRevisi
                    ? "Perlu Revisi Jawaban"
                    : "Menunggu Review Mentor"}
                </span>
              </div>

              {pengumpulan.catatan_mentor && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Catatan Evaluasi dari Mentor:
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 italic">
                    &ldquo;{pengumpulan.catatan_mentor}&rdquo;
                  </p>
                </div>
              )}

              {pengumpulan.file_pengumpulan && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Berkas yang pernah dikirim:</span>
                  <a
                    href={getFileUrl(pengumpulan.file_pengumpulan)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Unduh Berkas Terkumpul</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Form Pengumpulan */}
          <form id="form-kumpul-tugas" onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Upload Berkas */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                Unggah Berkas Tugas (PDF / ZIP / Dokumen)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
                  isDragging
                    ? "border-[#004F9F] bg-blue-50/50 dark:bg-sky-950/30"
                    : "border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-400"
                }`}
              >
                <input
                  type="file"
                  id="file-tugas-input"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {file ? (
                  <div className="flex items-center justify-between gap-3 text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#004F9F] dark:text-[#00A5EC]">
                        <Paperclip className="w-4.5 h-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti berkas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus berkas terpilih"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-[#004F9F] dark:text-[#00A5EC] flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tarik &amp; lepas berkas di sini atau <span className="text-[#004F9F] dark:text-sky-400 underline">pilih berkas</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mendukung PDF, DOCX, XLSX, ZIP, RAR, atau berkas arsip (Maks. 25MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Tautan Proyek / Repositori */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                Tautan Hasil Karya / Repositori / Demo (Opsional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-3.5 h-3.5" />
                </span>
                <input
                  type="url"
                  value={linkTugas}
                  onChange={(e) => setLinkTugas(e.target.value)}
                  placeholder="https://github.com/... atau https://figma.com/... atau tautan Drive"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004F9F] transition-all"
                />
              </div>
            </div>

            {/* 3. Catatan Peserta */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                Catatan / Keterangan Tambahan untuk Mentor (Opsional)
              </label>
              <textarea
                rows={3}
                value={catatanPeserta}
                onChange={(e) => setCatatanPeserta(e.target.value)}
                placeholder="Tuliskan kendala teknis, catatan penjelasan tugas, atau pesan singkat kepada mentor pembimbing..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004F9F] transition-all leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Footer Aksi */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            form="form-kumpul-tugas"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Mengirim Jawaban...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{pengumpulan ? "Perbarui Pengumpulan" : "Kirim Jawaban Tugas"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KumpulTugasModal;
