import { X, Zap } from "lucide-react";

const FaqModal = ({
  editMode, question, setQuestion, answer, setAnswer, keywords, setKeywords,
  isActive, setIsActive, isQuickAction, setIsQuickAction,
  loading, onSubmit, onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4" onClick={onClose}>
    <div
      className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-[modalFadeUp_0.3s_ease-out]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">{editMode ? "Edit FAQ" : "Tambah FAQ Baru"}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">PERTANYAAN</label>
          <input
            type="text"
            placeholder="Contoh: Bagaimana cara daftar magang?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-[13px] outline-none focus:border-[#004F9F] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">JAWABAN CHATBOT</label>
          <textarea
            placeholder="Tuliskan balasan otomatis di sini..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-[13px] outline-none focus:border-[#004F9F] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">KATA KUNCI (Keywords - Opsional)</label>
          <input
            type="text"
            placeholder="Pisahkan dengan koma, contoh: syarat, berkas, magang"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-[13px] outline-none focus:border-[#004F9F] transition-all"
          />
          <span className="text-[11px] text-slate-400">Jika diisi, chatbot akan otomatis mencocokkan kata kunci ini secara prioritas.</span>
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            FAQ Aktif
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-amber-600 cursor-pointer">
            <input type="checkbox" checked={isQuickAction} onChange={(e) => setIsQuickAction(e.target.checked)} className="h-4 w-4" />
            <Zap className="w-3.5 h-3.5" /> Jadikan Quick Action
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-6 py-3 text-[13px] font-bold text-white shadow-lg disabled:opacity-60 transition-all cursor-pointer"
          >
            {loading ? "Menyimpan..." : "Simpan FAQ"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default FaqModal;