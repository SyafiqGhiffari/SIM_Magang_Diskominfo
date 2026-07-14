import { Users, ArrowRight } from "lucide-react";

const roleColor = {
  admin: "bg-blue-50 text-blue-600",
  mentor: "bg-violet-50 text-violet-600",
  peserta: "bg-emerald-50 text-emerald-600",
};

const UserManagementCard = ({ akunList }) => {
  const recent = akunList.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-5">
        <h3 className="text-sm font-black text-[#0B1442]">Manajemen User</h3>
        <a
          href="/admin/akun-manajemen"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          title="Kelola akun"
        >
          +
        </a>
      </div>

      <div className="px-5 pb-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Akun Terbaru</p>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Belum ada akun manajemen.</p>
        ) : (
          <div className="space-y-1">
            {recent.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors">
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] font-black">
                  {(u.nama || u.email).charAt(0).toUpperCase()}
                  {u.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
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
        className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-bold text-[#004F9F] hover:bg-slate-50 transition-colors"
      >
        <Users className="w-3.5 h-3.5" />
        Kelola Semua Akun
        <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
};

export default UserManagementCard;