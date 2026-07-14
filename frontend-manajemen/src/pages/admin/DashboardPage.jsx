import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import StatCard from "../../components/manajemen/admin/dashboard/StatCard";
import RecentApplicationsCard from "../../components/manajemen/admin/dashboard/RecentApplicationsCard";
import UserManagementCard from "../../components/manajemen/admin/dashboard/UserManagementCard";
import DivisionDistributionCard from "../../components/manajemen/admin/dashboard/DivisionDistributionCard";
import { getAllPendaftaran, getAllAkun } from "../../services/adminService";
import { toastError } from "../../utils/swal";
import { Users, Clock3, GraduationCap, Info } from "lucide-react";

const DAILY_TARGET = 20;

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const isSameMonth = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

const DashboardPage = () => {
  const [pendaftaranList, setPendaftaranList] = useState([]);
  const [akunList, setAkunList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.all([getAllPendaftaran(), getAllAkun()]);
        setPendaftaranList(pRes.data.data || []);
        setAkunList(aRes.data.data || []);
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
  const divisions = Object.entries(divisionMap).map(([name, count]) => ({ name, count }));
  const distinctDivisionCount = divisions.length;

  const handleVerifikasi = () => {
    toastError("Halaman Kelola Pendaftaran belum tersedia. Fitur ini akan segera hadir.");
  };

  return (
    <AdminLayout showSearch={false}>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Memuat data dashboard...</div>
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
              />
              <StatCard
                icon={Clock3}
                label="Menunggu Verifikasi"
                value={menunggu.length.toLocaleString("id-ID")}
                badge={menunggu.length > 0 ? "Urgent" : undefined}
                badgeColor="bg-red-500 text-white"
                progress={targetPct}
                progressLabel={`${targetPct}% Target verifikasi harian`}
              />
              <StatCard
                icon={GraduationCap}
                label="Peserta Magang Aktif"
                value={diterima.length.toLocaleString("id-ID")}
                sub={`Tersebar di ${distinctDivisionCount} bidang`}
                badge="Aktif"
                badgeColor="bg-blue-50 text-blue-600"
              />
            </div>

            {/* Aplikasi Terbaru & Manajemen User */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <RecentApplicationsCard pendaftaranList={pendaftaranList} onVerifikasi={handleVerifikasi} />
              </div>
              <div className="space-y-5">
                <UserManagementCard akunList={akunList} />

                {/* Informasi Penting — menggantikan "Evaluasi Akhir Bulan" */}
                <div className="rounded-2xl bg-gradient-to-br from-[#0B1442] to-[#1E3A8A] text-white p-5 shadow-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#00A5EC]" />
                    <h4 className="text-sm font-black">Informasi Penting</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-white/80">
                    Pastikan setiap pendaftaran yang berstatus <b>Menunggu</b> diverifikasi maksimal 3 hari kerja sejak
                    diterima, agar proses seleksi peserta magang tetap berjalan tepat waktu.
                  </p>
                </div>
              </div>
            </div>

            {/* Distribusi per Divisi */}
            <div>
              <h3 className="mb-3 text-sm font-black text-[#0B1442]">Distribusi per Divisi</h3>
              <DivisionDistributionCard divisions={divisions} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;