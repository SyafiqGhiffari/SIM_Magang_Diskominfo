package models

import "time"

// TugasMagang menyimpan instruksi penugasan kerja/proyek dari mentor ke peserta magang.
type TugasMagang struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Judul        string     `gorm:"type:varchar(200);not null" json:"judul"`
	Deskripsi    string     `gorm:"type:text;not null" json:"deskripsi"`
	PosisiBidang string     `gorm:"type:varchar(100);default:'semua';index" json:"posisi_bidang"`
	MentorID     *uint      `gorm:"index" json:"mentor_id"`
	Mentor       *UserManajemen `gorm:"foreignKey:MentorID" json:"mentor,omitempty"`

	// PesertaID: nil jika tugas ditujukan untuk seluruh peserta di bidang tsb,
	// atau ID peserta spesifik jika penugasan individual.
	PesertaID *uint          `gorm:"index" json:"peserta_id"`
	Peserta   *UserManajemen `gorm:"foreignKey:PesertaID" json:"peserta,omitempty"`

	FileLampiran string     `gorm:"type:varchar(255)" json:"file_lampiran"` // format acuan / aset tugas
	TenggatWaktu *time.Time `json:"tenggat_waktu"`
	BobotNilai   int        `gorm:"default:100" json:"bobot_nilai"` // skala 100

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TugasMagang) TableName() string {
	return "tugas_magangs"
}

// PengumpulanTugas mencatat berkas, tautan repositori, status, dan nilai pengumpulan tugas oleh peserta.
type PengumpulanTugas struct {
	ID uint `gorm:"primaryKey" json:"id"`

	TugasID uint        `gorm:"not null;index" json:"tugas_id"`
	Tugas   TugasMagang `gorm:"foreignKey:TugasID;constraint:OnDelete:CASCADE" json:"tugas,omitempty"`

	PesertaID uint          `gorm:"not null;index" json:"peserta_id"`
	Peserta   UserManajemen `gorm:"foreignKey:PesertaID;constraint:OnDelete:CASCADE" json:"peserta,omitempty"`

	FilePengumpulan string `gorm:"type:varchar(255)" json:"file_pengumpulan"` // file ZIP/PDF/dokumen
	LinkTugas       string `gorm:"type:varchar(255)" json:"link_tugas"`       // URL GitHub/Figma/Drive/Demo
	CatatanPeserta  string `gorm:"type:text" json:"catatan_peserta"`

	WaktuKumpul time.Time `json:"waktu_kumpul"`

	// Status: "menunggu" (baru dikumpulkan), "revisi" (diminta perbaikan), "dinilai" (sudah dievaluasi)
	Status string `gorm:"type:varchar(20);default:'menunggu';index" json:"status"`

	Nilai         *float64   `gorm:"type:decimal(5,2)" json:"nilai"` // skor 0.00 - 100.00
	CatatanMentor string     `gorm:"type:text" json:"catatan_mentor"`
	DinilaiPada   *time.Time `json:"dinilai_pada"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PengumpulanTugas) TableName() string {
	return "pengumpulan_tugas"
}
