const FotoProfilModal = ({
  dk, divider, sub,
  showFotoModal, setShowFotoModal,
  cropSrc, cropImgRef, cropPos, cropZoom, setCropZoom,
  isDragging, handleDragStart,
  cropFileInputRef, handleSimpanPerubahanFoto,
  fotoModalLoading,
}) => {
  if (!showFotoModal) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-6"
      style={{ margin: 0 }}
      onClick={() => !fotoModalLoading && setShowFotoModal(false)}
    >
      <div
        className={`relative max-w-sm w-full rounded-3xl border shadow-2xl overflow-hidden animate-[modalPop_0.25s_cubic-bezier(0.34,1.56,0.64,1)] ${dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#0B1442] via-[#141F5C] to-[#1E3A8A] overflow-hidden">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              </span>
              <h3 className="text-sm font-extrabold text-white">Pratinjau Foto Profil</h3>
            </div>
            <button
              onClick={() => !fotoModalLoading && setShowFotoModal(false)}
              disabled={fotoModalLoading}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Crop Area */}
        <div className={`px-6 pt-7 pb-3 flex flex-col items-center ${dk ? "bg-[#0d1117]" : "bg-slate-50"}`}>
          <div
            className={`relative h-56 w-56 rounded-full overflow-hidden shadow-[0_0_0_6px_rgba(0,165,236,0.12),0_8px_30px_rgba(0,0,0,0.25)] select-none ring-4 ${dk ? "ring-white/10" : "ring-white"} ${!fotoModalLoading && isDragging ? "cursor-grabbing" : fotoModalLoading ? "cursor-default" : "cursor-grab"}`}
            onMouseDown={!fotoModalLoading ? handleDragStart : undefined}
            onTouchStart={!fotoModalLoading ? handleDragStart : undefined}
          >
            {/* Foto aktual */}
            {cropSrc && !fotoModalLoading && (
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt="Crop preview"
                draggable={false}
                crossOrigin="anonymous"
                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                style={{ transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropZoom / 100})`, transformOrigin: "center center" }}
              />
            )}

            {/* Grid lines saat drag */}
            {!fotoModalLoading && (
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${isDragging ? "opacity-100" : "opacity-0"}`}>
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/70 mix-blend-difference" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/70 mix-blend-difference" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/70 mix-blend-difference" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/70 mix-blend-difference" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/90 mix-blend-difference" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/90 mix-blend-difference" />
                </div>
              </div>
            )}

            {/* === PREMIUM LOADING OVERLAY === */}
            {fotoModalLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1442]/85 via-[#101F5C]/75 to-[#1E3A8A]/85">
                {/* Shimmer sweep */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="absolute inset-0 animate-[shimmerSweep_1.8s_ease-in-out_infinite]"
                    style={{ background: "linear-gradient(110deg, transparent 30%, rgba(0,165,236,0.12) 50%, transparent 70%)", backgroundSize: "200% 100%" }}
                  />
                </div>

                {/* Rotating rings */}
                <div className="relative flex items-center justify-center">
                  {/* Outer ring */}
                  <div
                    className="absolute h-[88px] w-[88px] rounded-full animate-[spin_2.4s_linear_infinite]"
                    style={{ border: "2px solid transparent", borderTopColor: "#00A5EC", borderRightColor: "#00A5EC40" }}
                  />
                  {/* Middle ring */}
                  <div
                    className="absolute h-[64px] w-[64px] rounded-full animate-[spin_1.8s_linear_infinite_reverse]"
                    style={{ border: "1.5px solid transparent", borderTopColor: "transparent", borderRightColor: "#00A5EC80", borderBottomColor: "#00A5EC30" }}
                  />
                  {/* Inner glow dot */}
                  <div className="absolute h-[44px] w-[44px] rounded-full bg-[#00A5EC]/10 animate-pulse" />
                  {/* Camera icon center */}
                  <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" className="w-4 h-4 opacity-90">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                  </div>
                </div>

                <p className="mt-4 text-[9px] font-black text-[#00A5EC] tracking-[0.2em] uppercase animate-pulse">
                  Memuat Foto...
                </p>
              </div>
            )}

            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
          </div>

          {/* Hint text */}
          {!fotoModalLoading ? (
            <div className={`mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${dk ? "bg-white/5 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Seret foto untuk mengatur posisi
            </div>
          ) : (
            <div className={`mt-3.5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-bold ${dk ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400 shadow-sm"}`}>
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[#00A5EC] border-t-transparent animate-spin" />
              Mengunduh foto dari server...
            </div>
          )}
        </div>

        {/* Zoom control — dinonaktifkan saat loading */}
        <div className={`px-6 pb-5 pt-3 transition-opacity duration-300 ${fotoModalLoading ? "opacity-30 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className={`text-xs font-bold ${sub}`}>Sesuaikan Ukuran</span>
            <span className="text-xs font-extrabold text-white bg-[#004F9F] px-2 py-0.5 rounded-md">{cropZoom}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCropZoom(z => Math.max(100, z - 10))} className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${dk ? "bg-white/10 hover:bg-white/15 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </button>
            <input
              type="range"
              min="100"
              max="300"
              value={cropZoom}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#004F9F]"
              style={{ background: `linear-gradient(to right, #004F9F ${((cropZoom - 100) / 2)}%, ${dk ? "#2d333b" : "#e2e8f0"} ${((cropZoom - 100) / 2)}%)` }}
            />
            <button type="button" onClick={() => setCropZoom(z => Math.min(300, z + 10))} className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${dk ? "bg-white/10 hover:bg-white/15 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action buttons — dinonaktifkan saat loading */}
        <div className={`flex gap-3 px-6 pb-6 pt-4 border-t ${divider} transition-opacity duration-300 ${fotoModalLoading ? "opacity-30 pointer-events-none" : ""}`}>
          <button
            type="button"
            onClick={() => cropFileInputRef.current?.click()}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-xs font-bold hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer ${dk ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-slate-300 text-[#0B1442] hover:bg-slate-50"}`}
          >
            Pilih Foto Lain
          </button>
          <button
            type="button"
            onClick={handleSimpanPerubahanFoto}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:from-[#101F5C] hover:to-[#004F9F] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            Simpan Perubahan
          </button>
        </div>

        <style>{`
          @keyframes modalPop {
            from { opacity: 0; transform: scale(0.92) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes shimmerSweep {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FotoProfilModal;