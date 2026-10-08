import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  Zap,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const getSalam = () => {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat Pagi";
  if (jam < 15) return "Selamat Siang";
  if (jam < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const getInisial = (nama) => {
  if (!nama) return "M";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export const MentorDashboardHero = ({
  user,
  antrean,
  totalBimbingan,
  pesertaBelumDinilai,
  defaultBidang,
  isDark,
}) => {
  const navigate = useNavigate();
  const salam = getSalam();
  const namaMentor = user?.nama_lengkap || user?.name || user?.nama || "Pembimbing Lapangan";
  const fotoUrl = user?.foto_profil ? getFileUrl(user.foto_profil) : null;

  // Deteksi nama bidang resmi
  const rawBidang =
    user?.bidang?.nama ||
    user?.bidang_nama ||
    user?.bidang?.nama_bidang ||
    user?.posisi_bidang ||
    defaultBidang ||
    "Aplikasi dan Informatika";

  const namaBidang = rawBidang.toLowerCase().startsWith("bidang")
    ? rawBidang
    : `Bidang ${rawBidang}`;

  // Prioritas hari ini (mirip dengan Dashboard Admin)
  const tugasPrioritasList = [
    {
      id: "izin",
      judul: "Verifikasi permohonan izin",
      jumlah: antrean?.izin || 0,
      tujuan: "/mentor/pengajuan-izin",
    },
    {
      id: "tugas",
      judul: "Review pengumpulan tugas",
      jumlah: antrean?.tugas || 0,
      tujuan: "/mentor/tugas/review",
    },
    {
      id: "laporan",
      judul: "Verifikasi laporan akhir",
      jumlah: antrean?.laporan_akhir || 0,
      tujuan: "/mentor/laporan-akhir",
    },
    {
      id: "penilaian",
      judul: "Evaluasi 4 pilar belum tuntas",
      jumlah: pesertaBelumDinilai || antrean?.penilaian || 0,
      tujuan: "/mentor/penilaian",
    },
  ];

  const tugasPrioritas = tugasPrioritasList.find((t) => (t.jumlah || 0) > 0) || null;

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#122B70] border-white/10 text-white"
          : "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#003882] border-blue-900/40 text-white"
      } p-4 sm:p-6`}
    >
      {/* Ambient Glows & Radial Dot Matrix dengan Animasi Pulse */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#00A5EC]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-60 -bottom-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] animate-[pulse_4s_ease-in-out_infinite]" />

      {/* Watermark Icon - Icon Rumah / Dashboard seperti di Sidebar */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 sm:-right-2 top-1/2 h-36 w-36 sm:h-52 sm:w-52 -translate-y-1/2 rotate-12 text-sky-400 opacity-[0.05]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>

      <div className="relative z-10 flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Kolom Kiri: Avatar + Identitas */}
        <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
          {/* Avatar Mentor (Tanpa ikon yang menempel) */}
          <div className="relative shrink-0">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={namaMentor}
                className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 sm:ring-3 ring-white/25 shadow-xl"
              />
            ) : (
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-lg sm:text-2xl font-black text-white ring-2 sm:ring-3 ring-white/25 shadow-xl">
                {getInisial(namaMentor)}
              </div>
            )}
          </div>

          {/* Info Mentor */}
          <div className="min-w-0 flex-1">
            {/* Tulisan Selamat Pagi (Diperbesar) */}
            <p className="text-sm sm:text-base md:text-lg font-black text-white/90 tracking-tight leading-tight">
              {salam}
            </p>

            {/* Nama Mentor */}
            <h1 className="mt-0.5 text-lg sm:text-2xl md:text-[28px] font-black tracking-tight leading-tight truncate text-white">
              {namaMentor}
            </h1>

            {/* Deretan Badge (Berada di bawah tulisan nama mentor) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-sky-200 ring-1 ring-white/15 backdrop-blur-sm">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-300" />
                <span className="truncate">{namaBidang}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur-sm">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{totalBimbingan || 0} Peserta Aktif</span>
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Prioritas Hari Ini (Desain Seperti di Dashboard Admin) */}
        <div className="shrink-0 self-start lg:self-center">
          {tugasPrioritas ? (
            <button
              type="button"
              onClick={() => navigate(tugasPrioritas.tujuan)}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 py-2.5 pl-3.5 pr-3 text-left backdrop-blur-md transition-all duration-300 animate-[popIn_0.4s_ease-out_both] hover:-translate-y-0.5 hover:border-[#00A5EC]/50 hover:bg-white/15 hover:shadow-xl active:scale-95"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-[#0B1442] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9.5px] font-bold uppercase tracking-widest text-white/50">
                  Prioritas hari ini
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] font-bold text-white">
                  {tugasPrioritas.judul}{" "}
                  <span className="ml-1 text-amber-300 font-black">
                    ({Number(tugasPrioritas.jumlah).toLocaleString("id-ID")})
                  </span>
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#00A5EC]" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 backdrop-blur-md animate-[popIn_0.4s_ease-out_both]">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" strokeWidth={2.4} />
              <span className="text-[12.5px] font-bold text-emerald-200">
                Seluruh antrean telah tertangani
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardHero;
