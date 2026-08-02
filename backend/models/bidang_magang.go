package models

import "time"

type BidangMagang struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nama      string    `gorm:"type:varchar(100);unique;not null" json:"nama"`
	Deskripsi string    `gorm:"type:text" json:"deskripsi"`
	Kuota     int       `gorm:"default:0" json:"kuota"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`

	// ===== Khusus tampilan landing page =====
	Icon               string `gorm:"type:varchar(20)" json:"icon"`
	Badge              string `gorm:"type:varchar(80)" json:"badge"`
	DeskripsiPanjang   string `gorm:"type:text" json:"deskripsi_panjang"`
	Kompetensi         string `gorm:"type:text" json:"kompetensi"` // satu kompetensi per baris
	Durasi             string `gorm:"type:varchar(120)" json:"durasi"`
	Urutan             int    `gorm:"default:0" json:"urutan"`
	TampilkanDiLanding bool   `gorm:"default:true" json:"tampilkan_di_landing"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (BidangMagang) TableName() string {
	return "bidang_magangs"
}