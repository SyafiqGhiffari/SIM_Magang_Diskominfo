import MentorLayout from "../../layouts/MentorLayout";

const MentorDashboardPage = () => {
  return (
    <MentorLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Selamat Datang, Mentor</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Fitur bimbingan peserta magang akan tersedia di sini.</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 text-center text-slate-400 text-sm">
          Belum ada fitur yang tersedia untuk role mentor.
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorDashboardPage;