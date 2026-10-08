import { useEffect, useState } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import AbsenKameraModal from "../../components/manajemen/peserta/presensi/AbsenKameraModal";
import FormPengajuanIzinModal from "../../components/manajemen/peserta/presensi/FormPengajuanIzinModal";
import DetailIzinModal from "../../components/manajemen/peserta/presensi/DetailIzinModal";
import { getDashboardPeserta, batalkanPengajuanIzin, getLogbookPeserta } from "../../services/pesertaService";
import { getTugasPeserta, getMateriPeserta } from "../../services/pembelajaranService";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  PesertaDashboardHero,
  PesertaActionRequiredCards,
  PesertaPresensiHariIniCard,
  PesertaMetricCards,
  PesertaTugasMateriCard,
  PesertaPenilaianCard,
  PesertaDokumenEvaluasiCard,
} from "../../components/manajemen/peserta/dashboard";
import { RefreshCw } from "lucide-react";

export const PesertaDashboardPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai();

  // State Utama
  const [data, setData] = useState(null);
  const [tugasList, setTugasList] = useState([]);
  const [materiList, setMateriList] = useState([]);
  const [totalLogbookFallback, setTotalLogbookFallback] = useState(0);

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Modal States
  const [absenModal, setAbsenModal] = useState(null); // "masuk" | "pulang" | null
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [selectedIzinDetail, setSelectedIzinDetail] = useState(null);

  // Realtime Live Digital Clock WIB
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Seluruh Konsolidasi Data Dashboard Peserta
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [dashRes, tugasRes, materiRes, logbookRes] = await Promise.allSettled([
          getDashboardPeserta(),
          getTugasPeserta({ per_page: 8 }),
          getMateriPeserta({ per_page: 5 }),
          getLogbookPeserta(),
        ]);

        if (!isMounted) return;

        if (dashRes.status === "fulfilled") {
          setData(dashRes.value.data?.data || null);
        }
        if (tugasRes.status === "fulfilled") {
          const raw = tugasRes.value.data?.data;
          if (Array.isArray(raw)) {
            setTugasList(raw);
          } else if (Array.isArray(raw?.tugas)) {
            setTugasList(raw.tugas);
          } else if (Array.isArray(raw?.data)) {
            setTugasList(raw.data);
          } else {
            setTugasList([]);
          }
        }
        if (materiRes.status === "fulfilled") {
          const raw = materiRes.value.data?.data;
          if (Array.isArray(raw)) {
            setMateriList(raw);
          } else if (Array.isArray(raw?.materi)) {
            setMateriList(raw.materi);
          } else if (Array.isArray(raw?.data)) {
            setMateriList(raw.data);
          } else {
            setMateriList([]);
          }
        }
        if (logbookRes.status === "fulfilled") {
          const presensiList = logbookRes.value.data?.data?.presensi_list || [];
          const count = presensiList.filter(
            (p) =>
              (p.status === "hadir" || p.status === "terlambat") &&
              (p.keterangan || "").trim() !== "" &&
              p.keterangan !== "Tidak melakukan presensi"
          ).length;
          setTotalLogbookFallback(count);
        }
      } catch (err) {
        if (isMounted) {
          toastError(err.response?.data?.message || "Gagal memuat data dashboard peserta.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Ekstraksi Data Konsolidasi
  const peserta = data?.peserta;
  const pendaftaran = data?.pendaftaran;
  const timeline = data?.timeline;
  const mentor = data?.mentor;
  const presensiHariIni = data?.presensi_hari_ini;
  const stats = data?.statistik_kehadiran;
  const izinTerkini = data?.pengajuan_izin_terkini || [];
  const penilaian = data?.penilaian;
  const sertifikat = data?.sertifikat;
  const laporanAkhir = data?.laporan_akhir;

  const totalLogbook = stats?.total_logbook_terisi ?? totalLogbookFallback;

  return (
    <PesertaLayout>
      <div className="space-y-6 sm:space-y-7 animate-[fadeslide_0.35s_ease-out]">
        {/* ── 1. HERO GREETING BANNER & TIMELINE MAGANG ── */}
        <PesertaDashboardHero
          user={peserta}
          pendaftaran={pendaftaran}
          timeline={timeline}
          presensiHariIni={presensiHariIni}
          tugasList={tugasList}
          laporanAkhir={laporanAkhir}
          mentor={mentor}
          readOnly={readOnly}
          onOpenAbsen={(jenis) => setAbsenModal(jenis)}
          isDark={isDark}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00A5EC] mb-2.5" />
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
              Memuat data aktivitas &amp; operasional magang...
            </p>
          </div>
        ) : (
          <>
            {/* ── 2. GRID UTAMA: TINDAKAN + 3 STATS (KIRI) | PRESENSI & IZIN (KANAN) ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Kolom Kiri (lg:col-span-2): Perlu Tindakan Anda + 3 Card Stats */}
              <div className="space-y-5 lg:col-span-2">
                {/* 1. Perlu Tindakan Anda */}
                <PesertaActionRequiredCards
                  presensiHariIni={presensiHariIni}
                  tugasList={tugasList}
                  laporanAkhir={laporanAkhir}
                  timeline={timeline}
                  readOnly={readOnly}
                  onOpenAbsen={(jenis) => setAbsenModal(jenis)}
                  isDark={isDark}
                />

                {/* 2. 3 Card Stats (Gaya Dashboard Mentor) */}
                <PesertaMetricCards
                  stats={stats}
                  tugasList={tugasList}
                  totalLogbookTerisi={totalLogbook}
                  isDark={isDark}
                />
              </div>

              {/* Kolom Kanan (lg:col-span-1): Presensi & Pengajuan Izin Hari Ini */}
              <div className="lg:col-span-1 flex flex-col h-full min-h-0">
                <PesertaPresensiHariIniCard
                  presensiHariIni={presensiHariIni}
                  timeline={timeline}
                  currentTime={currentTime}
                  izinTerkini={izinTerkini}
                  onSelectIzin={(iz) => setSelectedIzinDetail(iz)}
                  readOnly={readOnly}
                  onOpenAbsen={(jenis) => setAbsenModal(jenis)}
                  onOpenIzin={() => setShowIzinModal(true)}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* ── 3. SEKSI PEMBELAJARAN, PENILAIAN, & DOKUMEN RESMI (Tiga Kolom: Kiri - Tengah - Kanan) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Kolom 1 (Kiri): Penugasan Magang & Modul Belajar */}
              <div className="flex flex-col h-full min-h-0">
                <PesertaTugasMateriCard
                  tugasList={tugasList}
                  materiList={materiList}
                  isDark={isDark}
                />
              </div>

              {/* Kolom 2 (Tengah): Penilaian Kinerja & Evaluasi Magang */}
              <div className="flex flex-col h-full min-h-0">
                <PesertaPenilaianCard
                  penilaian={penilaian}
                  isDark={isDark}
                />
              </div>

              {/* Kolom 3 (Kanan): Evaluasi Kompetensi & Dokumen */}
              <div className="flex flex-col h-full min-h-0">
                <PesertaDokumenEvaluasiCard
                  pendaftaran={pendaftaran}
                  penilaian={penilaian}
                  sertifikat={sertifikat}
                  isDark={isDark}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL ABSENSI KAMERA (SELFIE) ── */}
      {absenModal && (
        <AbsenKameraModal
          jenis={absenModal}
          isDark={isDark}
          onClose={() => setAbsenModal(null)}
          onSuccess={() => {
            setAbsenModal(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* ── MODAL PENGAJUAN IZIN ── */}
      {showIzinModal && (
        <FormPengajuanIzinModal
          onClose={() => setShowIzinModal(false)}
          onSaved={() => {
            setShowIzinModal(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* ── MODAL DETAIL PENGAJUAN IZIN ── */}
      {selectedIzinDetail && (
        <DetailIzinModal
          data={selectedIzinDetail}
          onClose={() => setSelectedIzinDetail(null)}
          onBatal={async (iz) => {
            const result = await confirmDialog({
              title: "Batalkan pengajuan ini?",
              text: `Pengajuan ${iz.jenis} tanggal ${formatTanggalPresensi(
                iz.tanggal_mulai
              )} s.d. ${formatTanggalPresensi(iz.tanggal_selesai)} akan dibatalkan.`,
              confirmText: "Ya, Batalkan",
              danger: true,
            });
            if (!result.isConfirmed) return;

            try {
              await batalkanPengajuanIzin(iz.id);
              toastSuccess("Pengajuan izin berhasil dibatalkan.");
              setSelectedIzinDetail(null);
              setReloadKey((k) => k + 1);
            } catch (err) {
              toastError(
                err.response?.data?.message || "Gagal membatalkan pengajuan izin."
              );
            }
          }}
          readOnly={readOnly}
          dk={isDark}
        />
      )}
    </PesertaLayout>
  );
};

export default PesertaDashboardPage;