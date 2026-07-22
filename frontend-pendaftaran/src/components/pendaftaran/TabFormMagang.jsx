import { useState } from "react";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { Sparkles, FileText } from "lucide-react";
import StepPilihKategori from "./form-magang/StepPilihKategori";
import StepDataDiri from "./form-magang/StepDataDiri";
import StepDataPendidikan from "./form-magang/StepDataPendidikan";
import StepDataMagang from "./form-magang/StepDataMagang";
import StepDokumen from "./form-magang/StepDokumen";

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const StepIndicator = ({ dk, step, stepLabels }) => {
  return (
    <div className="flex items-start w-full">
      {stepLabels.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        const isLast = i === stepLabels.length - 1;

        return (
          <div key={label} className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="relative flex h-11 w-11 items-center justify-center">
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-[#00A5EC]/30 animate-ping" />
                )}
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold transition-all duration-300 ${
                    isDone
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                      : isActive
                      ? "bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg shadow-[#004F9F]/40 scale-110 ring-4 ring-[#00A5EC]/20"
                      : dk
                      ? "bg-white/5 border-2 border-white/10 text-slate-500"
                      : "bg-white border-2 border-slate-200 text-slate-400"
                  }`}
                >
                  {isDone ? <CheckIcon /> : i + 1}
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-colors duration-300 ${
                  isDone
                    ? "text-emerald-500"
                    : isActive
                    ? "text-[#004F9F]"
                    : dk
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {label}
              </span> 
            </div>

            {!isLast && (
              <div className={`flex-1 h-[3px] mx-1.5 mt-[-24px] rounded-full overflow-hidden ${dk ? "bg-white/10" : "bg-slate-200"}`}>
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out rounded-full"
                  style={{ width: isDone ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Skeleton placeholder yang tampil sekilas saat berpindah step
const StepLoadingSkeleton = ({ dk, surface }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
    <div className="flex items-start justify-between gap-3 mb-6">
      <div className="space-y-2">
        <div className={`h-4 w-40 rounded-full ${dk ? "bg-white/10" : "bg-slate-200"} animate-pulse`} />
        <div className={`h-3 w-56 rounded-full ${dk ? "bg-white/5" : "bg-slate-100"} animate-pulse`} />
      </div>
      <div className={`h-6 w-20 rounded-full ${dk ? "bg-white/10" : "bg-slate-200"} animate-pulse`} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-3 w-24 rounded-full ${dk ? "bg-white/10" : "bg-slate-200"} animate-pulse`} />
          <div className={`h-11 w-full rounded-xl ${dk ? "bg-white/5" : "bg-slate-100"} animate-pulse`} />
        </div>
      ))}
    </div>

    <div className="flex items-center justify-center gap-2 py-2">
      <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: dk ? "#00A5EC33" : "#004F9F33", borderTopColor: "transparent" }} />
      <span className={`text-xs font-semibold ${dk ? "text-slate-400" : "text-slate-500"}`}>Memuat langkah berikutnya...</span>
    </div>
  </div>
);

const TabFormMagang = ({
  dk, surface, txt, sub, inputCls, bidangOptions, bidangLoading,
  hasRegistered, isRevisi, handleTabChange,
  kirimPendaftaranMagang, fetchStatus,
}) => {
  const [step, setStep] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);
  const [kategori, setKategori] = useState("");
  const [form, setForm] = useState({
    nama_lengkap: "", email: "", nomor_hp: "", alamat_lengkap: "",
    tempat_lahir: "", tanggal_lahir: "", jenis_kelamin: "",
    npm_nim: "", asal_kampus: "", fakultas: "", program_studi: "", semester: "",
    nisn: "", asal_sekolah: "", kelas: "", jurusan_sekolah: "",
    posisi_bidang: "", tanggal_mulai: "", tanggal_selesai: "",
  });
  const [files, setFiles] = useState({
    cv: null, surat_pengantar: null, transkrip: null,
    portofolio: null, pas_foto: null, proposal_magang: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pindah step dengan jeda loading singkat, supaya transisi terasa halus.
  const goToStep = (targetStep) => {
    setStepLoading(true);
    setTimeout(() => {
      setStep(targetStep);
      setStepLoading(false);
    }, 700);
  };

  const handleSetKategori = (newKategori) => {
    setKategori(newKategori);
    setForm(p => ({
      ...p,
      npm_nim: "", asal_kampus: "", fakultas: "", program_studi: "", semester: "",
      nisn: "", asal_sekolah: "", kelas: "", jurusan_sekolah: "",
    }));
    setFiles(p => ({ ...p, proposal_magang: null }));
  };

  const handleFileChange = (key, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toastError("Ukuran file maksimal 10MB.");
      return;
    }
    setFiles(p => ({ ...p, [key]: file }));
  };

  const handleSubmit = async () => {
    setError("");

    const result = await confirmDialog({
      title: "Kirim permohonan magang?",
      text: "Pastikan data dan dokumen sudah benar. Data tidak dapat diubah setelah dikirim.",
      confirmText: "Ya, Kirim",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("kategori_pendaftar", kategori);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ""));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(`file_${k}`, v); });

      await kirimPendaftaranMagang(fd);
      await fetchStatus();
      toastSuccess("Pendaftaran berhasil dikirim");
      handleTabChange("status");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal mengirim pendaftaran.";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (hasRegistered && !isRevisi) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${txt}`}>Ajukan Permohonan Magang</h2>
        </div>
        <div className={`rounded-2xl border p-10 text-center shadow-sm ${surface}`}>
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${dk ? "bg-white/5" : "bg-slate-100"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`w-7 h-7 ${sub}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h3 className={`mt-4 text-sm font-bold ${txt}`}>Formulir Terkunci</h3>
          <p className={`mt-2 text-xs ${sub}`}>Berkas sudah diajukan. Silakan pantau status verifikasi.</p>
          <button onClick={() => handleTabChange("dashboard")} className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white cursor-pointer hover:shadow-lg transition-shadow">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  const stepLabels = ["Pendaftar", "Data Diri", "Data Pendidikan", "Data Magang", "Dokumen"];

  return (
    <div className="space-y-8">
      <div className={`rounded-2xl overflow-hidden border shadow-xl shadow-[#0B1442]/10 ${dk ? "border-white/5" : "border-slate-200/80"}`}>
        <div className="relative bg-gradient-to-r from-[#030712] via-[#0B1442] to-[#1E3A8A] p-7 text-white">
          {/* Glow Ambient Lights */}
          <div className="absolute right-12 bottom-[-20px] w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute left-[20%] top-[-20px] w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <FileText className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.06] text-sky-400 pointer-events-none transform rotate-6" strokeWidth={1} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#00A5EC] animate-pulse" />
              <span>Formulir Pendaftaran</span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,165,236,0.2)]">Ajukan Permohonan Magang</h2>
            <p className="text-xs text-white/70 mt-2 font-sans max-w-xl leading-relaxed">
              Lengkapi setiap langkah dengan data yang benar untuk menyelesaikan proses pendaftaran magang Anda di Diskominfo Kabupaten Ponorogo.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3.5 py-1.5 text-[10px] font-extrabold text-white border border-white/15 shadow-inner">
              Langkah {step + 1} dari {stepLabels.length}: <span className="text-[#00A5EC] font-black">{stepLabels[step]}</span>
            </div>
          </div>
        </div>

        <div className={`p-5 ${surface}`}>
          <StepIndicator dk={dk} step={step} stepLabels={stepLabels} />
        </div>
      </div>

      {stepLoading ? (
        <div className="animate-[fadeslide_0.25s_ease-out]">
          <StepLoadingSkeleton dk={dk} surface={surface} />
        </div>
      ) : (
        <div key={step} className="animate-[fadeslide_0.35s_ease-out]">
          {step === 0 && (
            <StepPilihKategori dk={dk} surface={surface} txt={txt} sub={sub} kategori={kategori} setKategori={handleSetKategori} onNext={() => goToStep(1)} />
          )}
          {step === 1 && (
            <StepDataDiri dk={dk} surface={surface} txt={txt} sub={sub} inputCls={inputCls} kategori={kategori} form={form} setForm={setForm} onNext={() => goToStep(2)} onBack={() => goToStep(0)} />
          )}
          {step === 2 && (
            <StepDataPendidikan dk={dk} surface={surface} txt={txt} sub={sub} inputCls={inputCls} kategori={kategori} form={form} setForm={setForm} onNext={() => goToStep(3)} onBack={() => goToStep(1)} />
          )}
          {step === 3 && (
            <StepDataMagang dk={dk} surface={surface} txt={txt} sub={sub} inputCls={inputCls} bidangOptions={bidangOptions} bidangLoading={bidangLoading} kategori={kategori} form={form} setForm={setForm} onNext={() => goToStep(4)} onBack={() => goToStep(2)} />
          )}
          {step === 4 && (
            <StepDokumen dk={dk} surface={surface} txt={txt} sub={sub} kategori={kategori} files={files} onFileChange={handleFileChange} onSubmit={handleSubmit} onBack={() => goToStep(3)} error={error} loading={loading} />
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeslide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TabFormMagang;