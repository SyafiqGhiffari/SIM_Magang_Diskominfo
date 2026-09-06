import TeksKaya from "../../utils/teksKaya";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X, MessageCircle, ChevronDown,
  Loader2, Headphones, Zap, Bot, Sparkles,
  ArrowRight, Download, UserRound, ClipboardCheck,
  FileText, CalendarClock, Award, HelpCircle, Building2,
  ThumbsUp, ThumbsDown, Lightbulb, Ban,
  CheckCheck, Paperclip, Image as ImageIcon, Maximize2, Minimize2,
  SendHorizontal, Info, MessageSquareText,
} from "lucide-react";
import {
  getOrCreateChatSession,
  getChatMessages,
  sendChatMessage,
  getPublicFAQ,
  getAdminStatus,
  getQuickActions,
  useQuickAction as recordQuickActionUsage,
  bukaSaranFaq,
  kirimFeedbackFaq,
  kirimLampiranChat,
} from "../../services/chatService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError } from "../../utils/swal";
import PratinjauLampiran from "./PratinjauLampiran";

// ─── Ikon yang boleh dipilih admin untuk tombol quick action ────────────────
// Kunci di sini harus sama dengan nilai yang disimpan pada kolom quick_icon.
const IKON_TERSEDIA = {
  FileText,
  CalendarClock,
  Award,
  HelpCircle,
  Building2,
  Download,
  UserRound,
  ClipboardCheck,
  Zap,
};

// ─── Karakter visual tiap tipe aksi ─────────────────────────────────────────
// Tipe "jawaban" sengaja tidak diberi ikon khusus supaya tetap memakai
// palet warna berputar seperti sebelumnya.
const GAYA_AKSI = {
  navigasi: { ikon: ArrowRight, warna: "#0ea5e9", petunjuk: "Buka halaman" },
  unduh: { ikon: Download, warna: "#8b5cf6", petunjuk: "Unduh berkas" },
  eskalasi: { ikon: UserRound, warna: "#ef4444", petunjuk: "Hubungi admin" },
  status: { ikon: ClipboardCheck, warna: "#10b981", petunjuk: "Status saya" },
};

// Mengubah target aksi dari backend menjadi URL yang bisa dibuka browser.
// Target relatif ("/uploads/x.pdf") disambung ke host API, karena berkas
// disajikan oleh backend, bukan oleh Vite.
const bangunUrlBerkas = (target) => {
  if (!target) return "";
  if (target.startsWith("http://") || target.startsWith("https://")) return target;

  const dasar = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
  return `${dasar}${target}`;
};

const ukuranBerkas = (b) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const potongTeks = (t, n = 60) => (t && t.length > n ? t.slice(0, n) + "..." : t || "");

const labelKutipan = (k) => {
  if (!k) return "";
  if (k.dihapus_pada) return "Pesan telah dihapus";
  if (k.tipe === "gambar") return "Foto";
  if (k.tipe === "video") return "Video";
  if (k.tipe === "berkas") return potongTeks(k.file_nama, 30);
  return potongTeks(k.content);
};

/* Lampiran & kutipan dipakai di gelembung peserta maupun admin, jadi
   dipisah agar tidak ditulis dua kali. */
const IsiLampiran = ({ msg, gelapTeks, onBuka }) => {
  // Jalur dari backend tersimpan relatif ("uploads/chat/x.jpg").
  const url = getFileUrl(msg.file_path);
  if (!url) return null;

  if (msg.tipe === "gambar") {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onBuka?.(msg); }}
        style={{
          display: "block", width: "100%", marginBottom: 6, borderRadius: 12,
          overflow: "hidden", border: "none", padding: 0, background: "none", cursor: "zoom-in",
        }}>
        <img src={url} alt={msg.file_nama}
          style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
      </button>
    );
  }

  if (msg.tipe === "video") {
    return (
      <video src={url} controls onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: 220, borderRadius: 12, marginBottom: 6, background: "#000" }} />
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onBuka?.(msg); }}
      style={{
        display: "flex", alignItems: "center", gap: 9, marginBottom: 6, width: "100%",
        padding: 8, borderRadius: 12, border: "none", cursor: "pointer",
        background: gelapTeks ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
        color: "inherit", textAlign: "left",
      }}>
      <span style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: 9,
        background: gelapTeks ? "rgba(255,255,255,0.18)" : "rgba(0,79,159,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FileText style={{ width: 15, height: 15 }} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {msg.file_nama}
        </span>
        <span style={{ display: "block", fontSize: 9.5, opacity: 0.65 }}>
          {ukuranBerkas(msg.file_size)}
        </span>
      </span>
      <Download style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.7 }} />
    </button>
  );
};

const KutipanBalasan = ({ kutipan, gelapTeks }) => {
  if (!kutipan) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", marginBottom: 6,
      padding: "6px 8px", borderRadius: 8,
      borderLeft: `3px solid ${gelapTeks ? "#00A5EC" : "#004F9F"}`,
      background: gelapTeks ? "rgba(255,255,255,0.10)" : "#f1f5f9",
    }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, color: gelapTeks ? "#7DD3FC" : "#004F9F" }}>
          {kutipan.sender_type === "user" ? "Anda" : "Admin Diskominfo"}
        </span>
        <span style={{ display: "block", fontSize: 10.5, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {labelKutipan(kutipan)}
        </span>
      </span>
    </div>
  );
};

// ─── Bubble Pesan ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, dk, faqId, nilai, onNilai, onBukaLampiran }) => {
  const isUser = msg.sender_type === "user";
  const isBot = msg.sender_type === "bot";

  const time = new Date(msg.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });

  if (isUser) {
    // Stempel selalu pada barisnya sendiri, rata kanan bawah gelembung.
    // marginTop negatif menutup jarak bawaan paragraf terakhir TeksKaya.
    const stempel = (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
        marginTop: 1, fontSize: 10, fontWeight: 500,
        color: "rgba(255,255,255,0.5)", lineHeight: 1,
      }}>
        <span className="tabular-nums">{time}</span>
        {!msg.dihapus_pada && (
          <CheckCheck
            style={{ width: 14, height: 14 }}
            color={msg.is_read_admin ? "#53BDEB" : "rgba(255,255,255,0.4)"}
            strokeWidth={2.4}
          />
        )}
      </div>
    );

    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, animation: "bubbleIn 0.2s ease-out" }}>
        <div style={{ maxWidth: "78%", minWidth: 0 }}>
          <div style={{
            background: "linear-gradient(to bottom right, #123C7A, #0B1442)",
            color: "#fff",
            borderRadius: "16px 16px 6px 16px",
            padding: "8px 12px 6px",
            fontSize: 13,
            lineHeight: 1.375,
            boxShadow: "0 1px 3px rgba(11,20,66,0.14)",
            wordBreak: "break-word",
          }}>
            {msg.dihapus_pada ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontStyle: "italic", color: "rgba(255,255,255,0.55)" }}>
                <Ban style={{ width: 13, height: 13, flexShrink: 0 }} /> Pesan ini telah dihapus
              </span>
            ) : (
              <>
                <KutipanBalasan kutipan={msg.reply_to} gelapTeks />
                <IsiLampiran msg={msg} gelapTeks onBuka={onBukaLampiran} />
                {msg.content && <TeksKaya teks={msg.content} />}
              </>
            )}
            {stempel}
          </div>
        </div>
      </div>
    );
  }

  const avatarBg = isBot
    ? "linear-gradient(135deg, #004F9F, #00A5EC)"
    : "linear-gradient(135deg, #0B1442, #004F9F)";
  const bubbleBg = isBot ? (dk ? "rgba(0,165,236,0.10)" : "#f0f9ff") : (dk ? "rgba(255,255,255,0.05)" : "#ffffff");
  const bubbleBorder = isBot ? (dk ? "rgba(0,165,236,0.25)" : "#bae6fd") : (dk ? "rgba(255,255,255,0.10)" : "#e2e8f0");
  const bubbleTxt = isBot ? (dk ? "#e2e8f0" : "#0f172a") : (dk ? "#f1f5f9" : "#334155");
  const IkonLabel = isBot ? Bot : MessageSquareText;
  const label = isBot ? "Jawaban Otomatis (Bot)" : "Admin Diskominfo";
  const labelColor = "#00A5EC";

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBottom: 14, animation: "bubbleIn 0.2s ease-out" }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
        background: avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: isBot ? 32 : 2,
        boxShadow: isBot ? "0 2px 10px rgba(124,58,237,0.35)" : "0 2px 10px rgba(3,105,161,0.3)",
      }}>
        {isBot
          ? <Bot style={{ width: 13, height: 13, color: "#fff" }} />
          : <Headphones style={{ width: 13, height: 13, color: "#fff" }} />
        }
      </div>
      <div style={{ maxWidth: "78%" }}>
        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, marginBottom: 5, color: labelColor, letterSpacing: "0.02em" }}>
          <IkonLabel style={{ width: 11, height: 11 }} />
          {label}
        </p>
        {(() => {
        const stempel = (
          <div style={{
            display: "flex", justifyContent: "flex-end", marginTop: 1,
            fontSize: 10, fontWeight: 500, lineHeight: 1,
            color: dk ? "#64748b" : "#94a3b8",
          }}>
            <span className="tabular-nums">{time}</span>
          </div>
        );

        return (
          <div style={{
            background: bubbleBg,
            border: `1px solid ${bubbleBorder}`,
            color: bubbleTxt,
            borderRadius: "16px 16px 16px 6px",
            padding: "8px 12px 6px",
            fontSize: 13,
            lineHeight: 1.375,
            wordBreak: "break-word",
            boxShadow: "0 1px 3px rgba(11,20,66,0.07)",
          }}>
            {msg.dihapus_pada ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontStyle: "italic", opacity: 0.6 }}>
                <Ban style={{ width: 13, height: 13 }} /> Pesan ini telah dihapus
              </span>
            ) : (
              <>
                <KutipanBalasan kutipan={msg.reply_to} />
                <IsiLampiran msg={msg} onBuka={onBukaLampiran} />
                {msg.content && <TeksKaya teks={msg.content} />}
              </>
            )}
            {stempel}
          </div>
        );
      })()}
        {isBot && (
          <p style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 600, marginTop: 5, padding: "3px 8px",
            borderRadius: 7, lineHeight: 1.4,
            background: dk ? "rgba(148,163,184,0.12)" : "#f1f5f9",
            color: dk ? "#94a3b8" : "#64748b",
          }}>
            <Info style={{ width: 11, height: 11, flexShrink: 0 }} />
            Dijawab otomatis oleh sistem, bukan oleh admin
          </p>
        )}

        {/* Penilaian jawaban — hanya untuk balasan bot yang bersumber dari FAQ */}
        {isBot && faqId && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, paddingLeft: 2 }}>
            {nilai === undefined ? (
              <>
                <span style={{ fontSize: 10, color: dk ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                  Membantu?
                </span>
                <button
                  type="button"
                  onClick={() => onNilai(faqId, msg.id, true)}
                  title="Jawaban ini membantu"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"}`,
                    background: "transparent", color: dk ? "#64748b" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#10b981"; e.currentTarget.style.borderColor = "#10b981"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = dk ? "#64748b" : "#94a3b8"; e.currentTarget.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; }}
                >
                  <ThumbsUp style={{ width: 11, height: 11 }} />
                </button>
                <button
                  type="button"
                  onClick={() => onNilai(faqId, msg.id, false)}
                  title="Jawaban ini kurang membantu"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"}`,
                    background: "transparent", color: dk ? "#64748b" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = dk ? "#64748b" : "#94a3b8"; e.currentTarget.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; }}
                >
                  <ThumbsDown style={{ width: 11, height: 11 }} />
                </button>
              </>
            ) : (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 700,
                color: nilai ? "#10b981" : "#94a3b8",
              }}>
                {nilai
                  ? <><ThumbsUp style={{ width: 10, height: 10 }} /> Terima kasih atas penilaian Anda</>
                  : <><ThumbsDown style={{ width: 10, height: 10 }} /> Masukan Anda kami catat</>}
              </span>
            )}
          </div>
        )}
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
        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, marginBottom: 5, color: "#00A5EC", letterSpacing: "0.02em" }}>
          <Bot style={{ width: 11, height: 11 }} />
          Jawaban Otomatis (Bot)
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
  const [statusUser, setStatusUser] = useState("");
  const [aksiSibuk, setAksiSibuk] = useState(null); // id tombol yang sedang diproses
  const navigate = useNavigate();

  // Chip "Mungkin maksud Anda" dari balasan terakhir bot
  const [saran, setSaran] = useState([]);
  const [saranSibuk, setSaranSibuk] = useState(null);

  // Pemetaan id pesan bot -> id FAQ sumbernya, supaya tombol jempol
  // tahu FAQ mana yang sedang dinilai.
  const [faqPerPesan, setFaqPerPesan] = useState({});

  // Pemetaan id pesan -> penilaian yang sudah diberikan (true/false)
  const [nilaiPerPesan, setNilaiPerPesan] = useState({});
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showFaq, setShowFaq] = useState(true);
  const [adminOnline, setAdminOnline] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // ── Lampiran & tampilan ──
  const [lampiranTertunda, setLampiranTertunda] = useState(null); // berkas menunggu dikirim
  const [lampiranDibuka, setLampiranDibuka] = useState(null);     // pesan yang dibuka di modal
  const [mengunggah, setMengunggah] = useState(false);
  const [menuLampiran, setMenuLampiran] = useState(false);
  const [diperbesar, setDiperbesar] = useState(false);
  const gambarRef = useRef(null);
  const fileRef = useRef(null);

  const bottomRef = useRef(null);
  const wadahPesanRef = useRef(null);
  const idPesanTerakhirRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  const chatPanelRef = useRef(null);
  const prevMsgLen = useRef(0);
  const tempIdCounter = useRef(0);

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
      setStatusUser(qaRes.data.status_user || "");
      const msgRes = await getChatMessages();
      const msgs = msgRes.data.data || [];
      setMessages(msgs);
      if (msgRes.data?.user_ratings) {
        setNilaiPerPesan((prev) => ({ ...prev, ...msgRes.data.user_ratings }));
      }
      prevMsgLen.current = msgs.length;
    } catch { toastError("Gagal memuat chat. Coba lagi."); }
    finally { setLoading(false); }
  }, []);

  // Menjalankan satu quick action sesuai tipenya.
  // Alur: tampilkan gelembung pengguna → minta backend memprosesnya →
  // tampilkan balasan asli dari server → jalankan efek samping (pindah/unduh).
  const jalankanQuickAction = useCallback(async (qa) => {
    if (aksiSibuk) return; // cegah klik ganda
    setAksiSibuk(qa.id);
    setShowFaq(false);

    const waktu = new Date().toISOString();

    // Gelembung pengguna tampil seketika supaya terasa responsif
    setMessages((prev) => [
      ...prev,
      { id: `qa-u-${qa.id}-${Date.now()}`, sender_type: "user", content: qa.question, created_at: waktu },
    ]);
    setIsBotTyping(true);

    try {
      const res = await recordQuickActionUsage(qa.id);
      const balasan = res.data?.bot_reply;
      const tipe = res.data?.action_type || qa.action_type || "jawaban";
      const target = res.data?.action_target || qa.action_target || "";

      // Jeda singkat agar indikator mengetik tidak berkedip
      await new Promise((r) => setTimeout(r, 500));

      const botMsg = balasan ?? {
        id: `qa-b-${qa.id}-${Date.now()}`,
        sender_type: "bot",
        content: qa.answer,
        created_at: waktu,
      };

      setMessages((prev) => [...prev, botMsg]);
      setFaqPerPesan((prev) => ({ ...prev, [botMsg.id]: qa.id }));
      setIsBotTyping(false);

      // ── Efek samping sesuai tipe aksi ──
      if (tipe === "navigasi" && target) {
        // Beri waktu peserta membaca balasan sebelum halaman berpindah
        setTimeout(() => {
          setIsOpen(false);
          navigate(target);
        }, 1200);
      }

      if (tipe === "unduh" && target) {
        const url = bangunUrlBerkas(target);
        // Dibuka di tab baru agar sesi chat tidak ikut tertutup
        window.open(url, "_blank", "noopener,noreferrer");
      }

      if (tipe === "eskalasi") {
        // Admin sudah diberi tahu oleh backend; arahkan fokus ke kotak ketik
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    } catch (err) {
      setIsBotTyping(false);

      const pesan =
        err.response?.status === 403
          ? "Pintasan ini tidak tersedia untuk status pendaftaran Anda saat ini."
          : "Maaf, terjadi gangguan saat memproses pintasan. Silakan ketik pertanyaan Anda langsung.";

      setMessages((prev) => [
        ...prev,
        { id: `qa-e-${qa.id}-${Date.now()}`, sender_type: "bot", content: pesan, created_at: waktu },
      ]);
    } finally {
      setAksiSibuk(null);
    }
  }, [aksiSibuk, navigate]);

  const pollMessages = useCallback(async () => {
    try {
      const res = await getChatMessages();
      const msgs = res.data.data || [];

      // State hanya diganti bila isinya benar-benar berubah. Tanpa ini setiap
      // putaran polling memicu render ulang dan menyeret gulir ke bawah.
      setMessages((lama) => {
        if (!lama || lama.length !== msgs.length) return msgs;
        const berubah = msgs.some((m, i) =>
          m.id !== lama[i].id ||
          m.is_read_admin !== lama[i].is_read_admin ||
          m.dihapus_pada !== lama[i].dihapus_pada
        );
        return berubah ? msgs : lama;
      });

      if (res.data?.user_ratings) {
        setNilaiPerPesan((prev) => ({ ...prev, ...res.data.user_ratings }));
      }

      if (!isOpen) {
        const n = msgs.filter((m, i) => i >= prevMsgLen.current && m.sender_type !== "user").length;
        if (n > 0) setUnread(u => { const next = u + n; onUnreadChange?.(next); return next; });
      }
      prevMsgLen.current = msgs.length;
    } catch { /* silent */ }
  }, [isOpen, onUnreadChange]);

  const openChat = () => {
    setIsOpen(true);
    setUnread(0);
    onUnreadChange?.(0);
    // Dinolkan agar percakapan selalu terbuka di posisi paling bawah
    idPesanTerakhirRef.current = null;
    if (!sessionId) initSession();
  };

  useEffect(() => {
    if (!openTrigger || openTrigger <= 0) return;
    const timeoutId = setTimeout(() => {
      openChat();
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTrigger]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    pollRef.current = setInterval(pollMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, sessionId, pollMessages]);

  /* Gulir otomatis hanya saat percakapan baru dibuka, atau saat ada pesan baru
     sementara peserta memang sedang berada di dekat dasar. */
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    const idTerakhir = messages[messages.length - 1]?.id;
    const pertamaKali = idPesanTerakhirRef.current === null;
    if (idPesanTerakhirRef.current === idTerakhir) return;
    idPesanTerakhirRef.current = idTerakhir;

    const wadah = wadahPesanRef.current;
    const dekatDasar = wadah
      ? wadah.scrollHeight - wadah.scrollTop - wadah.clientHeight < 150
      : true;

    if (pertamaKali || dekatDasar) {
      bottomRef.current?.scrollIntoView({ behavior: pertamaKali ? "auto" : "smooth" });
    }
  }, [messages, isOpen]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  useEffect(() => {
    // Modal pratinjau dirender ke document.body, jadi kliknya terbaca
    // "di luar panel". Tanpa penjaga ini, chat ikut tertutup.
    if (!isOpen || lampiranDibuka) return;
    const handleOutsideClick = (e) => {
      if (chatPanelRef.current && !chatPanelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, lampiranDibuka]);

  const handleSend = async (content) => {
    // Bila ada berkas menunggu, kirim sebagai lampiran (teks jadi keterangan)
    if (lampiranTertunda && content === undefined) return kirimLampiranTertunda();
    const text = (content ?? inputText).trim();
    if (!text || sending) return;
    setSending(true); setInputText(""); setShowFaq(false);
    tempIdCounter.current += 1;
    const temp = { id: `temp-${tempIdCounter.current}`, sender_type: "user", content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    setSaran([]);
    try {
      const sendRes = await sendChatMessage(text);
      if (sendRes.data.bot_replied) {
        setIsBotTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsBotTyping(false);
      }
      const res = await getChatMessages();
      const daftar = res.data.data || [];
      setMessages(daftar);

      // Kaitkan balasan bot terbaru dengan FAQ sumbernya
      const idFaq = sendRes.data.faq_id;
      if (idFaq) {
        const balasanTerakhir = [...daftar].reverse().find((m) => m.sender_type === "bot");
        if (balasanTerakhir) {
          setFaqPerPesan((prev) => ({ ...prev, [balasanTerakhir.id]: idFaq }));
        }
      }

      // Bot ragu — tawarkan pilihan
      setSaran(sendRes.data.saran || []);
    } catch {
      toastError("Gagal mengirim pesan. Periksa koneksi Anda.");
      setMessages(prev => prev.filter(m => m.id !== temp.id));
    } finally { setSending(false); setTimeout(() => inputRef.current?.focus(), 100); }
  };

  /* ── Lampiran: pilih dulu, kirim belakangan ──
     Batas ukuran disamakan dengan simpanLampiran() di chat_lampiran_controller.go */
  const pilihBerkas = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const batas = isVideo ? 20 : 5;
    if (file.size > batas * 1024 * 1024) {
      toastError(`Ukuran ${isVideo ? "video" : "berkas"} maksimal ${batas}MB`);
      return;
    }
    const isGambar = file.type.startsWith("image/");
    setLampiranTertunda({
      file, isGambar, isVideo,
      pratinjau: isGambar || isVideo ? URL.createObjectURL(file) : null,
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const batalkanLampiran = () => {
    if (lampiranTertunda?.pratinjau) URL.revokeObjectURL(lampiranTertunda.pratinjau);
    setLampiranTertunda(null);
  };

  const kirimLampiranTertunda = async () => {
    if (!lampiranTertunda || mengunggah) return;
    setMengunggah(true); setShowFaq(false);
    try {
      const fd = new FormData();
      fd.append("file", lampiranTertunda.file);
      if (inputText.trim()) fd.append("content", inputText.trim());
      await kirimLampiranChat(fd);
      setInputText("");
      batalkanLampiran();
      const res = await getChatMessages();
      setMessages(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim lampiran.");
    } finally {
      setMengunggah(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Peserta menekan salah satu chip saran
  const handleBukaSaran = async (item) => {
    if (saranSibuk) return;
    setSaranSibuk(item.id);
    setIsBotTyping(true);

    try {
      const res = await bukaSaranFaq(item.id);
      await new Promise((r) => setTimeout(r, 500));

      const daftar = await getChatMessages();
      setMessages(daftar.data.data || []);

      const balasan = res.data?.bot_reply;
      if (balasan?.id) {
        setFaqPerPesan((prev) => ({ ...prev, [balasan.id]: item.id }));
      }
      setSaran([]); // chip hilang setelah dipilih
    } catch {
      toastError("Gagal membuka jawaban. Coba lagi.");
    } finally {
      setIsBotTyping(false);
      setSaranSibuk(null);
    }
  };

  // Peserta menekan jempol naik/turun
  const handleNilai = async (faqId, messageId, membantu) => {
    // Tampilkan hasilnya seketika; kegagalan jaringan tidak perlu
    // mengganggu peserta karena penilaian bukan aksi kritis.
    setNilaiPerPesan((prev) => ({ ...prev, [messageId]: membantu }));

    try {
      await kirimFeedbackFaq(faqId, {
        membantu,
        message_id: typeof messageId === "number" ? messageId : undefined,
      });
    } catch {
      // Kembalikan tombol bila gagal, agar peserta bisa mencoba lagi
      setNilaiPerPesan((prev) => {
        const salinan = { ...prev };
        delete salinan[messageId];
        return salinan;
      });
    }
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
      width: diperbesar ? 620 : 382,
      maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 48px)",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease",
      animation: "panelUp 0.3s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        height: diperbesar ? "calc(100vh - 96px)" : 580,
        maxHeight: "calc(100vh - 64px)",
        transition: "height 0.25s ease",
        borderRadius: 22, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(11,20,66,0.32), 0 8px 32px rgba(0,0,0,0.12)",
        border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
        background: dk ? "#0d1117" : "#fff",
      }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #0B1442 0%, #123C7A 55%, #004F9F 100%)",
          flexShrink: 0, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(0,165,236,0.10)", filter: "blur(30px)", pointerEvents: "none" }} />
          {/* Blob ungu #7c3aed dihapus — tidak ada di palet web manajemen */}
          <div style={{ position: "absolute", top: 10, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(0,79,159,0.18)", filter: "blur(20px)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,165,236,0.25), rgba(0,79,159,0.40))",
                  border: "2px solid rgba(0,165,236,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 24px rgba(0,165,236,0.22), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}>
                  <Headphones style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* Gelombang denyut — hanya saat admin online */}
                  {adminOnline && (
                    <span style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#4ade80",
                      animation: "cwPing 1.8s cubic-bezier(0,0,0.2,1) infinite",
                    }} />
                  )}
                  <span style={{
                    position: "relative", width: "100%", height: "100%", borderRadius: "50%",
                    background: adminOnline ? "#22c55e" : "#94a3b8",
                    boxShadow: adminOnline ? "0 0 8px rgba(34,197,94,0.75)" : "none",
                    transition: "background 0.4s ease",
                  }} />
                </span>
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
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setDiperbesar(v => !v)}
              className="cw-hdr-btn"
              title={diperbesar ? "Perkecil" : "Perbesar"}
              style={{
                width: 34, height: 34, borderRadius: 11,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {diperbesar
                ? <Minimize2 className="cw-ikon-zoom" style={{ width: 16, height: 16 }} />
                : <Maximize2 className="cw-ikon-zoom" style={{ width: 16, height: 16 }} />}
            </button>
            <button onClick={() => setIsOpen(false)}
              className="cw-hdr-btn"
              title="Tutup"
              style={{
                width: 34, height: 34, borderRadius: 11,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              <X className="cw-ikon-tutup" style={{ width: 17, height: 17 }} />
            </button>
            </div>
          </div>
        </div>

        {/* AREA PESAN */}
        <div
          ref={wadahPesanRef}
          style={{
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
                  Halo, {user?.nama?.split(" ")[0] || "Peserta"}
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
                    <MessageBubble
                      msg={msg}
                      dk={dk}
                      faqId={msg.faq_id || faqPerPesan[msg.id]}
                      nilai={nilaiPerPesan[msg.id]}
                      onNilai={handleNilai}
                      onBukaLampiran={setLampiranDibuka}
                    />
                  </div>
                );
              })}

              {isBotTyping && <TypingBubble dk={dk} />}

              {/* CHIP SARAN — muncul saat bot tidak cukup yakin */}
              {saran.length > 0 && !isBotTyping && (
                <div style={{
                  marginLeft: 39, marginBottom: 14,
                  animation: "welcomeIn 0.3s ease-out",
                }}>
                  <p style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 700, marginBottom: 7,
                    color: dk ? "#a78bfa" : "#7c3aed",
                  }}>
                    <Lightbulb style={{ width: 11, height: 11 }} />
                    Mungkin maksud Anda
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {saran.map((s) => {
                      const sibuk = saranSibuk === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={saranSibuk !== null}
                          onClick={() => handleBukaSaran(s)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            textAlign: "left", width: "100%",
                            padding: "9px 13px", borderRadius: 13,
                            fontSize: 12, fontWeight: 600,
                            border: `1px dashed ${dk ? "rgba(167,139,250,0.35)" : "#ddd6fe"}`,
                            background: dk ? "rgba(124,58,237,0.06)" : "#faf5ff",
                            color: dk ? "#c4b5fd" : "#6d28d9",
                            cursor: saranSibuk !== null ? "not-allowed" : "pointer",
                            opacity: saranSibuk !== null && !sibuk ? 0.45 : 1,
                            transition: "all 0.18s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (saranSibuk !== null) return;
                            e.currentTarget.style.borderStyle = "solid";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderStyle = "dashed";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          {sibuk
                            ? <Loader2 style={{ width: 12, height: 12, flexShrink: 0, animation: "spin 0.8s linear infinite" }} />
                            : <Sparkles style={{ width: 12, height: 12, flexShrink: 0, opacity: 0.7 }} />}
                          <span style={{ flex: 1 }}>{s.question}</span>
                        </button>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 10, marginTop: 7, color: dk ? "#475569" : "#94a3b8" }}>
                    Tidak ada yang cocok? Tulis ulang pertanyaan Anda, admin juga akan membantu.
                  </p>
                </div>
              )}

              {/* SPANDUK STATUS — hanya saat percakapan masih kosong */}
              {showFaq && messages.length === 0 && statusUser === "revisi" && (
                <div style={{
                  marginTop: 6, padding: "11px 13px", borderRadius: 13,
                  background: dk ? "rgba(245,158,11,0.09)" : "#fffbeb",
                  border: `1px solid ${dk ? "rgba(245,158,11,0.22)" : "#fde68a"}`,
                  display: "flex", gap: 9, alignItems: "flex-start",
                  animation: "welcomeIn 0.3s ease-out",
                }}>
                  <ClipboardCheck style={{ width: 14, height: 14, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11.5, lineHeight: 1.55, fontWeight: 600, color: dk ? "#fcd34d" : "#92400e", margin: 0 }}>
                    Berkas Anda perlu diperbaiki. Gunakan pintasan di bawah untuk membuka halaman revisi.
                  </p>
                </div>
              )}

              {showFaq && messages.length === 0 && statusUser === "diterima" && (
                <div style={{
                  marginTop: 6, padding: "11px 13px", borderRadius: 13,
                  background: dk ? "rgba(16,185,129,0.09)" : "#f0fdfa",
                  border: `1px solid ${dk ? "rgba(16,185,129,0.22)" : "#99f6e4"}`,
                  display: "flex", gap: 9, alignItems: "flex-start",
                  animation: "welcomeIn 0.3s ease-out",
                }}>
                  <Award style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11.5, lineHeight: 1.55, fontWeight: 600, color: dk ? "#6ee7b7" : "#065f46", margin: 0 }}>
                    Selamat, pendaftaran Anda diterima. Surat penerimaan sudah bisa diunduh dari dasbor.
                  </p>
                </div>
              )}

              {/* QUICK ACTION BUTTONS */}
              {showFaq && quickActions.length > 0 && (
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
                        { bg: dk ? "rgba(14,165,233,0.07)" : "#f0f9ff", border: dk ? "rgba(14,165,233,0.2)" : "#bae6fd", txt: dk ? "#7dd3fc" : "#075985", dot: "#0ea5e9" },
                      ];

                      const tipe = qa.action_type || "jawaban";
                      const gaya = GAYA_AKSI[tipe];
                      const p = palette[i % palette.length];

                      // Ikon pilihan admin > ikon bawaan tipe aksi > titik warna
                      const IkonPilihan = qa.icon ? IKON_TERSEDIA[qa.icon] : null;
                      const IkonAksi = IkonPilihan || gaya?.ikon || null;
                      const warnaAksi = gaya?.warna || p.dot;

                      const sedangProses = aksiSibuk === qa.id;
                      const adaProsesLain = aksiSibuk !== null && !sedangProses;

                      return (
                        <button
                          key={qa.id}
                          type="button"
                          disabled={aksiSibuk !== null}
                          title={gaya?.petunjuk || "Tampilkan jawaban"}
                          onClick={() => jalankanQuickAction(qa)}
                          style={{
                            textAlign: "left", fontSize: 12, fontWeight: 600,
                            padding: "10px 14px", borderRadius: 13,
                            border: `1px solid ${p.border}`, background: p.bg, color: p.txt,
                            cursor: aksiSibuk !== null ? "not-allowed" : "pointer",
                            opacity: adaProsesLain ? 0.5 : 1,
                            transition: "all 0.18s ease",
                            display: "flex", alignItems: "center", gap: 9, width: "100%",
                          }}
                          onMouseEnter={(e) => {
                            if (aksiSibuk !== null) return;
                            e.currentTarget.style.transform = "translateX(5px)";
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateX(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {sedangProses ? (
                            <Loader2
                              style={{ width: 13, height: 13, flexShrink: 0, color: warnaAksi, animation: "spin 0.8s linear infinite" }}
                            />
                          ) : IkonAksi ? (
                            <IkonAksi style={{ width: 13, height: 13, flexShrink: 0, color: warnaAksi }} />
                          ) : (
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                          )}

                          <span style={{ flex: 1 }}>{qa.label || qa.question}</span>

                          {/* Penanda kecil bahwa tombol ini melakukan sesuatu, bukan sekadar menjawab */}
                          {tipe === "navigasi" && (
                            <ArrowRight style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.55 }} />
                          )}
                          {tipe === "unduh" && (
                            <Download style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.55 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FAQ PERTANYAAN POPULER (tetap ada jika ada chat aktif) */}
              {showFaq && faqs.length > 0 && quickActions.length < 3 && (
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
          <div style={{ padding: "8px 14px 4px", borderTop: dk ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setShowFaq(v => !v)}
              style={{
                width: "100%", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 11, fontWeight: 700, padding: "7px 11px", borderRadius: 11,
                background: dk ? "rgba(0,165,236,0.08)" : "#f0f9ff",
                border: dk ? "1px solid rgba(0,165,236,0.20)" : "1px solid #bae6fd",
                color: dk ? "#7dd3fc" : "#0369a1",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = dk ? "rgba(0,165,236,0.14)" : "#e0f2fe"; }}
              onMouseLeave={e => { e.currentTarget.style.background = dk ? "rgba(0,165,236,0.08)" : "#f0f9ff"; }}
            >
              <Sparkles style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: "left" }}>
                {showFaq ? "Sembunyikan pertanyaan populer" : "Lihat pertanyaan populer"}
              </span>
              <ChevronDown style={{
                width: 13, height: 13, flexShrink: 0,
                transform: showFaq ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease",
              }} />
            </button>
          </div>
        )}

        {/* PRATINJAU LAMPIRAN SEBELUM DIKIRIM */}
        {lampiranTertunda && (
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px",
            borderTop: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
            background: dk ? "#161b22" : "#fff",
            animation: "welcomeIn 0.22s ease-out",
          }}>
            {lampiranTertunda.isVideo ? (
              <video src={lampiranTertunda.pratinjau}
                style={{
                  width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                  background: "#000", flexShrink: 0,
                  boxShadow: "0 0 0 1px rgba(148,163,184,0.35)",
                }} />
            ) : lampiranTertunda.isGambar ? (
              <img src={lampiranTertunda.pratinjau} alt="Pratinjau"
                style={{
                  width: 56, height: 56, borderRadius: 14, objectFit: "cover", flexShrink: 0,
                  boxShadow: "0 0 0 1px rgba(148,163,184,0.35)",
                }} />
            ) : (
              <span style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                background: dk ? "rgba(124,58,237,0.16)" : "#f5f3ff",
                color: "#7c3aed",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText style={{ width: 24, height: 24 }} />
              </span>
            )}

            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{
                display: "block", fontSize: 12.5, fontWeight: 700,
                color: dk ? "#f1f5f9" : "#0B1442",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lampiranTertunda.file.name}
              </span>
              <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: dk ? "#64748b" : "#94a3b8", marginTop: 3 }}>
                {ukuranBerkas(lampiranTertunda.file.size)} · siap dikirim
              </span>
              <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: dk ? "#64748b" : "#94a3b8", marginTop: 2 }}>
                Tambahkan keterangan di bawah bila perlu
              </span>
            </span>

            <button onClick={batalkanLampiran} title="Batalkan lampiran"
              className="cw-batal-lampiran"
              style={{
                width: 30, height: 30, borderRadius: 10, border: "none",
                background: "transparent", color: dk ? "#64748b" : "#94a3b8",
                cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <X style={{ width: 16, height: 16 }} />
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
            display: "flex", alignItems: "center", gap: 4,
            background: dk ? "#0d1117" : "#fff",
            border: dk ? "1.5px solid rgba(255,255,255,0.09)" : "1.5px solid #e2e8f0",
            borderRadius: 16, padding: "6px 8px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
            ref={node => {
              if (!node) return;
              node._focusIn = () => { node.style.borderColor = "#004F9F"; node.style.boxShadow = "0 0 0 3px rgba(0,79,159,0.1)"; };
              node._focusOut = () => { node.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; node.style.boxShadow = "none"; };
            }}
          >
            {/* ── Tombol lampiran ── */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" onClick={() => setMenuLampiran(v => !v)} disabled={mengunggah}
                title="Lampirkan berkas"
                style={{
                  width: 36, height: 36, borderRadius: 11, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: menuLampiran ? "rgba(0,79,159,0.10)" : "transparent",
                  color: menuLampiran ? "#004F9F" : (dk ? "#64748b" : "#94a3b8"),
                  transition: "all 0.2s",
                }}>
                {mengunggah
                  ? <Loader2 style={{ width: 19, height: 19, animation: "spin 1s linear infinite" }} />
                  : <Paperclip style={{ width: 19, height: 19, transform: menuLampiran ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />}
              </button>

              {menuLampiran && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuLampiran(false)} />
                  <div style={{
                    position: "absolute", bottom: 44, left: 0, zIndex: 20, width: 178, padding: 6,
                    borderRadius: 16, overflow: "hidden",
                    background: dk ? "#1c2128" : "#fff",
                    border: dk ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
                    boxShadow: "0 18px 44px rgba(11,20,66,0.22)",
                  }}>
                    {[
                      // Warna disamakan dengan menu lampiran web manajemen:
                      // Foto & Video = emerald, Dokumen = violet
                      { ikon: ImageIcon, teks: "Foto & Video", warna: "#059669", bg: "#ecfdf5", tref: gambarRef },
                      { ikon: FileText, teks: "Dokumen", warna: "#7c3aed", bg: "#f5f3ff", tref: fileRef },
                    ].map(({ ikon: Ikon, teks, warna, bg, tref }) => (
                      <button key={teks} type="button"
                        onClick={() => { setMenuLampiran(false); tref.current?.click(); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "8px 10px", borderRadius: 12, border: "none", background: "transparent",
                          cursor: "pointer", fontSize: 12, fontWeight: 700,
                          color: dk ? "#e2e8f0" : "#334155", textAlign: "left",
                        }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                          background: dk ? `${warna}22` : bg, color: warna,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Ikon style={{ width: 14, height: 14 }} />
                        </span>
                        {teks}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <input ref={gambarRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" style={{ display: "none" }}
                onChange={e => { pilihBerkas(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: "none" }}
                onChange={e => { pilihBerkas(e.target.files?.[0]); e.target.value = ""; }} />
            </div>

            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={e => { const p = e.currentTarget.parentNode; p.style.borderColor = "#004F9F"; p.style.boxShadow = "0 0 0 3px rgba(0,79,159,0.1)"; }}
              onBlur={e => { const p = e.currentTarget.parentNode; p.style.borderColor = dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"; p.style.boxShadow = "none"; }}
              placeholder={lampiranTertunda ? "Tambahkan keterangan..." : "Tulis pertanyaan Anda..."}
              rows={1}
              style={{
                flex: 1, resize: "none", background: "transparent",
                outline: "none", fontSize: 13, lineHeight: 1.6, padding: "8px 4px",
                color: dk ? "#f1f5f9" : "#0f172a",
                maxHeight: 80, overflowY: "auto", scrollbarWidth: "none",
                letterSpacing: "0.01em",
              }}
            />
            {(() => {
              // Tombol aktif bila ada teks ATAU ada lampiran menunggu.
              // Saat kosong: latar transparan (tanpa kotak abu-abu), ikon pudar.
              const siap = (inputText.trim() || lampiranTertunda) && !sending && !mengunggah;
              return (
                <button onClick={() => handleSend()} disabled={!siap}
                  title="Kirim (Enter)"
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 11,
                    background: siap ? "linear-gradient(to bottom right, #0B1442, #004F9F)" : "transparent",
                    border: "none", cursor: siap ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: siap ? "#fff" : (dk ? "#475569" : "#cbd5e1"),
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    boxShadow: siap ? "0 4px 14px rgba(11,20,66,0.28)" : "none",
                  }}
                  onMouseEnter={e => { if (siap) e.currentTarget.style.transform = "scale(1.08) translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {sending || mengunggah
                    ? <Loader2 style={{ width: 19, height: 19, animation: "spin 1s linear infinite" }} />
                    : <SendHorizontal style={{ width: 19, height: 19 }} />
                  }
                </button>
              );
            })()}
          </div>
          <p style={{ fontSize: 10, textAlign: "center", marginTop: 7, color: dk ? "#2d3748" : "#cbd5e1", letterSpacing: "0.02em" }}>
            Enter untuk kirim &middot; Shift+Enter baris baru
          </p>
        </div>
      </div>

      {/* MODAL PRATINJAU LAMPIRAN — sama seperti web manajemen */}
      {lampiranDibuka && (
        <PratinjauLampiran pesan={lampiranDibuka} onTutup={() => setLampiranDibuka(null)} />
      )}

      <style>{`
        .cw-hdr-btn { transition: background .2s ease, color .2s ease, transform .2s ease; }
        .cw-hdr-btn:hover { background: rgba(255,255,255,0.16) !important; color: #fff !important; }
        .cw-hdr-btn:active { transform: scale(0.9); }
        .cw-ikon-tutup { transition: transform .25s cubic-bezier(0.34,1.56,0.64,1); }
        .cw-hdr-btn:hover .cw-ikon-tutup { transform: rotate(90deg); }
        .cw-ikon-zoom { transition: transform .25s cubic-bezier(0.34,1.56,0.64,1); }
        .cw-hdr-btn:hover .cw-ikon-zoom { transform: scale(1.22); }
        .cw-batal-lampiran { transition: background .18s ease, color .18s ease, transform .18s ease; }
        .cw-batal-lampiran:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .cw-batal-lampiran:active { transform: scale(0.88); }
        @keyframes cwPing { 75%, 100% { transform: scale(2); opacity: 0; } }
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