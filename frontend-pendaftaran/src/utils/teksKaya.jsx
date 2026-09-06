/**
 * Penyaji teks kaya sederhana (markdown-ringan) untuk jawaban FAQ/chatbot dan pesan percakapan.
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
      hasil.push(<strong key={k} style={{ fontWeight: 700 }}>{sorotKata(p.slice(2, -2), kata, k)}</strong>);
      return;
    }
    if (p.startsWith("__") && p.endsWith("__") && p.length > 4) {
      hasil.push(<u key={k} style={{ textUnderlineOffset: 2 }}>{sorotKata(p.slice(2, -2), kata, k)}</u>);
      return;
    }
    if (p.startsWith("~~") && p.endsWith("~~") && p.length > 4) {
      hasil.push(<del key={k} style={{ textDecoration: "line-through", opacity: 0.8 }}>{sorotKata(p.slice(2, -2), kata, k)}</del>);
      return;
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      hasil.push(
        <code key={k} style={{ background: "rgba(0,0,0,0.08)", borderRadius: 4, padding: "1px 4px", fontFamily: "monospace", fontSize: "0.9em" }}>
          {sorotKata(p.slice(1, -1), kata, k)}
        </code>
      );
      return;
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      hasil.push(<em key={k} style={{ fontStyle: "italic" }}>{sorotKata(p.slice(1, -1), kata, k)}</em>);
      return;
    }
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) {
      hasil.push(<em key={k} style={{ fontStyle: "italic" }}>{sorotKata(p.slice(1, -1), kata, k)}</em>);
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
          style={{ textDecoration: "underline", wordBreak: "break-all", fontWeight: 500 }}
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
 * @param teks   isi jawaban mentah dari database
 * @param kata   kata pencarian yang ingin disorot (opsional)
 * @param gaya   style tambahan untuk wadah terluar (opsional)
 */
const TeksKaya = ({ teks, kata = "", gaya }) => {
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
        style={{
          margin: "4px 0",
          paddingLeft: 18,
          listStyleType: daftar.tipe === "ul" ? "disc" : "decimal",
        }}
      >
        {daftar.isi.map((isi, i) => (
          <li key={i} style={{ margin: "2px 0", lineHeight: 1.4 }}>
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
      blok.push(<div key={`k${idx}`} style={{ height: 6 }} />);
      return;
    }

    blok.push(
      <p key={`p${idx}`} style={{ margin: 0, lineHeight: 1.4 }}>
        {potongInline(b, kata, idx)}
      </p>
    );
  });

  tutupDaftar();

  return <div style={gaya}>{blok}</div>;
};

export default TeksKaya;