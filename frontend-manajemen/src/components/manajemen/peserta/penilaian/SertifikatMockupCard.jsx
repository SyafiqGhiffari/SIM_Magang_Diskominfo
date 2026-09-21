import { formatTanggalPresensi } from "../../../../constants/presensiStatus";

export const SertifikatMockupCard = ({ sertifikat = {}, peserta = {}, predikat = "Sangat Memuaskan" }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border-8 border-amber-400/20 bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20 dark:from-slate-900 dark:via-[#161b22] dark:to-slate-900 p-8 sm:p-12 shadow-2xl text-center">
      {/* Ornamen Sudut */}
      <div className="absolute top-4 left-4 h-12 w-12 border-t-2 border-l-2 border-amber-500/60" />
      <div className="absolute top-4 right-4 h-12 w-12 border-t-2 border-r-2 border-amber-500/60" />
      <div className="absolute bottom-4 left-4 h-12 w-12 border-b-2 border-l-2 border-amber-500/60" />
      <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-amber-500/60" />

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase font-extrabold tracking-widest text-[#004F9F] dark:text-sky-400">
            Dinas Komunikasi dan Informatika
          </p>
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wide text-slate-900 dark:text-white">
            SERTIFIKAT MAGANG
          </h1>
          <p className="font-mono text-xs text-slate-400">
            No: {sertifikat.nomor_sertifikat}
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Diberikan sebagai pengakuan resmi kepada:
        </p>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-3xl font-black text-[#0B1442] dark:text-white">
            {peserta.nama || peserta.nama_lengkap}
          </h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {peserta.institusi || peserta.asal_instansi} • {peserta.jurusan}
          </p>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          Telah berhasil menyelesaikan Program Praktik Kerja Lapangan / Magang pada Bidang <strong>{peserta.posisi_bidang || peserta.bidang || "Teknologi Informasi"}</strong> dengan predikat <strong className="text-emerald-600 dark:text-emerald-400">{predikat}</strong>.
        </p>

        {/* Info Footer TTD */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-left text-xs">
          <div>
            <p className="text-[11px] text-slate-400">Tanggal Terbit:</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {formatTanggalPresensi(sertifikat.created_at || new Date())}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-slate-400">Diterbitkan oleh:</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Kepala Dinas Kominfo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SertifikatMockupCard;
