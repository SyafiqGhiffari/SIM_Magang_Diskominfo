import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { requestForgotPassword } from "../../services/authService";
import { Mail, ArrowLeft, ArrowRight, Loader2, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import AuthCardLoader from "../../components/manajemen/shared/auth/AuthCardLoader";

const ForgotPasswordPage = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await requestForgotPassword(email.trim());
      setSuccess(true);
      setSuccessMessage(
        res.data?.message ||
          "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam."
      );
      setCooldown(60); // 60 detik cooldown
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal memproses permintaan reset password. Silakan coba beberapa saat lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-screen h-[100dvh] w-full flex-col items-center justify-center bg-slate-100 overflow-hidden px-4 py-4 sm:py-6 select-none">
      {/* Background Image */}
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
            <img
              src="/images/icon-diskominfo.png"
              alt="Logo Diskominfo"
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">SIM Magang</h1>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/70">
            Sistem Manajemen Magang Diskominfo Ponorogo
          </p>
        </div>

        {/* Card Form */}
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-300/40 min-h-[340px] flex flex-col justify-center">
          {pageLoading ? (
            <AuthCardLoader message="Memuat Formulir Lupa Password..." />
          ) : (
            <div className="animate-[modalFadeUp_0.25s_ease-out]">
              <div className="mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0B1442]">
                  Lupa Password
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 sm:p-3 text-xs font-semibold text-red-600 shadow-sm animate-[modalFadeUp_0.2s_ease-out]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success State */}
              {success ? (
                <div className="space-y-4 animate-[modalFadeUp_0.3s_ease-out]">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-emerald-950">Email Terkirim!</h3>
                    <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                      {successMessage}
                    </p>
                    <div className="mt-3 rounded-xl bg-white/70 border border-emerald-200/60 p-2.5 text-[11px] font-medium text-emerald-900">
                      Alamat tujuan: <b className="font-bold">{email}</b>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={cooldown > 0 || loading}
                      onClick={handleSubmit}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all duration-200 hover:bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-slate-50 disabled:hover:border-slate-200 disabled:hover:shadow-xs cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:-rotate-90 group-active:-rotate-180"}`} />
                      {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : "Kirim Ulang Email"}
                    </button>

                    <Link
                      to="/login"
                      state={{ fromForgot: true }}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.8 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                      Kembali ke Halaman Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Alamat Email Terdaftar
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        required
                        autoFocus
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 sm:py-2.8 text-xs sm:text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.8 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim Tautan...
                      </>
                    ) : (
                      <>
                        Kirim Tautan Reset
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </>
                    )}
                  </button>

                  {/* Back to Login Link */}
                  <div className="pt-2 text-center">
                    <Link
                      to="/login"
                      state={{ fromForgot: true }}
                      className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#004F9F] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1.5" />
                      Kembali ke Halaman Login
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
