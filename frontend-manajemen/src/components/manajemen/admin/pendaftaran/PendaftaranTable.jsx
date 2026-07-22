import { Landmark, Calendar, Inbox, Briefcase, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ActionsDropdown from "./ActionsDropdown";
import { getFileUrl } from "../../../../utils/fileUrl";
import { getBidangColor } from "../../../../utils/bidangColor";
import { isAllDocsApproved } from "../../../../utils/checkAllDocsApproved";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
const getInstitusi = (p) => (p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah) || "-";

const avatarPalette = [
  "linear-gradient(135deg, #0B1442, #00A5EC)",
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
  "linear-gradient(135deg, #dc2626, #ef4444)",
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");

const Avatar = ({ p }) => {
  const fotoUrl = getFileUrl(p.file_pas_foto);
  const sizeStyle = { height: "52px", width: "52px" };

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={p.nama_lengkap}
        style={sizeStyle}
        className="shrink-0 rounded-full object-cover border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
      />
    );
  }
  return (
    <span
      style={{ ...sizeStyle, background: avatarPalette[p.id % avatarPalette.length] }}
      className="flex shrink-0 items-center justify-center rounded-full text-white text-sm font-black border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
    >
      {getInitials(p.nama_lengkap)}
    </span>
  );
};

const columns = [
  { key: "nama_lengkap", label: "Nama Pendaftar" },
  { key: "institusi", label: "Institusi" },
  { key: "posisi_bidang", label: "Bidang" },
  { key: "created_at", label: "Tanggal Pengajuan" },
  { key: "status_pendaftaran", label: "Status Pendaftaran" },
];

const SortableHeader = ({ column, columnSort, setColumnSort }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;

  const handleClick = () => {
    if (!isActive) {
      setColumnSort({ key: column.key, direction: "asc" });
    } else if (direction === "asc") {
      setColumnSort({ key: column.key, direction: "desc" });
    } else {
      setColumnSort({ key: null, direction: null });
    }
  };

  return (
    <th className="px-2 py-3">
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-2 rounded-lg px-4 py-1.5 text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          isActive ? "bg-[#0B1442]/5 text-[#0B1442]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <span>{column.label}</span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
            isActive ? "bg-[#0B1442] shadow-sm" : "bg-transparent group-hover:bg-slate-200"
          }`}
        >
          {isActive && direction === "asc" ? (
            <ChevronUp className="w-3 h-3 text-white" strokeWidth={3} />
          ) : isActive && direction === "desc" ? (
            <ChevronDown className="w-3 h-3 text-white" strokeWidth={3} />
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const PendaftaranTable = ({ data, onReview, onVerifikasi, onBuatAkun, columnSort = { key: null, direction: null }, setColumnSort = () => {} }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white">
            {columns.map((col) => (
              <SortableHeader key={col.key} column={col} columnSort={columnSort} setColumnSort={setColumnSort} />
            ))}
            <th className="px-6 py-3 text-right">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-16">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <Inbox className="w-6 h-6" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Belum ada data pada kategori ini</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba ubah filter atau pilih tab status lainnya.</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((p) => {
              const bidangColor = getBidangColor(p.posisi_bidang);
              const isFinalStatus = p.status_pendaftaran === "diterima" || p.status_pendaftaran === "ditolak";
              const verifikasiDisabled = !isAllDocsApproved(p) || isFinalStatus;
              return (
                <tr key={p.id} className="group border-b border-slate-50 transition-colors duration-150 hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar p={p} />
                      <div className="min-w-0">
                        <p className="font-bold text-[#0B1442] truncate">{p.nama_lengkap}</p>
                        <p className="text-[11px] text-slate-400 truncate">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-[180px]">
                    <span className="group/inst inline-flex items-center gap-1.5 rounded-full border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11px] font-bold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30 max-w-full">
                      <Landmark className="w-3 h-3 shrink-0 transition-transform duration-300 group-hover/inst:scale-110" />
                      <span className="truncate">{getInstitusi(p)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`group/bdg inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bidangColor.bg} ${bidangColor.text}`}>
                      <Briefcase className="w-3 h-3 shrink-0 transition-transform duration-300 group-hover/bdg:rotate-12 group-hover/bdg:scale-110" />
                      {p.posisi_bidang || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="group/date inline-flex items-center gap-1.5 rounded-full border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-2.5 py-1 text-[11px] font-bold text-[#004F9F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#004F9F]/30">
                      <Calendar className="w-3 h-3 shrink-0 transition-transform duration-300 group-hover/date:scale-110" />
                      {fmtDate(p.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="transition-transform duration-200 hover:-translate-y-0.5 inline-block ">
                      <StatusBadge className="text-[11px]" status={p.status_pendaftaran} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionsDropdown
                      onReview={() => onReview(p)}
                      onVerifikasi={() => onVerifikasi(p)}
                      verifikasiDisabled={verifikasiDisabled}
                      isFinalStatus={isFinalStatus}
                      showBuatAkun={p.status_pendaftaran === "diterima"}
                      sudahPunyaAkun={Boolean(p.akun_peserta_id)}
                      onBuatAkun={() => onBuatAkun(p)}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendaftaranTable;