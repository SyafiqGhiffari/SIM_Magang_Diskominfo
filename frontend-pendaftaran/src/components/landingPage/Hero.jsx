import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const slides = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80"
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-brand-dark px-6 py-24 text-white md:py-32">
      {/* Background Slides */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? "opacity-35" : "opacity-0"
              }`}
            style={{ backgroundImage: `url(${slide})` }}
          />
        ))}
        {/* Dark blue overlay to keep text fully readable */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1442]/95 via-[#1E3A8A]/90 to-[#5B8DEF]/85 mix-blend-multiply" />
      </div>

      {/* Decorative background shapes */}
      <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-2xl z-10" />
      <div className="absolute right-10 bottom-10 h-80 w-80 rounded-full bg-brand-light/10 blur-3xl z-10" />

      <div className="relative mx-auto max-w-6xl z-20">
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-light backdrop-blur-md">
              ⚡ Pendaftaran Magang
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Bangun Karier Digitalmu di <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">Diskominfo Ponorogo</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">
              Bergabunglah dalam transformasi digital menuju Sistem Pemerintahan Berbasis Elektronik (SPBE). Dapatkan pengalaman nyata melayani publik melalui teknologi informasi.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link
                to="/pilih-pendaftaran"
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg shadow-black/10 transition-all duration-300 hover:bg-slate-50 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Daftar Magang Sekarang
                <span className="text-brand-light font-bold" aria-hidden="true">→</span>
              </Link>
              <Link
                to="/program-magang"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/50"
              >
                Lihat Program
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;