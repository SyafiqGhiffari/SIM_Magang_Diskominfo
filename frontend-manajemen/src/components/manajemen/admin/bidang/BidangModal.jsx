import { useState, useEffect } from "react";
import { X, Building2, FileText, Users2, Loader2, Info, UserCog, Save, Infinity as InfinityIcon, Sparkles } from "lucide-react";

const BidangModal = ({ initialData, onClose, onSubmit, isDark }) => {
  const isEdit = Boolean(initialData);
  const [nama, setNama] = useState(initialData?.nama || "");
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || "");
  const [kuota, setKuota] = useState(initialData?.kuota ?? 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const isUnlimited = Number(kuota) === 0;

  const isFormValid = Boolean(
    nama.trim() &&
    deskripsi.trim() &&
    kuota !== "" &&
    kuota !== null &&
    kuota !== undefined &&
    !isNaN(Number(kuota)) &&
    Number(kuota) >= 0
  );

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setLoading(true);
    try {
      await onSubmit({
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        kuota: Number(kuota) || 0,
        is_active: isActive,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-4xl max-h-[90vh] sm:max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border animate-[modalFadeUp_0.3s_ease-out] my-auto ${
          isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <Building2 className="absolute right-7 sm:right-12 top-1/2 -translate-y-1/2 w-18 h-18 sm:w-20 sm:h-20 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="relative flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -inset-1 rounded-lg sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight truncate">{isEdit ? "Edit Bidang" : "Tambah Bidang Baru"}</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5 truncate">Lengkapi detail bidang penempatan magang</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">

            {/* ===== CARD 1: Informasi Bidang Utama ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 ${
                  isDark ? "bg-[#00A5EC]/15 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Informasi Bidang Utama</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Detail dasar bidang penempatan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
                {/* Kolom form */}
                <div className="lg:col-span-2 space-y-2.5 sm:space-y-4">
                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1 block">Nama Bidang</label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Aplikasi & Informatika"
                      required
                      className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#00A5EC]/15"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                      }`}
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                    <label className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1 block">Deskripsi Bidang &amp; Lingkup Kerja</label>
                    <textarea
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      placeholder="Tuliskan deskripsi lengkap mengenai tanggung jawab dan kualifikasi yang dibutuhkan..."
                      rows={3}
                      className={`w-full rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-medium outline-none transition-all duration-200 ${
                        isDark
                          ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#00A5EC]/15"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                      }`}
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
                    <label className="flex items-center gap-1 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">
                      <Users2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Kuota Maksimum (Peserta)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={kuota}
                        onChange={(e) => setKuota(e.target.value)}
                        placeholder="0"
                        className={`w-full rounded-lg sm:rounded-xl border pl-2.5 sm:pl-4 pr-14 sm:pr-16 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-semibold outline-none transition-all duration-200 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-[#00A5EC] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#00A5EC]/15"
                            : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                        }`}
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[10.5px] sm:text-xs font-bold text-slate-400">Orang</span>
                    </div>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: isUnlimited ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <div className={`flex items-center gap-2 rounded-lg sm:rounded-xl border p-2 sm:p-2.5 mt-2 ${
                          isDark ? "bg-blue-950/40 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-700"
                        }`}>
                          <span className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md sm:rounded-lg animate-pulse ${
                            isDark ? "bg-blue-500/20 text-[#00A5EC]" : "bg-blue-100 text-blue-600"
                          }`}>
                            <InfinityIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </span>
                          <p className="text-[9.5px] sm:text-[10.5px] leading-snug">
                            <span className="font-bold">Kuota tanpa batas.</span> Nilai 0 berarti bidang ini bisa menerima peserta sebanyak apa pun.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom panduan */}
                <div className="lg:col-span-1">
                  <div
                    className="group h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-3 sm:p-4 relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div className="relative flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white/10 border border-white/15 transition-transform duration-300 group-hover:rotate-12">
                        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00A5EC]" />
                      </span>
                      <h4 className="text-[11px] sm:text-xs font-black text-white">Panduan Penambahan</h4>
                    </div>

                    <ul className="relative space-y-1.5 sm:space-y-2">
                      {[
                        "Pastikan nama bidang mudah dipahami dan mencerminkan unit penempatan.",
                        "Tuliskan deskripsi yang jelas mengenai tugas dan ruang lingkup pekerjaan.",
                        "Gunakan bahasa yang mudah dipahami agar informasi bidang jelas bagi peserta.",
                        "Tentukan kuota peserta sesuai kebutuhan. Isi 0 untuk tanpa batas.",
                        "Sesuaikan kuota peserta dengan kebutuhan dan kapasitas bidang.",
                        "Periksa kembali seluruh informasi sebelum menyimpan data.",
                      ].map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[9.5px] sm:text-[10.5px] leading-snug sm:leading-relaxed text-white/75 animate-[fadeslide_0.3s_ease-out]"
                          style={{ animationDelay: `${150 + i * 50}ms`, animationFillMode: "backwards" }}
                        >
                          <span className="mt-1 h-1 w-1 rounded-full bg-[#00A5EC] shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== CARD 2: Status Bidang ===== */}
            <div
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all duration-300 shadow-sm animate-[fadeslide_0.3s_ease-out] ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
              }`}
              style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-4">
                <span className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 ${
                  isDark ? "bg-[#00A5EC]/15 text-sky-400" : "bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]"
                }`}>
                  <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <div>
                  <h4 className={`text-[11px] sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Status Bidang</h4>
                  <p className="text-[9px] sm:text-[10.5px] text-slate-400">Visibilitas bidang di portal pendaftaran</p>
                </div>
              </div>

              <div className={`rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-2 sm:py-3.5 ${
                isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Status Aktivasi Bidang</p>
                  <button
                    type="button"
                    onClick={() => setIsActive((p) => !p)}
                    className={`group relative inline-flex h-[24px] w-[56px] shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-emerald-300/50"
                        : isDark ? "bg-slate-700" : "bg-gradient-to-r from-slate-300 to-slate-200 hover:shadow-slate-300/50"
                    } hover:shadow-md active:scale-95`}
                    title={isActive ? "Nonaktifkan bidang" : "Aktifkan bidang"}
                  >
                    <span
                      className={`absolute left-1.5 text-[8.5px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
                        isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                      }`}
                    >
                      Aktif
                    </span>
                    <span
                      className={`absolute right-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 transition-all duration-300 ${
                        !isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
                      }`}
                    >
                      Off
                    </span>
                    <span
                      className="relative inline-flex h-4.5 w-4.5 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out group-active:scale-90"
                      style={{
                        transform: isActive ? "translateX(35px)" : "translateX(3px)",
                      }}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                          isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </span>
                  </button>
                </div>
                <p className={`mt-1.5 text-[9px] sm:text-[10.5px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {isActive
                    ? "Bidang dapat dipilih oleh peserta pada portal pendaftaran."
                    : "Bidang tidak ditampilkan pada portal pendaftaran."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center gap-2 sm:gap-3 border-t px-3.5 py-2.5 sm:px-6 sm:py-4 sticky bottom-0 z-10 ${
            isDark ? "border-white/10 bg-[#161b22]/95 backdrop-blur-md" : "border-slate-100 bg-slate-50/90 backdrop-blur-md"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg sm:rounded-xl border py-1.5 sm:py-2.5 text-[10.5px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`group flex-[1.5] inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-1.5 sm:py-2.5 text-[10.5px] sm:text-xs font-bold text-white shadow-md transition-all duration-200 ${
                loading || !isFormValid
                  ? "opacity-50 cursor-not-allowed shadow-none"
                  : "hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 cursor-pointer"
              }`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Bidang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidangModal;