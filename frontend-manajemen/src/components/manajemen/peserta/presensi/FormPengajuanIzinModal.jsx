import { useEffect, useRef, useState } from "react";
import { X, FileText, HeartPulse, Send, Loader2, Upload, Paperclip, Info } from "lucide-react";
import { buatPengajuanIzin } from "../../../../services/pesertaService";
import { toastError, toastSuccess } from "../../../../utils/swal";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15";

const JENIS = [
  { value: "izin", label: "Izin", icon: FileText, desc: "Keperluan pribadi/akademik" },
  { value: "sakit", label: "Sakit", icon: HeartPulse, desc: "Wajib lampirkan bukti" },
];

const FormPengajuanIzinModal = ({ onClose, onSaved }) => {
  const inputRef = useRef(null);
  const [jenis, setJenis] = useState("izin");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) {
      toastError("Format bukti harus JPG, JPEG, PNG, atau PDF.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toastError("Ukuran file maksimal 10MB.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mulai || !selesai) return toastError("Tanggal mulai dan selesai wajib diisi.");
    if (selesai < mulai) return toastError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
    if (alasan.trim().length < 10) return toastError("Alasan pengajuan minimal 10 karakter.");
    if (jenis === "sakit" && !file) return toastError("Pengajuan sakit wajib melampirkan bukti (surat dokter).");

    setSaving(true);
    try {
      const form = new FormData();
      form.append("jenis", jenis);
      form.append("tanggal_mulai", mulai);
      form.append("tanggal_selesai", selesai);
      form.append("alasan", alasan.trim());
      if (file) form.append("file_bukti", file);

      await buatPengajuanIzin(form);
      toastSuccess("Pengajuan berhasil dikirim, menunggu verifikasi mentor.");
      onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim pengajuan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={() => !saving && onClose()}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <FileText className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Ajukan Izin / Sakit</h3>
              <p className="text-[11px] text-white/60 mt-0.5">Pengajuan akan diverifikasi oleh mentor Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Jenis Pengajuan</label>
            <div className="grid grid-cols-2 gap-2.5">
              {JENIS.map((j) => {
                const aktif = jenis === j.value;
                return (
                  <button
                    key={j.value}
                    type="button"
                    onClick={() => setJenis(j.value)}
                    className={`group flex flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                      aktif ? "border-[#004F9F]/50 bg-blue-50/60 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:bg-white"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black ${aktif ? "text-[#004F9F]" : "text-slate-600"}`}>
                      <j.icon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" /> {j.label}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-400">{j.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tanggal Mulai</label>
              <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tanggal Selesai</label>
              <input type="date" value={selesai} min={mulai || undefined} onChange={(e) => setSelesai(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Alasan</label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Jelaskan alasan pengajuan secara singkat dan jelas (minimal 10 karakter)."
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Bukti Pendukung {jenis === "sakit" ? <span className="text-rose-500">(wajib)</span> : "(opsional)"}
            </label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3.5 py-3 text-left transition-all duration-200 hover:border-[#004F9F]/50 hover:bg-blue-50/40 cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#004F9F] shadow-sm transition-transform duration-300 group-hover:scale-110">
                {file ? <Paperclip className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-slate-600">{file ? file.name : "Pilih file bukti"}</span>
                <span className="block text-[10.5px] font-medium text-slate-400">JPG, JPEG, PNG, atau PDF · maksimal 10MB</span>
              </span>
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" onChange={pilihFile} className="hidden" />
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3.5 py-2.5 text-[11px] font-medium text-sky-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Setelah disetujui mentor, presensi Anda pada hari kerja dalam rentang tanggal tersebut otomatis tercatat. Hari libur akan dilewati.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />}
            {saving ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormPengajuanIzinModal;