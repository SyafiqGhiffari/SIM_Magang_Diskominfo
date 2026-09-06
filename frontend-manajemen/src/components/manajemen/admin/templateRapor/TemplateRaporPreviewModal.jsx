import { useEffect, useState } from "react";
import {
  X, Palette, Building2, UserCheck, Star,
  FileText, CheckCircle2, Pencil, Eye
} from "lucide-react";
import TemplateRaporPreview from "./TemplateRaporPreview";

export const TemplateRaporPreviewModal = ({
  show,
  onClose,
  template,
  onEdit,
  isDark = false,
}) => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", onResize);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [show, onClose]);

  if (!show || !template) return null;

  const isDefault = template.is_default;
  const isPublish = template.status === "publish";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-[#050B24]/85 via-[#0B1442]/80 to-[#00284F]/85 p-4 backdrop-blur-md animate-[tplFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <style>{`
        @keyframes tplFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tplPop { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
        @keyframes tplShine { from { transform: translateX(-120%) skewX(-18deg) } to { transform: translateX(320%) skewX(-18deg) } }
      `}</style>

      <div
        className={`flex max-h-[93vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl shadow-[0_35px_90px_-20px_rgba(0,0,0,0.65)] ring-1 animate-[tplPop_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
          isDark ? "bg-[#161b22] ring-white/10" : "bg-white ring-black/5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#0D2A63] to-[#004F9F] px-4 py-3 sm:px-5 sm:py-4 text-white">
          <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-[#00A5EC]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="group/icon grid h-8 w-8 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-lg sm:rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white/25">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/icon:rotate-6" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xs sm:text-base font-black tracking-tight text-white">{template.nama}</h3>
                <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ring-white/20 transition-colors duration-200 hover:bg-white/25">
                    <Building2 className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {template.nama_instansi || "Diskominfo"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ring-white/20">
                    <UserCheck className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {template.tipe_penandatangan === "mentor" ? "Mentor" : template.tipe_penandatangan === "keduanya" ? "Kadis & Mentor" : "Kepala Dinas"}
                  </span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/30 text-sky-200 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ring-sky-300/30">
                      <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-current" /> Utama
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ring-1 ring-inset ${
                    isPublish ? "bg-emerald-400/20 text-emerald-200 ring-emerald-300/30" : "bg-amber-400/20 text-amber-200 ring-amber-300/30"
                  }`}>
                    {isPublish ? <CheckCircle2 className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> : <FileText className="w-2 sm:w-2.5 h-2 sm:h-2.5" />}
                    {isPublish ? "Publish" : "Draft"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="group/x grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg sm:rounded-xl bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-red-500/90 hover:text-white hover:ring-red-300/40 active:scale-90 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Isi Lembar Transkrip A4 (Sama Persis dengan TemplateSuratPage) */}
        <div className={`relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 ${
          isDark ? "bg-[#0b0f19]" : "bg-[radial-gradient(circle_at_20%_10%,#eef5ff_0%,#f1f5f9_55%,#e4ebf6_100%)]"
        }`}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(#0b144210_1px,transparent_1px),linear-gradient(90deg,#0b144210_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="group/sheet relative mx-auto w-[72vw] sm:w-full max-w-[280px] sm:max-w-2xl">
            {/* Glow di belakang transkrip saat hover */}
            <div className="pointer-events-none absolute inset-6 rounded-2xl bg-gradient-to-r from-[#00A5EC]/0 via-[#004F9F]/25 to-[#00A5EC]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover/sheet:opacity-100" />

            {/* Container Aspect A4 (1 : 1.414) */}
            <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-sm shadow-2xl transition-transform duration-500 ease-out will-change-transform group-hover/sheet:-translate-y-1.5 group-hover/sheet:scale-[1.01]">
              <TemplateRaporPreview template={template} base={isMobile ? 4.2 : 9} />

              {/* Kilau menyapu saat hover */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 group-hover/sheet:opacity-100 group-hover/sheet:animate-[tplShine_1.1s_ease-out]" />
              </div>
            </div>
          </div>

          <p className="relative mt-4 text-center text-[10.5px] sm:text-[11px] font-semibold text-slate-400">
            Data peserta di atas hanyalah contoh
            <span className="hidden sm:inline"> · tekan <span className="rounded border border-slate-350 bg-white/95 dark:border-white/10 dark:bg-white/5 px-1 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">Esc</span> untuk menutup</span>
          </p>
        </div>

        {/* Footer */}
        <div className={`flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur ${
          isDark ? "border-white/5 bg-[#161b22]/95" : "border-slate-100 bg-white/90"
        }`}>
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-400 sm:inline-flex">
            <Eye className="w-3.5 h-3.5" /> Pratinjau tata letak transkrip nilai resmi; hasil akhir mengikuti PDF yang digenerate
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg sm:rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tutup
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(template);
                }}
                className="group/edit inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] bg-[length:200%_100%] bg-left px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-lg hover:shadow-[#004F9F]/30 active:scale-95 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 transition-transform duration-300 group-hover/edit:-rotate-12" />
                <span>Edit Desain Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateRaporPreviewModal;
