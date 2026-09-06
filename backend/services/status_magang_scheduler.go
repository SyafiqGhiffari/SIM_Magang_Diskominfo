package services

import (
	"log"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"
)

// SinkronStatusMagang menandai peserta yang periode magangnya sudah lewat
// menjadi 'selesai' (read-only), dan mengembalikannya ke 'aktif' bila periode
// diperpanjang admin. Kolom status_akun TIDAK PERNAH disentuh di sini supaya
// alumni tetap bisa login untuk sertifikat & raport.
func SinkronStatusMagang() {
	hariIni := utils.TanggalHariIni()

	if err := config.DB.Exec(`
		UPDATE user_manajemens u
		LEFT JOIN pendaftaran_magangs p
			ON p.id = (
				SELECT p2.id FROM pendaftaran_magangs p2
				WHERE p2.akun_peserta_id = u.id
				ORDER BY p2.id DESC LIMIT 1
			)
		SET u.status_magang = 'selesai'
		WHERE u.role = 'peserta'
			AND u.status_magang = 'aktif'
			AND p.tanggal_selesai IS NOT NULL
			AND DATE(p.tanggal_selesai) < ?
	`, hariIni).Error; err != nil {
		log.Println("[status-magang] gagal menandai selesai:", err)
	}

	if err := config.DB.Exec(`
		UPDATE user_manajemens u
		LEFT JOIN pendaftaran_magangs p
			ON p.id = (
				SELECT p2.id FROM pendaftaran_magangs p2
				WHERE p2.akun_peserta_id = u.id
				ORDER BY p2.id DESC LIMIT 1
			)
		SET u.status_magang = 'aktif'
		WHERE u.role = 'peserta'
			AND u.status_magang = 'selesai'
			AND (p.tanggal_selesai IS NULL OR DATE(p.tanggal_selesai) >= ?)
	`, hariIni).Error; err != nil {
		log.Println("[status-magang] gagal mengaktifkan kembali:", err)
	}

	// 3. Buat draf sertifikat otomatis bagi peserta selesai yang belum memiliki sertifikat
	var alumniTanpaSertifikat []struct {
		ID uint
	}
	if err := config.DB.Raw(`
		SELECT u.id
		FROM user_manajemens u
		WHERE u.role = 'peserta' AND u.status_magang = 'selesai'
		  AND NOT EXISTS (
			SELECT 1 FROM sertifikats s WHERE s.akun_peserta_id = u.id
		  )
	`).Scan(&alumniTanpaSertifikat).Error; err == nil {
		for _, a := range alumniTanpaSertifikat {
			draf := models.Sertifikat{
				AkunPesertaID:   a.ID,
				NomorSertifikat: "-",
				Status:          "draft",
			}
			_ = config.DB.Create(&draf)
		}
	}
}

// JalankanSchedulerStatusMagang menjalankan sinkronisasi sekali saat server
// menyala, lalu berulang setiap jam.
func JalankanSchedulerStatusMagang() {
	go func() {
		SinkronStatusMagang()

		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			SinkronStatusMagang()
		}
	}()
}