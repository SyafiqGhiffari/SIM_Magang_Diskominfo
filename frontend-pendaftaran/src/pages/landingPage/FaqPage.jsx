import { useState, useEffect, useRef } from "react";
import FaqSection from "../../components/landingPage/FaqSection";
import { getSaranFaq, kirimPertanyaanPublik } from "../../services/faqService";
import TeksKaya from "../../utils/teksKaya";

const FaqPage = () => {
  const [form, setForm] = useState({ nama: "", email: "", pertanyaan: "", website: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tiket, setTiket] = useState("");
  const [saran, setSaran] = useState([]);
  const [saranDibuka, setSaranDibuka] = useState(null);

  // Ref hanya disentuh di event handler & cleanup — tidak pernah saat render
  const debounceRef = useRef(null);   // id timer debounce
  const permintaanRef = useRef(0);    // penjaga balapan (race guard)

  // Bersihkan timer bila pengguna meninggalkan halaman saat debounce berjalan
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Dipanggil dari onChange textarea — bukan dari effect,
  // sehingga tidak memicu cascading render.
  const handlePertanyaanChange = (nilai) => {
    setForm((lama) => ({ ...lama, pertanyaan: nilai }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const teks = nilai.trim();
    if (teks.length < 8) {
      setSaran([]);
      return;
    }

    // Tandai permintaan ini sebagai yang terbaru
    const nomor = permintaanRef.current + 1;
    permintaanRef.current = nomor;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getSaranFaq(teks);
        // Abaikan bila sudah ada permintaan yang lebih baru
        if (permintaanRef.current !== nomor) return;
        setSaran(res.data?.data ?? []);
      } catch {
        if (permintaanRef.current !== nomor) return;
        setSaran([]);
      }
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await kirimPertanyaanPublik({
        nama: form.nama.trim(),
        email: form.email.trim(),
        pertanyaan: form.pertanyaan.trim(),
        website: form.website, // honeypot
      });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      permintaanRef.current += 1; // batalkan hasil permintaan yang masih terbang

      setTiket(res.data?.tiket ?? "");
      setSubmitted(true);
      setSaran([]);
      setForm({ nama: "", email: "", pertanyaan: "", website: "" });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Gagal mengirim pertanyaan. Periksa koneksi Anda lalu coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-50 min-h-[80vh]">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-dark via-brand-medium to-brand-light px-6 py-16 text-center text-white relative overflow-hidden">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl animate-pulse-slow" />
        <div className="absolute right-10 bottom-5 h-48 w-48 rounded-full bg-brand-light/15 blur-2xl animate-float" />
        
        <h1 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">Pertanyaan Umum (FAQ)</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-xs text-slate-200">
          Cari informasi terkait ketentuan program, sertifikat, durasi, jam kerja, dan sistem magang.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12 md:items-start">
          {/* Left side: FAQ Accordion */}
          <div className="md:col-span-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 pt-6">
              <h2 className="text-lg font-bold text-brand-dark">
                Daftar Pertanyaan
              </h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">
                Gunakan pencarian di bawah untuk menemukan jawaban lebih cepat.
              </p>
            </div>
            <FaqSection embedded pakaiCari />
          </div>

          {/* Right side: Submit Question Form */}
          <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-left">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <span>💬</span> Hubungi Reviewer Kami
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Punya pertanyaan spesifik yang belum terjawab di atas? Kirimkan pesan Anda langsung di bawah ini.
            </p>
            <div className="h-0.5 bg-slate-100 my-4" />

            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <span className="text-3xl">✉️</span>
                <h3 className="mt-3 text-sm font-bold text-emerald-800">Pertanyaan Terkirim!</h3>
                <p className="mt-2 text-xs leading-relaxed text-emerald-700">
                  Terima kasih telah bertanya. Pertanyaan Anda sudah masuk ke admin
                  Diskominfo dan balasannya akan dikirim ke email Anda.
                </p>
                {tiket && tiket !== "-" && (
                  <p className="mt-3 inline-block rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700">
                    Nomor tiket: {tiket}
                  </p>
                )}
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-3xs font-extrabold text-white uppercase tracking-wider hover:bg-emerald-700 transition-colors"
                >
                  Kirim Pertanyaan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-medium focus:ring-2 focus:ring-brand-light/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Alamat Email</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-medium focus:ring-2 focus:ring-brand-light/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pertanyaan Anda</label>
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    placeholder="Tuliskan detail pertanyaan atau keluhan Anda..."
                    value={form.pertanyaan}
                    onChange={(e) => handlePertanyaanChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-medium focus:ring-2 focus:ring-brand-light/20 focus:outline-none"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {form.pertanyaan.length}/1000 karakter
                  </p>
                </div>

                {/* Honeypot anti-spam: disembunyikan dari pengguna asli */}
                <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                {/* Saran jawaban — sering menyelesaikan pertanyaan tanpa perlu admin */}
                {saran.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="text-xs font-bold text-amber-800">
                      💡 Mungkin pertanyaan Anda sudah terjawab di sini
                    </p>
                    <div className="mt-3 space-y-2">
                      {saran.map((s) => (
                        <div key={s.id} className="rounded-lg border border-amber-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setSaranDibuka((now) => (now === s.id ? null : s.id))}
                            className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-xs font-bold text-brand-dark"
                          >
                            <span>{s.question}</span>
                            <span className="shrink-0 text-slate-400">
                              {saranDibuka === s.id ? "▴" : "▾"}
                            </span>
                          </button>
                          {saranDibuka === s.id && (
                            <div className="border-t border-amber-100 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                              <TeksKaya teks={s.answer} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-amber-700">
                      Belum terjawab? Lanjutkan mengirim pertanyaan di bawah.
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold text-red-600">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-brand-dark py-3.5 text-xs font-bold text-white shadow-md shadow-brand-dark/10 transition-all duration-300 hover:bg-brand-hover hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? "Mengirim..." : "Kirim Pertanyaan"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqPage;