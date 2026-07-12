const AboutSection = () => {
  return (
    <section className="bg-slate-50 px-6 py-20 relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        {/* Left side: Premium illustration / Mock UI */}
        <div className="relative">
          <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-brand-light/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark to-brand-medium p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-2xs text-slate-300 tracking-wider uppercase font-semibold">Workspace Diskominfotik</span>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs font-bold text-brand-light">1. Pengembangan Software</h4>
                <p className="mt-1 text-2xs text-slate-300">Terlibat dalam pengembangan aplikasi e-government dan portal pelayanan publik Ponorogo.</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs font-bold text-brand-light">2. Hubungan Masyarakat & Media</h4>
                <p className="mt-1 text-2xs text-slate-300">Menyusun konten edukatif, informasi publik, liputan berita daerah, dan rilis pers.</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs font-bold text-brand-light">3. Pengolahan Data & Statistik</h4>
                <p className="mt-1 text-2xs text-slate-300">Analisis data statistik sektoral kabupaten untuk perencanaan pembangunan daerah.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Content */}
        <div className="text-left">
          <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
            Mengenal Kami
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
            Tentang Program Magang
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600">
            Program magang Diskominfo Ponorogo merupakan sarana pembelajaran dan pengenalan dunia kerja di lingkungan pemerintahan bagi mahasiswa dan siswa SMA/SMK/MA.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Kami memberikan ruang seluas-luasnya bagi talenta muda untuk berkontribusi dalam digitalisasi daerah, memahami tata kelola informasi publik, dan mengasah keterampilan teknis di bawah bimbingan tenaga ahli profesional.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;