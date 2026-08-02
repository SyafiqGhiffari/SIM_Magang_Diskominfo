import { Link } from "react-router-dom";
import { useLanding } from "../../context/landingContext";

const PersyaratanPage = () => {
  const { config } = useLanding();
  const ambil = (jenis, kategori) =>
    (config.konten?.[jenis] || [])
      .filter((k) => (k.kategori || "umum") === kategori)
      .map((k) => k.judul);

  const persyaratanUmum = ambil("persyaratan", "umum");
  const dokumenWajib = ambil("dokumen", "umum");
  const persyaratanMahasiswa = ambil("persyaratan", "mahasiswa");
  const persyaratanSiswa = ambil("persyaratan", "siswa");

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

        {(persyaratanMahasiswa.length > 0 || persyaratanSiswa.length > 0) && (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {persyaratanMahasiswa.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-medium/5 text-base">🎓</span>
                  Khusus Mahasiswa
                </h2>
                <div className="my-4 h-0.5 bg-slate-100" />
                <ul className="space-y-4">
                  {persyaratanMahasiswa.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-medium/10 text-[9px] font-extrabold text-brand-medium">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {persyaratanSiswa.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light/10 text-base">🏫</span>
                  Khusus Siswa SMA/SMK/MA
                </h2>
                <div className="my-4 h-0.5 bg-slate-100" />
                <ul className="space-y-4">
                  {persyaratanSiswa.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-light/10 text-[9px] font-extrabold text-brand-medium">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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