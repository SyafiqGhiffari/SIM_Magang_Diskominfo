import { User, MessageCircle } from "lucide-react";

const ChatSessionList = ({ sessions, selectedSession, onSelect }) => {
  return (
    <div className="w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-200">
        <h3 className="text-base font-black text-slate-900">Percakapan Masuk</h3>
        <p className="mt-0.5 text-xs text-slate-500">Semua sesi chat dari pendaftar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <MessageCircle className="w-7 h-7" />
            <span className="text-xs font-semibold">Belum ada percakapan</span>
          </div>
        ) : (
          sessions.map((s) => {
            const isSelected = selectedSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={`w-full flex items-start gap-3 rounded-xl p-4 text-left transition-all cursor-pointer ${
                  isSelected ? "bg-slate-100 border border-slate-300" : "border border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-[18px] h-[18px] text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-[13px] font-bold text-slate-900 truncate">{s.user_nama}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {s.last_message_at
                        ? new Date(s.last_message_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs truncate ${s.unread_admin_count > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>
                    {s.last_message || "(Belum ada pesan)"}
                  </p>
                </div>
                {s.unread_admin_count > 0 && (
                  <span className="self-center shrink-0 rounded-full bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5">
                    {s.unread_admin_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSessionList;