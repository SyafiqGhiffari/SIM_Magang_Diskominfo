import { useCallback, useEffect, useState } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import ProsesIzinModal from "../../components/manajemen/mentor/presensi/ProsesIzinModal";
import { getPengajuanIzinMentor } from "../../services/mentorService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import {
  MailCheck, Search, Inbox, FileText, HeartPulse, CalendarRange, GraduationCap,
  Clock, CheckCircle2, Ban, Paperclip, Loader2, ShieldCheck,
} from "lucide-react";

const TAB_STATUS = [
  { key: "menunggu", label: "Menunggu", icon: Clock },
  { key: "disetujui", label: "Disetujui", icon: CheckCircle2 },
  { key: "ditolak", label: "Ditolak", icon: Ban },
  { key: "", label: "Semua", icon: ShieldCheck },
];

const badgeStatus = {
  menunggu: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  disetujui: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  ditolak: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
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
        className="h-10 w-10 shrink-0 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[11px] font-black shadow-sm transition-all duration-300 group-hover:scale-110">
      {getInitials(nama)}
    </span>
  );
};

const VerifikasiIzinPage = () => {
  const { isDark } = useManajemenTheme();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusTab, setStatusTab] = useState("menunggu");
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [proses, setProses] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const gabungan = [search, tableSearch].filter(Boolean).join(" ").trim();
    const id = setTimeout(() => {
      setDebouncedSearch(gabungan);
      setPage(0);
    }, 350);
    return () => clearTimeout(id);
  }, [search, tableSearch]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = { page: page + 1, limit: perPage };
      if (statusTab) params.status = statusTab;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await getPengajuanIzinMentor(params);
      const payload = res.data.data || {};
      setRows(payload.data || []);
      setTotal(payload.meta?.total || 0);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat pengajuan izin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, perPage, statusTab, debouncedSearch]);

  useEffect(() => {
    const id = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const gantiTab = (key) => { setStatusTab(key); setPage(0); };

  return (
    <MentorLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Verifikasi Izin & Sakit</h2>
          <p className={`mt-1.5 text-xs max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Setujui atau tolak pengajuan izin/sakit peserta bimbingan Anda. Pengajuan yang disetujui otomatis tercatat pada presensi setiap hari kerja dalam rentang tanggalnya.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-5 pb-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <MailCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#0B1442]">Daftar Pengajuan</h3>
                <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                  Total {total} pengajuan pada tampilan ini.
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
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {TAB_STATUS.map((t) => (
                <button
                  key={t.key || "semua"}
                  onClick={() => gantiTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    statusTab === t.key ? "bg-white text-[#004F9F] shadow-sm" : "text-slate-500 hover:text-[#0B1442]"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${isSearchFocused ? "sm:scale-[1.03]" : ""}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Cari nama peserta atau alasan..."
                className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                  isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                }`}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat pengajuan...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Inbox className="w-6 h-6" />
                <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
              </span>
              <p className="text-sm font-bold text-slate-500">Tidak ada pengajuan pada tampilan ini</p>
              <p className="text-xs text-slate-400 max-w-sm">Pengajuan izin/sakit dari peserta bimbingan Anda akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 px-4 sm:px-6 pb-5 lg:grid-cols-2">
              {rows.map((r, i) => {
                const JenisIcon = r.jenis === "sakit" ? HeartPulse : FileText;
                return (
                  <div
                    key={r.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#004F9F]/30 animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: `${i * 45}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-[#00A5EC]/10 to-transparent blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <PesertaAvatar nama={r.nama} foto={r.foto_profil} />
                        <div className="min-w-0">
                          <p className="font-bold text-[13px] text-[#0B1442] truncate transition-colors duration-200 group-hover:text-[#004F9F]">{r.nama}</p>
                          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                            <GraduationCap className="w-3 h-3 shrink-0" /> {r.institusi || "-"}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold capitalize ${badgeStatus[r.status] || "bg-slate-50 text-slate-500 ring-1 ring-slate-200"}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold capitalize ${r.jenis === "sakit" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"}`}>
                        <JenisIcon className="w-3 h-3" /> {r.jenis}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600">
                        <CalendarRange className="w-3 h-3" />
                        {formatTanggalPresensi(r.tanggal_mulai)} — {formatTanggalPresensi(r.tanggal_selesai)}
                      </span>
                      {r.file_bukti && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-600">
                          <Paperclip className="w-3 h-3" /> Ada bukti
                        </span>
                      )}
                    </div>

                    <p className="relative mt-2.5 text-[11.5px] leading-relaxed text-slate-500 line-clamp-2">{r.alasan}</p>

                    {r.catatan_mentor && (
                      <p className="relative mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                        <span className="font-bold text-slate-600">Catatan Anda: </span>{r.catatan_mentor}
                      </p>
                    )}

                    <div className="relative mt-3.5 flex justify-end">
                      <button
                        onClick={() => setProses(r)}
                        className={`group/btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer ${
                          r.status === "menunggu"
                            ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#004F9F]/40 hover:text-[#004F9F]"
                        }`}
                      >
                        <MailCheck className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                        {r.status === "menunggu" ? "Verifikasi" : "Lihat Detail"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination totalItems={total} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
        </div>
      </div>

      {proses && (
        <ProsesIzinModal
          data={proses}
          onClose={() => setProses(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </MentorLayout>
  );
};

export default VerifikasiIzinPage;