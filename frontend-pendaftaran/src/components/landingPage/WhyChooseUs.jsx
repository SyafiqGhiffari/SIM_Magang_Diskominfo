const benefits = [
  {
    title: "Sertifikat Resmi",
    desc: "Sebagai bukti kompetensi dan pengalaman berharga untuk portofolio karier Anda.",
    icon: "🎓",
  },
  {
    title: "Pengalaman Proyek",
    desc: "Keterlibatan langsung dalam proyek strategis digitalisasi pemerintah daerah.",
    icon: "🚀",
  },
  {
    title: "Bimbingan Mentor",
    desc: "Didampingi oleh mentor profesional ahli di setiap bidang spesialisasi.",
    icon: "🤝",
  },
  {
    title: "Penilaian Kinerja",
    desc: "Evaluasi obyektif untuk membantu merefleksikan kompetensi magang Anda.",
    icon: "📈",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
          Benefit Program
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
          Mengapa Memilih Program Ini?
        </h2>
        <p className="mt-4 max-w-lg mx-auto text-sm text-slate-500">
          Dapatkan berbagai manfaat bernilai tambah selama bergabung menjadi bagian dari kami.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-8 text-left transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-brand-dark/5 hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 h-1 w-0 bg-brand-light rounded-t-2xl transition-all duration-300 group-hover:w-full" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>
              <h3 className="mt-6 text-base font-bold text-brand-dark">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;