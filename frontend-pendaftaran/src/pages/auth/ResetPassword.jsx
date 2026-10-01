import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPasswordPendaftaran } from "../../services/authPendaftaranService";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, ShieldCheck, XCircle } from "lucide-react";

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

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;

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
    if (newPassword.length < 8) {
      setSubmitError("Kata sandi baru minimal harus 8 karakter.");
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
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-[#00A5EC] uppercase tracking-wider">
                Keamanan Akun
              </h4>
              <p className="text-sm font-semibold text-white mt-0.5">
                Gunakan kombinasi minimal 8 karakter dengan huruf besar, kecil, angka, dan simbol.
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
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
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
              Buat password baru yang kuat untuk akun SIM Magang Anda.
            </p>
          </div>

          {/* Form Card */}
          <div className="relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/30">
            {success ? (
              <div className="text-center py-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-[#0B1442] mb-1">Berhasil!</p>
                <p className="text-xs text-slate-500 leading-relaxed">{success}</p>
                <p className="text-[11px] text-slate-400 mt-3">Mengalihkan ke halaman masuk...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Password Baru Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Password Baru
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      required
                      disabled={!token}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-12 py-3 text-sm transition-all focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Indikator Kekuatan Password & Checklist Ketentuan */}
                  {newPassword && (
                    <div className="mt-2.5 space-y-2">
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

                {/* Konfirmasi Password Baru Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      required
                      disabled={!token}
                      className={`w-full rounded-xl border pl-11 pr-12 py-3 text-sm transition-all focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed ${
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
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Match Status */}
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold">
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

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !token || !newPassword || !confirmPassword || isMismatch || newPassword.length < 8}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-dark/15 hover:from-[#101F5C] hover:to-[#004F9F] transition-all duration-300 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Memproses...
                    </span>
                  ) : (
                    <>
                      Simpan Password Baru
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
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