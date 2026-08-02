import { useLanding } from "../../context/landingContext";

const ProgramMagangPage = () => {
  const { config } = useLanding();
  const bidangMagangList = (config.bidang || []).map((b) => ({
    title: b.nama,
    desc: b.deskripsi_panjang || b.deskripsi,
    competencies: b.kompetensi || [],
    icon: b.icon || "🏢",
    duration: b.durasi || "Sesuai Kebutuhan Peserta",
  }));

  return (
    <section className="bg-slate-50 min-h-[75vh]">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-dark via-brand-medium to-brand-light px-6 py-16 text-center text-white relative overflow-hidden">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl animate-pulse-slow" />
        <div className="absolute right-10 bottom-5 h-48 w-48 rounded-full bg-brand-light/15 blur-2xl animate-float" />

        <h1 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">Program & Bidang Magang</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-xs text-slate-200">
          Temukan bidang magang yang sesuai dengan latar belakang studi akademis Anda.
        </p>
      </div>

      {/* Grid Program */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {bidangMagangList.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Belum ada bidang magang yang ditampilkan. Silakan cek kembali nanti.
          </p>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {bidangMagangList.map((bidang) => (
            <div
              key={bidang.title}
              className="group rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:shadow-xl hover:border-brand-light/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl group-hover:bg-brand-light/10 group-hover:scale-105 transition-all">
                    {bidang.icon}
                  </span>
                  <span className="rounded-full bg-brand-light/10 px-3 py-1 text-3xs font-extrabold text-brand-medium uppercase tracking-wider">
                    Durasi: {bidang.duration}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-brand-dark group-hover:text-brand-medium transition-colors">
                  {bidang.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {bidang.desc}
                </p>

                {/* Kompetensi list */}
                {bidang.competencies.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kompetensi yang akan Dipelajari:</h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600">
                    {bidang.competencies.map((comp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-600">✓</span>
                        <span className="leading-relaxed">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-16 rounded-2xl border border-brand-light/20 bg-brand-light/5 p-8 md:p-12 text-left">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <span>📅 Ketentuan Umum Durasi Magang</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Durasi magang <strong>sepenuhnya ditentukan oleh peserta magang yang akan magang (fleksibel)</strong>. Anda dapat menentukan sendiri lama periode magang yang diajukan sesuai dengan ketentuan wajib dari sekolah/kampus asal Anda.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Seluruh kegiatan magang dilaksanakan dengan jam kerja dinas yang teratur (Senin s/d Jumat) di bawah pengawasan langsung mentor penanggung jawab masing-masing bidang.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgramMagangPage;