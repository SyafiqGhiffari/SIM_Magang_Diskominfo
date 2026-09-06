import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarCheck, ClipboardList, MailCheck, ClipboardCheck } from "lucide-react";
import ManajemenShell from "../components/manajemen/shared/layout/ManajemenShell";
import { getHitunganAntreanMentor } from "../services/mentorService";
import { logoutAdmin, getMe } from "../services/authService";
import { confirmDialog } from "../utils/swal";
import { clearAuthData, getUser, updateAuthUser } from "../utils/authStorage";

const navItems = [
  {
    key: "dashboard",
    to: "/mentor",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
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
    key: "penilaian",
    to: "/mentor/penilaian",
    label: "Penilaian Peserta",
    icon: <ClipboardCheck className="w-[18px] h-[18px] shrink-0" />,
  },
];

const tabTitles = {
  dashboard: { title: "Dashboard", desc: "Ringkasan aktivitas bimbingan magang" },
  akun: { title: "Kelola Akun", desc: "Atur informasi dan keamanan akun Anda" },
  "presensi-bimbingan": { title: "Presensi Bimbingan", desc: "Pantau dan koreksi presensi peserta bimbingan Anda" },
  "verifikasi-izin": { title: "Verifikasi Izin & Sakit", desc: "Setujui atau tolak pengajuan izin peserta bimbingan" },
  penilaian: { title: "Penilaian Peserta", desc: "Evaluasi kinerja 4 pilar kompetensi untuk peserta bimbingan Anda" },
};

const MentorLayout = ({ children, searchValue = "", onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(() => getUser() || null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin_theme") === "dark");
  const [hitunganIzin, setHitunganIzin] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin_theme", "light");
    }
  }, [isDark]);

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

  const activeKey =
    location.pathname === "/mentor" ? "dashboard" :
    location.pathname.startsWith("/mentor/akun") ? "akun" :
    location.pathname.startsWith("/mentor/pengajuan-izin") ? "verifikasi-izin" :
    location.pathname.startsWith("/mentor/presensi") ? "presensi-bimbingan" :
    location.pathname.startsWith("/mentor/penilaian") ? "penilaian" : "dashboard";

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