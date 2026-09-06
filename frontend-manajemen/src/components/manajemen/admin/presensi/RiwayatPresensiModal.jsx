import { useEffect, useState } from "react";
import {
  X, History, CalendarDays, LogIn, LogOut, Clock, AlarmClockOff, Lock,
  GraduationCap, Building2, Loader2, Inbox, Eye, Calendar,
} from "lucide-react";
import PresensiStatusBadge from "./PresensiStatusBadge";
import { getAllPresensi } from "../../../../services/adminService";
import { formatTanggalHari, formatMenit, namaHari } from "../../../../constants/presensiStatus";
import { getBidangColor } from "../../../../utils/bidangColor";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const RiwayatPresensiModal = ({ peserta, onClose, onSelectDetail, isDark }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!peserta?.peserta_id) return;
      setLoading(true);
      try {
        const res = await getAllPresensi({
          peserta_id: peserta.peserta_id,
          sort: "tanggal_baru",
          limit: 31, // Menampilkan riwayat presensi 1 bulan terakhir
        });
        if (active) {
          setList(res.data.data?.data || []);
        }
      } catch (err) {
        if (active) {
          toastError(err.response?.data?.message || "Gagal memuat riwayat presensi.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [peserta]);

  const bidangColor = getBidangColor(peserta?.bidang);

  const filteredList = list.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const tgl = (item.tanggal || "").toLowerCase();
    const st = (item.status || "").toLowerCase();
    const ket = (item.keterangan || "").toLowerCase();
    return tgl.includes(q) || st.includes(q) || ket.includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col ${
          isDark ? "bg-[#161b22] border border-white/10" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal with Watermark */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-3.5 py-3 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          <History className="absolute right-7 sm:right-12 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />

          <div className="relative flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                {peserta?.foto_peserta || peserta?.foto_profil ? (
                  <img
                    src={getFileUrl(peserta?.foto_peserta || peserta?.foto_profil)}
                    alt={peserta?.nama}
                    className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border border-white/20 shadow-md"
                  />
                ) : (
                  <span className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[10px] sm:text-sm font-black text-white border border-white/20 shadow-md">
                    {getInitials(peserta?.nama)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-base font-black text-white truncate">
                    {peserta?.nama}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 sm:px-2 py-0.5 text-[8.5px] sm:text-[10px] font-bold text-white/90">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300" /> 1 Bulan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 text-[9.5px] sm:text-[11px] text-white/70">
                  {peserta?.institusi && (
                    <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-[220px]">
                      <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300 shrink-0" />
                      {peserta.institusi}
                    </span>
                  )}
                  {peserta?.bidang && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-bold ${bidangColor.bg} ${bidangColor.text}`}
                      style={bidangColor.darkStyle}
                    >
                      <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      {peserta.bidang}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Toolbar: Filter/Cari & Total Data (1 Bulan) */}
        <div
          className={`flex items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b shrink-0 ${
            isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold">
            <span className={isDark ? "text-slate-300" : "text-[#0B1442]"}>
              Riwayat (1 Bulan):
            </span>
            <span className="rounded-full bg-[#004F9F] text-white px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10.5px] font-black">
              {list.length} Hari
            </span>
          </div>

          <div className="w-36 sm:w-56">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari tanggal / status..."
              className={`w-full rounded-lg sm:rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium outline-none transition-all duration-200 ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333]"
                  : "border-slate-200 bg-white text-slate-700 focus:border-[#004F9F]"
              }`}
            />
          </div>
        </div>

        {/* Body Modal: List of Attendance */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-12 sm:py-16 text-slate-400 text-[11px] sm:text-sm">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-[#00A5EC]" />
              <span>Memuat riwayat presensi 1 bulan terakhir...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 sm:py-14 text-center">
              <span
                className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
                  isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
                }`}
              >
                <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <p className={`text-[11px] sm:text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {searchFilter ? "Tidak ada data yang cocok dengan pencarian" : "Belum ada riwayat presensi dalam 1 bulan terakhir"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {filteredList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isDark
                      ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      : "border-slate-200 bg-white hover:border-[#004F9F]/30 hover:bg-blue-50/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2.5">
                    {/* Left info: Date & Lock */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="group/tgl flex items-center gap-1.5 sm:gap-2">
                        <span
                          className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 ${
                            isDark
                              ? "bg-white/5 text-sky-400 group-hover/tgl:bg-white/10"
                              : "bg-blue-50 text-[#004F9F] group-hover/tgl:bg-blue-100"
                          }`}
                        >
                          <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[11px] sm:text-[13px] font-bold leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                            {formatTanggalHari(item.tanggal)}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{namaHari(item.tanggal)}</span>
                            {item.dikunci && (
                              <span className="inline-flex items-center gap-0.5 text-amber-500 font-semibold">
                                <Lock className="w-2.5 h-2.5" /> Terkunci
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Middle Info: In/Out time & badges */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span
                        className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10.5px] font-bold ${
                          isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <LogIn className="w-2.5 h-2.5" /> {item.jam_masuk || "--:--"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10.5px] font-bold ${
                          isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600"
                        }`}
                      >
                        <LogOut className="w-2.5 h-2.5" /> {item.jam_pulang || "--:--"}
                      </span>

                      {item.menit_terlambat > 0 && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-bold ${
                            isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" /> +{formatMenit(item.menit_terlambat)}
                        </span>
                      )}

                      {item.lupa_presensi && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-bold ${
                            isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <AlarmClockOff className="w-2.5 h-2.5" /> Lupa
                        </span>
                      )}

                      <PresensiStatusBadge status={item.status} className="!text-[9px] sm:!text-[10.5px] !py-0.5 !px-1.5 sm:!px-2" />

                      {/* Detail Button */}
                      <button
                        type="button"
                        onClick={() => onSelectDetail(item)}
                        className={`group/btn inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ml-auto sm:ml-1 ${
                          isDark
                            ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#00A5EC]/50 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/40 hover:bg-blue-50 hover:text-[#004F9F]"
                        }`}
                      >
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 group-hover/btn:scale-110" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between border-t px-3 sm:px-6 py-2.5 sm:py-3 shrink-0 ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          <p className={`text-[9px] sm:text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Menampilkan riwayat presensi 1 bulan terakhir.
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg sm:rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiwayatPresensiModal;
