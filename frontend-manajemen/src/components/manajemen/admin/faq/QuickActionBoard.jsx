import { useState, useRef } from "react";
import { GripVertical, Save, Zap, RotateCcw, ArrowUpDown, Plus } from "lucide-react";

/**
 * Papan penyusun urutan tombol quick action.
 *
 * Komponen ini menyimpan urutan sementara di state lokal supaya seretan terasa
 * ringan tanpa memanggil server tiap gerakan. Perubahan baru dikirim saat
 * tombol Simpan ditekan.
 *
 * Induk WAJIB memberi prop `key` yang berubah setiap data dimuat ulang,
 * agar state lokal tersegarkan tanpa perlu useEffect.
 */
const QuickActionBoard = ({ daftarAwal, onSimpan, menyimpan }) => {
  const [urutan, setUrutan] = useState(() => daftarAwal);
  const [berubah, setBerubah] = useState(false);
  const [indeksAktif, setIndeksAktif] = useState(null);
  const indeksSeret = useRef(null);

  const mulaiSeret = (i) => {
    indeksSeret.current = i;
    setIndeksAktif(i);
  };

  const lewatiAtas = (i) => {
    const asal = indeksSeret.current;
    if (asal === null || asal === i) return;

    setUrutan((sebelum) => {
      const salinan = [...sebelum];
      const [dipindah] = salinan.splice(asal, 1);
      salinan.splice(i, 0, dipindah);
      return salinan;
    });
    indeksSeret.current = i;
    setIndeksAktif(i);
    setBerubah(true);
  };

  const selesaiSeret = () => {
    indeksSeret.current = null;
    setIndeksAktif(null);
  };

  const kembalikan = () => {
    setUrutan(daftarAwal);
    setBerubah(false);
  };

  const simpan = () => {
    onSimpan(urutan.map((f, i) => ({ id: f.id, order_index: i })));
    setBerubah(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-[fadeslide_0.35s_ease-out]">
      {/* Kepala kartu - tombol aksi ditumpuk di kanan, Simpan sejajar judul */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <ArrowUpDown className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#0B1442]">Urutan Tombol Cepat</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
              Seret kartu untuk mengubah urutan tampil di widget peserta.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
              <Zap className="h-3 w-3" />
              {urutan.length} tombol
            </span>
          </div>
        </div>

        {/* Kedua tombol hanya tampil setelah urutan benar-benar berubah */}
        {berubah && (
          <div className="flex w-[132px] shrink-0 flex-col gap-2 animate-[fadeslide_0.25s_ease-out]">
            <button
              onClick={simpan}
              disabled={menyimpan}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
              {menyimpan ? "Menyimpan..." : "Simpan Urutan"}
            </button>

            <button
              onClick={kembalikan}
              disabled={menyimpan}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-180" />
              Batalkan
            </button>
          </div>
        )}
      </div>

      {/* Isi kartu */}
      {daftarAwal.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
            <Zap className="h-6 w-6" />
          </div>
          <p className="mt-3 text-[13px] font-black text-slate-500">Belum ada tombol cepat</p>
          <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-slate-400">
            Centang <span className="font-bold text-slate-500">&quot;Jadikan Quick Action&quot;</span> saat menambah atau mengedit FAQ agar muncul di sini.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[10.5px] font-bold text-slate-400">
            <Plus className="h-3 w-3" />
            Maksimal 6 tombol aktif
          </span>
        </div>
      ) : (
        <>
          <ul className="space-y-2 p-5">
            {urutan.map((f, i) => (
              <li
                key={f.id}
                draggable
                onDragStart={() => mulaiSeret(i)}
                onDragEnter={() => lewatiAtas(i)}
                onDragEnd={selesaiSeret}
                onDragOver={(e) => e.preventDefault()}
                className={`group flex cursor-grab items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 active:cursor-grabbing animate-[fadeslide_0.3s_ease-out] ${
                  indeksAktif === i
                    ? "border-[#004F9F] bg-[#004F9F]/5 shadow-md"
                    : "border-slate-200 bg-slate-50/60 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                }`}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-slate-400" />
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-[11px] font-black text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-[13px] font-bold text-slate-700">
                  {f.quick_label || f.question}
                </span>
                {!f.is_active && (
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Nonaktif
                  </span>
                )}
              </li>
            ))}
          </ul>

          {berubah && (
            <div className="flex items-center gap-2 border-t border-amber-100 bg-amber-50/60 px-5 py-3 animate-[fadeslide_0.25s_ease-out]">
              <span
                className="block shrink-0 bg-amber-500 animate-pulse"
                style={{ width: 8, height: 8, borderRadius: 9999 }}
              />
              <p className="text-[11px] font-bold text-amber-700">
                Urutan sudah berubah tetapi belum disimpan.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuickActionBoard;