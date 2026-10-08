import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PesertaLayout from "../../layouts/PesertaLayout";
import RealSertifikatViewer from "../../components/manajemen/peserta/penilaian/RealSertifikatViewer";
import SertifikatChecklistCard from "../../components/manajemen/peserta/penilaian/SertifikatChecklistCard";
import { getSertifikatSaya, getDashboardPeserta } from "../../services/pesertaService";
import { getNilaiSaya } from "../../services/penilaianService";
import { exportSertifikatPdf } from "../../utils/exportSertifikatPdf";
import { toastSuccess, toastError } from "../../utils/swal";
import {
  Download,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  ArrowUpRight,
  FileText,
  Hash,
  User,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
} from "lucide-react";

export const PesertaSertifikatPage = () => {
  const [sertifikatInfo, setSertifikatInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [nilaiData, setNilaiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

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
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData]);

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

  const handleCopyNomor = () => {
    const nomor = sertifikatInfo?.data?.sertifikat?.nomor_sertifikat;
    if (!nomor) return;
    navigator.clipboard.writeText(nomor);
    setCopied(true);
    toastSuccess("Nomor sertifikat berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const adaSertifikat = Boolean(
    sertifikatInfo?.ada_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat !== "-" &&
      sertifikatInfo?.data?.sertifikat?.status === "terbit"
  );

  const sertifikat = sertifikatInfo?.data?.sertifikat || {};
  const peserta = sertifikatInfo?.data || dashboardData?.pendaftaran || {};
  const p = peserta?.pendaftaran || dashboardData?.pendaftaran || {};
  const laporanDisetujui = dashboardData?.laporan_akhir?.status === "disetujui";
  const nilaiDiterbitkan = nilaiData?.sudah_dinilai;
  const predikat =
    sertifikat?.predikat ||
    nilaiData?.penilaian?.predikat_akhir ||
    "Sangat Memuaskan";

  const tglTerbit = sertifikat?.tanggal_terbit
    ? new Date(sertifikat.tanggal_terbit).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* ── Page Header (Menyesuaikan Gaya Halaman Rapor Nilai) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1442] dark:text-slate-100">
              Sertifikat Kelulusan Magang
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Dokumen kelulusan resmi berstandar Dinas Komunikasi dan Informatika Kabupaten Ponorogo dengan nomor registrasi sah.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-sm text-slate-400">
            <div className="h-7 w-7 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="font-semibold text-xs text-slate-500">Memuat status dan dokumen sertifikat...</p>
          </div>
        ) : !adaSertifikat ? (
          /* ═════════════════════════════════════════════════════════════════════════
             KONDISI 1: SERTIFIKAT BELUM DITERBITKAN
             ═════════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Alert Banner Status */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-8 sm:p-10 text-center space-y-4 shadow-xs">
              <div className="flex justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-[#004F9F] dark:text-sky-400 border border-blue-500/20">
                  <Clock className="w-8 h-8" />
                </span>
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-[#0B1442] dark:text-white">
                  Sertifikat Kelulusan Belum Diterbitkan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sertifikat resmi magang akan diterbitkan dan disahkan oleh Administrator Dinas Komunikasi dan Informatika setelah seluruh rangkaian kegiatan, naskah laporan akhir, serta evaluasi 4 pilar dinyatakan tuntas.
                </p>
              </div>
            </div>

            {/* Checklist Persyaratan Kelulusan */}
            <SertifikatChecklistCard
              laporanDisetujui={laporanDisetujui}
              nilaiDiterbitkan={nilaiDiterbitkan}
              presensiAktif={true}
            />
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════════════
             KONDISI 2: SERTIFIKAT RESMI SUDAH DITERBITKAN
             ═════════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* ── Grid Dua Kolom: Viewer Sertifikat Asli (Kiri) + Rincian Legalitas (Kanan) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Kolom Kiri: Viewer Sertifikat Asli (Real Canvas) */}
              <div className="lg:col-span-8">
                <RealSertifikatViewer
                  pengaturan={sertifikatInfo?.pengaturan}
                  sertifikat={sertifikat}
                  peserta={sertifikatInfo?.data || peserta}
                  nilaiData={nilaiData}
                  onDownload={handleDownload}
                  isDownloading={downloading}
                />
              </div>

              {/* Kolom Kanan: Panel Rincian Legalitas & Ekspor */}
              <div className="lg:col-span-4 space-y-3.5">
                {/* ── Card Rincian Sertifikat (Versi Lebih Compact) ── */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-4 sm:p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-xs">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          Rincian Sertifikat
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-400">
                          Informasi Kelulusan &amp; Registrasi
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      Terdaftar
                    </span>
                  </div>

                  {/* Konten Rincian */}
                  <div className="space-y-2.5">
                    {/* Nomor Registrasi */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-[#004F9F] dark:text-sky-400" />
                          Nomor Registrasi
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyNomor}
                          title="Salin nomor sertifikat"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-[#004F9F] dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[9.5px]">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[9.5px]">Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono text-xs sm:text-[13px] font-black text-[#0B1442] dark:text-sky-300 break-all select-all">
                        {sertifikat.nomor_sertifikat}
                      </p>
                    </div>

                    {/* Penerima Sertifikat & Asal Institusi */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[#004F9F] dark:text-sky-400 mt-0.5">
                          <User className="w-3 h-3" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Penerima Sertifikat
                          </p>
                          <p className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {peserta?.nama || p?.nama_lengkap || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/50 dark:border-white/5 flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                          <Building2 className="w-3 h-3" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Asal Institusi
                          </p>
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                            {peserta?.institusi || p?.asal_kampus || p?.asal_sekolah || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grid Predikat & Tanggal Terbit */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 mb-0.5">
                          <Award className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Predikat</span>
                        </div>
                        <p className="font-black text-[11.5px] sm:text-xs text-emerald-700 dark:text-emerald-300">
                          {predikat}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                          <Calendar className="w-3 h-3 text-[#004F9F] dark:text-sky-400" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Tanggal Terbit</span>
                        </div>
                        <p className="font-bold text-[11.5px] sm:text-xs text-slate-800 dark:text-slate-200">
                          {tglTerbit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-white/10 space-y-1.5">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="group/btn w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white text-xs font-black shadow-md shadow-[#0B1442]/20 border border-white/10 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
                      <span>{downloading ? "Membuat Berkas PDF..." : "Unduh Dokumen PDF"}</span>
                    </button>

                    <Link
                      to="/peserta/penilaian/rapor"
                      className="group/link w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-98 transition-all duration-200 text-center cursor-pointer"
                    >
                      <span>Lihat Transkrip Nilai Rapor</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>

                {/* ── Card Verifikasi & Keabsahan Dokumen (Ukuran Diperkecil & Compact) ── */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161b22] p-4 sm:p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Verifikasi &amp; Keabsahan Resmi
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Integritas Sertifikasi Elektronik
                      </p>
                    </div>
                  </div>

                  <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Sertifikat ini merupakan dokumen resmi kelulusan magang yang terverifikasi secara elektronik dan sah dalam basis data SIM Magang melalui nomor registrasi yang tercantum.
                  </p>

                  <div className="space-y-1.5 text-[10.5px]">
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-slate-600 dark:text-slate-300 leading-snug">
                        <strong className="text-slate-800 dark:text-slate-200">Legalitas Digital:</strong> Nomor registrasi tercatat permanen pada sistem dinas.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                      <Building2 className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-400 shrink-0 mt-0.5" />
                      <div className="text-slate-600 dark:text-slate-300 leading-snug">
                        <strong className="text-slate-800 dark:text-slate-200">Instansi Penerbit:</strong> Diskominfo Kabupaten Ponorogo.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default PesertaSertifikatPage;
