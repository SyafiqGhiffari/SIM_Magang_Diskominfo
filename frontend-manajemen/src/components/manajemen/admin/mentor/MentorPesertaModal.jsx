import { useState, useEffect } from "react";
import { X, Users2, Loader2, Building2, Calendar, Inbox } from "lucide-react";
import { getPesertaBimbinganMentor } from "../../../../services/adminService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const avatarPalette = [
  "linear-gradient(135deg, #0B1442, #00A5EC)", "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #059669, #10b981)", "linear-gradient(135deg, #d97706, #f59e0b)",
];

const MentorPesertaModal = ({ mentor, onClose }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      getPesertaBimbinganMentor(mentor.id)
        .then((res) => setList(res.data.data || []))
        .catch((err) => toastError(err.response?.data?.message || "Gagal memuat data peserta bimbingan."))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <Users2 className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                <Users2 className="w-5 h-5 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">Peserta Bimbingan</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Dibimbing oleh {mentor.nama}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data peserta...
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Inbox className="w-6 h-6" />
              </span>
              <p className="text-sm font-bold text-slate-500">Belum ada peserta yang dibimbing</p>
              <p className="text-xs text-slate-400 max-w-xs">Tugaskan mentor ini ke peserta lewat menu Edit di halaman Kelola Peserta.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((p, i) => {
                const fotoUrl = getFileUrl(p.foto_profil);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out]"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  >
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={p.nama_lengkap} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0" />
                    ) : (
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-black shadow-sm"
                        style={{ background: avatarPalette[p.id % avatarPalette.length] }}
                      >
                        {getInitials(p.nama_lengkap)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#0B1442] truncate">{p.nama_lengkap}</p>
                      <p className="text-[11px] text-slate-400 truncate">{p.institusi || "-"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        <Building2 className="w-3 h-3" />
                        {p.posisi_bidang}
                      </span>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(p.tanggal_mulai)} — {fmtDate(p.tanggal_selesai)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorPesertaModal;