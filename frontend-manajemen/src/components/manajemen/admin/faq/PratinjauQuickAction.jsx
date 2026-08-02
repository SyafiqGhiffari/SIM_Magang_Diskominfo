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

const PratinjauQuickAction = ({ pemicuMuatUlang }) => {
  const [status, setStatus] = useState("menunggu");
  const [tombol, setTombol] = useState([]);
  const [tersembunyi, setTersembunyi] = useState(0);
  const [memuat, setMemuat] = useState(false);
  const [idTerbuka, setIdTerbuka] = useState(null);

  // State hanya diubah SETELAH await di dalam callback async,
  // sehingga tidak melanggar aturan React Compiler.
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
    <div className="self-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-[fadeslide_0.35s_ease-out]">
      {/* Kepala kartu */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
            <Eye className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#0B1442]">Pratinjau Widget Peserta</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
              Klik salah satu tombol untuk melihat rincian konfigurasinya.
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600">
          <Zap className="h-3 w-3" />
          {tombol.length} tampil
        </span>
      </div>

      <div className="p-5">
        {/* Pemilih status - gaya sama dengan FilterTabs halaman lain */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS.map((s) => {
            const aktif = status === s.nilai;
            return (
              <button
                key={s.nilai}
                onClick={() => setStatus(s.nilai)}
                className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                  aktif
                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-500 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 hover:shadow-md"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Tiruan panel chat peserta */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
          <div className="mb-3 flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#004F9F] shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-black text-slate-700">Asisten Magang</p>
              <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                <span
                  className="block shrink-0 bg-emerald-500 animate-pulse"
                  style={{ width: 6, height: 6, borderRadius: 9999 }}
                />
                Online
              </p>
            </div>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : tombol.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                <EyeOff className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[12px] font-bold text-slate-400">
                Tidak ada tombol untuk status ini
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tombol.map((qa, i) => {
                const gaya = GAYA_AKSI[qa.action_type] || GAYA_AKSI.jawaban;
                const IkonPilihan = qa.icon ? IKON_TERSEDIA[qa.icon] : null;
                const Ikon = IkonPilihan || gaya.ikon;
                const warna = gaya.warna || PALET[i % PALET.length];
                const terbuka = idTerbuka === qa.id;

                return (
                  <div
                    key={qa.id}
                    className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 animate-[fadeslide_0.3s_ease-out] ${
                      terbuka ? "border-slate-300 shadow-md" : "border-slate-200"
                    }`}
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                  >
                    {/* Baris tombol - sekaligus pemicu rincian */}
                    <button
                      type="button"
                      onClick={() => setIdTerbuka(terbuka ? null : qa.id)}
                      aria-expanded={terbuka}
                      className="group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                        style={{ background: `${warna}1a` }}
                      >
                        <Ikon className="h-3.5 w-3.5" style={{ color: warna }} />
                      </span>

                      <span className="flex-1 truncate text-[12px] font-bold text-slate-700">
                        {qa.label || qa.question}
                      </span>

                      <span
                        className="hidden shrink-0 rounded-md px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide sm:inline-block"
                        style={{ background: `${warna}14`, color: warna }}
                      >
                        {gaya.label}
                      </span>

                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-300 group-hover:text-slate-500 ${
                          terbuka ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Rincian per tombol */}
                    {terbuka && (
                      <div className="space-y-2.5 border-t border-slate-100 bg-slate-50/70 px-3.5 py-3 animate-[fadeslide_0.25s_ease-out]">
                        <div>
                          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Pertanyaan sumber</p>
                          <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-slate-600">
                            {qa.question || "—"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Tipe aksi</p>
                            <span
                              className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black"
                              style={{ background: `${warna}14`, color: warna }}
                            >
                              {gaya.label}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Tujuan aksi</p>
                            <p
                              className="mt-1 truncate rounded-md bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500 ring-1 ring-slate-200"
                              title={qa.action_target || "Tidak memerlukan tujuan"}
                            >
                              {qa.action_target || "Tidak diperlukan"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Jawaban yang dikirim</p>
                          <p className="mt-0.5 line-clamp-3 text-[11px] leading-relaxed text-slate-500">
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
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              <span className="font-black text-slate-600">{tersembunyi} tombol disembunyikan</span> karena dibatasi status lain atau melebihi kuota tampil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PratinjauQuickAction;