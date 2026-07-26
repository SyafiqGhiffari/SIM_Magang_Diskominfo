import { GraduationCap, Award, FileText, History } from "lucide-react";

// Banner mode read-only untuk peserta yang sudah selesai magang (alumni).
const AlumniBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-5 shadow-md animate-[fadeslide_0.35s_ease-out]">
      <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-3.5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
          <GraduationCap className="w-5 h-5 text-white" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15">
            Mode Alumni · Hanya Lihat
          </p>
          <h3 className="mt-2 text-sm font-black tracking-tight text-white">
            Masa magang Anda telah berakhir
          </h3>
          <p className="mt-1 text-[11.5px] font-medium leading-relaxed text-white/70">
            Fitur absen dan pengajuan izin sudah ditutup. Akun Anda tetap aktif sehingga
            Anda masih dapat mengunduh sertifikat, melihat raport, dan menelusuri riwayat presensi.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/15">
              <Award className="w-3 h-3" /> Sertifikat
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/15">
              <FileText className="w-3 h-3" /> Raport
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/15">
              <History className="w-3 h-3" /> Riwayat presensi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniBanner;