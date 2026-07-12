const CapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const SchoolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c-4.243 0-7.686 2.783-7.686 6.219 0 .278.225.503.503.503h14.366a.503.503 0 0 0 .503-.503c0-3.436-3.443-6.219-7.686-6.219Zm0 0a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const RadioDot = ({ active, dk }) => (
  <span
    className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
      active
        ? "border-[#004F9F] bg-[#004F9F]"
        : dk
        ? "border-white/20 bg-transparent"
        : "border-slate-300 bg-transparent"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full bg-white transition-transform duration-300 ${
        active ? "scale-100" : "scale-0"
      }`}
    />
  </span>
);

const StepPilihKategori = ({ dk, surface, txt, sub, kategori, setKategori, onNext }) => {
  const opsi = [
    {
      value: "mahasiswa",
      label: "Mahasiswa",
      desc: "Sedang menempuh pendidikan di perguruan tinggi (D3/D4/S1).",
      icon: <CapIcon />,
      tags: ["Kampus", "Semester", "Prodi"],
    },
    {
      value: "siswa",
      label: "Siswa",
      desc: "Sedang menempuh pendidikan di SMA/SMK/MA sederajat.",
      icon: <SchoolIcon />,
      tags: ["Sekolah", "Kelas", "Jurusan"],
    },
  ];

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
      {/* Dekorasi blur pojok, konsisten dengan step lain */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#004F9F]/5 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className={`text-sm font-extrabold ${txt}`}>Anda Mendaftar Sebagai?</h3>
          <p className={`text-xs mt-1 ${sub}`}>Pilih kategori sesuai status pendidikan Anda saat ini.</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full ${
          dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC] ring-1 ring-[#00A5EC]/20" : "bg-gradient-to-br from-[#00A5EC]/10 to-[#004F9F]/10 text-[#004F9F] ring-1 ring-[#004F9F]/10"
        }`}>
          <SparkleIcon />
          Mulai
        </span>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 mb-6">
        {opsi.map((o) => {
          const isSelected = kategori === o.value;
          return (
            <div
              key={o.value}
              onClick={() => setKategori(o.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setKategori(o.value); }}
              className={`group relative overflow-hidden text-left p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "border-[#004F9F] shadow-lg shadow-[#004F9F]/15 -translate-y-1"
                  : dk
                  ? "border-white/10 bg-white/[0.02] hover:border-white/25 hover:-translate-y-0.5"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#004F9F]/10 via-[#00A5EC]/5 to-transparent" />
              )}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                  isSelected ? "bg-gradient-to-b from-[#004F9F] to-[#00A5EC]" : "bg-transparent"
                }`}
              />
              {isSelected && (
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#00A5EC]/10 blur-2xl" />
              )}

              <div className="relative flex items-start justify-between gap-2 mb-3.5">
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    isSelected
                      ? "bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg shadow-[#004F9F]/30"
                      : dk
                      ? "bg-white/10 text-slate-300"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {o.icon}
                </div>
                <RadioDot active={isSelected} dk={dk} />
              </div>

              <h4 className={`font-extrabold text-base transition-colors ${isSelected ? (dk ? "text-[#00A5EC]" : "text-[#004F9F]") : txt}`}>
                {o.label}
              </h4>
              <p className={`text-[12px] mt-1.5 leading-relaxed ${sub}`}>{o.desc}</p>

              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className={`text-[9.5px] font-bold uppercase tracking-wide px-2 py-1 rounded-full transition-colors ${
                      isSelected
                        ? dk
                          ? "bg-[#00A5EC]/15 text-[#00A5EC]"
                          : "bg-[#004F9F]/10 text-[#004F9F]"
                        : dk
                        ? "bg-white/5 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!kategori}
        className="group relative w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:brightness-100 cursor-pointer"
      >
        Lanjutkan
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
};

export default StepPilihKategori;