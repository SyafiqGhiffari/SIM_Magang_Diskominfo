import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, ChevronLeft, XCircle, User, Send } from "lucide-react";
import { getChatSessions, getSessionMessages, replySession, closeSession } from "../../../../services/chatService";
import { confirmDialog, toastError } from "../../../../utils/swal";
import MessageBubble from "./MessageBubble";

// Format tanggal ringkas + jam, mis. "Hari ini 23.37", "Kemarin 08.12", "12 Jul 14.05"
const formatDateTimeShort = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (date.toDateString() === today.toDateString()) {
    return `Hari ini ${time}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Kemarin ${time}`;
  }
  const shortDate = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${shortDate} ${time}`;
};

const ChatFloatingWidget = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);

  const sessionsWithMessages = sessions.filter((s) => Boolean(s.last_message));
  const totalUnread = sessions.reduce((sum, s) => sum + (s.unread_admin_count || 0), 0);

  // Polling daftar sesi setiap 5 detik
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getChatSessions();
        setSessions(res.data.data || []);
      } catch {
        // silent
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Polling pesan sesi terpilih setiap 3 detik
  useEffect(() => {
    if (!selectedSession) return;
    const fetchMessages = async () => {
      try {
        const res = await getSessionMessages(selectedSession.id);
        setMessages(res.data.data || []);
      } catch {
        // silent
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  useEffect(() => {
    if (isOpen && selectedSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, selectedSession]);

  // Klik di luar panel -> tutup
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const openWidget = () => setIsOpen(true);

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setMessages([]);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
    setMessages([]);
    setReplyText("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !selectedSession) return;

    setSending(true);
    try {
      const res = await replySession(selectedSession.id, replyText);
      setMessages((prev) => [...prev, res.data.data]);
      setReplyText("");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim balasan");
    } finally {
      setSending(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    const result = await confirmDialog({
      title: "Tutup sesi chat ini?",
      text: "Peserta tidak akan bisa melanjutkan percakapan pada sesi ini setelah ditutup.",
      confirmText: "Ya, Tutup",
      icon: "warning",
      danger: true,
    });
    if (!result.isConfirmed) return;

    try {
      await closeSession(selectedSession.id);
      const res = await getChatSessions();
      setSessions(res.data.data || []);
      handleBackToList();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menutup sesi");
    }
  };

  // ═══════════════════════════════════════════════
  // TOMBOL MELAYANG
  // ═══════════════════════════════════════════════
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
            Pesan Peserta
            <span style={{
              position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)",
              width: 0, height: 0,
              borderTop: "7px solid transparent", borderBottom: "7px solid transparent",
              borderLeft: "8px solid #1E3A8A",
            }} />
          </div>

          <div className="cw-ring cw-ring-1" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,165,236,0.5)" }} />
          <div className="cw-ring cw-ring-2" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,165,236,0.25)" }} />

          <button
            onClick={openWidget}
            className="cw-btn"
            title="Pesan Peserta"
            style={{
              position: "relative", width: 58, height: 58, borderRadius: "50%",
              background: "linear-gradient(135deg, #0B1442 0%, #004F9F 50%, #1E3A8A 100%)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(11,20,66,0.5)", color: "#fff", flexShrink: 0,
            }}
          >
            <MessageCircle style={{ width: 24, height: 24 }} />
            {totalUnread > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -5, minWidth: 22, height: 22,
                background: "#ef4444", borderRadius: 999, fontSize: 9, fontWeight: 900, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px", border: "2.5px solid #fff",
                boxShadow: "0 2px 8px rgba(239,68,68,0.6)",
                animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                {totalUnread > 9 ? "9+" : totalUnread}
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
          @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }
          .cw-float { animation: cwBob 3s ease-in-out infinite; }
          .cw-ring-1 { animation: cwSonar 2.4s ease-out infinite; }
          .cw-ring-2 { animation: cwSonar 2.4s ease-out infinite 1.2s; }
          .cw-btn { animation: cwGlow 2.5s ease-in-out infinite; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
          .cw-btn:hover { transform: scale(1.1) !important; }
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

  // ═══════════════════════════════════════════════
  // PANEL CHAT
  // ═══════════════════════════════════════════════
  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        width: 380, maxWidth: "calc(100vw - 24px)",
        animation: "panelUp 0.25s cubic-bezier(0.34,1.2,0.64,1)",
      }}
    >
      <div className={`flex flex-col rounded-2xl overflow-hidden shadow-2xl border ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"}`} style={{ height: 560, maxHeight: "calc(100vh - 64px)" }}>
        {/* HEADER */}
        <div className="relative shrink-0 bg-gradient-to-r from-[#030c22] via-[#0B1442] to-[#1a3580] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedSession && (
              <button onClick={handleBackToList} className="shrink-0 text-white/70 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">
                {selectedSession ? selectedSession.user_nama : "Pesan Peserta"}
              </p>
              <p className="text-[10px] text-white/60 truncate">
                {selectedSession ? selectedSession.user_email : `${sessionsWithMessages.length} percakapan`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {selectedSession && (
              <button
                onClick={handleCloseSession}
                title="Tutup sesi"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-white/70 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        {!selectedSession ? (
          // Daftar sesi
          <div className={`flex-1 overflow-y-auto p-2 ${isDark ? "bg-[#0d1117]" : "bg-slate-50"}`}>
            {sessionsWithMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                <MessageCircle className="w-8 h-8" />
                <span className="text-xs font-semibold">Belum ada percakapan</span>
              </div>
            ) : (
              sessionsWithMessages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all cursor-pointer mb-1 ${isDark ? "hover:bg-white/5" : "hover:bg-white"}`}
                >
                  <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>{s.user_nama}</p>
                      <span className={`text-[9px] shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {s.last_message_at ? formatDateTimeShort(s.last_message_at) : ""}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[11px] truncate ${s.unread_admin_count > 0 ? `font-bold ${isDark ? "text-slate-200" : "text-slate-800"}` : isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {s.last_message || "(Belum ada pesan)"}
                    </p>
                  </div>
                  {s.unread_admin_count > 0 && (
                    <span className="self-center shrink-0 rounded-full bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5">
                      {s.unread_admin_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          // Percakapan
          <>
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? "bg-[#0d1117]" : "bg-slate-50"}`}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className={`flex gap-2 p-3 border-t shrink-0 ${isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200"}`}>
              <input
                type="text"
                placeholder="Ketik balasan..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`flex-1 rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${isDark ? "bg-white/5 border-white/10 text-slate-100 focus:border-[#00A5EC]" : "bg-slate-50 border-slate-200 text-slate-700 focus:border-[#004F9F]"}`}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  replyText.trim() ? "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white" : isDark ? "bg-white/5 text-slate-600" : "bg-slate-200 text-slate-400"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes panelUp { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>,
    document.body
  );
};

export default ChatFloatingWidget;