import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import ChatSessionList from "../../components/manajemen/admin/chat/ChatSessionList";
import ChatWindow from "../../components/manajemen/admin/chat/ChatWindow";
import { getChatSessions, getSessionMessages, replySession, closeSession } from "../../services/chatService";
import { confirmDialog, toastError } from "../../utils/swal";

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

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
      setSelectedSession(null);
      setMessages([]);
      const res = await getChatSessions();
      setSessions(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menutup sesi");
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-6.25rem)] -m-8 border-t border-slate-200">
        <ChatSessionList sessions={sessions} selectedSession={selectedSession} onSelect={setSelectedSession} />
        <ChatWindow
          session={selectedSession}
          messages={messages}
          replyText={replyText}
          setReplyText={setReplyText}
          sending={sending}
          onSend={handleSend}
          onClose={handleCloseSession}
        />
      </div>
    </AdminLayout>
  );
};

export default ChatPage;