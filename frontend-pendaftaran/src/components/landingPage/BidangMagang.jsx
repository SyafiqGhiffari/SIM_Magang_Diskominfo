import { Link } from "react-router-dom";

const bidang = [
  {
    title: "Sekretariat",
    desc: "Manajemen administrasi perkantoran, persuratan digital, kearsipan elektronik, dan tata kelola internal instansi pemerintah.",
    icon: "📁",
    badge: "Administrasi",
  },
  {
    title: "Pengelolaan Informasi & Komunikasi Publik",
    desc: "Hubungan masyarakat (Humas), pengelolaan portal berita daerah, manajemen media sosial, desain grafis, videografi, dan layanan informasi publik (PPID).",
    icon: "📣",
    badge: "Humas & Kreatif",
  },
  {
    title: "Aplikasi & Informatika",
    desc: "Pengembangan software (web/mobile), pengelolaan database, integrasi sistem SPBE, keamanan jaringan, dan pemeliharaan server perkantoran.",
    icon: "💻",
    badge: "IT & Software",
  },
  {
    title: "Statistik & Persandian",
    desc: "Pengumpulan dan pengolahan data sektoral daerah, analisis visualisasi statistik sektoral, serta pengamanan informasi sandi pemerintahan.",
    icon: "📊",
    badge: "Data & Security",
  },
];

const BidangMagang = () => {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
          Spesialisasi Magang
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
          Bidang Magang Tersedia
        </h2>
        <p className="mt-4 max-w-md mx-auto text-sm text-slate-500">
          Pilih divisi/spesialisasi yang paling sesuai dengan minat, bakat, dan program studi Anda.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {bidang.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-8 text-left transition-all duration-300 hover:shadow-xl hover:shadow-brand-dark/5 hover:border-brand-light/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl group-hover:bg-brand-light/10 group-hover:scale-105 transition-all duration-300">
                    {item.icon}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-2xs font-bold text-slate-500 uppercase tracking-wider group-hover:bg-brand-medium/10 group-hover:text-brand-medium transition-colors">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-dark group-hover:text-brand-medium transition-colors">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
              <Link 
                to="/program-magang"
                className="mt-8 inline-flex items-center gap-1.5 text-xs font-bold text-brand-medium group-hover:text-brand-dark transition-colors cursor-pointer"
              >
                Selengkapnya <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BidangMagang;
