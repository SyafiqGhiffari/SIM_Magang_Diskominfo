package models

import "time"

// LandingMenu mengatur TAMPILAN menu navigasi landing page.
// PENTING: kolom "Kode" terikat pada whitelist route di controller.
// Admin hanya boleh mengubah label, urutan, dan tampil/sembunyi —
// tujuan (path) menu TIDAK bisa diubah agar tidak pernah terjadi 404.
type LandingMenu struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Kode route, contoh: beranda | tentang | program-magang | persyaratan | faq | kontak
	Kode string `gorm:"type:varchar(40);uniqueIndex;not null" json:"kode"`

	Label       string `gorm:"type:varchar(80)" json:"label"`        // teks di Navbar
	LabelFooter string `gorm:"type:varchar(80)" json:"label_footer"` // teks di Footer (boleh beda)

	Urutan       int  `gorm:"default:0" json:"urutan"`
	TampilNavbar bool `gorm:"default:true" json:"tampil_navbar"`
	TampilFooter bool `gorm:"default:true" json:"tampil_footer"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (LandingMenu) TableName() string {
	return "landing_menus"
}