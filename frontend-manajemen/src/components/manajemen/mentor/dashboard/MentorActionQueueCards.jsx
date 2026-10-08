import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckSquare,
  FileSignature,
  Award,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

const W = {
  amber: {
    grad: "from-amber-500 to-amber-700",
    bg: "bg-amber-100/90 text-amber-600 ring-1 ring-amber-500/25 shadow-sm shadow-amber-500/10",
    darkBg: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30",
  },
  sky: {
    grad: "from-sky-500 to-sky-700",
    bg: "bg-sky-100/90 text-sky-600 ring-1 ring-sky-500/25 shadow-sm shadow-sky-500/10",
    darkBg: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30",
  },
  violet: {
    grad: "from-violet-500 to-violet-700",
    bg: "bg-violet-100/90 text-violet-600 ring-1 ring-violet-500/25 shadow-sm shadow-violet-500/10",
    darkBg: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30",
  },
  emerald: {
    grad: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-100/90 text-emerald-600 ring-1 ring-emerald-500/25 shadow-sm shadow-emerald-500/10",
    darkBg: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30",
  },
};

const KartuTindakan = ({
  icon: Icon,
  judul,
  jumlah,
  catatan,
  warna,
  tunda,
  isDark,
  onClick,
}) => {
  const ada = (jumlah || 0) > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${tunda}ms` }}
      className={`group relative overflow-hidden rounded-xl border p-2.5 sm:p-4 text-left shadow-sm transition-all duration-300 animate-[fadeslide_0.4s_ease-out_both] hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        isDark
          ? "border-white/5 bg-white/[0.02] hover:bg-white/5"
          : "border-slate-200/60 bg-white hover:border-slate-300/80"
      }`}
    >
      {ada && (
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${warna.grad} opacity-[0.28] blur-xl transition-all duration-300 group-hover:opacity-[0.42] group-hover:scale-125`}
        />
      )}

      <div className="relative flex items-center gap-2.5 sm:gap-3.5">
        <span
          className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
            ada
              ? isDark
                ? warna.darkBg || "bg-white/10 text-white"
                : warna.bg || "bg-slate-100 text-slate-600"
              : isDark
                ? "bg-white/[0.04] text-slate-500 ring-1 ring-white/5"
                : "bg-slate-100/80 text-slate-400 ring-1 ring-slate-200/60"
          }`}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-[11px] sm:text-[12.5px] font-bold leading-snug ${
              ada
                ? isDark
                  ? "text-slate-200"
                  : "text-slate-700"
                : isDark
                  ? "text-slate-400"
                  : "text-slate-600"
            }`}
          >
            {judul}
          </p>
          {catatan ? (
            <p className="mt-0.5 text-[9px] sm:text-[10.5px] font-bold text-rose-500 truncate">
              {catatan}
            </p>
          ) : (
            <p
              className={`mt-0.5 text-[9px] sm:text-[10.5px] font-medium truncate ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {ada ? "Menunggu diproses" : "Tidak ada antrean"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-0.5">
          <span
            className={`text-lg sm:text-2xl font-black tabular-nums tracking-tight ${
              ada
                ? isDark
                  ? "text-slate-100"
                  : "text-[#0B1442]"
                : isDark
                  ? "text-slate-700"
                  : "text-slate-200"
            }`}
          >
            {Number(jumlah || 0).toLocaleString("id-ID")}
          </span>
          <ChevronRight
            className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1 ${
              ada
                ? "text-slate-400"
                : isDark
                  ? "text-slate-700"
                  : "text-slate-200"
            }`}
          />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ${
          ada ? `bg-gradient-to-r ${warna.grad}` : isDark ? "bg-white/10" : "bg-slate-200"
        }`}
      />
    </button>
  );
};

export const MentorActionQueueCards = ({ antrean, pesertaBelumDinilai, isDark }) => {
  const navigate = useNavigate();

  const totalPenilaian =
    pesertaBelumDinilai != null && pesertaBelumDinilai !== undefined
      ? pesertaBelumDinilai
      : antrean?.penilaian || 0;

  const totalAntrean =
    (antrean?.izin || 0) +
    (antrean?.tugas || 0) +
    (antrean?.laporan_akhir || 0) +
    (totalPenilaian || 0);

  const daftarTindakan = [
    {
      id: "izin",
      judul: "Verifikasi Izin & Sakit",
      jumlah: antrean?.izin || 0,
      catatan: antrean?.izin > 0 ? `${antrean.izin} permohonan baru` : "",
      tujuan: "/mentor/pengajuan-izin",
      icon: CalendarClock,
      warna: W.amber,
    },
    {
      id: "tugas",
      judul: "Review Pengumpulan Tugas",
      jumlah: antrean?.tugas || 0,
      catatan: antrean?.tugas > 0 ? `${antrean.tugas} tugas menunggu dinilai` : "",
      tujuan: "/mentor/tugas/review",
      icon: CheckSquare,
      warna: W.sky,
    },
    {
      id: "laporan",
      judul: "Verifikasi Laporan Akhir",
      jumlah: antrean?.laporan_akhir || 0,
      catatan: antrean?.laporan_akhir > 0 ? `${antrean.laporan_akhir} laporan menunggu review` : "",
      tujuan: "/mentor/laporan-akhir",
      icon: FileSignature,
      warna: W.violet,
    },
    {
      id: "penilaian",
      judul: "Evaluasi 4 Pilar Tertunda",
      jumlah: totalPenilaian || 0,
      catatan: totalPenilaian > 0 ? `${totalPenilaian} belum dinilai final` : "",
      tujuan: "/mentor/penilaian",
      icon: Award,
      warna: W.emerald,
    },
  ];

  return (
    <section
      className={`w-full rounded-2xl border p-4 sm:p-5 shadow-sm transition-colors ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Judul Seksi: Persis Seperti di Dashboard Admin */}
      <div className="mb-4 sm:mb-5 flex items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <ClipboardCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`text-xs sm:text-sm font-black tracking-tight line-clamp-2 leading-tight ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Perlu Tindakan Anda
            </h3>
            <p
              className={`mt-0.5 text-[9px] sm:text-[11px] font-medium line-clamp-2 leading-tight ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              <span className="hidden sm:inline">Klik salah satu untuk langsung menuju halamannya</span>
              <span className="sm:hidden">Pilih tugas untuk memproses</span>
            </p>
          </div>
        </div>

        {/* Badge Status Antrean Kanan */}
        <div className="shrink-0 pt-0.5 sm:pt-0">
          {totalAntrean > 0 ? (
            <span
              className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10.5px] font-black animate-[popIn_0.35s_ease-out_both] ${
                isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              {Number(totalAntrean).toLocaleString("id-ID")} menunggu
            </span>
          ) : (
            <span
              className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[8.5px] sm:text-[10.5px] font-black ${
                isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Tidak ada tunggakan
            </span>
          )}
        </div>
      </div>

      {/* Grid 4 Kartu Tindakan: 2 Kolom per Baris */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {daftarTindakan.map((t, i) => (
          <KartuTindakan
            key={t.id}
            icon={t.icon}
            judul={t.judul}
            jumlah={t.jumlah || 0}
            catatan={t.catatan}
            warna={t.warna}
            tunda={i * 45}
            isDark={isDark}
            onClick={() => navigate(t.tujuan)}
          />
        ))}
      </div>
    </section>
  );
};

export default MentorActionQueueCards;
