import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import FaqTable from "../../components/manajemen/admin/faq/FaqTable";
import FaqModal from "../../components/manajemen/admin/faq/FaqModal";
import { getFaqList, createFaq, updateFaq, deleteFaq } from "../../services/chatService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { Plus } from "lucide-react";

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isQuickAction, setIsQuickAction] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchFaqs = async () => {
    try {
      const res = await getFaqList();
      setFaqs(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setSelectedId(null);
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setIsActive(true);
    setIsQuickAction(false);
    setShowModal(true);
  };

  const openEditModal = (faq) => {
    setEditMode(true);
    setSelectedId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setKeywords(faq.keywords || "");
    setIsActive(faq.is_active);
    setIsQuickAction(faq.is_quick_action || false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = { question, answer, keywords, is_active: isActive, is_quick_action: isQuickAction };

    try {
      if (editMode) {
        await updateFaq(selectedId, data);
        toastSuccess("FAQ berhasil diperbarui");
      } else {
        await createFaq(data);
        toastSuccess("FAQ baru berhasil dibuat");
      }
      await fetchFaqs();
      setShowModal(false);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan FAQ. Pastikan semua field terisi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await confirmDialog({
      title: "Hapus FAQ ini?",
      text: "FAQ yang dihapus tidak dapat dikembalikan.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteFaq(id);
      toastSuccess("FAQ berhasil dihapus");
      fetchFaqs();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus FAQ");
    }
  };

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-8 animate-[fadeslide_0.35s_ease-out]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">FAQ & Quick Action</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Kelola jawaban otomatis chatbot dan tombol quick action di widget chat peserta.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#004F9F] px-5 py-3 text-[13px] font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah FAQ
          </button>
        </div>

        <FaqTable faqs={filteredFaqs} onEdit={openEditModal} onDelete={handleDelete} />
      </div>

      {showModal && (
        <FaqModal
          editMode={editMode}
          question={question} setQuestion={setQuestion}
          answer={answer} setAnswer={setAnswer}
          keywords={keywords} setKeywords={setKeywords}
          isActive={isActive} setIsActive={setIsActive}
          isQuickAction={isQuickAction} setIsQuickAction={setIsQuickAction}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default FaqPage;