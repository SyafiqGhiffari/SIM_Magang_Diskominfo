import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  GraduationCap,
  Inbox,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import PesertaBimbinganActionsDropdown from "./PesertaBimbinganActionsDropdown";

const formatDateShort = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return { totalDays: 0, daysPassed: 0, progressPercent: 0 };
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const diffTimeTotal = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(diffTimeTotal / (1000 * 60 * 60 * 24)));

    let daysPassed = 0;
    if (now > start) {
      const diffTimePassed = now.getTime() - start.getTime();
      daysPassed = Math.min(totalDays, Math.round(diffTimePassed / (1000 * 60 * 60 * 24)));
    }

    const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

    return { totalDays, daysPassed, progressPercent };
  } catch {
    return { totalDays: 0, daysPassed: 0, progressPercent: 0 };
  }
};

const TABLE_COLUMNS = [
  { key: "nama_lengkap", label: "Peserta Bimbingan", className: "min-w-[210px] sm:min-w-[230px]" },
  { key: "institusi", label: "Institusi & Jurusan", className: "min-w-[160px] sm:min-w-[170px]" },
  { key: "tanggal_mulai", label: "Periode Magang", className: "min-w-[170px] sm:min-w-[185px]" },
  { key: "kehadiran", label: "Kehadiran", className: "text-center min-w-[85px] sm:min-w-[95px]" },
  { key: "nilai", label: "Laporan & Nilai", className: "text-center min-w-[105px] sm:min-w-[115px]" },
  { key: "status_magang", label: "Status", className: "text-center min-w-[95px] sm:min-w-[105px]" },
];

const SortableHeader = ({ column, columnSort, setColumnSort, isDark, className = "" }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;
  const isCentered = className.includes("text-center");

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
    <th className={`py-2.5 sm:py-3 px-1.5 sm:px-2 select-none ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center ${
          isCentered ? "justify-center mx-auto" : "justify-between w-full"
        } gap-1 sm:gap-1.5 rounded-lg px-1.5 sm:px-2 py-1 text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          isActive
            ? isDark
              ? "bg-white/10 text-slate-100"
              : "bg-[#0B1442]/5 text-[#0B1442]"
            : isDark
            ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <span className="truncate">{column.label}</span>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
            isActive
              ? "bg-[#004F9F] shadow-xs text-white"
              : isDark
              ? "bg-transparent group-hover:bg-white/5"
              : "bg-transparent group-hover:bg-slate-200"
          }`}
        >
          {isActive && direction === "asc" ? (
            <ChevronUp className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : isActive && direction === "desc" ? (
            <ChevronDown className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          ) : (
            <ChevronsUpDown
              className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-500"
              strokeWidth={2.5}
            />
          )}
        </span>
      </button>
    </th>
  );
};

export const PesertaBimbinganTable = ({
  list = [],
  onSelect,
  dk,
  mentorNama,
  columnSort: externalColumnSort,
  setColumnSort: externalSetColumnSort,
}) => {
  const navigate = useNavigate();
  const [internalColumnSort, setInternalColumnSort] = useState({ key: null, direction: null });

  const columnSort = externalColumnSort !== undefined ? externalColumnSort : internalColumnSort;
  const setColumnSort = externalSetColumnSort !== undefined ? externalSetColumnSort : setInternalColumnSort;

  const sortedList = useMemo(() => {
    if (!columnSort.key || !columnSort.direction) return list;

    return [...list].sort((a, b) => {
      let comparison = 0;

      if (columnSort.key === "nama_lengkap") {
        const valA = (a.nama_lengkap || "").toString().toLowerCase();
        const valB = (b.nama_lengkap || "").toString().toLowerCase();
        comparison = valA.localeCompare(valB, "id");
      } else if (columnSort.key === "institusi") {
        const valA = (a.institusi || "").toString().toLowerCase();
        const valB = (b.institusi || "").toString().toLowerCase();
        comparison = valA.localeCompare(valB, "id");
        if (comparison === 0) {
          const jurA = (a.jurusan || "").toString().toLowerCase();
          const jurB = (b.jurusan || "").toString().toLowerCase();
          comparison = jurA.localeCompare(jurB, "id");
        }
      } else if (columnSort.key === "tanggal_mulai") {
        const timeA = a.tanggal_mulai ? new Date(a.tanggal_mulai).getTime() : 0;
        const timeB = b.tanggal_mulai ? new Date(b.tanggal_mulai).getTime() : 0;
        comparison = timeA - timeB;
      } else if (columnSort.key === "kehadiran") {
        const valA = parseFloat(a.persentase_kehadiran) || 0;
        const valB = parseFloat(b.persentase_kehadiran) || 0;
        comparison = valA - valB;
      } else if (columnSort.key === "nilai") {
        const numA = a.nilai_akhir_angka != null ? parseFloat(a.nilai_akhir_angka) : -1;
        const numB = b.nilai_akhir_angka != null ? parseFloat(b.nilai_akhir_angka) : -1;
        comparison = numA - numB;
      } else if (columnSort.key === "status_magang") {
        const valA = (a.status_magang || "").toString().toLowerCase();
        const valB = (b.status_magang || "").toString().toLowerCase();
        comparison = valA.localeCompare(valB, "id");
      }

      return columnSort.direction === "asc" ? comparison : -comparison;
    });
  }, [list, columnSort]);

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-xs ${
        dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header ala Role Admin dengan Fitur Sort */}
          <thead
            className={`border-b text-[9.5px] sm:text-[10px] uppercase font-black tracking-wider select-none ${
              dk
                ? "border-white/10 bg-white/[0.02] text-slate-400"
                : "border-slate-100 bg-slate-50/60 text-slate-400"
            }`}
          >
            <tr>
              <th className="py-2.5 sm:py-3 px-2 text-center w-10 min-w-[40px] text-slate-400">No</th>
              {TABLE_COLUMNS.map((col) => (
                <SortableHeader
                  key={col.key}
                  column={col}
                  columnSort={columnSort}
                  setColumnSort={setColumnSort}
                  isDark={dk}
                  className={col.className}
                />
              ))}
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center w-14 min-w-[56px] text-slate-400">Aksi</th>
            </tr>
          </thead>

          {/* Table Body ala Role Admin */}
          <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-slate-50"}`}>
            {sortedList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        dk ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      <Inbox className="w-6 h-6" />
                    </span>
                    <p className={`text-xs font-bold ${dk ? "text-slate-400" : "text-slate-500"}`}>
                      Tidak ada peserta bimbingan
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedList.map((peserta, idx) => {
                const fotoSrc = peserta.foto_profil ? getFileUrl(peserta.foto_profil) : null;
                const inisial = (peserta.nama_lengkap || "P")
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();

                const isMahasiswa = peserta.kategori_pendaftar === "mahasiswa";
                const duration = calculateDurationDays(peserta.tanggal_mulai, peserta.tanggal_selesai);

                const cleanPhone = (peserta.nomor_hp || "").replace(/\D/g, "");
                const waNumber = cleanPhone.startsWith("0")
                  ? "62" + cleanPhone.slice(1)
                  : cleanPhone.startsWith("62")
                  ? cleanPhone
                  : "62" + cleanPhone;

                const waGreeting = encodeURIComponent(
                  `Halo ${peserta.nama_lengkap}, saya ${mentorNama || "Pembimbing Lapangan"} dari Dinas Komunikasi dan Informatika Kabupaten Ponorogo.`
                );
                const waLink = cleanPhone ? `https://wa.me/${waNumber}?text=${waGreeting}` : null;

                const handlePenilaianClick = (p) => {
                  navigate("/mentor/penilaian", {
                    state: {
                      pesertaId: p.akun_peserta_id || p.id,
                      nama: p.nama_lengkap,
                    },
                  });
                };

                const totalHadir = peserta.presensi_stats?.total_hadir || 0;
                const totalHari = peserta.presensi_stats?.total_hari || 0;

                return (
                  <tr
                    key={peserta.id || idx}
                    className={`group border-b transition-colors duration-150 ${
                      dk
                        ? "border-white/5 hover:bg-white/[0.02]"
                        : "border-slate-50 hover:bg-blue-50/30"
                    }`}
                  >
                    {/* Column 1: No */}
                    <td className="py-3.5 px-2 text-center text-slate-400 font-bold text-xs w-10">
                      {idx + 1}
                    </td>

                    {/* Column 2: Profil & Identitas (Avatar Diperbesar & Badge Mahasiswa di Atas Nama) */}
                    <td className="py-3.5 px-2.5 sm:px-3 min-w-[210px] sm:min-w-[230px]">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="relative shrink-0">
                          {fotoSrc ? (
                            <img
                              src={fotoSrc}
                              alt={peserta.nama_lengkap}
                              className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200/80 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-xs sm:text-sm font-black border-[2px] sm:border-[2.5px] border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200/80 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105">
                              {inisial}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Badge Jenjang di Atas Nama */}
                          <div className="mb-1">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                              {isMahasiswa ? "Mahasiswa" : "Siswa SMK"}
                            </span>
                          </div>

                          <p
                            className={`font-extrabold text-xs sm:text-[12.5px] leading-snug transition-colors duration-200 truncate ${
                              dk
                                ? "text-slate-100 group-hover:text-[#00A5EC]"
                                : "text-[#0B1442] group-hover:text-[#004F9F]"
                            }`}
                            title={peserta.nama_lengkap}
                          >
                            {peserta.nama_lengkap}
                          </p>

                          <p className="text-[10px] sm:text-[10.5px] text-slate-400 mt-0.5 font-medium">
                            <span className="font-semibold text-slate-400">
                              {isMahasiswa ? "NIM:" : "NISN:"}
                            </span>{" "}
                            {peserta.nim_nisn || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Institusi & Jurusan */}
                    <td className="py-3.5 px-2.5 sm:px-3 min-w-[160px] sm:min-w-[170px]">
                      <p
                        className="font-bold text-xs sm:text-[12px] text-slate-800 dark:text-slate-200 truncate"
                        title={peserta.institusi}
                      >
                        {peserta.institusi || "-"}
                      </p>
                      <div
                        className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-semibold text-[#004F9F] dark:text-sky-400 mt-0.5 truncate"
                        title={peserta.jurusan}
                      >
                        <GraduationCap className="w-3 h-3 shrink-0 text-[#004F9F]/70 dark:text-sky-400/70" />
                        <span className="truncate">
                          {peserta.jurusan || (isMahasiswa ? "Program Studi" : "Kompetensi Keahlian")}
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Periode Magang */}
                    <td className="py-3.5 px-2.5 sm:px-3 min-w-[170px] sm:min-w-[185px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">
                            {formatDateShort(peserta.tanggal_mulai)} - {formatDateShort(peserta.tanggal_selesai)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 sm:w-28 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[#004F9F] dark:bg-[#0072CE] rounded-full transition-all duration-500"
                              style={{ width: `${duration.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9.5px] font-extrabold text-[#004F9F] dark:text-sky-400">
                            {duration.progressPercent}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Kehadiran */}
                    <td className="py-3.5 px-2 sm:px-3 text-center min-w-[85px] sm:min-w-[95px]">
                      <span className="inline-flex items-center font-black text-xs sm:text-[13px] text-emerald-600 dark:text-emerald-400">
                        {Math.round(peserta.persentase_kehadiran || 0)}%
                      </span>
                      <span className="block text-[9.5px] text-slate-400 mt-0.5 font-medium">
                        {totalHadir}/{totalHari} Hari
                      </span>
                    </td>

                    {/* Column 6: Laporan & Nilai (Flex Col agar Belum Dinilai Selalu di Bawah) */}
                    <td className="py-3.5 px-2 sm:px-3 text-center min-w-[105px] sm:min-w-[115px]">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[8.5px] sm:text-[9px] font-bold whitespace-nowrap ${
                            peserta.file_laporan_akhir
                              ? "bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20"
                              : "bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200/60 dark:border-white/5"
                          }`}
                        >
                          {peserta.file_laporan_akhir ? "Laporan Diunggah" : "Laporan (-)"}
                        </span>
                        {peserta.nilai_akhir_angka != null ? (
                          <span className="block text-xs font-black text-slate-800 dark:text-white whitespace-nowrap">
                            {peserta.nilai_akhir_angka}{" "}
                            <span className="text-[10px] font-bold text-slate-400">
                              ({peserta.indeks_nilai_akhir || "-"})
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 whitespace-nowrap">
                            <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            </span>
                            Belum Dinilai
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 7: Status */}
                    <td className="py-3.5 px-2 sm:px-3 text-center min-w-[95px] sm:min-w-[105px]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold whitespace-nowrap ${
                          peserta.status_magang === "selesai"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                          {peserta.status_magang !== "selesai" && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                          )}
                          <span
                            className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                              peserta.status_magang === "selesai" ? "bg-purple-500" : "bg-emerald-500"
                            }`}
                          />
                        </span>
                        {peserta.status_magang === "selesai" ? "Selesai Magang" : "Magang Aktif"}
                      </span>
                    </td>

                    {/* Column 8: Aksi (Titik 3 Dropdown Ala Admin) */}
                    <td className="py-3.5 px-2 sm:px-3 text-center w-14 min-w-[56px]">
                      <PesertaBimbinganActionsDropdown
                        onDetail={() => onSelect(peserta)}
                        onPenilaian={() => handlePenilaianClick(peserta)}
                        waLink={waLink}
                        isDark={dk}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PesertaBimbinganTable;
