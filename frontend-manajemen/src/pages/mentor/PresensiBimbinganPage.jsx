import { useCallback, useEffect, useState } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import PresensiSortDropdown from "../../components/manajemen/admin/presensi/PresensiSortDropdown";
import PresensiFilterModal from "../../components/manajemen/admin/presensi/PresensiFilterModal";
import PresensiStatusBadge from "../../components/manajemen/admin/presensi/PresensiStatusBadge";
import PresensiDetailModal from "../../components/manajemen/admin/presensi/PresensiDetailModal";
import KoreksiPresensiModal from "../../components/manajemen/mentor/presensi/KoreksiPresensiModal";
import { getPresensiMentor, getStatistikPresensiMentor } from "../../services/mentorService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { formatTanggalPresensi, formatMenit } from "../../constants/presensiStatus";
import {
  ClipboardList, Search, Inbox, Filter as FilterIcon, Users, CheckCircle2, Clock, UserX,
  GraduationCap, LogIn, LogOut, Eye, PencilLine, AlarmClockOff, MailCheck, Loader2,
} from "lucide-react";

const emptyFilters = {
  status: [],
  kategori: [],
  bidang: [],
  tanggal_dari: "",
  tanggal_sampai: "",
  lupa_presensi: false,
};

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

const hitungFilterAktif = (f) =>
  (f.status.length > 0 ? 1 : 0) +
  (f.kategori.length > 0 ? 1 : 0) +
  (f.tanggal_dari || f.tanggal_sampai ? 1 : 0) +
  (f.lupa_presensi ? 1 : 0);

const PresensiBimbinganPage = () => {
  const { isDark } = useManajemenTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [sortBy, setSortBy] = useState("tanggal_baru");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [detail, setDetail] = useState(null);
  const [koreksi, setKoreksi] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const gabungan = [search, tableSearch].filter(Boolean).join(" ").trim();
    const id = setTimeout(() => {
      setDebouncedSearch(gabungan);
      setPage(0);
    }, 350);
    return () => clearTimeout(id);
  }, [search, tableSearch]);

  const buildParams = useCallback(() => {
    const f = appliedFilters;
    const params = { page: page + 1, limit: perPage, sort: sortBy };
    if (debouncedSearch) params.search = debouncedSearch;
    if (f.status.length) params.status = f.status.join(",");
    if (f.kategori.length) params.kategori = f.kategori.join(",");
    if (f.tanggal_dari) params.tanggal_dari = f.tanggal_dari;
    if (f.tanggal_sampai) params.tanggal_sampai = f.tanggal_sampai;
    if (f.lupa_presensi) params.lupa_presensi = 1;
    return params;
  }, [appliedFilters, page, perPage, sortBy, debouncedSearch]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = buildParams();
      const [resList, resStat] = await Promise.all([
        getPresensiMentor(params),
        getStatistikPresensiMentor({
          tanggal_dari: params.tanggal_dari,
          tanggal_sampai: params.tanggal_sampai,
          kategori: params.kategori,
        }),
      ]);
      const payload = resList.data.data || {};
      setRows(payload.data || []);
      setTotal(payload.meta?.total || 0);
      setStat(resStat.data.data || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat presensi peserta bimbingan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const id = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const openFilter = () => { setDraftFilters(appliedFilters); setShowFilterModal(true); };
  const applyFilter = () => { setAppliedFilters(draftFilters); setPage(0); };
  const resetFilter = () => { setDraftFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(0); };

  const activeFilterCount = hitungFilterAktif(appliedFilters);

  const statCards = [
    {
      icon: Users, label: "Peserta Bimbingan", value: stat?.total_peserta ?? 0,
      caption: "Peserta aktif di bawah bimbingan Anda",
      lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]",
      iconBg: "bg-blue-50", iconColor: "text-[#004F9F]",
    },
    {
      icon: CheckCircle2, label: "Hadir", value: stat?.hadir ?? 0,
      caption: "Presensi tepat waktu",
      lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700",
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    },
    {
      icon: Clock, label: "Terlambat", value: stat?.terlambat ?? 0,
      caption: `${stat?.lupa_presensi ?? 0} di antaranya lupa presensi`,
      lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700",
      iconBg: "bg-amber-50", iconColor: "text-amber-600",
    },
    {
      icon: UserX, label: "Alfa", value: stat?.alfa ?? 0,
      caption: "Otomatis saat hari berganti",
      lightGradient: "from-rose-300 to-white", gradient: "from-rose-500 to-rose-700",
      iconBg: "bg-rose-50", iconColor: "text-rose-600",
    },
  ];

  const headerCols = ["Peserta", "Tanggal", "Jam Masuk / Pulang", "Status"];

  return (
    <MentorLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Presensi Bimbingan</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pantau kehadiran peserta bimbingan Anda. Sebagai mentor, Anda berwenang mengoreksi presensi dan memverifikasi pengajuan izin/sakit.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat presensi bimbingan...
          </div>
        ) : (
          <div className="space-y-6 animate-[fadeslide_0.3s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((c, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.lightGradient} p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  <div className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.3] blur-xl transition-all duration-300 group-hover:opacity-[0.4] group-hover:scale-125`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-sm font-bold tracking-wide text-slate-500 truncate">{c.label}</p>
                      <h3 className="mt-1 sm:mt-1.5 text-2xl sm:text-4xl font-black tracking-tight text-[#0B1442]">{c.value}</h3>
                      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-400 leading-snug">{c.caption}</p>
                    </div>
                    <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg} ${c.iconColor}`}>
                      <c.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>

            {(stat?.izin_menunggu ?? 0) > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 sm:px-6 py-3.5 shadow-sm">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
                  <MailCheck className="w-3.5 h-3.5" /> {stat.izin_menunggu} pengajuan menunggu
                </span>
                <span className="text-[11.5px] font-semibold text-amber-700">
                  Ada pengajuan izin/sakit peserta bimbingan Anda yang belum diverifikasi — buka menu “Verifikasi Izin”.
                </span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-5 pb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0B1442]">Riwayat Presensi Peserta Bimbingan</h3>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                      Gunakan tombol koreksi bila peserta lupa presensi atau ada kekeliruan pencatatan.
                    </p>
                  </div>
                </div>
                {refreshing && (
                  <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                    <Loader2 className="w-3 h-3 animate-spin" /> Memuat
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <PresensiSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                  <button
                    onClick={openFilter}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer shrink-0"
                  >
                    <FilterIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1 text-[9.5px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Cari nama peserta atau institusi..."
                    className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                      isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {headerCols.map((h) => (
                        <th key={h} className="px-6 py-3.5 text-left text-[10.5px] font-black uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                      <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr className="animate-[fadeslide_0.3s_ease-out]">
                        <td colSpan={5} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                              <Inbox className="w-6 h-6" />
                              <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                            </span>
                            <p className="text-sm font-bold text-slate-500">Belum ada data presensi peserta bimbingan</p>
                            <p className="text-xs text-slate-400 max-w-sm">Pastikan peserta sudah ditugaskan kepada Anda oleh admin, atau ubah filter periode.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr
                          key={r.id}
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
                            <p className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 shadow-sm whitespace-nowrap transition-all duration-200 group-hover:border-slate-300 group-hover:bg-white group-hover:shadow-md">
                              {formatTanggalPresensi(r.tanggal)}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-600">
                                <LogIn className="w-2.5 h-2.5" /> {r.jam_masuk || "--:--"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-bold text-sky-600">
                                <LogOut className="w-2.5 h-2.5" /> {r.jam_pulang || "--:--"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {r.menit_terlambat > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                  <Clock className="w-2.5 h-2.5" /> +{formatMenit(r.menit_terlambat)}
                                </span>
                              )}
                              {r.lupa_presensi && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  <AlarmClockOff className="w-2.5 h-2.5" /> Lupa presensi
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <PresensiStatusBadge status={r.status} />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setDetail(r)}
                                className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                                Detail
                              </button>
                              <button
                                onClick={() => setKoreksi(r)}
                                className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-2 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
                              >
                                <PencilLine className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                                Koreksi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination totalItems={total} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
            </div>
          </div>
        )}
      </div>

      {showFilterModal && (
        <PresensiFilterModal
          draft={draftFilters}
          setDraft={setDraftFilters}
          bidangOptions={[]}
          onApply={applyFilter}
          onReset={resetFilter}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {detail && <PresensiDetailModal data={detail} onClose={() => setDetail(null)} />}

      {koreksi && (
        <KoreksiPresensiModal
          data={koreksi}
          onClose={() => setKoreksi(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </MentorLayout>
  );
};

export default PresensiBimbinganPage;