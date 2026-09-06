import { useState, useEffect } from "react";
import {
  Eye, EyeOff, Loader2, Bot, Zap, ChevronDown, MessageSquare,
  ArrowRight, Download, UserRound, ClipboardCheck,
  FileText, CalendarClock, Award, HelpCircle, Building2,
} from "lucide-react";
import { getPratinjauQuickAction } from "../../../../services/chatService";

const IKON_TERSEDIA = {
  FileText, CalendarClock, Award, HelpCircle, Building2,
  Download, UserRound, ClipboardCheck, Zap,
};

const GAYA_AKSI = {
  jawaban:  { ikon: MessageSquare,  warna: "#64748b", label: "Jawaban" },
  navigasi: { ikon: ArrowRight,     warna: "#0ea5e9", label: "Buka halaman" },
  unduh:    { ikon: Download,       warna: "#8b5cf6", label: "Unduh berkas" },
  eskalasi: { ikon: UserRound,      warna: "#ef4444", label: "Hubungi admin" },
  status:   { ikon: ClipboardCheck, warna: "#10b981", label: "Cek status" },
};

const STATUS = [
  { nilai: "belum_daftar", label: "Belum daftar" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "revisi", label: "Revisi" },
  { nilai: "diterima", label: "Diterima" },
  { nilai: "ditolak", label: "Ditolak" },
];

const PALET = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9"];

const PratinjauQuickAction = ({ pemicuMuatUlang, isDark = false }) => {
  const [status, setStatus] = useState("menunggu");
  const [tombol, setTombol] = useState([]);
  const [tersembunyi, setTersembunyi] = useState(0);
  const [memuat, setMemuat] = useState(false);
  const [idTerbuka, setIdTerbuka] = useState(null);

  useEffect(() => {
    let batal = false;

    (async () => {
      setMemuat(true);
      try {
        const res = await getPratinjauQuickAction(status);
        if (batal) return;
        setTombol(res.data.data || []);
        setTersembunyi(res.data.tersembunyi ?? 0);
        setIdTerbuka(null);
      } catch {
        if (!batal) {
          setTombol([]);
          setTersembunyi(0);
        }
      } finally {
        if (!batal) setMemuat(false);
      }
    })();

    return () => { batal = true; };
  }, [status, pemicuMuatUlang]);

  return (
    <div className={`self-start overflow-hidden rounded-2xl border shadow-sm animate-[fadeslide_0.35s_ease-out] ${
      isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
    }`}>
      {/* Kepala kartu */}
      <div className={`flex items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4 ${
        isDark ? "border-white/5" : "border-slate-100"
      }`}>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <h3 className={`text-xs sm:text-sm font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              <span className="inline sm:hidden">Pratinjau Widget</span>
              <span className="hidden sm:inline">Pratinjau Widget Peserta</span>
            </h3>
            <p className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-slate-400">
              <span className="inline sm:hidden">Simulasi tombol di peserta.</span>
              <span className="hidden sm:inline">Klik salah satu tombol untuk melihat rincian konfigurasinya.</span>
            </p>
          </div>
        </div>

        <span className={`inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
          isDark ? "bg-sky-500/10 text-sky-400" : "bg-sky-50 text-sky-600"
        }`}>
          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          {tombol.length} tampil
        </span>
      </div>

      <div className="p-3.5 sm:p-5">
        {/* Pemilih status - 5 tab berjejer rapi */}
        <div className="mb-3 sm:mb-4 grid grid-cols-5 gap-1 sm:gap-1.5">
          {STATUS.map((s) => {
            const aktif = status === s.nilai;
            return (
              <button
                key={s.nilai}
                onClick={() => setStatus(s.nilai)}
                className={`rounded-lg sm:rounded-xl px-1 sm:px-3 py-1.5 sm:py-2 text-[8px] sm:text-[11px] font-bold text-center truncate transition-all duration-200 cursor-pointer active:scale-95 ${
                  aktif
                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                    : isDark
                    ? "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    : "border border-slate-200 bg-white text-slate-500 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 hover:shadow-md"
                }`}
                title={s.label}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Tiruan panel chat peserta */}
        <div className={`rounded-2xl border p-3 sm:p-4 shadow-inner ${
          isDark ? "border-white/10 bg-[#0d1117]" : "border-slate-200 bg-gradient-to-b from-slate-50 to-white"
        }`}>
          <div className={`mb-2.5 sm:mb-3 flex items-center gap-2 sm:gap-2.5 border-b pb-2.5 sm:pb-3 ${
            isDark ? "border-white/5" : "border-slate-200"
          }`}>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] shadow-sm">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-[12px] font-black ${isDark ? "text-slate-200" : "text-slate-700"}`}>Asisten Magang</p>
              <p className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-semibold text-emerald-500">
                <span
                  className="block shrink-0 bg-emerald-500 animate-pulse"
                  style={{ width: 5, height: 5, borderRadius: 9999 }}
                />
                Online
              </p>
            </div>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : tombol.length === 0 ? (
            <div className="py-8 sm:py-10 text-center">
              <div className={`mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${
                isDark ? "bg-white/5 text-slate-500" : "bg-white text-slate-300 shadow-sm"
              }`}>
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-2.5 text-[10.5px] sm:text-[12px] font-bold text-slate-400">
                Tidak ada tombol untuk status ini
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {tombol.map((qa, i) => {
                const gaya = GAYA_AKSI[qa.action_type] || GAYA_AKSI.jawaban;
                const IkonPilihan = qa.icon ? IKON_TERSEDIA[qa.icon] : null;
                const Ikon = IkonPilihan || gaya.ikon;
                const warna = gaya.warna || PALET[i % PALET.length];
                const terbuka = idTerbuka === qa.id;

                return (
                  <div
                    key={qa.id}
                    className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-200 animate-[fadeslide_0.3s_ease-out] ${
                      isDark
                        ? terbuka ? "border-[#00A5EC]/50 bg-[#161b22] shadow-md" : "border-white/10 bg-[#161b22]"
                        : terbuka ? "border-slate-300 bg-white shadow-md" : "border-slate-200 bg-white"
                    }`}
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                  >
                    {/* Baris tombol - sekaligus pemicu rincian */}
                    <button
                      type="button"
                      onClick={() => setIdTerbuka(terbuka ? null : qa.id)}
                      aria-expanded={terbuka}
                      className={`group flex w-full items-center gap-2 sm:gap-2.5 px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                        isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="flex h-5 w-5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                        style={{ background: `${warna}1a` }}
                      >
                        <Ikon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" style={{ color: warna }} />
                      </span>

                      <span className={`flex-1 line-clamp-2 break-words text-[10px] sm:text-[12px] font-bold leading-snug ${
                        isDark ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {qa.label || qa.question}
                      </span>

                      <span
                        className="hidden shrink-0 rounded-md px-1.5 py-0.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-wide sm:inline-block"
                        style={{ background: `${warna}14`, color: warna }}
                      >
                        {gaya.label}
                      </span>

                      <ChevronDown
                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400 transition-transform duration-300 group-hover:text-slate-300 ${
                          terbuka ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Rincian per tombol */}
                    {terbuka && (
                      <div className={`space-y-2 border-t px-2.5 py-2 sm:px-3.5 sm:py-3 animate-[fadeslide_0.25s_ease-out] ${
                        isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/70"
                      }`}>
                        <div>
                          <p className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400">Pertanyaan sumber</p>
                          <p className={`mt-0.5 text-[9.5px] sm:text-[11px] font-semibold leading-relaxed ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}>
                            {qa.question || "—"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                          <div>
                            <p className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400">Tipe aksi</p>
                            <span
                              className="mt-0.5 sm:mt-1 inline-block rounded-md px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-black"
                              style={{ background: `${warna}14`, color: warna }}
                            >
                              {gaya.label}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400">Tujuan aksi</p>
                            <p
                              className={`mt-0.5 sm:mt-1 truncate rounded-md px-1.5 py-0.5 font-mono text-[8.5px] sm:text-[10px] ${
                                isDark
                                  ? "bg-white/5 text-slate-300 ring-1 ring-white/10"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200"
                              }`}
                              title={qa.action_target || "Tidak memerlukan tujuan"}
                            >
                              {qa.action_target || "Tidak diperlukan"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400">Jawaban yang dikirim</p>
                          <p className={`mt-0.5 line-clamp-3 text-[9.5px] sm:text-[11px] leading-relaxed ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}>
                            {qa.answer || "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {tersembunyi > 0 && (
          <div className={`mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 ${
            isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"
          }`}>
            <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400" />
            <p className={`text-[9px] sm:text-[11px] leading-tight sm:leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="sm:hidden">
                <span className={`font-black ${isDark ? "text-slate-200" : "text-slate-600"}`}>{tersembunyi} disembunyikan</span> (status lain / batas kuota).
              </span>
              <span className="hidden sm:inline">
                <span className={`font-black ${isDark ? "text-slate-200" : "text-slate-600"}`}>{tersembunyi} tombol disembunyikan</span> karena dibatasi status lain atau melebihi kuota tampil.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PratinjauQuickAction;