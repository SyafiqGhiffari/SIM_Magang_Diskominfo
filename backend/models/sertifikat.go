package models

import "time"

type Sertifikat struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Penerima = akun peserta (UserManajemen role=peserta). 1 peserta = 1 sertifikat.
	AkunPesertaID uint          `gorm:"not null;uniqueIndex" json:"akun_peserta_id"`
	AkunPeserta   UserManajemen `gorm:"foreignKey:AkunPesertaID" json:"akun_peserta,omitempty"`

	// Nomor sertifikat — diinput manual oleh admin
	NomorSertifikat string `gorm:"type:varchar(150);not null" json:"nomor_sertifikat"`

	// Predikat — diisi OTOMATIS nanti dari hasil tugas, logbook, dan absensi
	// (saat role peserta dikerjakan). Untuk sekarang dibiarkan kosong.
	Predikat string `gorm:"type:varchar(50)" json:"predikat"`

	// Tanggal terbit — OTOMATIS diisi tanggal saat sertifikat dibuat
	TanggalTerbit string `gorm:"type:date" json:"tanggal_terbit"`

	// Path file PDF hasil generate (opsional, untuk arsip nanti)
	FileSertifikat string `gorm:"type:varchar(255)" json:"file_sertifikat"`

	// Status penerbitan
	Status string `gorm:"type:enum('draft','terbit');default:'terbit'" json:"status"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Sertifikat) TableName() string {
	return "sertifikats"
}