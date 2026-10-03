/**
 * Helper untuk pemetaan dan penghitungan lencana (badge) notifikasi
 * pada navigasi sidebar role Peserta.
 * Terintegrasi penuh dengan preferensi pengguna dan lonceng notifikasi header.
 */

export const initialLencanaPeserta = {
  presensi: 0,
  izin: 0,
  "riwayat-aktivitas": 0,
  materi: 0,
  tugas: 0,
  laporan: 0,
  rapor: 0,
  sertifikat: 0,
};

/**
 * Filter notifikasi sesuai konfigurasi preferensi role Peserta di localStorage
 */
export const filterNotifikasiSesuaiPreferensiPeserta = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  let userSettings = null;
  try {
    const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const storageKey = user?.id ? `sim_peserta_notif_settings_${user.id}` : "sim_peserta_notif_settings";
    const saved = localStorage.getItem(storageKey) || localStorage.getItem("sim_peserta_notif_settings");
    if (saved) userSettings = JSON.parse(saved);
  } catch {
    // abaikan jika parsing error
  }

  if (!userSettings) return items;

  return items.filter((item) => {
    const tipe = (item.tipe || "").toLowerCase();
    if (tipe === "chat_baru" && userSettings.chatMentor === false) return false;
    if (tipe === "presensi_masuk" && userSettings.checkinReminder === false) return false;
    if (tipe === "presensi_pulang" && userSettings.checkoutReminder === false) return false;
    if (tipe === "izin_status" && userSettings.izinStatus === false) return false;
    if (tipe === "logbook_reminder" && userSettings.logbookReminder === false) return false;
    if ((tipe === "revisi_dokumen" || tipe === "logbook_revisi" || tipe === "logbook_verifikasi") && userSettings.logbookVerification === false) return false;
    if (tipe === "tugas_baru" && userSettings.tugasBaru === false) return false;
    if ((tipe === "tugas_nilai" || tipe === "tugas_feedback") && userSettings.tugasFeedback === false) return false;
    if (tipe === "tugas_deadline" && userSettings.tugasDeadline === false) return false;
    if (tipe === "laporan_akhir" && userSettings.laporanAkhirStatus === false) return false;
    if (tipe === "rapor_nilai" && userSettings.raporNilai === false) return false;
    if ((tipe === "sertifikat_pending" || tipe === "sertifikat_terbit") && userSettings.sertifikatTerbit === false) return false;
    if (tipe === "keamanan_login" && userSettings.loginSecurityAlert === false) return false;
    if (tipe === "keamanan_password" && userSettings.passwordEmailChangeAlert === false) return false;
    return true;
  });
};

/**
 * Petakan satu item notifikasi ke kunci menu sidebar peserta
 * @param {Object} item Objek notifikasi
 * @returns {string|null} Kunci menu nav (misal: "tugas", "materi", "izin", dll.)
 */
export const petakanNotifikasiKeKunciMenuPeserta = (item) => {
  if (!item) return null;
  const tipe = (item.tipe || "").toLowerCase();
  const url = (item.url_tujuan || "").toLowerCase();

  // 1. Pembelajaran - Tugas Magang
  if (
    tipe.startsWith("tugas_") ||
    tipe === "tugas" ||
    url.includes("/pembelajaran/tugas") ||
    url.includes("/peserta/tugas")
  ) {
    return "tugas";
  }

  // 2. Pembelajaran - Materi Pembelajaran
  if (
    tipe === "materi_baru" ||
    tipe === "materi" ||
    url.includes("/pembelajaran/materi") ||
    url.includes("/peserta/materi")
  ) {
    return "materi";
  }

  // 3. Presensi - Pengajuan Izin
  if (
    tipe === "izin_status" ||
    tipe === "pengajuan_izin" ||
    url.includes("/pengajuan-izin") ||
    url.includes("/peserta/izin")
  ) {
    return "izin";
  }

  // 4. Presensi - Presensi & Logbook
  if (
    tipe === "presensi_masuk" ||
    tipe === "presensi_pulang" ||
    tipe === "logbook_reminder" ||
    url === "/peserta/presensi" ||
    url.startsWith("/peserta/presensi?")
  ) {
    return "presensi";
  }

  // 5. Presensi - Riwayat Aktivitas & Logbook verifikasi/revisi
  if (
    tipe === "logbook_verifikasi" ||
    tipe === "logbook_revisi" ||
    url.includes("/riwayat-aktivitas") ||
    url.includes("/peserta/riwayat") ||
    url.includes("/peserta/logbook")
  ) {
    return "riwayat-aktivitas";
  }

  // 6. Penilaian - Laporan Akhir
  if (
    tipe === "laporan_akhir" ||
    tipe === "laporan_revisi" ||
    url.includes("/penilaian/laporan") ||
    url.includes("/peserta/laporan")
  ) {
    return "laporan";
  }

  // 7. Penilaian - Rapor Nilai
  if (
    tipe === "rapor_nilai" ||
    url.includes("/penilaian/rapor") ||
    url === "/peserta/penilaian" ||
    url.includes("/peserta/rapor")
  ) {
    return "rapor";
  }

  // 8. Penilaian - Sertifikat Magang
  if (
    tipe === "sertifikat_pending" ||
    tipe === "sertifikat_terbit" ||
    url.includes("/penilaian/sertifikat") ||
    url.includes("/peserta/sertifikat")
  ) {
    return "sertifikat";
  }

  return null;
};

/**
 * Hitung jumlah lencana notifikasi belum dibaca untuk setiap menu navigasi peserta
 * @param {Array} rawList Daftar notifikasi mentah dari API
 * @returns {Object} Objek jumlah lencana per kunci menu
 */
export const hitungLencanaPesertaDariNotifikasi = (rawList) => {
  const filtered = filterNotifikasiSesuaiPreferensiPeserta(rawList || []);
  const counts = { ...initialLencanaPeserta };

  for (const item of filtered) {
    if (item.dibaca_pada) continue; // Hanya yang belum dibaca
    const key = petakanNotifikasiKeKunciMenuPeserta(item);
    if (key && typeof counts[key] === "number") {
      counts[key] += 1;
    }
  }

  return counts;
};
