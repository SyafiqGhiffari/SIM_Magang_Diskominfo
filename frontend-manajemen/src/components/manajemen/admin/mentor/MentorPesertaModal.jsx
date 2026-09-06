import { useState, useEffect } from "react";
import { X, Users2, Loader2, Building2, Calendar, Inbox } from "lucide-react";
import { getPesertaBimbinganMentor } from "../../../../services/adminService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const avatarPalette = [
  "linear-gradient(135deg, #0B1442, #00A5EC)",
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
];

const MentorPesertaModal = ({ mentor, onClose, isDark = false }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(() => {
      getPesertaBimbinganMentor(mentor.id)
        .then((res) => setList(res.data.data || []))
        .catch((err) => toastError(err.response?.data?.message || "Gagal memuat data peserta bimbingan."))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [mentor.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-sm sm:max-w-xl max-h-[85vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <Users2 className="absolute right-9 sm:right-12 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Peserta Bimbingan</h3>
                <p className="text-[9.5px] sm:text-[11px] text-white/60 mt-0.5">Dibimbing oleh {mentor.nama}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-16 text-slate-400 text-xs sm:text-sm gap-2">
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-[#00A5EC]" />
              Memuat data peserta...
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 py-10 sm:py-16 text-center">
              <span className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
              }`}>
                <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-500"}`}>Belum ada peserta yang dibimbing</p>
              <p className="text-[10px] sm:text-xs text-slate-400 max-w-xs">Tugaskan mentor ini ke peserta lewat menu Edit di halaman Kelola Peserta.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {list.map((p, i) => {
                const fotoUrl = getFileUrl(p.foto_profil);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 sm:gap-3 rounded-xl border p-2 sm:p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out] ${
                      isDark ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]" : "border-slate-200 bg-white hover:bg-blue-50/20"
                    }`}
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  >
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={p.nama_lengkap} className="h-7.5 w-7.5 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-white/10 shrink-0" />
                    ) : (
                      <span
                        className="flex h-7.5 w-7.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white text-[9px] sm:text-[11px] font-black shadow-sm"
                        style={{ background: avatarPalette[p.id % avatarPalette.length] }}
                      >
                        {getInitials(p.nama_lengkap)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] sm:text-[13px] font-bold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{p.nama_lengkap}</p>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 truncate">{p.institusi || "-"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8.5px] sm:text-[10px] font-bold ${
                        isDark ? "bg-[#00A5EC]/15 text-sky-300" : "bg-blue-50 text-blue-700"
                      }`}>
                        <Building2 className="w-2 h-2 sm:w-3 sm:h-3" />
                        {p.posisi_bidang}
                      </span>
                      <p className="mt-0.5 sm:mt-1 flex items-center justify-end gap-1 text-[8px] sm:text-[10px] text-slate-400">
                        <Calendar className="w-2 h-2 sm:w-3 sm:h-3" />
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