import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getChatSessions, getSessionMessages, replySession, closeSession } from "../services/chatService";
import { Send, CheckCheck, User, MessageCircle, XCircle } from "lucide-react";

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getChatSessions();
        setSessions(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchMessages = async () => {
      try {
        const res = await getSessionMessages(selectedSession.id);
        setMessages(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !selectedSession) return;

    setSending(true);
    try {
      const res = await replySession(selectedSession.id, replyText);
      setMessages(prev => [...prev, res.data.data]);
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    if (window.confirm("Apakah Anda yakin ingin menutup sesi chat ini?")) {
      try {
        await closeSession(selectedSession.id);
        setSelectedSession(null);
        setMessages([]);
        const res = await getChatSessions();
        setSessions(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", height: "calc(100vh - 140px)", margin: -32, borderTop: "1px solid #e2e8f0" }}>
        {/* Left Side: Sessions List */}
        <div style={{ width: 340, borderRight: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Percakapan Masuk</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>Semua sesi chat dari pendaftar</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {sessions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", gap: 8 }}>
                <MessageCircle size={28} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Belum ada percakapan</span>
              </div>
            ) : (
              sessions.map(s => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    style={{
                      padding: "16px", borderRadius: 12, cursor: "pointer",
                      background: isSelected ? "#f1f5f9" : "transparent",
                      border: isSelected ? "1px solid #cbd5e1" : "1px solid transparent",
                      display: "flex", gap: 12, transition: "all 0.2s", marginBottom: 6
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <User size={18} color="#64748b" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.user_nama}
                        </h4>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>
                          {s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: s.unread_admin_count > 0 ? "#0f172a" : "#64748b", fontWeight: s.unread_admin_count > 0 ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.last_message || "(Belum ada pesan)"}
                      </p>
                    </div>
                    {s.unread_admin_count > 0 && (
                      <span style={{
                        alignSelf: "center", background: "#ef4444", color: "#fff",
                        fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 999
                      }}>
                        {s.unread_admin_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Box */}
        <div style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column", height: "100%" }}>
          {selectedSession ? (
            <>
              {/* Active Header */}
              <div style={{ height: 70, background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedSession.user_nama}</h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 500 }}>{selectedSession.user_email}</p>
                </div>
                <button
                  onClick={handleCloseSession}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"}
                >
                  <XCircle size={14} />
                  <span>Tutup Sesi</span>
                </button>
              </div>

              {/* Message History */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map(m => {
                  const isAdmin = m.sender_type === "admin";
                  const isBot = m.sender_type === "bot";
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "70%", padding: "12px 16px", borderRadius: 16,
                        background: isAdmin ? "#0B1442" : isBot ? "#7c3aed" : "#fff",
                        color: isAdmin || isBot ? "#fff" : "#0f172a",
                        border: isAdmin || isBot ? "none" : "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(15,23,42,0.02)"
                      }}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{m.content}</p>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end",
                          marginTop: 6, fontSize: 9, color: isAdmin || isBot ? "rgba(255,255,255,0.6)" : "#94a3b8"
                        }}>
                          <span>{new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                          {isAdmin && <CheckCheck size={12} />}
                          {isBot && <span style={{ background: "rgba(255,255,255,0.2)", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>BOT/QA</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", gap: 12, flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Ketik balasan Anda..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    flex: 1, padding: "12px 18px", borderRadius: 12,
                    border: "1px solid #e2e8f0", background: "#f8fafc",
                    fontSize: 13, outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: "none",
                    background: replyText.trim() ? "linear-gradient(135deg, #0B1442, #004F9F)" : "#e2e8f0",
                    color: replyText.trim() ? "#fff" : "#94a3b8", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", gap: 12 }}>
              <MessageCircle size={40} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Pilih salah satu sesi percakapan untuk memulai</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ChatPage;
