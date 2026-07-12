import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPasswordPendaftaran } from "../../services/authPendaftaranService";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const tokenError = !token
    ? "Token reset password tidak ditemukan. Pastikan Anda membuka tautan dari email dengan benar."
    : "";

  const error = tokenError || submitError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccess("");

    if (!token) {
      setSubmitError("Token tidak valid.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordPendaftaran({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(res.message || "Password berhasil diubah. Silakan masuk dengan password baru Anda.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Terjadi kesalahan. Tautan mungkin sudah kedaluwarsa."
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
            Amankan Kembali Akun Anda.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Buat password baru yang kuat untuk memastikan akun SIM Magang Anda
            tetap terlindungi dari akses yang tidak sah.
          </p>

          {/* Glowing mini stats card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00A5EC]/20 text-[#00A5EC]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </span>
            <div>
              <h4 className="text-xs font-bold text-[#00A5EC] uppercase tracking-wider">
                Keamanan Akun
              </h4>
              <p className="text-sm font-semibold text-white mt-0.5">
                Gunakan kombinasi huruf dan angka untuk password yang lebih kuat.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Dinas Komunikasi, Informatika dan
          Statistik Kabupaten Ponorogo.
        </div>
      </div>

      {/* RIGHT PANEL: Reset Password Form */}
      <div className="flex w-full md:w-1/2 flex-col justify-center px-6 py-12 lg:px-16 z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Back button */}
          <Link
            to="/login"
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
            Kembali Masuk Portal
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
              Atur Ulang Password
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Buat password baru untuk akun SIM Magang Anda.
            </p>
          </div>

          {/* Form Card */}
          <div className="relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/30">
            {success ? (
              <div className="text-center py-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#059669" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#0B1442] mb-1">Berhasil!</p>
                <p className="text-xs text-slate-500 leading-relaxed">{success}</p>
                <p className="text-[11px] text-slate-400 mt-3">Mengalihkan ke halaman masuk...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                {/* Password Baru Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Password Baru
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
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={!token}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-12 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password Baru Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Konfirmasi Password Baru
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
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={!token}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-12 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3.5 leading-relaxed">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span>Minimal 6 karakter, gunakan kombinasi huruf dan angka agar akun lebih aman.</span>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-dark/15 hover:from-[#101F5C] hover:to-[#004F9F] transition-all duration-300 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    "Simpan Password Baru"
                  )}
                </button>
              </form>
            )}

            {!success && (
              <p className="mt-8 text-center text-xs text-slate-500">
                Sudah ingat password Anda?{" "}
                <Link
                  to="/login"
                  className="font-extrabold text-[#004F9F] hover:text-[#00A5EC] transition-colors"
                >
                  Masuk di sini
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;