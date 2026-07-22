package models

import "time"

type BidangMagang struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nama      string    `gorm:"type:varchar(100);unique;not null" json:"nama"`
	Deskripsi string    `gorm:"type:text" json:"deskripsi"`
	Kuota     int       `gorm:"default:0" json:"kuota"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (BidangMagang) TableName() string {
	return "bidang_magangs"
}