import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
  Eye,
  PenLine,
} from "lucide-react";
import TeksKaya from "../../../../utils/teksKaya";

const TOMBOL_INLINE = [
  { kunci: "bold", ikon: Bold, tanda: "**", judul: "Tebal (Ctrl+B)", contoh: "teks tebal" },
  { kunci: "italic", ikon: Italic, tanda: "*", judul: "Miring (Ctrl+I)", contoh: "teks miring" },
  { kunci: "underline", ikon: Underline, tanda: "__", judul: "Garis bawah (Ctrl+U)", contoh: "garis bawah" },
];

// Tombol toolbar memakai onMouseDown+preventDefault agar fokus tetap di textarea.
const TombolFormat = ({ ikon: Ikon, judul, onKlik, kelas }) => (
  <button
    type="button"
    title={judul}
    aria-label={judul}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onKlik}
    className={kelas}
  >
    <Ikon className="h-3.5 w-3.5" strokeWidth={2.6} />
  </button>
);

/**
 * Kolom teks dengan toolbar format ringkas.
 *
 * Nilainya tetap string biasa (markdown-ringan: **tebal**, *miring*,
 * __garis bawah__, "- " butir, "1. " bernomor) sehingga kolom database dan
 * seluruh endpoint backend tidak perlu diubah. Penyajian di sisi publik
 * memakai <TeksKaya /> yang menghasilkan elemen React biasa (bebas XSS).
 */
const EditorTeksKaya = ({
  nilai,
  onUbah,
  placeholder,
  rows = 3,
  maxLength,
  isDark,
}) => {
  const areaRef = useRef(null);
  const [fokus, setFokus] = useState(false);
  const [pratinjau, setPratinjau] = useState(false);

  const isi = nilai || "";

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
    const pilih = isi.slice(a, b);
    const n = tanda.length;

    if (pilih.startsWith(tanda) && pilih.endsWith(tanda) && pilih.length > n * 2) {
      const bersih = pilih.slice(n, -n);
      terapkan(isi.slice(0, a) + bersih + isi.slice(b), a, a + bersih.length);
      return;
    }

    const teks = pilih || contoh;
    terapkan(isi.slice(0, a) + tanda + teks + tanda + isi.slice(b), a + n, a + n + teks.length);
  };

  /** Memberi awalan butir atau nomor pada setiap baris yang tersorot. */
  const awaliBaris = (jenis) => {
    const el = areaRef.current;
    if (!el) return;

    const { selectionStart: a, selectionEnd: b } = el;
    const mulai = isi.lastIndexOf("\n", a - 1) + 1;
    const akhirBaris = isi.indexOf("\n", b);
    const selesai = akhirBaris === -1 ? isi.length : akhirBaris;

    const baris = isi.slice(mulai, selesai).split("\n");
    const sudah = baris.every((x) =>
      jenis === "ul" ? /^\s*-\s+/.test(x) : /^\s*\d+[.)]\s+/.test(x)
    );

    const hasilBaris = baris.map((x, i) => {
      const polos = x.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s+/, "");
      if (sudah) return polos;
      return jenis === "ul" ? `- ${polos}` : `${i + 1}. ${polos}`;
    });

    const gabung = hasilBaris.join("\n");
    terapkan(isi.slice(0, mulai) + gabung + isi.slice(selesai), mulai, mulai + gabung.length);
  };

  const hapusFormat = () => {
    const bersih = isi
      .replace(/\*\*([^*\n]+)\*\*/g, "$1")
      .replace(/__([^_\n]+)__/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/^\s*(?:[-*\u2022]|\d+[.)])\s+/gm, "");
    terapkan(bersih, bersih.length, bersih.length);
  };

  const handleKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    const cocok = { b: TOMBOL_INLINE[0], i: TOMBOL_INLINE[1], u: TOMBOL_INLINE[2] }[k];
    if (!cocok) return;
    e.preventDefault();
    bungkus(cocok.tanda, cocok.contoh);
  };

  const kelasTombol = `flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
    isDark
      ? "text-slate-400 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
      : "text-slate-400 hover:bg-[#00A5EC]/10 hover:text-[#004F9F]"
  }`;

  const pemisah = `mx-1 h-4 w-px ${isDark ? "bg-white/10" : "bg-slate-200"}`;

  return (
    <div
      className={`group mt-1.5 overflow-hidden rounded-xl border transition-all duration-200 ${
        fokus
          ? isDark
            ? "border-[#00A5EC] bg-white/[0.07] ring-4 ring-[#00A5EC]/20"
            : "border-[#004F9F] bg-white ring-4 ring-[#00A5EC]/15"
          : isDark
          ? "border-white/10 bg-white/5 hover:border-white/20"
          : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
      }`}
    >
      {/* ── Toolbar ringkas: meredup saat kolom tidak dipakai ── */}
      <div
        className={`flex items-center gap-0.5 border-b px-2 py-1.5 transition-opacity duration-200 ${
          fokus || pratinjau ? "opacity-100" : "opacity-55 group-hover:opacity-100"
        } ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200/80 bg-slate-50/80"}`}
      >
        {TOMBOL_INLINE.map((t) => (
          <TombolFormat
            key={t.kunci}
            ikon={t.ikon}
            judul={t.judul}
            kelas={kelasTombol}
            onKlik={() => bungkus(t.tanda, t.contoh)}
          />
        ))}

        <span className={pemisah} />

        <TombolFormat ikon={List} judul="Daftar butir" kelas={kelasTombol} onKlik={() => awaliBaris("ul")} />
        <TombolFormat ikon={ListOrdered} judul="Daftar bernomor" kelas={kelasTombol} onKlik={() => awaliBaris("ol")} />

        <span className={pemisah} />

        <TombolFormat ikon={Eraser} judul="Hapus semua format" kelas={kelasTombol} onKlik={hapusFormat} />

        <span className="ml-auto" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPratinjau((v) => !v)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wide transition-all duration-200 active:scale-95 ${
            pratinjau
              ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:bg-white/10 hover:text-slate-100"
              : "text-slate-400 hover:bg-white hover:text-[#0B1442]"
          }`}
        >
          {pratinjau ? (
            <PenLine className="h-3 w-3" strokeWidth={2.8} />
          ) : (
            <Eye className="h-3 w-3" strokeWidth={2.8} />
          )}
          {pratinjau ? "Tulis" : "Pratinjau"}
        </button>
      </div>

      {/* ── Area tulis / pratinjau ── */}
      {pratinjau ? (
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
          style={{ minHeight: rows * 22.5 }}
        >
          {isi.trim() ? (
            <TeksKaya teks={isi} />
          ) : (
            <span className="text-slate-400">Belum ada teks untuk ditampilkan.</span>
          )}
        </div>
      ) : (
        <textarea
          ref={areaRef}
          rows={rows}
          maxLength={maxLength}
          value={isi}
          placeholder={placeholder}
          onChange={(e) => onUbah(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFokus(true)}
          onBlur={() => setFokus(false)}
          className={`w-full resize-y border-0 bg-transparent px-4 py-3 text-sm font-medium leading-relaxed outline-none ${
            isDark
              ? "text-slate-100 placeholder-slate-500"
              : "text-slate-700 placeholder-slate-300"
          }`}
        />
      )}
    </div>
  );
};

export default EditorTeksKaya;