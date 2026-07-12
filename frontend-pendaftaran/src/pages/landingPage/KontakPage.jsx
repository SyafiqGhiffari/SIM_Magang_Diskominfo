const KontakPage = () => {
  return (
    <section className="bg-slate-50 min-h-[85vh]">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-dark via-brand-medium to-brand-light px-6 py-16 text-center text-white relative overflow-hidden">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl animate-pulse-slow" />
        <div className="absolute right-10 bottom-5 h-48 w-48 rounded-full bg-brand-light/15 blur-2xl animate-float" />

        <h1 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">Hubungi Kami</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-xs text-slate-200">
          Hubungi kami melalui berbagai saluran komunikasi resmi untuk mendapatkan informasi lebih lanjut.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left Column: Contact info */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-brand-dark">Hubungan Cepat</h2>
              <div className="h-0.5 bg-slate-100 my-4" />

              <div className="space-y-5">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-medium/5 text-lg">
                    ✉️
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Resmi</h3>
                    <a
                      href="mailto:diskominfo@ponorogo.go.id"
                      className="mt-1 block text-sm font-bold text-brand-medium hover:text-brand-dark hover:underline transition-colors"
                    >
                      diskominfo@ponorogo.go.id
                    </a>
                  </div>
                </div>

                {/* Telepon */}
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light/10 text-lg">
                    📞
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telepon Kantor</h3>
                    <p className="mt-1 text-sm font-bold text-brand-dark">
                      (0352) 481845
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Socials */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-brand-dark">Lokasi & Media Sosial</h2>
              <div className="h-0.5 bg-slate-100 my-4" />

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p>
                  <strong>Gedung Graha Krida Praja Lt. 4</strong><br />
                  Jl. Aloon-Aloon Utara No. 4, Ponorogo, Jawa Timur
                </p>

                <div className="h-px bg-slate-100 my-4" />

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ikuti Media Sosial Kami</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://instagram.com/diskominfoponorogo"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-gradient-to-tr hover:from-yellow-500 hover:to-purple-600 hover:text-white transition-all text-slate-500"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                    <a
                      href="https://facebook.com/diskominfoponorogo"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-brand-medium hover:text-white transition-all text-slate-500"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                      </svg>
                    </a>
                    <a
                      href="https://youtube.com/diskominfoponorogo"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-red-600 hover:text-white transition-all text-slate-500"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Map Embed */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <h2 className="text-base font-bold text-brand-dark mb-4 text-left">Peta Lokasi Kantor</h2>
            <div className="flex-1 min-h-[350px] rounded-xl overflow-hidden border border-slate-100 shadow-inner relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.1643916962255!2d111.46237731477028!3d-7.868779994331252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e790f9a2e6f4a83%3A0x6b45465e905d41f7!2sGraha%20Krida%20Praja!5e0!3m2!1sen!2sid!4v1655900000000!5m2!1sen!2sid"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Diskominfo Ponorogo"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KontakPage;