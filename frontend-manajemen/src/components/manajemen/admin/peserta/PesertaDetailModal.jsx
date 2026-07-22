import { useState, useEffect } from "react";
import {
  X, User, Mail, Phone, MapPin, Cake, Building2, GraduationCap,
  Calendar, FileText, Download, Loader2, Info, Sparkles, ImageIcon,
  FileCheck2, FileBadge2, Award, FileSignature, Eye, ExternalLink,
} from "lucide-react";
import { getDetailAkunPeserta } from "../../../../services/adminService";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError } from "../../../../utils/swal";

const getInitials = (nama) => (nama || "?").split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");

const isImageFile = (url) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url || "");
const isPdfFile = (url) => /\.pdf$/i.test(url || "");

const InfoRow = ({ icon: Icon, label, value, delay = 0 }) => (
  <div
    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-[#004F9F]/40 hover:shadow-md hover:-translate-y-0.5 animate-[fadeslide_0.25s_ease-out]"
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F] transition-transform duration-200 group-hover:scale-110">
      <Icon className="w-3.5 h-3.5" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700 mt-0.5 break-words">{value || "-"}</p>
    </div>
  </div>
);

const SectionCard = ({ icon: Icon, title, children, delay = 0 }) => (
  <div
    className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-slate-300/80 animate-[fadeslide_0.3s_ease-out]"
    style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
  >
    <div className="flex items-center gap-2.5 mb-1">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
        <Icon className="w-4 h-4" />
      </span>
      <h4 className="text-sm font-black text-[#0B1442]">{title}</h4>
    </div>
    {children}
  </div>
);

const docIcons = {
  file_pas_foto: ImageIcon,
  file_surat_pengantar: FileSignature,
  file_cv: FileBadge2,
  file_transkrip: Award,
  file_portofolio: FileCheck2,
  file_proposal_magang: FileText,
};

const docFields = [
  { key: "file_pas_foto", label: "Pas Foto" },
  { key: "file_surat_pengantar", label: "Surat Pengantar" },
  { key: "file_cv", label: "CV" },
  { key: "file_transkrip", label: "Transkrip/Rapor" },
  { key: "file_portofolio", label: "Portofolio" },
  { key: "file_proposal_magang", label: "Proposal Magang" },
];

// Modal preview dokumen — tampil di atas modal detail peserta
const DocumentPreviewModal = ({ doc, onClose }) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isImg = isImageFile(doc.url);
  const isPdf = isPdfFile(doc.url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white">
              <doc.Icon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-black text-[#0B1442] truncate">{doc.label}</h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] transition-all duration-200"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] transition-all duration-200"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100/60 flex items-center justify-center p-4">
          {isImg ? (
            <img src={doc.url} alt={doc.label} className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain" />
          ) : isPdf ? (
            <iframe src={doc.url} title={doc.label} className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
                <doc.Icon className="w-6 h-6" />
              </span>
              <p className="text-xs font-semibold text-slate-500">Pratinjau tidak tersedia untuk tipe file ini.</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#004F9F] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#00376e] transition-all duration-200"
              >
                <ExternalLink className="w-3 h-3" />
                Buka File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PesertaDetailModal = ({ pesertaId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && !previewDoc) onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDoc]);

  useEffect(() => {
    const t = setTimeout(() => {
      getDetailAkunPeserta(pesertaId)
        .then((res) => setData(res.data.data))
        .catch((err) => {
          toastError(err.response?.data?.message || "Gagal memuat detail peserta.");
          onClose();
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesertaId]);

  const p = data?.pendaftaran;
  const isMahasiswa = p?.kategori_pendaftar === "mahasiswa";
  const fotoUrl = getFileUrl(data?.foto_profil || p?.file_pas_foto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-[modalFadeUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-5 shrink-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <User className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.06] text-sky-300 pointer-events-none rotate-6" strokeWidth={1} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
                <User className="w-5 h-5 text-white" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-[#00A5EC]/30 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  Profil Peserta
                </div>
                <h3 className="text-sm font-black text-white leading-tight">Detail Peserta</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Data administratif dan dokumen pendaftaran</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#004F9F]" />
              Memuat detail peserta...
            </div>
          ) : !p ? (
            <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Data tidak ditemukan.</div>
          ) : (
            <div className="space-y-5">
              {/* Kartu profil */}
              <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 p-4 shadow-sm animate-[fadeslide_0.25s_ease-out]">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00A5EC]/10 blur-2xl pointer-events-none" />
                {fotoUrl ? (
                  <img src={fotoUrl} alt={p.nama_lengkap} className="relative h-16 w-16 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-200" />
                ) : (
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-lg font-black shadow-md">
                    {getInitials(p.nama_lengkap)}
                  </span>
                )}
                <div className="relative min-w-0 flex-1">
                  <p className="text-base font-black text-[#0B1442] truncate">{p.nama_lengkap}</p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    {data.email_login}
                  </p>
                </div>
                <span className="relative shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#004F9F]/15 bg-gradient-to-r from-[#0B1442]/5 via-[#004F9F]/10 to-[#00A5EC]/10 px-3 py-1.5 text-[11px] font-bold text-[#004F9F] shadow-sm">
                  <Building2 className="w-3 h-3" />
                  {p.posisi_bidang || "-"}
                </span>
              </div>

              {/* Card: Kontak & Data Diri */}
              <SectionCard icon={User} title="Kontak & Data Diri" delay={40}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  <InfoRow icon={Mail} label="Email Notifikasi" value={p.email} delay={60} />
                  <InfoRow icon={Phone} label="Nomor HP" value={p.nomor_hp} delay={80} />
                  <InfoRow icon={Cake} label="Tempat, Tanggal Lahir" value={`${p.tempat_lahir || "-"}, ${fmtDate(p.tanggal_lahir)}`} delay={100} />
                  <InfoRow icon={User} label="Jenis Kelamin" value={p.jenis_kelamin} delay={120} />
                  <InfoRow icon={MapPin} label="Alamat Lengkap" value={p.alamat_lengkap} delay={140} />
                </div>
              </SectionCard>

              {/* Card: Institusi & Periode Magang */}
              <SectionCard icon={GraduationCap} title="Institusi & Periode Magang" delay={80}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {isMahasiswa ? (
                    <>
                      <InfoRow icon={Building2} label="Asal Kampus" value={p.asal_kampus} delay={100} />
                      <InfoRow icon={GraduationCap} label="Fakultas" value={p.fakultas} delay={120} />
                      <InfoRow icon={GraduationCap} label="Program Studi" value={p.program_studi} delay={140} />
                      <InfoRow icon={FileText} label="NPM/NIM" value={p.npm_nim} delay={160} />
                      <InfoRow icon={Info} label="Semester" value={p.semester} delay={180} />
                    </>
                  ) : (
                    <>
                      <InfoRow icon={Building2} label="Asal Sekolah" value={p.asal_sekolah} delay={100} />
                      <InfoRow icon={GraduationCap} label="Jurusan" value={p.jurusan_sekolah} delay={120} />
                      <InfoRow icon={GraduationCap} label="Kelas" value={p.kelas} delay={140} />
                      <InfoRow icon={FileText} label="NISN" value={p.nisn} delay={160} />
                    </>
                  )}
                  <InfoRow icon={Calendar} label="Periode Magang" value={`${fmtDate(p.tanggal_mulai)} — ${fmtDate(p.tanggal_selesai)}`} delay={200} />
                </div>
              </SectionCard>

              {/* Card: Dokumen Pendaftaran */}
              <div
                className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md animate-[fadeslide_0.3s_ease-out]"
                style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-center justify-between gap-2.5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
                      <FileText className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-black text-[#0B1442]">Dokumen Pendaftaran</h4>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {docFields.map((doc, i) => {
                    const url = getFileUrl(p[doc.key]);
                    const DocIcon = docIcons[doc.key] || FileText;
                    return (
                      <div
                        key={doc.key}
                        onClick={() => url && setPreviewDoc({ url, label: doc.label, Icon: DocIcon })}
                        className={`group flex items-center justify-between gap-2 rounded-xl border p-3 shadow-sm transition-all duration-200 animate-[fadeslide_0.25s_ease-out] ${
                          url
                            ? "border-slate-200 bg-white hover:border-[#004F9F]/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            : "border-dashed border-slate-200 bg-slate-50/30"
                        }`}
                        style={{ animationDelay: `${160 + i * 40}ms`, animationFillMode: "backwards" }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
                            url ? "bg-gradient-to-br from-[#0B1442]/5 to-[#00A5EC]/10 text-[#004F9F] group-hover:scale-110" : "bg-slate-100 text-slate-300"
                          }`}>
                            <DocIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className={`text-xs font-semibold truncate ${url ? "text-slate-700" : "text-slate-300"}`}>{doc.label}</span>
                        </div>
                        {url ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:border-[#004F9F]/40 group-hover:text-[#004F9F] transition-all duration-200"
                              title="Lihat pratinjau"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </span>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F] hover:-translate-y-0.5 transition-all duration-200"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic shrink-0">Tidak ada</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
};

export default PesertaDetailModal;