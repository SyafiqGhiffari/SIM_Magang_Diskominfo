package models

import "time"

// Notifikasi adalah notifikasi in-app (TIDAK dikirim ke email).
// Ditampilkan di ikon bell pada topbar web manajemen.
//
// TargetUserID nil  => broadcast ke semua user dengan TargetRole tersebut.
// TargetUserID isi  => notifikasi personal untuk satu user saja.
type Notifikasi struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Sasaran notifikasi
	TargetRole   string `gorm:"type:enum('admin','mentor','peserta');not null;index" json:"target_role"`
	TargetUserID *uint  `gorm:"index" json:"target_user_id"`

	// Jenis notifikasi — dipakai untuk ikon di frontend & agregasi anti-spam.
	// pendaftaran_baru | revisi_dokumen | chat_baru | akun_belum_dibuat |
	// mentor_belum_ditugaskan | sertifikat_pending | pendaftaran_tertunda | sistem
	Tipe      string `gorm:"type:varchar(50);not null;index" json:"tipe"`
	Prioritas string `gorm:"type:enum('tinggi','normal','rendah');default:'normal';index" json:"prioritas"`

	Judul string `gorm:"type:varchar(150);not null" json:"judul"`
	Pesan string `gorm:"type:text" json:"pesan"`

	// Referensi ke data asal, dipakai untuk deep-link & deteksi duplikat
	RefTabel  string `gorm:"type:varchar(50);index" json:"ref_tabel"`
	RefID     *uint  `gorm:"index" json:"ref_id"`
	UrlTujuan string `gorm:"type:varchar(255)" json:"url_tujuan"`

	// nil = belum dibaca
	DibacaPada *time.Time `gorm:"index" json:"dibaca_pada"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Notifikasi) TableName() string {
	return "notifikasis"
}