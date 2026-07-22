import { useState, useEffect } from "react";
import { X, UserCog, Check, Loader2, Sparkles, Building2, Users2 } from "lucide-react";
import { getAllAkun, assignMentorPeserta } from "../../../../services/adminService";
import { toastSuccess, toastError } from "../../../../utils/swal";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const AssignMentorModal = ({ peserta, onClose, onUpdated }) => {
  const [mentorList, setMentorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentorId, setSelectedMentorId] = useState(peserta.mentor_id || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      getAllAkun()
        .then((res) => {
          const mentors = (res.data.data || []).filter(
            (u) => u.role === "mentor" && u.bidang_nama === peserta.bidang
          );
          setMentorList(mentors);
        })
        .catch(() => setMentorList([]))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await assignMentorPeserta(peserta.id, { mentor_id: selectedMentorId });
      toastSuccess("Mentor pembimbing berhasil diperbarui");
      onUpdated();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui mentor pembimbing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <UserCog className="absolute right-14 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.07] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <UserCog className="w-5.5 h-5.5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  Penugasan Mentor
                </div>
                <h3 className="text-base font-black text-white leading-tight">Tentukan Mentor Pembimbing</h3>
                <p className="text-[11px] text-white/60 mt-0.5 truncate max-w-[280px]">Untuk {peserta.nama}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="flex items-start gap-2.5 rounded-xl bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 border border-[#004F9F]/15 p-3.5 mb-5 animate-[fadeslide_0.3s_ease-out]"
            style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-[#004F9F] mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[#004F9F]">
              Hanya menampilkan mentor dari bidang <b>{peserta.bidang || "-"}</b>, sesuai bidang peserta ini.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#004F9F]" />
              Memuat daftar mentor...
            </div>
          ) : mentorList.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center animate-[fadeslide_0.3s_ease-out]"
              style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
            >
              <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <Users2 className="w-5 h-5" />
              </span>
              <p className="text-xs font-semibold text-slate-500">Belum ada mentor di bidang ini.</p>
              <p className="text-[10.5px] text-slate-400 mt-1">Tugaskan mentor ke bidang "{peserta.bidang}" terlebih dahulu lewat menu Kelola Mentor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedMentorId !== null && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMentorId(null)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-red-200 bg-red-50/50 py-2.5 text-[11px] font-bold text-red-500 hover:border-red-300 hover:bg-red-50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-[fadeslide_0.2s_ease-out]"
                  >
                    <X className="w-3 h-3" />
                    Batalkan pilihan mentor
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-0.5">
                {mentorList.map((m, i) => {
                  const checked = selectedMentorId === m.id;
                  const fotoUrl = getFileUrl(m.foto_profil);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMentorId(checked ? null : m.id)}
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg animate-[fadeslide_0.25s_ease-out] ${
                        checked
                          ? "border-[#004F9F]/50 bg-gradient-to-br from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 shadow-md"
                          : "border-slate-200 bg-slate-50/70 hover:border-[#004F9F]/40 hover:bg-white"
                      }`}
                      style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: "backwards" }}
                    >
                      {fotoUrl ? (
                        <img src={fotoUrl} alt={m.nama} className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[11px] font-black shadow-sm transition-transform duration-200 group-hover:scale-110">
                          {getInitials(m.nama)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 truncate">{m.nama}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.jabatan || m.email}</p>
                      </div>
                      <span
                        className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                          checked
                            ? "border-[#004F9F] bg-gradient-to-br from-[#0B1442] to-[#004F9F] scale-110"
                            : "border-slate-300 bg-white group-hover:border-[#004F9F]/60"
                        }`}
                      >
                        <Check className={`w-3 h-3 text-white transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="group relative flex-[1.5] inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/10 skew-x-12 group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            {saving ? (
              <Loader2 className="relative w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="relative w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            )}
            <span className="relative">{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMentorModal;