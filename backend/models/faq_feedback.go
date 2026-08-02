package models

import "time"

// FaqFeedback menyimpan penilaian peserta terhadap satu jawaban bot.
//
// Satu peserta hanya boleh menilai satu pesan bot sekali. Bila mereka
// berubah pikiran, baris yang sama diperbarui — bukan ditambah — sehingga
// penghitung di FaqEntry tetap jujur.
type FaqFeedback struct {
	ID    uint `gorm:"primaryKey" json:"id"`
	FaqID uint `gorm:"index;not null" json:"faq_id"`

	// Konteks asal penilaian. Boleh kosong bila kelak dipakai di kanal lain.
	SessionID         *uint `gorm:"index" json:"session_id"`
	MessageID         *uint `gorm:"index" json:"message_id"`
	UserPendaftaranID *uint `gorm:"index" json:"user_pendaftaran_id"`

	// true = membantu, false = tidak membantu
	Membantu bool `gorm:"not null" json:"membantu"`

	// Alasan opsional saat peserta menekan jempol turun
	Catatan string `gorm:"type:varchar(300);default:''" json:"catatan"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (FaqFeedback) TableName() string {
	return "faq_feedback"
}
