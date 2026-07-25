import { useState, useEffect } from "react";
import { X, CalendarPlus, CalendarDays, Type, Loader2, Save, Sparkles, Info } from "lucide-react";

const HariLiburModal = ({ initialData, onClose, onSubmit }) => {
  const isEdit = Boolean(initialData);
  const [tanggal, setTanggal] = useState(initialData?.tanggal || "");
  const [nama, setNama] = useState(initialData?.nama || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tanggal || !nama.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ tanggal, nama: nama.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <CalendarDays className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <CalendarPlus className="w-5 h-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  {isEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="text-base font-black text-white leading-tight">{isEdit ? "Edit Hari Libur" : "Tambah Hari Libur"}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Libur di luar Sabtu &amp; Minggu</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Nama / Keterangan Libur
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Libur Awal Puasa"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300"
                />
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Info className="w-3.5 h-3.5" />
                </span>
                <p className="text-[11px] leading-relaxed text-blue-700">
                  Gunakan menu ini untuk libur yang <span className="font-bold">tidak</span> ada di daftar libur nasional. Libur nasional cukup ditarik lewat tombol <span className="font-bold">Sinkronisasi</span>.
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
              {isEdit ? "Simpan Perubahan" : "Tambah Libur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HariLiburModal;