package models

import "time"

// JamKerja menyimpan pengaturan jam kerja per hari (Senin–Jumat).
// Sabtu & Minggu tidak disimpan di sini karena otomatis dianggap libur.
type JamKerja struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	Hari               string    `gorm:"type:varchar(10);unique;not null" json:"hari"` // senin, selasa, rabu, kamis, jumat
	JamMasuk           string    `gorm:"type:varchar(5);not null" json:"jam_masuk"`    // format "HH:MM"
	JamPulang          string    `gorm:"type:varchar(5);not null" json:"jam_pulang"`   // format "HH:MM"
	ToleransiTerlambat int       `gorm:"default:0" json:"toleransi_terlambat"`         // dihitung dalam menit dari jam masuk
	IsAktif            bool      `gorm:"default:true" json:"is_aktif"`                 // false = hari ini diliburkan
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (JamKerja) TableName() string {
	return "jam_kerjas"
}

// HariLibur menyimpan hari libur di luar akhir pekan.
// Tipe "nasional" berasal dari sinkronisasi API, "manual" ditambah admin.
type HariLibur struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Tanggal   string    `gorm:"type:varchar(10);unique;not null" json:"tanggal"` // format "YYYY-MM-DD"
	Nama      string    `gorm:"type:varchar(150);not null" json:"nama"`
	Tipe      string    `gorm:"type:varchar(10);not null;default:manual" json:"tipe"` // nasional / manual
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (HariLibur) TableName() string {
	return "hari_liburs"
}