package models

import "time"

// PengajuanIzin adalah pengajuan izin/sakit dari peserta.
// Persetujuan adalah WEWENANG MENTOR (bukan admin). Admin hanya membaca
// hasilnya lewat data presensi & rekap.
//
// Saat mentor menyetujui, sistem meng-upsert baris Presensi berstatus
// "izin"/"sakit" untuk setiap hari kerja dalam rentang tanggalnya.
type PengajuanIzin struct {
	ID uint `gorm:"primaryKey" json:"id"`

	PesertaID uint          `gorm:"not null;index" json:"peserta_id"`
	Peserta   UserManajemen `gorm:"foreignKey:PesertaID" json:"peserta,omitempty"`

	Jenis          string `gorm:"type:enum('izin','sakit');not null" json:"jenis"`
	TanggalMulai   string `gorm:"type:date;not null;index" json:"tanggal_mulai"`
	TanggalSelesai string `gorm:"type:date;not null" json:"tanggal_selesai"`

	Alasan    string `gorm:"type:text;not null" json:"alasan"`
	FileBukti string `gorm:"type:varchar(255)" json:"file_bukti"`

	Status        string `gorm:"type:enum('menunggu','disetujui','ditolak');default:'menunggu';index" json:"status"`
	CatatanMentor string `gorm:"type:text" json:"catatan_mentor"`

	// Mentor yang memproses pengajuan
	DiprosesOlehID *uint          `json:"diproses_oleh_id"`
	DiprosesOleh   *UserManajemen `gorm:"foreignKey:DiprosesOlehID" json:"diproses_oleh,omitempty"`
	DiprosesPada   *time.Time     `json:"diproses_pada"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PengajuanIzin) TableName() string {
	return "pengajuan_izins"
}