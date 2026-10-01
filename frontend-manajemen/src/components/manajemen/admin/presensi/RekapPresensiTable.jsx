import { useState, Fragment } from "react";
import {
  Inbox,
  GraduationCap,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  UserX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
} from "lucide-react";
import { formatMenit } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";
import { getBidangColor } from "../../../../utils/bidangColor";

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
        className="h-8.5 w-8.5 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover border-[2px] sm:border-[3px] border-white shadow-md ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-8.5 w-8.5 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] sm:text-xs font-black border-[2px] sm:border-[3px] border-white shadow-md ring-2 ring-slate-300 transition-transform duration-200 group-hover:scale-110">
      {getInitials(nama)}
    </span>
  );
};

const Angka = ({ icon: Icon, value, cls, label }) => (
  <span
    title={label}
    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-bold shadow-2xs ${cls}`}
  >
    <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {value}
  </span>
);

const warnaPersen = (p, isDark) => {
  if (p >= 90) {
    return {
      bar: "from-emerald-400 to-emerald-600",
      text: isDark ? "text-emerald-400" : "text-emerald-600",
      track: isDark ? "bg-emerald-500/20 ring-1 ring-emerald-500/30" : "bg-emerald-100",
      badge: isDark ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-600 border-emerald-200",
      label: "Tinggi",
    };
  }
  if (p >= 75) {
    return {
      bar: "from-amber-400 to-amber-600",
      text: isDark ? "text-amber-400" : "text-amber-600",
      track: isDark ? "bg-amber-500/20 ring-1 ring-amber-500/30" : "bg-amber-100",
      badge: isDark ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-amber-50 text-amber-600 border-amber-200",
      label: "Cukup",
    };
  }
  return {
    bar: "from-rose-400 to-rose-600",
    text: isDark ? "text-rose-400" : "text-rose-600",
    track: isDark ? "bg-rose-500/20 ring-1 ring-rose-500/30" : "bg-rose-100",
    badge: isDark ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-rose-50 text-rose-600 border-rose-200",
    label: "Rendah",
  };
};

const SortableHeader = ({ label, columnKey, columnSort, setColumnSort, isDark, className = "" }) => {
  const isActive = columnSort?.key === columnKey;
  const direction = isActive ? columnSort.direction : null;

  const handleClick = () => {
    if (!isActive) setColumnSort({ key: columnKey, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: columnKey, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };

  return (
    <th className={`px-2 sm:px-4 py-2.5 sm:py-3.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center justify-between gap-1 w-full text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "text-[#00A5EC]"
              : "text-[#0B1442]"
            : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="truncate uppercase">{label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          {isActive ? (
            direction === "asc" ? (
              <ChevronUp className="w-3 h-3 text-[#00A5EC]" strokeWidth={3} />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#00A5EC]" strokeWidth={3} />
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-500" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </th>
  );
};

const RekapPresensiTable = ({ rows, onDetail, columnSort, setColumnSort, isDark = false }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px] sm:text-[13px]">
        <thead>
          <tr
            className={`border-b-2 bg-gradient-to-r ${
              isDark
                ? "border-white/10 from-white/5 via-white/[0.02] to-transparent"
                : "border-slate-100 from-slate-50 via-slate-50/70 to-white"
            }`}
          >
            {/* Peserta (Mobile & Desktop) */}
            <SortableHeader
              label="Peserta"
              columnKey="nama"
              columnSort={columnSort}
              setColumnSort={setColumnSort}
              isDark={isDark}
              className="w-[55%] sm:w-[25%]"
            />

            {/* Bidang (Desktop Only) */}
            <SortableHeader
              label="Bidang"
              columnKey="bidang"
              columnSort={columnSort}
              setColumnSort={setColumnSort}
              isDark={isDark}
              className="hidden sm:table-cell sm:w-[18%]"
            />

            {/* Rekap Kehadiran (Desktop Only - diperlebar) */}
            <SortableHeader
              label="Rekap Kehadiran"
              columnKey="rekap"
              columnSort={columnSort}
              setColumnSort={setColumnSort}
              isDark={isDark}
              className="hidden sm:table-cell sm:w-[26%]"
            />

            {/* Keterlambatan (Desktop Only) */}
            <SortableHeader
              label="Keterlambatan"
              columnKey="keterlambatan"
              columnSort={columnSort}
              setColumnSort={setColumnSort}
              isDark={isDark}
              className="hidden sm:table-cell sm:w-[13%]"
            />

            {/* Persentase (Mobile & Desktop) */}
            <SortableHeader
              label="Persentase"
              columnKey="persentase"
              columnSort={columnSort}
              setColumnSort={setColumnSort}
              isDark={isDark}
              className="w-[28%] sm:w-[10%]"
            />

            {/* Aksi (Mobile & Desktop) */}
            <th className="px-2 sm:px-4 py-2.5 sm:py-3.5 text-right w-[17%] sm:w-[8%]">
              <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                Aksi
              </span>
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-50"}`}>
          {rows.length === 0 ? (
            <tr className="animate-[fadeslide_0.3s_ease-out]">
              <td colSpan={6} className="px-4 sm:px-6 py-12 sm:py-16">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <span
                    className={`relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
                      isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                    }`}
                  >
                    <Inbox className="w-6 h-6" />
                    <span
                      className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-40 ${
                        isDark ? "border-white/10" : "border-slate-200"
                      }`}
                    />
                  </span>
                  <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Belum ada rekap untuk periode ini
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 max-w-sm">
                    Pilih bulan lain atau pastikan peserta magang sudah aktif pada bulan tersebut.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const persen = Math.round(r.persentase_kehadiran || 0);
              const w = warnaPersen(persen, isDark);
              const isExpanded = !!expandedRows[r.peserta_id];
              const bidangColor = getBidangColor(r.bidang);

              return (
                <Fragment key={r.peserta_id}>
                  <tr
                    className={`group transition-all duration-200 animate-[fadeslide_0.3s_ease-out] ${
                      isDark
                        ? "border-white/5 hover:bg-white/[0.02]"
                        : "border-slate-50 hover:bg-blue-50/30"
                    }`}
                    style={{ animationDelay: `${i * 25}ms`, animationFillMode: "backwards" }}
                  >
                    {/* 1. Peserta (Mobile & Desktop) */}
                    <td
                      className="px-2.5 sm:px-4 py-2.5 sm:py-3.5 cursor-pointer sm:cursor-default"
                      onClick={() => toggleRow(r.peserta_id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <PesertaAvatar nama={r.nama} foto={r.foto_peserta || r.foto_profil} />
                        <div className="min-w-0 max-w-[130px] sm:max-w-[170px]">
                          <div className="flex items-center gap-1">
                            <p
                              className={`font-bold text-[11px] sm:text-xs break-words line-clamp-2 sm:line-clamp-none leading-snug transition-colors duration-200 ${
                                isDark
                                  ? "text-slate-100 group-hover:text-[#00A5EC]"
                                  : "text-[#0B1442] group-hover:text-[#004F9F]"
                              }`}
                              title={r.nama}
                            >
                              {r.nama}
                            </p>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 block sm:hidden transition-transform duration-300 shrink-0 ${
                                isExpanded ? "rotate-180 text-[#00A5EC]" : ""
                              }`}
                            />
                          </div>
                          {r.institusi && (
                            <p className="hidden sm:flex items-center gap-1 text-[10.5px] text-slate-400 mt-0.5 truncate" title={r.institusi}>
                              <GraduationCap className="w-3 h-3 shrink-0" /> {r.institusi}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Bidang (Desktop Only) */}
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      {r.bidang ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black whitespace-nowrap shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                          style={isDark ? bidangColor.darkStyle : bidangColor.style}
                        >
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{r.bidang}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* 3. Rekap Kehadiran (Desktop Only - diperlebar) */}
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Angka
                          icon={CheckCircle2}
                          value={r.hadir}
                          label="Hadir"
                          cls={isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"}
                        />
                        <Angka
                          icon={Clock}
                          value={r.terlambat}
                          label="Terlambat"
                          cls={isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"}
                        />
                        <Angka
                          icon={FileText}
                          value={r.izin}
                          label="Izin"
                          cls={isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600"}
                        />
                        <Angka
                          icon={HeartPulse}
                          value={r.sakit}
                          label="Sakit"
                          cls={isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600"}
                        />
                        <Angka
                          icon={UserX}
                          value={r.alfa}
                          label="Alfa"
                          cls={isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600"}
                        />
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        dari {r.hari_kerja} hari kerja
                      </p>
                    </td>

                    {/* 4. Keterlambatan (Desktop Only) */}
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      <p className={`text-[11.5px] font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                        {formatMenit(r.total_menit_terlambat)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">total akumulasi</p>
                    </td>

                    {/* 5. Persentase (Mobile & Desktop) */}
                    <td className="px-2 sm:px-4 py-2.5 sm:py-3.5">
                      <div className="w-full sm:w-28">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] sm:text-[12.5px] font-black ${w.text}`}>
                            {persen}%
                          </span>
                          {persen < 75 ? (
                            <span className={`inline-flex items-center gap-0.5 rounded-md px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold border ${w.badge}`}>
                              <AlertTriangle className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />
                              <span>Rendah</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-0.5 rounded-md px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold border ${w.badge}`}>
                              <span>{w.label}</span>
                            </span>
                          )}
                        </div>
                        <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${w.track}`}>
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${w.bar} transition-all duration-700 ease-out`}
                            style={{ width: `${Math.min(persen, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 6. Aksi (Mobile & Desktop) */}
                    <td className="px-2 sm:px-4 py-2.5 sm:py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDetail(r)}
                        title="Lihat Detail Riwayat Kehadiran"
                        className={`group inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg sm:rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-300 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/30 hover:bg-blue-50/60 hover:text-[#004F9F]"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:scale-110" />
                      </button>
                    </td>
                  </tr>

                  {/* Mobile Collapsible Accordion Row */}
                  <tr className="table-row sm:hidden">
                    <td colSpan={3} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? "max-h-[300px] opacity-100 py-3 px-3.5 border-b border-dashed border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]"
                            : "max-h-0 opacity-0 p-0 border-none"
                        }`}
                      >
                        <div className="space-y-2 text-[10.5px]">
                          {/* Institusi */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <GraduationCap className="w-3 h-3 text-slate-400" /> Institusi:
                            </span>
                            <span className={`font-bold truncate max-w-[180px] ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                              {r.institusi || "-"}
                            </span>
                          </div>

                          {/* Bidang */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <Building2 className="w-3 h-3 text-slate-400" /> Bidang:
                            </span>
                            {r.bidang ? (
                              <span
                                className={`font-black rounded-lg px-2 py-0.5 text-[9.5px] shadow-xs ${bidangColor.bg} ${bidangColor.text}`}
                                style={isDark ? bidangColor.darkStyle : bidangColor.style}
                              >
                                {r.bidang}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>

                          {/* Rekap Kehadiran */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Kehadiran:</span>
                            <div className="flex flex-wrap items-center gap-1 justify-end">
                              <Angka
                                icon={CheckCircle2}
                                value={r.hadir}
                                label="Hadir"
                                cls={isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"}
                              />
                              <Angka
                                icon={Clock}
                                value={r.terlambat}
                                label="Terlambat"
                                cls={isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"}
                              />
                              <Angka
                                icon={FileText}
                                value={r.izin}
                                label="Izin"
                                cls={isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600"}
                              />
                              <Angka
                                icon={HeartPulse}
                                value={r.sakit}
                                label="Sakit"
                                cls={isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600"}
                              />
                              <Angka
                                icon={UserX}
                                value={r.alfa}
                                label="Alfa"
                                cls={isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600"}
                              />
                            </div>
                          </div>

                          {/* Keterlambatan */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-slate-400" /> Keterlambatan:
                            </span>
                            <div className="text-right">
                              <span className={`font-bold block ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                {formatMenit(r.total_menit_terlambat)}
                              </span>
                              <span className="text-[9px] text-slate-400 block -mt-0.5">total akumulasi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RekapPresensiTable;