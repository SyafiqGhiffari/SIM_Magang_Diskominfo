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

	// TargetPeserta: "semua_bimbingan" | "mahasiswa" | "siswa" | "spesifik"
	TargetPeserta string `gorm:"type:varchar(50);default:'semua_bimbingan';index" json:"target_peserta"`

	// TargetJenjang: "semua" | "mahasiswa" | "siswa"
	TargetJenjang string `gorm:"type:varchar(50);default:'semua';index" json:"target_jenjang"`

	// PesertaID: untuk penugasan individual tunggal (kompatibilitas mundur)
	PesertaID *uint          `gorm:"index" json:"peserta_id"`
	Peserta   *UserManajemen `gorm:"foreignKey:PesertaID" json:"peserta,omitempty"`

	// Relasi many-to-many untuk peserta bimbingan yang terpilih jika TargetPeserta = 'spesifik' (lebih dari 1 orang)
	PesertaAkses []UserManajemen `gorm:"many2many:tugas_peserta_akses;joinForeignKey:tugas_id;joinReferences:peserta_id" json:"peserta_akses,omitempty"`

	FileLampiran    string     `gorm:"type:varchar(255)" json:"file_lampiran"`    // berkas acuan / aset panduan tugas
	TautanEksternal string     `gorm:"type:varchar(255)" json:"tautan_eksternal"` // tautan referensi GitHub, Figma, Drive, docs API
	TenggatWaktu    *time.Time `json:"tenggat_waktu"`
	BobotNilai      int        `gorm:"default:100" json:"bobot_nilai"` // skala 100 (standar ACC)

	// TipeTugas: "berkas" | "kuis"
	TipeTugas string `gorm:"type:varchar(20);default:'berkas';index" json:"tipe_tugas"`
	// KuisData: JSON konfigurasi kuis (durasi_menit, kkm, izinkan_remidi, maks_percobaan, daftar_soal[])
	KuisData string `gorm:"type:longtext" json:"kuis_data"`

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

	// JawabanKuis: JSON jawaban peserta dan rincian skor per soal (pilihan ganda & esai)
	JawabanKuis string `gorm:"type:longtext" json:"jawaban_kuis"`
	// PercobaanKe: nomor urut pengerjaan/attempt (misal jika ada remidi)
	PercobaanKe int `gorm:"default:1" json:"percobaan_ke"`
	// StatusRemidi: "tidak" | "perlu_remidi" | "tuntas"
	StatusRemidi string `gorm:"type:varchar(20);default:'tidak';index" json:"status_remidi"`

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
