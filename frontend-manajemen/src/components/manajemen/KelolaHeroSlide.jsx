import { useEffect, useState } from "react";
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} from "../../services/adminService";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

const FORM_KOSONG = { id: null, judul: "", url_gambar: "", urutan: 0, is_active: true, file: null };

const KelolaHeroSlide = ({ onNotif }) => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [versi, setVersi] = useState(0);
  const [form, setForm] = useState(FORM_KOSONG);
  const [saving, setSaving] = useState(false);

  const muatUlang = () => setVersi((v) => v + 1);

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
  }, [versi]);

  const ubah = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const simpan = async () => {
    if (!form.file && !form.url_gambar.trim()) {
      onNotif("error", "Unggah gambar atau isi tautan gambar terlebih dahulu");
      return;
    }

    const fd = new FormData();
    fd.append("judul", form.judul);
    fd.append("url_gambar", form.url_gambar);
    fd.append("urutan", String(form.urutan || 0));
    fd.append("is_active", form.is_active ? "true" : "false");
    if (form.file) fd.append("file", form.file);

    setSaving(true);
    try {
      if (form.id) await updateHeroSlide(form.id, fd);
      else await createHeroSlide(fd);
      setForm(FORM_KOSONG);
      muatUlang();
      onNotif("sukses", form.id ? "Slide berhasil diperbarui" : "Slide berhasil ditambahkan");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menyimpan slide");
    } finally {
      setSaving(false);
    }
  };

  const hapus = async (s) => {
    if (!window.confirm(`Hapus slide "${s.judul || "tanpa judul"}"?`)) return;
    try {
      await deleteHeroSlide(s.id);
      if (form.id === s.id) setForm(FORM_KOSONG);
      muatUlang();
      onNotif("sukses", "Slide berhasil dihapus");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menghapus slide");
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Memuat slide…</div>;

  return (
    <div className="space-y-6">
      {/* Daftar slide */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-700">Slide Gambar Hero</h3>
        <p className="mt-1 text-xs text-slate-500">
          Gambar berganti otomatis setiap 5 detik di latar belakang Hero. Urutan terkecil tampil lebih dulu.
        </p>

        {slides.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Belum ada slide.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="h-28 w-full bg-slate-100">
                  {s.pratinjau && (
                    <img src={s.pratinjau} alt={s.judul} className="h-28 w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {s.judul || "Tanpa judul"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Urutan: {s.urutan}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        setForm({
                          id: s.id,
                          judul: s.judul || "",
                          url_gambar: s.url_gambar || "",
                          urutan: s.urutan || 0,
                          is_active: !!s.is_active,
                          file: null,
                        })
                      }
                      className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => hapus(s)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form tambah / edit */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-700">
          {form.id ? "Edit Slide" : "Tambah Slide Baru"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Judul / Keterangan</label>
            <input
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

        <div>
          <label className={labelClass}>Unggah Gambar (maks. 5 MB)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.svg"
            className={inputClass}
            onChange={(e) => ubah("file", e.target.files?.[0] || null)}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Mengunggah gambar baru akan otomatis menghapus gambar lama slide ini.
          </p>
        </div>

        <div>
          <label className={labelClass}>Atau Tautan Gambar (URL)</label>
          <input
            className={inputClass}
            value={form.url_gambar}
            onChange={(e) => ubah("url_gambar", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => ubah("is_active", e.target.checked)}
          />
          <span className="text-sm font-semibold text-slate-700">Tampilkan slide ini</span>
        </label>

        <div className="flex justify-end gap-2">
          {form.id && (
            <button
              onClick={() => setForm(FORM_KOSONG)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
          )}
          <button
            onClick={simpan}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Tambah Slide"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KelolaHeroSlide;