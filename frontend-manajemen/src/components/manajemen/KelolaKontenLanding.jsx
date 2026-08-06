import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Inbox,
  ClipboardCheck,
  FileText,
  Route,
  Gift,
  Target,
  Flag,
  Award,
  Users,
  GraduationCap,
  School,
  Eye,
  EyeOff,
} from "lucide-react";
import BadgeSimpan from "./admin/landing/BadgeSimpan";
import EditorTeksKaya from "./admin/landing/EditorTeksKaya";
import DropdownPilih from "./admin/landing/DropdownPilih";
import useAutoSimpanBaris from "../../utils/useAutoSimpanBaris";
import {
  getKontenLanding,
  createKontenLanding,
  updateKontenLanding,
  deleteKontenLanding,
  urutkanKontenLanding,
} from "../../services/adminService";
import { confirmDialog } from "../../utils/swal";

const JENIS = [
  { key: "persyaratan", label: "Persyaratan Umum", ikon: ClipboardCheck, pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: true },
  { key: "dokumen", label: "Dokumen Wajib", ikon: FileText, pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: true },
  { key: "alur", label: "Alur Pendaftaran", ikon: Route, pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false, labelIcon: "Nomor Langkah" },
  { key: "benefit", label: "Benefit Program", ikon: Gift, pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
  { key: "misi", label: "Misi Instansi", ikon: Target, pakaiDeskripsi: false, pakaiIcon: false, pakaiKategori: false },
  { key: "tujuan", label: "Tujuan Program", ikon: Flag, pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
  { key: "keunggulan", label: "Keunggulan Program", ikon: Award, pakaiDeskripsi: true, pakaiIcon: true, pakaiKategori: false },
];

const KATEGORI = [
  { key: "umum", label: "Umum", ket: "Tampil untuk semua pendaftar", ikon: Users },
  { key: "mahasiswa", label: "Khusus Mahasiswa", ket: "Hanya jenjang D3/D4/S1", ikon: GraduationCap },
  { key: "siswa", label: "Khusus Siswa", ket: "Hanya jenjang SMA/SMK/MA", ikon: School },
];

const FORM_KOSONG = { judul: "", deskripsi: "", icon: "", kategori: "umum" };

// rangka semu saat pemuatan pertama kali (bukan saat berpindah tab)
const RANGKA = [0, 1, 2];

const KelolaKontenLanding = ({ onNotif, isDark }) => {
  const [jenis, setJenis] = useState("persyaratan");
  // simpan jenis + item dalam satu state supaya data lama tetap tampil saat memuat
  const [data, setData] = useState({ jenis: null, items: [] });
  const [versi, setVersi] = useState(0);
  const [baru, setBaru] = useState(FORM_KOSONG);
  const [menambah, setMenambah] = useState(false);

  // callback notifikasi disimpan di ref agar tidak menjadi dependency effect
  const notifRef = useRef(onNotif);
  useEffect(() => {
    notifRef.current = onNotif;
  });

  const muatUlang = () => setVersi((v) => v + 1);

  // "meta" mengikuti data yang SEDANG TAMPIL, bukan tab yang baru diklik.
  // Dengan begitu isi kartu tidak berganti bentuk sebelum datanya siap.
  const metaTampil = JENIS.find((j) => j.key === (data.jenis || jenis));
  const IkonJenis = metaTampil.ikon;

  const pertamaKali = data.jenis === null;
  // status memuat DITURUNKAN dari state, bukan state tersendiri
  const memuat = data.jenis !== jenis;
  const daftar = data.items;
  const jumlahAktif = daftar.filter((k) => k.is_active).length;

  const setDaftar = (next) =>
    setData((prev) => ({
      ...prev,
      items: typeof next === "function" ? next(prev.items) : next,
    }));

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all duration-200 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20 focus:border-[#00A5EC] focus:ring-4 focus:ring-[#00A5EC]/20"
      : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-300 hover:border-slate-300 hover:bg-white focus:border-[#004F9F] focus:bg-white focus:ring-4 focus:ring-[#00A5EC]/15"
  }`;

  const labelClass =
    "flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-slate-400 before:h-1 before:w-1 before:rounded-full before:bg-[#00A5EC]/70 before:content-['']";

  // ── SIMPAN OTOMATIS per item ──
  const { status, jadwalkan } = useAutoSimpanBaris(async (k) => {
    try {
      await updateKontenLanding(k.id, {
        judul: k.judul,
        deskripsi: k.deskripsi || "",
        icon: k.icon || "",
        kategori: k.kategori || "umum",
        is_active: !!k.is_active,
      });
    } catch (err) {
      notifRef.current("error", err.response?.data?.message || "Gagal menyimpan perubahan item");
      throw err;
    }
    notifRef.current("sukses", "Perubahan item tersimpan");
  });

  useEffect(() => {
    let aktif = true;

    getKontenLanding(jenis)
      .then((res) => {
        if (!aktif) return;
        setData({ jenis, items: res.data.data || [] });
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

  const ubahBaris = (id, key, value) => {
    const listBaru = daftar.map((k) => (k.id === id ? { ...k, [key]: value } : k));
    setDaftar(listBaru);
    jadwalkan(id, listBaru.find((k) => k.id === id));
  };

  const hapus = async (k) => {
    const konfirmasi = await confirmDialog({
      title: "Hapus item ini?",
      text: `"${k.judul || "Item ini"}" akan dihapus dari halaman publik.`,
      confirmText: "Ya, hapus",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;
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
    setMenambah(true);
    try {
      await createKontenLanding(jenis, baru);
      setBaru(FORM_KOSONG);
      muatUlang();
      onNotif("sukses", "Item berhasil ditambahkan");
    } catch (err) {
      onNotif("error", err.response?.data?.message || "Gagal menambahkan item");
    } finally {
      setMenambah(false);
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
      onNotif("sukses", "Urutan item berhasil diperbarui");
    } catch {
      onNotif("error", "Gagal menyimpan urutan");
      muatUlang();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Pemilih jenis konten ── */}
      <div
        className={`relative overflow-hidden rounded-3xl border shadow-sm ${
          isDark
            ? "border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01]"
            : "border-slate-200/80 bg-white"
        }`}
      >
        <div
          className={`flex items-center gap-2 border-b px-5 py-3 ${
            isDark ? "border-white/10" : "border-slate-100"
          }`}
        >
          <span className="text-[10.5px] font-black uppercase tracking-[0.14em] text-slate-400">
            Jenis Konten
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2 p-3">
          {JENIS.map((j) => {
            const ini = jenis === j.key;
            const Ikon = j.ikon;
            const sedangMemuat = ini && memuat && !pertamaKali;
            return (
              <button
                key={j.key}
                onClick={() => setJenis(j.key)}
                className={`group/pil relative flex items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-[12px] font-bold transition-[color,background-color,box-shadow,transform] duration-300 ease-out active:scale-95 ${
                  ini
                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-lg shadow-[#0B1442]/25 -translate-y-0.5"
                    : isDark
                    ? "text-slate-400 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-slate-100"
                    : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-[#0B1442] hover:shadow-md"
                }`}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform duration-1000 group-hover/pil:translate-x-full" />
                {sedangMemuat ? (
                  <Loader2 className="relative h-3.5 w-3.5 animate-spin text-[#7DD3FC]" strokeWidth={2.8} />
                ) : (
                  <Ikon
                    className={`relative h-3.5 w-3.5 ${ini ? "text-[#7DD3FC]" : ""}`}
                    strokeWidth={2.5}
                  />
                )}
                <span className="relative">{j.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pertamaKali ? (
        /* ── Rangka semu: hanya saat pemuatan paling awal ── */
        <div className="space-y-4">
          {RANGKA.map((n) => (
            <div
              key={n}
              className={`h-40 animate-pulse rounded-3xl border ${
                isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200/80 bg-slate-100/70"
              }`}
              style={{ animationDelay: `${n * 120}ms` }}
            />
          ))}
        </div>
      ) : (
        /* ── Isi: data lama tetap terlihat (diredupkan) selama data baru dimuat ── */
        <div
          className={`space-y-6 transition-opacity duration-200 ease-out ${
            memuat ? "pointer-events-none opacity-45" : "opacity-100"
          }`}
        >
          {/* ── Ringkasan jenis aktif ── */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <IkonJenis className="h-4 w-4" strokeWidth={2.3} />
            </span>
            <div className="min-w-0">
              <h4
                className={`text-sm font-black tracking-tight ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                {metaTampil.label}
              </h4>
              <p className="text-[11px] font-medium text-slate-400">
                {daftar.length} item · {jumlahAktif} tampil di halaman publik
              </p>
            </div>
            <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          {/* ── Daftar item ── */}
          <div key={data.jenis} className="space-y-4 animate-[fadeslide_0.28s_ease-out]">
            {daftar.length === 0 && (
              <div
                className={`flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-14 text-center ${
                  isDark
                    ? "border-white/10 text-slate-500"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <Inbox className="h-8 w-8 opacity-40" strokeWidth={1.6} />
                <p className="text-sm font-bold">Belum ada item untuk {metaTampil.label}</p>
                <p className="text-[11.5px] font-medium opacity-70">
                  Tambahkan item pertama melalui formulir di bawah.
                </p>
              </div>
            )}

            {daftar.map((k, i) => (
              <div
                key={k.id}
                className={`group/item relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-lg ${
                  isDark
                    ? "border-white/10 bg-[#0f172a] hover:border-[#00A5EC]/25"
                    : "border-slate-200/80 bg-white hover:border-[#00A5EC]/35"
                } ${!k.is_active ? "opacity-75" : ""}`}
              >
                {/* garis aksen kiri */}
                <span
                  className={`absolute inset-y-0 left-0 w-1 transition-colors duration-300 ${
                    k.is_active
                      ? "bg-gradient-to-b from-[#004F9F] to-[#00A5EC]"
                      : "bg-slate-200"
                  }`}
                />

                {/* ─ Kepala baris ─ */}
                <div
                  className={`flex items-center gap-3 border-b py-3 pl-6 pr-4 ${
                    isDark
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] px-2 text-[11px] font-black text-white shadow-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <p
                    className={`min-w-0 flex-1 truncate text-[12.5px] font-bold ${
                      isDark ? "text-slate-200" : "text-slate-600"
                    }`}
                  >
                    {k.judul || (
                      <span className="font-medium italic text-slate-400">Tanpa judul</span>
                    )}
                  </p>

                  <BadgeSimpan status={status[k.id]} />

                  {/* penggeser urutan */}
                  <div
                    className={`flex items-center rounded-xl border p-0.5 ${
                      isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      onClick={() => geser(i, -1)}
                      disabled={i === 0}
                      title="Naikkan urutan"
                      className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-25 ${
                        isDark
                          ? "text-slate-400 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
                          : "text-slate-400 hover:bg-[#00A5EC]/10 hover:text-[#004F9F]"
                      }`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <span className={`h-4 w-px ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                    <button
                      onClick={() => geser(i, 1)}
                      disabled={i === daftar.length - 1}
                      title="Turunkan urutan"
                      className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-25 ${
                        isDark
                          ? "text-slate-400 hover:bg-[#00A5EC]/15 hover:text-[#00A5EC]"
                          : "text-slate-400 hover:bg-[#00A5EC]/10 hover:text-[#004F9F]"
                      }`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </div>

                  <button
                    onClick={() => hapus(k)}
                    title="Hapus item"
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 opacity-0 transition-all duration-200 hover:bg-red-100 hover:text-red-600 focus:opacity-100 active:scale-90 group-hover/item:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </button>
                </div>

                {/* ─ Isi baris ─ */}
                <div className="space-y-4 py-5 pl-6 pr-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    {metaTampil.pakaiIcon && (
                      <div>
                        <label className={labelClass}>{metaTampil.labelIcon || "Ikon"}</label>
                        <input
                          className={`mt-2 ${inputClass}`}
                          value={k.icon || ""}
                          onChange={(e) => ubahBaris(k.id, "icon", e.target.value)}
                        />
                      </div>
                    )}
                    <div className={metaTampil.pakaiIcon ? "md:col-span-3" : "md:col-span-4"}>
                      <label className={labelClass}>
                        {metaTampil.pakaiDeskripsi ? "Judul" : "Teks"}
                      </label>
                      <input
                        className={`mt-2 ${inputClass}`}
                        value={k.judul || ""}
                        onChange={(e) => ubahBaris(k.id, "judul", e.target.value)}
                      />
                    </div>
                  </div>

                  {metaTampil.pakaiDeskripsi && (
                    <div>
                      <label className={labelClass}>Deskripsi</label>
                      <div className="mt-2">
                        <EditorTeksKaya
                          rows={2}
                          isDark={isDark}
                          nilai={k.deskripsi || ""}
                          onUbah={(v) => ubahBaris(k.id, "deskripsi", v)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─ Kaki baris: pengaturan tampil ─ */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 border-t py-3 pl-6 pr-5 ${
                    isDark
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {metaTampil.pakaiKategori && (
                      <>
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                          Kategori
                        </span>
                        <DropdownPilih
                          isDark={isDark}
                          nilai={k.kategori || "umum"}
                          opsi={KATEGORI}
                          onUbah={(v) => ubahBaris(k.id, "kategori", v)}
                          lebar="w-52"
                        />
                      </>
                    )}
                  </div>

                  {/* sakelar "Tampilkan" */}
                  <button
                    type="button"
                    onClick={() => ubahBaris(k.id, "is_active", !k.is_active)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                      k.is_active
                        ? "border-[#00A5EC]/40 bg-[#00A5EC]/[0.08] text-[#004F9F]"
                        : isDark
                        ? "border-white/10 bg-white/5 text-slate-400"
                        : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    <span
                      className={`relative flex h-4 w-8 items-center rounded-full transition-colors duration-300 ${
                        k.is_active
                          ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC]"
                          : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute h-3 w-3 rounded-full bg-white shadow transition-all duration-300 ${
                          k.is_active ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </span>
                    {k.is_active ? (
                      <Eye className="h-3.5 w-3.5" strokeWidth={2.6} />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={2.6} />
                    )}
                    {k.is_active ? "Tampil" : "Disembunyikan"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Form tambah ── */}
          <div
            className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
              isDark
                ? "border-white/15 bg-white/[0.03] hover:border-[#00A5EC]/40"
                : "border-slate-300 bg-gradient-to-br from-slate-50 to-white hover:border-[#00A5EC]/50"
            }`}
          >
            <div className="flex items-center gap-3 px-6 pt-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
                <Plus className="h-4.5 w-4.5" strokeWidth={2.6} />
              </span>
              <div>
                <h4
                  className={`text-[13.5px] font-black tracking-tight ${
                    isDark ? "text-slate-100" : "text-[#0B1442]"
                  }`}
                >
                  Tambah Item — {metaTampil.label}
                </h4>
                <p className="text-[11px] font-medium text-slate-400">
                  Setelah ditambahkan, setiap perubahan tersimpan otomatis.
                </p>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-4">
                {metaTampil.pakaiIcon && (
                  <div>
                    <label className={labelClass}>{metaTampil.labelIcon || "Ikon"}</label>
                    <input
                      className={`mt-2 ${inputClass}`}
                      value={baru.icon}
                      onChange={(e) => setBaru((f) => ({ ...f, icon: e.target.value }))}
                      placeholder={metaTampil.labelIcon ? "05" : "🎓"}
                    />
                  </div>
                )}
                <div className={metaTampil.pakaiIcon ? "md:col-span-3" : "md:col-span-4"}>
                  <label className={labelClass}>
                    {metaTampil.pakaiDeskripsi ? "Judul" : "Teks"}
                  </label>
                  <input
                    className={`mt-2 ${inputClass}`}
                    value={baru.judul}
                    onChange={(e) => setBaru((f) => ({ ...f, judul: e.target.value }))}
                    placeholder="Tulis isi item di sini…"
                  />
                </div>
              </div>

              {metaTampil.pakaiDeskripsi && (
                <div>
                  <label className={labelClass}>Deskripsi</label>
                  <div className="mt-2">
                    <EditorTeksKaya
                      rows={2}
                      isDark={isDark}
                      nilai={baru.deskripsi}
                      onUbah={(v) => setBaru((f) => ({ ...f, deskripsi: v }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200/70 bg-white/60"
              }`}
            >
              {metaTampil.pakaiKategori ? (
                <div className="flex items-center gap-3">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Kategori
                  </span>
                  <DropdownPilih
                    isDark={isDark}
                    nilai={baru.kategori}
                    opsi={KATEGORI}
                    onUbah={(v) => setBaru((f) => ({ ...f, kategori: v }))}
                    lebar="w-52"
                  />
                </div>
              ) : (
                <span />
              )}

              <button
                onClick={tambah}
                disabled={menambah || memuat}
                className="group/tambah relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0B1442]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover/tambah:translate-x-full" />
                {menambah ? (
                  <Loader2 className="relative h-4 w-4 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Plus className="relative h-4 w-4" strokeWidth={2.8} />
                )}
                <span className="relative">{menambah ? "Menambahkan…" : "Tambah Item"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaKontenLanding;