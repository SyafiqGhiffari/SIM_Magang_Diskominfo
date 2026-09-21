import {
  UserCheck,
  User,
  AlertTriangle,
  Save,
  RefreshCw,
  Users,
  ChevronDown,
  Check,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  GraduationCap,
  School,
  CreditCard,
  Building2,
  Award,
  Landmark,
  FileText,
  UploadCloud,
  Camera,
  Contact,
  Briefcase,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import DokumenCard from "../DokumenCard";

const TabBiodataDokumen = ({
  dk,
  profile,
  pendaftaran,
  isMahasiswa,
  nomorRegistrasi,
  mentor,
  mentorFotoSrc,
  mentorInisial,
  formatTanggalIndo,
  totalMinggu,
  biodataForm,
  setBiodataForm,
  isBiodataFieldChanged,
  handleBatalBiodataField,
  handleSimpanBiodata,
  savingBiodata,
  genderDropdownOpen,
  setGenderDropdownOpen,
  genderDropdownRef,
  akademikForm,
  setAkademikForm,
  isFieldChanged,
  handleBatalField,
  handleSimpanAkademik,
  savingAkademik,
  handleOpenUploadDoc,
  handlePreviewDoc,
  handleOpenEmailModal,
  onNavigateToEmailCard,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
      {/* CARD 1: INFORMASI PRIBADI PESERTA (OPSI B - EDITABLE WITH PER-FIELD WARNING & INLINE SAVE) */}
      <form
        onSubmit={handleSimpanBiodata}
        className={`rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate">
                <span className="sm:hidden">Data Pribadi Peserta</span>
                <span className="hidden sm:inline">Informasi Pribadi Peserta</span>
              </h4>
              <p className="text-[9.5px] sm:text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                <span className="sm:hidden">Identitas diri resmi peserta magang</span>
                <span className="hidden sm:inline">Data identitas diri resmi peserta magang</span>
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
            Biodata Diri
          </span>
        </div>

        {/* Row: Nama Lengkap Resmi & Jenis Kelamin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nama Lengkap
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("nama")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak pada Sertifikat &amp; Seluruh Dokumen Resmi (Pastikan Sesuai KTP/KTM &amp; Tanpa Gelar)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={biodataForm.nama}
                onChange={(e) => setBiodataForm((p) => ({ ...p, nama: e.target.value }))}
                placeholder="Nama lengkap sesuai KTP/KTM"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("nama")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("nama")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("nama")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Jenis Kelamin
            </label>
            <div className="relative" ref={genderDropdownRef}>
              <Users className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none z-10" />
              <button
                type="button"
                onClick={() => setGenderDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none shadow-2xs cursor-pointer select-none text-left py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("jenis_kelamin")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              >
                <span className="truncate">{biodataForm.jenis_kelamin || "Pilih Jenis Kelamin"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 shrink-0 ${
                    isBiodataFieldChanged("jenis_kelamin")
                      ? "opacity-0 scale-75 pointer-events-none"
                      : "opacity-100 scale-100 text-slate-400"
                  } ${genderDropdownOpen ? "rotate-180 text-blue-500" : ""}`}
                />
              </button>

              {/* Inline Save & Batal when Gender is Changed */}
              <div
                className={`absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("jenis_kelamin")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBatalBiodataField("jenis_kelamin");
                  }}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  onClick={(e) => e.stopPropagation()}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>

              {/* Dropdown Menu Popover */}
              <div
                className={`absolute z-40 left-0 right-0 top-[calc(100%+4px)] sm:top-[calc(100%+6px)] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-white/15 shadow-xl shadow-slate-900/10 dark:shadow-black/50 backdrop-blur-md transition-all duration-200 origin-top space-y-1 ${
                  genderDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                {[
                  {
                    value: "Laki-laki",
                    label: "Laki-laki",
                    desc: "Peserta Pria",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10 dark:bg-blue-500/20",
                  },
                  {
                    value: "Perempuan",
                    label: "Perempuan",
                    desc: "Peserta Wanita",
                    color: "text-pink-500",
                    bg: "bg-pink-500/10 dark:bg-pink-500/20",
                  },
                ].map((option) => {
                  const isSelected = biodataForm.jenis_kelamin === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setBiodataForm((p) => ({ ...p, jenis_kelamin: option.value }));
                        setGenderDropdownOpen(false);
                      }}
                      className={`group/opt w-full flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-50 to-sky-50/50 dark:from-sky-950/40 dark:to-blue-950/20 text-[#004F9F] dark:text-sky-300 font-bold border border-blue-200/70 dark:border-sky-500/30 shadow-2xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span
                          className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${option.bg} ${option.color} transition-transform duration-200 group-hover/opt:scale-110`}
                        >
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-[11.5px] sm:text-sm truncate font-bold leading-tight">
                            {option.label}
                          </span>
                          <span className="block text-[9px] sm:text-[10.5px] text-slate-400 font-normal leading-tight mt-0.5">
                            {option.desc}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:bg-sky-400/20 dark:text-sky-300">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row: Tempat Lahir & Tanggal Lahir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Tempat Lahir
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("tempat_lahir")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Lembar Transkrip &amp; Biodata Sertifikat (Pastikan Ejaan Kota Benar)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <MapPin className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={biodataForm.tempat_lahir}
                onChange={(e) => setBiodataForm((p) => ({ ...p, tempat_lahir: e.target.value }))}
                placeholder="Kota/Kabupaten Tempat Lahir"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("tempat_lahir")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("tempat_lahir")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("tempat_lahir")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Tanggal Lahir
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("tanggal_lahir")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Lembar Transkrip &amp; Biodata Sertifikat (Pastikan Sesuai Dokumen Kependudukan)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <input
                type="date"
                value={biodataForm.tanggal_lahir}
                onChange={(e) => setBiodataForm((p) => ({ ...p, tanggal_lahir: e.target.value }))}
                onClick={(e) => e.target.showPicker?.()}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-2xs cursor-pointer py-1.5 sm:py-2.5 transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:absolute ${
                  isBiodataFieldChanged("tanggal_lahir")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("tanggal_lahir")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("tanggal_lahir")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
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

        {/* Row: Nomor WhatsApp/Telepon & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              Nomor WhatsApp / Telepon Aktif
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={biodataForm.no_hp}
                onChange={(e) => setBiodataForm((p) => ({ ...p, no_hp: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isBiodataFieldChanged("no_hp")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isBiodataFieldChanged("no_hp")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalBiodataField("no_hp")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBiodata}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingBiodata ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Aktif
              </label>
              <button
                type="button"
                onClick={onNavigateToEmailCard || handleOpenEmailModal}
                className="group/mailbtn inline-flex items-center gap-1 px-2 py-0.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-[11px] font-bold bg-blue-50/90 hover:bg-blue-100 text-blue-600 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-blue-200/70 dark:border-sky-800/40 shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Kelola & ganti email di Tab Keamanan"
              >
                <span>Kelola Email</span>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 dark:text-sky-400 group-hover/mailbtn:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
            <div className="bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 sm:gap-2.5 shadow-2xs min-h-[32px] sm:min-h-[42px]">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="break-all leading-snug text-xs sm:text-sm">
                {pendaftaran.email || profile?.email || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Alamat Tempat Tinggal */}
        <div>
          <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
            Alamat Tempat Tinggal
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-2.5 sm:left-3.5 top-2 sm:top-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
            <textarea
              rows={2}
              value={biodataForm.alamat_lengkap}
              onChange={(e) => setBiodataForm((p) => ({ ...p, alamat_lengkap: e.target.value }))}
              placeholder="Alamat lengkap tempat tinggal/domisili saat ini"
              className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 resize-none transition-all duration-300 ${
                isBiodataFieldChanged("alamat_lengkap")
                  ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                  : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
              }`}
            />
            <div
              className={`absolute right-1 sm:right-1.5 bottom-1.5 sm:bottom-2 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                isBiodataFieldChanged("alamat_lengkap")
                  ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                  : "opacity-0 scale-90 pointer-events-none translate-x-2"
              }`}
            >
              <button
                type="button"
                onClick={() => handleBatalBiodataField("alamat_lengkap")}
                title="Batalkan perubahan"
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingBiodata}
                className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {savingBiodata ? (
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                )}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* CARD 2: INFORMASI AKADEMIK & PENEMPATAN MAGANG (OPSI B - EDITABLE WITH PER-FIELD WARNING) */}
      <form
        onSubmit={handleSimpanAkademik}
        className={`rounded-2xl sm:rounded-3xl border p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                <span className="sm:hidden">Data Akademik &amp; Magang</span>
                <span className="hidden sm:inline">Informasi Akademik &amp; Penempatan Magang</span>
              </h4>
              <p className="text-[9.5px] sm:text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                <span className="sm:hidden">Institusi pendidikan &amp; penempatan magang</span>
                <span className="hidden sm:inline">Asal institusi pendidikan dan rincian penempatan magang peserta</span>
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
            {isMahasiswa ? "Mahasiswa" : "Siswa"}
          </span>
        </div>

        {/* Row 1: Asal Universitas / Sekolah & NIM / NISN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Asal Universitas / Politeknik" : "Asal Sekolah / SMK"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFieldChanged(isMahasiswa ? "asal_kampus" : "asal_sekolah")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak pada Sertifikat &amp; Dokumen Resmi (Pastikan Ejaan Benar &amp; Tidak Disingkat)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <School className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={isMahasiswa ? akademikForm.asal_kampus : akademikForm.asal_sekolah}
                onChange={(e) =>
                  setAkademikForm((p) => ({
                    ...p,
                    [isMahasiswa ? "asal_kampus" : "asal_sekolah"]: e.target.value,
                  }))
                }
                placeholder={isMahasiswa ? "Contoh: Universitas Gadjah Mada" : "Contoh: SMKN 1 Ponorogo"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged(isMahasiswa ? "asal_kampus" : "asal_sekolah")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged(isMahasiswa ? "asal_kampus" : "asal_sekolah")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField(isMahasiswa ? "asal_kampus" : "asal_sekolah")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkademik}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingAkademik ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Nomor Induk Mahasiswa (NIM)" : "Nomor Induk Siswa (NISN)"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFieldChanged(isMahasiswa ? "npm_nim" : "nisn")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Lembar Penilaian &amp; Sertifikat (Pastikan Nomor Valid)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <CreditCard className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={isMahasiswa ? akademikForm.npm_nim : akademikForm.nisn}
                onChange={(e) =>
                  setAkademikForm((p) => ({
                    ...p,
                    [isMahasiswa ? "npm_nim" : "nisn"]: e.target.value,
                  }))
                }
                placeholder={isMahasiswa ? "Contoh: 2110512034" : "Contoh: 0051234567"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 font-mono transition-all duration-300 ${
                  isFieldChanged(isMahasiswa ? "npm_nim" : "nisn")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
                required
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged(isMahasiswa ? "npm_nim" : "nisn")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField(isMahasiswa ? "npm_nim" : "nisn")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkademik}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingAkademik ? (
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

        {/* Row 2: Fakultas & Program Studi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Fakultas" : "Kelas / Tingkat"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFieldChanged(isMahasiswa ? "fakultas" : "kelas")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Surat &amp; Berkas Resmi (Pastikan Sesuai Data Kampus/Sekolah)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <Building2 className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={isMahasiswa ? akademikForm.fakultas : akademikForm.kelas}
                onChange={(e) =>
                  setAkademikForm((p) => ({
                    ...p,
                    [isMahasiswa ? "fakultas" : "kelas"]: e.target.value,
                  }))
                }
                placeholder={isMahasiswa ? "Contoh: Fakultas Ilmu Komputer" : "Contoh: XII RPL 1"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged(isMahasiswa ? "fakultas" : "kelas")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged(isMahasiswa ? "fakultas" : "kelas")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField(isMahasiswa ? "fakultas" : "kelas")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkademik}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingAkademik ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Program Studi / Jurusan" : "Jurusan Sekolah"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFieldChanged(isMahasiswa ? "program_studi" : "jurusan_sekolah")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tercetak di Sertifikat Kelulusan Resmi (Pastikan Nama Jurusan Lengkap &amp; Benar)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <GraduationCap className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={isMahasiswa ? akademikForm.program_studi : akademikForm.jurusan_sekolah}
                onChange={(e) =>
                  setAkademikForm((p) => ({
                    ...p,
                    [isMahasiswa ? "program_studi" : "jurusan_sekolah"]: e.target.value,
                  }))
                }
                placeholder={isMahasiswa ? "Contoh: Teknik Informatika" : "Contoh: Rekayasa Perangkat Lunak"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged(isMahasiswa ? "program_studi" : "jurusan_sekolah")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged(isMahasiswa ? "program_studi" : "jurusan_sekolah")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField(isMahasiswa ? "program_studi" : "jurusan_sekolah")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkademik}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingAkademik ? (
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

        {/* Row 3: Semester & Nomor Registrasi Magang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1">
              {isMahasiswa ? "Semester Saat Ini" : "Tingkat / Jenjang"}
            </label>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFieldChanged("semester")
                  ? "max-h-16 opacity-100 mb-1 sm:mb-1.5 translate-y-0"
                  : "max-h-0 opacity-0 mb-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md border border-amber-500/30">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                <span>Tersinkronisasi ke Rekap Evaluasi Magang (Pastikan Sesuai Semester Berjalan)</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <Award className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={akademikForm.semester}
                onChange={(e) =>
                  setAkademikForm((p) => ({
                    ...p,
                    semester: e.target.value,
                  }))
                }
                placeholder={isMahasiswa ? "Contoh: 6 atau Semester 6" : "Contoh: Kelas XII atau Tingkat Akhir"}
                className={`w-full bg-slate-50 dark:bg-white/5 border rounded-lg sm:rounded-xl pl-8 sm:pl-10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-[10.5px] sm:placeholder:text-sm focus:outline-none shadow-2xs py-1.5 sm:py-2.5 transition-all duration-300 ${
                  isFieldChanged("semester")
                    ? "border-amber-400/90 dark:border-amber-500/80 pr-24 sm:pr-32 focus:ring-2 focus:ring-amber-400/25"
                    : "border-slate-200/80 dark:border-white/10 pr-2.5 sm:pr-3.5 focus:ring-2 focus:ring-[#004F9F] dark:focus:ring-[#00A5EC]"
                }`}
              />
              <div
                className={`absolute right-1 sm:right-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ease-in-out ${
                  isFieldChanged("semester")
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
                    : "opacity-0 scale-90 pointer-events-none translate-x-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleBatalField("semester")}
                  title="Batalkan perubahan"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkademik}
                  className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] text-white text-[9.5px] sm:text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {savingAkademik ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:rotate-6" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1.5">
              Nomor Registrasi Magang
            </label>
            <div className="bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs flex items-center justify-between min-h-[32px] sm:min-h-[42px]">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <span className="truncate font-mono font-bold text-slate-900 dark:text-slate-100 text-[11.5px] sm:text-sm">
                  {nomorRegistrasi}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border border-emerald-100 dark:border-emerald-800/30">
                Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Row 4: Periode Magang */}
        <div>
          <label className="text-[10.5px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 sm:mb-1.5">
            Periode Pelaksanaan Magang
          </label>
          <div className="bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-2xs min-h-[32px] sm:min-h-[42px]">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-sm">
                {pendaftaran.tanggal_mulai && pendaftaran.tanggal_selesai
                  ? `${formatTanggalIndo(pendaftaran.tanggal_mulai)} s.d. ${formatTanggalIndo(pendaftaran.tanggal_selesai)}`
                  : "Sesuai Jadwal Magang"}
              </span>
            </div>
            <span className="text-[9.5px] sm:text-[11px] font-bold text-[#004F9F] dark:text-[#00A5EC] bg-blue-50 dark:bg-blue-950/50 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border border-blue-100 dark:border-blue-900/40">
              {totalMinggu ? `${totalMinggu} Minggu` : "Aktif"}
            </span>
          </div>
        </div>

        {/* Penempatan Instansi Diskominfo (Dark Blue Card) */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#002D6B] border border-blue-900/60 p-3 sm:p-5 text-white shadow-md relative overflow-hidden mt-3 sm:mt-4">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-sky-400/15 blur-xl pointer-events-none" />

          {/* Header inside Navy Card */}
          <div className="relative flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white shadow-xs">
                <Landmark className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" strokeWidth={2} />
              </span>
              <h5 className="text-[11.5px] sm:text-sm font-extrabold text-white truncate">
                <span className="sm:hidden">Penempatan Diskominfo</span>
                <span className="hidden sm:inline">Penempatan Instansi Diskominfo</span>
              </h5>
            </div>
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold bg-[#004F9F] text-white border border-sky-400/30 shadow-xs shrink-0">
              <span className="sm:hidden">Diskominfo</span>
              <span className="hidden sm:inline">Diskominfo Kab. Ponorogo</span>
            </span>
          </div>

          {/* Content inside Navy Card: 2 Columns */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-5 pt-2.5 sm:pt-3.5">
            {/* Kolom 1: Bidang Penempatan */}
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
              <span className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 text-white border border-white/15 shadow-xs">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10.5px] font-semibold text-sky-200/80 uppercase tracking-wider">
                  Bidang Penempatan
                </p>
                <p className="text-[11.5px] sm:text-sm font-bold text-white mt-0.5 leading-snug">
                  {pendaftaran.posisi_bidang?.toLowerCase().startsWith("bidang")
                    ? pendaftaran.posisi_bidang
                    : `Bidang ${pendaftaran.posisi_bidang || "Aplikasi dan Informatika"}`}
                </p>
                <p className="text-[9px] sm:text-[10px] text-blue-200/60 mt-0.5 truncate">
                  Dinas Komunikasi, Informatika dan Statistik
                </p>
              </div>
            </div>

            {/* Kolom 2: Mentor Pembimbing dengan Foto Kotak Rounded */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
              {/* Avatar Mentor: Kotak Rounded Mengikuti Border */}
              <div className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl overflow-hidden bg-white/10 border border-white/15 shadow-xs shrink-0 flex items-center justify-center">
                {mentorFotoSrc ? (
                  <img
                    src={mentorFotoSrc}
                    alt={mentor?.nama || "Mentor"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] sm:text-sm font-black text-white bg-gradient-to-br from-[#0B1442] to-[#00A5EC] w-full h-full flex items-center justify-center">
                    {mentorInisial}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10.5px] font-semibold text-sky-200/80 uppercase tracking-wider">
                  Mentor Pembimbing
                </p>
                <p className="text-[11.5px] sm:text-sm font-bold text-white mt-0.5 truncate">
                  {mentor?.nama || "Mentor Belum Ditugaskan"}
                </p>
                <p className="text-[9px] sm:text-[10px] text-sky-300/80 truncate mt-0.5">
                  {mentor?.jabatan || "Pembimbing Lapangan Diskominfo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Berkas & Dokumen Pendaftaran */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs space-y-3.5 sm:space-y-5 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header Card */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[12px] sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  <span className="sm:hidden">Berkas &amp; Dokumen Magang</span>
                  <span className="hidden sm:inline">Kelengkapan Berkas &amp; Dokumen Magang</span>
                </h4>

                {/* Badge Dokumen Magang (HANYA TAMPIL DI DESKTOP) */}
                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
                  Dokumen Magang
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                <span className="sm:hidden">Kelengkapan berkas administrasi magang</span>
                <span className="hidden sm:inline">Kelola seluruh berkas persyaratan pendaftaran dan dokumen resmi magang Anda</span>
              </p>
            </div>
          </div>

          {/* Tombol Unggah di Pojok Kanan Header (Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => handleOpenUploadDoc(null, "baru")}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3.5 sm:py-2 rounded-md sm:rounded-xl text-[9.5px] sm:text-xs font-bold text-white bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] shadow-xs hover:shadow-md transition-colors duration-150 cursor-pointer shrink-0"
          >
            <UploadCloud className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="sm:hidden">Unggah</span>
            <span className="hidden sm:inline">Unggah Berkas Baru</span>
          </button>
        </div>

        {/* Document Grid (2 Columns on Desktop, 1 Column on Mobile for Maximum Readability) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          {pendaftaran.surat_penerimaan?.file_surat && (
            <DokumenCard
              dk={dk}
              icon={Landmark}
              colorTheme="blue"
              label="Surat Penerimaan Magang"
              desc="Surat keputusan resmi penerimaan magang yang diterbitkan oleh Diskominfo Ponorogo"
              extraBadge="Dokumen Resmi"
              formatInfo={
                pendaftaran.surat_penerimaan.nomor_surat
                  ? `No: ${pendaftaran.surat_penerimaan.nomor_surat}`
                  : "Dinas Kominfo Ponorogo"
              }
              filePath={pendaftaran.surat_penerimaan.file_surat}
              isSuratPenerimaan={true}
              onPreview={handlePreviewDoc}
            />
          )}
          <DokumenCard
            dk={dk}
            icon={GraduationCap}
            colorTheme="indigo"
            jenis="file_surat_pengantar"
            label="Surat Pengantar Magang"
            desc="Surat permohonan dan pengantar resmi dari institusi kampus atau sekolah asal peserta"
            formatInfo="Format PDF • Maksimal 10 MB"
            filePath={pendaftaran.file_surat_pengantar}
            isRequired={true}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          <DokumenCard
            dk={dk}
            icon={Contact}
            colorTheme="purple"
            jenis="file_cv"
            label="Curriculum Vitae (CV)"
            desc="Daftar riwayat hidup, rekam jejak akademik, keahlian, dan portofolio peserta"
            formatInfo="Format PDF, DOC, DOCX • Maks 10 MB"
            filePath={pendaftaran.file_cv}
            isRequired={true}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          <DokumenCard
            dk={dk}
            icon={Camera}
            colorTheme="sky"
            jenis="file_pas_foto"
            label="Pas Foto Resmi Peserta"
            desc="Foto formal terbaru peserta berlatar belakang rapi untuk identitas magang"
            formatInfo="Format JPG, PNG • Maksimal 3 MB"
            filePath={pendaftaran.file_pas_foto}
            isRequired={true}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          <DokumenCard
            dk={dk}
            icon={Award}
            colorTheme="emerald"
            jenis="file_transkrip"
            label="Transkrip Nilai / Rapor"
            desc="Salinan transkrip nilai akademik semester berjalan atau buku rapor terakhir"
            formatInfo="Format PDF • Maksimal 10 MB"
            filePath={pendaftaran.file_transkrip}
            isRequired={false}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          <DokumenCard
            dk={dk}
            icon={Briefcase}
            colorTheme="rose"
            jenis="file_portofolio"
            label="Portofolio Karya & Proyek"
            desc="Dokumentasi proyek, desain, kode pemrograman, atau sertifikat keahlian"
            formatInfo="Format PDF, ZIP, RAR • Maks 10 MB"
            filePath={pendaftaran.file_portofolio}
            isRequired={false}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          <DokumenCard
            dk={dk}
            icon={BookOpen}
            colorTheme="amber"
            jenis="file_proposal_magang"
            label="Proposal Rencana Magang"
            desc="Proposal rencana kegiatan, sasaran target kerja, atau topik magang peserta"
            formatInfo="Format PDF • Maksimal 10 MB"
            filePath={pendaftaran.file_proposal_magang}
            isRequired={false}
            onUpload={handleOpenUploadDoc}
            onPreview={handlePreviewDoc}
          />
          {pendaftaran.file_laporan_akhir && (
            <DokumenCard
              dk={dk}
              icon={CheckCircle2}
              colorTheme="teal"
              label="Laporan Akhir Magang"
              desc={
                pendaftaran.judul_laporan_akhir ||
                "Dokumen laporan akhir penutup dan hasil evaluasi pelaksanaan magang"
              }
              extraBadge="Penyelesaian Magang"
              formatInfo="Dokumen Final Magang"
              filePath={pendaftaran.file_laporan_akhir}
              isSuratPenerimaan={true}
              onPreview={handlePreviewDoc}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TabBiodataDokumen;
