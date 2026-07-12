import { useRef, useState, useEffect } from "react";

const GantiEmailModal = ({
  dk,
  sub,
  muted,
  txt,
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
  const [isOpening, setIsOpening] = useState(showEmailModal);
  const prevShowRef = useRef(showEmailModal);

  useEffect(() => {
    if (showEmailModal && !prevShowRef.current) {
      setIsOpening(true);
      const timer = setTimeout(() => setIsOpening(false), 1200);
      prevShowRef.current = showEmailModal;
      return () => clearTimeout(timer);
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
      className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-6"
      style={{ margin: 0 }}
      onClick={() => setShowEmailModal(false)}
    >
      <div
        className={`relative max-w-2xl w-full rounded-3xl border shadow-2xl overflow-hidden transition-all duration-[2000ms] ${
          isOpening ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-[fadeIn_0.2s_ease-out]"
        } ${dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpening ? (
          /* ===== LOADING STATE ===== */
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="relative h-14 w-14 mb-5">
              <div
                className={`absolute inset-0 rounded-full border-4 ${dk ? "border-white/10" : "border-slate-100"}`}
              />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00A5EC] border-r-[#00A5EC] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={dk ? "#00A5EC" : "#004F9F"}
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </div>
            </div>
            <p className={`text-xs font-bold ${txt}`}>Menyiapkan formulir...</p>
            <p className={`text-[11px] mt-1 ${muted}`}>Mohon tunggu sebentar</p>
          </div>
        ) : (
          <>
            {/* Header dengan gradient + step indicator */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-[#0B1442] via-[#141F5C] to-[#1E3A8A] overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -left-6 -bottom-10 h-20 w-20 rounded-full bg-[#00A5EC]/20 blur-xl" />

              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    {emailStep === "input" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="white"
                        className="w-4.5 h-4.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="white"
                        className="w-4.5 h-4.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    )}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white leading-tight">
                      {emailStep === "input"
                        ? "Ganti Alamat Email"
                        : "Verifikasi Kode OTP"}
                    </h3>
                    <p className="text-[10px] text-white/60 mt-0.5">
                      {emailStep === "input"
                        ? "Langkah 1 dari 2"
                        : "Langkah 2 dari 2"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 hover:rotate-90 transition-all duration-300 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative flex items-center gap-2">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${emailStep === "input" || emailStep === "otp" ? "bg-[#00A5EC]" : "bg-white/20"}`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${emailStep === "otp" ? "bg-[#00A5EC]" : "bg-white/20"}`}
                />
              </div>
            </div>

            {/* STEP 1: Input email baru */}
            {emailStep === "input" && (
              <form onSubmit={handleRequestOtpEmail} className="p-6 animate-[fadeIn_0.3s_ease-out]">
                <p className={`text-xs leading-relaxed mb-5 ${sub}`}>
                  Untuk mengubah alamat email Anda, kami perlu memverifikasi
                  identitas Anda dengan mengirimkan kode OTP ke alamat email baru
                  yang Anda daftarkan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Kolom kiri: form */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className={`text-xs font-bold ${sub}`}>
                        Email Saat Ini
                      </label>
                      <div className="relative mt-1.5">
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-4 ${muted}`}
                        >
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
                          value={userEmail || ""}
                          disabled
                          className={`w-full rounded-xl border pl-11 pr-24 py-3 text-sm cursor-not-allowed focus:outline-none ${dk ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                        />
                        <span
                          className={`absolute inset-y-0 right-3 flex items-center text-[9px] font-extrabold uppercase tracking-wider ${dk ? "text-[#00A5EC]" : "text-[#004F9F]"}`}
                        >
                          Terverifikasi
                        </span>
                      </div>
                    </div>

                    <div
                      className={`border-t ${dk ? "border-white/10" : "border-slate-100"}`}
                    />

                    <div>
                      <label className={`text-xs font-bold ${sub}`}>
                        Email Baru
                      </label>
                      <div className="relative mt-1.5">
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-4 ${muted}`}
                        >
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
                          value={emailBaru}
                          onChange={(e) => setEmailBaru(e.target.value)}
                          required
                          placeholder="contoh@email.com"
                          className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`}
                        />
                      </div>
                      <p
                        className={`mt-2 text-[11px] ${dk ? "text-[#00A5EC]" : "text-[#004F9F]"}`}
                      >
                        Pastikan email ini aktif dan dapat diakses untuk menerima
                        kode OTP.
                      </p>
                    </div>

                    {emailError && (
                      <div
                        className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
                      >
                        <span className="shrink-0">⚠️</span>
                        <span>{emailError}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowEmailModal(false)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${dk ? "border-white/10 text-slate-300 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400" : "border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500"}`}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={emailLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-lg hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                      >
                        {emailLoading ? (
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12 3.269 3.126A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5"
                            />
                          </svg>
                        )}
                        {emailLoading ? "Mengirim..." : "Kirim Kode OTP"}
                      </button>
                    </div>
                  </div>

                  {/* Kolom kanan: info panel */}
                  <div className="space-y-4">
                    <div
                      className={`rounded-xl p-4 ${dk ? "bg-[#00A5EC]/10 border border-[#00A5EC]/20" : "bg-[#00A5EC]/5 border border-[#00A5EC]/20"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={dk ? "#38bdf8" : "#004F9F"} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                          </svg>
                        </span>
                        <h4 className={`text-[11px] font-extrabold ${txt}`}>
                          Informasi Penting
                        </h4>
                      </div>
                      <ul
                        className={`space-y-2 text-[10.5px] leading-relaxed ${sub}`}
                      >
                        <li className="flex gap-2">
                          <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-current opacity-60" />
                          <span>
                            Email baru akan digunakan untuk seluruh komunikasi
                            portal.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-current opacity-60" />
                          <span>
                            Email lama otomatis tidak berlaku setelah verifikasi
                            berhasil.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-current opacity-60" />
                          <span>
                            Jika Anda tidak menerima OTP dalam 5 menit, silakan coba
                            lagi.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${dk ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={dk ? "#34d399" : "#059669"} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
                          </svg>
                        </span>
                        <h4 className={`text-[11px] font-extrabold ${txt}`}>
                          Keamanan Akun
                        </h4>
                      </div>
                      <p className={`text-[10.5px] leading-relaxed ${sub}`}>
                        Setiap perubahan email selalu diverifikasi lewat kode OTP demi keamanan akun Anda.
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
                className="p-6 max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]"
              >
                <div className="flex flex-col items-center py-2">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${dk ? "bg-[#00A5EC]/10" : "bg-[#00A5EC]/10"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="#004F9F"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <h3 className={`text-sm font-extrabold text-center ${txt}`}>
                    Verifikasi Identitas Anda
                  </h3>
                  <p className={`text-xs text-center leading-relaxed mt-2 ${sub}`}>
                    Kami telah mengirimkan kode verifikasi 6 digit ke alamat email
                    baru
                  </p>
                  <p className={`text-sm font-extrabold mt-1 ${txt}`}>
                    {emailBaru}
                  </p>
                </div>

                {/* Kotak OTP */}
                <div
                  className="flex justify-center gap-2 mt-5"
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
                      className={`h-12 w-11 rounded-xl border text-center text-lg font-extrabold transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px]">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || emailLoading}
                    className={`font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${resendCooldown > 0 ? muted : "text-[#004F9F] hover:text-[#00A5EC]"}`}
                  >
                    {resendCooldown > 0
                      ? `Kirim Ulang Kode (${resendCooldown}s)`
                      : "Kirim Ulang Kode"}
                  </button>
                </div>

                {emailError && (
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
                  >
                    <span className="shrink-0">⚠️</span>
                    <span>{emailError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailLoading || otpInput.length !== 6}
                  className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3.5 text-xs font-bold text-white shadow-lg hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                >
                  {emailLoading && (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {emailLoading ? "Memverifikasi..." : "Verifikasi"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmailInput}
                  className={`group w-full mt-2.5 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${dk ? "border-transparent text-slate-400 hover:border-[#00A5EC]/30 hover:bg-[#00A5EC]/10 hover:text-[#00A5EC]" : "border-transparent text-slate-500 hover:border-[#004F9F]/20 hover:bg-[#004F9F]/5 hover:text-[#004F9F]"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Kembali ke Email
                </button>

                <div
                  className={`mt-5 pt-4 border-t flex items-start gap-2 ${dk ? "border-white/10" : "border-slate-100"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 shrink-0 mt-0.5 ${muted}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                  <p className={`text-[10.5px] leading-relaxed ${muted}`}>
                    Demi keamanan, kode ini akan kedaluwarsa dalam 10 menit. Jika
                    Anda tidak meminta perubahan email, segera amankan akun Anda.
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