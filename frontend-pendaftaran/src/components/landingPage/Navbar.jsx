import { NavLink, Link } from "react-router-dom";
import { useState } from "react";

const navItems = [
  { label: "Beranda", to: "/" },
  { label: "Tentang", to: "/tentang" },
  { label: "Program Magang", to: "/program-magang" },
  { label: "Persyaratan", to: "/persyaratan" },
  { label: "FAQ", to: "/faq" },
  { label: "Kontak", to: "/kontak" },
];


const Navbar = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold tracking-wide transition-all duration-300 relative py-1.5 ${
      isActive
        ? "text-brand-medium border-b-2 border-brand-light"
        : "text-slate-600 hover:text-brand-dark hover:border-b-2 hover:border-slate-300"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md transition-shadow duration-300 hover:shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-4">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <img src="/images/icon-diskominfo.png" alt="Logo Kominfo" className="h-9 w-9" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-brand-dark leading-none">
              SIM MAGANG
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider">
              DISKOMINFO PONOROGO
            </span>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/pilih-pendaftaran"
            className="rounded-full bg-brand-dark px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-dark/10 transition-all duration-300 hover:bg-[#100b46] hover:shadow-lg hover:shadow-brand-dark/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            Daftar Magang
          </Link>
        </div>

        <button
          className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-slate-50"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-brand-dark transition-transform duration-300"
          >
            {open ? (
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-100 bg-white ${
          open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col gap-2 px-6 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block py-2 text-sm font-semibold tracking-wide transition-colors ${
                  isActive ? "text-brand-medium" : "text-slate-600"
                }`
              }
              end={item.to === "/"}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          <div className="flex flex-col gap-3 py-2">
            <Link
              to="/pilih-pendaftaran"
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-brand-dark py-2.5 text-center text-sm font-bold text-white shadow-md shadow-brand-dark/10 hover:bg-[#100b46] transition-colors"
            >
              Daftar Magang
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
