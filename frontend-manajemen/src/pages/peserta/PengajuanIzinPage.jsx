import { useCallback, useEffect, useState } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import FormPengajuanIzinModal from "../../components/manajemen/peserta/presensi/FormPengajuanIzinModal";
import { getPengajuanIzinSaya, batalkanPengajuanIzin } from "../../services/pesertaService";
import { formatTanggalPresensi } from "../../constants/presensiStatus";
import { getFileUrl } from "../../utils/fileUrl";
import { confirmDialog, toastError, toastSuccess } from "../../utils/swal";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  FileText, HeartPulse, Plus, CalendarRange, Paperclip, Trash2, Inbox,
  Loader2, Clock, CheckCircle2, Ban, ShieldCheck, MessageSquare,
} from "lucide-react";

const TAB_STATUS = [
  { key: "", label: "Semua", icon: ShieldCheck },
  { key: "menunggu", label: "Menunggu", icon: Clock },
  { key: "disetujui", label: "Disetujui", icon: CheckCircle2 },
  { key: "ditolak", label: "Ditolak", icon: Ban },
];

const badgeStatus = {
  menunggu: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  disetujui: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  ditolak: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

const PengajuanIzinPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai(); // alumni: riwayat izin saja

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusTab, setStatusTab] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = statusTab ? { status: statusTab } : {};
      const res = await getPengajuanIzinSaya(params);
      setRows(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat pengajuan Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusTab]);

  useEffect(() => {
    const id = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(id);
  }, [fetchData, reloadKey]);

  const handleBatal = async (row) => {
    const konfirmasi = await confirmDialog({
      title: "Batalkan pengajuan ini?",
      confirmText: "Ya, Batalkan",
      icon: "warning",
      danger: true,
    });
    if (!konfirmasi.isConfirmed) return;

    try {
      await batalkanPengajuanIzin(row.id);
      toastSuccess("Pengajuan berhasil dibatalkan.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membatalkan pengajuan.");
    }
  };

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>Pengajuan Izin</h2>
              <p className={`mt-1.5 text-xs max-w-3xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {readOnly
                ? "Masa magang Anda sudah berakhir sehingga pengajuan baru ditutup. Riwayat pengajuan izin Anda tetap dapat dilihat di bawah ini."
                : "Ajukan izin atau sakit sebelum tanggal berjalan agar presensi Anda tidak tercatat alfa. Setiap pengajuan diverifikasi mentor pembimbing."}
            </p>
          </div>
          {readOnly ? (
            <p className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold text-slate-500">
              <Ban className="w-3.5 h-3.5" />
              Pengajuan baru ditutup
            </p>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
              Ajukan Izin / Sakit
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pt-5 pb-4">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {TAB_STATUS.map((t) => (
                <button
                  key={t.key || "semua"}
                  onClick={() => setStatusTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    statusTab === t.key ? "bg-white text-[#004F9F] shadow-sm" : "text-slate-500 hover:text-[#0B1442]"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
            {refreshing && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                <Loader2 className="w-3 h-3 animate-spin" /> Memuat
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat pengajuan...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Inbox className="w-6 h-6" />
                <span className="absolute inset-0 rounded-2xl border-2 border-slate-200 animate-ping opacity-40" />
              </span>
              <p className="text-sm font-bold text-slate-500">Belum ada pengajuan</p>
              <p className="text-xs text-slate-400 max-w-sm">
                {readOnly
                  ? "Anda tidak pernah mengajukan izin atau sakit selama masa magang berlangsung."
                  : "Klik tombol “Ajukan Izin / Sakit” untuk membuat pengajuan baru."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 px-4 sm:px-6 pb-5 lg:grid-cols-2">
              {rows.map((r, i) => {
                const JenisIcon = r.jenis === "sakit" ? HeartPulse : FileText;
                return (
                  <div
                    key={r.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#004F9F]/30 hover:shadow-lg animate-[fadeslide_0.3s_ease-out]"
                    style={{ animationDelay: `${i * 45}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-[#00A5EC]/10 to-transparent blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-start justify-between gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold capitalize ${r.jenis === "sakit" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"}`}>
                        <JenisIcon className="w-3 h-3" /> {r.jenis}
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold capitalize ${badgeStatus[r.status] || "bg-slate-50 text-slate-500 ring-1 ring-slate-200"}`}>
                        {r.status}
                      </span>
                    </div>

                    <p className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600">
                      <CalendarRange className="w-3 h-3" />
                      {formatTanggalPresensi(r.tanggal_mulai)} — {formatTanggalPresensi(r.tanggal_selesai)}
                    </p>

                    <p className="relative mt-2.5 text-[11.5px] leading-relaxed text-slate-500 line-clamp-3">{r.alasan}</p>

                    {r.catatan_mentor && (
                      <p className="relative mt-2.5 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                        <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                        <span><span className="font-bold text-slate-600">Catatan mentor: </span>{r.catatan_mentor}</span>
                      </p>
                    )}

                    <div className="relative mt-3.5 flex items-center justify-between gap-2">
                      {r.file_bukti ? (
                        <a
                          href={getFileUrl(r.file_bukti)}
                          target="_blank"
                          rel="noreferrer"
                          className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors duration-200 hover:text-[#004F9F]"
                        >
                          <Paperclip className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:rotate-12" />
                          Lihat bukti
                        </a>
                        ) : <span />}

                        {!readOnly && r.status === "menunggu" && (
                          <button
                            onClick={() => handleBatal(r)}
                            className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                            Batalkan
                          </button>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <FormPengajuanIzinModal
          onClose={() => setShowForm(false)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </PesertaLayout>
  );
};

export default PengajuanIzinPage;