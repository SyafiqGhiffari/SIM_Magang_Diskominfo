import { useRef, useState } from "react";
import {
  Lock, FileText, AlertTriangle, CheckCircle2,
  Eye, RefreshCw, Trash2, ChevronDown, Info,
  ArrowLeft, ArrowRight,
} from "lucide-react";
import PreviewModal from "./form-magang/PreviewModal";

const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-9 h-9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

// ─── Satu card per dokumen revisi, bisa dibuka/ditutup ─────────────────────
const DocRevisiCard = ({ dk, surface, txt, sub, doc, file, note, onFileChange, onRemoveFile, onNoteChange, isOpen, onToggle }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const accept = doc.isImage ? "image/jpeg,image/jpg,image/png" : "application/pdf";
  const acceptLabel = doc.isImage ? "JPG, JPEG, atau PNG" : "PDF";

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) onFileChange(droppedFile);
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (f) onFileChange(f);
  };

  return (
    <div className={`group/card rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
      file
        ? dk ? "border-emerald-500/30" : "border-emerald-200"
        : surface
    } ${surface}`}>
      {/* Header — selalu terlihat, klik untuk buka/tutup */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer transition-colors duration-200 ${dk ? "hover:bg-white/[0.04]" : "hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            file
              ? (dk ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-500")
              : (dk ? "bg-amber-400/10 text-amber-400" : "bg-amber-50 text-amber-600")
          } ${!file ? "group-hover/card:scale-105" : ""}`}>
            <FileText className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-extrabold truncate ${txt}`}>{doc.label}</p>
            <p className={`text-[11px] mt-0.5 ${sub}`}>Format: {acceptLabel} (Maks. 10MB)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {file ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition-all duration-300 ${dk ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
              Terunggah
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold ${dk ? "bg-amber-400/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
              <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
              Perlu Revisi
            </span>
          )}
          <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${dk ? "group-hover/card:bg-white/10" : "group-hover/card:bg-slate-100"}`}>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${sub}`} />
          </span>
        </div>
      </button>

      {/* Wrapper animasi buka/tutup halus */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={`px-5 pb-5 space-y-5 border-t ${dk ? "border-white/5" : "border-slate-100"} pt-5`}>
            {doc.catatan && (
              <div className={`rounded-xl border-l-4 p-4 ${dk ? "bg-white/[0.03] border-amber-400" : "bg-slate-50 border-amber-400"}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${dk ? "text-amber-400" : "text-amber-600"}`}>
                  Komentar Administrator:
                </p>
                <p className={`text-xs italic leading-relaxed ${dk ? "text-slate-300" : "text-slate-700"}`}>
                  "{doc.catatan}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Kiri: Upload */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>Upload Dokumen Revisi</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); if (!file) setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && inputRef.current?.click()}
                  className={`mt-2.5 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 min-h-[168px] h-[calc(100%-1.75rem)] ${
                    file ? "cursor-default" : "cursor-pointer"
                  } ${
                    file
                      ? dk ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-emerald-200 bg-emerald-50/30"
                      : isDragOver
                      ? "border-[#00A5EC] bg-[#00A5EC]/10 scale-[1.015]"
                      : dk
                      ? "border-white/15 hover:border-amber-400/60 bg-white/[0.02]"
                      : "border-slate-200 hover:border-amber-400/60 bg-slate-50/50"
                  }`}
                >
                  <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
                  {file ? (
                    <div className="flex w-full flex-col items-center gap-2.5 text-center animate-[fadeslide_0.25s_ease-out]">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-2 ${dk ? "bg-emerald-500/15" : "bg-emerald-100"} text-emerald-500`}>
                        <CheckCircle2 className="w-full h-full" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className={`truncate text-xs font-bold ${txt}`}>{file.name}</p>
                        <p className={`text-[10px] mt-0.5 ${sub}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${dk ? "text-[#00A5EC] hover:bg-[#00A5EC]/15" : "text-[#004F9F] hover:bg-[#004F9F]/10"}`}>
                          <Eye className="w-4 h-4" strokeWidth={1.8} /> Lihat
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${dk ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"}`}>
                          <RefreshCw className="w-4 h-4" strokeWidth={1.8} /> Ganti
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveFile(); }}
                          className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-all cursor-pointer hover:scale-110 ${dk ? "text-red-400 hover:bg-red-500/15" : "text-red-500 hover:bg-red-50"}`}>
                          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={`mb-3 flex justify-center transition-colors ${isDragOver ? "text-[#00A5EC]" : dk ? "text-slate-500" : "text-slate-400"}`}>
                        <CloudIcon />
                      </div>
                    <p className={`text-[11px] font-bold ${dk ? "text-slate-300" : "text-slate-600"}`}>
                        Klik untuk unggah atau seret file
                    </p>
                      <p className={`mt-1.5 text-[10.5px] ${sub}`}>{acceptLabel} (Maks. 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kanan: Catatan */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wide ${sub}`}>Catatan Tambahan (opsional)</label>
                <textarea
                  placeholder="Jelaskan perbaikan yang telah dilakukan untuk dokumen ini..."
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  className={`mt-2.5 w-full min-h-[168px] h-[calc(100%-1.75rem)] resize-none rounded-2xl border px-4 py-3.5 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none focus:border-amber-500 transition-all duration-200 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100" : "bg-white border-slate-200 text-[#0B1442]"}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && file && (
        <PreviewModal
          file={file}
          label={doc.label}
          onClose={() => setShowPreview(false)}
          onGantiFile={() => { setShowPreview(false); inputRef.current?.click(); }}
          theme="amber"
        />
      )}
    </div>
  );
};

// ─── Komponen Utama ──────────────────────────────────────────────────────────
const TabRevisiBerkas = ({
  dk, surface, txt, sub, isRevisi, status,
  docOptions,
  handleSubmitRevisi,
  errorRevisi, loadingRevisi, handleTabChange,
}) => {
  const forceRevisiForTesting = true; // SET KE false UNTUK MERESTORE LOGIC ASLINYA

  // Contoh 3 dokumen revisi untuk keperluan demo/testing
  const demoDocs = [
    { key: "surat_pengantar", field: "file_surat_pengantar", isImage: false, label: "Surat Pengantar", catatan: "Tanda tangan kepala sekolah belum distempel basah. Mohon unggah ulang dengan dokumen yang sudah dilegalisir." },
    { key: "pas_foto", field: "file_pas_foto", isImage: true, label: "Pas Foto", catatan: "Foto tidak menggunakan latar belakang merah sesuai ketentuan pendaftaran. Mohon unggah ulang." },
    { key: "cv", field: "file_cv", isImage: false, label: "CV", catatan: "Format CV yang diunggah tidak sesuai template yang disarankan. Mohon perbaiki dan unggah ulang." },
  ];

  const matchedDocs = (docOptions || []).filter((d) => d.pattern.test(status?.catatan_admin || ""));

  const [manualDocKey, setManualDocKey] = useState("");
  const needsManualSelection = !forceRevisiForTesting && matchedDocs.length === 0;

  let docsToRender;
  if (forceRevisiForTesting) {
    docsToRender = demoDocs;
  } else if (matchedDocs.length > 0) {
    docsToRender = matchedDocs.map((d) => ({ ...d, catatan: status?.catatan_admin }));
  } else if (manualDocKey) {
    const picked = (docOptions || []).find((d) => d.key === manualDocKey);
    docsToRender = picked ? [{ ...picked, catatan: status?.catatan_admin }] : [];
  } else {
    docsToRender = [];
  }

  const [openKeys, setOpenKeys] = useState({});
  const [filesByKey, setFilesByKey] = useState({});
  const [notesByKey, setNotesByKey] = useState({});

  const isOpen = (key, index) => (key in openKeys ? openKeys[key] : index === 0);
  const toggleOpen = (key, index) => setOpenKeys((prev) => ({ ...prev, [key]: !isOpen(key, index) }));

  const handleFileChange = (key, file) => setFilesByKey((prev) => ({ ...prev, [key]: file }));
  const handleRemoveFile = (key) => setFilesByKey((prev) => ({ ...prev, [key]: null }));
  const handleNoteChange = (key, text) => setNotesByKey((prev) => ({ ...prev, [key]: text }));

  const uploadedCount = docsToRender.filter((d) => filesByKey[d.key]).length;
  const totalCount = docsToRender.length;
  const progressPct = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  const handleSubmitClick = () => {
    const filesByField = {};
    docsToRender.forEach((d) => { filesByField[d.field] = filesByKey[d.key] || null; });

    const combinedNotes = docsToRender
      .filter((d) => notesByKey[d.key]?.trim())
      .map((d) => `${d.label}: ${notesByKey[d.key].trim()}`)
      .join("\n");

    handleSubmitRevisi(filesByField, combinedNotes);
  };

  return (
    <div className="space-y-6">
      {/* ==== PERUBAHAN: progres kini menyatu di header, bukan card terpisah ==== */}
      <div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-amber-500">Revisi Berkas Pendaftaran</h2>
            <p className={`mt-1.5 text-xs ${sub}`}>Unggah ulang dokumen sesuai instruksi koreksi dari admin reviewer.</p>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`text-[11px] font-bold ${sub}`}>
                {uploadedCount === totalCount ? "Semua dokumen terunggah" : `${uploadedCount} dari ${totalCount} dokumen terunggah`}
              </span>
              <span className={`text-xs font-black tabular-nums ${uploadedCount === totalCount ? "text-emerald-500" : "text-amber-500"}`}>
                {uploadedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>
        {totalCount > 0 && (
          <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${dk ? "bg-white/10" : "bg-slate-200"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${uploadedCount === totalCount ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
      {/* ==== AKHIR PERUBAHAN ==== */}

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
        <div className="space-y-5">
          {/* Banner peringatan — kuning/amber, ikon dipusatkan */}
          <div className={`rounded-2xl border p-5 flex items-start gap-3 ${dk ? "bg-amber-400/10 border-amber-400/25" : "bg-amber-50 border-amber-200"}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <AlertTriangle className="w-4 h-4 -translate-y-[0.5px]" strokeWidth={2.5} />
            </span>
            <div>
              <h3 className={`text-sm font-extrabold ${dk ? "text-amber-300" : "text-amber-800"}`}>Perhatian: Koreksi Diperlukan</h3>
              <p className={`mt-1 text-xs leading-relaxed ${dk ? "text-amber-300/85" : "text-amber-700"}`}>
                Setelah meninjau berkas Anda, administrator menemukan beberapa ketidaksesuaian pada dokumen yang diunggah. Silakan perbaiki dokumen yang ditandai sebelum melanjutkan ke tahap seleksi berikutnya.
              </p>
            </div>
          </div>

          {needsManualSelection && (
            <div className={`rounded-2xl border p-5 ${dk ? "bg-blue-400/10 border-blue-400/20" : "bg-blue-50 border-blue-200"}`}>
              <label className={`text-xs font-bold uppercase tracking-wide ${dk ? "text-blue-300" : "text-blue-800"}`}>
                Pilih Dokumen yang Direvisi
              </label>
              <p className={`text-[10.5px] mt-1 mb-2.5 ${dk ? "text-blue-300/80" : "text-blue-700/80"}`}>
                Sistem tidak dapat mendeteksi dokumen dari catatan admin secara otomatis. Silakan pilih manual.
              </p>
              <select
                value={manualDocKey}
                onChange={(e) => setManualDocKey(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none focus:border-amber-500 transition-all ${dk ? "bg-[#0d1117] border-white/10 text-slate-100" : "bg-white border-slate-200 text-[#0B1442]"}`}
              >
                <option value="">-- Pilih dokumen --</option>
                {docOptions?.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {docsToRender.map((doc, index) => (
            <DocRevisiCard
              key={doc.key}
              dk={dk} surface={surface} txt={txt} sub={sub}
              doc={doc}
              file={filesByKey[doc.key] || null}
              note={notesByKey[doc.key] || ""}
              onFileChange={(f) => handleFileChange(doc.key, f)}
              onRemoveFile={() => handleRemoveFile(doc.key)}
              onNoteChange={(t) => handleNoteChange(doc.key, t)}
              isOpen={isOpen(doc.key, index)}
              onToggle={() => toggleOpen(doc.key, index)}
            />
          ))}

          {errorRevisi && (
            <div className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 animate-[fadeslide_0.2s_ease-out] ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorRevisi}</span>
            </div>
          )}

          {/* Footer action card */}
          {docsToRender.length > 0 && (
            <div className={`rounded-2xl border shadow-lg ${surface}`}>
              <div className="p-6 space-y-5">
                {/* Baris status ringkas */}
                <div className="flex items-start gap-3.5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    {uploadedCount === totalCount ? (
                      <CheckCircle2 className="w-5 h-5" strokeWidth={1.8} />
                    ) : (
                      <Info className="w-5 h-5" strokeWidth={1.8} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-extrabold ${txt}`}>
                      {uploadedCount === totalCount ? "Siap untuk dikirim!" : "Sebelum mengirim, periksa kembali"}
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${sub}`}>
                      {uploadedCount === totalCount
                        ? "Semua dokumen revisi sudah terunggah. Klik tombol di bawah untuk mengirim perbaikan ke admin."
                        : "Pastikan semua dokumen yang membutuhkan revisi telah diunggah ulang sebelum mengirimkan perbaikan."}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className={`h-px w-full ${dk ? "bg-white/10" : "bg-slate-100"}`} />

                {/* Baris tombol aksi */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange("dashboard")}
                    className={`group w-full sm:flex-1 sm:min-w-[160px] flex items-center justify-center gap-2 rounded-full border-2 px-10 py-3.5 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={loadingRevisi || uploadedCount !== totalCount}
                    className="group w-full sm:flex-2 sm:min-w-[200px] flex items-center justify-center gap-2 rounded-full bg-amber-600 px-8 py-3.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:bg-amber-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    {loadingRevisi ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim Perbaikan Berkas
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes fadeslide {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default TabRevisiBerkas;