import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  MessagesSquare, Inbox, Search, X, SendHorizontal, Loader2, CheckCheck, ChevronDown, Pin, PinOff, MailOpen,
  AlertTriangle, Mail, CheckCircle2, Clock, Archive, Sparkles, ChevronRight, ChevronLeft,
  MoreVertical, CheckSquare, Trash2, Copy, CornerUpLeft, Paperclip, Image as ImageIcon,
  FileText, Building2, UploadCloud, Camera, Video,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Code, Zap,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getChatSessions, getSessionMessages, replySession,
  sematkanSesi, tandaiBelumDibaca, hapusPesan, kirimLampiran,
  getPertanyaanFaq, updatePertanyaanFaq, balasPertanyaanFaq,
  getFaqList, createFaq,
} from "../../services/chatService";
import FaqModal from "../../components/manajemen/admin/faq/FaqModal";
import { getFileUrl } from "../../utils/fileUrl";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { confirmDialog, toastError, toastSuccess } from "../../utils/swal";
import MessageBubble from "../../components/manajemen/admin/chat/MessageBubble";
import PratinjauLampiran from "../../components/manajemen/admin/chat/PratinjauLampiran";
import { TeksKayaInline } from "../../utils/teksKaya";

/* ══════════ Pembantu ══════════ */
const samaHari = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const labelHari = (t) => {
  const d = new Date(t);
  const kini = new Date();
  const kemarin = new Date();
  kemarin.setDate(kini.getDate() - 1);
  if (samaHari(d, kini)) return "Hari ini";
  if (samaHari(d, kemarin)) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

// Format bertingkat seperti WhatsApp: hari ini tampil jam, kemarin tampil
// "Kemarin", dalam sepekan tampil nama harinya, lebih dari itu tampil tanggal.
const waktuRingkas = (t) => {
  if (!t) return "";
  const d = new Date(t);
  const kini = new Date();

  if (samaHari(d, kini)) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  const kemarin = new Date(kini);
  kemarin.setDate(kini.getDate() - 1);
  if (samaHari(d, kemarin)) return "Kemarin";

  // Selisih dihitung dari awal hari agar tidak terpengaruh jam pengiriman
  const awalHariIni = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate());
  const awalPesan = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const selisihHari = Math.round((awalHariIni - awalPesan) / 86400000);

  if (selisihHari < 7) {
    return d.toLocaleDateString("id-ID", { weekday: "long" });
  }

  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// "Terakhir dilihat" bergaya WhatsApp — makin lama makin kasar satuannya.
const terakhirDilihat = (t) => {
  if (!t) return "Offline";
  const d = new Date(t);
  const menit = Math.floor((Date.now() - d) / 60000);

  if (menit < 1) return "Terakhir dilihat baru saja";
  if (menit < 60) return `Terakhir dilihat ${menit} menit lalu`;

  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (samaHari(d, new Date())) return `Terakhir dilihat hari ini pukul ${jam}`;

  const kemarin = new Date();
  kemarin.setDate(kemarin.getDate() - 1);
  if (samaHari(d, kemarin)) return `Terakhir dilihat kemarin pukul ${jam}`;

  return `Terakhir dilihat ${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
};

// Template balasan cepat untuk admin
const TEMPLATE_BALASAN_ADMIN = [
  {
    judul: "Salam & Pembuka",
    teks: "Halo, selamat datang di layanan bantuan SIM Magang Diskominfo Ponorogo. Ada yang bisa kami bantu?",
  },
  {
    judul: "Info Jam Kerja & Presensi",
    teks: "Pelaksanaan magang mengikuti jam kerja kantor, yaitu **Senin – Jumat** pukul **07.30 – 15.30 WIB**. Mohon untuk selalu melakukan presensi masuk dan pulang tepat waktu.",
  },
  {
    judul: "Syarat Berkas Pendaftaran",
    teks: "Mohon pastikan berkas persyaratan berikut telah diunggah dengan format yang benar:\n1. Surat Pengantar Resmi Institusi\n2. Proposal Magang\n3. CV / Portofolio",
  },
  {
    judul: "Penerbitan Sertifikat",
    teks: "Sertifikat magang diterbitkan secara elektronik setelah masa magang berakhir dan laporan akhir selesai diverifikasi oleh mentor.",
  },
  {
    judul: "Penutup",
    teks: "Terima kasih telah menghubungi kami. Semoga informasi ini membantu!",
  },
];

// online: true = hijau berdenyut, false = abu, null = titik tidak ditampilkan
const Avatar = ({ nama, foto, size = "h-8 w-8 sm:h-10 sm:w-10", teks = "text-[9.5px] sm:text-[11px]", online = null, isDark = false }) => {
  const [gagal, setGagal] = useState(false);
  const url = foto ? getFileUrl(foto) : null;
  const inisial = (nama || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <span className="relative inline-flex shrink-0">
      {url && !gagal ? (
        <img
          src={url}
          alt={nama}
          onError={() => setGagal(true)}
          className={`${size} rounded-full object-cover shadow-sm ring-2 ring-white`}
        />
      ) : (
        <span className={`${size} ${teks} flex items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] font-black text-white shadow-sm`}>
          {inisial}
        </span>
      )}

      {online !== null && (
        <span
          className={`absolute bottom-[2px] right-[2px] sm:bottom-[3px] sm:right-[3px] h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-[1.5px] ${
            isDark ? "ring-[#161b22]" : "ring-white"
          } ${online ? "bg-emerald-500" : "bg-slate-300"}`}
        >
          {online && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
          )}
        </span>
      )}
    </span>
  );
};

/* ══════════ Penanda status baca ══════════
   Dua keadaan saja: terkirim (abu) dan sudah dibaca (biru). Centang tunggal
   tidak dipakai karena sistem ini tidak melacak keberadaan perangkat peserta,
   sehingga tidak ada keadaan "terkirim tapi belum sampai". */
const CentangBaca = ({ dibaca }) => (
  <CheckCheck
    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-colors duration-200 ${
      dibaca ? "text-[#00A5EC]" : "text-slate-400"
    }`}
    strokeWidth={2.4}
  />
);

/* ══════════ Menu konteks percakapan ══════════ */
const MenuKonteks = ({ posisi, isDark, items, onTutup }) => {
  const ref = useRef(null);

  useEffect(() => {
    const klikLuar = (e) => {
      if (!ref.current?.contains(e.target)) onTutup();
    };
    const esc = (e) => e.key === "Escape" && onTutup();
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("touchstart", klikLuar);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", onTutup, true);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("touchstart", klikLuar);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", onTutup, true);
    };
  }, [onTutup]);

  // Menu digeser masuk bila terlalu dekat tepi layar
  const lebar = 210;
  const kiri = Math.max(12, Math.min(posisi?.x || 12, window.innerWidth - lebar - 12));
  const atas = Math.max(12, Math.min(posisi?.y || 12, window.innerHeight - items.length * 42 - 24));

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: atas, left: kiri, width: lebar, zIndex: 2147483647 }}
      className={`overflow-hidden rounded-2xl border p-1.5 shadow-2xl animate-[popIn_0.15s_ease-out_both] ${
        isDark ? "border-white/10 bg-[#1c2128]" : "border-slate-200 bg-white"
      }`}
    >
      {items.map((it, i) =>
        it.pemisah ? (
          <div key={`sep-${i}`} className={`my-1 border-t ${isDark ? "border-white/10" : "border-slate-100"}`} />
        ) : (
          <button
            key={it.label}
            onClick={() => { it.onClick(); onTutup(); }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-bold transition-colors duration-150 ${
              it.bahaya
                ? "text-rose-500 hover:bg-rose-500/10"
                : isDark
                ? "text-slate-200 hover:bg-white/5"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <it.icon className="h-3.5 w-3.5 shrink-0" />
            {it.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
};

/* ══════════ Kartu Sesi Percakapan (dengan Touch Long-Press) ══════════ */
const SesiItemCard = ({
  s, i, isDark, aktif, belum, dariAdmin,
  onPilih, onMenu,
}) => {
  const timerRef = useRef(null);
  const sentuhTahanRef = useRef(false);
  const posAwalRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    sentuhTahanRef.current = false;
    const t = e.touches ? e.touches[0] : e;
    posAwalRef.current = { x: t.clientX, y: t.clientY };
    timerRef.current = setTimeout(() => {
      sentuhTahanRef.current = true;
      navigator?.vibrate?.(40);
      onMenu(s, t.clientX, t.clientY);
    }, 450);
  };

  const handleTouchMove = (e) => {
    if (!timerRef.current) return;
    const t = e.touches ? e.touches[0] : e;
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

  const handleClick = (e) => {
    if (sentuhTahanRef.current) {
      e.preventDefault();
      e.stopPropagation();
      sentuhTahanRef.current = false;
      return;
    }
    onPilih(s);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMenu(s, e.clientX, e.clientY);
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ animationDelay: `${i * 35}ms` }}
      className={`group relative mb-1 flex w-full select-none cursor-pointer items-start gap-2.5 sm:gap-3 rounded-lg sm:rounded-xl border p-2 sm:p-2.5 text-left transition-all duration-200 animate-[fadeslide_0.35s_ease-out_both] hover:shadow-sm ${
        aktif
          ? isDark
            ? "border-[#00A5EC]/40 bg-white/10 shadow-sm"
            : "border-[#004F9F]/40 bg-gradient-to-r from-blue-50 to-white shadow-sm"
          : belum
          ? isDark ? "border-[#00A5EC]/25 bg-[#00A5EC]/[0.07]" : "border-sky-100 bg-sky-50/60"
          : isDark ? "border-transparent hover:border-white/10 hover:bg-white/5" : "border-transparent hover:border-slate-200 hover:bg-white"
      }`}
    >
      <span className="relative shrink-0">
        <Avatar
          key={s.user_foto || s.id}
          nama={s.user_nama}
          foto={s.user_foto}
          online={s.user_online}
          isDark={isDark}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-1.5 sm:gap-2">
          <span className={`truncate text-[11.5px] sm:text-[12.5px] font-bold ${
            aktif
              ? isDark ? "text-white" : "text-[#0B1442]"
              : isDark ? "text-slate-100" : "text-[#0B1442]"
          }`}>
            {s.user_nama}
          </span>
          <span className={`shrink-0 text-[8.5px] sm:text-[9.5px] font-bold ${
            belum ? "text-[#00A5EC]" : "text-slate-400"
          }`}>
            {waktuRingkas(s.last_message_at)}
          </span>
        </span>

        <span className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5">
          {dariAdmin && <CentangBaca dibaca={s.last_dibaca} />}
          <span className={`flex min-w-0 flex-1 items-center gap-1 truncate text-[10px] sm:text-[11px] ${
            aktif
              ? isDark ? "text-slate-200 font-medium" : "text-slate-700 font-medium"
              : belum && !dariAdmin
              ? `font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`
              : isDark ? "font-medium text-slate-400" : "font-medium text-slate-500"
          }`}>
            {s.last_tipe === "gambar" && (
              <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" strokeWidth={2.4} />
            )}
            {s.last_tipe === "video" && (
              <Video className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" strokeWidth={2.4} />
            )}
            {s.last_tipe === "berkas" && (
              <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" strokeWidth={2.4} />
            )}
            <span className="truncate min-w-0">
              <TeksKayaInline teks={s.last_message} />
            </span>
          </span>

          {/* Ikon sematan & lencana angka */}
          <span className="flex shrink-0 items-center gap-1 transition-opacity duration-200 group-hover:opacity-0">
            {s.is_pinned_admin && (
              <Pin className="h-2.5 w-2.5 sm:h-3 sm:w-3 rotate-45 text-slate-400" fill="currentColor" />
            )}
            {s.unread_admin_count > 0 ? (
              <span className="flex h-3.5 min-w-[14px] sm:h-[17px] sm:min-w-[17px] items-center justify-center rounded-full bg-[#00A5EC] px-1 sm:px-1.5 text-[8px] sm:text-[9px] font-black text-white shadow-sm">
                {s.unread_admin_count > 99 ? "99+" : s.unread_admin_count}
              </span>
            ) : s.ditandai_belum_dibaca ? (
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#00A5EC] shadow-sm" />
            ) : null}
          </span>
        </span>

        {s.perlu_jawaban && (
          <span className="mt-1 sm:mt-1.5 flex w-fit items-center gap-0.5 sm:gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-amber-600">
            <AlertTriangle className="h-2.5 w-2.5" />
            Bot gagal menjawab
          </span>
        )}
      </span>

      {/* Panah menu (Hanya Desktop) */}
      <button
        onClick={handleContextMenu}
        title="Menu percakapan"
        className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 hidden lg:flex h-5 w-5 sm:h-6 sm:w-6 cursor-pointer items-center justify-center rounded-md opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 ${
          isDark ? "bg-[#1c2128] text-slate-400 hover:text-slate-100" : "bg-white text-slate-400 hover:text-slate-700"
        }`}
      >
        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
};

const GAYA_STATUS = {
  baru: { label: "Baru", cls: "bg-rose-50 text-rose-600", icon: Sparkles },
  diproses: { label: "Diproses", cls: "bg-amber-50 text-amber-600", icon: Clock },
  selesai: { label: "Selesai", cls: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  diabaikan: { label: "Diabaikan", cls: "bg-slate-100 text-slate-500", icon: Archive },
};

/* ══════════ Halaman ══════════ */
const BantuanPage = () => {
  const { isDark } = useManajemenTheme();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "pertanyaan" ? "pertanyaan" : "chat";

  /* ── Data percakapan ──
     null berarti "belum selesai dimuat". Dengan begitu keadaan memuat tidak
     perlu state tersendiri yang harus di-set dari dalam efek. */
  const [sessions, setSessions] = useState(null);
  // Menyimpan id saja tidak cukup karena beberapa aksi memerlukan objeknya
  // seketika. Objek dipakai sebagai cadangan, tetapi nilai yang dirender
  // selalu diambil ulang dari daftar sesi terbaru hasil polling — supaya
  // status online/offline ikut berubah tanpa perlu reload.
  const [sesiDipilih, setSesiAktif] = useState(null);
  const [menuSesi, setMenuSesi] = useState(null); // { sesi, x, y }
  const [messages, setMessages] = useState(null);
  const [balasan, setBalasan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [cariChat, setCariChat] = useState("");
  const [saringChat, setSaringChat] = useState("semua");
  const [segarkanSesi, setSegarkanSesi] = useState(0);
  const [cariPesan, setCariPesan] = useState("");
  const [tampilCariPesan, setTampilCariPesan] = useState(false);
  const [modePilih, setModePilih] = useState(false);
  const [pesanTerpilih, setPesanTerpilih] = useState([]);
  const [balasKe, setBalasKe] = useState(null);
  const [menuPesan, setMenuPesan] = useState(null);
  const [menuHeader, setMenuHeader] = useState(null);
  const [disorot, setDisorot] = useState(null);
  const [seret, setSeret] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);
  const [menuLampiran, setMenuLampiran] = useState(false);
  const [menuTemplate, setMenuTemplate] = useState(false);
  const [lampiranDibuka, setLampiranDibuka] = useState(null);
  // Berkas ditahan di sini dulu agar admin bisa menambahkan keterangan
  // sebelum benar-benar mengirim.
  const [lampiranTertunda, setLampiranTertunda] = useState(null);
  const fileRef = useRef(null);
  const gambarRef = useRef(null);
  const akhirPesanRef = useRef(null);
  const inputRef = useRef(null);
  const wadahPesanRef = useRef(null);
  const idPesanTerakhirRef = useRef(null);

  /* ── Data pertanyaan publik ── */
  const [pertanyaan, setPertanyaan] = useState(null);
  const [tanyaAktif, setTanyaAktif] = useState(null);
  const [jawaban, setJawaban] = useState("");
  const [mengirimEmail, setMengirimEmail] = useState(false);
  const [cariTanya, setCariTanya] = useState("");
  const [saringStatus, setSaringStatus] = useState("semua");
  const [segarkanTanya, setSegarkanTanya] = useState(0);

  /* ── Modal "Jadikan FAQ" — memakai ulang FaqModal dari halaman FAQ ── */
  const [showModalFaq, setShowModalFaq] = useState(false);
  const [loadingSimpanFaq, setLoadingSimpanFaq] = useState(false);
  const [sisaQuickAction, setSisaQuickAction] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("Umum");
  const [quickLabel, setQuickLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showOnLanding, setShowOnLanding] = useState(true);
  const [isQuickAction, setIsQuickAction] = useState(false);

  const memuatSesi = sessions === null;
  const memuatTanya = pertanyaan === null;
  const memuatPesan = messages === null;

  /* ── Sesi aktif yang selalu segar ──
     `sesiDipilih` hanyalah salinan beku saat admin mengklik. Nilai yang
     dirender diambil ulang dari `sessions` hasil polling, supaya status
     online/offline ikut berubah tanpa perlu memuat ulang halaman.
     Wajib dideklarasikan SEBELUM efek yang memakainya. */
  const sesiAktif = sesiDipilih
    ? (sessions || []).find((s) => s.id === sesiDipilih.id) || sesiDipilih
    : null;

  /* ── Ambil sesi (berkala) ──
     Fungsi async didefinisikan di dalam efek supaya setState terjadi pada
     callback setelah await, bukan langsung di badan efek. */
  useEffect(() => {
    let batal = false;
    const ambil = async () => {
      try {
        const res = await getChatSessions();
        if (!batal) setSessions((res.data.data || []).filter((s) => Boolean(s.last_message)));
      } catch {
        if (!batal) setSessions((l) => l || []);
      }
    };
    ambil();
    const t = setInterval(ambil, 6000);
    return () => { batal = true; clearInterval(t); };
  }, [segarkanSesi]);

  /* ── Ambil pertanyaan publik ── */
  useEffect(() => {
    let batal = false;
    const ambil = async () => {
      try {
        const res = await getPertanyaanFaq();
        if (!batal) setPertanyaan(res.data.data || []);
      } catch {
        if (!batal) setPertanyaan((l) => l || []);
      }
    };
    ambil();
    return () => { batal = true; };
  }, [segarkanTanya]);

  /* ── Polling pesan sesi terpilih ── */
  useEffect(() => {
    if (!sesiAktif) return;
    let batal = false;

    const ambil = async () => {
      try {
        const res = await getSessionMessages(sesiAktif.id);
        if (batal) return;
        const baru = res.data.data || [];

        // State hanya diganti bila isinya benar-benar berubah. Tanpa ini,
        // setiap putaran polling menghasilkan array baru yang memicu render
        // ulang dan menyeret gulir kembali ke bawah.
        setMessages((lama) => {
          if (!lama || lama.length !== baru.length) return baru;
          const berubah = baru.some((m, i) =>
            m.id !== lama[i].id ||
            m.is_read_user !== lama[i].is_read_user ||
            m.dihapus_pada !== lama[i].dihapus_pada
          );
          return berubah ? baru : lama;
        });
      } catch {
        if (!batal) setMessages((l) => l || []);
      }
    };

    ambil();
    const t = setInterval(ambil, 3000);
    return () => { batal = true; clearInterval(t); };
    // Hanya id yang jadi pemicu; perubahan status online tidak perlu
    // memulai ulang polling pesan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesiAktif?.id]);

  /* ── Gulir otomatis hanya bila layak ──
     Digulir ke bawah saat percakapan pertama dibuka, dan saat ada pesan baru
     sementara admin memang sedang berada di dekat dasar. Bila admin sedang
     membaca pesan lama di atas, posisinya dibiarkan. */
  useLayoutEffect(() => {
    if (!messages || messages.length === 0) return;

    const wadah = wadahPesanRef.current;
    if (!wadah) return;
    const idTerakhir = messages[messages.length - 1]?.id;
    const pertamaKali = idPesanTerakhirRef.current === null;
    const adaPesanBaru = idPesanTerakhirRef.current !== idTerakhir;

    idPesanTerakhirRef.current = idTerakhir;
    if (!adaPesanBaru) return;

    if (pertamaKali) {
      wadah.scrollTop = wadah.scrollHeight;
    } else {
      const dekatDasar = wadah.scrollHeight - wadah.scrollTop - wadah.clientHeight < 150;
      if (dekatDasar) {
        akhirPesanRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Otomatis menyesuaikan tinggi kolom input textarea sesuai panjang ketikan teks (auto-grow)
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const tinggiBaru = Math.min(el.scrollHeight, 220);
    el.style.height = `${Math.max(tinggiBaru, 36)}px`;
  }, [balasan]);

  /* ── Buka sesi dari tautan notifikasi ──
     Dihitung saat render, bukan di dalam efek, mengikuti pola resmi React
     "Adjusting state when a prop changes". Hanya dijalankan sekali. */
  const idChatURL = params.get("chat");
  const [urlDiproses, setUrlDiproses] = useState(false);
  if (!urlDiproses && idChatURL && sessions !== null) {
    setUrlDiproses(true);
    const target = sessions.find((s) => String(s.id) === idChatURL);
    if (target) {
      setParams({}, { replace: true });
      setSesiAktif(target);
      setMessages(null);
    }
  }

  // Menyesuaikan tinggi kontainer chat di mobile saat papan ketik (virtual keyboard) muncul
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const handleViewport = () => {
      if (window.innerWidth < 1024 && (sesiAktif || tanyaAktif)) {
        const vpHeight = window.visualViewport.height;
        document.documentElement.style.setProperty("--chat-vp-h", `${vpHeight}px`);
      } else {
        document.documentElement.style.removeProperty("--chat-vp-h");
      }
    };
    window.visualViewport.addEventListener("resize", handleViewport);
    window.visualViewport.addEventListener("scroll", handleViewport);
    handleViewport();
    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewport);
      window.visualViewport?.removeEventListener("scroll", handleViewport);
      document.documentElement.style.removeProperty("--chat-vp-h");
    };
  }, [sesiAktif, tanyaAktif]);

  /* ── Penyaringan ── */
  const daftarSesi = useMemo(() => {
    const k = cariChat.trim().toLowerCase();
    if (!sessions) return [];
    let hasil = sessions;
    if (saringChat === "belum") {
      hasil = hasil.filter((s) => s.unread_admin_count > 0 || s.ditandai_belum_dibaca);
    }
    if (!k) return hasil;
    return hasil.filter((s) =>
      (s.user_nama || "").toLowerCase().includes(k) ||
      (s.user_email || "").toLowerCase().includes(k) ||
      (s.last_message || "").toLowerCase().includes(k)
    );
  }, [sessions, cariChat, saringChat]);

  const pesanTampil = useMemo(() => {
    const k = cariPesan.trim().toLowerCase();
    if (!k) return messages || [];
    return (messages || []).filter((m) =>
      (m.content || "").toLowerCase().includes(k) ||
      (m.file_nama || "").toLowerCase().includes(k)
    );
  }, [messages, cariPesan]);

  const daftarTanya = useMemo(() => {
    const k = cariTanya.trim().toLowerCase();
    return (pertanyaan || []).filter((p) => {
      if (saringStatus !== "semua" && p.status !== saringStatus) return false;
      if (!k) return true;
      return (
        (p.nama || "").toLowerCase().includes(k) ||
        (p.email || "").toLowerCase().includes(k) ||
        (p.pertanyaan || "").toLowerCase().includes(k)
      );
    });
  }, [pertanyaan, cariTanya, saringStatus]);

  const jumlahChatBaru = (sessions || []).filter((s) => s.unread_admin_count > 0).length;
  const jumlahTanyaBaru = (pertanyaan || []).filter((p) => p.status === "baru").length;

  /* ── Aksi percakapan ── */
  const pilihSesi = (s) => {
    setSesiAktif(s);
    setMessages(null);
    // Dinolkan agar percakapan baru selalu terbuka di posisi paling bawah
    idPesanTerakhirRef.current = null;
    setBalasan("");
    setSessions((l) => (l || []).map((x) => (x.id === s.id ? { ...x, unread_admin_count: 0 } : x)));
    // Hindari auto-focus pada mobile agar papan ketik (keyboard) tidak otomatis menutupi layar
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
    setBalasKe(null);
    setCariPesan("");
    setTampilCariPesan(false);
    keluarModePilih();
  };

  const toggleSematkan = async (s) => {
    try {
      await sematkanSesi(s.id);
      setSegarkanSesi((n) => n + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyematkan");
    }
  };

  const tandaiBelum = async (s) => {
    try {
      await tandaiBelumDibaca(s.id);
      if (sesiAktif?.id === s.id) setSesiAktif(null);
      setSegarkanSesi((n) => n + 1);
      toastSuccess("Ditandai belum dibaca");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menandai");
    }
  };

  const kirimBalasan = async (e) => {
    e?.preventDefault();
    // Bila ada lampiran menunggu, teks ikut terkirim bersamanya
    if (lampiranTertunda) return kirimLampiranTertunda();
    if (!balasan.trim() || mengirim || !sesiAktif) return;
    setMengirim(true);
    try {
      const res = await replySession(sesiAktif.id, balasan, balasKe?.id || null);
      setMessages((p) => [...(p || []), res.data.data]);
      setBalasan("");
      setBalasKe(null);
      setSegarkanSesi((n) => n + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim balasan");
    } finally {
      setMengirim(false);
      inputRef.current?.focus();
    }
  };

  /* ── Sisipkan Format Teks Kaya & List ── */
  const sisipkanFormat = (simbolAwal, simbolAkhir = simbolAwal, teksDefault = "teks") => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart ?? balasan.length;
    const end = el.selectionEnd ?? balasan.length;
    const teksLama = balasan;
    const teksTerpilih = teksLama.substring(start, end);

    const teksBaru = teksTerpilih
      ? teksLama.substring(0, start) + simbolAwal + teksTerpilih + simbolAkhir + teksLama.substring(end)
      : teksLama.substring(0, start) + simbolAwal + teksDefault + simbolAkhir + teksLama.substring(end);

    const kursorAwal = teksTerpilih ? start : start + simbolAwal.length;
    const kursorAkhir = teksTerpilih
      ? start + simbolAwal.length + teksTerpilih.length + simbolAkhir.length
      : kursorAwal + teksDefault.length;

    setBalasan(teksBaru);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(kursorAwal, kursorAkhir);
    }, 10);
  };

  const sisipkanList = (tipe = "bullet") => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart ?? balasan.length;
    const end = el.selectionEnd ?? balasan.length;
    const teksLama = balasan;
    const teksTerpilih = teksLama.substring(start, end);

    let teksBaru;
    let kursorPos;

    if (teksTerpilih) {
      const baris = teksTerpilih.split("\n");
      const barisBaru = baris
        .map((b, idx) => (tipe === "numbered" ? `${idx + 1}. ${b}` : `- ${b}`))
        .join("\n");
      teksBaru = teksLama.substring(0, start) + barisBaru + teksLama.substring(end);
      kursorPos = start + barisBaru.length;
    } else {
      const prefix = tipe === "numbered" ? "\n1. Poin 1\n2. Poin 2" : "\n- Poin 1\n- Poin 2";
      const sisipan = start === 0 && !teksLama ? prefix.trimStart() : prefix;
      teksBaru = teksLama.substring(0, start) + sisipan + teksLama.substring(end);
      kursorPos = start + sisipan.length;
    }

    setBalasan(teksBaru);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(kursorPos, kursorPos);
    }, 10);
  };

  /* ── Aksi pesan ── */
  const loncatKePesan = (id) => {
    const el = document.getElementById(`pesan-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setDisorot(id);
    setTimeout(() => setDisorot(null), 1600);
  };

  const salinPesan = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content || m.file_nama || "");
      toastSuccess("Disalin ke papan klip");
    } catch {
      toastError("Gagal menyalin");
    }
  };

  const hapusSatuPesan = async (m) => {
    // Pesan berlampiran perlu konfirmasi karena berkas fisiknya ikut dibuang
    // dari server dan tidak bisa dipulihkan.
    if (m.file_path) {
      const hasil = await confirmDialog({
        title: "Hapus pesan beserta berkasnya?",
        text: "Berkas yang dilampirkan akan dihapus permanen dari server dan tidak dapat dipulihkan.",
        confirmText: "Ya, Hapus",
        icon: "warning",
        danger: true,
      });
      if (!hasil.isConfirmed) return;
    }

    try {
      await hapusPesan(m.id);
      setMessages((p) => (p || []).map((x) =>
        x.id === m.id ? { ...x, dihapus_pada: new Date().toISOString(), content: "", file_path: "" } : x
      ));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus pesan");
    }
  };

  const hapusTerpilih = async () => {
    const adaLampiran = (messages || []).some(
      (m) => pesanTerpilih.includes(m.id) && m.file_path
    );

    const hasil = await confirmDialog({
      title: `Hapus ${pesanTerpilih.length} pesan?`,
      text: adaLampiran
        ? "Sebagian pesan berisi lampiran. Berkasnya akan dihapus permanen dari server."
        : "Pesan akan ditandai terhapus dan tidak bisa dibaca lagi oleh peserta.",
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });
    if (!hasil.isConfirmed) return;

    try {
      await Promise.all(pesanTerpilih.map((id) => hapusPesan(id)));
      setMessages((p) => (p || []).map((x) =>
        pesanTerpilih.includes(x.id)
          ? { ...x, dihapus_pada: new Date().toISOString(), content: "", file_path: "" }
          : x
      ));
      toastSuccess(`${pesanTerpilih.length} pesan dihapus`);
      keluarModePilih();
    } catch {
      toastError("Sebagian pesan gagal dihapus");
    }
  };

  const keluarModePilih = () => {
    setModePilih(false);
    setPesanTerpilih([]);
  };

  const togglePilih = (id) =>
    setPesanTerpilih((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* ── Lampiran: pilih dulu, kirim belakangan ── */
  const pilihBerkas = (file) => {
    if (!file || !sesiAktif) return;
    const isVideo = file.type.startsWith("video/");
    const batas = isVideo ? 20 : 5;
    if (file.size > batas * 1024 * 1024) {
      toastError(`Ukuran ${isVideo ? "video" : "berkas"} maksimal ${batas}MB`);
      return;
    }
    const isGambar = file.type.startsWith("image/");
    setLampiranTertunda({
      file,
      isGambar,
      isVideo,
      pratinjau: isGambar || isVideo ? URL.createObjectURL(file) : null,
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const batalkanLampiran = () => {
    if (lampiranTertunda?.pratinjau) URL.revokeObjectURL(lampiranTertunda.pratinjau);
    setLampiranTertunda(null);
  };

  const kirimLampiranTertunda = async () => {
    if (!lampiranTertunda || mengunggah || !sesiAktif) return;
    setMengunggah(true);
    try {
      const fd = new FormData();
      fd.append("file", lampiranTertunda.file);
      if (balasan.trim()) fd.append("content", balasan.trim());
      if (balasKe) fd.append("reply_to_id", balasKe.id);

      const res = await kirimLampiran(sesiAktif.id, fd);
      setMessages((p) => [...(p || []), res.data.data]);
      setBalasan("");
      setBalasKe(null);
      batalkanLampiran();
      setSegarkanSesi((n) => n + 1);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim lampiran");
    } finally {
      setMengunggah(false);
    }
  };

  /* ── Aksi pertanyaan publik ── */
  const pilihTanya = (p) => {
    setTanyaAktif(p);
    setJawaban(p.catatan_admin || "");
  };

  const kirimEmail = async () => {
    if (jawaban.trim().length < 10 || mengirimEmail || !tanyaAktif) return;
    setMengirimEmail(true);
    try {
      const res = await balasPertanyaanFaq(tanyaAktif.id, jawaban);
      toastSuccess(res.data.message || "Balasan terkirim");
      setSegarkanTanya((n) => n + 1);
      setTanyaAktif((p) => (p ? { ...p, status: "selesai", catatan_admin: jawaban } : p));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengirim email");
    } finally {
      setMengirimEmail(false);
    }
  };

  const ubahStatus = async (status) => {
    if (!tanyaAktif) return;
    try {
      await updatePertanyaanFaq(tanyaAktif.id, { status });
      setSegarkanTanya((n) => n + 1);
      setTanyaAktif((p) => (p ? { ...p, status } : p));
      toastSuccess("Status diperbarui");
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui status");
    }
  };

  /* ── Jadikan FAQ ── */
  const bukaModalFaq = async () => {
    if (!tanyaAktif) return;
    setQuestion(tanyaAktif.pertanyaan.slice(0, 300));
    // Jawaban email yang sudah ditulis dipakai sebagai titik awal, karena
    // biasanya isinya memang jawaban yang layak dijadikan FAQ.
    setAnswer(jawaban.trim());
    setKeywords("");
    setCategory("Umum");
    setQuickLabel("");
    setIsActive(true);
    setShowOnLanding(true);
    setIsQuickAction(false);

    try {
      const res = await getFaqList();
      const terpakai = res.data.quick_action_aktif ?? 0;
      const maks = res.data.quick_action_maks ?? 6;
      setSisaQuickAction(Math.max(0, maks - terpakai));
    } catch {
      setSisaQuickAction(0);
    }

    setShowModalFaq(true);
  };

  const simpanFaqBaru = async (e) => {
    e.preventDefault();
    setLoadingSimpanFaq(true);
    try {
      const res = await createFaq({
        question, answer, keywords, category,
        quick_label: quickLabel,
        is_active: isActive,
        show_on_landing: showOnLanding,
        is_quick_action: isQuickAction,
      });

      // Tandai pertanyaan asal sebagai selesai & tautkan ke FAQ barunya
      await updatePertanyaanFaq(tanyaAktif.id, {
        status: "selesai",
        faq_terkait_id: res.data?.data?.id,
      });

      toastSuccess("FAQ baru dibuat dari pertanyaan ini");
      setShowModalFaq(false);
      setSegarkanTanya((n) => n + 1);
      setTanyaAktif((p) => (p ? { ...p, status: "selesai" } : p));
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membuat FAQ");
    } finally {
      setLoadingSimpanFaq(false);
    }
  };

  const gantiTab = (t) => {
    setParams(t === "pertanyaan" ? { tab: "pertanyaan" } : {}, { replace: true });
    setSesiAktif(null);
    setTanyaAktif(null);
  };

  const kartu = isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white";
  const kolom = isDark ? "bg-[#0d1117]" : "bg-slate-50";
  const adaAktif = tab === "chat" ? Boolean(sesiAktif) : Boolean(tanyaAktif);

  return (
    <AdminLayout>
      <div className={`${adaAktif ? "space-y-0" : "space-y-3"} sm:space-y-5 animate-[fadeslide_0.35s_ease-out]`}>
        {/* ── Judul & Tab dalam satu baris (disembunyikan di mobile saat membuka percakapan agar ruang chat maksimal & keyboard tidak menutupi input) ── */}
        <div className={`${adaAktif ? "hidden lg:flex" : "flex"} flex-wrap items-end justify-between gap-2.5 sm:gap-4`}>
          <div className="min-w-0">
            <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
              Chat &amp; Pertanyaan
            </h2>
            <p className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="inline sm:hidden">
                Balas percakapan dan pertanyaan publik.
              </span>
              <span className="hidden sm:inline">
                Balas percakapan peserta dan pertanyaan dari situs publik.
              </span>
            </p>
          </div>

          <div className={`inline-flex shrink-0 items-center gap-1 rounded-xl sm:rounded-2xl border p-1 sm:p-1.5 shadow-sm ${kartu}`}>
            {[
              { key: "chat", label: "Percakapan", icon: MessagesSquare, badge: jumlahChatBaru },
              { key: "pertanyaan", label: "Pertanyaan Publik", icon: Inbox, badge: jumlahTanyaBaru },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => gantiTab(t.key)}
                className={`flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-[12.5px] font-bold transition-all duration-200 active:scale-95 ${
                  tab === t.key
                    ? "bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md"
                    : isDark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t.label}
                {t.badge > 0 && (
                  <span className={`flex h-4 min-w-[16px] sm:h-[18px] sm:min-w-[18px] items-center justify-center rounded-full px-1 sm:px-1.5 text-[8.5px] sm:text-[9.5px] font-black tabular-nums ${
                    tab === t.key ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  }`}>
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Isi ── */}
        <div
          className={`grid min-h-0 grid-cols-1 overflow-hidden rounded-xl sm:rounded-2xl border shadow-sm lg:grid-rows-1 lg:grid-cols-[340px_1fr] ${
            adaAktif
              ? "h-[calc(var(--chat-vp-h,100dvh)-6.5rem)] sm:h-[calc(100vh-12.5rem)] sm:min-h-[520px]"
              : "h-[calc(100dvh-14rem)] min-h-[380px] sm:h-[calc(100vh-12.5rem)] sm:min-h-[520px]"
          } ${kartu}`}
        >
          {/* ═══ KOLOM KIRI (Daftar Percakapan / Pertanyaan) ═══ */}
          <div className={`${adaAktif ? "hidden lg:flex" : "flex animate-[fadeslide_0.2s_ease-out] lg:animate-none"} min-h-0 flex-col border-b lg:border-b-0 lg:border-r ${isDark ? "border-white/10" : "border-slate-200/80"}`}>
            <div className={`shrink-0 space-y-1.5 sm:space-y-2 border-b p-2.5 sm:p-3 ${isDark ? "border-white/10" : "border-slate-200/80"}`}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={tab === "chat" ? cariChat : cariTanya}
                  onChange={(e) => (tab === "chat" ? setCariChat(e.target.value) : setCariTanya(e.target.value))}
                  placeholder={tab === "chat" ? "Cari peserta atau pesan..." : "Cari nama atau pertanyaan..."}
                  className={`w-full rounded-lg sm:rounded-xl border py-2 sm:py-2.5 pl-8 sm:pl-9 pr-7 sm:pr-8 text-[11px] sm:text-[12px] font-medium outline-none transition-all duration-200 ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-100 placeholder-slate-600 focus:border-[#00A5EC]/50"
                      : "border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:border-[#004F9F] focus:bg-white"
                  }`}
                />
                {(tab === "chat" ? cariChat : cariTanya) && (
                  <button
                    onClick={() => (tab === "chat" ? setCariChat("") : setCariTanya(""))}
                    className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                )}
              </div>

              {tab === "chat" && (
                <div className="flex gap-1">
                  {[
                    { key: "semua", label: "Semua" },
                    { key: "belum", label: "Belum dibaca", jumlah: jumlahChatBaru },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setSaringChat(f.key)}
                      className={`flex cursor-pointer items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9.5px] sm:text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                        saringChat === f.key
                          ? "bg-[#0B1442] text-white shadow-sm"
                          : isDark ? "bg-white/5 text-slate-400 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                      {f.jumlah > 0 && (
                        <span className={`flex h-3.5 min-w-[14px] sm:h-4 sm:min-w-4 items-center justify-center rounded-full px-1 text-[8px] sm:text-[9px] font-black tabular-nums ${
                          saringChat === f.key ? "bg-white/20 text-white" : "bg-[#00A5EC] text-white"
                        }`}>
                          {f.jumlah}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {tab === "pertanyaan" && (
                <div className="flex flex-wrap gap-1">
                  {["semua", "baru", "diproses", "selesai", "diabaikan"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSaringStatus(s)}
                      className={`cursor-pointer rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold capitalize transition-all duration-200 active:scale-95 ${
                        saringStatus === s
                          ? "bg-[#0B1442] text-white shadow-sm"
                          : isDark ? "bg-white/5 text-slate-400 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`scroll-halus flex-1 overflow-y-auto p-1.5 sm:p-2 ${kolom}`}>
              {/* Daftar percakapan */}
              {tab === "chat" && (
                memuatSesi ? (
                  <div className="space-y-1.5 p-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-2.5 sm:gap-3 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 shrink-0 animate-pulse rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                        <div className="flex-1 space-y-1.5 sm:space-y-2">
                          <div className={`h-2.5 w-1/3 animate-pulse rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                          <div className={`h-2 w-2/3 animate-pulse rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : daftarSesi.length === 0 ? (
                  <KosongKolom
                    isDark={isDark}
                    pesan={
                      cariChat ? "Tidak ada yang cocok"
                        : saringChat === "belum" ? "Semua percakapan sudah dibaca"
                        : "Belum ada percakapan"
                    }
                  />
                ) : (
                  daftarSesi.map((s, i) => (
                    <SesiItemCard
                      key={s.id}
                      s={s}
                      i={i}
                      isDark={isDark}
                      aktif={sesiAktif?.id === s.id}
                      belum={s.unread_admin_count > 0 || s.ditandai_belum_dibaca}
                      dariAdmin={s.last_sender === "admin"}
                      onPilih={pilihSesi}
                      onMenu={(sesi, x, y) => setMenuSesi({ sesi, x, y })}
                    />
                  ))
                )
              )}

              {/* Daftar pertanyaan publik */}
              {tab === "pertanyaan" && (
                memuatTanya ? (
                  <div className="flex h-full items-center justify-center gap-2 text-[10.5px] sm:text-[11.5px] font-medium text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> Memuat...
                  </div>
                ) : daftarTanya.length === 0 ? (
                  <KosongKolom isDark={isDark} pesan={cariTanya || saringStatus !== "semua" ? "Tidak ada yang cocok" : "Belum ada pertanyaan"} />
                ) : (
                  daftarTanya.map((p, i) => {
                    const g = GAYA_STATUS[p.status] || GAYA_STATUS.baru;
                    const aktif = tanyaAktif?.id === p.id;
                    const baru = p.status === "baru";

                    // Garis tepi kiri memakai warna status, jadi admin bisa
                    // memindai antrean tanpa membaca lencana satu per satu.
                    const garis = {
                      baru: "before:bg-rose-500",
                      diproses: "before:bg-amber-500",
                      selesai: "before:bg-emerald-500",
                      diabaikan: "before:bg-slate-300",
                    }[p.status] || "before:bg-rose-500";

                    return (
                      <button
                        key={p.id}
                        onClick={() => pilihTanya(p)}
                        style={{ animationDelay: `${i * 35}ms` }}
                        className={`group relative mb-1 flex w-full cursor-pointer items-start gap-2.5 sm:gap-3 overflow-hidden rounded-lg sm:rounded-xl border p-2.5 pl-3.5 sm:p-3 sm:pl-4 text-left transition-all duration-200 animate-[fadeslide_0.35s_ease-out_both] before:absolute before:inset-y-0 before:left-0 before:w-1 before:transition-all before:duration-200 hover:shadow-sm ${garis} ${
                          aktif
                            ? isDark
                              ? "border-[#00A5EC]/40 bg-white/10 shadow-sm"
                              : "border-[#004F9F]/40 bg-gradient-to-r from-blue-50 to-white shadow-sm"
                            : baru
                            ? isDark ? "border-rose-500/20 bg-rose-500/[0.06]" : "border-rose-100 bg-rose-50/40"
                            : isDark ? "border-transparent hover:border-white/10 hover:bg-white/5" : "border-transparent hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <span className="relative shrink-0 pt-0.5">
                          <Avatar nama={p.nama} size="h-7 w-7 sm:h-9 sm:w-9" teks="text-[8.5px] sm:text-[10px]" />
                          {baru && (
                            <span className="absolute bottom-[2px] right-[2px] sm:bottom-[3px] sm:right-[3px] flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                              <span className={`relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-[1.5px] ${isDark ? "ring-[#0d1117]" : "ring-white"}`} />
                            </span>
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1.5 sm:gap-2">
                            <span className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                              <span className={`truncate text-[11.5px] sm:text-[12.5px] font-bold ${
                                aktif
                                  ? isDark ? "text-white" : "text-[#0B1442]"
                                  : isDark ? "text-slate-100" : "text-[#0B1442]"
                              }`}>
                                {p.nama}
                              </span>
                              <span className={`flex shrink-0 items-center gap-0.5 sm:gap-1 rounded-md px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black ${g.cls}`}>
                                <g.icon className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                {g.label}
                              </span>
                            </span>
                            <span className={`shrink-0 text-[8.5px] sm:text-[9.5px] font-bold ${baru ? "text-rose-500" : "text-slate-400"}`}>
                              {waktuRingkas(p.created_at)}
                            </span>
                          </span>

                          <span className={`mt-0.5 flex items-center gap-1 truncate text-[8.5px] sm:text-[9.5px] font-medium ${
                            aktif
                              ? isDark ? "text-slate-300" : "text-slate-500"
                              : "text-slate-400"
                          }`}>
                            <Mail className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </span>

                          <span className={`mt-1 sm:mt-1.5 line-clamp-2 block text-[10px] sm:text-[11px] leading-snug ${
                            aktif
                              ? isDark ? "text-slate-200 font-medium" : "text-slate-700 font-medium"
                              : baru
                              ? `font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`
                              : isDark ? "font-medium text-slate-400" : "font-medium text-slate-500"
                          }`}>
                            {p.pertanyaan}
                          </span>

                          {(p.jumlah_serupa > 1 || p.faq_terkait_id) && (
                          <span className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5">
                            {p.jumlah_serupa > 1 && (
                              <span className="flex items-center gap-1 rounded-md bg-amber-50 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-amber-600">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {p.jumlah_serupa}× serupa
                              </span>
                            )}
                            {p.faq_terkait_id && (
                              <span className="flex items-center gap-1 rounded-md bg-sky-50 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-sky-600">
                                <Sparkles className="h-2.5 w-2.5" />
                                Jadi FAQ
                              </span>
                            )}
                          </span>
                          )}
                        </span>
                      </button>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ═══ KOLOM KANAN (Ruang Percakapan / Detail Pertanyaan) ═══ */}
          <div className={`${adaAktif ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col ${kolom}`}>
              {/* Percakapan */}
              {tab === "chat" && (
                !sesiAktif ? (
                  <KosongPanel isDark={isDark} icon={MessagesSquare}
                    judul="Pilih percakapan"
                    pesan="Klik salah satu peserta di sebelah kiri untuk membaca dan membalas pesannya." />
                ) : (
                  <div key={sesiAktif.id} className="flex min-h-0 flex-1 flex-col animate-[fadeIn_0.2s_ease-out]">
                    {/* ── Kepala percakapan ── */}
                    <div className={`flex shrink-0 items-center justify-between gap-2 sm:gap-3 border-b px-2.5 py-2 sm:px-4 sm:py-3 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                        {/* Tombol kembali mobile (seperti WhatsApp) */}
                        <button
                          type="button"
                          onClick={() => setSesiAktif(null)}
                          className={`flex lg:hidden h-7 w-7 sm:h-8 sm:w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                            isDark
                              ? "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                          title="Kembali ke daftar percakapan"
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        <Avatar
                          key={sesiAktif.user_foto || sesiAktif.id}
                          nama={sesiAktif.user_nama}
                          foto={sesiAktif.user_foto}
                          size="h-8 w-8 sm:h-10 sm:w-10"
                          teks="text-[9.5px] sm:text-[11px]"
                          online={sesiAktif.user_online}
                          isDark={isDark}
                        />
                        <div className="min-w-0">
                          {/* Baris 1: Nama peserta (di desktop: instansi tetap di samping nama) */}
                          <div className="flex items-center gap-1.5 sm:gap-2 truncate" title={sesiAktif.user_email}>
                            <span className={`truncate text-[11.5px] sm:text-[13px] font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                              {sesiAktif.user_nama}
                            </span>
                            {sesiAktif.user_institusi && (
                              <span className={`hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                              }`}>
                                <Building2 className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{sesiAktif.user_institusi}</span>
                              </span>
                            )}
                          </div>

                          {/* Baris 2 (Hanya Mobile): Instansi di bawah nama peserta */}
                          {sesiAktif.user_institusi && (
                            <div className="flex sm:hidden mt-0.5">
                              <span className={`inline-flex max-w-[180px] items-center gap-0.5 truncate rounded px-1.5 py-0.5 text-[8px] font-bold ${
                                isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                              }`}>
                                <Building2 className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{sesiAktif.user_institusi}</span>
                              </span>
                            </div>
                          )}

                          {/* Baris 3 (Mobile) / Baris 2 (Desktop): Terakhir dilihat / Online di bawah instansi */}
                          <p className={`mt-0.5 flex items-center gap-1 truncate text-[9px] sm:text-[10.5px] font-medium ${
                            sesiAktif.user_online ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {sesiAktif.user_online && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            )}
                            {sesiAktif.user_online ? "Online" : terakhirDilihat(sesiAktif.user_last_active)}
                          </p>
                        </div>
                      </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => { setTampilCariPesan((v) => !v); setCariPesan(""); }}
                        title="Cari dalam percakapan"
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                          tampilCariPesan
                            ? "bg-[#004F9F]/10 text-[#004F9F]"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setMenuHeader({ x: r.right - 200, y: r.bottom + 6 });
                        }}
                        title="Menu"
                        className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-90"
                      >
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>

                  {/* ── Bilah cari dalam percakapan ── */}
                  {tampilCariPesan && (
                    <div className={`flex shrink-0 items-center gap-2 border-b px-2.5 py-1.5 sm:px-3 sm:py-2 animate-[fadeslide_0.2s_ease-out] ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                      <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400" />
                      <input
                        autoFocus
                        value={cariPesan}
                        onChange={(e) => setCariPesan(e.target.value)}
                        placeholder="Cari dalam percakapan..."
                        className={`flex-1 bg-transparent text-[11px] sm:text-[12px] font-medium outline-none ${isDark ? "text-slate-100 placeholder-slate-600" : "text-slate-700 placeholder-slate-400"}`}
                      />
                      <span className="shrink-0 text-[9px] sm:text-[10px] font-bold text-slate-400">
                        {cariPesan ? `${pesanTampil.length} hasil` : ""}
                      </span>
                      <button onClick={() => { setTampilCariPesan(false); setCariPesan(""); }}
                        className="cursor-pointer text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ── Daftar pesan ── */}
                  <div
                    ref={wadahPesanRef}
                    onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
                    onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setSeret(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSeret(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) pilihBerkas(f);
                    }}
                    className="scroll-halus relative flex-1 space-y-1.5 overflow-y-auto p-3 sm:p-4"
                  >
                    {seret && (
                      <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#004F9F] bg-blue-50/90 backdrop-blur-sm">
                        <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8 text-[#004F9F]" />
                        <p className="text-[11.5px] sm:text-[12.5px] font-black text-[#004F9F]">Lepaskan berkas untuk mengirim</p>
                        <p className="text-[9.5px] sm:text-[10px] font-medium text-[#004F9F]/60">Maksimal 5MB · video 20MB</p>
                      </div>
                    )}

                    {memuatPesan ? null : pesanTampil.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-[10.5px] sm:text-[11.5px] font-medium text-slate-400">
                        {cariPesan ? "Tidak ada pesan yang cocok" : "Belum ada pesan"}
                      </div>
                    ) : (
                      pesanTampil.map((m, i) => (
                        <div key={m.id}>
                          {!cariPesan && (i === 0 || !samaHari(m.created_at, pesanTampil[i - 1].created_at)) && (
                            <div className="my-2 sm:my-3 flex items-center gap-2 sm:gap-2.5">
                              <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                              <span className={`shrink-0 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[8.5px] sm:text-[9.5px] font-bold ${isDark ? "bg-white/5 text-slate-500" : "bg-white text-slate-400 shadow-sm"}`}>
                                {labelHari(m.created_at)}
                              </span>
                              <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                            </div>
                          )}
                          <MessageBubble
                            message={m}
                            isDark={isDark}
                            modePilih={modePilih}
                            terpilih={pesanTerpilih.includes(m.id)}
                            onToggle={togglePilih}
                            onLoncatKe={loncatKePesan}
                            disorot={disorot === m.id}
                            onMenu={(pesan, x, y) => setMenuPesan({ pesan, x, y })}
                            onBukaLampiran={setLampiranDibuka}
                            namaPeserta={sesiAktif.user_nama}
                          />
                        </div>
                      ))
                    )}
                    <div ref={akhirPesanRef} />
                  </div>

                  {/* ── Bilah mode pilih ── */}
                  {modePilih ? (
                    <div className={`flex shrink-0 items-center gap-2.5 sm:gap-3 border-t px-3 py-2 sm:px-4 sm:py-3 animate-[fadeslide_0.2s_ease-out] ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                      <button onClick={keluarModePilih}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-90">
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <p className={`flex-1 text-[11.5px] sm:text-[12.5px] font-bold ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                        {pesanTerpilih.length} terpilih
                      </p>
                      <button
                        onClick={hapusTerpilih}
                        disabled={pesanTerpilih.length === 0}
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-all active:scale-90 ${
                          pesanTerpilih.length ? "cursor-pointer text-rose-500 hover:bg-rose-50" : "text-slate-300"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={`shrink-0 border-t ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                      {/* Pratinjau balasan */}
                      {balasKe && (
                        <div className={`flex items-start gap-2 sm:gap-2.5 border-b px-2.5 sm:px-3 py-1.5 sm:py-2 animate-[fadeslide_0.2s_ease-out] ${isDark ? "border-white/10" : "border-slate-100"}`}>
                          <CornerUpLeft className="mt-0.5 sm:mt-1 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#004F9F]" />
                          <span className="min-w-0 flex-1 border-l-2 sm:border-l-[3px] border-[#004F9F] pl-2">
                            <span className="block text-[8.5px] sm:text-[9.5px] font-bold text-[#004F9F]">
                              Membalas {balasKe.sender_type === "admin" ? "pesan Anda" : sesiAktif.user_nama}
                            </span>
                            <span className="block truncate text-[10px] sm:text-[11px] font-medium text-slate-400">
                              {balasKe.tipe === "gambar" ? "Foto"
                                : balasKe.tipe === "video" ? "Video"
                                : balasKe.tipe === "berkas" ? balasKe.file_nama
                                : <TeksKayaInline teks={balasKe.content} />}
                            </span>
                          </span>
                          <button onClick={() => setBalasKe(null)}
                            className="cursor-pointer text-slate-400 hover:text-slate-600">
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Pratinjau lampiran sebelum dikirim */}
                      {lampiranTertunda && (
                        <div className={`flex items-center gap-2.5 sm:gap-3 border-b px-2.5 sm:px-3 py-2 sm:py-2.5 animate-[fadeslide_0.2s_ease-out] ${isDark ? "border-white/10" : "border-slate-100"}`}>
                          {lampiranTertunda.isVideo ? (
                            <video
                              src={lampiranTertunda.pratinjau}
                              className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 rounded-lg sm:rounded-xl bg-black object-cover ring-1 ring-slate-200"
                            />
                          ) : lampiranTertunda.isGambar ? (
                            <img
                              src={lampiranTertunda.pratinjau}
                              alt="Pratinjau"
                              className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 rounded-lg sm:rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                            />
                          ) : (
                            <span className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-violet-50 text-violet-600">
                              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                            </span>
                          )}

                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-[11px] sm:text-[12px] font-bold ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                              {lampiranTertunda.file.name}
                            </span>
                            <span className="mt-0.5 block text-[9px] sm:text-[10px] font-medium text-slate-400">
                              {lampiranTertunda.file.size < 1048576
                                ? `${(lampiranTertunda.file.size / 1024).toFixed(0)} KB`
                                : `${(lampiranTertunda.file.size / 1048576).toFixed(1)} MB`} · siap dikirim
                            </span>
                            <span className="mt-0.5 block text-[8.5px] sm:text-[9.5px] font-medium text-slate-400">
                              Tambahkan keterangan di bawah bila perlu
                            </span>
                          </span>

                          <button
                            onClick={batalkanLampiran}
                            title="Batalkan lampiran"
                            className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      )}

                      <form onSubmit={kirimBalasan} className="p-2 sm:p-3">
                        {/* ── Toolbar Format Teks Kaya Ringkas (Desktop & Mobile) ── */}
                        <div className={`mb-1.5 flex items-center justify-between gap-1 px-1 text-[10px] ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}>
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => sisipkanFormat("**", "**", "teks tebal")}
                              title="Tebal (Ctrl+B)"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md font-bold transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <Bold className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sisipkanFormat("*", "*", "teks miring")}
                              title="Miring (Ctrl+I)"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md italic transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <Italic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sisipkanFormat("__", "__", "garis bawah")}
                              title="Garis Bawah (Ctrl+U)"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md underline transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <Underline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sisipkanFormat("~~", "~~", "teks coret")}
                              title="Coret"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <Strikethrough className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>

                            <span className={`mx-0.5 h-3.5 w-px ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

                            <button
                              type="button"
                              onClick={() => sisipkanList("bullet")}
                              title="Daftar Poin"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <List className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sisipkanList("numbered")}
                              title="Daftar Nomor"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <ListOrdered className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sisipkanFormat("`", "`", "kode")}
                              title="Kode"
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                isDark ? "hover:bg-white/10 hover:text-slate-100" : "hover:bg-slate-200/80 hover:text-slate-900"
                              }`}
                            >
                              <Code className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>

                          {/* Tombol Template Balasan Cepat */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuTemplate((v) => !v)}
                              title="Template Balasan Cepat"
                              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10.5px] font-bold transition-all cursor-pointer ${
                                menuTemplate
                                  ? "bg-[#004F9F] text-white"
                                  : isDark
                                  ? "bg-white/5 text-sky-400 hover:bg-white/10"
                                  : "bg-blue-50 text-[#004F9F] hover:bg-blue-100"
                              }`}
                            >
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              <span className="hidden sm:inline">Template</span>
                            </button>

                            {menuTemplate && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setMenuTemplate(false)} />
                                <div className={`absolute bottom-8 right-0 z-30 w-72 sm:w-80 overflow-hidden rounded-xl sm:rounded-2xl border p-1.5 sm:p-2 shadow-2xl animate-[popIn_0.15s_ease-out_both] ${
                                  isDark ? "border-white/10 bg-[#1c2128]" : "border-slate-200 bg-white"
                                }`}>
                                  <div className="px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Template Balasan</span>
                                    <span className="text-[9px] font-medium text-slate-400">Klik untuk pakai</span>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto space-y-1">
                                    {TEMPLATE_BALASAN_ADMIN.map((tpl, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setBalasan((prev) => (prev ? `${prev}\n\n${tpl.teks}` : tpl.teks));
                                          setMenuTemplate(false);
                                          inputRef.current?.focus();
                                        }}
                                        className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer ${
                                          isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                                        }`}
                                      >
                                        <p className={`text-[11px] font-bold ${isDark ? "text-sky-300" : "text-[#004F9F]"}`}>
                                          {tpl.judul}
                                        </p>
                                        <p className={`text-[9.5px] line-clamp-2 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                          {tpl.teks}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Satu wadah untuk lampiran, kolom ketik, dan kirim. */}
                        <div
                          className={`flex items-end gap-1 rounded-xl sm:rounded-2xl border p-1 sm:p-1.5 transition-all duration-200 focus-within:shadow-sm ${
                            isDark
                              ? "border-white/10 bg-white/5 focus-within:border-[#00A5EC]/50 focus-within:bg-white/[0.07]"
                              : "border-slate-200 bg-slate-50 focus-within:border-[#004F9F] focus-within:bg-white"
                          }`}
                        >
                          {/* Lampiran */}
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setMenuLampiran((v) => !v)}
                              disabled={mengunggah}
                              title="Lampirkan berkas"
                              className={`flex h-7 w-7 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 active:scale-90 ${
                                menuLampiran
                                  ? "bg-[#004F9F]/10 text-[#004F9F]"
                                  : isDark
                                  ? "text-slate-500 hover:bg-white/10 hover:text-slate-200"
                                  : "text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                              }`}
                            >
                              {mengunggah
                                ? <Loader2 className="h-4 w-4 sm:h-[18px] sm:w-[18px] animate-spin" />
                                : <Paperclip className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-transform duration-200 ${menuLampiran ? "rotate-45" : ""}`} />}
                            </button>

                            {menuLampiran && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuLampiran(false)} />
                                <div className={`absolute bottom-10 sm:bottom-12 left-0 z-20 w-44 sm:w-48 overflow-hidden rounded-xl sm:rounded-2xl border p-1 sm:p-1.5 shadow-2xl animate-[popIn_0.15s_ease-out_both] ${
                                  isDark ? "border-white/10 bg-[#1c2128]" : "border-slate-200 bg-white"
                                }`}>
                                  <button type="button"
                                    onClick={() => { setMenuLampiran(false); gambarRef.current?.click(); }}
                                    className={`flex w-full cursor-pointer items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-bold transition-colors ${isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"}`}>
                                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-emerald-50 text-emerald-600">
                                      <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </span>
                                    Foto & Video
                                  </button>
                                  <button type="button"
                                    onClick={() => { setMenuLampiran(false); fileRef.current?.click(); }}
                                    className={`flex w-full cursor-pointer items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-bold transition-colors ${isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"}`}>
                                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-violet-50 text-violet-600">
                                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </span>
                                    Dokumen
                                  </button>
                                </div>
                              </>
                            )}

                            <input ref={gambarRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden"
                              onChange={(e) => { pilihBerkas(e.target.files?.[0]); e.target.value = ""; }} />
                            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" className="hidden"
                              onChange={(e) => { pilihBerkas(e.target.files?.[0]); e.target.value = ""; }} />
                          </div>

                          {/* Kolom ketik */}
                          <textarea
                            ref={inputRef}
                            rows={1}
                            value={balasan}
                            onChange={(e) => setBalasan(e.target.value)}
                            onFocus={() => {
                              setTimeout(() => {
                                akhirPesanRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                              }, 280);
                            }}
                            onKeyDown={(e) => {
                              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                                e.preventDefault();
                                sisipkanFormat("**", "**", "teks tebal");
                              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                                e.preventDefault();
                                sisipkanFormat("*", "*", "teks miring");
                              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
                                e.preventDefault();
                                sisipkanFormat("__", "__", "garis bawah");
                              } else if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                kirimBalasan();
                              }
                            }}
                            placeholder={lampiranTertunda ? "Tambahkan keterangan..." : "Ketik balasan..."}
                            className={`max-h-56 min-h-[36px] flex-1 resize-none scroll-halus border-none bg-transparent px-1 sm:px-1.5 py-1.5 sm:py-2 text-[11.5px] sm:text-[12.5px] font-medium leading-relaxed outline-none ${
                              isDark ? "text-slate-100 placeholder-slate-600" : "text-slate-700 placeholder-slate-400"
                            }`}
                          />

                          {/* Kirim */}
                          <button
                            type="submit"
                            disabled={(!balasan.trim() && !lampiranTertunda) || mengirim || mengunggah}
                            title="Kirim (Enter)"
                            className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 ${
                              (balasan.trim() || lampiranTertunda) && !mengirim && !mengunggah
                                ? "cursor-pointer bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-90"
                                : isDark ? "text-slate-600" : "text-slate-300"
                            }`}
                          >
                            {mengirim || mengunggah
                              ? <Loader2 className="h-4 w-4 sm:h-[18px] sm:w-[18px] animate-spin" />
                              : <SendHorizontal className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
                          </button>
                        </div>

                        <p className={`mt-1 sm:mt-1.5 px-1 text-[8.5px] sm:text-[9.5px] font-medium hidden sm:block ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                          Enter untuk kirim · Shift+Enter baris baru · Ctrl+B tebal · Ctrl+I miring · Ctrl+U garis bawah
                        </p>
                      </form>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Pertanyaan publik */}
            {tab === "pertanyaan" && (
              !tanyaAktif ? (
                <KosongPanel isDark={isDark} icon={Inbox}
                  judul="Pilih pertanyaan"
                  pesan="Klik salah satu pertanyaan di sebelah kiri untuk membaca dan membalasnya lewat email." />
              ) : (
                <div key={tanyaAktif.id} className="flex min-h-0 flex-1 flex-col animate-[fadeIn_0.22s_ease-out]">
                  {/* ── Kepala: identitas penanya ── */}
                  {(() => {
                    const g = GAYA_STATUS[tanyaAktif.status] || GAYA_STATUS.baru;
                    return (
                      <div className={`shrink-0 border-b px-3 py-2.5 sm:px-5 sm:py-4 ${isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"}`}>
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                            {/* Tombol kembali mobile */}
                            <button
                              type="button"
                              onClick={() => setTanyaAktif(null)}
                              className={`flex lg:hidden h-7 w-7 sm:h-8 sm:w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                                isDark
                                  ? "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                              title="Kembali ke daftar pertanyaan"
                            >
                              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            <span className="relative shrink-0">
                              <Avatar nama={tanyaAktif.nama} size="h-8 w-8 sm:h-11 sm:w-11" teks="text-[10px] sm:text-[12px]" />
                              {tanyaAktif.status === "baru" && (
                                <span className="absolute bottom-[2px] right-[2px] sm:bottom-[3px] sm:right-[3px] flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                  <span className={`relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-rose-500 ring-[1.5px] ${isDark ? "ring-[#161b22]" : "ring-white"}`} />
                                </span>
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className={`truncate text-[12px] sm:text-[14px] font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                                {tanyaAktif.nama}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 sm:gap-1.5 truncate text-[9.5px] sm:text-[11px] font-medium text-slate-400">
                                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                {tanyaAktif.email}
                                <span className="text-slate-300">·</span>
                                {new Date(tanyaAktif.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric", month: "long", year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          <span className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10.5px] font-black ${g.cls}`}>
                            <g.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {g.label}
                          </span>
                        </div>

                        {/* Pengubah status — segmented control */}
                        <div className={`mt-2.5 sm:mt-3.5 flex gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl p-0.5 sm:p-1 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                          {["baru", "diproses", "selesai", "diabaikan"].map((s) => {
                            const gs = GAYA_STATUS[s];
                            const pilih = tanyaAktif.status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => ubahStatus(s)}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 text-[9px] sm:text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                                  pilih
                                    ? `${gs.cls} shadow-sm`
                                    : isDark ? "text-slate-500 hover:bg-white/5" : "text-slate-400 hover:bg-white"
                                }`}
                              >
                                <gs.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                {gs.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Isi: pertanyaan & jawaban dalam satu alur ── */}
                  <div className="scroll-halus flex-1 overflow-y-auto p-3.5 sm:p-5">
                    {/* Pertanyaan */}
                    <div className={`relative rounded-xl sm:rounded-2xl border-l-4 p-3 sm:p-4 ${
                      isDark ? "border-sky-400 bg-white/5" : "border-[#004F9F] bg-white shadow-sm"
                    }`}>
                      <span className={`mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider ${
                        isDark ? "text-sky-400" : "text-[#004F9F]"
                      }`}>
                        <MessagesSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Pertanyaan
                      </span>
                      <p className={`whitespace-pre-wrap text-[11.5px] sm:text-[13.5px] leading-relaxed ${isDark ? "text-slate-100" : "text-slate-700"}`}>
                        {tanyaAktif.pertanyaan}
                      </p>

                      {tanyaAktif.jumlah_serupa > 1 && (
                        <p className={`mt-2.5 sm:mt-3 flex w-fit items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold ${
                          isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
                        }`}>
                          <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {tanyaAktif.jumlah_serupa} orang menanyakan hal serupa — layak dijadikan FAQ
                        </p>
                      )}
                    </div>

                    {/* Jadikan FAQ */}
                    <button
                      onClick={bukaModalFaq}
                      className={`group mt-2.5 sm:mt-3 flex w-full cursor-pointer items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-dashed p-2.5 sm:p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] ${
                        isDark
                          ? "border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent hover:border-sky-400/60 hover:bg-sky-500/15"
                          : "border-[#004F9F]/30 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent hover:border-[#004F9F] hover:bg-blue-50"
                      }`}
                    >
                      <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[11px] sm:text-[12.5px] font-black ${isDark ? "text-sky-400" : "text-[#004F9F]"}`}>
                          Jadikan FAQ
                        </span>
                        <span className={`mt-0.5 block text-[9.5px] sm:text-[10.5px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Agar pertanyaan serupa terjawab otomatis oleh chatbot
                        </span>
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                        isDark ? "text-sky-400/50 group-hover:text-sky-400" : "text-[#004F9F]/50 group-hover:text-[#004F9F]"
                      }`} />
                    </button>

                    {/* Garis alur */}
                    <div className="my-3 sm:my-4 flex items-center gap-2 sm:gap-2.5">
                      <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                      <span className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[8.5px] sm:text-[9.5px] font-bold ${isDark ? "bg-white/5 text-slate-500" : "bg-white text-slate-400 shadow-sm"}`}>
                        <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Balasan Anda
                      </span>
                      <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                    </div>

                    {/* Templat cepat */}
                    <div className="mb-2.5 sm:mb-3 flex flex-wrap gap-1 sm:gap-1.5">
                        {[
                          // Pembuka
                          { label: "Sapaan", teks: `Halo ${tanyaAktif.nama.split(" ")[0]}, terima kasih atas pertanyaan Anda.\n\n` },

                          // Isi jawaban yang paling sering dipakai
                          { label: "Cara daftar", teks: "Pendaftaran dilakukan melalui halaman Pendaftaran di situs kami. Buat akun terlebih dahulu, lalu lengkapi formulir dan unggah surat pengantar dari kampus/sekolah dalam format PDF (maksimal 2 MB).\n\n" },
                          { label: "Syarat", teks: "Persyaratan magang di Diskominfo Kabupaten Ponorogo:\n1. Mahasiswa/siswa aktif dibuktikan dengan surat pengantar resmi dari institusi\n2. Melampirkan proposal atau surat permohonan magang\n3. Bersedia mengikuti jam kerja yang berlaku\n\n" },
                          { label: "Belum dibuka", teks: "Saat ini pendaftaran magang belum dibuka. Pengumuman pembukaan akan kami sampaikan melalui situs resmi dan media sosial Diskominfo Kabupaten Ponorogo.\n\n" },
                          { label: "Durasi & jam", teks: "Pelaksanaan magang mengikuti jam kerja kantor, yaitu Senin sampai Jumat pukul 07.30 hingga 15.30 WIB. Durasi magang menyesuaikan ketentuan dari institusi asal Anda.\n\n" },
                          { label: "Lama verifikasi", teks: "Proses verifikasi berkas umumnya memakan waktu 3 sampai 5 hari kerja. Anda akan menerima pemberitahuan melalui email begitu ada perkembangan.\n\n" },
                          { label: "Cek dasbor", teks: "Status pendaftaran Anda dapat dipantau kapan saja melalui dasbor peserta setelah masuk ke akun Anda.\n\n" },
                          { label: "Belum bisa", teks: "Mohon maaf, untuk saat ini permohonan Anda belum dapat kami penuhi karena kuota pada bidang yang diminta sudah terisi penuh. Anda dipersilakan mendaftar kembali pada periode berikutnya.\n\n" },

                          // Penutup
                          { label: "Penutup", teks: "\nApabila masih ada yang ingin ditanyakan, jangan ragu menghubungi kami kembali.\n\nSalam,\nAdmin Magang Diskominfo Kabupaten Ponorogo" },
                        ].map((t) => (
                          <button
                            key={t.label}
                            onClick={() => setJawaban((j) => j + t.teks)}
                            className={`cursor-pointer rounded-md sm:rounded-lg border border-dashed px-2 sm:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                              isDark
                                ? "border-white/15 text-slate-400 hover:border-[#00A5EC]/50 hover:text-slate-200"
                                : "border-slate-300 text-slate-500 hover:border-[#004F9F] hover:text-[#004F9F]"
                            }`}
                          >
                            + {t.label}
                          </button>
                        ))}
                    </div>

                    {/* Kolom jawaban */}
                    <div
                      className={`rounded-xl sm:rounded-2xl border transition-all duration-200 focus-within:shadow-sm ${
                        isDark
                          ? "border-white/10 bg-white/5 focus-within:border-[#00A5EC]/50"
                          : "border-slate-200 bg-white focus-within:border-[#004F9F]"
                      }`}
                    >
                      <textarea
                        rows={8}
                        value={jawaban}
                        onChange={(e) => setJawaban(e.target.value)}
                        placeholder="Tulis jawaban Anda di sini. Pertanyaan asli akan ikut disertakan dalam email."
                        className={`w-full resize-none border-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3.5 text-[11.5px] sm:text-[13px] font-medium leading-relaxed outline-none ${
                          isDark ? "text-slate-100 placeholder-slate-600" : "text-slate-700 placeholder-slate-400"
                        }`}
                      />

                      <div className={`flex items-center justify-between gap-2.5 sm:gap-3 border-t px-2.5 sm:px-3 py-2 sm:py-2.5 ${isDark ? "border-white/10" : "border-slate-100"}`}>
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          {jawaban.trim().length > 0 && (
                            <button
                              onClick={() => setJawaban("")}
                              title="Kosongkan"
                              className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          )}
                          <p className={`truncate text-[9px] sm:text-[10px] font-medium ${
                            jawaban.trim().length < 10 ? "text-slate-400" : "text-emerald-600"
                          }`}>
                            {jawaban.trim().length < 10
                              ? `Minimal 10 karakter (${jawaban.trim().length})`
                              : `${jawaban.trim().length} karakter · siap dikirim`}
                          </p>
                        </div>

                        <button
                          onClick={kirimEmail}
                          disabled={jawaban.trim().length < 10 || mengirimEmail}
                          className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11.5px] font-bold transition-all duration-200 ${
                            jawaban.trim().length >= 10 && !mengirimEmail
                              ? "cursor-pointer bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                              : isDark ? "bg-white/5 text-slate-600" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {mengirimEmail
                            ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                            : <SendHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          Kirim Balasan
                        </button>
                      </div>
                    </div>

                    {tanyaAktif.status === "selesai" && tanyaAktif.catatan_admin && (
                      <p className="mt-2.5 sm:mt-3 flex items-start gap-2 rounded-lg sm:rounded-xl bg-emerald-50 p-2.5 sm:p-3 text-[9.5px] sm:text-[10.5px] font-medium leading-relaxed text-emerald-700">
                        <CheckCircle2 className="mt-px h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        Pertanyaan ini sudah pernah dibalas. Mengirim ulang akan menimpa catatan balasan sebelumnya.
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {menuSesi && (
        <MenuKonteks
          posisi={{ x: menuSesi.x, y: menuSesi.y }}
          isDark={isDark}
          onTutup={() => setMenuSesi(null)}
          items={[
            {
              label: menuSesi.sesi.is_pinned_admin ? "Lepas sematan" : "Sematkan chat",
              icon: menuSesi.sesi.is_pinned_admin ? PinOff : Pin,
              onClick: () => toggleSematkan(menuSesi.sesi),
            },
            {
              label: "Tandai belum dibaca",
              icon: MailOpen,
              onClick: () => tandaiBelum(menuSesi.sesi),
            },
          ]}
        />
      )}

      {menuHeader && (
        <MenuKonteks
          posisi={menuHeader}
          isDark={isDark}
          onTutup={() => setMenuHeader(null)}
          items={[
            { label: "Cari", icon: Search, onClick: () => { setTampilCariPesan(true); setCariPesan(""); } },
            { label: "Pilih pesan", icon: CheckSquare, onClick: () => { setModePilih(true); setPesanTerpilih([]); } },
          ]}
        />
      )}

      {menuPesan && (
        <MenuKonteks
          posisi={{ x: menuPesan.x, y: menuPesan.y }}
          isDark={isDark}
          onTutup={() => setMenuPesan(null)}
          items={[
            { label: "Balas", icon: CornerUpLeft, onClick: () => setBalasKe(menuPesan.pesan) },
            { label: "Salin", icon: Copy, onClick: () => salinPesan(menuPesan.pesan) },
            { label: "Pilih pesan", icon: CheckSquare, onClick: () => { setModePilih(true); setPesanTerpilih([menuPesan.pesan.id]); } },
            { pemisah: true },
            { label: "Hapus", icon: Trash2, bahaya: true, onClick: () => hapusSatuPesan(menuPesan.pesan) },
          ]}
        />
      )}

      {lampiranDibuka && (
        <PratinjauLampiran pesan={lampiranDibuka} onTutup={() => setLampiranDibuka(null)} />
      )}

      {showModalFaq && (
        <FaqModal
          editMode={false}
          question={question} setQuestion={setQuestion}
          answer={answer} setAnswer={setAnswer}
          keywords={keywords} setKeywords={setKeywords}
          category={category} setCategory={setCategory}
          quickLabel={quickLabel} setQuickLabel={setQuickLabel}
          isActive={isActive} setIsActive={setIsActive}
          showOnLanding={showOnLanding} setShowOnLanding={setShowOnLanding}
          isQuickAction={isQuickAction} setIsQuickAction={setIsQuickAction}
          sisaQuickAction={sisaQuickAction}
          loading={loadingSimpanFaq}
          onSubmit={simpanFaqBaru}
          onClose={() => setShowModalFaq(false)}
        />
      )}
    </AdminLayout>
  );
};

/* ══════════ Keadaan kosong ══════════ */
const KosongKolom = ({ isDark, pesan }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? "bg-white/5 text-slate-600" : "bg-slate-100 text-slate-300"}`}>
      <Inbox className="h-5 w-5" />
    </span>
    <p className="text-[11.5px] font-medium text-slate-400">{pesan}</p>
  </div>
);

const KosongPanel = ({ isDark, icon: Icon, judul, pesan }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
    <span className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? "bg-white/5 text-slate-600" : "bg-slate-100 text-slate-300"}`}>
      <Icon className="h-7 w-7" />
      <span className={`absolute inset-0 animate-ping rounded-2xl border-2 opacity-30 ${isDark ? "border-white/10" : "border-slate-200"}`} />
    </span>
    <p className={`text-[13.5px] font-black ${isDark ? "text-slate-300" : "text-[#0B1442]"}`}>{judul}</p>
    <p className="max-w-xs text-[11.5px] font-medium leading-relaxed text-slate-400">{pesan}</p>
    <ChevronRight className="h-4 w-4 rotate-180 text-slate-300" />
  </div>
);

export default BantuanPage;