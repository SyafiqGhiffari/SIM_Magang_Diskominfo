import PesertaLayout from "../../layouts/PesertaLayout";

const PesertaDashboardPage = () => {
  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Selamat Datang, Peserta Magang</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Fitur logbook dan absensi magang akan tersedia di sini.</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 text-center text-slate-400 text-sm">
          Belum ada fitur yang tersedia untuk role peserta.
        </div>
      </div>
    </PesertaLayout>
  );
};

export default PesertaDashboardPage;