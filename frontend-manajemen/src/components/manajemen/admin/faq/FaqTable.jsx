import {
  Edit2, Trash2, Zap, MessageSquare, ArrowRight,
  Download, UserRound, ClipboardCheck,
} from "lucide-react";

// Penanda visual singkat untuk kolom Quick Action
const LENCANA_AKSI = {
  jawaban:  { ikon: MessageSquare,  teks: "Jawaban",  kelas: "bg-slate-100 text-slate-600" },
  navigasi: { ikon: ArrowRight,     teks: "Navigasi", kelas: "bg-sky-50 text-sky-600" },
  unduh:    { ikon: Download,       teks: "Unduh",    kelas: "bg-violet-50 text-violet-600" },
  eskalasi: { ikon: UserRound,      teks: "Admin",    kelas: "bg-red-50 text-red-600" },
  status:   { ikon: ClipboardCheck, teks: "Status",   kelas: "bg-emerald-50 text-emerald-600" },
};

const FaqTable = ({ faqs, onEdit, onDelete, terpilih = [], onTogglePilih, onTogglePilihSemua }) => {
  // Kotak centang di kepala tabel hanya mencentang baris yang sedang terlihat,
  // bukan seluruh isi database, supaya hasil pencarian tetap dihormati.
  const semuaTerpilih = faqs.length > 0 && faqs.every((f) => terpilih.includes(f.id));
  const sebagianTerpilih = !semuaTerpilih && faqs.some((f) => terpilih.includes(f.id));

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left text-[13px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <th className="px-5 py-4 w-10">
              <input
                type="checkbox"
                checked={semuaTerpilih}
                // ref callback dipakai karena "sebagian tercentang" tidak bisa
                // diatur lewat atribut JSX — hanya lewat properti DOM.
                ref={(el) => { if (el) el.indeterminate = sebagianTerpilih; }}
                onChange={() => onTogglePilihSemua(faqs.map((f) => f.id))}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#004F9F]"
                title="Pilih semua baris yang terlihat"
              />
            </th>
            <th className="px-6 py-4">Pertanyaan</th>
            <th className="px-6 py-4">Kategori</th>
            <th className="px-6 py-4">Kata Kunci (Keywords)</th>
            <th className="px-6 py-4 text-center">Kepuasan</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-center">Quick Action</th>
            <th className="px-6 py-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {faqs.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-12 text-center text-slate-400">Belum ada data FAQ.</td>
            </tr>
          ) : (
            faqs.map((faq) => {
              const dipilih = terpilih.includes(faq.id);

              return (
                <tr
                  key={faq.id}
                  className={`border-b border-slate-100 transition-colors ${
                    dipilih ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                  }`}
                >
                  <td className="px-5 py-5">
                    <input
                      type="checkbox"
                      checked={dipilih}
                      onChange={() => onTogglePilih(faq.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#004F9F]"
                    />
                  </td>

                  <td className="px-6 py-5 max-w-xs">
                    <p className="font-bold text-slate-900">{faq.question}</p>
                    <p className="mt-1 text-xs text-slate-500 truncate">{faq.answer}</p>
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {faq.category || "Umum"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-500">{faq.keywords || "-"}</td>

                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const suka = faq.helpful_count || 0;
                      const tidak = faq.unhelpful_count || 0;
                      const total = suka + tidak;

                      if (total === 0) {
                        return <span className="text-[11px] text-slate-300">Belum dinilai</span>;
                      }

                      const rasio = Math.round((suka / total) * 100);
                      // Merah hanya bila sudah cukup banyak yang menilai,
                      // supaya satu jempol turun tidak langsung terlihat gawat.
                      const perluPerbaikan = total >= 3 && rasio < 50;

                      return (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            perluPerbaikan
                              ? "bg-red-50 text-red-600"
                              : rasio >= 70
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                          }`}>
                            {rasio}% membantu
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {suka} suka · {tidak} tidak · {faq.view_count || 0} tayang
                          </span>
                          {perluPerbaikan && (
                            <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              Perlu ditulis ulang
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${faq.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        {faq.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      {faq.show_on_landing && (
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                          Tampil publik
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    {faq.is_quick_action ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                          <Zap className="w-2.5 h-2.5" />
                          Tombol Cepat
                        </span>
                        {(() => {
                          const a = LENCANA_AKSI[faq.action_type || "jawaban"];
                          if (!a) return null;
                          const Ikon = a.ikon;
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${a.kelas}`}>
                              <Ikon className="w-2.5 h-2.5" />
                              {a.teks}
                            </span>
                          );
                        })()}
                        {faq.tampil_saat_status && (
                          <span
                            className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600"
                            title={`Hanya untuk status: ${faq.tampil_saat_status}`}
                          >
                            Terbatas status
                          </span>
                        )}
                      </div>
                    ) : "-"}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEdit(faq)} className="p-1 text-blue-500 hover:text-blue-700 cursor-pointer" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(faq.id)} className="p-1 text-red-500 hover:text-red-700 cursor-pointer" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FaqTable;