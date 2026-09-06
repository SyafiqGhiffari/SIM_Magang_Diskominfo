import { useState, useRef } from "react";
import { GripVertical, Save, Zap, RotateCcw, ArrowUpDown, Plus } from "lucide-react";

/**
 * Papan penyusun urutan tombol quick action.
 *
 * Komponen ini menyimpan urutan sementara di state lokal supaya seretan terasa
 * ringan tanpa memanggil server tiap gerakan. Perubahan baru dikirim saat
 * tombol Simpan ditekan.
 */
const QuickActionBoard = ({ daftarAwal = [], onSimpan, menyimpan, isDark = false }) => {
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
    <div className={`rounded-2xl border shadow-sm overflow-hidden animate-[fadeslide_0.35s_ease-out] ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
    }`}>
      {/* Kepala kartu - judul di kiri, badge / tombol aksi di pojok kanan */}
      <div className={`flex items-start justify-between gap-3 sm:gap-4 border-b px-4 py-3.5 sm:px-5 sm:py-4 ${
        isDark ? "border-white/5" : "border-slate-100"
      }`}>
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <h3 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              <span className="inline sm:hidden">Urutan Tombol</span>
              <span className="hidden sm:inline">Urutan Tombol Cepat</span>
            </h3>
            <p className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-slate-400">
              <span className="inline sm:hidden">Atur posisi tombol di widget.</span>
              <span className="hidden sm:inline">Seret kartu untuk mengubah urutan tampil di widget peserta.</span>
            </p>
          </div>
        </div>

        {/* Pojok kanan: badge tombol saat tidak berubah, atau tombol aksi saat berubah */}
        {berubah ? (
          <div className="flex w-28 sm:w-[132px] shrink-0 flex-col gap-1.5 sm:gap-2 animate-[fadeslide_0.25s_ease-out]">
            <button
              onClick={simpan}
              disabled={menyimpan}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
            >
              <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 group-hover:scale-110" />
              {menyimpan ? "Menyimpan..." : "Simpan Urutan"}
            </button>

            <button
              onClick={kembalikan}
              disabled={menyimpan}
              className={`group inline-flex w-full items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:-rotate-180" />
              Batalkan
            </button>
          </div>
        ) : (
          <span className={`inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider ${
            isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
          }`}>
            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {urutan.length} tombol
          </span>
        )}
      </div>

      {/* Isi kartu */}
      {daftarAwal.length === 0 ? (
        <div className="px-4 py-10 sm:px-5 sm:py-14 text-center">
          <div className={`mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${
            isDark ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-300"
          }`}>
            <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <p className={`mt-3 text-xs sm:text-[13px] font-black ${isDark ? "text-slate-300" : "text-slate-500"}`}>Belum ada tombol cepat</p>
          <p className="mx-auto mt-1 max-w-xs text-[10px] sm:text-[11px] leading-relaxed text-slate-400">
            Centang <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-500"}`}>&quot;Jadikan Quick Action&quot;</span> saat menambah atau mengedit FAQ agar muncul di sini.
          </p>
          <span className={`mt-3 sm:mt-4 inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9.5px] sm:text-[10.5px] font-bold ${
            isDark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-400"
          }`}>
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Maksimal 6 tombol aktif
          </span>
        </div>
      ) : (
        <>
          <ul className="space-y-1.5 sm:space-y-2 p-3 sm:p-5">
            {urutan.map((f, i) => (
              <li
                key={f.id}
                draggable
                onDragStart={() => mulaiSeret(i)}
                onDragEnter={() => lewatiAtas(i)}
                onDragEnd={selesaiSeret}
                onDragOver={(e) => e.preventDefault()}
                className={`group flex cursor-grab items-center gap-2 sm:gap-3 rounded-xl border px-2.5 py-2 sm:px-3.5 sm:py-3 transition-all duration-200 active:cursor-grabbing animate-[fadeslide_0.3s_ease-out] ${
                  indeksAktif === i
                    ? isDark
                      ? "border-[#00A5EC] bg-[#00A5EC]/15 shadow-md"
                      : "border-[#004F9F] bg-[#004F9F]/5 shadow-md"
                    : isDark
                    ? "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-sm"
                    : "border-slate-200 bg-slate-50/60 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                }`}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-slate-300" />
                <span className="flex h-5 w-5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[9px] sm:text-[11px] font-black text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                  {i + 1}
                </span>
                <span className={`flex-1 line-clamp-2 break-words text-[10px] sm:text-[13px] font-bold leading-snug ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>
                  {f.quick_label || f.question}
                </span>
                {!f.is_active && (
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide ${
                    isDark ? "bg-white/10 text-slate-400" : "bg-slate-200 text-slate-500"
                  }`}>
                    Nonaktif
                  </span>
                )}
              </li>
            ))}
          </ul>

          {berubah && (
            <div className={`flex items-center gap-2 border-t px-4 py-2.5 sm:px-5 sm:py-3 animate-[fadeslide_0.25s_ease-out] ${
              isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-100 bg-amber-50/60"
            }`}>
              <span
                className="block shrink-0 bg-amber-500 animate-pulse"
                style={{ width: 7, height: 7, borderRadius: 9999 }}
              />
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-400 sm:text-amber-700">
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