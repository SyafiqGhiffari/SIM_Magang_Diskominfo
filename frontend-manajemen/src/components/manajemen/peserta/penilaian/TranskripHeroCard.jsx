import { Award, UserCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getFileUrl } from "../../../../utils/fileUrl";

export const TranskripHeroCard = ({
  peserta = {},
  mentor = {},
  penilaian = {},
  adaSertifikat = false,
}) => {
  const p = peserta || {};
  const pn = penilaian || {};
  const m = mentor || {};

  const fotoSrc = p.foto_profil
    ? getFileUrl(p.foto_profil)
    : p.file_pas_foto
    ? getFileUrl(p.file_pas_foto)
    : null;

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#003882] text-white p-5 sm:p-7 shadow-xl">
      {/* Ambient Glows & Radial Dot Matrix (Persis seperti Halaman Kelola Akun) */}
      <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
      <div className="absolute right-60 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
        {/* Kolom Kiri: Profil Peserta & Status Terbit */}
        <div className="flex items-start gap-3.5 sm:gap-5 min-w-0">
          {/* Avatar Peserta (Tanpa Icon Centang) */}
          <div className="relative shrink-0">
            {fotoSrc ? (
              <img
                src={fotoSrc}
                alt={p.nama || "Peserta"}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-white/30 shadow-md"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md ring-2 ring-white/30">
                {(p.nama || "P").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info Peserta */}
          <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Rapor Resmi Diterbitkan Mentor
              </span>

              {adaSertifikat && (
                <Link
                  to="/peserta/penilaian/sertifikat"
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30 transition-all cursor-pointer"
                >
                  <Award className="w-3 h-3 text-amber-300" />
                  E-Sertifikat Siap
                </Link>
              )}
            </div>

            <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-snug truncate">
              {p.nama || "Nama Peserta"}
            </h3>

            <p className="text-xs text-sky-200/90 font-medium truncate">
              {p.institusi || "Institusi"} • {p.jurusan || "Program Studi"}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[11px] text-white/70 pt-0.5">
              <span>
                Bidang: <strong className="text-white font-bold">{p.bidang || "Teknologi Informasi"}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                Pembimbing: <strong className="text-white font-bold">{m.nama || "Mentor Diskominfo"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kartu Ringkasan Nilai Akhir, Indeks, & Predikat (Desain Visual Premium) */}
        <div className="flex items-center gap-3 sm:gap-4.5 bg-white/[0.08] hover:bg-white/[0.11] transition-all duration-300 backdrop-blur-xl p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-white/20 self-start lg:self-auto shadow-2xl shrink-0">
          {/* 1. Nilai Akhir */}
          <div className="text-center px-1 sm:px-2">
            <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sky-300 flex items-center justify-center gap-1">
              Nilai Akhir
            </span>
            <div className="text-3xl sm:text-4xl lg:text-[42px] font-black mt-0.5 tabular-nums text-white tracking-tight drop-shadow-md leading-none py-1">
              {Number(pn.nilai_akhir_angka || 0).toFixed(2)}
            </div>
            <div className="text-[9px] font-bold text-sky-200/90 bg-white/10 px-2 py-0.5 rounded-full inline-block">
              Skala 100
            </div>
          </div>

          {/* Pemisah Vertikal Halus */}
          <div className="w-px h-12 sm:h-14 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

          {/* 2. Indeks Huruf Mutu */}
          <div className="text-center px-1 sm:px-2 flex flex-col items-center">
            <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sky-300">
              Indeks
            </span>
            <div className="my-1 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00A5EC]/30 to-[#004F9F]/40 border border-[#00A5EC]/50 font-black text-xl sm:text-2xl text-cyan-200 shadow-md shadow-[#00A5EC]/20">
              {pn.indeks_nilai_akhir || "A"}
            </div>
            <div className="text-[9px] text-cyan-200/80 font-medium">
              Huruf Mutu
            </div>
          </div>

          {/* Pemisah Vertikal Halus */}
          <div className="w-px h-12 sm:h-14 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

          {/* 3. Predikat Kelulusan */}
          <div className="min-w-[100px] sm:min-w-[125px] pl-1">
            <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sky-300 block">
              Predikat
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/35 shadow-xs">
                
                <span className="truncate">{pn.predikat_akhir || "Baik"}</span>
              </span>
            </div>
            <div className="text-[9px] text-emerald-200/70 mt-1 font-medium">
              Kualifikasi Magang
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranskripHeroCard;
