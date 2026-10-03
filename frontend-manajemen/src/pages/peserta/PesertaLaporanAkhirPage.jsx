import { useState, useEffect } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import LaporanStatusBar from "../../components/manajemen/peserta/penilaian/LaporanStatusBar";
import LaporanUploadForm from "../../components/manajemen/peserta/penilaian/LaporanUploadForm";
import PanduanSistematikaCard from "../../components/manajemen/peserta/penilaian/PanduanSistematikaCard";
import { getLaporanAkhirPeserta, getDashboardPeserta } from "../../services/pesertaService";

export const PesertaLaporanAkhirPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let res;
        try {
          res = await getLaporanAkhirPeserta();
        } catch {
          res = await getDashboardPeserta();
        }
        if (isMounted) {
          setData(res.data?.data || {});
        }
      } catch (err) {
        console.error("Gagal memuat status laporan akhir:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const pendaftaran = data?.pendaftaran || {};
  const laporanStatus = data?.laporan_akhir || {};
  const timeline = data?.timeline || {};
  const mentor = data?.mentor || {};

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-white">
            Pengumpulan Laporan Akhir Magang
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Unggah naskah laporan magang lengkap sesuai ketentuan instansi/kampus Anda untuk diverifikasi dan disahkan oleh mentor pembimbing lapangan.
          </p>
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
              <LaporanStatusBar
                pendaftaran={pendaftaran}
                laporanStatus={laporanStatus}
                timeline={timeline}
                mentor={mentor}
              />

              {/* Upload Form Component */}
              <LaporanUploadForm
                key={`${pendaftaran.id || "laporan-form"}-${laporanStatus?.status || ""}`}
                pendaftaran={pendaftaran}
                laporanStatus={laporanStatus}
                onUploaded={() => setReloadKey((k) => k + 1)}
              />
            </div>

            {/* Right Col (1 Col): Informasi Ketentuan Laporan Component */}
            <div className="space-y-6">
              <PanduanSistematikaCard institusi={pendaftaran.institusi} />
            </div>
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default PesertaLaporanAkhirPage;
