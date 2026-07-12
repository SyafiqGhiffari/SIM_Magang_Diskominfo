import { useState } from "react";
import FaqSection from "../../components/landingPage/FaqSection";

const FaqPage = () => {
  const [form, setForm] = useState({ nama: "", email: "", pertanyaan: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setForm({ nama: "", email: "", pertanyaan: "" });
    }, 800);
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
          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <FaqSection />
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
              <div className="rounded-xl bg-emerald-50 border border-emerald-150 p-6 text-center animate-float">
                <span className="text-3xl">✉️</span>
                <h3 className="mt-3 text-sm font-bold text-emerald-800">Pertanyaan Terkirim!</h3>
                <p className="mt-2 text-xs text-emerald-700 leading-relaxed">
                  Terima kasih telah bertanya. Kami telah menerima pesan Anda dan akan mengirimkan balasan ke email Anda secepatnya.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-3xs font-extrabold text-white uppercase tracking-wider hover:bg-emerald-700 transition-colors"
                >
                  Kirim Pertanyaan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Tuliskan detail pertanyaan atau keluhan Anda..."
                    value={form.pertanyaan}
                    onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-medium focus:ring-2 focus:ring-brand-light/20 focus:outline-none"
                  />
                </div>

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