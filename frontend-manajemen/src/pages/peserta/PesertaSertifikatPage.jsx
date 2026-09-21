import { useState, useEffect, useCallback } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import SertifikatMockupCard from "../../components/manajemen/peserta/penilaian/SertifikatMockupCard";
import SertifikatChecklistCard from "../../components/manajemen/peserta/penilaian/SertifikatChecklistCard";
import { getSertifikatSaya, getDashboardPeserta } from "../../services/pesertaService";
import { getNilaiSaya } from "../../services/penilaianService";
import { exportSertifikatPdf } from "../../utils/exportSertifikatPdf";
import { toastSuccess, toastError } from "../../utils/swal";
import {
  Download,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export const PesertaSertifikatPage = () => {
  const [sertifikatInfo, setSertifikatInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [nilaiData, setNilaiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sertRes, dashRes, nilaiRes] = await Promise.allSettled([
        getSertifikatSaya(),
        getDashboardPeserta(),
        getNilaiSaya(),
      ]);

      if (sertRes.status === "fulfilled") {
        setSertifikatInfo(sertRes.value?.data?.data || null);
      }
      if (dashRes.status === "fulfilled") {
        setDashboardData(dashRes.value?.data?.data || null);
      }
      if (nilaiRes.status === "fulfilled") {
        setNilaiData(nilaiRes.value?.data?.data || null);
      }
    } catch (err) {
      console.error("Gagal memuat sertifikat:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDownload = async () => {
    if (!sertifikatInfo || !sertifikatInfo.ada_sertifikat) {
      toastError("Sertifikat belum diterbitkan oleh pihak dinas.");
      return;
    }
    setDownloading(true);
    try {
      await exportSertifikatPdf(sertifikatInfo.data, sertifikatInfo.pengaturan);
      toastSuccess("Sertifikat resmi PDF berhasil diunduh.");
    } catch (err) {
      toastError("Gagal mengekspor sertifikat PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const adaSertifikat = Boolean(
    sertifikatInfo?.ada_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat
  );

  const sertifikat = sertifikatInfo?.data?.sertifikat || {};
  const peserta = sertifikatInfo?.data?.peserta || dashboardData?.pendaftaran || {};
  const laporanDisetujui = dashboardData?.laporan_akhir?.status === "disetujui";
  const nilaiDiterbitkan = nilaiData?.sudah_dinilai;
  const predikat = nilaiData?.penilaian?.predikat_akhir || "Sangat Memuaskan";

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-white">
              Sertifikat Resmi Magang
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Dokumen kelulusan resmi berstandar Dinas Komunikasi dan Informatika dengan verifikasi nomor registrasi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#004F9F]" : ""}`} />
              <span>Segarkan</span>
            </button>

            {adaSertifikat && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? "Menyiapkan PDF..." : "Unduh Sertifikat PDF"}</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-6 w-6 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat status sertifikat...</p>
          </div>
        ) : !adaSertifikat ? (
          /* State Belum Terbit */
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="flex justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Clock className="w-8 h-8" />
                </span>
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-[#0B1442] dark:text-white">
                  Sertifikat Belum Diterbitkan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sertifikat resmi magang akan diterbitkan oleh pihak dinas setelah seluruh tahapan evaluasi dan berkas laporan akhir dinyatakan tuntas.
                </p>
              </div>
            </div>

            {/* Checklist Persyaratan Component */}
            <SertifikatChecklistCard
              laporanDisetujui={laporanDisetujui}
              nilaiDiterbitkan={nilaiDiterbitkan}
            />
          </div>
        ) : (
          /* State Sudah Terbit: Tampilan Mockup Sertifikat Mewah */
          <div className="space-y-6">
            {/* Banner Verifikasi */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border border-amber-400/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Sertifikat Sah &amp; Terverifikasi
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Resmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    No. Registrasi: <strong className="font-mono text-slate-800 dark:text-slate-200">{sertifikat.nomor_sertifikat}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
            </div>

            {/* Mockup Frame Sertifikat Component */}
            <SertifikatMockupCard
              sertifikat={sertifikat}
              peserta={peserta}
              predikat={predikat}
            />
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default PesertaSertifikatPage;
