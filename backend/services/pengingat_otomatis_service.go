package services

import (
	"fmt"
	"log"
	"strings"
	"time"

	"sim-magang-backend/models"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"gorm.io/gorm"
)

// MulaiSchedulerPengingatOtomatis memulai background worker untuk:
// 1. Pengingat deadline tugas magang (H-1)
// 2. Pengingat pengisian logbook harian sore (16:30 WIB)
// 3. Pengingat countdown laporan akhir (H-14, H-7, H-3)
func MulaiSchedulerPengingatOtomatis(db *gorm.DB) {
	// Jeda sejenak saat startup server agar inisialisasi database dan notifikasi selesai
	go func() {
		time.Sleep(20 * time.Second)
		JalankanSemuaPengingatOtomatis(db)
	}()

	// Periksa setiap 15 menit
	ticker := time.NewTicker(15 * time.Minute)
	go func() {
		for range ticker.C {
			JalankanSemuaPengingatOtomatis(db)
		}
	}()
}

// JalankanSemuaPengingatOtomatis menjalankan seluruh pipeline pengingat dengan proteksi deduplikasi harian
func JalankanSemuaPengingatOtomatis(db *gorm.DB) {
	if db == nil {
		return
	}
	JalankanPengingatPresensiMasuk(db)
	JalankanPeringatanBelumPresensi(db)
	JalankanPengingatPresensiPulang(db)
	JalankanPengingatDeadlineTugas(db)
	JalankanPengingatLogbookSore(db)
	JalankanPengingatLaporanOtomatis(db)
	JalankanPengingatNilaiAkhirMentor(db)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PENGINGAT DEADLINE TUGAS (H-1)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatDeadlineTugas(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	// Hanya aktif diperiksa saat jam wajar (08:00 - 20:00 WIB)
	if sekarang.Hour() < 8 || sekarang.Hour() > 20 {
		return
	}

	// Cari tugas yang tenggat waktunya dalam rentang 36 jam ke depan
	batasWaktu := sekarang.Add(36 * time.Hour)

	var daftarTugas []models.TugasMagang
	if err := db.Where("tenggat_waktu IS NOT NULL AND tenggat_waktu > ? AND tenggat_waktu <= ?", sekarang, batasWaktu).
		Find(&daftarTugas).Error; err != nil {
		log.Println("[pengingat-tugas] gagal query tugas mendekati tenggat:", err)
		return
	}

	for _, tugas := range daftarTugas {
		if tugas.TenggatWaktu == nil {
			continue
		}

		dl := tugas.TenggatWaktu.In(utils.WIB())
		var dlFormatted string
		blnIdx := int(dl.Month()) - 1
		if blnIdx >= 0 && blnIdx < len(bulanIndoSurat) {
			dlFormatted = fmt.Sprintf("%d %s %d, pukul %s WIB", dl.Day(), bulanIndoSurat[blnIdx], dl.Year(), dl.Format("15:04"))
		} else {
			dlFormatted = dl.Format("02 January 2006 15:04 WIB")
		}

		var targetPesertaIDs []uint
		if tugas.TargetPeserta == "spesifik" {
			db.Table("tugas_peserta_akses tpa").
				Joins("JOIN user_manajemens u ON u.id = tpa.peserta_id").
				Where("tpa.tugas_id = ? AND u.status_magang = 'aktif' AND u.status_akun = 'aktif'", tugas.ID).
				Pluck("tpa.peserta_id", &targetPesertaIDs)
		} else if tugas.MentorID != nil {
			var mentees []models.PendaftaranMagang
			q := db.
				Joins("JOIN user_manajemens u ON u.id = pendaftaran_magangs.akun_peserta_id").
				Where("pendaftaran_magangs.mentor_id = ? AND pendaftaran_magangs.status_pendaftaran = 'diterima' AND pendaftaran_magangs.akun_peserta_id IS NOT NULL", *tugas.MentorID).
				Where("u.status_magang = 'aktif' AND u.status_akun = 'aktif'").
				Where("pendaftaran_magangs.tanggal_selesai IS NULL OR DATE(pendaftaran_magangs.tanggal_selesai) >= ?", hariIni)

			if tugas.TargetJenjang != "" && tugas.TargetJenjang != "semua" {
				q = q.Where("LOWER(pendaftaran_magangs.kategori_pendaftar) = ?", strings.ToLower(tugas.TargetJenjang))
			}
			q.Select("pendaftaran_magangs.akun_peserta_id").Find(&mentees)
			for _, m := range mentees {
				if m.AkunPesertaID != nil {
					targetPesertaIDs = append(targetPesertaIDs, *m.AkunPesertaID)
				}
			}
		}

		for _, pid := range targetPesertaIDs {
			// Lewati bila peserta sudah mengumpulkan tugas (status sudah_mengumpulkan atau acc)
			var sudahKumpul int64
			db.Table("pengumpulan_tugas").
				Where("tugas_id = ? AND peserta_id = ? AND status_pengumpulan IN ('sudah_mengumpulkan', 'acc')", tugas.ID, pid).
				Count(&sudahKumpul)
			if sudahKumpul > 0 {
				continue
			}

			// Deduplikasi: pastikan notifikasi deadline untuk tugas ini belum pernah dikirim hari ini
			var sudahNotif int64
			db.Model(&models.Notifikasi{}).
				Where("target_user_id = ? AND tipe = 'tugas_deadline' AND ref_tabel = 'tugas_magangs' AND ref_id = ? AND DATE(created_at) = ?", pid, tugas.ID, hariIni).
				Count(&sudahNotif)
			if sudahNotif > 0 {
				continue
			}

			pCopy := pid
			tID := tugas.ID

			KirimNotifikasi(NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pCopy,
				Tipe:         "tugas_deadline",
				Prioritas:    "tinggi",
				Judul:        "Pengingat Tenggat Waktu Tugas",
				Pesan:        fmt.Sprintf("Tugas magang \"%s\" akan segera berakhir pada %s. Segera selesaikan dan kirimkan jawaban Anda.", tugas.Judul, dlFormatted),
				RefTabel:     "tugas_magangs",
				RefID:        &tID,
				UrlTujuan:    "/peserta/pembelajaran/tugas",
			})

			var user models.UserManajemen
			if err := db.Select("id, nama, email").First(&user, pid).Error; err == nil && user.Email != "" {
				bodyEmail := emailtemplates.TemplatePengingatDeadlineTugas(user.Nama, tugas.Judul, dlFormatted)
				_ = SendEmail(user.Email, "Pengingat Batas Pengumpulan Tugas: "+tugas.Judul, bodyEmail)
			}
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PENGINGAT LOGBOOK SORE (16:30 WIB)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatLogbookSore(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	// Hanya berjalan pada hari kerja (Senin s/d Jumat)
	if sekarang.Weekday() < time.Monday || sekarang.Weekday() > time.Friday {
		return
	}

	// Hanya berjalan mulai pukul 16:30 s/d 22:00 WIB
	if sekarang.Hour() < 16 || (sekarang.Hour() == 16 && sekarang.Minute() < 30) || sekarang.Hour() > 22 {
		return
	}

	// Cari presensi hari ini yang berstatus hadir/terlambat namun belum mengisi logbook
	var daftarPresensi []models.Presensi
	if err := db.Where("tanggal = ? AND status IN ('hadir', 'terlambat') AND (keterangan IS NULL OR TRIM(keterangan) = '' OR keterangan = '-')", hariIni).
		Find(&daftarPresensi).Error; err != nil {
		log.Println("[pengingat-logbook] gagal query presensi tanpa logbook:", err)
		return
	}

	for _, p := range daftarPresensi {
		// Deduplikasi: satu kali pengingat logbook per peserta per hari
		var sudahNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_user_id = ? AND tipe = 'logbook_reminder' AND DATE(created_at) = ?", p.PesertaID, hariIni).
			Count(&sudahNotif)
		if sudahNotif > 0 {
			continue
		}

		pCopy := p.PesertaID
		presID := p.ID

		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pCopy,
			Tipe:         "logbook_reminder",
			Prioritas:    "normal",
			Judul:        "Pengingat Pengisian Logbook Harian",
			Pesan:        "Sistem mendeteksi Anda telah presensi hari ini tetapi belum melengkapi deskripsi logbook harian. Silakan lengkapi sebelum hari berganti.",
			RefTabel:     "presensis",
			RefID:        &presID,
			UrlTujuan:    "/peserta/presensi",
		})

		var user models.UserManajemen
		if err := db.Select("id, nama, email").First(&user, p.PesertaID).Error; err == nil && user.Email != "" {
			tglIndo := FormatTanggalSurat(hariIni)
			bodyEmail := emailtemplates.TemplatePengingatLogbook(user.Nama, tglIndo)
			_ = SendEmail(user.Email, "Pengingat Pengisian Logbook Harian - "+tglIndo, bodyEmail)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PENGINGAT OTOMATIS LAPORAN AKHIR (H-14, H-7, H-3)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatLaporanOtomatis(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	// Dijalankan pada pagi hari (08:00 - 13:00 WIB)
	if sekarang.Hour() < 8 || sekarang.Hour() > 13 {
		return
	}

	// Cari peserta aktif yang belum mengunggah laporan akhir
	var daftarPendaftaran []models.PendaftaranMagang
	if err := db.Where("status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL AND (file_laporan_akhir IS NULL OR file_laporan_akhir = '') AND (status_laporan_akhir IS NULL OR status_laporan_akhir != 'disetujui') AND tanggal_selesai IS NOT NULL").
		Find(&daftarPendaftaran).Error; err != nil {
		log.Println("[pengingat-laporan] gagal query pendaftaran magang:", err)
		return
	}

	for _, pm := range daftarPendaftaran {
		if pm.AkunPesertaID == nil {
			continue
		}

		tglSelesaiStr := strings.TrimSpace(pm.TanggalSelesai)
		if len(tglSelesaiStr) >= 10 {
			tglSelesaiStr = tglSelesaiStr[:10]
		}
		selesaiDate, err := time.Parse("2006-01-02", tglSelesaiStr)
		if err != nil {
			continue
		}

		todayDate, _ := time.Parse("2006-01-02", hariIni)
		sisaHari := int(selesaiDate.Sub(todayDate).Hours() / 24)

		// Hanya picu pada milestone pengingat: H-14, H-7, H-3
		if sisaHari != 14 && sisaHari != 7 && sisaHari != 3 {
			continue
		}

		// Deduplikasi: satu kali pengingat laporan per peserta per hari
		var sudahNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_user_id = ? AND tipe = 'laporan_akhir' AND DATE(created_at) = ?", *pm.AkunPesertaID, hariIni).
			Count(&sudahNotif)
		if sudahNotif > 0 {
			continue
		}

		pCopy := *pm.AkunPesertaID
		pmID := pm.ID
		tglSelesaiIndo := FormatTanggalSurat(tglSelesaiStr)

		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pCopy,
			Tipe:         "laporan_akhir",
			Prioritas:    "tinggi",
			Judul:        fmt.Sprintf("Pengingat Laporan Akhir (H-%d)", sisaHari),
			Pesan:        fmt.Sprintf("Masa magang Anda tersisa %d hari lagi (berakhir pada %s). Mohon segera mengunggah naskah Laporan Akhir dan Luaran Proyek.", sisaHari, tglSelesaiIndo),
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pmID,
			UrlTujuan:    "/peserta/penilaian/laporan",
		})

		var user models.UserManajemen
		if err := db.Select("id, nama, email").First(&user, *pm.AkunPesertaID).Error; err == nil && user.Email != "" {
			bodyEmail := emailtemplates.TemplatePengingatLaporanOtomatis(user.Nama, sisaHari, tglSelesaiIndo)
			_ = SendEmail(user.Email, fmt.Sprintf("Pengingat Pengunggahan Laporan Akhir Magang (H-%d)", sisaHari), bodyEmail)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PENGINGAT EVALUASI NILAI AKHIR UNTUK MENTOR (H-3 s.d. Selesai)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatNilaiAkhirMentor(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	// Dijalankan pada jam kerja (08:00 - 17:00 WIB)
	if sekarang.Hour() < 8 || sekarang.Hour() > 17 {
		return
	}

	// Cari pendaftaran yang mentornya sudah ditentukan dan periode selesai magangnya mendekati (H-3 s.d. +14 hari lewat)
	var daftarPendaftaran []models.PendaftaranMagang
	if err := db.Where("status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL AND mentor_id IS NOT NULL AND tanggal_selesai IS NOT NULL").
		Find(&daftarPendaftaran).Error; err != nil {
		log.Println("[pengingat-nilai-mentor] gagal query pendaftaran magang:", err)
		return
	}

	for _, pm := range daftarPendaftaran {
		if pm.AkunPesertaID == nil || pm.MentorID == nil {
			continue
		}

		tglSelesaiStr := strings.TrimSpace(pm.TanggalSelesai)
		if len(tglSelesaiStr) >= 10 {
			tglSelesaiStr = tglSelesaiStr[:10]
		}
		selesaiDate, err := time.Parse("2006-01-02", tglSelesaiStr)
		if err != nil {
			continue
		}

		todayDate, _ := time.Parse("2006-01-02", hariIni)
		sisaHari := int(selesaiDate.Sub(todayDate).Hours() / 24)

		// Hanya picu pengingat jika sisa hari <= 3 hari atau sudah lewat hingga 14 hari
		if sisaHari > 3 || sisaHari < -14 {
			continue
		}

		// Periksa apakah mentor sudah memfinalisasi nilai akhir 4 pilar kompetensi peserta ini
		var countFinal int64
		db.Model(&models.PenilaianMagang{}).
			Where("peserta_id = ? AND status_penilaian = 'final'", *pm.AkunPesertaID).
			Count(&countFinal)
		if countFinal > 0 {
			continue
		}

		// Deduplikasi: pastikan mentor hanya dikirimi pengingat 1 kali per hari untuk peserta ini
		var countNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_role = 'mentor' AND target_user_id = ? AND tipe = 'pengingat_evaluasi_akhir' AND ref_tabel = 'pendaftaran_magangs' AND ref_id = ? AND DATE(created_at) = ?", *pm.MentorID, pm.ID, hariIni).
			Count(&countNotif)
		if countNotif > 0 {
			continue
		}

		mID := *pm.MentorID
		pmID := pm.ID
		tglSelesaiIndo := FormatTanggalSurat(tglSelesaiStr)

		pesanNotif := fmt.Sprintf("Masa magang peserta %s tersisa %d hari (%s), namun nilai rapor 4 pilar belum difinalisasi. Mohon segera evaluasi.", pm.NamaLengkap, sisaHari, tglSelesaiIndo)
		if sisaHari <= 0 {
			pesanNotif = fmt.Sprintf("Masa magang peserta %s telah selesai (%s), namun nilai rapor 4 pilar belum difinalisasi. Mohon segera evaluasi agar sertifikat dapat diproses admin.", pm.NamaLengkap, tglSelesaiIndo)
		}

		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "mentor",
			TargetUserID: &mID,
			Tipe:         "pengingat_evaluasi_akhir",
			Prioritas:    "tinggi",
			Judul:        "Pengingat Evaluasi Nilai Akhir Peserta",
			Pesan:        pesanNotif,
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pmID,
			UrlTujuan:    "/mentor/penilaian",
		})

		var mentor models.UserManajemen
		if err := db.Select("id, nama, email").First(&mentor, *pm.MentorID).Error; err == nil && mentor.Email != "" {
			subject := fmt.Sprintf("Pengingat Evaluasi Nilai Akhir: %s", pm.NamaLengkap)
			body := emailtemplates.TemplatePengingatNilaiAkhirMentor(mentor.Nama, pm.NamaLengkap, sisaHari, tglSelesaiIndo)
			_ = SendEmail(mentor.Email, subject, body)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PENGINGAT PRESENSI MASUK PAGI (07:15 - 08:30 WIB)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatPresensiMasuk(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	if sekarang.Weekday() < time.Monday || sekarang.Weekday() > time.Friday {
		return
	}

	jamMenit := sekarang.Hour()*60 + sekarang.Minute()
	if jamMenit < 7*60+15 || jamMenit > 8*60+30 {
		return
	}

	kal, err := utils.MuatKalenderKerja(db)
	if err != nil {
		return
	}
	info := kal.CekHari(hariIni)
	if !info.HariKerja {
		return
	}

	pesertaList, err := utils.AmbilPesertaPresensi(db)
	if err != nil {
		return
	}

	jamMasuk := "07:30"
	if info.JamKerja.JamMasuk != "" {
		jamMasuk = info.JamKerja.JamMasuk
	}

	for _, p := range pesertaList {
		if !p.WajibPresensiPada(hariIni) {
			continue
		}

		var countIzin int64
		db.Model(&models.PengajuanIzin{}).
			Where("peserta_id = ? AND status = 'disetujui' AND ? BETWEEN tanggal_mulai AND tanggal_selesai", p.PesertaID, hariIni).
			Count(&countIzin)
		if countIzin > 0 {
			continue
		}

		var countPresensi int64
		db.Model(&models.Presensi{}).
			Where("peserta_id = ? AND tanggal = ? AND jam_masuk IS NOT NULL AND jam_masuk != ''", p.PesertaID, hariIni).
			Count(&countPresensi)
		if countPresensi > 0 {
			continue
		}

		var sudahNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_user_id = ? AND tipe = 'presensi_masuk' AND DATE(created_at) = ?", p.PesertaID, hariIni).
			Count(&sudahNotif)
		if sudahNotif > 0 {
			continue
		}

		pID := p.PesertaID
		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pID,
			Tipe:         "presensi_masuk",
			Prioritas:    "normal",
			Judul:        "Pengingat Presensi Masuk Hari Ini",
			Pesan:        fmt.Sprintf("Jam kerja operasional telah dimulai (jadwal masuk pukul %s WIB). Harap segera melakukan presensi masuk dan swafoto di SIM Magang.", jamMasuk),
			RefTabel:     "presensis",
			UrlTujuan:    "/peserta/presensi",
		})

		emailTarget := p.EmailAktif
		if emailTarget == "" {
			emailTarget = p.EmailAkun
		}
		if emailTarget != "" {
			tglIndo := FormatTanggalSurat(hariIni)
			bodyEmail := emailtemplates.TemplatePengingatPresensiMasuk(p.Nama, tglIndo, jamMasuk)
			_ = SendEmail(emailTarget, "Pengingat Presensi Masuk - "+tglIndo, bodyEmail)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PERINGATAN BELUM PRESENSI SORE / MALAM (15:30 - 22:30 WIB)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPeringatanBelumPresensi(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	if sekarang.Weekday() < time.Monday || sekarang.Weekday() > time.Friday {
		return
	}

	jamMenit := sekarang.Hour()*60 + sekarang.Minute()
	if jamMenit < 15*60+30 || jamMenit > 22*60+30 {
		return
	}

	kal, err := utils.MuatKalenderKerja(db)
	if err != nil {
		return
	}
	info := kal.CekHari(hariIni)
	if !info.HariKerja {
		return
	}

	pesertaList, err := utils.AmbilPesertaPresensi(db)
	if err != nil {
		return
	}

	for _, p := range pesertaList {
		if !p.WajibPresensiPada(hariIni) {
			continue
		}

		var countIzin int64
		db.Model(&models.PengajuanIzin{}).
			Where("peserta_id = ? AND status = 'disetujui' AND ? BETWEEN tanggal_mulai AND tanggal_selesai", p.PesertaID, hariIni).
			Count(&countIzin)
		if countIzin > 0 {
			continue
		}

		var countPresensi int64
		db.Model(&models.Presensi{}).
			Where("peserta_id = ? AND tanggal = ? AND jam_masuk IS NOT NULL AND jam_masuk != ''", p.PesertaID, hariIni).
			Count(&countPresensi)
		if countPresensi > 0 {
			continue
		}

		var sudahNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_user_id = ? AND tipe = 'peringatan_belum_presensi' AND DATE(created_at) = ?", p.PesertaID, hariIni).
			Count(&sudahNotif)
		if sudahNotif > 0 {
			continue
		}

		pID := p.PesertaID
		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pID,
			Tipe:         "peringatan_belum_presensi",
			Prioritas:    "tinggi",
			Judul:        "Peringatan: Anda Belum Melakukan Presensi Hari Ini",
			Pesan:        "Sistem mendeteksi Anda belum melakukan presensi hingga saat ini. Segera lakukan presensi sebelum hari berganti agar tidak tercatat alpa.",
			RefTabel:     "presensis",
			UrlTujuan:    "/peserta/presensi",
		})

		emailTarget := p.EmailAktif
		if emailTarget == "" {
			emailTarget = p.EmailAkun
		}
		if emailTarget != "" {
			tglIndo := FormatTanggalSurat(hariIni)
			bodyEmail := emailtemplates.TemplatePeringatanBelumPresensi(p.Nama, tglIndo)
			_ = SendEmail(emailTarget, "Peringatan: Belum Melakukan Presensi Hari Ini - "+tglIndo, bodyEmail)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PENGINGAT PRESENSI PULANG & LOGBOOK (15:30 - 18:30 WIB)
// ─────────────────────────────────────────────────────────────────────────────

func JalankanPengingatPresensiPulang(db *gorm.DB) {
	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()

	if sekarang.Weekday() < time.Monday || sekarang.Weekday() > time.Friday {
		return
	}

	jamMenit := sekarang.Hour()*60 + sekarang.Minute()
	if jamMenit < 15*60+30 || jamMenit > 18*60+30 {
		return
	}

	kal, err := utils.MuatKalenderKerja(db)
	if err != nil {
		return
	}
	info := kal.CekHari(hariIni)
	if !info.HariKerja {
		return
	}

	jamPulang := "15:30"
	if info.JamKerja.JamPulang != "" {
		jamPulang = info.JamKerja.JamPulang
	}

	var daftarPresensi []models.Presensi
	if err := db.Where("tanggal = ? AND status IN ('hadir', 'terlambat') AND (jam_pulang IS NULL OR jam_pulang = '')", hariIni).
		Find(&daftarPresensi).Error; err != nil {
		return
	}

	for _, p := range daftarPresensi {
		var sudahNotif int64
		db.Model(&models.Notifikasi{}).
			Where("target_user_id = ? AND tipe = 'presensi_pulang' AND DATE(created_at) = ?", p.PesertaID, hariIni).
			Count(&sudahNotif)
		if sudahNotif > 0 {
			continue
		}

		pID := p.PesertaID
		presID := p.ID
		KirimNotifikasi(NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pID,
			Tipe:         "presensi_pulang",
			Prioritas:    "normal",
			Judul:        "Pengingat Presensi Pulang & Logbook",
			Pesan:        fmt.Sprintf("Jam operasional kantor telah berakhir (mulai %s WIB). Silakan lakukan presensi pulang dan catat capaian logbook harian Anda.", jamPulang),
			RefTabel:     "presensis",
			RefID:        &presID,
			UrlTujuan:    "/peserta/presensi",
		})

		var user models.UserManajemen
		if err := db.Select("id, nama, email").First(&user, p.PesertaID).Error; err == nil && user.Email != "" {
			tglIndo := FormatTanggalSurat(hariIni)
			bodyEmail := emailtemplates.TemplatePengingatPresensiPulang(user.Nama, tglIndo, jamPulang)
			_ = SendEmail(user.Email, "Pengingat Presensi Pulang & Logbook - "+tglIndo, bodyEmail)
		}
	}
}

