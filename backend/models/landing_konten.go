package models

import "time"

// LandingKonten menampung seluruh konten landing page yang berbentuk daftar.
// Jenis yang didukung:
//   persyaratan | dokumen | alur | benefit | misi | tujuan | keunggulan
// Kategori hanya dipakai untuk jenis "persyaratan" dan "dokumen":
//   umum | mahasiswa | siswa
type LandingKonten struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Jenis     string    `gorm:"type:varchar(30);index;not null" json:"jenis"`
	Kategori  string    `gorm:"type:varchar(20);default:'umum'" json:"kategori"`
	Judul     string    `gorm:"type:varchar(200)" json:"judul"`
	Deskripsi string    `gorm:"type:text" json:"deskripsi"`
	Icon      string    `gorm:"type:varchar(20)" json:"icon"`
	Urutan    int       `gorm:"default:0" json:"urutan"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (LandingKonten) TableName() string {
	return "landing_kontens"
}