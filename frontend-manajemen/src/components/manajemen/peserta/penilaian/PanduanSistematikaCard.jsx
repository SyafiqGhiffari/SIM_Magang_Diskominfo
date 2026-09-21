import { BookOpen } from "lucide-react";

export const PanduanSistematikaCard = () => {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400">
          <BookOpen className="w-4.5 h-4.5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Sistematika Laporan Akhir
          </h4>
          <p className="text-[11px] text-slate-400">Standar pedoman dinas</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">Halaman Depan</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Cover, Lembar Pengesahan Mentor &amp; Kepala Bidang, Kata Pengantar, Daftar Isi.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">BAB I · Pendahuluan</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Latar Belakang, Maksud &amp; Tujuan Magang, Ruang Lingkup, dan Waktu Pelaksanaan.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">BAB II · Profil Instansi</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Struktur Organisasi Diskominfo, Visi Misi, dan Tugas Pokok Bidang Penempatan.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">BAB III · Pelaksanaan Proyek</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Analisis Kebutuhan Sistem, Perancangan, Metodologi Kerja, dan Rincian Tugas.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">BAB IV · Hasil &amp; Pembahasan</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Implementasi Luaran, Pengujian, Dokumentasi Screenshot, dan Kendala Solusi.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
          <strong className="text-slate-900 dark:text-white font-black">BAB V · Penutup &amp; Lampiran</strong>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Kesimpulan, Saran Pengembangan, serta Lampiran Logbook Harian &amp; Dokumentasi Foto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanduanSistematikaCard;
