import { useEffect, useState } from "react";
import {
  X, ClipboardList, LogIn, LogOut, Clock, Building2, GraduationCap,
  CalendarDays, UserCog, AlarmClockOff, Lock, StickyNote,
  Image as ImageIcon, Info, ArrowRight, Timer, ShieldCheck, Maximize2, Sparkles,
} from "lucide-react";
import PresensiStatusBadge from "./PresensiStatusBadge";
import { formatTanggalHari, formatTanggalPresensi, formatMenit, statusInfo } from "../../../../constants/presensiStatus";
import { getFileUrl } from "../../../../utils/fileUrl";

/* Inisial nama (fallback bila foto tidak ada) */
const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Avatar peserta — sama seperti di tabel Data Presensi, versi header modal */
const PesertaAvatarModal = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  return (
    <span className="relative shrink-0">
      {url && !error ? (
        <img
          src={url}
          alt={nama}
          onError={() => setError(true)}
          className="h-12 w-12 rounded-2xl object-cover border border-white/20 shadow-lg"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[13px] font-black text-white border border-white/20 shadow-lg">
          {getInisial(nama)}
        </span>
      )}
      <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse pointer-events-none" />
    </span>
  );
};

/* Kartu jam masuk / jam pulang (sorotan utama) */
const JamCard = ({ icon: Icon, label, value, tone, delay = 0 }) => {
  const ada = Boolean(value);
  const tones = {
    masuk: {
      ring: "ring-emerald-200/70",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-50/30",
      chip: "bg-emerald-500/10 text-emerald-600",
      text: "text-emerald-700",
    },
    pulang: {
      ring: "ring-sky-200/70",
      bg: "bg-gradient-to-br from-sky-50 to-sky-50/30",
      chip: "bg-sky-500/10 text-sky-600",
      text: "text-sky-700",
    },
  };
  const t = ada ? tones[tone] : {
    ring: "ring-slate-200",
    bg: "bg-slate-50/70",
    chip: "bg-slate-200/60 text-slate-400",
    text: "text-slate-400",
  };

  return (
    <div
      className={`group relative flex-1 overflow-hidden rounded-2xl ring-1 ${t.ring} ${t.bg} px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-[fadeslide_0.3s_ease-out]`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chip} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className={`mt-0.5 text-[17px] font-black leading-none tabular-nums ${t.text}`}>
            {ada ? value : "--:--"}
          </p>
        </div>
      </div>
      {!ada && (
        <p className="mt-2 text-[10px] font-semibold text-slate-400">
          Belum melakukan absen {tone === "masuk" ? "masuk" : "pulang"}
        </p>
      )}
    </div>
  );
};

/* Baris informasi pendukung */
const InfoItem = ({ icon: Icon, label, value, accent = "slate", delay = 0 }) => {
  const accents = {
    slate: "bg-slate-100 text-slate-500 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F]",
    amber: "bg-amber-50 text-amber-600",
    brand: "bg-[#004F9F]/10 text-[#004F9F]",
  };
  return (
    <div
      className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/25 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${accents[accent]}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-[12.5px] font-bold text-[#0B1442] break-words leading-snug">{value || "-"}</p>
      </div>
    </div>
  );
};

/* Judul seksi dengan garis pemisah */
const SectionTitle = ({ children }) => (
  <div className="mb-2.5 flex items-center gap-2.5">
    <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{children}</p>
    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

const FotoBukti = ({ label, file, delay = 0 }) => {
  if (!file) return null;
  return (
    <a
      href={getFileUrl(file)}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-[#004F9F]/30 hover:shadow-lg animate-[fadeslide_0.3s_ease-out]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <img src={getFileUrl(file)} alt={label} className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-[#0B1442] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
        <Maximize2 className="w-3.5 h-3.5" />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent px-3 pb-2 pt-6 text-[10.5px] font-bold text-white">
        <ImageIcon className="w-3 h-3" /> {label}
      </span>
    </a>
  );
};

const PresensiDetailModal = ({ data, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const sumberLabel = {
    peserta: "Diisi peserta",
    mentor: "Dicatat mentor",
    admin: "Dicatat admin",
    sistem: "Otomatis sistem",
  }[data.sumber] || data.sumber;

  const info = statusInfo(data.status || "belum");
  const terlambat = Number(data.menit_terlambat) || 0;
  const adaFoto = Boolean(data.foto_masuk || data.foto_pulang);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-[backdropFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <ClipboardList
            className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <PesertaAvatarModal nama={data.nama} foto={data.foto_peserta || data.foto_profil} />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  Detail Presensi
                </div>
                <h3 className="text-base font-black text-white leading-tight truncate">{data.nama}</h3>
                <p className="flex items-center gap-1.5 text-[11px] text-white/60 mt-0.5">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formatTanggalHari(data.tanggal)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
              aria-label="Tutup detail presensi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Deretan badge status */}
          <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
            <span className="animate-[popIn_0.35s_ease-out]">
              <PresensiStatusBadge status={data.status} className="!bg-white/95 !ring-0 shadow-sm" />
            </span>
            {terlambat > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-sm">
                <Timer className="w-3 h-3" /> Terlambat {formatMenit(terlambat)}
              </span>
            )}
            {data.lupa_presensi && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                <AlarmClockOff className="w-3 h-3" /> Lupa presensi
              </span>
            )}
            {data.dikunci && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                <Lock className="w-3 h-3" /> Terkunci
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              <UserCog className="w-3 h-3" /> {sumberLabel}
            </span>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40 p-6 space-y-5">
          {/* Sorotan waktu presensi */}
          <div>
            <SectionTitle>Waktu Presensi</SectionTitle>
            <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
              <JamCard icon={LogIn} label="Jam Masuk" value={data.jam_masuk} tone="masuk" delay={40} />
              <span className="mx-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300 shadow-sm sm:flex">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <JamCard icon={LogOut} label="Jam Pulang" value={data.jam_pulang} tone="pulang" delay={90} />
            </div>

            <div
              className={`mt-2.5 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 ring-1 animate-[fadeslide_0.3s_ease-out] ${
                terlambat > 0 ? "bg-amber-50/80 ring-amber-200/70" : "bg-white ring-slate-200/80"
              }`}
              style={{ animationDelay: "140ms", animationFillMode: "backwards" }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  terlambat > 0 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                {terlambat > 0 ? <Clock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Keterlambatan</p>
                <p className={`text-[12.5px] font-bold ${terlambat > 0 ? "text-amber-700" : "text-slate-600"}`}>
                  {terlambat > 0 ? formatMenit(terlambat) : "Tidak ada keterlambatan"}
                </p>
              </div>
              <span className={`ml-auto hidden shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold sm:inline-flex ${info.badge}`}>
                {formatTanggalPresensi(data.tanggal)}
              </span>
            </div>
          </div>

          {/* Informasi penempatan */}
          <div>
            <SectionTitle>Informasi Peserta</SectionTitle>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoItem icon={Building2} label="Bidang" value={data.bidang} accent="brand" delay={40} />
              <InfoItem icon={GraduationCap} label="Institusi" value={data.institusi} delay={80} />
              <InfoItem icon={UserCog} label="Mentor Pembimbing" value={data.mentor_nama} delay={120} />
              <InfoItem icon={StickyNote} label="Keterangan" value={data.keterangan} accent={data.keterangan ? "amber" : "slate"} delay={160} />
            </div>
          </div>

          {/* Foto bukti */}
          {adaFoto && (
            <div>
              <SectionTitle>Foto Bukti Presensi</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FotoBukti label="Foto masuk" file={data.foto_masuk} delay={40} />
                <FotoBukti label="Foto pulang" file={data.foto_pulang} delay={80} />
              </div>
            </div>
          )}

          {/* Catatan hak akses */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#004F9F]/15 bg-[#004F9F]/[0.04] px-3.5 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#004F9F]/10 text-[#004F9F]">
              <Info className="w-3.5 h-3.5" />
            </span>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Data presensi hanya dapat dikoreksi oleh <span className="font-bold text-[#0B1442]">mentor pembimbing</span>.
              Admin memiliki akses lihat &amp; rekap.
            </p>
          </div>
        </div>

        {/* ================= Footer ================= */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 shrink-0">
          <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
            Tekan
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[9.5px] font-bold text-slate-500">Esc</kbd>
            untuk menutup
          </p>
          <button
            onClick={onClose}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shine_0.9s_ease-out]" />
            <span className="relative">Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresensiDetailModal;