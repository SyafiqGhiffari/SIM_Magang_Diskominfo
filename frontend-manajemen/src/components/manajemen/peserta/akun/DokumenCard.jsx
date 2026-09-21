import { Eye, RefreshCw, Clock, UploadCloud, FileText } from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

const DokumenCard = ({
  label,
  desc,
  filePath,
  dk,
  jenis,
  onUpload,
  onPreview,
  isRequired = false,
  isSuratPenerimaan = false,
  icon: IconComponent = FileText,
  colorTheme = "blue",
  formatInfo = "",
  extraBadge = "",
}) => {
  const hasFile = Boolean(filePath);
  const url = hasFile ? getFileUrl(filePath) : null;

  // Custom colors per document card
  const getThemeStyles = () => {
    switch (colorTheme) {
      case "indigo":
        return {
          cardBorderLight: "border-indigo-200/90 hover:border-indigo-400/80",
          cardBorderDark: "border-indigo-500/25 hover:border-indigo-400/50",
          icon: hasFile
            ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
          viewBtn: "text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border-indigo-200/80 dark:border-indigo-800/50",
          gantiBtn: "hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:border-indigo-200/70 dark:hover:border-indigo-800/40",
          gantiIcon: "group-hover/gantibtn:text-indigo-600 dark:group-hover/gantibtn:text-indigo-400",
        };
      case "purple":
        return {
          cardBorderLight: "border-purple-200/90 hover:border-purple-400/80",
          cardBorderDark: "border-purple-500/25 hover:border-purple-400/50",
          icon: hasFile
            ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
          viewBtn: "text-purple-600 dark:text-purple-400 bg-purple-50/90 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border-purple-200/80 dark:border-purple-800/50",
          gantiBtn: "hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 hover:border-purple-200/70 dark:hover:border-purple-800/40",
          gantiIcon: "group-hover/gantibtn:text-purple-600 dark:group-hover/gantibtn:text-purple-400",
        };
      case "sky":
        return {
          cardBorderLight: "border-sky-200/90 hover:border-sky-400/80",
          cardBorderDark: "border-sky-500/25 hover:border-sky-400/50",
          icon: hasFile
            ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30",
          viewBtn: "text-sky-600 dark:text-sky-400 bg-sky-50/90 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border-sky-200/80 dark:border-sky-800/50",
          gantiBtn: "hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/80 dark:hover:bg-sky-950/40 hover:border-sky-200/70 dark:hover:border-sky-800/40",
          gantiIcon: "group-hover/gantibtn:text-sky-600 dark:group-hover/gantibtn:text-sky-400",
        };
      case "emerald":
        return {
          cardBorderLight: "border-emerald-200/90 hover:border-emerald-400/80",
          cardBorderDark: "border-emerald-500/25 hover:border-emerald-400/50",
          icon: hasFile
            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30",
          viewBtn: "text-emerald-600 dark:text-emerald-400 bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-200/80 dark:border-emerald-800/50",
          gantiBtn: "hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:border-emerald-200/70 dark:hover:border-emerald-800/40",
          gantiIcon: "group-hover/gantibtn:text-emerald-600 dark:group-hover/gantibtn:text-emerald-400",
        };
      case "rose":
        return {
          cardBorderLight: "border-rose-200/90 hover:border-rose-400/80",
          cardBorderDark: "border-rose-500/25 hover:border-rose-400/50",
          icon: hasFile
            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
          viewBtn: "text-rose-600 dark:text-rose-400 bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-rose-200/80 dark:border-rose-800/50",
          gantiBtn: "hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 hover:border-rose-200/70 dark:hover:border-rose-800/40",
          gantiIcon: "group-hover/gantibtn:text-rose-600 dark:group-hover/gantibtn:text-rose-400",
        };
      case "amber":
        return {
          cardBorderLight: "border-amber-200/90 hover:border-amber-400/80",
          cardBorderDark: "border-amber-500/25 hover:border-amber-400/50",
          icon: hasFile
            ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
          viewBtn: "text-amber-700 dark:text-amber-400 bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border-amber-200/80 dark:border-amber-800/50",
          gantiBtn: "hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 hover:border-amber-200/70 dark:hover:border-amber-800/40",
          gantiIcon: "group-hover/gantibtn:text-amber-600 dark:group-hover/gantibtn:text-amber-400",
        };
      case "teal":
        return {
          cardBorderLight: "border-teal-200/90 hover:border-teal-400/80",
          cardBorderDark: "border-teal-500/25 hover:border-teal-400/50",
          icon: hasFile
            ? "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
          viewBtn: "text-teal-600 dark:text-teal-400 bg-teal-50/90 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border-teal-200/80 dark:border-teal-800/50",
          gantiBtn: "hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 hover:border-teal-200/70 dark:hover:border-teal-800/40",
          gantiIcon: "group-hover/gantibtn:text-teal-600 dark:group-hover/gantibtn:text-teal-400",
        };
      default: // "blue"
        return {
          cardBorderLight: "border-blue-200/90 hover:border-blue-400/80",
          cardBorderDark: "border-blue-500/25 hover:border-sky-400/50",
          icon: hasFile
            ? "bg-blue-500/10 text-[#004F9F] dark:bg-sky-500/20 dark:text-[#00A5EC] border border-blue-500/25"
            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/60 dark:border-white/5",
          badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border-blue-100 dark:border-blue-900/30",
          viewBtn: "text-[#004F9F] dark:text-[#00A5EC] bg-blue-50/90 hover:bg-blue-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border-blue-200/80 dark:border-sky-800/50",
          gantiBtn: "hover:text-[#004F9F] dark:hover:text-[#00A5EC] hover:bg-blue-50/80 dark:hover:bg-sky-950/40 hover:border-blue-200/70 dark:hover:border-sky-800/40",
          gantiIcon: "group-hover/gantibtn:text-[#004F9F] dark:group-hover/gantibtn:text-[#00A5EC]",
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div
      className={`group relative flex flex-col justify-between p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl border transition-all duration-300 min-w-0 ${
        hasFile
          ? dk
            ? `bg-[#161b22] ${theme.cardBorderDark} hover:shadow-lg hover:shadow-black/20`
            : `bg-white ${theme.cardBorderLight} shadow-2xs hover:shadow-md hover:shadow-slate-900/5`
          : dk
          ? "bg-white/[0.02] border-white/10 border-dashed hover:border-white/20 hover:bg-white/[0.04]"
          : "bg-slate-50/75 border-slate-200 border-dashed hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div>
        {/* Top: Icon + Title & Badges */}
        <div className="flex items-start gap-2 sm:gap-3">
          <span
            className={`flex h-7.5 w-7.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl shadow-2xs ${theme.icon}`}
          >
            <IconComponent className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <h5 className="text-[11.5px] sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug break-words">
                {label}
              </h5>

              {hasFile ? (
                <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border border-emerald-100 dark:border-emerald-800/30">
                  Terunggah
                </span>
              ) : isRequired ? (
                <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border ${theme.badgeBg}`}>
                  Wajib
                </span>
              ) : (
                <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border border-slate-200/60 dark:border-white/5">
                  Opsional
                </span>
              )}
            </div>

            <p className="text-[9.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-normal sm:leading-relaxed mt-0.5 sm:mt-1 break-words">
              {desc}
            </p>

            {(formatInfo || extraBadge) && (
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 flex-wrap">
                {extraBadge && (
                  <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.badgeBg}`}>
                    {extraBadge}
                  </span>
                )}
                {formatInfo && (
                  <span className="text-[8.5px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                    {formatInfo}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-100 dark:border-white/5">
        {hasFile ? (
          <>
            <button
              type="button"
              onClick={() =>
                onPreview &&
                onPreview({
                  url,
                  label,
                  Icon: IconComponent,
                  key: jenis,
                  isImage:
                    jenis === "file_pas_foto" ||
                    label?.toLowerCase().includes("foto") ||
                    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url || ""),
                })
              }
              className={`group/viewbtn inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-xs font-bold border shadow-2xs transition-colors duration-150 cursor-pointer ${theme.viewBtn}`}
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover/viewbtn:scale-120" />
              <span>Lihat Berkas</span>
            </button>
            {!isSuratPenerimaan && onUpload && (
              <button
                type="button"
                onClick={() => onUpload(jenis, "ganti")}
                className={`group/gantibtn inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 border border-transparent hover:shadow-2xs transition-colors duration-150 cursor-pointer ${theme.gantiBtn}`}
              >
                <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-500 ease-in-out group-hover/gantibtn:rotate-180 ${theme.gantiIcon}`} />
                <span>Ganti Berkas</span>
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Belum diunggah</span>
            </div>
            {onUpload && (
              <button
                type="button"
                onClick={() => onUpload(jenis, "baru")}
                className="group/upbtn inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-xs font-bold text-white bg-gradient-to-r from-[#060D2A] via-[#0B1A4C] to-[#004F9F] hover:from-[#0B1A4C] hover:to-[#005bb7] shadow-2xs hover:shadow-xs transition-colors duration-150 cursor-pointer"
              >
                <UploadCloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover/upbtn:-translate-y-0.5" />
                <span>Unggah</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DokumenCard;
