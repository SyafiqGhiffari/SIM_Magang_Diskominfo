import { useState, useEffect } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  Download, CheckCircle2, Clock, FileText, RefreshCw
} from "lucide-react";
import { getNilaiSaya } from "../../services/penilaianService";
import { exportTranskripNilaiPdf } from "../../utils/exportTranskripPdf";
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
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchNilai = async () => {
    setLoading(true);
    try {
      const res = await getNilaiSaya();
      setData(res.data?.data || null);
    } catch {
      toastError("Gagal memuat data transkrip nilai");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNilai();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadPdf = async () => {
    if (!data || !data.penilaian) return;
    setDownloading(true);
    try {
      await exportTranskripNilaiPdf(data);
      toastSuccess("Transkrip nilai PDF berhasil diunduh");
    } catch (err) {
      toastError("Gagal mengekspor PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const p = data?.peserta || {};
  const pn = data?.penilaian || {};
  const m = data?.mentor || {};
  const isEvaluated = Boolean(data?.sudah_dinilai && (pn.status_penilaian === "final" || pn.nilai_akhir_angka != null));

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

  const rawProf = detailItems.filter((x) => x.kategori === "profesional" || x.id?.startsWith("prof_"));
  const rawPers = detailItems.filter((x) => x.kategori === "personal" || x.id?.startsWith("pers_"));
  const rawSos = detailItems.filter((x) => x.kategori === "sosial" || x.id?.startsWith("sos_"));
  const rawAdm = detailItems.filter((x) => x.kategori === "administratif" || x.id?.startsWith("adm_"));

  const profItems = rawProf.length > 0 ? rawProf : [
    { teks: "Kemampuan memahami tugas yang diberikan", nilai: pn.nilai_profesional || 0, indeks: HitungIndeks(pn.nilai_profesional || 0) },
    { teks: "Kemampuan melaksanakan tugas", nilai: pn.nilai_profesional || 0, indeks: HitungIndeks(pn.nilai_profesional || 0) },
    { teks: "Kemampuan menyelesaikan tugas tepat waktu", nilai: pn.nilai_profesional || 0, indeks: HitungIndeks(pn.nilai_profesional || 0) },
    { teks: "Kualitas hasil pekerjaan", nilai: pn.nilai_profesional || 0, indeks: HitungIndeks(pn.nilai_profesional || 0) },
  ];

  const persItems = rawPers.length > 0 ? rawPers : [
    { teks: "Kedisiplinan dan tanggung jawab", nilai: pn.nilai_personal || 0, indeks: HitungIndeks(pn.nilai_personal || 0) },
    { teks: "Kejujuran dan integritas", nilai: pn.nilai_personal || 0, indeks: HitungIndeks(pn.nilai_personal || 0) },
    { teks: "Kemandirian dan inisiatif", nilai: pn.nilai_personal || 0, indeks: HitungIndeks(pn.nilai_personal || 0) },
    { teks: "Antusias kerja dan kemampuan beradaptasi", nilai: pn.nilai_personal || 0, indeks: HitungIndeks(pn.nilai_personal || 0) },
    { teks: "Sikap dan etika kerja", nilai: pn.nilai_personal || 0, indeks: HitungIndeks(pn.nilai_personal || 0) },
  ];

  const sosItems = rawSos.length > 0 ? rawSos : [
    { teks: "Kemampuan berkomunikasi", nilai: pn.nilai_sosial || 0, indeks: HitungIndeks(pn.nilai_sosial || 0) },
    { teks: "Kerja sama dengan mentor dan pegawai", nilai: pn.nilai_sosial || 0, indeks: HitungIndeks(pn.nilai_sosial || 0) },
    { teks: "Sopan santun dalam lingkungan kerja", nilai: pn.nilai_sosial || 0, indeks: HitungIndeks(pn.nilai_sosial || 0) },
    { teks: "Kemampuan menerima arahan dan masukan", nilai: pn.nilai_sosial || 0, indeks: HitungIndeks(pn.nilai_sosial || 0) },
  ];

  const admItems = rawAdm.length > 0 ? rawAdm : [
    { teks: "Ketertiban melakukan absensi (dihitung otomatis dari presensi)", nilai: pn.nilai_administratif || 0, indeks: HitungIndeks(pn.nilai_administratif || 0) },
    { teks: "Kelengkapan pengisian logbook harian", nilai: pn.nilai_administratif || 0, indeks: HitungIndeks(pn.nilai_administratif || 0) },
    { teks: "Ketepatan waktu pengumpulan tugas", nilai: pn.nilai_administratif || 0, indeks: HitungIndeks(pn.nilai_administratif || 0) },
    { teks: "Kelengkapan laporan akhir magang", nilai: pn.laporan_akhir_disetujui ? 100 : 75, indeks: HitungIndeks(pn.laporan_akhir_disetujui ? 100 : 75) },
  ];

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Transkrip & Raport Nilai Magang
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Lihat hasil evaluasi kinerja magang Anda dan unduh transkrip nilai resmi bertanda tangan.
            </p>
          </div>

          {isEvaluated && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white text-xs font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Menyiapkan Dokumen..." : "Unduh Transkrip PDF"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#004F9F] mb-2" />
            Memuat data transkrip nilai...
          </div>
        ) : !isEvaluated ? (
          /* State Belum Dinilai */
          <div className={`rounded-3xl border p-8 sm:p-12 text-center space-y-4 shadow-sm ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
            <div className="flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="w-8 h-8" />
              </span>
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className={`text-base font-extrabold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                Penilaian Sedang Dalam Proses
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mentor pembimbing ({m.nama || "Mentor Anda"}) belum menerbitkan transkrip nilai akhir magang. Nilai resmi akan otomatis muncul di halaman ini setelah difinalisasi.
              </p>
            </div>
          </div>
        ) : (
          /* State Sudah Dinilai */
          <div className="space-y-6">
            {/* Hero Card Summary Nilai */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#030712] via-[#0B1442] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-xl">
              <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-cyan-500/15 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Penilaian Magang Telah Diterbitkan
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {p.nama}
                  </h3>
                  <p className="text-xs text-sky-200/80 mt-1">
                    {p.institusi} • {p.jurusan} ({p.bidang})
                  </p>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Mentor Pembimbing: <span className="text-white font-semibold">{m.nama || "Mentor Diskominfo"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 self-start md:self-auto">
                  <div className="text-center pr-4 border-r border-white/15">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Nilai Akhir</div>
                    <div className="text-3xl font-black mt-0.5 tabular-nums text-white">
                      {Number(pn.nilai_akhir_angka || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center pr-4 border-r border-white/15">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Indeks</div>
                    <div className="text-3xl font-black mt-0.5 text-sky-300">
                      {pn.indeks_nilai_akhir || "A"}
                    </div>
                  </div>
                  <div className="min-w-[120px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Predikat</div>
                    <div className="text-sm font-extrabold text-emerald-300 mt-1 leading-tight">
                      {pn.predikat_akhir || "Sangat Baik"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan Mentor */}
            {pn.catatan_mentor && (
              <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-1.5 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <FileText className="w-4 h-4 text-[#00A5EC]" />
                  Ulasan & Evaluasi Mentor Pembimbing
                </div>
                <div className={`italic text-xs sm:text-sm pl-6 leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  "{pn.catatan_mentor}"
                </div>
              </div>
            )}

            {/* 4 Pilar Kompetensi Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Profesional */}
              <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-white/5">
                  <div className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                    1. Kompetensi Profesional ({pn.bobot_profesional || 35}%)
                  </div>
                  <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                    Rata-rata: {Number(pn.nilai_profesional || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {profItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">{i + 1}. {it.teks}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">{it.nilai} ({it.indeks || HitungIndeks(it.nilai)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Personal */}
              <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-white/5">
                  <div className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                    2. Kompetensi Personal ({pn.bobot_personal || 25}%)
                  </div>
                  <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Rata-rata: {Number(pn.nilai_personal || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {persItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">{i + 1}. {it.teks}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">{it.nilai} ({it.indeks || HitungIndeks(it.nilai)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Sosial */}
              <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-white/5">
                  <div className="font-extrabold text-xs text-amber-600 dark:text-amber-400">
                    3. Kompetensi Sosial ({pn.bobot_sosial || 20}%)
                  </div>
                  <div className="text-xs font-black text-amber-700 dark:text-amber-300">
                    Rata-rata: {Number(pn.nilai_sosial || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {sosItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">{i + 1}. {it.teks}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">{it.nilai} ({it.indeks || HitungIndeks(it.nilai)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Administratif */}
              <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-white/5">
                  <div className="font-extrabold text-xs text-purple-600 dark:text-purple-400">
                    4. Kompetensi Administratif ({pn.bobot_administratif || 20}%)
                  </div>
                  <div className="text-xs font-black text-purple-700 dark:text-purple-300">
                    Rata-rata: {Number(pn.nilai_administratif || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {admItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">{i + 1}. {it.teks}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">{it.nilai} ({it.indeks || HitungIndeks(it.nilai)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PesertaLayout>
  );
};

export default TranskripNilaiPesertaPage;
