import { useEffect, useState } from "react";
import { getTampilanBidang, updateTampilanBidang } from "../../services/adminService";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

const KelolaTampilanBidang = ({ onNotif }) => {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [versi, setVersi] = useState(0);
  const [buka, setBuka] = useState(null);
  const [menyimpan, setMenyimpan] = useState(null);

  useEffect(() => {
    let aktif = true;
    const ambil = async () => {
      try {
        const res = await getTampilanBidang();
        if (aktif) setDaftar(res.data.data || []);
      } catch {
        if (aktif) onNotif("error", "Gagal memuat data bidang");
      } finally {
        if (aktif) setLoading(false);
      }
    };
    ambil();
    return () => {
      aktif = false;
    };
  }, [versi]);

  const ubahBaris = (id, key, value) =>
    setDaftar((list) => list.map((b) => (b.id === id ? { ...b, [key]: value } : b)));

  const simpanBaris = async (b) => {
    setMenyimpan(b.id);
    try {
      await updateTampilanBidang(b.id, {
        icon: b.icon || "",
        badge: b.badge || "",
        deskripsi_panjang: b.deskripsi_panjang || "",
        kompetensi: b.kompetensi || "",
        durasi: b.durasi || "",
        urutan: Number(b.urutan) || 0,
        tampilkan_di_landing: !!b.tampilkan_di_landing,
      });
      setVersi((v) => v + 1);
      onNotif("sukses", `Tampilan bidang "${b.nama}" berhasil disimpan`);
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menyimpan tampilan bidang");
    } finally {
      setMenyimpan(null);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Memuat data bidang…</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700">
        Nama, kuota, dan status aktif bidang tetap dikelola di menu <b>Kelola Bidang</b>. Di sini Anda
        hanya mengatur bagaimana bidang tersebut <b>ditampilkan di landing page</b>.
      </div>

      {daftar.map((b) => (
        <div key={b.id} className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setBuka(buka === b.id ? null : b.id)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">{b.icon || "🏢"}</span>
              <span>
                <span className="block text-sm font-bold text-slate-700">{b.nama}</span>
                <span className="block text-[11px] text-slate-400">
                  Urutan {b.urutan} · {b.tampilkan_di_landing ? "Tampil di landing" : "Disembunyikan"}
                </span>
              </span>
            </span>
            <span className="text-slate-400">{buka === b.id ? "▲" : "▼"}</span>
          </button>

          {buka === b.id && (
            <div className="space-y-4 border-t border-slate-100 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Ikon (emoji)</label>
                  <input
                    className={inputClass}
                    value={b.icon || ""}
                    onChange={(e) => ubahBaris(b.id, "icon", e.target.value)}
                    placeholder="💻"
                  />
                </div>
                <div>
                  <label className={labelClass}>Badge</label>
                  <input
                    className={inputClass}
                    value={b.badge || ""}
                    onChange={(e) => ubahBaris(b.id, "badge", e.target.value)}
                    placeholder="IT & Software"
                  />
                </div>
                <div>
                  <label className={labelClass}>Urutan</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={b.urutan || 0}
                    onChange={(e) => ubahBaris(b.id, "urutan", Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Durasi</label>
                <input
                  className={inputClass}
                  value={b.durasi || ""}
                  onChange={(e) => ubahBaris(b.id, "durasi", e.target.value)}
                  placeholder="Sesuai Kebutuhan Peserta"
                />
              </div>

              <div>
                <label className={labelClass}>Deskripsi Panjang (halaman Program Magang)</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={b.deskripsi_panjang || ""}
                  onChange={(e) => ubahBaris(b.id, "deskripsi_panjang", e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Kompetensi — satu per baris</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  value={b.kompetensi || ""}
                  onChange={(e) => ubahBaris(b.id, "kompetensi", e.target.value)}
                  placeholder={"Manajemen database\nMonitoring jaringan"}
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!b.tampilkan_di_landing}
                  onChange={(e) => ubahBaris(b.id, "tampilkan_di_landing", e.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">
                  Tampilkan bidang ini di landing page
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  onClick={() => simpanBaris(b)}
                  disabled={menyimpan === b.id}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {menyimpan === b.id ? "Menyimpan…" : "Simpan Bidang Ini"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KelolaTampilanBidang;