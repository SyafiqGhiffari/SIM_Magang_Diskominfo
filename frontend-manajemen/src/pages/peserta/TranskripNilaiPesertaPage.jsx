import { useState, useEffect } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import TranskripHeroCard from "../../components/manajemen/peserta/penilaian/TranskripHeroCard";
import KompetensiPillarCard from "../../components/manajemen/peserta/penilaian/KompetensiPillarCard";
import { Download, Clock, RefreshCw, Award, FileText } from "lucide-react";
import { getNilaiSaya } from "../../services/penilaianService";
import { getSertifikatSaya } from "../../services/pesertaService";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
import { exportSertifikatPdf } from "../../utils/exportSertifikatPdf";
import { toastSuccess, toastError } from "../../utils/swal";

const HitungIndeks = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "A";
  if (n >= 80) return "A-";
  if (n >= 75) return "B+";
  if (n >= 70) return "B";
  if (n >= 65) return "B-";
  if (n >= 60) return "C";
  if (n >= 40) return "D";
  return "E";
};

const TranskripNilaiPesertaPage = () => {
  const { isDark } = useManajemenTheme();
  const [data, setData] = useState(null);
  const [sertifikatInfo, setSertifikatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingTranskrip, setDownloadingTranskrip] = useState(false);
  const [downloadingSertifikat, setDownloadingSertifikat] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [nilaiRes, sertifikatRes] = await Promise.allSettled([
          getNilaiSaya(),
          getSertifikatSaya(),
        ]);

        if (isMounted) {
          if (nilaiRes.status === "fulfilled") {
            setData(nilaiRes.value?.data?.data || null);
          }
          if (sertifikatRes.status === "fulfilled") {
            setSertifikatInfo(sertifikatRes.value?.data?.data || null);
          }
        }
      } catch {
        if (isMounted) {
          toastError("Gagal memuat data transkrip nilai");
        }
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

  const handleDownloadTranskripPdf = async () => {
    if (!data || !data.penilaian) return;
    setDownloadingTranskrip(true);
    try {
      await exportTranskripNilaiPdf(data);
      toastSuccess("Transkrip nilai PDF berhasil diunduh");
    } catch (err) {
      toastError("Gagal mengekspor Transkrip PDF: " + err.message);
    } finally {
      setDownloadingTranskrip(false);
    }
  };

  const handleDownloadSertifikatPdf = async () => {
    if (!sertifikatInfo || !sertifikatInfo.ada_sertifikat) {
      toastError("Sertifikat belum diterbitkan oleh admin.");
      return;
    }
    setDownloadingSertifikat(true);
    try {
      await exportSertifikatPdf(sertifikatInfo.data, sertifikatInfo.pengaturan);
      toastSuccess("Sertifikat resmi PDF berhasil diunduh");
    } catch (err) {
      toastError("Gagal mengekspor Sertifikat PDF: " + err.message);
    } finally {
      setDownloadingSertifikat(false);
    }
  };

  const p = data?.peserta || {};
  const pn = data?.penilaian || {};
  const m = data?.mentor || {};
  const isEvaluated = Boolean(
    data?.sudah_dinilai &&
      (pn.status_penilaian === "final" || pn.nilai_akhir_angka != null)
  );

  const adaSertifikat = Boolean(
    sertifikatInfo?.ada_sertifikat &&
      sertifikatInfo?.data?.sertifikat?.nomor_sertifikat
  );

  // Parse detail items jika ada
  let detailItems = [];
  try {
    if (typeof pn.detail_nilai === "string") {
      detailItems = JSON.parse(pn.detail_nilai || "[]");
    } else if (Array.isArray(pn.detail_nilai)) {
      detailItems = pn.detail_nilai;
    }
  } catch {
    detailItems = [];
  }

  const rawProf = detailItems.filter(
    (x) => x.kategori === "profesional" || x.id?.startsWith("prof_")
  );
  const rawPers = detailItems.filter(
    (x) => x.kategori === "personal" || x.id?.startsWith("pers_")
  );
  const rawSos = detailItems.filter(
    (x) => x.kategori === "sosial" || x.id?.startsWith("sos_")
  );
  const rawAdm = detailItems.filter(
    (x) => x.kategori === "administratif" || x.id?.startsWith("adm_")
  );

  const profItems =
    rawProf.length > 0
      ? rawProf
      : [
          {
            teks: "Kemampuan memahami tugas yang diberikan",
            nilai: pn.nilai_profesional || 0,
            indeks: HitungIndeks(pn.nilai_profesional || 0),
          },
          {
            teks: "Kemampuan melaksanakan tugas",
            nilai: pn.nilai_profesional || 0,
            indeks: HitungIndeks(pn.nilai_profesional || 0),
          },
          {
            teks: "Kemampuan menyelesaikan tugas tepat waktu",
            nilai: pn.nilai_profesional || 0,
            indeks: HitungIndeks(pn.nilai_profesional || 0),
          },
          {
            teks: "Kualitas hasil pekerjaan",
            nilai: pn.nilai_profesional || 0,
            indeks: HitungIndeks(pn.nilai_profesional || 0),
          },
        ];

  const persItems =
    rawPers.length > 0
      ? rawPers
      : [
          {
            teks: "Kedisiplinan dan tanggung jawab",
            nilai: pn.nilai_personal || 0,
            indeks: HitungIndeks(pn.nilai_personal || 0),
          },
          {
            teks: "Kejujuran dan integritas",
            nilai: pn.nilai_personal || 0,
            indeks: HitungIndeks(pn.nilai_personal || 0),
          },
          {
            teks: "Kemandirian dan inisiatif",
            nilai: pn.nilai_personal || 0,
            indeks: HitungIndeks(pn.nilai_personal || 0),
          },
          {
            teks: "Antusias kerja dan kemampuan beradaptasi",
            nilai: pn.nilai_personal || 0,
            indeks: HitungIndeks(pn.nilai_personal || 0),
          },
          {
            teks: "Sikap dan etika kerja",
            nilai: pn.nilai_personal || 0,
            indeks: HitungIndeks(pn.nilai_personal || 0),
          },
        ];

  const sosItems =
    rawSos.length > 0
      ? rawSos
      : [
          {
            teks: "Kemampuan berkomunikasi",
            nilai: pn.nilai_sosial || 0,
            indeks: HitungIndeks(pn.nilai_sosial || 0),
          },
          {
            teks: "Kerja sama dengan mentor dan pegawai",
            nilai: pn.nilai_sosial || 0,
            indeks: HitungIndeks(pn.nilai_sosial || 0),
          },
          {
            teks: "Sopan santun dalam lingkungan kerja",
            nilai: pn.nilai_sosial || 0,
            indeks: HitungIndeks(pn.nilai_sosial || 0),
          },
          {
            teks: "Kemampuan menerima arahan dan masukan",
            nilai: pn.nilai_sosial || 0,
            indeks: HitungIndeks(pn.nilai_sosial || 0),
          },
        ];

  const admItems =
    rawAdm.length > 0
      ? rawAdm
      : [
          {
            teks: "Ketertiban melakukan absensi (dihitung otomatis dari presensi)",
            nilai: pn.nilai_administratif || 0,
            indeks: HitungIndeks(pn.nilai_administratif || 0),
          },
          {
            teks: "Kelengkapan pengisian logbook harian",
            nilai: pn.nilai_administratif || 0,
            indeks: HitungIndeks(pn.nilai_administratif || 0),
          },
          {
            teks: "Ketepatan waktu pengumpulan tugas",
            nilai: pn.nilai_administratif || 0,
            indeks: HitungIndeks(pn.nilai_administratif || 0),
          },
          {
            teks: "Kelengkapan laporan akhir magang",
            nilai: pn.laporan_akhir_disetujui ? 100 : 75,
            indeks: HitungIndeks(pn.laporan_akhir_disetujui ? 100 : 75),
          },
        ];

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Transkrip Nilai &amp; Rapor Magang
            </h2>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Lihat hasil evaluasi kinerja magang Anda dan unduh dokumen resmi bertanda tangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading ? "animate-spin text-[#00A5EC]" : ""
                }`}
              />
              Segarkan
            </button>

            {adaSertifikat && (
              <button
                onClick={handleDownloadSertifikatPdf}
                disabled={downloadingSertifikat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                {downloadingSertifikat
                  ? "Menyiapkan Sertifikat..."
                  : "Unduh Sertifikat PDF"}
              </button>
            )}

            {isEvaluated && (
              <button
                onClick={handleDownloadTranskripPdf}
                disabled={downloadingTranskrip}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white text-xs font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingTranskrip
                  ? "Menyiapkan Transkrip..."
                  : "Unduh Transkrip PDF"}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#004F9F] mb-2" />
            Memuat data transkrip nilai &amp; sertifikat...
          </div>
        ) : !isEvaluated ? (
          /* State Belum Dinilai */
          <div
            className={`rounded-3xl border p-8 sm:p-12 text-center space-y-4 shadow-sm ${
              isDark
                ? "border-white/10 bg-[#161b22]"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="w-8 h-8" />
              </span>
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3
                className={`text-base font-extrabold ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Penilaian Sedang Dalam Proses
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mentor pembimbing ({m.nama || "Mentor Anda"}) belum menerbitkan
                transkrip nilai akhir magang. Nilai resmi beserta sertifikat
                akan otomatis muncul di halaman ini setelah difinalisasi.
              </p>
            </div>
          </div>
        ) : (
          /* State Sudah Dinilai */
          <div className="space-y-6">
            {/* Hero Card Summary Nilai Component */}
            <TranskripHeroCard
              peserta={p}
              mentor={m}
              penilaian={pn}
              adaSertifikat={adaSertifikat}
            />

            {/* Catatan Mentor */}
            {pn.catatan_mentor && (
              <div
                className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-1.5 ${
                  isDark
                    ? "border-white/10 bg-[#161b22]"
                    : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <FileText className="w-4 h-4 text-[#00A5EC]" />
                  Ulasan &amp; Evaluasi Mentor Pembimbing
                </div>
                <div
                  className={`italic text-xs sm:text-sm pl-6 leading-relaxed ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  "{pn.catatan_mentor}"
                </div>
              </div>
            )}

            {/* 4 Pilar Kompetensi Detail Cards Components */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KompetensiPillarCard
                title="1. Kompetensi Profesional"
                bobot={pn.bobot_profesional || 35}
                rataRata={pn.nilai_profesional}
                items={profItems}
                colorScheme="blue"
                isDark={isDark}
              />

              <KompetensiPillarCard
                title="2. Kompetensi Personal"
                bobot={pn.bobot_personal || 25}
                rataRata={pn.nilai_personal}
                items={persItems}
                colorScheme="emerald"
                isDark={isDark}
              />

              <KompetensiPillarCard
                title="3. Kompetensi Sosial"
                bobot={pn.bobot_sosial || 20}
                rataRata={pn.nilai_sosial}
                items={sosItems}
                colorScheme="amber"
                isDark={isDark}
              />

              <KompetensiPillarCard
                title="4. Kompetensi Administratif"
                bobot={pn.bobot_administratif || 20}
                rataRata={pn.nilai_administratif}
                items={admItems}
                colorScheme="purple"
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default TranskripNilaiPesertaPage;
