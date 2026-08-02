import { useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Eye, PenLine, Eraser } from "lucide-react";
import TeksKaya from "../../../../utils/teksKaya";

// Tinggi satu baris teks (text-sm + leading-relaxed = 14px x 1.625).
// Dipakai agar tinggi area pratinjau persis sama dengan textarea.
const TINGGI_BARIS = 22.50;

const TOMBOL_INLINE = [
  { kunci: "bold", ikon: Bold, tanda: "**", judul: "Tebal (Ctrl+B)", contoh: "teks tebal" },
  { kunci: "italic", ikon: Italic, tanda: "*", judul: "Miring (Ctrl+I)", contoh: "teks miring" },
  { kunci: "underline", ikon: Underline, tanda: "__", judul: "Garis bawah (Ctrl+U)", contoh: "garis bawah" },
];

/**
 * Editor jawaban chatbot dengan format ringan.
 * Nilainya tetap string biasa (markdown-ringan), bukan HTML, sehingga kolom
 * `answer` di database dan seluruh endpoint backend tidak perlu diubah.
 */
const EditorJawaban = ({ nilai, onUbah, placeholder, rows = 6 }) => {
  const areaRef = useRef(null);
  const [pratinjau, setPratinjau] = useState(false);

  // Menulis ulang isi textarea sekaligus mengembalikan posisi kursor.
  const terapkan = (teksBaru, awal, akhir) => {
    onUbah(teksBaru);
    requestAnimationFrame(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(awal, akhir);
    });
  };

  /** Membungkus teks terpilih dengan penanda, atau membuka bungkusnya bila sudah ada. */
  const bungkus = (tanda, contoh) => {
    const el = areaRef.current;
    if (!el) return;

    const { selectionStart: a, selectionEnd: b } = el;
    const isi = nilai || "";
    const pilih = isi.slice(a, b);
    const n = tanda.length;

    if (pilih.startsWith(tanda) && pilih.endsWith(tanda) && pilih.length > n * 2) {
      const bersih = pilih.slice(n, -n);
      terapkan(isi.slice(0, a) + bersih + isi.slice(b), a, a + bersih.length);
      return;
    }

    const teks = pilih || contoh;
    const hasil = isi.slice(0, a) + tanda + teks + tanda + isi.slice(b);
    terapkan(hasil, a + n, a + n + teks.length);
  };

  /** Memberi awalan butir atau nomor pada setiap baris yang tersorot. */
  const awaliBaris = (jenis) => {
    const el = areaRef.current;
    if (!el) return;

    const isi = nilai || "";
    const { selectionStart: a, selectionEnd: b } = el;

    const mulai = isi.lastIndexOf("\n", a - 1) + 1;
    const selesaiRaw = isi.indexOf("\n", b);
    const selesai = selesaiRaw === -1 ? isi.length : selesaiRaw;

    const blok = isi.slice(mulai, selesai) || (jenis === "ul" ? "Poin pertama" : "Langkah pertama");
    const baris = blok.split("\n");

    const polaButir = /^\s*[-\u2022]\s+/;
    const polaNomor = /^\s*\d+[.)]\s+/;
    const pola = jenis === "ul" ? polaButir : polaNomor;
    const semuaSudah = baris.every((x) => pola.test(x));

    const hasilBaris = baris.map((x, i) => {
      const polos = x.replace(polaButir, "").replace(polaNomor, "");
      if (semuaSudah) return polos;
      return jenis === "ul" ? `- ${polos}` : `${i + 1}. ${polos}`;
    });

    const blokBaru = hasilBaris.join("\n");
    terapkan(isi.slice(0, mulai) + blokBaru + isi.slice(selesai), mulai, mulai + blokBaru.length);
  };

  /** Membuang seluruh penanda format dari teks. */
  const hapusFormat = () => {
    const bersih = (nilai || "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^\s*[-\u2022]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "");
    terapkan(bersih, bersih.length, bersih.length);
  };

  const handleKeyDown = (e) => {
    // Pintasan papan ketik ala pengolah kata
    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === "b") { e.preventDefault(); bungkus("**", "teks tebal"); return; }
      if (k === "i") { e.preventDefault(); bungkus("*", "teks miring"); return; }
      if (k === "u") { e.preventDefault(); bungkus("__", "garis bawah"); return; }
    }

    // Enter di dalam daftar -> lanjutkan penanda secara otomatis
    if (e.key === "Enter" && !e.shiftKey) {
      const el = areaRef.current;
      const isi = nilai || "";
      const a = el.selectionStart;
      const mulai = isi.lastIndexOf("\n", a - 1) + 1;
      const barisIni = isi.slice(mulai, a);

      const butir = barisIni.match(/^(\s*)([-\u2022])\s+(.*)$/);
      const nomor = barisIni.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
      if (!butir && !nomor) return;

      e.preventDefault();

      // Baris kosong -> keluar dari daftar
      const isiBaris = (butir ? butir[3] : nomor[3]).trim();
      if (!isiBaris) {
        const hasil = isi.slice(0, mulai) + isi.slice(a);
        terapkan(hasil, mulai, mulai);
        return;
      }

      const awalan = butir ? `${butir[1]}- ` : `${nomor[1]}${Number(nomor[2]) + 1}. `;
      const hasil = `${isi.slice(0, a)}\n${awalan}${isi.slice(a)}`;
      const posisi = a + 1 + awalan.length;
      terapkan(hasil, posisi, posisi);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 transition-all duration-200 focus-within:border-[#004F9F] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00A5EC]/15 hover:border-slate-300">
      {/* Bilah alat */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white/70 px-2 py-1.5">
        {TOMBOL_INLINE.map(({ kunci, ikon: Ikon, tanda, judul, contoh }) => (
          <button
            key={kunci}
            type="button"
            title={judul}
            disabled={pratinjau}
            onClick={() => bungkus(tanda, contoh)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
          >
            <Ikon className="h-3.5 w-3.5" />
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-slate-200" />

        <button
          type="button"
          title="Daftar butir"
          disabled={pratinjau}
          onClick={() => awaliBaris("ul")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Daftar bernomor"
          disabled={pratinjau}
          onClick={() => awaliBaris("ol")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-[#004F9F] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        <button
          type="button"
          title="Hapus semua format"
          disabled={pratinjau}
          onClick={hapusFormat}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-red-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
        >
          <Eraser className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setPratinjau((p) => !p)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
            pratinjau
              ? "bg-[#0B1442] text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 hover:text-[#004F9F]"
          }`}
        >
          {pratinjau ? <PenLine className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {pratinjau ? "Sunting" : "Pratinjau"}
        </button>
      </div>

      {/* Area tulis / pratinjau - tinggi dikunci di wadah agar kedua mode identik */}
      <div style={{ height: TINGGI_BARIS * rows + 24 }}>
        {pratinjau ? (
          <div
            className="h-full overflow-y-auto overscroll-contain px-4 py-3 text-sm font-medium leading-relaxed text-slate-700"
            style={{ scrollbarWidth: "thin" }}
          >
            {nilai?.trim() ? (
              <TeksKaya teks={nilai} />
            ) : (
              <p className="text-sm italic text-slate-400">Belum ada isi jawaban untuk ditampilkan.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={areaRef}
            value={nilai}
            onChange={(e) => onUbah(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required
            className="block h-full w-full resize-none bg-transparent px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none"
            style={{ scrollbarWidth: "thin" }}
          />
        )}
      </div>

      {/* Keterangan bawah */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white/70 px-3 py-1.5">
        <p className="text-[10px] text-slate-400">
          <span className="font-bold text-slate-500">**tebal**</span>
          <span className="mx-1.5">·</span>
          <span className="font-bold text-slate-500">*miring*</span>
          <span className="mx-1.5">·</span>
          <span className="font-bold text-slate-500">__garis bawah__</span>
          <span className="mx-1.5">·</span>
          <span className="font-bold text-slate-500">- poin</span>
          <span className="mx-1.5">·</span>
          <span className="font-bold text-slate-500">1. nomor</span>
        </p>
        <p className="text-[10px] font-bold text-slate-400">{(nilai || "").length} karakter</p>
      </div>
    </div>
  );
};

export default EditorJawaban;