/**
 * Helper untuk pemetaan dan penghitungan lencana (badge) notifikasi
 * pada navigasi sidebar role Mentor.
 * Mengintegrasikan antrean review nyata dari database dan lonceng notifikasi header.
 */

export const initialLencanaMentor = {
  "verifikasi-izin": 0,
  "review-tugas": 0,
  "laporan-akhir": 0,
  "presensi-bimbingan": 0,
};

/**
 * Petakan satu item notifikasi ke kunci menu sidebar mentor
 * @param {Object} item Objek notifikasi
 * @returns {string|null} Kunci menu nav mentor
 */
export const petakanNotifikasiKeKunciMenuMentor = (item) => {
  if (!item) return null;
  const tipe = (item.tipe || "").toLowerCase();
  const url = (item.url_tujuan || "").toLowerCase();

  // 1. Verifikasi Izin
  if (
    tipe === "pengajuan_izin" ||
    tipe === "izin_status" ||
    url.includes("/mentor/pengajuan-izin")
  ) {
    return "verifikasi-izin";
  }

  // 2. Review Tugas & Kuis
  if (
    tipe === "tugas_dikumpulkan" ||
    tipe === "tugas_baru" ||
    tipe === "tugas_deadline" ||
    url.includes("/mentor/tugas/review") ||
    url.includes("/mentor/tugas/penyerahan")
  ) {
    return "review-tugas";
  }

  // 3. Laporan Akhir
  if (
    tipe === "laporan_akhir" ||
    url.includes("/mentor/laporan-akhir")
  ) {
    return "laporan-akhir";
  }

  // 4. Presensi Bimbingan
  if (
    tipe.startsWith("presensi_") ||
    tipe === "keterlambatan" ||
    tipe === "presensi_alfa" ||
    url.includes("/mentor/presensi")
  ) {
    return "presensi-bimbingan";
  }

  return null;
};

/**
 * Hitung lencana mentor dengan menggabungkan hitungan antrean tugas/izin
 * dan notifikasi lonceng header secara presisi
 * @param {Array} rawNotifList Daftar notifikasi
 * @param {Object} antreanData Data antrean dari getHitunganAntreanMentor
 * @returns {Object} Peta lencana per kunci menu
 */
export const hitungLencanaMentor = (rawNotifList, antreanData = {}) => {
  const counts = {
    "verifikasi-izin": antreanData.izin || 0,
    "review-tugas": antreanData.tugas || 0,
    "laporan-akhir": antreanData.laporan_akhir || 0,
    "presensi-bimbingan": 0,
  };

  if (Array.isArray(rawNotifList)) {
    const unread = rawNotifList.filter((x) => !x.dibaca_pada);
    const notifCounts = {};
    for (const item of unread) {
      const key = petakanNotifikasiKeKunciMenuMentor(item);
      if (key) {
        notifCounts[key] = (notifCounts[key] || 0) + 1;
      }
    }

    counts["verifikasi-izin"] = Math.max(counts["verifikasi-izin"], notifCounts["verifikasi-izin"] || 0);
    counts["review-tugas"] = Math.max(counts["review-tugas"], notifCounts["review-tugas"] || 0);
    counts["laporan-akhir"] = Math.max(counts["laporan-akhir"], notifCounts["laporan-akhir"] || 0);
    counts["presensi-bimbingan"] = notifCounts["presensi-bimbingan"] || 0;
  }

  return counts;
};
