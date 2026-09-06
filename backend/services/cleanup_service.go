package services

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"sim-magang-backend/models"

	"gorm.io/gorm"
)

// BersihkanBerkasSampah membersihkan berkas-berkas lampiran chat yang telah dihapus lebih dari 30 hari
// serta berkas sementara di folder uploads/tmp.
func BersihkanBerkasSampah(db *gorm.DB) (int, int64, error) {
	var totalHapus int
	var totalBytes int64

	// 1. Bersihkan berkas chat yang sudah dihapus lunak > 30 hari
	ambangHapus := time.Now().AddDate(0, 0, -30)
	var pesanDihapus []models.ChatMessage
	if err := db.Where("dihapus_pada IS NOT NULL AND dihapus_pada < ? AND file_path <> ''", ambangHapus).
		Find(&pesanDihapus).Error; err == nil {
		for _, msg := range pesanDihapus {
			jalur := filepath.FromSlash(msg.FilePath)
			if info, err := os.Stat(jalur); err == nil {
				totalBytes += info.Size()
				if err := os.Remove(jalur); err == nil {
					totalHapus++
					// Kosongkan path di database agar tidak dibersihkan ulang
					db.Model(&msg).Update("file_path", "")
				}
			}
		}
	}

	// 2. Bersihkan berkas sementara di tmp/ atau uploads/tmp/ yang berusia > 24 jam
	ambangTmp := time.Now().Add(-24 * time.Hour)
	for _, folder := range []string{"tmp", filepath.Join("uploads", "tmp")} {
		if _, err := os.Stat(folder); os.IsNotExist(err) {
			continue
		}
		_ = filepath.Walk(folder, func(path string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() && info.ModTime().Before(ambangTmp) {
				totalBytes += info.Size()
				if err := os.Remove(path); err == nil {
					totalHapus++
				}
			}
			return nil
		})
	}

	if totalHapus > 0 {
		log.Printf("[cleanup] Berhasil membersihkan %d berkas sampah (%.2f MB dibebaskan)",
			totalHapus, float64(totalBytes)/(1024*1024))
	}

	return totalHapus, totalBytes, nil
}

// MulaiPenjadwalPembersihanBerkas menjalankan pembersihan berkas sekali saat server menyala,
// lalu berulang setiap 24 jam sekali pada latar belakang.
func MulaiPenjadwalPembersihanBerkas(db *gorm.DB) {
	go func() {
		// Jalankan sekali saat startup
		time.Sleep(10 * time.Second) // jeda singkat agar database & aplikasi siap
		_, _, _ = BersihkanBerkasSampah(db)

		// Ulangi setiap 24 jam
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			_, _, _ = BersihkanBerkasSampah(db)
		}
	}()
}
