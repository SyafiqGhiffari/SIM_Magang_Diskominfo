import { GraduationCap, FileCheck2, Building2, Award, Info, FileText } from "lucide-react";

export const PanduanSistematikaCard = ({ institusi = "" }) => {
  return (
    <div className="space-y-4">
      {/* Kartu Utama: Ketentuan Laporan */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Ketentuan Laporan Akhir
            </h4>
            <p className="text-[11px] font-semibold text-slate-400">
              Format Mengikuti Kampus / Sekolah
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
          {/* Poin 1: Format dari Kampus */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
              <Building2 className="w-4 h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
              <span>Format &amp; Sistematika Bebas</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
              Diskominfo tidak mewajibkan format atau template baku. Struktur bab, sampul, dan tata penulisan laporan <strong>sepenuhnya mengikuti buku pedoman resmi</strong> dari {institusi || "kampus/sekolah asal Anda"}.
            </p>
          </div>

          {/* Poin 2: Lembar Pengesahan / Validasi */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Pengesahan &amp; Validasi Pembimbing</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
              Sertakan halaman pengesahan atau lembar persetujuan pembimbing lapangan yang mencantumkan identitas mentor Diskominfo. Naskah laporan akan ditinjau dan divalidasi oleh mentor pembimbing Anda.
            </p>
          </div>

          {/* Poin 3: Kesesuaian Aktivitas Riil */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Kesesuaian dengan Pekerjaan Dinas</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
              Pastikan materi, rincian aktivitas harian, serta hasil luaran proyek yang dituliskan sesuai dengan fakta pekerjaan nyata dan logbook selama berada di bidang penempatan Diskominfo.
            </p>
          </div>

          {/* Poin 4: Syarat Penerbitan Rapor & Sertifikat */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Syarat Kelulusan &amp; Rapor Nilai</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
              Laporan akhir yang disetujui (ACC) mentor merupakan syarat wajib agar evaluasi nilai 4 pilar kompetensi dapat difinalisasi serta sertifikat resmi magang dapat diterbitkan.
            </p>
          </div>
        </div>
      </div>

      {/* Kartu Catatan Berkas Unggah (Badge Style) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-[#004F9F] dark:bg-sky-950/60 dark:text-sky-400">
            <Info className="w-4 h-4" />
          </span>
          <h5 className="text-xs font-black text-slate-900 dark:text-white">
            Ketentuan Berkas Unggah
          </h5>
        </div>

        <div className="space-y-2">
          {/* Badge 1: Format File */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
            <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-[#004F9F] dark:text-sky-300 shrink-0">
              Format
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Wajib dokumen <strong>PDF (.pdf)</strong>
            </span>
          </div>

          {/* Badge 2: Batas Ukuran */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
            <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
              Ukuran
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Maksimal ukuran file <strong>20 MB</strong>
            </span>
          </div>

          {/* Badge 3: Luaran / Lampiran */}
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
            <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
              Luaran
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Tautan GitHub / Drive / Figma jika memiliki produk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanduanSistematikaCard;
