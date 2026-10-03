import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MentorLayout from "../../layouts/MentorLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import ExportDropdown from "../../components/manajemen/shared/ExportDropdown";
import {
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  Target,
  FilePenLine,
  NotebookPen,
  Search,
  X,
  Users,
  Award,
  BarChart3,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Folders,
  LoaderCircle,
  ArrowUpRight,
  Ban,
} from "lucide-react";
import {
  getTugasMentor,
  getPengumpulanTugasMentor,
  setNilaiNolTugasMentor,
} from "../../services/pembelajaranService";
import { getFileUrl } from "../../utils/fileUrl";
import { toastSuccess, toastError, confirmDialog } from "../../utils/swal";
import { ReviewDetailModal } from "../../components/manajemen/mentor/tugas/ReviewDetailModal";

// Komponen Avatar / Inisial Mini Peserta
const PesertaMiniFoto = ({ nama, foto }) => {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = !imgError && foto ? getFileUrl(foto) : null;
  const initial = (nama || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        onError={() => setImgError(true)}
        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] text-white text-xs font-black shadow-2xs shrink-0">
      {initial}
    </span>
  );
};

// Helper format waktu pengumpulan dengan nama bulan lengkap
const formatWaktuKumpul = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const tgl = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });
  const jam = d
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", ".");
  return `${tgl}, ${jam}`;
};

const ReviewTugasMentorPage = () => {
  const { isDark } = useManajemenTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const tugasIdFromUrl = searchParams.get("tugas_id");

  const [tugasList, setTugasList] = useState([]);
  const [selectedTugasId, setSelectedTugasId] = useState(tugasIdFromUrl || "");
  const [slideDirection, setSlideDirection] = useState("next");
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const submissionsCacheRef = useRef({});

  // Statistik Keseluruhan Tugas Mentor
  const [globalStats, setGlobalStats] = useState({
    total_tugas: 0,
    tugas_aktif: 0,
    menunggu_review: 0,
    perlu_revisi: 0,
    selesai_dinilai: 0,
    total_bimbingan: 0,
  });

  // Detail tugas & data submissions aktif
  const [currentTugas, setCurrentTugas] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua"); // "semua" | "menunggu" | "tuntas" | "perlu_remidi" | "belum_kumpul"
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"

  // Modal Review
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Muat data submission tugas terpilih (dengan cache lokal untuk transisi instan dan super smooth)
  const fetchSubmissions = useCallback(async (tugasId) => {
    if (!tugasId) return;

    const cached = submissionsCacheRef.current[tugasId];
    if (cached) {
      setCurrentTugas(cached.tugas);
      setSubmissions(cached.submissions);
    } else {
      setLoadingSubmissions(true);
    }

    try {
      const res = await getPengumpulanTugasMentor(tugasId);
      const data = res.data?.data || {};
      const tData = data.tugas || null;
      const subList = data.submissions || [];
      submissionsCacheRef.current[tugasId] = { tugas: tData, submissions: subList };
      setCurrentTugas(tData);
      setSubmissions(subList);
    } catch (err) {
      console.error("Gagal memuat detail pengumpulan:", err);
      toastError("Gagal memuat pengumpulan tugas peserta");
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // Muat daftar penugasan mentor pada initial render
  useEffect(() => {
    let ignore = false;
    getTugasMentor()
      .then((res) => {
        if (ignore) return;
        const data = res.data?.data || {};
        const list = data.tugas || [];
        setTugasList(list);

        const totalBimbingan = data.total_bimbingan || 0;
        const totalTugas = data.total_tugas ?? list.length;
        const tugasAktif =
          data.tugas_aktif ??
          list.filter(
            (t) =>
              t.status_deadline === "aktif" ||
              t.status_deadline === "mendekati" ||
              t.status_deadline === "tanpa_deadline"
          ).length;
        const menungguReview =
          data.menunggu_review ??
          list.reduce(
            (acc, t) => acc + (t.pengumpulan_summary?.menunggu_review || 0),
            0
          );
        const selesaiDinilai =
          data.selesai_dinilai ??
          list.reduce(
            (acc, t) => acc + (t.pengumpulan_summary?.sudah_dinilai || 0),
            0
          );

        setGlobalStats({
          total_tugas: totalTugas,
          tugas_aktif: tugasAktif,
          menunggu_review: menungguReview,
          selesai_dinilai: selesaiDinilai,
          total_bimbingan: totalBimbingan,
        });

        // Tentukan tugas yang dibuka pertama kali:
        // 1. Jika URL memiliki parameter tugas_id dan tugas tersebut ada di daftar
        // 2. Jika tidak, prioritaskan tugas terbaru yang memiliki antrean review ("menunggu_review" > 0)
        // 3. Jika tidak ada tugas yang menunggu review, buka tugas pertama di daftar
        const tugasFromUrl = tugasIdFromUrl
          ? list.find((t) => String(t.id) === String(tugasIdFromUrl))
          : null;

        const tugasPerluReview = list.find(
          (t) => (t.pengumpulan_summary?.menunggu_review || 0) > 0
        );

        const targetTugas = tugasFromUrl || tugasPerluReview || (list.length > 0 ? list[0] : null);

        if (targetTugas) {
          setSelectedTugasId(String(targetTugas.id));
          setCurrentTugas(targetTugas);
          setSearchParams({ tugas_id: String(targetTugas.id) }, { replace: true });
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Gagal memuat tugas mentor:", err);
        toastError("Gagal memuat daftar tugas");
      });

    return () => {
      ignore = true;
    };
  }, [tugasIdFromUrl, setSearchParams]);

  // Efek memuat submissions ketika selectedTugasId berubah (didefer dengan setTimeout untuk mencegah cascading renders)
  useEffect(() => {
    if (!selectedTugasId) return;
    const timer = setTimeout(() => {
      fetchSubmissions(selectedTugasId);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedTugasId, fetchSubmissions]);

  // Handler ganti pilihan tugas dengan deteksi arah animasi
  const handleSelectTugas = (tugasId, customDir) => {
    if (customDir) {
      setSlideDirection(customDir);
    } else {
      const currentIdx = Math.max(
        0,
        tugasList.findIndex((t) => String(t.id) === String(selectedTugasId))
      );
      const targetIdx = tugasList.findIndex((t) => String(t.id) === String(tugasId));
      if (targetIdx !== -1) {
        setSlideDirection(targetIdx >= currentIdx ? "next" : "prev");
      }
    }
    const targetTugas = tugasList.find((t) => String(t.id) === String(tugasId));
    if (targetTugas) {
      setCurrentTugas(targetTugas);
    }
    setSelectedTugasId(tugasId);
    setSearchParams({ tugas_id: tugasId });
  };

  // Handler Beri Nilai 0 untuk yang belum mengumpulkan
  const handleBeriNilaiNol = async (sub) => {
    const konfirmasi = await confirmDialog({
      title: "Tetapkan Nilai 0 Poin?",
      text: `Tetapkan skor 0 poin untuk peserta ${sub.nama} karena tidak mengumpulkan tugas hingga batas waktu?`,
      confirmText: "Ya, Beri Nilai 0",
      cancelText: "Batal",
      danger: true,
      icon: "warning",
    });

    if (!konfirmasi.isConfirmed) return;

    try {
      await setNilaiNolTugasMentor({
        tugas_id: parseInt(selectedTugasId, 10),
        peserta_id: sub.peserta_id,
        catatan: "Tidak mengumpulkan tugas hingga batas waktu.",
      });
      toastSuccess(`Nilai 0 poin berhasil ditetapkan untuk ${sub.nama}`);
      fetchSubmissions(selectedTugasId);
      window.dispatchEvent(new Event("sim_notifikasi_updated"));
    } catch (err) {
      console.error("Gagal set nilai 0:", err);
      toastError("Gagal menetapkan nilai 0");
    }
  };

  const isKuis = currentTugas?.tipe_tugas === "kuis";
  const parsedKuis = useMemo(() => {
    if (!isKuis || !currentTugas?.kuis_data) return null;
    try {
      return typeof currentTugas.kuis_data === "string"
        ? JSON.parse(currentTugas.kuis_data)
        : currentTugas.kuis_data;
    } catch {
      return null;
    }
  }, [isKuis, currentTugas]);

  // Helper penghitung tenggat waktu tugas
  const getDeadlineInfo = (tenggatWaktu) => {
    if (!tenggatWaktu) return { text: "Tanpa Tenggat Waktu", isBerakhir: false, dateStr: "Fleksibel", badgeText: "Tanpa Batas" };
    const dl = new Date(tenggatWaktu);
    const now = new Date();
    const isBerakhir = now > dl;
    const diffDays = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));

    const dateStr = dl.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      dateStr,
      isBerakhir,
      badgeText: isBerakhir ? "Tenggat Berakhir" : `Sisa ${diffDays} Hari`,
    };
  };


  // Statistik Ringkas Pengumpulan (dengan fallback instan ke summary tugas agar tidak pernah kosong/flicker)
  const stats = useMemo(() => {
    if (submissions.length === 0 && currentTugas?.pengumpulan_summary) {
      const ps = currentTugas.pengumpulan_summary;
      const totalPeserta = ps.total_peserta ?? globalStats.total_bimbingan ?? 0;
      const kumpulCount = ps.total_mengumpulkan ?? 0;
      const menungguCount = ps.menunggu_review ?? 0;
      const tuntasCount = ps.sudah_dinilai ?? 0;
      const belumCount = ps.belum_mengumpulkan ?? Math.max(0, totalPeserta - kumpulCount);
      const persentase =
        ps.persentase_kumpul ??
        (totalPeserta > 0 ? Math.round((kumpulCount / totalPeserta) * 100) : 0);
      return {
        total: totalPeserta,
        kumpul: kumpulCount,
        menunggu: menungguCount,
        tuntas: tuntasCount,
        remidi: 0,
        belum: belumCount,
        avg: "-",
        persentaseKumpul: persentase,
      };
    }

    const total = submissions.length;
    let kumpul = 0;
    let menunggu = 0;
    let tuntas = 0;
    let remidi = 0;
    let belum = 0;
    let sumNilai = 0;
    let countNilai = 0;

    submissions.forEach((s) => {
      const p = s.pengumpulan;
      if (!p) {
        belum++;
      } else {
        kumpul++;
        if (p.status === "menunggu") {
          menunggu++;
        }
        if (p.nilai !== null && p.nilai !== undefined) {
          sumNilai += p.nilai;
          countNilai++;
        }
        if (
          p.status_remidi === "tuntas" ||
          (p.status === "dinilai" && (p.nilai || 0) >= (parsedKuis?.kkm || 75))
        ) {
          tuntas++;
        } else if (p.status_remidi === "perlu_remidi" || p.status === "revisi") {
          remidi++;
        }
      }
    });

    const avg = countNilai > 0 ? (sumNilai / countNilai).toFixed(1) : "-";
    const persentaseKumpul = total > 0 ? Math.round((kumpul / total) * 100) : 0;

    return { total, kumpul, menunggu, tuntas, remidi, belum, avg, persentaseKumpul };
  }, [submissions, parsedKuis, currentTugas, globalStats.total_bimbingan]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama?.toLowerCase().includes(q) ||
        s.institusi?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.posisi_bidang?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const p = s.pengumpulan;
      const kkmKuis = parsedKuis?.kkm || 75;
      if (filterStatus === "semua") return true;
      if (filterStatus === "menunggu") return p && p.status === "menunggu";
      if (filterStatus === "tuntas")
        return (
          p &&
          (p.status_remidi === "tuntas" ||
            (p.status === "dinilai" && (p.nilai || 0) >= kkmKuis))
        );
      if (filterStatus === "perlu_remidi")
        return p && (p.status_remidi === "perlu_remidi" || p.status === "revisi");
      if (filterStatus === "belum_kumpul") return !p;

      return true;
    });
  }, [submissions, search, filterStatus, parsedKuis]);

  // Ekspor Rekap Nilai ke Multi-Format (Excel, CSV, PDF)
  const handleExport = (format) => {
    if (!currentTugas || submissions.length === 0) {
      toastError("Tidak ada data pengumpulan untuk diekspor");
      return;
    }

    setExporting(true);
    setTimeout(() => {
      try {
        const kkmKuis = parsedKuis?.kkm || 75;
        const dataRows = submissions.map((sub, idx) => {
          const p = sub.pengumpulan;
          let statusTeks = "Belum Mengumpulkan";
          let ketepatanWaktu = "-";
          let waktuKumpul = "-";

          if (p) {
            if (p.status === "menunggu") statusTeks = "Menunggu Koreksi";
            else if (p.status === "revisi") statusTeks = "Perlu Revisi";
            else if (p.status === "dinilai") {
              statusTeks = (p.nilai || 0) >= kkmKuis ? "Tuntas (Lulus)" : "Perlu Remidi";
            }

            if (p.created_at) {
              waktuKumpul = new Date(p.created_at).toLocaleString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              if (currentTugas.tenggat_waktu) {
                ketepatanWaktu =
                  new Date(p.created_at) > new Date(currentTugas.tenggat_waktu)
                    ? "Terlambat"
                    : "Tepat Waktu";
              }
            }
          }

          return {
            no: idx + 1,
            nama: sub.nama || "-",
            email: sub.email || "-",
            institusi: sub.institusi || "-",
            posisi_bidang: sub.posisi_bidang || "-",
            status_pengumpulan: p ? "Sudah Mengumpulkan" : "Belum Mengumpulkan",
            waktu_kumpul: waktuKumpul,
            ketepatan: ketepatanWaktu,
            percobaan: p?.percobaan_ke || (p ? 1 : "-"),
            nilai: p?.nilai !== null && p?.nilai !== undefined ? p.nilai : "-",
            status_capaian: statusTeks,
            catatan_mentor: p?.catatan_mentor || "-",
          };
        });

        const safeJudul = (currentTugas.judul || "tugas")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 30);
        const dateStamp = new Date().toISOString().slice(0, 10);

        if (format === "excel") {
          const excelRows = dataRows.map((d) => ({
            No: d.no,
            "Nama Peserta": d.nama,
            Email: d.email,
            "Asal Institusi / Kampus": d.institusi,
            "Posisi / Bidang": d.posisi_bidang,
            "Status Pengumpulan": d.status_pengumpulan,
            "Waktu Pengumpulan": d.waktu_kumpul,
            "Ketepatan Waktu": d.ketepatan,
            "Percobaan Ke": d.percobaan,
            "Nilai Akhir": d.nilai,
            "Status Capaian": d.status_capaian,
            "Catatan Mentor": d.catatan_mentor,
          }));
          const worksheet = XLSX.utils.json_to_sheet(excelRows);
          worksheet["!cols"] = [
            { wch: 6 },
            { wch: 28 },
            { wch: 24 },
            { wch: 26 },
            { wch: 22 },
            { wch: 22 },
            { wch: 22 },
            { wch: 16 },
            { wch: 14 },
            { wch: 12 },
            { wch: 18 },
            { wch: 35 },
          ];
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Penilaian");
          XLSX.writeFile(workbook, `rekap-nilai-${safeJudul}-${dateStamp}.xlsx`);
          toastSuccess("Rekap penilaian tugas berhasil diekspor ke Excel (.xlsx)");
        } else if (format === "csv") {
          const csvHeaders = [
            "No",
            "Nama Peserta",
            "Email",
            "Asal Institusi / Kampus",
            "Posisi / Bidang",
            "Status Pengumpulan",
            "Waktu Pengumpulan",
            "Ketepatan Waktu",
            "Percobaan Ke",
            "Nilai Akhir",
            "Status Capaian",
            "Catatan Mentor",
          ];
          const escapeCsv = (val) => {
            const str = String(val ?? "-");
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          };
          const csvRows = dataRows.map((d) => [
            d.no,
            d.nama,
            d.email,
            d.institusi,
            d.posisi_bidang,
            d.status_pengumpulan,
            d.waktu_kumpul,
            d.ketepatan,
            d.percobaan,
            d.nilai,
            d.status_capaian,
            d.catatan_mentor,
          ]);
          const csvContent = [csvHeaders, ...csvRows]
            .map((r) => r.map(escapeCsv).join(","))
            .join("\n");
          const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `rekap-nilai-${safeJudul}-${dateStamp}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toastSuccess("Rekap penilaian tugas berhasil diekspor ke CSV (.csv)");
        } else if (format === "pdf") {
          const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
          const pageWidth = doc.internal.pageSize.getWidth();

          doc.setFillColor(11, 20, 66);
          doc.rect(0, 0, pageWidth, 52, "F");

          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("REKAP EVALUASI & PENILAIAN TUGAS MAGANG", 36, 26);

          doc.setFontSize(8.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(200, 220, 255);
          doc.text(
            `Tugas: ${currentTugas.judul || "-"}  ·  Tipe: ${currentTugas.tipe_tugas === "kuis" ? "Kuis Interaktif" : "Penugasan Proyek"}  ·  Dinas Komunikasi dan Informatika`,
            36,
            42
          );

          const tglCetak = new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Dicetak pada: ${tglCetak}  |  Total Peserta: ${stats.total}  |  Mengumpulkan: ${stats.kumpul}  |  Tuntas: ${stats.tuntas}  |  Remidi: ${stats.remidi}  |  Rata-rata Skor: ${stats.avg}`,
            36,
            70
          );

          const pdfHeaders = [
            "No",
            "Nama Peserta",
            "Institusi",
            "Bidang",
            "Status Kumpul",
            "Waktu Kumpul",
            "Ketepatan",
            "Nilai",
            "Capaian",
            "Catatan Mentor",
          ];

          const pdfBody = dataRows.map((d) => [
            d.no,
            d.nama,
            d.institusi,
            d.posisi_bidang,
            d.status_pengumpulan,
            d.waktu_kumpul,
            d.ketepatan,
            d.nilai,
            d.status_capaian,
            d.catatan_mentor,
          ]);

          autoTable(doc, {
            startY: 80,
            margin: { left: 36, right: 36 },
            head: [pdfHeaders],
            body: pdfBody,
            theme: "striped",
            headStyles: {
              fillColor: [11, 20, 66],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7.5,
              halign: "center",
              cellPadding: 4,
            },
            styles: {
              fontSize: 7,
              cellPadding: 3.5,
              textColor: [30, 41, 59],
              overflow: "linebreak",
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
              0: { cellWidth: 24, halign: "center" },
              1: { cellWidth: 90 },
              2: { cellWidth: 80 },
              3: { cellWidth: 70 },
              4: { cellWidth: 65, halign: "center" },
              5: { cellWidth: 75, halign: "center" },
              6: { cellWidth: 55, halign: "center" },
              7: { cellWidth: 35, halign: "center", fontStyle: "bold" },
              8: { cellWidth: 65, halign: "center" },
              9: { cellWidth: "auto" },
            },
          });

          doc.save(`rekap-nilai-${safeJudul}-${dateStamp}.pdf`);
          toastSuccess("Rekap penilaian tugas berhasil diekspor ke PDF (.pdf)");
        }
      } catch (err) {
        console.error("Gagal mengekspor data:", err);
        toastError("Gagal mengekspor data penugasan");
      } finally {
        setExporting(false);
      }
    }, 0);
  };

  // Indeks tugas terpilih di daftar tugas
  const currentTugasIndex = Math.max(
    0,
    tugasList.findIndex((t) => String(t.id) === String(selectedTugasId))
  );

  // Handler geser ke tugas sebelumnya
  const handlePrevTugas = () => {
    if (tugasList.length <= 1) return;
    if (currentTugasIndex > 0) {
      handleSelectTugas(String(tugasList[currentTugasIndex - 1].id), "prev");
    }
  };

  // Handler geser ke tugas selanjutnya
  const handleNextTugas = () => {
    if (tugasList.length <= 1) return;
    if (currentTugasIndex < tugasList.length - 1) {
      handleSelectTugas(String(tugasList[currentTugasIndex + 1].id), "next");
    }
  };

  // Jumlah tugas berdasarkan tipe tugas (Proyek vs Kuis)
  const tipeCounts = useMemo(() => {
    let proyek = 0;
    let kuis = 0;
    tugasList.forEach((t) => {
      if (t.tipe_tugas === "kuis") {
        kuis++;
      } else {
        proyek++;
      }
    });
    return { proyek, kuis };
  }, [tugasList]);

  // 5 Kartu Statistik Konsisten dengan Halaman Kelola Penugasan
  const statCards = useMemo(
    () => [
      {
        id: "target",
        icon: Users,
        label: "Target Bimbingan",
        value: stats.total,
        suffix: "Peserta",
        lightGradient: "from-blue-300 to-white",
        gradient: "from-[#004F9F] to-[#0B1442]",
        iconBg: isDark ? "bg-blue-950/60 text-sky-400" : "bg-blue-50 text-blue-600",
        colSpan: "",
      },
      {
        id: "menunggu",
        icon: Clock,
        label: "Perlu Dinilai",
        value: stats.menunggu,
        suffix: "Pengumpulan",
        lightGradient: "from-amber-300 to-white",
        gradient: "from-amber-500 to-amber-700",
        iconBg: isDark ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600",
        colSpan: "",
      },
      {
        id: "tuntas",
        icon: CheckCircle2,
        label: "Tuntas (≥ KKM)",
        value: stats.tuntas,
        suffix: "Lulus",
        lightGradient: "from-emerald-300 to-white",
        gradient: "from-emerald-500 to-emerald-700",
        iconBg: isDark ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600",
        colSpan: "",
      },
      {
        id: "remidi",
        icon: RotateCcw,
        label: isKuis ? "Perlu Remidi" : "Menunggu Revisi",
        value: stats.remidi,
        suffix: isKuis ? "Remidi" : "Revisi",
        lightGradient: "from-rose-300 to-white",
        gradient: "from-rose-500 to-rose-700",
        iconBg: isDark ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600",
        colSpan: "",
      },
      {
        id: "avg",
        icon: BarChart3,
        label: "Rata-rata Skor",
        value: stats.avg,
        suffix: "Poin",
        lightGradient: "from-sky-300 to-white",
        gradient: "from-[#004F9F] to-[#00A5EC]",
        iconBg: isDark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-[#004F9F]",
        colSpan: "col-span-2 sm:col-span-1",
      },
    ],
    [stats, isDark, isKuis]
  );

  return (
    <MentorLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out] pb-10 overflow-x-clip">
        {/* ── 1. HEADER HALAMAN: Konsisten dengan Halaman Kelola Tugas ── */}
        {/* ── 1. HEADER HALAMAN: Konsisten dengan Halaman Kelola Tugas ── */}
        <div>
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? "text-slate-100" : "text-[#0B1442]"
            }`}
          >
            Review &amp; Penilaian Tugas
          </h2>
          <p
            className={`mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Pantau dan evaluasi hasil pengerjaan tugas proyek maupun kuis interaktif peserta bimbingan secara mendalam dan terstruktur.
          </p>
        </div>

        {/* ── 2. KOTAK PEMBUNGKUS UTAMA: MENYATUKAN PENUGASAN SLIDE & KONTROL NAVIGASI ── */}
        <div
          className={`p-2.5 sm:p-3 rounded-[28px] sm:rounded-[32px] border transition-all ${
            isDark
              ? "bg-[#111622]/90 border-white/10 shadow-sm"
              : "bg-slate-100/70 border-slate-200/90 shadow-2xs"
          } space-y-2.5 sm:space-y-3`}
        >
          {tugasList && tugasList.length > 0 ? (
            <>
              {/* Kotak Penugasan Aktif yang Meluncur/Slide Utuh Beserta Kotaknya dengan Jalur Karusel Kontinu */}
              <div className="overflow-hidden rounded-2xl sm:rounded-[24px]">
                <div
                  className="flex items-stretch transition-transform duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                  style={{
                    transform: `translate3d(-${currentTugasIndex * 100}%, 0, 0)`,
                  }}
                >
                  {tugasList.map((tugasItem, idx) => {
                    const isItemKuis = tugasItem.tipe_tugas === "kuis";
                    let itemParsedKuis = null;
                    if (isItemKuis && tugasItem.kuis_data) {
                      try {
                        itemParsedKuis =
                          typeof tugasItem.kuis_data === "string"
                            ? JSON.parse(tugasItem.kuis_data)
                            : tugasItem.kuis_data;
                      } catch {
                        itemParsedKuis = null;
                      }
                    }
                    const itemDeadline = getDeadlineInfo(tugasItem.tenggat_waktu);
                    const isCurrent = idx === currentTugasIndex;
                    const totalPeserta =
                      tugasItem.pengumpulan_summary?.total_peserta ??
                      globalStats.total_bimbingan ??
                      0;
                    const totalKumpul =
                      tugasItem.pengumpulan_summary?.total_mengumpulkan ?? 0;
                    const itemStats =
                      isCurrent && submissions.length > 0
                        ? stats
                        : {
                            total: totalPeserta,
                            kumpul: totalKumpul,
                            persentaseKumpul:
                              tugasItem.pengumpulan_summary?.persentase_kumpul ??
                              (totalPeserta > 0
                                ? Math.round((totalKumpul / totalPeserta) * 100)
                                : 0),
                          };

                    return (
                      <div key={tugasItem.id} className="w-full shrink-0 min-w-full flex">
                        <div
                          className={`w-full relative overflow-hidden rounded-2xl sm:rounded-[24px] border shadow-xs transition-all duration-300 ${
                            isDark
                              ? "bg-[#161b22] border-white/10"
                              : "bg-white border-slate-200/90 shadow-2xs"
                          }`}
                        >
                          {/* Ambient Glow Subtle */}
                          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                            {/* ── KOLOM KIRI (lg:col-span-7 xl:col-span-8): Detail Tugas Aktif + Parameter Metrik ── */}
                            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-4">
                              {/* Bagian Atas: Ikon, Badges, Judul, Deskripsi */}
                              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                                <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br from-[#0B1442] to-[#00A5EC] shadow-blue-500/20">
                                  {isItemKuis ? (
                                    <NotebookPen className="w-6 h-6 text-white" strokeWidth={2.2} />
                                  ) : (
                                    <FilePenLine className="w-6 h-6 text-white" strokeWidth={2.2} />
                                  )}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    {/* Badge Tipe Tugas */}
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/60 dark:to-slate-900/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/90 dark:border-blue-800/60 shadow-2xs">
                                      {isItemKuis ? (
                                        <NotebookPen className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                                      ) : (
                                        <FilePenLine className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                                      )}
                                      <span>{isItemKuis ? "Tugas Kuis Interaktif" : "Tugas Proyek / Berkas"}</span>
                                    </span>

                                    {/* Badge Tenggat Waktu */}
                                    {tugasItem.tenggat_waktu && (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                          itemDeadline.isBerakhir
                                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        }`}
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{itemDeadline.badgeText}</span>
                                      </span>
                                    )}
                                  </div>

                                  <h3
                                    className={`text-base sm:text-lg font-black leading-tight ${
                                      isDark ? "text-slate-100" : "text-[#0B1442]"
                                    }`}
                                  >
                                    {tugasItem.judul}
                                  </h3>

                                  {tugasItem.deskripsi && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                      {tugasItem.deskripsi}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Bagian Bawah Kolom Kiri: 4 Parameter Metrik Tersusun Rapi */}
                              {isItemKuis ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {/* Standar KKM */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30 shrink-0">
                                      <Target className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Standar KKM
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                        {itemParsedKuis?.kkm ?? 75} Poin
                                      </span>
                                    </div>
                                  </div>

                                  {/* Butir Soal */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-blue-800/30 shrink-0">
                                      <NotebookPen className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Butir Soal
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                        {itemParsedKuis?.daftar_soal?.length ?? 0} Soal
                                      </span>
                                    </div>
                                  </div>

                                  {/* Waktu Ujian */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 shrink-0">
                                      <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Waktu Ujian
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                        {itemParsedKuis?.durasi_menit ?? 30} Menit
                                      </span>
                                    </div>
                                  </div>

                                  {/* Opsi Remidi */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div
                                      className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 border ${
                                        itemParsedKuis?.izinkan_remidi
                                          ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30"
                                          : "bg-slate-200/50 dark:bg-white/5 text-slate-400 border-slate-200/60 dark:border-white/10"
                                      }`}
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Opsi Remidi
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                        {itemParsedKuis?.izinkan_remidi
                                          ? itemParsedKuis.maks_percobaan
                                            ? `${itemParsedKuis.maks_percobaan}x Coba`
                                            : "Aktif"
                                          : "Nonaktif"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {/* Bobot Nilai */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-sky-500/15 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-blue-800/30 shrink-0">
                                      <Award className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Bobot Nilai
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                        {tugasItem.bobot_nilai || 100} Poin
                                      </span>
                                    </div>
                                  </div>

                                  {/* Target Peserta */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/30 shrink-0">
                                      <Users className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Sasaran
                                      </span>
                                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100 capitalize truncate">
                                        {tugasItem.target_peserta?.replace("_", " ") || "Semua"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* File Lampiran Acuan */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30 shrink-0">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Lampiran
                                      </span>
                                      <div className="mt-0.5">
                                        {tugasItem.file_lampiran ? (
                                          <a
                                            href={getFileUrl(tugasItem.file_lampiran)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition-all duration-200 shadow-2xs hover:shadow-xs hover:scale-[1.03] active:scale-[0.97] group/btn ${
                                              isDark
                                                ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-400/50"
                                                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/90 hover:border-rose-300"
                                            }`}
                                            title="Buka atau unduh berkas lampiran acuan tugas"
                                          >
                                            <span>Buka Berkas</span>
                                            <ArrowUpRight className="w-3 h-3 text-rose-500 dark:text-rose-400 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                          </a>
                                        ) : (
                                          <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                                            Tidak Ada
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Tautan Luaran */}
                                  <div
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 min-w-0 transition-all ${
                                      isDark ? "bg-slate-900/40 border-white/5" : "bg-slate-50/70 border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30 shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                        Tautan
                                      </span>
                                      <div className="mt-0.5">
                                        {tugasItem.tautan_eksternal ? (
                                          <a
                                            href={
                                              /^https?:\/\//i.test(tugasItem.tautan_eksternal)
                                                ? tugasItem.tautan_eksternal
                                                : `https://${tugasItem.tautan_eksternal}`
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition-all duration-200 shadow-2xs hover:shadow-xs hover:scale-[1.03] active:scale-[0.97] group/btn ${
                                              isDark
                                                ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50"
                                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 hover:border-emerald-300"
                                            }`}
                                            title="Kunjungi tautan eksternal acuan tugas"
                                          >
                                            <span>Buka Tautan</span>
                                            <ArrowUpRight className="w-3 h-3 text-emerald-500 dark:text-emerald-400 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                          </a>
                                        ) : (
                                          <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                                            Tidak Ada
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── KOLOM KANAN: Panel Progres Pengumpulan Bimbingan (Warna Biru, Ringkas) ── */}
                            <div
                              className={`lg:col-span-5 xl:col-span-4 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                                isDark
                                  ? "bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-blue-950/20 border-blue-800/50 shadow-xs"
                                  : "bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-blue-50/30 border-blue-200/90 shadow-2xs"
                              }`}
                            >
                              <div>
                                {/* Header Panel Progres */}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 text-xs min-w-0">
                                    <LoaderCircle className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                    <span className="font-bold text-[#004F9F] dark:text-[#00A5EC] truncate">
                                      Progres Pengumpulan
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#004F9F] text-white dark:bg-[#00A5EC] dark:text-[#0B1442] shadow-2xs shrink-0">
                                    {itemStats.persentaseKumpul}% Terkumpul
                                  </span>
                                </div>

                                {/* Angka Besar Statistik Kumpul */}
                                <div className="flex items-baseline gap-1.5 my-0.5">
                                  <span className="text-xl sm:text-2xl font-black text-[#0B1442] dark:text-white">
                                    {itemStats.kumpul}
                                  </span>
                                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    / {itemStats.total} Peserta Terdaftar
                                  </span>
                                </div>

                                {/* Progress Bar Gradient */}
                                <div className="relative h-2 w-full rounded-full bg-blue-100/80 dark:bg-white/10 overflow-hidden my-1.5">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#0B1442] via-[#004F9F] to-[#00A5EC] transition-all duration-500 shadow-xs"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, itemStats.persentaseKumpul))}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Info Batas Tenggat di Dasar Panel */}
                              <div className="pt-2 border-t border-blue-200/60 dark:border-white/5 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3 text-[#004F9F] dark:text-[#00A5EC]" />
                                  <span>Batas Waktu:</span>
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate ml-1">
                                  {itemDeadline.dateStr || "Fleksibel"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

        {/* ── Kolom/Bagian yang Berada di Bawah Sendiri (Statik, Tetap Bersatu dalam Kotak Pembungkus) ── */}
        <div
          className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
            isDark
              ? "bg-[#161b22] border-white/10 shadow-xs"
              : "bg-white border-slate-200/80 shadow-2xs"
          }`}
        >
          {/* Sisi Kiri: Ringkasan Total & Tipe Penugasan */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Batch Total */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                isDark
                  ? "bg-white/[0.03] border-white/10 text-slate-300"
                  : "bg-white border-slate-200/80 text-slate-700 shadow-2xs"
              }`}
            >
              <Folders className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Total:</span>
              <span className="font-black text-slate-800 dark:text-slate-100">{globalStats.total_tugas} Tugas</span>
            </div>

            {/* Batch Proyek */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                isDark
                  ? "bg-white/[0.03] border-white/10 text-slate-300"
                  : "bg-white border-slate-200/80 text-slate-700 shadow-2xs"
              }`}
            >
              <FilePenLine className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Proyek:</span>
              <span className="font-black text-slate-800 dark:text-slate-100">{tipeCounts.proyek} Tugas</span>
            </div>

            {/* Batch Kuis */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                isDark
                  ? "bg-white/[0.03] border-white/10 text-slate-300"
                  : "bg-white border-slate-200/80 text-slate-700 shadow-2xs"
              }`}
            >
              <NotebookPen className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC]" />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Kuis:</span>
              <span className="font-black text-slate-800 dark:text-slate-100">{tipeCounts.kuis} Tugas</span>
            </div>
          </div>

          {/* Sisi Kanan: Kontrol Navigasi Tugas Terpadu */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Badge Indikator Tugas X dari Y + Dot Slider */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xs transition-all ${
                isDark
                  ? "bg-slate-900/60 border-white/10"
                  : "bg-white border-slate-200/90 shadow-2xs"
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Tugas <span className="font-black text-[#004F9F] dark:text-[#00A5EC]">{currentTugasIndex + 1}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{tugasList.length}</span>
              </span>

              {tugasList.length > 1 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
                  {tugasList.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTugas(String(t.id))}
                      className={`h-2 rounded-full transition-all duration-500 ease-out cursor-pointer ${
                        idx === currentTugasIndex
                          ? "w-6 bg-[#004F9F] dark:bg-[#00A5EC] shadow-xs"
                          : "w-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400"
                      }`}
                      title={`Pindah ke tugas: ${t.judul}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Sebelumnya & Selanjutnya */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevTugas}
                disabled={currentTugasIndex <= 0}
                className={`flex h-8.5 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ease-out cursor-pointer shadow-2xs hover:scale-[1.03] active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none ${
                  isDark
                    ? "border-white/10 bg-[#161b22] text-slate-300 hover:text-white hover:border-[#00A5EC]/40 hover:bg-white/5"
                    : "border-slate-200/90 bg-white text-slate-700 hover:text-[#004F9F] hover:border-[#004F9F]/30 hover:bg-slate-50"
                }`}
                title="Geser ke tugas sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={handleNextTugas}
                disabled={currentTugasIndex >= tugasList.length - 1}
                className={`flex h-8.5 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ease-out cursor-pointer shadow-2xs hover:scale-[1.03] active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none ${
                  isDark
                    ? "border-white/10 bg-[#161b22] text-slate-300 hover:text-white hover:border-[#00A5EC]/40 hover:bg-white/5"
                    : "border-slate-200/90 bg-white text-slate-700 hover:text-[#004F9F] hover:border-[#004F9F]/30 hover:bg-slate-50"
                }`}
                title="Geser ke tugas berikutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
            </>
          ) : (
            <div
              className={`p-8 text-center text-xs font-semibold text-slate-400 rounded-3xl border ${
                isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/90 shadow-2xs"
              }`}
            >
              Tidak ada data penugasan untuk ditampilkan.
            </div>
          )}
        </div>

        {/* ── KONTEN DINAMIS EVALUASI PENUGASAN (DILENGKAPI ANIMASI HALUS MENGIKUTI ARAH NAVIGASI) ── */}
        <div
          key={selectedTugasId}
          className={`space-y-5 sm:space-y-6 ${
            slideDirection === "next"
              ? "animate-[contentSlideInRight_0.68s_cubic-bezier(0.16,1,0.3,1)_both]"
              : "animate-[contentSlideInLeft_0.68s_cubic-bezier(0.16,1,0.3,1)_both]"
          }`}
        >
          {/* ── 3. METRIC KPI CARDS (RINGKASAN STATISTIK KONSISTEN DENGAN DAFTAR TUGAS) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3.5">
            {statCards.map((c) => (
              <div
                key={c.id}
                className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-xs sm:shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between ${
                  c.colSpan
                } ${
                  isDark
                    ? "border-white/10 bg-[#161b22]"
                    : `border-slate-200 bg-gradient-to-br ${c.lightGradient}`
                }`}
              >
                <div
                  className={`absolute -right-8 -top-8 sm:-right-10 sm:-top-10 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br ${c.gradient} blur-xl transition-all duration-300 group-hover:scale-125 ${
                    isDark ? "opacity-[0.16] group-hover:opacity-[0.26]" : "opacity-[0.3] group-hover:opacity-[0.4]"
                  }`}
                />
                <div className="relative flex items-start justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] sm:text-xs font-bold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {c.label}
                    </p>
                    <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1.5">
                      <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        {c.value}
                      </h3>
                      <span className={`text-[10px] sm:text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {c.suffix}
                      </span>
                    </div>
                </div>
                <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${c.iconBg}`}>
                  <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 sm:h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r ${c.gradient} transition-transform duration-500 group-hover:scale-x-100`} />
            </div>
          ))}
        </div>

        {/* ── 4. TOOLBAR KONTROL (FILTER, SEARCH, TOGGLE VIEW, & EXPORT) DENGAN KOTAK RAMPING SEPERTI MATERI PEMBELAJARAN ── */}
        <div
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border shadow-xs transition-all duration-300 ${
            isDark
              ? "border-white/10 bg-[#161b22]"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
            {/* Tab Filter Status (Style Identik Halaman Materi Pembelajaran dengan ruang padding hover) */}
            <div className="flex items-center gap-1.5 overflow-x-auto xl:overflow-x-visible py-1.5 custom-scrollbar">
              {[
                { key: "semua", label: "Semua", count: stats.total },
                { key: "menunggu", label: "Perlu Dinilai", count: stats.menunggu },
                { key: "tuntas", label: "Tuntas", count: stats.tuntas },
                { key: "perlu_remidi", label: isKuis ? "Perlu Remidi" : "Menunggu Revisi", count: stats.remidi },
                { key: "belum_kumpul", label: "Belum Kumpul", count: stats.belum },
              ].map((tab) => {
                const isAktif = filterStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterStatus(tab.key)}
                    className={`group inline-flex h-7.5 sm:h-8 items-center gap-1.5 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all duration-300 ease-out cursor-pointer select-none ${
                      isAktif
                        ? isDark
                          ? "bg-[#00A5EC]/15 text-white border-2 border-[#00A5EC] shadow-xs"
                          : "bg-blue-50/80 text-[#004F9F] border-2 border-[#004F9F] shadow-xs"
                        : isDark
                        ? "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border-2 border-white/5 hover:border-white/15"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-2 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    } hover:-translate-y-0.5 active:scale-95`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black transition-colors duration-300 ease-out ${
                        isAktif
                          ? isDark
                            ? "bg-[#00A5EC] text-slate-950 shadow-2xs"
                            : "bg-[#004F9F] text-white shadow-2xs"
                          : isDark
                          ? "bg-white/10 text-sky-400 border border-white/10"
                          : "bg-white/90 text-[#004F9F] border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sisi Kanan: Search Bar, Toggle View, Tombol Ekspor (Ukuran Kompak) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1.5">
              {/* Search Input dengan Focus Line & Efek Interaktif (Ukuran Kompak) */}
              <div
                className={`group relative flex-1 sm:w-48 md:w-56 sm:flex-initial transition-transform duration-200 ${
                  isSearchFocused ? "scale-[1.005]" : ""
                }`}
              >
                <Search
                  className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 pointer-events-none ${
                    isSearchFocused
                      ? isDark
                        ? "text-[#00A5EC] scale-110"
                        : "text-[#004F9F] scale-110"
                      : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Cari peserta / kampus..."
                  className={`w-full h-7.5 sm:h-8 rounded-xl border pl-8 sm:pl-8.5 pr-7 text-[11px] font-medium outline-hidden transition-all duration-200 ${
                    isDark
                      ? isSearchFocused
                        ? "border-[#00A5EC] bg-white/[0.07] text-slate-100 shadow-md ring-3 ring-[#00A5EC]/20"
                        : "border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 hover:border-white/20"
                      : isSearchFocused
                        ? "border-[#004F9F] bg-white shadow-md ring-3 ring-[#00A5EC]/15 text-slate-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 placeholder-slate-400 hover:border-slate-300 hover:bg-white"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer animate-[fadeslide_0.15s_ease-out] ${
                      isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Hapus Pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-gradient-to-r from-[#0B1442] to-[#00A5EC] transition-all duration-300 ease-out ${
                    isSearchFocused ? "w-[calc(100%-10px)] -translate-x-1/2" : "w-0 -translate-x-1/2"
                  }`}
                />
              </div>

              {/* Toggle Table vs Grid (Ukuran Kompak) */}
              <div
                className={`flex items-center h-7.5 sm:h-8 p-0.5 rounded-xl border shrink-0 ${
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-100/70 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Tabel"
                  aria-label="Tampilan Tabel"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#004F9F] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  }`}
                  title="Tampilan Grid Kartu"
                  aria-label="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tombol Ekspor Multi-Format (Ukuran Kompak) */}
              <div className={`shrink-0 ${submissions.length === 0 || exporting ? "pointer-events-none opacity-50" : ""}`}>
                <ExportDropdown onExport={handleExport} isDark={isDark} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. DAFTAR PENGUMPULAN PESERTA (TABEL / KARTU) ── */}
        {loadingSubmissions && submissions.length === 0 ? (
          <div
            className={`p-16 rounded-3xl border text-center space-y-3 ${
              isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/90 shadow-2xs"
            }`}
          >
            <div className="h-8 w-8 mx-auto rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">
              Memuat pengumpulan tugas peserta...
            </p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div
            className={`p-12 rounded-3xl border text-center space-y-3 ${
              isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200 shadow-2xs"
            }`}
          >
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tidak ada data peserta ditemukan
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `Tidak ada peserta yang cocok dengan kata kunci "${search}"`
                : "Belum ada peserta bimbingan yang masuk dalam kriteria filter ini."}
            </p>
          </div>
        ) : (
          <div
            key={viewMode}
            className="transition-all duration-300 animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            {viewMode === "table" ? (
              /* ── TAMPILAN TABEL MODERN (DATA TABLE VIEW) ── */
              <div
                className={`rounded-3xl border overflow-hidden shadow-2xs transition-all duration-300 ${
                  isDark ? "bg-[#161b22] border-white/10" : "bg-white border-slate-200/90"
                }`}
              >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-black uppercase tracking-wider ${
                      isDark
                        ? "border-white/10 bg-white/[0.02] text-slate-400"
                        : "border-slate-100 bg-slate-50/70 text-slate-500"
                    }`}
                  >
                    <th className="py-3.5 px-4 sm:px-6">Peserta Bimbingan</th>
                    <th className="py-3.5 px-4">Waktu &amp; Ketepatan</th>
                    <th className="py-3.5 px-4">
                      {isKuis ? "Hasil Pengerjaan Kuis" : "Hasil Penyerahan Proyek"}
                    </th>
                    <th className="py-3.5 px-4">Nilai &amp; Ketuntasan</th>
                    <th className="py-3.5 px-4">Catatan Mentor</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {filteredSubmissions.map((sub) => {
                    const p = sub.pengumpulan;
                    const hasSubmitted = !!p;
                    const isSudahDinilai = p?.status === "dinilai";
                    const isRevisiSub = p?.status === "revisi";
                    const isTuntasSub =
                      p?.status_remidi === "tuntas" ||
                      (isSudahDinilai && (p?.nilai || 0) >= (parsedKuis?.kkm || 75));
                    const isRemidiSub =
                      p?.status_remidi === "perlu_remidi" || isRevisiSub;

                    // Cek ketepatan waktu
                    const isTerlambat =
                      p?.created_at &&
                      currentTugas?.tenggat_waktu &&
                      new Date(p.created_at) > new Date(currentTugas.tenggat_waktu);

                    const waktuKumpulStr = formatWaktuKumpul(p?.created_at);

                    return (
                      <tr
                        key={sub.peserta_id}
                        className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]`}
                      >
                        {/* 1. Profil Peserta */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <PesertaMiniFoto nama={sub.nama} foto={sub.foto_profil} />
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 dark:text-slate-100 truncate">
                                {sub.nama}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {sub.institusi}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Waktu Kumpul & Status Waktu */}
                        <td className="py-4 px-4">
                          {hasSubmitted ? (
                            <div className="space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                {waktuKumpulStr}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${
                                    isTerlambat
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  }`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{isTerlambat ? "Terlambat" : "Tepat Waktu"}</span>
                                </span>

                                {p.percobaan_ke && p.percobaan_ke > 1 && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                    Ke-{p.percobaan_ke}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                              Belum Kumpul
                            </span>
                          )}
                        </td>

                        {/* 3. Hasil Pengerjaan (Lampiran / Dokumen / Kuis) */}
                        <td className="py-4 px-4">
                          {hasSubmitted ? (
                            isKuis ? (
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/80 dark:border-blue-800/40 shrink-0">
                                  <NotebookPen className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                                    Lembar Kuis Terkirim
                                  </span>
                                  <span className="text-[10.5px] text-slate-400 font-medium">
                                    {parsedKuis?.daftar_soal?.length || 0} Soal Diserahkan
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* File Berkas / Laporan Proyek */}
                                {p.file_pengumpulan && (
                                  <a
                                    href={getFileUrl(p.file_pengumpulan)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group/file inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all text-left shadow-2xs cursor-pointer"
                                    title={`Buka file: ${p.file_pengumpulan.split("/").pop()}`}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] group-hover/file:text-[#004F9F] dark:group-hover/file:text-sky-300">
                                      File Tugas
                                    </span>
                                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/file:text-[#004F9F] shrink-0 transition-transform group-hover/file:translate-x-0.5 group-hover/file:-translate-y-0.5" />
                                  </a>
                                )}

                                {/* Tautan Proyek / Demo / GitHub */}
                                {p.link_tugas && (
                                  <a
                                    href={p.link_tugas}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group/link inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-200/80 dark:border-sky-800/40 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-100/80 dark:hover:bg-sky-900/40 transition-all text-left shadow-2xs cursor-pointer"
                                    title={`Buka tautan: ${p.link_tugas}`}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                    <span className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">
                                      Link Tugas
                                    </span>
                                    <ArrowUpRight className="w-3 h-3 text-sky-500 shrink-0 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                                  </a>
                                )}

                                {!p.file_pengumpulan && !p.link_tugas && (
                                  <span className="text-slate-400 text-xs italic">
                                    Tugas Terkirim (Tanpa Lampiran)
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-medium bg-slate-100/80 text-slate-400 dark:bg-white/5 dark:text-slate-500 border border-slate-200/50 dark:border-white/5">
                              Belum Ada Berkas
                            </span>
                          )}
                        </td>

                        {/* 4. Nilai & Status Capaian */}
                        <td className="py-4 px-4">
                          {hasSubmitted ? (
                            <div className="space-y-1">
                              <span
                                className={`text-base font-black block ${
                                  isRevisiSub
                                    ? "text-amber-600 dark:text-amber-400"
                                    : p.nilai !== null && p.nilai !== undefined
                                    ? isTuntasSub
                                      ? "text-emerald-700 dark:text-emerald-400"
                                      : isRemidiSub
                                      ? "text-amber-700 dark:text-amber-400"
                                      : p.nilai === 0
                                      ? "text-rose-700 dark:text-rose-400"
                                      : "text-slate-800 dark:text-slate-200"
                                    : "text-slate-400"
                                }`}
                              >
                                {isRevisiSub
                                  ? (isKuis ? "Perlu Remidi" : "Menunggu Revisi")
                                  : p.nilai !== null && p.nilai !== undefined
                                  ? `${p.nilai} Poin`
                                  : "Belum Dinilai"}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] font-black ${
                                  isRevisiSub
                                    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40"
                                    : isSudahDinilai
                                    ? isTuntasSub
                                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40"
                                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40"
                                    : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40"
                                }`}
                              >
                                {isRevisiSub ? (
                                  <>
                                    <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span>{isKuis ? "Perlu Remidi" : "Menunggu Revisi"}</span>
                                  </>
                                ) : isSudahDinilai ? (
                                  isTuntasSub ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>{isKuis ? "Lulus / Tuntas" : "Tuntas / Disetujui"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                      <span>Belum Tuntas</span>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span>Perlu Dinilai</span>
                                  </>
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 block">
                                -
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                                Belum Kumpul
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 5. Catatan Mentor Snippet */}
                        <td className="py-4 px-4 max-w-[200px]">
                          {p?.catatan_mentor ? (
                            <div className="p-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                              <p
                                className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic"
                                title={p.catatan_mentor}
                              >
                                "{p.catatan_mentor}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              Tidak ada catatan
                            </span>
                          )}
                        </td>

                        {/* 6. Aksi Evaluasi */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {hasSubmitted ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setModalOpen(true);
                              }}
                              className="group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/80 dark:bg-sky-950/40 text-[#004F9F] dark:text-sky-300 hover:bg-[#004F9F] hover:text-white dark:hover:bg-[#004F9F] dark:hover:text-white text-xs font-black shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110" />
                              <span>{isRevisiSub ? "Tinjau Revisi" : isSudahDinilai ? "Edit Nilai" : "Koreksi & Nilai"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBeriNilaiNol(sub)}
                              className="group/btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/90 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                              title="Tetapkan nilai 0 untuk peserta yang tidak mengumpulkan tugas"
                            >
                              <Ban className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110" />
                              <span>Beri Nilai 0</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── TAMPILAN GRID KARTU (CARD VIEW) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubmissions.map((sub, idx) => {
              const p = sub.pengumpulan;
              const hasSubmitted = !!p;
              const isSudahDinilai = p?.status === "dinilai";
              const isRevisiSub = p?.status === "revisi";
              const isTuntasSub =
                p?.status_remidi === "tuntas" ||
                (isSudahDinilai && (p?.nilai || 0) >= (parsedKuis?.kkm || 75));
              const isRemidiSub =
                p?.status_remidi === "perlu_remidi" || isRevisiSub;

              const isTerlambat =
                p?.created_at &&
                currentTugas?.tenggat_waktu &&
                new Date(p.created_at) > new Date(currentTugas.tenggat_waktu);

              const waktuKumpulStr = formatWaktuKumpul(p?.created_at);

              return (
                <div
                  key={sub.peserta_id}
                  className="animate-[tabEnter_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${Math.min(idx * 25, 200)}ms` }}
                >
                  <div
                    className={`p-5 rounded-3xl border shadow-xs transition-all duration-200 flex flex-col justify-between gap-4 h-full ${
                      isDark
                        ? "bg-[#161b22] border-white/10 hover:border-white/20"
                        : "bg-white border-slate-200/90 hover:border-blue-200"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header Kartu: Profil + Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <PesertaMiniFoto nama={sub.nama} foto={sub.foto_profil} />
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                              {sub.nama}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {sub.institusi} • {sub.posisi_bidang}
                            </p>
                          </div>
                        </div>

                        {/* Status Capaian Badge */}
                        {hasSubmitted ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] font-black shrink-0 ${
                              isRevisiSub
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40"
                                : isSudahDinilai
                                ? isTuntasSub
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40"
                                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40"
                                : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40"
                            }`}
                          >
                            {isRevisiSub ? (
                              <>
                                <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>{isKuis ? "Remidi" : "Menunggu Revisi"}</span>
                              </>
                            ) : isSudahDinilai ? (
                              isTuntasSub ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>{isKuis ? "Tuntas" : "Disetujui"}</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>Belum Tuntas</span>
                                </>
                              )
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span>Perlu Koreksi</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-400 shrink-0">
                            Belum Kumpul
                          </span>
                        )}
                      </div>

                      {/* Hasil Penyerahan Tugas / Lampiran */}
                      <div>
                        {hasSubmitted ? (
                          isKuis ? (
                            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-blue-200/70 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20">
                              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004F9F] text-white shrink-0 shadow-2xs">
                                <NotebookPen className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">
                                  Lembar Kuis Terkirim
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  {parsedKuis?.daftar_soal?.length || 0} Butir Soal Diserahkan
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Hasil Penyerahan Proyek
                                </span>
                                {p.percobaan_ke && p.percobaan_ke > 1 && (
                                  <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                    Ke-{p.percobaan_ke}
                                  </span>
                                )}
                              </div>

                              {p.file_pengumpulan && (
                                <a
                                  href={getFileUrl(p.file_pengumpulan)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/gridfile flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 transition-all shadow-2xs cursor-pointer"
                                  title={`Buka file: ${p.file_pengumpulan.split("/").pop()}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#004F9F] dark:text-[#00A5EC] shrink-0">
                                      <FileText className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover/gridfile:text-[#004F9F] dark:group-hover/gridfile:text-sky-300">
                                      {p.file_pengumpulan.split("/").pop()}
                                    </span>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/gridfile:text-[#004F9F] shrink-0 transition-transform group-hover/gridfile:translate-x-0.5 group-hover/gridfile:-translate-y-0.5" />
                                </a>
                              )}

                              {p.link_tugas && (
                                <a
                                  href={p.link_tugas}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/gridlink flex items-center justify-between gap-2 p-2 rounded-xl border border-sky-200/80 dark:border-sky-800/40 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/70 transition-all shadow-2xs cursor-pointer"
                                  title={`Buka tautan: ${p.link_tugas}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300 truncate">
                                      {p.link_tugas.replace(/^https?:\/\//, "")}
                                    </span>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-500 shrink-0 transition-transform group-hover/gridlink:translate-x-0.5 group-hover/gridlink:-translate-y-0.5" />
                                </a>
                              )}

                              {p.catatan_peserta && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 px-1 pt-0.5">
                                  "{p.catatan_peserta}"
                                </p>
                              )}

                              {!p.file_pengumpulan && !p.link_tugas && !p.catatan_peserta && (
                                <span className="text-[11px] text-slate-400 italic block">
                                  Tugas diserahkan tanpa berkas lampiran
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-white/[0.01]">
                            {isKuis
                              ? "Belum mengerjakan kuis ini"
                              : "Belum mengunggah dokumen proyek"}
                          </div>
                        )}
                      </div>

                      {/* Informasi Waktu & Pengumpulan */}
                      <div
                        className={`p-3 rounded-2xl border text-xs space-y-2 ${
                          isDark
                            ? "bg-white/[0.02] border-white/5"
                            : "bg-slate-50/70 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Waktu Kumpul:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {waktuKumpulStr || "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Ketepatan:</span>
                          {hasSubmitted ? (
                            <span
                              className={`font-black ${
                                isTerlambat ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {isTerlambat ? "Terlambat Mengumpulkan" : "Tepat Waktu"}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-400">-</span>
                          )}
                        </div>

                        {p?.catatan_mentor && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Catatan Mentor:
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                              "{p.catatan_mentor}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Kartu: Nilai & Tombol Aksi */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                          Nilai Akhir
                        </span>
                        {hasSubmitted ? (
                          <span
                            className={`text-lg font-black block ${
                              isRevisiSub
                                ? "text-amber-600 dark:text-amber-400"
                                : p?.nilai !== null && p?.nilai !== undefined
                                ? isTuntasSub
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : isRemidiSub
                                  ? "text-amber-700 dark:text-amber-400"
                                  : p?.nilai === 0
                                  ? "text-rose-700 dark:text-rose-400"
                                  : "text-slate-800 dark:text-slate-100"
                                : "text-slate-500"
                            }`}
                          >
                            {isRevisiSub
                              ? (isKuis ? "Perlu Remidi" : "Menunggu Revisi")
                              : p?.nilai !== null && p?.nilai !== undefined
                              ? `${p.nilai} Poin`
                              : "Belum Dinilai"}
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold text-slate-400">-</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              (Belum Kumpul)
                            </span>
                          </div>
                        )}
                      </div>

                      {hasSubmitted ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setModalOpen(true);
                          }}
                          className="group/btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200/90 dark:border-sky-800/60 bg-blue-50/80 dark:bg-sky-950/40 text-[#004F9F] dark:text-sky-300 hover:bg-[#004F9F] hover:text-white dark:hover:bg-[#004F9F] dark:hover:text-white text-xs font-black shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110" />
                          <span>{isRevisiSub ? "Tinjau Revisi" : isSudahDinilai ? "Edit Nilai" : "Koreksi & Nilai"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBeriNilaiNol(sub)}
                          className="group/btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/90 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                          title="Tetapkan nilai 0 untuk peserta yang tidak mengumpulkan tugas"
                        >
                          <Ban className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110" />
                          <span>Beri Nilai 0</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  )}
        </div>

        {/* ── MODAL EVALUASI & REVIEW DETAIL ── */}
        <ReviewDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          tugas={currentTugas}
          submission={selectedSubmission}
          onSuccess={() => {
            fetchSubmissions(selectedTugasId);
            window.dispatchEvent(new Event("sim_notifikasi_updated"));
          }}
          isDark={isDark}
        />
      </div>
    </MentorLayout>
  );
};

export default ReviewTugasMentorPage;
