import { useState, useMemo } from "react";
import {
  UserPlus,
  FileCheck2,
  Award,
  KeyRound,
  RotateCcw,
  BellRing,
  ChevronDown,
  Check,
  MessageSquare,
  FileSignature,
} from "lucide-react";
import { toastSuccess } from "../../../../../utils/swal";

// ── Komponen Toggle Switch Interaktif & Modern ──
const ToggleSwitch = ({ checked, onChange, label, dk }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`group relative inline-flex h-7 w-[68px] shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-out focus:outline-none active:scale-95 select-none ${
      checked
        ? "bg-emerald-600 shadow-sm"
        : dk
        ? "bg-slate-800 border border-white/10 hover:border-white/20"
        : "bg-slate-300 border border-slate-300/80 hover:border-slate-400"
    }`}
  >
    {/* Text Label AKTIF di dalam track */}
    <span
      className={`absolute left-2.5 text-[8px] sm:text-[8.5px] font-extrabold tracking-wider uppercase transition-all duration-200 select-none ${
        checked ? "opacity-100 translate-x-0 text-white" : "opacity-0 -translate-x-1"
      }`}
    >
      Aktif
    </span>

    {/* Text Label OFF di dalam track */}
    <span
      className={`absolute right-2.5 text-[8px] sm:text-[8.5px] font-extrabold tracking-wider uppercase transition-all duration-200 select-none ${
        !checked ? "opacity-100 translate-x-0 text-slate-500 dark:text-slate-400" : "opacity-0 translate-x-1"
      }`}
    >
      Off
    </span>

    {/* Moving Knob Putih dengan Micro-Icon */}
    <span
      className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        checked ? "translate-x-[40px] text-emerald-600" : "translate-x-0 text-slate-400"
      }`}
    >
      {checked ? (
        <Check className="w-3 h-3 stroke-[2.5] text-emerald-600" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
      )}
    </span>
  </button>
);

export const TabNotifikasiAdmin = ({ dk, profile }) => {
  // ── Default State Preferensi Notifikasi Valid SIM Magang (Role: Administrator) ──
  const defaultSettings = useMemo(
    () => ({
      // 1. Pendaftaran & Administrasi Seleksi
      notifPendaftaranBaru: true,
      notifTindakanAdministrasi: true,

      // 2. Evaluasi Kelulusan & Sertifikasi
      notifPenilaianMentor: true,
      notifSertifikatSiapTerbit: true,

      // 3. Layanan Chat & Bantuan Sistem
      notifChatBantuan: true,

      // 4. Keamanan Sistem & Akun Administrator
      notifPerubahanKredensial: true,
    }),
    []
  );

  const storageKey = `sim_admin_notif_settings_${profile?.id || "default"}`;

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem("sim_admin_notif_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = {};
        for (const key of Object.keys(defaultSettings)) {
          sanitized[key] = parsed[key] !== undefined ? Boolean(parsed[key]) : defaultSettings[key];
        }
        return sanitized;
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  });

  // Sinkronkan state jika profile baru selesai dimuat atau storageKey berubah (pola resmi React tanpa useEffect cascading render)
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey);
    let initial = defaultSettings;
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem("sim_admin_notif_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = {};
        for (const key of Object.keys(defaultSettings)) {
          sanitized[key] = parsed[key] !== undefined ? Boolean(parsed[key]) : defaultSettings[key];
        }
        initial = sanitized;
      }
    } catch {
      // ignore
    }
    setSettings(initial);
  }

  const [isResetting, setIsResetting] = useState(false);

  // Collapsible Accordion states: buka section pendaftaran secara default
  const [openSections, setOpenSections] = useState({
    pendaftaran: true,
    kelulusan: false,
    bantuan: false,
    keamanan: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleToggle = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.setItem("sim_admin_notif_settings", JSON.stringify(updated));
        window.dispatchEvent(new Event("sim_notif_settings_changed"));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleResetDefault = () => {
    if (isResetting) return;
    setIsResetting(true);
    setSettings(defaultSettings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
      localStorage.setItem("sim_admin_notif_settings", JSON.stringify(defaultSettings));
      window.dispatchEvent(new Event("sim_notif_settings_changed"));
      toastSuccess("Pengaturan notifikasi administrator dikembalikan ke default rekomendasi.");
    } catch {
      // ignore
    }
    setTimeout(() => {
      setIsResetting(false);
    }, 600);
  };

  // Hitung metrik aktif (hanya menghitung kunci valid yang ada di defaultSettings)
  const totalItems = Object.keys(defaultSettings).length;
  const activeItemsCount = Object.keys(defaultSettings).filter((key) => settings[key]).length;

  const SECTIONS = [
    {
      key: "pendaftaran",
      title: "Pendaftaran & Seleksi Magang",
      tag: "Pendaftaran",
      desc: "Pemberitahuan berkas pendaftar baru, verifikasi berkas, dan administrasi tertunda",
      items: [
        {
          key: "notifPendaftaranBaru",
          label: "Pendaftaran Peserta Magang Baru",
          badge: "Pendaftar Baru",
          sub: "Pemberitahuan seketika saat ada berkas pendaftaran calon peserta magang baru yang masuk ke sistem.",
          icon: UserPlus,
        },
        {
          key: "notifTindakanAdministrasi",
          label: "Tindakan Administrasi & Berkas Tertunda",
          badge: "Antrean Admin",
          sub: "Pengingat penerbitan surat penerimaan yang belum dibuat, aktivasi akun pendaftar diterima, atau penugasan mentor pembimbing.",
          icon: FileCheck2,
        },
      ],
    },
    {
      key: "kelulusan",
      title: "Penilaian & Penerbitan Sertifikat",
      tag: "Sertifikasi",
      desc: "Monitoring penyelesaian nilai akhir oleh pembimbing lapangan dan penerbitan e-sertifikat",
      items: [
        {
          key: "notifPenilaianMentor",
          label: "Penyelesaian Penilaian oleh Mentor",
          badge: "Nilai 4 Pilar",
          sub: "Pemberitahuan ketika mentor pembimbing telah merampungkan pengisian seluruh evaluasi nilai akhir kompetensi peserta.",
          icon: Award,
        },
        {
          key: "notifSertifikatSiapTerbit",
          label: "Penerbitan E-Sertifikat Kelulusan",
          badge: "E-Sertifikat",
          sub: "Pengingat penerbitan dan penandatanganan e-sertifikat resmi untuk peserta yang telah lulus masa praktek kerja dinas.",
          icon: FileSignature,
        },
      ],
    },
    {
      key: "bantuan",
      title: "Layanan Chat & Bantuan Sistem",
      tag: "Layanan Chat",
      desc: "Pemberitahuan pertanyaan pengunjung landing page dan eskalasi permohonan bantuan livechat",
      items: [
        {
          key: "notifChatBantuan",
          label: "Pertanyaan & Permintaan Bantuan Live Chat",
          badge: "Bantuan Masuk",
          sub: "Pemberitahuan saat bot chat membutuhkan balasan langsung dari administrator atau saat peserta meminta bantuan admin.",
          icon: MessageSquare,
        },
      ],
    },
    {
      key: "keamanan",
      title: "Keamanan Sistem & Akun Administrator",
      tag: "Keamanan",
      desc: "Pemberitahuan pergantian kata sandi login dan proteksi kredensial administrator",
      items: [
        {
          key: "notifPerubahanKredensial",
          label: "Pembaruan Kata Sandi Administrator",
          badge: "Kredensial Akun",
          sub: "Konfirmasi keamanan seketika saat kata sandi login akun administrator berhasil diperbarui.",
          icon: KeyRound,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
      {/* ══════════════════════════════════════════════════════════════════════
          SINGLE MAIN CARD ARCHITECTURE (SESUAI STANDAR PORTAL MANAJEMEN)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`rounded-xl sm:rounded-3xl border p-2.5 sm:p-6 shadow-xs space-y-3 sm:space-y-5 transition-colors duration-300 ${
          dk ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"
        }`}
      >
        {/* ──────────────────────────────────────────────────────────────────
            1. HEADER UTAMA: JUDUL, RESET & BADGE AKTIF
        ────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-md shadow-[#00A5EC]/20">
              <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Pengaturan Notifikasi Lonceng Web
              </h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                <span className="sm:hidden">Kelola preferensi notifikasi lonceng web Anda</span>
                <span className="hidden sm:inline">Kelola kemunculan pemberitahuan aktivitas sistem manajemen magang pada ikon lonceng web</span>
              </p>
            </div>
          </div>

          {/* Header Right Actions: Reset Default & Badge Aktif */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isResetting}
              title="Kembalikan semua pengaturan ke rekomendasi awal"
              className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-75 select-none"
            >
              <RotateCcw
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-700 ease-in-out ${
                  isResetting
                    ? "-rotate-[360deg] text-blue-600 dark:text-sky-400"
                    : "group-hover:-rotate-45 text-slate-500 dark:text-slate-400"
                }`}
              />
              <span className="transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                {isResetting ? "Mereset..." : "Reset Default"}
              </span>
            </button>

            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeItemsCount} dari {totalItems} Aktif</span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            2. ACCORDION KATEGORI AKTIVITAS DENGAN ANIMASI DROPDOWN HALUS
        ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-2.5 sm:space-y-4">
          {SECTIONS.map((sec) => {
            const isOpen = Boolean(openSections[sec.key]);
            const activeCount = sec.items.filter((item) => settings[item.key]).length;

            return (
              <div
                key={sec.key}
                className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? dk
                      ? "bg-white/[0.03] border-white/15 shadow-xs"
                      : "bg-slate-50/70 border-slate-200/90 shadow-xs"
                    : dk
                    ? "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-4.5 text-left cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {sec.title}
                      </span>
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {sec.tag}
                      </span>
                    </div>
                    <p className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                      {sec.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                      {activeCount}/{sec.items.length} Aktif
                    </span>
                    <span
                      className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-blue-600 dark:text-sky-400" : ""
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                  </div>
                </button>

                {/* Content Accordion */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-2.5 pb-2.5 sm:px-4.5 sm:pb-4.5 pt-1 space-y-2 sm:space-y-3 border-t border-slate-200/60 dark:border-white/10">
                      {sec.items.map((item) => {
                        const checked = Boolean(settings[item.key]);
                        const ItemIcon = item.icon;

                        return (
                          <div
                            key={item.key}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                              dk
                                ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                                : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                                <ItemIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="text-[11.5px] sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {item.label}
                                  </span>
                                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed mt-0.5">
                                  {item.sub}
                                </p>
                              </div>
                            </div>

                            {/* Mobile Bottom Row: Badge di kiri, Toggle di kanan; Desktop: Toggle saja */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 shrink-0">
                              <span className="inline-flex sm:hidden px-2 py-0.5 rounded-md text-[8.5px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                                {item.badge}
                              </span>
                              <ToggleSwitch
                                checked={checked}
                                onChange={() => handleToggle(item.key)}
                                label={item.label}
                                dk={dk}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNotifikasiAdmin;
