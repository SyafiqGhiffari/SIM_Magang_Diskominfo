import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import StatCard from "../../components/manajemen/admin/dashboard/StatCard";
import RecentApplicationsCard from "../../components/manajemen/admin/dashboard/RecentApplicationsCard";
import UserManagementCard from "../../components/manajemen/admin/dashboard/UserManagementCard";
import BidangDistributionCard from "../../components/manajemen/admin/dashboard/BidangDistributionCard";
import { getAllPendaftaran, getAllAkun } from "../../services/adminService";
import { getProfile } from "../../services/authService";
import { toastError } from "../../utils/swal";
import { Users, Clock3, GraduationCap, Info, Sparkles, LayoutDashboard, Lightbulb } from "lucide-react";

const DAILY_TARGET = 20;

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 11) return "Selamat Pagi";
  if (hr < 15) return "Selamat Siang";
  if (hr < 19) return "Selamat Sore";
  return "Selamat Malam";
};

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const isSameMonth = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

const DashboardPage = () => {
  const [pendaftaranList, setPendaftaranList] = useState([]);
  const [akunList, setAkunList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes, profRes] = await Promise.all([getAllPendaftaran(), getAllAkun(), getProfile()]);
        setPendaftaranList(pRes.data.data || []);
        setAkunList(aRes.data.data || []);
        setProfile(profRes.data.data || null);
      } catch (err) {
        toastError(err.response?.data?.message || "Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = pendaftaranList.length;
  const menunggu = pendaftaranList.filter((p) => p.status_pendaftaran === "menunggu");
  const diterima = pendaftaranList.filter((p) => p.status_pendaftaran === "diterima");

  const now = new Date();
  const verifiedToday = pendaftaranList.filter(
    (p) => p.status_pendaftaran !== "menunggu" && isSameDay(p.updated_at, now)
  ).length;
  const targetPct = Math.min(100, Math.round((verifiedToday / DAILY_TARGET) * 100));

  const thisMonthCount = pendaftaranList.filter((p) => isSameMonth(p.created_at, now)).length;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthCount = pendaftaranList.filter((p) => isSameMonth(p.created_at, lastMonthDate)).length;
  const growthPct = lastMonthCount === 0 ? null : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

  const divisionMap = {};
  diterima.forEach((p) => {
    const key = p.posisi_bidang || "Belum ditentukan";
    divisionMap[key] = (divisionMap[key] || 0) + 1;
  });
  const divisions = Object.entries(divisionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const distinctDivisionCount = divisions.length;

  const handleVerifikasi = () => {
    toastError("Halaman Kelola Pendaftaran belum tersedia. Fitur ini akan segera hadir.");
  };

  return (
    <AdminLayout showSearch={false}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Hero Welcome Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#030712] via-[#0B1442] to-[#1E3A8A] p-7 text-white shadow-xl shadow-[#0B1442]/30 border border-white/5">
          <div className="absolute right-12 bottom-[-20px] w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute left-[20%] top-[-20px] w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <LayoutDashboard className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.06] text-sky-400 pointer-events-none transform rotate-6" strokeWidth={1} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#00A5EC] animate-pulse" />
              <span>{getGreeting()}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,165,236,0.2)]">
              {profile?.nama || "Admin"}
            </h2>
            <p className="text-xs text-white/70 mt-2 font-sans max-w-xl leading-relaxed">
              Pantau dan kelola pendaftaran magang, akun manajemen, serta distribusi peserta di Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo dalam satu dashboard.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data dashboard...
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                icon={Users}
                label="Total Pendaftar"
                value={total.toLocaleString("id-ID")}
                sub="Pendaftar tahun ajaran ini"
                badge={growthPct !== null ? `${growthPct >= 0 ? "+" : ""}${growthPct}%` : undefined}
                badgeColor={growthPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                accentFrom="#0B1442"
                accentTo="#00A5EC"
              />
              <StatCard
                icon={Clock3}
                label="Menunggu Verifikasi"
                value={menunggu.length.toLocaleString("id-ID")}
                badge={menunggu.length > 0 ? "Urgent" : undefined}
                badgeColor="bg-red-500 text-white"
                progress={targetPct}
                progressLabel={`${targetPct}% Target verifikasi harian`}
                accentFrom="#b45309"
                accentTo="#f59e0b"
              />
              <StatCard
                icon={GraduationCap}
                label="Peserta Magang Aktif"
                value={diterima.length.toLocaleString("id-ID")}
                sub={`Tersebar di ${distinctDivisionCount} bidang`}
                badge="Aktif"
                badgeColor="bg-blue-50 text-blue-600"
                accentFrom="#065f46"
                accentTo="#10b981"
              />
            </div>

            {/* Distribusi per Bidang + Aplikasi Terbaru (kiri) sejajar dengan Manajemen User (kanan, memenuhi tinggi keduanya) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              <div className="lg:col-span-2 flex flex-col gap-5">
                <BidangDistributionCard divisions={divisions} />
                <RecentApplicationsCard pendaftaranList={pendaftaranList} onVerifikasi={handleVerifikasi} />
              </div>
              <UserManagementCard akunList={akunList} />
            </div>
            {/* Informasi Penting — card standalone di paling bawah */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white p-6 shadow-xl shadow-[#0B1442]/20 border border-white/5">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#00A5EC]/10 blur-3xl pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#00A5EC] backdrop-blur-md">
                  <Lightbulb className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3.5 h-3.5 text-[#00A5EC]" />
                    <h4 className="text-sm font-black">Informasi Penting</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-white/75 max-w-2xl">
                    Pastikan setiap pendaftaran yang berstatus <b className="text-white">Menunggu</b> diverifikasi
                    maksimal 3 hari kerja sejak diterima, agar proses seleksi peserta magang tetap berjalan tepat
                    waktu dan tidak menumpuk di akhir periode pendaftaran.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;