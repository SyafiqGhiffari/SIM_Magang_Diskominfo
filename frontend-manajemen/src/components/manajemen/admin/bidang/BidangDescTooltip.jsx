import { useRef, useState } from "react";
import { createPortal } from "react-dom";

const BidangDescTooltip = ({ text, isDark }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);

  const calculatePosition = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const tooltipWidth = 256; // w-64
    let left = rect.left + window.scrollX;
    // Cegah tooltip keluar dari tepi kanan layar
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16;
    }
    setPosition({ top: rect.top + window.scrollY - 8, left });
  };

  const handleEnter = () => {
    calculatePosition();
    setVisible(true);
  };

  if (!text) {
    return <p className={`text-[11px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>-</p>;
  }

  return (
    <div
      ref={wrapperRef}
      className="max-w-full cursor-help"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <p className={`text-[11px] line-clamp-2 leading-relaxed break-words ${isDark ? "text-slate-400" : "text-slate-500"}`}>{text}</p>

      {visible &&
        createPortal(
          <div
            style={{ position: "absolute", top: position.top, left: position.left, zIndex: 9999, transform: "translateY(-100%)" }}
            className="pointer-events-none"
          >
            <div
              className={`w-64 max-w-[calc(100vw-2rem)] rounded-xl border p-3 text-[11px] leading-relaxed shadow-xl animate-[fadeslide_0.15s_ease-out] ${
                isDark
                  ? "border-white/10 bg-[#161b22] text-slate-300 shadow-black/50"
                  : "border-slate-200 bg-white text-slate-600 shadow-slate-200"
              }`}
            >
              {text}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default BidangDescTooltip;