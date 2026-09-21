import { useState } from "react";
import { X, Upload, Link as LinkIcon, FileText, Save } from "lucide-react";
import { kumpulTugasPeserta } from "../../../../services/pembelajaranService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastSuccess, toastError } from "../../../../utils/swal";

export const KumpulTugasModal = ({ tugas, onClose, onSaved }) => {
  const pengumpulan = tugas?.pengumpulan;
  const [file, setFile] = useState(null);
  const [linkProyek, setLinkProyek] = useState(pengumpulan?.link_proyek || "");
  const [catatan, setCatatan] = useState(pengumpulan?.catatan || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !linkProyek.trim() && !catatan.trim()) {
      toastError("Harap sertakan file, tautan proyek, atau catatan penyelesaian tugas.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (linkProyek.trim()) formData.append("link_proyek", linkProyek.trim());
      if (catatan.trim()) formData.append("catatan", catatan.trim());

      await kumpulTugasPeserta(tugas.id, formData);
      toastSuccess("Tugas berhasil dikumpulkan.");
      if (onSaved) onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengumpulkan tugas.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tugas) return null;

  const isSudahDinilai = pengumpulan?.status === "dinilai";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161b22] shadow-2xl overflow-hidden animate-[modalPop_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {pengumpulan ? "Pengumpulan Tugas" : "Kumpulkan Tugas"}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {tugas.judul}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Penilaian Card if already submitted */}
          {pengumpulan && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Status Tugas:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black capitalize ${
                    isSudahDinilai
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-500/20"
                  }`}
                >
                  {isSudahDinilai ? `Dinilai: ${pengumpulan.nilai}/100` : "Menunggu Review Mentor"}
                </span>
              </div>

              {pengumpulan.catatan_mentor && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <p className="text-[11px] font-bold text-slate-500">Catatan Feedback Mentor:</p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {pengumpulan.catatan_mentor}
                  </p>
                </div>
              )}

              {pengumpulan.file_pengumpulan && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">File Terkumpul:</span>
                  <a
                    href={getFileUrl(pengumpulan.file_pengumpulan)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004F9F] dark:text-sky-400 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Berkas
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Upload File */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Upload Berkas Jawaban (PDF / ZIP / Dokumen)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-5 text-center hover:border-[#004F9F] dark:hover:border-sky-400 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.zip,.rar,.doc,.docx,.png,.jpg,.jpeg"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-6 h-6 text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {file ? file.name : "Klik atau seret file ke area ini"}
                </p>
                <p className="text-[10.5px] text-slate-400">
                  Maksimal ukuran 10 MB (PDF, ZIP, DOCX, RAR)
                </p>
              </div>
            </div>
          </div>

          {/* Link Proyek */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Link Proyek / Repositori (Opsional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={linkProyek}
                onChange={(e) => setLinkProyek(e.target.value)}
                placeholder="https://github.com/... atau https://drive.google.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Catatan / Penjelasan Tambahan (Opsional)
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan khusus kepada mentor terkait pengerjaan tugas ini..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || isSudahDinilai}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? "Mengirim..." : pengumpulan ? "Perbarui Pengumpulan" : "Kirim Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KumpulTugasModal;
