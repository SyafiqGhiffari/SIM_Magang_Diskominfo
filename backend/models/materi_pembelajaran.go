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

	// TargetPeserta: "semua_bimbingan" atau "spesifik"
	TargetPeserta string `gorm:"type:varchar(50);default:'semua_bimbingan';index" json:"target_peserta"`

	// TargetJenjang: "semua" | "mahasiswa" | "siswa"
	TargetJenjang string `gorm:"type:varchar(50);default:'semua';index" json:"target_jenjang"`

	// File lampiran dokumen/modul PDF/PPT/ZIP
	FileMateri string `gorm:"type:varchar(255)" json:"file_materi"`

	// Tautan eksternal tambahan (misal: YouTube, Google Drive, Notion, Repository GitHub)
	TautanEksternal string `gorm:"type:varchar(255)" json:"tautan_eksternal"`

	TipeMedia string `gorm:"type:varchar(50);default:'dokumen'" json:"tipe_media"` // "dokumen" | "video" | "tautan" | "slide"

	MentorID *uint          `gorm:"index" json:"mentor_id"`
	Mentor   *UserManajemen `gorm:"foreignKey:MentorID" json:"mentor,omitempty"`

	DibuatOlehID *uint          `json:"dibuat_oleh_id"`
	DibuatOleh   *UserManajemen `gorm:"foreignKey:DibuatOlehID" json:"dibuat_oleh,omitempty"`

	// Relasi many-to-many untuk peserta bimbingan yang terpilih jika TargetPeserta = 'spesifik'
	PesertaAkses []UserManajemen `gorm:"many2many:materi_peserta_akses;joinForeignKey:materi_id;joinReferences:peserta_id" json:"peserta_akses,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MateriPembelajaran) TableName() string {
	return "materi_pembelajarans"
}

// KategoriMateri menyimpan master kategori/topik modul pembelajaran
type KategoriMateri struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Nama      string         `gorm:"type:varchar(100);not null;index" json:"nama"`
	Deskripsi string         `gorm:"type:text" json:"deskripsi"`
	MentorID  *uint          `gorm:"index" json:"mentor_id"`
	Mentor    *UserManajemen `gorm:"foreignKey:MentorID" json:"mentor,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func (KategoriMateri) TableName() string {
	return "kategori_materis"
}
