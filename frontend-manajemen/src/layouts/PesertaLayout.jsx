import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarCheck, Fingerprint, FileText } from "lucide-react";
import ManajemenShell from "../components/manajemen/shared/layout/ManajemenShell";
import AlumniBanner from "../components/manajemen/peserta/AlumniBanner";
import { logoutAdmin, getProfile } from "../services/authService";
import { confirmDialog } from "../utils/swal";
import { clearAuthData, updateAuthUser, isMagangSelesai } from "../utils/authStorage";

const dashboardIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

// Label menu menyesuaikan status magang: alumni hanya bisa melihat riwayat.
const buildNavItems = (readOnly) => [
  {
    key: "dashboard",
    to: "/peserta",
    label: "Dashboard",
    icon: dashboardIcon,
  },
  {
    type: "dropdown",
    key: "presensi",
    label: readOnly ? "Riwayat Magang" : "Presensi Saya",
    icon: <CalendarCheck className="w-[18px] h-[18px] shrink-0" />,
    children: [
      {
        key: "presensi-absen",
        to: "/peserta/presensi",
        label: readOnly ? "Riwayat Presensi" : "Absen & Riwayat",
        icon: <Fingerprint className="w-4 h-4 shrink-0" />,
      },
      {
        key: "presensi-izin",
        to: "/peserta/pengajuan-izin",
        label: readOnly ? "Riwayat Izin" : "Pengajuan Izin",
        icon: <FileText className="w-4 h-4 shrink-0" />,
      },
    ],
  },
];

const tabTitles = {
  dashboard: { title: "Dashboard", desc: "Ringkasan aktivitas magang Anda" },
  akun: { title: "Kelola Akun", desc: "Atur informasi dan keamanan akun Anda" },
  "presensi-absen": { title: "Presensi Saya", desc: "Lakukan absen masuk/pulang dan pantau riwayat kehadiran" },
  "presensi-izin": { title: "Pengajuan Izin", desc: "Ajukan izin atau sakit untuk diverifikasi mentor" },
};

const PesertaLayout = ({ children, searchValue = "", onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [readOnly, setReadOnly] = useState(() => isMagangSelesai());
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin_theme") === "dark");

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
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
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

  const activeKey =
    location.pathname === "/peserta" ? "dashboard" :
    location.pathname.startsWith("/peserta/akun") ? "akun" :
    location.pathname.startsWith("/peserta/pengajuan-izin") ? "presensi-izin" :
    location.pathname.startsWith("/peserta/presensi") ? "presensi-absen" : "dashboard";

  const currentTab = tabTitles[activeKey] || tabTitles.dashboard;

  return (
    <ManajemenShell
      navItems={buildNavItems(readOnly)}
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