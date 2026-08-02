package models

import "time"

// LandingHeroSlide = gambar latar carousel pada Hero landing page.
// Gambar boleh berupa file yang diunggah (FileGambar) ATAU tautan luar (UrlGambar).
type LandingHeroSlide struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Judul      string    `gorm:"type:varchar(150)" json:"judul"`
	FileGambar string    `gorm:"type:varchar(255)" json:"file_gambar"`
	UrlGambar  string    `gorm:"type:varchar(600)" json:"url_gambar"`
	Urutan     int       `gorm:"default:0" json:"urutan"`
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (LandingHeroSlide) TableName() string {
	return "landing_hero_slides"
}