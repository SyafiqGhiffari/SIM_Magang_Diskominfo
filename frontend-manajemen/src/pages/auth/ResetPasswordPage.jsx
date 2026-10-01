import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import { Lock, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import AuthCardLoader from "../../components/manajemen/shared/auth/AuthCardLoader";

const getPasswordStrength = (pwd) => {
  const len = (pwd || "").length;
  const hasMinLen = len >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasUpperLower = hasUpper && hasLower;
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  const criteriaMet = [hasMinLen, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (!pwd) {
    return {
      score: 0,
      percent: 0,
      label: "Belum Diisi",
      textColor: "text-slate-400",
      barColor: "bg-slate-200",
      activeBars: 0,
      hasMinLen: false,
      hasUpperLower: false,
      hasNumber: false,
      hasSpecial: false,
      len: 0,
    };
  }

  if (criteriaMet <= 1) {
    return {
      score: 1,
      percent: 25,
      label: "Sangat Lemah",
      textColor: "text-red-500",
      barColor: "bg-red-500",
      activeBars: 1,
      hasMinLen,
      hasUpperLower,
      hasNumber,
      hasSpecial,
      len,
    };
  }

  if (criteriaMet === 2) {
    return {
      score: 2,
      percent: 50,
      label: "Cukup",
      textColor: "text-amber-500",
      barColor: "bg-amber-500",
      activeBars: 2,
      hasMinLen,
      hasUpperLower,
      hasNumber,
      hasSpecial,
      len,
    };
  }

  if (criteriaMet === 3) {
    return {
      score: 3,
      percent: 75,
      label: "Kuat",
      textColor: "text-[#004F9F]",
      barColor: "bg-[#004F9F]",
      activeBars: 3,
      hasMinLen,
      hasUpperLower,
      hasNumber,
      hasSpecial,
      len,
    };
  }

  return {
    score: 4,
    percent: 100,
    label: "Sangat Kuat",
    textColor: "text-emerald-600",
    barColor: "bg-emerald-500",
    activeBars: 4,
    hasMinLen,
    hasUpperLower,
    hasNumber,
    hasSpecial,
    len,
  };
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Token reset password tidak ditemukan pada tautan.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Kata sandi baru minimal harus 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal mereset kata sandi. Token mungkin sudah kedaluwarsa atau tidak valid."
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
            <AuthCardLoader message="Memuat Formulir Kata Sandi..." />
          ) : !token ? (
            <div className="text-center space-y-4 py-3 animate-[modalFadeUp_0.25s_ease-out]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Tautan Tidak Valid</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Tautan reset password ini tidak memiliki token yang valid. Silakan minta tautan baru melalui halaman Lupa Password.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.8 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-90" />
                Minta Tautan Reset Baru
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center py-2 animate-[modalFadeUp_0.3s_ease-out]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Kata sandi akun Anda telah berhasil diatur ulang. Anda sekarang dapat masuk menggunakan kata sandi baru Anda.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login", { state: { fromForgot: true } })}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-[modalFadeUp_0.25s_ease-out]">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0B1442]">
                  Buat Kata Sandi Baru
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Silakan masukkan kata sandi baru yang kuat untuk mengamankan akun Anda.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 sm:p-3 text-xs font-semibold text-red-600 shadow-sm animate-[modalFadeUp_0.2s_ease-out]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Kata Sandi Baru
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-11 py-2.5 sm:py-2.8 text-xs sm:text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Indikator Kekuatan Password & Checklist Ketentuan */}
                {newPassword && (
                  <div className="mt-2.5 space-y-2 animate-[modalFadeUp_0.2s_ease-out]">
                    {/* Label & 4 Segment Bars */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500 text-[10.5px]">Tingkat Keamanan:</span>
                      <span className={`text-[11px] font-extrabold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            step <= strength.activeBars ? strength.barColor : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Checklist Kriteria Keamanan Password (2x2 Grid) */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            strength.hasMinLen ? "text-emerald-500" : "text-slate-300"
                          }`}
                        />
                        <span className={strength.hasMinLen ? "text-slate-800 font-bold" : "text-slate-500"}>
                          Minimal 8 karakter ({strength.len}/8)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            strength.hasUpperLower ? "text-emerald-500" : "text-slate-300"
                          }`}
                        />
                        <span className={strength.hasUpperLower ? "text-slate-800 font-bold" : "text-slate-500"}>
                          Huruf besar &amp; kecil (A-Z, a-z)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            strength.hasNumber ? "text-emerald-500" : "text-slate-300"
                          }`}
                        />
                        <span className={strength.hasNumber ? "text-slate-800 font-bold" : "text-slate-500"}>
                          Mengandung angka (0-9)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            strength.hasSpecial ? "text-emerald-500" : "text-slate-300"
                          }`}
                        />
                        <span className={strength.hasSpecial ? "text-slate-800 font-bold" : "text-slate-500"}>
                          Simbol khusus (!@#$%^&amp;*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    className={`w-full rounded-xl border pl-10 pr-11 py-2.5 sm:py-2.8 text-xs sm:text-sm transition-all focus:ring-2 focus:outline-none ${
                      isMismatch
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : isMatch
                        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200"
                        : "border-slate-200 focus:border-[#004F9F] focus:ring-[#00A5EC]/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Match Status */}
                {confirmPassword && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold animate-[modalFadeUp_0.2s_ease-out]">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kata sandi cocok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <XCircle className="w-3.5 h-3.5" /> Kata sandi belum cocok
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || isMismatch || newPassword.length < 8}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.8 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Kata Sandi...
                  </>
                ) : (
                  <>
                    Simpan Kata Sandi Baru
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  state={{ fromForgot: true }}
                  className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#004F9F] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1.5" />
                  Batal dan Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
