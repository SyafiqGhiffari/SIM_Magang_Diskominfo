import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Fingerprint,
  HeartPulse,
  History,
  Library,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileText,
  Award,
  Medal,
} from "lucide-react";
import ManajemenShell from "../components/manajemen/shared/layout/ManajemenShell";
import AlumniBanner from "../components/manajemen/peserta/AlumniBanner";
import { useManajemenTheme } from "../context/useManajemenTheme";
import { logoutAdmin, getMe } from "../services/authService";
import { getNotifikasi } from "../services/notifikasiService";
import {
  initialLencanaPeserta,
  hitungLencanaPesertaDariNotifikasi,
} from "../utils/notifikasiPesertaHelper";
import { confirmDialog } from "../utils/swal";
import { clearAuthData, updateAuthUser, isMagangSelesai, getUser } from "../utils/authStorage";

const dashboardIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

// Label & struktur menu navigasi peserta dengan dropdown dan ikon unik
const buildNavItems = (readOnly) => [
  {
    key: "dashboard",
    to: "/peserta",
    label: "Dashboard",
    icon: dashboardIcon,
  },
  {
    type: "dropdown",
    key: "presensi-group",
    label: readOnly ? "Presensi & Aktivitas (Alumni)" : "Presensi & Aktivitas",
    icon: <CalendarDays className="w-[18px] h-[18px] shrink-0" />,
    children: [
      {
        key: "presensi",
        to: "/peserta/presensi",
        label: "Presensi & Logbook",
        icon: <Fingerprint className="w-4 h-4 shrink-0" />,
      },
      {
        key: "izin",
        to: "/peserta/pengajuan-izin",
        label: "Pengajuan Izin",
        icon: <HeartPulse className="w-4 h-4 shrink-0" />,
      },
      {
        key: "riwayat-aktivitas",
        to: "/peserta/riwayat-aktivitas",
        label: "Riwayat Aktivitas",
        icon: <History className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    type: "dropdown",
    key: "pembelajaran",
    label: "Pembelajaran",
    icon: <Library className="w-[18px] h-[18px] shrink-0" />,
    children: [
      {
        key: "materi",
        to: "/peserta/pembelajaran/materi",
        label: "Materi Pembelajaran",
        icon: <BookOpen className="w-4 h-4 shrink-0" />,
      },
      {
        key: "tugas",
        to: "/peserta/pembelajaran/tugas",
        label: "Tugas Magang",
        icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    type: "dropdown",
    key: "penilaian",
    label: "Penilaian Akhir",
    icon: <GraduationCap className="w-[18px] h-[18px] shrink-0" />,
    children: [
      {
        key: "laporan",
        to: "/peserta/penilaian/laporan",
        label: "Laporan Akhir",
        icon: <FileText className="w-4 h-4 shrink-0" />,
      },
      {
        key: "rapor",
        to: "/peserta/penilaian/rapor",
        label: "Rapor Nilai",
        icon: <Award className="w-4 h-4 shrink-0" />,
      },
      {
        key: "sertifikat",
        to: "/peserta/penilaian/sertifikat",
        label: "Sertifikat Magang",
        icon: <Medal className="w-4 h-4 shrink-0" />,
      },
    ],
  },
];

const tabTitles = {
  dashboard: { title: "Dashboard", desc: "Ringkasan aktivitas dan progres magang Anda" },
  akun: { title: "Kelola Akun", desc: "Atur informasi dan keamanan akun Anda" },
  presensi: { title: "Presensi & Logbook", desc: "Presensi harian datang & kepulangan dinas serta pengisian jurnal aktivitas hari ini" },
  izin: { title: "Pengajuan Izin & Sakit", desc: "Kelola permohonan izin atau sakit yang diverifikasi mentor" },
  "riwayat-aktivitas": { title: "Riwayat Aktivitas & Presensi", desc: "Rekapitulasi lengkap riwayat presensi harian, permohonan izin, logbook, dan ekspor dokumen" },
  riwayat: { title: "Riwayat Aktivitas & Presensi", desc: "Rekapitulasi lengkap riwayat presensi harian, permohonan izin, logbook, dan ekspor dokumen" },
  logbook: { title: "Riwayat Aktivitas & Presensi", desc: "Rekapitulasi lengkap riwayat presensi harian, permohonan izin, logbook, dan ekspor dokumen" },
  materi: { title: "Materi Pembelajaran", desc: "Modul teknis, SOP dinas, dan referensi kerja magang Diskominfo" },
  tugas: { title: "Tugas & Penugasan Magang", desc: "Penugasan terstruktur dari mentor untuk meningkatkan kompetensi" },
  laporan: { title: "Laporan Akhir Magang", desc: "Unggah naskah laporan akhir praktek kerja dan luaran proyek magang" },
  rapor: { title: "Rapor Transkrip Nilai", desc: "Evaluasi kinerja 4 pilar kompetensi dan transkrip resmi bertanda tangan" },
  sertifikat: { title: "Sertifikat Kelulusan Magang", desc: "Dokumen sertifikat resmi Diskominfo dengan nomor registrasi sah" },
};

const PesertaLayout = ({ children, searchValue = "", onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(() => getUser() || null);
  const [readOnly, setReadOnly] = useState(() => isMagangSelesai());
  const { isDark, setIsDark } = useManajemenTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMe();
        const data = res.data.data;
        setProfile(data);

        // Sinkronkan status magang terbaru dari server ke penyimpanan lokal
        const selesai = data?.role === "peserta" && data?.status_magang === "selesai";
        updateAuthUser({ status_magang: data?.status_magang || "aktif" });
        setReadOnly(selesai);
      } catch {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    const result = await confirmDialog({
      title: "Keluar dari akun?",
      confirmText: "Ya, Keluar",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await logoutAdmin();
    } catch {
      // tetap lanjut hapus sesi lokal walau request gagal
    } finally {
      clearAuthData();
      navigate("/login");
    }
  };

  const [lencanaCounts, setLencanaCounts] = useState(initialLencanaPeserta);

  // Sinkronisasi hitungan lencana notifikasi belum dibaca untuk sidebar
  const sinkronkanLencana = useCallback(async (listBaru = null) => {
    if (Array.isArray(listBaru)) {
      setLencanaCounts(hitungLencanaPesertaDariNotifikasi(listBaru));
      return;
    }
    try {
      const res = await getNotifikasi({ limit: 100 });
      const rawList = res.data?.data?.items ?? [];
      setLencanaCounts(hitungLencanaPesertaDariNotifikasi(rawList));
    } catch {
      // diamkan error agar tidak mengganggu UI peserta
    }
  }, []);

  useEffect(() => {
    const timerAwal = setTimeout(() => {
      sinkronkanLencana();
    }, 0);
    const interval = setInterval(() => sinkronkanLencana(), 30000);

    const handleUpdated = () => sinkronkanLencana();
    const handleSynced = (e) => {
      if (e?.detail?.items) {
        sinkronkanLencana(e.detail.items);
      } else {
        sinkronkanLencana();
      }
    };

    window.addEventListener("sim_notifikasi_updated", handleUpdated);
    window.addEventListener("sim_notif_settings_changed", handleUpdated);
    window.addEventListener("sim_notifikasi_synced", handleSynced);
    window.addEventListener("storage", handleUpdated);

    return () => {
      clearTimeout(timerAwal);
      clearInterval(interval);
      window.removeEventListener("sim_notifikasi_updated", handleUpdated);
      window.removeEventListener("sim_notif_settings_changed", handleUpdated);
      window.removeEventListener("sim_notifikasi_synced", handleSynced);
      window.removeEventListener("storage", handleUpdated);
    };
  }, [sinkronkanLencana]);

  // Petakan lencana ke salinan navItems (termasuk submenu dropdown)
  const navItemsWithBadge = useMemo(() => {
    const base = buildNavItems(readOnly);
    return base.map((item) => {
      if (item.type === "dropdown" && Array.isArray(item.children)) {
        return {
          ...item,
          children: item.children.map((child) => ({
            ...child,
            badge: lencanaCounts[child.key] || 0,
          })),
        };
      }
      return {
        ...item,
        badge: lencanaCounts[item.key] || 0,
      };
    });
  }, [readOnly, lencanaCounts]);

  const pathname = location.pathname;
  const activeKey =
    pathname === "/peserta" ? "dashboard" :
    pathname.startsWith("/peserta/akun") ? "akun" :
    pathname.startsWith("/peserta/presensi") ? "presensi" :
    pathname.startsWith("/peserta/riwayat-aktivitas") || pathname.startsWith("/peserta/riwayat") || pathname.startsWith("/peserta/logbook") ? "riwayat-aktivitas" :
    pathname.startsWith("/peserta/pengajuan-izin") || pathname.startsWith("/peserta/izin") ? "izin" :
    pathname.startsWith("/peserta/pembelajaran/materi") || pathname.startsWith("/peserta/materi") ? "materi" :
    pathname.startsWith("/peserta/pembelajaran/tugas") || pathname.startsWith("/peserta/tugas") ? "tugas" :
    pathname.startsWith("/peserta/penilaian/laporan") || pathname.startsWith("/peserta/laporan-akhir") ? "laporan" :
    pathname.startsWith("/peserta/penilaian/rapor") || pathname === "/peserta/penilaian" ? "rapor" :
    pathname.startsWith("/peserta/penilaian/sertifikat") || pathname.startsWith("/peserta/sertifikat") ? "sertifikat" : "dashboard";

  const currentTab = tabTitles[activeKey] || tabTitles.dashboard;

  return (
    <ManajemenShell
      navItems={navItemsWithBadge}
      activeKey={activeKey}
      handleLogout={handleLogout}
      roleLabel={readOnly ? "Alumni Magang" : "Peserta"}
      profile={profile}
      homePath="/peserta"
      kelolaAkunPath="/peserta/akun"
      currentTab={currentTab}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isDark={isDark}
      setIsDark={setIsDark}
    >
      {readOnly && (
        <div className="mb-6">
          <AlumniBanner />
        </div>
      )}
      {children}
    </ManajemenShell>
  );
};

export default PesertaLayout;