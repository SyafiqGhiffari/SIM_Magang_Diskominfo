import { Edit2, Trash2, Zap } from "lucide-react";

const FaqTable = ({ faqs, onEdit, onDelete }) => (
  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-[13px] border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
          <th className="px-6 py-4">Pertanyaan</th>
          <th className="px-6 py-4">Kata Kunci (Keywords)</th>
          <th className="px-6 py-4 text-center">Status</th>
          <th className="px-6 py-4 text-center">Quick Action</th>
          <th className="px-6 py-4 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {faqs.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-12 text-center text-slate-400">Belum ada data FAQ.</td>
          </tr>
        ) : (
          faqs.map((faq) => (
            <tr key={faq.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
              <td className="px-6 py-5 max-w-xs">
                <p className="font-bold text-slate-900">{faq.question}</p>
                <p className="mt-1 text-xs text-slate-500 truncate">{faq.answer}</p>
              </td>
              <td className="px-6 py-5 text-slate-500">{faq.keywords || "-"}</td>
              <td className="px-6 py-5 text-center">
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${faq.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {faq.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="px-6 py-5 text-center">
                {faq.is_quick_action ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                    <Zap className="w-2.5 h-2.5" />
                    Tombol Cepat
                  </span>
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
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default FaqTable;