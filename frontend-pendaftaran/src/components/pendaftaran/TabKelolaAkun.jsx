import { Eye, EyeOff } from "lucide-react";
import FotoProfilModal from "./FotoProfilModal";
import GantiEmailModal from "./GantiEmailModal";

const TabKelolaAkun = ({
  dk,
  surface,
  txt,
  sub,
  muted,
  divider,
  inputCls,
  user,
  fotoPreview,
  fotoLoading,
  fotoDeleteLoading,
  fotoModalLoading,
  handleOpenCropModal,
  handleHapusFoto,
  cropFileInputRef,
  handleCropFileSelected,
  showFotoModal,
  setShowFotoModal,
  cropSrc,
  cropImgRef,
  cropPos,
  cropZoom,
  setCropZoom,
  isDragging,
  handleDragStart,
  handleSimpanPerubahanFoto,
  profileSuccess,
  profileError,
  setProfileError,
  noChangesMsg,
  profileForm,
  setProfileForm,
  handleSaveAll,
  passwordError,
  passwordSuccess,
  passwordForm,
  setPasswordForm,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  profileLoading,
  passwordLoading,
  setProfileSuccess,
  setPasswordSuccess,
  setPasswordError,
  showEmailModal,
  setShowEmailModal,
  handleOpenEmailModal,
  emailStep,
  emailBaru,
  setEmailBaru,
  otpInput,
  setOtpInput,
  emailLoading,
  emailError,
  emailSuccessMsg,
  handleRequestOtpEmail,
  handleVerifikasiOtpEmail,
  handleBackToEmailInput,
  resendCooldown,
  handleResendOtp,
  profileSuccessVisible,
  profileErrorVisible,
  passwordSuccessVisible,
  passwordErrorVisible,
  noChangesVisible,
  emailSuccessVisible,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${txt}`}>
          Kelola Akun
        </h2>
        <p className={`mt-1.5 text-xs ${sub}`}>
          Ubah foto profil, informasi diri, dan kata sandi akun Anda.
        </p>
      </div>

      {/* CARD 1: FOTO PROFIL */}
      <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
        <div className="flex items-center gap-5">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={handleOpenCropModal}
          >
            <div
              className={`h-24 w-24 rounded-full overflow-hidden border shadow-sm bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center ${dk ? "border-white/10" : "border-slate-200"}`}
            >
              {fotoPreview || user?.foto_profil ? (
                <img
                  src={
                    fotoPreview ||
                    (user?.foto_profil?.startsWith("http")
                      ? user.foto_profil
                      : `http://localhost:8000/${user.foto_profil}`)
                  }
                  alt="Foto Profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-white">
                  {user?.nama ? user.nama.charAt(0).toUpperCase() : "P"}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 8.25H9m6 3H9m3 6-3-3H4.5a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 6v6a2.25 2.25 0 0 1-2.25 2.25H15l-3 3Z"
                />
              </svg>
            </div>
            <div className="absolute bottom-0.5 right-0.5 h-7 w-7 rounded-full bg-[#004F9F] border-2 border-white flex items-center justify-center transition-all duration-300 ease-out group-hover:bg-[#00A5EC] group-hover:scale-125 group-hover:rotate-[10deg] group-hover:shadow-lg group-hover:shadow-[#00A5EC]/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="white"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487 18.549 2.8a2.5 2.5 0 1 1 3.536 3.536L7.25 21.079l-4.5 1.171 1.171-4.5L16.862 4.487Z"
                />
              </svg>
            </div>
            <input
              ref={cropFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleCropFileSelected}
            />
          </div>

          <div className="flex-1">
            <h3 className={`text-sm font-extrabold mb-1 ${txt}`}>
              Foto Profil
            </h3>
            <p className={`text-[11px] font-sans mb-4 ${muted}`}>
              JPG, PNG, atau WEBP. Ukuran maksimal 3MB.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCropModal}
                disabled={fotoLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-lg hover:shadow-[#004F9F]/25 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm cursor-pointer"
              >
                {fotoLoading && (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {fotoLoading ? "Mengunggah..." : "Unggah Foto Baru"}
              </button>
              <button
                type="button"
                onClick={handleHapusFoto}
                disabled={
                  fotoDeleteLoading || (!fotoPreview && !user?.foto_profil)
                }
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer ${dk ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
              >
                {fotoDeleteLoading && (
                  <div
                    className={`h-3.5 w-3.5 border-2 ${dk ? "border-slate-300" : "border-slate-600"} border-t-transparent rounded-full animate-spin`}
                  />
                )}
                {fotoDeleteLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FotoProfilModal
        dk={dk}
        divider={divider}
        sub={sub}
        showFotoModal={showFotoModal}
        setShowFotoModal={setShowFotoModal}
        cropSrc={cropSrc}
        cropImgRef={cropImgRef}
        cropPos={cropPos}
        cropZoom={cropZoom}
        setCropZoom={setCropZoom}
        isDragging={isDragging}
        handleDragStart={handleDragStart}
        cropFileInputRef={cropFileInputRef}
        handleSimpanPerubahanFoto={handleSimpanPerubahanFoto}
        fotoModalLoading={fotoModalLoading}
      />

      <GantiEmailModal
        dk={dk}
        sub={sub}
        muted={muted}
        txt={txt}
        userEmail={user?.email}
        showEmailModal={showEmailModal}
        setShowEmailModal={setShowEmailModal}
        emailStep={emailStep}
        emailBaru={emailBaru}
        setEmailBaru={setEmailBaru}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        emailLoading={emailLoading}
        emailError={emailError}
        handleRequestOtpEmail={handleRequestOtpEmail}
        handleVerifikasiOtpEmail={handleVerifikasiOtpEmail}
        handleBackToEmailInput={handleBackToEmailInput}
        resendCooldown={resendCooldown}
        handleResendOtp={handleResendOtp}
      />

      {/* CARD 2: INFORMASI PRIBADI */}
      <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
        <div className="flex items-center gap-2 mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 ${txt}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 .966-.784 1.75-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75v-4.25M3.75 9V7.5A2.25 2.25 0 0 1 6 5.25h12A2.25 2.25 0 0 1 20.25 7.5V9m-16.5 0h16.5m-16.5 0v3.375c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 0 0 1.125-1.125V9m9.75 0v3.375c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 0 0 1.125-1.125V9"
            />
          </svg>
          <h3 className={`text-sm font-extrabold ${txt}`}>Informasi Pribadi</h3>
        </div>
        <div className={`border-t mt-3 mb-5 ${divider}`} />
        {profileSuccess && (
          <div
            className={`flex items-center gap-2 mb-5 rounded-xl border p-3.5 text-xs font-semibold transition-all duration-500 ${profileSuccessVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"} ${dk ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div
            className={`flex items-center gap-2 mb-5 rounded-xl border p-3.5 text-xs font-semibold transition-all duration-500 ${profileErrorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"} ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>{profileError}</span>
          </div>
        )}
        {noChangesMsg && (
          <div className={`flex items-center gap-2 mb-5 rounded-xl border p-3.5 text-xs font-semibold transition-all duration-500 ${noChangesVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"} ${dk ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>{noChangesMsg}</span>
          </div>
        )}
        <form
          id="form-profil"
          onSubmit={handleSaveAll}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
        >
          <div>
            <label className={`text-xs font-bold ${sub}`}>Nama Lengkap</label>
            <input
              type="text"
              value={profileForm.nama}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, nama: e.target.value }))
              }
              required
              className={inputCls}
              placeholder="Nama lengkap Anda"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${sub}`}>Alamat Email</label>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  dk
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-2.5 h-2.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                Email Terverifikasi
              </span>
            </div>

            <div className="relative mt-1.5">
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={`w-full rounded-xl border pl-4 pr-16 py-3 text-sm cursor-not-allowed focus:outline-none ${dk ? "bg-white/5 border-white/10 text-slate-500" : "bg-slate-50 border-slate-150 text-slate-400"}`}
              />

              {/* Garis pembatas */}
              <div
                className={`absolute inset-y-2.5 right-[52px] w-px ${dk ? "bg-white/10" : "bg-slate-400"}`}
              />

              {/* Tombol Ubah - teks saja */}
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className={`group absolute inset-y-0 right-0 flex items-center pr-4 pl-3 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                  dk ? "text-[#00A5EC]" : "text-[#004F9F]"
                }`}
              >
                <span
                  className={`relative ${dk ? "group-hover:text-[#3fc4ff]" : "group-hover:text-[#00A5EC]"} transition-colors duration-200`}
                >
                  Edit
                  <span
                    className={`absolute left-0 -bottom-0.5 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 ease-out ${
                      dk ? "bg-[#3fc4ff]" : "bg-[#00A5EC]"
                    }`}
                  />
                </span>
              </button>
            </div>

            {emailSuccessMsg && (
              <p className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold text-emerald-500 transition-all duration-500 ${emailSuccessVisible ? "opacity-100" : "opacity-0"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>{emailSuccessMsg}</span>
              </p>
            )}
          </div>
          <div>
            <label className={`text-xs font-bold ${sub}`}>Nomor HP</label>
            <input
              type="tel"
              value={profileForm.no_hp}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, no_hp: e.target.value }))
              }
              className={inputCls}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className={`text-xs font-bold ${sub}`}>Institusi</label>
            <input
              type="text"
              value={profileForm.institusi}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, institusi: e.target.value }))
              }
              className={inputCls}
              placeholder="Contoh: Universitas Gadjah Mada"
            />
          </div>
        </form>
      </div>

      {/* CARD 3: GANTI PASSWORD */}
      <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
        <div className="flex items-center gap-2 mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 ${txt}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <h3 className={`text-sm font-extrabold ${txt}`}>Ganti Password</h3>
        </div>
        <div className={`border-t mt-3 mb-5 ${divider}`} />
        {passwordError && (
          <div className={`flex items-center gap-2 mb-5 rounded-xl border p-3.5 text-xs font-semibold transition-all duration-500 ${passwordErrorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"} ${dk ? "bg-red-500/10 border-red-400/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>{passwordError}</span>
          </div>
        )}
        {passwordSuccess && (
          <div className={`flex items-center gap-2 mb-5 rounded-xl border p-3.5 text-xs font-semibold transition-all duration-500 ${passwordSuccessVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"} ${dk ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{passwordSuccess}</span>
          </div>
        )}
        <form id="form-password" onSubmit={handleSaveAll} className="space-y-5">
          <div>
            <label className={`text-xs font-bold ${sub}`}>
              Password Saat Ini
            </label>
            <div className="relative mt-1.5">
              <input
                type={showOldPassword ? "text" : "password"}
                placeholder="••••••••"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    oldPassword: e.target.value,
                  }))
                }
                required
                className={`w-full rounded-xl border pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((p) => !p)}
                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${muted} hover:text-slate-600`}
              >
                {showOldPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className={`text-xs font-bold ${sub}`}>
                Password Baru
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  className={`w-full rounded-xl border pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${muted} hover:text-slate-600`}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className={`text-xs font-bold ${sub}`}>
                Konfirmasi Password Baru
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  className={`w-full rounded-xl border pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 ${dk ? "bg-[#0d1117] border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-white border-slate-200 text-[#0B1442] focus:border-[#004F9F]"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${muted} hover:text-slate-600`}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3.5 text-[11px] font-sans leading-relaxed ${
              dk ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B1442"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>

            <span>
              Password minimal 6 karakter. Gunakan kombinasi huruf dan angka.
            </span>
          </div>
        </form>
      </div>

      {/* ACTION BAR */}
      <div className="flex justify-end gap-3 pt-1 pb-2">
        <button
          type="submit"
          form="form-profil"
          disabled={profileLoading || passwordLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-xl hover:shadow-[#004F9F]/30 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg cursor-pointer"
        >
          {(profileLoading || passwordLoading) && (
            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Simpan Perubahan
        </button>
        <button
          type="button"
          onClick={() => {
            setProfileForm({
              nama: user?.nama || "",
              no_hp: user?.no_hp || "",
              institusi: user?.institusi || "",
            });
            setPasswordForm({
              oldPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setProfileSuccess("");
            setProfileError("");
            setPasswordSuccess("");
            setPasswordError("");
          }}
          className={`rounded-lg px-5 py-2.5 text-xs font-bold hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer ${dk ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          Batalkan Perubahan
        </button>
      </div>
    </div>
  );
};

export default TabKelolaAkun;
