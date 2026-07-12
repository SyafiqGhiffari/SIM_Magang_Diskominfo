import { useState, useRef } from "react";
import { toastError } from "../../../utils/swal";
import PreviewModal from "./PreviewModal";

const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const CapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.174 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);
const PortofolioIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);
const CapIcon2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);
const SchoolIcon2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const iconStyles = {
  cv: { icon: <DocIcon />, bg: "bg-blue-50 text-blue-600", bgDark: "bg-blue-500/10 text-blue-400" },
  transkrip: { icon: <CapIcon />, bg: "bg-violet-50 text-violet-600", bgDark: "bg-violet-500/10 text-violet-400" },
  surat_pengantar: { icon: <BuildingIcon />, bg: "bg-amber-50 text-amber-600", bgDark: "bg-amber-500/10 text-amber-400" },
  proposal_magang: { icon: <DocIcon />, bg: "bg-rose-50 text-rose-600", bgDark: "bg-rose-500/10 text-rose-400" },
  pas_foto: { icon: <CameraIcon />, bg: "bg-emerald-50 text-emerald-600", bgDark: "bg-emerald-500/10 text-emerald-400" },
  portofolio: { icon: <PortofolioIcon />, bg: "bg-cyan-50 text-cyan-600", bgDark: "bg-cyan-500/10 text-cyan-400" },
};

const InfoNote = ({ dk, children }) => (
  <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] leading-relaxed ${dk ? "bg-[#00A5EC]/10 text-[#7ec9ec]" : "bg-[#00A5EC]/10 text-[#004F9F]"}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
    <span>{children}</span>
  </div>
);

const SectionHeader = ({ dk, sub, dotColor, children, count }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
    <h4 className={`text-[11px] font-black uppercase tracking-wider ${sub}`}>{children}</h4>
    {count !== undefined && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dk ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{count}</span>
    )}
  </div>
);

const DocCard = ({ dk, sub, txt, docKey, title, desc, wajib, file, onChange, accept, acceptLabel, onRemove, onPreview, note }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  const style = iconStyles[docKey] || iconStyles.cv;

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) onChange({ target: { files: [droppedFile], value: "" } });
  };

  return (
    <div className={`group rounded-2xl border p-5 transition-all duration-200 flex flex-col h-full ${
      file
        ? dk ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-emerald-200 bg-emerald-50/30"
        : dk ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${dk ? style.bgDark : style.bg}`}>
          {style.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-extrabold leading-tight ${txt}`}>
            {title}{" "}
            {wajib ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className={`text-[9px] font-bold uppercase tracking-wider align-middle ml-1 px-1.5 py-0.5 rounded-full ${dk ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-400"}`}>opsional</span>
            )}
          </h4>
          <p className={`text-[11px] mt-1 leading-relaxed ${sub}`}>{desc}</p>
        </div>
      </div>

      {note && <InfoNote dk={dk}>{note}</InfoNote>}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`mt-3 relative flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
          file ? "cursor-default" : "cursor-pointer"
        } ${
          file
            ? "border-emerald-400/70 bg-emerald-500/5"
            : isDragOver
            ? "border-[#00A5EC] bg-[#00A5EC]/10 scale-[1.01]"
            : dk
            ? "border-white/15 hover:border-[#00A5EC]/60 bg-white/[0.03]"
            : "border-slate-200 hover:border-[#004F9F]/50 bg-slate-50/70"
        }`}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" data-doc={docKey} />

        {file ? (
          <div className="flex w-full flex-col items-center gap-2.5 text-center">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-2 ${dk ? "bg-emerald-500/15" : "bg-emerald-100"} text-emerald-500`}>
              <CheckCircleIcon />
            </div>
            <div className="min-w-0 w-full">
              <p className={`truncate text-xs font-bold ${txt}`}>{file.name}</p>
              <p className={`text-[10px] mt-0.5 ${sub}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${
                  dk ? "text-[#00A5EC] hover:bg-[#00A5EC]/15" : "text-[#004F9F] hover:bg-[#004F9F]/10"
                }`}
              >
                <EyeIcon /> Lihat
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${
                  dk ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <RefreshIcon /> Ganti
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-all cursor-pointer hover:scale-110 ${dk ? "text-red-400 hover:bg-red-500/15" : "text-red-500 hover:bg-red-50"}`}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ) : (
        <div className="py-2">
          <div className={`mb-2 flex justify-center transition-all duration-300 ${isDragOver ? "text-[#00A5EC] scale-125" : dk ? "text-slate-500" : "text-slate-400"}`}>
            <CloudIcon className={isDragOver ? "" : "animate-[iconFloat_2.4s_ease-in-out_infinite]"} />
          </div>
          <p className={`text-[11px] font-bold ${dk ? "text-slate-300" : "text-slate-600"}`}>
            Klik untuk unggah atau seret file
          </p>
          <p className={`mt-1 text-[10px] ${sub}`}>{acceptLabel} &middot; Maks. 10MB</p>
        </div>
      )}
      </div>
    </div>
  );
};

const StepDokumen = ({ dk, surface, txt, sub, kategori, files, onFileChange, onSubmit, onBack, error, loading }) => {
  const isMahasiswa = kategori === "mahasiswa";
  const isValid = files.surat_pengantar && files.pas_foto && (!isMahasiswa || files.proposal_magang);
  const [previewKey, setPreviewKey] = useState(null);

  const MAX_SIZE = 10 * 1024 * 1024;

  const handlePdfChange = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toastError("File harus berupa PDF.");
      if (e.target.value !== undefined) e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      toastError("Ukuran file maksimal 10MB.");
      if (e.target.value !== undefined) e.target.value = "";
      return;
    }
    onFileChange(key, file);
  };

  const handleImageChange = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toastError("Format foto harus JPG, JPEG, atau PNG.");
      if (e.target.value !== undefined) e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      toastError("Ukuran file maksimal 10MB.");
      if (e.target.value !== undefined) e.target.value = "";
      return;
    }
    onFileChange(key, file);
  };

  const requiredDocs = [
    {
      key: "surat_pengantar",
      title: isMahasiswa ? "Surat Pengantar Kampus" : "Surat Pengantar Sekolah",
      desc: isMahasiswa
        ? "Surat resmi dari universitas/instansi yang menyatakan izin untuk mengikuti program magang."
        : "Surat resmi dari sekolah yang menyatakan izin untuk mengikuti program magang.",
      accept: "application/pdf",
      acceptLabel: "PDF",
      onChange: handlePdfChange("surat_pengantar"),
      note: isMahasiswa
        ? "Pastikan surat pengantar mencantumkan periode magang yang diusulkan."
        : "Pastikan surat pengantar mencantumkan periode magang yang diusulkan.",
    },
    ...(isMahasiswa ? [{
      key: "proposal_magang",
      title: "Proposal Magang",
      desc: "Rencana kegiatan magang yang telah disetujui oleh pihak kampus.",
      accept: "application/pdf",
      acceptLabel: "PDF",
      onChange: handlePdfChange("proposal_magang"),
      note: "Cantumkan tujuan, rencana kegiatan, dan jadwal magang yang telah disetujui.",
    }] : []),
    {
      key: "pas_foto",
      title: "Pas Foto",
      desc: "Foto formal terbaru dengan latar belakang merah, digunakan untuk keperluan administrasi.",
      accept: "image/jpeg,image/jpg,image/png",
      acceptLabel: "JPG/JPEG/PNG",
      onChange: handleImageChange("pas_foto"),
      note: "Gunakan foto formal terbaru dengan latar belakang merah, wajah menghadap kamera.",
    },
  ];

  const optionalDocs = [
    {
      key: "cv",
      title: "Curriculum Vitae (CV)",
      desc: "Lampirkan riwayat hidup terbaru yang mencantumkan pengalaman dan keahlian Anda.",
      accept: "application/pdf",
      acceptLabel: "PDF",
      onChange: handlePdfChange("cv"),
      note: "Sertakan pengalaman organisasi, kegiatan akademik, atau keahlian yang relevan dengan bidang yang dilamar.",
    },
    {
      key: "transkrip",
      title: isMahasiswa ? "Transkrip Nilai" : "Rapor",
      desc: "Lampirkan transkrip nilai akademik terakhir yang telah dilegalisir.",
      accept: "application/pdf",
      acceptLabel: "PDF",
      onChange: handlePdfChange("transkrip"),
      note: isMahasiswa
        ? "Gunakan transkrip nilai terbaru yang mencakup seluruh semester yang telah ditempuh."
        : "Gunakan rapor semester terakhir yang telah disahkan oleh wali kelas atau kepala sekolah.",
    },
    {
      key: "portofolio",
      title: "Portofolio",
      desc: "Kumpulan hasil karya atau proyek yang relevan dengan bidang yang dilamar.",
      accept: "application/pdf",
      acceptLabel: "PDF",
      onChange: handlePdfChange("portofolio"),
      note: "Lampirkan portofolio berisi proyek, hasil karya, atau pengalaman relevan dengan bidang magang yang dipilih.",
    },
  ];

  const allDocs = [...requiredDocs, ...optionalDocs];
  const previewDoc = allDocs.find(d => d.key === previewKey);

  const renderCard = (d, wajib) => (
    <DocCard
      key={d.key}
      dk={dk} sub={sub} txt={txt}
      docKey={d.key}
      title={d.title}
      desc={d.desc}
      wajib={wajib}
      file={files[d.key]}
      onChange={d.onChange}
      accept={d.accept}
      acceptLabel={d.acceptLabel}
      note={d.note}
      onRemove={() => onFileChange(d.key, null)}
      onPreview={() => setPreviewKey(d.key)}
    />
  );
  const requiredUploaded = requiredDocs.filter(d => files[d.key]).length;

  return (
    <div className={`rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-extrabold ${txt}`}>Dokumen Pendukung</h3>
            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${
              dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC] ring-1 ring-[#00A5EC]/20" : "bg-gradient-to-br from-[#00A5EC]/10 to-[#004F9F]/10 text-[#004F9F] ring-1 ring-[#004F9F]/10"
            }`}>
              {isMahasiswa ? <CapIcon2 /> : <SchoolIcon2 />}
              {isMahasiswa ? "Mahasiswa" : "Siswa"}
            </span>
          </div>
          <p className={`text-xs ${sub}`}>Unggah dokumen sesuai persyaratan pendaftaran magang.</p>
        </div>
        <div className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 ${dk ? "bg-white/5" : "bg-slate-50"}`}>
          <div className="relative h-8 w-8">
            <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
              <circle cx="16" cy="16" r="13" fill="none" stroke={dk ? "#ffffff1a" : "#e2e8f0"} strokeWidth="3" />
              <circle
                cx="16" cy="16" r="13" fill="none"
                stroke={requiredUploaded === requiredDocs.length ? "#10b981" : "#00A5EC"}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(requiredUploaded / requiredDocs.length) * 81.68} 81.68`}
                className="transition-all duration-500"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black ${txt}`}>{requiredUploaded}/{requiredDocs.length}</span>
          </div>
          <div>
            <p className={`text-[10px] font-bold ${txt}`}>Dokumen Wajib</p>
            <p className={`text-[9px] ${sub}`}>{requiredUploaded === requiredDocs.length ? "Lengkap" : "Belum lengkap"}</p>
          </div>
        </div>
      </div>

      <SectionHeader dk={dk} sub={sub} dotColor="bg-red-500" count={requiredDocs.length}>Dokumen Wajib</SectionHeader>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 ${requiredDocs.length >= 3 ? "lg:grid-cols-3" : ""}`}>
      {requiredDocs.map(d => renderCard(d, true))}
      </div>

      <SectionHeader dk={dk} sub={sub} dotColor="bg-slate-400" count={optionalDocs.length}>Dokumen Opsional</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {optionalDocs.map(d => renderCard(d, false))}
      </div>

      {error && (
        <div className={`mt-5 rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

       {!isValid && !loading && (
          <div className={`mt-6 rounded-xl border p-3.5 text-xs flex items-center gap-2 ${dk ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>Lengkapi semua dokumen wajib untuk dapat mengirim permohonan.</span>
          </div>
        )}

      <div className={`flex gap-4 pt-6 mt-2 border-t ${dk ? "border-white/10" : "border-slate-100"}`}>
        <button
          type="button"
          onClick={onBack}
          className={`group flex-1 flex items-center justify-center gap-2 rounded-full border py-3 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || loading}
          className="group flex-[2] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3 text-xs font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:brightness-100"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              Ajukan Magang Sekarang
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {previewDoc && (
        <PreviewModal
          file={files[previewDoc.key]}
          label={previewDoc.title}
          onClose={() => setPreviewKey(null)}
          onGantiFile={() => {
            setPreviewKey(null);
            document.querySelector(`input[data-doc="${previewDoc.key}"]`)?.click();
          }}
        />
      )}
    </div>
  );
};

export default StepDokumen;