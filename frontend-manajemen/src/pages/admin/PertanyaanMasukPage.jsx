import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import FaqModal from "../../components/manajemen/admin/faq/FaqModal";
import PertanyaanStats from "../../components/manajemen/admin/faq/PertanyaanStats";
import PertanyaanDetailModal from "../../components/manajemen/admin/faq/PertanyaanDetailModal";
import PertanyaanFilterModal from "../../components/manajemen/admin/faq/PertanyaanFilterModal";
import PertanyaanSortDropdown from "../../components/manajemen/admin/faq/PertanyaanSortDropdown";
import PertanyaanActionsDropdown from "../../components/manajemen/admin/faq/PertanyaanActionsDropdown";
import Pagination from "../../components/manajemen/admin/pendaftaran/Pagination";
import {
  getPertanyaanFaq,
  updatePertanyaanFaq,
  deletePertanyaanFaq,
  createFaq,
  getFaqList,
} from "../../services/chatService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import {
  Inbox, CheckCircle2, XCircle, MessageSquare, Globe, Clock,
  Filter as FilterIcon, Search, ChevronUp, ChevronDown, RefreshCw, Repeat2,
} from "lucide-react";

const TAB = [
  { key: "baru", label: "Baru" },
  { key: "diproses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
  { key: "semua", label: "Semua" },
];

const warnaStatus = {
  baru: "bg-amber-50 text-amber-600 border-amber-200",
  diproses: "bg-blue-50 text-[#004F9F] border-blue-200",
  selesai: "bg-emerald-50 text-emerald-600 border-emerald-200",
  diabaikan: "bg-slate-100 text-slate-500 border-slate-200",
};

const IKON_STATUS = {
  baru: Clock,
  diproses: RefreshCw,
  selesai: CheckCircle2,
  diabaikan: XCircle,
};

const columns = [
  { key: "pertanyaan", label: "Pertanyaan" },
  { key: "nama", label: "Pengirim" },
  { key: "sumber", label: "Sumber" },
  { key: "jumlah_serupa", label: "Frekuensi" },
  { key: "skor_tertinggi", label: "Kecocokan FAQ" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Waktu Masuk" },
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
          <ChevronUp
            className={`w-3 h-3 transition-all duration-200 ${
              isActive && direction === "asc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1.5 transition-all duration-200 ${
              isActive && direction === "desc" ? "text-[#004F9F]" : "text-slate-300 group-hover:text-slate-400"
            }`}
            strokeWidth={3}
          />
        </span>
      </button>
    </th>
  );
};

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const PertanyaanMasukPage = () => {
  // ── Data mentah: selalu diambil lengkap (semua status) supaya kartu
  //    statistik tetap benar walau tab sedang menyaring satu status saja.
  const [semua, setSemua] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("baru");
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState("terbaru");
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // Filter lanjutan
  const [sumberList, setSumberList] = useState([]);
  const [ulangList, setUlangList] = useState([]);
  const [appliedSumber, setAppliedSumber] = useState([]);
  const [appliedUlang, setAppliedUlang] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleSumber = (key) =>
    setSumberList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  const toggleUlang = (key) =>
    setUlangList((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));

  // Modal detail
  const [detailItem, setDetailItem] = useState(null);

  // Modal "Jadikan FAQ" — memakai ulang FaqModal yang sudah ada
  const [showModal, setShowModal] = useState(false);
  const [sumberId, setSumberId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("Umum");
  const [quickLabel, setQuickLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showOnLanding, setShowOnLanding] = useState(true);
  const [isQuickAction, setIsQuickAction] = useState(false);
  const [loadingSimpan, setLoadingSimpan] = useState(false);
  const [sisaQuickAction, setSisaQuickAction] = useState(6);

  const ambilData = async () => {
    const res = await getPertanyaanFaq({ status: "semua" });
    return res.data.data || [];
  };

  const muatUlang = async () => {
    try {
      const list = await ambilData();
      setSemua(list);
    } catch (err) {
      console.error(err);
      toastError("Gagal memuat pertanyaan masuk");
    }
  };

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const list = await ambilData();
        if (batal) return;
        setSemua(list);
      } catch (err) {
        if (!batal) console.error(err);
      } finally {
        if (!batal) setLoading(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  // ── Statistik ───────────────────────────────────────────────────────────────
  const statistik = useMemo(() => {
    const hitung = (fn) => semua.filter(fn).length;
    return {
      total: semua.length,
      baru: hitung((d) => d.status === "baru"),
      diproses: hitung((d) => d.status === "diproses"),
      selesai: hitung((d) => d.status === "selesai"),
      dariChat: hitung((d) => d.sumber === "chat_bot"),
      dariForm: hitung((d) => d.sumber !== "chat_bot"),
    };
  }, [semua]);

  // ── Penyaringan & pengurutan ────────────────────────────────────────────────
  const terfilter = useMemo(() => {
    const kataGlobal = search.toLowerCase();
    const kataTabel = tableSearch.toLowerCase();

    let hasil = semua.filter((d) => {
      if (tab !== "semua" && d.status !== tab) return false;

      if (appliedSumber.length > 0) {
        const sumberKey = d.sumber === "chat_bot" ? "chat_bot" : "form_publik";
        if (!appliedSumber.includes(sumberKey)) return false;
      }

      if (appliedUlang.length > 0) {
        const ulangKey = (d.jumlah_serupa || 1) > 1 ? "berulang" : "sekali";
        if (!appliedUlang.includes(ulangKey)) return false;
      }

      const teks = `${d.pertanyaan} ${d.nama} ${d.email}`.toLowerCase();
      if (kataGlobal && !teks.includes(kataGlobal)) return false;
      if (kataTabel && !teks.includes(kataTabel)) return false;
      return true;
    });

    // Pengurutan dari dropdown
    const pembanding = {
      terbaru: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      terlama: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      paling_sering: (a, b) => (b.jumlah_serupa || 1) - (a.jumlah_serupa || 1),
      skor_terendah: (a, b) => (a.skor_tertinggi || 0) - (b.skor_tertinggi || 0),
    };
    hasil = [...hasil].sort(pembanding[sortBy] || pembanding.terbaru);

    // Pengurutan kolom mengambil alih bila aktif
    if (columnSort.key) {
      const arah = columnSort.direction === "desc" ? -1 : 1;
      hasil = [...hasil].sort((a, b) => {
        const va = a[columnSort.key] ?? "";
        const vb = b[columnSort.key] ?? "";
        if (columnSort.key === "created_at") return (new Date(va) - new Date(vb)) * arah;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * arah;
        return String(va).localeCompare(String(vb), "id") * arah;
      });
    }

    return hasil;
  }, [semua, tab, search, tableSearch, appliedSumber, appliedUlang, sortBy, columnSort]);

  const pageItems = terfilter.slice(page * perPage, page * perPage + perPage);
  const activeFilterCount = appliedSumber.length + appliedUlang.length;

  // ── Aksi ────────────────────────────────────────────────────────────────────
  const bukaModalFaq = async (item) => {
    setDetailItem(null);
    setSumberId(item.id);
    setQuestion(item.pertanyaan.length > 300 ? item.pertanyaan.slice(0, 300) : item.pertanyaan);
    setAnswer("");
    setKeywords("");
    setCategory("Umum");
    setQuickLabel("");
    setIsActive(true);
    setShowOnLanding(true);
    setIsQuickAction(false);

    try {
      const res = await getFaqList();
      const terpakai = res.data.quick_action_aktif ?? 0;
      const maks = res.data.quick_action_maks ?? 6;
      setSisaQuickAction(Math.max(0, maks - terpakai));
    } catch {
      setSisaQuickAction(0);
    }

    setShowModal(true);
  };

  const simpanFaqBaru = async (e) => {
    e.preventDefault();
    setLoadingSimpan(true);
    try {
      const res = await createFaq({
        question,
        answer,
        keywords,
        category,
        quick_label: quickLabel,
        is_active: isActive,
        show_on_landing: showOnLanding,
        is_quick_action: isQuickAction,
      });

      // Tandai pertanyaan asal sebagai selesai & tautkan ke FAQ barunya
      await updatePertanyaanFaq(sumberId, {
        status: "selesai",
        faq_terkait_id: res.data?.data?.id,
      });

      toastSuccess("FAQ baru dibuat dari pertanyaan peserta");
      setShowModal(false);
      await muatUlang();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membuat FAQ");
    } finally {
      setLoadingSimpan(false);
    }
  };

  const ubahStatus = async (item, status) => {
    try {
      await updatePertanyaanFaq(item.id, { status });
      toastSuccess("Status diperbarui");
      setDetailItem(null);
      await muatUlang();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status");
    }
  };

  const hapus = async (item) => {
    const result = await confirmDialog({
      title: "Hapus pertanyaan ini?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deletePertanyaanFaq(item.id);
      toastSuccess("Pertanyaan dihapus");
      setDetailItem(null);
      await muatUlang();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus pertanyaan");
    }
  };

  return (
    <AdminLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Kepala halaman: judul saja, seluruh tindakan dipindah ke kartu tabel */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#0B1442]">Pertanyaan Masuk</h2>
          <p className="mt-1.5 text-xs max-w-2xl leading-relaxed text-slate-500">
            Pertanyaan dari form FAQ publik dan pesan chat yang gagal dijawab otomatis. Ubah menjadi FAQ agar tidak perlu dijawab manual berulang kali.
          </p>
        </div>

        {/* Kartu statistik */}
        <PertanyaanStats {...statistik} />

        {/* Tab status */}
        <div className="flex flex-wrap gap-2">
          {TAB.map((t) => {
            const jumlah =
              t.key === "semua" ? statistik.total : statistik[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(0);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  tab === t.key
                    ? "bg-gradient-to-r from-[#0B1442] to-[#004F9F] text-white shadow-lg"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.label}
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                    tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {jumlah}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kartu tabel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {/* Kepala kartu: identitas tabel dan tindakan utamanya */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-6 pb-5">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Inbox className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#0B1442]">Daftar Pertanyaan</h3>
                <p className="mt-0.5 text-xs text-slate-400 max-w-xl leading-relaxed">
                  Gunakan tombol filter untuk menyaring pertanyaan berdasarkan sumber dan tingkat pengulangannya.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-start">
              <button
                onClick={muatUlang}
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F] hover:bg-blue-50 hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
                Muat ulang
              </button>
            </div>
          </div>

          {/* Baris kedua: Urutkan - Filter - Pencarian */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pb-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <PertanyaanSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
              <button
                onClick={() => setShowFilterModal(true)}
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

            <div
              className={`relative w-full sm:w-64 shrink-0 transition-transform duration-200 ${
                isSearchFocused ? "sm:scale-[1.03]" : ""
              }`}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${
                  isSearchFocused ? "text-[#004F9F] scale-110" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(0);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Cari pertanyaan, nama, email..."
                className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all duration-200 ${
                  isSearchFocused
                    ? "border-[#004F9F] bg-white shadow-md ring-4 ring-[#00A5EC]/15"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {columns.map((col) => (
                    <SortableHeader
                      key={col.key}
                      column={col}
                      columnSort={columnSort}
                      setColumnSort={setColumnSort}
                    />
                  ))}
                  <th className="px-6 py-3.5 text-right text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">
                      Memuat pertanyaan masuk…
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr className="animate-[fadeslide_0.3s_ease-out]">
                    <td colSpan={8} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                          <Inbox className="w-6 h-6" />
                          <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
                        </span>
                        <p className="text-sm font-bold text-slate-500">Tidak ada pertanyaan</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {semua.length === 0
                            ? "Belum ada pertanyaan peserta yang masuk ke sistem."
                            : "Semua pertanyaan pada kategori ini sudah tertangani."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => {
                    const IkonStatus = IKON_STATUS[item.status] || XCircle;
                    const skor = Math.round((item.skor_tertinggi || 0) * 100);

                    return (
                    <tr
                      key={item.id}
                      className="group border-b border-slate-50 transition-colors duration-200 hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-4 w-[250px] max-w-[250px] align-top">
                        <p className="text-[12px] font-bold leading-snug text-[#0B1442] line-clamp-2">{item.pertanyaan}</p>
                        <p className="mt-1 truncate text-[10.5px] text-slate-400">{fmtDateTime(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 w-[170px] max-w-[170px] align-top">
                        <p className="truncate text-[12px] font-bold text-slate-700" title={item.nama}>{item.nama}</p>
                        <p className="whitespace-normal break-words text-[10.5px] leading-relaxed text-slate-400" title={item.email}>{item.email || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F] group-hover:shadow-sm">
                          {item.sumber === "chat_bot" ? (
                            <>
                              <MessageSquare className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" /> Chat bot
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" /> Form publik
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(item.jumlah_serupa || 1) > 1 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm">
                            <Repeat2 className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-125" /> {item.jumlah_serupa}x
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300">1x</span>
                        )}
                      </td>
                        <td className="px-6 py-4">
                        {skor > 0 ? (
                          <div className="w-32">
                            <div className="mb-1 flex items-center justify-between text-[10.5px] font-bold text-slate-500">
                              <span>Kemiripan</span>
                              <span className={skor < 40 ? "text-red-500" : ""}>{skor}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                  skor < 40
                                    ? "bg-gradient-to-r from-red-600 to-red-400"
                                    : skor >= 70
                                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                      : "bg-gradient-to-r from-[#0B1442] to-[#00A5EC]"
                                }`}
                                style={{ width: `${skor}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">terhadap FAQ terdekat</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300">Belum cocok</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold capitalize transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm ${
                            warnaStatus[item.status] || warnaStatus.diabaikan
                          }`}
                        >
                          <IkonStatus className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10.5px] text-slate-500">
                        {fmtDateTime(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PertanyaanActionsDropdown
                          sudahSelesai={item.status === "selesai"}
                          onDetail={() => setDetailItem(item)}
                          onJadikanFaq={() => bukaModalFaq(item)}
                          onSelesai={() => ubahStatus(item, "selesai")}
                          onHapus={() => hapus(item)}
                        />
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={terfilter.length}
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        </div>
      </div>

      {showFilterModal && (
        <PertanyaanFilterModal
          sumberList={sumberList}
          toggleSumber={toggleSumber}
          ulangList={ulangList}
          toggleUlang={toggleUlang}
          onApply={() => {
            setAppliedSumber(sumberList);
            setAppliedUlang(ulangList);
            setPage(0);
            setShowFilterModal(false);
          }}
          onReset={() => {
            setSumberList([]);
            setUlangList([]);
            setAppliedSumber([]);
            setAppliedUlang([]);
            setPage(0);
          }}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {detailItem && (
        <PertanyaanDetailModal
          item={detailItem}
          onJadikanFaq={bukaModalFaq}
          onUbahStatus={ubahStatus}
          onHapus={hapus}
          onClose={() => setDetailItem(null)}
        />
      )}

      {showModal && (
        <FaqModal
          editMode={false}
          question={question} setQuestion={setQuestion}
          answer={answer} setAnswer={setAnswer}
          keywords={keywords} setKeywords={setKeywords}
          category={category} setCategory={setCategory}
          quickLabel={quickLabel} setQuickLabel={setQuickLabel}
          isActive={isActive} setIsActive={setIsActive}
          showOnLanding={showOnLanding} setShowOnLanding={setShowOnLanding}
          isQuickAction={isQuickAction} setIsQuickAction={setIsQuickAction}
          sisaQuickAction={sisaQuickAction}
          loading={loadingSimpan}
          onSubmit={simpanFaqBaru}
          onClose={() => setShowModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default PertanyaanMasukPage;