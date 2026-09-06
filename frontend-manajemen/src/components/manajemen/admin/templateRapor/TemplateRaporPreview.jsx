import { useState } from "react";
import { getFileUrl, getLogoSuratUrl } from "../../../../utils/fileUrl";
import { Image as ImageIcon } from "lucide-react";

export const TemplateRaporPreview = ({ template, base = 2.5, kategori = "mahasiswa" }) => {
  const [logoGagal, setLogoGagal] = useState(false);
  if (!template) return null;

  const isSiswa = kategori === "siswa" || template?.jenis_peserta === "siswa";
  const px = (n) => `${(base * n).toFixed(2)}px`;

  const layoutConfig = (() => {
    try {
      return typeof template.konfigurasi_tata_letak === "string"
        ? JSON.parse(template.konfigurasi_tata_letak || "{}")
        : template.konfigurasi_tata_letak || {};
    } catch {
      return {
        tampilkan_bobot: true,
        tampilkan_qr: true,
        tampilkan_catatan_mentor: true,
        tampilkan_garis_kop: true,
      };
    }
  })();

  const barisAlamat = (tpl) =>
    [
      tpl?.alamat_instansi || "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
      [tpl?.telepon || "Telepon 0352–3592999", tpl?.faksimile || "Faksimile 0352–3592999"]
        .filter(Boolean)
        .join(", "),
      [tpl?.laman || "Laman kominfo.ponorogo.go.id", tpl?.pos_el || "Pos-el kominfo@ponorogo.go.id"]
        .filter(Boolean)
        .join(", "),
    ].filter(Boolean);

  const logo = logoGagal ? null : getLogoSuratUrl(template?.file_logo);

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-[3px] bg-white ring-1 ring-slate-200 text-slate-900 select-none"
      style={{ padding: `${px(2.2)} ${px(2.4)}` }}
    >
      {/* 1. Kop Surat */}
      <div className="flex items-center w-full" style={{ minHeight: px(8.2), paddingLeft: px(1.5) }}>
        {/* Logo Instansi di sisi kiri */}
        <div className="shrink-0 flex items-center justify-center" style={{ width: px(5.8), height: px(6.8) }}>
          {logo ? (
            <img
              src={logo}
              alt={template?.nama || "Logo"}
              className="max-h-full max-w-full object-contain"
              onError={() => setLogoGagal(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded bg-slate-100 text-slate-300">
              <ImageIcon style={{ width: px(2.8), height: px(2.8) }} />
            </span>
          )}
        </div>

        {/* Teks Kop Surat */}
        <div className="min-w-0 flex-1 text-center" style={{ paddingLeft: px(2), paddingRight: px(3) }}>
          <p
            className="truncate font-bold uppercase text-slate-700 tracking-wide"
            style={{ fontSize: px(1.55), lineHeight: 1.35 }}
          >
            {template.nama_pemerintah || "PEMERINTAH KABUPATEN PONOROGO"}
          </p>
          <p
            className="truncate font-black uppercase text-slate-900 tracking-tight"
            style={{ fontSize: px(2), lineHeight: 1.3, marginTop: px(0.1) }}
          >
            {template.nama_instansi || "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK"}
          </p>
          {barisAlamat(template).map((baris, i) => (
            <p
              key={i}
              className="truncate text-slate-500 font-normal"
              style={{ fontSize: px(1.05), lineHeight: 1.38, marginTop: px(0.1) }}
            >
              {baris}
            </p>
          ))}
        </div>
      </div>

      {/* Garis Pembatas Kop */}
      {layoutConfig.tampilkan_garis_kop !== false && (
        <div className="w-full space-y-[1.2px]" style={{ marginTop: px(1.3) }}>
          <div className="w-full bg-slate-800" style={{ height: px(0.45) }} />
          <div className="w-full bg-slate-800 opacity-60" style={{ height: px(0.2) }} />
        </div>
      )}

      {/* 2. Judul Dokumen & Nomor */}
      <div className="text-center" style={{ marginTop: px(1.6) }}>
        <p
          className="truncate font-black uppercase text-slate-900"
          style={{ fontSize: px(1.5), letterSpacing: "0.02em" }}
        >
          {template.judul_dokumen || "TRANSKRIP NILAI HASIL MAGANG"}
        </p>
        <p
          className="truncate font-mono text-slate-600"
          style={{ fontSize: px(1.15), marginTop: px(0.2) }}
        >
          Nomor: {template.format_nomor?.replace("{nomor}", "0001")?.replace("{tahun}", "2026") || "560/TRN-0001/405.08/2026"}
        </p>
      </div>

      {/* 3. Biodata Peserta (Format 2 Kolom Lengkap Sesuai Dokumen Resmi) */}
      <div className="w-full text-slate-800" style={{ marginTop: px(1.2), fontSize: px(1.02), lineHeight: 1.45 }}>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="font-bold whitespace-nowrap" style={{ width: "20%", paddingBottom: px(0.15) }}>Nama Peserta</td>
              <td style={{ width: "30%", paddingBottom: px(0.15) }}>: {isSiswa ? "Ahmad Rizky Pratama" : "Ahmad Fauzi"}</td>
              <td className="font-bold whitespace-nowrap" style={{ width: "22%", paddingBottom: px(0.15) }}>Bidang Magang</td>
              <td style={{ width: "28%", paddingBottom: px(0.15) }}>: Aplikasi dan Tata Kelola Informatika</td>
            </tr>
            <tr>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>{isSiswa ? "NISN" : "NIM / NISN"}</td>
              <td style={{ paddingBottom: px(0.15) }}>: {isSiswa ? "0068192841" : "22081010045"}</td>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>Mentor Pembimbing</td>
              <td style={{ paddingBottom: px(0.15) }}>: Drs. Eko Wahyudi, M.Kom</td>
            </tr>
            <tr>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>Instansi / {isSiswa ? "Sekolah" : "Kampus"}</td>
              <td className="truncate" style={{ paddingBottom: px(0.15) }}>: {isSiswa ? "SMK Negeri 1 Ponorogo" : "UPN 'Veteran' Jawa Timur"}</td>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>Periode Magang</td>
              <td style={{ paddingBottom: px(0.15) }}>: 1 Feb 2026 s.d. 31 Jul 2026</td>
            </tr>
            <tr>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>Program Studi / Jurusan</td>
              <td style={{ paddingBottom: px(0.15) }}>: {isSiswa ? "Rekayasa Perangkat Lunak" : "Teknik Informatika"}</td>
              <td className="font-bold whitespace-nowrap" style={{ paddingBottom: px(0.15) }}>Status Kelulusan</td>
              <td style={{ paddingBottom: px(0.15) }}>: Selesai Magang</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Tabel Nilai 4 Komponen & Butir Penilaian Lengkap */}
      <div
        className="overflow-hidden rounded border border-slate-300"
        style={{ marginTop: px(1.2), fontSize: px(0.95) }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0B1442] font-bold text-white">
              <th className="text-center" style={{ padding: `${px(0.4)} ${px(0.4)}`, width: "6%" }}>No</th>
              <th className="text-left" style={{ padding: `${px(0.4)} ${px(0.8)}` }}>Komponen &amp; Butir Penilaian Magang</th>
              <th className="text-center" style={{ padding: `${px(0.4)} ${px(0.6)}`, width: "16%" }}>Nilai (0-100)</th>
              <th className="text-center" style={{ padding: `${px(0.4)} ${px(0.6)}`, width: "12%" }}>Mutu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Pilar I: Profesional (Rata Kiri Aligned dengan Komponen) */}
            <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
              <td className="bg-slate-100/90 text-center" style={{ padding: px(0.35) }} />
              <td colSpan={3} className="text-left font-bold" style={{ padding: `${px(0.35)} ${px(0.8)}` }}>
                I. KOMPETENSI PROFESIONAL
              </td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>1</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kemampuan memahami tugas yang diberikan</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>92.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>2</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kemampuan melaksanakan tugas</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>92.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>3</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kemampuan menyelesaikan tugas tepat waktu</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>92.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>4</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kualitas hasil pekerjaan</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>92.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800">
              <td colSpan={2} className="text-right" style={{ padding: `${px(0.3)} ${px(0.8)}` }}>
                Rata-rata Kompetensi Profesional
              </td>
              <td className="text-center" style={{ padding: px(0.3) }}>92.00</td>
              <td className="text-center" style={{ padding: px(0.3) }}>A</td>
            </tr>

            {/* Pilar II: Personal */}
            <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
              <td className="bg-slate-100/90 text-center" style={{ padding: px(0.35) }} />
              <td colSpan={3} className="text-left font-bold" style={{ padding: `${px(0.35)} ${px(0.8)}` }}>
                II. KOMPETENSI PERSONAL
              </td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>1</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Disiplin dan kepatuhan jam kerja magang</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>88.50</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>2</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Inisiatif dan kemandirian dalam bekerja</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>88.50</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>3</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Tanggung jawab atas tugas yang diberikan</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>88.50</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>4</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Sikap, etika, dan integritas kerja</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>88.50</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800">
              <td colSpan={2} className="text-right" style={{ padding: `${px(0.3)} ${px(0.8)}` }}>
                Rata-rata Kompetensi Personal
              </td>
              <td className="text-center" style={{ padding: px(0.3) }}>88.50</td>
              <td className="text-center" style={{ padding: px(0.3) }}>A</td>
            </tr>

            {/* Pilar III: Sosial */}
            <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
              <td className="bg-slate-100/90 text-center" style={{ padding: px(0.35) }} />
              <td colSpan={3} className="text-left font-bold" style={{ padding: `${px(0.35)} ${px(0.8)}` }}>
                III. KOMPETENSI SOSIAL
              </td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>1</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kemampuan komunikasi dan adaptasi lingkungan</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>90.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>2</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kemampuan kerja sama tim (teamwork)</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>90.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>3</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Menghargai rekan kerja dan staf dinas</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>90.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800">
              <td colSpan={2} className="text-right" style={{ padding: `${px(0.3)} ${px(0.8)}` }}>
                Rata-rata Kompetensi Sosial
              </td>
              <td className="text-center" style={{ padding: px(0.3) }}>90.00</td>
              <td className="text-center" style={{ padding: px(0.3) }}>A</td>
            </tr>

            {/* Pilar IV: Administratif */}
            <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
              <td className="bg-slate-100/90 text-center" style={{ padding: px(0.35) }} />
              <td colSpan={3} className="text-left font-bold" style={{ padding: `${px(0.35)} ${px(0.8)}` }}>
                IV. KOMPETENSI ADMINISTRATIF &amp; LAPORAN
              </td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>1</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kedisiplinan Presensi Kehadiran</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>91.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>2</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Ketertiban Pengisian Logbook Jurnal Harian</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>91.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>3</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Penyelesaian Penugasan Mandiri</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>91.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr>
              <td className="text-center text-slate-500" style={{ padding: px(0.25) }}>4</td>
              <td style={{ padding: `${px(0.25)} ${px(0.8)}` }}>Kualitas &amp; Persetujuan Laporan Akhir Magang</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>91.00</td>
              <td className="text-center font-medium" style={{ padding: px(0.25) }}>A</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800">
              <td colSpan={2} className="text-right" style={{ padding: `${px(0.3)} ${px(0.8)}` }}>
                Rata-rata Kompetensi Administratif
              </td>
              <td className="text-center" style={{ padding: px(0.3) }}>91.00</td>
              <td className="text-center" style={{ padding: px(0.3) }}>A</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Kotak Ringkasan Nilai Akhir Magang */}
      <div
        className="rounded border border-slate-300 bg-slate-50/90"
        style={{ marginTop: px(1.2), padding: `${px(0.8)} ${px(1.2)}` }}
      >
        <p className="font-bold text-[#0B1442]" style={{ fontSize: px(1.05) }}>
          RINGKASAN NILAI AKHIR MAGANG
        </p>
        <div className="grid grid-cols-2 gap-2" style={{ marginTop: px(0.5), fontSize: px(0.95), lineHeight: 1.4 }}>
          <div>
            <p className="text-slate-600">
              • Nilai Akhir Kumulatif : <span className="font-bold text-[#0B1442]">90.55 (Skala 100)</span>
            </p>
            <p className="text-slate-600" style={{ marginTop: px(0.2) }}>
              • Indeks Huruf Mutu : <span className="font-bold text-[#0B1442]">A</span>
            </p>
          </div>
          <div>
            <p className="text-slate-600">
              • Predikat Kelulusan : <span className="font-bold text-emerald-600">Sangat Baik</span>
            </p>
            {layoutConfig.tampilkan_catatan_mentor !== false && (
              <p className="italic text-slate-500 line-clamp-2" style={{ marginTop: px(0.2), fontSize: px(0.85) }}>
                "Catatan: Peserta menunjukkan kedisiplinan yang tinggi, inisiatif yang kuat, serta mampu bekerja sama secara produktif dalam tim pengembangan sistem kedinasan."
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Tabel Bobot Penilaian (Kiri) & Tanda Tangan Kepala Dinas (Kanan) */}
      <div
        className="mt-auto flex items-start justify-between"
        style={{ paddingTop: px(3.2), fontSize: px(0.95) }}
      >
        {/* Kolom Kiri: Tabel Bobot Penilaian Kompetensi */}
        {layoutConfig.tampilkan_bobot !== false ? (
          <div className="w-[43%] overflow-hidden rounded border border-slate-300" style={{ fontSize: px(0.88) }}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0B1442] font-bold text-white">
                  <th className="text-center" style={{ padding: `${px(0.3)} ${px(0.3)}`, width: "12%" }}>No</th>
                  <th className="text-left" style={{ padding: `${px(0.3)} ${px(0.6)}` }}>Aspek / Kompetensi Penilaian</th>
                  <th className="text-center" style={{ padding: `${px(0.3)} ${px(0.5)}`, width: "24%" }}>Bobot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="text-center text-slate-500" style={{ padding: px(0.2) }}>1</td>
                  <td style={{ padding: `${px(0.2)} ${px(0.6)}` }}>Kompetensi Profesional</td>
                  <td className="text-center font-semibold" style={{ padding: px(0.2) }}>35%</td>
                </tr>
                <tr>
                  <td className="text-center text-slate-500" style={{ padding: px(0.2) }}>2</td>
                  <td style={{ padding: `${px(0.2)} ${px(0.6)}` }}>Kompetensi Personal</td>
                  <td className="text-center font-semibold" style={{ padding: px(0.2) }}>25%</td>
                </tr>
                <tr>
                  <td className="text-center text-slate-500" style={{ padding: px(0.2) }}>3</td>
                  <td style={{ padding: `${px(0.2)} ${px(0.6)}` }}>Kompetensi Sosial</td>
                  <td className="text-center font-semibold" style={{ padding: px(0.2) }}>20%</td>
                </tr>
                <tr>
                  <td className="text-center text-slate-500" style={{ padding: px(0.2) }}>4</td>
                  <td style={{ padding: `${px(0.2)} ${px(0.6)}` }}>Kompetensi Administratif &amp; Laporan</td>
                  <td className="text-center font-semibold" style={{ padding: px(0.2) }}>20%</td>
                </tr>
                <tr className="bg-slate-100/90 font-bold text-[#0B1442]">
                  <td colSpan={2} className="text-right" style={{ padding: `${px(0.25)} ${px(0.6)}` }}>Total Bobot</td>
                  <td className="text-center" style={{ padding: px(0.25) }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-[43%]" />
        )}

        {/* Kolom Kanan: Kepala Dinas / Pejabat Penandatangan */}
        <div className="text-left w-[53%] min-w-0" style={{ paddingLeft: px(1.5) }}>
          <p className="text-slate-600 truncate">
            {template.tempat_terbit || "Ponorogo"}, 3 September 2026
          </p>
          <p className="text-slate-800 font-semibold leading-snug" style={{ marginTop: px(0.2), fontSize: px(0.95) }}>
            {template.jabatan_penandatangan || "Kepala Dinas Komunikasi, Informatika dan Statistik"}
          </p>

          <div className="relative flex items-center" style={{ height: px(4), marginTop: px(0.2) }}>
            {template.file_ttd ? (
              <img
                src={getFileUrl(template.file_ttd)}
                alt="TTD"
                className="object-contain"
                style={{ height: px(4) }}
              />
            ) : (
              <span className="italic text-slate-400" style={{ fontSize: px(0.85) }}>
                (Tanda Tangan Digital)
              </span>
            )}
            {template.file_stempel && (
              <img
                src={getFileUrl(template.file_stempel)}
                alt="Stempel"
                className="absolute left-6 object-contain opacity-80 pointer-events-none"
                style={{ height: px(4.2) }}
              />
            )}
          </div>

          <p className="truncate font-bold text-slate-900" style={{ fontSize: px(1.1) }}>
            {template.nama_penandatangan || "Drs. BAMBANG SUHENDRO, M.Si"}
          </p>
          <p className="truncate text-slate-500" style={{ fontSize: px(0.9) }}>
            {template.pangkat_penandatangan || "Pembina Utama Muda"}
          </p>
          <p className="truncate text-slate-500 font-mono" style={{ fontSize: px(0.9) }}>
            NIP. {template.nip_penandatangan || "19750812 200003 1 004"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateRaporPreview;
