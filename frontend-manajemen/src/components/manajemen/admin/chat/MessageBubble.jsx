import { CheckCheck } from "lucide-react";

const MessageBubble = ({ message }) => {
  const isAdmin = message.sender_type === "admin";
  const isBot = message.sender_type === "bot";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isAdmin ? "bg-[#0B1442] text-white" : isBot ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-900"
        }`}
      >
        <p className="text-[13px] leading-relaxed">{message.content}</p>
        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${isAdmin || isBot ? "text-white/60" : "text-slate-400"}`}>
          <span>{new Date(message.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
          {isAdmin && <CheckCheck className="w-3 h-3" />}
          {isBot && <span className="rounded bg-white/20 px-1 py-0.5 font-bold">BOT/QA</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;