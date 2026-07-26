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

/* Avatar peserta — sama seperti pada tabel Data Presensi */
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
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[10px] font-black text-white shadow-sm transition-all duration-300 group-hover:scale-110">
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

const RekapMatrixTable = ({ rows, tanggalList = [], statusMap = {}, loading, onDetail }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Menyusun matriks kehadiran...
      </div>
    );
  }

  if (rows.length === 0 || tanggalList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
          <Inbox className="w-6 h-6" />
          <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
        </span>
        <p className="text-sm font-bold text-slate-500">Tidak ada hari kerja atau peserta pada periode ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6">
        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">Keterangan:</span>
        {KODE_LEGENDA.map((k) => (
          <span key={k} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-bold ${statusInfo(k).badge}`}>
            <span className="font-black">{PRESENSI_STATUS[k].kode}</span> {statusInfo(k).label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10.5px] font-bold text-slate-400 ring-1 ring-slate-200">
          <span className="font-black">–</span> Di luar periode magang
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/60">
              <th className="sticky left-0 z-10 border-b border-slate-100 bg-slate-50 px-6 py-3 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400 min-w-[240px]">
                Peserta
              </th>
              {tanggalList.map((t) => {
                const l = labelKolom(t);
                return (
                  <th key={t} className="border-b border-slate-100 px-1.5 py-2 text-center min-w-[38px]">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">{l.hari}</span>
                    <span className="block text-[11.5px] font-black text-slate-600">{l.tanggal}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.peserta_id}
                className="group animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
              >
                <td className="sticky left-0 z-10 border-b border-slate-50 bg-white px-6 py-2.5 transition-colors duration-200 group-hover:bg-blue-50/40">
                  <button
                    onClick={() => onDetail(r)}
                    className="flex items-center gap-3 text-left cursor-pointer"
                  >
                    <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                    <span className="min-w-0">
                      <p className="font-bold text-[#0B1442] transition-colors duration-200 group-hover:text-[#004F9F] truncate max-w-[170px]">{r.nama}</p>
                      <p className="text-[10.5px] text-slate-400 truncate max-w-[170px]">{r.bidang || "-"}</p>
                    </span>
                  </button>
                </td>
                {tanggalList.map((t) => {
                  const sel = statusMap[`${r.peserta_id}|${t}`];
                  // statusMap bisa berisi objek sel {status, menit_terlambat} atau string status
                  const st = typeof sel === "string" ? sel : sel?.status;
                  const aktif = dalamPeriodeMagang(r, t);

                  // Di luar periode magang & tidak ada data presensi -> sel dinonaktifkan
                  if (!aktif && !st) {
                    return (
                      <td key={t} className="border-b border-slate-50 bg-slate-50/40 px-1 py-2 text-center transition-colors duration-200 group-hover:bg-blue-50/20">
                        <span
                          title={`${r.nama} — ${t} — Di luar periode magang`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black text-slate-300 cursor-default"
                        >
                          –
                        </span>
                      </td>
                    );
                  }

                  const info = PRESENSI_STATUS[st] || PRESENSI_STATUS.belum;
                  const telat = typeof sel === "object" && sel?.menit_terlambat > 0 ? ` (+${sel.menit_terlambat} mnt)` : "";

                  return (
                    <td key={t} className="border-b border-slate-50 px-1 py-2 text-center transition-colors duration-200 group-hover:bg-blue-50/40">
                      <span
                        title={`${r.nama} — ${t} — ${info.label}${telat}`}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black transition-all duration-200 hover:scale-125 hover:shadow-md cursor-default ${info.cell}`}
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