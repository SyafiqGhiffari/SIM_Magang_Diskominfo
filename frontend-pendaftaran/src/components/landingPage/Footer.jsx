import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#070b24] text-slate-300 border-t border-slate-800/60">
      {/* Decorative background glowing blobs */}
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[#00A5EC]/5 blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-[#004F9F]/5 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 text-left">
          
          {/* Column 1: Brand and Socials */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/images/icon-diskominfo.png" 
                alt="Logo Diskominfo" 
                className="h-12 w-12 drop-shadow-md" 
              />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  SIM MAGANG
                </span>
                <span className="text-[10px] font-extrabold text-[#00A5EC] tracking-widest mt-1">
                  DISKOMINFO PONOROGO
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Mencetak talenta digital masa depan pemerintahan yang kompeten melalui program magang berkualitas di Kabupaten Ponorogo.
            </p>
            {/* Social media icons */}
            <div className="flex items-center gap-3.5 pt-2">
              <a 
                href="https://www.instagram.com/kabponorogo" 
                target="_blank" 
                rel="noreferrer" 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-[#00A5EC] hover:border-[#00A5EC] transition-all duration-300 shadow-md hover:-translate-y-1"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@ponorogokab" 
                target="_blank" 
                rel="noreferrer" 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-md hover:-translate-y-1"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a 
                href="https://kominfo.ponorogo.go.id" 
                target="_blank" 
                rel="noreferrer" 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-[#004F9F] hover:border-[#004F9F] transition-all duration-300 shadow-md hover:-translate-y-1"
                aria-label="Website"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.905 0-5.64-.5-8.157-1.418m16.314 0C19.645 11.725 16 12 12 12c-4 0-7.645-.275-9.843-.836m19.686 0A11.963 11.963 0 0 1 12 15.75c-2.905 0-5.64-.5-8.157-1.418M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Tautan Halaman */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white relative pb-3 border-b border-white/5">
              Tautan Navigasi
            </h3>
            <ul className="mt-5 space-y-2.5 text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-[#00A5EC] hover:pl-1 transition-all duration-200 block">
                  Beranda Portal
                </Link>
              </li>
              <li>
                <Link to="/tentang" className="text-slate-400 hover:text-[#00A5EC] hover:pl-1 transition-all duration-200 block">
                  Tentang Program
                </Link>
              </li>
              <li>
                <Link to="/program-magang" className="text-slate-400 hover:text-[#00A5EC] hover:pl-1 transition-all duration-200 block">
                  Pilihan Bidang Magang
                </Link>
              </li>
              <li>
                <Link to="/persyaratan" className="text-slate-400 hover:text-[#00A5EC] hover:pl-1 transition-all duration-200 block">
                  Ketentuan & Syarat
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-[#00A5EC] hover:pl-1 transition-all duration-200 block">
                  Pertanyaan Populer (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Kontak & Info */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white relative pb-3 border-b border-white/5">
              Hubungi Kami
            </h3>
            <ul className="mt-5 space-y-3.5 text-xs">
              <li className="flex items-start gap-3">
                <span className="text-[#00A5EC] text-sm">✉</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Email Dinas</span>
                  <a href="mailto:diskominfo@ponorogo.go.id" className="text-slate-400 hover:text-[#00A5EC] transition-colors mt-0.5">
                    diskominfo@ponorogo.go.id
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00A5EC] text-sm">📞</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Telepon Kantor</span>
                  <span className="text-slate-400 mt-0.5">(0352) 481845</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00A5EC] text-sm">🕒</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Jam Pelayanan</span>
                  <span className="text-slate-400 mt-0.5">Senin - Jumat | 07:30 - 16:00 WIB</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Lokasi */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white relative pb-3 border-b border-white/5">
              Alamat Kantor
            </h3>
            <div className="mt-5 space-y-3.5 text-xs text-slate-400 leading-relaxed">
              <p>
                Gedung Graha Krida Praja Lt. 4, Jl. Aloon-Aloon Utara No. 4, Mangkujayan, Kec. Ponorogo, Kabupaten Ponorogo, Jawa Timur 63413
              </p>
              <a 
                href="https://maps.google.com/?q=Graha+Krida+Praja+Ponorogo" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 font-bold hover:bg-white/10 hover:border-white/20 transition-all text-[11px] text-white"
              >
                📍 Buka Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo. Hak Cipta Dilindungi.
          </div>
          <div className="flex gap-4 items-center">
            <a 
              href="https://ponorogo.go.id" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-slate-350 transition-colors"
            >
              Website Ponorogo
            </a>
            <span className="text-slate-800">•</span>
            <a 
              href="https://kominfo.ponorogo.go.id" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-slate-350 transition-colors"
            >
              Diskominfo
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;