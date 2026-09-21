import { useState, useEffect, useCallback, useMemo } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import MateriHeroBanner from "../../components/manajemen/peserta/pembelajaran/MateriHeroBanner";
import MateriKategoriFilter from "../../components/manajemen/peserta/pembelajaran/MateriKategoriFilter";
import MateriCard from "../../components/manajemen/peserta/pembelajaran/MateriCard";
import { getMateriPeserta } from "../../services/pembelajaranService";
import { RefreshCw, Inbox } from "lucide-react";

export const PesertaMateriPage = () => {
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  const fetchMateri = useCallback(async () => {
    try {
      const res = await getMateriPeserta();
      setMateriList(res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat materi pembelajaran:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchMateri();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchMateri]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMateri();
  };

  // Distinct Kategori
  const kategoriOptions = useMemo(() => {
    const list = ["Semua"];
    materiList.forEach((m) => {
      if (m.kategori && !list.includes(m.kategori)) {
        list.push(m.kategori);
      }
    });
    return list;
  }, [materiList]);

  // Filtered List
  const filteredMateri = useMemo(() => {
    return materiList.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kategori?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchKategori = selectedKategori === "Semua" || item.kategori === selectedKategori;

      return matchSearch && matchKategori;
    });
  }, [materiList, searchQuery, selectedKategori]);

  return (
    <PesertaLayout searchValue={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-white">
              Modul Materi Pembelajaran
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pelajari modul panduan teknis, SOP dinas, standar arsitektur sistem, dan referensi kerja magang Diskominfo.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#004F9F]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Hero Knowledge Banner Component */}
        <MateriHeroBanner totalMateri={materiList.length} />

        {/* Category Filters Component */}
        <MateriKategoriFilter
          kategoriOptions={kategoriOptions}
          selectedKategori={selectedKategori}
          onSelectKategori={setSelectedKategori}
        />

        {/* Materials Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat modul pembelajaran...</p>
          </div>
        ) : filteredMateri.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300">
              <Inbox className="w-6 h-6" />
            </span>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Tidak ada modul materi yang ditemukan
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Coba sesuaikan kata kunci pencarian atau pilih kategori modul lainnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMateri.map((materi) => (
              <MateriCard key={materi.id} materi={materi} />
            ))}
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default PesertaMateriPage;
