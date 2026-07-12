package models

import "time"

type PendaftaranMagang struct {
	ID uint `gorm:"primaryKey" json:"id"`

	UserPendaftaranID uint `gorm:"not null" json:"user_pendaftaran_id"`

	KategoriPendaftar string `gorm:"type:enum('mahasiswa','siswa');not null" json:"kategori_pendaftar"`

	// Data Diri
	NamaLengkap   string `gorm:"type:varchar(150);not null" json:"nama_lengkap"`
	Email         string `gorm:"type:varchar(100);not null" json:"email"`
	NomorHP       string `gorm:"type:varchar(20);not null" json:"nomor_hp"`
	AlamatLengkap string `gorm:"type:text;not null" json:"alamat_lengkap"`
	TempatLahir   string `gorm:"type:varchar(100);not null" json:"tempat_lahir"`
	TanggalLahir  string `gorm:"type:date;not null" json:"tanggal_lahir"`
	JenisKelamin  string `gorm:"type:varchar(20);not null" json:"jenis_kelamin"`

	// Data Pendidikan — Mahasiswa
	NpmNim       string `gorm:"type:varchar(50)" json:"npm_nim"`
	AsalKampus   string `gorm:"type:varchar(150)" json:"asal_kampus"`
	Fakultas     string `gorm:"type:varchar(100)" json:"fakultas"`
	ProgramStudi string `gorm:"type:varchar(100)" json:"program_studi"`
	Semester     string `gorm:"type:varchar(10)" json:"semester"`

	// Data Pendidikan — Siswa
	Nisn           string `gorm:"type:varchar(30)" json:"nisn"`
	AsalSekolah    string `gorm:"type:varchar(150)" json:"asal_sekolah"`
	Kelas          string `gorm:"type:varchar(30)" json:"kelas"`
	JurusanSekolah string `gorm:"type:varchar(100)" json:"jurusan_sekolah"`

	// Data Magang
	PosisiBidang   string `gorm:"type:varchar(100);not null" json:"posisi_bidang"`
	TanggalMulai   string `gorm:"type:date;not null" json:"tanggal_mulai"`
	TanggalSelesai string `gorm:"type:date;not null" json:"tanggal_selesai"`

	// Dokumen Upload
	FileCV             string `gorm:"type:varchar(255)" json:"file_cv"`
	FileSuratPengantar string `gorm:"type:varchar(255);not null" json:"file_surat_pengantar"`
	FileTranskrip      string `gorm:"type:varchar(255)" json:"file_transkrip"`
	FilePortofolio     string `gorm:"type:varchar(255)" json:"file_portofolio"`
	FilePasFoto        string `gorm:"type:varchar(255);not null" json:"file_pas_foto"`
	FileProposalMagang string `gorm:"type:varchar(255)" json:"file_proposal_magang"`

	StatusPendaftaran string `gorm:"type:enum('menunggu','revisi','diterima','ditolak');default:'menunggu'" json:"status_pendaftaran"`
	CatatanAdmin      string `gorm:"type:text" json:"catatan_admin"`

	SuratPenerimaan string `gorm:"type:varchar(255)" json:"surat_penerimaan"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PendaftaranMagang) TableName() string {
	return "pendaftaran_magangs"
}