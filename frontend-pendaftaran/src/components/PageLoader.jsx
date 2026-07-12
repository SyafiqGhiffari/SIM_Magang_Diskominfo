import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageLoader = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the loader immediately when the path changes
    setLoading(true);
    setVisible(true);
    
    // Reset scroll to top instantly
    window.scrollTo(0, 0);

    // Fade out after 450ms
    const fadeOutTimer = setTimeout(() => {
      setVisible(false);
    }, 450);

    // Remove from DOM after transition completes (750ms total)
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 750);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1442]/95 backdrop-blur-md transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Top running line progress bar */}
      <div 
        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-[#00A5EC] via-[#004F9F] to-[#00A5EC] transition-all duration-500 ease-out"
        style={{
          width: "100%",
          animation: "loading-bar 1.5s infinite linear"
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Modern glowing loader circle */}
        <div className="relative h-20 w-20">
          {/* Inner pulsating brand icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/images/icon-diskominfo.png" 
              alt="Logo Kominfo" 
              className="h-10 w-10 animate-pulse" 
            />
          </div>
          {/* Outer spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#00A5EC] border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text with slide up & fade */}
        <h3 className="mt-6 text-sm font-extrabold tracking-widest text-white uppercase animate-pulse">
          Memuat Halaman...
        </h3>
        <p className="mt-1 text-[10px] text-[#00A5EC]/70 uppercase tracking-widest">
          Diskominfo Ponorogo
        </p>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
