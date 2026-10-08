import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  CheckCircle2,
  RefreshCw,
  Edit3,
  FileText,
  Clock,
  Inbox,
  GraduationCap,
  Building2,
  BookOpen,
  UserCheck,
  BookOpenCheck,
  FileCheckCorner,
  Search,
  X,
  Loader2
} from "lucide-react";
import { CustomSelectDropdown } from "../../components/manajemen/mentor/peserta/CustomSelectDropdown";
import {
  getPesertaBimbinganPenilaian,
  getDetailPenilaianPeserta,
  simpanPenilaianPeserta
} from "../../services/penilaianService";
import { PenilaianMentorStats } from "../../components/manajemen/mentor/penilaian/PenilaianMentorStats";
import { PenilaianModalTabs } from "../../components/manajemen/mentor/penilaian/PenilaianModalTabs";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";
import { getFileUrl } from "../../utils/fileUrl";

const formatTitleCase = (text) => {
  if (!text) return "-";
  return String(text)
    .toLowerCase()
    .replace(/(^|[\s\-/])([a-z])/g, (_, boundary, letter) => boundary + letter.toUpperCase())
    .replace(/\bUpn\b/g, "UPN")
    .replace(/\bSmk\b/g, "SMK")
    .replace(/\bSma\b/g, "SMA")
    .replace(/\bS1\b/g, "S1")
    .replace(/\bD3\b/g, "D3")
    .replace(/\bD4\b/g, "D4")
    .replace(/\bTi\b/g, "TI")
    .replace(/\bSi\b/g, "SI");
};

const JENJANG_OPTIONS = [
  { value: "semua", label: "Semua Jenjang Studi" },
  { value: "mahasiswa", label: "Mahasiswa (Perguruan Tinggi)" },
  { value: "siswa", label: "Siswa (SMK/SMA)" },
];

const getPredikatBadge = (nilai, indeksFromDb, predikatFromDb) => {
  if (nilai == null) return null;
  const score = Number(nilai);

  let indeks = indeksFromDb;
  let predikat = predikatFromDb;

  if (!indeks || !predikat) {
    if (score >= 85) {
      indeks = "A";
      predikat = "Sangat Baik";
    } else if (score >= 70) {
      indeks = "B";
      predikat = "Baik";
    } else if (score >= 60) {
      indeks = "C";
      predikat = "Cukup";
    } else if (score >= 40) {
      indeks = "D";
      predikat = "Kurang";
    } else {
      indeks = "E";
      predikat = "Kurang";
    }
  }

  let textColor = "text-rose-600 dark:text-rose-400";
  let badgeClass = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (indeks === "A") {
    textColor = "text-blue-600 dark:text-sky-400";
    badgeClass = "bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/30";
  } else if (indeks === "B") {
    textColor = "text-emerald-600 dark:text-emerald-400";
    badgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  } else if (indeks === "C") {
    textColor = "text-amber-600 dark:text-amber-400";
    badgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  } else if (indeks === "D") {
    textColor = "text-orange-600 dark:text-orange-400";
    badgeClass = "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
  }

  return {
    score: score.toFixed(2),
    indeks,
    predikat,
    textColor,
    badgeClass,
  };
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const PenilaianMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState("semua"); // "semua" | "belum_dinilai" | "draf" | "final"
  const [filterJenjang, setFilterJenjang] = useState("semua"); // "semua" | "mahasiswa" | "siswa"

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Buka Modal Form Penilaian (Ambil data terlebih dahulu, langsung buka modal penuh tanpa animasi loading mengambang)
  const handleOpenForm = useCallback(async (peserta) => {
    const pesertaId = peserta?.peserta_id || peserta?.id;
    if (!pesertaId) {
      toastError("ID Peserta tidak valid");
      return;
    }

    setSelectedPeserta(peserta);
    setOpeningId(pesertaId);

    try {
      const res = await getDetailPenilaianPeserta(pesertaId);
      const data = res.data?.data || {};
      setDetailData(data);
      setModalOpen(true);
    } catch {
      toastError("Gagal memuat rincian instrumen penilaian peserta");
    } finally {
      setOpeningId(null);
    }
  }, []);

  // Fetch Daftar Peserta Bimbingan Penilaian
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPesertaBimbinganPenilaian();
      const items = res.data?.data || [];
      setList(items);

      // Otomatis buka form penilaian jika diarahkan dari halaman verifikasi laporan akhir
      const targetId = location.state?.selectedPesertaId || searchParams.get("peserta_id");
      if (targetId) {
        const found = items.find(
          (p) =>
            String(p.peserta_id) === String(targetId) ||
            String(p.id) === String(targetId) ||
            String(p.akun_peserta_id) === String(targetId)
        );
        if (found) {
          handleOpenForm(found);
        }
      }
    } catch {
      toastError("Gagal memuat daftar peserta bimbingan");
    } finally {
      setLoading(false);
    }
  }, [location.state, searchParams, handleOpenForm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Simpan Penilaian (Draf atau Final)
  const handleSavePenilaian = async (statusTarget, payload, totalNilaiAkhir, indeksAkhir, options = {}) => {
    const pesertaId = selectedPeserta?.peserta_id || selectedPeserta?.id;
    if (!pesertaId) {
      toastError("ID Peserta tidak valid");
      return;
    }

    if (!options?.skipConfirm) {
      if (statusTarget === "final") {
        const confirm = await confirmDialog({
          title: "Finalisasi & Terbitkan Nilai?",
          text: `Nilai akhir kumulatif peserta sebesar ${totalNilaiAkhir.toFixed(1)} (Predikat ${indeksAkhir}) akan diterbitkan secara resmi sebagai rapor nilai magang. Nilai akan dibekukan permanen dan transkrip resmi peserta akan diterbitkan.`,
          confirmText: "Ya, Terbitkan Nilai",
          cancelText: "Batal",
          icon: "question",
        });
        if (!confirm?.isConfirmed) return;
      } else if (statusTarget === "draf") {
        const confirm = await confirmDialog({
          title: "Simpan Draf Penilaian?",
          text: `Simpan progres penilaian sementara untuk ${selectedPeserta?.nama}? Nilai belum akan diterbitkan dan Anda masih dapat mengubahnya kembali kapan saja.`,
          confirmText: "Ya, Simpan Draf",
          cancelText: "Batal",
          icon: "question",
        });
        if (!confirm?.isConfirmed) return;
      }
    }

    setSaving(true);
    try {
      await simpanPenilaianPeserta(pesertaId, payload);
      toastSuccess(
        statusTarget === "final"
          ? "Penilaian resmi berhasil difinalisasi & diterbitkan!"
          : "Draf penilaian berhasil disimpan."
      );
      window.dispatchEvent(new Event("sim_notifikasi_updated"));
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  // Unduh Rapor PDF langsung dari baris tabel
  const handleDownloadTranskrip = async (peserta) => {
    const pId = peserta?.peserta_id || peserta?.id;
    if (!pId) return;

    setDownloadingId(pId);
    try {
      const res = await getDetailPenilaianPeserta(pId);
      const data = res.data?.data || {};
      await exportTranskripNilaiPdf(data);
      toastSuccess(`Transkrip nilai resmi ${peserta.nama} berhasil diunduh`);
    } catch (err) {
      toastError("Gagal mengunduh PDF transkrip: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Kalkulasi Statistik Metrik (Tersinkronisasi dengan filter jenjang)
  const stats = useMemo(() => {
    const baseList =
      filterJenjang === "semua"
        ? list
        : list.filter((r) => (r.kategori_pendaftar || "").toLowerCase() === filterJenjang);

    const total = baseList.length;
    const final = baseList.filter((r) => r.status_penilaian === "final").length;
    const draf = baseList.filter((r) => r.status_penilaian === "draf").length;
    const belumDinilai = baseList.filter((r) => !r.status_penilaian || r.status_penilaian === "belum_dinilai").length;
    return { total, final, draf, belumDinilai };
  }, [list, filterJenjang]);

  // Filter & Search
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.institusi || "").toLowerCase().includes(q) ||
        (item.jurusan || "").toLowerCase().includes(q) ||
        (item.nim || "").toLowerCase().includes(q) ||
        (item.bidang || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (activeFilter === "final" && item.status_penilaian !== "final") return false;
      if (activeFilter === "draf" && item.status_penilaian !== "draf") return false;
      if (activeFilter === "belum_dinilai") {
        const isBelum = !item.status_penilaian || item.status_penilaian === "belum_dinilai";
        if (!isBelum) return false;
      }

      if (filterJenjang !== "semua") {
        const itemJenjang = (item.kategori_pendaftar || "").toLowerCase();
        if (itemJenjang !== filterJenjang) return false;
      }

      return true;
    });
  }, [list, search, activeFilter, filterJenjang]);

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── 1. HEADER HALAMAN: Bersih, Rapi, Sesuai Laporan Akhir Role Mentor ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Penilaian Peserta Bimbingan
          </h2>
          <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Evaluasi kinerja peserta magang berdasarkan 4 pilar kompetensi: Profesional, Personal, Sosial, dan Administratif.
          </p>
        </div>

        {/* ── 2. METRIC CARDS ── */}
        <PenilaianMentorStats
          stats={stats}
          isDark={isDark}
          loading={loading}
        />

        {/* ── 3. TOOLBAR: FILTER STATUS & PENCARIAN (SESUAI HALAMAN LAPORAN AKHIR) ── */}
        <div
          className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all ${
            isDark
              ? "bg-[#161b22] border-white/10 shadow-xs"
              : "bg-white border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Tab Filter Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto xl:overflow-x-visible py-1.5 custom-scrollbar">
              {[
                { key: "semua", label: "Semua", count: stats.total },
                { key: "belum_dinilai", label: "Belum Dinilai", count: stats.belumDinilai },
                { key: "draf", label: "Draf", count: stats.draf },
                { key: "final", label: "Diterbitkan", count: stats.final },
              ].map((tab) => {
                const isAktif = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                            : "bg-[#004F9F] text-white shadow-2xs"
                          : isDark
                          ? "bg-white/10 text-sky-400 border border-white/10"
                          : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sisi Kanan: Dropdown Jenjang Studi & Search Bar */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1.5">
              <CustomSelectDropdown
                value={filterJenjang}
                onChange={setFilterJenjang}
                options={JENJANG_OPTIONS}
                icon={GraduationCap}
                isDark={isDark}
                menuWidth={225}
                className="!h-7.5 sm:!h-8 text-[11px]"
              />

              <div
                className={`group relative flex-1 sm:w-56 md:w-64 sm:flex-initial transition-transform duration-200 ${
                  isSearchFocused ? "scale-[1.005]" : ""
                }`}
              >
                <Search
                  className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 pointer-events-none ${
                    isSearchFocused
                      ? isDark
                        ? "text-[#00A5EC] scale-110"
                        : "text-[#004F9F] scale-110"
                      : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari peserta / NIM / bidang..."
                  className={`w-full h-7.5 sm:h-8 rounded-xl border pl-8 sm:pl-8.5 pr-7 text-[11px] font-medium outline-hidden transition-all duration-200 ${
                    isDark
                      ? isSearchFocused
                        ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-3 ring-[#00A5EC]/20"
                        : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                      : isSearchFocused
                        ? "border-[#004F9F] bg-white shadow-md ring-3 ring-[#00A5EC]/15 text-slate-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                      isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Hapus Pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                    isSearchFocused ? "w-[calc(100%-10px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. TABEL PESERTA BIMBINGAN PENILAIAN ── */}
        <div
          className={`overflow-hidden rounded-2xl border shadow-xs ${
            isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr
                  className={`border-b ${
                    isDark
                      ? "border-white/10 bg-white/[0.02] text-slate-400"
                      : "border-slate-200 bg-slate-50/80 text-slate-600"
                  } text-[10.5px] font-black uppercase tracking-wider`}
                >
                  <th className="py-3.5 px-4">Peserta Bimbingan</th>
                  <th className="py-3.5 px-4">Prasyarat Penilaian Akhir</th>
                  <th className="py-3.5 px-4 text-center">Rincian Penilaian 4 Pilar</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir & Predikat</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? "divide-white/5 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00A5EC]" />
                      <p className="text-xs font-bold">Memuat daftar peserta bimbingan...</p>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">Tidak ada data peserta bimbingan ditemukan.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {search ? "Coba kata kunci pencarian lain" : "Belum ada peserta bimbingan yang sesuai filter"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => {
                    const isFinal = row.status_penilaian === "final";
                    const isDraf = row.status_penilaian === "draf";
                    const isDownloading = downloadingId === (row.peserta_id || row.id);
                    const foto = row.foto_profil;

                    // Predikat Nilai Akhir
                    const pInfo = getPredikatBadge(row.nilai_akhir_angka, row.indeks_nilai_akhir, row.predikat_akhir);

                    // Status Laporan Akhir (Prasyarat Penilaian Akhir)
                    const hasLaporanFile = Boolean(row.file_laporan_akhir && String(row.file_laporan_akhir).trim() !== "");
                    const isLaporanAcc = hasLaporanFile && Boolean(
                      row.laporan_akhir_disetujui || (row.status_laporan_akhir || "").toLowerCase() === "disetujui"
                    );
                    const isLaporanRevisi = hasLaporanFile && (
                      (row.status_laporan_akhir || "").toLowerCase() === "revisi" ||
                      (row.status_laporan_akhir || "").toLowerCase() === "perlu_revisi"
                    );
                    const isLaporanMenunggu = hasLaporanFile && !isLaporanAcc && !isLaporanRevisi;

                    return (
                      <tr
                        key={row.peserta_id || row.id}
                        className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}
                      >
                        {/* Kolom 1: Peserta Bimbingan (Nama, NIM/NISN, Jurusan & Institusi dengan Title Case, Foto Lebih Besar) */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0 mt-0.5">
                              {foto ? (
                                <img
                                  src={getFileUrl(foto)}
                                  alt={row.nama}
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center text-white font-black text-sm shadow-xs">
                                  {getInitials(row.nama)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block truncate text-xs sm:text-sm">
                                {formatTitleCase(row.nama)}
                              </span>
                              <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <div className="font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                                  {row.kategori_pendaftar === "siswa" ? "NISN" : "NIM"}: {row.nim || "-"}
                                </div>
                                <div
                                  className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 truncate max-w-[210px] sm:max-w-[250px]"
                                  title={`Jurusan: ${formatTitleCase(row.jurusan)}`}
                                >
                                  <BookOpen className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{formatTitleCase(row.jurusan)}</span>
                                </div>
                                <div
                                  className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[210px] sm:max-w-[250px]"
                                  title={`Institusi: ${formatTitleCase(row.institusi)}`}
                                >
                                  <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{formatTitleCase(row.institusi)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: Prasyarat Penilaian Akhir (Presensi, Logbook Harian, Laporan Akhir Rata Lurus) */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5 text-[11px]">
                            {/* Baris 1: Presensi Kehadiran */}
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 w-34 sm:w-36 shrink-0">
                                <UserCheck className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Presensi Kehadiran</span>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold border ${
                                    (row.hadir_presensi || 0) > 0
                                      ? "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/40"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/80 dark:border-white/10"
                                  }`}
                                >
                                  <span>{(Number(row.persen_presensi) || 0).toFixed(1)}%</span>
                                  <span className="font-normal opacity-75 text-[10px]">
                                    ({row.hadir_presensi || 0}/{row.total_presensi || 0} hr)
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Baris 2: Logbook Harian */}
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 w-34 sm:w-36 shrink-0">
                                <BookOpenCheck className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Logbook Harian</span>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold border ${
                                    (row.terisi_logbook ?? row.acc_logbook ?? 0) > 0
                                      ? "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/40"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/80 dark:border-white/10"
                                  }`}
                                >
                                  <span>{(Number(row.persen_logbook) || 0).toFixed(1)}%</span>
                                  <span className="font-normal opacity-75 text-[10px]">
                                    ({row.terisi_logbook ?? row.acc_logbook ?? 0}/{row.total_logbook || 0} hr)
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Baris 3: Laporan Akhir */}
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 w-34 sm:w-36 shrink-0">
                                <FileCheckCorner className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Laporan Akhir</span>
                              </div>
                              <div>
                                {isLaporanAcc ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/40">
                                    Acc Mentor
                                  </span>
                                ) : isLaporanRevisi ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/40">
                                    Perlu Revisi
                                  </span>
                                ) : isLaporanMenunggu ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40">
                                    Menunggu ACC
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-white/10">
                                    Belum Mengirim
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 3: Rincian Penilaian 4 Pilar (Berjejer Menurun & Nama Lengkap) */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center justify-center">
                            {row.nilai_profesional != null ? (
                              <div className="space-y-1 text-[11px] w-full max-w-[170px] sm:max-w-[185px]">
                                {/* 1. Profesional */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Profesional</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                    {Number(row.nilai_profesional).toFixed(0)}
                                  </span>
                                </div>

                                {/* 2. Personal */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Personal</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                    {Number(row.nilai_personal).toFixed(0)}
                                  </span>
                                </div>

                                {/* 3. Sosial */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Sosial</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    {Number(row.nilai_sosial).toFixed(0)}
                                  </span>
                                </div>

                                {/* 4. Administratif */}
                                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Administratif</span>
                                  </div>
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                    {Number(row.nilai_administratif).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 italic">
                                Belum dinilai
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kolom 4: Nilai Akhir & Predikat (Sesuai Gambar 3) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center justify-center min-w-[125px] sm:min-w-[135px] px-3 py-2 sm:py-2.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-2xs">
                            {pInfo ? (
                              <>
                                <span className="text-xl sm:text-2xl font-black text-[#030048] dark:text-white leading-tight tracking-tight">
                                  {pInfo.score}
                                </span>
                                <span className={`text-xs sm:text-[13px] font-extrabold mt-0.5 leading-tight ${pInfo.textColor}`}>
                                  Predikat {pInfo.indeks}
                                </span>
                                <span className={`text-[11px] sm:text-xs font-bold leading-tight ${pInfo.textColor}`}>
                                  ({pInfo.predikat})
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                  {isFinal ? "Nilai Diterbitkan" : "Nilai Sementara"}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-lg sm:text-xl font-black text-slate-300 dark:text-slate-600 leading-tight">
                                  -
                                </span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                  Belum Dinilai
                                </span>
                                <span className="text-[10.5px] font-medium text-slate-400/80 dark:text-slate-500">
                                  (Belum Ada Nilai)
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 italic">
                                  Menunggu Evaluasi
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Kolom 5: Status */}
                        <td className="py-3 px-4 text-center">
                          {isFinal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Diterbitkan
                            </span>
                          ) : isDraf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              Draf
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400">
                              Belum Dinilai
                            </span>
                          )}
                        </td>

                        {/* Kolom 6: Aksi (dengan animasi hover pada ikon) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenForm(row)}
                              disabled={Boolean(openingId)}
                              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                                isFinal
                                  ? "border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:shadow-xs"
                                  : "bg-gradient-to-r from-[#0B1442] to-[#004F9F] text-white hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                              } ${openingId === (row.peserta_id || row.id) ? "opacity-75 cursor-wait" : ""}`}
                            >
                              {openingId === (row.peserta_id || row.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Edit3 className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-rotate-12" />
                              )}
                              <span>{isFinal ? "Edit Nilai" : isDraf ? "Lanjut Nilai" : "Beri Nilai"}</span>
                            </button>

                            {isFinal && (
                              <button
                                type="button"
                                onClick={() => handleDownloadTranskrip(row)}
                                disabled={isDownloading}
                                title="Unduh Transkrip Nilai Resmi PDF"
                                className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:shadow-xs transition-all duration-200 cursor-pointer"
                              >
                                <FileText className={`w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-12 ${isDownloading ? "animate-spin" : ""}`} />
                                <span className="hidden md:inline">Rapor PDF</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 5. MODAL FORM PENILAIAN 4 PILAR (TABS) ── */}
        <PenilaianModalTabs
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedPeserta={selectedPeserta}
          detailData={detailData}
          onSave={handleSavePenilaian}
          saving={saving}
          isDark={isDark}
        />
      </div>
    </MentorLayout>
  );
};

export default PenilaianMentorPage;
