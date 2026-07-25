package models

import "time"

// PengaturanSertifikat menyimpan TEMPLATE sertifikat yang diunggah admin.
// Admin meng-upload file template (foto/PDF) dengan field kosong; sistem lalu
// menimpa (overlay) nilai-nilai dinamis (nama, nomor, TTL, periode, dll.) secara
// otomatis dari data peserta pada posisi yang tersimpan di KonfigurasiField.
// Selalu hanya ada 1 baris (singleton) — di-seed otomatis saat pertama diakses.
type PengaturanSertifikat struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// File template kosong yang diunggah admin (background sertifikat)
	FileTemplate string `gorm:"type:varchar(255)" json:"file_template"`
	// Tipe template: "image" atau "pdf"
	TipeTemplate string `gorm:"type:varchar(20)" json:"tipe_template"`

	// Untuk baris "Ponorogo, {tanggal terbit}" (tanggalnya otomatis)
	TempatTerbit string `gorm:"type:varchar(100)" json:"tempat_terbit"`

	// Overlay opsional (kalau template belum memuat TTD/stempel)
	FileTtd     string `gorm:"type:varchar(255)" json:"file_ttd"`
	FileStempel string `gorm:"type:varchar(255)" json:"file_stempel"`

	// Posisi/koordinat tiap field dalam bentuk JSON (dikelola dari frontend).
	// Contoh: {"fields":[{"key":"nama","xPct":38,"yPct":34,"fontSize":16}]}
	KonfigurasiField string `gorm:"type:longtext" json:"konfigurasi_field"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PengaturanSertifikat) TableName() string {
	return "pengaturan_sertifikats"
}