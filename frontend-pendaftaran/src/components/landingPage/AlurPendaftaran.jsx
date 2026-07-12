const steps = [
  {
    no: "01",
    title: "Registrasi Online",
    desc: "Buat akun baru dan lengkapi data profil pendaftar di portal kami.",
  },
  {
    no: "02",
    title: "Isi Formulir & Dokumen",
    desc: "Isi form pendaftaran magang dan unggah surat pengantar resmi (PDF).",
  },
  {
    no: "03",
    title: "Verifikasi Berkas",
    desc: "Tim administrasi memvalidasi dokumen dan kesesuaian kuota divisi.",
  },
  {
    no: "04",
    title: "Pengumuman Hasil",
    desc: "Status kelulusan dikirim via portal dan email resmi peserta.",
  },
];

const AlurPendaftaran = () => {
  return (
    <section className="px-6 py-20 bg-white relative overflow-hidden">
      {/* Background shape */}
      <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-brand-light/5 blur-3xl" />
      
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
          Langkah Pendaftaran
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
          Alur Proses Seleksi
        </h2>
        <p className="mt-4 max-w-md mx-auto text-sm text-slate-500">
          Ikuti empat tahapan berikut untuk bergabung dalam program magang Diskominfo Ponorogo.
        </p>

        <div className="relative mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line for large screens */}
          <div className="absolute left-16 right-16 top-6 hidden h-[2px] bg-gradient-to-r from-brand-dark via-brand-medium to-brand-light lg:block opacity-30" />
          
          {steps.map((step, idx) => (
            <div key={step.no} className="group relative flex flex-col items-center text-center">
              {/* Animated node */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-extrabold shadow-md transition-all duration-300 group-hover:scale-110 z-10 ${
                  idx === steps.length - 1
                    ? "border-brand-light bg-brand-light text-white shadow-brand-light/20"
                    : "border-brand-medium bg-white text-brand-medium shadow-brand-medium/5 group-hover:bg-brand-medium group-hover:text-white"
                }`}
              >
                {step.no}
              </div>
              <h3 className="mt-6 text-base font-bold text-brand-dark transition-colors group-hover:text-brand-medium">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-slate-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlurPendaftaran;