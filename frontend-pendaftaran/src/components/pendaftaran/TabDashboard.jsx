import {
  Landmark,
  XCircle,
  AlertTriangle,
  FileText,
  Hourglass,
  PartyPopper,
  Lock,
  Pencil,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 11) return "Selamat Pagi";
  if (hr < 15) return "Selamat Siang";
  if (hr < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const TabDashboard = ({
  dk, surface, txt, sub, muted,
  user, hasRegistered, status, loading,
  isPending, isRevisi, isAccepted, isRejected,
  handleTabChange,
}) => {

  const forceRevisiForTesting = true; // SET KE false UNTUK MERESTORE LOGIC ASLINYA

  const getStepProgressHeight = () => {
    if (isAccepted || isRejected || isRevisi) return "100%";
    if (isPending) return "66%";
    if (hasRegistered) return "33%";
    return "0%";
  };

  return (
    <div className="space-y-6 animate-[fadeslide_0.4s_ease-out]">
      {/* Hero Welcome Banner (Full Width di Atas) */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#030712] via-[#0B1442] to-[#1E3A8A] p-7 text-white shadow-xl shadow-[#0B1442]/30 border border-white/5">
        {/* Glow Ambient Lights */}
        <div className="absolute right-12 bottom-[-20px] w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute left-[20%] top-[-20px] w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        <Landmark className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.06] text-sky-400 pointer-events-none transform rotate-6" strokeWidth={1} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#00A5EC] animate-pulse" />
            <span>{getGreeting()}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,165,236,0.2)]">{user?.nama || "Peserta"}</h2>
          <p className="text-xs text-white/70 mt-2 font-sans max-w-xl leading-relaxed">
            Pantau dan kelola permohonan magang Anda di Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo secara praktis dalam satu pintu.
          </p>

          {hasRegistered && (
            <div className={`mt-5 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[10px] font-extrabold text-white border shadow-inner backdrop-blur-md ${isAccepted
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : isRejected
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : isRevisi
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-[#00A5EC]/10 border-[#00A5EC]/20 text-[#00A5EC]"
              }`}>
              <span className="relative flex h-2.5 w-2.5">
                {isPending && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
                {isRevisi && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPending ? "bg-blue-400" : isRevisi ? "bg-amber-400" : isAccepted ? "bg-emerald-400" : "bg-red-400"}`}></span>
              </span>
              <span>Status Pendaftaran: <span className="font-black ml-1">{status?.status_pendaftaran || "Diproses"}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Content 2 Columns (Di Bawah Hero Banner) */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Kolom Utama (Kiri) */}
        <div className="flex-1 space-y-6">

          {/* Main Alert / CTA Cards based on Status */}
          {!loading && (
            <div className="space-y-4">
              <div>
                {/* Card: Start Registration */}
                {!hasRegistered && (
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${dk
                      ? "border-[#00A5EC]/20 bg-[#00A5EC]/5 hover:bg-[#00A5EC]/10"
                      : "border-[#00A5EC]/30 bg-gradient-to-r from-[#00A5EC]/5 to-[#004F9F]/5 hover:shadow-lg hover:shadow-blue-500/5"
                    }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A5EC] to-[#004F9F] text-white shadow-md shadow-blue-500/20">
                        <FileText className="w-6 h-6" strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className={`text-sm font-black tracking-tight ${txt}`}>Mulai Pengajuan Magang Anda</h3>
                        <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${sub}`}>
                          Belum ada permohonan aktif. Isi formulir biodata lengkap dan unggah berkas surat pengantar resmi dari instansi Anda.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleTabChange("form")} className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#0B1442] px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-950/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer group">
                      Lengkapi Berkas Sekarang
                      <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                )}

                {/* Card: Pending / In Verification */}
                {isPending && (
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${dk
                      ? "border-[#00A5EC]/20 bg-[#00A5EC]/5 hover:bg-[#00A5EC]/10"
                      : "border-[#00A5EC]/30 bg-gradient-to-r from-[#00A5EC]/5 to-[#004F9F]/5 hover:shadow-lg hover:shadow-blue-500/5"
                    }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A5EC] to-[#004F9F] text-white shadow-md shadow-blue-500/20">
                        <Hourglass className="w-5.5 h-5.5 animate-[spin_2.5s_linear_infinite]" strokeWidth={2} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-black tracking-tight ${txt}`}>Berkas Sedang Diverifikasi</h3>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${sub}`}>
                          Dokumen Anda sedang diperiksa secara teliti oleh tim administrator Diskominfo. Mohon tunggu proses ini selama 2-3 hari kerja.
                        </p>
                      </div>
                    </div>
                    <span className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/20 border border-white/10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A5EC] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A5EC]" />
                      </span>
                      Tahap: Menunggu
                    </span>
                  </div>
                )}

                {/* Card: Needs Revision */}
                {isRevisi && (
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${dk
                      ? "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10"
                      : "border-amber-300 bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:shadow-lg hover:shadow-amber-500/5"
                    }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 animate-pulse">
                        <AlertTriangle className="w-5.5 h-5.5" strokeWidth={2} />
                      </span>
                      <div className="space-y-2.5 w-full">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-black tracking-tight ${txt}`}>Permintaan Revisi Dokumen</h3>
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed font-sans max-w-lg ${sub}`}>Berkas Anda memerlukan perbaikan segera agar dapat diverifikasi ulang.</p>
                        </div>
                        {status.catatan_admin && (
                          <div className={`relative text-xs rounded-xl p-3.5 font-sans italic border-l-4 ${dk
                              ? "bg-amber-400/5 border-amber-500 text-amber-300/90"
                              : "text-amber-900 bg-amber-50/80 border-amber-500 shadow-sm"
                            }`}>
                            <p className="font-bold not-italic text-[10px] uppercase tracking-wider text-amber-600 mb-1">Catatan Admin:</p>
                            "{status.catatan_admin}"
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleTabChange("revisi")} className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-orange-600 hover:to-amber-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-amber-600/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer group">
                      Perbaiki Sekarang
                      <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                )}

                {/* Card: Accepted */}
                {isAccepted && (
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${dk
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-emerald-300 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:shadow-lg hover:shadow-emerald-500/5"
                    }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none animate-pulse" />
                    <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 animate-pulse">
                        <PartyPopper className="w-5.5 h-5.5" strokeWidth={2} />
                      </span>
                      <div className="space-y-3.5 w-full">
                        <div>
                          <h3 className="text-sm font-black tracking-tight text-emerald-600">Selamat! Anda Diterima Magang</h3>
                          <p className={`text-xs mt-1 leading-relaxed font-sans ${sub}`}>Permohonan magang Anda telah disetujui. Berikut rincian penempatan Anda:</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${surface}`}>
                            <div className={`p-2 rounded-lg shrink-0 ${dk ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                              <Landmark className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-[9px] font-black uppercase tracking-wider ${muted}`}>Penempatan Bidang</p>
                              <p className={`font-bold text-xs mt-0.5 ${txt}`}>{status.posisi_bidang || "Belum Ditentukan"}</p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${surface}`}>
                            <div className={`p-2 rounded-lg shrink-0 ${dk ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-[9px] font-black uppercase tracking-wider ${muted}`}>Periode Pelaksanaan</p>
                              <p className={`font-bold text-xs mt-0.5 ${txt}`}>
                                {status.tanggal_mulai || "-"} <span className="text-emerald-500 text-[10px] font-normal mx-0.5">s/d</span> {status.tanggal_selesai || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/20 border border-white/10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                      Lolos Seleksi
                    </span>
                  </div>
                )}

                {/* Card: Rejected */}
                {isRejected && (
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all duration-300 ${dk
                      ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                      : "border-red-300 bg-gradient-to-r from-red-500/5 to-rose-500/5 hover:shadow-lg hover:shadow-red-500/5"
                    }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-red-400/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-md shadow-red-500/20">
                        <XCircle className="w-5.5 h-5.5" strokeWidth={2} />
                      </span>
                      <div className="space-y-2.5 relative z-10 w-full">
                        <div>
                          <h3 className="text-sm font-black tracking-tight text-red-500">Permohonan Magang Ditolak</h3>
                          <p className={`text-xs mt-1 leading-relaxed font-sans ${sub}`}>Mohon maaf, permohonan magang Anda belum dapat diterima pada saat ini.</p>
                        </div>
                        {status.catatan_admin && (
                          <div className={`relative text-xs rounded-xl p-3.5 font-sans italic border-l-4 ${dk
                              ? "bg-red-400/5 border-red-500 text-red-300/90"
                              : "text-red-900 bg-red-50/80 border-red-500 shadow-sm"
                            }`}>
                            <p className="font-bold not-italic text-[10px] uppercase tracking-wider text-red-600 mb-1">Catatan Admin:</p>
                            "{status.catatan_admin}"
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-950/20 border border-white/10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      Status: Ditolak
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Action Navigation Grid */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
            {hasRegistered && !isRevisi ? (
              <div className={`relative overflow-hidden flex flex-col justify-between rounded-2xl border p-5 select-none group/lock ${dk ? "border-white/5 bg-[#161b22]/40" : "border-slate-200 bg-slate-50/60"
                }`}>
                <div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl mb-5 transition-transform duration-300 group-hover/lock:scale-95 ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                    }`}>
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className={`text-sm font-bold ${txt} opacity-60`}>Ajukan Pendaftaran</h4>
                  <p className={`mt-2 text-xs leading-relaxed font-sans ${muted}`}>Formulir pendaftaran dinonaktifkan karena berkas Anda sudah dikirim.</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Terkunci</span>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"}`}>Sudah Mengajukan</span>
                </div>
              </div>
            ) : (
              <button onClick={() => handleTabChange("form")} className="group relative overflow-hidden flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-5 text-white shadow-xl shadow-[#0B1442]/20 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mb-5 group-hover:scale-105 duration-300 shadow-md">
                    <FileText className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className="text-sm font-black tracking-tight">Ajukan Pendaftaran</h4>
                  <p className="mt-2 text-xs text-white/70 leading-relaxed font-sans">Mulai pengisian formulir biodata diri dan unggah berkas pengantar.</p>
                </div>
                <p className="mt-6 flex items-center gap-1 text-xs font-bold text-[#00A5EC] transition-all">
                  Mulai Form
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </p>
              </button>
            )}

            {hasRegistered ? (
              <button onClick={() => handleTabChange("status")} className="group relative overflow-hidden flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-5 text-white shadow-xl shadow-[#0B1442]/20 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mb-5 group-hover:scale-105 duration-300 shadow-md">
                    <FileText className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className="text-sm font-black tracking-tight">Pantau Status</h4>
                  <p className="mt-2 text-xs text-white/70 leading-relaxed font-sans">Lacak progres verifikasi dokumen dan pengumuman akhir.</p>
                </div>
                <p className="mt-6 flex items-center gap-1 text-xs font-bold text-[#00A5EC] transition-all">
                  Lihat Detail
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </p>
              </button>
            ) : (
              <div className={`relative overflow-hidden flex flex-col justify-between rounded-2xl border p-5 select-none group/lock ${dk ? "border-white/5 bg-[#161b22]/40" : "border-slate-200 bg-slate-50/60"
                }`}>
                <div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl mb-5 transition-transform duration-300 group-hover/lock:scale-95 ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                    }`}>
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className={`text-sm font-bold ${txt} opacity-60`}>Pantau Status</h4>
                  <p className={`mt-2 text-xs leading-relaxed font-sans ${muted}`}>Lacak progres verifikasi dokumen dan pengumuman akhir.</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Belum Tersedia</span>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"}`}>Menunggu Pendaftaran</span>
                </div>
              </div>
            )}

            {!forceRevisiForTesting && !isRevisi ? (
              <div className={`relative overflow-hidden flex flex-col justify-between rounded-2xl border p-5 select-none group/lock ${dk ? "border-white/5 bg-[#161b22]/40" : "border-slate-200 bg-slate-50/60"
                }`}>
                <div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl mb-5 transition-transform duration-300 group-hover/lock:scale-95 ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                    }`}>
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <h4 className={`text-sm font-bold ${txt} opacity-60`}>Revisi Dokumen</h4>
                  <p className={`mt-2 text-xs leading-relaxed font-sans ${muted}`}>Menu hanya aktif apabila berkas yang dikirim memerlukan perbaikan.</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Terkunci</span>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"}`}>Tidak Perlu Revisi</span>
                </div>
              </div>
            ) : (
              <button onClick={() => handleTabChange("revisi")} className="group relative overflow-hidden flex flex-col justify-between rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-5 text-white shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 mb-5 group-hover:scale-105 duration-300 shadow-md">
                    <Pencil className="w-5 h-5 text-white" strokeWidth={2} />
                  </span>
                  <h4 className="text-sm font-black tracking-tight">Revisi Dokumen</h4>
                  <p className="mt-2 text-xs text-white/80 leading-relaxed font-sans">Segera unggah berkas perbaikan sesuai dengan catatan penolakan dari admin.</p>
                </div>
                <p className="mt-6 flex items-center gap-1 text-xs font-bold text-white transition-all">
                  Perbaiki Berkas
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Kolom Stepper Progress Vertikal (Kanan) */}
        <div className={`lg:w-80 shrink-0 rounded-2xl border p-6 shadow-sm ${surface} transition-colors duration-300 flex flex-col lg:sticky lg:top-6`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-6 ${txt}`}>Alur Proses Pendaftaran</h3>
          <div className="flex-1 flex flex-col justify-between relative pl-2 py-1 gap-6 lg:gap-0">
            {/* Timeline Bar (Centering fixed at left 30px with translate-x-1/2) */}
            <div className={`absolute top-5 bottom-5 left-[30px] -translate-x-1/2 w-[3px] rounded-full hidden lg:block ${dk ? "bg-white/10" : "bg-slate-100"}`}>
              <div
                className="w-full bg-gradient-to-b from-emerald-500 via-blue-500 to-[#00A5EC] rounded-full transition-all duration-700"
                style={{ height: getStepProgressHeight() }}
              />
            </div>

            {[
              { label: "Registrasi Akun", sub: "Akun aktif", done: true, active: false },
              { label: "Kirim Berkas", sub: hasRegistered ? "Terkirim" : "Belum", done: hasRegistered, active: !hasRegistered },
              { label: "Verifikasi", sub: isPending ? "Sedang diproses" : (isAccepted || isRejected || isRevisi) ? "Selesai" : "Menunggu", done: isAccepted || isRejected || isRevisi, active: hasRegistered && isPending },
              { label: "Pengumuman", sub: isAccepted ? "Diterima" : isRejected ? "Ditolak" : isRevisi ? "Revisi" : "Menunggu", done: isAccepted, bad: isRejected, warn: isRevisi, active: hasRegistered && !isPending && (isAccepted || isRejected || isRevisi) },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 z-10 group/step text-left">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  {s.active && (
                    <span className="absolute inset-0 rounded-full bg-[#00A5EC]/30 animate-ping" />
                  )}
                  <div className={`relative flex h-11 w-11 items-center justify-center rounded-full text-xs font-black shadow-lg transition-all duration-300 transform group-hover/step:scale-110 ${s.done
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/25"
                      : s.bad
                        ? "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-500/25"
                        : s.warn
                          ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/25"
                          : s.active
                            ? "bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg shadow-[#004F9F]/40 ring-4 ring-[#00A5EC]/20"
                            : dk
                              ? "bg-white/5 border border-white/10 text-slate-500"
                              : "bg-white border border-slate-200 text-slate-400"
                    }`}>
                    {s.done ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : s.bad ? (
                      <XCircle className="w-5.5 h-5.5" />
                    ) : s.warn ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <span className="font-bold text-[13px]">{i + 1}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className={`text-[11px] font-extrabold tracking-tight transition-colors duration-200 group-hover/step:text-[#00A5EC] ${txt}`}>{s.label}</p>
                  <p className={`text-[10px] font-sans ${muted}`}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
        @keyframes fadeslide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </div>
  );
};

export default TabDashboard;