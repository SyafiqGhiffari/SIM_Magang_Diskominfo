import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Building2,
  CalendarDays,
  Clock,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  UserCheck,
  Phone,
  Mail,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

const getSalam = () => {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat Pagi";
  if (jam < 15) return "Selamat Siang";
  if (jam < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const getInisial = (nama) => {
  if (!nama) return "P";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export const PesertaDashboardHero = ({
  user,
  pendaftaran,
  timeline,
  presensiHariIni,
  tugasList = [],
  laporanAkhir,
  mentor,
  readOnly = false,
  onOpenAbsen,
  isDark = false,
}) => {
  const navigate = useNavigate();
  const salam = getSalam();
  const namaPeserta = user?.nama_lengkap || user?.name || user?.nama || "Peserta Magang";
  const fotoPeserta = user?.foto_profil || pendaftaran?.file_pas_foto;
  const fotoUrl = fotoPeserta ? getFileUrl(fotoPeserta) : null;

  const rawBidang = pendaftaran?.posisi_bidang || "Aplikasi dan Informatika";
  const posisiBidang = rawBidang.toLowerCase().startsWith("bidang")
    ? rawBidang
    : `Bidang ${rawBidang}`;

  const institusi = pendaftaran?.institusi || "Dinas Komunikasi dan Informatika";
  const jurusan = pendaftaran?.jurusan_prodi || "";

  // Kalkulasi Prioritas Hari Ini (Persis Seperti di Dashboard Mentor)
  const hariKerja = presensiHariIni?.hari_kerja;
  const sudahMasuk = presensiHariIni?.sudah_masuk;
  const sudahPulang = presensiHariIni?.sudah_pulang;
  const izinAktifHariIni = presensiHariIni?.izin_hari_ini;
  const logbookHariIni = presensiHariIni?.keterangan;

  const tugasRevisi = (tugasList || []).filter(
    (t) => t.pengumpulan?.status === "revisi" || t.status_tugas === "revisi"
  );
  const tugasBelumKumpul = (tugasList || []).filter(
    (t) => !t.pengumpulan || t.pengumpulan?.status === "belum_kumpul"
  );

  const statusLap = laporanAkhir?.status;

  const tugasPrioritasList = [
    {
      id: "absen_masuk",
      judul: "Lakukan presensi masuk",
      jumlah: !sudahMasuk && hariKerja && !izinAktifHariIni && !readOnly ? 1 : 0,
      action: () => (onOpenAbsen ? onOpenAbsen("masuk") : navigate("/peserta/presensi")),
    },
    {
      id: "absen_pulang",
      judul: "Lakukan presensi pulang",
      jumlah: sudahMasuk && !sudahPulang && hariKerja && !readOnly ? 1 : 0,
      action: () => (onOpenAbsen ? onOpenAbsen("pulang") : navigate("/peserta/presensi")),
    },
    {
      id: "revisi_tugas",
      judul: "Perbaiki revisi tugas",
      jumlah: tugasRevisi.length,
      action: () => navigate("/peserta/pembelajaran/tugas"),
    },
    {
      id: "tugas_aktif",
      judul: "Kerjakan tugas magang",
      jumlah: tugasBelumKumpul.length,
      action: () => navigate("/peserta/pembelajaran/tugas"),
    },
    {
      id: "logbook",
      judul: "Isi logbook hari ini",
      jumlah:
        hariKerja &&
        !izinAktifHariIni &&
        !readOnly &&
        (!logbookHariIni || String(logbookHariIni).trim() === "")
          ? 1
          : 0,
      action: () => navigate("/peserta/presensi"),
    },
    {
      id: "laporan",
      judul: "Perbaiki laporan akhir",
      jumlah: statusLap === "perlu_revisi" ? 1 : 0,
      action: () => navigate("/peserta/penilaian/laporan"),
    },
  ];

  const tugasPrioritas =
    tugasPrioritasList.find((t) => (t.jumlah || 0) > 0) || null;

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 p-5 sm:p-7 ${
        isDark
          ? "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#122B70] border-white/10 text-white"
          : "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#004F9F] border-blue-900/40 text-white"
      }`}
    >
      {/* Ambient Glows & Radial Dot Matrix dengan Animasi Pulse */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#00A5EC]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-[#FF2D78]/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] animate-[pulse_5s_ease-in-out_infinite]" />

      {/* Watermark Icon - Icon Rumah / Dashboard persis seperti di Dashboard Mentor */}
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

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
        {/* Kolom Kiri: Avatar Peserta + Identitas Lengkap */}
        <div className="flex items-center gap-4 sm:gap-5 min-w-0 max-w-3xl">
          {/* Avatar Peserta (Tanpa dot status yang menempel) */}
          <div className="relative shrink-0">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={namaPeserta}
                className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 sm:ring-3 ring-white/25 shadow-xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-lg sm:text-2xl font-black text-white ring-2 sm:ring-3 ring-white/25 shadow-xl">
                {getInisial(namaPeserta)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Tulisan Salam (Diperbesar seperti di dashboard mentor) */}
            <p className="text-sm sm:text-base md:text-lg font-black text-white/90 tracking-tight leading-tight">
              {salam}
            </p>

            {/* Nama Peserta */}
            <h1 className="mt-0.5 text-lg sm:text-2xl md:text-[28px] font-black tracking-tight leading-tight truncate text-white">
              {namaPeserta}
            </h1>

            {/* Deretan Badge yang Sejajar: Bidang, Instansi, dan Jurusan */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
              {/* 1. Badge Bidang Penempatan */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-sky-200 ring-1 ring-white/15 backdrop-blur-sm truncate max-w-[220px]">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-300 shrink-0" />
                <span className="truncate">{posisiBidang}</span>
              </span>

              {/* 2. Badge Instansi / Kampus (Building2) */}
              {institusi && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur-sm truncate max-w-[240px]">
                  <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">{institusi}</span>
                </span>
              )}

              {/* 3. Badge Program Studi / Jurusan (GraduationCap) */}
              {jurusan && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-purple-200 ring-1 ring-purple-400/30 backdrop-blur-sm truncate max-w-[220px]">
                  <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-300 shrink-0" />
                  <span className="truncate">{jurusan}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Prioritas Hari Ini (Persis Seperti Dashboard Mentor) */}
        <div className="shrink-0 self-start lg:self-center">
          {tugasPrioritas ? (
            <button
              type="button"
              onClick={tugasPrioritas.action}
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
              <CheckCircle2
                className="h-4 w-4 text-emerald-300 shrink-0"
                strokeWidth={2.4}
              />
              <span className="text-[12.5px] font-bold text-emerald-200">
                Seluruh kewajiban hari ini telah tuntas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Magang Timeline, Progress Track & Info Mentor ── */}
      {((timeline && timeline.total_hari > 0) || mentor) && (
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
            {/* Kolom Kiri: Progress Track Bar */}
            <div className={`${mentor ? "lg:col-span-6" : "lg:col-span-12"} space-y-2`}>
              {timeline && timeline.total_hari > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="text-white/85 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-300" />
                      {timeline.status === "selesai" ? (
                        "Masa Magang Telah Selesai"
                      ) : timeline.status === "belum_mulai" ? (
                        "Masa Magang Belum Dimulai"
                      ) : (
                        <>
                          Hari ke <strong className="text-white font-black">{timeline.hari_ke}</strong> dari{" "}
                          {timeline.total_hari} hari magang
                        </>
                      )}
                    </span>
                    <span className="text-white tabular-nums font-black text-sm">
                      {timeline.progres_persen}%
                    </span>
                  </div>

                  {/* Progress Track Bar */}
                  <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden shadow-inner">
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, timeline.progres_persen))}%`,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 transition-all duration-700 shadow-sm"
                    />
                  </div>

                  {/* Tanggal Mulai, Sisa Hari & Tanggal Selesai */}
                  <div className="flex items-center justify-between text-[10.5px] text-white/75 font-medium flex-wrap gap-1">
                    <span>Mulai: {formatTanggalPresensi(pendaftaran?.tanggal_mulai)}</span>
                    {timeline.status === "berjalan" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-300/30 font-bold">
                        <Clock className="w-3 h-3" />
                        Sisa {timeline.sisa_hari} hari lagi
                      </span>
                    )}
                    <span>Selesai: {formatTanggalPresensi(pendaftaran?.tanggal_selesai)}</span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-white/60">Informasi periode magang sedang diproses</div>
              )}
            </div>

            {/* Kolom Kanan: Mentor Pembimbing (dengan Garis Sekat) */}
            {mentor && (
              <div className="lg:col-span-6 pt-3.5 lg:pt-0 border-t border-white/15 lg:border-t-0 lg:border-l lg:border-white/15 lg:pl-6">
                <div className="group relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-md transition-all duration-300 shadow-sm hover:border-[#00A5EC]/40 hover:shadow-lg">
                  {/* Bagian Profil Mentor */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      {mentor.foto_profil ? (
                        <img
                          src={getFileUrl(mentor.foto_profil)}
                          alt={mentor.nama_lengkap || mentor.nama}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-white/20 shadow-md group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/20 shadow-md">
                          <UserCheck className="w-5 h-5 text-sky-200" />
                        </div>
                      )}
                      <span
                        title={mentor.is_online ? "Mentor sedang Online" : "Mentor sedang Offline"}
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-white/20 transition-all ${
                          mentor.is_online
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-sky-300">
                          Mentor Pembimbing
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-extrabold ${
                            mentor.is_online
                              ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                              : "bg-white/10 text-white/50 border border-white/10"
                          }`}
                        >
                          {mentor.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-[13px] font-black text-white truncate leading-tight mt-0.5 group-hover:text-sky-200 transition-colors">
                        {mentor.nama_lengkap || mentor.nama || "Pembimbing Lapangan"}
                      </h4>
                      <p className="text-[10px] sm:text-[10.5px] text-white/70 truncate leading-tight mt-0.5 font-medium">
                        {mentor.jabatan || mentor.bidang?.nama || "Dinas Komunikasi dan Informatika"}
                      </p>
                    </div>
                  </div>

                  {/* Kontak Interaktif: WhatsApp & Email */}
                  {(mentor.no_hp || mentor.email) && (
                    <div className="flex flex-col gap-1.5 shrink-0 min-w-0">
                      {mentor.no_hp && (
                        <a
                          href={`https://wa.me/${String(mentor.no_hp).replace(/\D/g, "").replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="group/wa inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-400/35 hover:border-emerald-500 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95"
                          title={`Chat WhatsApp (${mentor.no_hp})`}
                        >
                          <Phone className="w-3 h-3 text-emerald-400 group-hover/wa:text-white shrink-0 transition-colors" />
                          <span className="truncate max-w-[120px] sm:max-w-[150px] tracking-tight">
                            {mentor.no_hp}
                          </span>
                        </a>
                      )}
                      {mentor.email && (
                        <a
                          href={`mailto:${mentor.email}`}
                          className="group/mail inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-[#00A5EC]/20 hover:bg-[#00A5EC] text-sky-200 hover:text-white border border-[#00A5EC]/35 hover:border-[#00A5EC] shadow-2xs transition-all duration-200 cursor-pointer active:scale-95"
                          title={`Kirim Email (${mentor.email})`}
                        >
                          <Mail className="w-3 h-3 text-sky-300 group-hover/mail:text-white shrink-0 transition-colors" />
                          <span className="truncate max-w-[125px] sm:max-w-[170px] tracking-tight">
                            {mentor.email}
                          </span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PesertaDashboardHero;
