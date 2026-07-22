package models

import "time"

type UserManajemen struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Nama     string `gorm:"type:varchar(100);not null" json:"nama"`
	Email    string `gorm:"type:varchar(100);unique;not null" json:"email"`
	Password string `gorm:"type:varchar(255);not null" json:"-"`

	NoHp               string        `gorm:"type:varchar(20)" json:"no_hp"`
	Jabatan            string        `gorm:"type:varchar(100)" json:"jabatan"`
	KapasitasBimbingan int           `gorm:"default:0" json:"kapasitas_bimbingan"`
	FotoProfil         string        `gorm:"type:varchar(255)" json:"foto_profil"`

	// Khusus role=mentor: bidang tempat mentor ini ditugaskan. Satu bidang bisa
	// memiliki banyak mentor (relasi one-to-many dari Bidang ke Mentor).
	BidangID *uint         `json:"bidang_id"`
	Bidang   *BidangMagang `gorm:"foreignKey:BidangID" json:"bidang,omitempty"`

	Role string `gorm:"type:enum('admin','mentor','peserta');not null" json:"role"`

	StatusAkun string `gorm:"type:enum('aktif','nonaktif');default:'aktif'" json:"status_akun"`

	// IsOnline: true jika admin sedang aktif login di web manajemen
	IsOnline bool `gorm:"default:false" json:"is_online"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (UserManajemen) TableName() string {
	return "user_manajemens"
}