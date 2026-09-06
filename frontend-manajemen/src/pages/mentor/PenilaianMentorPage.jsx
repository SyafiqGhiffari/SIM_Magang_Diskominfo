import { useState, useEffect } from "react";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  CheckCircle2, RefreshCw, Edit3, Sparkles
} from "lucide-react";
import {
  getPesertaBimbinganPenilaian,
  getDetailPenilaianPeserta,
  simpanPenilaianPeserta
} from "../../services/penilaianService";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";

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

const HitungPredikat = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "Sangat Baik (Melebihi Ekspektasi)";
  if (n >= 70) return "Baik (Sesuai Ekspektasi)";
  if (n >= 60) return "Cukup (Perlu Bimbingan)";
  return "Kurang (Tidak Memenuhi Standar)";
};

const PenilaianMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal Penilaian State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State Penilaian
  const [scores, setScores] = useState({
    prof_1: 90, prof_2: 90, prof_3: 90, prof_4: 90,
    pers_1: 90, pers_2: 90, pers_3: 90, pers_4: 90, pers_5: 90,
    sos_1: 90, sos_2: 90, sos_3: 90, sos_4: 90,
  });
  const [laporanDisetujui, setLaporanDisetujui] = useState(true);
  const [catatan, setCatatan] = useState("");
  const [autoAdminData, setAutoAdminData] = useState({
    skor_absensi: 100,
    skor_logbook: 100,
    skor_tugas: 100,
    skor_laporan: 100,
    rata_rata: 100,
  });
  const [bobotSetting, setBobotSetting] = useState({
    bobot_profesional: 35,
    bobot_personal: 25,
    bobot_sosial: 20,
    bobot_administratif: 20,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPesertaBimbinganPenilaian();
      setList(res.data?.data || []);
    } catch {
      toastError("Gagal memuat daftar peserta bimbingan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Buka Modal Form Penilaian
  const handleOpenForm = async (peserta) => {
    setSelectedPeserta(peserta);
    setModalOpen(true);
    setLoadingDetail(true);

    const pesertaId = peserta?.peserta_id || peserta?.id;
    if (!pesertaId) {
      toastError("ID Peserta tidak valid");
      setModalOpen(false);
      setLoadingDetail(false);
      return;
    }

    try {
      const res = await getDetailPenilaianPeserta(pesertaId);
      const data = res.data?.data || {};

      if (data.setting) {
        setBobotSetting({
          bobot_profesional: Number(data.setting.bobot_profesional) || 35,
          bobot_personal: Number(data.setting.bobot_personal) || 25,
          bobot_sosial: Number(data.setting.bobot_sosial) || 20,
          bobot_administratif: Number(data.setting.bobot_administratif) || 20,
        });
      }

      if (data.auto_administratif) {
        setAutoAdminData(data.auto_administratif);
      }

      // Jika sudah ada penilaian sebelumnya, isi nilai yang ada
      if (data.penilaian?.detail_nilai) {
        try {
          const parsed = typeof data.penilaian.detail_nilai === "string"
            ? JSON.parse(data.penilaian.detail_nilai)
            : data.penilaian.detail_nilai;
          const newScores = {
            prof_1: 90, prof_2: 90, prof_3: 90, prof_4: 90,
            pers_1: 90, pers_2: 90, pers_3: 90, pers_4: 90, pers_5: 90,
            sos_1: 90, sos_2: 90, sos_3: 90, sos_4: 90,
          };
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item.id) newScores[item.id] = Number(item.nilai) || 0;
            });
          }
          setScores(newScores);
        } catch {
          // ignore
        }
        setCatatan(data.penilaian.catatan_mentor || "");
        setLaporanDisetujui(data.penilaian.laporan_akhir_disetujui ?? true);
      } else {
        // Inisialisasi default 90
        setScores({
          prof_1: 90, prof_2: 90, prof_3: 90, prof_4: 90,
          pers_1: 90, pers_2: 90, pers_3: 90, pers_4: 90, pers_5: 90,
          sos_1: 90, sos_2: 90, sos_3: 90, sos_4: 90,
        });
        setCatatan("Peserta menunjukkan kedisiplinan dan kinerja yang sangat memuaskan.");
        setLaporanDisetujui(true);
      }
    } catch {
      toastError("Gagal memuat form penilaian peserta");
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Kalkulasi Nilai
  const getNum = (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v));

  const avgProf = (getNum(scores.prof_1) + getNum(scores.prof_2) + getNum(scores.prof_3) + getNum(scores.prof_4)) / 4.0;
  const avgPers = (getNum(scores.pers_1) + getNum(scores.pers_2) + getNum(scores.pers_3) + getNum(scores.pers_4) + getNum(scores.pers_5)) / 5.0;
  const avgSos = (getNum(scores.sos_1) + getNum(scores.sos_2) + getNum(scores.sos_3) + getNum(scores.sos_4)) / 4.0;
  
  const skorAbsensi = getNum(autoAdminData?.skor_absensi ?? 100);
  const skorLogbook = getNum(autoAdminData?.skor_logbook ?? 100);
  const skorTugas = getNum(autoAdminData?.skor_tugas ?? 100);
  const skorLaporan = laporanDisetujui ? 100 : 75;
  const avgAdm = (skorAbsensi + skorLogbook + skorTugas + skorLaporan) / 4.0;

  const totalNilaiAkhir = (
    avgProf * (bobotSetting.bobot_profesional / 100) +
    avgPers * (bobotSetting.bobot_personal / 100) +
    avgSos * (bobotSetting.bobot_sosial / 100) +
    avgAdm * (bobotSetting.bobot_administratif / 100)
  );

  const indeksAkhir = HitungIndeks(totalNilaiAkhir);
  const predikatAkhir = HitungPredikat(totalNilaiAkhir);

  // Submit Penilaian (Draf atau Final)
  const handleSubmit = async (statusTarget) => {
    const pesertaId = selectedPeserta?.peserta_id || selectedPeserta?.id;
    if (!pesertaId) {
      toastError("ID Peserta tidak ditemukan");
      return;
    }

    if (statusTarget === "final") {
      const confirm = await confirmDialog({
        title: "Finalisasi Penilaian?",
        text: `Nilai akhir ${totalNilaiAkhir.toFixed(2)} (${indeksAkhir}) akan diterbitkan ke peserta ${selectedPeserta?.nama}.`,
        confirmText: "Ya, Finalisasi & Terbitkan",
        icon: "question",
      });
      if (!confirm?.isConfirmed) return;
    }

    setSaving(true);

    const detailArray = [
      { id: "prof_1", kategori: "profesional", teks: "Kemampuan memahami tugas yang diberikan", nilai: getNum(scores.prof_1), indeks: HitungIndeks(scores.prof_1) },
      { id: "prof_2", kategori: "profesional", teks: "Kemampuan melaksanakan tugas", nilai: getNum(scores.prof_2), indeks: HitungIndeks(scores.prof_2) },
      { id: "prof_3", kategori: "profesional", teks: "Kemampuan menyelesaikan tugas tepat waktu", nilai: getNum(scores.prof_3), indeks: HitungIndeks(scores.prof_3) },
      { id: "prof_4", kategori: "profesional", teks: "Kualitas hasil pekerjaan", nilai: getNum(scores.prof_4), indeks: HitungIndeks(scores.prof_4) },

      { id: "pers_1", kategori: "personal", teks: "Kedisiplinan dan tanggung jawab", nilai: getNum(scores.pers_1), indeks: HitungIndeks(scores.pers_1) },
      { id: "pers_2", kategori: "personal", teks: "Kejujuran dan integritas", nilai: getNum(scores.pers_2), indeks: HitungIndeks(scores.pers_2) },
      { id: "pers_3", kategori: "personal", teks: "Kemandirian dan inisiatif", nilai: getNum(scores.pers_3), indeks: HitungIndeks(scores.pers_3) },
      { id: "pers_4", kategori: "personal", teks: "Antusias kerja dan kemampuan beradaptasi", nilai: getNum(scores.pers_4), indeks: HitungIndeks(scores.pers_4) },
      { id: "pers_5", kategori: "personal", teks: "Sikap dan etika kerja", nilai: getNum(scores.pers_5), indeks: HitungIndeks(scores.pers_5) },

      { id: "sos_1", kategori: "sosial", teks: "Kemampuan berkomunikasi", nilai: getNum(scores.sos_1), indeks: HitungIndeks(scores.sos_1) },
      { id: "sos_2", kategori: "sosial", teks: "Kerja sama dengan mentor dan pegawai", nilai: getNum(scores.sos_2), indeks: HitungIndeks(scores.sos_2) },
      { id: "sos_3", kategori: "sosial", teks: "Sopan santun dalam lingkungan kerja", nilai: getNum(scores.sos_3), indeks: HitungIndeks(scores.sos_3) },
      { id: "sos_4", kategori: "sosial", teks: "Kemampuan menerima arahan dan masukan", nilai: getNum(scores.sos_4), indeks: HitungIndeks(scores.sos_4) },

      { id: "adm_1", kategori: "administratif", teks: "Ketertiban melakukan absensi (dihitung otomatis)", nilai: skorAbsensi, indeks: HitungIndeks(skorAbsensi) },
      { id: "adm_2", kategori: "administratif", teks: "Kelengkapan pengisian logbook (dihitung otomatis)", nilai: skorLogbook, indeks: HitungIndeks(skorLogbook) },
      { id: "adm_3", kategori: "administratif", teks: "Ketepatan waktu pengumpulan tugas (dihitung otomatis)", nilai: skorTugas, indeks: HitungIndeks(skorTugas) },
      { id: "adm_4", kategori: "administratif", teks: "Kelengkapan laporan akhir magang (dikonfirmasi)", nilai: skorLaporan, indeks: HitungIndeks(skorLaporan) },
    ];

    const payload = {
      nilai_profesional: Number(avgProf.toFixed(2)),
      nilai_personal: Number(avgPers.toFixed(2)),
      nilai_sosial: Number(avgSos.toFixed(2)),
      nilai_administratif: Number(avgAdm.toFixed(2)),
      catatan_mentor: catatan,
      laporan_akhir_disetujui: laporanDisetujui,
      status_penilaian: statusTarget,
      detail_nilai: JSON.stringify(detailArray),
    };

    try {
      await simpanPenilaianPeserta(pesertaId, payload);
      toastSuccess(statusTarget === "final" ? "Penilaian berhasil difinalisasi & diterbitkan!" : "Draf penilaian berhasil disimpan.");
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  const filteredList = list.filter((item) =>
    (item.nama || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.institusi || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.bidang || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Penilaian Peserta Bimbingan
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Berikan evaluasi kinerja 4 pilar kompetensi untuk peserta magang di bawah bimbingan Anda.
            </p>
          </div>

          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all self-start sm:self-auto cursor-pointer ${
              isDark ? "border-white/10 bg-[#161b22] text-slate-300 hover:text-white" : "border-slate-200 bg-white text-slate-700 hover:text-[#004F9F]"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Segarkan Data
          </button>
        </div>

        {/* Tabel Peserta Bimbingan */}
        <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"} text-[11px] font-bold uppercase tracking-wider`}>
                  <th className="py-3.5 px-4">Nama Peserta</th>
                  <th className="py-3.5 px-4">Institusi / Asal Kampus</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                  <th className="py-3.5 px-4 text-center">Indeks</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Penilaian</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#004F9F]" />
                      Memuat data peserta bimbingan...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada peserta bimbingan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => {
                    const isFinal = row.status_penilaian === "final";
                    const isDraf = row.status_penilaian === "draf";
                    return (
                      <tr key={row.peserta_id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {row.nama}
                          <div className="text-[11px] font-normal text-slate-500">{row.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {row.institusi || "-"}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm">
                          {row.nilai_akhir_angka ? Number(row.nilai_akhir_angka).toFixed(2) : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.indeks_nilai_akhir ? (
                            <span className="font-black px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              {row.indeks_nilai_akhir}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isFinal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Diterbitkan
                            </span>
                          ) : isDraf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Draf
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400">
                              Belum Dinilai
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenForm(row)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white hover:shadow-md transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {isFinal ? "Edit Nilai" : "Beri Nilai"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODAL FORM PENILAIAN MENTOR */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 ${isDark ? "bg-[#0f172a] border-white/10 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004F9F]" />
                  Memuat data penilaian peserta...
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-white/10">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-[#0B1442] dark:text-slate-100">
                        Form Penilaian Kinerja Magang
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedPeserta?.nama} • {selectedPeserta?.institusi}
                      </p>
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Live Nilai Akhir Floating Preview */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Perhitungan Nilai Akhir Kumulatif</div>
                      <div className="text-2xl font-black mt-0.5 flex items-baseline gap-2">
                        {totalNilaiAkhir.toFixed(2)}
                        <span className="text-sm font-bold text-sky-200">/ 100</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-xs font-black text-white">{indeksAkhir}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Predikat Kelulusan</div>
                      <div className="text-sm font-extrabold text-emerald-300 mt-0.5">{predikatAkhir}</div>
                    </div>
                  </div>

                  {/* 4 Pilar Sections */}
                  <div className="space-y-6">
                    {/* 1. Kompetensi Profesional */}
                    <div className="space-y-3 p-4 rounded-2xl border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10">
                      <div className="flex justify-between items-center text-xs font-extrabold text-blue-800 dark:text-blue-300">
                        <span>1. KOMPETENSI PROFESIONAL (Bobot {bobotSetting.bobot_profesional}%)</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50">Rata-rata: {avgProf.toFixed(2)} ({HitungIndeks(avgProf)})</span>
                      </div>
                      <div className="space-y-3 pt-2">
                        {[
                          { id: "prof_1", label: "Kemampuan memahami tugas yang diberikan" },
                          { id: "prof_2", label: "Kemampuan melaksanakan tugas" },
                          { id: "prof_3", label: "Kemampuan menyelesaikan tugas tepat waktu" },
                          { id: "prof_4", label: "Kualitas hasil pekerjaan" },
                        ].map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{idx + 1}. {item.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" max="100"
                                value={scores[item.id] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value)));
                                  setScores({ ...scores, [item.id]: v });
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border text-center font-bold text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-white/10"
                              />
                              <span className="w-6 text-center font-bold text-sky-600">{HitungIndeks(scores[item.id])}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Kompetensi Personal */}
                    <div className="space-y-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10">
                      <div className="flex justify-between items-center text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                        <span>2. KOMPETENSI PERSONAL (Bobot {bobotSetting.bobot_personal}%)</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">Rata-rata: {avgPers.toFixed(2)} ({HitungIndeks(avgPers)})</span>
                      </div>
                      <div className="space-y-3 pt-2">
                        {[
                          { id: "pers_1", label: "Kedisiplinan dan tanggung jawab" },
                          { id: "pers_2", label: "Kejujuran dan integritas" },
                          { id: "pers_3", label: "Kemandirian dan inisiatif" },
                          { id: "pers_4", label: "Antusias kerja dan kemampuan beradaptasi" },
                          { id: "pers_5", label: "Sikap dan etika kerja" },
                        ].map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{idx + 1}. {item.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" max="100"
                                value={scores[item.id] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value)));
                                  setScores({ ...scores, [item.id]: v });
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border text-center font-bold text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-white/10"
                              />
                              <span className="w-6 text-center font-bold text-emerald-600">{HitungIndeks(scores[item.id])}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Kompetensi Sosial */}
                    <div className="space-y-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10">
                      <div className="flex justify-between items-center text-xs font-extrabold text-amber-800 dark:text-amber-300">
                        <span>3. KOMPETENSI SOSIAL (Bobot {bobotSetting.bobot_sosial}%)</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50">Rata-rata: {avgSos.toFixed(2)} ({HitungIndeks(avgSos)})</span>
                      </div>
                      <div className="space-y-3 pt-2">
                        {[
                          { id: "sos_1", label: "Kemampuan berkomunikasi" },
                          { id: "sos_2", label: "Kerja sama dengan mentor dan pegawai" },
                          { id: "sos_3", label: "Sopan santun dalam lingkungan kerja" },
                          { id: "sos_4", label: "Kemampuan menerima arahan dan masukan" },
                        ].map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{idx + 1}. {item.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" max="100"
                                value={scores[item.id] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value)));
                                  setScores({ ...scores, [item.id]: v });
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border text-center font-bold text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-white/10"
                              />
                              <span className="w-6 text-center font-bold text-amber-600">{HitungIndeks(scores[item.id])}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Kompetensi Administratif (Otomatis) */}
                    <div className="space-y-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-50/20 dark:bg-purple-950/10">
                      <div className="flex justify-between items-center text-xs font-extrabold text-purple-800 dark:text-purple-300">
                        <span>4. KOMPETENSI ADMINISTRATIF (Bobot {bobotSetting.bobot_administratif}%) - Otomatis Sistem</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50">Rata-rata: {avgAdm.toFixed(2)} ({HitungIndeks(avgAdm)})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Ketertiban Absensi</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{skorAbsensi}%</span>
                        </div>
                        <div className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Pengisian Logbook</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{skorLogbook}%</span>
                        </div>
                        <div className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Ketepatan Tugas</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{skorTugas}%</span>
                        </div>
                        <label className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 flex justify-between items-center cursor-pointer select-none">
                          <span className="text-slate-600 dark:text-slate-400">Laporan Akhir Disetujui</span>
                          <input
                            type="checkbox"
                            checked={laporanDisetujui}
                            onChange={(e) => setLaporanDisetujui(e.target.checked)}
                            className="w-4 h-4 accent-purple-600 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Catatan Evaluasi Mentor */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Catatan & Ulasan Kinerja Peserta:
                      </label>
                      <textarea
                        rows={3}
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Berikan masukan, evaluasi, dan pesan apresiasi untuk peserta..."
                        className="w-full rounded-xl border p-3 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20"
                      />
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Batal
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleSubmit("draf")}
                        disabled={saving}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
                      >
                        Simpan Draf
                      </button>
                      <button
                        onClick={() => handleSubmit("final")}
                        disabled={saving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        {saving ? "Menyimpan..." : "Finalisasi & Terbitkan Nilai"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MentorLayout>
  );
};

export default PenilaianMentorPage;
