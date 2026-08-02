import { useState } from "react";
import {
  X, Upload, FileSpreadsheet, Download, Loader2, Sparkles,
  CheckCircle2, AlertTriangle, ArrowLeft, ListChecks, Info,
} from "lucide-react";
import { imporFaqCsv, contohImporCsv } from "../../../../services/chatService";
import { unduhBlob } from "../../../../utils/unduhBerkas";
import { toastError, toastSuccess } from "../../../../utils/swal";

const WARNA_AKSI = {
  baru: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  perbarui: "bg-sky-50 text-sky-600 border border-sky-100",
  lewati: "bg-slate-100 text-slate-500 border border-slate-200",
};

// Ringkasan hasil pratinjau. Warnanya ditulis utuh supaya tidak terpangkas purge Tailwind.
const KARTU_RINGKASAN = [
  { kunci: "baru", judul: "FAQ baru", kelas: "from-emerald-50 to-white border-emerald-100", teks: "text-emerald-600" },
  { kunci: "perbarui", judul: "Diperbarui", kelas: "from-sky-50 to-white border-sky-100", teks: "text-sky-600" },
  { kunci: "lewati", judul: "Dilewati", kelas: "from-slate-50 to-white border-slate-200", teks: "text-slate-500" },
];

const DialogImporCsv = ({ onTutup, onSelesai }) => {
  const [berkas, setBerkas] = useState(null);
  const [pratinjau, setPratinjau] = useState(null);
  const [sibuk, setSibuk] = useState(false);
  const [seret, setSeret] = useState(false);

  // Satu pintu masuk untuk berkas, baik dari klik maupun seret-lepas.
  const terimaBerkas = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toastError("Berkas harus berekstensi .csv");
      return;
    }
    setBerkas(f);
    setPratinjau(null); // berkas ganti, pratinjau lama tidak berlaku lagi
  };

  const pilihBerkas = (e) => {
    terimaBerkas(e.target.files?.[0]);
    e.target.value = ""; // agar berkas yang sama bisa dipilih ulang
  };

  const saatSeretMasuk = (e) => {
    e.preventDefault();
    setSeret(true);
  };

  const saatSeretKeluar = (e) => {
    e.preventDefault();
    setSeret(false);
  };

  const saatLepas = (e) => {
    e.preventDefault();
    setSeret(false);
    terimaBerkas(e.dataTransfer.files?.[0]);
  };

  const unduhContoh = async () => {
    try {
      const res = await contohImporCsv();
      unduhBlob(res, "contoh-impor-faq.csv");
    } catch {
      toastError("Gagal mengunduh berkas contoh");
    }
  };

  const jalankanPratinjau = async () => {
    if (!berkas) return;
    setSibuk(true);
    try {
      const res = await imporFaqCsv(berkas, "pratinjau");
      setPratinjau(res.data);
    } catch (err) {
      toastError(err.response?.data?.message || "Berkas tidak dapat dibaca");
    } finally {
      setSibuk(false);
    }
  };

  const terapkan = async () => {
    if (!berkas) return;
    setSibuk(true);
    try {
      const res = await imporFaqCsv(berkas, "terapkan");
      toastSuccess(res.data.message || "Impor selesai");
      await onSelesai();
      onTutup();
    } catch (err) {
      toastError(err.response?.data?.message || "Impor gagal");
    } finally {
      setSibuk(false);
    }
  };

  const r = pratinjau?.ringkasan;
  const langkah = pratinjau ? 2 : 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-[modalFadeUp_0.3s_ease-out]">

        {/* Kepala - pola sama dengan modal Tambah FAQ */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <FileSpreadsheet
            className="pointer-events-none absolute right-18 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.06]"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-md">
                <Upload className="h-5 w-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC]">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  Impor Data
                </div>
                <h3 className="text-base font-black leading-tight text-white">Impor FAQ dari CSV</h3>
                <p className="mt-0.5 text-[11px] text-white/60">
                  Pertanyaan yang sudah ada akan diperbarui, sisanya ditambahkan baru
                </p>
              </div>
            </div>

            <button
              onClick={onTutup}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Penunjuk langkah */}
          <div className="relative mt-4 flex items-center gap-2">
            {[
              { nomor: 1, label: "Pilih berkas" },
              { nomor: 2, label: "Tinjau & terapkan" },
            ].map((l) => {
              const aktif = langkah === l.nomor;
              const selesai = langkah > l.nomor;
              return (
                <span
                  key={l.nomor}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all duration-300 ${
                    aktif
                      ? "bg-white text-[#0B1442] shadow-md"
                      : "border border-white/15 bg-white/5 text-white/50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-full text-[9px] font-black ${
                      aktif ? "bg-[#00A5EC] text-white" : "bg-white/15 text-white/70"
                    }`}
                    style={{ width: 16, height: 16, borderRadius: 9999 }}
                  >
                    {selesai ? <CheckCircle2 className="h-2.5 w-2.5" /> : l.nomor}
                  </span>
                  {l.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Isi - dapat digulir */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 px-6 py-5">

          {/* Langkah 1 - berkas sumber di kiri, ketentuan di kanan */}
          {!pratinjau && (
            <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
              <div
                className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-[fadeslide_0.3s_ease-out]"
                style={{ animationFillMode: "backwards" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[13px] font-black text-[#0B1442]">Berkas Sumber</h4>
                    <p className="text-[10.5px] text-slate-400">Format CSV dengan pemisah koma atau titik koma</p>
                  </div>
                </div>

                <label
                  onDragOver={saatSeretMasuk}
                  onDragEnter={saatSeretMasuk}
                  onDragLeave={saatSeretKeluar}
                  onDrop={saatLepas}
                  className={`group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#004F9F] hover:bg-blue-50/40 hover:shadow-md ${
                    seret
                      ? "-translate-y-0.5 border-[#004F9F] bg-blue-50/70 shadow-md"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-[#004F9F] ${
                      seret ? "scale-110 text-[#004F9F]" : "text-slate-300"
                    }`}
                  >
                    {seret ? <Upload className="h-6 w-6 animate-bounce" /> : <FileSpreadsheet className="h-6 w-6" />}
                  </span>

                  {seret ? (
                    <>
                      <span className="text-sm font-black text-[#004F9F]">Lepaskan berkas di sini</span>
                      <span className="text-[11px] text-slate-400">Hanya berkas berekstensi .csv yang diterima</span>
                    </>
                  ) : berkas ? (
                    <>
                      <span className="text-sm font-black text-slate-700">{berkas.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {(berkas.size / 1024).toFixed(1)} KB · klik atau seret berkas lain untuk mengganti
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-black text-slate-600">Seret berkas CSV ke area ini</span>
                      <span className="text-[11px] text-slate-400">atau klik untuk memilih dari perangkat Anda</span>
                      <span className="mt-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">
                        Maksimal 2 MB · 500 baris
                      </span>
                    </>
                  )}

                  <input type="file" accept=".csv" onChange={pilihBerkas} className="hidden" />
                </label>
              </div>

              <div
                className="group lg:col-span-4 relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] p-5 shadow-sm transition-all duration-300 hover:shadow-xl animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
              >
                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00A5EC]/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00A5EC]/30" />
                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/5 to-white/0 transition-transform duration-1000 group-hover:translate-x-full" />

                <div className="relative mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition-transform duration-300 group-hover:rotate-12">
                    <Info className="h-4 w-4 text-[#00A5EC]" />
                  </span>
                  <div>
                    <h4 className="text-[13px] font-black text-white">Ketentuan Berkas</h4>
                    <p className="text-[10.5px] text-white/50">Baca sebelum mengunggah agar tidak ada baris dilewati</p>
                  </div>
                </div>

                <ul className="relative space-y-2.5">
                  {[
                    <>Baris judul wajib memuat kolom <code className="rounded border border-white/10 bg-white/10 px-1 font-bold text-[#00A5EC]">question</code> dan <code className="rounded border border-white/10 bg-white/10 px-1 font-bold text-[#00A5EC]">answer</code>.</>,
                    <>Kolom lain bersifat pilihan dan akan diisi nilai bawaan bila dikosongkan.</>,
                    <>Pencocokan memakai teks pertanyaan, bukan ID, sehingga aman dipakai berulang.</>,
                    <>Gunakan pemisah koma atau titik koma secara konsisten pada seluruh baris.</>,
                    <>Tidak ada data yang berubah sampai Anda menekan tombol Terapkan.</>,
                  ].map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[11px] leading-relaxed text-white/75 animate-[fadeslide_0.3s_ease-out]"
                      style={{ animationDelay: `${160 + i * 60}ms`, animationFillMode: "backwards" }}
                    >
                      <span
                        className="mt-1.5 block shrink-0 bg-[#00A5EC]"
                        style={{ width: 5, height: 5, borderRadius: 9999 }}
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                  </ul>
                </div>
              </div>

              {/* Arahan resmi bila susunan kolom belum sesuai - melebar di bawah kedua kartu */}
              <div
                className="flex items-center gap-3.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#004F9F] shadow-sm">
                  <Download className="h-4 w-4" />
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Apabila Anda belum memiliki berkas dengan susunan kolom yang sesuai, silakan gunakan tombol{" "}
                  <span className="font-bold text-[#0B1442]">Unduh berkas contoh</span> pada bagian bawah jendela ini.
                  Berkas tersebut memuat seluruh kolom yang dikenali sistem beserta contoh pengisiannya, sehingga dapat
                  langsung Anda sunting sebagai acuan.
                </p>
              </div>
              </>
            )}

          {/* Langkah 2 - tinjau */}
          {pratinjau && (
            <>
              <div
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-[fadeslide_0.3s_ease-out]"
                style={{ animationFillMode: "backwards" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#004F9F]">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[13px] font-black text-[#0B1442]">Ringkasan Perubahan</h4>
                    <p className="text-[10.5px] text-slate-400">Hasil simulasi, belum tersimpan ke basis data</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {KARTU_RINGKASAN.map((k, i) => (
                    <div
                      key={k.kunci}
                      className={`rounded-2xl border bg-gradient-to-b px-4 py-3.5 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out] ${k.kelas}`}
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                    >
                      <p className={`text-2xl font-black ${k.teks}`}>{r[k.kunci]}</p>
                      <p className="mt-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-400">{k.judul}</p>
                    </div>
                  ))}
                </div>
              </div>

              {pratinjau.peringatan?.length > 0 && (
                <div
                  className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 animate-[fadeslide_0.3s_ease-out]"
                  style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
                >
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> Peringatan
                  </p>
                  <ul className="space-y-1">
                    {pratinjau.peringatan.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-700/90">
                        <span
                          className="mt-1.5 block shrink-0 bg-amber-500"
                          style={{ width: 5, height: 5, borderRadius: 9999 }}
                        />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <h4 className="text-[13px] font-black text-[#0B1442]">Rincian Per Baris</h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                    {pratinjau.rincian.length} baris
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-slate-100 via-slate-50 to-white">
                      <tr>
                        <th className="px-4 py-2.5 text-[9.5px] font-black uppercase tracking-wider text-slate-400">Baris</th>
                        <th className="px-4 py-2.5 text-[9.5px] font-black uppercase tracking-wider text-slate-400">Aksi</th>
                        <th className="px-4 py-2.5 text-[9.5px] font-black uppercase tracking-wider text-slate-400">Pertanyaan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pratinjau.rincian.map((d) => (
                        <tr
                          key={d.baris}
                          className="group border-t border-slate-50 transition-colors duration-200 hover:bg-blue-50/40"
                        >
                          <td className="px-4 py-2.5 font-bold text-slate-300 transition-colors duration-200 group-hover:text-slate-400">
                            {d.baris}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide transition-transform duration-200 group-hover:-translate-y-0.5 ${WARNA_AKSI[d.aksi]}`}>
                              {d.aksi}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="truncate font-semibold text-slate-700">{d.question || "—"}</p>
                            {d.alasan && <p className="text-[10px] text-red-500">{d.alasan}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kaki - tombol utama selalu terlihat */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
          {!pratinjau ? (
            <button
              type="button"
              onClick={unduhContoh}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F] hover:text-[#004F9F] hover:shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
              Unduh berkas contoh
            </button>
          ) : (
            <button
              type="button"
              disabled={sibuk}
              onClick={() => setPratinjau(null)}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Pilih berkas lain
            </button>
          )}

          {!pratinjau ? (
            <button
              type="button"
              disabled={!berkas || sibuk}
              onClick={jalankanPratinjau}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-[12px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
            >
              {sibuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListChecks className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />}
              Tinjau perubahan
            </button>
          ) : (
            <button
              type="button"
              disabled={sibuk || (r.baru === 0 && r.perbarui === 0)}
              onClick={terapkan}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[12px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
            >
              {sibuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />}
              Terapkan {r.baru + r.perbarui} perubahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialogImporCsv;