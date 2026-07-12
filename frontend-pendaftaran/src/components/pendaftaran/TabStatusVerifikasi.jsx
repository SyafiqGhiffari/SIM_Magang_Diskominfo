import { useState } from "react";
import { ShieldCheck } from "lucide-react";

const CheckBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);
const ExclamationBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
  </svg>
);
const XBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const ClockBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);
const IdCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
  </svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const CommentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);
const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);
const ChevronDownIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);
const ArrowLeftIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);
const WarningTriangleIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const TabStatusVerifikasi = ({
  dk, surface, txt, sub, muted,
  status, hasRegistered, currentStep,
  isRejected, isAccepted, isRevisi, handleTabChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);

  const theme = isAccepted
    ? { bar: "from-emerald-400 to-emerald-500", badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-400", icon: <CheckBadgeIcon />, title: "Selamat! Anda Diterima Magang", ping: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20" }
    : isRejected
      ? { bar: "from-red-400 to-red-500", badgeBg: "bg-red-500/15", badgeText: "text-red-400", icon: <XBadgeIcon />, title: "Permohonan Tidak Diterima", ping: "bg-red-400", chip: "bg-red-500/15 text-red-300 border-red-400/20" }
      : isRevisi
        ? { bar: "from-amber-400 to-amber-500", badgeBg: "bg-amber-500/15", badgeText: "text-amber-400", icon: <ExclamationBadgeIcon />, title: "Dokumen Perlu Direvisi", ping: "bg-amber-400", chip: "bg-amber-500/15 text-amber-300 border-amber-400/20" }
        : { bar: "from-[#00A5EC] to-[#004F9F]", badgeBg: "bg-[#00A5EC]/15", badgeText: "text-[#00A5EC]", icon: <ClockBadgeIcon />, title: "Pendaftaran Berhasil Terkirim!", ping: "bg-[#00A5EC]", chip: "bg-white/10 text-white border-white/20" };

  const kodeKategori = status?.kategori_pendaftar === "mahasiswa" ? "M" : status?.kategori_pendaftar === "siswa" ? "S" : "";

  const nomorRegistrasi = status
    ? `PM-${status.created_at ? new Date(status.created_at).getFullYear() : new Date().getFullYear()}${kodeKategori ? `-${kodeKategori}` : ""}-${String(status.id || 0).padStart(4, "0")}`
    : "-";

  const tanggalDaftar = status?.created_at
    ? new Date(status.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "-";

  const handleCopyNomor = () => {
    navigator.clipboard.writeText(nomorRegistrasi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildStepDetail = (idx) => {
    const n = idx + 1;
    const done = n < currentStep || (n === currentStep && n === 3 && (isAccepted || isRejected));
    const active = n === currentStep && !done;
    const isRevisiStep = active && isRevisi;

    switch (n) {
      case 1:
        return `Berkas pendaftaran Anda telah berhasil diunggah ke sistem dan tercatat pada ${tanggalDaftar}.`;
      case 2:
        if (isRevisiStep) {
          return "Admin telah memeriksa dokumen Anda dan menemukan bagian yang perlu diperbaiki. Silakan periksa catatan reviewer di bawah, lalu unggah ulang berkas melalui tab Revisi Berkas.";
        }
        if (done) {
          return "Admin telah selesai memeriksa kelengkapan, keabsahan dokumen, serta menilai kesesuaian bidang penempatan dan ketersediaan kuota. Seluruh berkas Anda dinyatakan valid dan lolos tahap ini.";
        }
        if (active) {
          return "Admin sedang memeriksa kelengkapan dan keabsahan dokumen sekaligus menilai kesesuaian bidang penempatan dan ketersediaan kuota. Tahap ini biasanya memakan waktu 3–5 hari kerja sejak berkas diterima.";
        }
        return "Admin akan memeriksa dan menilai berkas Anda setelah tahap sebelumnya selesai.";
      case 3:
        if (isAccepted) {
          return `Selamat! Anda dinyatakan diterima untuk mengikuti program magang di ${status?.posisi_bidang || "bidang yang dipilih"}. Informasi lebih lanjut akan dikirimkan melalui email.`;
        }
        if (isRejected) {
          return "Hasil akhir seleksi telah diumumkan. Permohonan Anda belum dapat kami teruskan pada periode ini — terima kasih atas partisipasi Anda.";
        }
        return "Hasil akhir seleksi pendaftaran akan diumumkan dan dikirimkan melalui email terdaftar setelah tahap verifikasi dan seleksi selesai.";
      default:
        return "";
    }
  };

  const timelineSteps = [
    { label: "Terkirim", icon: <CheckIcon /> },
    { label: "Verifikasi & Seleksi Berkas", icon: <DocIcon /> },
    { label: "Pengumuman", icon: <ChartIcon /> },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${txt}`}>Alur Verifikasi Pendaftaran</h2>
        <p className={`mt-1.5 text-xs ${sub}`}>Lacak pergerakan verifikasi berkas administrasi program magang Anda.</p>
      </div>

      {!hasRegistered ? (
        <div className={`relative overflow-hidden rounded-2xl border p-10 text-center shadow-sm ${surface}`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/5 blur-3xl pointer-events-none" />
          <div className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-105 hover:rotate-3 ${dk ? "bg-white/5" : "bg-slate-100"}`}>
            <FolderIcon />
          </div>
          <h3 className={`relative mt-4 text-sm font-bold ${txt}`}>Belum Ada Data Pendaftaran</h3>
          <p className={`relative mt-2 text-xs font-sans ${sub}`}>Silakan lengkapi formulir pendaftaran terlebih dahulu.</p>
          <button
            onClick={() => handleTabChange("form")}
            className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Mulai Daftar Magang
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl overflow-hidden border shadow-xl shadow-[#0B1442]/10 ${dk ? "border-white/5" : "border-slate-200/80"}`}>
          <div className="relative bg-gradient-to-r from-[#030712] via-[#0B1442] to-[#1E3A8A] p-6 md:p-10 text-white text-center overflow-hidden">
            {/* Glow Ambient Lights */}
            <div className="absolute right-12 bottom-[-20px] w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute left-[20%] top-[-20px] w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
            <ShieldCheck className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.06] text-sky-400 pointer-events-none transform rotate-6" strokeWidth={1} />

            <div className="relative inline-flex group z-10">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ring-4 ring-white shadow-2xl relative overflow-hidden transition-transform duration-300 group-hover:scale-105 ${theme.badgeBg} ${theme.badgeText}`}>
                <div className="absolute inset-0 bg-white/10 animate-pulse" style={{ animationDuration: "3s" }} />
                <span className="relative">{theme.icon}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md text-[#004F9F]">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  {isRevisi && <span className={`absolute inset-0 rounded-full ${theme.ping} animate-ping opacity-50`} />}
                  <CheckIcon />
                </span>
              </span>
            </div>

            <h3 className="relative mt-5 text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,165,236,0.2)]">{theme.title}</h3>
            <p className="relative mt-2.5 text-xs leading-relaxed max-w-md mx-auto font-sans text-white/70 z-10">
              {isAccepted
                ? `Selamat, Anda diterima untuk mengikuti program magang di ${status.posisi_bidang || "bidang yang dipilih"}.`
                : isRejected
                  ? "Terima kasih atas partisipasi Anda. Sayangnya permohonan magang belum dapat kami teruskan saat ini."
                  : isRevisi
                    ? "Admin meminta perbaikan pada beberapa dokumen. Silakan periksa catatan di bawah dan unggah ulang berkas."
                    : "Berkas Anda telah kami terima dan saat ini sedang dalam proses verifikasi. Kami akan memberitahu Anda segera setelah ada perkembangan terbaru."}
            </p>

            <button
              onClick={handleCopyNomor}
              className={`relative mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-bold border backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-10 ${theme.chip}`}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3 h-3" />
                  Tersalin!
                </>
              ) : (
                <>
                  <IdCardIcon />
                  {nomorRegistrasi}
                </>
              )}
            </button>
          </div>

          <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />

          <div className={surface}>
            <div className="px-6 md:px-10 pt-8">
              <h4 className={`text-[10px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${sub}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC]" />
                Tahapan Proses
              </h4>

              <div className="space-y-2.5">
                {timelineSteps.map((step, idx) => {
                  const n = idx + 1;
                  const done = n < currentStep || (n === currentStep && n === 3 && (isAccepted || isRejected));
                  const active = n === currentStep && !done;
                  const isRevisiStep = active && isRevisi;
                  const isExpanded = expandedStep === idx;

                  return (
                    <div
                      key={step.label}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isRevisiStep
                          ? dk ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-amber-300 bg-amber-50/60"
                          : dk
                            ? isExpanded ? "border-white/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.02] hover:border-white/15"
                            : isExpanded ? "border-slate-300 bg-white shadow-sm" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedStep(isExpanded ? null : idx)}
                        className="w-full flex items-center gap-3.5 p-4 text-left cursor-pointer"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isRevisiStep
                              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg ring-4 ring-amber-400/25 scale-105"
                              : done
                                ? `bg-gradient-to-br ${theme.bar} text-white shadow-md`
                                : active
                                  ? `bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg ring-4 ring-[#00A5EC]/20 scale-105`
                                  : dk
                                    ? "bg-white/5 text-slate-500 border-2 border-white/10"
                                    : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                            }`}
                        >
                          {isRevisiStep ? <WarningTriangleIcon className="w-4.5 h-4.5" /> : done ? <CheckIcon /> : step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-extrabold ${done || active ? txt : muted}`}>{step.label}</p>
                          <p className={`text-[10px] mt-0.5 font-sans ${isRevisiStep ? "text-amber-500" : done ? theme.badgeText.replace("400", "500") : active ? "text-[#00A5EC]" : muted}`}>
                            {isRevisiStep ? "Perlu direvisi" : done ? "Selesai" : active ? "Sedang diproses" : "Menunggu"}
                          </p>
                        </div>
                        <span className={`shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${muted}`}>
                          <ChevronDownIcon />
                        </span>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <div className="overflow-hidden">
                          <p className={`px-4 pb-4 pl-[3.75rem] text-[11px] leading-relaxed font-sans ${sub}`}>
                            {buildStepDetail(idx)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {status.catatan_admin && (
              <div className="px-6 md:px-10 pt-8 pb-2">
                <div className={`rounded-2xl border p-4 text-xs font-sans text-left transition-all duration-300 hover:shadow-sm ${dk ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-slate-50 border-slate-200/60 hover:border-slate-300"}`}>
                  <strong className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide mb-1.5 ${txt}`}>
                    <CommentIcon />
                    Catatan Reviewer
                  </strong>
                  <span className={`italic ${sub}`}>"{status.catatan_admin}"</span>
                </div>
              </div>
            )}

            <div className={`px-6 md:px-10 pb-8 ${status.catatan_admin ? "pt-4" : "pt-8"}`}>
              <h4 className={`text-[10px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${sub}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC]" />
                Detail Pendaftaran
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`group relative overflow-hidden rounded-2xl border p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${dk ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC]" : "bg-gradient-to-br from-[#00A5EC]/15 to-[#004F9F]/15 text-[#004F9F]"}`}>
                    <IdCardIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>Nomor Registrasi</p>
                    <p className={`font-extrabold text-xs mt-0.5 truncate ${txt}`}>{nomorRegistrasi}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyNomor(); }}
                    className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer ${dk ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-[#004F9F]"}`}
                  >
                    {copied ? <CheckIcon className="w-3.5 h-3.5" /> : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className={`group rounded-2xl border p-4 flex items-start gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${dk ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC]" : "bg-gradient-to-br from-[#00A5EC]/15 to-[#004F9F]/15 text-[#004F9F]"}`}>
                    <BuildingIcon />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>Bidang Penempatan</p>
                    <p className={`font-extrabold text-xs mt-0.5 truncate ${txt}`}>{status.posisi_bidang || "-"}</p>
                  </div>
                </div>
                <div className={`group rounded-2xl border p-4 flex items-start gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${dk ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC]" : "bg-gradient-to-br from-[#00A5EC]/15 to-[#004F9F]/15 text-[#004F9F]"}`}>
                    <CalendarIcon />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>Tanggal Daftar</p>
                    <p className={`font-extrabold text-xs mt-0.5 truncate ${txt}`}>{tanggalDaftar}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {isRevisi && (
                  <button
                    onClick={() => handleTabChange("revisi")}
                    className="flex-1 flex items-center justify-center gap-2 text-center rounded-full bg-amber-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-amber-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    Perbaiki Sekarang
                  </button>
                )}
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className={`group flex-1 flex items-center justify-center gap-2 text-center rounded-full border py-3 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabStatusVerifikasi;