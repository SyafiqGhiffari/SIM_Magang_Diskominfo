import { Link } from "react-router-dom";

const persyaratanUmum = [
  "Terdaftar sebagai mahasiswa aktif (D3/D4/S1) atau siswa aktif SMA/SMK/MA sederajat.",
  "Membawa Surat Pengantar/Permohonan Magang resmi dari institusi pendidikan asal.",
  "Mengisi formulir pendaftaran secara online melalui portal SIM Magang.",
  "Melampirkan Curriculum Vitae (CV) dan dokumen pendukung lainnya.",
  "Bersedia mematuhi peraturan tata tertib serta jam kerja operasional dinas.",
];

const dokumenWajib = [
  "Surat Pengantar Permohonan Magang resmi dari kampus atau sekolah (PDF)",
  "Kartu Tanda Mahasiswa (KTM) atau Kartu Pelajar aktif",
  "Curriculum Vitae (CV) terbaru yang memuat riwayat studi & keahlian",
  "Pas Foto berwarna terbaru (latar belakang merah)",
  "Proposal Rencana Kegiatan Magang (jika dipersyaratkan oleh institusi asal)",
];

const PersyaratanPage = () => {

  return (
    <section className="bg-slate-50 min-h-[75vh]">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-dark via-brand-medium to-brand-light px-6 py-16 text-center text-white relative overflow-hidden">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl animate-pulse-slow" />
        <div className="absolute right-10 bottom-5 h-48 w-48 rounded-full bg-brand-light/15 blur-2xl animate-float" />
        
        <h1 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">Persyaratan Pendaftaran</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-xs text-slate-200">
          Pastikan Anda memenuhi persyaratan dan mempersiapkan berkas berikut sebelum melakukan pendaftaran.
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Persyaratan Umum Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-medium/5 text-base">📋</span> 
              Persyaratan Umum
            </h2>
            <div className="h-0.5 bg-slate-100 my-4" />
            <ul className="space-y-4">
              {persyaratanUmum.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-medium/10 text-[9px] font-extrabold text-brand-medium">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dokumen Wajib Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light/10 text-base">📁</span> 
              Dokumen Wajib
            </h2>
            <div className="h-0.5 bg-slate-100 my-4" />
            <ul className="space-y-4">
              {dokumenWajib.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-light/10 text-[9px] font-extrabold text-brand-medium">📁</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Call to Action bottom banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand-dark to-brand-medium p-8 text-center text-white shadow-lg shadow-brand-dark/10">
          <h3 className="text-lg font-bold">Sudah Memenuhi Semua Persyaratan?</h3>
          <p className="mt-2 text-xs text-slate-200">
            Segera ajukan pendaftaran magang Anda untuk mengamankan kuota penempatan divisi pilihan.
          </p>
          <Link
            to="/pilih-pendaftaran"
            className="cursor-pointer mt-6 inline-flex rounded-full bg-white px-8 py-3 text-xs font-bold text-brand-dark shadow-md hover:bg-slate-50 transition-colors"
          >
            Daftar Magang Sekarang
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PersyaratanPage;