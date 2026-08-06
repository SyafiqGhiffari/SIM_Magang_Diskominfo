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

  const cardClass = `relative space-y-5 overflow-hidden rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${
    isDark
      ? "border-white/10 bg-gradient-to-b from-[#111c33] to-[#0f172a] hover:border-[#00A5EC]/25"
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
    <div className="space-y-6">
      <div className={cardClass}>
        <KepalaKartu
          icon={Images}
          judul="Slide Gambar Hero"
          sub="Gambar berganti otomatis setiap 5 detik. Urutan terkecil tampil lebih dulu."
          isDark={isDark}
          aksi={
            <div className="flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004F9F] to-[#00A5EC] px-3 py-1.5 text-[11px] font-black text-white shadow-sm sm:inline-flex">
                {slides.length} slide
              </span>
              <button
                onClick={() => setModal({ slide: null })}
                className="group/tambah relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-2 text-[11.5px] font-black text-white shadow-md shadow-[#0B1442]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover/tambah:translate-x-full" />
                <Plus className="relative h-3.5 w-3.5" strokeWidth={3} />
                <span className="relative">Tambah Slide</span>
              </button>
            </div>
          }
        />

        {slides.length === 0 ? (
          <button
            onClick={() => setModal({ slide: null })}
            className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center transition-all duration-300 ${
              isDark
                ? "border-white/10 text-slate-500 hover:border-[#00A5EC]/40 hover:bg-white/[0.03]"
                : "border-slate-200 text-slate-400 hover:border-[#00A5EC]/45 hover:bg-[#00A5EC]/[0.03]"
            }`}
          >
            <ImagePlus className="h-7 w-7" strokeWidth={1.8} />
            <span className="text-sm font-bold">Belum ada slide</span>
            <span className="text-xs">Klik di sini untuk menambahkan gambar pertama Anda.</span>
          </button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((s) => (
              <div
                key={s.id}
                className={`group/slide relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                  {s.pratinjau ? (
                    <img
                      src={s.pratinjau}
                      alt={s.judul}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/slide:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Tanpa gambar
                    </div>
                  )}

                  {/* lapisan gelap + tombol aksi */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-[#0B1442]/85 via-[#0B1442]/25 to-transparent opacity-0 transition-opacity duration-300 group-hover/slide:opacity-100">
                    <button
                      onClick={() => setModal({ slide: s })}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-[11.5px] font-black text-[#0B1442] shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.6} />
                      Edit
                    </button>
                    <button
                      onClick={() => hapus(s)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500/95 px-3 py-1.5 text-[11.5px] font-black text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.6} />
                      Hapus
                    </button>
                  </div>

                  {/* status tampil */}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur ${
                      s.is_active
                        ? "bg-emerald-500/90 text-white"
                        : "bg-slate-700/80 text-slate-200"
                    }`}
                  >
                    {s.is_active ? (
                      <Eye className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <EyeOff className="h-3 w-3" strokeWidth={3} />
                    )}
                    {s.is_active ? "Tampil" : "Disembunyikan"}
                  </span>

                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#0B1442] shadow-sm">
                    #{s.urutan}
                  </span>
                </div>

                <div className="p-3.5">
                  <p
                    className={`truncate text-[13px] font-black tracking-tight ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    {s.judul || "Tanpa judul"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    Urutan tampil ke-{s.urutan}
                  </p>
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