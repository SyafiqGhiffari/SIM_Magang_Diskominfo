import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import HariLiburModal from "../../components/manajemen/admin/jamkerja/HariLiburModal";
import SyncNasionalModal from "../../components/manajemen/admin/jamkerja/SyncNasionalModal";
import LiburFilterModal from "../../components/manajemen/admin/jamkerja/LiburFilterModal";
import LiburSortDropdown from "../../components/manajemen/admin/jamkerja/LiburSortDropdown";
import {
  getAllJamKerja, updateJamKerja,
  getAllHariLibur, createHariLibur, updateHariLibur, deleteHariLibur, syncHariLiburNasional,
} from "../../services/adminService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
   Clock, CalendarDays, CalendarClock, Globe2, PenLine, Loader2, Plus,
  Search, Inbox, Pencil, Trash2, RefreshCw, Filter, Check, Info,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from "lucide-react";

const HARI_LABEL = { senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis", jumat: "Jumat" };
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const formatTanggal = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  if (!y || !m || !d) return s;
  return `${String(d).padStart(2, "0")} ${BULAN_PANJANG[m - 1]} ${y}`;
};

const namaHariDari = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  if (!y || !m || !d) return "-";
  return NAMA_HARI[new Date(y, m - 1, d).getDay()];
};

// Kolom yang bisa di-sort lewat header tabel
const liburColumns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "nama", label: "Nama Libur" },
  { key: "tipe", label: "Tipe" },
];

const SortableHeader = ({ column, columnSort, setColumnSort }) => {
  const isActive = columnSort.key === column.key;
  const direction = isActive ? columnSort.direction : null;

  const handleClick = () => {
    if (!isActive) setColumnSort({ key: column.key, direction: "asc" });
    else if (direction === "asc") setColumnSort({ key: column.key, direction: "desc" });
    else setColumnSort({ key: null, direction: null });
  };

  return (
    <th className="px-6 py-3.5">
      <button
        onClick={handleClick}
        className={`group flex w-full items-center justify-between gap-3 text-[10.5px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
          isActive ? "text-[#0B1442]" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span>{column.label}</span>
        <span className="flex flex-col shrink-0 gap-[1px]">
          <ChevronUp className={`w-3 h-3 transition-all duration-200 ${isActive && direction === "asc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
          <ChevronDown className={`w-3 h-3 -mt-1.5 transition-all duration-200 ${isActive && direction === "desc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"}`} strokeWidth={3} />
        </span>
      </button>
    </th>
  );
};

const JamKerjaLiburPage = () => {
  const { isDark } = useManajemenTheme();

  const [activeTab, setActiveTab] = useState("jam"); // "jam" | "libur"

  const [jamList, setJamList] = useState([]);
  const [liburList, setLiburList] = useState([]);
  const [loading, setLoading] = useState(true);

  const nowYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(String(nowYear));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tipeFilter, setTipeFilter] = useState([]);
  const [sortBy, setSortBy] = useState("tanggal_asc");
  const tahunOptions = Array.from({ length: 11 }, (_, i) => String(nowYear - 5 + i));
  const firstYear = useRef(true);
  const saveTimers = useRef({}); // timer auto-save per hari

  const [syncing, setSyncing] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // bulan kalender (0-11)

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchJam = async () => {
    try {
      const res = await getAllJamKerja();
      setJamList((res.data.data || []).map((j) => ({ ...j, _dirty: false, _saving: false })));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat jam kerja.");
    }
  };

  const fetchLibur = async (th) => {
    try {
      const res = await getAllHariLibur(th);
      setLiburList(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat hari libur.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchJam(), fetchLibur(tahun)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstYear.current) { firstYear.current = false; return; }
    fetchLibur(tahun);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahun]);

  // ── Jam Kerja (auto-save) ──
  const saveRow = async (row) => {
    const label = HARI_LABEL[row.hari] || row.hari;
    if (row.is_aktif && row.jam_pulang <= row.jam_masuk) {
      toastError(`${label}: jam pulang harus lebih besar dari jam masuk.`);
      return;
    }
    if (row.is_aktif && Number(row.toleransi_terlambat) < 0) {
      toastError(`${label}: toleransi keterlambatan tidak boleh negatif.`);
      return;
    }
    setJamList((prev) => prev.map((j) => (j.id === row.id ? { ...j, _saving: true } : j)));
    try {
      await updateJamKerja(row.id, {
        jam_masuk: row.jam_masuk,
        jam_pulang: row.jam_pulang,
        toleransi_terlambat: Number(row.toleransi_terlambat) || 0,
        is_aktif: row.is_aktif,
      });
      setJamList((prev) => prev.map((j) => (j.id === row.id ? { ...j, _saving: false, _dirty: false, _saved: true } : j)));
      setTimeout(() => {
        setJamList((prev) => prev.map((j) => (j.id === row.id ? { ...j, _saved: false } : j)));
      }, 1500);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan jam kerja.");
      setJamList((prev) => prev.map((j) => (j.id === row.id ? { ...j, _saving: false } : j)));
    }
  };

  // input jam/toleransi: update state + simpan otomatis (debounce 700ms)
  const handleField = (row, field, value) => {
    const updated = { ...row, [field]: value, _dirty: true };
    setJamList((prev) => prev.map((j) => (j.id === row.id ? updated : j)));
    clearTimeout(saveTimers.current[row.id]);
    saveTimers.current[row.id] = setTimeout(() => saveRow(updated), 700);
  };

  // toggle status: simpan langsung
  const handleToggle = (row) => {
    const updated = { ...row, is_aktif: !row.is_aktif, _dirty: true };
    setJamList((prev) => prev.map((j) => (j.id === row.id ? updated : j)));
    clearTimeout(saveTimers.current[row.id]);
    saveRow(updated);
  };

  // ── Hari Libur ──
  const handleAddLibur = () => { setEditData(null); setShowFormModal(true); };
  const handleEditLibur = (l) => { setEditData(l); setShowFormModal(true); };

  const handleSubmitLibur = async (payload) => {
    try {
      if (editData) {
        await updateHariLibur(editData.id, payload);
        toastSuccess("Hari libur berhasil diperbarui");
      } else {
        await createHariLibur(payload);
        toastSuccess("Hari libur berhasil ditambahkan");
      }
      setShowFormModal(false);
      fetchLibur(tahun);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan hari libur.");
    }
  };

  const handleDeleteLibur = async (l) => {
    const result = await confirmDialog({
      title: `Hapus libur "${l.nama}"?`,
      text: `Tanggal ${formatTanggal(l.tanggal)} akan dihapus dari daftar hari libur.`,
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteHariLibur(l.id);
      toastSuccess("Hari libur berhasil dihapus");
      fetchLibur(tahun);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus hari libur.");
    }
  };

  const handleSync = async (th) => {
    setSyncing(true);
    try {
      const res = await syncHariLiburNasional(th);
      const d = res.data.data || {};
      const baru = d.jumlah_baru || 0;
      const update = d.jumlah_update || 0;

      let pesan;
      if (baru === 0 && update === 0) {
        pesan = `Libur nasional ${th} sudah paling baru - tidak ada perubahan.`;
      } else {
        const bagian = [];
        if (baru > 0) bagian.push(`${baru} libur baru ditambahkan`);
        if (update > 0) bagian.push(`${update} diperbarui`);
        pesan = `Libur nasional ${th} berhasil disinkronkan - ${bagian.join(", ")}.`;
      }
      toastSuccess(pesan);

      setTahun(String(th));
      fetchLibur(th);
      setShowSyncModal(false);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal sinkronisasi libur nasional.");
    } finally {
      setSyncing(false);
    }
  };

  // ── Filter & stats ──
  const filtered = liburList
  .filter((l) => {
    const match = (q) => {
      const s = q.toLowerCase();
      return l.nama.toLowerCase().includes(s) || (l.tanggal || "").includes(s) || formatTanggal(l.tanggal).toLowerCase().includes(s);
    };
    const tipeOk = tipeFilter.length === 0 || tipeFilter.includes(l.tipe);
    return tipeOk && match(search) && match(tableSearch);
  })
  .sort((a, b) => {
    // Prioritas: sort dari header tabel (klik kolom)
    if (columnSort.key) {
      const valA = a[columnSort.key] ?? "";
      const valB = b[columnSort.key] ?? "";
      const result = String(valA).localeCompare(String(valB), "id", { numeric: true });
      return columnSort.direction === "asc" ? result : -result;
    }
    // Fallback: dropdown "Urutkan"
    switch (sortBy) {
      case "tanggal_desc": return (b.tanggal || "").localeCompare(a.tanggal || "");
      case "nama_az": return a.nama.localeCompare(b.nama);
      case "nama_za": return b.nama.localeCompare(a.nama);
      case "tanggal_asc":
      default: return (a.tanggal || "").localeCompare(b.tanggal || "");
    }
  });
  const pageItems = filtered.slice(page * perPage, page * perPage + perPage);

  const hariKerjaAktif = jamList.filter((j) => j.is_aktif).length;
  const anySaving = jamList.some((j) => j._saving);
  const anySaved = !anySaving && jamList.some((j) => j._saved);
  const totalLibur = liburList.length;
  const liburNasional = liburList.filter((l) => l.tipe === "nasional").length;
  const liburManual = liburList.filter((l) => l.tipe === "manual").length;

  // ── Kalender libur ──
  const calYear = Number(tahun);
  const calFirstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0=Minggu
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const liburByDay = {};
  liburList.forEach((l) => {
    const [y, m, d] = (l.tanggal || "").split("-").map(Number);
    if (y === calYear && m - 1 === calMonth) liburByDay[d] = l;
  });
  const todayObj = new Date();
  const isTodayCell = (d) =>
    todayObj.getFullYear() === calYear && todayObj.getMonth() === calMonth && todayObj.getDate() === d;
  const goMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    if (y !== calYear) {
      if (!tahunOptions.includes(String(y))) return; // di luar rentang tahun
      setTahun(String(y));
    }
    setCalMonth(m);
  };
  // libur terdekat dari hari ini
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const upcomingLibur = [...liburList]
    .filter((l) => {
      const [y, m, d] = (l.tanggal || "").split("-").map(Number);
      return y && new Date(y, m - 1, d) >= today0;
    })
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))[0] || null;

  const statCards = [
    { icon: CalendarClock, label: "Hari Kerja Aktif", value: hariKerjaAktif, caption: "Dari 5 hari (Senin - Jumat)", lightGradient: "from-blue-300 to-white", gradient: "from-[#004F9F] to-[#0B1442]", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { icon: CalendarDays, label: `Total Libur ${tahun}`, value: totalLibur, caption: "Di luar hari Sabtu & Minggu", lightGradient: "from-slate-300 to-white", gradient: "from-slate-600 to-slate-800", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    { icon: Globe2, label: "Libur Nasional", value: liburNasional, caption: "Hasil sinkronisasi", lightGradient: "from-emerald-300 to-white", gradient: "from-emerald-500 to-emerald-700", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { icon: PenLine, label: "Libur Instansi", value: liburManual, caption: "Ditambahkan admin", lightGradient: "from-amber-300 to-white", gradient: "from-amber-500 to-amber-700", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  ];

  const tabs = [
    { key: "jam", label: "Jam Kerja", icon: Clock },
    { key: "libur", label: "Hari Libur", icon: CalendarDays, badge: totalLibur },
  ];

  return (
    <AdminLayout searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}>
      <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Jam Kerja &amp; Hari Libur</h2>
          <p className={`mt-1.5 text-xs max-w-xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Atur jam kerja per hari dan daftar hari libur yang akan menjadi acuan presensi peserta magang.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat pengaturan...
          </div>
        ) : (
          <>
            {/* ===== Stats ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

            {/* ===== Tab switcher ===== */}
            <div className="grid grid-cols-2 sm:inline-flex gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm w-full sm:w-auto">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      active ? "bg-gradient-to-r from-[#0B1442] to-[#004F9F] text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <t.icon className={`w-4 h-4 transition-transform duration-300 ${active ? "" : "group-hover:scale-110"}`} />
                    {t.label}
                    {typeof t.badge === "number" && (
                      <span className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9.5px] font-black ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ===== TAB: Jam Kerja ===== */}
            {activeTab === "jam" && (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
                {/* ── Kartu Jam Kerja Harian ── */}
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.3s_ease-out]">
                  {/* Header */}
                  <div className="flex items-start gap-3 px-4 sm:px-6 pt-5 sm:pt-6 pb-5 border-b border-slate-100">
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <Clock className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-[#0B1442]">Jam Kerja Harian</h3>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        Atur jam masuk, pulang, dan toleransi tiap hari. Sabtu &amp; Minggu otomatis libur.
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                        <Check className="w-3 h-3" /> Tersimpan otomatis
                      </span>
                      <span className="h-4 flex items-center">
                        {anySaving ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#004F9F] animate-[fadeslide_0.25s_ease-out]">
                            <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                          </span>
                        ) : anySaved ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 animate-[fadeslide_0.3s_ease-out]">
                            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                            </span>
                            Berhasil disimpan
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  {/* Header kolom (desktop) */}
                  <div className="hidden sm:grid sm:grid-cols-[110px_1fr_1fr_1fr_100px] gap-3 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100">
                    {["Hari", "Jam Masuk", "Jam Pulang", "Toleransi", "Status"].map((h, idx) => (
                      <span key={idx} className="text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</span>
                    ))}
                  </div>

                  {/* Baris per hari */}
                  <div className="divide-y divide-slate-100">
                    {jamList.map((j) => (
                      <div
                        key={j.id}
                        className={`grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr_1fr_100px] sm:items-center gap-3 px-4 sm:px-5 py-4 transition-colors duration-200 ${j.is_aktif ? "hover:bg-slate-50/60" : "bg-slate-50/40"}`}
                      >
                        {/* Hari */}
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm bg-gradient-to-br from-[#0B1442] to-[#004F9F] ${j.is_aktif ? "" : "opacity-50"}`}>
                            <CalendarDays className="w-3.5 h-3.5" />
                          </span>
                            <span className="text-sm font-black text-[#0B1442]">{HARI_LABEL[j.hari] || j.hari}</span>
                      </div>

                        {/* Jam Masuk */}
                        <div>
                          <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Jam Masuk</label>
                          <input
                            type="time"
                            value={j.jam_masuk}
                            disabled={!j.is_aktif}
                            onChange={(e) => handleField(j, "jam_masuk", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Jam Pulang */}
                        <div>
                          <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Jam Pulang</label>
                          <input
                            type="time"
                            value={j.jam_pulang}
                            disabled={!j.is_aktif}
                            onChange={(e) => handleField(j, "jam_pulang", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Toleransi */}
                        <div>
                          <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Toleransi</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              value={j.toleransi_terlambat}
                              disabled={!j.is_aktif}
                              onChange={(e) => handleField(j, "toleransi_terlambat", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-11 py-2 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">mnt</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Status</label>
                          <button
                            type="button"
                            onClick={() => handleToggle(j)}
                            role="switch"
                            aria-checked={j.is_aktif}
                                className={`relative inline-flex h-8 w-[100px] shrink-0 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-[0.97] hover:brightness-105 ${
                                j.is_aktif
                                  ? "bg-emerald-500 text-white justify-start shadow-[0_3px_12px_rgba(16,185,129,0.45)]"
                                  : "bg-slate-200 text-slate-500 justify-end"
                              }`}
                            >
                              <span className="relative z-10 transition-opacity duration-200">{j.is_aktif ? "Aktif" : "Nonaktif"}</span>
                            <span
                              className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                j.is_aktif ? "right-1" : "left-1"
                              }`}
                            >
                              <Check className={`w-3 h-3 text-emerald-500 transition-all duration-200 ${j.is_aktif ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} strokeWidth={3} />
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Catatan auto-save (mobile) */}
                  <div className="sm:hidden flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-[11px] font-medium">
                    {anySaving ? (
                      <span className="inline-flex items-center gap-1.5 text-[#004F9F] font-bold animate-[fadeslide_0.25s_ease-out]">
                        <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                      </span>
                    ) : anySaved ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold animate-[fadeslide_0.3s_ease-out]">
                        <Check className="w-3.5 h-3.5" /> Berhasil disimpan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <Check className="w-3 h-3 text-emerald-500" /> Perubahan tersimpan otomatis
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Kartu Info (kanan) ── */}
                <aside className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.35s_ease-out]">
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#004F9F]">
                        <Info className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#0B1442] leading-tight">Panduan Jam Kerja</h3>
                        <p className="text-[11px] text-slate-400">Fungsi &amp; aturan presensi</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Pengaturan ini menjadi <span className="font-bold text-[#0B1442]">acuan presensi peserta magang</span>. Hari yang aktif menentukan kapan peserta wajib melakukan absensi.
                    </p>

                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B1442]/5 text-[#004F9F]">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-slate-600">
                          <span className="font-bold text-[#0B1442]">Jam masuk &amp; pulang</span> menentukan rentang waktu presensi peserta.
                        </p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B1442]/5 text-[#004F9F]">
                          <CalendarClock className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-slate-600">
                          <span className="font-bold text-[#0B1442]">Toleransi</span> adalah batas menit keterlambatan sebelum peserta dihitung telat.
                        </p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B1442]/5 text-[#004F9F]">
                          <CalendarDays className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-slate-600">
                          Hari <span className="font-bold text-[#0B1442]">Non Aktif</span>, Sabtu, Minggu, dan hari libur membuat peserta tidak perlu presensi.
                        </p>
                      </li>
                    </ul>

                    <div className="flex items-center gap-2 rounded-xl bg-[#0B1442]/5 px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-[11px] font-semibold text-slate-600 leading-snug">
                        Setiap perubahan langsung tersimpan otomatis.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* ===== TAB: Hari Libur ===== */}
            {activeTab === "libur" && (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
                {/* ── Kartu Daftar Hari Libur ── */}
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.3s_ease-out]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-5 sm:pt-6 pb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                      <CalendarDays className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-black text-[#0B1442]">Daftar Hari Libur</h3>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        Libur nasional ditarik otomatis, libur instansi bisa ditambahkan sendiri.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                    {/* Sync */}
                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-emerald-100 active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
                      <span className="hidden xs:inline sm:inline">Sinkron Libur Nasional</span>
                      <span className="xs:hidden sm:hidden">Sinkron</span>
                    </button>

                    {/* Garis sekat */}
                    <div className="h-px w-full bg-slate-200" />

                    {/* Tambah Libur Instansi */}
                    <button
                      onClick={handleAddLibur}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
                      Tambah Libur Instansi
                    </button>
                  </div>
                </div>

                {/* Toolbar: Search di atas, lalu Sort + Filter */}
                <div className="flex flex-col gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100 sm:-mt-10 ">
                  <div className="relative w-full sm:w-64">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"}`} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => { setTableSearch(e.target.value); setPage(0); }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Cari nama / tanggal libur..."
                      className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                        isSearchFocused ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                      }`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <LiburSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Filter className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                      Filter
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#004F9F] text-white px-1.5 text-[9.5px] font-black">
                        {tahun}
                      </span>
                      {tipeFilter.length > 0 && (
                        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 text-white px-1.5 text-[9.5px] font-black">
                          +{tipeFilter.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Desktop: tabel ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <SortableHeader column={liburColumns[0]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <SortableHeader column={liburColumns[1]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <SortableHeader column={liburColumns[2]} columnSort={columnSort} setColumnSort={setColumnSort} />
                        <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-16">
                            <EmptyLibur tahun={tahun} />
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((l, i) => (
                          <tr
                            key={l.id}
                            className="group border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 animate-[fadeslide_0.3s_ease-out]"
                            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-bold text-[#0B1442]">{formatTanggal(l.tanggal)}</p>
                              <p className="text-[11px] font-medium text-slate-400">{namaHariDari(l.tanggal)}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-700 font-semibold">{l.nama}</td>
                            <td className="px-6 py-4"><TipeBadge tipe={l.tipe} /></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {l.tipe === "manual" && (
                                  <ActionBtn onClick={() => handleEditLibur(l)} variant="edit" />
                                )}
                                <ActionBtn onClick={() => handleDeleteLibur(l)} variant="delete" />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile: kartu ── */}
                <div className="md:hidden p-4 space-y-3">
                  {pageItems.length === 0 ? (
                    <div className="py-12"><EmptyLibur tahun={tahun} /></div>
                  ) : (
                    pageItems.map((l, i) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-start justify-between gap-3 animate-[fadeslide_0.3s_ease-out]"
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-[#0B1442] text-sm">{formatTanggal(l.tanggal)}</p>
                            <span className="text-[11px] font-semibold text-slate-400">· {namaHariDari(l.tanggal)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-700 break-words">{l.nama}</p>
                          <div className="mt-2"><TipeBadge tipe={l.tipe} /></div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {l.tipe === "manual" && <ActionBtn onClick={() => handleEditLibur(l)} variant="edit" />}
                          <ActionBtn onClick={() => handleDeleteLibur(l)} variant="delete" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Pagination totalItems={filtered.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} />
                </div>

                {/* ── Kolom kanan: Kalender + Acara Terdekat + Info ── */}
                <aside className="space-y-4">
                  {/* Kalender */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.35s_ease-out]">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                      <button onClick={() => goMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:text-[#004F9F] active:scale-90 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <p className="text-sm font-black text-[#0B1442]">{BULAN_PANJANG[calMonth]} {calYear}</p>
                      <button onClick={() => goMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/40 hover:text-[#004F9F] active:scale-90 cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3">
                      {/* Header hari */}
                      <div className="grid grid-cols-7 mb-1">
                        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                          <span key={d} className={`text-center text-[10px] font-black uppercase tracking-wide py-1.5 ${i === 0 ? "text-red-400" : "text-slate-400"}`}>{d}</span>
                        ))}
                      </div>
                      {/* Grid tanggal */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: calFirstWeekday }).map((_, i) => (
                          <span key={`e${i}`} />
                        ))}
                        {Array.from({ length: calDaysInMonth }).map((_, i) => {
                          const d = i + 1;
                          const libur = liburByDay[d];
                          const weekday = new Date(calYear, calMonth, d).getDay();
                          const isWeekend = weekday === 0 || weekday === 6;
                          const today = isTodayCell(d);
                          return (
                            <div key={d} className="relative flex items-center justify-center py-0.5" title={libur ? libur.nama : undefined}>
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold transition-all duration-150 ${
                                  today
                                    ? "bg-[#0B1442] text-white shadow-md ring-2 ring-[#00A5EC]/40"
                                    : libur
                                    ? "bg-red-50 text-red-600 font-black"
                                    : isWeekend
                                    ? "text-red-400"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {d}
                              </span>
                              {libur && !today && (
                                <span className="absolute bottom-0 h-1 w-1 rounded-full bg-red-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Acara terdekat */}
                    <div className="border-t border-slate-100 px-4 py-3.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Acara Terdekat</p>
                      {upcomingLibur ? (
                        <div className="flex items-start gap-2.5 rounded-xl bg-[#0B1442]/5 p-3">
                          <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-[#0B1442] shadow-sm">
                            <span className="text-[13px] font-black leading-none">{Number(upcomingLibur.tanggal.split("-")[2])}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400">{BULAN[Number(upcomingLibur.tanggal.split("-")[1]) - 1]}</span>
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0B1442] leading-snug break-words">{upcomingLibur.nama}</p>
                            <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">
                              {upcomingLibur.tipe === "nasional" ? "Libur Nasional" : "Libur Khusus Instansi"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] font-medium text-slate-400">Tidak ada libur mendatang di tahun {tahun}.</p>
                      )}
                    </div>
                  </div>

                  {/* Informasi Sinkronisasi */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.4s_ease-out]">
                    <div className="p-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#004F9F]">
                          <Info className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-[#0B1442] leading-tight">Informasi Sinkronisasi</h3>
                          <p className="text-[11px] text-slate-400">Cara kerja libur &amp; presensi</p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">
                        Semua perubahan pada jam kerja &amp; hari libur otomatis memperbarui jadwal presensi seluruh peserta magang yang aktif.
                      </p>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Globe2 className="w-3.5 h-3.5" /></span>
                          <p className="text-[11.5px] leading-relaxed text-slate-600"><span className="font-bold text-[#0B1442]">Sinkron Nasional</span> menarik daftar libur resmi dari API pemerintah.</p>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><PenLine className="w-3.5 h-3.5" /></span>
                          <p className="text-[11.5px] leading-relaxed text-slate-600">Libur <span className="font-bold text-[#0B1442]">khusus instansi</span> bisa ditambah manual kapan saja.</p>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500"><CalendarDays className="w-3.5 h-3.5" /></span>
                          <p className="text-[11.5px] leading-relaxed text-slate-600">Tanggal libur &amp; akhir pekan membuat peserta <span className="font-bold text-[#0B1442]">tidak wajib presensi</span>.</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>

      {showFormModal && (
        <HariLiburModal initialData={editData} onClose={() => setShowFormModal(false)} onSubmit={handleSubmitLibur} />
      )}

      {showSyncModal && (
        <SyncNasionalModal
          tahunOptions={tahunOptions}
          defaultTahun={tahun}
          syncing={syncing}
          onClose={() => setShowSyncModal(false)}
          onSync={handleSync}
        />
      )}

      {showFilterModal && (
        <LiburFilterModal
          tahunOptions={tahunOptions}
          currentTahun={tahun}
          defaultTahun={String(nowYear)}
          currentTipe={tipeFilter}
          onApply={({ tahun: y, tipe }) => { setTahun(y); setTipeFilter(tipe); setPage(0); }}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
};

// ── Sub-komponen kecil (dipakai tabel & kartu mobile) ──
const TipeBadge = ({ tipe }) =>
  tipe === "nasional" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
      <Globe2 className="w-3 h-3" /> Nasional
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700">
      <PenLine className="w-3 h-3" /> Instansi
    </span>
  );

const ActionBtn = ({ onClick, variant }) => {
  const isEdit = variant === "edit";
  return (
    <button
      onClick={onClick}
      title={isEdit ? "Edit libur" : "Hapus libur"}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer ${
        isEdit ? "hover:border-[#004F9F]/40 hover:text-[#004F9F]" : "hover:border-red-300 hover:text-red-600"
      }`}
    >
      {isEdit ? <Pencil className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
};

const EmptyLibur = ({ tahun }) => (
  <div className="flex flex-col items-center justify-center gap-3 text-center">
    <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
      <Inbox className="w-6 h-6" />
      <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
    </span>
    <p className="text-sm font-bold text-slate-500">Belum ada hari libur untuk tahun {tahun}</p>
    <p className="text-xs text-slate-400">Gunakan tombol Sinkron Nasional atau Tambah Libur.</p>
  </div>
);

export default JamKerjaLiburPage;