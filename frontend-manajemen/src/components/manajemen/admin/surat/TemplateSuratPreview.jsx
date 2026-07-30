import { useState } from "react";
import { getFileUrl, getLogoSuratUrl } from "../../../../utils/fileUrl";
import { Image as ImageIcon } from "lucide-react";

// Placeholder diganti contoh data supaya pratinjau enak dibaca.
const contoh = {
  "{nama_peserta}": "Syafiq Al-Ghiffari",
  "{nomor_induk}": "22082010246",
  "{label_induk}": "NPM",
  "{sebutan_peserta}": "Mahasiswa",
  "{posisi_bidang}": "Aplikasi dan Informatika",
  "{tanggal_mulai}": "7 Juli 2026",
  "{tanggal_selesai}": "22 Oktober 2026",
  "{jenis_magang}": "Magang Mandiri",
  "{jabatan_tujuan}": "Wakil Dekan I",
  "{unit_tujuan}": "Fakultas Ilmu Komputer",
  "{institusi_tujuan}": "Universitas Contoh Indonesia",
  "{kota_tujuan}": "Surabaya",
  "{nomor_surat_pengantar}": "530/UN00.0/PJ/2026",
  "{tanggal_surat_pengantar}": "20 Juli 2026",
  "{nama_instansi}": "Dinas Komunikasi Informatika dan Statistik",
  "{nama_instansi_kapital}": "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
};

const isiContoh = (teks) => {
  let hasil = String(teks || "");
  Object.entries(contoh).forEach(([k, v]) => {
    hasil = hasil.split(k).join(v);
  });
  return hasil;
};

const barisAlamat = (tpl) =>
  [
    tpl?.alamat_instansi,
    [tpl?.telepon && `Telepon ${tpl.telepon}`, tpl?.faksimile && `Faksimile ${tpl.faksimile}`]
      .filter(Boolean)
      .join(", "),
    [tpl?.laman, tpl?.pos_el].filter(Boolean).join(", "),
  ].filter(Boolean);

/**
 * Pratinjau visual template surat penerimaan.
 * @param base ukuran dasar (px). 5 untuk kartu, 9 untuk modal pratinjau.
 */
const bacaTataLetak = (template) => {
  try {
    return JSON.parse(template?.konfigurasi_tata_letak || "{}") || {};
  } catch {
    return {};
  }
};

const TemplateSuratPreview = ({ template, base = 5 }) => {
  // Logo template bila ada; kalau belum diunggah, pakai logo bawaan instansi
  // supaya pratinjau sama dengan PDF yang digenerate backend.
  const [logoGagal, setLogoGagal] = useState(false);
  const logo = logoGagal ? null : getLogoSuratUrl(template?.file_logo);
  const px = (n) => `${(base * n).toFixed(2)}px`;
  const alamat = barisAlamat(template);
  const tl = bacaTataLetak(template);
  // Ikuti saklar tata letak supaya pratinjau sama dengan PDF hasil generate
  const adaGarisKop = tl.tampilkan_garis_kop === true;
  const judulTebal = tl.judul_tebal === true;
  const garisJudul = tl.tampilkan_garis_judul === true;
  const garisBawahNama = tl.garis_bawah_nama === true;
  const tampilTanggal = tl.tampilkan_tanggal !== false;

  const judul =
    (template?.jenis_peserta === "siswa" ? template?.judul_siswa : template?.judul_mahasiswa) ||
    "SURAT KETERANGAN MAGANG MANDIRI";
  const pembuka = isiContoh(
    template?.paragraf_pembuka ||
      "Berdasarkan surat dari {jabatan_tujuan} {unit_tujuan} {institusi_tujuan} perihal {jenis_magang} di {nama_instansi} atas nama:"
  );
  const penutup = isiContoh(
    template?.paragraf_penutup ||
      "Dengan ini kami sampaikan bahwa {sebutan_peserta} tersebut diatas dapat kami terima untuk melaksanakan {jenis_magang} pada tanggal {tanggal_mulai} sampai dengan {tanggal_selesai}."
  );
  const salam = isiContoh(template?.paragraf_salam || "Demikian atas kerjasamanya kami sampaikan terima kasih.");

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-[3px] bg-white ring-1 ring-slate-200"
      style={{ padding: px(2.2) }}
    >
      {/* Kop surat */}
      <div className="flex items-start" style={{ gap: px(1.4) }}>
        {logo ? (
          <img
            src={logo}
            alt={template?.nama || "Logo"}
            className="shrink-0 object-contain"
            style={{ width: px(5.4), height: px(6.4) }}
            // Kalau berkas logo tidak ditemukan, kembali ke kotak placeholder
            onError={() => setLogoGagal(true)}
          />
        ) : (
          <span
            className="flex shrink-0 items-center justify-center rounded bg-slate-100 text-slate-300"
            style={{ width: px(5.4), height: px(6.4) }}
          >
            <ImageIcon style={{ width: px(2.6), height: px(2.6) }} />
          </span>
        )}

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-bold uppercase text-slate-700" style={{ fontSize: px(1.55), lineHeight: 1.35 }}>
            {template?.nama_pemerintah || "PEMERINTAH KABUPATEN PONOROGO"}
          </p>
          <p className="truncate font-black uppercase text-slate-900" style={{ fontSize: px(2), lineHeight: 1.3 }}>
            {template?.nama_instansi || "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK"}
          </p>
          {alamat.map((baris, i) => (
            <p key={i} className="truncate text-slate-500" style={{ fontSize: px(1.15), lineHeight: 1.45 }}>
              {baris}
            </p>
          ))}
        </div>
      </div>

      {adaGarisKop && (
        <div className="w-full rounded bg-slate-800" style={{ height: px(0.42), marginTop: px(1.2) }} />
      )}

      {/* Tempat & tanggal — kanan atas, tepat di bawah kop */}
      {tampilTanggal && (
        <p className="text-right text-slate-600" style={{ marginTop: px(1.6), fontSize: px(1.25) }}>
          {template?.tempat_terbit || "Ponorogo"}, 28 Juli 2026
        </p>
      )}

      {/* Tujuan — "Kepada :" lalu "Yth." */}
      <div className="text-slate-600" style={{ marginTop: px(1.6), fontSize: px(1.25), lineHeight: 1.6 }}>
        <p>Kepada :</p>
        <div className="flex items-start" style={{ gap: px(0.7) }}>
          <span className="shrink-0">Yth.</span>
          <div className="min-w-0 flex-1">
            <p className="truncate">Wakil Dekan I</p>
            <p className="truncate">Fakultas Ilmu Komputer</p>
            <p className="truncate">Universitas Contoh Indonesia</p>
            <p>di</p>
            <p className="truncate uppercase">Surabaya</p>
          </div>
        </div>
      </div>

      {/* Judul & nomor — setelah blok tujuan, tanpa tebal/garis bawah */}
      <div className="text-center" style={{ marginTop: px(1.8) }}>
        <p
          className={`truncate uppercase text-slate-900 ${judulTebal ? "font-black" : "font-normal"} ${garisJudul ? "underline" : ""}`}
          style={{ fontSize: px(1.5) }}
        >
          {judul}
        </p>
        <p className="truncate text-slate-600" style={{ fontSize: px(1.3), marginTop: px(0.4) }}>
          NOMOR : 400.14.5.4/KH/0000/405.18/2026
        </p>
      </div>

      {/* Isi */}
      <div
        className="text-justify text-slate-600"
        style={{ marginTop: px(1.4), fontSize: px(1.25), lineHeight: 1.6 }}
      >
        <p className="line-clamp-3">{pembuka}</p>
        <div style={{ marginTop: px(1), paddingLeft: px(2.4) }}>
          {[
              ["Nama", "Syafiq Al-Ghiffari"],
              ["NPM", "22082010246"],
              ["Bidang/Unit Kerja", "Aplikasi dan Informatika"],
              ["Waktu Pelaksanaan", "7 Juli 2026 s.d. 22 Oktober 2026"],
          ].map(([k, v]) => (
              <div key={k} className="flex items-baseline" style={{ gap: px(0.55) }}>
              <span className="shrink-0 whitespace-nowrap" style={{ width: px(11.5) }}>{k}</span>
              <span className="shrink-0">:</span>
              <span className="min-w-0 flex-1 truncate">{v}</span>
              </div>
          ))}
        </div>
        <p className="line-clamp-3" style={{ marginTop: px(1) }}>{penutup}</p>
        <p className="truncate" style={{ marginTop: px(0.8) }}>{salam}</p>
      </div>

      {/* Tanda tangan */}
      <div className="mt-auto flex justify-end" style={{ paddingTop: px(1.6) }}>
        <div className="text-left" style={{ width: "50%" }}>
          <p className="line-clamp-2 text-slate-600" style={{ fontSize: px(1.25), lineHeight: 1.5 }}>
            {template?.jabatan_penandatangan || "Kepala Dinas Komunikasi Informatika dan Statistik"}
          </p>
          {template?.file_ttd ? (
            <img
              src={getFileUrl(template.file_ttd)}
              alt="Tanda tangan"
              className="object-contain"
              style={{ height: px(4.6), marginTop: px(0.6) }}
            />
          ) : (
            <div style={{ height: px(4.6) }} />
          )}
          {/* Nama penandatangan polos, mengikuti PDF */}
          <p
            className={`truncate text-slate-800 ${garisBawahNama ? "underline" : ""}`}
            style={{ fontSize: px(1.3) }}
          >
            {template?.nama_penandatangan || "Nama Penandatangan"}
          </p>
          <p className="truncate text-slate-500" style={{ fontSize: px(1.15) }}>
            {template?.pangkat_penandatangan || "Pembina Utama Muda"}
          </p>
          <p className="truncate text-slate-500" style={{ fontSize: px(1.15) }}>
            {(() => {
              const nip = String(template?.nip_penandatangan || "").trim();
              if (!nip) return "NIP. -";
              return /^nip/i.test(nip) ? nip.replace(/^nip\.?\s*/i, "NIP. ") : `NIP. ${nip}`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateSuratPreview;