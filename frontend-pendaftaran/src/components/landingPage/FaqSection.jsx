import { useState, useEffect, useMemo, useRef } from "react";
import { getFaqPublik } from "../../services/faqService";
import TeksKaya from "../../utils/teksKaya";

// Cadangan bila API gagal, agar landing page tidak pernah tampil kosong
const FAQ_CADANGAN = [
  {
    id: -1,
    category: "Umum",
    question: "Apakah program magang ini berbayar?",
    answer:
      "Tidak. Seluruh proses pendaftaran dan program magang di Diskominfo Ponorogo tidak dipungut biaya apapun (Gratis).",
  },
  {
    id: -2,
    category: "Umum",
    question: "Dokumen wajib apa saja yang harus diunggah?",
    answer:
      "Dokumen utama yang wajib adalah Surat Pengantar Permohonan Magang resmi dari sekolah atau kampus dalam format PDF (maksimal 2MB).",
  },
];

// Menyorot kata pencarian di dalam teks
const Sorot = ({ teks, kata }) => {
  if (!kata.trim()) return <>{teks}</>;
  const aman = kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bagian = teks.split(new RegExp(`(${aman})`, "gi"));
  return (
    <>
      {bagian.map((b, i) =>
        b.toLowerCase() === kata.toLowerCase() ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 text-brand-dark">
            {b}
          </mark>
        ) : (
          <span key={i}>{b}</span>
        )
      )}
    </>
  );
};

// Satu item accordion — tinggi diukur dari konten, tidak lagi dipatok 200px
const FaqItem = ({ item, isOpen, onToggle, kataCari }) => {
  const panelRef = useRef(null);
  const [tinggi, setTinggi] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    // Pola yang direkomendasikan React: berlangganan ke sistem eksternal,
    // setState hanya dipanggil di dalam callback — bukan di badan effect.
    const ro = new ResizeObserver(() => {
      setTinggi(el.scrollHeight);
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [item.answer]);

  const panelId = `faq-panel-${item.id}`;
  const tombolId = `faq-tombol-${item.id}`;

  return (
    <div
      id={`faq-${item.id}`}
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        isOpen
          ? "border-brand-light/50 shadow-lg shadow-brand-dark/5"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <button
        id={tombolId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-bold text-brand-dark"
      >
        <span className="pr-4">
          <Sorot teks={item.question} kata={kataCari} />
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 ${
            isOpen ? "rotate-180 bg-brand-light/15 text-brand-medium" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <div
        role="region"
        aria-labelledby={tombolId}
        id={panelId}
        style={{ maxHeight: isOpen ? tinggi : 0 }}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 border-t border-slate-50" : "opacity-0"
        }`}
      >
        <div ref={panelRef}>
          <div className="bg-slate-50/50 px-6 py-5 text-sm leading-relaxed text-slate-500">
            <TeksKaya teks={item.answer} kata={kataCari} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Membaca #faq-12 dari URL saat komponen pertama kali dibuat
const idDariHash = () => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith("#faq-")) return null;
  const id = Number(hash.replace("#faq-", ""));
  return Number.isNaN(id) ? null : id;
};

const FaqSection = ({ embedded = false, batas = 0, pakaiCari = false }) => {
  const [semuaFaq, setSemuaFaq] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [cari, setCari] = useState("");
  // Lazy initializer: dihitung sekali saat mount, tanpa effect
  const [openId, setOpenId] = useState(idDariHash);
  const [memuat, setMemuat] = useState(true);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await getFaqPublik();
        if (batal) return;
        const data = res.data?.data ?? [];
        setSemuaFaq(data.length ? data : FAQ_CADANGAN);
        setKategoriList(res.data?.kategori ?? []);
        setGagal(false);
      } catch {
        if (batal) return;
        setSemuaFaq(FAQ_CADANGAN);
        setGagal(true);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  const faqTampil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    let hasil = semuaFaq;

    if (kategoriAktif !== "Semua") {
      hasil = hasil.filter((f) => f.category === kategoriAktif);
    }
    if (kata) {
      hasil = hasil.filter(
        (f) =>
          f.question.toLowerCase().includes(kata) ||
          f.answer.toLowerCase().includes(kata)
      );
    }
    return batas > 0 ? hasil.slice(0, batas) : hasil;
  }, [semuaFaq, kategoriAktif, cari, batas]);

  // Effect ini HANYA menyentuh DOM (sistem eksternal), tidak memanggil setState
  useEffect(() => {
    if (openId == null || !semuaFaq.length) return;
    if (!window.location.hash.startsWith("#faq-")) return;

    const t = setTimeout(() => {
      document
        .getElementById(`faq-${openId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semuaFaq]);

  const wrapperClass = embedded
    ? "px-6 py-8"
    : "relative overflow-hidden bg-slate-50 px-6 py-20";
  const innerClass = embedded ? "" : "mx-auto max-w-3xl text-center";

  return (
    <section className={wrapperClass}>
      <div className={innerClass}>
        {!embedded && (
          <>
            <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
              Pertanyaan Umum
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
              Cari tahu jawaban atas berbagai pertanyaan mendasar terkait
              pendaftaran magang di bawah ini.
            </p>
          </>
        )}

        {pakaiCari && (
          <div className={embedded ? "mb-6" : "mx-auto mt-10 max-w-xl"}>
            <div className="relative">
              <input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari pertanyaan, misal: sertifikat, surat pengantar..."
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand-medium focus:ring-2 focus:ring-brand-light/20"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>

            {kategoriList.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {["Semua", ...kategoriList].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKategoriAktif(k)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      kategoriAktif === k
                        ? "bg-brand-dark text-white shadow-sm"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`${embedded ? "" : "mt-16"} space-y-4 text-left`}>
          {memuat ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
              />
            ))
          ) : faqTampil.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-bold text-slate-600">
                Tidak ada pertanyaan yang cocok
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Coba kata kunci lain, atau kirimkan pertanyaan Anda lewat form
                di samping.
              </p>
            </div>
          ) : (
            faqTampil.map((item) => (
              <FaqItem
                key={item.id}
                item={item}
                kataCari={cari}
                isOpen={openId === item.id}
                onToggle={() =>
                  setOpenId((now) => (now === item.id ? null : item.id))
                }
              />
            ))
          )}
        </div>

        {gagal && !memuat && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Menampilkan informasi dasar. Daftar lengkap sedang tidak dapat
            dimuat.
          </p>
        )}
      </div>
    </section>
  );
};

export default FaqSection;