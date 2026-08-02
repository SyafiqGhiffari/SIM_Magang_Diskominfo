import { useEffect } from "react";
import {
  X, Inbox, User, Mail, MessageSquare, Globe, Clock, Repeat2,
  Target, Sparkles, CheckCircle2, Loader2, Trash2,
} from "lucide-react";

const warnaStatus = {
  baru: "bg-amber-50 text-amber-600 border-amber-200",
  diproses: "bg-blue-50 text-[#004F9F] border-blue-200",
  selesai: "bg-emerald-50 text-emerald-600 border-emerald-200",
  diabaikan: "bg-slate-100 text-slate-500 border-slate-200",
};

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const InfoRow = ({ icon: Icon, label, value, delay = 0 }) => (
  <div
    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-[#004F9F]/40 hover:shadow-md hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out]"
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F] transition-transform duration-200 group-hover:scale-110">
      <Icon className="w-3.5 h-3.5" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700 mt-0.5 break-words">{value || "-"}</p>
    </div>
  </div>
);

/**
 * Modal detail satu pertanyaan masuk.
 * Struktur (header gradien, badan scroll, bilah aksi bawah) mengikuti
 * modal pada Kelola Peserta agar konsisten dengan halaman lain.
 */
const PertanyaanDetailModal = ({ item, onJadikanFaq, onUbahStatus, onHapus, onClose }) => {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!item) return null;

  const dariChat = item.sumber === "chat_bot";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kepala */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-6 shrink-0">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00A5EC]/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <Inbox className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Detail Pertanyaan Masuk</h3>
              <p className="text-[11px] text-white/60 mt-0.5">
                Tinjau pertanyaan peserta sebelum dijadikan FAQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Badan */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold capitalize ${
                warnaStatus[item.status] || warnaStatus.diabaikan
              }`}
            >
              {item.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {dariChat ? (
                <>
                  <MessageSquare className="h-3 w-3" /> Chat bot
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" /> Form publik
                </>
              )}
            </span>
            {item.jumlah_serupa > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                <Repeat2 className="h-3 w-3" /> Ditanyakan {item.jumlah_serupa}x
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-black text-[#0B1442]">Isi Pertanyaan</h4>
            </div>
            <p className="text-[15px] font-semibold leading-relaxed text-slate-800 whitespace-pre-wrap">
              {item.pertanyaan}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Nama Pengirim" value={item.nama} delay={0} />
            <InfoRow icon={Mail} label="Email" value={item.email} delay={40} />
            <InfoRow icon={Clock} label="Waktu Masuk" value={fmtDateTime(item.created_at)} delay={80} />
            <InfoRow
              icon={Target}
              label="Kecocokan FAQ Terdekat"
              value={
                item.skor_tertinggi > 0
                  ? `${Math.round(item.skor_tertinggi * 100)}%`
                  : "Tidak ada FAQ yang mendekati"
              }
              delay={120}
            />
          </div>
        </div>

        {/* Bilah aksi */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 shrink-0">
          <button
            onClick={() => onHapus(item)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>

          {item.status === "baru" && (
            <button
              onClick={() => onUbahStatus(item, "diproses")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Loader2 className="w-3.5 h-3.5" /> Tandai diproses
            </button>
          )}

          {item.status !== "selesai" && (
            <button
              onClick={() => onUbahStatus(item, "selesai")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Tandai selesai
            </button>
          )}

          <button
            onClick={() => onJadikanFaq(item)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Jadikan FAQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PertanyaanDetailModal;