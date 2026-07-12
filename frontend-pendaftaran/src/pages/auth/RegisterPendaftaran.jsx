import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerPendaftaran } from "../../services/authPendaftaranService";

const RegisterPendaftaran = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    institusi: "",
    password: "",
    konfirmasi_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePassword = (password) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.konfirmasi_password) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("Password harus mengandung minimal satu huruf dan satu angka.");
      return;
    }

    setLoading(true);
    try {
      await registerPendaftaran(form);
      setSuccess("Registrasi berhasil! Mengalihkan ke halaman masuk...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Decorative background shapes for small screens */}
      <div className="absolute md:hidden -left-20 top-10 h-72 w-72 rounded-full bg-[#00A5EC]/10 blur-3xl" />
      <div className="absolute md:hidden -right-20 bottom-10 h-72 w-72 rounded-full bg-[#004F9F]/10 blur-3xl" />

      {/* LEFT PANEL: Split Screen Branding Info (Visible on MD screens and above) */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-12 text-white overflow-hidden">
        {/* Floating gradient circles */}
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#00A5EC]/15 blur-3xl animate-pulse-slow" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#004F9F]/20 blur-3xl animate-pulse-slow" />

        {/* Branding header */}
        <div className="z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-lg shadow-black/20 flex items-center justify-center animate-float">
            <img
              src="/images/icon-diskominfo.png"
              alt="Logo"
              className="h-10 w-10 object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight leading-none text-white">
              SIM MAGANG
            </h2>
            <span className="text-[9px] font-bold text-[#00A5EC] tracking-wider">
              DISKOMINFO PONOROGO
            </span>
          </div>
        </div>

        {/* Informational Center Content */}
        <div className="z-10 my-auto max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Buat Akun Magang Anda.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Daftarkan diri Anda untuk mengajukan pendaftaran magang secara
            online dan pantau langsung proses review berkas Anda secara berkala.
          </p>

          {/* Glowing mini stats card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A5EC]/20 text-[#00A5EC]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-6 h-6"
              >
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </span>
            <div>
              <h4 className="text-xs font-bold text-[#00A5EC] uppercase tracking-wider">
                Proses Mudah
              </h4>
              <p className="text-sm font-semibold text-white mt-0.5 font-sans">
                Isi biodata, pilih bidang, unggah surat pengantar, dan tunggu
                konfirmasi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo.
        </div>
      </div>

      {/* RIGHT PANEL: Register Form */}
      <div className="flex w-full md:w-1/2 flex-col justify-center px-6 py-12 lg:px-16 z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Back button */}
          <Link
            to="/pilih-pendaftaran"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-[#004F9F]/30 hover:bg-[#004F9F]/5 hover:text-[#004F9F] hover:-translate-x-0.5 transition-all duration-200 mb-8"
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
            Kembali
          </Link>

          {/* Form Header */}
          <div className="text-left mb-8">
            <div className="flex md:hidden items-center gap-3 mb-6">
              <img
                src="/images/icon-diskominfo.png"
                alt="Logo"
                className="h-10 w-10"
              />
              <div>
                <h2 className="text-sm font-black tracking-tight leading-none text-[#0B1442]">
                  SIM MAGANG
                </h2>
                <span className="text-[8px] font-bold text-[#004F9F] tracking-wider">
                  DISKOMINFO PONOROGO
                </span>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0B1442]">
              Registrasi Akun Baru
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Buat akun pendaftar magang Anda untuk mengakses fitur dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/30">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Nama Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Nama Lengkap
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="nama"
                    placeholder="Nama lengkap sesuai identitas"
                    value={form.nama}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Alamat Email
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">Masukkan alamat email aktif untuk menerima informasi pendaftaran.</p>
              </div>

              {/* Nomor HP Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.502-5.112-3.79-6.614-6.614l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                      />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    name="no_hp"
                    placeholder="Contoh: 081234567890"
                    value={form.no_hp}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Institusi Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Institusi
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="institusi"
                    placeholder="Masukkan asal sekolah atau universitas"
                    value={form.institusi}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-12 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                  
                  {/* Eye Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">Minimal 6 karakter, mengandung setidaknya satu huruf dan satu angka.</p>
              </div>

              {/* Konfirmasi Password Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Konfirmasi Password
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.75 3.75 0 0 1 21 12Z"
                      />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="konfirmasi_password"
                    placeholder="Ulangi password di atas"
                    value={form.konfirmasi_password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-12 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                  {/* Eye Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-dark/15 hover:from-[#101F5C] hover:to-[#004F9F] transition-all duration-300 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Mendaftar...
                  </span>
                ) : (
                  "Daftar Akun Baru"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-500">
              Sudah memiliki akun?{" "}
              <Link
                to="/login"
                className="font-extrabold text-[#004F9F] hover:text-[#00A5EC] transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPendaftaran;
