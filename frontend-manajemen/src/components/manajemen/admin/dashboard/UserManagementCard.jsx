import { Users, ArrowRight, Plus } from "lucide-react";

const roleColor = {
  admin: "bg-blue-50 text-blue-600",
  mentor: "bg-violet-50 text-violet-600",
  peserta: "bg-emerald-50 text-emerald-600",
};

const UserManagementCard = ({ akunList }) => {
  const recent = akunList.slice(0, 12);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white">
            <Users className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-black text-[#0B1442]">Manajemen User</h3>
        </div>
        <a
          href="/admin/akun-manajemen"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1442] text-white transition-all duration-200 hover:bg-[#1E3A8A] hover:scale-110 active:scale-95"
          title="Tambah akun"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-3 pt-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Akun Terbaru</p>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Belum ada akun manajemen.</p>
        ) : (
          <div className="space-y-1">
            {recent.map((u) => (
              <div key={u.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-200 hover:bg-slate-50 hover:translate-x-0.5">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] font-black shadow-sm transition-transform duration-200 group-hover:scale-105">
                  {(u.nama || u.email).charAt(0).toUpperCase()}
                  {u.is_online && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0B1442] truncate">{u.nama || u.email}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${roleColor[u.role] || "bg-slate-100 text-slate-500"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <a
        href="/admin/akun-manajemen"
        className="shrink-0 group/link flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-bold text-[#004F9F] transition-colors hover:bg-slate-50"
      >
        Kelola Semua Akun
        <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover/link:translate-x-1" />
      </a>
    </div>
  );
};

export default UserManagementCard;