package models

import "time"

// TemplateSertifikat menyimpan BANYAK desain template sertifikat.
// Admin meng-upload background (foto/PDF) lalu menaruh field dinamis (overlay)
// pada posisi tertentu. Saat menerbitkan sertifikat peserta, admin nanti
// memilih salah satu template ini (pemilihan template per peserta dibuat di tahap berikutnya).
type TemplateSertifikat struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// ── Informasi Dasar ──
	Nama         string `gorm:"type:varchar(150);not null" json:"nama"`
	Kategori     string `gorm:"type:varchar(50)" json:"kategori"` // "PKL" | "Magang"
	JenisPeserta string `gorm:"type:enum('mahasiswa','siswa');default:'mahasiswa'" json:"jenis_peserta"`
	Bahasa       string `gorm:"type:varchar(30)" json:"bahasa"` // selalu "Indonesia"

	// ── Desain Sertifikat ──
	FileTemplate string `gorm:"type:varchar(255)" json:"file_template"` // background
	TipeTemplate string `gorm:"type:varchar(20)" json:"tipe_template"`  // "image" | "pdf"
	Orientasi    string `gorm:"type:enum('landscape','portrait');default:'landscape'" json:"orientasi"`

	// ── Konfigurasi Tanda Tangan ──
	NamaPenandatangan    string `gorm:"type:varchar(150)" json:"nama_penandatangan"`
	JabatanPenandatangan string `gorm:"type:varchar(150)" json:"jabatan_penandatangan"`
	FileTtd              string `gorm:"type:varchar(255)" json:"file_ttd"`
	FileStempel          string `gorm:"type:varchar(255)" json:"file_stempel"`
	FileLogo             string `gorm:"type:varchar(255)" json:"file_logo"` // logo/ikon instansi (opsional)

	// Untuk baris "Ponorogo, {tanggal terbit}"
	TempatTerbit string `gorm:"type:varchar(100)" json:"tempat_terbit"`

	// Daftar penandatangan (JSON array: [{id,nama,jabatan,file_ttd}]) — mendukung lebih dari 1.
	Penandatangan string `gorm:"type:longtext" json:"penandatangan"`

	// Posisi/koordinat field dinamis (JSON) — sama format seperti pengaturan lama.
	KonfigurasiField string `gorm:"type:longtext" json:"konfigurasi_field"`

	// Status publikasi
	Status string `gorm:"type:enum('draft','publish');default:'publish'" json:"status"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TemplateSertifikat) TableName() string {
	return "template_sertifikats"
}