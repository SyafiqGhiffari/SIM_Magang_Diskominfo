package models

import "time"

// TemplateSurat menyimpan BANYAK template surat penerimaan magang.
// Admin mengatur kop, redaksi, gambar, dan tata letak (angka) dari web,
// lalu memilih salah satu template saat menerbitkan surat.
type TemplateSurat struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// ── Informasi Dasar ──
	Nama         string `gorm:"type:varchar(150);not null" json:"nama"`
	Keterangan   string `gorm:"type:varchar(255)" json:"keterangan"`
	JenisPeserta string `gorm:"type:enum('semua','mahasiswa','siswa');default:'semua'" json:"jenis_peserta"`
	Status       string `gorm:"type:enum('draft','publish');default:'publish'" json:"status"`
	IsDefault    bool   `gorm:"default:false" json:"is_default"`

	// ── Kop Surat ──
	NamaPemerintah   string `gorm:"type:varchar(150)" json:"nama_pemerintah"`
	NamaInstansi     string `gorm:"type:varchar(200)" json:"nama_instansi"`
	NamaInstansiTeks string `gorm:"type:varchar(200)" json:"nama_instansi_teks"`
	AlamatInstansi   string `gorm:"type:varchar(255)" json:"alamat_instansi"`
	Telepon          string `gorm:"type:varchar(100)" json:"telepon"`
	Faksimile        string `gorm:"type:varchar(100)" json:"faksimile"`
	Laman            string `gorm:"type:varchar(150)" json:"laman"`
	PosEl            string `gorm:"type:varchar(150)" json:"pos_el"`

	// ── Gambar ──
	FileLogo    string `gorm:"type:varchar(255)" json:"file_logo"`
	FileTtd     string `gorm:"type:varchar(255)" json:"file_ttd"`
	FileStempel string `gorm:"type:varchar(255)" json:"file_stempel"`

	// ── Redaksi ──
	JudulMahasiswa  string `gorm:"type:varchar(200)" json:"judul_mahasiswa"`
	JudulSiswa      string `gorm:"type:varchar(200)" json:"judul_siswa"`
	JenisMagangMhs  string `gorm:"type:varchar(100)" json:"jenis_magang_mhs"`
	JenisMagangSis  string `gorm:"type:varchar(100)" json:"jenis_magang_sis"`
	ParagrafPembuka string `gorm:"type:text" json:"paragraf_pembuka"`
	ParagrafPenutup string `gorm:"type:text" json:"paragraf_penutup"`
	ParagrafSalam   string `gorm:"type:text" json:"paragraf_salam"`
	TempatTerbit    string `gorm:"type:varchar(100)" json:"tempat_terbit"`

	// ── Penandatangan ──
	JabatanPenandatangan string `gorm:"type:varchar(200)" json:"jabatan_penandatangan"`
	NamaPenandatangan    string `gorm:"type:varchar(150)" json:"nama_penandatangan"`
	PangkatPenandatangan string `gorm:"type:varchar(100)" json:"pangkat_penandatangan"`
	NipPenandatangan     string `gorm:"type:varchar(50)" json:"nip_penandatangan"`

	// ── Tata Letak (JSON angka, dikelola dari frontend) ──
	// Contoh: {"margin_kiri":25,"ukuran_font_isi":11,"ttd_x":103,...}
	KonfigurasiTataLetak string `gorm:"type:longtext" json:"konfigurasi_tata_letak"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TemplateSurat) TableName() string {
	return "template_surats"
}