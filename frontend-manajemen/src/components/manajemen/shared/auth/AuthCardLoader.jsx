const AuthCardLoader = ({ message = "Memuat Formulir...", subtitle = "Diskominfo Ponorogo" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-12 min-h-[290px] sm:min-h-[310px] animate-[modalFadeUp_0.3s_ease-out]">
      <div className="relative flex items-center justify-center h-13 w-13 sm:h-15 sm:w-15">
        {/* Soft background pulse halo */}
        <div className="absolute inset-0 rounded-full bg-[#00A5EC]/15 animate-ping opacity-60" />
        {/* Outer static ring */}
        <div className="absolute inset-0 rounded-full border-3 border-slate-100" />
        {/* Outer spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-3 border-[#004F9F] border-t-transparent animate-spin" />
        {/* Inner pulsing icon */}
        <img
          src="/images/icon-diskominfo.png"
          alt="Logo Diskominfo"
          className="h-6.5 w-6.5 sm:h-7.5 sm:w-7.5 object-contain animate-pulse"
        />
      </div>

      <h4 className="mt-4 text-xs sm:text-sm font-extrabold tracking-tight text-[#0B1442] animate-pulse">
        {message}
      </h4>
      <p className="mt-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-slate-400">
        {subtitle}
      </p>

      {/* Mini bouncing loading dots */}
      <div className="mt-3.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#004F9F] animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#00A5EC] animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" />
      </div>
    </div>
  );
};

export default AuthCardLoader;
