package models

import "time"

// PengaturanSuratPenerimaan menyimpan bagian surat yang TETAP: kop instansi,
// redaksi paragraf, dan data penandatangan. Singleton — selalu 1 baris,
// di-seed otomatis saat pertama diakses (pola sama seperti PengaturanSertifikat).
//
// Nomor surat TIDAK diatur di sini karena penomoran adalah kewenangan internal
// instansi dan diinput manual oleh admin tiap kali menerbitkan surat.
type PengaturanSuratPenerimaan struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// ── Kop Surat ──
	NamaPemerintah string `gorm:"type:varchar(150)" json:"nama_pemerintah"`
	NamaInstansi   string `gorm:"type:varchar(200)" json:"nama_instansi"`
	// Versi non-kapital untuk dipakai di dalam kalimat isi surat.
	// Kalau dibiarkan kosong, sistem mengubah NamaInstansi otomatis
	// menjadi kapital-judul ("Dinas Komunikasi Informatika dan Statistik").
	NamaInstansiTeks string `gorm:"type:varchar(200)" json:"nama_instansi_teks"`
	AlamatInstansi string `gorm:"type:varchar(255)" json:"alamat_instansi"`
	Telepon        string `gorm:"type:varchar(50)" json:"telepon"`
	Faksimile      string `gorm:"type:varchar(50)" json:"faksimile"`
	Laman          string `gorm:"type:varchar(100)" json:"laman"`
	PosEl          string `gorm:"type:varchar(100)" json:"pos_el"`
	FileLogo       string `gorm:"type:varchar(255)" json:"file_logo"`

	// ── Judul Surat per kategori pendaftar ──
	JudulMahasiswa string `gorm:"type:varchar(150)" json:"judul_mahasiswa"`
	JudulSiswa     string `gorm:"type:varchar(150)" json:"judul_siswa"`
	JenisMagangMhs string `gorm:"type:varchar(100)" json:"jenis_magang_mhs"`
	JenisMagangSis string `gorm:"type:varchar(100)" json:"jenis_magang_sis"`

	// ── Redaksi paragraf (mendukung placeholder) ──
	// Placeholder yang tersedia:
	// {jabatan_tujuan} {unit_tujuan} {institusi_tujuan} {kota_tujuan}
	// {nomor_surat_pengantar} {tanggal_surat_pengantar} {jenis_magang}
	// {nama_instansi} {nama_peserta} {nomor_induk} {label_induk}
	// {sebutan_peserta} {tanggal_mulai} {tanggal_selesai} {posisi_bidang}
	ParagrafPembuka string `gorm:"type:text" json:"paragraf_pembuka"`
	ParagrafPenutup string `gorm:"type:text" json:"paragraf_penutup"`
	ParagrafSalam   string `gorm:"type:text" json:"paragraf_salam"`

	// ── Penandatangan ──
	TempatTerbit         string `gorm:"type:varchar(100)" json:"tempat_terbit"`
	JabatanPenandatangan string `gorm:"type:varchar(200)" json:"jabatan_penandatangan"`
	NamaPenandatangan    string `gorm:"type:varchar(150)" json:"nama_penandatangan"`
	PangkatPenandatangan string `gorm:"type:varchar(100)" json:"pangkat_penandatangan"`
	NipPenandatangan     string `gorm:"type:varchar(50)" json:"nip_penandatangan"`
	FileTtd              string `gorm:"type:varchar(255)" json:"file_ttd"`
	FileStempel          string `gorm:"type:varchar(255)" json:"file_stempel"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PengaturanSuratPenerimaan) TableName() string {
	return "pengaturan_surat_penerimaans"
}