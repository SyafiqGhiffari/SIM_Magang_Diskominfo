const bidangIcons = {
  "Sekretariat": (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  "Pengelolaan Informasi & Komunikasi Publik": (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
    </svg>
  ),
  "Aplikasi & Informatika": (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  ),
  "Statistik & Persandian": (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
};

// Beberapa ikon fallback generik — dipilih berkonsistensi berdasarkan nama bidang
// (hash sederhana), supaya bidang baru yang dibuat admin tetap tampil dengan
// ikon berbeda-beda satu sama lain, bukan seragam semua.
const fallbackIconPaths = [
  "M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-4.25M8.25 8.25v-1.5a3.375 3.375 0 1 1 6.75 0v1.5m-8.625 0h10.5a1.125 1.125 0 0 1 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 0 1-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125Z",
  "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437 5.877-5.877",
  "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z",
  "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75V18a2.25 2.25 0 0 1 2.25-2.25h9.75m-13.5 0v-9m0 0h13.5m-13.5 0a1.125 1.125 0 0 1 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v9m-1.125 0h1.5",
];

const DefaultBidangIcon = ({ nama }) => {
  let hash = 0;
  const str = nama || "";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Paksa jadi integer 32-bit di setiap langkah — mencegah hash membesar
    // tanpa batas dan kehilangan presisi untuk nama bidang yang panjang, yang
    // sebelumnya menyebabkan banyak nama berbeda jatuh ke ikon fallback yang sama.
  }
  const path = fallbackIconPaths[Math.abs(hash) % fallbackIconPaths.length];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
};

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);
const CalendarEndIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const CapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);
const SchoolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const SectionLabel = ({ sub, children }) => (
  <h4 className={`text-[10px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${sub}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC]" />
    {children}
  </h4>
);

const FieldWithIcon = ({ dk, icon, label, wajib, children }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 mb-1.5">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${dk ? "bg-white/5 text-[#00A5EC]" : "bg-[#00A5EC]/10 text-[#004F9F]"}`}>
        {icon}
      </span>
      {label} {wajib && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const CheckBadge = () => (
  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#004F9F] text-white shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  </span>
);

const StepDataMagang = ({ dk, surface, txt, sub, inputCls, bidangOptions, bidangLoading, kategori, form, setForm, onNext, onBack }) => {
  const isValid = form.posisi_bidang && form.tanggal_mulai && form.tanggal_selesai;
  const isMahasiswa = kategori === "mahasiswa";

  const durasiHari = (() => {
    if (!form.tanggal_mulai || !form.tanggal_selesai) return null;
    const start = new Date(form.tanggal_mulai);
    const end = new Date(form.tanggal_selesai);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  })();

  const focusInputCls = `${inputCls} !mt-0 pl-11 transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(0,165,236,0.12)]`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-xl ${surface}`}>
      {/* Dekorasi blur di pojok */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#004F9F]/5 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className={`text-sm font-extrabold ${txt}`}>Data Magang</h3>
          <p className={`text-xs mt-1 ${sub}`}>Pilih bidang penempatan dan periode magang yang diinginkan. Semua kolom wajib diisi.</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full ${
          dk ? "bg-gradient-to-br from-[#00A5EC]/20 to-[#004F9F]/20 text-[#00A5EC] ring-1 ring-[#00A5EC]/20" : "bg-gradient-to-br from-[#00A5EC]/10 to-[#004F9F]/10 text-[#004F9F] ring-1 ring-[#004F9F]/10"
        }`}>
          {isMahasiswa ? <CapIcon /> : <SchoolIcon />}
          {isMahasiswa ? "Mahasiswa" : "Siswa"}
        </span>
      </div>

      {/* Card Periode Magang */}
      <div className={`relative mt-6 rounded-2xl border p-5 md:p-6 ${dk ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/50"}`}>
        <SectionLabel sub={sub}>Periode Magang</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldWithIcon dk={dk} icon={<CalendarIcon />} label="Tanggal Mulai Magang" wajib>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none ${sub}`}>
                <CalendarIcon />
              </span>
              <input type="date" value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} required className={focusInputCls} />
            </div>
          </FieldWithIcon>
          <FieldWithIcon dk={dk} icon={<CalendarEndIcon />} label="Tanggal Selesai Magang" wajib>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none ${sub}`}>
                <CalendarEndIcon />
              </span>
              <input type="date" value={form.tanggal_selesai} onChange={e => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))} required className={focusInputCls} />
            </div>
          </FieldWithIcon>
        </div>

        {durasiHari && (
          <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed ${dk ? "bg-[#00A5EC]/10 text-[#7ec9ec]" : "bg-[#00A5EC]/10 text-[#004F9F]"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>Durasi magang yang dipilih: <strong>{durasiHari} hari</strong></span>
          </div>
        )}
      </div>

      {/* Bidang Penempatan */}
      <div className="relative mt-6">
        <SectionLabel sub={sub}>Bidang Penempatan</SectionLabel>

        {bidangLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-32 rounded-2xl animate-pulse ${dk ? "bg-white/5" : "bg-slate-100"}`} />
            ))}
          </div>
        ) : bidangOptions.length === 0 ? (
          <div className={`rounded-2xl border p-6 text-center ${dk ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"}`}>
            <p className={`text-xs font-semibold ${sub}`}>Belum ada bidang penempatan yang tersedia saat ini. Silakan hubungi admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bidangOptions.map(opt => {
              const active = form.posisi_bidang === opt.nama;
              // Tentukan status kuota: hijau (masih banyak) / kuning (hampir habis) / merah (penuh)
              const getKuotaStatus = (kuota, terisi) => {
                if (!kuota || kuota === 0) {
                  return { label: "Kuota tidak dibatasi", color: dk ? "text-emerald-400" : "text-emerald-600", dot: "bg-emerald-500" };
                }
                const pct = (terisi / kuota) * 100;
                if (pct >= 100) {
                  return { label: "Kuota penuh", color: dk ? "text-red-400" : "text-red-600", dot: "bg-red-500" };
                }
                if (pct >= 70) {
                  return { label: `Sisa ${kuota - terisi} kuota — hampir penuh`, color: dk ? "text-amber-400" : "text-amber-600", dot: "bg-amber-500" };
                }
                return { label: `Sisa ${kuota - terisi} kuota tersedia`, color: dk ? "text-emerald-400" : "text-emerald-600", dot: "bg-emerald-500" };
              };

              const kuotaStatus = getKuotaStatus(opt.kuota, opt.terisi || 0);
              const deskripsiTampil = opt.deskripsi?.trim() || kuotaStatus.label;
              return (
                <div
                  key={opt.id ?? opt.nama}
                  onClick={() => setForm(p => ({ ...p, posisi_bidang: p.posisi_bidang === opt.nama ? "" : opt.nama }))}
                  className={`group relative overflow-hidden p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    active
                      ? "border-[#004F9F] shadow-lg shadow-[#004F9F]/15 -translate-y-0.5"
                      : dk
                      ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:-translate-y-0.5"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#004F9F]/10 via-[#00A5EC]/5 to-transparent" />
                  )}

                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                    active ? "bg-gradient-to-b from-[#004F9F] to-[#00A5EC]" : "bg-transparent"
                  }`} />

                  {active && (
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#00A5EC]/10 blur-2xl" />
                  )}

                  {active && <CheckBadge />}

                  <div className="relative">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      active
                        ? "bg-gradient-to-br from-[#004F9F] to-[#0B1442] text-white shadow-lg shadow-[#004F9F]/30"
                        : dk ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"
                    }`}>
                      {bidangIcons[opt.nama] || <DefaultBidangIcon nama={opt.nama} />}
                    </div>
                    <h4 className={`font-extrabold text-sm mt-3.5 transition-colors ${active ? (dk ? "text-[#00A5EC]" : "text-[#004F9F]") : txt}`}>
                      {opt.nama}
                    </h4>
                    <p className={`text-[11px] mt-1.5 leading-relaxed ${sub}`}>{deskripsiTampil}</p>
                    <p className={`text-[10px] mt-1.5 flex items-center gap-1.5 font-bold ${kuotaStatus.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${kuotaStatus.dot} ${kuotaStatus.dot === "bg-red-500" ? "" : "animate-pulse"}`} />
                      {kuotaStatus.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`relative flex gap-4 pt-6 mt-6 border-t ${dk ? "border-white/10" : "border-slate-100"}`}>
        <button
          type="button"
          onClick={onBack}
          className={`group flex-1 flex items-center justify-center gap-2 rounded-full border py-3 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${dk ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="group flex-[2] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] py-3 text-xs font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:brightness-100"
        >
          Lanjutkan
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StepDataMagang;