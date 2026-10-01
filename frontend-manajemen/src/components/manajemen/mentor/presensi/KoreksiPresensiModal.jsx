import { useEffect, useState } from "react";
import {
  X,
  PencilLine,
  Save,
  Loader2,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  UserX,
  LogIn,
  LogOut,
  Building2,
  GraduationCap,
  Info,
  Check,
} from "lucide-react";
import PresensiStatusBadge from "../../shared/PresensiStatusBadge";
import { formatTanggalHari } from "../../../../constants/presensiStatus";
import { updatePresensiMentor } from "../../../../services/mentorService";
import { toastError, toastSuccess } from "../../../../utils/swal";
import { getFileUrl } from "../../../../utils/fileUrl";

/* Inisial nama bila foto tidak ada */
const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Judul seksi dengan garis pemisah konsisten */
const SectionTitle = ({ children, isDark = false }) => (
  <div className="mb-2.5 flex items-center gap-2 sm:gap-2.5">
    <span className="h-3 sm:h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </p>
    <span
      className={`h-px flex-1 ${
        isDark ? "bg-white/10" : "bg-gradient-to-r from-slate-200 to-transparent"
      }`}
    />
  </div>
);

const STATUS_OPTIONS = [
  {
    key: "hadir",
    label: "Hadir",
    icon: CheckCircle2,
    activeCls:
      "border-emerald-500/60 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/40",
    dotCls: "bg-emerald-500",
  },
  {
    key: "terlambat",
    label: "Terlambat",
    icon: Clock,
    activeCls:
      "border-amber-500/60 bg-amber-50/80 text-amber-800 ring-2 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/40",
    dotCls: "bg-amber-500",
  },
  {
    key: "izin",
    label: "Izin",
    icon: FileText,
    activeCls:
      "border-sky-500/60 bg-sky-50/80 text-sky-800 ring-2 ring-sky-500/20 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/40",
    dotCls: "bg-[#00A5EC]",
  },
  {
    key: "sakit",
    label: "Sakit",
    icon: HeartPulse,
    activeCls:
      "border-violet-500/60 bg-violet-50/80 text-violet-800 ring-2 ring-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-500/40",
    dotCls: "bg-violet-500",
  },
  {
    key: "alfa",
    label: "Alfa",
    icon: UserX,
    activeCls:
      "border-rose-500/60 bg-rose-50/80 text-rose-800 ring-2 ring-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/40",
    dotCls: "bg-rose-500",
  },
];

const KoreksiPresensiModal = ({ data, onClose, onSaved, isDark = false, dk }) => {
  const darkMode = isDark || dk;
  const [status, setStatus] = useState(data?.status || "hadir");
  const [jamMasuk, setJamMasuk] = useState(data?.jam_masuk ? data.jam_masuk.slice(0, 5) : "");
  const [jamPulang, setJamPulang] = useState(data?.jam_pulang ? data.jam_pulang.slice(0, 5) : "");
  const [keterangan, setKeterangan] = useState(data?.keterangan || "");
  const [saving, setSaving] = useState(false);
  const [fotoError, setFotoError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  if (!data) return null;

  const namaPeserta = data.nama || data.peserta?.nama || "Peserta Magang";
  const fotoPeserta =
    data.foto_peserta ||
    data.foto_profil ||
    data.pendaftaran?.file_pas_foto ||
    data.peserta?.foto_profil ||
    null;
  const urlFoto = fotoPeserta ? getFileUrl(fotoPeserta) : null;
  const institusiPeserta = data.institusi || data.asal_kampus || data.asal_sekolah || null;
  const bidangPeserta = data.bidang || data.posisi_bidang || null;

  const butuhJam = status === "hadir" || status === "terlambat";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (butuhJam && !jamMasuk) {
      toastError("Jam masuk wajib diisi untuk status hadir/terlambat.");
      return;
    }

    setSaving(true);
    try {
      await updatePresensiMentor(data.id, {
        status,
        jam_masuk: butuhJam && jamMasuk ? `${jamMasuk}:00` : "",
        jam_pulang: butuhJam && jamPulang ? `${jamPulang}:00` : "",
        keterangan: keterangan.trim(),
      });
      toastSuccess("Presensi berhasil dikoreksi.");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan koreksi presensi.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-hidden transition-all duration-200 ${
    darkMode
      ? "border-white/10 bg-white/5 text-slate-200 focus:border-[#00A5EC] focus:bg-[#1c2333] focus:ring-3 focus:ring-[#00A5EC]/20"
      : "border-slate-200 bg-slate-50/70 text-slate-800 focus:border-[#004F9F] focus:bg-white focus:ring-3 focus:ring-[#00A5EC]/15"
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 animate-[backdropFade_0.25s_ease-out]"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm sm:max-w-xl md:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col ${
          darkMode ? "bg-[#161b22] border border-white/10" : "bg-white ring-1 ring-slate-900/5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Navy Gradient, Watermark & Inline Details */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 py-3.5 sm:px-6 sm:py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <PencilLine
            className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.07] sm:opacity-[0.09] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-start justify-between gap-2.5 sm:gap-3">
            {/* Identitas Peserta & Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <span className="relative shrink-0">
                {urlFoto && !fotoError ? (
                  <img
                    src={urlFoto}
                    alt={namaPeserta}
                    onError={() => setFotoError(true)}
                    className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl object-cover border border-white/20 shadow-lg bg-white/10"
                  />
                ) : (
                  <span className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-xs sm:text-sm font-black text-white border border-white/20 shadow-lg">
                    {getInisial(namaPeserta)}
                  </span>
                )}
                <span className="absolute -inset-0.5 sm:-inset-1 rounded-xl sm:rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#00A5EC]" />
                  Koreksi Presensi
                </div>
                <h3 className="text-xs sm:text-base font-black text-white leading-tight truncate">
                  {namaPeserta}
                </h3>

                {/* Baris 1: Data Hari dan Tanggal */}
                <p className="mt-0.5 sm:mt-1 flex items-center gap-1.5 text-[10.5px] sm:text-[12px] text-white/90 font-bold">
                  <CalendarDays className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>{formatTanggalHari(data.tanggal)}</span>
                </p>

                {/* Baris 2: Ketiga Batch (Status, Institusi, Bidang) di bawah hari dan tanggal */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* 1. Batch Status */}
                  <PresensiStatusBadge
                    status={data.status}
                    className="!bg-white/95 !ring-0 shadow-sm !text-slate-800 !py-0.5 !px-2 !text-[8.5px] sm:!text-[9.5px]"
                  />

                  {/* 2. Batch Institusi */}
                  {institusiPeserta && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm">
                      <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300 shrink-0" />
                      <span className="truncate max-w-[160px] sm:max-w-[220px]">{institusiPeserta}</span>
                    </span>
                  )}

                  {/* 3. Batch Bidang */}
                  {bidangPeserta && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] sm:text-[9.5px] font-bold bg-[#00A5EC]/20 text-sky-200 border border-[#00A5EC]/30 backdrop-blur-sm">
                      <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-300 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">{bidangPeserta}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40"
              aria-label="Tutup koreksi presensi"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 ${
            darkMode ? "bg-[#161b22]" : "bg-slate-50/40"
          }`}
        >
          {/* 1. Pemilihan Status Presensi */}
          <div>
            <SectionTitle isDark={darkMode}>Pilih Status Kehadiran Baru</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const aktif = status === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStatus(opt.key)}
                    className={`group relative flex items-center justify-between rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-3.5 sm:py-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 text-left ${
                      aktif
                        ? opt.activeCls
                        : darkMode
                        ? "border-white/10 bg-[#1c2333]/90 text-slate-300 hover:border-white/20 hover:bg-white/5"
                        : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.dotCls}`} />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-[13px] font-bold block leading-tight">
                          {opt.label}
                        </span>
                      </div>
                    </div>

                    {aktif ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/15">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Jam Masuk & Jam Pulang (Tampil bila Hadir atau Terlambat) */}
          {butuhJam && (
            <div className="animate-[fadeslide_0.25s_ease-out]">
              <SectionTitle isDark={darkMode}>Waktu Kedatangan &amp; Kepulangan</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Jam Masuk */}
                <div
                  className={`rounded-xl sm:rounded-2xl border p-3 ${
                    darkMode ? "bg-[#1c2333]/90 border-white/10" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Jam Masuk (WIB)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={jamMasuk}
                    onChange={(e) => setJamMasuk(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Batas on-time maksimal 08:00 WIB</p>
                </div>

                {/* Jam Pulang */}
                <div
                  className={`rounded-xl sm:rounded-2xl border p-3 ${
                    darkMode ? "bg-[#1c2333]/90 border-white/10" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    <LogOut className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Jam Pulang (WIB)</span>
                  </label>
                  <input
                    type="time"
                    value={jamPulang}
                    onChange={(e) => setJamPulang(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Kosongkan bila peserta belum check-out</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Catatan Koreksi & Alasan */}
          <div>
            <SectionTitle isDark={darkMode}>Catatan &amp; Alasan Koreksi</SectionTitle>
            <div className="relative">
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan catatan alasan koreksi (contoh: peserta lupa presensi check-out dinas, dispensasi tugas dinas luar kantor, kesalahan perangkat GPS)..."
                className={`${inputCls} resize-none`}
              />
              <div className="flex items-center justify-between mt-1 text-[9.5px] text-slate-400 px-1">
                <span>Wajib diisi bila terdapat kondisi khusus</span>
                <span>{keterangan.length} karakter</span>
              </div>
            </div>
          </div>

          {/* 4. Info Hak Akses & Peringatan Otomatis */}
          <div
            className={`flex items-start gap-2.5 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${
              darkMode
                ? "border-amber-500/20 bg-amber-500/[0.08] text-amber-300"
                : "border-amber-200/90 bg-amber-50/80 text-amber-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                darkMode ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </span>
            <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed">
              Perubahan status ini akan langsung tersimpan dan tercatat pada rekap kehadiran peserta SIM Magang Diskominfo Ponorogo atas verifikasi Anda sebagai mentor pembimbing.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between gap-3 border-t p-3 sm:px-6 sm:py-3.5 shrink-0 ${
            darkMode ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-white"
          }`}
        >
          {/* Hint Esc */}
          <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
            Tekan
            <kbd
              className={`rounded-md border px-1.5 py-0.5 font-sans text-[9.5px] font-bold ${
                darkMode
                  ? "border-white/10 bg-white/5 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              Esc
            </kbd>
            untuk membatalkan
          </p>

          {/* Action Buttons: Batal & Simpan Koreksi */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`w-full sm:w-auto inline-flex items-center justify-center rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 ${
                darkMode
                  ? "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span>Simpan Koreksi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default KoreksiPresensiModal;