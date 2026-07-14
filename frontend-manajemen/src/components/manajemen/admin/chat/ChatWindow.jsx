import { useEffect, useRef } from "react";
import { Send, XCircle, MessageCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ session, messages, replyText, setReplyText, sending, onSend, onClose }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
        <MessageCircle className="w-10 h-10" />
        <span className="text-sm font-semibold">Pilih salah satu sesi percakapan untuk memulai</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full">
      <div className="h-17 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-[15px] font-black text-slate-900">{session.user_nama}</h3>
          <p className="text-[11px] font-medium text-slate-500">{session.user_email}</p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition-all cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          Tutup Sesi
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSend} className="flex gap-3 bg-white border-t border-slate-200 p-4 shrink-0">
        <input
          type="text"
          placeholder="Ketik balasan Anda..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none focus:border-[#004F9F] transition-all"
        />
        <button
          type="submit"
          disabled={!replyText.trim() || sending}
          className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            replyText.trim() ? "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white" : "bg-slate-200 text-slate-400"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;