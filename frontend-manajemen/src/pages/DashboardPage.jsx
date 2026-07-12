import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getChatSessions, getFaqList } from "../services/chatService";
import { MessageSquare, HelpCircle, Users, CheckCircle } from "lucide-react";

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    totalFaq: 0,
    quickActions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [chatRes, faqRes] = await Promise.all([getChatSessions(), getFaqList()]);
        const chats = chatRes.data.data || [];
        const faqs = faqRes.data.data || [];

        setStats({
          totalChats: chats.length,
          activeChats: chats.filter(c => c.status === "open").length,
          totalFaq: faqs.length,
          quickActions: faqs.filter(f => f.is_quick_action).length
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Sesi Chat", value: stats.totalChats, icon: MessageSquare, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    { title: "Chat Aktif", value: stats.activeChats, icon: Users, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
    { title: "Total FAQ", value: stats.totalFaq, icon: HelpCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { title: "Quick Actions", value: stats.quickActions, icon: CheckCircle, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  ];

  return (
    <AdminLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Welcome */}
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Selamat Datang, Admin</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#64748b", fontWeight: 500 }}>Kelola data pendaftaran magang, percakapan langsung peserta, dan chatbot FAQ.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {cards.map((c, i) => (
            <div key={i} style={{
              padding: 24, borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(15,23,42,0.02)"
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#64748b" }}>{c.title}</p>
                <h3 style={{ margin: "8px 0 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{c.value}</h3>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: c.bg,
                display: "flex", alignItems: "center", justifyContent: "center", color: c.color
              }}>
                <c.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Banner */}
        <div style={{
          padding: 32, borderRadius: 20,
          background: "linear-gradient(135deg, #0B1442 0%, #004F9F 100%)",
          color: "#fff", boxShadow: "0 10px 30px rgba(11,20,66,0.15)",
          display: "flex", flexDirection: "column", gap: 12
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Informasi Penting</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.85, maxWidth: 680 }}>
            Semua pertanyaan chatbot dan tombol pintasan diatur di bagian <b>FAQ & Quick Action</b>. 
            Anda dapat melihat dan membalas obrolan langsung dari peserta yang sedang berlangsung di menu <b>Pesan Peserta</b>.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
