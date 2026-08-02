package models

import "time"

// FaqPertanyaan menampung pertanyaan yang belum terjawab, baik yang dikirim
// lewat form publik di halaman FAQ maupun pesan chat yang gagal dicocokkan bot.
// Tabel ini menjadi bahan baku admin untuk membuat FAQ baru.
type FaqPertanyaan struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Nama       string `gorm:"type:varchar(120);not null" json:"nama"`
	Email      string `gorm:"type:varchar(150);not null;index" json:"email"`
	Pertanyaan string `gorm:"type:text;not null" json:"pertanyaan"`

	// form_publik = dari halaman FAQ, chat_bot = bot tidak menemukan jawaban
	Sumber string `gorm:"type:enum('form_publik','chat_bot');default:'form_publik';index" json:"sumber"`
	Status string `gorm:"type:enum('baru','diproses','selesai','diabaikan');default:'baru';index" json:"status"`

	// Berapa kali pertanyaan serupa masuk — dipakai untuk memprioritaskan
	JumlahSerupa int `gorm:"default:1" json:"jumlah_serupa"`

	// Skor kecocokan tertinggi saat bot mencoba menjawab (0 = tidak ada kandidat)
	SkorTertinggi float64 `gorm:"type:decimal(4,3);default:0" json:"skor_tertinggi"`

	// Diisi bila admin sudah membuat FAQ dari pertanyaan ini
	FaqTerkaitID *uint `gorm:"index" json:"faq_terkait_id"`
	SessionID    *uint `gorm:"index" json:"session_id"`

	CatatanAdmin  string     `gorm:"type:text" json:"catatan_admin"`
	DiprosesOleh  *uint      `json:"diproses_oleh"`
	DiprosesPada  *time.Time `json:"diproses_pada"`

	IPAddress string    `gorm:"type:varchar(45)" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (FaqPertanyaan) TableName() string {
	return "faq_pertanyaan"
}