import { useEffect, useState } from "react";
import { Building2, ChevronDown, Eye, Info, Loader2 } from "lucide-react";
import BadgeSimpan from "./admin/landing/BadgeSimpan";
import EditorTeksKaya from "./admin/landing/EditorTeksKaya";
import Sakelar from "./admin/landing/Sakelar";
import useAutoSimpanBaris from "../../utils/useAutoSimpanBaris";
import { getTampilanBidang, updateTampilanBidang } from "../../services/adminService";

const KelolaTampilanBidang = ({ onNotif, isDark }) => {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buka, setBuka] = useState(null);

  const inputClass = `mt-0.5 sm:mt-1.5 w-full rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-4 sm:py-3 text-[10.5px] sm:text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-[#0d1117] text-slate-100 placeholder-slate-500 hover:border-white/20 focus:border-[#00A5EC] focus:bg-[#161b22] focus:ring-4 focus:ring-[#00A5EC]/15"
      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  const labelClass =
    "flex items-center gap-1 sm:gap-1.5 text-[7.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 before:h-1 before:w-1 before:rounded-full before:bg-[#00A5EC]/70 before:content-['']";

  // ── SIMPAN OTOMATIS per bidang ──
  const { status, jadwalkan } = useAutoSimpanBaris(async (b) => {
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
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menyimpan perubahan bidang");
      throw err;
    }
    onNotif("sukses", "Perubahan bidang tersimpan");
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ubahBaris = (id, key, value) => {
    const baru = daftar.map((b) => (b.id === id ? { ...b, [key]: value } : b));
    setDaftar(baru);
    jadwalkan(id, baru.find((b) => b.id === id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat data bidang…
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
        <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#00A5EC]" strokeWidth={2.4} />
        <span>
          Nama, kuota, dan status aktif bidang tetap dikelola di menu <b>Kelola Bidang</b>. Di
          sini Anda hanya mengatur bagaimana bidang tersebut <b>ditampilkan di landing page</b>.
          Semua perubahan <b>tersimpan otomatis</b>.
        </span>
      </div>

      {daftar.map((b) => {
        const terbuka = buka === b.id;
        return (
          <div
            key={b.id}
            className={`overflow-hidden rounded-xl sm:rounded-3xl border shadow-sm transition-all duration-300 ${
              terbuka
                ? isDark
                  ? "border-[#00A5EC]/50 shadow-lg shadow-[#00A5EC]/5"
                  : "border-[#00A5EC]/45 shadow-lg"
                : isDark
                ? "border-white/10 bg-[#161b22] hover:border-white/20"
                : "border-slate-200/80 bg-white hover:border-[#00A5EC]/35 hover:shadow-md"
            } ${isDark ? "bg-[#161b22]" : "bg-white"}`}
          >
            <button
              onClick={() => setBuka(terbuka ? null : b.id)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 sm:gap-3 px-3 py-2.5 sm:px-6 sm:py-5 text-left transition-colors duration-300 ${
                terbuka
                  ? isDark
                    ? "bg-white/[0.03]"
                    : "bg-gradient-to-r from-slate-50 to-white"
                  : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
                <span
                  className={`flex h-8.5 w-8.5 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl text-base sm:text-xl shadow-sm transition-transform duration-300 ${
                    terbuka ? "scale-105" : ""
                  } ${
                    isDark
                      ? "bg-[#0d1117] border border-white/10 text-slate-200"
                      : "bg-gradient-to-br from-slate-100 to-white ring-1 ring-slate-200/70"
                  }`}
                >
                  {b.icon || "🏢"}
                </span>
                <span className="min-w-0">
                  <span
                    className={`flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[14px] font-black tracking-tight ${
                      isDark ? "text-slate-100" : "text-[#0B1442]"
                    }`}
                  >
                    <span className="truncate">{b.nama}</span>
                    <BadgeSimpan status={status[b.id]} isDark={isDark} />
                  </span>
                  <span className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                    <span
                      className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide border ${
                        isDark
                          ? "bg-[#0d1117] text-slate-400 border-white/10"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      Urutan {b.urutan}
                    </span>
                    <span
                      className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide border ${
                        b.tampilkan_di_landing
                          ? isDark
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isDark
                          ? "bg-[#0d1117] text-slate-400 border-white/10"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      {b.tampilkan_di_landing ? "Tampil di landing" : "Disembunyikan"}
                    </span>
                  </span>
                </span>
              </span>

              <span
                className={`flex h-6.5 w-6.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-xl transition-all duration-300 ${
                  terbuka
                    ? "rotate-180 bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-sm"
                    : isDark
                    ? "bg-white/5 text-slate-400 hover:bg-white/10"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.6} />
              </span>
            </button>

            {/* Dropdown dengan transisi grid rows mulus */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                terbuka
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`space-y-2.5 sm:space-y-4 border-t p-3 sm:p-6 ${
                    isDark ? "border-white/10 bg-[#0d1117]/50" : "border-slate-100 bg-slate-50/30"
                  }`}
                >
                  <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-3">
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
                    <label className={labelClass}>
                      Deskripsi Panjang (halaman Program Magang)
                    </label>
                    <EditorTeksKaya
                      rows={3}
                      isDark={isDark}
                      nilai={b.deskripsi_panjang || ""}
                      onUbah={(v) => ubahBaris(b.id, "deskripsi_panjang", v)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Kompetensi - satu per baris</label>
                    <textarea
                      rows={4}
                      className={inputClass}
                      value={b.kompetensi || ""}
                      onChange={(e) => ubahBaris(b.id, "kompetensi", e.target.value)}
                      placeholder={"Manajemen database\nMonitoring jaringan"}
                    />
                  </div>

                  <Sakelar
                    nyala={!!b.tampilkan_di_landing}
                    onUbah={(v) => ubahBaris(b.id, "tampilkan_di_landing", v)}
                    judul="Tampilkan bidang ini di landing page"
                    ket="Kartu bidang akan muncul pada bagian Bidang Magang."
                    ikon={Building2}
                    isDark={isDark}
                  />

                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 text-[9px] sm:text-[11.5px] font-medium border ${
                      isDark
                        ? "border-white/10 bg-[#161b22] text-slate-400"
                        : "border-slate-200/70 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#00A5EC]" strokeWidth={2.4} />
                    Perubahan pada bidang ini tersimpan otomatis beberapa saat setelah Anda
                    berhenti mengetik.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KelolaTampilanBidang;