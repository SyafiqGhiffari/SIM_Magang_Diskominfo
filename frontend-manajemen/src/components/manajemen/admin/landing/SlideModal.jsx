import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Loader2,
  Eye,
  Images,
  ImagePlus,
  Sparkles,
  Info,
} from "lucide-react";
import DropZoneGambar from "./DropZoneGambar";
import Sakelar from "./Sakelar";
import StatusSimpan from "./StatusSimpan";
import useAutoSimpan from "../../../../utils/useAutoSimpan";
import {
  createHeroSlide,
  updateHeroSlide,
} from "../../../../services/adminService";

const FORM_KOSONG = {
  id: null,
  judul: "",
  url_gambar: "",
  urutan: 0,
  is_active: true,
  file: null,
  namaFile: "",
  pratinjauLokal: "",
  pratinjauAwal: "",
};

/** Mengubah nilai form menjadi FormData yang diterima backend. */
const rakitFormData = (f) => {
  const fd = new FormData();
  fd.append("judul", f.judul);
  fd.append("url_gambar", f.url_gambar);
  fd.append("urutan", String(f.urutan || 0));
  fd.append("is_active", f.is_active ? "true" : "false");
  if (f.file) fd.append("file", f.file);
  return fd;
};

/** Menyiapkan isi awal form dari data slide yang dipilih. */
const petakanSlide = (s) =>
  s
    ? {
        ...FORM_KOSONG,
        id: s.id,
        judul: s.judul || "",
        url_gambar: s.url_gambar || "",
        urutan: s.urutan || 0,
        is_active: !!s.is_active,
        pratinjauAwal: s.pratinjau || "",
      }
    : FORM_KOSONG;

/**
 * Modal tambah / edit slide hero.
 *
 * - Mode edit  : setiap perubahan tersimpan otomatis (tanpa tombol simpan).
 * - Mode tambah: memakai tombol "Tambah Slide", karena menambah data baru
 *   bukan termasuk menyimpan perubahan.
 *
 * Props:
 *  slide      : data slide yang diedit, atau null untuk mode tambah
 *  onTutup()  : menutup modal
 *  onSelesai(): memberi tahu induk agar memuat ulang daftar
 *  onNotif(jenis, pesan)
 */
const SlideModal = ({ slide, onTutup, onSelesai, onNotif, isDark }) => {
  const [form, setForm] = useState(() => petakanSlide(slide));
  const [menambah, setMenambah] = useState(false);

  const modeEdit = !!form.id;

  // ── Simpan otomatis, hanya aktif saat mengedit slide yang sudah ada ──
  const { status: statusSimpan, tandaiTersimpan } = useAutoSimpan(
    form,
    async (nilai) => {
      if (!nilai.id) return;
      try {
        await updateHeroSlide(nilai.id, rakitFormData(nilai));
      } catch (err) {
        onNotif("error", err.response?.data?.message || "Gagal menyimpan perubahan slide");
        throw err;
      }
      onSelesai();
      onNotif("sukses", "Perubahan slide tersimpan");
    },
    { aktif: modeEdit }
  );

  // Isi awal jangan dianggap sebagai perubahan yang perlu disimpan.
  useEffect(() => {
    tandaiTersimpan(petakanSlide(slide));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tutup dengan tombol Esc, sama seperti modal lain di aplikasi.
  useEffect(() => {
    const saatTekan = (e) => {
      if (e.key === "Escape") onTutup();
    };
    document.addEventListener("keydown", saatTekan);
    return () => document.removeEventListener("keydown", saatTekan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ubah = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pilihBerkas = (file) => {
    setForm((f) => ({
      ...f,
      file,
      namaFile: file?.name || "",
      pratinjauLokal: file ? URL.createObjectURL(file) : "",
    }));
  };

  const tambahSlide = async () => {
    if (!form.file && !form.url_gambar.trim()) {
      onNotif("error", "Unggah gambar atau isi tautan gambar terlebih dahulu");
      return;
    }
    setMenambah(true);
    try {
      await createHeroSlide(rakitFormData(form));
      onSelesai();
      onNotif("sukses", "Slide berhasil ditambahkan");
      onTutup();
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menambahkan slide");
      setMenambah(false);
    }
  };

  const inputClass = `mt-1.5 w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/20"
      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-300 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  const labelClass =
    "flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-slate-400 before:h-1 before:w-1 before:rounded-full before:bg-[#00A5EC]/70 before:content-['']";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md animate-[backdropFade_0.25s_ease-out]"
      onClick={onTutup}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl ring-1 animate-[modalFadeUp_0.3s_ease-out] ${
          isDark ? "bg-[#0f172a] ring-white/10" : "bg-white ring-slate-900/5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl" />
          <Images
            className="pointer-events-none absolute right-16 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.06]"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-md">
                {modeEdit ? (
                  <Pencil className="h-5 w-5 text-white" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-white" />
                )}
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC]">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  {modeEdit ? "Perbarui Data" : "Data Baru"}
                </div>
                <h3 className="truncate text-base font-black leading-tight text-white">
                  {modeEdit ? "Edit Slide" : "Tambah Slide"}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-white/60">
                  Gambar latar bagian hero halaman utama
                </p>
              </div>
            </div>
            <button
              onClick={onTutup}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div
          className={`flex-1 space-y-5 overflow-y-auto p-6 ${
            isDark ? "bg-[#0f172a]" : "bg-slate-50/40"
          }`}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className={labelClass}>Judul / Keterangan</label>
              <input
                autoFocus
                className={inputClass}
                value={form.judul}
                onChange={(e) => ubah("judul", e.target.value)}
                placeholder="Misal: Suasana Kantor Diskominfo"
              />
            </div>
            <div>
              <label className={labelClass}>Urutan</label>
              <input
                type="number"
                className={inputClass}
                value={form.urutan}
                onChange={(e) => ubah("urutan", Number(e.target.value))}
              />
            </div>
          </div>

          <DropZoneGambar
            judul="Gambar Slide"
            ket="JPG, PNG, WEBP, atau SVG. Gambar lama slide ini otomatis diganti."
            url={form.pratinjauLokal || form.pratinjauAwal || ""}
            accept=".jpg,.jpeg,.png,.webp,.svg"
            maksMb={5}
            rasio="h-52"
            onPilih={pilihBerkas}
            onHapus={
              form.pratinjauLokal
                ? () =>
                    setForm((f) => ({
                      ...f,
                      file: null,
                      namaFile: "",
                      pratinjauLokal: "",
                    }))
                : null
            }
            isDark={isDark}
          />

          <div>
            <label className={labelClass}>Atau Tautan Gambar (URL)</label>
            <input
              className={inputClass}
              value={form.url_gambar}
              onChange={(e) => ubah("url_gambar", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <Sakelar
            nyala={form.is_active}
            onUbah={(v) => ubah("is_active", v)}
            judul="Tampilkan slide ini"
            ket="Slide yang dimatikan tidak muncul di halaman publik."
            ikon={Eye}
            isDark={isDark}
          />

          {!modeEdit && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#004F9F]/15 bg-[#004F9F]/[0.04] px-3.5 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#004F9F]/10 text-[#004F9F]">
                <Info className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                Setelah slide ditambahkan, setiap perubahan berikutnya akan{" "}
                <span className="font-bold text-[#0B1442]">tersimpan otomatis</span>.
              </p>
            </div>
          )}
        </div>

        {/* ================= Footer ================= */}
        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-t px-6 py-4 ${
            isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-white"
          }`}
        >
          {modeEdit ? (
            <>
              <StatusSimpan status={statusSimpan} isDark={isDark} />
              <button
                onClick={onTutup}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                Selesai
              </button>
            </>
          ) : (
            <>
              <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
                Tekan
                <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[9.5px] font-bold text-slate-500">
                  Esc
                </kbd>
                untuk membatalkan
              </p>
              <button
                onClick={tambahSlide}
                disabled={menambah}
                className="group/tambah relative inline-flex shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0B1442]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover/tambah:translate-x-full" />
                {menambah ? (
                  <Loader2 className="relative h-4 w-4 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Plus className="relative h-4 w-4" strokeWidth={2.8} />
                )}
                <span className="relative">
                  {menambah ? "Menambahkan…" : "Tambah Slide"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideModal;