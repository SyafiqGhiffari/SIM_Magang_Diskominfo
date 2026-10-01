import {
  UserCheck,
  User,
  Save,
  RefreshCw,
  Phone,
  Mail,
  Briefcase,
  ShieldCheck,
  Server,
  Lock,
  KeyRound,
  ChevronRight,
} from "lucide-react";

const TabProfilAdmin = ({
  dk,
  profile,
  profilForm,
  setProfilForm,
  isFieldChanged,
  handleBatalField,
  handleSave,
  saving,
  onNavigateToKeamanan,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
      {/* CARD 1: INFORMASI PROFIL & KEPEGAWAIAN ADMINISTRATOR (EDITABLE INLINE MATCHING PESERTA) */}
      <form
        onSubmit={handleSave}
        className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-3.5 sm:space-y-4 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header Card */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Informasi Profil &amp; Kepegawaian
              </h4>
              <p className="text-[9.5px] sm:text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                Data identitas resmi administrator sistem SIM Magang Diskominfo Ponorogo
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
            Profil Admin
          </span>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* Field 1: Nama Lengkap */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nama Lengkap Resmi <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={profilForm?.nama || ""}
                onChange={(e) => setProfilForm((p) => ({ ...p, nama: e.target.value }))}
                placeholder="Masukkan nama lengkap admin"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged("nama")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged("nama")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField("nama")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Field 2: Alamat Email (Disabled & Link ke Tab Keamanan) */}
          <div>
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alamat Email Akun
              </label>
              <button
                type="button"
                onClick={onNavigateToKeamanan}
                className="group/mailbtn inline-flex items-center gap-1 px-2 py-0.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-[11px] font-bold bg-blue-50/90 hover:bg-blue-100 text-[#004F9F] dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-blue-200/70 dark:border-sky-800/40 shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Kelola & ganti email via OTP di Tab Keamanan"
              >
                <span>Kelola Email</span>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#004F9F] dark:text-sky-400 group-hover/mailbtn:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
            <div className="bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 sm:gap-2.5 shadow-2xs min-h-[32px] sm:min-h-[42px] cursor-not-allowed select-all font-mono">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="break-all leading-snug text-xs sm:text-sm">
                {profile?.email || "-"}
              </span>
            </div>
          </div>

          {/* Field 3: Nomor WhatsApp / HP */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nomor WhatsApp / HP
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={profilForm?.no_hp || ""}
                onChange={(e) => setProfilForm((p) => ({ ...p, no_hp: e.target.value }))}
                placeholder="Contoh: 081234567890"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged("no_hp")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged("no_hp")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField("no_hp")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Field 4: Jabatan / Divisi */}
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Jabatan / Divisi
            </label>
            <div className="relative flex items-center">
              <Briefcase className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={profilForm?.jabatan || ""}
                onChange={(e) => setProfilForm((p) => ({ ...p, jabatan: e.target.value }))}
                placeholder="Contoh: Pranata Komputer / Staff IT"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged("jabatan")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged("jabatan")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField("jabatan")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Read-only System & Role Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <div
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${
              dk ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-200/70"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-[#004F9F] dark:text-sky-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Hak Akses Sistem
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {profile?.role ? profile.role.toUpperCase() : "ADMINISTRATOR"}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9.5px] font-bold bg-blue-500/10 text-[#004F9F] dark:text-sky-300 border border-blue-500/20 shrink-0">
              Level 1
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${
              dk ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-200/70"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Server className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Status Akun
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {profile?.status_akun ? profile.status_akun.toUpperCase() : "AKTIF"}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </span>
          </div>
        </div>
      </form>

      {/* CARD 2: PEDOMAN & KEBIJAKAN ADMINISTRATOR DISKOMINFO */}
      <div
        className={`rounded-xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-3.5 sm:space-y-4.5 transition-all duration-300 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3.5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                Pedoman Hak Akses Administrator
              </h4>
              <p className="text-[9.5px] sm:text-[11px] text-slate-400 leading-snug mt-0.5">
                Standar operasional pengelolaan data dan tata kelola akun manajemen
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
            Pedoman Admin
          </span>
        </div>

        {/* 3 Panduan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Item 1 */}
          <div
            className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 flex flex-col justify-between ${
              dk
                ? "bg-white/[0.02] border-white/5 hover:border-sky-500/30 hover:bg-sky-950/10"
                : "bg-slate-50/80 border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/40"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  Otoritas
                </span>
              </div>
              <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Hak Akses Penuh Sistem
              </h5>
              <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Akun administrator berwenang mengelola pendaftaran, presensi, sertifikat, dan penempatan bidang peserta magang.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div
            className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 flex flex-col justify-between ${
              dk
                ? "bg-white/[0.02] border-white/5 hover:border-amber-500/30 hover:bg-amber-950/10"
                : "bg-slate-50/80 border-slate-200/70 hover:border-amber-300 hover:bg-amber-50/40"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Privasi
                </span>
              </div>
              <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Kerahasiaan Data Magang
              </h5>
              <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Jaga kerahasiaan dokumen resmi pendaftar (KTP, KTM, Surat Pengantar, CV) sesuai regulasi perlindungan data pribadi.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div
            className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 space-y-2 flex flex-col justify-between ${
              dk
                ? "bg-white/[0.02] border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/10"
                : "bg-slate-50/80 border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Keamanan
                </span>
              </div>
              <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Perlindungan Kredensial
              </h5>
              <p className="text-[9px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Gunakan kata sandi dengan kombinasi kompleks dan lakukan rotasi kata sandi secara berkala demi integritas server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabProfilAdmin;
