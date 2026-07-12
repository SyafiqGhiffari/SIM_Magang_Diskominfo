import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getFaqList, createFaq, updateFaq, deleteFaq } from "../services/chatService";
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Check, Zap } from "lucide-react";

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form States
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isQuickAction, setIsQuickAction] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
    setMessage({ text: "", type: "" });

    const data = {
      question,
      answer,
      keywords,
      is_active: isActive,
      is_quick_action: isQuickAction
    };

    try {
      if (editMode) {
        await updateFaq(selectedId, data);
        setMessage({ text: "FAQ berhasil diperbarui!", type: "success" });
      } else {
        await createFaq(data);
        setMessage({ text: "FAQ baru berhasil dibuat!", type: "success" });
      }
      fetchFaqs();
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      setMessage({ text: "Gagal menyimpan FAQ. Pastikan semua field terisi.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus FAQ ini?")) {
      try {
        await deleteFaq(id);
        fetchFaqs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>FAQ & Quick Action</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#64748b", fontWeight: 500 }}>Kelola jawaban otomatis chatbot dan tombol quick action di widget chat peserta.</p>
          </div>
          <button
            onClick={openAddModal}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #0B1442, #004F9F)", color: "#fff",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0, 79, 159, 0.25)", transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Plus size={16} />
            <span>Tambah FAQ</span>
          </button>
        </div>

        {/* FAQ Table */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 12px rgba(15,23,42,0.01)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "18px 24px" }}>Pertanyaan</th>
                <th style={{ padding: "18px 24px" }}>Kata Kunci (Keywords)</th>
                <th style={{ padding: "18px 24px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "18px 24px", textAlign: "center" }}>Quick Action</th>
                <th style={{ padding: "18px 24px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Belum ada data FAQ.</td>
                </tr>
              ) : (
                faqs.map(faq => (
                  <tr key={faq.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}>
                    <td style={{ padding: "20px 24px", maxWidth: 300 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{faq.question}</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{faq.answer}</p>
                    </td>
                    <td style={{ padding: "20px 24px", color: "#64748b" }}>{faq.keywords || "-"}</td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: faq.is_active ? "rgba(16, 185, 129, 0.08)" : "rgba(100, 116, 139, 0.08)",
                        color: faq.is_active ? "#10b981" : "#64748b"
                      }}>
                        {faq.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      {faq.is_quick_action ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b"
                        }}>
                          <Zap size={11} />
                          <span>Tombol Cepat</span>
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={() => openEditModal(faq)} style={{ border: "none", background: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(faq.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: 4 }} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", width: 500, padding: 32, borderRadius: 20,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)", display: "flex", flexDirection: "column", gap: 24,
            animation: "modalFadeUp 0.3s ease-out"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                {editMode ? "Edit FAQ" : "Tambah FAQ Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Notification message */}
            {message.text && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10,
                background: message.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                color: message.type === "success" ? "#10b981" : "#ef4444", fontSize: 13, fontWeight: 600
              }}>
                {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Question */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>PERTANYAAN</label>
                <input
                  type="text"
                  placeholder="Contoh: Bagaimana cara daftar magang?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  required
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", outline: "none", fontSize: 13 }}
                />
              </div>

              {/* Answer */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>JAWABAN CHATBOT</label>
                <textarea
                  placeholder="Tuliskan balasan otomatis di sini..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  required
                  rows={4}
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", outline: "none", fontSize: 13, resize: "none" }}
                />
              </div>

              {/* Keywords */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>KATA KUNCI (Keywords - Opsional)</label>
                <input
                  type="text"
                  placeholder="Pisahkan dengan koma, contoh: syarat, berkas, magang"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", outline: "none", fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Jika diisi, chatbot akan otomatis mencocokkan kata kunci ini secara prioritas.</span>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>FAQ Aktif</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
                  <input
                    type="checkbox"
                    checked={isQuickAction}
                    onChange={e => setIsQuickAction(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={14} /> Jadikan Quick Action
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 24px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #0B1442, #004F9F)", color: "#fff",
                    fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  {loading ? "Menyimpan..." : "Simpan FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FaqPage;
