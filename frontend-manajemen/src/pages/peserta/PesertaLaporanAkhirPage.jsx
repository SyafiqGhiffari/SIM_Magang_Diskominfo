import { useState, useEffect } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import LaporanStatusBar from "../../components/manajemen/peserta/penilaian/LaporanStatusBar";
import LaporanUploadForm from "../../components/manajemen/peserta/penilaian/LaporanUploadForm";
import PanduanSistematikaCard from "../../components/manajemen/peserta/penilaian/PanduanSistematikaCard";
import { getDashboardPeserta } from "../../services/pesertaService";
import { RefreshCw } from "lucide-react";

export const PesertaLaporanAkhirPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await getDashboardPeserta();
        if (isMounted) {
          setData(res.data?.data || {});
        }
      } catch (err) {
        console.error("Gagal memuat status laporan akhir:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  };

  const pendaftaran = data?.pendaftaran || {};
  const laporanStatus = data?.laporan_akhir || {};

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-white">
              Pengumpulan Laporan Akhir Magang
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Unggah naskah laporan akhir praktek kerja dan tautan luaran proyek untuk direview oleh mentor pembimbing.
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

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat status laporan akhir...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col (2 Cols): Upload Form & Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Banner Component */}
              <LaporanStatusBar pendaftaran={pendaftaran} laporanStatus={laporanStatus} />

              {/* Upload Form Component */}
              <LaporanUploadForm
                key={pendaftaran.id || "laporan-form"}
                pendaftaran={pendaftaran}
                onUploaded={() => setReloadKey((k) => k + 1)}
              />
            </div>

            {/* Right Col (1 Col): Panduan Sistematika Laporan Component */}
            <div className="space-y-6">
              <PanduanSistematikaCard />
            </div>
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default PesertaLaporanAkhirPage;
