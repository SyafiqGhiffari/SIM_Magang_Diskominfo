import { useState, useEffect } from "react";
import { X, Compass, FileText, Users2, Loader2, Info, UserCog, Save, Infinity as InfinityIcon, Sparkles } from "lucide-react";

const BidangModal = ({ initialData, onClose, onSubmit }) => {
  const isEdit = Boolean(initialData);
  const [nama, setNama] = useState(initialData?.nama || "");
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || "");
  const [kuota, setKuota] = useState(initialData?.kuota ?? 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const isUnlimited = Number(kuota) === 0;

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <Compass className="absolute right-18 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <Compass className="w-5 h-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-base font-black text-white leading-tight">{isEdit ? "Edit Bidang" : "Tambah Bidang Baru"}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Lengkapi detail bidang penempatan magang</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* ===== CARD 1: Informasi Bidang Utama ===== */}
            <div
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F] transition-transform duration-300 hover:scale-110 hover:-rotate-3">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-[#0B1442]">Informasi Bidang Utama</h4>
                  <p className="text-[10.5px] text-slate-400">Detail dasar bidang penempatan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Kolom form */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Nama Bidang</label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Aplikasi & Informatika"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Deskripsi Bidang &amp; Lingkup Kerja</label>
                    <textarea
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      placeholder="Tuliskan deskripsi lengkap mengenai tanggung jawab dan kualifikasi yang dibutuhkan..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                    />
                  </div>

                  <div className="animate-[fadeslide_0.3s_ease-out]" style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
                    <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <Users2 className="w-3.5 h-3.5" />
                      Kuota Maksimum (Peserta)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={kuota}
                        onChange={(e) => setKuota(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-4 pr-16 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 hover:-translate-y-0.5"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Orang</span>
                    </div>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: isUnlimited ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3 mt-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 animate-pulse">
                            <InfinityIcon className="w-3.5 h-3.5" />
                          </span>
                          <p className="text-[11px] leading-relaxed text-blue-700">
                            <span className="font-bold">Kuota tanpa batas.</span> Nilai 0 berarti bidang ini bisa menerima peserta sebanyak apa pun tanpa batasan jumlah.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom panduan */}
                <div className="lg:col-span-1">
                  <div
                    className="group h-full rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-4 relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div className="relative flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/15 transition-transform duration-300 group-hover:rotate-12">
                        <Info className="w-3.5 h-3.5 text-[#00A5EC]" />
                      </span>
                      <h4 className="text-xs font-black text-white">Panduan Penambahan</h4>
                    </div>
                    <ul className="relative space-y-2.5">
                      {[
                        "Pastikan nama bidang mudah dipahami dan mencerminkan unit atau bidang penempatan.",
                        "Tuliskan deskripsi yang jelas mengenai tugas, tanggung jawab, dan ruang lingkup pekerjaan.",
                        "Tentukan kuota peserta sesuai kebutuhan. Isi 0 apabila tidak ada batas jumlah peserta.",
                        "Periksa kembali seluruh informasi sebelum menyimpan data.",
                        "Pastikan data yang diinput akurat dan selalu diperbarui apabila terdapat perubahan.",
                      ].map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[11px] leading-relaxed text-white/75 animate-[fadeslide_0.3s_ease-out]"
                          style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: "backwards" }}
                        >
                          <span className="mt-1 h-1 w-1 rounded-full bg-[#00A5EC] shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== CARD 2: Status Bidang ===== */}
            <div
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F] transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <UserCog className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-[#0B1442]">Status Bidang</h4>
                  <p className="text-[10.5px] text-slate-400">Visibilitas bidang di portal pendaftaran</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-700">Status Aktivasi Bidang</p>
                  <button
                    type="button"
                    onClick={() => setIsActive((p) => !p)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 cursor-pointer ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span
                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300"
                      style={{ transform: isActive ? "translateX(22px)" : "translateX(2px)" }}
                    />
                  </button>
                </div>
                <p className="mt-2 text-[10.5px] text-slate-500">
                  {isActive
                    ? "Bidang dapat dipilih oleh peserta pada portal pendaftaran."
                    : "Bidang tidak ditampilkan pada portal pendaftaran."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 sticky bottom-0">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-[1.5] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
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