package services

import (
	"log"
	"time"

	"sim-magang-backend/config"
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