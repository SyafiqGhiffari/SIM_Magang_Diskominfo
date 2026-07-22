import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ManajemenSidebar from "./ManajemenSidebar";
import ManajemenTopbar from "./ManajemenTopbar";

// ==== Skeleton loading — dipakai langsung di dalam shell ini, tidak perlu file terpisah ====
const SkeletonLoader = ({ isDark }) => (
  <div className="space-y-6 animate-[fadeslide_0.2s_ease-out]">
    {/* Header skeleton */}
    <div className={`rounded-2xl border p-6 ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"}`}>
      <div className="space-y-3">
        <div className={`h-3 w-24 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
        <div className={`h-6 w-48 rounded-full animate-pulse ${isDark ? "bg-white/15" : "bg-slate-300"}`} />
        <div className={`h-3 w-full max-w-sm rounded-full animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
      </div>
    </div>

    {/* Grid card skeleton */}
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`rounded-2xl border p-5 space-y-4 ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"}`}>
          <div className={`h-10 w-10 rounded-xl animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className="space-y-2">
            <div className={`h-3.5 w-24 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            <div className={`h-2.5 w-full rounded-full animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
          </div>
        </div>
      ))}
    </div>

    {/* Table/content block skeleton */}
    <div className={`rounded-2xl border p-6 space-y-4 ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/80"}`}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className={`h-10 w-10 shrink-0 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-1/3 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            <div className={`h-2.5 w-2/3 rounded-full animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-center gap-2.5 py-3">
      <div className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${isDark ? "border-[#00A5EC]" : "border-[#004F9F]"}`} />
      <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Memuat halaman...</span>
    </div>
  </div>
);
// ==== Akhir bagian skeleton ====

// ==== PERUBAHAN: path sebelumnya disimpan di luar komponen (module scope),
// karena AdminLayout/ManajemenShell di-unmount & mount ulang setiap ganti halaman
// (tiap page membungkus dirinya sendiri dengan <AdminLayout>), sehingga state React
// biasa selalu "reset" dan tidak sempat mendeteksi perubahan.
let lastKnownPathname = null;
// ==== AKHIR PERUBAHAN ====

const ManajemenShell = ({
    children,
    navItems,
    activeKey,
    handleLogout,
    roleLabel,
    profile,
    homePath,
    kelolaAkunPath,
    currentTab,
    searchValue,
    onSearchChange,
    isDark,
    setIsDark,
  }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==== PERUBAHAN: deteksi perpindahan tab via lazy initializer, dicek sekali saat
  // instance ini pertama kali dibuat (yaitu setiap kali halaman berganti) ====
  const [tabLoading, setTabLoading] = useState(() => {
    const shouldShowSkeleton =
      lastKnownPathname !== null && lastKnownPathname !== location.pathname;
    lastKnownPathname = location.pathname;
    return shouldShowSkeleton;
  });

  useEffect(() => {
    if (!tabLoading) return;
    const t = setTimeout(() => setTabLoading(false), 450);
    return () => clearTimeout(t);
  }, [tabLoading]);
  // ==== AKHIR PERUBAHAN ====

  return (
    <div className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#0d1117]" : "bg-slate-50"}`}>
      <ManajemenSidebar
        navItems={navItems}
        activeKey={activeKey}
        handleLogout={handleLogout}
        roleLabel={roleLabel}
        profile={profile}
        homePath={homePath}
        kelolaAkunPath={kelolaAkunPath}
        isDark={isDark}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ManajemenTopbar
          currentTab={currentTab}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          isDark={isDark}
          setIsDark={setIsDark}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {tabLoading ? <SkeletonLoader isDark={isDark} /> : children}
        </main>
      </div>
    </div>
  );
};

export default ManajemenShell;