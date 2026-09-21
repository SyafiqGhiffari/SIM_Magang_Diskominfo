import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTanggalLengkap, statusInfo } from "../constants/presensiStatus";

const getHariIndonesia = (tanggalStr) => {
  if (!tanggalStr) return "-";
  try {
    const d = new Date(tanggalStr);
    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return namaHari[d.getDay()] || "-";
  } catch {
    return "-";
  }
};

export const exportLogbookPdf = ({
  peserta = {},
  pendaftaran = {},
  mentor = {},
  instansi = {},
  logbook = [],
  statistik = {},
}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // ── 1. KOP SURAT ──
  let curY = 32;
  const instansiNama = (instansi.nama_instansi || "DINAS KOMUNIKASI DAN INFORMATIKA").toUpperCase();
  const instansiPemda = (instansi.nama_pemerintah || "PEMERINTAH PROVINSI / KOTA").toUpperCase();
  const instansiAlamat = instansi.alamat_instansi || "Kompleks Perkantoran Pemerintah - Indonesia";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(instansiPemda, pageWidth / 2, curY, { align: "center" });

  curY += 14;
  doc.setFontSize(13);
  doc.setTextColor(0, 79, 159);
  doc.text(instansiNama, pageWidth / 2, curY, { align: "center" });

  curY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(instansiAlamat, pageWidth / 2, curY, { align: "center" });

  curY += 10;
  // Garis ganda pembatas kop
  doc.setDrawColor(0, 79, 159);
  doc.setLineWidth(1.8);
  doc.line(margin, curY, pageWidth - margin, curY);
  curY += 2;
  doc.setDrawColor(180, 200, 225);
  doc.setLineWidth(0.6);
  doc.line(margin, curY, pageWidth - margin, curY);

  // ── 2. JUDUL DOKUMEN ──
  curY += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("LOGBOOK & JURNAL KEGIATAN HARIAN MAGANG", pageWidth / 2, curY, { align: "center" });

  curY += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const periodeStr = pendaftaran.tanggal_mulai && pendaftaran.tanggal_selesai
    ? `Periode: ${formatTanggalLengkap(pendaftaran.tanggal_mulai)} s/d ${formatTanggalLengkap(pendaftaran.tanggal_selesai)}`
    : "Periode Magang Aktif";
  doc.text(periodeStr, pageWidth / 2, curY, { align: "center" });

  // ── 3. IDENTITAS PESERTA & BIMBINGAN ──
  curY += 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 58, 4, 4, "FD");

  const col1X = margin + 12;
  const col2X = margin + (contentWidth / 2) + 8;
  let textY = curY + 14;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  // Kiri
  doc.text("Nama Peserta", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${peserta.nama || pendaftaran.nama_lengkap || "-"}`, col1X + 80, textY);

  textY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("NIM / NISN", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${pendaftaran.nim || "-"}`, col1X + 80, textY);

  textY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Institusi Asal", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${pendaftaran.institusi || "-"} (${pendaftaran.jurusan || "-"})`, col1X + 80, textY);

  // Kanan
  textY = curY + 14;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Posisi / Bidang", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${pendaftaran.posisi_bidang || "-"}`, col2X + 85, textY);

  textY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Mentor Pembimbing", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${mentor?.nama || "Mentor Diskominfo"}`, col2X + 85, textY);

  textY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Total Logbook Terisi", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${statistik?.total_logbook_terisi || 0} dari ${statistik?.total_hadir || 0} hari kerja (${Math.round(statistik?.persentase_pengisian || 0)}%)`, col2X + 85, textY);

  curY += 66;

  // ── 4. TABEL LOGBOOK AKTIVITAS ──
  const tableHeaders = ["No", "Hari, Tanggal", "Jam Kerja", "Status", "Uraian Aktivitas & Capaian Harian", "Paraf Mentor"];
  
  // Format data urut kronologis (dari tanggal awal ke tanggal akhir)
  const sortedLogbook = [...logbook].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

  const tableRows = sortedLogbook.map((item, idx) => {
    const hari = getHariIndonesia(item.tanggal);
    const tgl = formatTanggalLengkap(item.tanggal);
    const jamMasuk = item.jam_masuk ? item.jam_masuk.slice(0, 5) : "-";
    const jamPulang = item.jam_pulang ? item.jam_pulang.slice(0, 5) : "-";
    const jamKerja = `${jamMasuk} - ${jamPulang}`;
    const status = statusInfo(item.status)?.label || item.status || "-";
    const kegiatan = item.keterangan ? item.keterangan.trim() : (item.status === "izin" || item.status === "sakit" ? `[${status}] Tidak mengisi aktivitas` : "Tidak ada catatan aktivitas");

    return [
      String(idx + 1),
      `${hari},\n${tgl}`,
      jamKerja,
      status,
      kegiatan,
      "",
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows.length > 0 ? tableRows : [["-", "-", "-", "-", "Belum ada catatan aktivitas harian yang tercatat", "-"]],
    startY: curY,
    theme: "grid",
    headStyles: {
      fillColor: [0, 79, 159],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: "top",
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      1: { cellWidth: 80, fontSize: 7 },
      2: { cellWidth: 55, halign: "center", fontSize: 7 },
      3: { cellWidth: 55, halign: "center", fontSize: 7 },
      4: { cellWidth: "auto" },
      5: { cellWidth: 55, halign: "center" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${doc.internal.getNumberOfPages()} — SIM Magang Diskominfo`,
        pageWidth / 2,
        pageHeight - 16,
        { align: "center" }
      );
    },
  });

  // ── 5. TANDA TANGAN FOOTER ──
  const finalY = doc.lastAutoTable.finalY + 24;
  // Cek apakah muat di halaman yang sama, jika tidak buat halaman baru
  let signY = finalY;
  if (signY + 90 > pageHeight - 30) {
    doc.addPage();
    signY = 50;
  }

  const kota = instansi.tempat_terbit || "Kota Bandung";
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  // Kolom Kiri: Peserta Magang
  const ttdKiriX = margin + 30;
  doc.text("Mengetahui,", ttdKiriX, signY);
  doc.text("Peserta Magang,", ttdKiriX, signY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(peserta.nama || pendaftaran.nama_lengkap || "-", ttdKiriX, signY + 68);
  doc.setFont("helvetica", "normal");
  doc.text(`NIM/NISN: ${pendaftaran.nim || "-"}`, ttdKiriX, signY + 79);

  // Kolom Kanan: Mentor Pembimbing
  const ttdKananX = pageWidth - margin - 150;
  doc.text(`${kota}, ${tglCetak}`, ttdKananX, signY);
  doc.text("Mentor Pembimbing Lapangan,", ttdKananX, signY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(mentor?.nama || "Mentor Pembimbing Diskominfo", ttdKananX, signY + 68);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP: ${mentor?.nip || mentor?.jabatan || "-"}`, ttdKananX, signY + 79);

  // Simpan File
  const safeNama = (peserta.nama || "peserta").toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`logbook_magang_${safeNama}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
