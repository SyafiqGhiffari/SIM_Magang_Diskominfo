import { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw, Upload, CheckCircle2, Loader2, LogIn, LogOut, Info } from "lucide-react";
import { presensiMasuk, presensiPulang } from "../../../../services/pesertaService";
import { toastError, toastSuccess } from "../../../../utils/swal";

const AbsenKameraModal = ({ jenis, jamSekarang, onClose, onSelesai }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  const [kameraSiap, setKameraSiap] = useState(false);
  const [errKamera, setErrKamera] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileFoto, setFileFoto] = useState(null);
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  const isMasuk = jenis === "masuk";
  const JenisIcon = isMasuk ? LogIn : LogOut;

  const matikanKamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let aktif = true;

    const nyalakanKamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!aktif) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setKameraSiap(true);
      } catch {
        if (aktif) setErrKamera("Kamera tidak dapat diakses. Anda masih bisa mengunggah foto dari galeri.");
      }
    };

    nyalakanKamera();

    return () => {
      aktif = false;
      matikanKamera();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const ambilFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFileFoto(new File([blob], `presensi-${jenis}.jpg`, { type: "image/jpeg" }));
        setPreview(URL.createObjectURL(blob));
        matikanKamera();
        setKameraSiap(false);
      },
      "image/jpeg",
      0.85
    );
  };

  const pilihDariGaleri = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toastError("Format foto harus JPG, JPEG, atau PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError("Ukuran foto maksimal 10MB.");
      return;
    }
    setFileFoto(file);
    setPreview(URL.createObjectURL(file));
    matikanKamera();
    setKameraSiap(false);
  };

  const ulangiFoto = async () => {
    setPreview(null);
    setFileFoto(null);
    setErrKamera("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setKameraSiap(true);
    } catch {
      setErrKamera("Kamera tidak dapat diakses. Anda masih bisa mengunggah foto dari galeri.");
    }
  };

  const kirim = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      if (fileFoto) form.append("foto", fileFoto);
      if (keterangan.trim()) form.append("keterangan", keterangan.trim());

      const res = isMasuk ? await presensiMasuk(form) : await presensiPulang(form);
      toastSuccess(res.data.message || "Presensi berhasil dicatat.");
      matikanKamera();
      onSelesai();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan presensi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <JenisIcon className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Presensi {isMasuk ? "Masuk" : "Pulang"}</h3>
              <p className="text-[11px] text-white/60 mt-0.5">Waktu server: {jamSekarang} WIB</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-[4/3] ring-1 ring-slate-200">
            {preview ? (
              <img src={preview} alt="Pratinjau foto presensi" className="h-full w-full object-cover animate-[tplFade_0.3s_ease-out]" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                {!kameraSiap && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 px-6 text-center">
                    {errKamera ? (
                      <>
                        <Camera className="w-6 h-6 text-white/40" />
                        <p className="text-[11.5px] font-semibold text-white/70 leading-relaxed">{errKamera}</p>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                        <p className="text-[11.5px] font-semibold text-white/60">Menyiapkan kamera...</p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {preview ? (
              <button
                onClick={ulangiFoto}
                disabled={saving}
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
                Ulangi Foto
              </button>
            ) : (
              <button
                onClick={ambilFoto}
                disabled={!kameraSiap || saving}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                Ambil Foto
              </button>
            )}

            <button
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Unggah Foto
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={pilihDariGaleri} className="hidden" />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Keterangan (opsional)</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Bekerja dari ruang bidang Statistik."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
            />
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3.5 py-2.5 text-[11px] font-medium text-sky-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Jam presensi diambil dari waktu server (WIB), bukan jam perangkat Anda. Foto bersifat opsional namun sangat disarankan sebagai bukti kehadiran.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={kirim}
            disabled={saving}
            className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />}
            {saving ? "Menyimpan..." : `Kirim Presensi ${isMasuk ? "Masuk" : "Pulang"}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbsenKameraModal;