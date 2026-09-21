import { useState, useEffect, useCallback, useMemo } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import TugasStatCards from "../../components/manajemen/peserta/pembelajaran/TugasStatCards";
import TugasCard from "../../components/manajemen/peserta/pembelajaran/TugasCard";
import KumpulTugasModal from "../../components/manajemen/peserta/pembelajaran/KumpulTugasModal";
import { getTugasPeserta } from "../../services/pembelajaranService";
import { RefreshCw, Inbox } from "lucide-react";

export const PesertaTugasPage = () => {
  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchTugas = useCallback(async () => {
    try {
      const res = await getTugasPeserta();
      setTugasList(res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat daftar tugas:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchTugas();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchTugas, reloadKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTugas();
  };

  // Filter and Search
  const filteredTugas = useMemo(() => {
    return tugasList.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === "semua" ||
        (filterStatus === "belum_kumpul" && !item.pengumpulan) ||
        (filterStatus === "menunggu" && item.pengumpulan?.status === "menunggu") ||
        (filterStatus === "dinilai" && item.pengumpulan?.status === "dinilai");

      return matchSearch && matchStatus;
    });
  }, [tugasList, searchQuery, filterStatus]);

  // Statistik ringkas
  const stats = useMemo(() => {
    const total = tugasList.length;
    const selesai = tugasList.filter((t) => t.pengumpulan?.status === "dinilai").length;
    const menunggu = tugasList.filter((t) => t.pengumpulan?.status === "menunggu").length;
    const belum = total - selesai - menunggu;
    return { total, selesai, menunggu, belum };
  }, [tugasList]);

  return (
    <PesertaLayout searchValue={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-white">
              Tugas &amp; Penugasan Magang
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Kerjakan penugasan terstruktur dari mentor untuk meningkatkan kompetensi dan rekam jejak penilaian magang.
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

        {/* Metric Stat Cards Component */}
        <TugasStatCards stats={stats} />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "semua", label: "Semua Tugas" },
            { key: "belum_kumpul", label: "Belum Kumpul" },
            { key: "menunggu", label: "Menunggu Review" },
            { key: "dinilai", label: "Sudah Dinilai" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === f.key
                  ? "bg-[#004F9F] text-white shadow-xs"
                  : "bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat penugasan Anda...</p>
          </div>
        ) : filteredTugas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300">
              <Inbox className="w-6 h-6" />
            </span>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Tidak ada tugas yang sesuai
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Semua tugas magang Anda dari mentor pembimbing akan ditampilkan di halaman ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTugas.map((tugas) => (
              <TugasCard
                key={tugas.id}
                tugas={tugas}
                onKumpul={(item) => setSelectedTugas(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Kumpul Tugas Component */}
      {selectedTugas && (
        <KumpulTugasModal
          tugas={selectedTugas}
          onClose={() => setSelectedTugas(null)}
          onSaved={() => {
            setSelectedTugas(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </PesertaLayout>
  );
};

export default PesertaTugasPage;
