import { Camera, X, Minus, Plus, Move } from "lucide-react";

const FotoMentorModal = ({
  showFotoModal, setShowFotoModal,
  cropSrc, cropImgRef, cropPos, cropZoom, setCropZoom,
  isDragging, handleDragStart,
  cropFileInputRef, handleSimpanPerubahanFoto,
  fotoModalLoading,
}) => {
  if (!showFotoModal) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-6"
      style={{ margin: 0 }}
      onClick={() => !fotoModalLoading && setShowFotoModal(false)}
    >
      <div
        className="relative max-w-sm w-full rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-[modalPop_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] overflow-hidden">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                <Camera className="w-4 h-4 text-white" />
              </span>
              <h3 className="text-sm font-black text-white">Pratinjau Foto Mentor</h3>
            </div>
            <button
              onClick={() => !fotoModalLoading && setShowFotoModal(false)}
              disabled={fotoModalLoading}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Crop Area */}
        <div className="px-6 pt-7 pb-3 flex flex-col items-center bg-slate-50">
          <div
            className={`relative h-56 w-56 rounded-full overflow-hidden shadow-[0_0_0_6px_rgba(0,165,236,0.12),0_8px_30px_rgba(0,0,0,0.25)] select-none ring-4 ring-white ${
              !fotoModalLoading && isDragging ? "cursor-grabbing" : fotoModalLoading ? "cursor-default" : "cursor-grab"
            }`}
            onMouseDown={!fotoModalLoading ? handleDragStart : undefined}
            onTouchStart={!fotoModalLoading ? handleDragStart : undefined}
          >
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

            {fotoModalLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1442]/85 via-[#101F5C]/75 to-[#1E3A8A]/85">
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div
                    className="absolute inset-0 animate-[shimmerSweep_1.8s_ease-in-out_infinite]"
                    style={{ background: "linear-gradient(110deg, transparent 30%, rgba(0,165,236,0.12) 50%, transparent 70%)", backgroundSize: "200% 100%" }}
                  />
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-[88px] w-[88px] rounded-full animate-[spin_2.4s_linear_infinite]" style={{ border: "2px solid transparent", borderTopColor: "#00A5EC", borderRightColor: "#00A5EC40" }} />
                  <div className="absolute h-[64px] w-[64px] rounded-full animate-[spin_1.8s_linear_infinite_reverse]" style={{ border: "1.5px solid transparent", borderRightColor: "#00A5EC80", borderBottomColor: "#00A5EC30" }} />
                  <div className="absolute h-[44px] w-[44px] rounded-full bg-[#00A5EC]/10 animate-pulse" />
                  <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <Camera className="w-4 h-4 text-white opacity-90" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-4 text-[9px] font-black text-[#00A5EC] tracking-[0.2em] uppercase animate-pulse">Memuat Foto...</p>
              </div>
            )}

            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
          </div>

          {!fotoModalLoading ? (
            <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
              <Move className="w-3.5 h-3.5" />
              Seret foto untuk mengatur posisi
            </div>
          ) : (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-[10px] font-bold text-slate-400 shadow-sm">
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[#00A5EC] border-t-transparent animate-spin" />
              Mengunduh foto dari server...
            </div>
          )}
        </div>

        {/* Zoom control */}
        <div className={`px-6 pb-5 pt-3 transition-opacity duration-300 ${fotoModalLoading ? "opacity-30 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500">Sesuaikan Ukuran</span>
            <span className="text-xs font-extrabold text-white bg-[#004F9F] px-2 py-0.5 rounded-md">{cropZoom}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCropZoom((z) => Math.max(100, z - 10))}
              className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <input
              type="range"
              min="100"
              max="300"
              value={cropZoom}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#004F9F]"
              style={{ background: `linear-gradient(to right, #004F9F ${(cropZoom - 100) / 2}%, #e2e8f0 ${(cropZoom - 100) / 2}%)` }}
            />
            <button
              type="button"
              onClick={() => setCropZoom((z) => Math.min(300, z + 10))}
              className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 transition-opacity duration-300 ${fotoModalLoading ? "opacity-30 pointer-events-none" : ""}`}>
          <button
            type="button"
            onClick={() => cropFileInputRef.current?.click()}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-[#0B1442] hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer"
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

export default FotoMentorModal;