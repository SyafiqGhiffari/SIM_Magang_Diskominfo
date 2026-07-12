import { Link } from "react-router-dom";

const PilihPendaftaran = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 py-12 text-slate-800 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#00A5EC]/10 blur-3xl animate-pulse-slow" />
      <div className="absolute right-10 bottom-10 h-[500px] w-[500px] rounded-full bg-[#004F9F]/15 blur-3xl animate-pulse-slow" />

      {/* Brand & Heading section */}
      <div className="z-10 text-center mb-10 max-w-lg">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-full px-4 py-2.5 mb-6 backdrop-blur-md shadow-lg shadow-black/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Beranda
        </Link>
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-3xl bg-white shadow-xl shadow-black/20 flex items-center justify-center animate-float">
            <img
              src="/images/icon-diskominfo.png"
              alt="Logo Kominfo"
              className="h-17 w-17 object-contain"
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Portal Pendaftaran Magang
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          Selamat datang di Sistem Informasi Magang Diskominfo Ponorogo. Silakan
          pilih opsi di bawah ini untuk memulai atau melanjutkan pendaftaran.
        </p>
      </div>

      {/* Grid Selection Cards */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-2">
        {/* Card Option 1: Login */}
        <Link
          to="/login"
          className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-white/95 p-6 md:p-8 shadow-2xl transition-all duration-300 hover:shadow-[#00A5EC]/10 hover:border-[#00A5EC]/40 hover:-translate-y-1 text-left"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004F9F]/10 text-[#004F9F] mb-6 group-hover:bg-[#004F9F] group-hover:text-white transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0B1442] group-hover:text-[#004F9F] transition-colors duration-300">
              Sudah Memiliki Akun
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Masuk untuk melanjutkan pendaftaran magang, mengunggah revisi
              dokumen, atau memantau status seleksi berkas Anda.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-[#004F9F] group-hover:gap-3 transition-all duration-300">
            Masuk ke Portal <span>→</span>
          </div>
        </Link>

        {/* Card Option 2: Register */}
        <Link
          to="/register"
          className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-white/95 p-6 md:p-8 shadow-2xl transition-all duration-300 hover:shadow-[#00A5EC]/10 hover:border-[#00A5EC]/40 hover:-translate-y-1 text-left"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A5EC]/10 text-[#00A5EC] mb-6 group-hover:bg-[#00A5EC] group-hover:text-white transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0B1442] group-hover:text-[#00A5EC] transition-colors duration-300">
              Belum Memiliki Akun
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Daftarkan akun baru Anda menggunakan email aktif untuk mendapatkan
              akses penuh ke portal pengajuan berkas magang.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-[#00A5EC] group-hover:gap-3 transition-all duration-300">
            Daftar Akun Baru <span>→</span>
          </div>
        </Link>
      </div>

      {/* Footer text */}
      <div className="z-10 mt-12 text-[10px] text-slate-400 tracking-wider">
        Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo
      </div>
    </div>
  );
};

export default PilihPendaftaran;
