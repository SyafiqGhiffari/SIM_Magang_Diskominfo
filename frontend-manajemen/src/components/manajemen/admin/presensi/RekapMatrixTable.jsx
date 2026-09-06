import { useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { PRESENSI_STATUS, statusInfo } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";

const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const labelKolom = (tgl) => {
  const d = new Date(`${tgl}T00:00:00`);
  return { hari: HARI_SINGKAT[d.getDay()], tanggal: String(d.getDate()).padStart(2, "0") };
};

const KODE_LEGENDA = ["hadir", "terlambat", "izin", "sakit", "alfa", "belum"];

/* Inisial nama (fallback bila foto tidak ada) */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Avatar peserta */
const PesertaAvatar = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  if (url && !error) {
    return (
      <img
        src={url}
        alt={nama}
        onError={() => setError(true)}
        className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[9px] sm:text-[10px] font-black text-white shadow-sm transition-all duration-300 group-hover:scale-110">
      {getInitials(nama)}
    </span>
  );
};

/* Cek apakah tanggal berada di dalam periode magang peserta */
const dalamPeriodeMagang = (r, tgl) => {
  const mulai = (r.tanggal_mulai || "").slice(0, 10);
  const selesai = (r.tanggal_selesai || "").slice(0, 10);
  if (mulai && tgl < mulai) return false;
  if (selesai && tgl > selesai) return false;
  return true;
};

const RekapMatrixTable = ({ rows, tanggalList = [], statusMap = {}, loading, onDetail, isDark = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-xs sm:text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-[#00A5EC]" /> Menyusun matriks kehadiran...
      </div>
    );
  }

  if (rows.length === 0 || tanggalList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className={`relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
          isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
        }`}>
          <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
            isDark ? "border-white/10" : "border-slate-200"
          }`} />
        </span>
        <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Tidak ada hari kerja atau peserta pada periode ini
        </p>
      </div>
    );
  }

  return (
    <div className="pt-2 sm:pt-3 space-y-2.5 sm:space-y-3">
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 px-3.5 sm:px-6">
        <span className="text-[8.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
          Keterangan:
        </span>
        {KODE_LEGENDA.map((k) => (
          <span
            key={k}
            className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8.5px] sm:text-[10.5px] font-bold ${
              statusInfo(k).badge
            }`}
          >
            <span className="font-black">{PRESENSI_STATUS[k].kode}</span> {statusInfo(k).label}
          </span>
        ))}
        <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8.5px] sm:text-[10.5px] font-bold ${
          isDark ? "bg-white/5 text-slate-400 ring-1 ring-white/10" : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
        }`}>
          <span className="font-black">–</span> Di luar periode magang
        </span>
      </div>

      <div className="overflow-x-auto animate-[fadeslide_0.3s_ease-out]">
        <table className="w-full text-left text-[11px] sm:text-[12px] border-separate border-spacing-0">
          <thead>
            <tr className={isDark ? "bg-white/[0.02]" : "bg-slate-50/60"}>
              <th className={`sticky left-0 z-20 border-b px-3 sm:px-6 py-2 sm:py-3 text-left text-[8.5px] sm:text-[10.5px] font-black uppercase tracking-wider min-w-[150px] sm:min-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.6)] ${
                isDark ? "border-white/10 bg-[#161b22] text-slate-400" : "border-slate-100 bg-slate-50 text-slate-400"
              }`}>
                Peserta
              </th>
              {tanggalList.map((t) => {
                const l = labelKolom(t);
                return (
                  <th key={t} className={`border-b px-0.5 sm:px-1.5 py-1 sm:py-2 text-center min-w-[28px] sm:min-w-[38px] ${
                    isDark ? "border-white/10" : "border-slate-100"
                  }`}>
                    <span className="block text-[7.5px] sm:text-[9px] font-bold uppercase text-slate-400">{l.hari}</span>
                    <span className={`block text-[9.5px] sm:text-[11.5px] font-black ${isDark ? "text-slate-300" : "text-slate-600"}`}>{l.tanggal}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.peserta_id}
                className="group"
              >
                <td className={`sticky left-0 z-10 border-b px-3 sm:px-6 py-1.5 sm:py-2.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.6)] transition-colors duration-200 ${
                  isDark
                    ? "border-white/5 bg-[#161b22] group-hover:bg-[#1c232d]"
                    : "border-slate-50 bg-white group-hover:bg-slate-50"
                }`}>
                  <button
                    onClick={() => onDetail(r)}
                    className="flex items-center gap-2 sm:gap-3 text-left cursor-pointer"
                  >
                    <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                    <span className="min-w-0">
                      <p className={`font-bold text-[10.5px] sm:text-xs truncate max-w-[95px] sm:max-w-[170px] transition-colors duration-200 ${
                        isDark ? "text-slate-100 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"
                      }`}>
                        {r.nama}
                      </p>
                      <p className="text-[8.5px] sm:text-[10px] text-slate-400 truncate max-w-[95px] sm:max-w-[170px]">{r.bidang || "-"}</p>
                    </span>
                  </button>
                </td>
                {tanggalList.map((t) => {
                  const sel = statusMap[`${r.peserta_id}|${t}`];
                  const st = typeof sel === "string" ? sel : sel?.status;
                  const aktif = dalamPeriodeMagang(r, t);

                  if (!aktif && !st) {
                    return (
                      <td key={t} className={`border-b px-0.5 sm:px-1 py-1.5 sm:py-2 text-center transition-colors duration-200 ${
                        isDark ? "border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03]" : "border-slate-50 bg-slate-50/40 group-hover:bg-blue-50/20"
                      }`}>
                        <span
                          title={`${r.nama} — ${t} — Di luar periode magang`}
                          className="inline-flex h-4.5 w-4.5 sm:h-6 sm:w-6 items-center justify-center rounded-md sm:rounded-lg text-[8.5px] sm:text-[11px] font-black text-slate-400/40 cursor-default"
                        >
                          –
                        </span>
                      </td>
                    );
                  }

                  const info = PRESENSI_STATUS[st] || PRESENSI_STATUS.belum;
                  const telat = typeof sel === "object" && sel?.menit_terlambat > 0 ? ` (+${sel.menit_terlambat} mnt)` : "";

                  return (
                    <td key={t} className={`border-b px-0.5 sm:px-1 py-1.5 sm:py-2 text-center transition-colors duration-200 ${
                      isDark ? "border-white/5 group-hover:bg-white/[0.04]" : "border-slate-50 group-hover:bg-blue-50/40"
                    }`}>
                      <span
                        title={`${r.nama} — ${t} — ${info.label}${telat}`}
                        className={`inline-flex h-4.5 w-4.5 sm:h-6 sm:w-6 items-center justify-center rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black transition-all duration-200 hover:scale-125 hover:shadow-md cursor-default ${info.cell}`}
                      >
                        {info.kode}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RekapMatrixTable;