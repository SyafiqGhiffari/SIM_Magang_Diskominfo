import { useEffect, useState } from "react";
import {
  Images,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ImagePlus,
} from "lucide-react";
import KepalaKartu from "./admin/landing/KepalaKartu";
import SlideModal from "./admin/landing/SlideModal";
import { getHeroSlides, deleteHeroSlide } from "../../services/adminService";
import { confirmDialog } from "../../utils/swal";

const KelolaHeroSlide = ({ onNotif, isDark }) => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [versi, setVersi] = useState(0);

  // null = modal tertutup, { slide: null } = tambah, { slide: data } = edit
  const [modal, setModal] = useState(null);

  const muatUlang = () => setVersi((v) => v + 1);

  const cardClass = `relative space-y-3 sm:space-y-5 overflow-hidden rounded-xl sm:rounded-3xl border p-3 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${
    isDark
      ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/25"
      : "border-slate-200/80 bg-white hover:border-[#00A5EC]/35"
  }`;

  useEffect(() => {
    let aktif = true;
    const ambil = async () => {
      try {
        const res = await getHeroSlides();
        if (aktif) setSlides(res.data.data || []);
      } catch {
        if (aktif) onNotif("error", "Gagal memuat daftar slide");
      } finally {
        if (aktif) setLoading(false);
      }
    };
    ambil();
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versi]);

  const hapus = async (s) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus slide ini?",
      text: `Slide "${s.judul || "tanpa judul"}" akan dihapus permanen dari daftar.`,
      confirmText: "Ya, hapus",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;
    try {
      await deleteHeroSlide(s.id);
      muatUlang();
      onNotif("sukses", "Slide berhasil dihapus");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menghapus slide");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat slide…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={cardClass}>
        <KepalaKartu
          icon={Images}
          judul="Slide Gambar Hero"
          sub="Berganti otomatis tiap 5 detik"
          isDark={isDark}
          aksi={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-white shadow-sm sm:inline-flex">
                {slides.length} slide
              </span>
              <button
                onClick={() => setModal({ slide: null })}
                className="group/tambah relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-3 py-1.5 sm:px-4 sm:py-2 text-[10.5px] sm:text-[11.5px] font-black text-white shadow-md shadow-[#0B1442]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover/tambah:translate-x-full" />
                <Plus className="relative h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
                <span className="relative">
                  <span className="inline sm:hidden">Tambah</span>
                  <span className="hidden sm:inline">Tambah Slide</span>
                </span>
              </button>
            </div>
          }
        />

        {slides.length === 0 ? (
          <button
            onClick={() => setModal({ slide: null })}
            className={`flex w-full cursor-pointer flex-col items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-dashed px-4 py-8 sm:px-6 sm:py-12 text-center transition-all duration-300 ${
              isDark
                ? "border-white/10 text-slate-500 hover:border-[#00A5EC]/40 hover:bg-white/[0.03]"
                : "border-slate-200 text-slate-400 hover:border-[#00A5EC]/45 hover:bg-[#00A5EC]/[0.03]"
            }`}
          >
            <ImagePlus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} />
            <span className="text-xs sm:text-sm font-bold">Belum ada slide</span>
            <span className="text-[10px] sm:text-xs">Klik di sini untuk menambahkan gambar pertama Anda.</span>
          </button>
        ) : (
          <div className="grid gap-2.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((s) => (
              <div
                key={s.id}
                className={`group/slide relative overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-md sm:hover:shadow-xl ${
                  isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div className={`relative h-28 sm:h-36 w-full overflow-hidden ${isDark ? "bg-[#0d1117]" : "bg-slate-100"}`}>
                  {s.pratinjau ? (
                    <img
                      src={s.pratinjau}
                      alt={s.judul}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/slide:scale-105 sm:group-hover/slide:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] sm:text-xs text-slate-400">
                      Tanpa gambar
                    </div>
                  )}

                  {/* lapisan gelap + tombol aksi (khusus desktop saat di-hover) */}
                  <div className="hidden sm:flex absolute inset-0 items-center justify-center gap-2 bg-gradient-to-t from-[#0B1442]/85 via-[#0B1442]/25 to-transparent opacity-0 transition-opacity duration-300 group-hover/slide:opacity-100 backdrop-blur-[1px]">
                    <button
                      onClick={() => setModal({ slide: s })}
                      className="group/btn inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-[11.5px] font-black text-[#0B1442] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#004F9F] transition-transform duration-300 group-hover/btn:rotate-12" strokeWidth={2.6} />
                      Edit
                    </button>
                    <button
                      onClick={() => hapus(s)}
                      className="group/btn inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500/95 px-3 py-1.5 text-[11.5px] font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-red-600 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110" strokeWidth={2.6} />
                      Hapus
                    </button>
                  </div>

                  {/* status tampil */}
                  <span
                    className={`absolute left-2 top-2 sm:left-3 sm:top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur ${
                      s.is_active
                        ? "bg-emerald-600/90 text-white"
                        : isDark
                        ? "bg-slate-800/90 text-slate-300 border border-white/10"
                        : "bg-slate-700/80 text-slate-200"
                    }`}
                  >
                    {s.is_active ? (
                      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                    ) : (
                      <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                    )}
                    {s.is_active ? "Tampil" : "Disembunyikan"}
                  </span>

                  <span
                    className={`absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full px-1.5 py-0.5 sm:px-2 text-[8.5px] sm:text-[10px] font-black shadow-sm ${
                      isDark
                        ? "bg-[#161b22]/90 text-slate-200 border border-white/10"
                        : "bg-white/90 text-[#0B1442]"
                    }`}
                  >
                    #{s.urutan}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[11px] sm:text-[13px] font-black tracking-tight ${
                          isDark ? "text-slate-100" : "text-[#0B1442]"
                        }`}
                      >
                        {s.judul || "Tanpa judul"}
                      </p>
                      <p className={`mt-0.5 text-[9px] sm:text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                        Urutan tampil ke-{s.urutan}
                      </p>
                    </div>
                  </div>

                  {/* Tombol aksi khusus mobile di bawah info slide (tidak memakai hover) */}
                  <div className="mt-2 flex items-center justify-end gap-1.5 sm:hidden border-t border-slate-100 dark:border-white/5 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal({ slide: s })}
                      className={`group/mbtn inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9.5px] font-bold border transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
                        isDark
                          ? "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-[#00A5EC]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:text-[#004F9F]"
                      }`}
                    >
                      <Pencil className="h-2.5 w-2.5 transition-transform duration-300 group-hover/mbtn:rotate-12" strokeWidth={2.6} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => hapus(s)}
                      className={`group/mbtn inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9.5px] font-bold border transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
                        isDark
                          ? "border-red-900/40 bg-red-950/40 text-red-400 hover:bg-red-900/60"
                          : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 className="h-2.5 w-2.5 transition-transform duration-300 group-hover/mbtn:rotate-12" strokeWidth={2.6} />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal tambah / edit ── */}
      {modal && (
        <SlideModal
          key={modal.slide?.id || "baru"}
          slide={modal.slide}
          isDark={isDark}
          onNotif={onNotif}
          onSelesai={muatUlang}
          onTutup={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default KelolaHeroSlide;