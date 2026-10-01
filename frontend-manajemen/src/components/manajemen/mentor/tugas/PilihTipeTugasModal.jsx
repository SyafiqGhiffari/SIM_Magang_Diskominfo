import {
  X,
  BookOpenCheck,
  FilePenLine,
  NotebookPen,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";

export const PilihTipeTugasModal = ({
  isOpen = false,
  onClose,
  onPilihTipe,
  isDark = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl my-auto rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[modalFadeUp_0.25s_ease-out] border-0 ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL SIGNATURE KOMINFO (PERSIS MODAL TUGAS PROYEK) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-3 sm:px-8 sm:py-3.5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />

          {/* Watermark Icon */}
          <BookOpenCheck
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <BookOpenCheck className="w-5 h-5 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-[#00A5EC] mb-1 bg-white/10 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2 h-2 animate-pulse" />
                  <span>Pilih Model Penugasan</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  Pilih Model Penugasan Magang
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-white/75 mt-0.5">
                  Tentukan format penugasan yang ingin Anda berikan kepada peserta bimbingan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ── CONTENT BODY: 2 KARTU MODEL TUGAS ── */}
        <div className="p-6 sm:p-7 space-y-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Pilih salah satu format penugasan di bawah ini untuk memulai:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kartu 1: Tugas Proyek & Mandiri */}
            <div
              onClick={() => onPilihTipe("proyek")}
              className={`group relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${
                isDark
                  ? "bg-slate-800/40 border-white/10 hover:border-[#00A5EC] hover:bg-slate-800/80"
                  : "bg-white border-slate-200/90 hover:border-[#004F9F] hover:bg-blue-50/20 shadow-xs"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 rounded-2xl items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 shadow-xs group-hover:bg-blue-50 dark:group-hover:bg-[#004F9F]/20 group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] group-hover:border-blue-200/60 dark:group-hover:border-[#00A5EC]/30 group-hover:scale-110 transition-all duration-300">
                    <FilePenLine className="w-6 h-6 transition-colors duration-300" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-[#004F9F] dark:group-hover:text-sky-300 group-hover:border-blue-200/70 dark:group-hover:border-blue-900/50 transition-all duration-300">
                    Unggah Dokumen &amp; URL
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] transition-colors duration-300">
                    Penugasan Proyek &amp; Mandiri
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Peserta menyelesaikan tugas proyek atau studi kasus berbasis berkas laporan pengerjaan (PDF/ZIP) atau menyertakan tautan repositori &amp; demo aplikasi.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] transition-colors duration-300">
                <span>Pilih Format Ini</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>

            {/* Kartu 2: Tugas Kuis & Soal Interaktif */}
            <div
              onClick={() => onPilihTipe("kuis")}
              className={`group relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${
                isDark
                  ? "bg-slate-800/40 border-white/10 hover:border-[#00A5EC] hover:bg-slate-800/80"
                  : "bg-white border-slate-200/90 hover:border-[#004F9F] hover:bg-blue-50/20 shadow-xs"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 rounded-2xl items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 shadow-xs group-hover:bg-blue-50 dark:group-hover:bg-[#004F9F]/20 group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] group-hover:border-blue-200/60 dark:group-hover:border-[#00A5EC]/30 group-hover:scale-110 transition-all duration-300">
                    <NotebookPen className="w-6 h-6 transition-colors duration-300" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-[#004F9F] dark:group-hover:text-sky-300 group-hover:border-blue-200/70 dark:group-hover:border-blue-900/50 transition-all duration-300">
                    Pilihan Ganda &amp; Esai
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] transition-colors duration-300">
                    Kuis &amp; Soal Interaktif
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Peserta mengerjakan butir pertanyaan kuis langsung di dalam sistem dengan penilaian otomatis, batas KKM, batas durasi waktu, dan hak remedial.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#004F9F] dark:group-hover:text-[#00A5EC] transition-colors duration-300">
                <span>Pilih Format Ini</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-5">
          <div className="flex items-center gap-2 max-w-sm sm:max-w-md min-w-0">
            <Info className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Pilihan model penugasan ini menentukan alur formulir dan cara peserta magang mengumpulkan hasil pekerjaan mereka.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
            }`}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default PilihTipeTugasModal;
