import React, { useRef, useState } from "react";
import {
  Lock,
  FileText,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const TabRevisiBerkas = ({
  dk, surface, txt, sub, isRevisi, status,
  dokumenRevisi, catatanRevisi, setCatatanRevisi,
  handleFileChangeRevisi, handleSubmitRevisi,
  errorRevisi, loadingRevisi, handleTabChange,
}) => {
  const forceRevisiForTesting = true; // SET KE false UNTUK MERESTORE LOGIC ASLINYA
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const catatanAdmin =
    status?.catatan_admin ||
    (forceRevisiForTesting
      ? "Contoh catatan admin: 'Mohon perbaiki berkas scan CV Anda yang buram dan unggah kembali berkas scan yang lebih jelas dalam format PDF.'"
      : null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileChangeRevisi({ target: { files: [file] } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
          <RefreshCcw className="w-5 h-5" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-amber-500">Revisi Berkas Pendaftaran</h2>
          <p className={`mt-0.5 text-xs ${sub}`}>Unggah ulang dokumen sesuai instruksi koreksi dari admin reviewer.</p>
        </div>
      </div>

      {!forceRevisiForTesting && !isRevisi ? (
        <div className={`relative overflow-hidden rounded-2xl border p-8 text-center shadow-sm ${surface} flex flex-col items-center justify-center`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 dark:bg-emerald-500/10 dark:text-emerald-400 animate-pulse">
            <Lock className="w-6 h-6" strokeWidth={2} />
          </span>
          <h3 className={`text-sm font-bold ${txt}`}>Revisi Tidak Diperlukan</h3>
          <p className={`mt-2 max-w-xs text-xs font-sans ${sub}`}>Akun Anda tidak sedang dalam status permintaan revisi.</p>
          <button
            onClick={() => handleTabChange("dashboard")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Kembali ke Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {catatanAdmin && (
            <div
              className={`relative mb-6 flex gap-3 rounded-xl border p-5 text-xs font-sans ${
                dk ? "bg-amber-400/10 border-amber-400/20" : "bg-amber-50 border-amber-200"
              }`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${dk ? "bg-amber-400/20 text-amber-300" : "bg-amber-200 text-amber-700"}`}>
                <MessageSquareText className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <div>
                <strong className={`block text-[10px] uppercase tracking-wider mb-1.5 ${dk ? "text-amber-300" : "text-amber-800"}`}>
                  Catatan Revisi dari Reviewer
                </strong>
                <span className={`italic leading-relaxed ${dk ? "text-amber-200/90" : "text-amber-700"}`}>
                  "{catatanAdmin}"
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitRevisi} className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>File PDF Revisi Baru</label>
                {dokumenRevisi && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" /> Siap dikirim
                  </span>
                )}
              </div>
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mt-2.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                  dokumenRevisi
                    ? "border-emerald-400 bg-emerald-500/10"
                    : isDragging
                    ? "border-amber-500 bg-amber-500/10 scale-[1.01] shadow-inner"
                    : dk
                    ? "border-white/20 hover:border-amber-500 hover:bg-white/5 bg-white/5"
                    : "border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 bg-slate-50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChangeRevisi} className="hidden" />
                {dokumenRevisi ? (
                  <div className="space-y-2 text-center flex flex-col items-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm">
                      <FileText className="w-7 h-7" strokeWidth={2} />
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${txt}`}>{dokumenRevisi.name}</p>
                      <p className={`text-[10px] ${sub}`}>{(dokumenRevisi.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Terpilih
                    </span>
                    <span className="mt-1 text-[10px] font-semibold text-amber-500 underline-offset-2 hover:underline">
                      Klik untuk mengganti berkas
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ${
                      isDragging ? "bg-amber-500/20 text-amber-500 scale-110" : dk ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      <UploadCloud className="w-7 h-7" strokeWidth={2} />
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${sub}`}>
                        {isDragging ? "Lepaskan berkas di sini" : "Klik atau seret berkas PDF revisi baru"}
                      </p>
                      <p className={`text-[10px] font-sans ${sub} mt-0.5`}>Kapasitas maksimal 2 MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>Catatan Klarifikasi (opsional)</label>
                <span className={`text-[10px] font-semibold ${catatanRevisi.length > 400 ? "text-amber-500" : sub}`}>
                  {catatanRevisi.length}/500
                </span>
              </div>
              <textarea
                placeholder="Jelaskan perbaikan yang telah dilakukan..."
                value={catatanRevisi}
                onChange={(e) => setCatatanRevisi(e.target.value.slice(0, 500))}
                rows={4}
                maxLength={500}
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none focus:border-amber-500 transition-all resize-none ${
                  dk ? "bg-[#0d1117] border-white/10 text-slate-100" : "bg-white border-slate-200 text-[#0B1442]"
                }`}
              />
            </div>

            {errorRevisi && (
              <div className={`flex items-center gap-2 rounded-xl border p-4 text-xs font-semibold ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorRevisi}</span>
              </div>
            )}

            <div className={`flex items-start gap-2 rounded-xl border p-3 text-[10px] ${dk ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
              <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
              <span>Pastikan berkas terlihat jelas dan sesuai catatan reviewer sebelum mengirim untuk mempercepat proses verifikasi ulang.</span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleTabChange("dashboard")}
                className={`flex-1 rounded-full border py-3 text-xs font-bold cursor-pointer transition-all ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingRevisi}
                className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loadingRevisi ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Berkas Perbaikan
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TabRevisiBerkas;