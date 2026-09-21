import { useState } from "react";
import { Upload, Link as LinkIcon, Save } from "lucide-react";
import { uploadLaporanAkhirPeserta } from "../../../../services/pesertaService";
import { toastSuccess, toastError } from "../../../../utils/swal";

export const LaporanUploadForm = ({ pendaftaran = {}, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [judul, setJudul] = useState(pendaftaran?.judul_laporan_akhir || "");
  const [linkProyek, setLinkProyek] = useState(pendaftaran?.link_proyek || "");
  const [catatan, setCatatan] = useState(pendaftaran?.catatan_laporan_akhir || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judul.trim()) {
      toastError("Judul laporan akhir magang wajib diisi.");
      return;
    }
    if (!file && !pendaftaran?.file_laporan_akhir) {
      toastError("Harap pilih berkas PDF Laporan Akhir.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("judul", judul.trim());
      formData.append("link_proyek", linkProyek.trim());
      formData.append("catatan", catatan.trim());

      await uploadLaporanAkhirPeserta(formData);
      toastSuccess("Laporan akhir berhasil diunggah untuk direview mentor.");
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengunggah laporan akhir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-6 shadow-xs">
      <h3 className="text-base font-black text-slate-900 dark:text-white">
        Formulir Pengumpulan Laporan
      </h3>
      <p className="text-xs text-slate-400 mt-0.5">
        Lengkapi seluruh informasi laporan akhir magang Anda di bawah ini
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Judul Laporan */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
            Judul Laporan Akhir Magang <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Perancangan Sistem Manajemen Magang Terintegrasi pada Diskominfo..."
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
          />
        </div>

        {/* Upload Berkas PDF */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
            Berkas Naskah Laporan (Format PDF) <span className="text-rose-500">*</span>
          </label>
          <div className="relative border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 text-center hover:border-[#004F9F] dark:hover:border-sky-400 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="w-7 h-7 text-[#004F9F] dark:text-sky-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {file
                  ? file.name
                  : pendaftaran.file_laporan_akhir
                  ? "Ganti Berkas PDF Laporan"
                  : "Pilih atau seret berkas PDF laporan ke sini"}
              </p>
              <p className="text-[11px] text-slate-400">
                Maksimal ukuran 20 MB (.PDF)
              </p>
            </div>
          </div>
        </div>

        {/* Link Luaran Proyek / Repositori */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
            Tautan Demo Proyek / Repositori Kode / Video Luaran (Opsional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={linkProyek}
              onChange={(e) => setLinkProyek(e.target.value)}
              placeholder="https://github.com/... atau https://youtube.com/..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
            />
          </div>
        </div>

        {/* Abstrak / Catatan */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
            Abstrak Singkat &amp; Catatan untuk Mentor
          </label>
          <textarea
            rows={4}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Ringkas latar belakang, permasalahan, solusi yang dibangun, serta hasil pengujian yang dicapai selama masa magang..."
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#004F9F] focus:outline-none focus:ring-3 focus:ring-[#004F9F]/10 transition-all"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Mengunggah..." : "Kirim Laporan Akhir"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LaporanUploadForm;
