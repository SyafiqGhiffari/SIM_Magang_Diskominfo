import { useState, useEffect } from "react";
import { X, Compass, FileText, Users2, ToggleLeft, Loader2 } from "lucide-react";

const BidangModal = ({ initialData, onClose, onSubmit }) => {
  const isEdit = Boolean(initialData);
  const [nama, setNama] = useState(initialData?.nama || "");
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || "");
  const [kuota, setKuota] = useState(initialData?.kuota ?? 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [loading, setLoading] = useState(false);

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
      await onSubmit({ nama: nama.trim(), deskripsi: deskripsi.trim(), kuota: Number(kuota) || 0, is_active: isActive });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                <Compass className="w-5 h-5 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">{isEdit ? "Edit Bidang" : "Tambah Bidang Baru"}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Kelola daftar bidang penempatan magang</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Compass className="w-3.5 h-3.5" />
                Nama Bidang
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Aplikasi & Informatika"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                Deskripsi
              </label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi singkat bidang ini..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Users2 className="w-3.5 h-3.5" />
                Kuota Maksimal Peserta
              </label>
              <input
                type="number"
                min={0}
                value={kuota}
                onChange={(e) => setKuota(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
              />
              <p className="mt-1.5 text-[10.5px] text-slate-400">Isi 0 jika tidak ingin membatasi kuota.</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Status Bidang</p>
                  <p className="text-[10.5px] text-slate-400">{isActive ? "Aktif — tampil di form pendaftaran" : "Nonaktif — disembunyikan"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((p) => !p)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isActive ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-[1.5] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 cursor-pointer">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Bidang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidangModal;