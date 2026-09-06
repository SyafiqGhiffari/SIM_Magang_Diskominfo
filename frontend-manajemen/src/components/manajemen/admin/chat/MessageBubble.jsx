import { useRef, useState } from "react";
import {
  CheckCheck, Bot, ChevronDown, FileText, Download, Ban,
} from "lucide-react";
import { getFileUrl } from "../../../../utils/fileUrl";
import TeksKaya, { TeksKayaInline } from "../../../../utils/teksKaya";

const ukuranBerkas = (b) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const potong = (t, n = 70) => (t && t.length > n ? t.slice(0, n) + "..." : t || "");

const MessageBubble = ({
  message, isDark, onMenu, modePilih, terpilih, onToggle, onLoncatKe, disorot,
  onBukaLampiran, namaPeserta,
}) => {
  const [gambarGagal, setGambarGagal] = useState(false);
  const timerRef = useRef(null);
  const posAwalRef = useRef({ x: 0, y: 0 });
  const sentuhTahanRef = useRef(false);

  const isAdmin = message.sender_type === "admin";
  const isBot = message.sender_type === "bot";
  const dihapus = Boolean(message.dihapus_pada);

  const jam = new Date(message.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });

  const bukaMenu = (e) => {
    if (modePilih || dihapus) return;
    e.preventDefault();
    e.stopPropagation();
    onMenu?.(message, e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (modePilih || dihapus) return;
    sentuhTahanRef.current = false;
    const t = e.touches[0];
    posAwalRef.current = { x: t.clientX, y: t.clientY };
    timerRef.current = setTimeout(() => {
      sentuhTahanRef.current = true;
      navigator?.vibrate?.(40);
      onMenu?.(message, t.clientX, t.clientY);
    }, 450);
  };

  const handleTouchMove = (e) => {
    if (!timerRef.current) return;
    const t = e.touches[0];
    if (
      Math.abs(t.clientX - posAwalRef.current.x) > 10 ||
      Math.abs(t.clientY - posAwalRef.current.y) > 10
    ) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const kutipan = message.reply_to;

  return (
    <div
      id={`pesan-${message.id}`}
      onContextMenu={bukaMenu}
      onClick={() => modePilih && onToggle?.(message.id)}
      className={`flex items-center gap-2 sm:gap-2.5 rounded-lg px-0.5 sm:px-1 py-0.5 transition-colors duration-300 ${
        modePilih ? "cursor-pointer hover:bg-slate-500/5" : ""
      } ${disorot ? "bg-amber-400/15" : ""}`}
    >
      {modePilih && (
        <span
          className={`flex h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
            terpilih ? "border-[#00A5EC] bg-[#00A5EC]" : isDark ? "border-slate-600" : "border-slate-300"
          }`}
        >
          {terpilih && <CheckCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" strokeWidth={4} />}
        </span>
      )}

      <div className={`relative flex min-w-0 flex-1 ${isAdmin ? "justify-end" : "justify-start"}`}>
        <div className="group/b max-w-[85%] sm:max-w-[78%] min-w-0">
          {isBot && (
            <span className="mb-0.5 sm:mb-1 flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-bold text-[#00A5EC]">
              <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Jawaban otomatis
            </span>
          )}

          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`relative select-none rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11.5px] sm:text-[13px] leading-snug shadow-sm transition-shadow duration-200 hover:shadow-md ${
              isAdmin ? "rounded-br-md" : "rounded-bl-md"
            } ${
              dihapus
                ? `border border-dashed ${isDark ? "border-white/15 text-slate-500" : "border-slate-300 text-slate-400"}`
                : isAdmin
                ? "bg-gradient-to-br from-[#123C7A] to-[#0B1442] text-white"
                : isBot
                ? `border ${isDark ? "border-[#00A5EC]/25 bg-[#00A5EC]/10 text-slate-100" : "border-sky-200 bg-sky-50 text-slate-700"}`
                : `border ${isDark ? "border-white/10 bg-white/5 text-slate-100" : "border-slate-200 bg-white text-slate-700"}`
            }`}
          >
            {/* Panah menu mengambang di atas teks (Hanya Desktop) */}
            {!modePilih && !dihapus && (
              <button
                onClick={bukaMenu}
                title="Menu pesan"
                className={`absolute right-1 top-1 z-10 hidden lg:flex h-4.5 w-4.5 sm:h-5 sm:w-5 cursor-pointer items-center justify-center rounded-md opacity-0 backdrop-blur-md transition-all duration-200 group-hover/b:opacity-100 ${
                  isAdmin
                    ? "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
                    : isDark
                    ? "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                    : "bg-slate-900/10 text-slate-600 hover:bg-slate-900/20 hover:text-slate-900"
                }`}
              >
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
              </button>
            )}

            {dihapus ? (
              <p className="flex items-center gap-1.5 italic text-[11px] sm:text-[12px]">
                <Ban className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                Pesan ini telah dihapus
              </p>
            ) : (
              <>
                {/* Kutipan balasan */}
                {kutipan && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onLoncatKe?.(kutipan.id); }}
                    className={`mb-1 sm:mb-1.5 flex w-full cursor-pointer items-start gap-1.5 sm:gap-2 rounded-md sm:rounded-lg border-l-2 sm:border-l-[3px] px-1.5 sm:px-2 py-1 sm:py-1.5 text-left transition-opacity duration-200 hover:opacity-80 ${
                      isAdmin
                        ? "border-[#00A5EC] bg-white/10"
                        : isDark ? "border-[#00A5EC] bg-white/5" : "border-[#004F9F] bg-slate-100"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block text-[8.5px] sm:text-[9.5px] font-bold ${isAdmin ? "text-[#7DD3FC]" : "text-[#004F9F]"}`}>
                        {kutipan.sender_type === "admin" ? "Anda" : namaPeserta || "Peserta"}
                      </span>
                      <span className={`block truncate text-[9.5px] sm:text-[10.5px] ${isAdmin ? "text-white/60" : "text-slate-500"}`}>
                        {kutipan.dihapus_pada
                          ? "Pesan telah dihapus"
                          : kutipan.tipe === "gambar"
                          ? "Foto"
                          : kutipan.tipe === "video"
                          ? "Video"
                          : kutipan.tipe === "berkas"
                          ? potong(kutipan.file_nama, 30)
                          : <TeksKayaInline teks={potong(kutipan.content)} />}
                      </span>
                    </span>
                  </button>
                )}

                {/* Lampiran gambar */}
                {message.tipe === "gambar" && message.file_path && !gambarGagal && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onBukaLampiran?.(message); }}
                    className="mb-1 sm:mb-1.5 block w-full cursor-zoom-in overflow-hidden rounded-lg sm:rounded-xl"
                  >
                    <img
                      src={getFileUrl(message.file_path)}
                      alt={message.file_nama}
                      onError={() => setGambarGagal(true)}
                      className="max-h-56 sm:max-h-64 w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </button>
                )}

                {/* Lampiran video */}
                {message.tipe === "video" && message.file_path && (
                  <video
                    src={getFileUrl(message.file_path)}
                    controls
                    onClick={(e) => e.stopPropagation()}
                    className="mb-1 sm:mb-1.5 max-h-56 sm:max-h-64 w-full rounded-lg sm:rounded-xl bg-black"
                  />
                )}

                {/* Lampiran dokumen */}
                {message.tipe === "berkas" && message.file_path && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onBukaLampiran?.(message); }}
                    className={`mb-1 sm:mb-1.5 flex w-full cursor-pointer items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl p-1.5 sm:p-2 text-left transition-colors duration-200 ${
                      isAdmin ? "bg-white/10 hover:bg-white/15" : isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${
                      isAdmin ? "bg-white/15 text-white" : "bg-[#004F9F]/10 text-[#004F9F]"
                    }`}>
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10.5px] sm:text-[11.5px] font-bold">{message.file_nama}</span>
                      <span className={`block text-[8.5px] sm:text-[9.5px] ${isAdmin ? "text-white/50" : "text-slate-400"}`}>
                        {ukuranBerkas(message.file_size)}
                      </span>
                    </span>
                    <Download className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${isAdmin ? "text-white/60" : "text-slate-400"}`} />
                  </button>
                )}

                {message.content && (
                  <div className="break-words space-y-1">
                    <TeksKaya teks={message.content} />
                    {/* Stempel waktu rata kanan bawah */}
                    <div
                      className={`flex items-center justify-end gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-medium leading-none pt-0.5 ${
                        isAdmin ? "text-white/50" : isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      <span className="tabular-nums">{jam}</span>
                      {isAdmin && (
                        <CheckCheck
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${message.is_read_user ? "text-[#53BDEB]" : "text-white/40"}`}
                          strokeWidth={2.4}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Stempel terpisah hanya untuk pesan tanpa teks */}
            {(!message.content || dihapus) && (
              <div className={`mt-0.5 flex items-center justify-end gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-medium ${
                isAdmin && !dihapus ? "text-white/50" : isDark ? "text-slate-500" : "text-slate-400"
              }`}>
                <span className="tabular-nums">{jam}</span>
                {isAdmin && !dihapus && (
                  <CheckCheck
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${message.is_read_user ? "text-[#53BDEB]" : "text-white/40"}`}
                    strokeWidth={2.4}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;