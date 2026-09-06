import { useEffect, useRef, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  Lock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import BadgeSimpan from "./admin/landing/BadgeSimpan";
import useAutoSimpanBaris from "../../utils/useAutoSimpanBaris";
import {
  getMenuLanding,
  updateMenuLanding,
  urutkanMenuLanding,
} from "../../services/adminService";

const KelolaMenuLanding = ({ onNotif, isDark }) => {
  const [menu, setMenu] = useState(null); // null = belum termuat
  const [versi, setVersi] = useState(0);

  const notifRef = useRef(onNotif);
  useEffect(() => {
    notifRef.current = onNotif;
  });

  const loading = menu === null;
  const muatUlang = () => setVersi((v) => v + 1);

  const inputClass = `w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[10.5px] sm:text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-[#0d1117] text-slate-100 placeholder-slate-500 hover:border-white/20 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-4 focus:ring-[#00A5EC]/15"
      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  const labelClass =
    "flex items-center gap-1 sm:gap-1.5 text-[7.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 before:h-1 before:w-1 before:rounded-full before:bg-[#00A5EC]/70 before:content-['']";

  // ── SIMPAN OTOMATIS per menu ──
  const { status, jadwalkan } = useAutoSimpanBaris(async (m) => {
    try {
      await updateMenuLanding(m.id, {
        label: m.label,
        label_footer: m.label_footer || "",
        tampil_navbar: !!m.tampil_navbar,
        tampil_footer: !!m.tampil_footer,
      });
    } catch (err) {
      notifRef.current("error", err.response?.data?.message || "Gagal menyimpan perubahan menu");
      throw err;
    }
    notifRef.current("sukses", "Perubahan menu tersimpan");
  });

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

  const ubahBaris = (id, key, value) => {
    const baru = menu.map((m) => (m.id === id ? { ...m, [key]: value } : m));
    setMenu(baru);
    jadwalkan(id, baru.find((m) => m.id === id));
  };

  const geser = async (index, arah) => {
    const tujuan = index + arah;
    if (tujuan < 0 || tujuan >= menu.length) return;

    const baru = [...menu];
    [baru[index], baru[tujuan]] = [baru[tujuan], baru[index]];
    setMenu(baru);

    try {
      await urutkanMenuLanding(baru.map((m) => m.id));
      onNotif("sukses", "Urutan menu berhasil diperbarui");
    } catch {
      onNotif("error", "Gagal menyimpan urutan menu");
      muatUlang();
    }
  };

  // Sakelar kecil untuk navbar/footer
  const SakelarKecil = ({ nyala, onKlik, labelMobile, labelDesktop }) => (
    <button
      type="button"
      onClick={onKlik}
      className={`group/sw flex flex-1 min-w-0 cursor-pointer items-center justify-start gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition-all duration-200 active:scale-95 ${
        nyala
          ? isDark
            ? "border-[#00A5EC]/40 bg-[#00A5EC]/10 text-sky-300 shadow-sm"
            : "border-[#00A5EC]/40 bg-[#00A5EC]/[0.08] text-[#004F9F] shadow-sm"
          : isDark
          ? "border-white/10 bg-[#0d1117] text-slate-400 hover:border-white/20"
          : "border-slate-200 bg-slate-50/70 text-slate-400 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <span
        className={`relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ${
          nyala
            ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC]"
            : isDark
            ? "bg-white/15"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            nyala ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span className="truncate">
        <span className="sm:hidden">{labelMobile}</span>
        <span className="hidden sm:inline">{labelDesktop}</span>
      </span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat menu navigasi…
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-5 sm:py-4 text-[9.5px] sm:text-xs leading-relaxed ${
          isDark
            ? "border-[#00A5EC]/25 bg-[#00A5EC]/10 text-slate-300"
            : "border-sky-200 bg-gradient-to-r from-sky-50 to-white text-sky-700"
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#00A5EC]" strokeWidth={2.4} />
        <span>
          <b>Catatan keamanan:</b> tujuan (alamat) setiap menu dikunci oleh sistem dan tidak
          bisa diubah, agar tidak pernah muncul halaman error. Anda hanya dapat mengubah
          tulisan menu, urutannya, serta menampilkan atau menyembunyikannya. Semua perubahan{" "}
          <b>tersimpan otomatis</b>.
        </span>
      </div>

      {menu.map((m, i) => (
        <div
          key={m.id}
          className={`group/menu relative overflow-hidden rounded-xl sm:rounded-3xl border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg ${
            isDark
              ? "border-white/10 bg-[#161b22] hover:border-[#00A5EC]/25"
              : "border-slate-200/80 bg-white hover:border-[#00A5EC]/35"
          }`}
        >
          {/* garis aksen kiri */}
          <span
            className={`absolute inset-y-0 left-0 w-1 transition-colors duration-300 ${
              m.tampil_navbar || m.tampil_footer
                ? "bg-gradient-to-b from-[#004F9F] to-[#00A5EC]"
                : "bg-slate-200 dark:bg-white/10"
            }`}
          />

          <div className="flex items-start gap-2 sm:gap-3.5 pl-1 sm:pl-2">
            {/* penggeser urutan */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 pt-0.5 sm:pt-1">
              <button
                onClick={() => geser(i, -1)}
                disabled={i === 0}
                className={`flex h-5.5 w-5.5 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-md sm:rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-25 ${
                  isDark
                    ? "bg-white/5 text-slate-400 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
                    : "bg-slate-100 text-slate-400 hover:bg-[#00A5EC]/10 hover:text-[#004F9F]"
                }`}
              >
                <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
              </button>
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center text-slate-400">
                <GripVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} />
              </span>
              <button
                onClick={() => geser(i, 1)}
                disabled={i === menu.length - 1}
                className={`flex h-5.5 w-5.5 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-md sm:rounded-lg transition-all duration-200 hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-25 ${
                  isDark
                    ? "bg-white/5 text-slate-400 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
                    : "bg-slate-100 text-slate-400 hover:bg-[#00A5EC]/10 hover:text-[#004F9F]"
                }`}
              >
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded-md sm:rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wide text-white">
                  {m.kode}
                </span>
                <span
                  className={`rounded-md sm:rounded-lg border px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10.5px] ${
                    isDark ? "border-white/10 bg-[#0d1117] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {m.path}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg border px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wide ${
                    isDark ? "border-white/10 bg-[#0d1117] text-slate-400" : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                  Terkunci
                </span>
                <BadgeSimpan status={status[m.id]} isDark={isDark} />
              </div>

              <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Tulisan di Navbar</label>
                  <input
                    className={`mt-0.5 sm:mt-1.5 ${inputClass}`}
                    value={m.label || ""}
                    onChange={(e) => ubahBaris(m.id, "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tulisan di Footer</label>
                  <input
                    className={`mt-0.5 sm:mt-1.5 ${inputClass}`}
                    value={m.label_footer || ""}
                    onChange={(e) => ubahBaris(m.id, "label_footer", e.target.value)}
                    placeholder="Kosongkan untuk memakai tulisan Navbar"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <SakelarKecil
                  nyala={!!m.tampil_navbar}
                  onKlik={() => ubahBaris(m.id, "tampil_navbar", !m.tampil_navbar)}
                  labelMobile="Navbar"
                  labelDesktop="Tampil di Navbar"
                />
                <SakelarKecil
                  nyala={!!m.tampil_footer}
                  onKlik={() => ubahBaris(m.id, "tampil_footer", !m.tampil_footer)}
                  labelMobile="Footer"
                  labelDesktop="Tampil di Footer"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KelolaMenuLanding;