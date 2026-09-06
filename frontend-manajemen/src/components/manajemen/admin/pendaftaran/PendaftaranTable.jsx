import { useState } from "react";
import { Landmark, Calendar, Inbox, Building2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={p.nama_lengkap}
        className="h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 rounded-full object-cover border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
      />
    );
  }
  return (
    <span
      style={{ background: avatarPalette[p.id % avatarPalette.length] }}
      className="flex h-8.5 w-8.5 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full text-white text-[10px] sm:text-sm font-black border-[2px] sm:border-[3px] border-white shadow-lg ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
    >
      {getInitials(p.nama_lengkap)}
    </span>
  );
};

const columns = [
  { key: "nama_lengkap", label: "Nama Pendaftar" },
  { key: "institusi", label: "Institusi" },
  { key: "posisi_bidang", label: "Bidang" },
  { key: "created_at", label: "Pengajuan" },
  { key: "status_pendaftaran", label: "Status Pendaftaran" },
];

const SortableHeader = ({ column, columnSort, setColumnSort, isDark, className = "" }) => {
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
    <th className={`px-1 sm:px-2 py-2.5 sm:py-3 ${className}`}>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "bg-white/10 text-slate-200"
              : "bg-[#0B1442]/5 text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <span className="truncate">{column.label}</span>
        <span
          className={`flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
            isActive ? "bg-[#004F9F] shadow-sm" : (isDark ? "bg-transparent group-hover:bg-white/5" : "bg-transparent group-hover:bg-slate-200")
          }`}
        >
          {isActive && direction === "asc" ? (
            <ChevronUp className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : isActive && direction === "desc" ? (
            <ChevronDown className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : (
            <ChevronsUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const getColumnWidthClass = (key) => {
  if (key === "nama_lengkap") return "w-[25%] sm:w-[25%] sm:max-w-[240px]";
  if (key === "institusi") return "w-[20%] sm:w-[20%] sm:max-w-[160px]";
  if (key === "posisi_bidang") return "w-[20%] sm:w-[20%] sm:max-w-[180px]";
  if (key === "created_at") return "w-[15%] sm:w-[17%] sm:max-w-[140px]";
  if (key === "status_pendaftaran") return "w-[20%] sm:w-[18%] sm:max-w-[160px]";
  return "";
};

const PendaftaranTable = ({ data, onReview, onVerifikasi, onBuatAkun, onSurat = () => {}, suratMap = {}, columnSort = { key: null, direction: null }, setColumnSort = () => {}, isDark }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isMobileHidden = (key) => {
    return key === "institusi" || key === "posisi_bidang" || key === "created_at";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px] sm:text-[13px]">
        <thead>
          <tr className={`border-b-2 bg-gradient-to-r ${isDark ? "border-white/10 from-white/5 via-white/[0.02] to-transparent" : "border-slate-100 from-slate-50 via-slate-50/70 to-white"}`}>
            {columns.map((col) => {
              const hiddenClass = isMobileHidden(col.key) ? "hidden sm:table-cell" : "";
              const widthClass = getColumnWidthClass(col.key);
              const combinedClass = `${hiddenClass} ${widthClass}`.trim();
              const label = col.key === "status_pendaftaran" ? (
                <>
                  <span className="inline sm:hidden">Status</span>
                  <span className="hidden sm:inline">Status</span>
                </>
              ) : col.label;
              return (
                <SortableHeader
                  key={col.key}
                  column={{ ...col, label }}
                  columnSort={columnSort}
                  setColumnSort={setColumnSort}
                  isDark={isDark}
                  className={combinedClass}
                />
              );
            })}
            <th className="px-2 sm:px-6 py-3 text-right">
              <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className="animate-[fadeslide_0.3s_ease-out]">
              <td colSpan={6} className="px-4 sm:px-6 py-10 sm:py-16">
                <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center">
                  <span className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl ${
                    isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                  }`}>
                    <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className={`absolute inset-0 animate-ping rounded-xl sm:rounded-2xl border-2 opacity-40 ${
                      isDark ? "border-white/10" : "border-slate-200"
                    }`} />
                  </span>
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Belum ada data yang sesuai</p>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 max-w-[260px] sm:max-w-none">Coba ubah filter atau pilih tab status lainnya.</p>
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
                <>
                  <tr key={p.id} className={`group border-b transition-colors duration-150 ${isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-slate-50 hover:bg-slate-50/70"}`}>
                    <td
                      className={`px-2 sm:px-6 py-2.5 sm:py-4 cursor-pointer sm:cursor-default ${getColumnWidthClass("nama_lengkap")}`}
                      onClick={() => toggleRow(p.id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar p={p} />
                        <div className="min-w-0 text-left flex-1">
                          <div className="flex items-center gap-1">
                            <p className={`font-bold text-[11px] sm:text-[13px] leading-tight break-words line-clamp-2 sm:line-clamp-none transition-colors duration-200 ${isDark ? "text-slate-200 group-hover:text-[#00A5EC]" : "text-[#0B1442] group-hover:text-[#004F9F]"}`}>{p.nama_lengkap}</p>
                            <ChevronDown className={`w-3 h-3 text-slate-400 block sm:hidden transition-transform duration-200 shrink-0 ${expandedRows[p.id] ? "rotate-180 text-[#00A5EC]" : ""}`} />
                          </div>
                          <p className={`text-[9.5px] sm:text-[11px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`hidden sm:table-cell px-2 sm:px-4 py-2.5 sm:py-4 text-slate-500 ${getColumnWidthClass("institusi")}`}>
                      <span className={`group/inst inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md max-w-full ${
                        isDark
                          ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                          : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                      }`}>
                        <Landmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/inst:scale-110" />
                        <span className="whitespace-normal break-words leading-relaxed text-left">{getInstitusi(p)}</span>
                      </span>
                    </td>
                    <td className={`hidden sm:table-cell px-2 sm:px-6 py-2.5 sm:py-4 ${getColumnWidthClass("posisi_bidang")}`}>
                      <span
                        className={`group/bdg inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black whitespace-nowrap shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                        style={isDark ? bidangColor.darkStyle : bidangColor.style}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{p.posisi_bidang || "-"}</span>
                      </span>
                    </td>
                    <td className={`hidden sm:table-cell px-2 sm:px-6 py-2.5 sm:py-4 text-slate-500 ${getColumnWidthClass("created_at")}`}>
                      <span className={`group/date inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        isDark
                          ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                          : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                      }`}>
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/date:scale-110" />
                        {fmtDate(p.created_at)}
                      </span>
                    </td>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 ${getColumnWidthClass("status_pendaftaran")}`}>
                      <div className="transition-transform duration-200 hover:-translate-y-0.5 inline-block ">
                        <StatusBadge className="text-[9.5px] sm:text-[11px]" status={p.status_pendaftaran} />
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2.5 sm:py-4 text-right">
                      <ActionsDropdown
                        onReview={() => onReview(p)}
                        onVerifikasi={() => onVerifikasi(p)}
                        verifikasiDisabled={verifikasiDisabled}
                        isFinalStatus={isFinalStatus}
                        showBuatAkun={p.status_pendaftaran === "diterima"}
                        sudahPunyaAkun={Boolean(p.akun_peserta_id)}
                        onBuatAkun={() => onBuatAkun(p)}
                        showSurat={p.status_pendaftaran === "diterima"}
                        suratSudahAda={Boolean(suratMap[p.id])}
                        onSurat={() => onSurat(p)}
                        isDark={isDark}
                      />
                    </td>
                  </tr>

                  {/* Mobile Collapsible details row with transition animation */}
                  <tr className="table-row sm:hidden">
                    <td colSpan={3} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedRows[p.id]
                            ? "max-h-[200px] opacity-100 py-3 px-4 border-b border-dashed dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]"
                            : "max-h-0 opacity-0 p-0 border-none"
                        }`}
                      >
                        <div className="space-y-2 text-left">
                          {/* Institusi */}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Institusi</span>
                            <span className={`group/inst inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md max-w-[70%] ${
                              isDark
                                ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                                : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                            }`}>
                              <Landmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/inst:scale-110" />
                              <span className="whitespace-normal break-words leading-relaxed text-left">{getInstitusi(p)}</span>
                            </span>
                          </div>
                          {/* Bidang */}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bidang Penempatan</span>
                            <span
                              className={`group/bdg inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black shadow-sm ${bidangColor.bg} ${bidangColor.text}`}
                              style={isDark ? bidangColor.darkStyle : bidangColor.style}
                            >
                              <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              {p.posisi_bidang || "-"}
                            </span>
                          </div>
                          {/* Tanggal Pengajuan */}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Pengajuan</span>
                            <span className={`group/date inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                              isDark
                                ? "border-[#004F9F]/30 bg-white text-[#004F9F]"
                                : "border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 text-[#004F9F] hover:border-[#004F9F]/30"
                            }`}>
                              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-transform duration-300 group-hover/date:scale-110" />
                              {fmtDate(p.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendaftaranTable;