import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Send, MessageCircle, ChevronDown,
  Loader2, Headphones, Zap, Bot,
} from "lucide-react";
import {
  getOrCreateChatSession,
  getChatMessages,
  sendChatMessage,
  getPublicFAQ,
  getAdminStatus,
  getQuickActions,
  useQuickAction,
} from "../../services/chatService";

// ─── Bubble Pesan ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, dk }) => {
  const isUser = msg.sender_type === "user";
  const isBot = msg.sender_type === "bot";

  const time = new Date(msg.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, animation: "bubbleIn 0.2s ease-out" }}>
        <div style={{ maxWidth: "78%" }}>
          <div style={{
            background: "linear-gradient(135deg, #0B1442 0%, #1e40af 60%, #1E3A8A 100%)",
            color: "#fff",
            borderRadius: "18px 18px 4px 18px",
            padding: "11px 15px",
            fontSize: 13,
            lineHeight: 1.6,
            boxShadow: "0 4px 20px rgba(11,20,66,0.3)",
            wordBreak: "break-word",
            letterSpacing: "0.01em",
          }}>
            {msg.content}
          </div>
          <p style={{ fontSize: 10, textAlign: "right", marginTop: 4, color: dk ? "#475569" : "#94a3b8" }}>
            {time} <span style={{ color: msg.is_read_admin ? (dk ? "#38bdf8" : "#00a5ec") : "inherit", fontWeight: 800, marginLeft: 2 }}>✓</span>
          </p>
        </div>
      </div>
    );
  }

  const avatarBg = isBot ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "linear-gradient(135deg, #0369a1, #0ea5e9)";
  const bubbleBg = isBot ? (dk ? "rgba(124,58,237,0.10)" : "#faf5ff") : (dk ? "rgba(14,165,233,0.08)" : "#f0f9ff");
  const bubbleBorder = isBot ? (dk ? "rgba(167,139,250,0.25)" : "#e9d5ff") : (dk ? "rgba(14,165,233,0.25)" : "#bae6fd");
  const bubbleTxt = isBot ? (dk ? "#c4b5fd" : "#6d28d9") : (dk ? "#7dd3fc" : "#0369a1");
  const label = isBot ? "🤖 Jawaban Otomatis (Bot)" : "💬 Admin Diskominfo";
  const labelColor = isBot ? (dk ? "#a78bfa" : "#7c3aed") : (dk ? "#38bdf8" : "#0284c7");

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBottom: 14, animation: "bubbleIn 0.2s ease-out" }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
        background: avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: isBot ? 36 : 20,
        boxShadow: isBot ? "0 2px 10px rgba(124,58,237,0.35)" : "0 2px 10px rgba(3,105,161,0.3)",
      }}>
        {isBot
          ? <Bot style={{ width: 13, height: 13, color: "#fff" }} />
          : <Headphones style={{ width: 13, height: 13, color: "#fff" }} />
        }
      </div>
      <div style={{ maxWidth: "78%" }}>
        <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 5, color: labelColor, letterSpacing: "0.02em" }}>
          {label}
        </p>
        <div style={{
          background: bubbleBg,
          border: `1px solid ${bubbleBorder}`,
          color: bubbleTxt,
          borderRadius: "4px 18px 18px 18px",
          padding: "11px 15px",
          fontSize: 13,
          lineHeight: 1.6,
          wordBreak: "break-word",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          letterSpacing: "0.01em",
        }}>
          {msg.content}
        </div>
        {isBot && (
          <p style={{ fontSize: 10, marginTop: 4, paddingLeft: 2, color: dk ? "#7c3aed" : "#a78bfa", fontStyle: "italic" }}>
            ℹ️ Pesan ini dijawab otomatis oleh sistem, bukan oleh admin
          </p>
        )}
        <p style={{ fontSize: 10, marginTop: isBot ? 2 : 4, paddingLeft: 2, color: dk ? "#475569" : "#94a3b8" }}>
          {time}
        </p>
      </div>
    </div>
  );
};

// Helper format tanggal WhatsApp style
const formatDateSeparator = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hari ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

// Komponen Typing Bubble
const TypingBubble = ({ dk }) => {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBottom: 14, animation: "bubbleIn 0.2s ease-out" }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
        boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
      }}>
        <Bot style={{ width: 13, height: 13, color: "#fff" }} />
      </div>
      <div style={{ maxWidth: "78%" }}>
        <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 5, color: dk ? "#a78bfa" : "#7c3aed", letterSpacing: "0.02em" }}>
          🤖 Jawaban Otomatis (Bot)
        </p>
        <div style={{
          background: dk ? "rgba(124,58,237,0.10)" : "#faf5ff",
          border: dk ? "1px solid rgba(167,139,250,0.25)" : "1px solid #e9d5ff",
          borderRadius: "4px 18px 18px 18px",
          padding: "12px 18px",
          display: "flex", gap: 4, alignItems: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <span style={{ width: 6, height: 6, background: dk ? "#c4b5fd" : "#7c3aed", borderRadius: "50%", animation: "typingBounce 1.4s infinite", animationDelay: "0s" }} />
          <span style={{ width: 6, height: 6, background: dk ? "#c4b5fd" : "#7c3aed", borderRadius: "50%", animation: "typingBounce 1.4s infinite", animationDelay: "0.2s" }} />
          <span style={{ width: 6, height: 6, background: dk ? "#c4b5fd" : "#7c3aed", borderRadius: "50%", animation: "typingBounce 1.4s infinite", animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

// ─── ChatWidget Utama ─────────────────────────────────────────────────────────
const ChatWidget = ({ dk, user, onUnreadChange, openTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showFaq, setShowFaq] = useState(true);
  const [error, setError] = useState("");
  const [adminOnline, setAdminOnline] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  const chatPanelRef = useRef(null);
  const prevMsgLen = useRef(0);

  // ── Polling status online admin ──
  useEffect(() => {
    const check = async () => {
      try {
        const res = await getAdminStatus();
        setAdminOnline(res.data.is_online === true);
      } catch { setAdminOnline(false); }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (openTrigger && openTrigger > 0) openChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTrigger]);

  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionRes, faqRes, qaRes] = await Promise.all([
        getOrCreateChatSession(),
        getPublicFAQ(),
        getQuickActions(),
      ]);
      setSessionId(sessionRes.data.data.id);
      setFaqs(faqRes.data.data || []);
      setQuickActions(qaRes.data.data || []);
      const msgRes = await getChatMessages();
      const msgs = msgRes.data.data || [];
      setMessages(msgs);
      prevMsgLen.current = msgs.length;
    } catch { setError("Gagal memuat chat. Coba lagi."); }
    finally { setLoading(false); }
  }, []);

  const pollMessages = useCallback(async () => {
    try {
      const res = await getChatMessages();
      const msgs = res.data.data || [];
      setMessages(msgs);
      if (!isOpen) {
        const n = msgs.filter((m, i) => i >= prevMsgLen.current && m.sender_type !== "user").length;
        if (n > 0) setUnread(u => { const next = u + n; onUnreadChange?.(next); return next; });
      }
      prevMsgLen.current = msgs.length;
    } catch { /* silent */ }
  }, [isOpen, onUnreadChange]);

  const openChat = () => { setIsOpen(true); setUnread(0); onUnreadChange?.(0); if (!sessionId) initSession(); };

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    pollRef.current = setInterval(pollMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, sessionId, pollMessages]);

  useEffect(() => { if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (chatPanelRef.current && !chatPanelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSend = async (content) => {
    const text = (content ?? inputText).trim();
    if (!text || sending) return;
    setSending(true); setInputText(""); setShowFaq(false); setError("");
    const temp = { id: Date.now(), sender_type: "user", content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    try {
      const sendRes = await sendChatMessage(text);
      if (sendRes.data.bot_replied) {
        setIsBotTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsBotTyping(false);
      }
      const res = await getChatMessages();
      setMessages(res.data.data || []);
    } catch {
      setError("Gagal mengirim pesan. Periksa koneksi Anda.");
      setMessages(prev => prev.filter(m => m.id !== temp.id));
    } finally { setSending(false); setTimeout(() => inputRef.current?.focus(), 100); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ═══════════════════════════════════════════════════════════════
  // TOMBOL MELAYANG
  // ═══════════════════════════════════════════════════════════════
  if (!isOpen) {
    return createPortal(
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
        <div className="cw-float" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>

          <div className="cw-label" style={{
            position: "absolute", right: 72, whiteSpace: "nowrap",
            background: "linear-gradient(135deg,#0B1442,#1E3A8A)",
            color: "#fff", fontSize: 12, fontWeight: 800,
            padding: "7px 16px", borderRadius: 14,
            boxShadow: "0 6px 24px rgba(11,20,66,0.4)",
            pointerEvents: "none", userSelect: "none",
          }}>
            Tanya Admin
            <span style={{
              position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)",
              width: 0, height: 0,
              borderTop: "7px solid transparent", borderBottom: "7px solid transparent",
              borderLeft: "8px solid #1E3A8A",
            }} />
          </div>

          {adminOnline && (
            <span style={{
              position: "absolute", top: 0, right: 0,
              width: 13, height: 13, borderRadius: "50%",
              background: "#22c55e", border: "2.5px solid #fff", zIndex: 2,
              boxShadow: "0 0 8px rgba(34,197,94,0.7)",
              animation: "onlinePulse 2s ease-in-out infinite",
            }} />
          )}

          <div className="cw-ring cw-ring-1" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,165,236,0.5)" }} />
          <div className="cw-ring cw-ring-2" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,165,236,0.25)" }} />

          <button onClick={openChat} className="cw-btn" title="Chat dengan Admin"
            style={{
              position: "relative", width: 58, height: 58, borderRadius: "50%",
              background: "linear-gradient(135deg, #0B1442 0%, #004F9F 50%, #1E3A8A 100%)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(11,20,66,0.5)", color: "#fff", flexShrink: 0,
            }}>
            <MessageCircle style={{ width: 24, height: 24 }} />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -5, minWidth: 22, height: 22,
                background: "#ef4444", borderRadius: 999, fontSize: 9, fontWeight: 900, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px", border: "2.5px solid #fff",
                boxShadow: "0 2px 8px rgba(239,68,68,0.6)",
                animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        <style>{`
          @keyframes cwBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
          @keyframes cwSonar { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.6);opacity:0} }
          @keyframes cwGlow {
            0%,100%{box-shadow:0 8px 32px rgba(11,20,66,.5),0 0 0 0 rgba(0,165,236,.4)}
            50%{box-shadow:0 8px 32px rgba(11,20,66,.5),0 0 0 14px rgba(0,165,236,0)}
          }
          @keyframes onlinePulse { 0%,100%{box-shadow:0 0 6px rgba(34,197,94,.6)} 50%{box-shadow:0 0 14px rgba(34,197,94,1)} }
          @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }
          @keyframes bubbleIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes typingBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
          }
          .cw-float { animation: cwBob 3s ease-in-out infinite; }
          .cw-ring-1 { animation: cwSonar 2.4s ease-out infinite; }
          .cw-ring-2 { animation: cwSonar 2.4s ease-out infinite 1.2s; }
          .cw-btn { animation: cwGlow 2.5s ease-in-out infinite; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
          .cw-btn:hover { transform: scale(1.18) !important; box-shadow: 0 14px 48px rgba(11,20,66,.65), 0 0 30px rgba(0,165,236,.4) !important; animation: none !important; }
          .cw-btn:active { transform: scale(0.92) !important; }
          .cw-label { opacity: 0; transform: translateX(12px); transition: opacity 0.2s ease, transform 0.2s ease; }
          .cw-float:hover .cw-label { opacity: 1; transform: translateX(0); }
          .cw-float:hover .cw-ring-1, .cw-float:hover .cw-ring-2 { animation-play-state: paused; opacity: 0; transition: opacity 0.2s; }
          .cw-float:hover { animation-play-state: paused; }
        `}</style>
      </div>,
      document.body
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PANEL CHAT
  // ═══════════════════════════════════════════════════════════════
  return createPortal(
    <div ref={chatPanelRef} style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      width: 382, maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 48px)",
      display: "flex", flexDirection: "column",
      animation: "panelUp 0.3s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        height: 580, maxHeight: "calc(100vh - 64px)",
        borderRadius: 22, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(11,20,66,0.32), 0 8px 32px rgba(0,0,0,0.12)",
        border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
        background: dk ? "#0d1117" : "#fff",
      }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #030c22 0%, #0B1442 35%, #0d1f5c 65%, #1a3580 100%)",
          flexShrink: 0, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(0,165,236,0.08)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 10, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(20px)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,165,236,0.25), rgba(0,79,159,0.35))",
                  border: "2px solid rgba(0,165,236,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 24px rgba(0,165,236,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}>
                  <Headphones style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: adminOnline ? "#22c55e" : "#64748b",
                  border: "2px solid #0B1442",
                  boxShadow: adminOnline ? "0 0 8px rgba(34,197,94,0.7)" : "none",
                  animation: adminOnline ? "onlinePulse 2s ease-in-out infinite" : "none",
                  transition: "background 0.4s ease",
                }} />
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1.2, letterSpacing: "0.01em" }}>
                  Chat Bantuan
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: adminOnline ? "#22c55e" : "#64748b", transition: "background 0.4s" }} />
                  {adminOnline
                    ? <p style={{ color: "#86efac", fontSize: 11, fontWeight: 600 }}>Admin Online • Siap membantu</p>
                    : <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600 }}>Admin Offline • Silakan tinggalkan pesan</p>
                  }
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{
                width: 34, height: 34, borderRadius: 11,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.65)", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
            >
              <ChevronDown style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <div style={{ height: 10, background: "linear-gradient(to bottom right, #0B1442 50%, transparent 50%)", marginTop: -1 }} />
        </div>

        {/* AREA PESAN */}
        <div style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "18px 16px",
          scrollbarWidth: "thin",
          scrollbarColor: dk ? "#2d333b transparent" : "#e2e8f0 transparent",
          background: dk ? "#0d1117" : "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)",
        }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, opacity: 0.6 }}>
              <Loader2 style={{ width: 30, height: 30, color: "#004F9F", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 12, color: dk ? "#94a3b8" : "#64748b" }}>Memuat percakapan...</p>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "22px 14px 18px", marginBottom: 14,
                  borderRadius: 18,
                  background: dk ? "rgba(255,255,255,0.025)" : "rgba(11,20,66,0.025)",
                  border: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(11,20,66,0.06)",
                  animation: "welcomeIn 0.5s ease-out",
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0B1442, #1E3A8A)",
                    margin: "0 auto 14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 28px rgba(11,20,66,0.35)",
                    animation: "iconBob 3s ease-in-out infinite",
                  }}>
                    <MessageCircle style={{ width: 26, height: 26, color: "#fff" }} />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: dk ? "#f1f5f9" : "#0f172a", marginBottom: 7 }}>
                    Halo, {user?.nama?.split(" ")[0] || "Kak"}! 👋
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: dk ? "#64748b" : "#94a3b8", maxWidth: 250, margin: "0 auto" }}>
                    Silakan ketik pertanyaan Anda. Sistem akan menjawab otomatis, atau Admin akan membantu langsung.
                  </p>
                </div>
              )}

              {messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const showDateSeparator = !prevMsg || 
                  new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                
                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div style={{
                        display: "flex", justifyContent: "center", margin: "18px 0 10px",
                        animation: "welcomeIn 0.3s ease"
                      }}>
                        <span style={{
                          background: dk ? "rgba(255,255,255,0.05)" : "rgba(11,20,66,0.05)",
                          color: dk ? "#64748b" : "#94a3b8",
                          fontSize: 10, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 8,
                          letterSpacing: "0.03em"
                        }}>
                          {formatDateSeparator(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <MessageBubble msg={msg} dk={dk} />
                  </div>
                );
              })}

              {isBotTyping && <TypingBubble dk={dk} />}

              {/* QUICK ACTION BUTTONS */}
              {showFaq && quickActions.length > 0 && messages.length === 0 && (
                <div style={{ marginTop: 6, animation: "welcomeIn 0.35s ease-out" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 1, background: dk ? "rgba(255,255,255,0.06)" : "rgba(11,20,66,0.07)" }} />
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: dk ? "#475569" : "#94a3b8", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                      <Zap style={{ width: 10, height: 10 }} /> Pertanyaan Cepat
                    </p>
                    <div style={{ flex: 1, height: 1, background: dk ? "rgba(255,255,255,0.06)" : "rgba(11,20,66,0.07)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {quickActions.map((qa, i) => {
                      const palette = [
                        { bg: dk ? "rgba(59,130,246,0.07)" : "#eff6ff", border: dk ? "rgba(59,130,246,0.2)" : "#bfdbfe", txt: dk ? "#93c5fd" : "#1d4ed8", dot: "#3b82f6" },
                        { bg: dk ? "rgba(139,92,246,0.07)" : "#f5f3ff", border: dk ? "rgba(139,92,246,0.2)" : "#ddd6fe", txt: dk ? "#c4b5fd" : "#6d28d9", dot: "#8b5cf6" },
                        { bg: dk ? "rgba(16,185,129,0.07)" : "#f0fdfa", border: dk ? "rgba(16,185,129,0.2)" : "#99f6e4", txt: dk ? "#6ee7b7" : "#065f46", dot: "#10b981" },
                        { bg: dk ? "rgba(245,158,11,0.07)" : "#fffbeb", border: dk ? "rgba(245,158,11,0.2)" : "#fde68a", txt: dk ? "#fcd34d" : "#92400e", dot: "#f59e0b" },
                        { bg: dk ? "rgba(239,68,68,0.07)" : "#fff1f2", border: dk ? "rgba(239,68,68,0.2)" : "#fecdd3", txt: dk ? "#fca5a5" : "#9f1239", dot: "#ef4444" },
                      ];
                      const p = palette[i % palette.length];
                      return (
                        <button key={qa.id}
                          onClick={async () => {
                            setShowFaq(false);
                            const now = new Date().toISOString();
                            const tmpUser = { id: `qa-u-${qa.id}`, sender_type: "user", content: qa.question, created_at: now };
                            setMessages(prev => [...prev, tmpUser]);
                            
                            // Nyalakan indikator bot sedang mengetik
                            setIsBotTyping(true);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            const tmpBot = { id: `qa-b-${qa.id}`, sender_type: "bot", content: qa.answer, created_at: now };
                            setMessages(prev => [...prev, tmpBot]);
                            setIsBotTyping(false);

                            // Catat ke DB di background
                            try { await useQuickAction(qa.id); } catch { /* silent */ }
                          }}
                          style={{
                            textAlign: "left", fontSize: 12, fontWeight: 600,
                            padding: "10px 14px", borderRadius: 13,
                            border: `1px solid ${p.border}`, background: p.bg, color: p.txt,
                            cursor: "pointer", transition: "all 0.18s ease",
                            display: "flex", alignItems: "center", gap: 9, width: "100%",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                          {qa.question}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FAQ PERTANYAAN POPULER (tetap ada jika ada chat aktif) */}
              {showFaq && faqs.length > 0 && quickActions.length === 0 && (
                <div style={{ marginTop: 6, animation: "welcomeIn 0.3s ease-out" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 1, background: dk ? "rgba(255,255,255,0.06)" : "rgba(11,20,66,0.07)" }} />
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: dk ? "#475569" : "#94a3b8", whiteSpace: "nowrap" }}>
                      Pertanyaan Populer
                    </p>
                    <div style={{ flex: 1, height: 1, background: dk ? "rgba(255,255,255,0.06)" : "rgba(11,20,66,0.07)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {faqs.slice(0, 4).map((faq, i) => {
                      const palette = [
                        { bg: dk ? "rgba(59,130,246,0.07)" : "#eff6ff", border: dk ? "rgba(59,130,246,0.2)" : "#bfdbfe", txt: dk ? "#93c5fd" : "#1d4ed8", dot: "#3b82f6" },
                        { bg: dk ? "rgba(139,92,246,0.07)" : "#f5f3ff", border: dk ? "rgba(139,92,246,0.2)" : "#ddd6fe", txt: dk ? "#c4b5fd" : "#6d28d9", dot: "#8b5cf6" },
                        { bg: dk ? "rgba(16,185,129,0.07)" : "#f0fdfa", border: dk ? "rgba(16,185,129,0.2)" : "#99f6e4", txt: dk ? "#6ee7b7" : "#065f46", dot: "#10b981" },
                        { bg: dk ? "rgba(245,158,11,0.07)" : "#fffbeb", border: dk ? "rgba(245,158,11,0.2)" : "#fde68a", txt: dk ? "#fcd34d" : "#92400e", dot: "#f59e0b" },
                      ];
                      const p = palette[i % palette.length];
                      return (
                        <button key={faq.id} onClick={() => handleSend(faq.question)}
                          style={{
                            textAlign: "left", fontSize: 12, fontWeight: 600,
                            padding: "10px 14px", borderRadius: 13,
                            border: `1px solid ${p.border}`, background: p.bg, color: p.txt,
                            cursor: "pointer", transition: "all 0.18s ease",
                            display: "flex", alignItems: "center", gap: 9, width: "100%",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                          {faq.question}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginTop: 10,
                  borderRadius: 12, padding: "9px 13px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <p style={{ fontSize: 11, color: "#f87171", flex: 1 }}>{error}</p>
                  <button onClick={() => setError("")} style={{ color: "#f87171", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              )}

              {sending && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBottom: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0369a1, #0ea5e9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20, flexShrink: 0,
                    boxShadow: "0 2px 10px rgba(3,105,161,0.3)",
                  }}>
                    <Headphones style={{ width: 13, height: 13, color: "#fff" }} />
                  </div>
                  <div style={{
                    background: dk ? "rgba(14,165,233,0.08)" : "#f0f9ff",
                    border: dk ? "1px solid rgba(14,165,233,0.2)" : "1px solid #bae6fd",
                    borderRadius: "4px 16px 16px 16px", padding: "11px 16px",
                  }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 0.18, 0.36].map((d, i) => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: dk ? "#38bdf8" : "#0284c7",
                          animation: "typingBounce 1.2s ease-in-out infinite",
                          animationDelay: `${d}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* FAQ TOGGLE */}
        {!loading && faqs.length > 0 && messages.length > 0 && (
          <div style={{ padding: "5px 16px 2px", borderTop: dk ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setShowFaq(v => !v)}
              style={{
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none",
                color: dk ? "#475569" : "#94a3b8", transition: "color 0.2s", padding: "4px 0",
              }}
              onMouseEnter={e => e.currentTarget.style.color = dk ? "#94a3b8" : "#64748b"}
              onMouseLeave={e => e.currentTarget.style.color = dk ? "#475569" : "#94a3b8"}
            >
              <Sparkles style={{ width: 10, height: 10 }} />
              {showFaq ? "Sembunyikan pertanyaan populer" : "Tampilkan pertanyaan populer"}
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <div style={{
          flexShrink: 0, padding: "10px 14px 14px",
          background: dk ? "#161b22" : "#f8faff",
          borderTop: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(11,20,66,0.07)",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 9,
            background: dk ? "#0d1117" : "#fff",
            border: dk ? "1.5px solid rgba(255,255,255,0.09)" : "1.5px solid #e2e8f0",
            borderRadius: 16, padding: "9px 11px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
            ref={node => {
              if (!node) return;
              node._focusIn = () => { node.style.borderColor = "#004F9F"; node.style.boxShadow = "0 0 0 3px rgba(0,79,159,0.1)"; };
              node._focusOut = () => { node.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; node.style.boxShadow = "none"; };
            }}
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={e => { const p = e.currentTarget.parentNode; p.style.borderColor = "#004F9F"; p.style.boxShadow = "0 0 0 3px rgba(0,79,159,0.1)"; }}
              onBlur={e => { const p = e.currentTarget.parentNode; p.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; p.style.boxShadow = "none"; }}
              placeholder="Tulis pertanyaan Anda..."
              rows={1}
              style={{
                flex: 1, resize: "none", background: "transparent",
                outline: "none", fontSize: 13, lineHeight: 2.5,
                color: dk ? "#f1f5f9" : "#0f172a",
                maxHeight: 80, overflowY: "auto", scrollbarWidth: "none",
                letterSpacing: "0.01em",
              }}
            />
            <button onClick={() => handleSend()} disabled={!inputText.trim() || sending}
              style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 11,
                background: inputText.trim() && !sending ? "linear-gradient(135deg, #0B1442, #004F9F)" : (dk ? "rgba(255,255,255,0.05)" : "#e2e8f0"),
                border: "none", cursor: inputText.trim() && !sending ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: inputText.trim() && !sending ? "#fff" : (dk ? "#475569" : "#94a3b8"),
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                transform: inputText.trim() && !sending ? "scale(1)" : "scale(0.9)",
                boxShadow: inputText.trim() && !sending ? "0 4px 16px rgba(11,20,66,0.3)" : "none",
              }}
              onMouseEnter={e => { if (inputText.trim() && !sending) e.currentTarget.style.transform = "scale(1.1) translateY(-1px)"; }}
              onMouseLeave={e => { if (inputText.trim() && !sending) e.currentTarget.style.transform = "scale(1)"; }}
            >
              {sending
                ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
                : <Send style={{ width: 15, height: 15 }} />
              }
            </button>
          </div>
          <p style={{ fontSize: 10, textAlign: "center", marginTop: 7, color: dk ? "#2d3748" : "#cbd5e1", letterSpacing: "0.02em" }}>
            Enter untuk kirim &middot; Shift+Enter baris baru
          </p>
        </div>
      </div>

      <style>{`
        @keyframes panelUp { from{opacity:0;transform:translateY(28px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes welcomeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iconBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes onlinePulse { 0%,100%{box-shadow:0 0 6px rgba(34,197,94,.6)} 50%{box-shadow:0 0 14px rgba(34,197,94,1)} }
        @keyframes typingBounce { 0%,80%,100%{transform:scale(0.8) translateY(0);opacity:.4} 40%{transform:scale(1.15) translateY(-5px);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bubbleIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>,
    document.body
  );
};

export default ChatWidget;
