import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MessageSquareText,
  Award,
  Eye,
  ClipboardList,
  GraduationCap,
  School,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const formatDateShort = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return { totalDays: 0, daysPassed: 0, progressPercent: 0 };
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const diffTimeTotal = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(diffTimeTotal / (1000 * 60 * 60 * 24)));

    let daysPassed = 0;
    if (now > start) {
      const diffTimePassed = now.getTime() - start.getTime();
      daysPassed = Math.min(totalDays, Math.round(diffTimePassed / (1000 * 60 * 60 * 24)));
    }

    const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

    return { totalDays, daysPassed, progressPercent };
  } catch {
    return { totalDays: 0, daysPassed: 0, progressPercent: 0 };
  }
};

export const PesertaBimbinganCard = ({ peserta, onSelect, dk, mentorNama }) => {
  const navigate = useNavigate();

  const fotoSrc = peserta.foto_profil ? getFileUrl(peserta.foto_profil) : null;
  const inisial = (peserta.nama_lengkap || "P")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isMahasiswa = peserta.kategori_pendaftar === "mahasiswa";
  const duration = calculateDurationDays(peserta.tanggal_mulai, peserta.tanggal_selesai);

  // Bersihkan format nomor WhatsApp
  const cleanPhone = (peserta.nomor_hp || "").replace(/\D/g, "");
  const waNumber = cleanPhone.startsWith("0")
    ? "62" + cleanPhone.slice(1)
    : cleanPhone.startsWith("62")
    ? cleanPhone
    : "62" + cleanPhone;

  const waGreeting = encodeURIComponent(
    `Halo ${peserta.nama_lengkap}, saya ${mentorNama || "Pembimbing Lapangan"} dari Dinas Komunikasi dan Informatika Kabupaten Ponorogo.`
  );
  const waLink = cleanPhone ? `https://wa.me/${waNumber}?text=${waGreeting}` : null;

  const handlePenilaianClick = (e) => {
    e.stopPropagation();
    navigate("/mentor/penilaian", {
      state: {
        pesertaId: peserta.akun_peserta_id || peserta.id,
        nama: peserta.nama_lengkap,
      },
    });
  };

  const totalHadir = peserta.presensi_stats?.total_hadir || 0;
  const totalHari = peserta.presensi_stats?.total_hari || 0;

  return (
    <div
      className={`relative rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between overflow-hidden ${
        dk
          ? "bg-[#161b22] border-white/10"
          : "bg-white border-slate-200/80"
      }`}
    >
      <div className="space-y-3">
        {/* Top Bar: Badge Jenjang (Dengan Ikon) & Badge Magang Aktif (Full Width Row) */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
            {isMahasiswa ? (
              <GraduationCap className="w-3 h-3 text-[#004F9F] dark:text-sky-400 shrink-0" />
            ) : (
              <School className="w-3 h-3 text-[#004F9F] dark:text-sky-400 shrink-0" />
            )}
            <span>{isMahasiswa ? "Mahasiswa" : "Siswa SMK"}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold tracking-wide ${
              peserta.status_magang === "selesai"
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                peserta.status_magang === "selesai" ? "bg-purple-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {peserta.status_magang === "selesai" ? "Selesai Magang (Alumni)" : "Magang Aktif"}
          </span>
        </div>

        {/* Profile Row: Avatar & Nama Lengkap + NIM/Institusi Multiline (Bisa ke Baris 2) */}
        <div className="flex items-start gap-3">
          {/* Avatar Square (Tanpa Dot & Tanpa Hover Ring) */}
          <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            {fotoSrc ? (
              <img src={fotoSrc} alt={peserta.nama_lengkap} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm sm:text-base font-black text-white bg-gradient-to-br from-[#0B1442] to-[#00A5EC] w-full h-full flex items-center justify-center">
                {inisial}
              </span>
            )}
          </div>

          {/* Identitas Nama & NIM/Institusi Multiline */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug break-words">
              {peserta.nama_lengkap}
            </h4>

            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 break-words leading-relaxed">
              <span className="text-slate-400 dark:text-slate-500 font-semibold">
                {isMahasiswa ? "NIM:" : "NISN:"}
              </span>{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{peserta.nim_nisn || "-"}</span>
              <span className="text-slate-400"> • </span>
              <span className="text-slate-600 dark:text-slate-400">{peserta.institusi || "-"}</span>
            </p>
          </div>
        </div>

        {/* Penugasan Terakhir */}
        <div
          className={`p-2.5 rounded-xl border text-[10.5px] sm:text-xs space-y-1 ${
            dk ? "bg-white/[0.02] border-white/5 text-slate-300" : "bg-slate-50/80 border-slate-200/60 text-slate-600"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-3 h-3 text-[#004F9F] dark:text-sky-400 shrink-0" />
              <span>Penugasan Terbaru</span>
            </span>

            {peserta.tugas_terakhir ? (
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] sm:text-[8.5px] font-bold ${
                  peserta.tugas_terakhir.status_tugas === "dinilai"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : peserta.tugas_terakhir.status_tugas === "menunggu"
                    ? "bg-blue-500/15 text-blue-600 dark:text-sky-400"
                    : peserta.tugas_terakhir.status_tugas === "revisi"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {peserta.tugas_terakhir.status_tugas === "dinilai"
                  ? `Dinilai (${peserta.tugas_terakhir.nilai_tugas ?? 100})`
                  : peserta.tugas_terakhir.status_tugas === "menunggu"
                  ? "Menunggu Review"
                  : peserta.tugas_terakhir.status_tugas === "revisi"
                  ? "Perlu Revisi"
                  : "Sedang Dikerjakan"}
              </span>
            ) : (
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-medium italic">
                Belum ada tugas
              </span>
            )}
          </div>

          <p
            className="font-bold text-slate-800 dark:text-slate-200 truncate"
            title={peserta.tugas_terakhir?.judul_tugas || "Belum ada tugas yang diberikan"}
          >
            {peserta.tugas_terakhir?.judul_tugas || "Belum ada tugas yang diberikan"}
          </p>
        </div>

        {/* Timeline & Progress Bar Masa Magang */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDateShort(peserta.tanggal_mulai)} - {formatDateShort(peserta.tanggal_selesai)}</span>
            </span>
            <span className="font-extrabold text-[#004F9F] dark:text-sky-400">
              {duration.progressPercent}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#004F9F] dark:bg-[#0072CE] rounded-full transition-all duration-500"
              style={{ width: `${duration.progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Indikator Mini Cepat */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
          {/* 1. Kehadiran Presensi */}
          <div
            className={`p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between ${
              dk ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-200/50"
            }`}
          >
            <span className="block text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-wider">Kehadiran</span>
            <span className="text-[10.5px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 my-0.5 block">
              {Math.round(peserta.persentase_kehadiran || 0)}%
            </span>
            <span className="block text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-semibold truncate">
              {totalHadir}/{totalHari} Hari
            </span>
          </div>

          {/* 2. Laporan Akhir */}
          <div
            className={`p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between ${
              dk ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-200/50"
            }`}
          >
            <span className="block text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-wider">Laporan Akhir</span>
            <span
              className={`text-[9.5px] sm:text-[11px] font-bold my-0.5 block truncate ${
                peserta.file_laporan_akhir
                  ? "text-blue-600 dark:text-sky-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {peserta.file_laporan_akhir ? "Sudah Unggah" : "Belum"}
            </span>
            <span className="block text-[8px] sm:text-[9px] text-slate-400 truncate">
              {peserta.file_laporan_akhir ? "File Tersedia" : "Belum Ada"}
            </span>
          </div>

          {/* 3. Nilai Akhir / Evaluasi */}
          <div
            className={`p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between ${
              dk ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-200/50"
            }`}
          >
            <span className="block text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-wider">Nilai Akhir</span>
            <span
              className={`text-[9.5px] sm:text-[11px] font-black my-0.5 block truncate ${
                peserta.nilai_akhir_angka != null
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {peserta.nilai_akhir_angka != null ? peserta.nilai_akhir_angka : "Belum"}
            </span>
            <span className="block text-[8px] sm:text-[9px] text-slate-400 truncate font-semibold">
              {peserta.nilai_akhir_angka != null
                ? `Indeks: ${peserta.indeks_nilai_akhir || "-"}`
                : "Menunggu"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions Row (Animasi icon naik keatas saat hover) */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer active:scale-95"
              title="Hubungi WhatsApp Peserta"
            >
              <MessageSquareText className="w-4 h-4 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
            </a>
          )}

          <button
            type="button"
            onClick={handlePenilaianClick}
            className="group/btn h-8 px-2.5 rounded-lg flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10.5px] font-bold transition-all cursor-pointer active:scale-95"
            title="Beri / Lihat Penilaian Magang"
          >
            <Award className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
            <span className="hidden sm:inline">Nilai</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect(peserta)}
          className="group/btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer hover:shadow-xs active:scale-95"
          title="Buka Modal Detail Peserta"
        >
          <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
          <span>Detail</span>
        </button>
      </div>
    </div>
  );
};

export default PesertaBimbinganCard;
