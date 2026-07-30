import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  X, FileSignature, Loader2, ExternalLink, Download, FileText, RefreshCw,
  Hash, CalendarDays, LayoutTemplate, Building2, MapPin, Send, Sparkles,
  Info, CheckCircle2, Clock3, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Eye, Save,
  ChevronDown, Check, Mail,
} from "lucide-react";
import {
  createSuratPenerimaan,
  updateSuratPenerimaan,
  pratinjauSuratPenerimaan,
  unduhSuratPenerimaan,
  bukaPdfSurat,
  getAllTemplateSurat,
} from "../../../../services/suratPenerimaanService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess } from "../../../../utils/swal";

// Pratinjau memakai pdf.js, pola sama dengan modal tinjau di halaman pendaftaran.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const hariIni = () => new Date().toISOString().slice(0, 10);
const tglInput = (v) => (v ? String(v).slice(0, 10) : "");

// Backend mengirim tanggal magang lengkap dengan jam & zona
// ("2026-07-07T00:00:00+07:00"), jadi harus diringkas dulu untuk badge header.
const fmtTglBadge = (nilai) => {
  if (!nilai) return "-";
  const d = new Date(nilai);
  if (Number.isNaN(d.getTime())) return String(nilai).slice(0, 10);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const getInisial = (nama) => {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Avatar peserta di header — pola sama dengan modal detail presensi */
const PesertaAvatarModal = ({ nama, foto }) => {
  const [error, setError] = useState(false);
  const url = foto ? getFileUrl(foto) : null;

  return (
    <span className="relative shrink-0">
      {url && !error ? (
        <img
          src={url}
          alt={nama}
          onError={() => setError(true)}
          className="h-12 w-12 rounded-2xl border border-white/20 object-cover shadow-lg"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-[13px] font-black text-white shadow-lg">
          {getInisial(nama)}
        </span>
      )}
      <span className="pointer-events-none absolute -inset-1 animate-pulse rounded-2xl border-2 border-[#00A5EC]/30" />
    </span>
  );
};

/* Judul seksi dengan garis pemisah */
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="mb-2.5 flex items-center gap-2.5">
    <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#00A5EC] to-[#004F9F]" />
    {Icon && <Icon className="h-3.5 w-3.5 text-[#004F9F]" />}
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{children}</p>
    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-[#004F9F] focus:ring-4 focus:ring-[#00A5EC]/15";

/* Satu kolom isian, dibungkus kartu ber-ring seperti InfoItem presensi */
const Field = ({ icon: Icon, label, wajib, children, hint, delay = 0 }) => (
  <div
    className="group rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#004F9F]/25 hover:shadow-sm animate-[fadeslide_0.3s_ease-out]"
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <div className="mb-1.5 flex items-center gap-2">
      {Icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-300 group-hover:bg-[#004F9F]/10 group-hover:text-[#004F9F]">
          <Icon className="h-3 w-3" />
        </span>
      )}
      <label className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label} {wajib && <span className="text-rose-500">*</span>}
      </label>
    </div>
    {children}
    {hint && <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{hint}</p>}
  </div>
);

/* Kolom teks yang bisa lebih dari satu baris.
   Shift+Enter  -> membuat baris baru (teks lanjut di bawahnya pada PDF)
   Enter        -> diabaikan, supaya form tidak ikut terkirim */
const AreaBaris = ({ value, onChange, placeholder, className = "" }) => {
  const ref = useRef(null);

  // Tinggi mengikuti jumlah baris isi
  const sesuaikanTinggi = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    sesuaikanTinggi(ref.current);
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        sesuaikanTinggi(e.target);
        onChange?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        if (!e.shiftKey) e.preventDefault(); // Enter biasa: tidak berbuat apa-apa
        // Shift+Enter: biarkan default -> baris baru
      }}
      className={`${inputClass} resize-none overflow-hidden leading-relaxed ${className}`}
    />
  );
};

/* Dropdown custom beranimasi — pengganti <select> bawaan browser.
   API-nya kompatibel: onChange menerima { target: { value } }. */
const PilihanRapi = ({ value, onChange, opsi = [], kosong = "Pilih..." }) => {
  const [buka, setBuka] = useState(false);
  const kotak = useRef(null);

  useEffect(() => {
    if (!buka) return undefined;
    const klikLuar = (e) => {
      if (kotak.current && !kotak.current.contains(e.target)) setBuka(false);
    };
    const tekanEsc = (e) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
    };
  }, [buka]);

  const terpilih = opsi.find((o) => String(o.nilai) === String(value ?? ""));

  return (
    <div ref={kotak} className="relative">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#0B1442] outline-none transition-all duration-200 ${
          buka ? "border-[#004F9F] ring-2 ring-[#00A5EC]/30" : "border-slate-200 hover:border-[#004F9F]/40"
        }`}
      >
        <span className="truncate">{terpilih?.label ?? kosong}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${buka ? "rotate-180 text-[#004F9F]" : "text-slate-400"}`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 z-40 mt-1.5 max-h-56 origin-top overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl transition-all duration-200 ${
          buka
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {opsi.length === 0 ? (
          <p className="px-3 py-2 text-[11px] font-semibold text-slate-400">Belum ada template publish</p>
        ) : (
          opsi.map((o) => {
            const aktif = String(o.nilai) === String(value ?? "");
            return (
              <button
                key={o.nilai}
                type="button"
                onClick={() => {
                  setBuka(false);
                  onChange?.({ target: { value: o.nilai } });
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-bold transition-all duration-150 ${
                  aktif
                    ? "bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#004F9F]"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {aktif && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

/**
 * Modal tunggal penerbitan / perbaikan surat penerimaan magang.
 * Lihat, ubah, dan unduh PDF dilakukan di satu tempat.
 *
 * @param pendaftaran baris pendaftaran yang statusnya sudah "diterima"
 * @param surat       data surat yang sudah ada (null = terbitkan baru)
 * @param onSaved     dipanggil setelah simpan berhasil, membawa data surat terbaru
 */
const SuratPenerimaanModal = ({ pendaftaran, surat = null, onClose, onSaved }) => {
  const institusiDefault =
    pendaftaran?.kategori_pendaftar === "mahasiswa"
      ? pendaftaran?.asal_kampus
      : pendaftaran?.asal_sekolah;

  const [form, setForm] = useState({
    nomor_surat: surat?.nomor_surat || "",
    tanggal_terbit: tglInput(surat?.tanggal_terbit) || hariIni(),
    jabatan_tujuan: surat?.jabatan_tujuan || "",
    unit_tujuan: surat?.unit_tujuan || "",
    institusi_tujuan: surat?.institusi_tujuan || institusiDefault || "",
    kota_tujuan: surat?.kota_tujuan || "",
    nomor_surat_pengantar: surat?.nomor_surat_pengantar || "",
    tanggal_surat_pengantar: tglInput(surat?.tanggal_surat_pengantar),
  });
  const [saving, setSaving] = useState(false);
  const [unduhing, setUnduhing] = useState(false);
  const [hasil, setHasil] = useState(surat);
  const [cacheBust, setCacheBust] = useState(0);
  const [daftarTemplate, setDaftarTemplate] = useState([]);
  const [idTemplate, setIdTemplate] = useState(surat?.template_surat_id ?? "");
  // Saat surat pertama kali diterbitkan, PDF langsung dikirim ke email
  // yang diisi peserta waktu mendaftar. Bisa dimatikan untuk arsip internal.
  const [kirimEmail, setKirimEmail] = useState(true);

  // Viewer PDF
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);
  // Draf pratinjau: PDF sementara hasil isian form yang BELUM disimpan.
  const [draftUrl, setDraftUrl] = useState(null);
  const [pratinjauing, setPratinjauing] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      // Penanda waktu dibuat di sini (bukan saat render) supaya komponen tetap murni,
      // sekaligus memastikan pratinjau tidak memuat PDF versi cache.
      setCacheBust(Date.now());
      try {
        const res = await getAllTemplateSurat();
        const list = (res.data.data || []).filter((x) => x.status === "publish");
        setDaftarTemplate(list);
        setIdTemplate((prev) => prev || list.find((x) => x.is_default)?.id || list[0]?.id || "");
      } catch {
        // biarkan kosong; backend otomatis memakai template utama
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const buatPayload = () => ({
    ...form,
    template_surat_id: idTemplate ? Number(idTemplate) : null,
    pendaftaran_magang_id: pendaftaran?.id,
  });

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!form.nomor_surat.trim()) {
      toastError("Nomor surat wajib diisi. Nomor mengikuti penomoran internal instansi.");
      return;
    }
    if (!form.institusi_tujuan.trim()) {
      toastError("Institusi tujuan surat wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const payload = buatPayload();
      const baru = !hasil?.id;
      let res;
      if (hasil?.id) {
        res = await updateSuratPenerimaan(hasil.id, payload);
      } else {
        res = await createSuratPenerimaan({
          ...payload,
          pendaftaran_magang_id: pendaftaran.id,
          // Backend mengirim PDF ke email peserta bila bernilai true.
          kirim_email: kirimEmail,
        });
      }
      const data = res.data.data || res.data;
      setHasil(data);
      setDraftUrl(null); // draf tidak relevan lagi, PDF resmi sudah ditulis
      setCacheBust(Date.now());
      toastSuccess(
        baru
          ? kirimEmail
            ? "Surat diterbitkan & sedang dikirim ke email peserta"
            : "Surat penerimaan berhasil diterbitkan"
          : "Surat berhasil diperbarui & PDF digenerate ulang"
      );
      onSaved?.(data);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan surat penerimaan.");
    } finally {
      setSaving(false);
    }
  };

  // Tanpa useCallback: React Compiler yang menangani memoisasi otomatis.
  // Dependensi manual sebelumnya (hasil?.id, pendaftaran?.nama_lengkap) dianggap
  // lebih sempit daripada yang disimpulkan compiler (hasil, pendaftaran),
  // sehingga optimasi seluruh komponen dibatalkan.
  const handleUnduh = async () => {
    if (!hasil?.id) return;
    setUnduhing(true);
    try {
      await unduhSuratPenerimaan(hasil.id, `Surat Penerimaan - ${pendaftaran?.nama_lengkap || "peserta"}.pdf`);
    } catch {
      toastError("Gagal mengunduh PDF surat.");
    } finally {
      setUnduhing(false);
    }
  };

  // Hanya menghasilkan PDF sementara di memori — database & file tidak tersentuh.
  const handlePratinjau = async () => {
    if (!pendaftaran?.id) return;
    setPratinjauing(true);
    try {
      const url = await pratinjauSuratPenerimaan(buatPayload());
      setDraftUrl(url);
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal membuat pratinjau perubahan.");
    } finally {
      setPratinjauing(false);
    }
  };

  const handleBukaTab = () => {
    if (!bukaPdfSurat(hasil?.file_surat)) {
      toastError("File PDF belum tersedia. Coba simpan ulang surat ini.");
    }
  };

  const sudahTerbit = Boolean(hasil?.id);
  // Tanpa fragmen #toolbar karena PDF kini digambar sendiri ke <canvas>.
  const urlTersimpan =
    hasil?.file_surat && cacheBust ? `${getFileUrl(hasil.file_surat)}?t=${cacheBust}` : null;
  // Draf selalu diprioritaskan supaya admin melihat efek perubahan terakhir.
  const urlPratinjau = draftUrl || urlTersimpan;

  // Lepaskan blob draf lama saat diganti atau saat modal ditutup.
  useEffect(() => {
    if (!draftUrl) return;
    return () => URL.revokeObjectURL(draftUrl);
  }, [draftUrl]);

  // Muat dokumen setiap URL pratinjau berubah (mis. setelah generate ulang).
  useEffect(() => {
    if (!urlPratinjau) {
      const kosong = setTimeout(() => {
        setPdfDoc(null);
        setDocLoading(false);
        setDocError(false);
      }, 0);
      return () => clearTimeout(kosong);
    }

    let cancelled = false;
    const t = setTimeout(() => {
      setDocLoading(true);
      setDocError(false);
      fetch(urlPratinjau)
        .then((res) => res.arrayBuffer())
        .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
        .then((doc) => {
          if (cancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setDocLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setDocError(true);
          setDocLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [urlPratinjau]);

  // Gambar halaman aktif ke canvas sesuai tingkat perbesaran.
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: canvas.getContext("2d"), viewport });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, zoom]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md animate-[backdropFade_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-3.5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl" />
          <FileSignature
            className="pointer-events-none absolute right-16 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 text-sky-300 opacity-[0.06]"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <PesertaAvatarModal nama={pendaftaran?.nama_lengkap} foto={pendaftaran?.file_pas_foto} />
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC]">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  {sudahTerbit ? "Kelola Surat Penerimaan" : "Terbitkan Surat Penerimaan"}
                </div>
                <h3 className="truncate text-base font-black leading-tight text-white">
                  {pendaftaran?.nama_lengkap || "Peserta"}
                </h3>
                {/* Bidang + badge status sejajar, dipisah jarak lebar */}
                <div className="mt-1 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/60">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{pendaftaran?.posisi_bidang || "Belum ada bidang"}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 backdrop-blur-sm ${
                        sudahTerbit
                          ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                          : "bg-amber-400/20 text-amber-100 ring-amber-300/30"
                      }`}
                    >
                      {sudahTerbit ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {sudahTerbit ? "Surat sudah terbit" : "Belum terbit"}
                    </span>
                    {hasil?.nomor_surat && (
                      <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm md:inline-flex">
                        <Hash className="h-3 w-3" /> {hasil.nomor_surat}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
                      <CalendarDays className="h-3 w-3" />
                      {fmtTglBadge(pendaftaran?.tanggal_mulai)} s/d {fmtTglBadge(pendaftaran?.tanggal_selesai)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-white"
              aria-label="Tutup modal surat penerimaan"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden bg-slate-50/40 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
          {/* --- Panel kiri: isian surat --- */}
          <form onSubmit={handleSubmit} className="min-h-0 min-w-0 space-y-5 overflow-y-auto p-6">
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                <Info className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10.5px] font-semibold leading-relaxed text-amber-800">
                Nomor surat diisi manual mengikuti penomoran internal instansi. Data peserta
                (nama, nomor induk, bidang, periode magang) diambil otomatis dari berkas pendaftaran.
              </p>
            </div>

            <div>
              <SectionTitle icon={FileText}>Identitas Surat</SectionTitle>
              {/* Nomor surat mendapat porsi lebar lebih besar daripada tanggal. */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
                <Field icon={Hash} label="Nomor Surat" wajib hint="Contoh: 400.14.5.4/KH/0173/405.18/2026" delay={40}>
                  <input className={`${inputClass} font-mono text-[12px] tracking-tight`} value={form.nomor_surat} onChange={set("nomor_surat")} placeholder="400.14.5.4/KH/…" />
                </Field>
                <Field icon={CalendarDays} label="Tanggal Surat" wajib delay={80}>
                  <input type="date" className={`${inputClass} px-2 text-[11.5px]`} value={form.tanggal_terbit} onChange={set("tanggal_terbit")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    icon={LayoutTemplate}
                    label="Template Surat"
                    hint="Menentukan kop, redaksi, dan tata letak PDF. Kelola di menu Surat Penerimaan → Template Surat."
                    delay={120}
                  >
                    <PilihanRapi
                      value={idTemplate}
                      onChange={(e) => setIdTemplate(e.target.value)}
                      kosong="Template utama"
                      opsi={daftarTemplate.map((tpl) => ({
                        nilai: tpl.id,
                        label: `${tpl.nama}${tpl.is_default ? " (utama)" : ""}`,
                      }))}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <SectionTitle icon={MapPin}>Tujuan Surat</SectionTitle>
              {/* Tujuan surat disusun satu baris per kolom, mengikuti urutan penulisan di surat: jabatan → unit → institusi → kota. */}
              <div className="grid grid-cols-1 gap-2.5">
                <Field label="Jabatan Tujuan" hint="Contoh: Wakil Dekan I · Shift+Enter untuk baris baru" delay={40}>
                  <AreaBaris value={form.jabatan_tujuan} onChange={set("jabatan_tujuan")} />
                </Field>
                <Field label="Unit / Fakultas" hint="Contoh: Fakultas Ilmu Komputer · Shift+Enter untuk baris baru" delay={80}>
                  <AreaBaris value={form.unit_tujuan} onChange={set("unit_tujuan")} />
                </Field>
                <Field
                  icon={Building2}
                  label="Institusi Tujuan"
                  wajib
                  hint='Shift+Enter untuk memotong baris, contoh: Universitas Pembangunan Nasional "Veteran" ⏎ Jawa Timur'
                  delay={120}
                >
                  <AreaBaris value={form.institusi_tujuan} onChange={set("institusi_tujuan")} />
                </Field>
                <Field icon={MapPin} label="Kota Tujuan" hint="Ditulis kapital otomatis di surat" delay={160}>
                  <input className={inputClass} value={form.kota_tujuan} onChange={set("kota_tujuan")} placeholder="Surabaya" />
                </Field>
              </div>
            </div>

            <div>
              <SectionTitle icon={Send}>Surat Pengantar dari Institusi</SectionTitle>
              {/* Rasio kolom sama dengan bagian Identitas Surat: nomor surat mendapat porsi lebar lebih besar daripada tanggal. */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
                <Field icon={Hash} label="Nomor Surat Pengantar" hint="Contoh: 530/UN63.7/PJ/2026" delay={40}>
                  <input
                    className={`${inputClass} font-mono text-[12px] tracking-tight`}
                    value={form.nomor_surat_pengantar}
                    onChange={set("nomor_surat_pengantar")}
                    placeholder="530/UN63.7/PJ/2026"
                  />
                </Field>
                 <Field icon={CalendarDays} label="Tanggal Surat Pengantar" delay={80}>
                  <input
                    type="date"
                    className={`${inputClass} px-2 text-[11.5px]`}
                    value={form.tanggal_surat_pengantar}
                    onChange={set("tanggal_surat_pengantar")}
                  />
                </Field>
              </div>
            </div>

            {/* Pengiriman email — hanya muncul saat surat pertama kali diterbitkan.
                Untuk surat yang sudah ada, pengiriman ulang lewat menu aksi
                di halaman Daftar Surat. */}
            {!hasil?.id && (
              <label
                className={`group/mail relative flex cursor-pointer items-center gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg ${
                  kirimEmail
                    ? "border-[#00A5EC]/45 bg-gradient-to-r from-[#EAF6FF] via-white to-[#F3FAFF] shadow-[0_6px_20px_-10px_rgba(0,79,159,.55)]"
                    : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {/* Kilau halus yang melintas saat kartu disorot */}
                <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-700 ease-out group-hover/mail:left-full" />

                {/* Ikon amplop + penanda status */}
                <span
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    kirimEmail
                      ? "bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-md shadow-[#004F9F]/25 group-hover/mail:scale-110 group-hover/mail:-rotate-6"
                      : "bg-slate-200/80 text-slate-400 group-hover/mail:scale-105"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {kirimEmail && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                      <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <Check className="h-2 w-2 text-white" strokeWidth={4} />
                      </span>
                    </span>
                  )}
                </span>

                {/* Teks */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold transition-colors duration-300 ${
                        kirimEmail ? "text-[#004F9F]" : "text-slate-500"
                      }`}
                    >
                      Kirim surat ke email peserta
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 transition-all duration-300 ${
                        kirimEmail
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-400 ring-slate-200"
                      }`}
                    >
                      {kirimEmail ? "Aktif" : "Nonaktif"}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[10.5px] leading-relaxed text-slate-500">
                    {kirimEmail ? (
                      <>
                        PDF surat dilampirkan ke{" "}
                        <span className="font-bold text-slate-700">
                          {pendaftaran?.email || "email yang diisi saat pendaftaran"}
                        </span>
                      </>
                    ) : (
                      "Surat hanya disimpan sebagai arsip, peserta tidak menerima email."
                    )}
                  </span>
                </span>

                {/* Saklar */}
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={kirimEmail}
                    onChange={(e) => setKirimEmail(e.target.checked)}
                  />
                  <span className="h-6 w-11 rounded-full bg-slate-300 transition-all duration-300 ease-out peer-checked:bg-gradient-to-r peer-checked:from-[#004F9F] peer-checked:to-[#00A5EC] peer-focus-visible:ring-4 peer-focus-visible:ring-[#00A5EC]/25" />
                  <span className="absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out peer-checked:translate-x-5 peer-checked:rotate-[360deg] group-active/mail:w-6" />
                </span>
              </label>
            )}
          </form>

          {/* --- Panel kanan: pratinjau PDF (viewer pdf.js, pola modal tinjau) --- */}
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-slate-200/70 bg-white lg:border-l lg:border-t-0">
            {/* Toolbar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-extrabold text-[#0B1442]">
                  {urlPratinjau ? "Pratinjau Surat" : "Belum ada surat"}
                </span>
                {draftUrl && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                    Draf belum disimpan
                  </span>
                )}
              </div>

              {urlPratinjau && (
                <>
                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(50, z - 25))}
                      className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-white hover:text-[#004F9F]"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="w-11 text-center text-xs font-bold tabular-nums text-[#0B1442]">{zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(200, z + 25))}
                      className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-white hover:text-[#004F9F]"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setDraftUrl(null); setCacheBust(Date.now()); }}
                      title="Kembali ke versi tersimpan"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleBukaTab}
                      title="Buka di tab baru"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleUnduh}
                      disabled={unduhing}
                      title="Unduh PDF surat"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:scale-110 hover:bg-slate-100 hover:text-[#004F9F] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {unduhing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Navigasi halaman */}
            {urlPratinjau && numPages > 1 && (
              <div className="flex shrink-0 items-center justify-center gap-1 border-b border-slate-100 bg-slate-50 px-5 py-2">
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="cursor-pointer rounded-full p-1 text-slate-500 transition-all hover:bg-white hover:text-[#004F9F] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="whitespace-nowrap px-1 text-[10.5px] font-bold text-[#0B1442]">
                  Hal {pageNum}/{numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum === numPages}
                  className="cursor-pointer rounded-full p-1 text-slate-500 transition-all hover:bg-white hover:text-[#004F9F] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Kanvas dokumen — min-h-0 + wrapper dalam supaya hasil zoom bisa digulir dua arah, tapi tetap terpusat saat masih kecil. */}
            <div
              className="min-h-0 flex-1 overflow-auto p-6"
              style={{
                backgroundColor: "#eef1f6",
                backgroundImage: "radial-gradient(circle, #d8dee8 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              <div className="flex min-h-full w-fit min-w-full items-center justify-center">
              {!urlPratinjau ? (
                <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FileText className="h-8 w-8" />
                  </span>
                  <span className="text-xs font-bold text-slate-600">PDF belum tersedia</span>
                  <span className="text-[10.5px] leading-relaxed text-slate-400">
                    Lengkapi nomor surat dan data tujuan, lalu tekan{" "}
                    <span className="font-bold text-[#004F9F]">Terbitkan Surat</span> pratinjau langsung muncul di sini.
                  </span>
                </div>
              ) : docLoading ? (
                <div className="m-auto flex flex-col items-center gap-3 text-slate-400">
                  <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-300 border-t-[#004F9F]" />
                  <span className="text-xs font-bold">Memuat pratinjau...</span>
                </div>
              ) : docError ? (
                <div className="m-auto flex flex-col items-center gap-2 text-slate-400">
                  <FileText className="h-10 w-10" />
                  <span className="text-xs font-bold">Gagal memuat dokumen</span>
                </div>
                  ) : (
                <canvas
                  ref={canvasRef}
                  className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-[fadeslide_0.3s_ease-out]"
                />
              )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= Footer ================= */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
          {/* Pengingat bahwa pratinjau baru berubah setelah PDF digenerate ulang. */}
          <div className="hidden min-w-0 max-w-xl items-start gap-2 sm:flex">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#004F9F] to-[#00A5EC] text-white shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" />
            </span>
            <p className="text-[10.5px] font-semibold leading-relaxed text-slate-500">
              <span className="font-bold text-[#004F9F]">Pratinjau Perubahan</span> hanya menampilkan hasil sementara tanpa menyimpan.{" "}
              <span className="font-bold text-[#0B1442]">{sudahTerbit ? "Simpan Perubahan" : "Terbitkan Surat"}</span> yang menyimpan data sekaligus menulis ulang berkas PDF resmi.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
          {/* Hanya membuat PDF sementara — tidak menyimpan ke database */}
          <button
            type="button"
            onClick={handlePratinjau}
            disabled={pratinjauing || saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#004F9F]/30 bg-[#004F9F]/5 px-4 py-2.5 text-xs font-bold text-[#004F9F] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004F9F]/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pratinjauing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Pratinjau Perubahan
          </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="group relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shine_0.9s_ease-out]" />
              <span className="relative flex items-center gap-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : sudahTerbit ? <Save className="h-3.5 w-3.5" /> : <FileSignature className="h-3.5 w-3.5" />}
                {sudahTerbit ? "Simpan Perubahan" : "Terbitkan Surat"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratPenerimaanModal;