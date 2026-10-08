import { useState, useEffect, useRef } from "react";
import {
  Download,
  FileText,
  Loader2,
  Maximize2,
  RotateCcw,
  ScrollText,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getFileUrl, getLogoSuratBawaan } from "../../../../utils/fileUrl";
import { getTemplateRaporAktif } from "../../../../services/templateRaporService";

// Dimensi Baku Standar Kertas A4 Kedinasan (96 DPI: 210mm × 297mm, Rasio 1 : 1.4142)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Helper hitung mutu baku transkrip nilai
const hitungMutu = (val) => {
  const n = Number(val) || 0;
  if (n >= 85) return "A";
  if (n >= 75) return "B";
  if (n >= 60) return "C";
  if (n >= 40) return "D";
  return "E";
};

// Master butir indikator baku jika tidak tersimpan di database
const DEFAULT_PROFESIONAL = [
  { teks: "Kemampuan memahami tugas yang diberikan" },
  { teks: "Kemampuan melaksanakan tugas" },
  { teks: "Kemampuan menyelesaikan tugas tepat waktu" },
  { teks: "Kualitas hasil pekerjaan" },
];

const DEFAULT_PERSONAL = [
  { teks: "Disiplin dan kepatuhan jam kerja magang" },
  { teks: "Inisiatif dan kemandirian dalam bekerja" },
  { teks: "Tanggung jawab atas tugas yang diberikan" },
  { teks: "Sikap, etika, dan integritas kerja" },
];

const DEFAULT_SOSIAL = [
  { teks: "Kemampuan komunikasi dan adaptasi lingkungan" },
  { teks: "Kemampuan kerja sama tim (teamwork)" },
  { teks: "Menghargai rekan kerja dan staf dinas" },
];

const DEFAULT_ADMINISTRATIF = [
  { teks: "Kedisiplinan Presensi Kehadiran" },
  { teks: "Ketertiban Pengisian Logbook Jurnal Harian" },
  { teks: "Penyelesaian Penugasan Mandiri" },
  { teks: "Kualitas & Persetujuan Laporan Akhir Magang" },
];

export const RaporMockupCard = ({
  peserta = {},
  mentor = {},
  penilaian = {},
  instansi = {},
  templateRapor = null,
  onDownloadPdf,
  downloading = false,
  isDark = false,
}) => {
  const [fetchedTpl, setFetchedTpl] = useState(null);
  const [logoGagal, setLogoGagal] = useState(false);

  // Ref dan state kontrol skala berkas A4
  const containerRef = useRef(null);
  const paperRef = useRef(null);
  const [scale, setScale] = useState(0.7);
  const [paperHeight, setPaperHeight] = useState(A4_HEIGHT);
  const [userZoom, setUserZoom] = useState(null); // null = auto fit compact

  // Muat template rapor aktif jika belum disediakan oleh parent
  useEffect(() => {
    if (!templateRapor) {
      getTemplateRaporAktif()
        .then((res) => {
          if (res.data?.data) {
            setFetchedTpl(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [templateRapor]);

  // Otomatis hitung skala pas (compact) agar berkas tampil ringkas di layar
  // tanpa merubah rasio dan proporsi bentuk A4 asli (1 : 1.414)
  useEffect(() => {
    const hitungSkala = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      // Di desktop berkas diperkecil secara proporsional (~550px) agar rapi & tidak memakan ruang
      // Di layar mobile/tablet berkas menyesuaikan lebar layar yang tersedia
      const targetWidth = Math.min(containerWidth - 32, 550);
      const fitScale = Math.max(0.35, Math.min(0.72, Number((targetWidth / A4_WIDTH).toFixed(2))));
      if (userZoom === null) {
        setScale(fitScale);
      }
    };

    hitungSkala();
    window.addEventListener("resize", hitungSkala);
    return () => window.removeEventListener("resize", hitungSkala);
  }, [userZoom]);

  // Pantau tinggi aktual konten lembar agar selalu minimal 1123px (A4 standar)
  useEffect(() => {
    if (paperRef.current) {
      const contentH = paperRef.current.scrollHeight;
      setPaperHeight(Math.max(A4_HEIGHT, contentH));
    }
  }, [penilaian, peserta, mentor, templateRapor, fetchedTpl]);

  // Handler tombol zoom
  const handleZoomIn = () => {
    setUserZoom((curr) => {
      const base = curr ?? scale;
      const next = Math.min(1.2, Number((base + 0.1).toFixed(2)));
      setScale(next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setUserZoom((curr) => {
      const base = curr ?? scale;
      const next = Math.max(0.35, Number((base - 0.1).toFixed(2)));
      setScale(next);
      return next;
    });
  };

  const handleResetZoom = () => {
    setUserZoom(null);
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const targetWidth = Math.min(containerWidth - 32, 550);
      const fitScale = Math.max(0.35, Math.min(0.72, Number((targetWidth / A4_WIDTH).toFixed(2))));
      setScale(fitScale);
    }
  };

  const handleZoom100 = () => {
    setUserZoom(1.0);
    setScale(1.0);
  };

  const p = peserta || {};
  const pn = penilaian || {};
  const m = mentor || {};
  const inst = instansi || {};
  const tpl = templateRapor || fetchedTpl || {};

  // Formatter tanggal Indonesia
  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return "-";
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Konfigurasi tata letak dari template
  const layoutConfig = (() => {
    try {
      const cfg =
        typeof tpl?.konfigurasi_tata_letak === "string"
          ? JSON.parse(tpl.konfigurasi_tata_letak || "{}")
          : tpl?.konfigurasi_tata_letak || {};
      return {
        tampilkan_bobot: true,
        tampilkan_qr: true,
        tampilkan_catatan_mentor: true,
        tampilkan_garis_kop: true,
        ...cfg,
      };
    } catch {
      return {
        tampilkan_bobot: true,
        tampilkan_qr: true,
        tampilkan_catatan_mentor: true,
        tampilkan_garis_kop: true,
      };
    }
  })();

  // Aset gambar Kop, Stempel, & TTD
  const logoSrc = logoGagal
    ? null
    : tpl.file_logo
    ? getFileUrl(tpl.file_logo)
    : inst.logo
    ? getFileUrl(inst.logo)
    : getLogoSuratBawaan();

  const stempelSrc = tpl.file_stempel
    ? getFileUrl(tpl.file_stempel)
    : inst.stempel
    ? getFileUrl(inst.stempel)
    : null;

  const ttdSrc = tpl.file_ttd
    ? getFileUrl(tpl.file_ttd)
    : inst.ttd_pejabat
    ? getFileUrl(inst.ttd_pejabat)
    : null;

  // Teks Kop Surat
  const namaPemda = (
    tpl.nama_pemerintah ||
    inst.nama_pemerintah ||
    "PEMERINTAH KABUPATEN PONOROGO"
  ).toUpperCase();

  const namaDinas = (
    tpl.nama_instansi ||
    inst.nama_instansi ||
    "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK"
  ).toUpperCase();

  const barisAlamat = [
    tpl?.alamat_instansi ||
      inst?.alamat_instansi ||
      "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
    [tpl?.telepon || inst?.telepon || "Telepon 0352–3592999", tpl?.faksimile || inst?.faksimile]
      .filter(Boolean)
      .join(", "),
    [
      tpl?.laman || inst?.laman || "Laman kominfo.ponorogo.go.id",
      tpl?.pos_el || inst?.pos_el || "Pos-el kominfo@ponorogo.go.id",
    ]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);

  // Judul & Nomor Surat
  const judulDokumen = (
    tpl.judul_dokumen || "TRANSKRIP NILAI HASIL MAGANG"
  ).toUpperCase();

  const tahunIni = new Date().getFullYear();
  const formatNomorRaw = tpl.format_nomor || "560/TRN-{nomor}/405.08/{tahun}";
  const nomorDokumen = formatNomorRaw
    .replace("{nomor}", String(pn.id || 1).padStart(4, "0"))
    .replace("{tahun}", String(tahunIni));

  // Parse detail items riil dari database (pn.detail_nilai)
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

  // 1. List Pilar Profesional
  const profFromDb = detailItems.filter(
    (x) => x.kategori?.toLowerCase() === "profesional" || x.id?.startsWith("prof_")
  );
  const listProf =
    profFromDb.length > 0
      ? profFromDb.map((item, idx) => ({
          teks: item.teks || item.judul || DEFAULT_PROFESIONAL[idx]?.teks || "Indikator Profesional",
          nilai:
            item.nilai !== undefined && item.nilai !== null
              ? Number(item.nilai)
              : Number(pn.nilai_profesional || 0),
          mutu:
            item.indeks ||
            hitungMutu(item.nilai !== undefined ? item.nilai : pn.nilai_profesional),
        }))
      : DEFAULT_PROFESIONAL.map((def) => ({
          teks: def.teks,
          nilai: Number(pn.nilai_profesional || 0),
          mutu: hitungMutu(pn.nilai_profesional),
        }));

  // 2. List Pilar Personal
  const persFromDb = detailItems.filter(
    (x) => x.kategori?.toLowerCase() === "personal" || x.id?.startsWith("pers_")
  );
  const listPers =
    persFromDb.length > 0
      ? persFromDb.map((item, idx) => ({
          teks: item.teks || item.judul || DEFAULT_PERSONAL[idx]?.teks || "Indikator Personal",
          nilai:
            item.nilai !== undefined && item.nilai !== null
              ? Number(item.nilai)
              : Number(pn.nilai_personal || 0),
          mutu:
            item.indeks ||
            hitungMutu(item.nilai !== undefined ? item.nilai : pn.nilai_personal),
        }))
      : DEFAULT_PERSONAL.map((def) => ({
          teks: def.teks,
          nilai: Number(pn.nilai_personal || 0),
          mutu: hitungMutu(pn.nilai_personal),
        }));

  // 3. List Pilar Sosial
  const sosFromDb = detailItems.filter(
    (x) => x.kategori?.toLowerCase() === "sosial" || x.id?.startsWith("sos_")
  );
  const listSos =
    sosFromDb.length > 0
      ? sosFromDb.map((item, idx) => ({
          teks: item.teks || item.judul || DEFAULT_SOSIAL[idx]?.teks || "Indikator Sosial",
          nilai:
            item.nilai !== undefined && item.nilai !== null
              ? Number(item.nilai)
              : Number(pn.nilai_sosial || 0),
          mutu:
            item.indeks ||
            hitungMutu(item.nilai !== undefined ? item.nilai : pn.nilai_sosial),
        }))
      : DEFAULT_SOSIAL.map((def) => ({
          teks: def.teks,
          nilai: Number(pn.nilai_sosial || 0),
          mutu: hitungMutu(pn.nilai_sosial),
        }));

  // 4. List Pilar Administratif
  const admFromDb = detailItems.filter(
    (x) =>
      x.kategori?.toLowerCase() === "administratif" ||
      x.kategori?.toLowerCase() === "administrasi" ||
      x.id?.startsWith("adm_")
  );
  const defaultAdmScores = [
    pn.skor_presensi || pn.nilai_administratif || 0,
    pn.skor_logbook || pn.nilai_administratif || 0,
    pn.skor_tugas || pn.nilai_administratif || 0,
    pn.skor_laporan || pn.nilai_administratif || 0,
  ];
  const listAdm =
    admFromDb.length > 0
      ? admFromDb.map((item, idx) => ({
          teks: item.teks || item.judul || DEFAULT_ADMINISTRATIF[idx]?.teks || "Indikator Administratif",
          nilai:
            item.nilai !== undefined && item.nilai !== null
              ? Number(item.nilai)
              : Number(defaultAdmScores[idx] || pn.nilai_administratif || 0),
          mutu:
            item.indeks ||
            hitungMutu(item.nilai !== undefined ? item.nilai : defaultAdmScores[idx]),
        }))
      : DEFAULT_ADMINISTRATIF.map((def, idx) => ({
          teks: def.teks,
          nilai: Number(defaultAdmScores[idx] || 0),
          mutu: hitungMutu(defaultAdmScores[idx]),
        }));

  // Ringkasan Nilai Akhir
  const nilaiAkhirAngka = Number(pn.nilai_akhir_angka || 0).toFixed(2);
  const indeksMutu = pn.indeks_nilai_akhir || hitungMutu(pn.nilai_akhir_angka);
  const predikatKelulusan = pn.predikat_akhir || "Sangat Baik";
  const rawCatatan = pn.catatan_mentor || "";
  const cleanCatatan = rawCatatan
    .replace(/^Catatan\s*:\s*/i, "")
    .replace(/^["“]+|["”]+$/g, "")
    .trim();

  // Pejabat Penandatangan
  const tempatTerbit = tpl.tempat_terbit || inst.tempat_terbit || "Ponorogo";
  const tanggalTerbitFormatted = formatTanggalIndo(
    pn.tanggal_penilaian || pn.updated_at || new Date()
  );
  const fullJabatan =
    tpl.jabatan_penandatangan ||
    inst.pejabat_jabatan ||
    "Kepala Dinas Komunikasi Informatika dan Statistik";
  const namaPenandatangan =
    tpl.nama_penandatangan || inst.pejabat_nama || "Drs. BAMBANG SUHENDRO, M.Si";
  const pangkatPenandatangan =
    tpl.pangkat_penandatangan || inst.pejabat_pangkat || "Pembina Utama Muda";
  const nipPenandatangan =
    tpl.nip_penandatangan || inst.pejabat_nip || "19750812 200003 1 004";

  // Bobot
  const bobotProf = pn.bobot_profesional || 35;
  const bobotPers = pn.bobot_personal || 25;
  const bobotSos = pn.bobot_sosial || 20;
  const bobotAdm = pn.bobot_administratif || 20;

  return (
    <div
      className={`w-full rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
      }`}
    >
      {/* ── HEADER CARD: SERUPA DENGAN CARD DI TAB RINGKASAN KOMPETENSI ── */}
      <div
        className={`flex items-center justify-between gap-3 px-3.5 sm:px-6 pt-3.5 sm:pt-5 pb-2.5 sm:pb-3 border-b ${
          isDark ? "border-white/10" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="min-w-0">
            <h3
              className={`text-sm sm:text-base font-black truncate ${
                isDark ? "text-slate-100" : "text-[#0B1442]"
              }`}
            >
              Pratinjau Lembar Rapor Resmi (A4)
            </h3>
            <p
              className={`mt-0.5 text-[10px] sm:text-xs leading-relaxed max-w-2xl truncate ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Simulasi tampilan cetak dokumen transkrip nilai resmi bertanda tangan kedinasan sesuai template dinas
            </p>
          </div>
        </div>

        {/* Kanan Header: Tombol Unduh PDF */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={downloading}
              className="group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  <span>Unduh Dokumen PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── BODY CARD: KANVAS DOKUMEN A4 DENGAN UKURAN SEBENARNYA TAPI DIPERKECIL SECARA PROPORSIONAL ── */}
      <div
        ref={containerRef}
        className={`p-3.5 sm:p-6 flex flex-col items-center justify-center overflow-x-auto ${
          isDark ? "bg-[#0c1017]" : "bg-slate-100/80"
        }`}
      >
        {/* Toolbar Ringkas: Info Format A4 & Tombol Zoom Interaktif */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full max-w-[620px] mb-3.5 px-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xs font-semibold text-slate-700 dark:text-slate-200">
              <FileText className="w-3.5 h-3.5 text-[#00A5EC]" />
              Format Berkas: A4 (210 × 297 mm)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.36}
              title="Perkecil Tampilan"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="px-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 min-w-[42px] text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 1.2}
              title="Perbesar Tampilan"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

            <button
              type="button"
              onClick={handleResetZoom}
              title="Kembalikan ke Ukuran Pas Ringkas"
              className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                userZoom === null
                  ? "bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleZoom100}
              title="Lihat Ukuran Asli 100%"
              className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                scale === 1.0
                  ? "bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>100%</span>
            </button>
          </div>
        </div>

        {/* Container Wrapper Terukur: Menyesuaikan skala agar tidak menyisakan ruang kosong vertikal */}
        <div
          style={{
            width: `${Math.round(A4_WIDTH * scale)}px`,
            height: `${Math.round(paperHeight * scale)}px`,
          }}
          className="relative transition-[width,height] duration-200 ease-out origin-top mx-auto shrink-0"
        >
          {/* Lembar Dokumen A4 Ukuran Sebenarnya (794px × 1123px) yang diskalakan seragam tanpa merubah bentuk */}
          <div
            ref={paperRef}
            style={{
              width: `${A4_WIDTH}px`,
              minHeight: `${A4_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="absolute top-0 left-0 bg-white text-slate-900 rounded-[2px] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] ring-1 ring-slate-300/80 px-10 pt-8 pb-8 font-sans select-none"
          >
            {/* 1. KOP SURAT KEDINASAN RESMI */}
            <div className="flex items-center w-full gap-4 pb-1.5">
              {/* Logo Instansi di sisi kiri */}
              <div className="shrink-0 flex items-center justify-center w-16 h-20">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Logo Instansi"
                    className="max-h-full max-w-full object-contain"
                    onError={() => setLogoGagal(true)}
                  />
                ) : (
                  <div className="w-14 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                    LOGO
                  </div>
                )}
              </div>

              {/* Teks Kop Surat */}
              <div className="min-w-0 flex-1 text-center pr-3">
                <p className="font-bold uppercase text-slate-700 tracking-wider text-[12px]">
                  {namaPemda}
                </p>
                <h2 className="font-black uppercase text-slate-900 tracking-tight text-[15px] mt-0.5">
                  {namaDinas}
                </h2>
                {barisAlamat.map((baris, i) => (
                  <p
                    key={i}
                    className="text-slate-500 font-normal text-[10px] leading-tight mt-0.5"
                  >
                    {baris}
                  </p>
                ))}
              </div>
            </div>

            {/* Garis Pembatas Kop Surat Ganda Sesuai Template */}
            {layoutConfig.tampilkan_garis_kop !== false && (
              <div className="w-full space-y-[1.5px] mt-1 mb-3">
                <div className="w-full bg-slate-900 h-[2px]" />
                <div className="w-full bg-slate-900/60 h-[0.7px]" />
              </div>
            )}

            {/* 2. JUDUL DOKUMEN & NOMOR */}
            <div className="text-center space-y-0.5 mb-3">
              <h3 className="text-[13.5px] font-black tracking-wide uppercase text-slate-900">
                {judulDokumen}
              </h3>
              <p className="text-[10.5px] font-mono text-slate-600">
                Nomor: {nomorDokumen}
              </p>
            </div>

            {/* 3. BIODATA PESERTA MAGANG (Format 2 Kolom Lengkap Sesuai Dokumen Resmi) */}
            <div className="w-full text-slate-800 text-[10px] mb-3">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td
                      className="font-bold whitespace-nowrap text-slate-700 py-0.5"
                      style={{ width: "20%" }}
                    >
                      Nama Peserta
                    </td>
                    <td className="py-0.5 font-medium" style={{ width: "30%" }}>
                      : {p.nama || "-"}
                    </td>
                    <td
                      className="font-bold whitespace-nowrap text-slate-700 py-0.5"
                      style={{ width: "22%" }}
                    >
                      Bidang Magang
                    </td>
                    <td className="py-0.5 font-medium" style={{ width: "28%" }}>
                      : {p.bidang || "Aplikasi dan Tata Kelola Informatika"}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      NIM / NISN
                    </td>
                    <td className="py-0.5 font-medium">
                      : {p.nim || p.nomor_induk || "-"}
                    </td>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      Mentor Pembimbing
                    </td>
                    <td className="py-0.5 font-medium">
                      : {m.nama || "Pembimbing Lapangan"}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      Instansi / Kampus
                    </td>
                    <td className="py-0.5 font-medium truncate">
                      : {p.institusi || p.asal_institusi || "-"}
                    </td>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      Periode Magang
                    </td>
                    <td className="py-0.5 font-medium">
                      :{" "}
                      {p.tanggal_mulai
                        ? `${formatTanggalIndo(p.tanggal_mulai)} s.d. ${formatTanggalIndo(
                            p.tanggal_selesai
                          )}`
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      Program Studi / Jurusan
                    </td>
                    <td className="py-0.5 font-medium">: {p.jurusan || "-"}</td>
                    <td className="font-bold whitespace-nowrap text-slate-700 py-0.5">
                      Status Kelulusan
                    </td>
                    <td className="py-0.5 font-medium">: Selesai Magang</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TABEL NILAI 4 KOMPONEN & BUTIR PENILAIAN LENGKAP */}
            <div className="overflow-hidden rounded border border-slate-300 mb-3 text-[10px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0B1442] font-bold text-white text-[10px]">
                    <th className="py-1 px-1.5 text-center w-8 border-r border-white/20">
                      No
                    </th>
                    <th className="py-1 px-2 text-left border-r border-white/20">
                      Komponen &amp; Butir Penilaian Magang
                    </th>
                    <th className="py-1 px-2 text-center w-24 border-r border-white/20">
                      Nilai (0-100)
                    </th>
                    <th className="py-1 px-2 text-center w-16">Mutu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {/* Pilar I: Profesional */}
                  <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
                    <td className="text-center py-1 px-1.5 bg-slate-100/90" />
                    <td colSpan={3} className="text-left font-bold py-1 px-2">
                      I. KOMPETENSI PROFESIONAL
                    </td>
                  </tr>
                  {listProf.map((item, idx) => (
                    <tr key={`prof_${idx}`} className="hover:bg-slate-50/60">
                      <td className="text-center text-slate-500 py-0.5 px-1.5 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 px-2 border-r border-slate-200 font-normal">
                        {item.teks}
                      </td>
                      <td className="text-center font-medium py-0.5 px-2 border-r border-slate-200">
                        {Number(item.nilai || 0).toFixed(2)}
                      </td>
                      <td className="text-center font-semibold py-0.5 px-2">
                        {item.mutu}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                    <td
                      colSpan={2}
                      className="text-right py-1 px-2 border-r border-slate-200"
                    >
                      Rata-rata Kompetensi Profesional
                    </td>
                    <td className="text-center py-1 px-2 border-r border-slate-200">
                      {Number(pn.nilai_profesional || 0).toFixed(2)}
                    </td>
                    <td className="text-center py-1 px-2">
                      {hitungMutu(pn.nilai_profesional)}
                    </td>
                  </tr>

                  {/* Pilar II: Personal */}
                  <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
                    <td className="text-center py-1 px-1.5 bg-slate-100/90" />
                    <td colSpan={3} className="text-left font-bold py-1 px-2">
                      II. KOMPETENSI PERSONAL
                    </td>
                  </tr>
                  {listPers.map((item, idx) => (
                    <tr key={`pers_${idx}`} className="hover:bg-slate-50/60">
                      <td className="text-center text-slate-500 py-0.5 px-1.5 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 px-2 border-r border-slate-200 font-normal">
                        {item.teks}
                      </td>
                      <td className="text-center font-medium py-0.5 px-2 border-r border-slate-200">
                        {Number(item.nilai || 0).toFixed(2)}
                      </td>
                      <td className="text-center font-semibold py-0.5 px-2">
                        {item.mutu}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                    <td
                      colSpan={2}
                      className="text-right py-1 px-2 border-r border-slate-200"
                    >
                      Rata-rata Kompetensi Personal
                    </td>
                    <td className="text-center py-1 px-2 border-r border-slate-200">
                      {Number(pn.nilai_personal || 0).toFixed(2)}
                    </td>
                    <td className="text-center py-1 px-2">
                      {hitungMutu(pn.nilai_personal)}
                    </td>
                  </tr>

                  {/* Pilar III: Sosial */}
                  <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
                    <td className="text-center py-1 px-1.5 bg-slate-100/90" />
                    <td colSpan={3} className="text-left font-bold py-1 px-2">
                      III. KOMPETENSI SOSIAL
                    </td>
                  </tr>
                  {listSos.map((item, idx) => (
                    <tr key={`sos_${idx}`} className="hover:bg-slate-50/60">
                      <td className="text-center text-slate-500 py-0.5 px-1.5 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 px-2 border-r border-slate-200 font-normal">
                        {item.teks}
                      </td>
                      <td className="text-center font-medium py-0.5 px-2 border-r border-slate-200">
                        {Number(item.nilai || 0).toFixed(2)}
                      </td>
                      <td className="text-center font-semibold py-0.5 px-2">
                        {item.mutu}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                    <td
                      colSpan={2}
                      className="text-right py-1 px-2 border-r border-slate-200"
                    >
                      Rata-rata Kompetensi Sosial
                    </td>
                    <td className="text-center py-1 px-2 border-r border-slate-200">
                      {Number(pn.nilai_sosial || 0).toFixed(2)}
                    </td>
                    <td className="text-center py-1 px-2">
                      {hitungMutu(pn.nilai_sosial)}
                    </td>
                  </tr>

                  {/* Pilar IV: Administratif */}
                  <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
                    <td className="text-center py-1 px-1.5 bg-slate-100/90" />
                    <td colSpan={3} className="text-left font-bold py-1 px-2">
                      IV. KOMPETENSI ADMINISTRATIF &amp; LAPORAN
                    </td>
                  </tr>
                  {listAdm.map((item, idx) => (
                    <tr key={`adm_${idx}`} className="hover:bg-slate-50/60">
                      <td className="text-center text-slate-500 py-0.5 px-1.5 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 px-2 border-r border-slate-200 font-normal">
                        {item.teks}
                      </td>
                      <td className="text-center font-medium py-0.5 px-2 border-r border-slate-200">
                        {Number(item.nilai || 0).toFixed(2)}
                      </td>
                      <td className="text-center font-semibold py-0.5 px-2">
                        {item.mutu}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                    <td
                      colSpan={2}
                      className="text-right py-1 px-2 border-r border-slate-200"
                    >
                      Rata-rata Kompetensi Administratif
                    </td>
                    <td className="text-center py-1 px-2 border-r border-slate-200">
                      {Number(pn.nilai_administratif || 0).toFixed(2)}
                    </td>
                    <td className="text-center py-1 px-2">
                      {hitungMutu(pn.nilai_administratif)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. KOTAK RINGKASAN NILAI AKHIR MAGANG */}
            <div className="rounded border border-slate-300 bg-slate-50/90 p-2.5 mb-3 text-[10px]">
              <p className="font-bold text-[#0B1442] mb-1.5 tracking-wide uppercase text-[10.5px]">
                RINGKASAN NILAI AKHIR MAGANG
              </p>
              {/* 3 Metrik Sejajar Horizontal */}
              <div className="grid grid-cols-3 gap-2 text-slate-700 leading-relaxed pb-1.5">
                <div>
                  <span className="text-slate-500">• Nilai Akhir Kumulatif : </span>
                  <span className="font-bold text-[#0B1442]">
                    {nilaiAkhirAngka} (Skala 100)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">• Predikat Kelulusan : </span>
                  <span className="font-bold text-emerald-600">
                    {predikatKelulusan}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">• Indeks Huruf Mutu : </span>
                  <span className="font-bold text-[#0B1442]">
                    {indeksMutu}
                  </span>
                </div>
              </div>

              {/* Catatan Mentor: Judul Kolom (Tanpa Titik) & Isi Kutipan di Bawahnya Memenuhi Kiri sampai Kanan */}
              {layoutConfig.tampilkan_catatan_mentor !== false && cleanCatatan && (
                <div className="border-t border-slate-200/80 pt-1.5 mt-0.5 space-y-0.5">
                  <p className="text-slate-600 font-medium text-[10px]">
                    Catatan Evaluasi Pembimbing :
                  </p>
                  <p className="italic text-slate-600 text-[9.5px] leading-relaxed break-words w-full">
                    "{cleanCatatan}"
                  </p>
                </div>
              )}
            </div>

            {/* 6. TABEL BOBOT PENILAIAN (KIRI) & TANDA TANGAN KEPALA DINAS (KANAN) */}
            <div className="flex items-start justify-between gap-6 pt-1 text-[10px]">
              {/* Kolom Kiri: Tabel Bobot Penilaian Kompetensi */}
              {layoutConfig.tampilkan_bobot !== false ? (
                <div className="w-[45%] overflow-hidden rounded border border-slate-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0B1442] font-bold text-white text-[10px]">
                        <th className="py-0.5 px-1 text-center w-7 border-r border-white/20">
                          No
                        </th>
                        <th className="py-0.5 px-2 text-left border-r border-white/20">
                          Aspek / Kompetensi Penilaian
                        </th>
                        <th className="py-0.5 px-1.5 text-center w-16">Bobot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 text-[9.5px]">
                      <tr>
                        <td className="text-center text-slate-500 py-0.5 px-1 border-r border-slate-200">
                          1
                        </td>
                        <td className="py-0.5 px-2 border-r border-slate-200 font-medium">
                          Kompetensi Profesional
                        </td>
                        <td className="text-center font-semibold py-0.5 px-1.5">
                          {bobotProf}%
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center text-slate-500 py-0.5 px-1 border-r border-slate-200">
                          2
                        </td>
                        <td className="py-0.5 px-2 border-r border-slate-200 font-medium">
                          Kompetensi Personal
                        </td>
                        <td className="text-center font-semibold py-0.5 px-1.5">
                          {bobotPers}%
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center text-slate-500 py-0.5 px-1 border-r border-slate-200">
                          3
                        </td>
                        <td className="py-0.5 px-2 border-r border-slate-200 font-medium">
                          Kompetensi Sosial
                        </td>
                        <td className="text-center font-semibold py-0.5 px-1.5">
                          {bobotSos}%
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center text-slate-500 py-0.5 px-1 border-r border-slate-200">
                          4
                        </td>
                        <td className="py-0.5 px-2 border-r border-slate-200 font-medium">
                          Kompetensi Administratif &amp; Laporan
                        </td>
                        <td className="text-center font-semibold py-0.5 px-1.5">
                          {bobotAdm}%
                        </td>
                      </tr>
                      <tr className="bg-slate-100/90 font-bold text-[#0B1442] border-t border-slate-300">
                        <td
                          colSpan={2}
                          className="text-right py-0.5 px-2 border-r border-slate-200"
                        >
                          Total Bobot
                        </td>
                        <td className="text-center py-0.5 px-1.5">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-[45%]" />
              )}

              {/* Kolom Kanan: Penandatangan Pejabat Kedinasan Sesuai Template */}
              <div className="w-[50%] text-left pl-3 space-y-0.5">
                <p className="text-slate-700 text-[10px]">
                  {tempatTerbit}, {tanggalTerbitFormatted}
                </p>
                <p className="font-semibold text-slate-800 leading-tight text-[10px]">
                  {fullJabatan}
                </p>

                {/* Area Gambar TTD & Stempel */}
                <div className="relative h-14 flex items-center my-0.5">
                  {ttdSrc ? (
                    <img
                      src={ttdSrc}
                      alt="Tanda Tangan"
                      className="h-14 w-auto object-contain relative z-10"
                    />
                  ) : (
                    <span className="italic text-slate-400 text-[10px]">
                      (Tanda Tangan Digital)
                    </span>
                  )}
                  {stempelSrc && (
                    <img
                      src={stempelSrc}
                      alt="Stempel Dinas"
                      className="absolute left-2 h-14 w-auto opacity-80 pointer-events-none mix-blend-multiply"
                    />
                  )}
                </div>

                <div>
                  <p className="font-bold text-slate-900 underline underline-offset-2 uppercase text-[10.5px]">
                    {namaPenandatangan}
                  </p>
                  {pangkatPenandatangan && (
                    <p className="text-[9.5px] text-slate-600">
                      {pangkatPenandatangan}
                    </p>
                  )}
                  {nipPenandatangan && (
                    <p className="text-[9.5px] font-mono text-slate-600">
                      NIP. {nipPenandatangan}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaporMockupCard;
