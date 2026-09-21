import { CheckCircle2, Award } from "lucide-react";

export const TranskripHeroCard = ({ peserta = {}, mentor = {}, penilaian = {}, adaSertifikat = false }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#030712] via-[#0B1442] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-xl">
      <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Penilaian Magang Telah Diterbitkan
            </span>
            {adaSertifikat && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Award className="w-3.5 h-3.5" />
                Sertifikat Siap Diunduh
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {peserta.nama}
          </h3>
          <p className="text-xs text-sky-200/80 mt-1">
            {peserta.institusi} • {peserta.jurusan} ({peserta.bidang})
          </p>
          <p className="text-[11px] text-white/60 mt-0.5">
            Mentor Pembimbing:{" "}
            <span className="text-white font-semibold">
              {mentor.nama || "Mentor Diskominfo"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 self-start md:self-auto">
          <div className="text-center pr-4 border-r border-white/15">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Nilai Akhir
            </div>
            <div className="text-3xl font-black mt-0.5 tabular-nums text-white">
              {Number(penilaian.nilai_akhir_angka || 0).toFixed(2)}
            </div>
          </div>
          <div className="text-center pr-4 border-r border-white/15">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Indeks
            </div>
            <div className="text-3xl font-black mt-0.5 text-sky-300">
              {penilaian.indeks_nilai_akhir || "A"}
            </div>
          </div>
          <div className="min-w-[120px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Predikat
            </div>
            <div className="text-sm font-extrabold text-emerald-300 mt-1 leading-tight">
              {penilaian.predikat_akhir || "Sangat Baik"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranskripHeroCard;
