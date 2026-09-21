package models

import "time"

// MateriPembelajaran menyimpan modul, materi edukasi, panduan teknis,
// dan referensi belajar yang disediakan oleh dinas/mentor bagi peserta magang.
type MateriPembelajaran struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Judul     string `gorm:"type:varchar(200);not null" json:"judul"`
	Deskripsi string `gorm:"type:text" json:"deskripsi"`
	Kategori  string `gorm:"type:varchar(100);not null;index" json:"kategori"` // misal: "Onboarding & SOP", "Pengembangan Web", "Keamanan Informasi", "Desain Grafis", "Jaringan"

	// PosisiBidang: "semua" atau nama bidang spesifik (misal: "Pengembangan Perangkat Lunak")
	PosisiBidang string `gorm:"type:varchar(100);default:'semua';index" json:"posisi_bidang"`

	// File lampiran dokumen/modul PDF/PPT/ZIP
	FileMateri string `gorm:"type:varchar(255)" json:"file_materi"`

	// Tautan eksternal tambahan (misal: YouTube, Google Drive, Notion, Repository GitHub)
	TautanEksternal string `gorm:"type:varchar(255)" json:"tautan_eksternal"`

	TipeMedia string `gorm:"type:varchar(50);default:'dokumen'" json:"tipe_media"` // "dokumen" | "video" | "tautan" | "slide"

	DibuatOlehID *uint          `json:"dibuat_oleh_id"`
	DibuatOleh   *UserManajemen `gorm:"foreignKey:DibuatOlehID" json:"dibuat_oleh,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MateriPembelajaran) TableName() string {
	return "materi_pembelajarans"
}
