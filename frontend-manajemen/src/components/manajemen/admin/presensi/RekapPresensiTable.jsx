import { useState } from "react";
import { Inbox, GraduationCap, Building2, Eye, CheckCircle2, Clock, FileText, HeartPulse, UserX, AlertTriangle } from "lucide-react";
import { formatMenit } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const PesertaAvatar = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  if (url && !error) {
    return (
      <img
        src={url}
        alt={nama}
        onError={() => setError(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] font-black shadow-sm transition-all duration-300 group-hover:scale-110">
      {getInitials(nama)}
    </span>
  );
};

const Angka = ({ icon: Icon, value, cls }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${cls}`}>
    <Icon className="w-2.5 h-2.5" /> {value}
  </span>
);

const warnaPersen = (p) => {
  if (p >= 90) return { bar: "from-emerald-500 to-emerald-600", text: "text-emerald-600", track: "bg-emerald-100" };
  if (p >= 75) return { bar: "from-amber-500 to-amber-600", text: "text-amber-600", track: "bg-amber-100" };
  return { bar: "from-rose-500 to-rose-600", text: "text-rose-600", track: "bg-rose-100" };
};

const HEADER = ["Peserta", "Bidang", "Rekap Kehadiran", "Keterlambatan", "Persentase"];

const RekapPresensiTable = ({ rows, onDetail }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[940px] text-left text-[13px]">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60">
          {HEADER.map((h) => (
            <th key={h} className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">{h}</th>
          ))}
          <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr className="animate-[fadeslide_0.3s_ease-out]">
            <td colSpan={6} className="px-6 py-16">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Inbox className="w-6 h-6" />
                  <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                </span>
                <p className="text-sm font-bold text-slate-500">Belum ada rekap untuk periode ini</p>
                <p className="text-xs text-slate-400 max-w-sm">Pilih bulan lain atau pastikan peserta magang sudah aktif pada bulan tersebut.</p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((r, i) => {
            const persen = Math.round(r.persentase_kehadiran || 0);
            const w = warnaPersen(persen);
            return (
              <tr
                key={r.peserta_id}
                className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                    <div className="min-w-0">
                      <p className="font-bold text-[#0B1442] transition-colors duration-200 group-hover:text-[#004F9F] truncate">{r.nama}</p>
                      {r.institusi && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <GraduationCap className="w-3 h-3 shrink-0" /> {r.institusi}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="group/bdg inline-flex items-center gap-1.5 rounded-lg border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30">
                    <Building2 className="w-3.5 h-3.5 shrink-0 self-center transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                    {r.bidang || "-"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Angka icon={CheckCircle2} value={r.hadir} cls="bg-emerald-50 text-emerald-600" />
                    <Angka icon={Clock} value={r.terlambat} cls="bg-amber-50 text-amber-600" />
                    <Angka icon={FileText} value={r.izin} cls="bg-sky-50 text-sky-600" />
                    <Angka icon={HeartPulse} value={r.sakit} cls="bg-violet-50 text-violet-600" />
                    <Angka icon={UserX} value={r.alfa} cls="bg-rose-50 text-rose-600" />
                  </div>
                  <p className="mt-1.5 text-[10.5px] font-semibold text-slate-400">dari {r.hari_kerja} hari kerja</p>
                </td>

                <td className="px-6 py-4">
                  <p className="text-[12px] font-bold text-[#0B1442]">{formatMenit(r.total_menit_terlambat)}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">total akumulasi</p>
                </td>

                <td className="px-6 py-4">
                  <div className="w-32">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] font-black ${w.text}`}>{persen}%</span>
                      {persen < 75 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600">
                          <AlertTriangle className="w-2.5 h-2.5" /> Rendah
                        </span>
                      )}
                    </div>
                    <div className={`mt-1.5 h-1.5 w-full overflow-hidden rounded-full ${w.track}`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${w.bar} transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(persen, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => onDetail(r)}
                      className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                      Riwayat
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default RekapPresensiTable;