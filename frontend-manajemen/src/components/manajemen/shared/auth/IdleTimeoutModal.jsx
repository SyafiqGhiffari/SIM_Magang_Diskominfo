import { createPortal } from "react-dom";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

export default function IdleTimeoutModal({
  show,
  secondsRemaining,
  onKeepAlive,
  onLogout,
  maxWarningSeconds = 120,
}) {
  const { isDark } = useManajemenTheme();

  if (!show) return null;

  const menit = Math.floor(secondsRemaining / 60);
  const detik = secondsRemaining % 60;
  const formatWaktu = `${String(menit).padStart(2, "0")}:${String(detik).padStart(2, "0")}`;

  const persentase = Math.max(0, Math.min(100, (secondsRemaining / maxWarningSeconds) * 100));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop dengan blur dan animasi fade-in */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]"
        onClick={onKeepAlive}
      />

      {/* Card Modal Peringatan */}
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 animate-[scaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)] ${
          isDark
            ? "border-amber-500/20 bg-[#161b22]/95 text-slate-100 shadow-amber-500/5"
            : "border-slate-200 bg-white/95 text-slate-800 shadow-xl"
        }`}
      >
        {/* Glow ambient warning */}
        <div
          className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
            isDark ? "bg-amber-500/15" : "bg-amber-400/20"
          }`}
        />

        <div className="relative p-6 sm:p-7">
          {/* Header Icon */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-inner">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>

            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Peringatan Keamanan Sesi
              </span>
              <h3 className={`mt-1.5 text-lg font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                Sesi Anda Akan Segera Berakhir
              </h3>
            </div>
          </div>

          {/* Deskripsi */}
          <p className={`mt-3.5 text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Tidak ada aktivitas yang terdeteksi selama beberapa waktu. Demi keamanan data, Anda akan otomatis dikeluarkan dari sistem dalam:
          </p>

          {/* Box Countdown Visual */}
          <div
            className={`my-5 flex flex-col items-center justify-center rounded-2xl border p-4 text-center ${
              isDark
                ? "border-white/10 bg-white/[0.03]"
                : "border-amber-100 bg-amber-50/50"
            }`}
          >
            <span
              className={`font-mono text-3xl sm:text-4xl font-black tracking-wider ${
                secondsRemaining <= 30
                  ? "text-rose-500 animate-pulse"
                  : isDark
                  ? "text-amber-400"
                  : "text-amber-600"
              }`}
            >
              {formatWaktu}
            </span>
            <span className={`mt-1 text-[10.5px] font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Menit : Detik Tersisa
            </span>

            {/* Progress bar visual */}
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  secondsRemaining <= 30
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-amber-500 to-[#00A5EC]"
                }`}
                style={{ width: `${persentase}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onLogout}
              className={`w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                isDark
                  ? "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout Sekarang
            </button>

            <button
              type="button"
              onClick={onKeepAlive}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tetap Masuk
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
