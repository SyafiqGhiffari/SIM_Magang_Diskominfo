import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  MailCheck,
  Users,
  BookOpenText,
  Briefcase,
  ListTodo,
  FileSearch,
  FileBadge,
  GraduationCap,
  Scale,
  Award,
} from "lucide-react";
import ManajemenShell from "../components/manajemen/shared/layout/ManajemenShell";
import { getHitunganAntreanMentor } from "../services/mentorService";
import { useManajemenTheme } from "../context/useManajemenTheme";
import { logoutAdmin, getMe } from "../services/authService";
import { confirmDialog } from "../utils/swal";
import { clearAuthData, getUser, updateAuthUser } from "../utils/authStorage";

const dashboardIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const navItems = [
  {
    key: "dashboard",
    to: "/mentor",
    label: "Dashboard",
    icon: dashboardIcon,
  },
  {
    key: "peserta",
    to: "/mentor/peserta",
    label: "Peserta Bimbingan",
    icon: <Users className="w-[18px] h-[18px] shrink-0" />,
  },
  {
    type: "dropdown",
    key: "presensi",
    label: "Kelola Presensi",
    icon: <CalendarCheck className="w-[18px] h-[18px] shrink-0" />,
    children: [
      { key: "presensi-bimbingan", to: "/mentor/presensi", label: "Presensi Bimbingan", icon: <ClipboardList className="w-4 h-4 shrink-0" /> },
      { key: "verifikasi-izin", to: "/mentor/pengajuan-izin", label: "Verifikasi Izin", icon: <MailCheck className="w-4 h-4 shrink-0" /> },
    ],
  },
  {
    key: "kelola-materi",
    to: "/mentor/materi",
    label: "Materi Pembelajaran",
    icon: <BookOpenText className="w-[18px] h-[18px] shrink-0" />,
  },
  {
    type: "dropdown",
    key: "kelola-tugas",
    label: "Kelola Tugas",
    icon: <Briefcase className="w-[18px] h-[18px] shrink-0" />,
    children: [
      { key: "daftar-tugas", to: "/mentor/tugas", label: "Daftar Tugas", icon: <ListTodo className="w-4 h-4 shrink-0" /> },
      { key: "review-tugas", to: "/mentor/tugas/review", label: "Review Tugas", icon: <FileSearch className="w-4 h-4 shrink-0" /> },
    ],
  },
  {
    key: "laporan-akhir",
    to: "/mentor/laporan-akhir",
    label: "Laporan Akhir",
    icon: <FileBadge className="w-[18px] h-[18px] shrink-0" />,
  },
  {
    type: "dropdown",
    key: "penilaian-akhir",
    label: "Penilaian Akhir",
    icon: <GraduationCap className="w-[18px] h-[18px] shrink-0" />,
    children: [
      { key: "penilaian", to: "/mentor/penilaian", label: "Penilaian 4 Pilar", icon: <Scale className="w-4 h-4 shrink-0" /> },
      { key: "rekap-penilaian", to: "/mentor/penilaian/rekap", label: "Rekap Nilai Akhir", icon: <Award className="w-4 h-4 shrink-0" /> },
    ],
  },
];

const tabTitles = {
  dashboard: { title: "Dashboard", desc: "Ringkasan aktivitas bimbingan magang dan metrik utama" },
  akun: { title: "Kelola Akun", desc: "Atur informasi dan keamanan akun Anda" },
  peserta: { title: "Daftar Peserta Bimbingan", desc: "Pantau profil, institusi asal, kontak, dan status keaktifan seluruh peserta magang bimbingan Anda" },
  "presensi-bimbingan": { title: "Presensi Bimbingan", desc: "Pantau dan koreksi presensi peserta bimbingan Anda" },
  "verifikasi-izin": { title: "Verifikasi Izin & Sakit", desc: "Setujui atau tolak pengajuan izin peserta bimbingan" },
  "kelola-materi": { title: "Materi Pembelajaran", desc: "Kelola dan bagikan materi pembelajaran serta modul referensi untuk peserta bimbingan Anda" },
  "daftar-tugas": { title: "Daftar Tugas Magang", desc: "Buat penugasan proyek dan tugas terstruktur untuk menguji capaian kompetensi peserta bimbingan" },
  "review-tugas": { title: "Review & Penilaian Tugas", desc: "Periksa berkas tugas yang dikumpulkan peserta bimbingan, beri umpan balik evaluasi, dan tetapkan skor nilai" },
  "laporan-akhir": { title: "Laporan Akhir Peserta", desc: "Periksa naskah laporan akhir praktek kerja dan luaran proyek akhir yang diunggah peserta" },
  penilaian: { title: "Penilaian 4 Pilar Peserta", desc: "Evaluasi kinerja 4 pilar kompetensi untuk peserta bimbingan Anda" },
  "rekap-penilaian": { title: "Rekap Transkrip Nilai", desc: "Ringkasan rekapitulasi nilai akhir 4 pilar kompetensi seluruh peserta magang bimbingan Anda" },
};

const MentorLayout = ({ children, searchValue = "", onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(() => getUser() || null);
  const { isDark, setIsDark } = useManajemenTheme();
  const [hitunganIzin, setHitunganIzin] = useState(0);

  useEffect(() => {
    const ambil = async () => {
      try {
        const res = await getHitunganAntreanMentor();
        if (res.data?.data) {
          setHitunganIzin(res.data.data?.izin || 0);
        }
      } catch {
        /* diam */
      }
    };
    ambil();
    const t = setInterval(ambil, 30000);
    return () => clearInterval(t);
  }, []);

  const navItemsWithBadge = useMemo(
    () =>
      navItems.map((item) => {
        if (item.key === "presensi") {
          return {
            ...item,
            children: item.children.map((c) =>
              c.key === "verifikasi-izin" ? { ...c, badge: hitunganIzin } : c
            ),
          };
        }
        return item;
      }),
    [hitunganIzin]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMe();
        if (res.data?.data) {
          setProfile(res.data.data);
          updateAuthUser(res.data.data);
        }
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

  const pathname = location.pathname;
  const activeKey =
    pathname === "/mentor" ? "dashboard" :
    pathname.startsWith("/mentor/akun") ? "akun" :
    pathname.startsWith("/mentor/peserta") ? "peserta" :
    pathname.startsWith("/mentor/pengajuan-izin") ? "verifikasi-izin" :
    pathname.startsWith("/mentor/presensi") ? "presensi-bimbingan" :
    pathname.startsWith("/mentor/materi") ? "kelola-materi" :
    pathname.startsWith("/mentor/tugas/review") || pathname.startsWith("/mentor/tugas/penyerahan") ? "review-tugas" :
    pathname.startsWith("/mentor/tugas") ? "daftar-tugas" :
    pathname.startsWith("/mentor/laporan-akhir") ? "laporan-akhir" :
    pathname.startsWith("/mentor/penilaian/rekap") ? "rekap-penilaian" :
    pathname.startsWith("/mentor/penilaian") ? "penilaian" : "dashboard";

  const currentTab = tabTitles[activeKey] || tabTitles.dashboard;

  return (
    <ManajemenShell
      navItems={navItemsWithBadge}
      activeKey={activeKey}
      handleLogout={handleLogout}
      roleLabel="Mentor"
      profile={profile}
      homePath="/mentor"
      kelolaAkunPath="/mentor/akun"
      currentTab={currentTab}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isDark={isDark}
      setIsDark={setIsDark}
    >
      {children}
    </ManajemenShell>
  );
};

export default MentorLayout;