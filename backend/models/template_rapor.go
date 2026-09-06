package models

import "time"

// TemplateRapor menyimpan konfigurasi template rapor / transkrip nilai magang resmi.
// Admin dapat mengatur identitas kop, format nomor, pejabat penandatangan, stempel,
// tanda tangan digital, dan opsi tampilan tabel nilai.
type TemplateRapor struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// ── Informasi Dasar ──
	Nama         string `gorm:"type:varchar(150);not null" json:"nama"`
	Keterangan   string `gorm:"type:varchar(255)" json:"keterangan"`
	JenisPeserta string `gorm:"type:enum('semua','mahasiswa','siswa');default:'semua'" json:"jenis_peserta"`
	Status       string `gorm:"type:enum('draft','publish');default:'publish'" json:"status"`
	IsDefault    bool   `gorm:"default:false" json:"is_default"`

	// ── Kop Surat ──
	NamaPemerintah string `gorm:"type:varchar(150);default:'PEMERINTAH KABUPATEN PONOROGO'" json:"nama_pemerintah"`
	NamaInstansi   string `gorm:"type:varchar(200);default:'DINAS KOMUNIKASI, INFORMATIKA DAN STATISTIK'" json:"nama_instansi"`
	AlamatInstansi string `gorm:"type:varchar(255);default:'Jl. Ir. H. Juanda No. 195 Ponorogo, Jawa Timur 63419'" json:"alamat_instansi"`
	Telepon        string `gorm:"type:varchar(100);default:'(0352) 481105'" json:"telepon"`
	Laman          string `gorm:"type:varchar(150);default:'kominfo.ponorogo.go.id'" json:"laman"`
	PosEl          string `gorm:"type:varchar(150);default:'kominfo@ponorogo.go.id'" json:"pos_el"`

	// ── File Aset Gambar ──
	FileLogo    string `gorm:"type:varchar(255)" json:"file_logo"`
	FileTtd     string `gorm:"type:varchar(255)" json:"file_ttd"`
	FileStempel string `gorm:"type:varchar(255)" json:"file_stempel"`

	// ── Format & Redaksi ──
	JudulDokumen string `gorm:"type:varchar(200);default:'TRANSKRIP NILAI HASIL MAGANG'" json:"judul_dokumen"`
	FormatNomor  string `gorm:"type:varchar(150);default:'560/TRN-{nomor}/405.08/{tahun}'" json:"format_nomor"`
	TempatTerbit string `gorm:"type:varchar(100);default:'Ponorogo'" json:"tempat_terbit"`
	CatatanKaki  string `gorm:"type:text" json:"catatan_kaki"`

	// ── Pejabat Penandatangan / Pengesahan ──
	// TipePenandatangan: 'kepala_dinas' (hanya kadis), 'mentor' (hanya mentor), 'keduanya' (kadis + mentor)
	TipePenandatangan    string `gorm:"type:enum('kepala_dinas','mentor','keduanya');default:'kepala_dinas'" json:"tipe_penandatangan"`
	JabatanPenandatangan string `gorm:"type:varchar(200);default:'Kepala Dinas Komunikasi, Informatika dan Statistik'" json:"jabatan_penandatangan"`
	NamaPenandatangan    string `gorm:"type:varchar(150);default:'Drs. BAMBANG SUHENDRO, M.Si'" json:"nama_penandatangan"`
	PangkatPenandatangan string `gorm:"type:varchar(100);default:'Pembina Utama Muda'" json:"pangkat_penandatangan"`
	NipPenandatangan     string `gorm:"type:varchar(50);default:'19750812 200003 1 004'" json:"nip_penandatangan"`

	// ── Opsi Tata Letak & Visibilitas (JSON string) ──
	// Contoh: {"tampilkan_bobot":true, "tampilkan_qr":true, "tampilkan_catatan_mentor":true, "tampilkan_garis_kop":true}
	KonfigurasiTataLetak string `gorm:"type:longtext" json:"konfigurasi_tata_letak"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TemplateRapor) TableName() string {
	return "template_rapors"
}
