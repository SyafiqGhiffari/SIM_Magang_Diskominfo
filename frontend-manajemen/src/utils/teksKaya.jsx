/**
 * Penyaji teks kaya sederhana (markdown-ringan) untuk jawaban FAQ, chatbot, dan bubble percakapan.
 *
 * Format yang didukung:
 *   **tebal**        -> <strong>
 *   *miring*         -> <em>
 *   _miring_         -> <em>
 *   __garis bawah__  -> <u>
 *   ~~coret~~        -> <del>
 *   `kode`           -> <code>
 *   http(s)://url    -> <a> (tautan otomatis)
 *   - poin / * poin  -> daftar butir (<ul>)
 *   1. poin          -> daftar bernomor (<ol>)
 *
 * Sengaja TIDAK memakai dangerouslySetInnerHTML: keluarannya berupa elemen
 * React biasa sehingga aman dan bebas celah XSS.
 */

// Urutan penting: pola dua karakter / khusus harus dicoba sebelum pola satu karakter.
const POLA_INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|https?:\/\/[^\s]+)/g;

const BARIS_BUTIR = /^\s*[-*\u2022]\s+(.*)$/;
const BARIS_NOMOR = /^\s*\d+[.)]\s+(.*)$/;

/** Memecah teks polos menjadi potongan tersorot bila ada kata pencarian. */
const sorotKata = (teks, kata, kunci) => {
  if (!kata || !kata.trim()) return teks;

  const aman = kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bagian = teks.split(new RegExp(`(${aman})`, "gi"));

  return bagian.map((b, i) =>
    b.toLowerCase() === kata.toLowerCase() ? (
      <mark key={`${kunci}-s${i}`} style={{ background: "#fef3c7", borderRadius: 3, padding: "0 2px" }}>
        {b}
      </mark>
    ) : (
      b
    )
  );
};

/** Mengubah satu baris menjadi array node dengan gaya tebal/miring/garis bawah/coret/kode/link. */
const potongInline = (baris, kata, kunci) => {
  const hasil = [];
  const potongan = baris.split(POLA_INLINE);

  potongan.forEach((p, i) => {
    if (!p) return;
    const k = `${kunci}-i${i}`;

    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      hasil.push(<strong key={k} className="font-bold">{sorotKata(p.slice(2, -2), kata, k)}</strong>);
      return;
    }
    if (p.startsWith("__") && p.endsWith("__") && p.length > 4) {
      hasil.push(<u key={k} className="underline underline-offset-2">{sorotKata(p.slice(2, -2), kata, k)}</u>);
      return;
    }
    if (p.startsWith("~~") && p.endsWith("~~") && p.length > 4) {
      hasil.push(<del key={k} className="line-through opacity-80">{sorotKata(p.slice(2, -2), kata, k)}</del>);
      return;
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      hasil.push(
        <code key={k} className="rounded bg-black/10 dark:bg-white/15 px-1 py-0.5 font-mono text-[0.9em]">
          {sorotKata(p.slice(1, -1), kata, k)}
        </code>
      );
      return;
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      hasil.push(<em key={k} className="italic">{sorotKata(p.slice(1, -1), kata, k)}</em>);
      return;
    }
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) {
      hasil.push(<em key={k} className="italic">{sorotKata(p.slice(1, -1), kata, k)}</em>);
      return;
    }
    if (p.startsWith("http://") || p.startsWith("https://")) {
      hasil.push(
        <a
          key={k}
          href={p}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="underline underline-offset-2 hover:opacity-80 break-all cursor-pointer font-medium"
        >
          {p}
        </a>
      );
      return;
    }

    hasil.push(<span key={k}>{sorotKata(p, kata, k)}</span>);
  });

  return hasil;
};

/**
 * @param teks       isi jawaban mentah dari database
 * @param kata       kata pencarian yang ingin disorot (opsional)
 * @param gaya       style tambahan untuk wadah terluar (opsional)
 * @param className  class Tailwind tambahan untuk wadah (opsional)
 */
const TeksKaya = ({ teks, kata = "", gaya, className = "" }) => {
  if (!teks) return null;

  const baris = String(teks).split(/\r?\n/);
  const blok = [];
  let daftar = null; // { tipe: "ul" | "ol", isi: [] }

  const tutupDaftar = () => {
    if (!daftar) return;
    const Tag = daftar.tipe;
    blok.push(
      <Tag
        key={`d${blok.length}`}
        className={`my-1 pl-4 sm:pl-5 ${daftar.tipe === "ul" ? "list-disc" : "list-decimal"} space-y-0.5`}
        style={{
          listStyleType: daftar.tipe === "ul" ? "disc" : "decimal",
        }}
      >
        {daftar.isi.map((isi, i) => (
          <li key={i} className="my-0.5 leading-relaxed">
            {potongInline(isi, kata, `${blok.length}-${i}`)}
          </li>
        ))}
      </Tag>
    );
    daftar = null;
  };

  baris.forEach((b, idx) => {
    const butir = b.match(BARIS_BUTIR);
    const nomor = b.match(BARIS_NOMOR);

    if (butir) {
      if (daftar?.tipe !== "ul") tutupDaftar();
      daftar = daftar || { tipe: "ul", isi: [] };
      daftar.isi.push(butir[1]);
      return;
    }

    if (nomor) {
      if (daftar?.tipe !== "ol") tutupDaftar();
      daftar = daftar || { tipe: "ol", isi: [] };
      daftar.isi.push(nomor[1]);
      return;
    }

    tutupDaftar();

    if (!b.trim()) {
      blok.push(<div key={`k${idx}`} className="h-1 sm:h-1.5" />);
      return;
    }

    blok.push(
      <p key={`p${idx}`} className="m-0 leading-relaxed">
        {potongInline(b, kata, idx)}
      </p>
    );
  });

  tutupDaftar();

  return (
    <div style={gaya} className={className}>
      {blok}
    </div>
  );
};

/**
 * Penyaji teks kaya versi inline satu baris untuk pratinjau daftar sesi, kutipan, dll.
 */
export const TeksKayaInline = ({ teks, kata = "", className = "" }) => {
  if (!teks) return null;
  const teksSatuBaris = String(teks).replace(/\r?\n+/g, " ").trim();
  return <span className={className}>{potongInline(teksSatuBaris, kata, "inline")}</span>;
};

export default TeksKaya;