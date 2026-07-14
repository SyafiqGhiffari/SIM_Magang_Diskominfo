import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const getTopSegment = (pathname) => "/" + (pathname.split("/")[1] || "");

const PageLoader = () => {
  const location = useLocation();

  // ==== PERUBAHAN: loader AKTIF sejak mount pertama, mengambil alih dari loader statis
  // index.html dengan tampilan identik — sehingga terasa menyambung, bukan dua loading terpisah.
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [prevTopSegment, setPrevTopSegment] = useState(() => getTopSegment(location.pathname));

  const currentTopSegment = getTopSegment(location.pathname);

  if (currentTopSegment !== prevTopSegment) {
    setPrevTopSegment(currentTopSegment);
    setLoading(true);
    setVisible(true);
  }
  // ==== AKHIR PERUBAHAN ====

  useEffect(() => {
    if (!loading) return;

    window.scrollTo(0, 0);

    const fadeOutTimer = setTimeout(() => {
      setVisible(false);
    }, 450);

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 750);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1442]/95 backdrop-blur-md transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-[#00A5EC] via-[#004F9F] to-[#00A5EC] transition-all duration-500 ease-out"
        style={{
          width: "100%",
          animation: "loading-bar 1.5s infinite linear",
        }}
      />

      <div className="relative flex flex-col items-center">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/icon-diskominfo.png"
              alt="Logo Kominfo"
              className="h-10 w-10 animate-pulse"
            />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#00A5EC] border-t-transparent animate-spin"></div>
        </div>

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