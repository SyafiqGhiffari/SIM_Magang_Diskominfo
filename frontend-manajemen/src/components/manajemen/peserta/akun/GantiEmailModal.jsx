import { useRef, useState, useEffect } from "react";
import {
  Mail,
  ShieldCheck,
  X,
  Send,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const GantiEmailModal = ({
  dk,
  userEmail,
  showEmailModal,
  setShowEmailModal,
  emailStep,
  emailBaru,
  setEmailBaru,
  otpInput,
  setOtpInput,
  emailLoading,
  emailError,
  handleRequestOtpEmail,
  handleVerifikasiOtpEmail,
  handleBackToEmailInput,
  resendCooldown,
  handleResendOtp,
}) => {
  const otpRefs = useRef([]);
  const [isOpening, setIsOpening] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const prevShowRef = useRef(false);

  useEffect(() => {
    if (showEmailModal && !prevShowRef.current) {
      setIsOpening(true);
      setLoadingStage(0);
      setProgressPercent(0);

      const startProgressTimer = setTimeout(() => {
        setProgressPercent(100);
      }, 40);

      const stageTimer = setTimeout(() => {
        setLoadingStage(1);
      }, 1000);

      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 2000);

      prevShowRef.current = showEmailModal;
      return () => {
        clearTimeout(startProgressTimer);
        clearTimeout(stageTimer);
        clearTimeout(timer);
      };
    }
    prevShowRef.current = showEmailModal;
  }, [showEmailModal]);

  if (!showEmailModal) return null;

  const otpDigits = otpInput
    .split("")
    .concat(Array(6 - otpInput.length).fill(""));

  const handleOtpBoxChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = otpDigits.slice();
    newOtp[index] = digit;
    setOtpInput(newOtp.join("").trim());

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    setOtpInput(pasted);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (lastIndex >= 0) otpRefs.current[lastIndex]?.focus();
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs sm:backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      style={{ margin: 0 }}
      onClick={() => setShowEmailModal(false)}
    >
      <div
        className={`relative ${
          isOpening
            ? "max-w-[310px] sm:max-w-md"
            : "max-w-[350px] sm:max-w-xl md:max-w-2xl"
        } w-full rounded-xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 my-auto ${
          dk
            ? "bg-[#161b22] border-white/10 text-slate-100"
            : "bg-white border-slate-200/90 text-slate-800"
        } animate-[fadeIn_0.2s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpening ? (
          /* ===== ANIMASI LOADING KETIKA MEMBUKA MODAL ===== */
          <div className="p-4 sm:p-8 flex flex-col items-center justify-center text-center animate-[fadeIn_0.2s_ease-out]">
            <div className="relative h-10 w-10 sm:h-16 sm:w-16 mb-2.5 sm:mb-4 flex items-center justify-center">
              {/* Pulse glow ring */}
              <div className="absolute inset-0 rounded-full bg-[#00A5EC]/20 blur-md animate-pulse" />
              {/* Outer static border */}
              <div
                className={`absolute inset-0 rounded-full border-2 sm:border-3 ${
                  dk ? "border-white/10" : "border-slate-100"
                }`}
              />
              {/* Spinning gradient border */}
              <div className="absolute inset-0 rounded-full border-2 sm:border-3 border-transparent border-t-[#00A5EC] border-r-[#004F9F] animate-spin" />
              {/* Center icon */}
              <div className="relative flex items-center justify-center text-[#004F9F] dark:text-[#00A5EC]">
                <Mail className="w-4.5 h-4.5 sm:w-7 sm:h-7 animate-pulse" />
              </div>
            </div>

            <h4 className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight transition-all duration-300">
              {loadingStage === 0
                ? "Menyiapkan Formulir..."
                : "Memeriksa Status Akun..."}
            </h4>
            <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 max-w-xs leading-relaxed transition-all duration-300">
              {loadingStage === 0
                ? "Memuat data email dan konfigurasi keamanan akun Anda"
                : "Menghubungkan ke layanan verifikasi OTP email"}
            </p>

            {/* Smooth Progress Track */}
            <div className="mt-3 sm:mt-4 w-32 sm:w-52 h-1 sm:h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#004F9F] via-[#00A5EC] to-sky-400 rounded-full transition-all duration-[1850ms] ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Header dengan gradient + step indicator */}
            <div className="relative px-3 py-2 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] overflow-hidden">
              {/* Ambient Glows */}
              <div className="absolute -right-8 -top-8 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -left-6 -bottom-10 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

              {/* Watermark Icon - Di Sebelah Button Silang */}
              {emailStep === "input" ? (
                <Mail
                  className="pointer-events-none absolute right-7 top-0.5 sm:right-13 sm:-top-2 w-12 h-12 sm:w-20 sm:h-24 text-white opacity-[0.08] sm:opacity-[0.10] rotate-12 transition-all duration-300"
                  strokeWidth={1.2}
                />
              ) : (
                <KeyRound
                  className="pointer-events-none absolute right-7 top-0.5 sm:right-13 sm:-top-2 w-12 h-12 sm:w-20 sm:h-24 text-white opacity-[0.08] sm:opacity-[0.10] rotate-12 transition-all duration-300"
                  strokeWidth={1.2}
                />
              )}

              <div className="relative flex items-center justify-between mb-1.5 sm:mb-2.5 z-10">
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-xl bg-white/15 text-white shadow-2xs shrink-0">
                    {emailStep === "input" ? (
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <KeyRound className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-sm font-extrabold text-white leading-tight truncate">
                      {emailStep === "input"
                        ? "Ganti Email Pribadi"
                        : "Verifikasi Kode OTP"}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] text-white/70 mt-0.5 leading-tight truncate">
                      {emailStep === "input"
                        ? "Langkah 1 dari 2: Masukkan Email Baru"
                        : "Langkah 2 dari 2: Konfirmasi Kode OTP"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="group relative h-5.5 w-5.5 sm:h-7.5 sm:w-7.5 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                </button>
              </div>

              <div className="relative flex items-center gap-1 sm:gap-2 z-10">
                <div
                  className={`h-0.5 sm:h-1 flex-1 rounded-full transition-colors duration-300 ${
                    emailStep === "input" || emailStep === "otp"
                      ? "bg-[#00A5EC]"
                      : "bg-white/20"
                  }`}
                />
                <div
                  className={`h-0.5 sm:h-1 flex-1 rounded-full transition-colors duration-300 ${
                    emailStep === "otp" ? "bg-[#00A5EC]" : "bg-white/20"
                  }`}
                />
              </div>
            </div>

            {/* STEP 1: Input email baru + Info Cards */}
            {emailStep === "input" && (
              <form
                onSubmit={handleRequestOtpEmail}
                className="p-2.5 sm:p-5 animate-[fadeIn_0.25s_ease-out] max-h-[85vh] overflow-y-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-5">
                  {/* Kolom Kiri: Form Input */}
                  <div className="md:col-span-7 space-y-2 sm:space-y-3">
                    <p className="text-[9.5px] sm:text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Ubah alamat <strong>email kontak pribadi</strong> peserta untuk
                      korespondensi kegiatan magang dan pengiriman notifikasi.
                    </p>

                    <div className="space-y-2 sm:space-y-2.5">
                      <div>
                        <label className="text-[9px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
                          Email Pribadi Saat Ini
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-slate-400 pointer-events-none">
                            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          </span>
                          <input
                            type="email"
                            value={userEmail || ""}
                            disabled
                            className={`w-full rounded-md sm:rounded-xl border pl-7 sm:pl-9 pr-14 sm:pr-20 py-1 sm:py-2 text-[10px] sm:text-xs cursor-not-allowed focus:outline-none ${
                              dk
                                ? "bg-white/5 border-white/10 text-slate-400"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}
                          />
                          <span className="absolute inset-y-0 right-1.5 sm:right-2.5 flex items-center text-[7.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                            Aktif
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
                          Email Pribadi Baru
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-slate-400 pointer-events-none">
                            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          </span>
                          <input
                            type="email"
                            value={emailBaru}
                            onChange={(e) => setEmailBaru(e.target.value)}
                            required
                            placeholder="contoh@email.com"
                            className={`w-full rounded-md sm:rounded-xl border pl-7 sm:pl-9 pr-2.5 py-1 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${
                              dk
                                ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]"
                                : "bg-white border-slate-200 text-slate-900 focus:border-[#004F9F]"
                            }`}
                          />
                        </div>
                        <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10.5px] text-blue-600 dark:text-sky-400 font-medium">
                          Pastikan email aktif untuk menerima kode verifikasi OTP.
                        </p>
                      </div>

                      {emailError && (
                        <div
                          className={`flex items-center gap-1.5 rounded-md sm:rounded-xl border p-1.5 sm:p-2.5 text-[9.5px] sm:text-xs font-semibold ${
                            dk
                              ? "bg-red-500/10 border-red-400/20 text-red-400"
                              : "bg-red-50 border-red-200 text-red-600"
                          }`}
                        >
                          <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-red-500" />
                          <span>{emailError}</span>
                        </div>
                      )}

                      <div className="flex gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1">
                        <button
                          type="button"
                          onClick={() => setShowEmailModal(false)}
                          className={`flex-1 rounded-md sm:rounded-xl border px-2.5 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                            dk
                              ? "border-white/10 text-slate-300 hover:bg-white/5"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={emailLoading}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-md sm:rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] px-2.5 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-md shadow-[#004F9F]/20 dark:shadow-sky-950/40 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                        >
                          {emailLoading ? (
                            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                          ) : (
                            <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          <span>{emailLoading ? "Mengirim..." : "Kirim Kode OTP"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Card Info (Informasi Penting & Keamanan Akun) */}
                  <div className="md:col-span-5 space-y-2 sm:space-y-3">
                    {/* Card 1: Informasi Penting */}
                    <div
                      className={`rounded-lg sm:rounded-2xl p-2 sm:p-3.5 border ${
                        dk
                          ? "bg-blue-500/10 border-blue-500/20 text-slate-200"
                          : "bg-blue-50/80 border-blue-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 dark:text-sky-400 shrink-0" />
                        <h4 className="text-[9.5px] sm:text-xs font-extrabold text-blue-900 dark:text-sky-300">
                          Informasi Penting
                        </h4>
                      </div>
                      <ul className="space-y-1 sm:space-y-1.5 text-[8px] sm:text-[10.5px] leading-tight sm:leading-relaxed">
                        <li className="flex items-start gap-1 sm:gap-1.5">
                          <span className="shrink-0 mt-0.5 sm:mt-1 h-1 w-1 rounded-full bg-blue-500 dark:bg-sky-400" />
                          <span>
                            Email baru digunakan untuk kontak pribadi & korespondensi magang.
                          </span>
                        </li>
                        <li className="flex items-start gap-1 sm:gap-1.5">
                          <span className="shrink-0 mt-0.5 sm:mt-1 h-1 w-1 rounded-full bg-blue-500 dark:bg-sky-400" />
                          <span>
                            Tidak memengaruhi email / username akun login portal SIM Magang.
                          </span>
                        </li>
                        <li className="flex items-start gap-1 sm:gap-1.5">
                          <span className="shrink-0 mt-0.5 sm:mt-1 h-1 w-1 rounded-full bg-blue-500 dark:bg-sky-400" />
                          <span>
                            Jika tidak menerima kode OTP dalam 5 menit, silakan kirim ulang kode.
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Card 2: Keamanan Akun */}
                    <div
                      className={`rounded-lg sm:rounded-2xl p-2 sm:p-3.5 border ${
                        dk
                          ? "bg-emerald-500/10 border-emerald-500/20 text-slate-200"
                          : "bg-emerald-50/80 border-emerald-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <h4 className="text-[9.5px] sm:text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                          Keamanan Akun
                        </h4>
                      </div>
                      <p className="text-[8px] sm:text-[10.5px] leading-tight sm:leading-relaxed text-slate-600 dark:text-slate-300">
                        Setiap pembaruan email diverifikasi melalui kode OTP demi mencegah kekeliruan dan menjaga validitas data peserta.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: Verifikasi OTP */}
            {emailStep === "otp" && (
              <form
                onSubmit={handleVerifikasiOtpEmail}
                className="p-2.5 sm:p-5 max-w-xs sm:max-w-sm mx-auto space-y-2 sm:space-y-3 animate-[fadeIn_0.25s_ease-out]"
              >
                <div className="flex flex-col items-center py-0.5 sm:py-1 text-center">
                  <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-sky-800/40">
                    <Mail className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Verifikasi Email Baru
                  </h3>
                  <p className="text-[9.5px] sm:text-xs leading-relaxed mt-0.5 text-slate-500 dark:text-slate-400">
                    Masukkan 6 digit kode OTP yang dikirim ke:
                  </p>
                  <p className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-blue-600 dark:text-sky-400 break-all">
                    {emailBaru}
                  </p>
                </div>

                {/* Kotak OTP */}
                <div
                  className="flex justify-center gap-1 sm:gap-2 my-1.5 sm:my-3"
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`h-8 w-7 sm:h-11 sm:w-10 rounded-md sm:rounded-xl border text-center text-xs sm:text-base font-extrabold transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${
                        dk
                          ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]"
                          : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1 text-[9.5px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || emailLoading}
                    className={`font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      resendCooldown > 0
                        ? "text-slate-400"
                        : "text-[#004F9F] dark:text-sky-400 hover:underline"
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Kirim Ulang Kode (${resendCooldown}s)`
                      : "Kirim Ulang Kode OTP"}
                  </button>
                </div>

                {emailError && (
                  <div
                    className={`flex items-center gap-1.5 rounded-md sm:rounded-xl border p-1.5 sm:p-2.5 text-[9.5px] sm:text-xs font-semibold ${
                      dk
                        ? "bg-red-500/10 border-red-400/20 text-red-400"
                        : "bg-red-50 border-red-200 text-red-600"
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-red-500" />
                    <span>{emailError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailLoading || otpInput.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-md sm:rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] px-2.5 py-1.5 sm:py-2.5 text-[10.5px] sm:text-sm font-bold text-white shadow-md shadow-[#004F9F]/20 dark:shadow-sky-950/40 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                >
                  {emailLoading ? (
                    <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                  {emailLoading ? "Memverifikasi..." : "Verifikasi & Simpan"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmailInput}
                  className={`group w-full flex items-center justify-center gap-1 rounded-md sm:rounded-xl border px-2.5 py-1 sm:py-1.5 text-[9.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                    dk
                      ? "border-transparent text-slate-400 hover:text-[#00A5EC]"
                      : "border-transparent text-slate-500 hover:text-[#004F9F]"
                  }`}
                >
                  <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  Kembali ke Email
                </button>

                <div
                  className={`pt-1.5 sm:pt-2.5 border-t flex items-start gap-1 sm:gap-1.5 ${
                    dk ? "border-white/10" : "border-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <p className="text-[8px] sm:text-[10px] leading-tight sm:leading-relaxed text-slate-400 text-left">
                    Kode OTP berlaku selama 10 menit. Pastikan mengecek folder kotak
                    masuk atau spam pada email Anda.
                  </p>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GantiEmailModal;
