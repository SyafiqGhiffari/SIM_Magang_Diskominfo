import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginAdmin } from "../../services/authService";
import { saveAuthData, saveRememberedEmail, getRememberedEmail, clearRememberedEmail } from "../../utils/authStorage";
import { Lock, Mail, Loader2, Eye, EyeOff, AlertTriangle, ArrowRight } from "lucide-react";
import AuthCardLoader from "../../components/manajemen/shared/auth/AuthCardLoader";

const roleHomePath = {
  admin: "/admin",
  mentor: "/mentor",
  peserta: "/peserta",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromForgot = Boolean(location.state?.fromForgot);

  const [pageLoading, setPageLoading] = useState(isFromForgot);
  const [email, setEmail] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedEmail()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleError, setVisibleError] = useState(false);

  // Tampilkan animasi pemuatan hanya saat datang dari halaman lupa password / reset password
  useEffect(() => {
    if (!isFromForgot) return;
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [isFromForgot]);

  // Otomatis menghilangkan badge eror secara halus (fade-out & collapse) setelah 4.5 detik
  useEffect(() => {
    if (!error || !visibleError) return;

    const fadeTimer = setTimeout(() => {
      setVisibleError(false);
    }, 4500);

    const clearTimer = setTimeout(() => {
      setError("");
    }, 4900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [error, visibleError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVisibleError(false);
    setLoading(true);

    try {
      const res = await loginAdmin(email, password);
      const payload = res.data.data; // { token, user: { id, nama, email, role, status_akun } }

      saveAuthData({
        token: payload.token,
        role: payload.user.role,
        user: payload.user,
        rememberMe,
      });

      // ==== PERUBAHAN: simpan/hapus email yang diingat sesuai centang "Ingat Saya" ====
      if (rememberMe) {
        saveRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }
      // ==== AKHIR PERUBAHAN ====

      navigate(roleHomePath[payload.user.role] || "/login");
    } catch (err) {
      setError(err.response?.data?.message || "Email atau password salah. Silakan coba lagi.");
      setVisibleError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex h-screen h-[100dvh] w-full flex-col items-center justify-center bg-slate-100 overflow-hidden px-4 py-4 sm:py-6">
      {/* Background image + overlay */}
      <img
        src="/images/gedung-kominfo.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1442]/90 via-[#0B1442]/85 to-[#004F9F]/80" />

      {/* Content wrapper */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center my-auto">
        {/* Logo & Judul */}
        <div className="mb-4 sm:mb-5 flex flex-col items-center text-center">
          <div className="mb-2.5 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-xl shadow-slate-300/50 animate-float">
            <img src="/images/icon-diskominfo.png" alt="Logo Diskominfo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">SIM Magang</h1>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/70">
            Sistem Manajemen Magang Diskominfo Ponorogo
          </p>
        </div>

        {/* Card Login */}
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-300/40 min-h-[340px] flex flex-col justify-center">
          {pageLoading ? (
            <AuthCardLoader message="Memuat Formulir Masuk..." />
          ) : (
            <div className="animate-[modalFadeUp_0.25s_ease-out]">
              <div className="mb-4 sm:mb-4.5">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0B1442]">Masuk ke Akun</h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Silakan masuk menggunakan email dan kata sandi akun Anda.
                </p>
              </div>

              {/* Error Banner dengan animasi expand/collapse + fade-out yang sangat halus */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  visibleError && error
                    ? "grid-rows-[1fr] opacity-100 mb-4 transform translate-y-0"
                    : "grid-rows-[0fr] opacity-0 mb-0 transform -translate-y-1.5 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 sm:p-3 text-xs font-semibold text-red-600 shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5">
                {/* Email */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Alamat Email
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="user@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (visibleError) setVisibleError(false);
                      }}
                      required
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 sm:py-2.8 text-xs sm:text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (visibleError) setVisibleError(false);
                      }}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-11 py-2.5 sm:py-2.8 text-xs sm:text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Ingat Saya & Lupa Password */}
                <div className="flex items-center justify-between gap-2">
                  <label className="group flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`relative flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        rememberMe
                          ? "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F]"
                          : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth={3}
                        className={`h-2.5 w-2.5 transition-transform duration-200 ${rememberMe ? "scale-100" : "scale-0"}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    <span className="transition-colors duration-200 group-hover:text-[#004F9F]">Ingat Saya</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#004F9F] hover:text-[#00A5EC] hover:underline transition-colors"
                  >
                    Lupa Password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.8 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk ke Sistem
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LoginPage;