import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Info, Sparkles, CheckCircle2, Trash2 } from "lucide-react";

// Satu butir menu. Didefinisikan di luar komponen utama agar React tidak
// membuat ulang jenis komponennya pada setiap render.
const Butir = ({ onClick, ikon: Ikon, judul, ket, latar, chip, warnaJudul }) => (
  <button
    onClick={onClick}
    className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer ${latar}`}
  >
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6 ${chip}`}>
      <Ikon className="w-3.5 h-3.5" />
    </span>
    <div className="min-w-0">
      <p className={`text-xs font-bold ${warnaJudul}`}>{judul}</p>
      <p className="text-[10px] text-slate-400 whitespace-nowrap">{ket}</p>
    </div>
  </button>
);

/**
 * Menu aksi baris tabel Pertanyaan Masuk.
 * Disusun mengikuti pola FaqActionsDropdown agar kedua halaman seragam.
 * Props:
 *  - sudahSelesai : menyembunyikan butir "Tandai selesai" bila bernilai true
 *  - onDetail / onJadikanFaq / onSelesai / onHapus : () => void
 */
const PertanyaanActionsDropdown = ({ sudahSelesai = false, onDetail, onJadikanFaq, onSelesai, onHapus }) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 224;
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.right + window.scrollX - menuWidth,
    });
  };

  const handleCloseAnimated = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 150);
  };

  const handleToggle = () => {
    if (!open) {
      calculatePosition();
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      handleCloseAnimated();
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        handleCloseAnimated();
      }
    };
    const handleScroll = () => handleCloseAnimated();
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleAction = (fn) => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      fn?.();
    }, 150);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 ${
          open ? "border-[#004F9F]/40 bg-blue-50 text-[#004F9F] rotate-90" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <MoreVertical className="w-4 h-4 transition-transform duration-300" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "absolute", top: position.top, left: position.left, zIndex: 9999, transformOrigin: "top right" }}
            className={`w-56 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200 ${
              visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2"
            }`}
          >
            <Butir
              onClick={() => handleAction(onDetail)}
              ikon={Info}
              judul="Lihat detail"
              ket="Isi lengkap dan riwayatnya"
              latar="bg-slate-50/60 hover:bg-slate-100/70"
              chip="bg-slate-200 text-slate-600"
              warnaJudul="text-[#0B1442]"
            />

            <div className="border-t border-slate-100" />

            <Butir
              onClick={() => handleAction(onJadikanFaq)}
              ikon={Sparkles}
              judul="Jadikan FAQ"
              ket="Simpan sebagai jawaban otomatis"
              latar="bg-blue-50/40 hover:bg-blue-50/70"
              chip="bg-blue-100 text-[#004F9F]"
              warnaJudul="text-[#0B1442]"
            />

            {!sudahSelesai && (
              <>
                <div className="border-t border-slate-100" />
                <Butir
                  onClick={() => handleAction(onSelesai)}
                  ikon={CheckCircle2}
                  judul="Tandai selesai"
                  ket="Pertanyaan sudah ditangani"
                  latar="bg-emerald-50/40 hover:bg-emerald-50/70"
                  chip="bg-emerald-100 text-emerald-600"
                  warnaJudul="text-emerald-700"
                />
              </>
            )}

            <div className="border-t border-slate-100" />

            <Butir
              onClick={() => handleAction(onHapus)}
              ikon={Trash2}
              judul="Hapus pertanyaan"
              ket="Hapus permanen dari sistem"
              latar="bg-red-50/40 hover:bg-red-50/70"
              chip="bg-red-100 text-red-600"
              warnaJudul="text-red-700"
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default PertanyaanActionsDropdown;