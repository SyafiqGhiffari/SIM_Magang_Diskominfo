import { useEffect, useRef, useState } from "react";
import {
  getMenuLanding,
  updateMenuLanding,
  urutkanMenuLanding,
} from "../../services/adminService";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

const KelolaMenuLanding = ({ onNotif }) => {
  const [menu, setMenu] = useState(null); // null = belum termuat
  const [versi, setVersi] = useState(0);

  const notifRef = useRef(onNotif);
  useEffect(() => {
    notifRef.current = onNotif;
  });

  const loading = menu === null;
  const muatUlang = () => setVersi((v) => v + 1);

  useEffect(() => {
    let aktif = true;

    getMenuLanding()
      .then((res) => {
        if (aktif) setMenu(res.data.data || []);
      })
      .catch(() => {
        if (!aktif) return;
        setMenu([]);
        notifRef.current("error", "Gagal memuat menu navigasi");
      });

    return () => {
      aktif = false;
    };
  }, [versi]);

  const ubahBaris = (id, key, value) =>
    setMenu((list) => list.map((m) => (m.id === id ? { ...m, [key]: value } : m)));

  const simpanBaris = async (m) => {
    try {
      await updateMenuLanding(m.id, {
        label: m.label,
        label_footer: m.label_footer || "",
        tampil_navbar: !!m.tampil_navbar,
        tampil_footer: !!m.tampil_footer,
      });
      onNotif("sukses", "Menu berhasil disimpan");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menyimpan menu");
    }
  };

  const geser = async (index, arah) => {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= menu.length) return;

    const baru = [...menu];
    [baru[index], baru[tujuan]] = [baru[tujuan], baru[index]];
    setMenu(baru);

    try {
      await urutkanMenuLanding(baru.map((m) => m.id));
    } catch {
      onNotif("error", "Gagal menyimpan urutan menu");
      muatUlang();
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Memuat menu navigasi…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <b>Catatan keamanan:</b> tujuan (alamat) setiap menu dikunci oleh sistem dan tidak
        bisa diubah, agar tidak pernah muncul halaman error. Anda hanya dapat mengubah
        tulisan menu, urutannya, serta menampilkan atau menyembunyikannya.
      </div>

      {menu.map((m, i) => (
        <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5">
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
                disabled={i === menu.length - 1}
                className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 disabled:opacity-30"
              >
                ▼
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {m.kode}
                </span>
                <span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                  {m.path}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  terkunci
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Tulisan di Navbar</label>
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={m.label || ""}
                    onChange={(e) => ubahBaris(m.id, "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tulisan di Footer</label>
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={m.label_footer || ""}
                    onChange={(e) => ubahBaris(m.id, "label_footer", e.target.value)}
                    placeholder="Kosongkan untuk memakai tulisan Navbar"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!m.tampil_navbar}
                      onChange={(e) => ubahBaris(m.id, "tampil_navbar", e.target.checked)}
                    />
                    Tampil di Navbar
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!m.tampil_footer}
                      onChange={(e) => ubahBaris(m.id, "tampil_footer", e.target.checked)}
                    />
                    Tampil di Footer
                  </label>
                </div>

                <button
                  onClick={() => simpanBaris(m)}
                  className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KelolaMenuLanding;