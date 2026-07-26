package services

import (
	"log"
	"time"

	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Batas maksimal hari yang ditutup mundur dalam sekali proses (jaring pengaman
// bila server sempat mati beberapa hari).
const maksHariBackfill = 60

// MulaiPenjadwalPresensi menjalankan penutup hari presensi di latar belakang.
// Dipanggil sekali dari main.go. Aman walau server sering restart karena
// proses penutupan bersifat idempoten.
func MulaiPenjadwalPresensi(db *gorm.DB) {
	// Jalankan sekali saat aplikasi start (menutup hari-hari yang terlewat)
	if err := PastikanHariTerkunci(db); err != nil {
		log.Println("[presensi] gagal menutup hari saat start:", err)
	}

	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for range ticker.C {
			if err := PastikanHariTerkunci(db); err != nil {
				log.Println("[presensi] gagal menutup hari:", err)
			}
		}
	}()
}

// PastikanHariTerkunci menutup semua hari kerja yang sudah lewat (sampai H-1)
// dan belum pernah ditutup: membuat baris "alfa" otomatis untuk peserta yang
// tidak presensi, lalu mengunci baris presensi hari tersebut.
//
// Fungsi ini juga dipanggil di awal endpoint baca (daftar presensi & rekap)
// sebagai jaring pengaman bila scheduler tidak berjalan.
func PastikanHariTerkunci(db *gorm.DB) error {
	kal, err := utils.MuatKalenderKerja(db)
	if err != nil {
		return err
	}

	sampai := utils.TanggalKemarin() // hari ini TIDAK ditutup: peserta masih bisa presensi
	mulai := utils.SekarangWIB().AddDate(0, 0, -maksHariBackfill).Format("2006-01-02")

	// Lanjutkan dari tanggal terakhir yang sudah ditutup agar prosesnya murah
	var terakhir string
	db.Model(&models.PenutupanPresensi{}).Select("MAX(tanggal)").Scan(&terakhir)
	if len(terakhir) >= 10 {
		if lanjut, e := utils.ParseTanggal(terakhir[:10]); e == nil {
			if t := lanjut.AddDate(0, 0, 1).Format("2006-01-02"); t > mulai {
				mulai = t
			}
		}
	}
	if mulai > sampai {
		return nil // tidak ada hari yang perlu ditutup
	}

	awal, err := utils.ParseTanggal(mulai)
	if err != nil {
		return err
	}
	akhir, err := utils.ParseTanggal(sampai)
	if err != nil {
		return err
	}

	peserta, err := utils.AmbilPesertaPresensi(db)
	if err != nil {
		return err
	}

	for t := awal; !t.After(akhir); t = t.AddDate(0, 0, 1) {
		tanggal := t.Format("2006-01-02")
		if err := TutupHariPresensi(db, kal, peserta, tanggal); err != nil {
			log.Println("[presensi] gagal menutup tanggal", tanggal, ":", err)
		}
	}
	return nil
}

// TutupHariPresensi menutup satu tanggal:
//  1. hari non-kerja  -> dicatat sebagai sudah ditutup, tanpa alfa
//  2. hari kerja      -> peserta tanpa baris presensi dibuatkan status "alfa",
//     lalu semua baris presensi tanggal itu dikunci
func TutupHariPresensi(db *gorm.DB, kal *utils.KalenderKerja, peserta []utils.PesertaPresensi, tanggal string) error {
	// Sudah pernah ditutup? lewati
	var jumlah int64
	db.Model(&models.PenutupanPresensi{}).Where("tanggal = ?", tanggal).Count(&jumlah)
	if jumlah > 0 {
		return nil
	}

	info := kal.CekHari(tanggal)
	if !info.HariKerja {
		return db.Create(&models.PenutupanPresensi{Tanggal: tanggal, HariKerja: false}).Error
	}

	// Peserta yang sudah punya baris presensi pada tanggal ini
	var sudahAda []uint
	if err := db.Model(&models.Presensi{}).
		Where("tanggal = ?", tanggal).
		Pluck("peserta_id", &sudahAda).Error; err != nil {
		return err
	}
	punyaPresensi := make(map[uint]bool, len(sudahAda))
	for _, id := range sudahAda {
		punyaPresensi[id] = true
	}

	sekarang := utils.SekarangWIB()
	var barisAlfa []models.Presensi
	for _, p := range peserta {
		if punyaPresensi[p.PesertaID] || !p.WajibPresensiPada(tanggal) {
			continue
		}
		barisAlfa = append(barisAlfa, models.Presensi{
			PesertaID:     p.PesertaID,
			PendaftaranID: p.PendaftaranID,
			Tanggal:       tanggal,
			Status:        "alfa",
			Keterangan:    "Tidak melakukan presensi",
			Sumber:        "sistem",
			Dikunci:       true,
			DikunciPada:   &sekarang,
		})
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if len(barisAlfa) > 0 {
			// OnConflict DoNothing: aman bila proses berjalan bersamaan
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).
				CreateInBatches(&barisAlfa, 200).Error; err != nil {
				return err
			}
		}

		// Kunci seluruh baris presensi tanggal ini
		if err := tx.Model(&models.Presensi{}).
			Where("tanggal = ? AND dikunci = ?", tanggal, false).
			Updates(map[string]interface{}{"dikunci": true, "dikunci_pada": sekarang}).Error; err != nil {
			return err
		}

		return tx.Create(&models.PenutupanPresensi{
			Tanggal:    tanggal,
			HariKerja:  true,
			JumlahAlfa: len(barisAlfa),
		}).Error
	})
}