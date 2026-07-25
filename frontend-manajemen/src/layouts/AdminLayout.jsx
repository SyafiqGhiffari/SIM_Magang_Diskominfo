import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Users, HelpCircle, Building2, UserCog, GraduationCap, CalendarClock, Award, ScrollText, Palette } from "lucide-react";
import ManajemenShell from "../components/manajemen/shared/layout/ManajemenShell";
import ChatFloatingWidget from "../components/manajemen/admin/chat/ChatFloatingWidget";
import { useManajemenTheme } from "../context/useManajemenTheme";
import { logoutAdmin, getProfile } from "../services/authService";
import { confirmDialog } from "../utils/swal";
import { clearAuthData } from "../utils/authStorage";

const navItems = [
  {
    key: "dashboard",
    to: "/admin",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  { type: "section", label: "Sistem Pendaftaran" },
  { key: "pendaftaran", to: "/admin/pendaftaran", label: "Kelola Pendaftaran", icon: <FileText className="w-[18px] h-[18px] shrink-0" /> },
  { key: "faq", to: "/admin/faq", label: "FAQ & Quick Action", icon: <HelpCircle className="w-[18px] h-[18px] shrink-0" /> },
  { type: "section", label: "Sistem Manajemen" },
  {
    type: "dropdown",
    key: "pengguna",
    label: "Kelola Pengguna",
    icon: <Users className="w-[18px] h-[18px] shrink-0" />,
    children: [
      { key: "mentor", to: "/admin/mentor", label: "Kelola Mentor", icon: <UserCog className="w-4 h-4 shrink-0" /> },
      { key: "peserta", to: "/admin/peserta", label: "Kelola Peserta", icon: <GraduationCap className="w-4 h-4 shrink-0" /> },
    ],
  },
    { key: "bidang", to: "/admin/bidang", label: "Kelola Bidang", icon: <Building2 className="w-[18px] h-[18px] shrink-0" /> },
    { key: "jam-kerja", to: "/admin/jam-kerja", label: "Jam Kerja & Libur", icon: <CalendarClock className="w-[18px] h-[18px] shrink-0" /> },
    {
      type: "dropdown",
      key: "sertifikat",
      label: "Kelola Sertifikat",
      icon: <Award className="w-[18px] h-[18px] shrink-0" />,
      children: [
        { key: "sertifikat-daftar", to: "/admin/sertifikat", label: "Daftar Sertifikat", icon: <ScrollText className="w-4 h-4 shrink-0" /> },
        { key: "sertifikat-template", to: "/admin/sertifikat/template", label: "Template Sertifikat", icon: <Palette className="w-4 h-4 shrink-0" /> },
      ],
    },
];

const tabTitles = {
  dashboard: { title: "Dashboard", desc: "Ringkasan aktivitas sistem magang" },
  pendaftaran: { title: "Kelola Pendaftaran", desc: "Verifikasi dan kelola berkas pendaftaran magang" },
  bidang: { title: "Kelola Bidang", desc: "Atur daftar bidang penempatan magang" },
  mentor: { title: "Kelola Mentor", desc: "Kelola akun mentor dan penugasan bidangnya" },
  peserta: { title: "Kelola Peserta", desc: "Kelola akun peserta magang yang telah diterima" },
  faq: { title: "FAQ & Quick Action", desc: "Kelola jawaban otomatis chatbot" },
  akun: { title: "Kelola Akun", desc: "Atur informasi dan keamanan akun Anda" },
  "jam-kerja": { title: "Jam Kerja & Hari Libur", desc: "Atur jam kerja harian dan hari libur untuk presensi peserta" },
  "sertifikat-daftar": { title: "Kelola Sertifikat", desc: "Terbitkan dan kelola sertifikat magang peserta" },
  "sertifikat-template": { title: "Template Sertifikat", desc: "Kelola desain template sertifikat magang" },
};

const AdminLayout = ({ children, searchValue = "", onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const { isDark, setIsDark } = useManajemenTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data.data);
      } catch {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    const result = await confirmDialog({
      title: "Keluar dari akun?",
      text: "Anda perlu masuk kembali untuk mengakses dashboard.",
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
    location.pathname === "/admin" ? "dashboard" :
    location.pathname.startsWith("/admin/pendaftaran") ? "pendaftaran" :
    location.pathname.startsWith("/admin/bidang") ? "bidang" :
    location.pathname.startsWith("/admin/mentor") ? "mentor" :
    location.pathname.startsWith("/admin/peserta") ? "peserta" :
    location.pathname.startsWith("/admin/faq") ? "faq" :
    location.pathname.startsWith("/admin/jam-kerja") ? "jam-kerja" :
    location.pathname.startsWith("/admin/sertifikat/template") ? "sertifikat-template" :
    location.pathname.startsWith("/admin/sertifikat") ? "sertifikat-daftar" :
    location.pathname.startsWith("/admin/akun") ? "akun" : "dashboard";

  const currentTab = tabTitles[activeKey] || tabTitles.dashboard;

  return (
    <>
      <ManajemenShell
        navItems={navItems}
        activeKey={activeKey}
        handleLogout={handleLogout}
        roleLabel="Admin"
        profile={profile}
        homePath="/admin"
        kelolaAkunPath="/admin/akun"
        currentTab={currentTab}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        isDark={isDark}
        setIsDark={setIsDark}
      >
        {children}
      </ManajemenShell>
      <ChatFloatingWidget isDark={isDark} />
    </>
  );
};

export default AdminLayout;