const TentangPage = () => {
  return (
    <section className="min-h-[75vh] bg-slate-50">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#1E3A8A] to-[#5B8DEF] px-6 py-16 text-center text-white">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-5 right-10 h-48 w-48 rounded-full bg-[#5B8DEF]/15 blur-2xl" />
        <h1 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">
          Tentang Program Magang
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl text-xs text-slate-200">
          Mengenal visi, misi, serta profil program magang kerja di Dinas Komunikasi,
          Informatika dan Statistik Kabupaten Ponorogo.
        </p>
      </div>

      {/* Profil Instansi */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:grid-cols-12 md:p-10">
          <div className="relative overflow-hidden rounded-xl border border-slate-100 shadow-sm md:col-span-4">
            <img
              src="/images/kantor-diskominfo.jpg"
              alt="Kantor Diskominfo Ponorogo"
              className="min-h-[220px] w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden min-h-[220px] flex-col items-center justify-center bg-gradient-to-br from-[#0B1442] via-[#1E3A8A] to-[#5B8DEF] p-8 text-center text-white">
              <span className="mb-2 text-4xl">🏛️</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Diskominfotik Ponorogo
              </span>
            </div>
          </div>
          <div className="text-left md:col-span-8">
            <span className="inline-block rounded-md bg-[#5B8DEF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              Profil Instansi
            </span>
            <h2 className="mt-4 text-2xl font-extrabold text-[#0B1442] md:text-3xl">
              Dinas Komunikasi, Informatika dan Statistik Ponorogo
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 md:text-base">
              Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo
              (Diskominfotik) adalah unsur pelaksana urusan pemerintahan bidang
              komunikasi, informatika, statistik sektoral, dan persandian tingkat
              daerah. Kami berkomitmen menyelenggarakan keterbukaan informasi publik,
              koordinasi data daerah, serta pengelolaan Sistem Pemerintahan Berbasis
              Elektronik (SPBE) yang andal menuju Ponorogo Smart City.
            </p>
          </div>
        </div>

        {/* Visi & Misi */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Visi */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div>
              <span className="inline-block rounded-md bg-[#1E3A8A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                Visi Instansi
              </span>
              <h3 className="mt-4 text-xl font-bold text-[#0B1442]">Visi Diskominfotik</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                &ldquo;Terwujudnya tata kelola pemerintahan yang responsif dan
                transparan melalui pemanfaatan sistem komunikasi dan teknologi
                informasi yang merata di Kabupaten Ponorogo.&rdquo;
              </p>
            </div>
            <div className="mt-6 text-3xl">👁️‍🗨️</div>
          </div>

          {/* Misi */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <span className="inline-block rounded-md bg-[#1E3A8A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              Misi Instansi
            </span>
            <h3 className="mt-4 text-xl font-bold text-[#0B1442]">Misi Diskominfotik</h3>
            <ul className="mt-4 space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#5B8DEF]" />
                <span>
                  Membangun infrastruktur jaringan internet dan digitalisasi yang
                  terintegrasi di seluruh pelosok daerah.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#5B8DEF]" />
                <span>
                  Mendorong akuntabilitas SPBE guna efisiensi pelayanan administrasi
                  publik terpadu.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#5B8DEF]" />
                <span>
                  Mengoptimalkan penyebaran berita positif, edukasi publik, dan
                  pengelolaan aduan warga.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tujuan Program Magang */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-12">
          <span className="inline-block rounded-md bg-[#5B8DEF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
            Tujuan Program
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-[#0B1442] md:text-3xl">
            Tujuan Program Magang SIM Magang
          </h2>
          <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 transition-colors duration-300 hover:border-[#5B8DEF]/30">
              <span className="text-2xl">🌱</span>
              <h4 className="mt-4 text-sm font-bold text-[#0B1442]">
                Pengembangan Kompetensi
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Membantu peserta menyelaraskan teori akademis dengan praktik kerja
                nyata di instansi pemerintah.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 transition-colors duration-300 hover:border-[#5B8DEF]/30">
              <span className="text-2xl">🤝</span>
              <h4 className="mt-4 text-sm font-bold text-[#0B1442]">
                Kolaborasi Profesional
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Membangun budaya kolaborasi antarsiswa/mahasiswa dengan mentor ahli
                bimbingan Diskominfotik.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 transition-colors duration-300 hover:border-[#5B8DEF]/30">
              <span className="text-2xl">💡</span>
              <h4 className="mt-4 text-sm font-bold text-[#0B1442]">
                Transformasi SPBE
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Melibatkan talenta muda secara aktif dalam memecahkan masalah IT,
                data, serta kehumasan pemda.
              </p>
            </div>
          </div>
        </div>

        {/* Keunggulan Program */}
        <div className="mt-12 rounded-2xl border border-[#5B8DEF]/20 bg-[#5B8DEF]/5 p-8 text-left md:p-12">
          <span className="inline-block rounded-md bg-[#5B8DEF]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0B1442]">
            Keunggulan Program
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-[#0B1442] md:text-3xl">
            Keunggulan Program Magang Diskominfo
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-xl">🏆</div>
              <h4 className="mt-3 text-xs font-bold text-[#0B1442]">
                Sertifikat Resmi
              </h4>
              <p className="mt-1 text-[8px] text-slate-400">
                Diterbitkan instansi pemerintah resmi sebagai bukti kredibilitas
                portofolio.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-xl">🧑‍🏫</div>
              <h4 className="mt-3 text-xs font-bold text-[#0B1442]">
                Mentor Berpengalaman
              </h4>
              <p className="mt-1 text-[8px] text-slate-400">
                Pendampingan penuh oleh pranata komputer, humas, dan statistisi ahli.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-xl">💻</div>
              <h4 className="mt-3 text-xs font-bold text-[#0B1442]">
                Proyek Nyata SPBE
              </h4>
              <p className="mt-1 text-[8px] text-slate-400">
                Keterlibatan langsung mengelola kode aplikasi, infografis, dan data
                riil.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-xl">🏛️</div>
              <h4 className="mt-3 text-xs font-bold text-[#0B1442]">
                Link Kerja Pemerintah
              </h4>
              <p className="mt-1 text-[8px] text-slate-400">
                Memahami alur kerja birokrasi pemerintahan berbasis digital sejak
                dini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TentangPage;