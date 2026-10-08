import { useState, useEffect, useMemo } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getUser } from "../../utils/authStorage";
import { getMe } from "../../services/authService";
import {
  getHitunganAntreanMentor,
  getDaftarPesertaBimbingan,
  getPresensiMentor,
  getStatistikPresensiMentor,
} from "../../services/mentorService";
import { getTugasMentor, getMateriMentor } from "../../services/pembelajaranService";
import {
  MentorDashboardHero,
  MentorActionQueueCards,
  MentorMetricCards,
  MentorPresensiHariIniCard,
  MentorEvaluasiPilarCard,
  MentorMasaMagangCard,
} from "../../components/manajemen/mentor/dashboard";
import { RefreshCw } from "lucide-react";

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MentorDashboardPage = () => {
  const { isDark } = useManajemenTheme();
  const localUser = getUser();

  // State Data
  const [currentUser, setCurrentUser] = useState(localUser);
  const [loading, setLoading] = useState(true);

  const [antrean, setAntrean] = useState({ izin: 0, tugas: 0, laporan_akhir: 0, penilaian: 0 });
  const [pesertaList, setPesertaList] = useState([]);
  const [presensiHariIniLogs, setPresensiHariIniLogs] = useState([]);
  const [presensiStatToday, setPresensiStatToday] = useState(null);
  const [tugasList, setTugasList] = useState([]);
  const [totalMateri, setTotalMateri] = useState(0);

  const todayStr = useMemo(() => getTodayString(), []);

  // Fetch data on mount
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const results = await Promise.allSettled([
          getHitunganAntreanMentor(),
          getDaftarPesertaBimbingan(),
          getPresensiMentor({ tanggal: todayStr, per_page: 100 }),
          getStatistikPresensiMentor({ tanggal_dari: todayStr, tanggal_sampai: todayStr }),
          getTugasMentor({ per_page: 5 }),
          getMateriMentor({ per_page: 1 }),
          getMe(),
        ]);

        if (!isMounted) return;

        if (results[0].status === "fulfilled") {
          setAntrean(results[0].value.data?.data || { izin: 0, tugas: 0, laporan_akhir: 0, penilaian: 0 });
        }
        if (results[1].status === "fulfilled") {
          const rawPeserta = results[1].value.data?.data;
          setPesertaList(Array.isArray(rawPeserta) ? rawPeserta : rawPeserta?.data || []);
        }
        if (results[2].status === "fulfilled") {
          const rawPresensi = results[2].value.data?.data;
          setPresensiHariIniLogs(Array.isArray(rawPresensi) ? rawPresensi : rawPresensi?.data || []);
        }
        if (results[3].status === "fulfilled") {
          setPresensiStatToday(results[3].value.data?.data || null);
        }
        if (results[4].status === "fulfilled") {
          const rawTugas = results[4].value.data?.data;
          setTugasList(Array.isArray(rawTugas) ? rawTugas : rawTugas?.data || []);
        }
        if (results[5].status === "fulfilled") {
          const rawMateri = results[5].value.data?.data;
          const meta = rawMateri?.meta || results[5].value.data?.meta;
          setTotalMateri(meta?.total || (Array.isArray(rawMateri) ? rawMateri.length : 0));
        }
        if (results[6].status === "fulfilled" && results[6].value.data?.data) {
          setCurrentUser(results[6].value.data.data);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  // Kalkulasi Derivatif untuk Kartu Metrik
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalisasi seluruh peserta bimbingan dengan status_magang dan perhitungan sisa hari efektif
    const normalizedPesertaList = (pesertaList || []).map((p) => {
      let effectiveStatus = p.status_magang || "aktif";
      let sisaHari = null;

      if (p.tanggal_selesai) {
        try {
          const dEnd = new Date(p.tanggal_selesai);
          dEnd.setHours(0, 0, 0, 0);
          const diffTime = dEnd.getTime() - today.getTime();
          sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (effectiveStatus !== "selesai") {
            if (p.status_akun && p.status_akun !== "aktif") {
              effectiveStatus = "selesai";
            } else if (today > dEnd) {
              effectiveStatus = "selesai";
            }
          }
        } catch {
          // ignore error date parsing
        }
      }

      return {
        ...p,
        status_magang: effectiveStatus,
        sisaHari,
      };
    });

    // 1. Peserta bimbingan yang saat ini masih aktif menjalani magang (untuk metrik operasional harian)
    const activePesertaList = normalizedPesertaList.filter((p) => p.status_magang === "aktif");

    const totalBimbingan = activePesertaList.length;
    const totalMahasiswa = activePesertaList.filter((p) => p.kategori_pendaftar === "mahasiswa").length;
    const totalSiswa = activePesertaList.filter((p) => p.kategori_pendaftar === "siswa").length;

    // Peserta belum dinilai final: seluruh peserta bimbingan yang evaluasi 4 pilarnya belum final
    // (baik peserta aktif yang perlu evaluasi maupun peserta yang sudah selesai masa magang tapi belum difinalisasi nilainya)
    const pesertaBelumDinilai =
      normalizedPesertaList.length > 0
        ? normalizedPesertaList.filter((p) => p.status_penilaian !== "final").length
        : (antrean?.penilaian || 0);

    // Rata-rata nilai peserta aktif
    const scores = activePesertaList
      .map((p) => (p.nilai_akhir_angka != null ? Number(p.nilai_akhir_angka) : null))
      .filter((s) => s != null && !isNaN(s));
    const rataRataNilai =
      scores.length > 0 ? scores.reduce((acc, curr) => acc + curr, 0) / scores.length : 0;

    // Status Presensi Hari Ini (Khusus untuk peserta yang masih aktif magang hari ini)
    const logMap = new Map();
    presensiHariIniLogs.forEach((log) => {
      const pid = log.peserta_id || log.pendaftaran_id || log.id;
      if (pid) logMap.set(pid, log);
    });

    let hadirCount = 0;
    let izinCount = 0;
    let belumCount = 0;

    const presensiHariIniList = activePesertaList.map((p) => {
      const log = logMap.get(p.id) || logMap.get(p.akun_peserta_id);
      let status = "belum_absen";
      let jamMasuk = null;

      if (log) {
        status = log.status || "hadir";
        jamMasuk = log.jam_masuk || null;
      }

      if (status === "hadir" || status === "terlambat") {
        hadirCount++;
      } else if (status === "izin" || status === "sakit") {
        izinCount++;
      } else {
        belumCount++;
      }

      return {
        id: p.id,
        peserta_id: p.akun_peserta_id,
        nama: p.nama_lengkap,
        institusi: p.institusi,
        jurusan: p.jurusan,
        foto: p.foto_profil,
        status,
        jam_masuk: jamMasuk,
      };
    });

    const totalHariIni = hadirCount + izinCount + belumCount;
    const pctHadir = totalHariIni > 0 ? Math.round((hadirCount / totalHariIni) * 100) : 100;

    // 2. Daftar Peserta untuk Kartu Evaluasi 4 Pilar (Seluruh peserta bimbingan, aktif maupun alumni)
    // Urutan: Peserta aktif terlebih dahulu, kemudian peserta yang sudah selesai magang
    const evaluasiPesertaList = [...normalizedPesertaList].sort((a, b) => {
      if (a.status_magang === "aktif" && b.status_magang !== "aktif") return -1;
      if (a.status_magang !== "aktif" && b.status_magang === "aktif") return 1;
      return (b.id || 0) - (a.id || 0);
    });

    // 3. Daftar Peserta untuk Kartu Masa Magang Berakhir:
    // Menampilkan peserta yang sudah selesai magang (alumni) DAN peserta aktif yang mendekati akhir magang (misal dalam 30 hari ke depan atau semuanya jika belum banyak)
    const masaMagangPesertaList = normalizedPesertaList
      .filter((p) => {
        if (p.status_magang === "selesai") return true;
        if (p.sisaHari != null && p.sisaHari <= 45) return true;
        return false;
      })
      .sort((a, b) => {
        // Aktif yang segera berakhir duluan (sisaHari terdekat), baru yang sudah selesai
        if (a.status_magang === "aktif" && b.status_magang === "selesai") return -1;
        if (a.status_magang === "selesai" && b.status_magang === "aktif") return 1;
        if (a.status_magang === "aktif" && b.status_magang === "aktif") {
          return (a.sisaHari || 0) - (b.sisaHari || 0);
        }
        return (b.id || 0) - (a.id || 0);
      });

    return {
      normalizedPesertaList,
      activePesertaList,
      evaluasiPesertaList,
      masaMagangPesertaList,
      totalBimbingan,
      totalMahasiswa,
      totalSiswa,
      pesertaBelumDinilai,
      rataRataNilai,
      presensiStats: {
        persentase: presensiStatToday?.persentase_kehadiran != null ? presensiStatToday.persentase_kehadiran : pctHadir,
        hadir: hadirCount,
        izin: izinCount,
        belum: belumCount,
      },
      presensiHariIniList,
    };
  }, [pesertaList, presensiHariIniLogs, presensiStatToday, antrean]);

  return (
    <MentorLayout>
      <div className="space-y-6 sm:space-y-7 animate-[fadeslide_0.35s_ease-out]">
        {/* ── 1. HERO GREETING BANNER ── */}
        <MentorDashboardHero
          user={currentUser}
          antrean={antrean}
          totalBimbingan={metrics.totalBimbingan}
          pesertaBelumDinilai={metrics.pesertaBelumDinilai}
          defaultBidang={pesertaList[0]?.posisi_bidang}
          isDark={isDark}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00A5EC] mb-2.5" />
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
              Memuat data operasional dashboard mentor...
            </p>
          </div>
        ) : (
          <>
            {/* ── 2. GRID UTAMA: ANTREAN + 3 STATS (KIRI) | PRESENSI (KANAN) ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Kolom Kiri (lg:col-span-2): Perlu Tindakan Anda + 3 Card Stats */}
              <div className="space-y-5 lg:col-span-2">
                {/* Antrean: Perlu Tindakan Anda */}
                <MentorActionQueueCards
                  antrean={antrean}
                  pesertaBelumDinilai={metrics.pesertaBelumDinilai}
                  isDark={isDark}
                />

                {/* 3 Card Stats */}
                <MentorMetricCards
                  totalBimbingan={metrics.totalBimbingan}
                  totalMahasiswa={metrics.totalMahasiswa}
                  totalSiswa={metrics.totalSiswa}
                  presensiStats={metrics.presensiStats}
                  totalTugas={tugasList.length}
                  totalMateri={totalMateri}
                  isDark={isDark}
                />
              </div>

              {/* Kolom Kanan (lg:col-span-1): Presensi Peserta Hari Ini (Tinggi setara garis bawah stats) */}
              <div className="lg:col-span-1 flex flex-col h-full min-h-0">
                <MentorPresensiHariIniCard
                  presensiHariIniList={metrics.presensiHariIniList}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* ── 3. SEKSI EVALUASI & MASA MAGANG ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Kolom Kiri: Evaluasi 4 Pilar (Lebih lebar sedikit: col-span-7) */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                <MentorEvaluasiPilarCard
                  pesertaList={metrics.evaluasiPesertaList}
                  isDark={isDark}
                />
              </div>

              {/* Kolom Kanan: Masa Magang Berakhir (col-span-5) */}
              <div className="lg:col-span-5 flex flex-col h-full min-h-0">
                <MentorMasaMagangCard
                  pesertaMasaMagang={metrics.masaMagangPesertaList}
                  pesertaHampirSelesai={metrics.masaMagangPesertaList}
                  isDark={isDark}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </MentorLayout>
  );
};

export default MentorDashboardPage;