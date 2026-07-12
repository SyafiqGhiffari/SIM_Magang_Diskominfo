import React from "react";
import { Lock, FileText, UploadCloud, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

const TabRevisiBerkas = ({
  dk, surface, txt, sub, isRevisi, status,
  dokumenRevisi, catatanRevisi, setCatatanRevisi,
  handleFileChangeRevisi, handleSubmitRevisi,
  errorRevisi, loadingRevisi, handleTabChange,
}) => {
  const forceRevisiForTesting = true; // SET KE false UNTUK MERESTORE LOGIC ASLINYA

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-amber-500">Revisi Berkas Pendaftaran</h2>
        <p className={`mt-1.5 text-xs ${sub}`}>Unggah ulang dokumen sesuai instruksi koreksi dari admin reviewer.</p>
      </div>
      {!forceRevisiForTesting && !isRevisi ? (
        <div className={`rounded-2xl border p-8 text-center shadow-sm ${surface} flex flex-col items-center justify-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-4 dark:bg-white/5">
            <Lock className="w-6 h-6" strokeWidth={2} />
          </span>
          <h3 className={`text-sm font-bold ${txt}`}>Revisi Tidak Diperlukan</h3>
          <p className={`mt-2 text-xs font-sans ${sub}`}>Akun Anda tidak sedang dalam status permintaan revisi.</p>
          <button onClick={() => handleTabChange("dashboard")} className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white cursor-pointer hover:shadow-lg transition-all duration-300">Kembali ke Dashboard</button>
        </div>
      ) : (
        <div className={`rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
          {(status?.catatan_admin || (forceRevisiForTesting ? "Contoh catatan admin: 'Mohon perbaiki berkas scan CV Anda yang buram dan unggah kembali berkas scan yang lebih jelas dalam format PDF.'" : null)) && (
            <div className={`mb-6 rounded-xl border p-5 text-xs font-sans ${dk ? "bg-amber-400/10 border-amber-400/20" : "bg-amber-50 border-amber-200"}`}>
              <strong className={`block text-[10px] uppercase tracking-wider mb-1.5 ${dk ? "text-amber-300" : "text-amber-800"}`}>Revisi dari Reviewer:</strong>
              <span className={`italic ${dk ? "text-amber-300" : "text-amber-700"}`}>
                "{status?.catatan_admin || "Contoh catatan admin: 'Mohon perbaiki berkas scan CV Anda yang buram dan unggah kembali berkas scan yang lebih jelas dalam format PDF.'"}"
              </span>
            </div>
          )}
          <form onSubmit={handleSubmitRevisi} className="space-y-6">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>File PDF Revisi Baru</label>
              <label className={`mt-2.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${dokumenRevisi ? "border-emerald-400 bg-emerald-500/10" : dk ? "border-white/20 hover:border-amber-500 bg-white/5" : "border-slate-300 hover:border-amber-500 bg-slate-50"}`}>
                <input type="file" accept="application/pdf" onChange={handleFileChangeRevisi} className="hidden" />
                {dokumenRevisi ? (
                  <div className="space-y-2 text-center flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <FileText className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${txt}`}>{dokumenRevisi.name}</p>
                      <p className={`text-[10px] ${sub}`}>{(dokumenRevisi.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Terpilih
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${dk ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      <UploadCloud className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${sub}`}>Pilih berkas PDF revisi baru</p>
                      <p className={`text-[10px] font-sans ${sub} mt-0.5`}>Kapasitas maksimal 2 MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>Catatan Klarifikasi (opsional)</label>
              <textarea placeholder="Jelaskan perbaikan yang telah dilakukan..." value={catatanRevisi} onChange={e => setCatatanRevisi(e.target.value)} rows={4} className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none focus:border-amber-500 transition-all ${dk ? "bg-[#0d1117] border-white/10 text-slate-100" : "bg-white border-slate-200 text-[#0B1442]"}`} />
            </div>
            {errorRevisi && (
              <div className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorRevisi}</span>
              </div>
            )}
            <div className="flex gap-4">
              <button type="button" onClick={() => handleTabChange("dashboard")} className={`flex-1 rounded-full border py-3 text-xs font-bold cursor-pointer transition-all ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Batal</button>
              <button type="submit" disabled={loadingRevisi} className="flex-1 rounded-full bg-amber-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-amber-700 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
                {loadingRevisi ? "Mengirim..." : (
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