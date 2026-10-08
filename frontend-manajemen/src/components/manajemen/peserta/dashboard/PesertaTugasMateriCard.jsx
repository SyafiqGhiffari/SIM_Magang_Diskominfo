import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  NotebookPen,
  FilePenLine,
  Clock,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";

// Format deadline tanggal
const formatDeadline = (dateStr) => {
  if (!dateStr) return "Tanpa Batas";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const PesertaTugasMateriCard = ({
  tugasList = [],
  materiList = [],
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState("tugas"); // "tugas" | "materi"
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden h-[310px] sm:h-[329px] transition-all duration-300 ${
        isDark
          ? "border-white/10 bg-[#161b22] text-white"
          : "border-slate-200/80 bg-white text-slate-800"
      }`}
    >
      {/* ── 1. BODY CARD DENGAN SCROLL MANDIRI ── */}
      <div className="p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col">
        {/* Header & Dropdown Filter Tab */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md">
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-100" : "text-[#0B1442]"
                }`}
              >
                Aktivitas Belajar
              </h3>
              <p
                className={`text-[9.5px] sm:text-[10px] font-medium leading-tight whitespace-nowrap ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Tugas, kuis, &amp; modul materi
              </p>
            </div>
          </div>

          {/* Dropdown Button Tab Pengganti Button Tab Panjang */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-2xs"
            >
              <span>{activeTab === "tugas" ? "Tugas & Kuis" : "Materi & SOP"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-900/60 text-[#004F9F] dark:text-sky-300">
                {activeTab === "tugas" ? tugasList.length : materiList.length}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c2128] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("tugas");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    activeTab === "tugas"
                      ? "bg-blue-50/80 dark:bg-blue-900/30 text-[#004F9F] dark:text-sky-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span>Tugas &amp; Kuis</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-900/60 text-[#004F9F] dark:text-sky-300">
                    {tugasList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("materi");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    activeTab === "materi"
                      ? "bg-blue-50/80 dark:bg-blue-900/30 text-[#004F9F] dark:text-sky-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span>Materi &amp; SOP</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-900/60 text-[#004F9F] dark:text-sky-300">
                    {materiList.length}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── KONTEN AREA DENGAN SCROLL MANDIRI (UKURAN FIX & PADDING BUFFER BORDER) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 p-1 mt-1">
          {/* TAB TUGAS & KUIS */}
          {activeTab === "tugas" && (
            <>
              {tugasList.length === 0 ? (
                <div className="h-full min-h-[170px] flex flex-col items-center justify-center text-center text-slate-400 space-y-1.5 p-4">
                  <Inbox className="w-7 h-7 opacity-40 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Belum ada penugasan dari mentor
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Tugas proyek atau kuis baru akan tampil di sini.
                  </p>
                </div>
              ) : (
                tugasList.map((tugas) => {
                  const isKuis = tugas.tipe_tugas === "kuis";
                  const p = tugas.pengumpulan;
                  const isRevisi = p?.status === "revisi" || tugas.status_tugas === "revisi";
                  const isMenunggu = p?.status === "menunggu";
                  const isDinilai =
                    p?.status === "dinilai" ||
                    p?.status_remidi === "tuntas" ||
                    tugas.status_tugas === "dinilai";

                  let badgeNode = (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Belum Kumpul
                    </span>
                  );

                  if (isRevisi) {
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Revisi
                      </span>
                    );
                  } else if (isMenunggu) {
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60">
                        <Clock className="w-2.5 h-2.5" />
                        Menunggu Nilai
                      </span>
                    );
                  } else if (isDinilai) {
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {p?.nilai != null ? `Nilai: ${p.nilai}` : "Tuntas"}
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={tugas.id}
                      to="/peserta/pembelajaran/tugas"
                      className={`group block p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-blue-300/80 dark:hover:border-sky-500/40 ${
                        isDark
                          ? "bg-slate-800/50 border-white/5 hover:border-white/15 hover:bg-slate-800/80"
                          : "bg-slate-50/70 border-slate-200/70 hover:border-blue-200 hover:bg-blue-50/20"
                      }`}
                    >
                      {/* Baris Atas: Icon + Judul Panjang Tidak Terpotong */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-xs mt-0.5 ${
                            isKuis
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-[#004F9F]/15 text-[#004F9F] dark:text-sky-400"
                          }`}
                        >
                          {isKuis ? (
                            <NotebookPen className="w-3.5 h-3.5" />
                          ) : (
                            <FilePenLine className="w-3.5 h-3.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-[12.5px] font-black text-slate-800 dark:text-slate-100 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                            {tugas.judul}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                            <span className="capitalize">{isKuis ? "Kuis Online" : "Tugas Proyek"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              Batas: {formatDeadline(tugas.tenggat_waktu)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Baris Bawah: Batch Status & Indikator Navigasi */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div>{badgeNode}</div>
                        <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400 group-hover:text-[#004F9F] transition-colors">
                          <span>Buka</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </>
          )}

          {/* TAB MATERI & SOP */}
          {activeTab === "materi" && (
            <>
              {materiList.length === 0 ? (
                <div className="h-full min-h-[170px] flex flex-col items-center justify-center text-center text-slate-400 space-y-1.5 p-4">
                  <Inbox className="w-7 h-7 opacity-40 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Belum ada materi pembelajaran
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Modul atau panduan mentor akan muncul di sini.
                  </p>
                </div>
              ) : (
                materiList.map((materi) => {
                  const fileMateri =
                    materi.file_lampiran ||
                    materi.file_path ||
                    materi.file_materi ||
                    materi.file;
                  const linkMateri = materi.tautan_eksternal || materi.link_eksternal;
                  const rawKategori =
                    materi.kategori?.nama || materi.kategori_nama || materi.kategori;
                  const namaKategori =
                    !rawKategori || rawKategori.toLowerCase().includes("dinas")
                      ? "Materi Pembelajaran"
                      : rawKategori;

                  return (
                    <div
                      key={materi.id}
                      className={`group p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${
                        isDark
                          ? "bg-slate-800/50 border-white/5 hover:border-white/15 hover:bg-slate-800/80"
                          : "bg-slate-50/70 border-slate-200/70 hover:border-blue-200 hover:bg-blue-50/20"
                      }`}
                    >
                      {/* Baris Atas: Icon + Judul Panjang */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#004F9F]/15 text-[#004F9F] dark:text-sky-400 shadow-xs mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-[12.5px] font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                            {materi.judul}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                            <span className="truncate">{namaKategori}</span>
                            {materi.mentor?.nama && (
                              <>
                                <span>•</span>
                                <span className="truncate">Mentor: {materi.mentor.nama}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Baris Bawah: Button Aksi Berkas / Tautan di Bawah Sendiri Kolom Konten */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[9.5px] text-slate-400 font-medium truncate">
                          {fileMateri ? "Dokumen Berkas" : linkMateri ? "Tautan Daring" : "Modul"}
                        </span>

                        <div className="shrink-0">
                          {fileMateri ? (
                            <a
                              href={getFileUrl(fileMateri)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#004F9F] hover:bg-[#003870] text-white shadow-2xs transition-all cursor-pointer"
                              title="Buka Berkas Materi"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Buka Berkas</span>
                            </a>
                          ) : linkMateri ? (
                            <a
                              href={linkMateri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#004F9F] hover:bg-[#003870] text-white shadow-2xs transition-all cursor-pointer"
                              title="Buka Berkas / Tautan"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka Tautan</span>
                            </a>
                          ) : (
                            <Link
                              to="/peserta/pembelajaran/materi"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Lihat</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 2. FOOTER STRIP BUTTON: PERSIS SEPERTI CARD PRESENSI HARI INI & IZIN ── */}
      <div className="p-2 sm:px-3.5 sm:py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <Link
          to={activeTab === "tugas" ? "/peserta/pembelajaran/tugas" : "/peserta/pembelajaran/materi"}
          className="group w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-[#004F9F] dark:hover:border-sky-400 hover:text-[#004F9F] dark:hover:text-sky-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
        >
          <span>
            {activeTab === "tugas" ? "Lihat Semua Penugasan" : "Lihat Semua Materi Pembelajaran"}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#004F9F] dark:group-hover:text-sky-400 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default PesertaTugasMateriCard;
