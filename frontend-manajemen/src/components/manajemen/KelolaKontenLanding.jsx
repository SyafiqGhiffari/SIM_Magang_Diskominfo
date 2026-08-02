import { useEffect, useRef, useState } from "react";
import {
  getKontenLanding,
  createKontenLanding,
  updateKontenLanding,
  deleteKontenLanding,
  urutkanKontenLanding,
} from "../../services/adminService";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

const JENIS = [
  { key: "persyaratan", label: "Persyaratan Umum", pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: true },
  { key: "dokumen", label: "Dokumen Wajib", pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: true },
  { key: "alur", label: "Alur Pendaftaran", pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false, labelIcon: "Nomor Langkah" },
  { key: "benefit", label: "Benefit Program", pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
  { key: "misi", label: "Misi Instansi", pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: false },
  { key: "tujuan", label: "Tujuan Program", pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
  { key: "keunggulan", label: "Keunggulan Program", pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
];

const KATEGORI = [
  { key: "umum", label: "Umum (semua pendaftar)" },
  { key: "mahasiswa", label: "Khusus Mahasiswa" },
  { key: "siswa", label: "Khusus Siswa" },
];

const FORM_KOSONG = { judul: "", deskripsi: "", icon: "", kategori: "umum" };

const KelolaKontenLanding = ({ onNotif }) => {
  const [jenis, setJenis] = useState("persyaratan");
  // simpan jenis + item dalam satu state supaya status "loading" bisa diturunkan
  const [data, setData] = useState({ jenis: null, items: [] });
  const [versi, setVersi] = useState(0);
  const [baru, setBaru] = useState(FORM_KOSONG);
  const [saving, setSaving] = useState(false);

  // callback notifikasi disimpan di ref agar tidak menjadi dependency effect
  const notifRef = useRef(onNotif);
  useEffect(() => {
    notifRef.current = onNotif;
  });

  const meta = JENIS.find((j) => j.key === jenis);
  const muatUlang = () => setVersi((v) => v + 1);

  // diturunkan dari state, BUKAN disimpan sebagai state tersendiri
  const loading = data.jenis !== jenis;
  const daftar = loading ? [] : data.items;

  // helper agar pemanggilan setDaftar(...) di bawah tetap sama seperti semula
  const setDaftar = (next) =>
    setData((prev) => ({
      ...prev,
      items: typeof next === "function" ? next(prev.items) : next,
    }));

  useEffect(() => {
    let aktif = true;

    getKontenLanding(jenis)
      .then((res) => {
        if (aktif) setData({ jenis, items: res.data.data || [] });
      })
      .catch(() => {
        if (!aktif) return;
        setData({ jenis, items: [] });
        notifRef.current("error", "Gagal memuat konten");
      });

    return () => {
      aktif = false;
    };
  }, [jenis, versi]);

  const ubahBaris = (id, key, value) =>
    setDaftar((list) => list.map((k) => (k.id === id ? { ...k, [key]: value } : k)));

  const simpanBaris = async (k) => {
    try {
      await updateKontenLanding(k.id, {
        judul: k.judul,
        deskripsi: k.deskripsi || "",
        icon: k.icon || "",
        kategori: k.kategori || "umum",
        is_active: !!k.is_active,
      });
      onNotif("sukses", "Konten berhasil disimpan");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menyimpan konten");
    }
  };

  const hapus = async (k) => {
    if (!window.confirm("Hapus item ini?")) return;
    try {
      await deleteKontenLanding(k.id);
      muatUlang();
      onNotif("sukses", "Item berhasil dihapus");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menghapus item");
    }
  };

  const tambah = async () => {
    if (!baru.judul.trim()) {
      onNotif("error", "Teks/judul tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      await createKontenLanding(jenis, baru);
      setBaru(FORM_KOSONG);
      muatUlang();
      onNotif("sukses", "Item berhasil ditambahkan");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menambahkan item");
    } finally {
      setSaving(false);
    }
  };

  const geser = async (index, arah) => {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= daftar.length) return;
    const baruUrut = [...daftar];
    [baruUrut[index], baruUrut[tujuan]] = [baruUrut[tujuan], baruUrut[index]];
    setDaftar(baruUrut);
    try {
      await urutkanKontenLanding(jenis, baruUrut.map((k) => k.id));
    } catch {
      onNotif("error", "Gagal menyimpan urutan");
      muatUlang();
    }
  };

  return (
    <div className="space-y-5">
      {/* Pemilih jenis konten */}
      <div className="flex flex-wrap gap-2">
        {JENIS.map((j) => (
          <button
            key={j.key}
            onClick={() => setJenis(j.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              jenis === j.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-500">Memuat konten…</div>
      ) : (
        <>
          {/* Daftar item */}
          <div className="space-y-3">
            {daftar.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
                Belum ada item untuk {meta.label}.
              </p>
            )}

            {daftar.map((k, i) => (
              <div key={k.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      onClick={() => geser(i, -1)}
                      disabled={i === 0}
                      className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => geser(i, 1)}
                      disabled={i === daftar.length - 1}
                      className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 md:grid-cols-4">
                      {meta.pakaiIcon && (
                        <div>
                          <label className={labelClass}>{meta.labelIcon || "Ikon"}</label>
                          <input
                            className={`mt-1 ${inputClass}`}
                            value={k.icon || ""}
                            onChange={(e) => ubahBaris(k.id, "icon", e.target.value)}
                          />
                        </div>
                      )}
                      <div className={meta.pakaiIcon ? "md:col-span-3" : "md:col-span-4"}>
                        <label className={labelClass}>
                          {meta.pakaiDeskripsi ? "Judul" : "Teks"}
                        </label>
                        <input
                          className={`mt-1 ${inputClass}`}
                          value={k.judul || ""}
                          onChange={(e) => ubahBaris(k.id, "judul", e.target.value)}
                        />
                      </div>
                    </div>

                    {meta.pakaiDeskripsi && (
                      <div>
                        <label className={labelClass}>Deskripsi</label>
                        <textarea
                          rows={2}
                          className={`mt-1 ${inputClass}`}
                          value={k.deskripsi || ""}
                          onChange={(e) => ubahBaris(k.id, "deskripsi", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        {meta.pakaiKategori && (
                          <select
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                            value={k.kategori || "umum"}
                            onChange={(e) => ubahBaris(k.id, "kategori", e.target.value)}
                          >
                            {KATEGORI.map((kt) => (
                              <option key={kt.key} value={kt.key}>
                                {kt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={!!k.is_active}
                            onChange={(e) => ubahBaris(k.id, "is_active", e.target.checked)}
                          />
                          Tampilkan
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => simpanBaris(k)}
                          className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => hapus(k)}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form tambah */}
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-5">
            <h4 className="text-sm font-bold text-slate-700">Tambah Item — {meta.label}</h4>

            <div className="grid gap-3 md:grid-cols-4">
              {meta.pakaiIcon && (
                <div>
                  <label className={labelClass}>{meta.labelIcon || "Ikon"}</label>
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={baru.icon}
                    onChange={(e) => setBaru((f) => ({ ...f, icon: e.target.value }))}
                    placeholder={meta.labelIcon ? "05" : "🎓"}
                  />
                </div>
              )}
              <div className={meta.pakaiIcon ? "md:col-span-3" : "md:col-span-4"}>
                <label className={labelClass}>{meta.pakaiDeskripsi ? "Judul" : "Teks"}</label>
                <input
                  className={`mt-1 ${inputClass}`}
                  value={baru.judul}
                  onChange={(e) => setBaru((f) => ({ ...f, judul: e.target.value }))}
                />
              </div>
            </div>

            {meta.pakaiDeskripsi && (
              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea
                  rows={2}
                  className={`mt-1 ${inputClass}`}
                  value={baru.deskripsi}
                  onChange={(e) => setBaru((f) => ({ ...f, deskripsi: e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {meta.pakaiKategori ? (
                <select
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  value={baru.kategori}
                  onChange={(e) => setBaru((f) => ({ ...f, kategori: e.target.value }))}
                >
                  {KATEGORI.map((kt) => (
                    <option key={kt.key} value={kt.key}>
                      {kt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
              <button
                onClick={tambah}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Tambah Item"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KelolaKontenLanding;