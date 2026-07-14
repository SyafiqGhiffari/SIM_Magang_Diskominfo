import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const statusStyle = {
  menunggu: { label: "Menunggu", cls: "bg-amber-50 text-amber-600" },
  revisi: { label: "Direvisi", cls: "bg-blue-50 text-blue-600" },
  diterima: { label: "Diterima", cls: "bg-emerald-50 text-emerald-600" },
  ditolak: { label: "Ditolak", cls: "bg-red-50 text-red-600" },
};

const PER_PAGE = 5;

const RecentApplicationsCard = ({ pendaftaranList, onVerifikasi }) => {
  const [page, setPage] = useState(0);
  const sorted = [...pendaftaranList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageItems = sorted.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const getInstitusi = (p) => (p.kategori_pendaftar === "mahasiswa" ? p.asal_kampus : p.asal_sekolah) || "-";
  const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5">
        <h3 className="text-sm font-black text-[#0B1442]">Aplikasi Terbaru</h3>
        <a href="/admin/pendaftaran" className="text-xs font-bold text-[#004F9F] hover:text-[#00A5EC] transition-colors">
          Lihat Semua &rarr;
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-y border-slate-100 text-[10px] font-black uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3">Mahasiswa</th>
              <th className="px-6 py-3">Institusi</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">Belum ada pendaftaran.</td>
              </tr>
            ) : (
              pageItems.map((p) => {
                const s = statusStyle[p.status_pendaftaran] || statusStyle.menunggu;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[10px] font-black">
                          {getInitials(p.nama_lengkap)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0B1442] truncate">{p.nama_lengkap}</p>
                          <p className="text-[11px] text-slate-400 truncate">{p.program_studi || p.jurusan_sekolah || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-[160px] truncate">{getInstitusi(p)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => onVerifikasi(p)}
                        className="rounded-lg bg-[#0B1442] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1E3A8A] transition-colors cursor-pointer"
                      >
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          Menampilkan {pageItems.length} dari {sorted.length} aplikasi
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentApplicationsCard;