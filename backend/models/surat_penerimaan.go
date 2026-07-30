package models

import "time"

// SuratPenerimaan = 1 surat untuk 1 pendaftar yang diterima magang.
// Nomor surat diinput manual oleh admin (kewenangan internal instansi).
//
// Field ber-awalan "Snapshot" sengaja menyalin data saat surat diterbitkan.
// Surat resmi bernomor tidak boleh berubah isinya walau data master
// (nama peserta / Kepala Dinas) diedit setelah surat dikirim ke institusi.
type SuratPenerimaan struct {
	ID uint `gorm:"primaryKey" json:"id"`

	PendaftaranMagangID uint               `gorm:"not null;uniqueIndex" json:"pendaftaran_magang_id"`
	PendaftaranMagang   *PendaftaranMagang `gorm:"foreignKey:PendaftaranMagangID" json:"pendaftaran_magang,omitempty"`

	// ── Identitas surat (input admin) ──
	NomorSurat    string `gorm:"type:varchar(150);not null;uniqueIndex" json:"nomor_surat"`
	TanggalTerbit string `gorm:"type:date;not null" json:"tanggal_terbit"`

	// ── Tujuan surat (input admin) ──
	JabatanTujuan   string `gorm:"type:varchar(255);not null" json:"jabatan_tujuan"`
	UnitTujuan      string `gorm:"type:varchar(200)" json:"unit_tujuan"`
	InstitusiTujuan string `gorm:"type:varchar(300);not null" json:"institusi_tujuan"`
	KotaTujuan      string `gorm:"type:varchar(100);not null" json:"kota_tujuan"`

	// ── Rujukan surat pengantar dari institusi (input admin) ──
	NomorSuratPengantar   string `gorm:"type:varchar(150)" json:"nomor_surat_pengantar"`
	TanggalSuratPengantar string `gorm:"type:date" json:"tanggal_surat_pengantar"`

	// ── Snapshot data peserta ──
	SnapshotNama       string `gorm:"type:varchar(150)" json:"snapshot_nama"`
	SnapshotNomorInduk string `gorm:"type:varchar(50)" json:"snapshot_nomor_induk"`
	SnapshotLabelInduk string `gorm:"type:varchar(20)" json:"snapshot_label_induk"`
	SnapshotKategori   string `gorm:"type:varchar(20)" json:"snapshot_kategori"`
	SnapshotBidang     string `gorm:"type:varchar(100)" json:"snapshot_bidang"`
	SnapshotMulai      string `gorm:"type:date" json:"snapshot_mulai"`
	SnapshotSelesai    string `gorm:"type:date" json:"snapshot_selesai"`

	// ── Snapshot penandatangan ──
	SnapshotJabatanTtd string `gorm:"type:varchar(200)" json:"snapshot_jabatan_ttd"`
	SnapshotNamaTtd    string `gorm:"type:varchar(150)" json:"snapshot_nama_ttd"`
	SnapshotPangkatTtd string `gorm:"type:varchar(100)" json:"snapshot_pangkat_ttd"`
	SnapshotNipTtd     string `gorm:"type:varchar(50)" json:"snapshot_nip_ttd"`

	JudulSurat  string `gorm:"type:varchar(200)" json:"judul_surat"`
	JenisMagang string `gorm:"type:varchar(100)" json:"jenis_magang"`

	// Template yang dipakai saat surat ini diterbitkan
	TemplateSuratID *uint          `json:"template_surat_id"`
	TemplateSurat   *TemplateSurat `gorm:"foreignKey:TemplateSuratID" json:"template_surat,omitempty"`

	FileSurat  string `gorm:"type:varchar(255)" json:"file_surat"`
	DibuatOleh uint   `json:"dibuat_oleh"`

	// ── Jejak pengiriman email ke peserta ──
	// EmailTujuan disimpan sebagai snapshot: alamat yang dipakai saat surat
	// dikirim, walaupun peserta mengganti email di kemudian hari.
	EmailTujuan     string     `gorm:"type:varchar(150)" json:"email_tujuan"`
	EmailTerkirimAt *time.Time `json:"email_terkirim_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (SuratPenerimaan) TableName() string {
	return "surat_penerimaans"
}