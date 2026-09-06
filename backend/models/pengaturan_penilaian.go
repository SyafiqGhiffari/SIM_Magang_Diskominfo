package models

import "time"

// PengaturanPenilaian menyimpan konfigurasi bobot 4 pilar kompetensi magang
// serta daftar butir indikator penilaian. Selalu 1 baris (singleton), di-seed otomatis.
type PengaturanPenilaian struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	BobotProfesional   float64   `gorm:"type:decimal(5,2);default:35.00" json:"bobot_profesional"`
	BobotPersonal      float64   `gorm:"type:decimal(5,2);default:25.00" json:"bobot_personal"`
	BobotSosial        float64   `gorm:"type:decimal(5,2);default:20.00" json:"bobot_sosial"`
	BobotAdministratif float64   `gorm:"type:decimal(5,2);default:20.00" json:"bobot_administratif"`
	DaftarIndikator    string    `gorm:"type:longtext" json:"daftar_indikator"` // JSON string format indikator per kategori
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (PengaturanPenilaian) TableName() string {
	return "pengaturan_penilaians"
}
