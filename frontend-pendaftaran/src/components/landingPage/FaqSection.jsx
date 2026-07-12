import { useState } from "react";

const faqs = [
  {
    q: "Berapa lama durasi program magang?",
    a: "Durasi magang bervariasi antara 1 hingga 6 bulan, menyesuaikan dengan kebutuhan kurikulum atau pengantar resmi dari institusi pendidikan Anda.",
  },
  {
    q: "Apakah program magang ini berbayar?",
    a: "Tidak. Seluruh proses pendaftaran dan program magang di Diskominfo Ponorogo tidak dipungut biaya apapun (Gratis).",
  },
  {
    q: "Apakah peserta akan mendapatkan sertifikat?",
    a: "Ya. Setiap peserta yang telah menyelesaikan program magang secara penuh dan memenuhi kriteria penilaian akan mendapatkan Sertifikat Magang Resmi yang ditandatangani oleh Kepala Dinas.",
  },
  {
    q: "Bagaimana dengan jam kerja magang?",
    a: "Jam kerja operasional magang mengikuti jam kerja kantor kedinasan, yaitu Senin s/d Jumat pukul 07:30 - 15:30 WIB.",
  },
  {
    q: "Bagaimana sistem kerja magang (WFH/WFO/Hybrid)?",
    a: "Sistem kerja utama adalah Work From Office (WFO). Namun, sistem Hybrid atau WFH dapat diberlakukan berdasarkan diskresi pembimbing dan kebutuhan proyek divisi penempatan.",
  },
  {
    q: "Dokumen wajib apa saja yang harus diunggah?",
    a: "Dokumen utama yang wajib adalah Surat Pengantar Permohonan Magang resmi dari sekolah atau kampus dalam format file PDF (maksimal 2MB).",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex((current) => (current === idx ? null : idx));
  };

  return (
    <section className="bg-slate-50 px-6 py-20 relative overflow-hidden">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-md bg-brand-light/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-medium">
          FAQ
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">
          Pertanyaan Umum
        </h2>
        <p className="mt-4 max-w-md mx-auto text-sm text-slate-500">
          Cari tahu jawaban atas berbagai pertanyaan mendasar terkait pendaftaran magang di bawah ini.
        </p>

        <div className="mt-16 space-y-4 text-left">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 bg-white ${
                  isOpen
                    ? "border-brand-light/50 shadow-lg shadow-brand-dark/5"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-bold text-brand-dark"
                  aria-expanded={isOpen}
                  onClick={() => toggle(idx)}
                >
                  <span className="pr-4">{item.q}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 ${
                      isOpen ? "rotate-180 bg-brand-light/15 text-brand-medium" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[200px] opacity-100 border-t border-slate-50" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <p className="px-6 py-5 text-sm leading-relaxed text-slate-500 bg-slate-50/50">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;